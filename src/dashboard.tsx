import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";

interface User {
  _id: string;
  name: string;
  phone: string;
  soilHumidity: number;
  temp1: number;
  plantedCrops?: PlantedCrop[];
  lat?: number;
  lon?: number;
}
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

interface PlantedCrop {
  crop: Crop;
  plantedDate: Date;
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
  const [featuredCrop, setFeaturedCrop] = useState<PlantedCrop | null>(null);

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
          temperature: fetchedUserData.temp1 || 0,
          humidity: fetchedUserData.soilHumidity || 0,
        });
        // Ensure plantedDate is a Date object
        const userPlantedCrops = (fetchedUserData.plantedCrops || []).map(pc => ({
          ...pc,
          plantedDate: new Date(pc.plantedDate),
        }));
        setPlantedCrops(userPlantedCrops);

        // Check for a featured crop from localStorage
        const featuredCropName = localStorage.getItem('featuredCropName');
        if (featuredCropName) {
          const foundCrop = userPlantedCrops.find(pc => pc.crop["Products name"] === featuredCropName);
          if (foundCrop) setFeaturedCrop(foundCrop);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUserData();
  }, [user._id, userApiUrl]);

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
    return new Set(plantedCrops.map(pc => pc.crop["Products name"]));
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
      const newPlantedCrop = { crop: cropToPlant, plantedDate: new Date() };
      const updatedPlantedCrops = [...plantedCrops, newPlantedCrop];
      
      // Prepare data in the format the API expects
      const cropNames = updatedPlantedCrops.map(pc => pc.crop["Products name"]);
      const harvestDates = updatedPlantedCrops.map(pc => pc.crop.Harvest);

      try {
        const res = await fetch(userApiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          // Send data matching the API schema
          body: JSON.stringify({ 
            crop: cropNames,
            harvest: harvestDates,
            plantedCrops: updatedPlantedCrops // Also send the detailed array for frontend use
          }),
        });
        if (!res.ok) throw new Error("ফসল যোগ করতে ব্যর্থ হয়েছে।");
        setPlantedCrops(updatedPlantedCrops);
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
    const updatedPlantedCrops = plantedCrops.filter(pc => pc.crop["Products name"] !== cropToCancel);
    
    // Prepare data in the format the API expects
    const cropNames = updatedPlantedCrops.map(pc => pc.crop["Products name"]);
    const harvestDates = updatedPlantedCrops.map(pc => pc.crop.Harvest);

    try {
      const res = await fetch(userApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          crop: cropNames,
          harvest: harvestDates,
          plantedCrops: updatedPlantedCrops }),
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
    setFeaturedCrop(crop);
    localStorage.setItem('featuredCropName', crop.crop["Products name"]);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">লোড হচ্ছে...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  const selectedCrop = selectedCropIndex !== null ? displayedCrops[selectedCropIndex] : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar onLogout={onLogout} />
      <div className="p-8 relative flex-grow">
      {/* Confirmation Modal */}
      {selectedCrop && !plantedCropSet.has(selectedCrop["Products name"]) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">কৃষকের ড্যাশবোর্ড</h1>
        <div className="text-lg text-gray-600">
          <p>স্বাগতম, <span className="font-semibold">{user.name}</span>!</p>
          <p>খামারের তাপমাত্রা: <span className="font-semibold">{farmData.temperature}°C</span></p>
          <p>মাটির আর্দ্রতা: <span className="font-semibold">{farmData.humidity}%</span></p>
          {forecast && forecast.length > 0 && (
            <p>আপেক্ষিক আর্দ্রতা: <span className="font-semibold">{Math.round(forecast[0].relative_humidity_2m_mean)}%</span></p>
          )}
        </div>
      </header>

      {/* Weather Forecast Section */}
      {forecast && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">আবহাওয়ার পূর্বাভাস</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forecast.map((day, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="font-bold text-lg">{new Date(day.time).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric' })}</p>
                <p className="text-3xl my-2">{getWeatherIcon(day.weathercode)}</p>
                <p className="text-xl font-semibold">{Math.round(day.temperature_2m_max)}° / {Math.round(day.temperature_2m_min)}°</p>
                <p className="text-gray-600">আর্দ্রতা: {Math.round(day.relative_humidity_2m_mean)}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Crop Progress Bar */}
      {featuredCrop && (
        <FeaturedCropProgress plantedCrop={featuredCrop} />
      )}

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
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          />
        </div>

        {displayedCrops.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCrops.map((crop, index) => {
                const isSuitable = suitableCropSet.has(crop["Products name"]);
                const plantedInfo = plantedCrops.find(pc => pc.crop["Products name"] === crop["Products name"]);
                const isPlanted = !!plantedInfo;
                const key = `${crop["Products name"]}-${index}`;

                if (isPlanted) {
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
    className={`p-6 rounded-lg shadow-md border-l-4 transition-all duration-200 ${
      isSuitable
        ? 'cursor-pointer bg-white border-green-600 hover:shadow-lg hover:bg-gray-50'
        : 'bg-red-50 border-red-500 cursor-not-allowed opacity-70'
    }`}
  >
    <h3 className={`text-xl font-bold mb-2 ${isSuitable ? 'text-green-800' : 'text-red-800'}`}>{crop["Products name"]}</h3>
    <p className="text-gray-700"><span className="font-semibold">ফসলের ধরন:</span> {crop["Crops Type"]}</p>
    <p className="text-gray-700"><span className="font-semibold">রোপণের সময়:</span> {crop.Transplant}</p>
    <p className="text-gray-700"><span className="font-semibold">ফসল তোলার সময়:</span> {crop.Harvest}</p>
  </div>
);

const PlantedCropCard = ({ plantedCrop, onRemove, onSelect }: { plantedCrop: PlantedCrop; onRemove: (cropName: string) => void; onSelect: () => void; }) => {
  const { crop, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return months.indexOf(monthName.slice(0, 3).toLowerCase());
  };
  
  // Handle cases where Transplant might be undefined or not a string
  const transplantMonth = typeof crop.Transplant === 'string' ? getMonthNumber(crop.Transplant) : new Date(plantedDate).getMonth();
  const harvestMonth = getMonthNumber(crop.Harvest);

  // Handle year wrap-around (e.g., Transplant in Nov, Harvest in Feb)
  const totalDurationDays = harvestMonth >= transplantMonth
    ? (harvestMonth - transplantMonth) * 30 // Approximation
    : (12 - transplantMonth + harvestMonth) * 30;

  const daysSincePlanting = Math.floor((new Date().getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <div
      onClick={onSelect}
      className="p-6 rounded-lg shadow-md bg-blue-50 border-l-4 border-blue-600 relative cursor-pointer hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-bold text-blue-800 mb-2">{crop["Products name"]}</h3>
      <button
        onClick={() => onRemove(crop["Products name"])}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 transition-colors text-lg font-bold leading-none"
        aria-label="বাতিল করুন"
        title="বাতিল করুন"
      >
        &times;
      </button>
      <p className="text-gray-700 mb-4"><span className="font-semibold">রোপণ করা হয়েছে</span></p>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-blue-700">অগ্রগতি</span>
          <span className="text-sm font-medium text-blue-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>রোপণ</span>
          <span>ফসল তোলা</span>
        </div>
      </div>
    </div>
  );
};

const FeaturedCropProgress = ({ plantedCrop }: { plantedCrop: PlantedCrop }) => {
  const { crop, plantedDate } = plantedCrop;

  const getMonthNumber = (monthName: string) => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return months.indexOf(monthName.slice(0, 3).toLowerCase());
  };

  const transplantMonth = typeof crop.Transplant === 'string' ? getMonthNumber(crop.Transplant) : new Date(plantedDate).getMonth();
  const harvestMonth = getMonthNumber(crop.Harvest);

  const totalDurationDays = harvestMonth >= transplantMonth
    ? (harvestMonth - transplantMonth) * 30
    : (12 - transplantMonth + harvestMonth) * 30;

  const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24));

  const progress = totalDurationDays > 0 ? Math.min(Math.floor((daysSincePlanting / totalDurationDays) * 100), 100) : 0;

  return (
    <section className="mb-8 p-6 rounded-lg shadow-md bg-white border-l-4 border-green-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">নির্বাচিত ফসল: <span className="text-green-700">{crop["Products name"]}</span></h2>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-green-700">অগ্রগতি</span>
          <span className="text-sm font-medium text-green-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>রোপণ</span>
          <span>ফসল তোলা</span>
        </div>
      </div>
    </section>
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
