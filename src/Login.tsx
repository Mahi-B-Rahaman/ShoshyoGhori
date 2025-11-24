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
      setSignupMessage('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনি এখন লগইন করতে পারেন।');
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
        return;
      }

      // Check password (plain-text comparison because signup currently stores plain text)
      if (user.password !== loginPassword) {
        setLoginError(true);
        setLoginErrorMessage('ভুল পাসওয়ার্ড।');
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
        <div className="flex justify-center items-center h-screen text-red-500 text-2xl p-4 text-center">
          এই পৃষ্ঠাটি অ্যাক্সেস করতে অনুগ্রহ করে কৃষক হিসাবে লগইন করুন।
        </div>
      );
    }
    return <Dashboard user={loggedInUser} onLogout={logout} />;
  }


  return (

    //signup page
    <>
      
     
      {!loginPage && (
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gray-100">
          <div className="hidden md:block md:w-1/3">
            <img
              className="w-full h-auto"
              src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
              alt="logo"
            />
          </div>
          <div className="bg-white p-8 rounded-2xl flex flex-col space-y-4 w-full max-w-md lg:w-1/2 shadow-lg">
            <h2 className="text-3xl font-bold text-green-800 text-center">
              শস্যঘড়ি সাইন আপ
            </h2>
            <form onSubmit={handleSignUpSubmit}>
              <div className="flex flex-col space-y-4">
                <label
                  htmlFor="username"
                  className="font-medium text-green-700"
                >
                  কৃষকের নাম
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label htmlFor="phone" className="font-medium text-green-700">
                  খামারের ফোন
                </label>
                <input
                  type="number"
                  id="phone"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
                {numberExists && (
                  <div className="text-red-600 ml-2 text-red-600">
                    নম্বরটি ইতিমধ্যে বিদ্যমান!
                  </div>
                )}
                {numbererror && (
                  <div className="text-red-600 ml-2 text-red-600">
                    নম্বরটি ১১ সংখ্যার হতে হবে!
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label
                  htmlFor="password"
                  className="font-medium text-green-700"
                >
                  ফিল্ড পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label
                  htmlFor="location"
                  className="font-medium text-green-700"
                >
                  অবস্থান
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
              </div>
              <div className="flex justify-center">
                <button
                  className="bg-green-700 text-white font-bold rounded-xl h-12 w-full mt-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:shadow-inner transition-all disabled:opacity-60"
                  type="submit"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'সাইন আপ'}
                </button>
              </div>
              {signupMessage && (
                <div className={`text-center text-sm mt-2 ${signupMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {signupMessage}
                </div>
              )}
            </form>
             <p className="text-center text-gray-600 mt-4">
              আপনি কি একজন মহাজন?{' '}
              <Link to="/lender" className="font-bold text-green-700 hover:underline">
                মহাজন পেজে যান
              </Link>
            </p>
            <p className="text-center text-gray-600 mt-4">
              ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
              <button
                onClick={() => setLoginPage(true)}
                className="font-bold text-green-700 hover:underline"
              >
                লগইন
              </button>
            </p>
          </div>
        </div>
      )}





     {
      //Login Page
     }


      {loginPage && (
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gray-100">
          <div className="hidden md:block md:w-1/3 md:mr-12">
            <img
              className="w-full h-auto"
              src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
              alt="logo"
            />
          </div>
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center space-y-4 w-full max-w-md shadow-lg">
            <h2 className="text-3xl font-bold text-green-800 text-center">শস্যঘড়ি লগইন</h2>
            <p className="text-gray-700">খামারে আবার স্বাগতম!</p>

            <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
              <div className="flex flex-col">
                <label htmlFor="loginPhone" className="font-medium text-green-700 mb-1">খামারের ফোন</label>
                <input
                  type="number"
                  id="loginPhone"
                  required
                  value={loginPhone}
                  onChange={(event) => setLoginPhone(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="loginPassword" className="font-medium text-green-700 mb-1">ফিল্ড পাসওয়ার্ড</label>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="loginPassword"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
                />
                <label className="mt-2 text-sm inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showLoginPassword}
                    onChange={(e) => setShowLoginPassword(e.target.checked)}
                    className="mr-2"
                  />
                  পাসওয়ার্ড দেখুন
                </label>
              </div>

              {loginError && (
                <div className="text-red-600 text-center">{loginErrorMessage || 'ভুল ফোন নম্বর বা পাসওয়ার্ড!'}</div>
              )}

              <div className="flex justify-center">
                <button
                  disabled={loginLoading}
                  className="bg-green-700 text-white font-bold rounded-xl h-12 w-full mt-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:shadow-inner transition-all disabled:opacity-60"
                  type="submit"
                >
                  {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন'}
                </button>
              </div>
            </form>

            <p className="text-center text-gray-600 mt-4">অ্যাকাউন্ট নেই?{' '}
              <button onClick={() => setLoginPage(false)} className="font-bold text-green-700 hover:underline">সাইন আপ</button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}