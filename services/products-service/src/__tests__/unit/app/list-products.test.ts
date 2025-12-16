// Unit tests for list-products use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	listProducts,
	type ListProductsDeps,
} from '../../../app/list-products';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';

describe('listProducts Use Case', () => {
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

	it('should return all products when availableOnly is false', async () => {
		const mockProducts: Product[] = [
			{
				id: 'prod-1',
				name: 'MacBook Pro',
				serialNumber: 'SN001',
				description: 'Laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			},
			{
				id: 'prod-2',
				name: 'iPhone',
				serialNumber: 'SN002',
				description: 'Phone',
				category: 'phone',
				status: 'on-loan',
				createdAt: new Date(),
			},
			{
				id: 'prod-3',
				name: 'iPad',
				serialNumber: 'SN003',
				description: 'Tablet',
				category: 'tablet',
				status: 'maintenance',
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.list).mockResolvedValue(mockProducts);

		const result = await listProducts({
			repo: mockRepo,
			availableOnly: false,
		});

		expect(result).toEqual(mockProducts);
		expect(mockRepo.list).toHaveBeenCalledWith(false);
		expect(result).toHaveLength(3);
	});

	it('should return only available products when availableOnly is true', async () => {
		const mockProducts: Product[] = [
			{
				id: 'prod-1',
				name: 'MacBook Pro',
				serialNumber: 'SN001',
				description: 'Laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.list).mockResolvedValue(mockProducts);

		const result = await listProducts({
			repo: mockRepo,
			availableOnly: true,
		});

		expect(result).toEqual(mockProducts);
		expect(mockRepo.list).toHaveBeenCalledWith(true);
	});

	it('should default to availableOnly false when not specified', async () => {
		vi.mocked(mockRepo.list).mockResolvedValue([]);

		await listProducts({ repo: mockRepo });

		expect(mockRepo.list).toHaveBeenCalledWith(false);
	});

	it('should return empty array when no products exist', async () => {
		vi.mocked(mockRepo.list).mockResolvedValue([]);

		const result = await listProducts({
			repo: mockRepo,
			availableOnly: false,
		});

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.list).mockRejectedValue(
			new Error('Database error')
		);

		await expect(
			listProducts({
				repo: mockRepo,
				availableOnly: false,
			})
		).rejects.toThrow('Database error');
	});
});
