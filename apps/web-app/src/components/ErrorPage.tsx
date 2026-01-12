import { 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import { ServiceError } from "../infra/service-error-handler";

interface ErrorPageProps {
  title: string;
  subtitle: string;
  error: Error | ServiceError | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

/**
 * Full-page error display for when initial data loading fails
 * Provides large, clear messaging and retry option
 */
export default function ErrorPage({
  title,
  subtitle,
  error,
  onRetry,
  showDetails = false,
}: ErrorPageProps) {
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
    <div>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon 
                className="h-8 w-8 text-red-600" 
                aria-hidden="true" 
              />
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-medium text-red-800">
                Unable to Load {title}
              </h2>
              <p className="mt-3 text-base text-red-700">
                {userMessage}
              </p>
              {showDetails && technicalMessage && (
                <div className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded font-mono break-words">
                  {technicalMessage}
                </div>
              )}
              <div className="mt-6">
                {isRetryable && onRetry ? (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Try Again
                  </button>
                ) : (
                  <p className="text-sm text-red-700 italic">
                    This error is not automatically recoverable. Please refresh the page or contact support if the problem persists.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
