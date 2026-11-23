import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLoanReturned } from '../../app/handle-loan-returned';
import { NotificationRepo, Notification } from '../../domain/notification';
import { EmailSender } from '../../domain/email-sender';
import { UserService } from '../../domain/user-service';
import { LoanEventData } from '../../domain/events';

describe('handleLoanReturned', () => {
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

	it('should create and send notification for returned loan', async () => {
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
			subject: `Loan Returned: ${event.id}`,
			message: `Thank you for returning "Loan ${event.id}". The loan has been marked as returned.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanReturned(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.saveNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: event.userId,
				type: 'email',
				subject: `Loan Returned: ${event.id}`,
				status: 'pending',
				productId: event.productId,
				loanId: event.id,
			})
		);

		expect(mockUserService.getUserInfo).toHaveBeenCalledWith(event.userId);

		expect(mockEmailSender.send).toHaveBeenCalledWith(
			'user@example.com',
			expect.stringContaining('Loan Returned'),
			expect.stringContaining('returned')
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
			subject: `Loan Returned: ${event.id}`,
			message: `Thank you for returning "Loan ${event.id}". The loan has been marked as returned.`,
			status: 'pending',
			productId: event.productId,
			loanId: event.id,
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.saveNotification).mockResolvedValue(savedNotification);
		vi.mocked(mockEmailSender.send).mockRejectedValue(
			new Error('Network timeout')
		);
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleLoanReturned(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.updateNotificationStatus).toHaveBeenCalledWith(
			savedNotification.id,
			'failed',
			undefined,
			'Network timeout'
		);
	});
});
