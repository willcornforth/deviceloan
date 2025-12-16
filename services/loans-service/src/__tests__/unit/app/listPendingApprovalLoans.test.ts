// Unit tests for listPendingApprovalLoans use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listPendingApprovalLoans } from '../../../app/listPendingApprovalLoans';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('listPendingApprovalLoans Use Case', () => {
	let mockRepo: LoanRepo;
	let listPendingApprovalLoansUseCase: ReturnType<
		typeof listPendingApprovalLoans
	>;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			listByUserId: vi.fn(),
			listByProductId: vi.fn(),
			listByStatus: vi.fn(),
			listPendingApproval: vi.fn(),
		};

		listPendingApprovalLoansUseCase = listPendingApprovalLoans(mockRepo);
	});

	it('should retrieve all pending approval loans', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-1',
				userId: 'user-1',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
			{
				id: 'loan-2',
				productId: 'prod-2',
				userId: 'user-2',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-15'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-15'),
				updatedAt: new Date('2025-01-15'),
			},
		];

		vi.mocked(mockRepo.listPendingApproval).mockResolvedValue(mockLoans);

		const result = await listPendingApprovalLoansUseCase();

		expect(result).toEqual(mockLoans);
		expect(result.length).toBe(2);
		expect(result.every((l) => l.status === LoanStatus.PendingApproval)).toBe(
			true
		);
		expect(mockRepo.listPendingApproval).toHaveBeenCalled();
	});

	it('should return empty array when no pending approvals', async () => {
		vi.mocked(mockRepo.listPendingApproval).mockResolvedValue([]);

		const result = await listPendingApprovalLoansUseCase();

		expect(result).toEqual([]);
		expect(result.length).toBe(0);
		expect(mockRepo.listPendingApproval).toHaveBeenCalled();
	});

	it('should only return loans with pending status', async () => {
		const mockLoans: Loan[] = [
			{
				id: 'loan-1',
				productId: 'prod-1',
				userId: 'user-1',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			},
			{
				id: 'loan-2',
				productId: 'prod-2',
				userId: 'user-2',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-05'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-05'),
				updatedAt: new Date('2025-01-05'),
			},
			{
				id: 'loan-3',
				productId: 'prod-3',
				userId: 'user-3',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-10'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-10'),
				updatedAt: new Date('2025-01-10'),
			},
		];

		vi.mocked(mockRepo.listPendingApproval).mockResolvedValue(mockLoans);

		const result = await listPendingApprovalLoansUseCase();

		expect(result.length).toBe(3);
		expect(result.every((l) => l.status === LoanStatus.PendingApproval)).toBe(
			true
		);
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.listPendingApproval).mockRejectedValue(
			new Error('Database error')
		);

		await expect(listPendingApprovalLoansUseCase()).rejects.toThrow(
			'Database error'
		);
	});
});
