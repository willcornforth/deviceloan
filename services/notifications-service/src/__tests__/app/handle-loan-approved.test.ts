import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLoanApproved } from '../../app/handle-loan-approved';
import { NotificationRepo, Notification } from '../../domain/notification';
import { EmailSender } from '../../domain/email-sender';
import { LoanEventData } from '../../domain/events';

describe('handleLoanApproved', () => {
	let mockRepo: NotificationRepo;
	let mockEmailSender: EmailSender;

	beforeEach(() => {
		mockRepo = {
			savePreference: vi.fn(),
			deletePreference: vi.fn(),
			getPreferencesByProduct: vi.fn(),
			getPreferencesByUser: vi.fn(),
			saveNotification: vi.fn(),
			getNotificationsByUser: vi.fn(),
			updateNotificationStatus: vi.fn(),
		};

		mockEmailSender = {
			send: vi.fn(),
		};
	});

	it('should create and send notification for approved loan', async () => {
		const event: LoanEventData = {
			id: 'loan-123',
			userId: 'user@example.com',
			productId: 'product-456',
			dueDate: '2025-12-31',
		};

		const savedNotification: Notification = {
			id: 'notif-123',
			userId: event.userId,
			type: 'email',
			subject: `Loan Approved: ${event.id}`,
			message: `Your loan for "Loan ${event.id}" has been approved! Please return it by ${event.dueDate}.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanApproved(event, mockRepo, mockEmailSender);

		expect(mockRepo.saveNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: event.userId,
				type: 'email',
				subject: `Loan Approved: ${event.id}`,
				status: 'pending',
				productId: event.productId,
				loanId: event.id,
			})
		);

		expect(mockEmailSender.send).toHaveBeenCalledWith(
			event.userId,
			expect.stringContaining('Loan Approved'),
			expect.stringContaining(event.dueDate)
		);

		expect(mockRepo.updateNotificationStatus).toHaveBeenCalledWith(
			savedNotification.id,
			'sent',
			expect.any(Date)
		);
	});

	it('should mark notification as failed when email sending fails', async () => {
		const event: LoanEventData = {
			id: 'loan-123',
			userId: 'user@example.com',
			productId: 'product-456',
			dueDate: '2025-12-31',
		};

		const savedNotification: Notification = {
			id: 'notif-123',
			userId: event.userId,
			type: 'email',
			subject: `Loan Approved: ${event.id}`,
			message: `Your loan for "Loan ${event.id}" has been approved! Please return it by ${event.dueDate}.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockRejectedValue(
			new Error('Email service unavailable')
		);
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanApproved(event, mockRepo, mockEmailSender);

		expect(mockRepo.updateNotificationStatus).toHaveBeenCalledWith(
			savedNotification.id,
			'failed',
			undefined,
			'Email service unavailable'
		);
	});

	it('should include loan and product IDs in notification', async () => {
		const event: LoanEventData = {
			id: 'loan-123',
			userId: 'user@example.com',
			productId: 'product-456',
			dueDate: '2025-12-31',
		};

		vi.mocked(mockRepo.saveNotification).mockImplementation((n) =>
			Promise.resolve(n)
		);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanApproved(event, mockRepo, mockEmailSender);

		expect(mockRepo.saveNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				productId: 'product-456',
				loanId: 'loan-123',
			})
		);
	});
});
