import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { loggedInUser, setLoggedInUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loggedInUser) {
      setName(loggedInUser.name);
      setPhone(loggedInUser.phone);
    } else {
      // If no user is logged in, redirect to home
      navigate('/');
    }
  }, [loggedInUser, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loggedInUser) return;

    setLoading(true);
    setMessage('');

    const apiPaths = {
      farmer: 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata',
      lender: 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata',
    };

    const accountType = loggedInUser.accountType || 'farmer'; // Default to farmer if not set
    const url = `${apiPaths[accountType]}/${loggedInUser._id}`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile.');
      }

      const updatedUser = await res.json();

      // The lender API returns the user object directly, farmer API might be different.
      // We'll merge the changes to be safe.
      const finalUser = { ...loggedInUser, ...updatedUser, name, phone };

      setLoggedInUser(finalUser);
      setMessage('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
    } catch (error: any) {
      setMessage(`ত্রুটি: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!loggedInUser) {
    return null; // or a loading spinner while redirecting
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-green-800 mb-6">আমার প্রোফাইল</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">নাম</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">ফোন নম্বর</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105">
              {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
            {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;