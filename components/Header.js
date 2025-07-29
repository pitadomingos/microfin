import React from 'react';
import { Icon } from './Icon.js';
import { ThemeToggle } from './ThemeToggle.js';

function CompanyLogo({ logoUrl }) {
    return React.createElement('div', { className: "flex items-center gap-2 h-8" },
        logoUrl ? (
            React.createElement('img', { src: logoUrl, alt: "Company Logo", className: "h-full w-auto" })
        ) : (
             React.createElement(Icon, { name: "building-columns", className: "text-gray-400 text-lg" })
        ),
        React.createElement('span', { className: "text-sm font-medium text-gray-600 dark:text-gray-300" }, "Jachris Mining Service")
    )
}

function UserProfile({ user }) {
    return React.createElement('div', { className: "flex items-center gap-3" },
        React.createElement('div', { className: "w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden" },
             user.imageUrl ? (
                React.createElement('img', { src: user.imageUrl, alt: user.name, className: "w-full h-full object-cover" })
            ) : (
                React.createElement('span', { className: "font-bold text-primary-600 dark:text-primary-300" }, user.name.charAt(0))
            )
        ),
        React.createElement('div', null,
            React.createElement('p', { className: "font-semibold text-sm text-gray-800 dark:text-gray-200" }, user.name),
            React.createElement('p', { className: "text-xs text-gray-500 dark:text-gray-400" }, user.email)
        )
    )
}

export function Header({ user, onLogout, logoUrl }) {
    return (
        React.createElement('header', { className: "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10" },
            React.createElement('div', null),
            React.createElement('div', { className: "flex items-center gap-6" },
                React.createElement(CompanyLogo, { logoUrl: logoUrl }),
                React.createElement('div', { className: "h-8 border-l border-gray-300 dark:border-gray-600" }),
                React.createElement(UserProfile, { user: user }),
                React.createElement(ThemeToggle, null),
                React.createElement('button', { onClick: onLogout, className: "text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-500 transition-colors", title: "Logout" },
                    React.createElement(Icon, { name: "right-from-bracket", className: "text-xl" })
                )
            )
        )
    );
};
