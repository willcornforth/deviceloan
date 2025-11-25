// Azure Function v4 - EventGrid subscriber for Loan.Created events

import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import {
	handleLoanCreated,
	LoanCreatedEvent,
} from '../app/handle-loan-created';
import { LoanEventTypes, LoanCreatedEventData } from '../domain/loan-events';

export async function loanCreatedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	context.log('Processing Loan.Created event:', event.subject);

	// Validate event type (defense in depth)
	if (event.eventType !== LoanEventTypes.Created) {
		context.warn(
			`Unexpected event type: ${event.eventType}, expected ${LoanEventTypes.Created}`
		);
		return;
	}

	try {
		const eventData = event.data as unknown as LoanCreatedEventData;

		if (!eventData?.productId) {
			context.error('Invalid event data: missing productId');
			return;
		}

		const repo = getProductRepo();

		const loanEvent: LoanCreatedEvent = {
			id: eventData.id,
			userId: eventData.userId,
			productId: eventData.productId,
			dueDate: eventData.dueDate,
		};

		const result = await handleLoanCreated({ repo, event: loanEvent });

		if (result.success === true) {
			context.log(
				`Product ${result.productId} status updated to on-loan`
			);
		} else if (result.reason === 'product-not-found') {
			context.warn(`Product ${result.productId} not found`);
		} else if (result.reason === 'already-on-loan') {
			context.warn(`Product ${result.productId} is already on loan`);
		}
	} catch (error: any) {
		context.error('Error processing Loan.Created event:', error);
		throw error; // Re-throw to trigger retry
	}
}

app.eventGrid('loanCreatedHandler', {
	handler: loanCreatedHandler,
});
