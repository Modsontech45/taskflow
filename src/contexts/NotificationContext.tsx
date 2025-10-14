import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiClient } from "../services/api";
import { useAuth } from "./AuthContext";
import { Notification } from "../types/notification";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  createNotification: (
    type: string,
    title: string,
    message: string,
    metadata?: any
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  // ---------------- Refresh notifications from API ----------------
  const refreshNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Mark as read ----------------
  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // ---------------- Create notification ----------------
  const createNotification = async (
    type: string,
    title: string,
    message: string,
    metadata?: any
  ) => {
    try {
      const newNotification = await apiClient.createNotification({
        type,
        title,
        message,
        metadata,
      });
      if (newNotification) {
        setNotifications((prev) => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // ---------------- WebSocket connection ----------------
  useEffect(() => {
    if (!user) return;

    // Replace with your backend WebSocket URL
    ws.current = new WebSocket(`ws://localhost:4000/notifications?userId=${user.id}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected for notifications");
    };

    ws.current.onmessage = (event) => {
      try {
        const newNotification: Notification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.current?.close();
    };
  }, [user]);

  const unreadCount = React.useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    createNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}
