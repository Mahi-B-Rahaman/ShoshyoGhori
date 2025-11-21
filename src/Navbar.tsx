import React from 'react';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  return (
    <nav className="bg-white shadow-md w-full p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-green-700">শস্যঘড়ি</h1>
      <button
        onClick={onLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        লগ আউট
      </button>
    </nav>
  );
};

export default Navbar;