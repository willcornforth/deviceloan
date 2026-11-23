/**
 * User-friendly error messages for common HTTP status codes
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: "The request couldn't be processed. Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource wasn't found. It may have been removed or is temporarily unavailable.",
  408: "The request took too long. Please try again.",
  409: "This action conflicts with the current state. The item may already be reserved.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "We're experiencing technical difficulties. Please try again in a few moments.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is currently down for maintenance. Please try again later.",
  504: "The request timed out. Please check your connection and try again.",
};

const OPERATION_CONTEXT: Record<string, string> = {
  'list': 'loading',
  'get': 'loading',
  'create': 'creating',
  'reserve': 'reserving',
  'return': 'returning',
  'approve': 'approving',
  'reject': 'rejecting',
  'subscribe': 'subscribing to',
  'unsubscribe': 'unsubscribing from',
};

export class ServiceError extends Error {
  constructor(
    public readonly statusCode: number | undefined,
    public readonly userMessage: string,
    public readonly technicalMessage: string,
    public readonly isRetryable: boolean = false
  ) {
    super(userMessage);
    this.name = 'ServiceError';
  }
}

export interface HandleErrorOptions {
  operation: string; // e.g., 'list products', 'create loan'
  fallbackMessage?: string;
  resource?: string; // e.g., 'products', 'loans', 'notifications'
}

/**
 * Handles HTTP response errors with user-friendly messages and retry hints
 */
export async function handleServiceError(
  response: Response,
  options: HandleErrorOptions
): Promise<never> {
  const { operation, fallbackMessage, resource = 'data' } = options;
  const statusCode = response.status;
  
  // Try to extract server error message
  let serverMessage: string | undefined;
  try {
    const json = await response.json();
    serverMessage = json.message || json.error?.message || json.data?.message;
  } catch {
    // Response body not JSON or empty
  }

  // Determine if this is retryable (5xx errors and specific 4xx)
  const isRetryable = statusCode >= 500 || statusCode === 408 || statusCode === 429;

  // Build user-friendly message
  const operationVerb = Object.entries(OPERATION_CONTEXT).find(([key]) => 
    operation.toLowerCase().includes(key)
  )?.[1] || 'processing';

  const statusMessage = STATUS_MESSAGES[statusCode];
  let userMessage: string;

  if (statusCode === 401) {
    userMessage = STATUS_MESSAGES[401];
  } else if (statusCode === 409 && serverMessage) {
    // Use server message for conflicts (e.g., "Product already reserved")
    userMessage = serverMessage;
  } else if (serverMessage && statusCode >= 400 && statusCode < 500) {
    // Use server message for client errors when available
    userMessage = `Unable to complete ${operationVerb} ${resource}: ${serverMessage}`;
  } else if (statusMessage) {
    userMessage = `Error ${operationVerb} ${resource}. ${statusMessage}`;
  } else if (fallbackMessage) {
    userMessage = fallbackMessage;
  } else {
    userMessage = `We encountered an issue ${operationVerb} ${resource}. Please try again.`;
  }

  // Add retry hint for retryable errors
  if (isRetryable && !userMessage.toLowerCase().includes('try again')) {
    userMessage += ' Please try again.';
  }

  const technicalMessage = serverMessage || response.statusText || `HTTP ${statusCode}`;

  throw new ServiceError(statusCode, userMessage, technicalMessage, isRetryable);
}

/**
 * Handles network errors (timeouts, no connection, etc.)
 */
export function handleNetworkError(error: unknown, options: HandleErrorOptions): never {
  const { operation, resource = 'data' } = options;
  
  const operationVerb = Object.entries(OPERATION_CONTEXT).find(([key]) => 
    operation.toLowerCase().includes(key)
  )?.[1] || 'processing';

  const userMessage = `Unable to connect while ${operationVerb} ${resource}. Please check your internet connection and try again.`;
  const technicalMessage = error instanceof Error ? error.message : 'Network error';

  throw new ServiceError(undefined, userMessage, technicalMessage, true);
}

/**
 * Wraps a service call with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<Response>,
  options: HandleErrorOptions
): Promise<T> {
  try {
    const response = await fn();
    
    if (!response.ok) {
      await handleServiceError(response, options);
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    // Network errors (fetch failures)
    handleNetworkError(error, options);
  }
}
