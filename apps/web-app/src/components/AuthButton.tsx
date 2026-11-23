import { useAuth0 } from '@auth0/auth0-react';
import { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

function AuthButton() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="h-8 w-8 rounded-full border-2 border-indigo-100"
            />
          ) : (
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {user?.name || user?.email}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 z-50 divide-y divide-gray-100 rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout({ logoutParams: { returnTo: window.location.origin } });
                }}
                className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => loginWithRedirect()}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
      >
        Log In
      </button>
      <button
        onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
      >
        Sign Up
      </button>
    </div>
  );
}

export default AuthButton;
