import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationHistory } from '../../app/get-notification-history';
import { NotificationRepo, Notification } from '../../domain/notification';

describe('getNotificationHistory', () => {
	let mockRepo: NotificationRepo;

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
	});

	it('should return notification history for a user', async () => {
		const notifications: Notification[] = [
			{
				id: 'notif-1',
				userId: 'user-123',
				type: 'email',
				subject: 'Test Subject 1',
				message: 'Test Message 1',
				status: 'sent',
				createdAt: new Date(),
				sentAt: new Date(),
			},
			{
				id: 'notif-2',
				userId: 'user-123',
				type: 'email',
				subject: 'Test Subject 2',
				message: 'Test Message 2',
				status: 'pending',
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getNotificationsByUser).mockResolvedValue(notifications);

		const result = await getNotificationHistory({ userId: 'user-123' }, mockRepo);

		expect(result.notifications).toEqual(notifications);
		expect(mockRepo.getNotificationsByUser).toHaveBeenCalledWith('user-123', undefined);
	});

	it('should apply limit when provided', async () => {
		const notifications: Notification[] = [
			{
				id: 'notif-1',
				userId: 'user-123',
				type: 'email',
				subject: 'Test Subject',
				message: 'Test Message',
				status: 'sent',
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getNotificationsByUser).mockResolvedValue(notifications);

		const result = await getNotificationHistory(
			{ userId: 'user-123', limit: 10 },
			mockRepo
		);

		expect(result.notifications).toEqual(notifications);
		expect(mockRepo.getNotificationsByUser).toHaveBeenCalledWith('user-123', 10);
	});

	it('should return empty array when user has no notifications', async () => {
		vi.mocked(mockRepo.getNotificationsByUser).mockResolvedValue([]);

		const result = await getNotificationHistory({ userId: 'user-123' }, mockRepo);

		expect(result.notifications).toEqual([]);
		expect(result.notifications).toHaveLength(0);
	});

	it('should propagate repository errors', async () => {
		const error = new Error('Database error');
		vi.mocked(mockRepo.getNotificationsByUser).mockRejectedValue(error);

		await expect(
			getNotificationHistory({ userId: 'user-123' }, mockRepo)
		).rejects.toThrow('Database error');
	});
});
