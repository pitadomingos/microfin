
import React, { useState, useEffect } from 'react';
import { getLoans, getUsers } from '../services/googleSheetService';
import { generateAIReportPage } from '../services/geminiService';
import { Loan, User, AIReportPageData } from '../types';
import { useToast } from '../context/ToastContext';
import ChartComponent from '../components/ChartComponent';

const AIReport: React.FC = () => {
    const [allLoans, setAllLoans] = useState<Loan[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [report, setReport] = useState<AIReportPageData | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [loansData, usersData] = await Promise.all([getLoans(), getUsers()]);
                setAllLoans(loansData);
                setAllUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch data", error);
                addToast('Failed to load initial data.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [addToast]);
    
    useEffect(() => {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        let startDate = new Date();

        switch(period) {
            case 'month':
                startDate.setDate(today.getDate() - 30);
                break;
            case 'quarter':
                startDate.setDate(today.getDate() - 90);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case 'all':
                setCustomStart('');
                setCustomEnd('');
                return;
        }
        if (period !== 'custom') {
           setCustomStart(startDate.toISOString().split('T')[0]);
           setCustomEnd(endDate);
        }
    }, [period]);

    const handleGenerateReport = async () => {
        setIsReportLoading(true);
        setReport(null);
        
        let filteredLoans = allLoans;
        if (period !== 'all') {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            if (!customStart || !customEnd || start > end) {
                addToast('Please select a valid custom date range.', 'error');
                setIsReportLoading(false);
                return;
            }
            end.setHours(23, 59, 59, 999); // Include the whole end day

            filteredLoans = allLoans.filter(loan => {
                const loanDate = new Date(loan.date);
                return loanDate >= start && loanDate <= end;
            });
        }
        
        if (filteredLoans.length === 0) {
            addToast('No loan data found for the selected period.', 'warning');
            setIsReportLoading(false);
            return;
        }

        try {
            const periodLabel = period === 'custom' ? `${customStart} to ${customEnd}` : `Last ${period}`;
            const reportData = await generateAIReportPage(filteredLoans, allUsers, periodLabel);
            setReport(reportData);
            addToast('Report generated successfully!', 'success');
        } catch (error) {
            console.error(error);
            addToast("Failed to generate AI report. Check the API key and try again.", "error");
        } finally {
            setIsReportLoading(false);
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">Loading Page Data...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">AI-Powered Report Generator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select a period and generate an in-depth financial analysis using Gemini.</p>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
                        <select value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md">
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">Last 90 Days</option>
                            <option value="year">Last Year</option>
                            <option value="all">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                     {period === 'custom' && (
                        <>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                           <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md"/>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                           <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md"/>
                        </div>
                        </>
                    )}
                    <div className={period === 'custom' ? '' : 'md:col-start-4'}>
                        <button onClick={handleGenerateReport} disabled={isReportLoading} className="w-full px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-secondary flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                            {isReportLoading ? (
                                <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Generating...</>
                            ) : (
                                <><i className="fas fa-magic"></i> Generate Report</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Display Area */}
            {isReportLoading && !report && (
                 <div className="text-center p-8 bg-white dark:bg-dark-card rounded-lg shadow">
                    <div className="animate-spin h-8 w-8 text-primary mx-auto mb-4"></div>
                    <p>Generating report with Gemini... this may take a moment.</p>
                </div>
            )}
            
            {report && (
                <div className="space-y-6 fade-in">
                    <div className="prose prose-sm dark:prose-invert max-w-none p-6 bg-white dark:bg-dark-card rounded-lg shadow">
                        <h4 className="text-lg font-bold">AI Financial Summary</h4>
                        <div dangerouslySetInnerHTML={{ __html: report.summary.replace(/\n/g, '<br />') }} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                            <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Loan Status by Purpose</h3>
                            <ChartComponent type="bar" data={report.chart1} options={{ scales: { x: { stacked: true }, y: { stacked: true } } }} />
                        </div>
                         <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                            <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">New Loans vs. Repayments</h3>
                            <ChartComponent type="line" data={report.chart2} />
                        </div>
                    </div>
                </div>
            )}

            {!isReportLoading && !report && (
                 <div className="text-center p-8 bg-white dark:bg-dark-card rounded-lg shadow">
                    <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
                    <h4 className="font-bold">Your report will appear here</h4>
                    <p className="text-sm text-gray-500">Select a period and click "Generate Report" to begin.</p>
                </div>
            )}
        </div>
    );
};

export default AIReport;
