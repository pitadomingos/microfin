import React, { useState, useMemo, useEffect } from 'react';
import { DocumentType, Status } from '../types.js';
import { DocumentModal } from '../components/DocumentModal.js';
import { DocumentTableRow } from '../components/DocumentTableRow.js';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal.js';
import { Icon } from '../components/Icon.js';
import * as sheetService from '../services/googleSheetService.js';

export function DocumentsPage({ currentUser }) {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [allEntities, setAllEntities] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [docs, entities] = await Promise.all([
                sheetService.getDocuments(),
                sheetService.getEntities()
            ]);
            setDocuments(docs);
            setAllEntities(entities);
        } catch (error) {
            console.error("Failed to fetch documents or entities:", error);
            alert("Could not load page data. Please check the console for errors.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const suppliersAndClients = useMemo(() => allEntities.sort((a,b) => a.name.localeCompare(b.name)), [allEntities]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                doc.supplierName.toLowerCase().includes(lowerSearch) ||
                doc.documentNumber.toLowerCase().includes(lowerSearch) ||
                doc.notes.toLowerCase().includes(lowerSearch) ||
                (doc.relatedQuote && doc.relatedQuote.toLowerCase().includes(lowerSearch)) ||
                (doc.relatedPO && doc.relatedPO.toLowerCase().includes(lowerSearch)) ||
                (doc.relatedInvoice && doc.relatedInvoice.toLowerCase().includes(lowerSearch));

            const matchesSupplier = !supplierFilter || doc.supplierName === supplierFilter;
            const matchesType = !typeFilter || doc.documentType === typeFilter;
            const matchesStatus = !statusFilter || doc.status === statusFilter;

            return matchesSearch && matchesSupplier && matchesType && matchesStatus;
        });
    }, [documents, searchTerm, supplierFilter, typeFilter, statusFilter]);
    
    // Reset to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, supplierFilter, typeFilter, statusFilter]);

    const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredDocuments.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredDocuments, currentPage, rowsPerPage]);

    const handleOpenModal = (doc = null) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
    };

    const handleSaveDocument = async (docData) => {
        try {
            if (editingDocument) {
                const updatedDoc = await sheetService.updateDocument(editingDocument.id, docData, currentUser.name);
                // Update local state for immediate UI feedback
                setDocuments(docs => docs.map(d => d.id === editingDocument.id ? updatedDoc : d));

            } else {
                const newDoc = await sheetService.addDocument(docData, currentUser.name);
                // Add the new document to local state and re-sort for immediate UI feedback
                setDocuments(docs => [newDoc, ...docs].sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()));
            }
        } catch (error) {
            console.error("Failed to save document:", error);
            alert("Could not save document. " + error.message);
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingId !== null) {
            try {
                const docToDelete = documents.find(d => d.id === deletingId);
                if(docToDelete) {
                    await sheetService.deleteDocument(deletingId, currentUser.name, `${docToDelete.documentType} #${docToDelete.documentNumber}`);
                    // Update local state for immediate UI feedback
                    setDocuments(docs => docs.filter(d => d.id !== deletingId));
                }
            } catch (error) {
                 console.error("Failed to delete document:", error);
                 alert("Could not delete document. " + error.message);
            } finally {
                setIsDeleteModalOpen(false);
                setDeletingId(null);
            }
        }
    };
    
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const LoadingState = () => (
        React.createElement('div', { className: "text-center py-16" },
            React.createElement(Icon, { name: "spinner", className: "text-4xl text-primary-500 animate-spin mb-4" }),
            React.createElement('p', { className: "text-gray-500 dark:text-gray-400" }, "Loading documents...")
        )
    );

    const EmptyState = () => (
        React.createElement('div', { className: "text-center py-16" },
            React.createElement(Icon, { name: "file-circle-question", className: "text-6xl text-gray-300 dark:text-gray-600 mb-4" }),
            React.createElement('h3', { className: "text-xl font-medium text-gray-500 dark:text-gray-400 mb-2" }, "No documents found"),
            React.createElement('p', { className: "text-gray-400 dark:text-gray-500" }, "Try adjusting your search or filters, or add a new document.")
        )
    );
    
    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white dark:bg-gray-800/50 rounded-xl p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-700" },
                React.createElement('div', { className: "flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between" },
                    React.createElement('div', { className: "flex flex-col sm:flex-row gap-3 flex-1 flex-wrap" },
                        React.createElement('div', { className: "relative" },
                            React.createElement(Icon, { name: "search", className: "absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" }),
                            React.createElement('input', { type: "text", placeholder: "Search documents...", value: searchTerm, onChange: e => setSearchTerm(e.target.value),
                                className: "pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base w-full sm:w-64 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" })
                        ),
                        React.createElement('select', { value: supplierFilter, onChange: e => setSupplierFilter(e.target.value), className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" },
                            React.createElement('option', { value: "" }, "All Suppliers/Clients"),
                            suppliersAndClients.map(s => React.createElement('option', { key: s.id, value: s.name }, s.name))
                        ),
                        React.createElement('select', { value: typeFilter, onChange: e => setTypeFilter(e.target.value), className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" },
                            React.createElement('option', { value: "" }, "All Types"),
                            Object.values(DocumentType).map(t => React.createElement('option', { key: t, value: t }, t))
                        ),
                        React.createElement('select', { value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" },
                            React.createElement('option', { value: "" }, "All Statuses"),
                             Object.values(Status).map(s => React.createElement('option', { key: s, value: s }, s))
                        )
                    ),
                    React.createElement('button', { onClick: () => handleOpenModal(), className: "bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shadow-sm" },
                        React.createElement(Icon, { name: "plus" }),
                        "Add Document"
                    )
                )
            ),

            React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" },
                React.createElement('div', { className: "overflow-y-auto", style: { maxHeight: 'calc(100vh - 350px)' } },
                    React.createElement('table', { className: "w-full" },
                        React.createElement('thead', { className: "sticky top-0 z-10" },
                            React.createElement('tr', null,
                                ['Date', 'Supplier/Client', 'Type', 'Doc #', 'Related Quote', 'Related PO', 'Related Invoice', 'Status', 'Notes', 'Actions'].map(h => (
                                    React.createElement('th', { key: h, className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm" }, h)
                                ))
                            )
                        ),
                        React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-gray-700" },
                            !isLoading && paginatedDocuments.length > 0 && paginatedDocuments.map(doc => (
                                React.createElement(DocumentTableRow, { key: doc.id, doc: doc, onEdit: handleOpenModal, onDelete: handleDeleteClick })
                            ))
                        )
                    ),
                     isLoading && React.createElement(LoadingState, null),
                     !isLoading && filteredDocuments.length === 0 && React.createElement(EmptyState, null)
                ),

                !isLoading && filteredDocuments.length > 0 && totalPages > 1 && (
                    React.createElement('div', { className: "p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4" },
                         React.createElement('div', { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" },
                            React.createElement('span', null, "Rows per page:"),
                            React.createElement('select', { value: rowsPerPage, onChange: handleRowsPerPageChange, className: "px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent transition" },
                                React.createElement('option', { value: 10 }, "10"),
                                React.createElement('option', { value: 25 }, "25"),
                                React.createElement('option', { value: 50 }, "50")
                            )
                        ),
                        React.createElement('div', { className: "flex items-center gap-4" },
                            React.createElement('span', { className: "text-sm text-gray-600 dark:text-gray-400" },
                                `Page ${currentPage} of ${totalPages} (${filteredDocuments.length} results)`
                            ),
                            React.createElement('div', { className: "flex items-center gap-2" },
                                React.createElement('button', { onClick: handlePrevPage, disabled: currentPage === 1, className: "p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" },
                                    React.createElement(Icon, { name: "chevron-left", className: "w-4 h-4" })
                                ),
                                React.createElement('button', { onClick: handleNextPage, disabled: currentPage === totalPages || totalPages === 0, className: "p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" },
                                    React.createElement(Icon, { name: "chevron-right", className: "w-4 h-4" })
                                )
                            )
                        )
                    )
                )
            ),

            React.createElement(DocumentModal, { isOpen: isModalOpen, onClose: handleCloseModal, onSave: handleSaveDocument, editingDocument: editingDocument }),
            React.createElement(DeleteConfirmationModal, { isOpen: isDeleteModalOpen, onClose: () => setIsDeleteModalOpen(false), onConfirm: confirmDelete, itemType: "document"})
        )
    );
};
