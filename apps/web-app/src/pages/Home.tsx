import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Device Loan System</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Streamline your device management with our modern loan tracking system
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link 
          to="/devices" 
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">View Devices</h2>
          <p className="text-gray-600">Browse and search through our catalog of available devices ready for loan</p>
        </Link>
        
        <Link 
          to="/loans" 
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Loans</h2>
          <p className="text-gray-600">Track and manage your current device loans and loan history</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
