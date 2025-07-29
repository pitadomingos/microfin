
import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.js';
import { Icon } from './Icon.js';

export function ThemeToggle() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('ThemeToggle must be used within a ThemeProvider');
    }
    const { theme, setTheme } = context;

    const themes = [
        { name: 'light', icon: 'sun' },
        { name: 'dark', icon: 'moon' },
        { name: 'system', icon: 'desktop' },
    ];

    return (
        React.createElement('div', { className: "flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1" },
            themes.map((t) => (
                React.createElement('button', {
                    key: t.name,
                    onClick: () => setTheme(t.name),
                    className: `p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        theme === t.name ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`,
                    'aria-label': `Switch to ${t.name} theme`
                },
                    React.createElement(Icon, { name: t.icon, className: "w-5 h-5" })
                )
            ))
        )
    );
};