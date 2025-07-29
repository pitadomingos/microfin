
import React, { useEffect, useState, useMemo } from 'react';
import * as sheetService from '../services/googleSheetService.js';
import { EntityType, DocumentType, FlowDirection, Status } from '../types.js';
import { Icon } from '../components/Icon.js';

const StatCard = ({ label, value, icon, iconBgColor }) => (
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4' },
        React.createElement('div', { className: `w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}` },
            React.createElement(Icon, { name: icon, className: 'text-xl' })
        ),
        React.createElement('div', null,
            React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, label),
            React.createElement('p', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, value)
        )
    )
);

const PerformanceTable = ({ title, headers, data }) => (
    React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" },
        React.createElement('h3', { className: 'text-xl font-bold text-gray-900 dark:text-white p-6' }, title),
        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full text-sm' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700/50' },
                    React.createElement('tr', null,
                        headers.map(h => React.createElement('th', { key: h, className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, h))
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    data.map((row, index) => (
                        React.createElement('tr', { key: index, className: 'hover:bg-gray-50 dark:hover:bg-gray-800/50' },
                            row.map((cell, cellIndex) => React.createElement('td', { key: cellIndex, className: `px-6 py-4 whitespace-nowrap ${cellIndex > 0 ? 'font-mono' : 'font-medium text-gray-800 dark:text-gray-200'}` }, cell))
                        )
                    ))
                )
            )
        )
    )
);

export const PerformanceDashboardPage = () => {
    const [documents, setDocuments] = useState([]);
    const [entities, setEntities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [docs, ents] = await Promise.all([sheetService.getDocuments(), sheetService.getEntities()]);
                setDocuments(docs);
                setEntities(ents);
            } catch (error) {
                console.error("Failed to load analytics data:", error);
                alert("Could not load analytics data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const analyticsData = useMemo(() => {
        if (documents.length === 0 || entities.length === 0) {
            return { suppliers: [], clients: [], totalSpend: 0, totalRevenue: 0 };
        }

        const docsById = new Map(documents.map(doc => [doc.documentNumber, doc]));
        const diffDays = (date1, date2) => {
            if (!date1 || !date2) return null;
            return (new Date(date2) - new Date(date1)) / (1000 * 3600 * 24);
        };

        let totalSpend = 0;
        let totalRevenue = 0;

        const suppliers = entities.filter(e => e.type === EntityType.SUPPLIER).map(supplier => {
            const supplierDocs = documents.filter(d => d.supplierName === supplier.name && d.flowDirection === FlowDirection.INBOUND);
            const spend = supplierDocs.filter(d => d.documentType === DocumentType.INVOICE && d.status === Status.PAID).reduce((sum, doc) => sum + (doc.amount || 0), 0);
            totalSpend += spend;

            const poToInvoiceTimes = [];
            supplierDocs.filter(d => d.documentType === DocumentType.INVOICE && d.relatedPO && d.relatedPO !== 'N/A').forEach(invoice => {
                const po = docsById.get(invoice.relatedPO);
                if (po) {
                    const days = diffDays(po.dateIssued, invoice.dateIssued);
                    if (days !== null) poToInvoiceTimes.push(days);
                }
            });
            const avgTime = poToInvoiceTimes.length > 0 ? (poToInvoiceTimes.reduce((a, b) => a + b, 0) / poToInvoiceTimes.length).toFixed(1) + ' days' : 'N/A';

            return { name: supplier.name, spend, avgTime };
        });

        const clients = entities.filter(e => e.type === EntityType.CLIENT).map(client => {
            const clientDocs = documents.filter(d => d.supplierName === client.name && d.flowDirection === FlowDirection.OUTBOUND);
            const revenue = clientDocs.filter(d => d.documentType === DocumentType.INVOICE && d.status === Status.PAID).reduce((sum, doc) => sum + (doc.amount || 0), 0);
            totalRevenue += revenue;

            const quoteToPOTimes = [];
            clientDocs.filter(d => d.documentType === DocumentType.PO && d.relatedQuote && d.relatedQuote !== 'N/A').forEach(po => {
                const quote = docsById.get(po.relatedQuote);
                if (quote) {
                    const days = diffDays(quote.dateIssued, po.dateIssued);
                    if (days !== null) quoteToPOTimes.push(days);
                }
            });
            const avgTime = quoteToPOTimes.length > 0 ? (quoteToPOTimes.reduce((a, b) => a + b, 0) / quoteToPOTimes.length).toFixed(1) + ' days' : 'N/A';

            return { name: client.name, revenue, avgTime };
        });

        return {
            suppliers: suppliers.sort((a,b) => b.spend - a.spend),
            clients: clients.sort((a,b) => b.revenue - a.revenue),
            totalSpend,
            totalRevenue,
        };
    }, [documents, entities]);

    if (isLoading) {
        return React.createElement('div', { className: "text-center py-16" },
            React.createElement(Icon, { name: "spinner", className: "text-4xl text-primary-500 animate-spin" }),
            React.createElement('p', { className: 'mt-4' }, 'Calculating Analytics...')
        );
    }
    
    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        React.createElement('div', { className: "space-y-8" },
            React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Performance Analytics"),
            
            React.createElement('div', {className: "grid grid-cols-1 md:grid-cols-2 gap-6"},
                React.createElement(StatCard, {label: "Total Procurement Spend", value: formatCurrency(analyticsData.totalSpend), icon: "arrow-down", iconBgColor: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300"}),
                React.createElement(StatCard, {label: "Total Sales Revenue", value: formatCurrency(analyticsData.totalRevenue), icon: "arrow-up", iconBgColor: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"})
            ),

            React.createElement(PerformanceTable, {
                title: "Supplier Performance",
                headers: ["Supplier Name", "Total Spend (Paid Invoices)", "Avg. P.O. → Invoice Time"],
                data: analyticsData.suppliers.map(s => [s.name, formatCurrency(s.spend), s.avgTime])
            }),

            React.createElement(PerformanceTable, {
                title: "Client Performance",
                headers: ["Client Name", "Total Revenue (Paid Invoices)", "Avg. Quote → P.O. Time"],
                data: analyticsData.clients.map(c => [c.name, formatCurrency(c.revenue), c.avgTime])
            })
        )
    );
};
