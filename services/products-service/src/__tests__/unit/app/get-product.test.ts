// Unit tests for get-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProduct, type GetProductDeps } from '../../../app/get-product';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';

describe('getProduct Use Case', () => {
	let mockRepo: ProductRepo;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateWithEtag: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		};
	});

	it('should return product when found', async () => {
		const mockProduct: Product = {
			id: 'test-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'A laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await getProduct({
			repo: mockRepo,
			id: 'test-123',
		});

		expect(result).toEqual(mockProduct);
		expect(mockRepo.getById).toHaveBeenCalledWith('test-123');
		expect(mockRepo.getById).toHaveBeenCalledTimes(1);
	});

	it('should return null when product not found', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await getProduct({
			repo: mockRepo,
			id: 'non-existent',
		});

		expect(result).toBeNull();
		expect(mockRepo.getById).toHaveBeenCalledWith('non-existent');
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.getById).mockRejectedValue(
			new Error('Database error')
		);

		await expect(
			getProduct({
				repo: mockRepo,
				id: 'test-123',
			})
		).rejects.toThrow('Database error');
	});
});
