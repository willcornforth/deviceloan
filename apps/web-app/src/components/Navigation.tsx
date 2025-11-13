import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold hover:text-gray-300 transition-colors">
            Device Loan System
          </Link>
          <div className="flex space-x-4">
            <Link 
              to="/" 
              className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/devices" 
              className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Devices
            </Link>
            <Link 
              to="/loans" 
              className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
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
