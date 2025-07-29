
import { DocumentType, Status, UserRole, FlowDirection, EntityType } from './types.js';

export const INITIAL_DOCUMENTS = [
    // --- Purchase Flow Example (Supplier A) ---
    {
        id: 1, dateIssued: '2025-01-05', supplierName: 'Supplier A', documentType: DocumentType.REQUISITION, documentNumber: 'REQ-001',
        relatedQuote: 'Q-001', relatedPO: 'PO-001', relatedInvoice: 'INV-001', status: Status.WAITING_FOR_QUOTE,
        notes: 'Requisition for Project Alpha parts.', flowDirection: FlowDirection.INBOUND, amount: 0, dueDate: '',
    },
    {
        id: 2, dateIssued: '2025-01-07', supplierName: 'Supplier A', documentType: DocumentType.QUOTE, documentNumber: 'Q-001',
        relatedQuote: 'N/A', relatedPO: 'PO-001', relatedInvoice: 'INV-001', status: Status.WAITING_FOR_PO,
        notes: 'Quote received for Project Alpha parts.', flowDirection: FlowDirection.INBOUND, amount: 1500.00, dueDate: '',
    },
    {
        id: 3, dateIssued: '2025-01-08', supplierName: 'Supplier A', documentType: DocumentType.PO, documentNumber: 'PO-001',
        relatedQuote: 'Q-001', relatedPO: 'N/A', relatedInvoice: 'INV-001', status: Status.WAITING_FOR_INVOICE,
        notes: 'Purchase order sent.', flowDirection: FlowDirection.INBOUND, amount: 1500.00, dueDate: '',
    },
    {
        id: 4, dateIssued: '2025-01-15', supplierName: 'Supplier A', documentType: DocumentType.INVOICE, documentNumber: 'INV-001',
        relatedQuote: 'Q-001', relatedPO: 'PO-001', relatedInvoice: 'N/A', status: Status.WAITING_FOR_PAYMENT,
        notes: 'Invoice for Project Alpha parts.', flowDirection: FlowDirection.INBOUND, amount: 1500.00, dueDate: '2025-02-14',
    },
    {
        id: 5, dateIssued: '2025-02-10', supplierName: 'Supplier A', documentType: DocumentType.INVOICE, documentNumber: 'INV-001',
        relatedQuote: 'Q-001', relatedPO: 'PO-001', relatedInvoice: 'N/A', status: Status.PAID,
        notes: 'Payment completed via wire transfer.', flowDirection: FlowDirection.INBOUND, amount: 1500.00, dueDate: '2025-02-14',
    },
     // --- Sales Flow Example (Client X) ---
    {
        id: 6, dateIssued: '2025-02-01', supplierName: 'Client X', documentType: DocumentType.REQUISITION, documentNumber: 'CR-100',
        relatedQuote: 'JMS-Q-500', relatedPO: 'CPO-987', relatedInvoice: '', status: Status.WAITING_FOR_QUOTE,
        notes: 'Client request for pricing on 50 safety helmets.', flowDirection: FlowDirection.OUTBOUND, amount: 0, dueDate: '',
    },
    {
        id: 7, dateIssued: '2025-02-02', supplierName: 'Client X', documentType: DocumentType.QUOTE, documentNumber: 'JMS-Q-500',
        relatedQuote: 'N/A', relatedPO: 'CPO-987', relatedInvoice: '', status: Status.WAITING_FOR_PO,
        notes: 'Quote sent to client for helmets.', flowDirection: FlowDirection.OUTBOUND, amount: 850.75, dueDate: '',
    },
    {
        id: 8, dateIssued: '2025-02-05', supplierName: 'Client X', documentType: DocumentType.PO, documentNumber: 'CPO-987',
        relatedQuote: 'JMS-Q-500', relatedPO: 'N/A', relatedInvoice: 'JMS-INV-300', status: Status.WAITING_FOR_INVOICE,
        notes: 'Received PO for helmets.', flowDirection: FlowDirection.OUTBOUND, amount: 850.75, dueDate: '',
    },
    {
        id: 9, dateIssued: '2025-02-08', supplierName: 'Client X', documentType: DocumentType.INVOICE, documentNumber: 'JMS-INV-300',
        relatedQuote: 'JMS-Q-500', relatedPO: 'CPO-987', relatedInvoice: 'N/A', status: Status.WAITING_FOR_PAYMENT,
        notes: 'Invoice sent to client.', flowDirection: FlowDirection.OUTBOUND, amount: 850.75, dueDate: '2025-03-10',
    },
    // --- Another Purchase Flow (Supplier B) ---
    {
        id: 10, dateIssued: '2025-01-20', supplierName: 'Supplier B', documentType: DocumentType.REQUISITION, documentNumber: 'REQ-002',
        relatedQuote: '', relatedPO: '', relatedInvoice: '', status: Status.WAITING_FOR_QUOTE,
        notes: 'Requisition for new office supplies.', flowDirection: FlowDirection.INBOUND, amount: 0, dueDate: '',
    },
];

const uniqueEntities = new Map();
INITIAL_DOCUMENTS.forEach(doc => {
    const type = doc.flowDirection === FlowDirection.INBOUND ? EntityType.SUPPLIER : EntityType.CLIENT;
    if (!uniqueEntities.has(doc.supplierName.toLowerCase())) {
        uniqueEntities.set(doc.supplierName.toLowerCase(), {
            name: doc.supplierName,
            type: type,
        });
    }
});

export const INITIAL_ENTITIES = Array.from(uniqueEntities.values()).map((entity, index) => ({
    id: index + 1,
    name: entity.name,
    type: entity.type,
}));


export const STATUS_COLORS = {
    [Status.WAITING_FOR_QUOTE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
    [Status.WAITING_FOR_PO]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    [Status.WAITING_FOR_INVOICE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    [Status.WAITING_FOR_PAYMENT]: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
    [Status.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
};

export const INITIAL_USERS = [
    { id: 1, name: 'Admin User', email: 'admin@jachrismining.com', role: UserRole.ADMIN, googleId: 'google-id-admin' },
    { id: 2, name: 'John Doe', email: 'john.doe@jachrismining.com', role: UserRole.USER, googleId: 'google-id-john' },
    { id: 3, name: 'Jane Smith', email: 'jane.smith@jachrismining.com', role: UserRole.USER, googleId: 'google-id-jane' },
];

export const INITIAL_LOGS = [
    { id: 1, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'Admin User', action: 'Created Document', details: 'Invoice #INV-002 for Supplier B' },
    { id: 2, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), user: 'John Doe', action: 'Updated Status', details: 'PO #PO-001 to Confirmed' },
    { id: 3, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), user: 'Admin User', action: 'User Login', details: 'Admin User logged in' },
];
