import { UserRole } from '../types.js';

/**
 * This service handles all interactions with the Google Sheets API.
 * It manages authentication, spreadsheet creation, and data manipulation.
 */

// --- CONFIGURATION ---
const CLIENT_ID = window.APP_CONFIG?.GOOGLE_CLIENT_ID;
const MAX_LOGO_SIZE_BYTES = 35 * 1024; // 35KB, as larger files can exceed Sheet cell character limit
// THIS IS THE PERMANENT SPREADSHEET ID FOR THE APPLICATION
const PERMANENT_SPREADSHEET_ID = '1_IeNu-orxkYxLMHC42GnKdCEGw4i_GfH9TyX2lB7EuU';
// --------------------

const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];

const SCOPES = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

const SPREADSHEET_ID_KEY = 'doctrac_spreadsheet_id';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let spreadsheetIdPromise = null;

// --- Helper Functions ---

// CRITICAL FIX: Standardized sheet names to TitleCase to match usage in getSheetData calls.
const SPREADSHEET_HEADERS = {
    Documents: [ 'id', 'dateIssued', 'supplierName', 'documentType', 'documentNumber', 'relatedQuote', 'relatedPO', 'relatedInvoice', 'status', 'notes', 'flowDirection'],
    Users: ['id', 'name', 'email', 'role', 'googleId', 'imageUrl'],
    Logs: ['id', 'timestamp', 'user', 'action', 'details'],
    Settings: ['key', 'value'],
    Entities: ['id', 'name', 'type'],
};

const objectToRow = (obj, headers) => headers.map(header => obj[header] ?? '');
const rowToObject = (row, headers) => {
    const obj = {};
    headers.forEach((header, index) => {
        obj[header] = row[index];
    });
    return obj;
};
const rowsToObjects = (rows, headers) => {
    if (!rows || rows.length === 0) return [];
    return rows.map(row => rowToObject(row, headers));
};

// --- Initialization and Auth ---

export const init = (updateAuthStatus) => {
    return new Promise(async (resolve, reject) => {
        if (!CLIENT_ID || CLIENT_ID.includes('PASTE_YOUR_GOOGLE_CLIENT_ID_HERE')) {
            return reject(new Error("Configuration Error: The GOOGLE_CLIENT_ID is missing or is a placeholder. Please edit 'index.html' and replace the placeholder value with your actual Google Client ID."));
        }
        try {
            await window.gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS,
            });
            gapiInited = true;
            
            const checkGisReady = () => {
                if (window.google?.accounts?.oauth2) {
                    tokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: (tokenResponse) => {
                            if (tokenResponse.error) {
                                console.error('Google token error:', tokenResponse);
                                const errorDetails = tokenResponse.error_description || tokenResponse.error;
                                const userFriendlyError = `Login failed: ${errorDetails}. This is often due to a misconfiguration in your Google Cloud Console. Please ensure the "Authorized JavaScript origins" for your OAuth Client ID exactly match the URL of this application (including the port).`;
                                spreadsheetIdPromise = null;
                                updateAuthStatus(false, userFriendlyError);
                                return;
                            }
                            window.gapi.client.setToken(tokenResponse);
                            updateAuthStatus(true);
                        },
                    });
                    gisInited = true;
                    resolve();
                } else {
                    setTimeout(checkGisReady, 100);
                }
            };
            checkGisReady();

        } catch (error) {
            console.error("Error initializing GAPI client", error);
            let detailMessage = "An unknown error occurred.";
            if (error?.result?.error) {
                const gapiError = error.result.error;
                detailMessage = `Code: ${gapiError.code}, Message: ${gapiError.message}. Details: ${gapiError.errors?.map((e) => e.message).join(', ')}`;
            } else if (error instanceof Error) {
                detailMessage = error.message;
            }
            reject(new Error(`Could not initialize Google API client. Please check your Client ID configuration and ensure both the Google Sheets and Google Drive APIs are enabled in your console. Details: ${detailMessage}`));
        }
    });
};

export const signIn = () => {
    if (!gapiInited || !gisInited) {
        alert("Google services are not ready yet.");
        return;
    }
    tokenClient.requestAccessToken({});
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken(null);
        });
    }
    localStorage.removeItem(SPREADSHEET_ID_KEY);
    spreadsheetIdPromise = null;
};


// --- Spreadsheet Management ---
const ensureSheetExists = async (spreadsheetId, title, headers) => {
    // This helper creates a sheet with its headers if it's missing.
    console.warn(`Sheet '${title}' is missing. Re-creating it now...`);
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: [{ addSheet: { properties: { title } } }] }
    });
    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [headers] }
    });
};

const _findOrCreateSpreadsheet = async () => {
    // The user has specified a permanent spreadsheet. This will be the single source of truth.
    const spreadsheetId = PERMANENT_SPREADSHEET_ID;
    console.log(`Attempting to use permanent spreadsheet ID: ${spreadsheetId}`);

    try {
        // Verify we can access the spreadsheet.
        const response = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'properties.title,sheets.properties.sheetId,sheets.properties.title'
        });
        const spreadsheet = response.result;
        console.log(`Successfully accessed spreadsheet: '${spreadsheet.properties.title}'`);

        // Now, ensure all necessary sheets exist within this spreadsheet.
        const existingSheetTitles = spreadsheet.sheets.map((sheet) => sheet.properties.title);
        for (const [title, headers] of Object.entries(SPREADSHEET_HEADERS)) {
            if (!existingSheetTitles.includes(title)) {
                await ensureSheetExists(spreadsheetId, title, headers);
            }
        }
        
        // Persist to local storage for consistency, but the hardcoded ID is king.
        localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);
        return spreadsheetId;

    } catch (error) {
        console.error(`FATAL ERROR: Could not access the required spreadsheet with ID '${spreadsheetId}'.`, error);
        // This is a critical error, likely due to permissions. The app cannot function without the sheet.
        const detailedError = `Could not access the required Google Sheet. Please ensure you are logged in with a Google account that has 'Editor' access to the spreadsheet with ID: ${spreadsheetId}. This is a permanent requirement for the app to function.`;
        // We throw the error up to the UI to be displayed.
        throw new Error(detailedError);
    }
};

export const findOrCreateSpreadsheet = () => {
    if (!spreadsheetIdPromise) {
        spreadsheetIdPromise = _findOrCreateSpreadsheet();
    }
    return spreadsheetIdPromise;
};

const getSheetData = async (sheetName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A2:Z`,
        });
        return response.result.values || [];
    } catch (e) {
        if (e.result?.error?.message.includes('Unable to parse range')) {
            console.warn(`Sheet '${sheetName}' might be empty or missing. Returning empty array.`);
            return [];
        }
        throw e;
    }
};

const deleteRowByUniqueId = async (sheetName, uniqueId) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    // This is inefficient but necessary for sheets without built-in row IDs
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:A`, // Only get the ID column to find the row index
    });
    const rows = response.result.values || [];
    const rowIndex = rows.findIndex(row => parseInt(row[0], 10) === uniqueId);
    if (rowIndex === -1) throw new Error(`${sheetName} item with ID ${uniqueId} not found`);

    const sheetRowIndex = rowIndex + 2; // +2 because sheet is 1-indexed and we skipped the header

    const sheetInfo = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = sheetInfo.result.sheets?.find((s) => s.properties?.title === sheetName)?.properties?.sheetId;
    if (sheetId === undefined) throw new Error(`${sheetName} sheet not found.`);

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'ROWS',
                        startIndex: sheetRowIndex - 1,
                        endIndex: sheetRowIndex,
                    }
                }
            }]
        }
    });
    return true;
};


// ===== Document Functions =====

export const getDocuments = async () => {
    const rows = await getSheetData('Documents');
    const documents = rowsToObjects(rows, SPREADSHEET_HEADERS.Documents).map((d) => ({
        ...d,
        id: parseInt(d.id, 10)
    }));
    return documents.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
};

export const addDocument = async (docData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const allDocs = await getDocuments();
    const newId = (allDocs.length > 0 ? Math.max(...allDocs.map(d => d.id)) : 0) + 1;
    const newDocument = { ...docData, id: newId };
    
    const row = objectToRow(newDocument, SPREADSHEET_HEADERS.Documents);
    
    await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Documents!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
    });

    await addLog(`Created Document`, `${docData.documentType} #${docData.documentNumber} for ${docData.supplierName}`, userName);
    return newDocument;
};

export const updateDocument = async (id, docData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const rows = await getSheetData('Documents');
    const rowIndex = rows.findIndex(row => parseInt(row[0], 10) === id);
    if (rowIndex === -1) throw new Error("Document not found");

    const sheetRowIndex = rowIndex + 2;
    const currentDoc = rowToObject(rows[rowIndex], SPREADSHEET_HEADERS.Documents);
    const updatedDoc = { ...currentDoc, ...docData, id };
    const updatedRow = objectToRow(updatedDoc, SPREADSHEET_HEADERS.Documents);

    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Documents!A${sheetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [updatedRow] },
    });
    
    await addLog(`Updated Document`, `${updatedDoc.documentType} #${updatedDoc.documentNumber}`, userName);
    return updatedDoc;
};

export const deleteDocument = async (id, userName, details) => {
    await deleteRowByUniqueId('Documents', id);
    await addLog(`Deleted Document`, details, userName);
    return { success: true };
};

// ===== Entity (Supplier/Client) Functions =====

export const getEntities = async () => {
    const rows = await getSheetData('Entities');
    return rowsToObjects(rows, SPREADSHEET_HEADERS.Entities).map((e) => ({
        ...e,
        id: parseInt(e.id, 10),
    })).sort((a, b) => a.name.localeCompare(b.name));
};

export const addEntity = async (entityData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const allEntities = await getEntities();
    const newId = (allEntities.length > 0 ? Math.max(...allEntities.map(e => e.id)) : 0) + 1;
    const newEntity = { ...entityData, id: newId };
    const row = objectToRow(newEntity, SPREADSHEET_HEADERS.Entities);

    await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Entities!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
    });

    await addLog(`Created Entity`, `New ${entityData.type} added: ${entityData.name}`, userName);
    return newEntity;
};

export const updateEntity = async (id, entityData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const rows = await getSheetData('Entities');
    const rowIndex = rows.findIndex(row => parseInt(row[0], 10) === id);
    if (rowIndex === -1) throw new Error("Entity not found");

    const sheetRowIndex = rowIndex + 2;
    const currentEntity = rowToObject(rows[rowIndex], SPREADSHEET_HEADERS.Entities);
    const updatedEntity = { ...currentEntity, ...entityData, id };
    const updatedRow = objectToRow(updatedEntity, SPREADSHEET_HEADERS.Entities);

    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Entities!A${sheetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [updatedRow] },
    });
    
    await addLog(`Updated Entity`, `Entity ${updatedEntity.name} was modified`, userName);
    return updatedEntity;
};

export const deleteEntity = async (id, userName) => {
    const entityToDelete = (await getEntities()).find(e => e.id === id);
    if (!entityToDelete) throw new Error("Entity not found");
    await deleteRowByUniqueId('Entities', id);
    await addLog(`Deleted Entity`, `Entity ${entityToDelete.name} (${entityToDelete.type}) was deleted`, userName);
    return { success: true };
};


// ===== Activity Log Functions =====

export const getLogs = async () => {
    const rows = await getSheetData('Logs');
    const logs = rowsToObjects(rows, SPREADSHEET_HEADERS.Logs).map((l) => ({...l, id: parseInt(l.id, 10)}));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addLog = async (action, details, user = "System") => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const allLogs = await getLogs();
    const newId = (allLogs.length > 0 ? Math.max(...allLogs.map(l => l.id)) : 0) + 1;
    const newLog = { id: newId, timestamp: new Date().toISOString(), user, action, details };
    const row = objectToRow(newLog, SPREADSHEET_HEADERS.Logs);
    
    await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Logs!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
    });
    return newLog;
};

// ===== User Functions =====

export const getUsers = async () => {
    const rows = await getSheetData('Users');
    return rowsToObjects(rows, SPREADSHEET_HEADERS.Users).map((u) => ({...u, id: parseInt(u.id, 10)}));
};

export const getCurrentUser = async () => {
    const token = window.gapi.client.getToken();
    if (!token?.access_token) {
        throw new Error("User not authenticated or token is missing.");
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${token.access_token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info from Google.');
    }
    const profile = await response.json();
    
    if (!profile.email || !profile.sub) {
        throw new Error("Could not retrieve user profile from Google.");
    }

    const users = await getUsers();
    let user = users.find(u => u.email === profile.email);

    if (user) {
        const needsUpdate = user.imageUrl !== profile.picture || user.name !== profile.name;
        if (needsUpdate) {
            user.imageUrl = profile.picture;
            user.name = profile.name;
            await updateUser(user.id, { imageUrl: profile.picture, name: profile.name }, "System");
        }
        return user;
    } else {
        const newUser = {
            name: profile.name || 'New User',
            email: profile.email,
            role: users.length === 0 ? UserRole.ADMIN : UserRole.USER,
            googleId: profile.sub,
            imageUrl: profile.picture,
        };
        return await addUser(newUser, 'System');
    }
};

export const addUser = async (userData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const allUsers = await getUsers();
    const newId = (allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) : 0) + 1;
    const newUser = { ...userData, id: newId };
    const row = objectToRow(newUser, SPREADSHEET_HEADERS.Users);

    await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Users!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
    });

    await addLog(`Created User`, `New user account created for ${userData.name} (${userData.email}) with role ${userData.role}`, userName);
    return newUser;
};

export const updateUser = async (id, userData, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const rows = await getSheetData('Users');
    const rowIndex = rows.findIndex(row => parseInt(row[0], 10) === id);
    if (rowIndex === -1) throw new Error("User not found");

    const sheetRowIndex = rowIndex + 2;
    const currentUser = rowToObject(rows[rowIndex], SPREADSHEET_HEADERS.Users);
    const updatedUser = { ...currentUser, ...userData, id };
    const updatedRow = objectToRow(updatedUser, SPREADSHEET_HEADERS.Users);

    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Users!A${sheetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [updatedRow] },
    });
    
    await addLog(`Updated User`, `User account for ${updatedUser.name} was modified`, userName);
    return updatedUser;
};

export const deleteUser = async (id, userName) => {
    const userToDelete = (await getUsers()).find(u => u.id === id);
    if (!userToDelete) throw new Error("User not found");
    await deleteRowByUniqueId('Users', id);
    await addLog(`Deleted User`, `User account for ${userToDelete.name} (${userToDelete.email}) was deleted`, userName);
    return { success: true };
};

// ===== Settings Functions =====

const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_LOGO_SIZE_BYTES) {
            return reject(new Error(`File is too large. Please upload an image smaller than ${Math.round(MAX_LOGO_SIZE_BYTES / 1024)}KB.`));
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const getCompanySettings = async () => {
    const rows = await getSheetData('Settings');
    const settings = {};
    rows.forEach(row => {
        settings[row[0]] = row[1];
    });
    return settings;
};

const updateSetting = async (key, value, userName) => {
    const spreadsheetId = await findOrCreateSpreadsheet();
    const rows = await getSheetData('Settings');
    const rowIndex = rows.findIndex(row => row[0] === key);
    
    if (rowIndex !== -1) {
        const sheetRowIndex = rowIndex + 2;
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Settings!B${sheetRowIndex}`,
            valueInputOption: 'RAW',
            resource: { values: [[value]] },
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Settings!A1',
            valueInputOption: 'RAW',
            resource: { values: [[key, value]] },
        });
    }

    await addLog(`Updated Setting`, `Setting '${key}' was changed`, userName);
};

export const updateAppLogo = async (file, userName) => {
    const dataUrl = await fileToDataUrl(file);
    await updateSetting('appLogoUrl', dataUrl, userName);
    return await getCompanySettings();
};

export const updateCompanyLogo = async (file, userName) => {
    const dataUrl = await fileToDataUrl(file);
    await updateSetting('companyLogoUrl', dataUrl, userName);
    return await getCompanySettings();
};