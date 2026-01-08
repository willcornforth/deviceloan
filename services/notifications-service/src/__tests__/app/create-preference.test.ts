import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPreference } from '../../app/create-preference';
import { NotificationRepo } from '../../domain/notification';

describe('createPreference', () => {
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

	it('should create a notification preference with valid input', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
			notificationTypes: ['email', 'sms'],
		};

		const savedPreference = {
			id: 'pref-789',
			...input,
			notificationTypes: input.notificationTypes as any[],
			createdAt: new Date(),
		};

		vi.mocked(mockRepo.savePreference).mockResolvedValue(savedPreference);

		const result = await createPreference(input, mockRepo);

		expect(result.preference).toEqual(savedPreference);
		expect(mockRepo.savePreference).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: input.userId,
				productId: input.productId,
				notificationTypes: input.notificationTypes,
			})
		);
	});

	it('should generate a unique ID for the preference', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
			notificationTypes: ['email'],
		};

		vi.mocked(mockRepo.savePreference).mockImplementation((pref) =>
			Promise.resolve(pref)
		);

		const result = await createPreference(input, mockRepo);

		expect(result.preference.id).toBeDefined();
		expect(typeof result.preference.id).toBe('string');
	});

	it('should set createdAt to current date', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
			notificationTypes: ['email'],
		};

		vi.mocked(mockRepo.savePreference).mockImplementation((pref) =>
			Promise.resolve(pref)
		);

		const before = new Date();
		const result = await createPreference(input, mockRepo);
		const after = new Date();

		expect(result.preference.createdAt.getTime()).toBeGreaterThanOrEqual(
			before.getTime()
		);
		expect(result.preference.createdAt.getTime()).toBeLessThanOrEqual(
			after.getTime()
		);
	});

	it('should handle multiple notification types', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
			notificationTypes: ['email', 'sms', 'push'],
		};

		vi.mocked(mockRepo.savePreference).mockImplementation((pref) =>
			Promise.resolve(pref)
		);

		const result = await createPreference(input, mockRepo);

		expect(result.preference.notificationTypes).toEqual(['email', 'sms', 'push']);
	});

	it('should propagate repository errors', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
			notificationTypes: ['email'],
		};

		const error = new Error('Database connection failed');
		vi.mocked(mockRepo.savePreference).mockRejectedValue(error);

		await expect(createPreference(input, mockRepo)).rejects.toThrow(
			'Database connection failed'
		);
	});
});
