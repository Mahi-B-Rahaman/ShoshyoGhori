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

  // State for planted crops management
  const [plantedCrops, setPlantedCrops] = useState<PlantedCrop[]>([]);
  const [cropToCancel, setCropToCancel] = useState<PlantedCrop | null>(null);
  const [featuredCrop, setFeaturedCrop] = useState<PlantedCrop | null>(null);

  useEffect(() => {
    const initializeProfile = async () => {
      if (loggedInUser) {
        setName(loggedInUser.name);
        setPhone(loggedInUser.phone);
        setLocation(loggedInUser.location || '');

        if (loggedInUser.accountType === 'farmer') {
          const cropsToDisplay = (loggedInUser.crops || []).map(pc => ({
            ...pc,
            // Add a plantedDate for progress calculation, fallback to now
            plantedDate: pc.plantedDate || new Date(),
          }));

          setPlantedCrops(cropsToDisplay);

          // Check for a featured crop from localStorage
          const featuredCropName = localStorage.getItem('featuredCropName');
          if (featuredCropName) {
            const foundCrop = cropsToDisplay.find(pc => pc.cropName === featuredCropName);
            if (foundCrop) setFeaturedCrop(foundCrop);
          }
        }
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

  const handleRemoveCrop = async () => {
    if (!cropToCancel || !loggedInUser) return;

    // If the crop being removed is the featured crop, clear the state and localStorage
    if (featuredCrop && cropToCancel.cropName === featuredCrop.cropName) {
      setFeaturedCrop(null);
      localStorage.removeItem('featuredCropName');
    }

    const updatedPlantedCrops = plantedCrops.filter(
      pc => pc.cropName !== cropToCancel.cropName
    );

    try {
      const url = `https://shoshyo-ghori-data-api.vercel.app/api/sensordata/${loggedInUser._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crops: updatedPlantedCrops.map(({ cropName, planMonth, Harvest }) => ({ cropName, planMonth, Harvest })),
        }),
      });

      if (!res.ok) throw new Error("ফসল মুছে ফেলতে ব্যর্থ হয়েছে।");

      setPlantedCrops(updatedPlantedCrops);
      // Also update the user object in the auth context
      const updatedUser = { ...loggedInUser, crops: updatedPlantedCrops };
      setLoggedInUser(updatedUser);

    } catch (error: any) {
      setMessage(`ত্রুটি: ${error.message}`);
    } finally {
      setCropToCancel(null); // Close the modal
    }
  };

  if (!loggedInUser) {
    return null; // or a loading spinner while redirecting
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-green-800 mb-8">আমার প্রোফাইল</h1>
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

        {/* Planted Crops Section for Farmers */}
        {loggedInUser.accountType === 'farmer' && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-green-800 mb-6 border-t pt-8">আমার রোপণ করা ফসল</h2>
            {plantedCrops.length > 0 ? (
              <div className="space-y-4">
                {plantedCrops.map((pc) => (
                  <PlantedCropItem 
                    key={pc.cropName} 
                    plantedCrop={pc} 
                    onRemove={() => setCropToCancel(pc)} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">আপনি এখনো কোনো ফসল রোপণ করেননি।</p>
            )}
          </div>
        )}

        {/* Featured Crop Progress Bar - moved to the bottom */}
        {featuredCrop && (
          <div className="mt-12">
             <FeaturedCropProgress 
              plantedCrop={featuredCrop} 
              onRemove={() => setCropToCancel(featuredCrop)} 
            />
          </div>
        )}
      </div>

      {/* Remove Crop Confirmation Modal */}
      {cropToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">বাতিল নিশ্চিত করুন</h2>
            <p className="text-lg mb-6">
              আপনি কি সত্যিই <span className="font-bold text-red-700">{cropToCancel.cropName}</span> তালিকা থেকে মুছে ফেলতে চান?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCropToCancel(null)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                না
              </button>
              <button
                onClick={handleRemoveCrop}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Component for the main featured crop progress bar ---
const FeaturedCropProgress = ({ plantedCrop, onRemove }: { plantedCrop: PlantedCrop; onRemove: () => void; }) => {
  const { cropName, planMonth, Harvest, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return months.indexOf(monthName.slice(0, 3).toLowerCase());
  };

  const transplantMonth = typeof planMonth === 'string' ? getMonthNumber(planMonth) : new Date(plantedDate!).getMonth();
  const harvestMonth = getMonthNumber(Harvest);

  const totalDurationDays = harvestMonth >= transplantMonth
    ? (harvestMonth - transplantMonth) * 30
    : (12 - transplantMonth + harvestMonth) * 30;

  const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plantedDate!).getTime()) / (1000 * 60 * 60 * 24));

  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <section className="mb-8 p-6 rounded-2xl shadow-lg bg-gray-50 border-l-8 border-green-600">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold text-gray-800 mb-4">নির্বাচিত ফসল: <span className="text-green-700">{cropName}</span></h2>
        <button
          onClick={onRemove}
          className="bg-red-100 text-red-600 rounded-full w-7 h-7 flex items-center justify-center shadow-sm hover:bg-red-200 active:shadow-inner transition-all text-lg font-bold leading-none flex-shrink-0 -mt-2 -mr-2"
          aria-label="বাতিল করুন"
          title="বাতিল করুন"
        >
          &times;
        </button>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-green-700">অগ্রগতি</span>
          <span className="text-sm font-medium text-green-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3.5">
          <div className="bg-green-600 h-3.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>রোপণ ({planMonth})</span>
          <span>ফসল তোলা ({Harvest})</span>
        </div>
      </div>
    </section>
  );
};

// --- Helper Component for Displaying a Planted Crop ---
const PlantedCropItem = ({ plantedCrop, onRemove }: { plantedCrop: PlantedCrop; onRemove: () => void; }) => {
  const { cropName, planMonth, Harvest, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(monthName.slice(0, 3).toLowerCase());
  const transplantMonth = new Date(plantedDate!).getMonth();
  const harvestMonth = getMonthNumber(Harvest);
  const totalDurationDays = harvestMonth >= transplantMonth ? (harvestMonth - transplantMonth) * 30 : (12 - transplantMonth + harvestMonth) * 30;
  const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plantedDate!).getTime()) / (1000 * 60 * 60 * 24));
  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between gap-4">
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800">{cropName}</h3>
          <span className="text-sm font-medium text-green-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-red-200 active:shadow-inner transition-all text-lg font-bold leading-none flex-shrink-0"
        aria-label="বাতিল করুন"
        title="বাতিল করুন"
      >
        &times;
      </button>
    </div>
  );
};

export default ProfilePage;