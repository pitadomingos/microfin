import React, { useState, useEffect, useMemo } from 'react';
import { getLoans, saveLoan } from '../services/googleSheetService';
import { Loan, LoanStatus } from '../types';
import { MZN_FORMATTER, DATE_FORMATTER, STATUS_COLORS } from '../constants';
import LoanApplicationModal, { LoanApplicationData } from '../components/LoanApplicationModal';
import { useToast } from '../context/ToastContext';

const LoanManagement: React.FC = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'all', date: 'all', search: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const data = await getLoans();
            setLoans(data);
        } catch (error) {
            console.error("Failed to fetch loans", error);
            addToast("Failed to fetch loans", "error");
        } finally {
            setLoading(false);
        }
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const statusMatch = filters.status === 'all' || loan.status === filters.status;
            const searchMatch = filters.search === '' ||
                loan.borrower.toLowerCase().includes(filters.search.toLowerCase()) ||
                loan.id.toLowerCase().includes(filters.search.toLowerCase());
            // Date filter logic would be more complex in a real app
            const dateMatch = true;
            return statusMatch && searchMatch && dateMatch;
        });
    }, [loans, filters]);

    const handleNewApplication = () => {
        setIsModalOpen(true);
    };

    const handleSaveLoan = async (data: LoanApplicationData) => {
        try {
            await saveLoan(data);
            addToast('Loan application submitted successfully!', 'success');
            setIsModalOpen(false);
            fetchLoans(); // Refresh the list
        } catch (error) {
            addToast('Failed to submit loan application.', 'error');
            console.error(error);
        }
    };


    if (loading) {
        return <div className="text-center p-8">Loading Loans...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Loan Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage all loans and applications</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleNewApplication} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        New Application
                    </button>
                    <button onClick={fetchLoans} className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                        <i className="fas fa-sync-alt mr-1"></i> Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                    <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Filter Loans</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md shadow-sm">
                        <option value="all">All Statuses</option>
                        {Object.values(LoanStatus).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <select name="date" value={filters.date} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md shadow-sm">
                        <option value="all">All Time</option>
                    </select>
                    <input type="text" name="search" placeholder="Search by ID or borrower..." value={filters.search} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md shadow-sm" />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['ID', 'Borrower', 'Amount', 'Interest', 'Term', 'Status', 'Date', 'Action'].map(h =>
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                            {filteredLoans.map(loan => (
                                <tr key={loan.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{loan.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{loan.borrower}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(loan.amount)} MZN</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{loan.interestRate}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{loan.term} inst.</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[loan.status]}`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{DATE_FORMATTER.format(new Date(loan.date))}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="text-primary hover:text-secondary dark:text-blue-400 dark:hover:text-blue-300">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium">{filteredLoans.length}</span> of <span className="font-medium">{loans.length}</span> loans
                    </div>
                </div>
            </div>
            <LoanApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveLoan}
            />
        </div>
    );
};

export default LoanManagement;