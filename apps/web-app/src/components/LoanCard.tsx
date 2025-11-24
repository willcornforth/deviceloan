import { ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface LoanCardProps {
  image: string;
  device: string;
  category: string;
  loanDate: string;
  returnDate: string;
  status: string;
  isActive?: boolean;
  onReturn?: () => void;
}

function LoanCard({
  image,
  device,
  category,
  loanDate,
  returnDate,
  status,
  isActive = false,
  onReturn
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
            <p className="text-sm text-gray-500">{category}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'Overdue' 
              ? 'bg-red-100 text-red-800' 
              : status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
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
        
        {isActive && (
          <button 
            onClick={onReturn}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
          >
            Return Device
          </button>
        )}
      </div>
    </div>
  );
}

export default LoanCard;
