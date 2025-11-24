import React, { useState, useEffect } from 'react';
import Dashboard from './dashboard';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { User } from './AuthContext';

export default function App() {
  const { loggedInUser, setLoggedInUser, logout } = useAuth();

  const [showLenderPage, setShowLenderPage] = useState(false);
  const [loginPage, setLoginPage] = useState(false);
   

  // --- Sign-Up State ---
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [numberExists, setNumberExists] = useState(false);
  const [numbererror, setNumberError] = useState(false);

   // --- Login State ---
   const [loginPhone, setLoginPhone] = useState('');
   const [loginPassword, setLoginPassword] = useState('');
   const [loginError, setLoginError] = useState(false);
   const [showLoginPassword, setShowLoginPassword] = useState(false);
   const [loginLoading, setLoginLoading] = useState(false);
   const [loginErrorMessage, setLoginErrorMessage] = useState('');
   const [signupLoading, setSignupLoading] = useState(false);
   const [signupMessage, setSignupMessage] = useState('');  // Handle Sign-Up

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
      const url = 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata';
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
        setLoginPage(true);
      }, 1500);
    } catch (err) {
      console.error(err);
      setSignupMessage('সাইন আপ ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(false);
    setLoginErrorMessage('');
    setLoginLoading(true);

    try {
      const url = 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata';
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
      const farmerUser = { ...user, accountType: 'farmer' };
      setLoggedInUser(farmerUser);

      // Save credentials to localStorage for persistent login
      localStorage.setItem('userId', user._id);
      localStorage.setItem('userPass', loginPassword);
      localStorage.setItem('accountType', 'farmer');

    } catch (err) {
      console.error(err);
      setLoginError(true);
      setLoginErrorMessage('লগইন ব্যর্থ হয়েছে — অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loggedInUser) {
    // If a lender is logged in, they should not see the farmer dashboard.
    if (loggedInUser.accountType === 'lender') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-red-500 max-w-lg text-center">
            <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">অ্যাক্সেস নিষিদ্ধ</h3>
            <p className="text-slate-600">এই পৃষ্ঠাটি অ্যাক্সেস করতে অনুগ্রহ করে কৃষক হিসাবে লগইন করুন।</p>
            <button onClick={logout} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition">লগ আউট</button>
          </div>
        </div>
      );
    }
    return <Dashboard user={loggedInUser} onLogout={logout} />;
  }

  return (
    <div className="font-sans text-slate-800 bg-emerald-50 min-h-screen">
      {/* =========================================
      SIGN UP PAGE 
      =========================================
      */}
      {!loginPage && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row w-full max-w-5xl">
            
            {/* Image Section */}
            <div className="lg:w-1/2 relative bg-emerald-800">
              <div className="absolute inset-0 bg-black/20 z-10"></div>
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmerLogin.png?raw=true"
                alt="Farmer in field"
              />
              <div className="relative z-20 p-12 flex flex-col justify-end h-full text-white">
                <h2 className="text-4xl font-bold mb-2">শস্যঘড়ি</h2>
                <p className="text-emerald-100 text-lg">আধুনিক প্রযুক্তির সাথে কৃষির মেলবন্ধন।</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-emerald-900 mb-2 text-center lg:text-left">
                শস্যঘড়ি সাইন আপ
              </h2>
              <p className="text-slate-500 mb-6 text-center lg:text-left">কৃষক অ্যাকাউন্ট তৈরি করতে তথ্য দিন</p>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">কৃষকের নাম</label>
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
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">খামারের ফোন</label>
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
                      placeholder="গ্রাম/জেলা"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">ফিল্ড পাসওয়ার্ড</label>
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
                  ) : 'সাইন আপ'}
                </button>

                {signupMessage && (
                  <div className={`p-3 rounded-lg text-center text-sm font-medium ${signupMessage.includes('successfully') || signupMessage.includes('সফলভাবে') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {signupMessage}
                  </div>
                )}
              </form>
              
              <div className="mt-6 space-y-3 text-center">
                 <p className="text-slate-600">
                  আপনি কি একজন মহাজন?{' '}
                  <Link to="/lender" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
                    মহাজন পেজে যান
                  </Link>
                </p>
                <p className="text-slate-500 text-sm">
                  ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
                  <button
                    onClick={() => setLoginPage(true)}
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
      LOGIN PAGE 
      =========================================
      */}
      {loginPage && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl">
            
            {/* Image/Brand Sidebar */}
            <div className="md:w-2/5 bg-emerald-800 relative hidden md:flex flex-col justify-between p-10 text-white">
               <div className="absolute inset-0 bg-[url('https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmerLogin.png?raw=true')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
               <div className="relative z-10">
                 <h2 className="text-3xl font-bold">স্বাগতম!</h2>
                 <p className="mt-2 text-emerald-100">আপনার খামারের তথ্যে প্রবেশ করতে লগইন করুন।</p>
               </div>
            </div>

            {/* Login Form */}
            <div className="md:w-3/5 p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-emerald-900">শস্যঘড়ি লগইন</h2>
                <p className="text-slate-500 mt-2">খামারে আবার স্বাগতম!</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <input
                    type="number"
                    id="loginPhone"
                    required
                    value={loginPhone}
                    onChange={(event) => setLoginPhone(event.target.value)}
                    placeholder="খামারের ফোন"
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
                    placeholder="ফিল্ড পাসওয়ার্ড"
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
                    {loginErrorMessage || 'ভুল ফোন নম্বর বা পাসওয়ার্ড!'}
                  </div>
                )}

                <button
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন'}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-slate-600">
                  অ্যাকাউন্ট নেই?{' '}
                  <button 
                    onClick={() => setLoginPage(false)} 
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                  >
                    সাইন আপ করুন
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}