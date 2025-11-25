import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Loan } from '../app/loan-service';

interface LoanSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  deviceName: string;
}

function LoanSuccessDialog({ isOpen, onClose, loan, deviceName }: LoanSuccessDialogProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !loan) return null;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (): number => {
    const dueDate = new Date(loan.dueDate);
    const loanDate = new Date(loan.loanDate);
    const diff = dueDate.getTime() - loanDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Loan Confirmed!
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Your device loan has been successfully created
            </p>

            {/* Loan Details Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 space-y-3">
              <div>
                <p className="text-sm text-indigo-600 font-medium mb-1">Device</p>
                <p className="text-lg font-semibold text-gray-900">{deviceName}</p>
              </div>

              <div className="border-t border-indigo-200 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Loan ID:</span>
                  <span className="text-sm font-medium text-gray-900">{loan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(new Date(loan.loanDate))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(new Date(loan.dueDate))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {calculateDuration()} {calculateDuration() === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reminder */}
            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Reminder:</span> Please return the device by{' '}
                <span className="font-semibold">{formatDate(new Date(loan.dueDate))}</span> to avoid late fees.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanSuccessDialog;
