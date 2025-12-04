// Azure Function v4 - EventGrid subscriber for Loan.CreationFailed events
// Unreserves the product when loan creation fails

import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { unreserveProduct } from '../app/unreserve-product';
import {
	LoanEventTypes,
	LoanCreationFailedEventData,
} from '../domain/loan-events';

export async function loanCreationFailedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	context.log('Processing Loan.CreationFailed event:', event.subject);

	// Validate event type (defense in depth)
	if (event.eventType !== LoanEventTypes.CreationFailed) {
		context.warn(
			`Unexpected event type: ${event.eventType}, expected ${LoanEventTypes.CreationFailed}`
		);
		return;
	}

	try {
		const eventData = event.data as unknown as LoanCreationFailedEventData;

		if (!eventData?.productId) {
			context.error('Invalid event data: missing productId');
			return;
		}

		context.log(
			`Loan creation failed for product ${eventData.productId}: ${eventData.reason}`
		);

		const repo = getProductRepo();
		const result = await unreserveProduct({ repo, productId: eventData.productId });

		if (result.success === true) {
			if (result.wasReserved) {
				context.log(
					`Product ${eventData.productId} unreserved successfully`
				);
			} else {
				context.log(
					`Product ${eventData.productId} was not reserved (status: ${result.product.status})`
				);
			}
		} else if (result.reason === 'not-found') {
			context.warn(`Product ${eventData.productId} not found`);
		}
	} catch (error: any) {
		context.error('Error processing Loan.CreationFailed event:', error);
		throw error; // Re-throw to trigger retry
	}
}

app.eventGrid('loanCreationFailedHandler', {
	handler: loanCreationFailedHandler,
});
