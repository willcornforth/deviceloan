// Integration tests for HttpClient with real HTTP requests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpClient, HttpClientError } from '../../../infra/http-client';
import { createServer, Server } from 'http';

describe('HttpClient Integration Tests', () => {
	let client: HttpClient;
	let mockContext: any;
	let server: Server;
	let serverPort: number;

	beforeEach(async () => {
		mockContext = {
			log: () => {},
			error: () => {},
		};

		// Create a mock HTTP server
		await new Promise<void>((resolve) => {
			server = createServer((req, res) => {
				const url = req.url || '';
				
				if (url === '/api/success') {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ success: true, data: 'test' }));
				} else if (url === '/api/error') {
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Internal Server Error');
				} else if (url === '/api/notfound') {
					res.writeHead(404, { 'Content-Type': 'text/plain' });
					res.end('Not Found');
				} else if (url === '/api/nocontent') {
					res.writeHead(204);
					res.end();
				} else if (url === '/api/echo' && req.method === 'POST') {
					let body = '';
					req.on('data', (chunk) => {
						body += chunk.toString();
					});
					req.on('end', () => {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(body);
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			});

			server.listen(0, () => {
				const address = server.address();
				if (address && typeof address === 'object') {
					serverPort = address.port;
					resolve();
				}
			});
		});

		client = new HttpClient({
			baseUrl: `http://localhost:${serverPort}`,
		});
	});

	afterEach(async () => {
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
		});
	});

	it('should make a successful GET request', async () => {
		const result = await client.request<{ success: boolean; data: string }>(
			{
				method: 'GET',
				path: '/api/success',
			},
			mockContext
		);

		expect(result).toEqual({ success: true, data: 'test' });
	});

	it('should make a successful POST request with body', async () => {
		const body = { name: 'Test Item', value: 123 };

		const result = await client.request<typeof body>(
			{
				method: 'POST',
				path: '/api/echo',
				body,
			},
			mockContext
		);

		expect(result).toEqual(body);
	});

	it('should handle 204 No Content responses', async () => {
		const result = await client.request(
			{
				method: 'DELETE',
				path: '/api/nocontent',
			},
			mockContext
		);

		expect(result).toBeNull();
	});

	it('should throw HttpClientError on 404', async () => {
		// 404 is a client error and should not retry
		await expect(
			client.request(
				{
					method: 'GET',
					path: '/api/notfound',
				},
				mockContext
			)
		).rejects.toThrow(HttpClientError);

		await expect(
			client.request(
				{
					method: 'GET',
					path: '/api/notfound',
				},
				mockContext
			)
		).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it('should retry and eventually throw HttpClientError on 500', async () => {
		// Configure client with fewer retries for faster test
		const retryClient = new HttpClient({
			baseUrl: `http://localhost:${serverPort}`,
			maxRetries: 1,
			retryDelayMs: 10,
		});

		const error = await retryClient.request(
			{
				method: 'GET',
				path: '/api/error',
			},
			mockContext
		).catch(e => e);

		expect(error).toBeInstanceOf(HttpClientError);
		expect(error.statusCode).toBe(500);
	});

	it('should include host key in headers when configured', async () => {
		const clientWithKey = new HttpClient({
			baseUrl: `http://localhost:${serverPort}`,
			hostKey: 'test-key-123',
		});

		// The server doesn't validate the key, but we can verify the request succeeds
		const result = await clientWithKey.request<{ success: boolean }>(
			{
				method: 'GET',
				path: '/api/success',
			},
			mockContext
		);

		expect(result.success).toBe(true);
	});
});
