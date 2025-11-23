import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  phone: string;
  password?: string;
  ipAddress?: string;
  lat?: number;
  lon?: number;
  accountType?: 'farmer' | 'lender';
}

interface AuthContextType {
  loggedInUser: User | null;
  setLoggedInUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userPass');
    setLoggedInUser(null);
  };

  // You can add auto-login logic here if you want
  useEffect(() => {
    // This is a simplified version. The full auto-login logic from Login.tsx can be moved here.
    const userId = localStorage.getItem('userId');
    if (!userId && loggedInUser) {
        logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ loggedInUser, setLoggedInUser, logout }}>
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