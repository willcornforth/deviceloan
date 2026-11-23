import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import { ServiceError } from "../infra/service-error-handler";

interface ErrorAlertProps {
  error: Error | ServiceError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
}

/**
 * Displays user-friendly error messages with optional retry and dismiss actions
 * Handles both regular Errors and ServiceErrors with retry hints
 */
export default function ErrorAlert({
  error,
  onDismiss,
  onRetry,
  title = "Error",
  showDetails = false,
}: ErrorAlertProps) {
  if (!error) return null;

  const isServiceError = error instanceof ServiceError;
  const userMessage = isServiceError 
    ? error.userMessage 
    : error.message || "An unexpected error occurred";
  const technicalMessage = isServiceError 
    ? error.technicalMessage 
    : error.message;
  const isRetryable = isServiceError ? error.isRetryable : false;

  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon 
            className="h-5 w-5 text-red-600" 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            {userMessage}
          </div>
          {showDetails && technicalMessage && (
            <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded font-mono">
              {technicalMessage}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {isRetryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-100 rounded-md transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-100 rounded-md transition-colors"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
