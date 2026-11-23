// Unit tests for Product domain model

import { describe, it, expect } from 'vitest';
import {
	createProduct,
	isProductAvailable,
	loanOutProduct,
	returnProduct,
	updateProductDescription,
	type Product,
	type ProductCategory,
} from '../../../domain/product';

describe('Product Domain', () => {
	describe('createProduct', () => {
		it('should create a valid product with all required fields', () => {
			const result = createProduct({
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.product.id).toBe('test-123');
				expect(result.product.name).toBe('MacBook Pro');
				expect(result.product.serialNumber).toBe('SN123456');
				expect(result.product.status).toBe('available');
				expect(result.product.createdAt).toBeInstanceOf(Date);
			}
		});

		it('should fail validation with empty name', () => {
			const result = createProduct({
				id: 'test-123',
				name: '',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			});

			expect(result.success).toBe(false);
			if (!result.success && 'errors' in result) {
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].field).toBe('name');
				expect(result.errors[0].message).toContain('required');
			}
		});

		it('should fail validation with empty serial number', () => {
			const result = createProduct({
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: '   ',
				description: 'A powerful laptop',
				category: 'laptop',
			});

			expect(result.success).toBe(false);
			if (!result.success && 'errors' in result) {
				expect(result.errors[0].field).toBe('serialNumber');
			}
		});

		it('should fail validation with empty description', () => {
			const result = createProduct({
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: '',
				category: 'laptop',
			});

			expect(result.success).toBe(false);
			if (!result.success && 'errors' in result) {
				expect(result.errors[0].field).toBe('description');
			}
		});

		it('should accept all valid product categories', () => {
			const categories: ProductCategory[] = [
				'laptop',
				'phone',
				'tablet',
				'monitor',
				'accessory',
			];

			categories.forEach((category) => {
				const result = createProduct({
					id: 'test-123',
					name: 'Test Product',
					serialNumber: 'SN123',
					description: 'Test description',
					category,
				});

				expect(result.success).toBe(true);
			});
		});

		it('should trim whitespace from string fields', () => {
			const result = createProduct({
				id: 'test-123',
				name: '  MacBook Pro  ',
				serialNumber: '  SN123456  ',
				description: '  A powerful laptop  ',
				category: 'laptop',
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.product.name).toBe('MacBook Pro');
				expect(result.product.serialNumber).toBe('SN123456');
				expect(result.product.description).toBe('A powerful laptop');
			}
		});

		it('should set default status to available if not provided', () => {
			const result = createProduct({
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.product.status).toBe('available');
			}
		});

		it('should accept custom status if provided', () => {
			const result = createProduct({
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'maintenance',
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.product.status).toBe('maintenance');
			}
		});
	});

	describe('isProductAvailable', () => {
		it('should return true for available product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			expect(isProductAvailable(product)).toBe(true);
		});

		it('should return false for reserved product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'reserved',
				createdAt: new Date(),
			};

			expect(isProductAvailable(product)).toBe(false);
		});

		it('should return false for on-loan product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'on-loan',
				createdAt: new Date(),
			};

			expect(isProductAvailable(product)).toBe(false);
		});
	});

	describe('loanOutProduct', () => {
		it('should change product status to on-loan', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const loanedOut = loanOutProduct(product);

			expect(loanedOut.status).toBe('on-loan');
			expect(loanedOut.id).toBe(product.id);
			expect(loanedOut.name).toBe(product.name);
		});

		it('should not mutate original product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			loanOutProduct(product);

			expect(product.status).toBe('available'); // Original unchanged
		});
	});

	describe('returnProduct', () => {
		it('should change product status to available', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'on-loan',
				createdAt: new Date(),
			};

			const returned = returnProduct(product);

			expect(returned.status).toBe('available');
			expect(returned.id).toBe(product.id);
		});

		it('should not mutate original product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'on-loan',
				createdAt: new Date(),
			};

			returnProduct(product);

			expect(product.status).toBe('on-loan'); // Original unchanged
		});
	});

	describe('updateProductDescription', () => {
		it('should update product description', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'Old description',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const updated = updateProductDescription(product, 'New description');

			expect(updated.description).toBe('New description');
			expect(updated.id).toBe(product.id);
			expect(updated.name).toBe(product.name);
		});

		it('should trim whitespace from new description', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'Old description',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const updated = updateProductDescription(product, '  New description  ');

			expect(updated.description).toBe('New description');
		});

		it('should not mutate original product', () => {
			const product: Product = {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'Old description',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			updateProductDescription(product, 'New description');

			expect(product.description).toBe('Old description'); // Original unchanged
		});
	});
});
