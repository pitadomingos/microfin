


import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon.js';

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType = 'item' }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    if (!isOpen || !isMounted) return null;

    const modalContent = (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4", onClick: onClose },
            React.createElement('div', { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4", onClick: e => e.stopPropagation() },
                React.createElement('div', { className: "flex items-start gap-4" },
                    React.createElement('div', { className: "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10" },
                         React.createElement(Icon, { name: "triangle-exclamation", className: "h-6 w-6 text-red-600 dark:text-red-400" })
                    ),
                    React.createElement('div', { className: "mt-0 text-left" },
                        React.createElement('h3', { className: "text-lg font-semibold text-gray-900 dark:text-white" }, `Confirm Deletion`),
                        React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400 mt-2" }, `Are you sure you want to delete this ${itemType}? This action cannot be undone.`)
                    )
                ),
                React.createElement('div', { className: "mt-6 flex justify-end space-x-3" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200" },
                        "Cancel"
                    ),
                    React.createElement('button', { onClick: onConfirm, className: "px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200" },
                        "Delete"
                    )
                )
            )
        )
    );

    return ReactDOM.createPortal(modalContent, document.getElementById('modal-root'));
};