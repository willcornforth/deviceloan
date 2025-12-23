import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreferences } from '../../app/get-preferences';
import { NotificationRepo, NotificationPreference } from '../../domain/notification';

describe('getPreferences', () => {
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

	it('should return user preferences', async () => {
		const preferences: NotificationPreference[] = [
			{
				id: 'pref-1',
				userId: 'user-123',
				productId: 'product-1',
				notificationTypes: ['email'],
				createdAt: new Date(),
			},
			{
				id: 'pref-2',
				userId: 'user-123',
				productId: 'product-2',
				notificationTypes: ['email', 'sms'],
				createdAt: new Date(),
			},
		];

		vi.mocked(mockRepo.getPreferencesByUser).mockResolvedValue(preferences);

		const result = await getPreferences({ userId: 'user-123' }, mockRepo);

		expect(result.preferences).toEqual(preferences);
		expect(mockRepo.getPreferencesByUser).toHaveBeenCalledWith('user-123');
	});

	it('should return empty array when user has no preferences', async () => {
		vi.mocked(mockRepo.getPreferencesByUser).mockResolvedValue([]);

		const result = await getPreferences({ userId: 'user-123' }, mockRepo);

		expect(result.preferences).toEqual([]);
		expect(result.preferences).toHaveLength(0);
	});

	it('should propagate repository errors', async () => {
		const error = new Error('Database error');
		vi.mocked(mockRepo.getPreferencesByUser).mockRejectedValue(error);

		await expect(
			getPreferences({ userId: 'user-123' }, mockRepo)
		).rejects.toThrow('Database error');
	});
});
