import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type']) => void;
  markAsRead: (id: number, message: string) => void;
  removeNotification: (id: number) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { loggedInUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Effect to manage notifications based on user state.
  React.useEffect(() => {
    if (loggedInUser && loggedInUser.notification && loggedInUser.notification.length > 0) {
      // User is logged in and has notifications, load them.
      const loadedNotifications = loggedInUser.notification.map((msg, index) => ({
        id: Date.now() + index, // Simple unique ID
        message: msg,
        type: 'info' as const,
        read: false,
      }));
      setNotifications(loadedNotifications);
    } else {
      // No user or no notifications, clear the list.
      setNotifications([]);
    }
  }, [loggedInUser]);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    // Prevent duplicate messages
    if (notifications.some(n => n.message === message)) return;

    const newNotification: Notification = {
      id: Date.now(),
      message,
      type,
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [notifications]);

  const markAsRead = async (id: number, message: string) => {
    // 1. Update frontend state immediately for responsiveness
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, removeNotification, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};