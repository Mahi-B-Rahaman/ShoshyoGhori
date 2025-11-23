import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface Rental {
  _id: string;
  items: string;
  itemDesc?: string;
  rentDate: string;
  returnDate: string;
  price: number;
  rentedByName?: string;
  rentedByNumber?: string;
}

interface User {
  _id: string;
  name: string;
  phone: string;
  password?: string; // Password might not be needed on the frontend after login
  ipAddress?: string;
  lat?: number;
  lon?: number;
  rentals?: Rental[];
  accountType?: string;
}




const LenderPage = () => {
const { loggedInUser, setLoggedInUser } = useAuth();
const [LenderloginPage, setLenderloginPage] = useState(false);
const [username, setUsername] = useState('');
const [phone, setPhone] = useState('');
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
      setLoggedInUser(user);
      console.log('Logged in user data:', user);

      // Save credentials to localStorage for persistent login
      localStorage.setItem('userId', user._id);

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
          accountType: 'lender',
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
      setUserData(updatedUser);
      setLoggedInUser(updatedUser);

      // Clear form fields
      setItemName(''); 
      setItemDesc('');
      setRentDate('');
      setReturnDate('');
      setPrice('');
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
      setLoggedInUser(updatedUser); // Update local state

    } catch (error) {
      console.error('Failed to remove listing:', error);
      // Optionally, show an error message to the user
    }
  };
  return (
    <>
      
     
      {!LenderloginPage && !loggedIn &&(
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
          <img
            className="hidden md:block md: w-40 h-400 md:w-96 md:h-96 mb-6 md:mb-0"
            src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
            alt="logo"
          />

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] flex flex-col space-y-4 w-full max-w-md lg:w-1/2 shadow-xl">
            <h2 className="text-3xl font-bold text-green-800">
              মহাজন সাইন আপ
            </h2>
            <form onSubmit={handleSignUpSubmit}>
              <div className="flex flex-col space-y-4">
                <label
                  htmlFor="username"
                  className="font-medium text-green-700"
                >
                  মহাজনের নাম
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="border-2 border-green-300 rounded-[10px] p-2 text-black w-full focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label htmlFor="phone" className="font-medium text-green-700">
                  মহাজনের ফোন
                </label>
                <input
                  type="number"
                  id="phone"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="border-2 border-green-300 rounded-[10px] p-2 text-black w-full focus:ring-green-500 focus:border-green-500"
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
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-2 border-green-300 rounded-[10px] p-2 text-black w-full focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex justify-center">
                <button
                  className="bg-green-700 text-white rounded-[30px] h-12 w-full mt-6 sm:w-1/2 hover:bg-green-800 transition-colors disabled:opacity-60"
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
              ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
              <button
                onClick={() => setLenderloginPage(true)}
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


      {LenderloginPage && !loggedIn && (
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
          <img
            className="hidden md:block md:mr-[20%] w-40 h-40 md:w-96 md:h-96 mb-6 md:mb-0"
            src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
            alt="logo"
          />

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] flex flex-col items-center space-y-4 w-full max-w-md shadow-xl">
            <h2 className="text-3xl font-bold text-green-800">মহাজন লগইন</h2>
            <p className="text-gray-600">আবারও স্বাগতম!</p>

            <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
              <div className="flex flex-col">
                <label htmlFor="loginPhone" className="font-medium text-green-700 mb-1">ফোন নম্বর</label>
                <input
                  type="number"
                  id="loginPhone"
                  required
                  value={loginPhone}
                  onChange={(event) => setLoginPhone(event.target.value)}
                  className="border-2 border-green-300 rounded-[10px] p-2 text-black w-full focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="loginPassword" className="font-medium text-green-700 mb-1">পাসওয়ার্ড</label>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="loginPassword"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="border-2 border-green-300 rounded-[10px] p-2 text-black w-full focus:ring-green-500 focus:border-green-500"
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
                  className="bg-green-700 text-white rounded-[30px] h-12 w-full mt-4 sm:w-1/2 hover:bg-green-800 transition-colors disabled:opacity-60"
                  type="submit"
                >
                  {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন'}
                </button>
              </div>
            </form>

            <p className="text-center text-gray-600 mt-4">অ্যাকাউন্ট নেই?{' '}
              <button onClick={() => setLenderloginPage(false)} className="font-bold text-green-700 hover:underline">সাইন আপ</button>
            </p>
          </div>
        </div>
      )}



      {loggedIn && userData && (
        <>
          {/* Lender Dashboard or Welcome Page & show renter items */}
            
          <div className="min-h-screen p-8 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-green-800 mb-2">মহাজন ড্যাশবোর্ড</h1>
              <p className="text-lg text-gray-600">স্বাগতম, <span className="font-semibold">{userData.name}</span>!</p>
            </header>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">আপনার ভাড়া দেওয়া আইটেম</h2>
              {userData.rentals && userData.rentals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userData.rentals.map((rental) => ( 
                    <div key={rental._id} className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-lg border-l-4 border-green-500 relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <h3 className="text-xl font-bold text-blue-800 mb-2">{rental.items}</h3>
                      
                      <p className="text-gray-700"><span className="font-semibold">মহাজনের নাম:</span> { (userData.name)}</p>
                      <p className="text-gray-700 mt-2 font-semibold">
                        বিবরণ: <span className="font-normal text-gray-600">{rental.itemDesc || 'নেই'}</span>
                      </p>
                      <p className="text-gray-700"><span className="font-semibold">মহাজনের ফোন:</span> { (userData.phone)}</p>
                      <p className="text-gray-700"><span className="font-semibold">ভাড়ার তারিখ:</span> {new Date(rental.rentDate).toLocaleDateString()}</p>
                      <p className="text-gray-700"><span className="font-semibold">ফেরতের তারিখ:</span> {new Date(rental.returnDate).toLocaleDateString()}</p>
                      <p className="text-gray-700 mt-2 font-bold text-lg">মূল্য: <span className="text-green-600">${rental.price}</span></p>
                      {rental.rentedByName && (
                        <div className="mt-4 pt-4 border-t border-yellow-400 bg-yellow-50 p-3 rounded-md">
                          <p className="font-semibold text-yellow-800">ভাড়া নিয়েছেন: {rental.rentedByName}</p>
                          <p className="text-sm text-yellow-700">যোগাযোগ: {rental.rentedByNumber}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveListing(rental._id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 transition-colors text-lg font-bold leading-none"
                        aria-label="তালিকা সরান"
                        title="তালিকা সরান"
                      >&times;</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 mt-10">আপনার বর্তমানে কোনো আইটেম ভাড়া দেওয়া নেই।</p>
              )}
            </section>
          </div>

          {/* Create New Listing Form */}
          <div className="p-8">
            <section className="bg-white/70 backdrop-blur-md p-8 rounded-lg shadow-lg mt-8">
              <h2 className="text-2xl font-bold text-green-800 mb-6">নতুন ভাড়ার তালিকা তৈরি করুন</h2>
              <form onSubmit={handleCreateListingSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Item Name */}
                  <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">আইটেমের নাম</label> 
                    <input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-300" />
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">মূল্য ($)</label>
                    <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-300" />
                  </div>

                  {/* Item Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="itemDesc" className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                    <textarea id="itemDesc" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-300"></textarea>
                  </div>

                  {/* Rent Date */}
                  <div>
                    <label htmlFor="rentDate" className="block text-sm font-medium text-gray-700 mb-1">ভাড়া শুরুর তারিখ</label>
                    <input type="date" id="rentDate" value={rentDate} onChange={(e) => setRentDate(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-300" />
                  </div>

                  {/* Return Date */}
                  <div>
                    <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">ভাড়া শেষের তারিখ</label>
                    <input type="date" id="returnDate" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-300" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                  {listingMessage && (
                    <p className={`text-sm ${listingMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {listingMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                  >
                    তালিকা তৈরি করুন
                  </button>
                </div>
              </form>
            </section>
          </div>








        </>
        )
      }






    </>
  );

};















export default LenderPage;
