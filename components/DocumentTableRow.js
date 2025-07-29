import React from 'react';
import { STATUS_COLORS } from '../constants.js';
import { Icon } from './Icon.js';

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        // Add timeZone to prevent off-by-one day errors
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

export function DocumentTableRow({ doc, onEdit, onDelete }) {
    const statusColor = STATUS_COLORS[doc.status] || 'bg-gray-200 text-gray-800';
    const textColorClass = statusColor.split(' ').find(c => c.startsWith('text-'));
    const dotColorClass = textColorClass ? textColorClass.replace('text-', 'bg-') : 'bg-gray-400';

    return (
        React.createElement('tr', { className: "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 text-sm text-gray-700 dark:text-gray-300" },
            React.createElement('td', { className: "px-4 py-3 whitespace-nowrap" }, formatDate(doc.dateIssued)),
            React.createElement('td', { className: "px-4 py-3 font-medium text-gray-900 dark:text-white" }, doc.supplierName),
            React.createElement('td', { className: "px-4 py-3" },
                React.createElement('span', { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
                    doc.documentType
                )
            ),
            React.createElement('td', { className: "px-4 py-3 font-mono" }, doc.documentNumber),
            React.createElement('td', { className: "px-4 py-3 text-gray-500 dark:text-gray-400" }, doc.relatedQuote),
            React.createElement('td', { className: "px-4 py-3 text-gray-500 dark:text-gray-400" }, doc.relatedPO),
            React.createElement('td', { className: "px-4 py-3 text-gray-500 dark:text-gray-400" }, doc.relatedInvoice),
            React.createElement('td', { className: "px-4 py-3" },
                React.createElement('span', { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}` },
                    React.createElement('div', { className: `w-2 h-2 rounded-full mr-1.5 ${dotColorClass}` }),
                    doc.status
                )
            ),
            React.createElement('td', { className: "px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate", title: doc.notes }, doc.notes),
            React.createElement('td', { className: "px-4 py-3" },
                React.createElement('div', { className: "flex gap-3" },
                    React.createElement('button', { onClick: () => onEdit(doc), className: "text-primary-500 hover:text-primary-700 transition-colors duration-200", title: "Edit" },
                        React.createElement(Icon, { name: "edit", className: "" })
                    ),
                    React.createElement('button', { onClick: () => onDelete(doc.id), className: "text-red-500 hover:text-red-700 transition-colors duration-200", title: "Delete" },
                        React.createElement(Icon, { name: "trash", className: "" })
                    )
                )
            )
        )
    );
};
