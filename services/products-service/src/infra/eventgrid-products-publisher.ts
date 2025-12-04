import {
	EventGridPublisherClient,
	AzureKeyCredential,
} from "@azure/eventgrid";

export const ProductEventTypes = {
	Reserved: 'Product.Reserved',
	Released: 'Product.Released',
} as const;

export type ProductEventType = (typeof ProductEventTypes)[keyof typeof ProductEventTypes];

export interface ProductReservedEventData {
	readonly productId: string;
	readonly productName: string;
	readonly serialNumber: string;
	readonly category: string;
	readonly reservedBy: string;
	readonly reservedAt: string;
	readonly returnDate: string;
}

interface EventPublisherClient {
	send(events: Array<any>): Promise<void>;
}

class AzureEventGridPublisherClient implements EventPublisherClient {
	private client: EventGridPublisherClient<"EventGrid">;

	constructor() {
		const endpoint = process.env.EVENTGRID_ENDPOINT;
		const key = process.env.EVENTGRID_KEY;

		if (!endpoint || !key) {
			throw new Error(
				"Missing required environment variables: EVENTGRID_ENDPOINT, EVENTGRID_KEY"
			);
		}

		this.client = new EventGridPublisherClient(
			endpoint,
			"EventGrid",
			new AzureKeyCredential(key)
		);
	}

	async send(events: Array<any>): Promise<void> {
		await this.client.send(events);
	}
}

export class ProductEventPublisher {
	private client: EventPublisherClient

	constructor(client?: EventPublisherClient) {
		this.client = client || new AzureEventGridPublisherClient();
	}

	async publishProductReserved(data: ProductReservedEventData): Promise<void> {
		const event = {
			eventType: ProductEventTypes.Reserved,
			subject: `products/${data.productId}`,
			dataVersion: '1.0',
			data,
		};

		await this.client.send([event]);
	}
}