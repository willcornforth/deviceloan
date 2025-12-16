// Unit tests for delete-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteProduct, type DeleteProductDeps } from '../../../app/delete-product';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';
import type { ProductEventPublisher } from '../../../infra/eventgrid-products-publisher';

describe('deleteProduct', () => {
	let mockRepo: ProductRepo;
	let mockPublisher: ProductEventPublisher;

	const existingProduct: Product = {
		id: 'test-123',
		name: 'MacBook Pro',
		serialNumber: 'SN123456',
		description: 'A powerful laptop',
		category: 'laptop',
		status: 'available',
		createdAt: new Date(),
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

	it('should delete an existing product and publish event', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(existingProduct);
		vi.mocked(mockRepo.delete).mockResolvedValue();

		const deps: DeleteProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'test-123',
		};

		const result = await deleteProduct(deps);

		expect(result.success).toBe(true);
		expect(mockRepo.delete).toHaveBeenCalledWith('test-123');
		expect(mockPublisher.publishProductDeleted).toHaveBeenCalledWith('test-123');
	});

	it('should return not-found when product does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const deps: DeleteProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'non-existent',
		};

		const result = await deleteProduct(deps);

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('not-found');
		}
		expect(mockRepo.delete).not.toHaveBeenCalled();
		expect(mockPublisher.publishProductDeleted).not.toHaveBeenCalled();
	});

	it('should not publish event if delete fails', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(existingProduct);
		vi.mocked(mockRepo.delete).mockRejectedValue(new Error('Database error'));

		const deps: DeleteProductDeps = {
			repo: mockRepo,
			publisher: mockPublisher,
			id: 'test-123',
		};

		await expect(deleteProduct(deps)).rejects.toThrow('Database error');
		expect(mockPublisher.publishProductDeleted).not.toHaveBeenCalled();
	});
});
