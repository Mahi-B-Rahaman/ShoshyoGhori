import React, { useState, useEffect, useRef } from 'react';
import { User, Rental, PlantedCrop } from './AuthContext';

interface CombinedUser extends User {
  api: 'farmer' | 'lender';
}

interface ConnectivityStatus {
  apiConnected: boolean;
  iotConnected: boolean;
  lastUpdate?: Date;
  lastTemperature?: number;
  lastHumidity?: number;
}

interface ApiLatency {
  farmerApi: number | null;
  lenderApi: number | null;
  lastCheck?: Date;
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
  const [connectivityStatus, setConnectivityStatus] = useState<Record<string, ConnectivityStatus>>({});
  const [checkingConnectivity, setCheckingConnectivity] = useState(false);
  const [mostPopularCrop, setMostPopularCrop] = useState<{ name: string; count: number } | null>(null);
  const [apiLatency, setApiLatency] = useState<ApiLatency>({ farmerApi: null, lenderApi: null });
  const [checkingLatency, setCheckingLatency] = useState(false);
  
  // Store previous sensor data for IoT connectivity check
  const previousSensorData = useRef<Record<string, { temperature: number; humidity: number; timestamp: Date }>>({});
  // Ref to always access latest users array
  const allUsersRef = useRef<CombinedUser[]>([]);

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
          allUsersRef.current = combined;
          
          // Calculate most popular crop
          calculateMostPopularCrop(combined);
          
          // Check API latency
          checkApiLatency();
          
          // Initialize connectivity check for all users
          checkAllUsersConnectivity(combined);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllUsers();
    }
  }, [isAdminLoggedIn]);

  // Check API connectivity for a single user
  const checkApiConnectivity = async (user: CombinedUser): Promise<boolean> => {
    try {
      const apiPaths = {
        farmer: 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata',
        lender: 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata',
      };
      const url = `${apiPaths[user.api]}/${user._id}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const userData = await res.json();
        // If user data exists and has basic fields, API is connected
        return !!(userData && userData._id && userData.name);
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // Check IoT connectivity for a user (only for farmers)
  const checkIotConnectivity = async (user: CombinedUser): Promise<{ connected: boolean; lastUpdate?: Date; temperature?: number; humidity?: number }> => {
    if (user.api !== 'farmer') {
      // Lenders don't have IoT devices
      return { connected: true };
    }

    try {
      const url = `https://shoshyo-ghori-data-api.vercel.app/api/sensordata/${user._id}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        return { connected: false };
      }

      const userData: any = await res.json();
      const currentTemp = userData.temp1 || 0;
      const currentHumidity = userData.soilHumidity || 0;
      const currentTimestamp = new Date();

      // If both temperature and humidity are 0, IoT device is not connected
      if (currentTemp === 0 && currentHumidity === 0) {
        return { 
          connected: false, 
          lastUpdate: currentTimestamp,
          temperature: currentTemp,
          humidity: currentHumidity,
        };
      }

      // Check if we have previous data for this user
      const previousData = previousSensorData.current[user._id];

      if (!previousData) {
        // First check - store current data
        previousSensorData.current[user._id] = {
          temperature: currentTemp,
          humidity: currentHumidity,
          timestamp: currentTimestamp,
        };
        return { 
          connected: true, 
          lastUpdate: currentTimestamp,
          temperature: currentTemp,
          humidity: currentHumidity,
        };
      }

      // Check if data has changed (indicating IoT device is updating)
      const tempChanged = Math.abs(currentTemp - previousData.temperature) > 0.1;
      const humidityChanged = Math.abs(currentHumidity - previousData.humidity) > 0.1;
      const timeSinceLastUpdate = currentTimestamp.getTime() - previousData.timestamp.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;

      // If data changed or less than 5 minutes passed, IoT is connected
      if (tempChanged || humidityChanged || timeSinceLastUpdate < fiveMinutesInMs) {
        // Update stored data
        previousSensorData.current[user._id] = {
          temperature: currentTemp,
          humidity: currentHumidity,
          timestamp: currentTimestamp,
        };
        return { 
          connected: true, 
          lastUpdate: currentTimestamp,
          temperature: currentTemp,
          humidity: currentHumidity,
        };
      }

      // If no update in 5+ minutes, IoT is disconnected
      return { 
        connected: false, 
        lastUpdate: previousData.timestamp,
        temperature: currentTemp,
        humidity: currentHumidity,
      };
    } catch (err) {
      return { connected: false };
    }
  };

  // Measure API latency
  const measureApiLatency = async (url: string): Promise<number | null> => {
    try {
      const startTime = performance.now();
      const response = await fetch(url, { 
        method: 'HEAD', // Use HEAD to minimize data transfer
        cache: 'no-cache'
      });
      const endTime = performance.now();
      
      if (response.ok) {
        return Math.round(endTime - startTime); // Return latency in milliseconds
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // Check latency for both APIs
  const checkApiLatency = async () => {
    setCheckingLatency(true);
    try {
      const farmerApiUrl = 'https://shoshyo-ghori-data-api.vercel.app/api/sensordata';
      const lenderApiUrl = 'https://crop-clock-renter-api-uos1.vercel.app/api/renterdata';

      // Measure both APIs in parallel
      const [farmerLatency, lenderLatency] = await Promise.all([
        measureApiLatency(farmerApiUrl),
        measureApiLatency(lenderApiUrl),
      ]);

      setApiLatency({
        farmerApi: farmerLatency,
        lenderApi: lenderLatency,
        lastCheck: new Date(),
      });
    } catch (err) {
      console.error('Error checking API latency:', err);
    } finally {
      setCheckingLatency(false);
    }
  };

  // Calculate most popular crop from all users
  const calculateMostPopularCrop = (users: CombinedUser[]) => {
    const cropCounts: Record<string, number> = {};
    
    // Count crops from all farmers
    users.forEach(user => {
      if (user.api === 'farmer' && user.crops && Array.isArray(user.crops)) {
        user.crops.forEach(crop => {
          if (crop.cropName) {
            cropCounts[crop.cropName] = (cropCounts[crop.cropName] || 0) + 1;
          }
        });
      }
    });
    
    // Find the most popular crop
    let maxCount = 0;
    let popularCrop: { name: string; count: number } | null = null;
    
    Object.entries(cropCounts).forEach(([cropName, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularCrop = { name: cropName, count };
      }
    });
    
    setMostPopularCrop(popularCrop);
  };

  // Check connectivity for all users
  const checkAllUsersConnectivity = React.useCallback(async (users: CombinedUser[]) => {
    setCheckingConnectivity(true);
    const statusUpdates: Record<string, ConnectivityStatus> = {};

    for (const user of users) {
      const apiConnected = await checkApiConnectivity(user);
      const iotStatus = await checkIotConnectivity(user);

      statusUpdates[user._id] = {
        apiConnected,
        iotConnected: iotStatus.connected,
        lastUpdate: iotStatus.lastUpdate,
        lastTemperature: iotStatus.temperature,
        lastHumidity: iotStatus.humidity,
      };
    }

    setConnectivityStatus(statusUpdates);
    setCheckingConnectivity(false);
  }, []);

  // Periodic connectivity check (every 5 minutes)
  useEffect(() => {
    if (!isAdminLoggedIn || allUsers.length === 0) return;

    // Initial check
    checkAllUsersConnectivity(allUsers);

    // Set up interval to check every 5 minutes
    const intervalId = setInterval(() => {
      // Use ref to always get latest users
      if (allUsersRef.current.length > 0) {
        checkAllUsersConnectivity(allUsersRef.current);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [isAdminLoggedIn, allUsers.length, checkAllUsersConnectivity]);

  // Periodic latency check (every 2 minutes)
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // Set up interval to check latency every 2 minutes
    const latencyIntervalId = setInterval(() => {
      checkApiLatency();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(latencyIntervalId);
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
    // Get admin password from environment variable
    // Note: In .env file, it should be named VITE_adminPass (Vite requires VITE_ prefix)
    // @ts-ignore - Vite env variables
    const adminPassword = import.meta.env.VITE_adminPass || 'admin'; // Fallback to 'admin' if not set
    
    if (username === 'admin' && password === adminPassword) {
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
      const updatedUsers = allUsers.map(u => u._id === userToUpdate._id ? userToUpdate : u);
      setAllUsers(updatedUsers);
      allUsersRef.current = updatedUsers;
      
      // Recalculate most popular crop
      calculateMostPopularCrop(updatedUsers);
      
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

        {/* Stats Cards Row */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Popular Crop Card */}
          {mostPopularCrop && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Most Popular Crop</h2>
                  <p className="text-lg font-semibold">{mostPopularCrop.name}</p>
                  <p className="text-sm mt-1 opacity-90">Planted by {mostPopularCrop.count} {mostPopularCrop.count === 1 ? 'farmer' : 'farmers'}</p>
                </div>
                <div className="text-5xl">🌾</div>
              </div>
            </div>
          )}

          {/* API Latency Cards */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">API Latency</h2>
              <button
                onClick={checkApiLatency}
                disabled={checkingLatency}
                className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh latency"
              >
                {checkingLatency ? '⏳' : '🔄'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Farmer API:</span>
                <span className={`text-lg font-bold ${
                  apiLatency.farmerApi === null 
                    ? 'text-gray-400' 
                    : apiLatency.farmerApi < 200 
                    ? 'text-green-600' 
                    : apiLatency.farmerApi < 500 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {apiLatency.farmerApi === null ? 'N/A' : `${apiLatency.farmerApi}ms`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Lender API:</span>
                <span className={`text-lg font-bold ${
                  apiLatency.lenderApi === null 
                    ? 'text-gray-400' 
                    : apiLatency.lenderApi < 200 
                    ? 'text-green-600' 
                    : apiLatency.lenderApi < 500 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {apiLatency.lenderApi === null ? 'N/A' : `${apiLatency.lenderApi}ms`}
                </span>
              </div>
              {apiLatency.lastCheck && (
                <p className="text-xs text-gray-500 mt-2">
                  Last checked: {apiLatency.lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Latency Status Indicator */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Server Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Farmer API Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  apiLatency.farmerApi === null 
                    ? 'bg-gray-100 text-gray-600' 
                    : apiLatency.farmerApi < 200 
                    ? 'bg-green-100 text-green-800' 
                    : apiLatency.farmerApi < 500 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {apiLatency.farmerApi === null 
                    ? 'Unknown' 
                    : apiLatency.farmerApi < 200 
                    ? 'Excellent' 
                    : apiLatency.farmerApi < 500 
                    ? 'Good' 
                    : 'Slow'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Lender API Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  apiLatency.lenderApi === null 
                    ? 'bg-gray-100 text-gray-600' 
                    : apiLatency.lenderApi < 200 
                    ? 'bg-green-100 text-green-800' 
                    : apiLatency.lenderApi < 500 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {apiLatency.lenderApi === null 
                    ? 'Unknown' 
                    : apiLatency.lenderApi < 200 
                    ? 'Excellent' 
                    : apiLatency.lenderApi < 500 
                    ? 'Good' 
                    : 'Slow'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                  &lt;200ms: Excellent
                </p>
                <p className="text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                  200-500ms: Good
                </p>
                <p className="text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                  &gt;500ms: Slow
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => checkAllUsersConnectivity(allUsers)}
            disabled={checkingConnectivity}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingConnectivity ? 'Checking...' : 'Check Connectivity'}
          </button>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => {
              const status = connectivityStatus[user._id];
              return (
                <div key={user._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">{user.name}</h2>
                      <p className="text-gray-600">{user.phone}</p>
                      <p className={`text-sm font-semibold ${user.accountType === 'farmer' ? 'text-green-600' : 'text-blue-600'}`}>
                        {user.accountType?.toUpperCase()}
                      </p>
                      
                      {/* Connectivity Status */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">API Connectivity:</span>
                          {status ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              status.apiConnected 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {status.apiConnected ? '✓ Connected' : '✗ Disconnected'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                              Checking...
                            </span>
                          )}
                        </div>
                        
                        {user.api === 'farmer' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">IoT Connectivity:</span>
                            {status ? (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                status.iotConnected 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {status.iotConnected ? '✓ Connected' : '✗ Disconnected'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                Checking...
                              </span>
                            )}
                          </div>
                        )}
                        
                        {status && user.api === 'farmer' && status.lastUpdate && (
                          <div className="text-xs text-gray-500">
                            Last Update: {status.lastUpdate.toLocaleString()}
                            {status.lastTemperature !== undefined && status.lastHumidity !== undefined && (
                              <span className="ml-2">
                                | Temp: {status.lastTemperature}°C, Humidity: {status.lastHumidity}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setEditingUser(user)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 ml-4">
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
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