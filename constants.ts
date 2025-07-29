
import { LoanStatus, UserRole } from './types';

export const ROLES = Object.values(UserRole);
export const LOAN_STATUSES = Object.values(LoanStatus);

export const STATUS_COLORS: { [key in LoanStatus]: string } = {
  [LoanStatus.Approved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [LoanStatus.Active]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [LoanStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [LoanStatus.Overdue]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [LoanStatus.Completed]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [LoanStatus.Rejected]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export const PAYMENT_STATUS_COLORS: { [key: string]: string } = {
    'paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'late': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const MZN_FORMATTER = new Intl.NumberFormat('pt-MZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
