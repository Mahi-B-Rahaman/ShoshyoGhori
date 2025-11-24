import React, { useState, useEffect, useMemo } from "react";
import { useNotifications } from "./NotificationContext";
import { useAuth, type User, type PlantedCrop } from './AuthContext';

interface Crop {
  "Season": string;
  "Transplant": string;
  "Growth": string;
  "Harvest": string;
  "Products name": string;
  "Crops Type": string;
  "Max Temp": string;
  "Min Temp": string;
  "Max Relative Humidity": string;
  "Min Relative Humidity": string;
  "Country": string;
}

interface ForecastDay {
  time: string;
  weathercode: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  relative_humidity_2m_mean: number;
}

// Helper to get the current season in Bangladesh
const getCurrentSeason = (): string => {
  const month = new Date().getMonth(); // 0 (Jan) to 11 (Dec)
  if (month >= 2 && month <= 5) { // March to June
    return "Kharif 1";
  }
  if (month >= 6 && month <= 9) { // July to October
    return "Kharif 2";
  }
  // November to February
  return "Rabi";
};

// Helper to translate season names to Bengali
const translateSeasonToBengali = (season: string): string => {
  switch (season) {
    case "Kharif 1":
      return "খরিপ-১";
    case "Kharif 2":
      return "খরিপ-২";
    case "Rabi":
      return "রবি";
    default:
      return season;
  }
};

function Dashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [suitableCrops, setSuitableCrops] = useState<Crop[]>([]);
  const [plantedCrops, setPlantedCrops] = useState<PlantedCrop[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCropIndex, setSelectedCropIndex] = useState<number | null>(null);
  const [cropToCancel, setCropToCancel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [farmData, setFarmData] = useState({ temperature: 0, humidity: 0 });
  const [userData, setUserData] = useState<User>(user);
  const { setLoggedInUser } = useAuth();
  const { addNotification } = useNotifications();

  const currentSeason = getCurrentSeason();
  const bengaliSeason = translateSeasonToBengali(currentSeason);

  // Central API URL
  const userApiUrl = `https://shoshyo-ghori-data-api.vercel.app/api/sensordata/${user._id}`;

  // Effect to fetch initial user data (temp, humidity, planted crops)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(userApiUrl);
        if (!res.ok) throw new Error("ব্যবহারকারীর ডেটা আনতে ব্যর্থ হয়েছে।");
        const fetchedUserData: User = await res.json();
        setUserData(fetchedUserData);
        setFarmData({
          temperature: (fetchedUserData as any).temp1 || 0, // Cast to any to access old property
          humidity: (fetchedUserData as any).soilHumidity || 0, // Cast to any to access old property
        });
        // Ensure plantedDate is a Date object
        const userPlantedCrops = (fetchedUserData.crops || []).map(pc => ({
          ...pc,
          plantedDate: new Date(), // Fallback, as the new schema doesn't store this
        }));
        setPlantedCrops(userPlantedCrops);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUserData();
  }, [user]);

  // Effect to fetch weather data once user lat/lon are available
  useEffect(() => {
    if (userData.lat && userData.lon) {
      const fetchWeather = async () => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${userData.lat}&longitude=${userData.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean&timezone=auto&forecast_days=3`;
          const res = await fetch(weatherUrl);
          if (!res.ok) throw new Error("আবহাওয়ার তথ্য আনতে ব্যর্থ হয়েছে।");
          const weatherData = await res.json();
          const dailyData = weatherData.daily.time.map((t: string, i: number) => ({
            time: t,
            weathercode: weatherData.daily.weathercode[i],
            temperature_2m_max: weatherData.daily.temperature_2m_max[i],
            temperature_2m_min: weatherData.daily.temperature_2m_min[i],
            relative_humidity_2m_mean: weatherData.daily.relative_humidity_2m_mean[i],
          }));
          setForecast(dailyData);
        } catch (err: any) {
          console.warn(err.message); // Don't block UI for weather error
        }
      };
      fetchWeather();
    }
  }, [userData]);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await fetch(
          'https://crop-clock-api-bng.vercel.app/crops.json'
        );
        if (!response.ok) {
          throw new Error("তথ্য আনতে ব্যর্থ হয়েছে।");
        }
        // The API has a typo: 'Z "Vegetable"' instead of '"Vegetable"'.
        // We fetch as text, clean it, then parse.
        const rawText = await response.text();
        const cleanedText = rawText.replace(/:Z\s*"/g, ': "');
        const data: Crop[] = JSON.parse(cleanedText);
        setAllCrops(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  // Effect for humidity notifications
  useEffect(() => {
    if (user.accountType !== 'lender' && farmData.humidity > 0) {
      if (farmData.humidity < 20) {
        addNotification('মাটির আর্দ্রতা খুব কম। অনুগ্রহ করে জমিতে পানি দিন।', 'warning');
      } else if (farmData.humidity > 80) { // Assuming > 80 is "too much"
        addNotification('মাটির আর্দ্রতা খুব বেশি। জলাবদ্ধতা পরীক্ষা করুন।', 'warning');
      }
    }
  }, [farmData.humidity, addNotification, user.accountType]);


  // Effect for temperature notifications
  useEffect(() => {
    if (user.accountType !== 'lender' && farmData.temperature > 30) {
      addNotification('তাপমাত্রা ৩০°C এর বেশি। নিজের যত্ন নিন, প্রচুর পানি পান করুন এবং প্রয়োজনে ফসলে পানি দিন।', 'warning');
    }
  }, [farmData.temperature, addNotification, user.accountType]);

  useEffect(() => {
    // This effect now depends on `forecast` to get the relative humidity for today.
    if (allCrops.length > 0 && forecast && forecast.length > 0) {
      const todayForecast = forecast[0];
      const relativeHumidity = todayForecast.relative_humidity_2m_mean;

      const filteredCrops = allCrops.filter(crop => {
        // The humidity values in the API seem to be swapped.
        // "Min Relative Humidity": "85", "Max Relative Humidity": "60"
        // We will use Math.min and Math.max to get the correct range.
        const minTemp = parseFloat(crop["Min Temp"]);
        const maxTemp = parseFloat(crop["Max Temp"]);
        const minHumidity = Math.min(parseFloat(crop["Min Relative Humidity"]), parseFloat(crop["Max Relative Humidity"]));
        const maxHumidity = Math.max(parseFloat(crop["Min Relative Humidity"]), parseFloat(crop["Max Relative Humidity"]));

        const isSeasonMatch = crop.Season === currentSeason;
        const isTempMatch = farmData.temperature >= minTemp && farmData.temperature <= maxTemp;
        const isHumidityMatch = relativeHumidity >= minHumidity && relativeHumidity <= maxHumidity;

        return isSeasonMatch && isTempMatch && isHumidityMatch;
      });
      setSuitableCrops(filteredCrops);
    }
  }, [allCrops, currentSeason, farmData.temperature, forecast]);

  const seasonalCrops = useMemo(() => {
    // First, filter all crops down to only the current season.
    return allCrops.filter(crop => crop.Season === currentSeason);
  }, [allCrops, currentSeason]);

  const displayedCrops = useMemo(() => {
    if (!searchQuery) {
      // When search is empty, show all crops for the current season.
      return seasonalCrops;
    }
    // When searching, filter from the already-seasonal crops.
    return seasonalCrops.filter(crop =>
      crop["Products name"].toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, seasonalCrops]);


  const suitableCropSet = useMemo(() => {
    // A fast way to check if a crop is suitable
    return new Set(suitableCrops.map(c => c["Products name"]));
  }, [suitableCrops]);

  const plantedCropSet = useMemo(() => {
    // A fast way to check if a crop is already planted
    return new Set(plantedCrops.map(pc => pc.cropName));
  }, [plantedCrops]);

  const handleCropSelect = (crop: Crop, index: number) => {
    // Don't do anything if the crop is already planted
    if (plantedCropSet.has(crop["Products name"])) return;

    if (selectedCropIndex === index) {
      setSelectedCropIndex(null); // Deselect if the same card is clicked again
    } else {
      setSelectedCropIndex(index);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setSelectedCropIndex(null); // Reset selection when search query changes
  };

  const handleConfirmPlanting = async () => {
    if (selectedCropIndex === null) return;

    const cropToPlant = displayedCrops[selectedCropIndex];
    if (cropToPlant && !plantedCropSet.has(cropToPlant["Products name"])) {
      const newPlantedCrop: PlantedCrop = {
        cropName: cropToPlant["Products name"],
        planMonth: cropToPlant.Transplant,
        Harvest: cropToPlant.Harvest,
        plantedDate: new Date(),
      };
      const updatedPlantedCrops = [...plantedCrops, newPlantedCrop];

      try {
        const res = await fetch(userApiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            // Send the new `crops` array matching the new schema
            crops: updatedPlantedCrops.map(({ cropName, planMonth, Harvest }) => ({ cropName, planMonth, Harvest })),
          }),
        });
        if (!res.ok) throw new Error("ফসল যোগ করতে ব্যর্থ হয়েছে।");
        setPlantedCrops(updatedPlantedCrops);
        // Also update the user object in the auth context to keep it in sync
        const updatedUser = { ...user, plantedCrops: updatedPlantedCrops };
        setLoggedInUser(updatedUser);
      } catch (err: any) {
        setError(err.message);
      }
    }
    setSelectedCropIndex(null); // Close modal and deselect
  };

  const handleCancelPlanting = () => {
    setSelectedCropIndex(null); // Close modal but keep it selected in the list if needed
  };

  const initiateRemovePlantedCrop = (cropNameToRemove: string) => {
    setCropToCancel(cropNameToRemove);
  };

  const confirmRemovePlantedCrop = async () => {
    if (!cropToCancel) return;
    const updatedPlantedCrops = plantedCrops.filter(pc => pc.cropName !== cropToCancel);

    try {
      const res = await fetch(userApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Send the updated `crops` array
          crops: updatedPlantedCrops.map(({ cropName, planMonth, Harvest }) => ({ cropName, planMonth, Harvest })),
        }),
      });
      if (!res.ok) throw new Error("ফসল মুছে ফেলতে ব্যর্থ হয়েছে।");
      setPlantedCrops(updatedPlantedCrops);
    } catch (err: any) {
      setError(err.message);
    }
    setCropToCancel(null); // Hide modal
  };

  const cancelRemovePlantedCrop = () => {
    setCropToCancel(null); // Hide modal
  };

  const handleSelectFeaturedCrop = (crop: PlantedCrop) => {
    localStorage.setItem('featuredCropName', crop.cropName);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">লোড হচ্ছে...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  const selectedCrop = selectedCropIndex !== null ? displayedCrops[selectedCropIndex] : null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="p-4 md:p-8 relative flex-grow">
      {/* Confirmation Modal */}
      {selectedCrop && !plantedCropSet.has(selectedCrop["Products name"]) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">নিশ্চিত করুন</h2>
            <p className="text-lg mb-6">
              আপনি কি সত্যিই <span className="font-bold text-green-700">{selectedCrop["Products name"]}</span> রোপণ করতে চান?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCancelPlanting}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                না
              </button>
              <button
                onClick={handleConfirmPlanting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                হ্যাঁ, নিশ্চিত
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cropToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">বাতিল নিশ্চিত করুন</h2>
            <p className="text-lg mb-6">
              আপনি কি সত্যিই <span className="font-bold text-red-700">{cropToCancel}</span> তালিকা থেকে মুছে ফেলতে চান?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelRemovePlantedCrop}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                না
              </button>
              <button
                onClick={confirmRemovePlantedCrop}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Weather Section with Background */}
      <div className="relative rounded-3xl overflow-hidden mb-12 p-8 text-white shadow-2xl" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative z-10">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2">কৃষকের ড্যাশবোর্ড</h1>
            <div className="text-lg text-gray-200">
              <p>স্বাগতম, <span className="font-semibold text-white">{user.name}</span>!</p>
              <p>জমির তাপমাত্রা: <span className="font-semibold text-white">{farmData.temperature}°C</span></p>
              <p>মাটির আর্দ্রতা: <span className="font-semibold text-white">{farmData.humidity}%</span></p>
              {forecast && forecast.length > 0 && (
                <p>আপেক্ষিক আর্দ্রতা: <span className="font-semibold text-white">{Math.round(forecast[0].relative_humidity_2m_mean)}%</span></p>
              )}
            </div>
          </header>

          {/* Weather Forecast Section */}
          {forecast && (
            <section>
              <h2 className="text-2xl font-bold mb-4">আবহাওয়ার পূর্বাভাস</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {forecast.map((day, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg text-center border border-white/30">
                    <p className="font-bold text-lg">{new Date(day.time).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric' })}</p>
                    <p className="text-3xl my-2">{getWeatherIcon(day.weathercode)}</p>
                    <p className="text-xl font-semibold">{Math.round(day.temperature_2m_max)}° / {Math.round(day.temperature_2m_min)}°</p>
                    <p className="text-gray-200">আর্দ্রতা: {Math.round(day.relative_humidity_2m_mean)}%</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          </div>
      </div>

      <main className="flex flex-col">
        <div className="mb-6">
          <label htmlFor="search" className="text-xl font-bold text-gray-800 mb-2 block">
            ফসল অনুসন্ধান করুন
          </label> ({bengaliSeason} মৌসুম)
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ফসলের নাম লিখুন..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner bg-gray-50"
          />
        </div>

        {displayedCrops.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCrops.map((crop, index) => {
                const isSuitable = suitableCropSet.has(crop["Products name"]);
                const plantedInfo = plantedCrops.find(pc => pc.cropName === crop["Products name"]);
                const isPlanted = !!plantedInfo;
                const key = `${crop["Products name"]}-${index}`;

                if (isPlanted && plantedInfo) {
                  return <PlantedCropCard
                    key={key}
                    plantedCrop={plantedInfo}
                    onRemove={initiateRemovePlantedCrop}
                    onSelect={() => handleSelectFeaturedCrop(plantedInfo)}
                  />;
                }

                return <CropCard
                  key={key}
                  crop={crop}
                  isSuitable={isSuitable}
                  onClick={() => isSuitable && handleCropSelect(crop, index)}
                />;
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-10">
            {searchQuery
              ? `এই মৌসুমে "${searchQuery}" নামে কোনো ফসল পাওয়া যায়নি।`
              : `এই মৌসুমে (${bengaliSeason}) কোনো ফসল পাওয়া যায়নি।`}
          </p>
        )}
      </main>
    </div>
    </div>
  );
}

const CropCard = ({ crop, isSuitable, onClick }: { crop: Crop; isSuitable: boolean; onClick: () => void; }) => (
  <div
    onClick={onClick}
    style={{ backgroundImage: `url(https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/crops.jpg?raw=true)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    className={`relative p-4 rounded-2xl shadow-lg transition-all duration-300 flex flex-col justify-end h-48 overflow-hidden ${
      isSuitable
        ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
        : 'cursor-not-allowed shadow-md'
    }`}
  >
    <div className={`absolute inset-0 ${isSuitable ? 'bg-black/40' : 'bg-red-900/60'}`}></div>
    <div className="relative z-10 text-white">
      <h3 className="text-lg font-bold mb-1">{crop["Products name"]}</h3>
      <p className="text-sm text-gray-200"><span className="font-semibold">ধরন:</span> {crop["Crops Type"]}</p>
      <p className="text-sm text-gray-200"><span className="font-semibold">রোপণ:</span> {crop.Transplant}</p>
      <p className="text-sm text-gray-200"><span className="font-semibold">ফসল তোলা:</span> {crop.Harvest}</p>
      {!isSuitable && (
        <p className="text-xs font-bold text-yellow-300 mt-2">এই আবহাওয়ার জন্য উপযুক্ত নয়</p>
      )}
    </div>
  </div>
);

const PlantedCropCard = ({ plantedCrop, onRemove, onSelect }: { plantedCrop: PlantedCrop; onRemove: (cropName: string) => void; onSelect: () => void; }) => {
  const { cropName, planMonth, Harvest, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return months.indexOf(monthName.slice(0, 3).toLowerCase());
  };
  
  // Handle cases where Transplant might be undefined or not a string
  const transplantMonth = typeof planMonth === 'string' ? getMonthNumber(planMonth) : new Date(plantedDate!).getMonth();
  const harvestMonth = getMonthNumber(Harvest);

  // Handle year wrap-around (e.g., Transplant in Nov, Harvest in Feb)
  const totalDurationDays = harvestMonth >= transplantMonth
    ? (harvestMonth - transplantMonth) * 30 // Approximation
    : (12 - transplantMonth + harvestMonth) * 30;

  const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plantedDate!).getTime()) / (1000 * 60 * 60 * 24));
  
  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <div
      onClick={onSelect}
      style={{ backgroundImage: `url(https://github.com/Mahi-B-Rahaman/ShoshyoGhori/blob/master/public/crops.jpg?raw=true)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="relative p-4 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end h-48 overflow-hidden"
    >
      <div className="absolute inset-0 bg-blue-900/50"></div>
      <button
        onClick={() => onRemove(cropName)}
        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-600 active:shadow-inner transition-all text-lg font-bold leading-none"
        aria-label="বাতিল করুন"
        title="বাতিল করুন"
      >
        &times;
      </button>
      <div className="relative z-10 text-white">
        <h3 className="text-lg font-bold mb-1">{cropName}</h3>
        <p className="text-sm text-gray-200 mb-2"><span className="font-semibold">রোপণ করা হয়েছে</span></p>
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium">অগ্রগতি</span>
          <span className="text-xs font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2.5">
          <div
            className="bg-white h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const getWeatherIcon = (code: number): string => {
  if (code === 0) return '☀️'; // Clear sky
  if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, and overcast
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 57) return '🌧️'; // Drizzle
  if (code >= 61 && code <= 67) return '🌧️'; // Rain
  if (code >= 71 && code <= 77) return '❄️'; // Snow fall
  if (code >= 80 && code <= 82) return ' şiddetli'; // Rain showers
  if (code >= 85 && code <= 86) return '❄️'; // Snow showers
  if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
  return '❔';
};

export default Dashboard;
