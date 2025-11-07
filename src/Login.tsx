import React, { useState } from 'react';
// A simple inline SVG for a leaf/plant icon



export default function App() {
  // State to toggle between login and sign-up
  const [loginPage, setLoginPage] = useState(false);

  // --- Sign-Up State ---
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [numberExists, setNumberExists] = useState(false);
  const [numbererror, setNumberError] = useState(false);

  // --- Login State ---
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Handle Sign-Up
  const handleSignUpSubmit = (event) => {
    event.preventDefault();
    // Reset errors
    setNumberError(false);
    setNumberExists(false);

    // Validation
    if (phone.length !== 11) {
      setNumberError(true);
      return;
    }
    // Mock check for existing number
    if (phone === '01234567890') {
      setNumberExists(true);
      return;
    }
    console.log('Sign-Up Data:', { username, phone, password });
    // On success, you could switch to login:
    // setLoginPage(true);
  };

  // Handle Login
  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setLoginError(false);

    // Mock login check
    if (loginPhone !== '01234567890' || loginPassword !== 'pass123') {
      setLoginError(true);
      return;
    }
    console.log('Login Success:', { loginPhone, loginPassword });
    // On success, you would proceed to the app dashboard
  };

  return (

    //signup page
    <>
     
     
      {!loginPage && (
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
          <img
            className="hidden md:block md: w-40 h-400 md:w-96 md:h-96 mb-6 md:mb-0"
            src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
            alt="logo"
          />

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] flex flex-col space-y-4 w-full max-w-md lg:w-1/2 shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800">
              ShoshyoGhori Sign Up
            </h2>
            <form onSubmit={handleSignUpSubmit}>
              <div className="flex flex-col space-y-4">
                <label
                  htmlFor="username"
                  className="font-medium text-gray-700"
                >
                  Farmer Name
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="border-2 rounded-[10px] p-2 text-black w-full"
                />
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label htmlFor="phone" className="font-medium text-gray-700">
                  Farm Phone
                </label>
                <input
                  type="number"
                  id="phone"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="border-2 rounded-[10px] p-2 text-black w-full"
                />
                {numberExists && (
                  <div className="text-red-600 ml-2 text-red-600">
                    Number Already exists!
                  </div>
                )}
                {numbererror && (
                  <div className="text-red-600 ml-2 text-red-600">
                    Number should be 11 digits!
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <label
                  htmlFor="password"
                  className="font-medium text-gray-700"
                >
                  Field Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-2 rounded-[10px] p-2 text-black w-full"
                />
              </div>
              <div className="flex justify-center">
                <button
                  className="bg-green-700 text-white rounded-[30px] h-12 w-full mt-6 sm:w-1/2 hover:bg-green-800 transition-colors"
                  type="submit"
                >
                  Sign Up
                </button>
              </div>
            </form>
            <p className="text-center text-gray-600 mt-4">
              Already have an account?{' '}
              <button
                onClick={() => setLoginPage(true)}
                className="font-bold text-green-700 hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      )}





     {
      //Login Page
     }


      {loginPage && (
        <div className="min-h-screen flex flex-col lg:flex-row justify-center items-center p-4 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
          <img
            className="hidden md:block md:mr-[20%] w-40 h-40 md:w-96 md:h-96 mb-6 md:mb-0"
            src="https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/farmer1.png?raw=true"
            alt="logo"
          />

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] flex flex-col items-center space-y-4 w-full max-w-md shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800">ShoshyoGhori Login</h2>
            <p className="text-gray-600">Welcome back to the farm!</p>

            <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
              <div className="flex flex-col">
                <label htmlFor="loginPhone" className="font-medium text-gray-700 mb-1">Farm Phone</label>
                <input
                  type="number"
                  id="loginPhone"
                  required
                  value={loginPhone}
                  onChange={(event) => setLoginPhone(event.target.value)}
                  className="border-2 rounded-[10px] p-2 text-black w-full"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="loginPassword" className="font-medium text-gray-700 mb-1">Field Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="border-2 rounded-[10px] p-2 text-black w-full"
                />
              </div>

              {loginError && <div className="text-red-600 text-center">Invalid phone number or password!</div>}

              <div className="flex justify-center">
                <button className="bg-green-700 text-white rounded-[30px] h-12 w-full mt-4 sm:w-1/2 hover:bg-green-800 transition-colors" type="submit">Login</button>
              </div>
            </form>

            <p className="text-center text-gray-600 mt-4">Don't have an account?{' '}
              <button onClick={() => setLoginPage(false)} className="font-bold text-green-700 hover:underline">Sign Up</button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}