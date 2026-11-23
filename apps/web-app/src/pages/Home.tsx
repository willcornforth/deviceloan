import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { MouseEvent } from 'react';

function Home() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const handleLoansClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      loginWithRedirect();
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern devices and technology" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-indigo-600/80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">Student Device Loans</h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto drop-shadow-md">
              Use this system to easily borrow and manage devices for your studies.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
          onClick={handleLoansClick}
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 relative"
        >
          {!isAuthenticated && (
            <div className="absolute top-4 right-4">
              <LockClosedIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {isAuthenticated && (
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            )}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Loans</h2>
          <p className="text-gray-600">
            {isAuthenticated 
              ? 'Track and manage your current device loans and history'
              : 'Sign in to track and manage your device loans'}
          </p>
        </Link>
      </div>
      </div>
    </div>
  );
}

export default Home;
