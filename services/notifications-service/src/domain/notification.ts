export type NotificationType = 'email' | 'sms' | 'push';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationPreference {
	id: string;
	userId: string;
	productId: string;
	notificationTypes: NotificationType[];
	createdAt: Date;
}

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	subject: string;
	message: string;
	status: NotificationStatus;
	productId?: string;
	loanId?: string;
	createdAt: Date;
	sentAt?: Date;
	error?: string;
}

export interface NotificationRepo {
	savePreference(preference: NotificationPreference): Promise<NotificationPreference>;
	deletePreference(userId: string, productId: string): Promise<void>;
	getPreferencesByProduct(productId: string): Promise<NotificationPreference[]>;
	getPreferencesByUser(userId: string): Promise<NotificationPreference[]>;
	saveNotification(notification: Notification): Promise<Notification>;
	getNotificationsByUser(userId: string, limit?: number): Promise<Notification[]>;
	updateNotificationStatus(
		id: string,
		status: NotificationStatus,
		sentAt?: Date,
		error?: string
	): Promise<void>;
}
