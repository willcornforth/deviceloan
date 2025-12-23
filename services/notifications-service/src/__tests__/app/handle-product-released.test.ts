import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProductReleased } from '../../app/handle-product-released';
import { NotificationRepo, NotificationPreference } from '../../domain/notification';
import { EmailSender } from '../../domain/email-sender';
import { UserService } from '../../domain/user-service';
import { ProductEventData } from '../../domain/events';

describe('handleProductReleased', () => {
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
			getUserInfo: vi.fn((userId) =>
				Promise.resolve({
					userId,
					email: userId,
					name: 'Test User',
				})
			),
		};
	});

	it('should send notification to all users with email preferences', async () => {
		const event: ProductEventData = {
			productId: 'product-123',
			productName: 'iPhone 15',
			serialNumber: 'SN123456',
			description: 'Latest iPhone',
			category: 'Smartphone',
			status: 'available',
			createdAt: '2025-12-23T00:00:00Z',
		};

		const preferences: NotificationPreference[] = [
			{
				id: 'pref-1',
				userId: 'user1@example.com',
				productId: event.productId,
				notificationTypes: ['email'],
				createdAt: new Date(),
			},
			{
				id: 'pref-2',
				userId: 'user2@example.com',
				productId: event.productId,
				notificationTypes: ['email', 'sms'],
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getPreferencesByProduct).mockResolvedValue(preferences);
		vi.mocked(mockRepo.saveNotification).mockImplementation((n) =>
			Promise.resolve(n)
		);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleProductReleased(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.getPreferencesByProduct).toHaveBeenCalledWith(event.productId);
		expect(mockRepo.saveNotification).toHaveBeenCalledTimes(2);
		expect(mockEmailSender.send).toHaveBeenCalledTimes(2);

		expect(mockEmailSender.send).toHaveBeenCalledWith(
			'user1@example.com',
			expect.stringContaining(event.productName),
			expect.stringContaining('available')
		);

		expect(mockEmailSender.send).toHaveBeenCalledWith(
			'user2@example.com',
			expect.stringContaining(event.productName),
			expect.stringContaining('available')
		);
	});

	it('should skip users without email notification preference', async () => {
		const event: ProductEventData = {
			productId: 'product-123',
			productName: 'iPhone 15',
			serialNumber: 'SN123456',
			description: 'Latest iPhone',
			category: 'Smartphone',
			status: 'available',
			createdAt: '2025-12-23T00:00:00Z',
		};

		const preferences: NotificationPreference[] = [
			{
				id: 'pref-1',
				userId: 'user1@example.com',
				productId: event.productId,
				notificationTypes: ['sms'],
				createdAt: new Date(),
			},
			{
				id: 'pref-2',
				userId: 'user2@example.com',
				productId: event.productId,
				notificationTypes: ['push'],
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getPreferencesByProduct).mockResolvedValue(preferences);

		await handleProductReleased(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.saveNotification).not.toHaveBeenCalled();
		expect(mockEmailSender.send).not.toHaveBeenCalled();
	});

	it('should handle case when no preferences exist', async () => {
		const event: ProductEventData = {
			productId: 'product-123',
			productName: 'iPhone 15',
			serialNumber: 'SN123456',
			description: 'Latest iPhone',
			category: 'Smartphone',
			status: 'available',
			createdAt: '2025-12-23T00:00:00Z',
		};

		vi.mocked(mockRepo.getPreferencesByProduct).mockResolvedValue([]);

		await handleProductReleased(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.saveNotification).not.toHaveBeenCalled();
		expect(mockEmailSender.send).not.toHaveBeenCalled();
	});

	it('should mark notification as failed when email sending fails', async () => {
		const event: ProductEventData = {
			productId: 'product-123',
			productName: 'iPhone 15',
			serialNumber: 'SN123456',
			description: 'Latest iPhone',
			category: 'Smartphone',
			status: 'available',
			createdAt: '2025-12-23T00:00:00Z',
		};

		const preferences: NotificationPreference[] = [
			{
				id: 'pref-1',
				userId: 'user1@example.com',
				productId: event.productId,
				notificationTypes: ['email'],
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getPreferencesByProduct).mockResolvedValue(preferences);
		vi.mocked(mockRepo.saveNotification).mockImplementation((n) =>
			Promise.resolve(n)
		);
		vi.mocked(mockEmailSender.send).mockRejectedValue(
			new Error('Email failed')
		);
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleProductReleased(event, mockRepo, mockEmailSender, mockUserService);

		expect(mockRepo.updateNotificationStatus).toHaveBeenCalledWith(
			expect.any(String),
			'failed',
			undefined,
			'Email failed'
		);
	});

	it('should include product details in notification message', async () => {
		const event: ProductEventData = {
			productId: 'product-123',
			productName: 'MacBook Pro',
			serialNumber: 'SN789',
			description: 'M3 chip',
			category: 'Laptop',
			status: 'available',
			createdAt: '2025-12-23T00:00:00Z',
		};

		const preferences: NotificationPreference[] = [
			{
				id: 'pref-1',
				userId: 'user1@example.com',
				productId: event.productId,
				notificationTypes: ['email'],
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getPreferencesByProduct).mockResolvedValue(preferences);
		vi.mocked(mockRepo.saveNotification).mockImplementation((n) =>
			Promise.resolve(n)
		);
		vi.mocked(mockEmailSender.send).mockResolvedValue();
		vi.mocked(mockRepo.updateNotificationStatus).mockResolvedValue();

		await handleProductReleased(event, mockRepo, mockEmailSender);

		expect(mockRepo.saveNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: expect.stringContaining('MacBook Pro'),
				message: expect.stringContaining('Laptop'),
			})
		);
	});
});
