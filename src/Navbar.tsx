import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const { loggedInUser, logout } = useAuth();
  const activeLinkStyle = {
    color: '#16a34a',
    textDecoration: 'underline',
  };

  return (
    <nav className="bg-white/70 backdrop-blur-lg shadow-md sticky top-0 z-50 border-b border-green-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="text-2xl font-bold text-green-800">
              ShoshyoGhori
            </NavLink>
          </div>
          <div className="flex items-center">
            <div className="flex items-baseline space-x-4">
              <NavLink to="/" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                কৃষক
              </NavLink>
              <NavLink to="/rent" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                ভাড়া করুন
              </NavLink>
              <NavLink to="/lender" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                মহাজন
              </NavLink>
            </div>
            {loggedInUser && (
              <div className="ml-4 flex items-center">
                <NavLink to="/profile" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  আমার প্রোফাইল
                </NavLink>
                <span className="text-gray-500 text-sm hidden sm:inline">({loggedInUser.name})</span>
                <button
                  onClick={logout}
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
                >
                  লগ আউট
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;