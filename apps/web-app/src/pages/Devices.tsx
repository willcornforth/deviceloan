import { useState, useMemo } from "react";
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import PageBanner from "../components/PageBanner";
import SearchBar from "../components/SearchBar";
import CategoryFilter, { Category } from "../components/CategoryFilter";
import DeviceCard from "../components/DeviceCard";
import { Device } from "../domain/Device";

function Devices() {
  const [devices] = useState<Device[]>([
    {
      id: 1,
      name: 'MacBook Pro 16"',
      category: "Laptop",
      status: "Available",
      specs: "M2 Pro, 16GB RAM",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=MacBook+Pro",
    },
    {
      id: 2,
      name: 'iPad Pro 12.9"',
      category: "Tablet",
      status: "Available",
      specs: "M2, 256GB",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=iPad+Pro",
    },
    {
      id: 3,
      name: "iPhone 15 Pro",
      category: "Phone",
      status: "On Loan",
      specs: "256GB, Titanium",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=iPhone+15",
    },
    {
      id: 4,
      name: "Dell XPS 15",
      category: "Laptop",
      status: "Available",
      specs: "i7, 32GB RAM",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Dell+XPS",
    },
    {
      id: 5,
      name: "Surface Pro 9",
      category: "Tablet",
      status: "Available",
      specs: "i5, 16GB RAM",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Surface+Pro",
    },
    {
      id: 6,
      name: "Samsung Galaxy Tab",
      category: "Tablet",
      status: "Available",
      specs: "Snapdragon, 8GB",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Galaxy+Tab",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories: Category[] = [
    { name: "All", icon: null },
    { name: "Laptop", icon: ComputerDesktopIcon },
    { name: "Tablet", icon: DeviceTabletIcon },
    { name: "Phone", icon: DevicePhoneMobileIcon },
  ];

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.specs.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || device.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, selectedCategory]);

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
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                image={device.image}
                name={device.name}
                category={device.category}
                status={device.status}
                specs={device.specs}
                buttonText={
                  device.status === "Available" ? "Loan Device" : "Unavailable"
                }
                buttonDisabled={device.status !== "Available"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Devices;
