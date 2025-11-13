import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Device Loan System</h1>
      <p className="text-lg text-gray-600 mb-6">
        Welcome to the Device Loan Management System
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Link 
          to="/devices" 
          className="p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">View Devices</h2>
          <p className="text-blue-100">Browse available devices for loan</p>
        </Link>
        <Link 
          to="/loans" 
          className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">My Loans</h2>
          <p className="text-green-100">View your current device loans</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
