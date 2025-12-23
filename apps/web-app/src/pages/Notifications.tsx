import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BellIcon, TrashIcon } from "@heroicons/react/24/outline";
import PageBanner from "../components/PageBanner";
import { useNotificationService } from "../hooks/useNotificationService";
import { NotificationPreference, Notification } from "../domain/notifications";
import { useProducts } from "../hooks/useProducts";

function Notifications() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { getNotificationService } = useNotificationService();
  const { products } = useProducts();

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preferences" | "history">("preferences");

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const notificationService = await getNotificationService();
      
      const [prefsData, historyData] = await Promise.all([
        notificationService.getPreferences(),
        notificationService.getHistory(50),
      ]);

      setPreferences(prefsData);
      setHistory(historyData.notifications);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (productId: string) => {
    try {
      const notificationService = await getNotificationService();
      await notificationService.unsubscribe(productId);
      
      // Remove from local state
      setPreferences(prev => prev.filter(pref => pref.productId !== productId));
    } catch (err: any) {
      console.error("Failed to unsubscribe:", err);
      setError(err.message || "Failed to unsubscribe");
    }
  };

  const getProductName = (productId: string): string => {
    const product = products?.find(p => p.id === productId);
    return product?.name || productId;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNotificationType = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBanner
        title="Notifications"
        subtitle="Manage your notification preferences and view notification history"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "preferences"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Subscriptions
              {preferences.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                  {preferences.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              History
              {history.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div>
            {preferences.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't subscribed to any device notifications yet.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Visit the Devices page to subscribe to unavailable devices.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {preferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {getProductName(pref.productId)}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notification Types:</span>{" "}
                            {pref.notificationTypes.map(formatNotificationType).join(", ")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Subscribed on {formatDate(pref.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(pref.productId)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Unsubscribe"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't received any notifications yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <BellIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {formatNotificationType(notification.type)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(notification.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        {notification.productId && (
                          <p className="mt-1 text-sm text-gray-500">
                            Device: {getProductName(notification.productId)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
