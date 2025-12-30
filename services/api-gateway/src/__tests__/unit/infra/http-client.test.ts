// Unit tests for HttpClient

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient, HttpClientError } from '../../../infra/http-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('HttpClient', () => {
	let client: HttpClient;
	let mockContext: any;

	beforeEach(() => {
		client = new HttpClient({
			baseUrl: 'http://localhost:7071',
			hostKey: 'test-key',
		});

		mockContext = {
			log: vi.fn(),
			error: vi.fn(),
		};

		vi.clearAllMocks();
	});

	describe('request', () => {
		it('should make a successful GET request', async () => {
			const mockData = { id: '123', name: 'Test' };
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => mockData,
			} as Response);

			const result = await client.request<typeof mockData>(
				{
					method: 'GET',
					path: '/api/test',
				},
				mockContext
			);

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledWith(
				'http://localhost:7071/api/test',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'x-functions-key': 'test-key',
					}),
				})
			);
		});

		it('should make a successful POST request with body', async () => {
			const requestBody = { name: 'New Item' };
			const mockResponse = { id: '456', ...requestBody };

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 201,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => mockResponse,
			} as Response);

			const result = await client.request<typeof mockResponse>(
				{
					method: 'POST',
					path: '/api/items',
					body: requestBody,
				},
				mockContext
			);

			expect(result).toEqual(mockResponse);
			expect(fetch).toHaveBeenCalledWith(
				'http://localhost:7071/api/items',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(requestBody),
				})
			);
		});

		it('should include additional headers when provided', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => ({}),
			} as Response);

			await client.request(
				{
					method: 'GET',
					path: '/api/test',
					additionalHeaders: {
						'X-Custom-Header': 'custom-value',
					},
				},
				mockContext
			);

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Custom-Header': 'custom-value',
					}),
				})
			);
		});

		it('should handle 204 No Content responses', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 204,
				headers: new Headers({ 'content-length': '0' }),
			} as Response);

			const result = await client.request(
				{
					method: 'DELETE',
					path: '/api/items/123',
				},
				mockContext
			);

			expect(result).toBeNull();
		});

		it('should throw HttpClientError on non-ok response', async () => {
			// 404 should not retry (client error)
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				text: async () => 'Resource not found',
			} as Response);

			await expect(
				client.request(
					{
						method: 'GET',
						path: '/api/missing',
					},
					mockContext
				)
			).rejects.toThrow(HttpClientError);

			// Should only attempt once (no retry for 4xx errors)
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('should retry on 500 server errors', async () => {
			// Configure client with 2 retries for faster test
			const retryClient = new HttpClient({
				baseUrl: 'http://localhost:7071',
				maxRetries: 2,
				retryDelayMs: 10, // Short delay for testing
			});

			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				text: async () => 'Server error',
			} as Response);

			await expect(
				retryClient.request(
					{
						method: 'GET',
						path: '/api/error',
					},
					mockContext
				)
			).rejects.toThrow(HttpClientError);

			// Should attempt 3 times total (initial + 2 retries)
			expect(fetch).toHaveBeenCalledTimes(3);
		});

		it('should succeed after retry', async () => {
			// Configure client with retry
			const retryClient = new HttpClient({
				baseUrl: 'http://localhost:7071',
				maxRetries: 2,
				retryDelayMs: 10,
			});

			const mockData = { success: true };

			// Fail first, succeed second
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: false,
					status: 503,
					statusText: 'Service Unavailable',
					text: async () => 'Service temporarily unavailable',
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => mockData,
				} as Response);

			const result = await retryClient.request<typeof mockData>(
				{
					method: 'GET',
					path: '/api/test',
				},
				mockContext
			);

			expect(result).toEqual(mockData);
			expect(fetch).toHaveBeenCalledTimes(2);
		});

		it('should log requests', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => ({}),
			} as Response);

			await client.request(
				{
					method: 'GET',
					path: '/api/test',
				},
				mockContext
			);

			expect(mockContext.log).toHaveBeenCalledWith(
				'GET http://localhost:7071/api/test'
			);
		});

		it('should work without host key', async () => {
			const clientWithoutKey = new HttpClient({
				baseUrl: 'http://localhost:7071',
			});

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => ({}),
			} as Response);

			await clientWithoutKey.request(
				{
					method: 'GET',
					path: '/api/public',
				},
				mockContext
			);

			const callHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
			expect(callHeaders['x-functions-key']).toBeUndefined();
		});
	});

	describe('HttpClientError', () => {
		it('should create an error with status code', () => {
			const error = new HttpClientError(404, 'Not found');

			expect(error.statusCode).toBe(404);
			expect(error.message).toBe('Not found');
			expect(error.name).toBe('HttpClientError');
		});
	});
});
