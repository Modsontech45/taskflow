import React, { useEffect } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  Bell,
  CheckCircle2,
  Users,
  Calendar,
  Folder,
  BellOff,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const notificationIcons = {
  BOARD_CREATED: Folder,
  TASK_CREATED: Calendar,
  MEMBER_INVITED: Users,
  MEMBER_ADDED: Users,
  TASK_COMPLETED: CheckCircle2,
};

const notificationColors = {
  BOARD_CREATED: "text-blue-600 bg-blue-100",
  TASK_CREATED: "text-green-600 bg-green-100",
  MEMBER_INVITED: "text-purple-600 bg-purple-100",
  MEMBER_ADDED: "text-purple-600 bg-purple-100",
  TASK_COMPLETED: "text-emerald-600 bg-emerald-100",
};

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            Stay updated with your latest activities
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              When you create boards, tasks, or invite members, you'll see
              notifications here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass =
              notificationColors[notification.type] ||
              "text-gray-600 bg-gray-100";

            return (
              <Card
                key={notification.id}
                className={`transition-all duration-200 ${
                  !notification.isRead ? "border-blue-200 bg-blue-50/30" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-xl ${colorClass} flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`text-sm font-medium ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            <a href={`/boards/${notification.boardId}`}>
                              {notification.title}
                            </a>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(
                              parseISO(notification.createdAt),
                              "MMM d, yyyy h:mm a"
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
