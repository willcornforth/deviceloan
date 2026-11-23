// Integration tests for authentication and authorization flow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthMiddleware } from '../../../app/auth-middleware';
import type { HttpRequest } from '@azure/functions';

// Mock the OAuth2Validator to simulate real authentication
vi.mock('../../../infra/oauth2-validator', () => {
	const mockValidate = async (request: HttpRequest) => {
		const token = request.headers.get('authorization')?.split(' ')[1];
		
		if (token === 'valid-admin-token') {
			return {
				authenticated: true,
				permissions: ['read:products', 'write:products', 'approve:loans'],
				subject: 'auth0|admin-user',
			};
		} else if (token === 'valid-user-token') {
			return {
				authenticated: true,
				permissions: ['read:products', 'request:loan'],
				subject: 'auth0|regular-user',
			};
		} else {
			return {
				authenticated: false,
				permissions: [],
			};
		}
	};

	const mockHasPermission = (authContext: any, permission: string) => {
		return authContext.authenticated && authContext.permissions.includes(permission);
	};

	return {
		OAuth2Validator: vi.fn(function() {
			return {
				validate: mockValidate,
				hasPermission: mockHasPermission,
			};
		}),
	};
});

vi.mock('../../../infra/service-config', () => ({
	ServiceConfig: {
		getAuth0Config: () => ({
			jwksUri: 'https://test.auth0.com/.well-known/jwks.json',
			issuer: 'https://test.auth0.com/',
			audience: 'https://test-api',
		}),
	},
}));

describe('Authentication and Authorization Flow Integration Tests', () => {
	let mockContext: any;

	beforeEach(() => {
		mockContext = {
			log: vi.fn(),
		};
	});

	describe('Admin user flow', () => {
		it('should authenticate admin user successfully', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-admin-token',
				}),
			} as HttpRequest;

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext.authenticated).toBe(true);
			expect(result.authContext.subject).toBe('auth0|admin-user');
			expect(result.authContext.permissions).toContain('approve:loans');
			expect(result.error).toBeUndefined();
		});

		it('should allow admin to access protected resources', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-admin-token',
				}),
			} as HttpRequest;

			const { authContext } = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			const permissionError = AuthMiddleware.requirePermission(
				authContext,
				'approve:loans',
				mockContext
			);

			expect(permissionError).toBeNull();
		});
	});

	describe('Regular user flow', () => {
		it('should authenticate regular user successfully', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-user-token',
				}),
			} as HttpRequest;

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext.authenticated).toBe(true);
			expect(result.authContext.subject).toBe('auth0|regular-user');
			expect(result.authContext.permissions).toContain('read:products');
			expect(result.error).toBeUndefined();
		});

		it('should deny regular user access to admin resources', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-user-token',
				}),
			} as HttpRequest;

			const { authContext } = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			const permissionError = AuthMiddleware.requirePermission(
				authContext,
				'approve:loans',
				mockContext
			);

			expect(permissionError).not.toBeNull();
			expect(permissionError?.status).toBe(403);
		});
	});

	describe('Unauthenticated user flow', () => {
		it('should reject request without token', async () => {
			const mockRequest = {
				headers: new Headers(),
			} as HttpRequest;

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext.authenticated).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.status).toBe(401);
		});

		it('should reject request with invalid token', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer invalid-token',
				}),
			} as HttpRequest;

			const result = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			expect(result.authContext.authenticated).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.status).toBe(401);
		});
	});

	describe('Permission-based access control', () => {
		it('should allow access with correct permission', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-user-token',
				}),
			} as HttpRequest;

			const { authContext } = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			const readPermission = AuthMiddleware.requirePermission(
				authContext,
				'read:products',
				mockContext
			);

			expect(readPermission).toBeNull();
		});

		it('should deny access without correct permission', async () => {
			const mockRequest = {
				headers: new Headers({
					authorization: 'Bearer valid-user-token',
				}),
			} as HttpRequest;

			const { authContext } = await AuthMiddleware.authenticate(
				mockRequest,
				mockContext
			);

			const writePermission = AuthMiddleware.requirePermission(
				authContext,
				'write:products',
				mockContext
			);

			expect(writePermission).not.toBeNull();
			expect(writePermission?.status).toBe(403);
		});
	});
});
