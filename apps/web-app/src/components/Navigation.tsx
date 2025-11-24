import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            Device Loan System
          </Link>
          <div className="flex space-x-1">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/devices" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/devices') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Devices
            </Link>
            <Link 
              to="/loans" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/loans') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Loans
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
