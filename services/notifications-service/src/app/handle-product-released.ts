import { randomUUID } from 'crypto';
import { ProductEventData } from '../domain/events';
import { Notification, NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';
import { UserService } from '../domain/user-service';

export async function handleProductReleased(
	event: ProductEventData,
	repo: NotificationRepo,
	emailSender: EmailSender,
	userService: UserService
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
				// Get user email from Auth0
				const userInfo = await userService.getUserInfo(pref.userId);
				
				await emailSender.send(
					userInfo.email,
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
