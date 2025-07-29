# DocTrac AI

DocTrac is an intelligent document tracker for Jachris Mining Service that uses AI to streamline data entry. Manage your requisitions, quotes, purchase orders, and invoices efficiently with the power of Google's Gemini AI and Google Sheets.

## Table of Contents

1.  [Configuration](#1-configuration)
2.  [Running Locally](#2-running-locally)
3.  [Google OAuth Setup](#3-google-oauth-setup)
4.  [How Data is Stored (Google Sheets)](#4-how-data-is-stored-google-sheets)
5.  [Enabling Multi-User Collaboration](#5-enabling-multi-user-collaboration)
6.  [Deploying to Google Cloud Run](#6-deploying-to-google-cloud-run)

---

## 1. Configuration

The application requires two main credentials to function: a **Google Client ID** for user sign-in and a **Gemini API Key** for AI features.

### Google Client ID
This is configured directly in the frontend code.
1.  Open the `public/index.html` file.
2.  Locate the `window.APP_CONFIG` script block.
3.  Replace the placeholder value for `GOOGLE_CLIENT_ID` with your actual ID from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### Gemini API Key
The Gemini API Key is handled securely by the backend. **Do not place it in the frontend code.** It must be provided as an environment variable to the server. See the "Running Locally" and "Deploying" sections for instructions.

---

## 2. Running Locally

This app must be run via the included Node.js server.

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Set Environment Variable & Start Server**:
    To run the server locally with AI features enabled, you must set the `API_KEY` environment variable before starting it.

    **On macOS/Linux:**
    ```bash
    API_KEY="YOUR_GEMINI_API_KEY_HERE" npm start
    ```
    
    **On Windows (Command Prompt):**
    ```bash
    set API_KEY="YOUR_GEMINI_API_KEY_HERE"&&npm start
    ```
    
    **On Windows (PowerShell):**
    ```bash
    $env:API_KEY="YOUR_GEMINI_API_KEY_HERE"; npm start
    ```

3.  Open your web browser and go to: **`http://localhost:8080`**

---

## 3. Google OAuth Setup

This is the most important step to fix login errors. For every new URL where you host the app, you must authorize it.

1.  Go to the [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Click on the name of your **OAuth 2.0 Client ID** to edit it.
3.  Find the section named **"Authorized JavaScript origins"**.
4.  Click **"+ ADD URI"**.
5.  Paste the URL of your app.
    -   For local development, add `http://localhost:8080`.
    -   For a deployed app, add the URL provided by Cloud Run (e.g., `https://your-app-name-uc.a.run.app`).
6.  Click **Save**.

---

## 4. How Data is Stored (Google Sheets)

By default, the application uses a "find or create" model for data storage.

-   **On first login**, the application will search the user's Google Drive for a spreadsheet named `DocTrac_Data`.
-   If it's not found, it will **create a new, private spreadsheet** in that user's Drive.
-   This means that by default, **every user gets their own separate data source**. This is ideal for individual testing and development.

---

## 5. Enabling Multi-User Collaboration

To have your entire team work with the same data, you must configure the application to use a single, shared Google Sheet.

1.  **Create the Master Sheet**:
    -   Have one user (the designated "owner") run the application locally one time. This will create the `DocTrac_Data` spreadsheet in their Google Drive.

2.  **Get the Spreadsheet ID**:
    -   The owner should open the new `DocTrac_Data` sheet in their browser.
    -   The ID is in the URL: `https://docs.google.com/spreadsheets/d/`**`[THIS_IS_THE_ID]`**`/edit`
    -   Copy this ID.

3.  **Configure the Application**:
    -   Open `public/services/googleSheetService.js`.
    -   Find the `SPREADSHEET_ID_OVERRIDE` constant at the top of the file.
    -   Uncomment it and paste the copied ID, like this:
        ```javascript
        const SPREADSHEET_ID_OVERRIDE = '1_IeNu-orxkYxLMHC42GnKdCEGw4i_GfH9TyX2lB7EuU'; // Example ID
        ```

4.  **Share the Sheet**:
    -   In Google Drive, the owner must **share** the `DocTrac_Data` spreadsheet with all team members.
    -   **Crucially, give all users "Editor" access.**

5.  **Redeploy**:
    -   With the code change from step 3, redeploy the application. All users will now connect to the single, shared spreadsheet.

---

## 6. Deploying to Google Cloud Run

This project includes a `Dockerfile` and `server.js` to allow for easy deployment to Google Cloud Run.

### Prerequisites
-   [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
-   A Google Cloud project with billing enabled.
-   Cloud Run and Cloud Build APIs enabled in your Google Cloud project.

### Deployment Steps

1.  **Set your Google Cloud Project ID**:
    Replace `[YOUR_PROJECT_ID]` with your actual project ID.
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```

2.  **Build the Docker image using Cloud Build**:
    First, find your project ID by running:
     ```bash
    gcloud config get-value project
    ```
    Copy the ID, then use it in the command below, replacing `[YOUR_PROJECT_ID]` with your actual project ID and `[APP_NAME]` with a name for your app (e.g., `doctrac`).
    ```bash
    gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/[APP_NAME]
    ```

3.  **Deploy to Cloud Run**:
    This command deploys your container to Cloud Run.
    -   Replace `[APP_NAME]` and `[YOUR_PROJECT_ID]` with the same values you used above.
    -   Replace `REPLACE_WITH_YOUR_GEMINI_API_KEY` with your actual Gemini API Key.
    -   The `--allow-unauthenticated` flag makes your app publicly accessible.
    ```bash
    gcloud run deploy [APP_NAME] \
      --image gcr.io/[YOUR_PROJECT_ID]/[APP_NAME] \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY"
    ```

4.  **Finalize OAuth Setup**:
    After deployment, Cloud Run will give you a public URL (e.g., `https://doctrac-....a.run.app`). You **must** add this new URL to your "Authorized JavaScript origins" in the Google Cloud Console by following the steps in the [Google OAuth Setup section](#3-google-oauth-setup).