import React from 'react';
import { Icon } from '../components/Icon.js';

export function LoginPage({ onLogin, isGapiReady, error }) {
    return (
        React.createElement('div', { className: "min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4" },
            React.createElement('div', { className: "w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl" },
                React.createElement('div', { className: "text-center" },
                    React.createElement('div', { className: "flex items-center justify-center gap-3 mb-4" },
                        React.createElement('div', { className: "bg-primary-500 p-3 rounded-xl" },
                            React.createElement(Icon, { name: "file-invoice-dollar", className: "text-white text-3xl" })
                        ),
                        React.createElement('div', null,
                            React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" },
                                "DocTrac"
                            ),
                             React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400" }, "Powered by Gemini & Google Sheets")
                        )
                    ),
                     React.createElement('p', { className: "mt-2 text-gray-600 dark:text-gray-400" },
                        "Sign in to manage your documents."
                    )
                ),
                
                React.createElement('div', { className: "flex flex-col items-center justify-center pt-4" },
                    error && (
                        React.createElement('div', { className: "mb-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg" },
                            React.createElement(Icon, { name: "exclamation-circle", className: "mr-2" }),
                            React.createElement('strong', null, "Error:"), " ", error
                        )
                    ),
                    isGapiReady && !error ? (
                        React.createElement('button', {
                            onClick: onLogin,
                            className: "w-full flex items-center justify-center gap-3 py-3 px-4 border-transparent text-sm font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                        },
                             React.createElement(Icon, { name: "google", className: "fab text-xl" }),
                            "Sign in with Google"
                        )
                    ) : (
                         React.createElement('div', { className: "flex flex-col items-center text-gray-500 dark:text-gray-400" },
                            !error && React.createElement(Icon, { name: "spinner", className: "animate-spin text-2xl mb-2" }),
                            !error && React.createElement('span', null, "Initializing...")
                        )
                    )
                ),

                React.createElement('p', { className: "mt-6 text-center text-xs text-gray-500" },
                    `© ${new Date().getFullYear()} Jachris Mining Service. All rights reserved.`
                )
            )
        )
    );
};
