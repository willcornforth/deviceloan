// Unit tests for AuthMiddleware

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthMiddleware } from '../../../app/auth-middleware';
import type { HttpRequest } from '@azure/functions';

// Mock the dependencies
vi.mock('../../../infra/oauth2-validator', () => {
	const mockValidatorInstance = {
		validate: vi.fn(),
		hasPermission: vi.fn(),
	};
	
	return {
		OAuth2Validator: vi.fn(function() {
			return mockValidatorInstance;
		}),
		__mockValidatorInstance: mockValidatorInstance,
	};
});

vi.mock('../../../infra/service-config', () => ({
	ServiceConfig: {
		getAuth0Config: vi.fn(() => ({
			jwksUri: 'https://test.auth0.com/.well-known/jwks.json',
			issuer: 'https://test.auth0.com/',
			audience: 'https://test-api',
		})),
	},
}));

import { __mockValidatorInstance } from '../../../infra/oauth2-validator';

describe('AuthMiddleware', () => {
	let mockContext: any;

	beforeEach(() => {
		mockContext = {
			log: vi.fn(),
		};
		
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authenticate', () => {
		it('should return authenticated context for valid token', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-token',
				}),
			} as HttpRequest;

			const authContext = {
				authenticated: true,
				permissions: ['read:products'],
				subject: 'auth0|123456',
			};

			__mockValidatorInstance.validate.mockResolvedValue(authContext);

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext).toEqual(authContext);
			expect(result.error).toBeUndefined();
			expect(mockContext.log).toHaveBeenCalledWith(
				'User auth0|123456 authenticated successfully'
			);
		});

		it('should return unauthorized error for invalid token', async () => {
			const mockRequest = {
				headers: new Headers(),
			} as HttpRequest;

			const authContext = {
				authenticated: false,
				permissions: [],
			};

			__mockValidatorInstance.validate.mockResolvedValue(authContext);

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext).toEqual(authContext);
			expect(result.error).toBeDefined();
			expect(result.error?.status).toBe(401);
			expect(mockContext.log).toHaveBeenCalledWith(
				'Authentication failed - no valid token provided'
			);
		});
	});

	describe('requirePermission', () => {
		it('should return null when permission is present', () => {
			const authContext = {
				authenticated: true,
				permissions: ['read:products', 'write:products'],
				subject: 'auth0|123456',
			};

			__mockValidatorInstance.hasPermission.mockReturnValue(true);

			const result = AuthMiddleware.requirePermission(
				authContext,
				'read:products',
				mockContext
			);

			expect(result).toBeNull();
		});

		it('should return forbidden error when permission is missing', () => {
			const authContext = {
				authenticated: true,
				permissions: ['read:products'],
				subject: 'auth0|123456',
			};

			__mockValidatorInstance.hasPermission.mockReturnValue(false);

			const result = AuthMiddleware.requirePermission(
				authContext,
				'delete:products',
				mockContext
			);

			expect(result).toBeDefined();
			expect(result?.status).toBe(403);
			expect(mockContext.log).toHaveBeenCalledWith(
				"User auth0|123456 lacks required permission: delete:products"
			);
		});
	});
});
