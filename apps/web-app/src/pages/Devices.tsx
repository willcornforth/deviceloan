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
import { Product } from "../domain/products";

function Devices() {
  const [devices] = useState<Product[]>([
    {
      id: "1",
      name: 'MacBook Pro 16"',
      serialNumber: "MBP-2024-001",
      description: "M2 Pro, 16GB RAM",
      category: "laptop",
      status: "available",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=MacBook+Pro",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: 'iPad Pro 12.9"',
      serialNumber: "IPD-2024-002",
      description: "M2, 256GB",
      category: "tablet",
      status: "available",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=iPad+Pro",
      createdAt: new Date("2024-02-20"),
    },
    {
      id: "3",
      name: "iPhone 15 Pro",
      serialNumber: "IPH-2024-003",
      description: "256GB, Titanium",
      category: "phone",
      status: "on-loan",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=iPhone+15",
      createdAt: new Date("2024-03-10"),
    },
    {
      id: "4",
      name: "Dell XPS 15",
      serialNumber: "DXS-2024-004",
      description: "i7, 32GB RAM",
      category: "laptop",
      status: "available",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Dell+XPS",
      createdAt: new Date("2024-01-25"),
    },
    {
      id: "5",
      name: "Surface Pro 9",
      serialNumber: "SFP-2024-005",
      description: "i5, 16GB RAM",
      category: "tablet",
      status: "available",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Surface+Pro",
      createdAt: new Date("2024-04-05"),
    },
    {
      id: "6",
      name: "Samsung Galaxy Tab",
      serialNumber: "SGT-2024-006",
      description: "Snapdragon, 8GB",
      category: "tablet",
      status: "available",
      image: "https://placehold.co/400x300/e0e7ff/4f46e5?text=Galaxy+Tab",
      createdAt: new Date("2024-05-12"),
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
        device.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        device.category.toLowerCase() === selectedCategory.toLowerCase();
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
                  device.status === "available" ? "Loan Device" : "Unavailable"
                }
                buttonDisabled={device.status !== "available"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Devices;
