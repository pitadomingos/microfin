import React, { useEffect, useState } from 'react';
import * as sheetService from '../services/googleSheetService.js';
import { Icon } from '../components/Icon.js';

const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export function ActivityLogPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            const data = await sheetService.getLogs();
            setLogs(data);
            setIsLoading(false);
        };
        fetchLogs();
    }, []);

    const getIconForAction = (action) => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('create') || lowerAction.includes('add')) return 'plus-circle';
        if (lowerAction.includes('update')) return 'pencil-alt';
        if (lowerAction.includes('delete')) return 'trash-alt';
        if (lowerAction.includes('login')) return 'sign-in-alt';
        if (lowerAction.includes('logout')) return 'sign-out-alt';
        return 'info-circle';
    };

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Activity Logs"),
            React.createElement('p', { className: "text-gray-600 dark:text-gray-400" },
                "A chronological record of all actions performed in the system."
            ),
            
            React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" },
                React.createElement('div', { className: "p-4" },
                    isLoading ? (
                         React.createElement('div', { className: "text-center p-10" }, React.createElement(Icon, { name: "spinner", className: "animate-spin text-3xl text-primary-500" }))
                    ) : (
                    React.createElement('ul', { className: "divide-y divide-gray-200 dark:divide-gray-700" },
                        logs.map(log => (
                            React.createElement('li', { key: log.id, className: "p-4 flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50" },
                                React.createElement('div', { className: "mt-1" },
                                    React.createElement(Icon, { name: getIconForAction(log.action), className: "text-gray-400 dark:text-gray-500 text-lg" })
                                ),
                                React.createElement('div', { className: "flex-1" },
                                    React.createElement('div', { className: "flex items-center justify-between" },
                                        React.createElement('p', { className: "text-sm font-semibold text-gray-900 dark:text-white" },
                                            log.action
                                        ),
                                        React.createElement('p', { className: "text-xs text-gray-500 dark:text-gray-400" },
                                            formatTimestamp(log.timestamp)
                                        )
                                    ),
                                    React.createElement('p', { className: "text-sm text-gray-600 dark:text-gray-300" },
                                        React.createElement('span', { className: "font-medium" }, log.user), ": ", log.details
                                    )
                                )
                            )
                        ))
                    )
                    )
                )
            )
        )
    );
};
