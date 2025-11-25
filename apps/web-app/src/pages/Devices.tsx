import { useState, useMemo } from "react";
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
import { Product } from "../app/product-service";
import { Loan } from "../app/loan-service";

function Devices() {
  const { products: devices, loading, error } = useProducts();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { getLoanService } = useLoanService();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Product | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdLoan, setCreatedLoan] = useState<Loan | null>(null);

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

      console.log("Loan created successfully:", result.loan);
      
      // Close loan modal and open success dialog
      setIsModalOpen(false);
      setCreatedLoan(result.loan);
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
    setCreatedLoan(null);
    setSelectedDevice(null);
  };

  const filteredDevices = useMemo(() => {
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

              return (
                <DeviceCard
                  key={device.id}
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
                />
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
        loan={createdLoan}
        deviceName={selectedDevice?.name || ''}
      />
    </div>
  );
}

export default Devices;
