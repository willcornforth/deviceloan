import { CosmosClient } from '@azure/cosmos';
import { CosmosNotificationRepo } from '../infra/cosmos-notification-repo';
import { AzureCommunicationEmailSender } from '../infra/azure-communication-email-sender';
import { Auth0UserService } from '../infra/auth0-user-service';
import { NotificationRepo } from '../domain/notification';
import { EmailSender } from '../domain/email-sender';
import { UserService } from '../domain/user-service';

export interface AppConfig {
	notificationRepo: NotificationRepo;
	emailSender: EmailSender;
	userService: UserService;
}

export function createAppConfig(): AppConfig {
	const cosmosEndpoint = process.env.COSMOS_ENDPOINT!;
	const cosmosKey = process.env.COSMOS_KEY!;
	const cosmosDatabase = process.env.COSMOS_DATABASE || process.env.COSMOS_DATABASE_ID || 'device-loan';
	const cosmosContainer = process.env.COSMOS_CONTAINER || process.env.COSMOS_CONTAINER_ID || 'notifications';
	const communicationConnectionString = process.env.COMMUNICATION_CONNECTION_STRING!;
	const senderAddress = process.env.SENDER_EMAIL_ADDRESS || 'DoNotReply@deviceloan.com';
	const auth0Domain = process.env.AUTH0_DOMAIN!;
	const auth0ClientId = process.env.AUTH0_CLIENT_ID!;
	const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET!;

	if (!cosmosEndpoint || !cosmosKey) {
		throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be configured');
	}

	if (!communicationConnectionString) {
		throw new Error('COMMUNICATION_CONNECTION_STRING must be configured');
	}

	if (!auth0Domain || !auth0ClientId || !auth0ClientSecret) {
		throw new Error('AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET must be configured');
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

	const userService = new Auth0UserService(
		auth0Domain,
		auth0ClientId,
		auth0ClientSecret
	);

	return {
		notificationRepo,
		emailSender,
		userService,
	};
}
