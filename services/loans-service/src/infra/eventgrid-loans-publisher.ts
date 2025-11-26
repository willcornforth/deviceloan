import {
  EventGridPublisherClient,
  AzureKeyCredential,
} from "@azure/eventgrid";
import { InvocationContext } from "@azure/functions";

interface LoanEventData {
  id: string;
  userId: string;
  productId: string;
  dueDate: string;
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

export class LoanEventPublisher {
  private client: EventPublisherClient

  constructor(client?: EventPublisherClient) {
		this.client = client || new AzureEventGridPublisherClient(); // Default to EventGridPublisherClient
  }

  async publishLoanCreated(loan: LoanEventData, context?: InvocationContext) {
		context?.log(`Publishing Loan.Created event for loan ID: ${loan.id}`);
		
    await this.client.send([
      {
        eventType: "Loan.Created",
        subject: `loans/${loan.id}`,
        dataVersion: "1.0",
        data: {
          id: loan.id,
          userId: loan.userId,
          productId: loan.productId,
          dueDate: loan.dueDate,
        },
      },
    ]);
  }

	  async publishLoanReturned(loan: LoanEventData, context?: InvocationContext) {
		context?.log(`Publishing Loan.Returned event for loan ID: ${loan.id}`);
		
    await this.client.send([
      {
        eventType: "Loan.Returned",
        subject: `loans/${loan.id}`,
        dataVersion: "1.0",
        data: {
          id: loan.id,
          userId: loan.userId,
          productId: loan.productId,
          dueDate: loan.dueDate,
        },
      },
    ]);
  }
}
export const loanEventPublisher = new LoanEventPublisher();