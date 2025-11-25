import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import NotificationBell from './NotificationBell';
import type { User } from './AuthContext';

const LenderPage = () => {
  const { loggedInUser, setLoggedInUser } = useAuth();
  const { addNotification } = useNotifications();
  const [LenderloginPage, setLenderloginPage] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [numberExists, setNumberExists] = useState(false);
  const [numbererror, setNumberError] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');

  // State for the new listing form
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [rentDate, setRentDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [price, setPrice] = useState('');
  const [listingMessage, setListingMessage] = useState('');

  const userData = loggedInUser && loggedInUser.accountType === 'lender' ? loggedInUser : null;
  const loggedIn = !!userData;

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(false);
    setLoginErrorMessage('');
    setLoginLoading(true);

    try {
      const url = 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Response status: ${res.status}`);
      const users = await res.json();

      // find user by phone
      const user: User | null = Array.isArray(users) ? users.find((u: any) => String(u.phone) === String(loginPhone)) : null;

      if (!user) {
        setLoginError(true);
        setLoginErrorMessage('ফোন নম্বর পাওয়া যায়নি।');
        setLoginLoading(false);
        return;
      }

      // Check password (plain-text comparison because signup currently stores plain text)
      if (user.password !== loginPassword) {
        setLoginError(true);
        setLoginErrorMessage('ভুল পাসওয়ার্ড।');
        setLoginLoading(false);
        return;
      }

      // Success
      console.log('Login Success', user.name);
      setLoginError(false);
      setLoginErrorMessage('');
      const lenderUser = { ...user, accountType: 'lender' };
      setLoggedInUser(lenderUser);
      console.log('Logged in user data:', lenderUser);

      // Save credentials to localStorage for persistent login
      localStorage.setItem('userId', user._id);
      localStorage.setItem('userPass', loginPassword);
      localStorage.setItem('accountType', 'lender');

      // Redirect to lender dashboard or another page
      //window.location.href = '/lenderDashboard';

    } catch (err) {
      console.error(err);
      setLoginError(true);
      setLoginErrorMessage('লগইন ব্যর্থ হয়েছে — অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
    } finally {
      setLoginLoading(false);

    }
  };

  const handleSignUpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Reset errors
    setNumberError(false);
    setNumberExists(false);
    setSignupMessage('');
    setSignupLoading(true);

    // Validation
    if (phone.length !== 11) {
      setNumberError(true);
      setSignupLoading(false);
      return;
    }

    try {
      // Fetch existing phone numbers from API
      const url = 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch existing users: ${res.status}`);
      const users = await res.json();

      // Check if phone already exists
      const phoneExists = Array.isArray(users) && users.some((u: any) => String(u.phone) === String(phone));
      if (phoneExists) {
        setNumberExists(true);
        setSignupLoading(false);
        return;
      }

      // Phone is valid and doesn't exist, POST new user to API
      const postRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          phone: phone,
          password: password,
          location: location,
          accountType: 'lender',
        }),
      });

      if (!postRes.ok) throw new Error(`Failed to create account: ${postRes.status}`);
      const result = await postRes.json();
      console.log('Sign-Up Success:', result);
      setSignupMessage('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনি এখন লগইন করতে পারেন।');
      // Clear form
      setUsername('');
      setPhone('');
      setPassword('');
      setLocation('');
      // Switch to login page after a delay
      setTimeout(() => {
        setLenderloginPage(true);
      }, 1500);
    } catch (err) {
      console.error(err);
      setSignupMessage('সাইন আপ ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
    } finally {
      setSignupLoading(false);
    }
  };

  // Effect to poll for lender data updates
  useEffect(() => {
    if (!loggedIn || !userData) {
      return; // Don't poll if not logged in as a lender
    }

    const fetchLenderData = async () => {
      try {
        const url = `https://crop-clock-renter-api-uos1.vercel.app/api/renterdata/${userData._id}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error('Polling: Failed to fetch lender data.');
          return;
        }
        const updatedUser = await res.json();
        // Update the global state if the data has changed
        if (JSON.stringify(updatedUser) !== JSON.stringify(userData)) {
          setLoggedInUser(updatedUser);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(fetchLenderData, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [loggedIn, userData, setLoggedInUser]);

  const handleCreateListingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userData) return;

    setListingMessage('তালিকা তৈরি হচ্ছে...');

    const newRental = {
      items: itemName,
      itemsDesc: itemDesc,
      rentDate: rentDate,
      returnDate: returnDate,
      price: Number(price),
    };

    // Assuming the API expects the full updated rentals array
    const updatedRentals = [...(userData.rentals || []), newRental];

    try {
      const url = `https://crop-clock-renter-api-uos1.vercel.app/api/renterdata/${userData._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentals: updatedRentals,
        }),
      });

      if (!res.ok) throw new Error('Failed to create listing.');

      const updatedUser = await res.json();

      // Update local state to reflect the change
      setLoggedInUser(updatedUser);

      // Clear form fields
      setItemName('');
      setItemDesc('');
      setRentDate('');
      setReturnDate('');
      setPrice('');
      setListingMessage('তালিকা সফলভাবে তৈরি হয়েছে!');
    } catch (error) {
      console.error(error);
      setListingMessage('তালিকা তৈরিতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleRemoveListing = async (rentalId: string) => {
    if (!userData || !userData.rentals) return;

    const updatedRentals = userData.rentals.filter(rental => rental._id !== rentalId);

    try {
      const url = `https://crop-clock-renter-api-uos1.vercel.app/api/renterdata/${userData._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentals: updatedRentals,
        }),
      });

      if (!res.ok) throw new Error('Failed to remove listing.');

      const updatedUser = await res.json();
      setLoggedInUser(updatedUser); // Update global state
      // setLenderData(updatedUser); // Removed as per your code logic (using global state)

    } catch (error) {
      console.error('Failed to remove listing:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="font-sans text-slate-800 bg-emerald-50 min-h-screen">
      {/* =========================================
      SIGN UP SECTION
      ========================================= 
      */}
      {!LenderloginPage && !loggedIn && (
        <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row w-full max-w-5xl">
            
            {/* Image Section */}
            <div className="lg:w-1/2 relative bg-emerald-800">
              <div className="absolute inset-0 bg-black/20 z-10"></div>
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/renterImage.png?raw=true"
                alt="Farming Equipment"
              />
              <div className="relative z-20 p-12 flex flex-col justify-end h-full text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">শস্যঘড়ি</h2>
                <p className="text-emerald-100 text-lg">আপনার কৃষি যন্ত্রপাতি ভাড়ায় দিন এবং কৃষিতে অবদান রাখুন।</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:w-1/2 p-6 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-emerald-900 mb-2 text-center lg:text-left">
                মহাজন সাইন আপ
              </h2>
              <p className="text-slate-500 mb-8 text-center lg:text-left">আপনার অ্যাকাউন্ট তৈরি করতে নিচের তথ্যগুলো দিন</p>

              <form onSubmit={handleSignUpSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">মহাজনের নাম</label>
                  <input
                    type="text"
                    id="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="আপনার নাম"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">মোবাইল নম্বর</label>
                  <input
                    type="number"
                    id="phone"
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${numberExists || numbererror ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                    placeholder="01XXXXXXXXX"
                  />
                  {numberExists && <p className="text-red-500 text-xs mt-1 ml-1">⚠ নম্বরটি ইতিমধ্যে বিদ্যমান!</p>}
                  {numbererror && <p className="text-red-500 text-xs mt-1 ml-1">⚠ নম্বরটি ১১ সংখ্যার হতে হবে!</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-2">অবস্থান</label>
                    <input
                      type="text"
                      id="location"
                      required
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="জেলা/উপজেলা"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">পাসওয়ার্ড</label>
                    <input
                      type="password"
                      id="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                  type="submit"
                  disabled={signupLoading}
                >
                  {signupLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      অ্যাকাউন্ট তৈরি হচ্ছে...
                    </span>
                  ) : 'সাইন আপ করুন'}
                </button>

                {signupMessage && (
                  <div className={`p-3 rounded-lg text-center text-sm font-medium ${signupMessage.includes('successfully') || signupMessage.includes('সফলভাবে') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {signupMessage}
                  </div>
                )}
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-500">
                  ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
                  <button
                    onClick={() => setLenderloginPage(true)}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                  >
                    লগইন করুন
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
      LOGIN SECTION
      ========================================= 
      */}
      {LenderloginPage && !loggedIn && (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl">
            
            {/* Image/Brand Sidebar */}
            <div className="md:w-2/5 bg-emerald-800 relative hidden md:flex flex-col justify-between p-10 text-white">
               <div className="absolute inset-0 bg-[url('https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/renterImage.png?raw=true')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
               <div className="relative z-10">
                 <h2 className="text-3xl font-bold">স্বাগতম!</h2>
                 <p className="mt-2 text-emerald-100">শস্যঘড়ি প্ল্যাটফর্মে ফিরে আসার জন্য ধন্যবাদ।</p>
               </div>
            </div>

            {/* Login Form */}
            <div className="md:w-3/5 p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-emerald-900">মহাজন লগইন</h2>
                <p className="text-slate-500 mt-2">আপনার ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <input
                    type="tel"
                    id="loginPhone"
                    required
                    value={loginPhone}
                    onChange={(event) => setLoginPhone(event.target.value)}
                    placeholder="মোবাইল নম্বর"
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 transition-all"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="loginPassword"
                    required
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="পাসওয়ার্ড"
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-slate-600 cursor-pointer hover:text-emerald-700 transition">
                    <input
                      type="checkbox"
                      checked={showLoginPassword}
                      onChange={(e) => setShowLoginPassword(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    পাসওয়ার্ড দেখুন
                  </label>
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-center text-sm font-medium">
                    ⚠ {loginErrorMessage || 'ভুল ফোন নম্বর বা পাসওয়ার্ড!'}
                  </div>
                )}

                <button
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-slate-600">
                  অ্যাকাউন্ট নেই?{' '}
                  <button onClick={() => setLenderloginPage(false)} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                    নতুন অ্যাকাউন্ট খুলুন
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
      DASHBOARD SECTION
      ========================================= 
      */}
      {loggedIn && userData && (
        <div className="bg-slate-50 min-h-screen">
          
          {/* Dashboard Header */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <svg className="w-8 h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <h1 className="text-2xl font-bold text-emerald-900 hidden md:block">মহাজন ড্যাশবোর্ড</h1>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-slate-500">স্বাগতম,</p>
                    <p className="font-bold text-slate-800 text-lg leading-none">{userData.name}</p>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition cursor-pointer">
                    <NotificationBell />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
            
            {/* Listings Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                  আপনার ভাড়া দেওয়া আইটেম
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                  মোট: {userData.rentals ? userData.rentals.length : 0} টি
                </span>
              </div>

              {userData.rentals && userData.rentals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userData.rentals.map((rental) => (
                    <div key={rental._id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 relative overflow-hidden">
                      
                      {/* Status Bar / Header */}
                      <div className={`h-2 w-full ${rental.rentedByName ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                             <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{rental.items}</h3>
                             <p className="text-emerald-600 font-bold text-lg mt-1">৳{rental.price} <span className="text-sm text-slate-500 font-normal">/ ভাড়া</span></p>
                          </div>
                          {rental.rentedByName ? (
                             <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">ভাড়া চলছে</span>
                          ) : (
                             <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">অ্যাক্টিভ</span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                             <span>{rental.itemsDesc || 'বিবরণ নেই'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             <span>{new Date(rental.rentDate).toLocaleDateString()} — {new Date(rental.returnDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                             <span>{userData.phone}</span>
                          </div>
                        </div>

                        {/* Renter Info Card */}
                        {rental.rentedByName && (
                          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-xs font-bold text-amber-800 uppercase mb-1">ভাড়া গ্রহণকারী</p>
                            <p className="font-semibold text-slate-800">{rental.rentedByName}</p>
                            <p className="text-sm text-slate-600">{rental.rentedByNumber}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              {rental.rentedByLocation || 'অবস্থান অজানা'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveListing(rental._id)}
                        className="absolute top-4 right-4 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full p-2 shadow-sm border border-slate-100 transition-all"
                        title="তালিকা সরান"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                  <div className="inline-block p-4 rounded-full bg-slate-50 mb-3">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  </div>
                  <p className="text-lg text-slate-500">আপনার বর্তমানে কোনো আইটেম ভাড়া দেওয়া নেই।</p>
                  <p className="text-sm text-slate-400">নিচের ফর্মটি ব্যবহার করে নতুন তালিকা তৈরি করুন।</p>
                </div>
              )}
            </section>

            {/* Create Listing Form */}
            <section className="max-w-4xl mx-auto">
               <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                 <div className="bg-emerald-600 p-6 text-white">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                     নতুন ভাড়ার তালিকা তৈরি করুন
                   </h2>
                 </div>
                 
                 <div className="p-6 md:p-8">
                  <form onSubmit={handleCreateListingSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="itemName" className="block text-sm font-semibold text-slate-700 mb-2">আইটেমের নাম</label>
                          <input 
                            type="text" 
                            id="itemName" 
                            value={itemName} 
                            onChange={(e) => setItemName(e.target.value)} 
                            required 
                            placeholder="উদাঃ পাওয়ার টিলার"
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                          />
                        </div>

                        <div>
                          <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-2">মূল্য (টাকা)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">৳</span>
                            <input 
                              type="number" 
                              id="price" 
                              value={price} 
                              onChange={(e) => setPrice(e.target.value)} 
                              required 
                              placeholder="0.00"
                              className="w-full pl-8 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="itemDesc" className="block text-sm font-semibold text-slate-700 mb-2">বিবরণ</label>
                          <textarea 
                            id="itemDesc" 
                            value={itemDesc} 
                            onChange={(e) => setItemDesc(e.target.value)} 
                            rows={4} 
                            placeholder="যন্ত্রপাতির অবস্থা এবং মডেল সম্পর্কে লিখুন..."
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                          ></textarea>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">সময়সীমা</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="rentDate" className="block text-sm font-medium text-slate-600 mb-1">ভাড়া শুরুর তারিখ</label>
                              <input 
                                type="date" 
                                id="rentDate" 
                                value={rentDate} 
                                onChange={(e) => setRentDate(e.target.value)} 
                                required 
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                              />
                            </div>

                            <div>
                              <label htmlFor="returnDate" className="block text-sm font-medium text-slate-600 mb-1">ভাড়া শেষের তারিখ</label>
                              <input 
                                type="date" 
                                id="returnDate" 
                                value={returnDate} 
                                onChange={(e) => setReturnDate(e.target.value)} 
                                required 
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            type="submit"
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            তালিকা প্রকাশ করুন
                          </button>
                          
                          {listingMessage && (
                            <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${listingMessage.includes('সফলভাবে') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {listingMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                 </div>
               </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default LenderPage;