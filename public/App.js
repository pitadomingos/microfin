
import React, { useState, useEffect, useCallback } from 'react';
import { LoginPage } from './pages/LoginPage.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { MainLayout } from './components/MainLayout.js';
import * as sheetService from './services/googleSheetService.js';
import { Icon } from './components/Icon.js';

const FullScreenLoader = ({message}) => (
    React.createElement('div', { className: "min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900" },
        React.createElement(Icon, { name: "spinner", className: "animate-spin text-4xl text-primary-500 mb-4" }),
        React.createElement('p', { className: "text-lg text-gray-600 dark:text-gray-400" }, message)
    )
);

const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [companySettings, setCompanySettings] = useState({ appLogoUrl: '', companyLogoUrl: '' });
    const [isGapiReady, setIsGapiReady] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleLogout = useCallback(() => {
        sheetService.signOut();
        setIsSignedIn(false);
        setCurrentUser(null);
    }, []);

    const updateAuthStatus = useCallback(async (signedIn, errorMsg) => {
        setError(errorMsg || null);
        setIsSignedIn(signedIn);
        
        if (signedIn) {
            setIsLoading(true);
            try {
                // This call now also verifies/fixes the sheet structure.
                await sheetService.findOrCreateSpreadsheet(); 
                const [user, settings] = await Promise.all([
                    sheetService.getCurrentUser(),
                    sheetService.getCompanySettings()
                ]);
                setCurrentUser(user);
                setCompanySettings(settings);
                setError(null);
            } catch (err) {
                 console.error("Error during post-login setup:", err);
                 setError(err instanceof Error ? err.message : "An unknown error occurred during setup.");
                 handleLogout(); // Sign out if setup fails
            } finally {
                setIsLoading(false);
            }
        } else {
            setCurrentUser(null);
            setIsLoading(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        let gapiScript, gsiScript;
        const initClient = async () => {
             try {
                await sheetService.init(updateAuthStatus);
                setIsGapiReady(true);
            } catch (err) {
                 console.error("GAPI initialization error:", err);
                 setError(err instanceof Error ? err.message : "Failed to load Google services. Check connection or API config.");
                 setIsLoading(false);
            }
        };

        const handleGapiLoad = () => window.gapi.load('client', initClient);

        // Load GAPI script
        gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = handleGapiLoad;
        gapiScript.onerror = () => {
            setError("Failed to load Google API script. Check internet connection.");
            setIsLoading(false);
        };
        document.body.appendChild(gapiScript);
        
        // Load GIS script
        gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        document.body.appendChild(gsiScript);

        return () => {
            if (gapiScript && document.body.contains(gapiScript)) {
                document.body.removeChild(gapiScript);
            }
            if (gsiScript && document.body.contains(gsiScript)) {
                document.body.removeChild(gsiScript);
            }
        };
    }, [updateAuthStatus]);

    const handleLogin = () => {
        setError(null);
        sheetService.signIn();
    };

    const handleSettingsUpdate = (newSettings) => {
        setCompanySettings(newSettings);
    };

    const renderContent = () => {
        if (!isGapiReady && isLoading) {
            return React.createElement(FullScreenLoader, { message: "Initializing Google Services..." });
        }
        if (error) {
             return React.createElement(LoginPage, { onLogin: handleLogin, isGapiReady: isGapiReady, error: error });
        }
        if (isSignedIn && isLoading) {
            return React.createElement(FullScreenLoader, { message: "Loading User Data..." });
        }
        if (isSignedIn && currentUser) {
            return React.createElement(MainLayout, { 
                user: currentUser, 
                onLogout: handleLogout, 
                settings: companySettings,
                onSettingsUpdate: handleSettingsUpdate
            });
        }
        return React.createElement(LoginPage, { onLogin: handleLogin, isGapiReady: isGapiReady, error: error });
    };

    return (
        React.createElement(ThemeProvider, null,
            React.createElement('div', { className: "min-h-screen" },
                renderContent()
            )
        )
    );
};

export default App;
