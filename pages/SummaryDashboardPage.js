import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Status } from '../types.js';
import * as sheetService from '../services/googleSheetService.js';
import { Icon } from '../components/Icon.js';

function StatCard({ icon, label, value, colorClass }) {
    return React.createElement('div', { className: "bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5" },
        React.createElement('div', { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}` },
            React.createElement(Icon, { name: icon, className: "text-2xl" })
        ),
        React.createElement('div', null,
            React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400 font-medium" }, label),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, value)
        )
    );
}

function ChartCard({ title, children }) {
    return React.createElement('div', { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full" },
        React.createElement('h3', { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4" }, title),
        React.createElement('div', { className: "h-64 flex items-center justify-center" }, children)
    );
}

export function SummaryDashboardPage() {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const statusChartRef = useRef(null);
    const typeChartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const docs = await sheetService.getDocuments();
                setDocuments(docs);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const total = documents.length;
        const due = documents.filter(d => d.status === Status.DUE).length;
        const pending = documents.filter(d => d.status === Status.PENDING).length;
        const paid = documents.filter(d => d.status === Status.PAID).length;
        return { total, due, pending, paid };
    }, [documents]);

    // Chart logic
    useEffect(() => {
        if (isLoading || documents.length === 0 || typeof Chart === 'undefined') return;

        const isDarkMode = document.documentElement.classList.contains('dark');
        const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        // --- Status Chart (Pie) ---
        const statusCtx = statusChartRef.current?.getContext('2d');
        let statusChart;
        if (statusCtx) {
            const statusCounts = documents.reduce((acc, doc) => {
                acc[doc.status] = (acc[doc.status] || 0) + 1;
                return acc;
            }, {});

            statusChart = new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{
                        data: Object.values(statusCounts),
                        backgroundColor: [
                            '#ef4444', // Due
                            '#f59e0b', // Pending
                            '#10b981', // Paid
                            '#3b82f6', // Sent
                            '#8b5cf6', // Accepted
                            '#22c55e', // Confirmed
                        ],
                        borderColor: isDarkMode ? '#1f2937' : '#ffffff',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor }
                        }
                    }
                }
            });
        }

        // --- Type Chart (Bar) ---
        const typeCtx = typeChartRef.current?.getContext('2d');
        let typeChart;
        if (typeCtx) {
            const typeCounts = documents.reduce((acc, doc) => {
                if (!acc[doc.documentType]) {
                    acc[doc.documentType] = { Inbound: 0, Outbound: 0 };
                }
                acc[doc.documentType][doc.flowDirection]++;
                return acc;
            }, {});
            
            const typeLabels = Object.keys(typeCounts);

            typeChart = new Chart(typeCtx, {
                type: 'bar',
                data: {
                    labels: typeLabels,
                    datasets: [
                        {
                            label: 'Inbound (Procurement)',
                            data: typeLabels.map(label => typeCounts[label].Inbound),
                            backgroundColor: '#3b82f6',
                        },
                        {
                            label: 'Outbound (Sales)',
                            data: typeLabels.map(label => typeCounts[label].Outbound),
                            backgroundColor: '#14b8a6',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { color: textColor, precision: 0 },
                            grid: { color: gridColor },
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: textColor }
                        }
                    }
                }
            });
        }
        
        return () => {
            if (statusChart) statusChart.destroy();
            if (typeChart) typeChart.destroy();
        };

    }, [documents, isLoading]);


    if (isLoading) {
        return React.createElement('div', { className: "text-center p-10" }, React.createElement(Icon, { name: "spinner", className: "animate-spin text-3xl text-primary-500" }));
    }
    
    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Dashboard"),
            
            React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
                React.createElement(StatCard, { icon: "file-alt", label: "Total Documents", value: stats.total, colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" }),
                React.createElement(StatCard, { icon: "check-double", label: "Items Paid", value: stats.paid, colorClass: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300" }),
                React.createElement(StatCard, { icon: "hourglass-half", label: "Items Pending", value: stats.pending, colorClass: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300" }),
                React.createElement(StatCard, { icon: "triangle-exclamation", label: "Items Due", value: stats.due, colorClass: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300" })
            ),

            React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-5 gap-6" },
                React.createElement('div', { className: "lg:col-span-2" },
                    React.createElement(ChartCard, { title: "Documents by Status" },
                        React.createElement('canvas', { ref: statusChartRef })
                    )
                ),
                 React.createElement('div', { className: "lg:col-span-3" },
                    React.createElement(ChartCard, { title: "Documents by Type & Flow" },
                        React.createElement('canvas', { ref: typeChartRef })
                    )
                )
            )
        )
    );
}
