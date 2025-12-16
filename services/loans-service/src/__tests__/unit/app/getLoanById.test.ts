// Unit tests for getLoanById use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLoanById } from '../../../app/getLoanById';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('getLoanById Use Case', () => {
	let mockRepo: LoanRepo;
	let getLoanByIdUseCase: ReturnType<typeof getLoanById>;

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

		getLoanByIdUseCase = getLoanById(mockRepo);
	});

	it('should retrieve an existing loan by id', async () => {
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

		const result = await getLoanByIdUseCase('loan-123');

		expect(result).toEqual(mockLoan);
		expect(mockRepo.getById).toHaveBeenCalledWith('loan-123');
	});

	it('should return null when loan does not exist', async () => {
		vi.mocked(mockRepo.getById).mockResolvedValue(null);

		const result = await getLoanByIdUseCase('non-existent');

		expect(result).toBeNull();
		expect(mockRepo.getById).toHaveBeenCalledWith('non-existent');
	});

	it('should retrieve a pending approval loan', async () => {
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

		const result = await getLoanByIdUseCase('loan-123');

		expect(result).toEqual(mockLoan);
		expect(result!.status).toBe(LoanStatus.PendingApproval);
	});

	it('should retrieve a returned loan', async () => {
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

		const result = await getLoanByIdUseCase('loan-123');

		expect(result).toEqual(mockLoan);
		expect(result!.status).toBe(LoanStatus.Returned);
		expect(result!.returnDate).toBeDefined();
	});

	it('should handle repository errors', async () => {
		vi.mocked(mockRepo.getById).mockRejectedValue(
			new Error('Database error')
		);

		await expect(getLoanByIdUseCase('loan-123')).rejects.toThrow(
			'Database error'
		);
	});
});
