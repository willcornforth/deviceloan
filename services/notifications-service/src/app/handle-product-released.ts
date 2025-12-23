import { randomUUID } from 'crypto';
import { ProductEventData } from '../domain/events';
import { Notification, NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';

export async function handleProductReleased(
	event: ProductEventData,
	repo: NotificationRepo,
	emailSender: EmailSender
): Promise<void> {
	const preferences = await repo.getPreferencesByProduct(event.productId);

	for (const pref of preferences) {
		if (pref.notificationTypes.includes('email')) {
			const notification: Notification = {
				id: randomUUID(),
				userId: pref.userId,
				type: 'email',
				subject: `Product Available: ${event.productName}`,
				message: `The product "${event.productName}" (${event.category}) you were watching is now available!`,
				status: 'pending',
				productId: event.productId,
				createdAt: new Date(),
			};

			const saved = await repo.saveNotification(notification);

			try {
				await emailSender.send(
					pref.userId,
					notification.subject,
					notification.message
				);
				await repo.updateNotificationStatus(saved.id, 'sent', new Date());
			} catch (error: any) {
				await repo.updateNotificationStatus(
					saved.id,
					'failed',
					undefined,
					error.message
				);
			}
		}
	}
}
