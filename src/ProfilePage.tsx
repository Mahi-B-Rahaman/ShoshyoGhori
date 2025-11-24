import React, { useState, useEffect } from 'react';
import { useAuth, type User, type PlantedCrop } from './AuthContext';
import { useNavigate } from 'react-router-dom';
const ProfilePage = () => {
  const { loggedInUser, setLoggedInUser } = useAuth();
  const navigate = useNavigate();

  // State for user profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      if (loggedInUser) {
        setName(loggedInUser.name);
        setPhone(loggedInUser.phone);
        setLocation(loggedInUser.location || '');

      } else {
        navigate('/');
      }
    };

    initializeProfile();
  }, [loggedInUser, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loggedInUser) return;

    // --- Phone Number Validation ---
    if (phone.length !== 11) {
      setMessage('ত্রুটি: ফোন নম্বরটি অবশ্যই ১১ সংখ্যার হতে হবে।');
      return;
    }
    if (!phone.startsWith('01')) {
      setMessage('ত্রুটি: ফোন নম্বরটি অবশ্যই ০১ দিয়ে শুরু হতে হবে।');
      return;
    }
    // --- End Validation ---

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
        body: JSON.stringify({ name, phone, location }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile.');
      }

      const updatedUser = await res.json();

      // The lender API returns the user object directly, farmer API might be different.
      // We'll merge the changes to be safe.
      const finalUser = { ...loggedInUser, ...updatedUser, name, phone, location };

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
    <div className="p-4 sm:p-6 md:p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-8">আমার প্রোফাইল</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">নাম</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="location" className="block text-gray-700 font-medium mb-2">অবস্থান</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="bg-green-700 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-800 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105">
              {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
            {message && <p className={`text-sm ${message.includes('ত্রুটি') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;