import React, { useState } from "react";

// --- টাইপ ডেফিনিশন (Types) ---
interface CropStageInfo {
  soilPreparation: string; // মাটি প্রস্তুতি
  sowing: string; // বপন
  irrigation: string; // সেচ
  fertilizerAndPest: string; // সার ও কীটনাশক
  harvesting: string; // ফসল সংগ্রহ
}

interface CropData {
  name: string; // ফসলের নাম (বাংলায়)
  scientificName: string;
  description: string;
  stages: CropStageInfo;
}

// --- কম্পোনেন্ট (Main Component) ---
const CropCare: React.FC = () => {
  const [inputVal, setInputVal] = useState<string>('');
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // --- Grok (via OpenRouter) থেকে ডাটা আনার ফাংশন ---
  const fetchCropData = async (cropName: string) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      setError('ত্রুটি: API Key কনফিগার করা হয়নি। .env ফাইল চেক করুন।');
      return;
    }

    setLoading(true);
    setError('');
    setCropData(null);

    const systemPrompt = `
      Act as an agricultural expert for Bangladeshi crops.
      Language: Bangla.
      Task: Provide detailed farming guidelines for the crop name provided by the user.
      
      You MUST return the response in valid JSON format only. Do not add any markdown formatting like \`\`\`json.
      The JSON structure must be exactly like this:
      {
        "name": "Crop Name in Bangla (English)",
        "scientificName": "Scientific Name",
        "description": "2-3 sentences description in Bangla.",
        "stages": {
          "soilPreparation": "Detailed soil preparation guide in Bangla",
          "sowing": "Sowing time and method in Bangla",
          "irrigation": "Irrigation/Watering guide in Bangla",
          "fertilizerAndPest": "Fertilizer and Pest control guide in Bangla",
          "harvesting": "Harvesting signs and method in Bangla"
        }
      }

      If the user's input is NOT a recognizable crop name, you MUST return this specific JSON structure instead:
      {
        "error": "Not a valid crop name",
        "message": "অনুগ্রহ করে একটি সঠিক ফসলের নাম লিখুন।"
      }
    `;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173', // বা আপনার সাইটের নাম
          'X-Title': 'Shoshyoghori App',
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free", // Switched to another free and available model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Crop Name: ${cropName}` }
          ],
          response_format: { type: "json_object" } 
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("OpenRouter Error:", data.error);
        throw new Error(data.error.message || 'API Error');
      }

      let textResponse = data.choices[0].message.content;
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData: CropData = JSON.parse(textResponse);

      // Check if the AI returned a custom error for an invalid crop name
      if ('error' in parsedData && (parsedData as any).error === "Not a valid crop name") {
        throw new Error((parsedData as any).message || 'অনুগ্রহ করে একটি সঠিক ফসলের নাম লিখুন।');
      }

      setCropData(parsedData);

    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError('তথ্য লোড করতে সমস্যা হয়েছে। ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim().length > 0) {
      fetchCropData(inputVal.trim());
    } else {
      setError('অনুগ্রহ করে একটি ফসলের নাম লিখুন।');
      setCropData(null); // Clear previous results if the input is empty
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* হেডার সেকশন */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-green-700 mb-3">🤖 AI কৃষি সহকারী</h1>
          <p className="text-gray-600">যেকোনো ফসলের নাম লিখুন, AI আপনাকে চাষাবাদের পূর্ণাঙ্গ নিয়ম জানিয়ে দেবে।</p>
        </div>

        {/* সার্চ বক্স */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-emerald-100">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="ফসলের নাম লিখুন (যেমন: ধান, আলু...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 transition"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {loading ? 'খোঁজা হচ্ছে...' : 'তথ্য দেখুন'}
            </button>
          </form>
        </div>

        {/* Error and Loading States */}
        {error && <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-center border border-red-200">{error}</div>}
        {loading && <div className="text-center p-8 text-gray-600">লোড হচ্ছে...</div>}

        {/* ফলাফল সেকশন */}
        {cropData && !loading && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
            {/* ক্রপ হেডার */}
            <div className="bg-green-600 p-6 text-white flex items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold">{cropData.name}</h2>
                <p className="italic opacity-90 text-sm">{cropData.scientificName}</p>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-8 border-b pb-6">
                {cropData.description}
              </p>

              {/* ধাপসমূহ (Timeline Style) */}
              <div className="space-y-6">
                <StageItem 
                  step="১" 
                  title="জমি তৈরি ও মাটি" 
                  details={cropData.stages.soilPreparation} 
                />
                <StageItem 
                  step="২" 
                  title="বীজ বপন / চারা রোপণ" 
                  details={cropData.stages.sowing} 
                />
                <StageItem 
                  step="৩" 
                  title="সেচ ব্যবস্থাপনা" 
                  details={cropData.stages.irrigation} 
                />
                <StageItem 
                  step="৪" 
                  title="সার প্রয়োগ ও বালাই দমন" 
                  details={cropData.stages.fertilizerAndPest} 
                />
                <StageItem 
                  step="৫" 
                  title="ফসল সংগ্রহ" 
                  details={cropData.stages.harvesting} 
                  isLast
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- সাব-কম্পোনেন্ট (Sub-component for Layout) ---
interface StageItemProps {
  step: string;
  title: string;
  details: string;
  isLast?: boolean;
}

const StageItem: React.FC<StageItemProps> = ({ step, title, details, isLast = false }) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 font-bold rounded-full border-2 border-green-500 shrink-0">
          {step}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 my-1"></div>}
      </div>
      <div className="pb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
          {details}
        </p>
      </div>
    </div>
  );
};

export default CropCare;