// Unit tests for createLoan use case

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLoan } from '../../../app/createLoan';
import type { LoanRepo } from '../../../domain/loan-repo';
import type { Loan, CreateLoanRequest } from '../../../domain/loan';
import { LoanStatus } from '../../../domain/loan';

describe('createLoan Use Case', () => {
	let mockRepo: LoanRepo;
	let createLoanUseCase: ReturnType<typeof createLoan>;

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

		createLoanUseCase = createLoan(mockRepo);
	});

	it('should create a new loan with pending approval status', async () => {
		const request: CreateLoanRequest = {
			productId: 'prod-123',
			userId: 'user-456',
			dueDate: new Date('2025-12-31'),
		};

		const mockCreatedLoan: Loan = {
			id: 'loan-789',
			productId: 'prod-123',
			userId: 'user-456',
			status: LoanStatus.PendingApproval,
			loanDate: new Date(),
			dueDate: new Date('2025-12-31'),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(mockRepo.create).mockResolvedValue(mockCreatedLoan);

		const result = await createLoanUseCase(request);

		expect(result).toEqual(mockCreatedLoan);
		expect(mockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.PendingApproval,
			})
		);
		expect(mockRepo.create).toHaveBeenCalledTimes(1);
	});

	it('should generate unique loan ID', async () => {
		const request: CreateLoanRequest = {
			productId: 'prod-123',
			userId: 'user-456',
			dueDate: new Date('2025-12-31'),
		};

		vi.mocked(mockRepo.create).mockImplementation(async (loan) => loan);

		await createLoanUseCase(request);

		const createCall = vi.mocked(mockRepo.create).mock.calls[0][0];
		expect(createCall.id).toBeDefined();
		expect(typeof createCall.id).toBe('string');
		expect(createCall.id.length).toBeGreaterThan(0);
	});

	it('should set loan date to current time', async () => {
		const request: CreateLoanRequest = {
			productId: 'prod-123',
			userId: 'user-456',
			dueDate: new Date('2025-12-31'),
		};

		const beforeCreate = new Date();
		vi.mocked(mockRepo.create).mockImplementation(async (loan) => loan);

		await createLoanUseCase(request);
		const afterCreate = new Date();

		const createCall = vi.mocked(mockRepo.create).mock.calls[0][0];
		expect(createCall.loanDate.getTime()).toBeGreaterThanOrEqual(
			beforeCreate.getTime()
		);
		expect(createCall.loanDate.getTime()).toBeLessThanOrEqual(
			afterCreate.getTime()
		);
	});

	it('should handle repository errors', async () => {
		const request: CreateLoanRequest = {
			productId: 'prod-123',
			userId: 'user-456',
			dueDate: new Date('2025-12-31'),
		};

		vi.mocked(mockRepo.create).mockRejectedValue(
			new Error('Database error')
		);

		await expect(createLoanUseCase(request)).rejects.toThrow(
			'Database error'
		);
	});
});
