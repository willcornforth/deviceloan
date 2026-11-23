// Unit tests for Loan domain model

import { describe, it, expect, beforeEach } from 'vitest';
import {
	createLoan,
	returnLoan,
	updateLoan,
	rejectLoan,
	LoanStatus,
	type Loan,
	type CreateLoanRequest,
} from '../../../domain/loan';

describe('Loan Domain', () => {
	describe('createLoan', () => {
		it('should create a loan with pending approval status', () => {
			const request: CreateLoanRequest = {
				productId: 'prod-123',
				userId: 'user-456',
				dueDate: new Date('2025-12-31'),
			};

			const loan = createLoan(request);

			expect(loan.id).toBeDefined();
			expect(loan.productId).toBe('prod-123');
			expect(loan.userId).toBe('user-456');
			expect(loan.status).toBe(LoanStatus.PendingApproval);
			expect(loan.dueDate).toEqual(new Date('2025-12-31'));
			expect(loan.returnDate).toBeUndefined();
			expect(loan.createdAt).toBeInstanceOf(Date);
			expect(loan.updatedAt).toBeInstanceOf(Date);
		});

		it('should generate unique IDs for different loans', () => {
			const request: CreateLoanRequest = {
				productId: 'prod-123',
				userId: 'user-456',
				dueDate: new Date('2025-12-31'),
			};

			const loan1 = createLoan(request);
			const loan2 = createLoan(request);

			expect(loan1.id).not.toBe(loan2.id);
		});

		it('should set loanDate to current time', () => {
			const beforeCreate = new Date();
			const request: CreateLoanRequest = {
				productId: 'prod-123',
				userId: 'user-456',
				dueDate: new Date('2025-12-31'),
			};

			const loan = createLoan(request);
			const afterCreate = new Date();

			expect(loan.loanDate.getTime()).toBeGreaterThanOrEqual(
				beforeCreate.getTime()
			);
			expect(loan.loanDate.getTime()).toBeLessThanOrEqual(
				afterCreate.getTime()
			);
		});
	});

	describe('returnLoan', () => {
		it('should mark loan as returned with return date', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const beforeReturn = new Date();
			const returnedLoan = returnLoan(originalLoan);
			const afterReturn = new Date();

			expect(returnedLoan.status).toBe(LoanStatus.Returned);
			expect(returnedLoan.returnDate).toBeDefined();
			expect(returnedLoan.returnDate!.getTime()).toBeGreaterThanOrEqual(
				beforeReturn.getTime()
			);
			expect(returnedLoan.returnDate!.getTime()).toBeLessThanOrEqual(
				afterReturn.getTime()
			);
			expect(returnedLoan.updatedAt.getTime()).toBeGreaterThan(
				originalLoan.updatedAt.getTime()
			);
		});

		it('should preserve all other loan properties', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const returnedLoan = returnLoan(originalLoan);

			expect(returnedLoan.id).toBe(originalLoan.id);
			expect(returnedLoan.productId).toBe(originalLoan.productId);
			expect(returnedLoan.userId).toBe(originalLoan.userId);
			expect(returnedLoan.loanDate).toBe(originalLoan.loanDate);
			expect(returnedLoan.dueDate).toBe(originalLoan.dueDate);
			expect(returnedLoan.createdAt).toBe(originalLoan.createdAt);
		});
	});

	describe('updateLoan', () => {
		it('should update status', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const updatedLoan = updateLoan(originalLoan, {
				status: LoanStatus.Active,
			});

			expect(updatedLoan.status).toBe(LoanStatus.Active);
			expect(updatedLoan.updatedAt.getTime()).toBeGreaterThan(
				originalLoan.updatedAt.getTime()
			);
		});

		it('should update due date', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const newDueDate = new Date('2026-01-15');
			const updatedLoan = updateLoan(originalLoan, {
				dueDate: newDueDate,
			});

			expect(updatedLoan.dueDate).toEqual(newDueDate);
		});

		it('should update return date', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const returnDate = new Date('2025-06-15');
			const updatedLoan = updateLoan(originalLoan, { returnDate });

			expect(updatedLoan.returnDate).toEqual(returnDate);
		});

		it('should update multiple fields at once', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const newDueDate = new Date('2026-01-15');
			const returnDate = new Date('2025-06-15');
			const updatedLoan = updateLoan(originalLoan, {
				status: LoanStatus.Returned,
				dueDate: newDueDate,
				returnDate,
			});

			expect(updatedLoan.status).toBe(LoanStatus.Returned);
			expect(updatedLoan.dueDate).toEqual(newDueDate);
			expect(updatedLoan.returnDate).toEqual(returnDate);
		});

		it('should not mutate original loan', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const originalStatus = originalLoan.status;
			const originalUpdatedAt = originalLoan.updatedAt;

			updateLoan(originalLoan, { status: LoanStatus.Returned });

			expect(originalLoan.status).toBe(originalStatus);
			expect(originalLoan.updatedAt).toBe(originalUpdatedAt);
		});
	});

	describe('rejectLoan', () => {
		it('should mark loan as rejected', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const rejectedLoan = rejectLoan(originalLoan);

			expect(rejectedLoan.status).toBe(LoanStatus.Rejected);
			expect(rejectedLoan.updatedAt.getTime()).toBeGreaterThan(
				originalLoan.updatedAt.getTime()
			);
		});

		it('should preserve all other loan properties', () => {
			const originalLoan: Loan = {
				id: 'loan-123',
				productId: 'prod-456',
				userId: 'user-789',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const rejectedLoan = rejectLoan(originalLoan);

			expect(rejectedLoan.id).toBe(originalLoan.id);
			expect(rejectedLoan.productId).toBe(originalLoan.productId);
			expect(rejectedLoan.userId).toBe(originalLoan.userId);
			expect(rejectedLoan.loanDate).toBe(originalLoan.loanDate);
			expect(rejectedLoan.dueDate).toBe(originalLoan.dueDate);
			expect(rejectedLoan.createdAt).toBe(originalLoan.createdAt);
		});
	});
});
