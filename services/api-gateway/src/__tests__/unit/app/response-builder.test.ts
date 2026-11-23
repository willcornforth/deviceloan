// Unit tests for ResponseBuilder utility class

import { describe, it, expect } from 'vitest';
import { ResponseBuilder } from '../../../app/response-builder';

describe('ResponseBuilder', () => {
	describe('success', () => {
		it('should create a 200 success response with data', () => {
			const data = { id: '123', name: 'Test' };
			const response = ResponseBuilder.success(data);

			expect(response.status).toBe(200);
			expect(response.jsonBody).toEqual({ data });
		});

		it('should include message when provided', () => {
			const data = { id: '123' };
			const message = 'Operation completed';
			const response = ResponseBuilder.success(data, message);

			expect(response.status).toBe(200);
			expect(response.jsonBody).toEqual({ message, data });
		});
	});

	describe('created', () => {
		it('should create a 201 created response with data', () => {
			const data = { id: '456', name: 'New Item' };
			const response = ResponseBuilder.created(data);

			expect(response.status).toBe(201);
			expect(response.jsonBody).toEqual({ data });
		});

		it('should include message when provided', () => {
			const data = { id: '456' };
			const message = 'Resource created';
			const response = ResponseBuilder.created(data, message);

			expect(response.status).toBe(201);
			expect(response.jsonBody).toEqual({ message, data });
		});
	});

	describe('unauthorized', () => {
		it('should create a 401 unauthorized response with default message', () => {
			const response = ResponseBuilder.unauthorized();

			expect(response.status).toBe(401);
			expect(response.jsonBody).toEqual({
				error: 'Unauthorized',
				message: 'Invalid or missing authentication token',
			});
		});

		it('should use custom message when provided', () => {
			const message = 'Token expired';
			const response = ResponseBuilder.unauthorized(message);

			expect(response.status).toBe(401);
			expect(response.jsonBody).toEqual({
				error: 'Unauthorized',
				message,
			});
		});
	});

	describe('forbidden', () => {
		it('should create a 403 forbidden response with default message', () => {
			const response = ResponseBuilder.forbidden();

			expect(response.status).toBe(403);
			expect(response.jsonBody).toEqual({
				error: 'Forbidden',
				message: 'Insufficient permissions',
			});
		});

		it('should use custom message when provided', () => {
			const message = 'Admin access required';
			const response = ResponseBuilder.forbidden(message);

			expect(response.status).toBe(403);
			expect(response.jsonBody).toEqual({
				error: 'Forbidden',
				message,
			});
		});
	});

	describe('badRequest', () => {
		it('should create a 400 bad request response with default message', () => {
			const response = ResponseBuilder.badRequest();

			expect(response.status).toBe(400);
			expect(response.jsonBody).toEqual({
				error: 'Bad Request',
				message: 'Invalid request',
			});
		});

		it('should use custom message when provided', () => {
			const message = 'Missing required field: userId';
			const response = ResponseBuilder.badRequest(message);

			expect(response.status).toBe(400);
			expect(response.jsonBody).toEqual({
				error: 'Bad Request',
				message,
			});
		});
	});

	describe('internalError', () => {
		it('should create a 500 internal error response with default message', () => {
			const response = ResponseBuilder.internalError();

			expect(response.status).toBe(500);
			expect(response.jsonBody).toEqual({
				error: 'Internal Server Error',
				message: 'An internal error occurred',
			});
		});

		it('should use custom message when provided', () => {
			const message = 'Database connection failed';
			const response = ResponseBuilder.internalError(message);

			expect(response.status).toBe(500);
			expect(response.jsonBody).toEqual({
				error: 'Internal Server Error',
				message,
			});
		});
	});

	describe('serviceError', () => {
		it('should create a response with custom status code', () => {
			const response = ResponseBuilder.serviceError(503, 'Service unavailable');

			expect(response.status).toBe(503);
			expect(response.jsonBody).toEqual({
				error: 'Service Error',
				message: 'Service unavailable',
			});
		});
	});

	describe('badGateway', () => {
		it('should create a 502 bad gateway response with default message', () => {
			const response = ResponseBuilder.badGateway();

			expect(response.status).toBe(502);
			expect(response.jsonBody).toEqual({
				error: 'Bad Gateway',
				message: 'Unable to connect to upstream service',
			});
		});

		it('should use custom message when provided', () => {
			const message = 'Products service is down';
			const response = ResponseBuilder.badGateway(message);

			expect(response.status).toBe(502);
			expect(response.jsonBody).toEqual({
				error: 'Bad Gateway',
				message,
			});
		});
	});
});
