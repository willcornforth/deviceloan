import { CosmosClient, Database, Container } from '@azure/cosmos';
import {
	Notification,
	NotificationPreference,
	NotificationRepo,
	NotificationStatus,
} from '../domain/notification';

export class CosmosNotificationRepo implements NotificationRepo {
	private container: Container;

	constructor(client: CosmosClient, databaseId: string, containerId: string) {
		const database: Database = client.database(databaseId);
		this.container = database.container(containerId);
	}

	async savePreference(preference: NotificationPreference): Promise<NotificationPreference> {
		const doc = {
			...preference,
			type: 'preference',
		};
		const { resource } = await this.container.items.create(doc);
		return this.toPreference(resource!);
	}

	async deletePreference(userId: string, productId: string): Promise<void> {
		const querySpec = {
			query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId AND c.productId = @productId',
			parameters: [
				{ name: '@type', value: 'preference' },
				{ name: '@userId', value: userId },
				{ name: '@productId', value: productId },
			],
		};

		const { resources } = await this.container.items.query(querySpec).fetchAll();
		
		for (const item of resources) {
			await this.container.item(item.id, item.userId).delete();
		}
	}

	async getPreferencesByProduct(productId: string): Promise<NotificationPreference[]> {
		const querySpec = {
			query: 'SELECT * FROM c WHERE c.type = @type AND c.productId = @productId',
			parameters: [
				{ name: '@type', value: 'preference' },
				{ name: '@productId', value: productId },
			],
		};

		const { resources } = await this.container.items.query(querySpec).fetchAll();
		return resources.map(this.toPreference);
	}

	async getPreferencesByUser(userId: string): Promise<NotificationPreference[]> {
		const querySpec = {
			query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId',
			parameters: [
				{ name: '@type', value: 'preference' },
				{ name: '@userId', value: userId },
			],
		};

		const { resources } = await this.container.items.query(querySpec).fetchAll();
		return resources.map(this.toPreference);
	}

	async saveNotification(notification: Notification): Promise<Notification> {
		const doc = {
			...notification,
			type: 'notification',
		};
		const { resource } = await this.container.items.create(doc);
		return this.toNotification(resource!);
	}

	async getNotificationsByUser(userId: string, limit: number = 50): Promise<Notification[]> {
		const querySpec = {
			query: 'SELECT TOP @limit * FROM c WHERE c.type = @type AND c.userId = @userId ORDER BY c.createdAt DESC',
			parameters: [
				{ name: '@limit', value: limit },
				{ name: '@type', value: 'notification' },
				{ name: '@userId', value: userId },
			],
		};

		const { resources } = await this.container.items.query(querySpec).fetchAll();
		return resources.map(this.toNotification);
	}

	async updateNotificationStatus(
		id: string,
		status: NotificationStatus,
		sentAt?: Date,
		error?: string
	): Promise<void> {
		const querySpec = {
			query: 'SELECT * FROM c WHERE c.type = @type AND c.id = @id',
			parameters: [
				{ name: '@type', value: 'notification' },
				{ name: '@id', value: id },
			],
		};

		const { resources } = await this.container.items.query(querySpec).fetchAll();
		
		if (resources.length > 0) {
			const item = resources[0];
			item.status = status;
			if (sentAt) item.sentAt = sentAt;
			if (error) item.error = error;
			
			await this.container.item(item.id, item.partitionKey).replace(item);
		}userId
	}

	private toPreference(doc: any): NotificationPreference {
		return {
			id: doc.id,
			userId: doc.userId,
			productId: doc.productId,
			notificationTypes: doc.notificationTypes,
			createdAt: new Date(doc.createdAt),
		};
	}

	private toNotification(doc: any): Notification {
		return {
			id: doc.id,
			userId: doc.userId,
			type: doc.type,
			subject: doc.subject,
			message: doc.message,
			status: doc.status,
			productId: doc.productId,
			loanId: doc.loanId,
			createdAt: new Date(doc.createdAt),
			sentAt: doc.sentAt ? new Date(doc.sentAt) : undefined,
			error: doc.error,
		};
	}
}
