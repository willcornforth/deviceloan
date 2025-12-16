// Unit tests for update-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProduct, type UpdateProductDeps } from '../../../app/update-product';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';
import type { ProductEventPublisher } from '../../../infra/eventgrid-products-publisher';

describe('updateProduct', () => {
	let mockRepo: ProductRepo;
	let mockPublisher: ProductEventPublisher;

	const existingProduct: Product = {
		id: 'test-123',
		name: 'MacBook Pro',
		serialNumber: 'SN123456',
		description: 'A powerful laptop',
		category: 'laptop',
		status: 'available',
		createdAt: new Date('2024-01-01'),
	};

	beforeEach(() => {
		mockRepo = {
			create: vi.fn(),
			update: vi.fn(),
			updateWithEtag: vi.fn(),
			delete: vi.fn(),
			getById: vi.fn(),
			list: vi.fn(),
		};

		mockPublisher = {
			publishProductCreated: vi.fn(),
			publishProductUpdated: vi.fn(),
			publishProductDeleted: vi.fn(),
			publishProductReserved: vi.fn(),
			publishProductReleased: vi.fn(),
		} as any;
	});

	it('should update product name and publish event', async () => {
		const updatedProduct = { ...existingProduct, name: 'MacBook Pro 16"' };

		vi.mocked(mockRepo.getById).mockResolvedValue(existingProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedProduct);

		const deps: UpdateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'test-123',
			params: {
				name: 'MacBook Pro 16"',
			},
		};

		const result = await updateProduct(deps);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.name).toBe('MacBook Pro 16"');
			expect(mockRepo.update).toHaveBeenCalledOnce();
			expect(mockPublisher.publishProductUpdated).toHaveBeenCalledOnce();
		}
	});

	it('should return not-found when product does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const deps: UpdateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'non-existent',
			params: {
				name: 'New Name',
			},
		};

		const result = await updateProduct(deps);

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('not-found');
		}
		expect(mockRepo.update).not.toHaveBeenCalled();
		expect(mockPublisher.publishProductUpdated).not.toHaveBeenCalled();
	});

	it('should update multiple fields at once', async () => {
		const updatedProduct = {
			...existingProduct,
			name: 'MacBook Pro 16"',
			description: 'Updated description',
			status: 'maintenance' as const,
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(existingProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedProduct);

		const deps: UpdateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'test-123',
			params: {
				name: 'MacBook Pro 16"',
				description: 'Updated description',
				status: 'maintenance',
			},
		};

		const result = await updateProduct(deps);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.name).toBe('MacBook Pro 16"');
			expect(result.product.description).toBe('Updated description');
			expect(result.product.status).toBe('maintenance');
		}
	});

	it('should preserve unchanged fields', async () => {
		const updatedProduct = { ...existingProduct, name: 'New Name' };

		vi.mocked(mockRepo.getById).mockResolvedValue(existingProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedProduct);

		const deps: UpdateProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'test-123',
			params: {
				name: 'New Name',
			},
		};

		const result = await updateProduct(deps);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.serialNumber).toBe('SN123456'); // Preserved
			expect(result.product.category).toBe('laptop'); // Preserved
		}
	});
});
