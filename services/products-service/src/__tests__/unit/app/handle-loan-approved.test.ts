// Unit tests for handle-loan-approved use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	handleLoanApproved,
	type HandleLoanApprovedDeps,
	type LoanApprovedEvent,
} from '../../../app/handle-loan-approved';
import type { ProductRepo } from '../../../domain/product-repo';
import type { Product } from '../../../domain/product';

describe('handleLoanApproved Use Case', () => {
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

	it('should successfully update product to on-loan status', async () => {
		const mockEvent: LoanApprovedEvent = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31',
		};

		const mockProduct: Product = {
			id: 'prod-789',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'reserved',
			reservedBy: 'user-456',
			reservedAt: new Date(),
			createdAt: new Date(),
		};

		const updatedProduct: Product = {
			...mockProduct,
			status: 'on-loan',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedProduct);

		const result = await handleLoanApproved({
			repo: mockRepo,
			event: mockEvent,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.productId).toBe('prod-789');
		}

		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'on-loan',
			})
		);
	});

	it('should return not-found when product does not exist', async () => {
		const mockEvent: LoanApprovedEvent = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'non-existent',
			dueDate: '2025-12-31',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await handleLoanApproved({
			repo: mockRepo,
			event: mockEvent,
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('product-not-found');
			if ('productId' in result) {
				expect(result.productId).toBe('non-existent');
			}
		}

		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return already-on-loan when product is already loaned out', async () => {
		const mockEvent: LoanApprovedEvent = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31',
		};

		const mockProduct: Product = {
			id: 'prod-789',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'on-loan',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);

		const result = await handleLoanApproved({
			repo: mockRepo,
			event: mockEvent,
		});

		expect(result.success).toBe(false);
		if (!result.success && 'reason' in result) {
			expect(result.reason).toBe('already-on-loan');
			if ('productId' in result) {
				expect(result.productId).toBe('prod-789');
			}
		}

		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should update product from available status', async () => {
		const mockEvent: LoanApprovedEvent = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31',
		};

		const mockProduct: Product = {
			id: 'prod-789',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'available',
			createdAt: new Date(),
		};

		const updatedProduct: Product = {
			...mockProduct,
			status: 'on-loan',
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedProduct);

		const result = await handleLoanApproved({
			repo: mockRepo,
			event: mockEvent,
		});

		expect(result.success).toBe(true);
		expect(mockRepo.update).toHaveBeenCalled();
	});

	it('should handle repository errors', async () => {
		const mockEvent: LoanApprovedEvent = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31',
		};

		const mockProduct: Product = {
			id: 'prod-789',
			name: 'MacBook Pro',
			serialNumber: 'SN123',
			description: 'Laptop',
			category: 'laptop',
			status: 'reserved',
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockProduct);
		vi.mocked(mockRepo.update).mockRejectedValue(
			new Error('Database error')
		);

		await expect(
			handleLoanApproved({
				repo: mockRepo,
				event: mockEvent,
			})
		).rejects.toThrow('Database error');
	});
});
