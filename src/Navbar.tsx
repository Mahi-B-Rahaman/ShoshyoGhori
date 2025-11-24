import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { loggedInUser, logout } = useAuth();
  const activeLinkStyle = {
    color: '#15803d', // green-700
    fontWeight: '600', // semibold
  };

  return (
    <nav className="bg-white/75 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex-1 flex items-center justify-start">
            <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold text-green-800">
              <img 
                src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/shoshyo-removebg-preview.png?raw=true" 
                alt="শস্যঘড়ি লোগো" 
                className="h-25 w-auto" />
              <span>শস্যঘড়ি</span>
            </NavLink>
          </div>

          {/* Center: Main Navigation */}
          <div className="flex-1 flex items-center justify-center space-x-4">
            {loggedInUser ? (
              <NavLink to={loggedInUser.accountType === 'lender' ? '/lender' : '/'} className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                ড্যাশবোর্ড
              </NavLink>
            ) : (
              <>
                <NavLink to="/" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  কৃষক
                </NavLink>
                <NavLink to="/lender" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  মহাজন
                </NavLink>
              </>
            )}
            {(!loggedInUser || loggedInUser.accountType !== 'lender') && (
              <NavLink to="/rent" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                ভাড়া করুন
              </NavLink>
            )}
            <NavLink to="/crop-care" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
              ফসলের যত্ন
            </NavLink>
            {loggedInUser && loggedInUser.accountType !== 'lender' && (
              <NotificationBell />
            )}
          </div>

          {/* Right: User Actions */}
          <div className="flex-1 flex items-center justify-end">
            {loggedInUser && (
              <>
                <NavLink to="/profile" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  আমার প্রোফাইল
                </NavLink>
                <button onClick={logout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600 transition-all duration-300 transform hover:scale-105">
                  লগ আউট
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;