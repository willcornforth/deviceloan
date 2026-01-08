import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deletePreference } from '../../app/delete-preference';
import { NotificationRepo } from '../../domain/notification';

describe('deletePreference', () => {
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

	it('should delete a preference with valid input', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
		};

		vi.mocked(mockRepo.deletePreference).mockResolvedValue();

		await deletePreference(input, mockRepo);

		expect(mockRepo.deletePreference).toHaveBeenCalledWith(
			'user-123',
			'product-456'
		);
		expect(mockRepo.deletePreference).toHaveBeenCalledTimes(1);
	});

	it('should propagate repository errors', async () => {
		const input = {
			userId: 'user-123',
			productId: 'product-456',
		};

		const error = new Error('Preference not found');
		vi.mocked(mockRepo.deletePreference).mockRejectedValue(error);

		await expect(deletePreference(input, mockRepo)).rejects.toThrow(
			'Preference not found'
		);
	});

	it('should complete successfully when preference does not exist', async () => {
		const input = {
			userId: 'user-123',
			productId: 'nonexistent-product',
		};

		vi.mocked(mockRepo.deletePreference).mockResolvedValue();

		await expect(deletePreference(input, mockRepo)).resolves.toBeUndefined();
	});
});
