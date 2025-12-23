import { randomUUID } from 'crypto';
import { LoanEventData } from '../domain/events';
import { Notification, NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';

export async function handleLoanRejected(
	event: LoanEventData,
	repo: NotificationRepo,
	emailSender: EmailSender
): Promise<void> {
	const notification: Notification = {
		id: randomUUID(),
		userId: event.userId,
		type: 'email',
		subject: `Loan Rejected: ${event.id}`,
		message: `Your loan request for "Loan ${event.id}" has been rejected! Please contact support for more information.`,
		status: 'pending',
		productId: event.productId,
		loanId: event.id,
		createdAt: new Date(),
	};

	const saved = await repo.saveNotification(notification);

	try {
		await emailSender.send(
			event.userId,
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
