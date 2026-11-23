// Unit tests for updateLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLoan } from '../../../app/updateLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan, UpdateLoanRequest } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('updateLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let updateLoanUseCase: ReturnType<typeof updateLoan>;

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

		updateLoanUseCase = updateLoan(mockRepo);
	});

	it('should update loan due date', async () => {
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

		const updates: UpdateLoanRequest = {
			dueDate: new Date('2025-06-30'),
		};

		const updatedLoan: Loan = {
			...mockLoan,
			dueDate: updates.dueDate!,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedLoan);

		const result = await updateLoanUseCase('loan-123', updates);

		expect(result).toEqual(updatedLoan);
		expect(result!.dueDate).toEqual(updates.dueDate);
		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				dueDate: updates.dueDate,
				updatedAt: expect.any(Date),
			})
		);
	});

	it('should return null when loan does not exist', async () => {
		const updates: UpdateLoanRequest = {
			dueDate: new Date('2025-06-30'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await updateLoanUseCase('non-existent', updates);

		expect(result).toBeNull();
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should update loan status', async () => {
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

		const updates: UpdateLoanRequest = {
			status: LoanStatus.Overdue,
		};

		const updatedLoan: Loan = {
			...mockLoan,
			status: LoanStatus.Overdue,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedLoan);

		const result = await updateLoanUseCase('loan-123', updates);

		expect(result).toEqual(updatedLoan);
		expect(result!.status).toBe(LoanStatus.Overdue);
	});

	it('should update multiple fields', async () => {
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

		const updates: UpdateLoanRequest = {
			dueDate: new Date('2025-06-30'),
			status: LoanStatus.Overdue,
		};

		const updatedLoan: Loan = {
			...mockLoan,
			dueDate: updates.dueDate!,
			status: updates.status!,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedLoan);

		const result = await updateLoanUseCase('loan-123', updates);

		expect(result).toEqual(updatedLoan);
		expect(result!.dueDate).toEqual(updates.dueDate);
		expect(result!.status).toBe(updates.status);
	});

	it('should handle empty updates', async () => {
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

		const updates: UpdateLoanRequest = {};

		const updatedLoan: Loan = {
			...mockLoan,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(updatedLoan);

		const result = await updateLoanUseCase('loan-123', updates);

		expect(result).toBeDefined();
		expect(mockRepo.update).toHaveBeenCalled();
	});

	it('should handle repository errors', async () => {
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

		const updates: UpdateLoanRequest = {
			dueDate: new Date('2025-06-30'),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockRejectedValue(
			new Error('Database error')
		);

		await expect(updateLoanUseCase('loan-123', updates)).rejects.toThrow(
			'Database error'
		);
	});
});
