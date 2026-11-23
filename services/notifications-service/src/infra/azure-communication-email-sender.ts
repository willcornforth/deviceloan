import { EmailClient, EmailMessage } from '@azure/communication-email';
import { EmailSender } from '../domain/email-sender';

export class AzureCommunicationEmailSender implements EmailSender {
	private client: EmailClient;
	private senderAddress: string;

	constructor(connectionString: string, senderAddress: string) {
		this.client = new EmailClient(connectionString);
		this.senderAddress = senderAddress;
	}

	async send(to: string, subject: string, body: string): Promise<void> {
		const emailMessage: EmailMessage = {
			senderAddress: this.senderAddress,
			content: {
				subject: subject,
				plainText: body,
			},
			recipients: {
				to: [{ address: to }],
			},
		};

		const poller = await this.client.beginSend(emailMessage);
		await poller.pollUntilDone();
	}
}
