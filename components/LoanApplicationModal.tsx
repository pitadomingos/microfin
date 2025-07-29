import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { User, UserRole } from '../types';
import { getUsers } from '../services/googleSheetService';

export interface LoanApplicationData {
    borrowerId: number;
    borrower: string;
    amount: number;
    term: number;
    purpose: string;
}

interface LoanApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: LoanApplicationData) => Promise<void>;
    initialData?: { amount: number; term: number };
}

const LoanApplicationModal: React.FC<LoanApplicationModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({ borrowerId: '', amount: '', term: '2', purpose: 'Business Expansion' });
    const [borrowers, setBorrowers] = useState<User[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            // Reset form and set initial data when modal opens
            setFormData({
                borrowerId: '',
                amount: initialData?.amount.toString() || '',
                term: initialData?.term.toString() || '2',
                purpose: 'Business Expansion'
            });
            
            // Fetch borrower list
            getUsers().then(allUsers => {
                setBorrowers(allUsers.filter(u => u.role === UserRole.Borrower));
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const selectedBorrower = borrowers.find(b => b.id === Number(formData.borrowerId));

        if (!selectedBorrower) {
            addToast('Please select a borrower.', 'error');
            return;
        }

        if (Number(formData.amount) < 1000) {
            addToast('Loan amount must be at least 1,000 MZN.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                borrowerId: selectedBorrower.id,
                borrower: selectedBorrower.name,
                amount: Number(formData.amount),
                term: Number(formData.term),
                purpose: formData.purpose
            });
        } catch (error) {
            // Error is handled by the calling component's toast
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Loan Application">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Borrower</label>
                    <select name="borrowerId" value={formData.borrowerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required>
                        <option value="">Select a borrower</option>
                        {borrowers.map(b => <option key={b.id} value={b.id}>{b.name} (ID: {b.id})</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount (MZN)</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" min="1000" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Term</label>
                        <select name="term" value={formData.term} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required>
                            <option value="2">2 Installments</option>
                            <option value="3">3 Installments</option>
                            <option value="6">6 Installments</option>
                            <option value="12">12 Installments</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Purpose</label>
                    <select name="purpose" value={formData.purpose} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required>
                        <option>Business Expansion</option>
                        <option>Education</option>
                        <option>Medical</option>
                        <option>Personal Use</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary disabled:bg-indigo-400">
                        {isSaving ? 'Saving...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoanApplicationModal;
