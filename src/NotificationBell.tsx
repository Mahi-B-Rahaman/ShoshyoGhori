import React, { useState } from 'react';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const { loggedInUser, setLoggedInUser } = useAuth();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      default: return 'border-blue-500';
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (id: number, message: string) => {
    markAsRead(id, message);
  };

  const handleRemoveClick = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing

    const notificationToRemove = notifications.find(n => n.id === id);
    if (!notificationToRemove) return;

    // 1. Update UI immediately
    removeNotification(id);

    // 2. Update the database
    if (!loggedInUser || !loggedInUser.notification || loggedInUser.notification.length === 0) {
      return;
    }

    const updatedNotificationsDB = loggedInUser.notification.filter(
      (msg: string) => msg !== notificationToRemove.message
    );

    const apiPaths = {
      farmer: import.meta.env.VITE_BASE_URL_FARMER,
      lender: import.meta.env.VITE_BASE_URL_LENDER,
    };
    const accountType = loggedInUser.accountType || 'farmer';
    const url = `${apiPaths[accountType]}/${loggedInUser._id}`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification: updatedNotificationsDB }),
      });

      if (res.ok) {
        // Also update the user object in the auth context to stay in sync
        const updatedUser = { ...loggedInUser, notification: updatedNotificationsDB };
        setLoggedInUser(updatedUser);
      }
    } catch (error) {
      console.error("Failed to remove notification from database:", error);
    }
  };

  return (
    <div className="relative">
      <button onClick={handleBellClick} className="relative">
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20">
          <div className="py-2 px-4 text-lg font-bold border-b">নোটিফিকেশন</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && handleNotificationClick(notification.id, notification.message)}
                  className={`relative p-4 pr-8 border-l-4 ${!notification.read ? 'cursor-pointer hover:bg-gray-100' : ''} ${getTypeStyles(notification.type)} ${notification.read ? 'opacity-60' : ''}`}
                >
                  <p className="text-sm text-gray-800">{notification.message}</p>
                  <button
                    onClick={(e) => handleRemoveClick(e, notification.id)}
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 font-bold text-lg leading-none"
                    aria-label="নোটিফিকেশন সরান"
                  >
                    &times;
                  </button>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">কোনো নতুন নোটিফিকেশন নেই।</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;