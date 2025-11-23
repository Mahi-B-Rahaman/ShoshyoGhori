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
  rentals?: Rental[];
  _id: string;
}

// We'll create a new interface to hold both rental and lender info
interface CombinedRental {
  rental: Rental;
  lenderId: string;
  lender: {
    name: string;
    phone: string;
  };
}

const RentPage = () => {
  const { loggedInUser } = useAuth();
  const [allRentals, setAllRentals] = useState<CombinedRental[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentingMessage, setRentingMessage] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchAllRentals = async () => {
      try {
        const res = await fetch('https://crop-clock-renter-api-uos1.vercel.app/api/renterdata');
        if (!res.ok) {
          throw new Error('Failed to fetch rental data.');
        }
        const users: User[] = await res.json();

        setAllUsers(users);

        // Flatten the data: create a single array of all rentals with lender info
        const combinedRentals = users.flatMap(user =>
          (user.rentals || []).map(rental => ({
            rental,
            lenderId: user._id,
            lender: { name: user.name, phone: user.phone },
          }))
        );
        setAllRentals(combinedRentals.filter(item => !item.rental.rentedByName)); // Only show available items
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRentals();
  }, []);

  const handleRentItem = async (rentalId: string, lenderId: string) => {
    if (!loggedInUser) {
      alert('আইটেম ভাড়া করতে অনুগ্রহ করে কৃষক হিসাবে লগইন করুন।');
      return;
    }

    setRentingMessage(prev => ({ ...prev, [rentalId]: 'Renting...' }));

    const lender = allUsers.find(u => u._id === lenderId);
    if (!lender || !lender.rentals) {
      setRentingMessage(prev => ({ ...prev, [rentalId]: 'ত্রুটি: মহাজন পাওয়া যায়নি।' }));
      return;
    }

    const updatedRentals = lender.rentals.map(rental => {
      if (rental._id === rentalId) {
        return {
          ...rental,
          rentedByName: loggedInUser.name,
          rentedByNumber: loggedInUser.phone,
        };
      }
      return rental;
    });

    try {
      const url = `https://crop-clock-renter-api-uos1.vercel.app/api/renterdata/${lenderId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentals: updatedRentals }),
      });

      if (!res.ok) throw new Error('Failed to rent item.');

      // Success, remove the item from the list locally
      setAllRentals(prevRentals => prevRentals.filter(r => r.rental._id !== rentalId));
      setRentingMessage(prev => ({ ...prev, [rentalId]: 'সফলভাবে ভাড়া হয়েছে!' }));

    } catch (error) {
      console.error('Failed to rent item:', error);
      setRentingMessage(prev => ({ ...prev, [rentalId]: 'ভাড়া করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।' }));
    }
  };

  if (loading) return <div className="text-center p-8">ভাড়ার আইটেম লোড হচ্ছে...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">খামার সরঞ্জাম ভাড়া করুন</h1>
        <p className="text-lg text-gray-600">মহাজনদের থেকে উপলব্ধ আইটেম ব্রাউজ করুন।</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRentals.length > 0 ? allRentals.map(({ rental, lender, lenderId }) => (
          <div key={rental._id} className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-lg border-l-4 border-green-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-xl font-bold text-green-800 mb-2">{rental.items}</h3>
            <p className="text-gray-700 mt-2"><span className="font-semibold">বিবরণ:</span> {rental.itemDesc || 'নেই'}</p>
            <p className="text-gray-700 mt-4 font-bold text-lg">মূল্য: <span className="text-blue-600">${rental.price}</span></p>
            <div className="mt-4 pt-4 border-t flex flex-col space-y-2">
              <p className="text-gray-700"><span className="font-semibold">মহাজন:</span> {lender.name}</p>
              <p className="text-gray-700"><span className="font-semibold">যোগাযোগ:</span> {lender.phone}</p>
              <button
                onClick={() => handleRentItem(rental._id, lenderId)}
                disabled={!loggedInUser || !!rentingMessage[rental._id]}
                className="mt-4 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {rentingMessage[rental._id] ? rentingMessage[rental._id] : 'এখনই ভাড়া করুন'}
              </button>
              {!loggedInUser && (
                <p className="text-xs text-center text-red-500 mt-1">
                  ভাড়া করতে অনুগ্রহ করে কৃষক হিসাবে লগইন করুন।
                </p>
              )}
            </div>
          </div>
        )) : <p className="col-span-full text-center text-gray-500 mt-10">বর্তমানে ভাড়ার জন্য কোনো আইটেম উপলব্ধ নেই।</p>}
      </div>
    </div>
  );
};

export default RentPage;