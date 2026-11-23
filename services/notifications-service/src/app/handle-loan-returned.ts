import { randomUUID } from 'crypto';
import { LoanEventData } from '../domain/events';
import { Notification, NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';
import { UserService } from '../domain/user-service';

export async function handleLoanReturned(
	event: LoanEventData,
	repo: NotificationRepo,
	emailSender: EmailSender,
	userService: UserService
): Promise<void> {
	const notification: Notification = {
		id: randomUUID(),
		userId: event.userId,
		type: 'email',
		subject: `Loan Returned: ${event.id}`,
		message: `Thank you for returning "Loan ${event.id}". The loan has been marked as returned.`,
		status: 'pending',
		productId: event.productId,
		loanId: event.id,
		createdAt: new Date(),
	};

	const saved = await repo.saveNotification(notification);

	try {
		// Get user email from Auth0
		const userInfo = await userService.getUserInfo(event.userId);
		
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
