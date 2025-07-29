
export enum UserRole {
  Admin = 'admin',
  Officer = 'officer',
  Borrower = 'borrower',
}

export enum UserStatus {
    Active = 'active',
    Inactive = 'inactive',
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}

export enum LoanStatus {
    Pending = 'pending',
    Approved = 'approved',
    Active = 'active',
    Overdue = 'overdue',
    Completed = 'completed',
    Rejected = 'rejected',
}

export interface Payment {
    date: string;
    amount: number;
    principal: number;
    interest: number;
    status: 'paid' | 'late' | 'pending';
    penalty?: number;
}

export interface Loan {
    id: string;
    borrower: string;
    borrowerId: number;
    amount: number;
    interestRate: number;
    term: number; // in installments
    status: LoanStatus;
    date: string;
    purpose: string;
    payments: Payment[];
    documents: string[];
}

export interface Log {
    timestamp: string;
    user: string;
    action: string;
    details: string;
    ip: string;
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    isLoading?: boolean;
}

export interface AIReportData {
    summary: string;
    positiveTrends: { trend: string; evidence: string }[];
    risks: { risk: string; evidence: string }[];
    recommendations: string[];
}

// Types for the new AI Report Page
export interface AIReportChart1Data {
    labels: string[]; // Loan purposes
    datasets: {
        label: string; // Loan status (e.g., 'Active', 'Overdue')
        data: number[];
        backgroundColor: string;
    }[];
}

export interface AIReportChart2Data {
    labels: string[]; // Dates/Months
    datasets: [
        {
            label: 'New Loans Disbursed';
            data: number[];
            borderColor: string;
            backgroundColor: string;
        },
        {
            label: 'Repayments Received';
            data: number[];
            borderColor: string;
            backgroundColor: string;
        }
    ];
}

export interface AIReportPageData {
    summary: string;
    chart1: AIReportChart1Data;
    chart2: AIReportChart2Data;
}
