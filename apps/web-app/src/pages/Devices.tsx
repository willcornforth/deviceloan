import { useState, useMemo, useEffect } from "react";
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { useAuth0 } from "@auth0/auth0-react";
import PageBanner from "../components/PageBanner";
import SearchBar from "../components/SearchBar";
import CategoryFilter, { Category } from "../components/CategoryFilter";
import DeviceCard from "../components/DeviceCard";
import LoanDeviceModal from "../components/LoanDeviceModal";
import LoanSuccessDialog from "../components/LoanSuccessDialog";
import { useProducts } from "../hooks/useProducts";
import { useLoanService } from "../hooks/useLoanService";
import { useNotificationService } from "../hooks/useNotificationService";
import { Product } from "../app/product-service";
import { Loan } from "../domain/loans";

function Devices() {
  const { products: devices, loading, error } = useProducts();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { getLoanService } = useLoanService();
  const { getNotificationService } = useNotificationService();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Product | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<{ returnDate: string; reservedAt: string } | null>(null);
  const [subscribedProducts, setSubscribedProducts] = useState<Set<string>>(new Set());
  const [subscribingProducts, setSubscribingProducts] = useState<Set<string>>(new Set());
  const [notificationMenuOpen, setNotificationMenuOpen] = useState<string | null>(null);
  const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<Set<'email' | 'sms' | 'push'>>(new Set(['email']));

  // Load user's notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated) {
        setSubscribedProducts(new Set());
        return;
      }

      try {
        const notificationService = await getNotificationService();
        const preferences = await notificationService.getPreferences();
        const productIds = new Set(preferences.map(pref => pref.productId));
        setSubscribedProducts(productIds);
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const categories: Category[] = [
    { name: "All", icon: null },
    { name: "Laptop", icon: ComputerDesktopIcon },
    { name: "Tablet", icon: DeviceTabletIcon },
    { name: "Phone", icon: DevicePhoneMobileIcon },
  ];

  const handleOpenLoanModal = (device: Product) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleCloseLoanModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  const handleConfirmLoan = async (deviceId: string, returnDate: Date) => {
    try {
      const loanService = await getLoanService();
      const result = await loanService.createLoan({
        productId: deviceId,
        returnDate: returnDate,
      });

      console.log("Product reserved successfully:", result);
      
      // Close loan modal and open success dialog
      setIsModalOpen(false);
      setReservationDetails({
        returnDate: returnDate,
        reservedAt: result.product.reservedAt || new Date().toISOString(),
      });
      setIsSuccessDialogOpen(true);
      
      // TODO: Optionally refresh the devices list to update availability
    } catch (err) {
      console.error("Failed to create loan:", err);
      // TODO: Show error message to user
      throw err;
    }
  };

  const handleCloseSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    setReservationDetails(null);
    setSelectedDevice(null);
  };

  const handleNotificationSubscribe = async (productId: string, notificationTypes: ('email' | 'sms' | 'push')[]) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    setSubscribingProducts(prev => new Set(prev).add(productId));
    setNotificationMenuOpen(null);

    try {
      const notificationService = await getNotificationService();
      
      if (subscribedProducts.has(productId)) {
        // Unsubscribe
        await notificationService.unsubscribe(productId);
        setSubscribedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        // Subscribe with selected notification types
        await notificationService.subscribe({
          productId,
          notificationTypes,
        });
        setSubscribedProducts(prev => new Set(prev).add(productId));
      }
    } catch (err) {
      console.error("Failed to manage notification subscription:", err);
      // TODO: Show error message to user
    } finally {
      setSubscribingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const toggleNotificationType = (type: 'email' | 'sms' | 'push') => {
    setSelectedNotificationTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
        // Ensure at least one type is always selected
        if (newSet.size === 0) {
          newSet.add('email');
        }
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const filteredDevices = useMemo(() => {
    if (!devices || !Array.isArray(devices)) {
      return [];
    }
    
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        device.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        Error loading devices: {error.message}
      </div>
    );
  }

  return (
    <div>
      <PageBanner
        title="Available Devices"
        subtitle="Browse and loan devices from our catalog"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search devices..."
          />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Results */}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No devices found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => {
              const isAvailable = device.status === "available";
              const canLoan = isAuthenticated && isAvailable;
              const isUnavailable = !isAvailable;
              const isSubscribed = subscribedProducts.has(device.id);
              const isSubscribing = subscribingProducts.has(device.id);
              const menuOpen = notificationMenuOpen === device.id;

              return (
                <div key={device.id} className="relative">
                  <DeviceCard
                    image={
                      device.image ||
                      `https://placehold.co/400x300/e0e7ff/4f46e5?text=${encodeURIComponent(
                        device.name
                      )}`
                    }
                    name={device.name}
                    category={
                      device.category.charAt(0).toUpperCase() +
                      device.category.slice(1)
                    }
                    status={
                      device.status === "available"
                        ? "Available"
                        : device.status === "on-loan"
                        ? "On Loan"
                        : device.status.charAt(0).toUpperCase() +
                          device.status.slice(1)
                    }
                    specs={device.description}
                    buttonText={
                      !isAuthenticated && isAvailable
                        ? "Sign in to Loan"
                        : isAvailable
                        ? "Loan Device"
                        : "Unavailable"
                    }
                    buttonDisabled={!canLoan}
                    onButtonClick={
                      !isAuthenticated && isAvailable
                        ? () => loginWithRedirect()
                        : canLoan
                        ? () => handleOpenLoanModal(device)
                        : undefined
                    }
                    secondaryButtonText={
                      isUnavailable
                        ? isSubscribed
                          ? "Unsubscribe"
                          : "Notify When Available"
                        : undefined
                    }
                    secondaryButtonDisabled={isSubscribing}
                    onSecondaryButtonClick={
                      isUnavailable
                        ? () => {
                            if (isSubscribed) {
                              handleNotificationSubscribe(device.id, []);
                            } else {
                              setNotificationMenuOpen(menuOpen ? null : device.id);
                            }
                          }
                        : undefined
                    }
                    isSubscribed={isSubscribed}
                  />
                  {/* Notification Type Menu */}
                  {menuOpen && isUnavailable && !isSubscribed && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Select notification methods:</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNotificationTypes.has('email')}
                            onChange={() => toggleNotificationType('email')}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">📧 Email</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNotificationTypes.has('sms')}
                            onChange={() => toggleNotificationType('sms')}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">📱 SMS</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNotificationTypes.has('push')}
                            onChange={() => toggleNotificationType('push')}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">🔔 Push Notification</span>
                        </label>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleNotificationSubscribe(device.id, Array.from(selectedNotificationTypes))}
                          disabled={selectedNotificationTypes.size === 0}
                          className="flex-1 py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Subscribe
                        </button>
                        <button
                          onClick={() => setNotificationMenuOpen(null)}
                          className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan Device Modal */}
      <LoanDeviceModal
        isOpen={isModalOpen}
        onClose={handleCloseLoanModal}
        device={selectedDevice}
        onConfirmLoan={handleConfirmLoan}
      />

      {/* Loan Success Dialog */}
      <LoanSuccessDialog
        isOpen={isSuccessDialogOpen}
        onClose={handleCloseSuccessDialog}
        deviceName={selectedDevice?.name || ''}
        returnDate={reservationDetails?.returnDate || ''}
        reservedAt={reservationDetails?.reservedAt || ''}
      />
    </div>
  );
}

export default Devices;
