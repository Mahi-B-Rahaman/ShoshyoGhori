import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { loggedInUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const activeLinkStyle = {
    color: '#15803d', // green-700
    fontWeight: '600', // semibold
  };

  useEffect(() => {
    // Close the mobile menu when the location changes
    setIsMenuOpen(false);
  }, [location]);

  return (
    <nav className="bg-white/75 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold text-green-800">
              <img 
                src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/shoshyo-removebg-preview.png?raw=true" 
                alt="শস্যঘড়ি লোগো" 
                className="h-12 w-auto" />
              <span className="hidden sm:inline">শস্যঘড়ি</span>
            </NavLink>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
              {loggedInUser ? (
                <NavLink to={loggedInUser.accountType === 'lender' ? '/lender' : '/'} className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  ড্যাশবোর্ড
                </NavLink>
              ) : (
                <>
                  <NavLink to="/" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    কৃষক
                  </NavLink>
                  <NavLink to="/lender" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    মহাজন
                  </NavLink>
                </>
              )}
              {(!loggedInUser || loggedInUser.accountType !== 'lender') && (
                <NavLink to="/rent" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  ভাড়া করুন
                </NavLink>
              )}
              <NavLink to="/crop-care" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                ফসলের যত্ন
              </NavLink>
              {loggedInUser && loggedInUser.accountType !== 'lender' && (
                <NotificationBell />
              )}
              {loggedInUser && (
                <>
                  <NavLink to="/profile" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    আমার প্রোফাইল
                  </NavLink>
                  <button onClick={logout} className="ml-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
                    লগ আউট
                  </button>
                </>
              )}
          </div>

          {/* Mobile Menu Button */}
          <div className="absolute inset-y-0 right-0 flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-green-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500">
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {loggedInUser ? (
                <NavLink to={loggedInUser.accountType === 'lender' ? '/lender' : '/'} className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>ড্যাশবোর্ড</NavLink>
              ) : (
                <>
                  <NavLink to="/" className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>কৃষক</NavLink>
                  <NavLink to="/lender" className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>মহাজন</NavLink>
                </>
              )}
              {(!loggedInUser || loggedInUser.accountType !== 'lender') && (
                <NavLink to="/rent" className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>ভাড়া করুন</NavLink>
              )}
              <NavLink to="/crop-care" className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>ফসলের যত্ন</NavLink>
              {loggedInUser && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center px-3 mb-3">
                    <div className="flex-shrink-0">{loggedInUser.accountType !== 'lender' && <NotificationBell />}</div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{loggedInUser.name}</div>
                      <div className="text-sm font-medium text-gray-500">{loggedInUser.phone}</div>
                    </div>
                  </div>
                  <NavLink to="/profile" className="block text-gray-600 hover:text-green-700 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>আমার প্রোফাইল</NavLink>
                  <button onClick={logout} className="w-full text-left block text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium">লগ আউট</button>
                </div>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;