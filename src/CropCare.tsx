import React, { useState } from "react";

// --- Types ---
interface CropStageInfo {
  soilPreparation: string;
  sowing: string;
  irrigation: string;
  fertilizerAndPest: string;
  harvesting: string;
}

interface CropData {
  name: string;
  scientificName: string;
  description: string;
  stages: CropStageInfo;
}

const CropCare: React.FC = () => {
  const [inputVal, setInputVal] = useState<string>('');
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCropData = async (cropName: string) => {
    setLoading(true);
    setError('');
    setCropData(null);

    const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          // Updated Model ID for Feb 2026
          model: "llama-3.3-70b-versatile", 
          messages: [
            {
              role: "system",
              content: `You are a professional Bangladeshi Agronomist. 
              Output MUST be a valid JSON object in Bangla and Every segment needs to be well described and Informative. 
              Do not include any text before or after the JSON.
              JSON Schema:
              {
                "name": "Crop Name (English)",
                "scientificName": "Scientific Name",
                "description": "2-3 sentences description in Bangla.",
                "stages": {
                  "soilPreparation": "Detailed guide in Bangla",
                  "sowing": "Detailed guide in Bangla",
                  "irrigation": "Detailed guide in Bangla",
                  "fertilizerAndPest": "Detailed guide with N-P-K ratios in Bangla",
                  "harvesting": "Detailed guide in Bangla"
                }
              }`
            },
            {
              role: "user",
              content: `Provide a detailed farming guide for: ${cropName}`
            }
          ],
          // This ensures the API returns clean JSON
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 3500
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        console.error("Groq API Error:", errorDetail);
        throw new Error(errorDetail.error?.message || "API Request Failed");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const parsedData: CropData = JSON.parse(content);
      setCropData(parsedData);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError("ত্রুটি: " + (err.message || "তথ্য পাওয়া যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) fetchCropData(inputVal.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 ">
      {/* Hero Header */}
      <div className="bg-emerald-800 pb-10 pt-12 px-4 rounded-b-[3rem] shadow-lg text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">AI কৃষি সহকারী</h1>
          <p className="text-emerald-100 text-lg italic">বিজ্ঞানসম্মত আধুনিক চাষাবাদ পরামর্শ</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 mt-4">
        {/* Search Input */}
        <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="ফসলের নাম লিখুন (যেমন: ধান, মরিচ, টমেটো...)"
              className="flex-grow px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-lg transition-all"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !inputVal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'খোঁজা হচ্ছে...' : 'তথ্য দেখুন'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        {/* Results Section */}
        {cropData && (
          <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center relative">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 rounded-t-3xl"></div>
              <h2 className="text-4xl font-bold text-slate-800 mb-1">{cropData.name}</h2>
              <span className="text-emerald-600 font-medium italic block mb-4 underline decoration-emerald-200">{cropData.scientificName}</span>
              <p className="text-slate-600 text-lg leading-relaxed">{cropData.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InfoCard title="জমি ও মাটি প্রস্তুতি" content={cropData.stages.soilPreparation} icon="🌱" />
               <InfoCard title="বপন ও রোপণ" content={cropData.stages.sowing} icon="🌾" />
               <InfoCard title="সেচ ব্যবস্থাপনা" content={cropData.stages.irrigation} icon="💧" />
               <InfoCard title="সার ও বালাই ব্যবস্থাপনা" content={cropData.stages.fertilizerAndPest} icon="🛡️" />
               <div className="md:col-span-2">
                <InfoCard title="ফসল সংগ্রহ ও সংরক্ষণ" content={cropData.stages.harvesting} icon="🚜" />
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ title, content, icon }: { title: string, content: string, icon: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-3xl bg-emerald-50 p-2 rounded-xl">{icon}</span>
      <h3 className="font-bold text-slate-800 text-xl">{title}</h3>
    </div>
    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-justify">{content}</p>
  </div>
);

export default CropCare;