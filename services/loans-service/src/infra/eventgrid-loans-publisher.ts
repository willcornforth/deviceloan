import {
  EventGridPublisherClient,
  AzureKeyCredential,
} from "@azure/eventgrid";
import { InvocationContext } from "@azure/functions";
import { CorrelationContext } from "./correlation-context";

interface LoanEventData {
  id: string;
  userId: string;
  productId: string;
  dueDate: string;
  _correlationId?: string;
  _invocationId?: string;
}

interface LoanCreationFailedEventData {
  productId: string;
  userId: string;
  reason: string;
  _correlationId?: string;
  _invocationId?: string;
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


  async publishLoanApproved(
    loan: LoanEventData,
    context?: InvocationContext,
    correlationContext?: CorrelationContext
  ) {
    const prefix = correlationContext ? `${correlationContext.getLogPrefix()} ` : '';
    context?.log(`${prefix}Publishing Loan.Approved event for loan ID: ${loan.id}`);
		
    const eventData = {
      id: loan.id,
      userId: loan.userId,
      productId: loan.productId,
      dueDate: loan.dueDate,
      _correlationId: correlationContext?.correlationId,
      _invocationId: correlationContext?.invocationId,
    };

    await this.client.send([
      {
        eventType: "Loan.Approved",
        subject: `loans/${loan.id}`,
        dataVersion: "1.0",
        data: eventData,
      },
    ]);
  }

    async publishLoanReturned(
      loan: LoanEventData,
      context?: InvocationContext,
      correlationContext?: CorrelationContext
    ) {
      const prefix = correlationContext ? `${correlationContext.getLogPrefix()} ` : '';
      context?.log(`${prefix}Publishing Loan.Returned event for loan ID: ${loan.id}`);
		
    const eventData = {
      id: loan.id,
      userId: loan.userId,
      productId: loan.productId,
      dueDate: loan.dueDate,
      _correlationId: correlationContext?.correlationId,
      _invocationId: correlationContext?.invocationId,
    };

    await this.client.send([
      {
        eventType: "Loan.Returned",
        subject: `loans/${loan.id}`,
        dataVersion: "1.0",
        data: eventData,
      },
    ]);
  }

  async publishLoanCreationFailed(
    data: LoanCreationFailedEventData,
    context?: InvocationContext,
    correlationContext?: CorrelationContext
  ) {
    const prefix = correlationContext ? `${correlationContext.getLogPrefix()} ` : '';
    context?.log(
      `${prefix}Publishing Loan.CreationFailed event for product ID: ${data.productId}`
    );

    const eventData = {
      productId: data.productId,
      userId: data.userId,
      reason: data.reason,
      _correlationId: correlationContext?.correlationId,
      _invocationId: correlationContext?.invocationId,
    };

    await this.client.send([
      {
        eventType: "Loan.CreationFailed",
        subject: `loans/failed/${data.productId}`,
        dataVersion: "1.0",
        data: eventData,
      },
    ]);
  }

  async publishLoanRejected(loan: LoanEventData, context?: InvocationContext) {
    context?.log(`Publishing Loan.Rejected event for loan ID: ${loan.id}`);

    await this.client.send([
      {
        eventType: "Loan.Rejected",
        subject: `loans/${loan.id}`,
        dataVersion: "1.0",
        data: {
          id: loan.id,
          userId: loan.userId,
          productId: loan.productId,
        },
      },
    ]);
  }
}
export const loanEventPublisher = new LoanEventPublisher();