// Azure Function v4 - EventGrid subscriber for Loan.Created events

import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { getProductRepo, getProductEventPublisher } from '../config/appServices';
import {
	handleLoanApproved,
	LoanApprovedEvent,
} from '../app/handle-loan-approved';
import { LoanEventTypes, LoanApprovedEventData } from '../domain/loan-events';
import { CorrelationContext } from '../infra/correlation-context';

export interface LoanApprovedEventWithCorrelation extends LoanApprovedEventData {
	readonly _correlationId?: string;
	readonly _invocationId?: string;
}

export async function loanApprovedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	const eventData = event.data as unknown as LoanApprovedEventWithCorrelation;

	// Extract correlation context from event data
	const correlationId = eventData?._correlationId || event.id;
	const correlationContext = new CorrelationContext(
		correlationId,
		context.invocationId,
		context.traceContext?.traceParent
	);
	const logPrefix = correlationContext.getLogPrefix();

	context.log(`${logPrefix} Processing Loan.Approved event: ${event.subject}`);

	// Validate event type (defense in depth)
	if (event.eventType !== LoanEventTypes.Approved) {
		context.warn(
			`${logPrefix} Unexpected event type: ${event.eventType}, expected ${LoanEventTypes.Approved}`
		);
		return;
	}

	try {
		if (!eventData?.productId) {
			context.error(`${logPrefix} Invalid event data: missing productId`);
			return;
		}

		const repo = getProductRepo();

		const loanEvent: LoanApprovedEvent = {
			id: eventData.id,
			userId: eventData.userId,
			productId: eventData.productId,
			dueDate: eventData.dueDate,
		};

		const result = await handleLoanApproved({ repo, event: loanEvent });

		if (result.success === true) {
			context.log(`${logPrefix} Product ${result.productId} status updated to on-loan`);
			
			// Publish Product.Updated event to update the API Gateway projection
			const updatedProduct = await repo.getById(result.productId);
			if (updatedProduct) {
				const publisher = getProductEventPublisher();
				await publisher.publishProductUpdated(updatedProduct);
				context.log(`${logPrefix} Published Product.Updated event for ${result.productId}`);
			}
		} else if (result.reason === 'product-not-found') {
			context.warn(`${logPrefix} Product ${result.productId} not found`);
		} else if (result.reason === 'already-on-loan') {
			context.warn(`${logPrefix} Product ${result.productId} is already on loan`);
		}
	} catch (error: any) {
		context.error(`${logPrefix} Error processing Loan.Approved event:`, error);
		throw error; // Re-throw to trigger retry
	}
}

app.eventGrid('loanApprovedHandler', {
	handler: loanApprovedHandler,
});
1