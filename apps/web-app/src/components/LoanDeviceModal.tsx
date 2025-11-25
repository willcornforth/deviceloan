import { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Product } from '../app/product-service';

interface LoanDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Product | null;
  onConfirmLoan: (deviceId: string, returnDate: Date) => void;
}

function LoanDeviceModal({ isOpen, onClose, device, onConfirmLoan }: LoanDeviceModalProps) {
  const [returnDate, setReturnDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isOpen || !device) return null;

  // Calculate min and max dates
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1); // Tomorrow
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90); // 90 days from now

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDate) return;

    setIsSubmitting(true);
    try {
      const selectedReturnDate = new Date(returnDate);
      await onConfirmLoan(device.id, selectedReturnDate);
      onClose();
    } catch (error) {
      console.error('Error creating loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = (): number => {
    if (!returnDate) return 0;
    const selected = new Date(returnDate);
    const diff = selected.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Loan Device
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
                  <div className="px-6 py-6 space-y-6">
              {/* Device Overview Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <h4 className="text-sm font-medium text-indigo-900 mb-3">Device Details</h4>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={device.image || `https://placehold.co/120x90/e0e7ff/4f46e5?text=${encodeURIComponent(device.name)}`}
                      alt={device.name}
                      className="w-32 h-24 object-cover rounded-lg border-2 border-white shadow-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900">{device.name}</h5>
                      <p className="text-sm text-indigo-600 font-medium">
                        {device.category.charAt(0).toUpperCase() + device.category.slice(1)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Serial:</span>
                        <p className="font-medium text-gray-900">{device.serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium text-green-600">
                          {device.status === 'available' ? 'Available' : device.status}
                        </p>
                      </div>
                    </div>
                    {device.description && (
                      <p className="text-sm text-gray-600 pt-1">
                        {device.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Picker Section */}
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-5 w-5 inline-block mr-2 text-indigo-600" />
                  Expected Return Date
                </label>
                <input
                  type="date"
                  id="returnDate"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={formatDateForInput(minDate)}
                  max={formatDateForInput(maxDate)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Select a return date between tomorrow and {maxDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (max 90 days)
                </p>
                
                {returnDate && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-900">
                      <span className="font-semibold">Loan Duration:</span> {calculateDuration()} {calculateDuration() === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                )}
              </div>

              {/* Important Information */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-amber-900 mb-2">Important Information</h5>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>You are responsible for the device during the loan period</li>
                  <li>Late returns may result in penalties</li>
                  <li>Report any damage or issues immediately</li>
                  <li>Return the device in the same condition you received it</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!returnDate || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Creating Loan...' : 'Confirm Loan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoanDeviceModal;
