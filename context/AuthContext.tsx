
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers } from '../services/googleSheetService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load user from session storage
    try {
      const storedUser = sessionStorage.getItem('microfin_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('microfin_user');
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Demo passwords
    const demoPasswords: { [key: string]: string } = {
      'admin': 'admin',
      'officer': 'officer',
      'borrower': 'borrower',
      'joao': 'joao',
      'carlos': 'carlos',
      'maria': 'maria',
    };

    const users = await getUsers();
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // In a real app, you'd compare a hashed password. Here we use demo passwords.
    if (foundUser && demoPasswords[foundUser.username] === password) {
      const userToStore = { ...foundUser };
      delete userToStore.password; // Don't store password
      setUser(userToStore);
      sessionStorage.setItem('microfin_user', JSON.stringify(userToStore));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('microfin_user');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
          <div className="text-center">
              <div className="mb-4">
                  <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Initializing MicroFin</h2>
          </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
