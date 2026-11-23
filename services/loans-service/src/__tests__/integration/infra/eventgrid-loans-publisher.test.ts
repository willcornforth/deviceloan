// Integration tests for LoanEventPublisher
// These tests verify event publishing to Event Grid

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoanEventPublisher } from '../../../infra/eventgrid-loans-publisher';

describe('LoanEventPublisher Integration Tests', () => {
	let publisher: LoanEventPublisher;
	let mockClient: any;

	beforeEach(() => {
		mockClient = {
			send: vi.fn().mockResolvedValue(undefined),
		};
		publisher = new LoanEventPublisher(mockClient);
	});

	it('should publish Loan.Approved event', async () => {
		const loan = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31T00:00:00.000Z',
		};

		await publisher.publishLoanApproved(loan);

		expect(mockClient.send).toHaveBeenCalledWith([
			expect.objectContaining({
				eventType: 'Loan.Approved',
				subject: `loans/${loan.id}`,
				dataVersion: '1.0',
				data: {
					id: loan.id,
					userId: loan.userId,
					productId: loan.productId,
					dueDate: loan.dueDate,
				},
			}),
		]);
	});

	it('should publish Loan.Returned event', async () => {
		const loan = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31T00:00:00.000Z',
		};

		await publisher.publishLoanReturned(loan);

		expect(mockClient.send).toHaveBeenCalledWith([
			expect.objectContaining({
				eventType: 'Loan.Returned',
				subject: `loans/${loan.id}`,
				dataVersion: '1.0',
				data: {
					id: loan.id,
					userId: loan.userId,
					productId: loan.productId,
					dueDate: loan.dueDate,
				},
			}),
		]);
	});

	it('should publish Loan.CreationFailed event', async () => {
		const data = {
			productId: 'prod-789',
			userId: 'user-456',
			reason: 'Product not available',
		};

		await publisher.publishLoanCreationFailed(data);

		expect(mockClient.send).toHaveBeenCalledWith([
			expect.objectContaining({
				eventType: 'Loan.CreationFailed',
				subject: `loans/failed/${data.productId}`,
				dataVersion: '1.0',
				data: {
					productId: data.productId,
					userId: data.userId,
					reason: data.reason,
				},
			}),
		]);
	});

	it('should log event publishing with context', async () => {
		const mockContext = {
			log: vi.fn(),
		};

		const loan = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31T00:00:00.000Z',
		};

		await publisher.publishLoanApproved(loan, mockContext as any);

		expect(mockContext.log).toHaveBeenCalledWith(
			`Publishing Loan.Approved event for loan ID: ${loan.id}`
		);
		expect(mockClient.send).toHaveBeenCalled();
	});

	it('should handle Event Grid errors', async () => {
		mockClient.send.mockRejectedValue(new Error('Event Grid error'));

		const loan = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31T00:00:00.000Z',
		};

		await expect(publisher.publishLoanApproved(loan)).rejects.toThrow(
			'Event Grid error'
		);
	});

	it('should include correct event schema for Loan.Approved', async () => {
		const loan = {
			id: 'loan-123',
			userId: 'user-456',
			productId: 'prod-789',
			dueDate: '2025-12-31T00:00:00.000Z',
		};

		await publisher.publishLoanApproved(loan);

		const sentEvent = mockClient.send.mock.calls[0][0][0];
		expect(sentEvent).toHaveProperty('eventType');
		expect(sentEvent).toHaveProperty('subject');
		expect(sentEvent).toHaveProperty('dataVersion');
		expect(sentEvent).toHaveProperty('data');
		expect(sentEvent.dataVersion).toBe('1.0');
	});
});
