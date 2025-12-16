// Unit tests for OAuth2Validator

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuth2Validator } from '../../../infra/oauth2-validator';
import type { HttpRequest } from '@azure/functions';

// Mock jose module
vi.mock('jose', () => ({
	createRemoteJWKSet: vi.fn(() => vi.fn()),
	jwtVerify: vi.fn(),
}));

import { jwtVerify } from 'jose';

describe('OAuth2Validator', () => {
	let validator: OAuth2Validator;
	const mockOptions = {
		jwksUri: 'https://test.auth0.com/.well-known/jwks.json',
		issuer: 'https://test.auth0.com/',
		audience: 'https://test-api',
	};

	beforeEach(() => {
		validator = new OAuth2Validator(mockOptions);
		vi.clearAllMocks();
	});

	describe('validate', () => {
		it('should return unauthenticated context when no authorization header', async () => {
			const mockRequest = {
				headers: new Headers(),
			} as HttpRequest;

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: false,
				permissions: [],
			});
		});

		it('should return unauthenticated context when authorization header is malformed', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'InvalidFormat',
				}),
			} as HttpRequest;

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: false,
				permissions: [],
			});
		});

		it('should validate token and extract permissions as array', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-token',
				}),
			} as HttpRequest;

			vi.mocked(jwtVerify).mockResolvedValue({
				payload: {
					sub: 'auth0|123456',
					permissions: ['read:products', 'write:products'],
				},
				protectedHeader: {},
			} as any);

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: true,
				permissions: ['read:products', 'write:products'],
				subject: 'auth0|123456',
			});
		});

		it('should handle permissions as space-separated string', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-token',
				}),
			} as HttpRequest;

			vi.mocked(jwtVerify).mockResolvedValue({
				payload: {
					sub: 'auth0|123456',
					permissions: 'read:products write:products',
				},
				protectedHeader: {},
			} as any);

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: true,
				permissions: ['read:products', 'write:products'],
				subject: 'auth0|123456',
			});
		});

		it('should return empty permissions when not present in token', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-token',
				}),
			} as HttpRequest;

			vi.mocked(jwtVerify).mockResolvedValue({
				payload: {
					sub: 'auth0|123456',
				},
				protectedHeader: {},
			} as any);

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: true,
				permissions: [],
				subject: 'auth0|123456',
			});
		});

		it('should return unauthenticated when token verification fails', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer invalid-token',
				}),
			} as HttpRequest;

			vi.mocked(jwtVerify).mockRejectedValue(new Error('Token expired'));

			const result = await validator.validate(mockRequest);

			expect(result).toEqual({
				authenticated: false,
				permissions: [],
			});
		});
	});

	describe('hasPermission', () => {
		it('should return true when permission exists', () => {
			const authContext = {
				authenticated: true,
				permissions: ['read:products', 'write:products'],
				subject: 'auth0|123456',
			};

			const result = validator.hasPermission(authContext, 'read:products');

			expect(result).toBe(true);
		});

		it('should return false when permission does not exist', () => {
			const authContext = {
				authenticated: true,
				permissions: ['read:products'],
				subject: 'auth0|123456',
			};

			const result = validator.hasPermission(authContext, 'delete:products');

			expect(result).toBe(false);
		});

		it('should return false when not authenticated', () => {
			const authContext = {
				authenticated: false,
				permissions: [],
			};

			const result = validator.hasPermission(authContext, 'read:products');

			expect(result).toBe(false);
		});
	});
});
