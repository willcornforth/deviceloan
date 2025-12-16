// Unit tests for create-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductUseCase, type CreateProductDeps } from '../../../app/create-product';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';
import type { ProductEventPublisher } from '../infra/eventgrid-products-publisher';

describe('createProductUseCase', () => {
	let mockRepo: ProductRepo;
	let mockPublisher: ProductEventPublisher;

	beforeEach(() => {
		mockRepo = {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			getById: vi.fn(),
			list: vi.fn(),
			listByStatus: vi.fn(),
			getBySerialNumber: vi.fn(),
		};

		mockPublisher = {
			publishProductCreated: vi.fn(),
			publishProductUpdated: vi.fn(),
			publishProductDeleted: vi.fn(),
			publishProductReserved: vi.fn(),
			publishProductReleased: vi.fn(),
		} as any;
	});

	it('should create a valid product and publish event', async () => {
		const productData: Product = {
			id: 'test-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123456',
			description: 'A powerful laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.create).mockResolvedValue(productData);

		const deps: CreateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			params: {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			},
		};

		const result = await createProductUseCase(deps);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.name).toBe('MacBook Pro');
			expect(mockRepo.create).toHaveBeenCalledOnce();
			expect(mockPublisher.publishProductCreated).toHaveBeenCalledOnce();
			expect(mockPublisher.publishProductCreated).toHaveBeenCalledWith(productData);
		}
	});

	it('should return validation errors for invalid product', async () => {
		const deps: CreateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			params: {
				id: 'test-123',
				name: '', // Invalid: empty name
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			},
		};

		const result = await createProductUseCase(deps);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].field).toBe('name');
		}
		expect(mockRepo.create).not.toHaveBeenCalled();
		expect(mockPublisher.publishProductCreated).not.toHaveBeenCalled();
	});

	it('should not publish event if repository create fails', async () => {
		vi.mocked(mockRepo.create).mockRejectedValue(new Error('Database error'));

		const deps: CreateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			params: {
				id: 'test-123',
				name: 'MacBook Pro',
				serialNumber: 'SN123456',
				description: 'A powerful laptop',
				category: 'laptop',
			},
		};

		await expect(createProductUseCase(deps)).rejects.toThrow('Database error');
		expect(mockPublisher.publishProductCreated).not.toHaveBeenCalled();
	});
});
