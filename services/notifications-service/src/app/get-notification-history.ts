import { Notification, NotificationRepo } from '../domain/notification';

export interface GetNotificationHistoryInput {
	userId: string;
	limit?: number;
}

export interface GetNotificationHistoryOutput {
	notifications: Notification[];
}

export async function getNotificationHistory(
	input: GetNotificationHistoryInput,
	repo: NotificationRepo
): Promise<GetNotificationHistoryOutput> {
	const notifications = await repo.getNotificationsByUser(input.userId, input.limit);
	return { notifications };
}
