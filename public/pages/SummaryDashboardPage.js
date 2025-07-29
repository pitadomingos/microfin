
import React, { useEffect, useState, useMemo, useRef } from 'react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Status, DocumentType, FlowDirection } from '../types.js';
import * as sheetService from '../services/googleSheetService.js';
import { Icon } from '../components/Icon.js';

// Register the datalabels plugin
window.Chart.register(ChartDataLabels);

const StatCard = ({ icon, label, value, colorClass }) => (
    React.createElement('div', { className: "bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5" },
        React.createElement('div', { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}` },
            React.createElement(Icon, { name: icon, className: "text-2xl" })
        ),
        React.createElement('div', null,
            React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400 font-medium" }, label),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, value)
        )
    )
);

const ChartCard = ({ title, children }) => (
    React.createElement('div', { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full" },
        React.createElement('h3', { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4" }, title),
        React.createElement('div', { className: "h-64 flex items-center justify-center" }, children)
    )
);

const CashFlowForecast = ({ documents }) => {
    const forecast = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const addDays = (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        };

        const periods = {
            'Next 7 Days': { start: today, end: addDays(today, 7), inbound: 0, outbound: 0 },
            'Next 30 Days': { start: today, end: addDays(today, 30), inbound: 0, outbound: 0 },
            'Next 90 Days': { start: today, end: addDays(today, 90), inbound: 0, outbound: 0 },
        };

        documents.forEach(doc => {
            if (doc.status === Status.WAITING_FOR_PAYMENT && doc.dueDate && doc.amount) {
                const dueDate = new Date(doc.dueDate);
                if (isNaN(dueDate.getTime())) return;

                for (const periodName in periods) {
                    const period = periods[periodName];
                    if (dueDate >= period.start && dueDate < period.end) {
                        if (doc.flowDirection === FlowDirection.INBOUND) {
                            period.outbound += doc.amount; // Inbound flow means we are paying (outbound cash)
                        } else {
                            period.inbound += doc.amount; // Outbound flow means we are getting paid (inbound cash)
                        }
                    }
                }
            }
        });

        return Object.entries(periods).map(([name, values]) => ({ name, ...values }));
    }, [documents]);
    
    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        React.createElement('div', { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full" },
            React.createElement('h3', { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4" }, "Cash Flow Forecast"),
            React.createElement('div', { className: "space-y-4" },
                forecast.map(period => (
                    React.createElement('div', { key: period.name, className: 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg' },
                        React.createElement('h4', { className: 'font-semibold text-gray-700 dark:text-gray-300' }, period.name),
                        React.createElement('div', { className: 'flex justify-between items-center mt-2 text-sm' },
                             React.createElement('span', { className: 'text-green-600 dark:text-green-400' }, 'Inbound (Receivables):'),
                             React.createElement('span', { className: 'font-mono' }, formatCurrency(period.inbound))
                        ),
                        React.createElement('div', { className: 'flex justify-between items-center mt-1 text-sm' },
                             React.createElement('span', { className: 'text-red-600 dark:text-red-400' }, 'Outbound (Payables):'),
                             React.createElement('span', { className: 'font-mono' }, formatCurrency(period.outbound))
                        )
                    ))
                ))
        )
    );
};

const STATUS_CHART_COLORS = {
    [Status.WAITING_FOR_QUOTE]: '#f59e0b',
    [Status.WAITING_FOR_PO]: '#8b5cf6',
    [Status.WAITING_FOR_INVOICE]: '#3b82f6',
    [Status.WAITING_FOR_PAYMENT]: '#ef4444',
    [Status.PAID]: '#10b981',
};

export const SummaryDashboardPage = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const statusChartRef = useRef(null);
    const purchaseChartRef = useRef(null);
    const salesChartRef = useRef(null);

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
        return documents.reduce((acc, doc) => {
            if (doc.status === Status.WAITING_FOR_QUOTE) acc.waitingForQuote++;
            if (doc.status === Status.WAITING_FOR_PO) acc.waitingForPO++;
            if (doc.status === Status.WAITING_FOR_INVOICE) acc.waitingForInvoice++;
            if (doc.status === Status.WAITING_FOR_PAYMENT) acc.waitingForPayment++;
            return acc;
        }, { total: documents.length, waitingForQuote: 0, waitingForPO: 0, waitingForInvoice: 0, waitingForPayment: 0 });
    }, [documents]);

    useEffect(() => {
        if (isLoading || documents.length === 0 || typeof window.Chart === 'undefined') return;

        let statusChart, purchaseChart, salesChart;

        const createCharts = () => {
            if (statusChart) statusChart.destroy();
            if (purchaseChart) purchaseChart.destroy();
            if (salesChart) salesChart.destroy();

            const isDarkMode = document.documentElement.classList.contains('dark');
            const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

            const dataLabelsConfig = {
                color: '#fff',
                font: { weight: 'bold', size: 14 },
                formatter: (value) => (value > 0 ? value : ''),
            };
            const barDataLabelsConfig = { ...dataLabelsConfig, color: textColor, anchor: 'end', align: 'end' };

            // --- Status Chart (Pie) ---
            const statusCtx = statusChartRef.current?.getContext('2d');
            if (statusCtx) {
                const statusCounts = documents.reduce((acc, doc) => {
                    acc[doc.status] = (acc[doc.status] || 0) + 1;
                    return acc;
                }, {});
                
                const orderedStatuses = Object.values(Status);
                const statusLabels = orderedStatuses.filter(status => statusCounts[status] > 0);
                const statusData = statusLabels.map(status => statusCounts[status]);
                const statusColors = statusLabels.map(status => STATUS_CHART_COLORS[status] || '#9ca3af');

                statusChart = new window.Chart(statusCtx, {
                    type: 'pie',
                    data: { labels: statusLabels, datasets: [{ data: statusData, backgroundColor: statusColors, borderColor: isDarkMode ? '#1f2937' : '#ffffff', borderWidth: 2 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } }, datalabels: dataLabelsConfig }}
                });
            }

            // --- Bar Charts (Purchase/Sales) ---
            const createBarChart = (canvasRef, flow, color) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (!ctx) return null;

                const flowDocs = documents.filter(d => d.flowDirection === flow);
                const typeCounts = flowDocs.reduce((acc, doc) => {
                    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
                    return acc;
                }, {});
                
                const orderedDocTypes = Object.values(DocumentType);
                const typeLabels = orderedDocTypes.filter(type => typeCounts[type]);

                return new window.Chart(ctx, {
                    type: 'bar',
                    data: { labels: typeLabels, datasets: [{ label: flow, data: typeLabels.map(l => typeCounts[l]), backgroundColor: color }] },
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: textColor }, grid: { color: 'transparent' }}, x: { beginAtZero: true, ticks: { color: textColor, precision: 0 }, grid: { color: gridColor }}}, plugins: { legend: { display: false }, datalabels: barDataLabelsConfig }}
                });
            };
            purchaseChart = createBarChart(purchaseChartRef, FlowDirection.INBOUND, '#3b82f6');
            salesChart = createBarChart(salesChartRef, FlowDirection.OUTBOUND, '#14b8a6');
        };

        createCharts();
        
        const themeObserver = new MutationObserver((mutations) => {
            if (mutations.some(m => m.attributeName === 'class')) createCharts();
        });
        themeObserver.observe(document.documentElement, { attributes: true });

        return () => {
            themeObserver.disconnect();
            if (statusChart) statusChart.destroy();
            if (purchaseChart) purchaseChart.destroy();
            if (salesChart) salesChart.destroy();
        };

    }, [documents, isLoading]);


    if (isLoading) {
        return React.createElement('div', { className: "text-center p-10" }, React.createElement(Icon, { name: "spinner", className: "animate-spin text-3xl text-primary-500" }));
    }
    
    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Dashboard"),
            
            React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
                React.createElement(StatCard, { icon: "file-signature", label: "Waiting for Quote", value: stats.waitingForQuote, colorClass: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300" }),
                React.createElement(StatCard, { icon: "file-import", label: "Waiting for P.O.", value: stats.waitingForPO, colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300" }),
                React.createElement(StatCard, { icon: "file-invoice", label: "Waiting for Invoice", value: stats.waitingForInvoice, colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" }),
                React.createElement(StatCard, { icon: "file-invoice-dollar", label: "Waiting for Payment", value: stats.waitingForPayment, colorClass: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300" })
            ),

            React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                React.createElement(CashFlowForecast, { documents: documents }),
                React.createElement(ChartCard, { title: "Documents by Status" },
                    React.createElement('canvas', { ref: statusChartRef })
                )
            ),
             React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                React.createElement(ChartCard, { title: "Purchase Documents by Type" },
                    React.createElement('canvas', { ref: purchaseChartRef })
                ),
                React.createElement(ChartCard, { title: "Sales Documents by Type" },
                    React.createElement('canvas', { ref: salesChartRef })
                )
            )
        )
    );
};
