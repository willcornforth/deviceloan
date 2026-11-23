import { InvocationContext } from '@azure/functions';

export interface HttpClientConfig {
  baseUrl: string;
  hostKey?: string;
}

export interface HttpClientOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  additionalHeaders?: Record<string, string>;
}

export class HttpClient {
  private baseUrl: string;
  private hostKey?: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.hostKey = config.hostKey;
  }

  async request<T>(
    options: HttpClientOptions,
    context: InvocationContext
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.additionalHeaders,
    };

    // Add host key for authenticated service-to-service calls
    if (this.hostKey) {
      headers['x-functions-key'] = this.hostKey;
    }

    const url = `${this.baseUrl}${options.path}`;
    context.log(`${options.method} ${url}`);

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      context.log(`Service returned ${response.status}: ${errorText}`);
      throw new HttpClientError(
        response.status,
        `Service request failed: ${response.statusText}`
      );
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    return response.json() as Promise<T>;
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
