import { InvocationContext } from '@azure/functions';
import { CorrelationContext } from './correlation-context';
import { trackHttpDependency } from './telemetry';

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
      const prefix = options.correlationContext ? `${options.correlationContext.getLogPrefix()} ` : '';
      try {
        const start = Date.now();
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
        const bodySize = options.body ? JSON.stringify(options.body).length : 0;
        
        if (attempt > 0) {
          context.log(`${prefix}Retry attempt ${attempt}/${this.maxRetries} for ${options.method} ${url}${bodySize > 0 ? ` (body: ${bodySize} bytes)` : ''}`);
        } else {
          context.log(`${prefix}${options.method} ${url}${bodySize > 0 ? ` (body: ${bodySize} bytes)` : ''}`);
        }

        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const duration = Date.now() - start;

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          context.log(`${prefix}Unsuccessful response: ${response.status} in ${duration}ms (attempt ${attempt + 1}/${this.maxRetries + 1}): ${errorText}`);
          // Track failed dependency
          trackHttpDependency({
            name: options.path,
            url,
            method: options.method,
            durationMs: duration,
            resultCode: response.status,
            success: false,
            properties: options.correlationContext ? {
              correlationId: options.correlationContext.correlationId,
              invocationId: options.correlationContext.invocationId,
              traceParent: options.correlationContext.traceParent ?? '',
            } : undefined,
          });
          
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
          context.log(`${prefix}Retrying request after ${response.status} error (attempt ${attempt + 1}/${this.maxRetries + 1}), backing off for ${Math.round(backoffDelay)}ms`);
          await this.delay(backoffDelay);
          continue;
        }

        // Track successful dependency
        trackHttpDependency({
          name: options.path,
          url,
          method: options.method,
          durationMs: duration,
          resultCode: response.status,
          success: true,
          properties: options.correlationContext ? {
            correlationId: options.correlationContext.correlationId,
            invocationId: options.correlationContext.invocationId,
            traceParent: options.correlationContext.traceParent ?? '',
          } : undefined,
        });

        // Log successful response
        const contentLength = response.headers.get('content-length');
        context.log(`${prefix}${response.status} ${response.statusText} in ${duration}ms${contentLength ? ` (${contentLength} bytes)` : ''}`);

        // Handle empty responses (e.g., 204 No Content)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          return null as T;
        }

        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error as Error;
        // Track dependency on thrown error (network etc.)
        trackHttpDependency({
          name: options.path,
          url: `${this.baseUrl}${options.path}`,
          method: options.method,
          durationMs: 0,
          resultCode: undefined,
          success: false,
          properties: options.correlationContext ? {
            correlationId: options.correlationContext.correlationId,
            invocationId: options.correlationContext.invocationId,
            traceParent: options.correlationContext.traceParent ?? '',
          } : undefined,
        });

        // If it's not retryable or we're out of retries, throw immediately
        if (!this.isRetryableError(error) || attempt === this.maxRetries) {
          context.error(`${prefix}Request failed after ${attempt + 1} attempt(s): ${options.method} ${this.baseUrl}${options.path}`, error);
          throw error;
        }

        // Log and retry on network errors or retryable HTTP errors
        const backoffDelay = this.calculateBackoff(attempt);
        context.log(`${prefix}Retrying after network error (attempt ${attempt + 1}/${this.maxRetries + 1}), backing off for ${Math.round(backoffDelay)}ms:`, error);
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
