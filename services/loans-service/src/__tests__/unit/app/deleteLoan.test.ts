// Unit tests for deleteLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteLoan } from '../../../app/deleteLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('deleteLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let deleteLoanUseCase: ReturnType<typeof deleteLoan>;

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

		deleteLoanUseCase = deleteLoan(mockRepo);
	});

	it('should delete an existing loan successfully', async () => {
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
		vi.mocked(mockRepo.delete).mockResolvedValue();

		const result = await deleteLoanUseCase('loan-123');

		expect(result).toBe(true);
		expect(mockRepo.getById).toHaveBeenCalledWith('loan-123');
		expect(mockRepo.delete).toHaveBeenCalledWith('loan-123');
	});

	it('should return false when loan does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await deleteLoanUseCase('non-existent');

		expect(result).toBe(false);
		expect(mockRepo.getById).toHaveBeenCalledWith('non-existent');
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	it('should handle repository getById errors', async () => {
		vi.mocked(mockRepo.getById).mockRejectedValue(
			new Error('Database error')
		);

		await expect(deleteLoanUseCase('loan-123')).rejects.toThrow(
			'Database error'
		);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	it('should handle repository delete errors', async () => {
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
		vi.mocked(mockRepo.delete).mockRejectedValue(
			new Error('Delete failed')
		);

		await expect(deleteLoanUseCase('loan-123')).rejects.toThrow(
			'Delete failed'
		);
	});
});
