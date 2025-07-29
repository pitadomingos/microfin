import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { MZN_FORMATTER, DATE_FORMATTER } from '../constants';
import LoanApplicationModal, { LoanApplicationData } from '../components/LoanApplicationModal';
import { saveLoan } from '../services/googleSheetService';

// Note: jsPDF is loaded from a CDN in index.html
declare const jspdf: any;


interface ScheduleItem {
    installment: number;
    dueDate: string;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}

const LoanSimulator: React.FC = () => {
    const { addToast } = useToast();
    const [amount, setAmount] = useState<number | string>(10000);
    const [term, setTerm] = useState<number>(2);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [results, setResults] = useState<{
        principal: number;
        interestRate: number;
        totalInterest: number;
        totalRepayment: number;
        schedule: ScheduleItem[];
    } | null>(null);

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount < 1000) {
            addToast('Please enter a valid loan amount of at least 1,000 MZN.', 'error');
            return;
        }

        const interestRate = numAmount < 10000 ? 40 : 30;
        const totalInterest = numAmount * (interestRate / 100);
        const totalRepayment = numAmount + totalInterest;

        const schedule: ScheduleItem[] = [];
        let remainingBalance = numAmount;
        const today = new Date();

        for (let i = 1; i <= term; i++) {
            const dueDate = new Date(today);
            dueDate.setMonth(dueDate.getMonth() + i);

            const principalPayment = numAmount / term;
            const interestPayment = totalInterest / term;
            remainingBalance -= principalPayment;
            
            schedule.push({
                installment: i,
                dueDate: DATE_FORMATTER.format(dueDate),
                payment: principalPayment + interestPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, remainingBalance),
            });
        }

        setResults({
            principal: numAmount,
            interestRate,
            totalInterest,
            totalRepayment,
            schedule,
        });
    };
    
    const handleDownloadPdf = () => {
        if (!results) {
            addToast('Please calculate a simulation first.', 'warning');
            return;
        }
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Loan Simulation Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
        
        doc.setFontSize(12);
        doc.text("Summary:", 14, 40);
        doc.setFontSize(10);
        doc.text(`Principal Amount: ${MZN_FORMATTER.format(results.principal)} MZN`, 14, 46);
        doc.text(`Interest Rate: ${results.interestRate}%`, 14, 52);
        doc.text(`Loan Term: ${term} Installments`, 14, 58);
        doc.text(`Total Interest: ${MZN_FORMATTER.format(results.totalInterest)} MZN`, 14, 64);
        doc.text(`Total Repayment: ${MZN_FORMATTER.format(results.totalRepayment)} MZN`, 14, 70);

        doc.setFontSize(12);
        doc.text("Payment Schedule:", 14, 82);
        doc.autoTable({
            startY: 85,
            head: [['No.', 'Due Date', 'Payment (MZN)', 'Principal (MZN)', 'Interest (MZN)', 'Balance (MZN)']],
            body: results.schedule.map(item => [
                item.installment,
                item.dueDate,
                MZN_FORMATTER.format(item.payment),
                MZN_FORMATTER.format(item.principal),
                MZN_FORMATTER.format(item.interest),
                MZN_FORMATTER.format(item.balance)
            ]),
        });

        doc.save(`Loan_Simulation_${results.principal}_MZN.pdf`);
        addToast('PDF downloaded successfully!', 'success');
    };

    const handleApplyForLoan = () => {
        if (!results) {
            addToast('Please calculate a simulation first.', 'warning');
            return;
        }
        setIsModalOpen(true);
    };

    const handleSaveLoan = async (data: LoanApplicationData) => {
        try {
            await saveLoan(data);
            addToast('Loan application submitted successfully!', 'success');
            setIsModalOpen(false);
        } catch (error) {
            addToast('Failed to submit loan application.', 'error');
            console.error(error);
        }
    };


    const resultCards = results ? [
        { title: 'Principal Amount', value: `${MZN_FORMATTER.format(results.principal)} MZN`},
        { title: 'Interest Rate', value: `${results.interestRate}%`},
        { title: 'Total Interest', value: `${MZN_FORMATTER.format(results.totalInterest)} MZN`},
        { title: 'Total Repayment', value: `${MZN_FORMATTER.format(results.totalRepayment)} MZN`},
    ] : [];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Loan Simulator</h3>
                <form onSubmit={handleCalculate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount (MZN)</label>
                            <input type="number" id="loan-amount" value={amount} onChange={e => setAmount(e.target.value)} min="1000" placeholder="Enter amount" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-base focus:outline-none focus:ring-primary focus:border-primary dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="loan-term" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Term</label>
                            <select id="loan-term" value={term} onChange={e => setTerm(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-base focus:outline-none focus:ring-primary focus:border-primary dark:text-white">
                                <option value="2">2 Installments</option>
                                <option value="3">3 Installments</option>
                                <option value="6">6 Installments</option>
                                <option value="12">12 Installments</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate Rules:</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>0 - 9,999 MZN: 40% interest</li>
                            <li>10,000+ MZN: 30% interest</li>
                        </ul>
                    </div>
                    <div>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Calculate
                        </button>
                    </div>
                </form>
            </div>

            {results && (
                <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 fade-in">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Simulation Results</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {resultCards.map(card => (
                            <div key={card.title} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{card.value}</p>
                            </div>
                        ))}
                    </div>
                    
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Payment Schedule</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    {['No.', 'Due Date', 'Payment', 'Principal', 'Interest', 'Balance'].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                                {results.schedule.map(item => (
                                    <tr key={item.installment}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{item.installment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.dueDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(item.payment)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(item.principal)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(item.interest)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(item.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button onClick={handleApplyForLoan} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Apply for This Loan</button>
                        <button onClick={handleDownloadPdf} className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Download PDF</button>
                    </div>
                </div>
            )}
            {results && (
                 <LoanApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveLoan}
                    initialData={{ amount: results.principal, term: term }}
                />
            )}
        </div>
    );
};

export default LoanSimulator;