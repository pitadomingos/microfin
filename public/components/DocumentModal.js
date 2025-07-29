
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { DocumentType, Status, FlowDirection } from '../types.js';
import { Icon } from './Icon.js';
import * as sheetService from '../services/googleSheetService.js';
import { parseTextToDocument } from '../services/geminiService.js';

export const DocumentModal = ({ isOpen, onClose, onSave, editingDocument }) => {
    const [formData, setFormData] = useState({
        dateIssued: new Date().toISOString().split('T')[0],
        supplierName: '',
        documentType: DocumentType.INVOICE,
        documentNumber: '',
        relatedQuote: '',
        relatedPO: '',
        relatedInvoice: '',
        status: Status.WAITING_FOR_PAYMENT,
        notes: '',
        flowDirection: FlowDirection.INBOUND,
        amount: '',
        dueDate: '',
    });
    const [smartText, setSmartText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [entities, setEntities] = useState([]);

    const suppliers = useMemo(() => entities.filter(e => e.type === 'Supplier').sort((a,b) => a.name.localeCompare(b.name)), [entities]);
    const clients = useMemo(() => entities.filter(e => e.type === 'Client').sort((a,b) => a.name.localeCompare(b.name)), [entities]);

    useEffect(() => {
      setIsMounted(true);
      return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            sheetService.getEntities().then(setEntities);
        }
    }, [isOpen]);

    useEffect(() => {
        const initialFormState = {
            dateIssued: new Date().toISOString().split('T')[0],
            supplierName: '',
            documentType: DocumentType.REQUISITION,
            documentNumber: '',
            relatedQuote: '',
            relatedPO: '',
            relatedInvoice: '',
            status: Status.WAITING_FOR_QUOTE,
            notes: '',
            flowDirection: FlowDirection.INBOUND,
            amount: '',
            dueDate: '',
        };
        if (editingDocument) {
            setFormData({ ...initialFormState, ...editingDocument });
        } else {
            setFormData(initialFormState);
        }
        setSmartText('');
    }, [editingDocument, isOpen]);
    
    if (!isOpen || !isMounted) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value, supplierName: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: formData.amount ? parseFloat(formData.amount) : 0,
            relatedQuote: formData.relatedQuote || 'N/A',
            relatedPO: formData.relatedPO || 'N/A',
            relatedInvoice: formData.relatedInvoice || 'N/A',
        });
    };
    
    const handleSmartParse = async () => {
        if (!smartText.trim()) return;
        setIsParsing(true);
        try {
            const parsedData = await parseTextToDocument(smartText);
            
            const allEntityNames = entities.map(e => e.name);
            const validSupplier = parsedData.supplierName && allEntityNames.includes(parsedData.supplierName);

            setFormData(prev => ({
                ...prev,
                ...parsedData,
                documentType: parsedData.documentType || prev.documentType,
                supplierName: validSupplier ? parsedData.supplierName : prev.supplierName,
                amount: parsedData.amount || prev.amount,
                dueDate: parsedData.dueDate || prev.dueDate,
            }));
        } catch (error) {
            alert(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsParsing(false);
        }
    };

    const currentList = formData.flowDirection === FlowDirection.INBOUND ? suppliers : clients;
    
    const showAmountField = [DocumentType.QUOTE, DocumentType.PO, DocumentType.INVOICE].includes(formData.documentType);
    const showDueDateField = formData.documentType === DocumentType.INVOICE;

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    const modalContent = (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300", onClick: onClose },
            React.createElement('div', { 
                className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95",
                onClick: e => e.stopPropagation(),
                style: { transform: isOpen ? 'scale(1)' : 'scale(0.95)' }
            },
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: "p-6" },
                        React.createElement('div', { className: "flex justify-between items-start mb-6" },
                            React.createElement('div', null,
                                React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white" }, editingDocument ? 'Edit Document' : 'Add Document'),
                                React.createElement('p', { className: "text-gray-500 dark:text-gray-400 text-sm" }, "Fill in the details below or use the AI parser.")
                            ),
                            React.createElement('button', { type: "button", onClick: onClose, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" },
                                React.createElement(Icon, { name: "times", className: "text-xl" })
                            )
                        ),
                        
                        React.createElement('div', { className: "space-y-4 mb-6" },
                            React.createElement('div', { className: "bg-primary-50 dark:bg-gray-900/50 p-4 rounded-lg" },
                                React.createElement('label', { htmlFor: "smartText", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Smart Paste (AI Powered)"),
                                React.createElement('div', { className: "flex gap-2" },
                                    React.createElement('textarea', { 
                                        id: "smartText", 
                                        value: smartText, 
                                        onChange: (e) => setSmartText(e.target.value), 
                                        rows: 2,
                                        placeholder: "e.g., 'Invoice INV-123 from Supplier C for $500, due in 30 days...'",
                                        className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    }),
                                    React.createElement('button', { 
                                        type: "button", 
                                        onClick: handleSmartParse, 
                                        disabled: isParsing, 
                                        className: "px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:bg-primary-300 disabled:cursor-not-allowed"
                                    },
                                        isParsing ? React.createElement(Icon, { name: "spinner", className: "animate-spin" }) : React.createElement(Icon, { name: "wand-magic-sparkles" }),
                                        React.createElement('span', null, "Parse")
                                    )
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                            React.createElement('div', null,
                                React.createElement('label', { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Flow Direction"),
                                React.createElement('div', { className: "flex gap-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg" },
                                    React.createElement('label', { className: "flex flex-1 items-center justify-center cursor-pointer" },
                                        React.createElement('input', { type: "radio", name: "flowDirection", value: FlowDirection.INBOUND, checked: formData.flowDirection === FlowDirection.INBOUND, onChange: handleRadioChange, className: "sr-only" }),
                                        React.createElement('span', { className: `w-full text-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.flowDirection === FlowDirection.INBOUND ? 'bg-white dark:bg-gray-800 shadow text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}` }, "Purchase")
                                    ),
                                    React.createElement('label', { className: "flex flex-1 items-center justify-center cursor-pointer" },
                                        React.createElement('input', { type: "radio", name: "flowDirection", value: FlowDirection.OUTBOUND, checked: formData.flowDirection === FlowDirection.OUTBOUND, onChange: handleRadioChange, className: "sr-only" }),
                                        React.createElement('span', { className: `w-full text-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.flowDirection === FlowDirection.OUTBOUND ? 'bg-white dark:bg-gray-800 shadow text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}` }, "Sales")
                                    )
                                )
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "supplierName", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, formData.flowDirection === FlowDirection.INBOUND ? 'Supplier Name' : 'Client Name'),
                                React.createElement('select', { 
                                    id: "supplierName",
                                    name: "supplierName", 
                                    value: formData.supplierName, 
                                    onChange: handleChange, 
                                    required: true, 
                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                                },
                                    React.createElement('option', { value: "", disabled: true }, `Select a ${formData.flowDirection === FlowDirection.INBOUND ? 'Supplier' : 'Client'}...`),
                                    currentList.map(entity => React.createElement('option', { key: entity.id, value: entity.name }, entity.name))
                                )
                            )
                        ),

                        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4" },
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "dateIssued", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Date Issued"),
                                React.createElement('input', { id: "dateIssued", type: "date", name: "dateIssued", value: formData.dateIssued, onChange: handleChange, required: true, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "documentType", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Document Type"),
                                React.createElement('select', { id: "documentType", name: "documentType", value: formData.documentType, onChange: handleChange, required: true, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" },
                                    Object.values(DocumentType).map(type => React.createElement('option', { key: type, value: type }, type))
                                )
                            ),
                             React.createElement('div', { className: "md:col-span-2" },
                                React.createElement('label', { htmlFor: "documentNumber", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Document Number"),
                                React.createElement('input', { id: "documentNumber", type: "text", name: "documentNumber", value: formData.documentNumber, onChange: handleChange, required: true, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                            ),
                            showAmountField && React.createElement('div', null,
                                React.createElement('label', { htmlFor: "amount", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Amount"),
                                React.createElement('input', { id: "amount", type: "number", name: "amount", value: formData.amount, onChange: handleChange, placeholder: "0.00", step: "0.01", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                            ),
                            showDueDateField && React.createElement('div', null,
                                React.createElement('label', { htmlFor: "dueDate", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Due Date"),
                                React.createElement('input', { id: "dueDate", type: "date", name: "dueDate", value: formData.dueDate, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                            ),
                            React.createElement('div', { className: `col-span-1 ${!showAmountField && !showDueDateField ? 'md:col-span-2' : ''}` },
                                React.createElement('label', { htmlFor: "status", className: `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2` }, "Status"),
                                React.createElement('select', { id: "status", name: "status", value: formData.status, onChange: handleChange, required: true, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" },
                                    Object.values(Status).map(status => React.createElement('option', { key: status, value: status }, status))
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: "border-t border-gray-200 dark:border-gray-700 mt-6 pt-6" },
                            React.createElement('h4', { className: 'text-md font-semibold text-gray-800 dark:text-white mb-3' }, "Link Related Documents"),
                            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "relatedQuote", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Related Quote #"),
                                    React.createElement('input', { id: "relatedQuote", type: "text", name: "relatedQuote", value: formData.relatedQuote, onChange: handleChange, placeholder: "N/A if none", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "relatedPO", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Related P.O. #"),
                                    React.createElement('input', { id: "relatedPO", type: "text", name: "relatedPO", value: formData.relatedPO, onChange: handleChange, placeholder: "N/A if none", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "relatedInvoice", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Related Invoice #"),
                                    React.createElement('input', { id: "relatedInvoice", type: "text", name: "relatedInvoice", value: formData.relatedInvoice, onChange: handleChange, placeholder: "N/A if none", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                                )
                            )
                        ),

                        React.createElement('div', { className: "mt-6" },
                            React.createElement('label', { htmlFor: "notes", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Notes"),
                            React.createElement('textarea', { id: "notes", name: "notes", value: formData.notes, onChange: handleChange, rows: 3, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" })
                        )
                    ),
                    React.createElement('div', { className: "flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl" },
                        React.createElement('button', { type: "button", onClick: onClose, className: "px-6 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200" }, "Cancel"),
                        React.createElement('button', { type: "submit", className: "px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200" }, "Save Document")
                    )
                )
            )
        )
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};
