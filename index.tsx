
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

declare global {
    interface Window {
        APP_CONFIG?: {
            API_KEY?: string;
            GOOGLE_CLIENT_ID?: string;
        };
        gapi: any;
        google: any;
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App, null)
  )
);