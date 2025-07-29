
export const FlowDirection = {
    INBOUND: 'Inbound', // Procurement: we are buying
    OUTBOUND: 'Outbound', // Sales: we are selling
};

export const DocumentType = {
    REQUISITION: 'Requisition',
    QUOTE: 'Quote',
    PO: 'Purchase Order',
    INVOICE: 'Invoice'
};

export const Status = {
    WAITING_FOR_QUOTE: 'Waiting for Quote',
    WAITING_FOR_PO: 'Waiting for PO',
    WAITING_FOR_INVOICE: 'Waiting for Invoice',
    WAITING_FOR_PAYMENT: 'Waiting for Payment',
    PAID: 'Paid',
};

export const UserRole = {
    ADMIN: 'Admin',
    USER: 'User'
};

export const EntityType = {
    SUPPLIER: 'Supplier',
    CLIENT: 'Client',
};


// Interfaces and types are removed for plain JavaScript compatibility.
// The data structures are defined by their usage in googleSheetService.js.

// Placeholder exports to satisfy potential build tools or type checkers.
export const Document = undefined;
export const Log = undefined;
export const User = undefined;
export const CompanySettings = undefined;
export const Entity = undefined;
