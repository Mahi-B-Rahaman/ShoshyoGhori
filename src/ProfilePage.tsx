import React, { useState, useEffect } from 'react';
import { useAuth, type User } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface Crop {
  "Products name": string;
  "Transplant": string;
  "Harvest": string;
}

interface PlantedCrop {
  crop: Crop;
  plantedDate: Date;
}

const ProfilePage = () => {
  const { loggedInUser, setLoggedInUser, logout } = useAuth();
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

  useEffect(() => {
    if (loggedInUser) {
      setName(loggedInUser.name);
      setPhone(loggedInUser.phone);
      setLocation(loggedInUser.location || '');
      // Ensure plantedCrops are correctly parsed with Date objects
      if (loggedInUser.accountType === 'farmer' && loggedInUser.plantedCrops) {
        const parsedCrops = loggedInUser.plantedCrops.map(pc => ({
          ...pc,
          plantedDate: new Date(pc.plantedDate),
        }));
        setPlantedCrops(parsedCrops);
      }
    } else {
      // If no user is logged in, redirect to home
      navigate('/');
    }
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

    const updatedPlantedCrops = plantedCrops.filter(
      pc => pc.crop["Products name"] !== cropToCancel.crop["Products name"]
    );

    const cropNames = updatedPlantedCrops.map(pc => pc.crop["Products name"]);
    const harvestDates = updatedPlantedCrops.map(pc => pc.crop.Harvest);

    try {
      const url = `https://shoshyo-ghori-data-api.vercel.app/api/sensordata/${loggedInUser._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: cropNames,
          harvest: harvestDates,
          plantedCrops: updatedPlantedCrops,
        }),
      });

      if (!res.ok) throw new Error("ফসল মুছে ফেলতে ব্যর্থ হয়েছে।");

      setPlantedCrops(updatedPlantedCrops);
      // Also update the user object in the auth context
      const updatedUser = { ...loggedInUser, plantedCrops: updatedPlantedCrops };
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
                    key={pc.crop["Products name"]} 
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
      </div>

      {/* Remove Crop Confirmation Modal */}
      {cropToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">বাতিল নিশ্চিত করুন</h2>
            <p className="text-lg mb-6">
              আপনি কি সত্যিই <span className="font-bold text-red-700">{cropToCancel.crop["Products name"]}</span> তালিকা থেকে মুছে ফেলতে চান?
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

// --- Helper Component for Displaying a Planted Crop ---
const PlantedCropItem = ({ plantedCrop, onRemove }: { plantedCrop: PlantedCrop; onRemove: () => void; }) => {
  const { crop, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(monthName.slice(0, 3).toLowerCase());
  const transplantMonth = new Date(plantedDate).getMonth();
  const harvestMonth = getMonthNumber(crop.Harvest);
  const totalDurationDays = harvestMonth >= transplantMonth ? (harvestMonth - transplantMonth) * 30 : (12 - transplantMonth + harvestMonth) * 30;
  const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24));
  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between gap-4">
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800">{crop["Products name"]}</h3>
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