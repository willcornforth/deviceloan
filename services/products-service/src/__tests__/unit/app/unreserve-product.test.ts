// Unit tests for unreserve-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	unreserveProduct,
	type UnreserveProductDeps,
} from '../../../app/unreserve-product';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';

describe('unreserveProduct Use Case', () => {
	let mockRepo: ProductRepo;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
			getBySerialNumber: vi.fn(),
			updateWithEtag: vi.fn(),
		};
	});

	it('should successfully unreserve a reserved product', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'reserved',
			reservedBy: 'user-456',
			reservedAt: new Date(),
			createdAt: new Date(),
		};

		const unreservedProduct: Product = {
			...mockProduct,
			status: 'available',
			reservedBy: undefined,
			reservedAt: undefined,
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(unreservedProduct);

		const result = await unreserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.status).toBe('available');
			expect(result.product.reservedBy).toBeUndefined();
			expect(result.product.reservedAt).toBeUndefined();
			expect(result.wasReserved).toBe(true);
		}

		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'available',
				reservedBy: undefined,
				reservedAt: undefined,
			})
		);
	});

	it('should return not-found when product does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await unreserveProduct({
			repo: mockRepo,
			productId: 'non-existent',
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.reason).toBe('not-found');
			expect(result.productId).toBe('non-existent');
		}

		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should be idempotent when product is already available', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await unreserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.wasReserved).toBe(false);
			expect(result.product.status).toBe('available');
		}

		// Should not call update since already available
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should be idempotent when product is on loan', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'on-loan',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await unreserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.wasReserved).toBe(false);
			expect(result.product.status).toBe('on-loan');
		}

		// Should not update product in other state
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should be idempotent when product is in maintenance', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'maintenance',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await unreserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.wasReserved).toBe(false);
			expect(result.product.status).toBe('maintenance');
		}

		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should handle repository errors on update', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'reserved',
			reservedBy: 'user-456',
			reservedAt: new Date(),
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.update).mockRejectedValue(
			new Error('Database error')
		);

		await expect(
			unreserveProduct({
				repo: mockRepo,
				productId: 'prod-123',
			})
		).rejects.toThrow('Database error');
	});
});
