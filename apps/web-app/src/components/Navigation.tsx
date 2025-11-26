import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthButton from './AuthButton';

function Navigation() {
  const location = useLocation();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasApprovePermission, setHasApprovePermission] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setHasApprovePermission(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const permissions = payload.permissions || [];
        setHasApprovePermission(permissions.includes('approve:loans'));
      } catch {
        setHasApprovePermission(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, getAccessTokenSilently]);
  
  const isActive = (path: string): boolean => location.pathname === path;
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-md border-gray-200/50 shadow-lg' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">Student Device Loans</span>
          </Link>
          <div className="flex items-center space-x-1">
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
            {hasApprovePermission && (
              <Link 
                to="/approvals" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/approvals') 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Approvals
              </Link>
            )}
            <div className="ml-4 pl-4 border-l border-gray-200">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
