import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

function Devices() {
  const [devices] = useState([
    { id: 1, name: 'MacBook Pro 16"', category: 'Laptop', status: 'Available', specs: 'M2 Pro, 16GB RAM', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=MacBook+Pro' },
    { id: 2, name: 'iPad Pro 12.9"', category: 'Tablet', status: 'Available', specs: 'M2, 256GB', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=iPad+Pro' },
    { id: 3, name: 'iPhone 15 Pro', category: 'Phone', status: 'On Loan', specs: '256GB, Titanium', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=iPhone+15' },
    { id: 4, name: 'Dell XPS 15', category: 'Laptop', status: 'Available', specs: 'i7, 32GB RAM', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Dell+XPS' },
    { id: 5, name: 'Surface Pro 9', category: 'Tablet', status: 'Available', specs: 'i5, 16GB RAM', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Surface+Pro' },
    { id: 6, name: 'Samsung Galaxy Tab', category: 'Tablet', status: 'Available', specs: 'Snapdragon, 8GB', image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Galaxy+Tab' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { name: 'All', icon: null },
    { name: 'Laptop', icon: ComputerDesktopIcon },
    { name: 'Tablet', icon: DeviceTabletIcon },
    { name: 'Phone', icon: DevicePhoneMobileIcon },
  ];

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           device.specs.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || device.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Devices</h1>
        <p className="text-gray-600">Browse and loan devices from our catalog</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No devices found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
          <div 
            key={device.id} 
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
          >
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              <img 
                src={device.image} 
                alt={device.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.category}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  device.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {device.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{device.specs}</p>
              <button 
                disabled={device.status !== 'Available'}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  device.status === 'Available'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {device.status === 'Available' ? 'Loan Device' : 'Unavailable'}
              </button>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Devices;
