import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLoanRejected } from '../../app/handle-loan-rejected';
import { NotificationRepo, Notification } from '../../domain/notification';
import { EmailSender } from '../../domain/email-sender';
import { UserService } from '../../domain/user-service';
import { LoanEventData } from '../../domain/events';

describe('handleLoanRejected', () => {
	let mockRepo: NotificationRepo;
	let mockEmailSender: EmailSender;
	let mockUserService: UserService;

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

		mockUserService = {
			getUserInfo: vi.fn().mockResolvedValue({
				userId: 'auth0|123',
				email: 'user@example.com',
				name: 'Test User',
			}),
		};
	});

	it('should create and send notification for rejected loan', async () => {
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
			subject: `Loan Rejected: ${event.id}`,
			message: `Your loan request for "Loan ${event.id}" has been rejected! Please contact support for more information.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanRejected(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.saveNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: event.userId,
				type: 'email',
				subject: `Loan Rejected: ${event.id}`,
				status: 'pending',
				productId: event.productId,
				loanId: event.id,
			})
		);

		expect(mockUserService.getUserInfo).toHaveBeenCalledWith(event.userId);

		expect(mockEmailSender.send).toHaveBeenCalledWith(
			'user@example.com',
			expect.stringContaining('Loan Rejected'),
			expect.stringContaining('rejected')
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
			subject: `Loan Rejected: ${event.id}`,
			message: `Your loan request for "Loan ${event.id}" has been rejected! Please contact support for more information.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockRejectedValue(
			new Error('SMTP error')
		);
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanRejected(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.updateNotificationStatus).toHaveBeenCalledWith(
			savedNotification.id,
			'failed',
			undefined,
			'SMTP error'
		);
	});
});
