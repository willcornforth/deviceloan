import { ClockIcon, CalendarIcon, UserIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon, TvIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface ApprovalCardProps {
  image: string;
  device: string;
  category: string;
  requestDate: string;
  dueDate: string;
  userName: string;
  userEmail: string;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
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

function ApprovalCard({
  image,
  device,
  category,
  requestDate,
  dueDate,
  userName,
  userEmail,
  onApprove,
  onReject,
  isProcessing = false
}: ApprovalCardProps) {
  const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-indigo-300">
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        <img 
          src={image} 
          alt={device}
          className="w-full h-full object-cover"
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{userName}</span>
          </div>
          <p className="text-xs text-gray-500 ml-6">{userEmail}</p>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span><span className="font-semibold text-xs tracking-wider">REQUESTED</span> {requestDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span><span className="font-semibold text-xs tracking-wider">DUE DATE</span> {dueDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span><span className="font-semibold text-xs tracking-wider">DURATION</span> {daysUntilDue} days</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onReject}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isProcessing 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Reject
          </button>
          <button 
            onClick={onApprove}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isProcessing 
                ? 'bg-indigo-400 text-white cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Approve'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprovalCard;
