// Unit tests for listLoansByUserId use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listLoansByUserId } from '../../../app/listLoansByUserId';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('listLoansByUserId Use Case', () => {
	let mockRepo: LoanRepo;
	let listLoansByUserIdUseCase: ReturnType<typeof listLoansByUserId>;

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

		listLoansByUserIdUseCase = listLoansByUserId(mockRepo);
	});

	it('should retrieve all loans for a user', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-1',
				userId: 'user-123',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
			{
				id: 'loan-2',
				productId: 'prod-2',
				userId: 'user-123',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-15'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-15'),
				updatedAt: new Date('2025-01-15'),
			},
		];

		vi.mocked(mockRepo.listByUserId).mockResolvedValue(mockLoans);

		const result = await listLoansByUserIdUseCase('user-123');

		expect(result).toEqual(mockLoans);
		expect(result.length).toBe(2);
		expect(mockRepo.listByUserId).toHaveBeenCalledWith('user-123');
	});

	it('should return empty array when user has no loans', async () => {
		vi.mocked(mockRepo.listByUserId).mockResolvedValue([]);

		const result = await listLoansByUserIdUseCase('user-456');

		expect(result).toEqual([]);
		expect(result.length).toBe(0);
		expect(mockRepo.listByUserId).toHaveBeenCalledWith('user-456');
	});

	it('should retrieve loans with different statuses for same user', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-1',
				userId: 'user-123',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-06-30'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
			{
				id: 'loan-2',
				productId: 'prod-2',
				userId: 'user-123',
				status: LoanStatus.Returned,
				loanDate: new Date('2024-12-01'),
				dueDate: new Date('2025-01-31'),
				returnDate: new Date('2025-01-15'),
				createdAt: new Date('2024-12-01'),
				updatedAt: new Date('2025-01-15'),
			},
			{
				id: 'loan-3',
				productId: 'prod-3',
				userId: 'user-123',
				status: LoanStatus.Overdue,
				loanDate: new Date('2024-11-01'),
				dueDate: new Date('2024-12-31'),
				createdAt: new Date('2024-11-01'),
				updatedAt: new Date('2025-01-01'),
			},
		];

		vi.mocked(mockRepo.listByUserId).mockResolvedValue(mockLoans);

		const result = await listLoansByUserIdUseCase('user-123');

		expect(result.length).toBe(3);
		expect(result.some((l) => l.status === LoanStatus.Active)).toBe(true);
		expect(result.some((l) => l.status === LoanStatus.Returned)).toBe(true);
		expect(result.some((l) => l.status === LoanStatus.Overdue)).toBe(true);
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.listByUserId).mockRejectedValue(
			new Error('Database error')
		);

		await expect(listLoansByUserIdUseCase('user-123')).rejects.toThrow(
			'Database error'
		);
	});
});
