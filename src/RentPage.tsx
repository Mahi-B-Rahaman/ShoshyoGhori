import React, { useEffect, useState } from 'react';
import { useAuth, type User, type Rental } from './AuthContext';
import { useNotifications } from './NotificationContext';

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
  const [myRentedItems, setMyRentedItems] = useState<CombinedRental[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentingMessage, setRentingMessage] = useState<Record<string, string>>({});
  const { addNotification } = useNotifications();

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
        
        // Set available rentals
        setAllRentals(combinedRentals.filter(item => !item.rental.rentedByName)); 

        // Set items rented by current user
        if (loggedInUser) {
          const rentedByMe = combinedRentals.filter(item => 
            item.rental.rentedByName === loggedInUser.name && item.rental.rentedByNumber === loggedInUser.phone
          );
          setMyRentedItems(rentedByMe);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllRentals();
  }, [loggedInUser]);

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
      // --- 1. Update Farmer's Data ---
      const farmerApiUrl = `https://shoshyo-ghori-data-api.vercel.app/api/sensordata/${loggedInUser._id}`;
      const rentalToAdd = {
        itemName: lender.rentals.find(r => r._id === rentalId)?.items,
        itemsDesc: lender.rentals.find(r => r._id === rentalId)?.itemDesc,
        rentDate: lender.rentals.find(r => r._id === rentalId)?.rentDate,
        returnDate: lender.rentals.find(r => r._id === rentalId)?.returnDate,
        lenderName: lender.name,
        lenderNumber: lender.phone,
        price: lender.rentals.find(r => r._id === rentalId)?.price,
      };

      // Fetch current farmer data to get existing rentedItems
      const farmerRes = await fetch(farmerApiUrl);
      if (!farmerRes.ok) throw new Error("Failed to fetch farmer's current data.");
      const currentFarmerData = await farmerRes.json();
      const existingRentedItems = currentFarmerData.rentedItems || [];

      const farmerUpdateRes = await fetch(farmerApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentedItems: [...existingRentedItems, rentalToAdd],
        }),
      });

      if (!farmerUpdateRes.ok) {
        throw new Error("Failed to update farmer's profile with rented item.");
      }


      // --- 2. Update Lender's Data ---
      const notificationMessage = `${loggedInUser.name} আপনার '${rentalToAdd.itemName}' আইটেমটি ভাড়া করেছেন।`;
      const existingNotifications = lender.notification || [];
      const updatedNotifications = [...existingNotifications, notificationMessage];

      const url = `https://crop-clock-renter-api-uos1.vercel.app/api/renterdata/${lenderId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rentals: updatedRentals,
          notification: updatedNotifications 
        }),
      });

      if (!res.ok) throw new Error('Failed to rent item.');

      // Success, remove the item from the list locally
      setAllRentals(prevRentals => prevRentals.filter(r => r.rental._id !== rentalId));
      // Add the item to my rented items list
      const rentedItem = allRentals.find(r => r.rental._id === rentalId);
      if (rentedItem) {
        const updatedRentedItem = {
          ...rentedItem,
          rental: {
            ...rentedItem.rental,
            rentedByName: loggedInUser.name,
            rentedByNumber: loggedInUser.phone,
          }
        };
        setMyRentedItems(prev => [...prev, updatedRentedItem]);
      }
      setRentingMessage(prev => ({ ...prev, [rentalId]: 'সফলভাবে ভাড়া হয়েছে!' }));
      addNotification(`আপনি সফলভাবে '${rentedItem?.rental.items}' ভাড়া করেছেন।`, 'success');

    } catch (error) {
      console.error('Failed to rent item:', error);
      setRentingMessage(prev => ({ ...prev, [rentalId]: 'ভাড়া করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।' }));
    }
  };

  const handleReturnItem = async (rentalId: string, lenderId: string) => {
    const lender = allUsers.find(u => u._id === lenderId);
    if (!lender || !lender.rentals) return;

    // Find the item name for the notification before we change the state
    const itemToReturn = myRentedItems.find(item => item.rental._id === rentalId);
    const itemName = itemToReturn?.rental.items || 'একটি আইটেম';


    // Find the rental and unset the renter's info
    const updatedRentals = lender.rentals.map(rental => {
      if (rental._id === rentalId) {
        const { rentedByName, rentedByNumber, ...rest } = rental;
        return rest;
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
      if (!res.ok) throw new Error('Failed to return item.');
      // On success, remove from "My Rented Items" and add back to "Available Items"
      addNotification(`'${itemName}' ফেরত দেওয়ার অনুরোধ পাঠানো হয়েছে। মহাজনের নিশ্চিতকরণের জন্য অপেক্ষারত।`, 'info');
      window.location.reload(); // Simple solution to refresh state on both ends
    } catch (error) { console.error('Failed to return item:', error); }
  };

  if (loading) return <div className="text-center p-8">ভাড়ার আইটেম লোড হচ্ছে...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">খামার সরঞ্জাম ভাড়া করুন</h1>
        <p className="text-lg text-gray-700">মহাজনদের থেকে উপলব্ধ আইটেম ব্রাউজ করুন।</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRentals.length > 0 ? allRentals.map(({ rental, lender, lenderId }) => (
          <div key={rental._id} className="bg-white p-6 rounded-2xl shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-xl font-bold text-green-800 mb-2">{rental.items}</h3>
            <p className="text-gray-700 mt-2"><span className="font-semibold">বিবরণ:</span> {rental.itemDesc || 'নেই'}</p>
            <p className="text-gray-700 mt-4 font-bold text-lg">মূল্য: <span className="text-blue-600">${rental.price}</span></p>
            <div className="mt-4 pt-4 border-t flex flex-col">
              <p className="text-gray-700"><span className="font-semibold">মহাজন:</span> {lender.name}</p>
              <p className="text-gray-700 mb-4"><span className="font-semibold">যোগাযোগ:</span> {lender.phone}</p>
              <button
                onClick={() => handleRentItem(rental._id, lenderId)}
                disabled={!loggedInUser || !!rentingMessage[rental._id]}
                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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

      {/* My Rented Items Section */}
      {loggedInUser && myRentedItems.length > 0 && (
        <div className="mt-16">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-green-800 mb-2">আমার ভাড়া করা আইটেম</h2>
            <p className="text-lg text-gray-700">আপনার বর্তমানে ভাড়া করা আইটেমগুলো নিচে দেখুন।</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRentedItems.map(({ rental, lender, lenderId }) => (
              <div key={rental._id} className="bg-white p-6 rounded-2xl shadow-md border border-blue-300 transition-all duration-300">
                <h3 className="text-xl font-bold text-blue-800 mb-2">{rental.items}</h3>
                <p className="text-gray-700 mt-2"><span className="font-semibold">বিবরণ:</span> {rental.itemDesc || 'নেই'}</p>
                <p className="text-gray-700 mt-4 font-bold text-lg">মূল্য: <span className="text-blue-600">${rental.price}</span></p>
                <div className="mt-4 pt-4 border-t flex flex-col">
                  <p className="text-gray-700"><span className="font-semibold">মহাজন:</span> {lender.name}</p>
                  <p className="text-gray-700 mb-4"><span className="font-semibold">যোগাযোগ:</span> {lender.phone}</p>
                  <button onClick={() => handleReturnItem(rental._id, lenderId)} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">ফেরত দিন</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentPage;