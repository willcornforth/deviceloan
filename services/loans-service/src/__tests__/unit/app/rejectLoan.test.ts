// Unit tests for rejectLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rejectLoan } from '../../../app/rejectLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('rejectLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let rejectLoanUseCase: ReturnType<typeof rejectLoan>;

	beforeEach(() => {
		mockRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			listByUserId: vi.fn(),
			listByProductId: vi.fn(),
			listByStatus: vi.fn(),
		};

		rejectLoanUseCase = rejectLoan(mockRepo);
	});

	it('should reject a pending approval loan', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.PendingApproval,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-01'),
		};

		const rejectedLoan: Loan = {
			...mockLoan,
			status: LoanStatus.Rejected,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(rejectedLoan);

		const result = await rejectLoanUseCase('loan-123');

		expect(result).not.toBeNull();
		expect(result).not.toHaveProperty('error');
		expect((result as Loan).status).toBe(LoanStatus.Rejected);
		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: LoanStatus.Rejected,
			})
		);
	});

	it('should return null when loan not found', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await rejectLoanUseCase('non-existent');

		expect(result).toBeNull();
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return error when loan is already active', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.Active,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-01'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);

		const result = await rejectLoanUseCase('loan-123');

		expect(result).toHaveProperty('error');
		expect((result as { error: string }).error).toBe(
			'Only pending approval loans can be rejected'
		);
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return error when loan is already returned', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.Returned,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			returnDate: new Date('2025-06-15'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-06-15'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);

		const result = await rejectLoanUseCase('loan-123');

		expect(result).toHaveProperty('error');
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return error when loan is already rejected', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.Rejected,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-01'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);

		const result = await rejectLoanUseCase('loan-123');

		expect(result).toHaveProperty('error');
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should handle repository errors', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.PendingApproval,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-01'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockRejectedValue(
			new Error('Database error')
		);

		await expect(rejectLoanUseCase('loan-123')).rejects.toThrow(
			'Database error'
		);
	});
});
