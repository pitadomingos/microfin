
import React, { useState, useEffect, useMemo } from 'react';
import ChartComponent from '../components/ChartComponent';
import { getLoans } from '../services/googleSheetService';
import { Loan } from '../types';

const FinancialAnalysis: React.FC = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const loansData = await getLoans();
                setLoans(loansData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = useMemo(() => {
        if (loans.length === 0) return null;

        // Revenue Breakdown Chart
        const interestIncome = loans.reduce((acc, loan) => acc + (loan.payments?.reduce((pAcc, p) => pAcc + p.interest, 0) || 0), 0);
        const penaltyFees = loans.reduce((acc, loan) => acc + (loan.payments?.reduce((pAcc, p) => pAcc + (p.penalty || 0), 0) || 0), 0);
        const revenueChartData = {
            labels: ['Interest Income', 'Penalty Fees'],
            datasets: [{ data: [interestIncome, penaltyFees], backgroundColor: ['#4F46E5', '#F59E0B'] }]
        };

        // Loan Performance Chart
        const performanceChartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                { label: 'Disbursed (k MZN)', data: [65, 89, 75, 82, 96, 78], borderColor: '#4F46E5', tension: 0.3, fill: true, backgroundColor: 'rgba(79, 70, 229, 0.1)' },
                { label: 'Repayments (k MZN)', data: [48, 56, 62, 70, 84, 66], borderColor: '#10B981', tension: 0.3, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }
            ]
        };
        
        // Loan Purpose Distribution
        const purposeCounts = loans.reduce((acc, loan) => {
            acc[loan.purpose] = (acc[loan.purpose] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const purposeChartData = {
            labels: Object.keys(purposeCounts),
            datasets: [{ data: Object.values(purposeCounts), backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6B7280'] }]
        };

        // Profitability Chart (Mock data for now)
        const profitabilityChartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Profit (k MZN)',
                data: [15, 22, 18, 25, 30, 19],
                backgroundColor: '#3B82F6'
            }]
        };

        return { revenueChartData, performanceChartData, purposeChartData, profitabilityChartData };

    }, [loans]);

    if (loading) return <div className="text-center p-8">Loading Financial Data...</div>;
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Financial Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track business performance and financial metrics</p>
            </div>

            {chartData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Revenue Breakdown</h3>
                        <ChartComponent type="doughnut" data={chartData.revenueChartData} />
                    </div>
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Loan Performance (Disbursed vs Repaid)</h3>
                        <ChartComponent type="line" data={chartData.performanceChartData} />
                    </div>
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Loan Purpose Distribution</h3>
                        <ChartComponent type="pie" data={chartData.purposeChartData} />
                    </div>
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Monthly Profitability</h3>
                        <ChartComponent type="bar" data={chartData.profitabilityChartData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialAnalysis;
