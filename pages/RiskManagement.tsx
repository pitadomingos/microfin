
import React, { useState, useEffect } from 'react';
import ChartComponent from '../components/ChartComponent';
import { MZN_FORMATTER } from '../constants';
import { generateItemAnalysis } from '../services/geminiService';
import { useToast } from '../context/ToastContext';

const highRiskBorrowers = [
    { name: 'Carlos Moreira', riskScore: 78, activeLoans: 2, latePayments: 3, outstanding: 18500 },
    { name: 'Ana Ferreira', riskScore: 72, activeLoans: 1, latePayments: 2, outstanding: 9200 },
];

const kpiData = [
    { title: 'Portfolio at Risk', value: '8.3%', color: 'red', benchmark: '< 5%', data: { value: '8.3%', benchmark: '5%' } },
    { title: 'Loan Loss Rate', value: '2.1%', color: 'yellow', benchmark: '< 3%', data: { value: '2.1%', benchmark: '3%' } },
    { title: 'Risk Reserve', value: '75,000 MZN', color: 'green', benchmark: 'Coverage: 2.8x', data: { value: '75,000 MZN', coverage: '2.8x' } },
];

const kpiColorClasses = {
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400',
};

const delinquencyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        { label: 'Delinquency Rate (%)', data: [6.2, 7.1, 5.8, 7.5, 8.3, 7.9], borderColor: '#EF4444', tension: 0.3, fill: true, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
        { label: 'Target Rate (%)', data: [5, 5, 5, 5, 5, 5], borderColor: '#10B981', borderDash: [5, 5], fill: false }
    ]
};

const riskScoreChartData = {
    labels: ['Very Low (0-20)', 'Low (21-40)', 'Medium (41-60)', 'High (61-80)', 'Very High (81-100)'],
    datasets: [{
        label: 'Borrowers', data: [25, 42, 18, 10, 5],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#FB7185', '#EF4444'],
    }]
};

const AIAnalysisCard: React.FC<{ isLoading: boolean; explanation: string; title: string }> = ({ isLoading, explanation, title }) => (
    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <i className="fas fa-magic"></i>
            {title}
        </h4>
        {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                <span>Generating...</span>
            </div>
        ) : (
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">{explanation}</p>
        )}
    </div>
);

const RiskManagement: React.FC = () => {
    const { addToast } = useToast();
    const [analyses, setAnalyses] = useState<Record<string, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const itemsToAnalyze = [
            { key: 'delinquency', name: 'Delinquency Rate', data: delinquencyChartData },
            { key: 'riskScore', name: 'Risk Score Distribution', data: riskScoreChartData },
            { key: 'par', name: 'Portfolio at Risk', data: kpiData[0].data },
            { key: 'loanLoss', name: 'Loan Loss Rate', data: kpiData[1].data },
            { key: 'riskReserve', name: 'Risk Reserve', data: kpiData[2].data },
        ];

        const fetchAnalyses = async () => {
            setLoadingStates(itemsToAnalyze.reduce((acc, item) => ({...acc, [item.key]: true }), {}));
            
            for (const item of itemsToAnalyze) {
                try {
                    const explanation = await generateItemAnalysis(item.name, item.data);
                    setAnalyses(prev => ({ ...prev, [item.key]: explanation }));
                } catch (error) {
                    console.error(error);
                    addToast(`Could not load AI analysis for ${item.name}.`, "error");
                    setAnalyses(prev => ({...prev, [item.key]: "Failed to load analysis."}));
                } finally {
                    setLoadingStates(prev => ({ ...prev, [item.key]: false }));
                }
            }
        };

        fetchAnalyses();
    }, [addToast]);
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Risk Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyze and manage risk factors</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Delinquency Rate</h3>
                    <ChartComponent type="line" data={delinquencyChartData} />
                    <AIAnalysisCard isLoading={loadingStates['delinquency']} explanation={analyses['delinquency'] || ''} title="AI Analysis & Recommendation" />
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Risk Score Distribution</h3>
                    <ChartComponent type="bar" data={riskScoreChartData} options={{plugins: {legend: {display: false}}}} />
                    <AIAnalysisCard isLoading={loadingStates['riskScore']} explanation={analyses['riskScore'] || ''} title="AI Analysis & Recommendation" />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border"><h3 className="font-bold">High Risk Borrowers</h3></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['Borrower', 'Risk Score', 'Active Loans', 'Late Payments', 'Outstanding', 'Action'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                            {highRiskBorrowers.map(b => (
                                <tr key={b.name}>
                                    <td className="px-6 py-4">{b.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">High ({b.riskScore}/100)</span></td>
                                    <td className="px-6 py-4">{b.activeLoans}</td>
                                    <td className="px-6 py-4">{b.latePayments}</td>
                                    <td className="px-6 py-4">{MZN_FORMATTER.format(b.outstanding)} MZN</td>
                                    <td className="px-6 py-4"><button className="text-primary hover:text-secondary">View Details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpiData.map((kpi, index) => {
                    const key = ['par', 'loanLoss', 'riskReserve'][index];
                    return (
                         <div key={kpi.title} className="bg-white dark:bg-dark-card rounded-lg shadow p-4 flex flex-col">
                            <div className="text-center flex-grow">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">{kpi.title}</h4>
                                <div className={`text-3xl font-bold my-2 ${kpiColorClasses[kpi.color as keyof typeof kpiColorClasses]}`}>{kpi.value}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Benchmark: {kpi.benchmark}</p>
                            </div>
                            <AIAnalysisCard isLoading={loadingStates[key]} explanation={analyses[key] || ''} title="AI Analysis & Recommendation" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RiskManagement;
