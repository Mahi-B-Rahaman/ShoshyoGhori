import React, { useState } from 'react';

const SupportPage = () => {
  const [message, setMessage] = useState('');
  const adminPhoneNumber = '01882576788';
  const adminWhatsappNumber = `88${adminPhoneNumber}`; 

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${adminWhatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    setMessage(''); // Clear the input after sending
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-4">সাপোর্ট ও সহায়তা</h1>
        <p className="text-gray-600 text-lg mb-2">
          যেকোনো প্রয়োজনে বা সমস্যার সম্মুখীন হলে, আমাদের অ্যাডমিনের সাথে সরাসরি হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন। আমরা আপনাকে সহায়তা করতে সর্বদা প্রস্তুত।
        </p>
        <p className="text-gray-800 text-xl font-semibold mb-8">
          ফোন: {adminPhoneNumber}
        </p>
        
        {/* WhatsApp Chat Input Form */}
        <form onSubmit={handleSendMessage} className="mt-8 w-full">
          <label htmlFor="whatsapp-message" className="sr-only">আপনার প্রশ্ন লিখুন</label>
          <div className="relative">
            <input
              type="text"
              id="whatsapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full pl-4 pr-28 py-4 text-gray-700 bg-gray-100 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="আপনার প্রশ্ন এখানে লিখুন..."
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200">
              পাঠান
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;