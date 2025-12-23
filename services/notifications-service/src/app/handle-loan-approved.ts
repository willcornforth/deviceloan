import { randomUUID } from 'crypto';
import { LoanApprovedEvent } from '../domain/events';
import { Notification, NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';

export async function handleLoanApproved(
	event: LoanApprovedEvent,
	repo: NotificationRepo,
	emailSender: EmailSender
): Promise<void> {
	const notification: Notification = {
		id: randomUUID(),
		userId: event.userId,
		type: 'email',
		subject: `Loan Approved: ${event.productName}`,
		message: `Your loan for "${event.productName}" has been approved! Please return it by ${event.returnDate}.`,
		status: 'pending',
		productId: event.productId,
		loanId: event.loanId,
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
