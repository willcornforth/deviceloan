interface ActiveLoanCardProps {
  image: string;
  device: string;
  category: string;
  loanDate: string;
  dueDate: string;
  userName: string;
  userEmail: string;
  onReturn: () => void;
  isProcessing?: boolean;
}

function ActiveLoanCard({
  image,
  device,
  category,
  loanDate,
  dueDate,
  userName,
  userEmail,
  onReturn,
  isProcessing = false,
}: ActiveLoanCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Device Image */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-purple-50">
        <img
          src={image}
          alt={device}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Active
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Device Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{device}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* User Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs text-gray-500">Borrowed by</p>
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Loaned: {loanDate}</span>
          </div>

          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Due: {dueDate}</span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={onReturn}
          disabled={isProcessing}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
            isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Mark as Returned'
          )}
        </button>
      </div>
    </div>
  );
}

export default ActiveLoanCard;
