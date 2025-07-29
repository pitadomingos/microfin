
import React, { useState, useEffect } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { SummaryDashboardPage } from '../pages/SummaryDashboardPage.js';
import { DocumentsPage } from '../pages/DashboardPage.js';
import { ActivityLogPage } from '../pages/ActivityLogPage.js';
import { AdminConsolePage } from '../pages/AdminConsolePage.js';
import { ReportsPage } from '../pages/ReportsPage.js';
import { UserManualPage } from '../pages/UserManualPage.js';
import { PerformanceDashboardPage } from '../pages/PerformanceDashboardPage.js';
import { Chatbot } from './Chatbot.js';
import * as sheetService from '../services/googleSheetService.js';

export const MainLayout = ({ user, onLogout, settings, onSettingsUpdate }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        sheetService.getDocuments().then(setDocuments);
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return React.createElement(SummaryDashboardPage, null);
            case 'documents':
                return React.createElement(DocumentsPage, { currentUser: user });
            case 'analytics':
                return React.createElement(PerformanceDashboardPage, null);
            case 'reports':
                return React.createElement(ReportsPage, null);
            case 'logs':
                return React.createElement(ActivityLogPage, null);
            case 'manual':
                return React.createElement(UserManualPage, null);
            case 'admin':
                return React.createElement(AdminConsolePage, { currentUser: user, settings: settings, onSettingsUpdate: onSettingsUpdate });
            default:
                return React.createElement(SummaryDashboardPage, null);
        }
    };

    return (
        React.createElement('div', { className: "flex min-h-screen" },
            React.createElement(Sidebar, { user: user, currentPage: currentPage, setCurrentPage: setCurrentPage, logoUrl: settings.appLogoUrl }),
            React.createElement('div', { className: "flex-1 flex flex-col" },
                React.createElement(Header, { onLogout: onLogout, user: user, logoUrl: settings.companyLogoUrl }),
                React.createElement('main', { className: "flex-1 p-6 lg:p-8 overflow-y-auto" },
                    renderPage()
                )
            ),
            React.createElement(Chatbot, { documents: documents })
        )
    );
};
