
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoanSimulator from './pages/LoanSimulator';
import LoanManagement from './pages/LoanManagement';
import UserManagement from './pages/UserManagement';
import FinancialAnalysis from './pages/FinancialAnalysis';
import RiskManagement from './pages/RiskManagement';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import Logs from './pages/Logs';
import Chatbot from './components/Chatbot';
import { UserRole } from './types';
import AIReport from './pages/AIReport';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <HashRouter>
      {user ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loan-simulator" element={<LoanSimulator />} />
            <Route path="/loan-management" element={<LoanManagement />} />
            {user.role === UserRole.Admin && <Route path="/user-management" element={<UserManagement />} />}
            {(user.role === UserRole.Admin || user.role === UserRole.Officer) && <Route path="/financial-analysis" element={<FinancialAnalysis />} />}
            {(user.role === UserRole.Admin || user.role === UserRole.Officer) && <Route path="/risk-management" element={<RiskManagement />} />}
            {(user.role === UserRole.Admin || user.role === UserRole.Officer) && <Route path="/ai-report" element={<AIReport />} />}
            <Route path="/documents" element={<Documents />} />
            <Route path="/notifications" element={<Notifications />} />
            {user.role === UserRole.Admin && <Route path="/logs" element={<Logs />} />}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Chatbot />
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;
