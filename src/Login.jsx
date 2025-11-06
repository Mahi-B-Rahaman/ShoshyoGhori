import { useState, useEffect } from 'react'

const Login = () => {
  
  const [loginPage, setLoginPage] = useState(false);
  const [loginStatus, setLoginStatus] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [numberExists, setNumberExists] = useState(false);
  const [numbererror, setNumberError] = useState(false);

  useEffect(() => {
    const checkNumberExists = () => {
      if (phoneNumbers.includes(phone)) {
        setNumberExists(true);
      } else {
        setNumberExists(false);
      }

      if(phone.length !== 11){
      setNumberError(true);
    }
    else{
      setNumberError(false);
    }
    };
    checkNumberExists();
    console.log(numberExists);
  }, [phoneNumbers, phone]);

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      const url = "https://shoshyo-ghori-data-api.vercel.app/api/sensordata";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        setPhoneNumbers(result.map(result => result.phone));
      } catch (error) {
        console.error(error.message);
      }

    };
    fetchPhoneNumbers();
  }, []);
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (password && !numberExists && !numbererror) {
      const formData = {
        name: username,
        phone: phone,
        password: password
      };

      fetch('https://shoshyo-ghori-data-api.vercel.app/api/sensordata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
        .then(response => response.json())
        .then(data => console.log(""))
        .catch(error => console.error('Error submitting form:', error));
      setLoginStatus(true);
      setUsername('');
      setPhone('');
      setPassword('');
    }
  }

  return (
    <>
    { !loginPage && 

      
      <div className=" h-screen flex flex-row justify-center items-center ">
     
        <img src="./src/assets/farmer1.png" alt="logo" className="ml-[20%] w-90 h-90 mb-4" />

        <div className="bg-[rgba(255,255,255,0.2)] p-8 rounded-[30px] flex flex-col space-y-4 w-1/2 mr-[20%]">
         
          <h2 className="text-3xl font-bold text-black">ShoshyoGhori Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">
              <label className='ml-' htmlFor="username">Farmer Name</label>
              <input type="text" id="username" required value={username} onChange={event => setUsername(event.target.value)} className="border-2 rounded-[10px] p-2  text-black w-70" />
            </div>
            <div className="flex flex-col space-y-4">
              <label className='ml-' htmlFor="phone">Farm Phone</label>
              <input type="number" id="phone" required value={phone} onChange={event => setPhone(event.target.value)} className="border-2 rounded-[10px] p-2 text-black w-70" />

              { 
              numberExists && <div className="text-red-600 ml-2 text-red mb-4 ">Number Already exists!</div>
              }{ 
              numbererror && <div className="text-red-600 ml-2 text-red mb-4 ">Number should be 11 digits!</div>
              }

            </div>
            <div className="flex flex-col space-y-4">
              <label htmlFor="password">Field Password</label>
              <input type="password" id="password" required value={password} onChange={event => setPassword(event.target.value)} className="border-2 rounded-[10px] p-2 text-black w-70" />
            </div>
            <div className="flex justify-center">
              <button className='bg-black text-white rounded-[30px] h-12 w-full mt-4 sd:w-1/2 sd:mx-auto' type="submit">Sign Up</button>
            </div>
          </form>
        </div>
        

      </div>
      }
    
    
    

    { loginPage && 
      <div className='bg-gray-300 h-screen flex flex-col justify-center items-center'>
        
      </div>
    }



    </>
  )
}

export default Login

