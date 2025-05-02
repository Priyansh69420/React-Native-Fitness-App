import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  postId: string;
  type: 'like' | 'comment' | 'new_post' | 'reminder';
  timestamp?: number;
};

export type NotificationsContextType = {
  notifications: NotificationItem[];
  addNotification: (notification: NotificationItem) => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

type NotificationsProviderProps = {
  children: ReactNode;
};

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const value = useMemo(
    () => ({ notifications, addNotification }),
    [notifications]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
