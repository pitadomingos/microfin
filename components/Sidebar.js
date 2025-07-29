import React from 'react';
import { Icon } from './Icon.js';
import { UserRole } from '../types.js';

function AppLogo({ logoUrl }) {
    return React.createElement('div', { className: "flex items-center gap-3 p-4 border-b border-gray-200/10" },
        logoUrl ? (
            React.createElement('img', { src: logoUrl, alt: "App Logo", className: "h-10 w-10 rounded-lg object-contain bg-white/10 p-1" })
        ) : (
            React.createElement('div', { className: "bg-primary-500 p-3 rounded-xl" },
                React.createElement(Icon, { name: "file-invoice-dollar", className: "text-white text-2xl" })
            )
        ),
        React.createElement('div', null,
            React.createElement('h1', { className: "text-xl font-bold text-white" },
                "DocTrac"
            )
        )
    )
}

function NavLink({ icon, label, isActive, onClick }) {
    return React.createElement('button', {
        onClick: onClick,
        className: `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isActive
                ? 'bg-primary-500/20 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`
    },
        React.createElement(Icon, { name: icon, className: "w-5 text-center" }),
        React.createElement('span', null, label)
    )
}

export function Sidebar({ user, currentPage, setCurrentPage, logoUrl }) {

    const navItems = [
        { id: 'dashboard', icon: 'grip-vertical', label: 'Dashboard' },
        { id: 'documents', icon: 'files', label: 'Documents' },
        { id: 'reports', icon: 'chart-pie', label: 'AI Reports' },
        { id: 'logs', icon: 'timeline', label: 'Activity Logs' },
        { id: 'manual', icon: 'book', label: 'User Manual' },
    ];

    if (user.role === UserRole.ADMIN) {
        navItems.push({ id: 'admin', icon: 'user-gear', label: 'Admin Console' });
    }

    return (
        React.createElement('aside', { className: "w-64 bg-gray-800 text-white flex flex-col shadow-lg dark:bg-gray-900 border-r border-gray-700" },
           React.createElement(AppLogo, { logoUrl: logoUrl }),
            React.createElement('nav', { className: "flex-1 p-4 space-y-2" },
                navItems.map(item => (
                    React.createElement(NavLink, {
                        key: item.id,
                        icon: item.icon,
                        label: item.label,
                        isActive: currentPage === item.id,
                        onClick: () => setCurrentPage(item.id)
                    })
                ))
            ),
            React.createElement('div', { className: "p-4 border-t border-gray-700" },
                 React.createElement('p', { className: "text-xs text-center text-gray-400" },
                    `© ${new Date().getFullYear()} Jachris Mining Service.`
                 )
            )
        )
    );
};
