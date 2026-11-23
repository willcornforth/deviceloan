// Unit tests for approveLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveLoan } from '../../../app/approveLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';
import type { LoanEventPublisher } from '../../../infra/eventgrid-loans-publisher';

describe('approveLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let mockEventPublisher: LoanEventPublisher;
	let approveLoanUseCase: ReturnType<typeof approveLoan>;

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

		mockEventPublisher = {
			publishLoanApproved: vi.fn(),
		} as any;

		approveLoanUseCase = approveLoan(mockRepo, mockEventPublisher);
	});

	it('should approve a pending loan', async () => {
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

		const approvedLoan: Loan = {
			...mockLoan,
			status: LoanStatus.Active,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(approvedLoan);

		const result = await approveLoanUseCase('loan-123');

		expect(result.success).toBe(true);
		expect(result.loan?.status).toBe(LoanStatus.Active);
		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: LoanStatus.Active,
			})
		);
	});

	it('should return error when loan not found', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await approveLoanUseCase('non-existent');

		expect(result.success).toBe(false);
		expect(result.error).toBe('Loan not found');
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

		const result = await approveLoanUseCase('loan-123');

		expect(result.success).toBe(false);
		expect(result.error).toContain('cannot be approved');
		expect(result.error).toContain('Active');
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

		const result = await approveLoanUseCase('loan-123');

		expect(result.success).toBe(false);
		expect(result.error).toContain('Returned');
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return error when loan is rejected', async () => {
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

		const result = await approveLoanUseCase('loan-123');

		expect(result.success).toBe(false);
		expect(result.error).toContain('Rejected');
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

		await expect(approveLoanUseCase('loan-123')).rejects.toThrow(
			'Database error'
		);
	});
});
