import React, { useState, useEffect } from 'react';
import { User, Rental, PlantedCrop } from './AuthContext';

interface CombinedUser extends User {
  api: 'farmer' | 'lender';
}

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [allUsers, setAllUsers] = useState<CombinedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<CombinedUser | null>(null);

  // Check for admin session on component mount
  useEffect(() => {
    if (localStorage.getItem('isAdminLoggedIn') === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Fetch all users when admin logs in
  useEffect(() => {
    if (isAdminLoggedIn) {
      const fetchAllUsers = async () => {
        setLoading(true);
        try {
          const farmerRes = await fetch('https://shoshyo-ghori-data-api.vercel.app/api/sensordata');
          const lenderRes = await fetch('https://crop-clock-renter-api-uos1.vercel.app/api/renterdata');

          if (!farmerRes.ok || !lenderRes.ok) {
            throw new Error('Failed to fetch user data');
          }

          const farmers: User[] = await farmerRes.json();
          const lenders: User[] = await lenderRes.json();

          const combined: CombinedUser[] = [
            ...farmers.map(u => ({ ...u, accountType: 'farmer' as const, api: 'farmer' as const })),
            ...lenders.map(u => ({ ...u, accountType: 'lender' as const, api: 'lender' as const })),
          ];

          setAllUsers(combined);
          setFilteredUsers(combined);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllUsers();
    }
  }, [isAdminLoggedIn]);

  // Handle search query changes
  useEffect(() => {
    const filtered = allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('isAdminLoggedIn', 'true');
      setIsAdminLoggedIn(true);
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAdminLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const handleUpdateUser = async (userToUpdate: CombinedUser) => {
    const apiPaths = {
      farmer: 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata',
      lender: 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata',
    };
    const url = `${apiPaths[userToUpdate.api]}/${userToUpdate._id}`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userToUpdate.name,
          phone: userToUpdate.phone,
          notification: userToUpdate.notification,
          crops: userToUpdate.crops,
          rentals: userToUpdate.rentals,
        }),
      });

      if (!res.ok) throw new Error('Failed to update user.');

      // Update the user in the local state
      setAllUsers(prev => prev.map(u => u._id === userToUpdate._id ? userToUpdate : u));
      setEditingUser(null);

    } catch (err: any) {
      console.error(err.message);
      alert('Update failed: ' + err.message);
    }
  };

  const handleEditChange = (field: keyof CombinedUser, value: any) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition">
            Logout
          </button>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-600">{user.phone}</p>
                    <p className={`text-sm font-semibold ${user.accountType === 'farmer' ? 'text-green-600' : 'text-blue-600'}`}>
                      {user.accountType?.toUpperCase()}
                    </p>
                  </div>
                  <button onClick={() => setEditingUser(user)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Edit User: {editingUser.name}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Notifications (one per line)</label>
                <textarea
                  value={(editingUser.notification || []).join('\n')}
                  onChange={(e) => handleEditChange('notification', e.target.value.split('\n'))}
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={4}
                />
              </div>

              {editingUser.accountType === 'farmer' && (
                <div>
                  <label className="block text-sm font-medium">Planted Crops (JSON)</label>
                  <textarea
                    value={JSON.stringify(editingUser.crops || [], null, 2)}
                    onChange={(e) => {
                      try {
                        handleEditChange('crops', JSON.parse(e.target.value));
                      } catch {
                        // Ignore parse errors while typing
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded-md font-mono text-sm"
                    rows={6}
                  />
                </div>
              )}

              {editingUser.accountType === 'lender' && (
                <div>
                  <label className="block text-sm font-medium">Lended Items (JSON)</label>
                  <textarea
                    value={JSON.stringify(editingUser.rentals || [], null, 2)}
                    onChange={(e) => {
                      try {
                        handleEditChange('rentals', JSON.parse(e.target.value));
                      } catch {
                        // Ignore parse errors while typing
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded-md font-mono text-sm"
                    rows={6}
                  />
                </div>
              )}

              {/* Rented items for farmers are part of the lender's data, so direct editing is complex.
                  This admin panel focuses on direct user object properties.
              */}

            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-4">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={() => handleUpdateUser(editingUser)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;