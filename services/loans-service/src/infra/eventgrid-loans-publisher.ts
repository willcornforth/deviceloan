import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";

interface LoanEventData {
	id: string,
	userId: string,
	productId: string,
	dueDate: string
}

export class LoanEventPublisher {
	private client: EventGridPublisherClient;

  constructor() {
    const endpoint = process.env.EVENTGRID_ENDPOINT;
    const key = process.env.EVENTGRID_KEY;
    
    this.client = new EventGridPublisherClient(
      endpoint,
      "EventGrid",
      new AzureKeyCredential(key)
    );
  }

	async publishLoanCreated(loan: LoanEventData) {
		await this.client.send([
			  {
					eventType: "Loan.Created",
					subject: `loans/${loan.id}`,
					dataVersion: "1.0",
					data: {
						id: loan.id,
						userId: loan.userId,
						productId: loan.productId,
						dueDate: loan.dueDate
        },
      },
		])
	}
}
export const loanEventPublisher = new LoanEventPublisher();