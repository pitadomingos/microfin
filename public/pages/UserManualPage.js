
import React from 'react';
import { Icon } from '../components/Icon.js';

const FeatureCard = ({ icon, title, children }) => (
    React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" },
        React.createElement('div', { className: "flex items-center gap-4 mb-3" },
            React.createElement(Icon, { name: icon, className: "text-2xl text-primary-500" }),
            React.createElement('h3', { className: "text-xl font-bold text-gray-900 dark:text-white" }, title)
        ),
        React.createElement('p', { className: "text-gray-600 dark:text-gray-400" }, children)
    )
);

const DocTypeCard = ({ title, procurement, sales }) => (
    React.createElement('div', { className: "border border-gray-200 dark:border-gray-700 rounded-lg" },
        React.createElement('h4', { className: "text-lg font-semibold bg-gray-50 dark:bg-gray-700/50 p-4 rounded-t-lg" }, title),
        React.createElement('div', { className: "p-4 grid grid-cols-1 md:grid-cols-2 gap-4" },
            React.createElement('div', null, 
                React.createElement('p', { className: "font-medium text-gray-500 dark:text-gray-400 mb-1" }, "When You Are Buying (Purchase)"),
                React.createElement('p', { className: "text-sm text-gray-600 dark:text-gray-300" }, procurement)
            ),
             React.createElement('div', { className: "border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-4" }, 
                React.createElement('p', { className: "font-medium text-gray-500 dark:text-gray-400 mb-1" }, "When You Are Selling (Sales)"),
                React.createElement('p', { className: "text-sm text-gray-600 dark:text-gray-300" }, sales)
            )
        )
    )
);

export const UserManualPage = () => {
    return (
        React.createElement('div', { className: "space-y-8" },
            React.createElement('div', null,
                React.createElement('h1', { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "User Manual"),
                React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mt-1" },
                    "Welcome to DocTrac! Here's how to get the most out of the application."
                )
            ),

            React.createElement('div', null,
                React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Core Features"),
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    React.createElement(FeatureCard, { icon: "plus", title: "Adding Documents" },
                        "Use the 'Add Document' button or the 'Smart Paste' AI feature. The AI can parse details like amounts and due dates. The form also suggests existing documents to link to, like quotes and Purchase Orders."
                    ),
                    React.createElement(FeatureCard, { icon: "magnifying-glass-chart", title: "Performance Analytics" },
                        "The 'Analytics' page breaks down spending per supplier and revenue per client. It also calculates key metrics like average time to get an invoice from a Purchase Order, giving you valuable business insights."
                    ),
                    React.createElement(FeatureCard, { icon: "chart-line", title: "Dashboard Insights" },
                        "The main Dashboard provides a quick overview with key stats and a Cash Flow Forecast, predicting your inbound and outbound cash needs for the next 7, 30, and 90 days."
                    ),
                    React.createElement(FeatureCard, { icon: "file-export", title: "Filtering & Exporting" },
                        "The Documents page has powerful date and content filters. After filtering, you can export your custom report to either a CSV or PDF file using the buttons in the filter section."
                    ),
                     React.createElement(FeatureCard, { icon: "chart-pie", title: "AI Reports" },
                        "Navigate to the 'AI Reports' page to generate a comprehensive analysis of your document workflow, complete with insights and suggestions for improvement."
                    ),
                    React.createElement(FeatureCard, { icon: "robot", title: "JacBot" },
                        "Click the chat bubble to ask the JacBot questions about your documents in plain English, like 'How many invoices are due this month?' or 'Find the purchase order from Supplier C'."
                    )
                )
            ),
            
            React.createElement('div', null,
                React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Understanding Document Types"),
                React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mb-6 max-w-3xl" },
                    "The key to using DocTrac effectively is understanding the two 'Flow Directions' (Purchase and Sales) and when to use each document type within them. This helps track the entire lifecycle of a transaction."
                ),
                React.createElement('div', { className: "space-y-4" },
                    React.createElement(DocTypeCard, {
                        title: "Requisition",
                        procurement: "An internal request to purchase goods or services. This is the very first step. Example: 'We need to buy 5 new hard hats.'",
                        sales: "A client's initial request for a price or service. Example: 'Client X asks how much 50 widgets would cost.'"
                    }),
                    React.createElement(DocTypeCard, {
                        title: "Quote",
                        procurement: "A formal price list you receive from a potential supplier after you send them a requisition.",
                        sales: "The formal price list you send to a client in response to their requisition."
                    }),
                    React.createElement(DocTypeCard, {
                        title: "Purchase Order",
                        procurement: "The official document you send to a supplier to confirm an order after you have accepted their quote.",
                        sales: "The official document a client sends to you to confirm they want to buy, based on the quote you sent them."
                    }),
                    React.createElement(DocTypeCard, {
                        title: "Invoice",
                        procurement: "The bill you receive from a supplier after they have fulfilled your Purchase Order. You need to pay this.",
                        sales: "The bill you send to a client after you have fulfilled their Purchase Order. They need to pay this."
                    })
                )
            ),
            React.createElement('div', null,
                 React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Understanding Statuses"),
                 React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mb-6 max-w-3xl" },
                    "Statuses automatically track where a document is in its lifecycle. Each status indicates the next action needed."
                ),
                React.createElement('ul', { className: "list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300" },
                    React.createElement('li', null, React.createElement('strong', null, 'Waiting for Quote: '), "A requisition has been made and you are waiting for a supplier to provide a quote."),
                    React.createElement('li', null, React.createElement('strong', null, 'Waiting for PO: '), "A quote has been sent or received, and you are waiting for a Purchase Order to be issued."),
                    React.createElement('li', null, React.createElement('strong', null, 'Waiting for Invoice: '), "A Purchase Order has been confirmed, and you are waiting for an invoice to be sent."),
                    React.createElement('li', null, React.createElement('strong', null, 'Waiting for Payment: '), "An invoice has been issued and is awaiting payment."),
                    React.createElement('li', null, React.createElement('strong', null, 'Paid: '), "The invoice has been paid and the transaction is complete.")
                )
            )
        )
    );
};
