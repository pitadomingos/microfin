

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
    SENT: 'Waiting for Quote',
    CONFIRMED: 'Waiting for Purchase Order',
    PAID: 'Paid',
    ACCEPTED: 'Waiting for Invoice',
    PENDING: 'Waiting for Payment',
    CANCELED: 'Cancelled'
};

export const UserRole = {
    ADMIN: 'Admin',
    USER: 'User'
};

export const EntityType = {
    SUPPLIER: 'Supplier',
    CLIENT: 'Client',
};

// Placeholder exports to satisfy TypeScript imports. These are only used for type annotations
// and will be erased at compile time. Exporting 'undefined' makes them of type 'any'.
export const Document = undefined;
export const Log = undefined;
export const User = undefined;
export const CompanySettings = undefined;
export const Entity = undefined;
