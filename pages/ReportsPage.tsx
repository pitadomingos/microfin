import React, { useState, useCallback } from 'react';
import { Icon } from '../components/Icon';
import * as sheetService from '../services/googleSheetService';
import * as geminiService from '../services/geminiService';

export function ReportsPage() {
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateReport = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setReport('');
        try {
            const documents = await sheetService.getDocuments();
            if (documents.length === 0) {
                setError("No documents found to generate a report. Please add some documents first.");
                setIsLoading(false);
                return;
            }
            const generatedReport = await geminiService.generateReportFromData(documents);
            setReport(generatedReport);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred while generating the report.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Simple markdown-to-HTML converter
    const formatReport = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>') // Bold
            .replace(/\n/g, '<br />'); // Newlines
    };

    return React.createElement('div', { className: "space-y-6" },
        React.createElement('div', { className: "flex flex-col sm:flex-row justify-between sm:items-center gap-4" },
            React.createElement('div', null,
                React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "AI-Powered Reports"),
                React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mt-1" },
                    "Generate an executive summary and analysis of your document data."
                )
            ),
            React.createElement('button', {
                onClick: generateReport,
                disabled: isLoading,
                className: "bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:bg-primary-300 disabled:cursor-wait"
            },
                isLoading
                    ? React.createElement(Icon, { name: "spinner", className: "animate-spin" })
                    : React.createElement(Icon, { name: "wand-magic-sparkles", className: "" }),
                "Generate Report"
            )
        ),

        React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[50vh] p-6 lg:p-8" },
            isLoading ? (
                React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
                    React.createElement(Icon, { name: "spinner", className: "animate-spin text-4xl text-primary-500" }),
                    React.createElement('p', { className: "mt-4 text-lg text-gray-600 dark:text-gray-400" }, "The AI is analyzing your documents..."),
                    React.createElement('p', { className: "text-sm text-gray-500" }, "This might take a moment.")
                )
            ) : error ? (
                React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center text-red-500" },
                    React.createElement(Icon, { name: "exclamation-triangle", className: "text-4xl mb-4" }),
                    React.createElement('h3', { className: "text-xl font-semibold" }, "Report Failed"),
                    React.createElement('p', { className: "mt-2" }, error)
                )
            ) : report ? (
                React.createElement('div', {
                    className: "prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300",
                    dangerouslySetInnerHTML: { __html: formatReport(report) }
                })
            ) : (
                React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
                     React.createElement(Icon, { name: "chart-pie", className: "text-6xl text-gray-300 dark:text-gray-600 mb-4" }),
                     React.createElement('h3', { className: "text-xl font-medium text-gray-500 dark:text-gray-400 mb-2" }, "Ready to Generate Report"),
                     React.createElement('p', { className: "text-gray-400 dark:text-gray-500" }, "Click the 'Generate Report' button to get started.")
                )
            )
        )
    );
};