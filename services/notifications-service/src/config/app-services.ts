import { CosmosClient } from '@azure/cosmos';
import { CosmosNotificationRepo } from '../infra/cosmos-notification-repo';
import { AzureCommunicationEmailSender } from '../infra/azure-communication-email-sender';
import { NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';

export interface AppConfig {
	notificationRepo: NotificationRepo;
	emailSender: EmailSender;
}

export function createAppConfig(): AppConfig {
	const cosmosEndpoint = process.env.COSMOS_ENDPOINT!;
	const cosmosKey = process.env.COSMOS_KEY!;
	const cosmosDatabase = process.env.COSMOS_DATABASE || process.env.COSMOS_DATABASE_ID || 'device-loan';
	const cosmosContainer = process.env.COSMOS_CONTAINER || process.env.COSMOS_CONTAINER_ID || 'notifications';
	const communicationConnectionString = process.env.COMMUNICATION_CONNECTION_STRING!;
	const senderAddress = process.env.SENDER_EMAIL_ADDRESS || 'DoNotReply@deviceloan.com';

	if (!cosmosEndpoint || !cosmosKey) {
		throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be configured');
	}

	if (!communicationConnectionString) {
		throw new Error('COMMUNICATION_CONNECTION_STRING must be configured');
	}

	const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
	const notificationRepo = new CosmosNotificationRepo(
		cosmosClient,
		cosmosDatabase,
		cosmosContainer
	);

	const emailSender = new AzureCommunicationEmailSender(
		communicationConnectionString,
		senderAddress
	);

	return {
		notificationRepo,
		emailSender,
	};
}
