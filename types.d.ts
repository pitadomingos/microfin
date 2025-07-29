
export declare enum FlowDirection {
    INBOUND = "Inbound",
    OUTBOUND = "Outbound"
}
export declare enum DocumentType {
    REQUISITION = "Requisition",
    QUOTE = "Quote",
    PO = "Purchase Order",
    INVOICE = "Invoice"
}
export const Status = {
    SENT: 'Waiting for Quote',
    CONFIRMED: 'Waiting for Purchase Order',
    PAID: 'Paid',
    ACCEPTED: 'Waiting for Invoice',
    PENDING: 'Waiting for Payment',
    CANCELED: 'Cancelled'
};
export declare enum UserRole {
    ADMIN = "Admin",
    USER = "User"
}
export declare enum EntityType {
    SUPPLIER = "Supplier",
    CLIENT = "Client"
}
export interface Document {
    id: number;
    dateIssued: string;
    supplierName: string;
    documentType: DocumentType;
    documentNumber: string;
    relatedQuote: string;
    relatedPO: string;
    relatedInvoice: string;
    status: Status;
    notes: string;
    flowDirection: FlowDirection;
}
export interface Log {
    id: number;
    timestamp: string;
    user: string;
    action: string;
    details: string;
}
export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    googleId: string;
    imageUrl: string;
}
export interface CompanySettings {
    [key: string]: string | undefined;
    appLogoUrl?: string;
    companyLogoUrl?: string;
}
export interface Entity {
    id: number;
    name: string;
    type: EntityType;
}
