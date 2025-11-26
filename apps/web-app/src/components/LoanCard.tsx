import { ClockIcon, CalendarIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon, TvIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface LoanCardProps {
  image: string;
  device: string;
  category: string;
  loanDate: string;
  returnDate: string;
  status: string;
  isActive?: boolean;
  onReturn?: () => void;
  isReturning?: boolean;
}

const getCategoryIcon = (category: string) => {
  const normalizedCategory = category.toLowerCase();
  switch (normalizedCategory) {
    case 'laptop':
      return <ComputerDesktopIcon className="h-4 w-4 text-gray-400" />;
    case 'tablet':
      return <DeviceTabletIcon className="h-4 w-4 text-gray-400" />;
    case 'phone':
      return <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />;
    case 'monitor':
      return <TvIcon className="h-4 w-4 text-gray-400" />;
    case 'accessory':
      return <WrenchScrewdriverIcon className="h-4 w-4 text-gray-400" />;
    default:
      return <ComputerDesktopIcon className="h-4 w-4 text-gray-400" />;
  }
};

function LoanCard({
  image,
  device,
  category,
  loanDate,
  returnDate,
  status,
  isActive = false,
  onReturn,
  isReturning = false
}: LoanCardProps) {
  const daysRemaining = isActive 
    ? Math.ceil((new Date(returnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
    
  const daysLoaned = !isActive
    ? Math.ceil((new Date(returnDate).getTime() - new Date(loanDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 ${
        isActive ? 'hover:border-indigo-300' : 'hover:border-gray-300'
      }`}
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        <img 
          src={image} 
          alt={device}
          className={`w-full h-full object-cover ${!isActive ? 'opacity-75' : ''}`}
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{device}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              {getCategoryIcon(category)}
              <span>{category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}</span>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'Overdue' 
              ? 'bg-red-100 text-red-800' 
              : status === 'Active'
              ? 'bg-green-100 text-green-800'
              : status === 'PendingApproval'
              ? 'bg-yellow-100 text-yellow-800'
              : status === 'Rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status === 'PendingApproval' ? 'Pending Approval' : status}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span><span className="font-semibold text-xs tracking-wider">LOANED</span> {loanDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span><span className="font-semibold text-xs tracking-wider">{isActive ? 'DUE' : 'RETURNED'}</span> {returnDate}</span>
          </div>
          {isActive && daysRemaining !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className={`h-4 w-4 ${daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 3 ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className={daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-gray-600'}>
                <span className="font-semibold text-xs tracking-wider">{daysRemaining < 0 ? 'OVERDUE BY' : 'REMAINING'}</span> {daysRemaining < 0 
                  ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}` 
                  : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}
          {!isActive && daysLoaned !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span><span className="font-semibold text-xs tracking-wider">DURATION</span> {daysLoaned} days</span>
            </div>
          )}
        </div>
        
        {isActive && status !== 'PendingApproval' && status !== 'Rejected' && (
          <button 
            onClick={onReturn}
            disabled={isReturning}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isReturning 
                ? 'bg-indigo-400 text-white cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isReturning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Returning...
              </span>
            ) : (
              'Return Device'
            )}
          </button>
        )}
        {status === 'Rejected' && (
          <div className="w-full p-4 rounded-lg text-sm bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Loan Rejected</p>
                <p className="text-red-700 text-xs leading-relaxed">
                  Your loan request was not approved. Please contact university staff for more information.
                </p>
              </div>
            </div>
          </div>
        )}
        {isActive && status === 'PendingApproval' && (
          <div className="w-full p-4 rounded-lg text-sm bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-1">Awaiting Approval</p>
                <p className="text-yellow-700 text-xs leading-relaxed">
                  Your loan request is waiting approval from university staff. The device will be available for collection once approved.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoanCard;
