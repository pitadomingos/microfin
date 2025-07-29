
import React, { useState, ReactNode, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useToast } from '../context/ToastContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
    setUserDropdownOpen(false);
    addToast(`Theme changed to ${!isDarkMode ? 'Dark' : 'Light'} Mode`, 'info');
  };
  
  const getPageTitle = () => {
    const path = location.pathname.replace('/', '');
    if (!path) return 'Dashboard';
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 w-full text-left text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;
  
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => `${navLinkClass({ isActive })} mt-1`;


  const handleLogout = () => {
    logout();
    addToast("You have been logged out.", "success");
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <h1 className="text-xl font-bold text-primary">MicroFin</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Microcredit System</p>
      </div>
      <div className="py-2 px-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 truncate">
          {user?.name} ({user?.role})
        </p>
      </div>
      <nav className="space-y-1 px-2 flex-grow">
        <NavLink to="/dashboard" className={navLinkClass}><i className="fas fa-tachometer-alt w-6"></i><span>Dashboard</span></NavLink>
        <NavLink to="/loan-simulator" className={navLinkClass}><i className="fas fa-calculator w-6"></i><span>Loan Simulator</span></NavLink>
        <NavLink to="/loan-management" className={navLinkClass}><i className="fas fa-money-bill-wave w-6"></i><span>Loan Management</span></NavLink>
        {user?.role === UserRole.Admin && (
          <NavLink to="/user-management" className={navLinkClass}><i className="fas fa-users w-6"></i><span>User Management</span></NavLink>
        )}
        {(user?.role === UserRole.Admin || user?.role === UserRole.Officer) && (
          <NavLink to="/financial-analysis" className={navLinkClass}><i className="fas fa-chart-line w-6"></i><span>Financial Analysis</span></NavLink>
        )}
        {(user?.role === UserRole.Admin || user?.role === UserRole.Officer) && (
            <NavLink to="/ai-report" className={navLinkClass}><i className="fas fa-magic w-6"></i><span>AI Report</span></NavLink>
        )}
        {(user?.role === UserRole.Admin || user?.role === UserRole.Officer) && (
          <NavLink to="/risk-management" className={navLinkClass}><i className="fas fa-shield-alt w-6"></i><span>Risk Management</span></NavLink>
        )}
        <NavLink to="/documents" className={navLinkClass}><i className="fas fa-file-alt w-6"></i><span>Documents</span></NavLink>
        <NavLink to="/notifications" className={navLinkClass}><i className="fas fa-bell w-6"></i><span>Notifications</span></NavLink>
        {user?.role === UserRole.Admin && (
          <NavLink to="/logs" className={navLinkClass}><i className="fas fa-history w-6"></i><span>Logs</span></NavLink>
        )}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-dark-border">
        <button onClick={handleLogout} className="flex items-center px-3 py-2 w-full text-left text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300">
          <i className="fas fa-sign-out-alt w-6"></i>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-dark-bg">
      {/* Static sidebar for desktop */}
      <aside className="w-64 bg-white dark:bg-dark-card shadow-md hidden md:flex md:flex-col">
        <SidebarContent />
      </aside>
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)}></div>
        <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-dark-card">
           <SidebarContent />
        </aside>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden">
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="ml-2 md:ml-4 text-lg font-medium text-gray-800 dark:text-gray-200">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <NavLink to="/notifications" className="relative cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <i className="fas fa-bell"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </NavLink>
              <div className="relative">
                <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none">
                  <span className="text-sm font-medium hidden md:block mr-2">{user?.name}</span>
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <i className="fas fa-user"></i>
                  </div>
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Profile</button>
                      <button onClick={toggleTheme} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <button onClick={handleLogout} className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 w-full text-left">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
