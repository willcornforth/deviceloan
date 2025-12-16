// Unit tests for returnLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { returnLoan } from '../../../app/returnLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('returnLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let returnLoanUseCase: ReturnType<typeof returnLoan>;

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

		returnLoanUseCase = returnLoan(mockRepo);
	});

	it('should return a loan successfully', async () => {
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

		const returnedLoan: Loan = {
			...mockLoan,
			status: LoanStatus.Returned,
			returnDate: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(returnedLoan);

		const result = await returnLoanUseCase('loan-123');

		expect(result).not.toBeNull();
		expect(result!.status).toBe(LoanStatus.Returned);
		expect(result!.returnDate).toBeDefined();
		expect(mockRepo.update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: LoanStatus.Returned,
				returnDate: expect.any(Date),
			})
		);
	});

	it('should return null when loan not found', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await returnLoanUseCase('non-existent');

		expect(result).toBeNull();
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it('should return overdue loan', async () => {
		const mockLoan: Loan = {
			id: 'loan-123',
			productId: 'prod-456',
			userId: 'user-789',
			status: LoanStatus.Overdue,
			loanDate: new Date('2025-01-01'),
			dueDate: new Date('2025-06-30'),
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-07-01'),
		};

		const returnedLoan: Loan = {
			...mockLoan,
			status: LoanStatus.Returned,
			returnDate: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(returnedLoan);

		const result = await returnLoanUseCase('loan-123');

		expect(result).not.toBeNull();
		expect(result!.status).toBe(LoanStatus.Returned);
		expect(result!.returnDate).toBeDefined();
	});

	it('should be idempotent - can return already returned loan', async () => {
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

		const returnedLoan: Loan = {
			...mockLoan,
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockResolvedValue(returnedLoan);

		const result = await returnLoanUseCase('loan-123');

		expect(result).not.toBeNull();
		expect(result!.status).toBe(LoanStatus.Returned);
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

		vi.mocked(mockRepo.getById).mockResolvedValue(mockLoan);
		vi.mocked(mockRepo.update).mockRejectedValue(
			new Error('Database error')
		);

		await expect(returnLoanUseCase('loan-123')).rejects.toThrow(
			'Database error'
		);
	});
});
