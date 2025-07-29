import React, { useEffect, useState } from 'react';
import { getLoans } from '../services/googleSheetService';
import { Loan, LoanStatus } from '../types';
import { MZN_FORMATTER, DATE_FORMATTER, STATUS_COLORS } from '../constants';
import ChartComponent from '../components/ChartComponent';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const loansData = await getLoans();
                setLoans(loansData);
            } catch (error) {
                console.error("Failed to fetch loans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeLoans = loans.filter(loan => 
        [LoanStatus.Active, LoanStatus.Approved, LoanStatus.Overdue].includes(loan.status)
    );
    
    const activeLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);

    const interestEarned = loans.reduce((loanSum, loan) => 
        loanSum + (loan.payments?.reduce((paymentSum, p) => paymentSum + (p.interest || 0), 0) || 0), 0);

    const latePayments = loans.reduce((loanSum, loan) =>
        loanSum + (loan.payments?.filter(p => p.status === 'late').length || 0), 0);
    
    const kpis = [
        { title: 'Total Loans', value: loans.length, icon: 'fa-coins', color: 'blue' },
        { title: 'Active Loan Amount', value: `${MZN_FORMATTER.format(activeLoanAmount)} MZN`, icon: 'fa-money-bill-alt', color: 'green' },
        { title: 'Interest Earned', value: `${MZN_FORMATTER.format(interestEarned)} MZN`, icon: 'fa-chart-pie', color: 'yellow' },
        { title: 'Late Payments', value: latePayments, icon: 'fa-exclamation-triangle', color: 'red' },
    ];
    
    const kpiColorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    };
    
    const loanStatusDistribution = loans.reduce((acc, loan) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const distributionChartData = {
        labels: Object.keys(loanStatusDistribution).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [{
            data: Object.values(loanStatusDistribution),
            backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280'],
            borderWidth: 0,
        }]
    };
    
    const monthlyPerformanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            { label: 'New Loans', data: [5, 7, 4, 6, 8, 3], backgroundColor: '#4F46E5' },
            { label: 'Interest Earned (k MZN)', data: [2, 3.2, 2.8, 3.6, 4.5, 2].map(v => v * 1000), backgroundColor: '#10B981' }
        ]
    };
    
    const recentLoans = [...loans].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    if (loading) {
        return <div className="text-center p-8">Loading Dashboard...</div>;
    }

    return (
        <div className="fade-in space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {kpis.map(kpi => (
                    <div key={kpi.title} className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full ${kpiColorClasses[kpi.color as keyof typeof kpiColorClasses]}`}>
                                <i className={`fas ${kpi.icon}`}></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{kpi.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                    <h3 className="p-4 border-b border-gray-200 dark:border-dark-border text-lg font-medium text-gray-800 dark:text-gray-200">Loan Distribution</h3>
                    <div className="p-4">
                        <ChartComponent type="pie" data={distributionChartData} height={250} />
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                    <h3 className="p-4 border-b border-gray-200 dark:border-dark-border text-lg font-medium text-gray-800 dark:text-gray-200">Monthly Performance</h3>
                    <div className="p-4">
                        <ChartComponent type="bar" data={monthlyPerformanceData} height={250} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Recent Loans</h3>
                    <Link to="/loan-management" className="text-sm text-primary hover:text-secondary dark:text-blue-400 dark:hover:text-blue-300">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Borrower</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                            {recentLoans.length > 0 ? recentLoans.map(loan => (
                                <tr key={loan.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{loan.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{loan.borrower}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{MZN_FORMATTER.format(loan.amount)} MZN</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[loan.status]}`}>
                                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{DATE_FORMATTER.format(new Date(loan.date))}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No loans found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;