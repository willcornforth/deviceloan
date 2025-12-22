// Event Grid handler for Loan.Rejected events
// Unreserves the product when a loan is rejected

import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { handleLoanRejected, LoanRejectedEvent } from '../app/handle-loan-rejected';

interface LoanRejectedEventData {
	readonly id: string;
	readonly userId: string;
	readonly productId: string;
}

async function handler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	context.log('Received Loan.Rejected event:', event.id);

	const eventData = event.data as unknown as LoanRejectedEventData;

	if (!eventData.productId) {
		context.error('Invalid event data - missing productId');
		return;
	}

	try {
		const repo = getProductRepo();
		
		const loanEvent: LoanRejectedEvent = {
			id: eventData.id,
			userId: eventData.userId,
			productId: eventData.productId,
		};

		await handleLoanRejected({ repo, event: loanEvent });

		context.log(
			`Successfully unreserved product ${eventData.productId} after loan rejection`
		);
	} catch (error) {
		context.error('Error handling Loan.Rejected event:', error);
		throw error; // Rethrow to trigger Event Grid retry
	}
}

app.eventGrid('loanRejectedEventHandler', {
	handler,
});
