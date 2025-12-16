// Unit tests for reserve-product use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	reserveProduct,
	type ReserveProductDeps,
} from '../../../app/reserve-product';
import type { ProductRepo, ConcurrencyError } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';
import type { ProductEventPublisher } from '../../../infra/eventgrid-products-publisher';

describe('reserveProduct Use Case', () => {
	let mockRepo: ProductRepo;
	let mockEventPublisher: ProductEventPublisher;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateWithEtag: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		};

		mockEventPublisher = {
			publishProductReserved: vi.fn(),
		} as any;
	});

	it('should successfully reserve an available product', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
			_etag: 'etag-123',
		};

		const reservedProduct: Product = {
			...mockProduct,
			status: 'reserved',
			reservedBy: 'user-456',
			reservedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.updateWithEtag).mockResolvedValue(reservedProduct);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
			eventPublisher: mockEventPublisher,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.product.status).toBe('reserved');
			expect(result.product.reservedBy).toBe('user-456');
		}

		expect(mockRepo.updateWithEtag).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'reserved',
				reservedBy: 'user-456',
			}),
			'etag-123'
		);

		expect(mockEventPublisher.publishProductReserved).toHaveBeenCalledWith(
			expect.objectContaining({
				productId: 'prod-123',
				reservedBy: 'user-456',
				returnDate: '2025-12-31',
			})
		);
	});

	it('should return not-found when product does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'non-existent',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('not-found');
			if ('productId' in result) {
				expect(result.productId).toBe('non-existent');
			}
		}

		expect(mockRepo.updateWithEtag).not.toHaveBeenCalled();
	});

	it('should return not-available when product is already on loan', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'on-loan',
			createdAt: new Date(),
			_etag: 'etag-123',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('not-available');
			if ('currentStatus' in result) {
				expect(result.currentStatus).toBe('on-loan');
			}
		}

		expect(mockRepo.updateWithEtag).not.toHaveBeenCalled();
	});

	it('should return not-available when product is in maintenance', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'maintenance',
			createdAt: new Date(),
			_etag: 'etag-123',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('not-available');
			if ('currentStatus' in result) {
				expect(result.currentStatus).toBe('maintenance');
			}
		}
	});

	it('should handle concurrency conflict', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
			_etag: 'etag-123',
		};

		const concurrencyError: ConcurrencyError = {
			type: 'concurrency-error',
			message: 'ETag mismatch',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.updateWithEtag).mockResolvedValue(
			concurrencyError
		);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('concurrency-conflict');
			if ('message' in result) {
				expect(result.message).toBe('ETag mismatch');
			}
		}
	});

	it('should throw error when product is missing _etag', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
			// Missing _etag
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		await expect(
			reserveProduct({
				repo: mockRepo,
				productId: 'prod-123',
				params: {
					userId: 'user-456',
					returnDate: '2025-12-31',
				},
			})
		).rejects.toThrow('Product is missing _etag for concurrency control');
	});

	it('should work without event publisher', async () => {
		const mockProduct: Product = {
			id: 'prod-123',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
			_etag: 'etag-123',
		};

		const reservedProduct: Product = {
			...mockProduct,
			status: 'reserved',
			reservedBy: 'user-456',
			reservedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.updateWithEtag).mockResolvedValue(reservedProduct);

		const result = await reserveProduct({
			repo: mockRepo,
			productId: 'prod-123',
			params: {
				userId: 'user-456',
				returnDate: '2025-12-31',
			},
			// No eventPublisher
		});

		expect(result.success).toBe(true);
	});
});
