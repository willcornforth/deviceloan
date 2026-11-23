import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BellIcon, TrashIcon } from "@heroicons/react/24/outline";
import PageBanner from "../components/PageBanner";
import TabSwitch from "../components/TabSwitch";
import ErrorAlert from "../components/ErrorAlert";
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
  const [error, setError] = useState<Error | null>(null);
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
      setError(err instanceof Error ? err : new Error(err.message || "Failed to load notifications"));
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
      setError(err instanceof Error ? err : new Error(err.message || "Failed to unsubscribe"));
    }
  };

  const getProductName = (productId: string): string => {
    const product = products?.find(p => p.id === productId);
    return product?.name || productId;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
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
          <div className="mb-6">
            <ErrorAlert
              error={error}
              onDismiss={() => setError(null)}
              onRetry={loadData}
              title="Failed to Load Notifications"
            />
          </div>
        )}

        <TabSwitch
          tabs={[
            { id: 'preferences', label: 'Subscriptions', count: preferences.length, badgeColor: 'indigo' },
            { id: 'history', label: 'History', count: history.length, badgeColor: 'gray' }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as "preferences" | "history")}
        />

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
                {history.map((notification) => {
                  const displayDate = notification.sentAt || notification.createdAt;
                  const isFailed = notification.status === 'failed';
                  
                  return (
                    <div
                      key={notification.id}
                      className="bg-white border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <BellIcon className={`h-6 w-6 ${isFailed ? 'text-red-600' : 'text-indigo-600'}`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isFailed ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {formatNotificationType(notification.type)}
                              </span>
                              {isFailed && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Failed
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(displayDate instanceof Date ? displayDate.toISOString() : displayDate)}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {notification.subject}
                          </h4>
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          {notification.productId && (
                            <p className="mt-1 text-sm text-gray-500">
                              Device: {getProductName(notification.productId)}
                            </p>
                          )}
                          {isFailed && notification.error && (
                            <p className="mt-2 text-sm text-red-600">
                              Error: {notification.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
