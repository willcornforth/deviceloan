import { describe, it, expect } from 'vitest';
import { ResponseBuilder } from '../../infra/response-builder';

describe('ResponseBuilder', () => {
	describe('success', () => {
		it('should return success response with default status 200', () => {
			const data = { message: 'Success' };
			const response = ResponseBuilder.success(data);

			expect(response).toEqual({
				status: 200,
				jsonBody: data,
			});
		});

		it('should return success response with custom status code', () => {
			const data = { id: '123' };
			const response = ResponseBuilder.success(data, 201);

			expect(response).toEqual({
				status: 201,
				jsonBody: data,
			});
		});
	});

	describe('error', () => {
		it('should return error response with default status 500', () => {
			const message = 'Internal server error';
			const response = ResponseBuilder.error(message);

			expect(response).toEqual({
				status: 500,
				jsonBody: { error: message },
			});
		});

		it('should return error response with custom status code', () => {
			const message = 'Custom error';
			const response = ResponseBuilder.error(message, 503);

			expect(response).toEqual({
				status: 503,
				jsonBody: { error: message },
			});
		});
	});

	describe('notFound', () => {
		it('should return 404 with default message', () => {
			const response = ResponseBuilder.notFound();

			expect(response).toEqual({
				status: 404,
				jsonBody: { error: 'Resource not found' },
			});
		});

		it('should return 404 with custom message', () => {
			const message = 'User not found';
			const response = ResponseBuilder.notFound(message);

			expect(response).toEqual({
				status: 404,
				jsonBody: { error: message },
			});
		});
	});

	describe('badRequest', () => {
		it('should return 400 with default message', () => {
			const response = ResponseBuilder.badRequest();

			expect(response).toEqual({
				status: 400,
				jsonBody: { error: 'Bad request' },
			});
		});

		it('should return 400 with custom message', () => {
			const message = 'Invalid input';
			const response = ResponseBuilder.badRequest(message);

			expect(response).toEqual({
				status: 400,
				jsonBody: { error: message },
			});
		});
	});

	describe('unauthorized', () => {
		it('should return 401 with default message', () => {
			const response = ResponseBuilder.unauthorized();

			expect(response).toEqual({
				status: 401,
				jsonBody: { error: 'Unauthorized' },
			});
		});

		it('should return 401 with custom message', () => {
			const message = 'Invalid credentials';
			const response = ResponseBuilder.unauthorized(message);

			expect(response).toEqual({
				status: 401,
				jsonBody: { error: message },
			});
		});
	});

	describe('forbidden', () => {
		it('should return 403 with default message', () => {
			const response = ResponseBuilder.forbidden();

			expect(response).toEqual({
				status: 403,
				jsonBody: { error: 'Forbidden' },
			});
		});

		it('should return 403 with custom message', () => {
			const message = 'Access denied';
			const response = ResponseBuilder.forbidden(message);

			expect(response).toEqual({
				status: 403,
				jsonBody: { error: message },
			});
		});
	});
});
