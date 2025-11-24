import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Crop {
  "Products name": string;
  "Transplant": string;
  "Harvest": string;
}

export interface PlantedCrop {
  crop: Crop;
  plantedDate: Date | string; // Allow string for JSON data
}

export interface Rental {
  _id: string;
  items: string;
  itemDesc?: string;
  rentDate: string;
  returnDate: string;
  price: number;
  rentedByName?: string;
  rentedByNumber?: string;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  password?: string;
  location?: string;
  lat?: number;
  lon?: number;
  accountType?: 'farmer' | 'lender';
  notification?: string[];
  rentals?: Rental[]; // For lenders
  plantedCrops?: PlantedCrop[]; // For farmers
  rentedItems?: any[]; // For farmers
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

  // Auto-login effect on app start
  useEffect(() => {
    const attemptAutoLogin = async () => {
      const savedUserId = localStorage.getItem('userId');
      const savedUserPass = localStorage.getItem('userPass');
      const savedAccountType = localStorage.getItem('accountType');

      if (savedUserId && savedUserPass && savedAccountType) {
        const isLender = savedAccountType === 'lender';
        const apiBase = isLender
          ? 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata'
          : 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata';
        
        const url = `${apiBase}/${savedUserId}`;

        try {
          const res = await fetch(url);
          if (res.ok) {
            const user = await res.json();
            // The password check is based on the existing pattern in your login forms
            if (user.password === savedUserPass) {
              // Ensure accountType is set correctly on the user object
              const userWithAccountType = { ...user, accountType: isLender ? 'lender' : 'farmer' };
              setLoggedInUser(userWithAccountType);
            } else {
              logout(); // Password mismatch, clear credentials
            }
          } else {
            logout(); // User not found or other API error
          }
        } catch (err) {
          console.error("Auto-login failed:", err);
        }
      }
    }
    attemptAutoLogin();
  }, []); // Empty dependency array ensures this runs only once on mount

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