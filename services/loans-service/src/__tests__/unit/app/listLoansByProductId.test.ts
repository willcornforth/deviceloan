// Unit tests for listLoansByProductId use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listLoansByProductId } from '../../../app/listLoansByProductId';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('listLoansByProductId Use Case', () => {
	let mockRepo: LoanRepo;
	let listLoansByProductIdUseCase: ReturnType<typeof listLoansByProductId>;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			listByUserId: vi.fn(),
			listByProductId: vi.fn(),
			listPendingApproval: vi.fn(),
		};

		listLoansByProductIdUseCase = listLoansByProductId(mockRepo);
	});

	it('should retrieve all loans for a product', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-123',
				userId: 'user-1',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
			{
				id: 'loan-2',
				productId: 'prod-123',
				userId: 'user-2',
				status: LoanStatus.Returned,
				loanDate: new Date('2024-12-01'),
				dueDate: new Date('2025-01-31'),
				returnDate: new Date('2025-01-15'),
				createdAt: new Date('2024-12-01'),
				updatedAt: new Date('2025-01-15'),
			},
		];

		vi.mocked(mockRepo.listByProductId).mockResolvedValue(mockLoans);

		const result = await listLoansByProductIdUseCase('prod-123');

		expect(result).toEqual(mockLoans);
		expect(result.length).toBe(2);
		expect(mockRepo.listByProductId).toHaveBeenCalledWith('prod-123');
	});

	it('should return empty array when product has no loans', async () => {
		vi.mocked(mockRepo.listByProductId).mockResolvedValue([]);

		const result = await listLoansByProductIdUseCase('prod-456');

		expect(result).toEqual([]);
		expect(result.length).toBe(0);
		expect(mockRepo.listByProductId).toHaveBeenCalledWith('prod-456');
	});

	it('should retrieve loan history for a product', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-123',
				userId: 'user-1',
				status: LoanStatus.Returned,
				loanDate: new Date('2024-01-01'),
				dueDate: new Date('2024-06-30'),
				returnDate: new Date('2024-06-15'),
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-06-15'),
			},
			{
				id: 'loan-2',
				productId: 'prod-123',
				userId: 'user-2',
				status: LoanStatus.Returned,
				loanDate: new Date('2024-07-01'),
				dueDate: new Date('2024-12-31'),
				returnDate: new Date('2024-12-20'),
				createdAt: new Date('2024-07-01'),
				updatedAt: new Date('2024-12-20'),
			},
			{
				id: 'loan-3',
				productId: 'prod-123',
				userId: 'user-3',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
		];

		vi.mocked(mockRepo.listByProductId).mockResolvedValue(mockLoans);

		const result = await listLoansByProductIdUseCase('prod-123');

		expect(result.length).toBe(3);
		expect(result.filter((l) => l.status === LoanStatus.Returned).length).toBe(2);
		expect(result.filter((l) => l.status === LoanStatus.Active).length).toBe(1);
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.listByProductId).mockRejectedValue(
			new Error('Database error')
		);

		await expect(listLoansByProductIdUseCase('prod-123')).rejects.toThrow(
			'Database error'
		);
	});
});
