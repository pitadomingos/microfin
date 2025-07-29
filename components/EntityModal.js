import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { EntityType } from '../types.js';
import { Icon } from './Icon.js';

const initialFormData = {
    name: '',
    type: EntityType.SUPPLIER,
};

export function EntityModal({ isOpen, onClose, onSave, editingEntity }) {
    const [formData, setFormData] = useState(initialFormData);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (editingEntity) {
                setFormData({
                    name: editingEntity.name,
                    type: editingEntity.type,
                });
            } else {
                setFormData(initialFormData);
            }
        }
    }, [editingEntity, isOpen]);

    if (!isOpen || !isMounted) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    const modalContent = (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300", onClick: onClose },
            React.createElement('div', { 
                className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-95",
                onClick: e => e.stopPropagation(),
                style: { transform: isOpen ? 'scale(1)' : 'scale(0.95)' }
            },
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: "p-6" },
                        React.createElement('div', { className: "flex justify-between items-start mb-6" },
                            React.createElement('div', null,
                                React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white" }, editingEntity ? 'Edit Entity' : 'Add Entity'),
                                React.createElement('p', { className: "text-gray-500 dark:text-gray-400 text-sm" }, "Fill in the details for the supplier or client.")
                            ),
                            React.createElement('button', { type: "button", onClick: onClose, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" },
                                React.createElement(Icon, { name: "times", className: "text-xl" })
                            )
                        ),

                        React.createElement('div', { className: "space-y-4" },
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "entityName", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Entity Name"),
                                React.createElement('input', { id: "entityName", type: "text", name: "name", value: formData.name, onChange: handleChange, required: true,
                                       className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "entityType", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Entity Type"),
                                React.createElement('select', { id: "entityType", name: "type", value: formData.type, onChange: handleChange, required: true,
                                        className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" },
                                    Object.values(EntityType).map(type => React.createElement('option', { key: type, value: type }, type))
                                )
                            )
                        )
                    ),
                    React.createElement('div', { className: "flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl" },
                        React.createElement('button', { type: "button", onClick: onClose, className: "px-6 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200" },
                            "Cancel"
                        ),
                        React.createElement('button', { type: "submit", className: "px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200" },
                            editingEntity ? 'Save Changes' : 'Add Entity'
                        )
                    )
                )
            )
        )
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
}
