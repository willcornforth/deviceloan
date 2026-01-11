import { InvocationContext } from '@azure/functions';
import { CorrelationContext } from './correlation-context';

/**
 * Configuration for HttpClient with retry support
 */
export interface HttpClientConfig {
  baseUrl: string;
  hostKey?: string;
  /**
   * Maximum number of retry attempts. Default: 3
   */
  maxRetries?: number;
  /**
   * Initial retry delay in milliseconds. Increases exponentially with each attempt. Default: 1000ms
   */
  retryDelayMs?: number;
  /**
   * HTTP status codes that should trigger a retry. Default: [500, 502, 503, 504]
   */
  retryableStatusCodes?: number[];
}

export interface HttpClientOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  additionalHeaders?: Record<string, string>;
  correlationContext?: CorrelationContext;
}

export class HttpClient {
  private baseUrl: string;
  private hostKey?: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private retryableStatusCodes: number[];

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.hostKey = config.hostKey;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.retryableStatusCodes = config.retryableStatusCodes ?? [500, 502, 503, 504];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof HttpClientError) {
      return this.retryableStatusCodes.includes(error.statusCode);
    }
    // Retry on network errors (TypeError from fetch)
    return error instanceof TypeError;
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: delay * 2^attempt with jitter
    const exponentialDelay = this.retryDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
    return exponentialDelay + jitter;
  }

  async request<T>(
    options: HttpClientOptions,
    context: InvocationContext
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.additionalHeaders,
        };

        // Add correlation context headers for tracing
        if (options.correlationContext) {
          Object.assign(headers, options.correlationContext.getHeaders());
        }

        // Add host key for authenticated service-to-service calls
        if (this.hostKey) {
          headers['x-functions-key'] = this.hostKey;
        }

        const url = `${this.baseUrl}${options.path}`;
        const prefix = options.correlationContext ? `${options.correlationContext.getLogPrefix()} ` : '';
        
        if (attempt > 0) {
          context.log(`${prefix}Retry attempt ${attempt}/${this.maxRetries} for ${options.method} ${url}`);
        } else {
          context.log(`${prefix}${options.method} ${url}`);
        }

        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          context.log(`Service returned ${response.status}: ${errorText}`);
          
          const error = new HttpClientError(
            response.status,
            `Service request failed: ${response.statusText}`
          );

          // Check if this error is retryable
          if (!this.isRetryableError(error) || attempt === this.maxRetries) {
            throw error;
          }

          lastError = error;
          const backoffDelay = this.calculateBackoff(attempt);
          context.log(`Retryable error (${response.status}), backing off for ${Math.round(backoffDelay)}ms`);
          await this.delay(backoffDelay);
          continue;
        }

        // Handle empty responses (e.g., 204 No Content)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          return null as T;
        }

        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error as Error;

        // If it's not retryable or we're out of retries, throw immediately
        if (!this.isRetryableError(error) || attempt === this.maxRetries) {
          context.error(`Request failed after ${attempt + 1} attempt(s):`, error);
          throw error;
        }

        // Log and retry on network errors or retryable HTTP errors
        const backoffDelay = this.calculateBackoff(attempt);
        context.log(`Network error, backing off for ${Math.round(backoffDelay)}ms:`, error);
        await this.delay(backoffDelay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after retries');
  }
}

export class HttpClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}
