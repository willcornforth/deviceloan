// Azure Function v4 - EventGrid subscriber for Loan.Returned events

import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import {
  getProductRepo,
  getProductEventPublisher,
} from '../config/appServices';
import {
  handleLoanReturned,
  LoanReturnedEvent,
} from '../app/handle-loan-returned';
import { LoanEventTypes, LoanReturnedEventData } from '../domain/loan-events';

export async function loanReturnedHandler(
  event: EventGridEvent,
  context: InvocationContext
): Promise<void> {
  context.log('Processing Loan.Returned event:', event.subject);

  // Validate event type (defense in depth)
  if (event.eventType !== LoanEventTypes.Returned) {
    context.warn(
      `Unexpected event type: ${event.eventType}, expected ${LoanEventTypes.Returned}`
    );
    return;
  }

  try {
    const eventData = event.data as unknown as LoanReturnedEventData;

    if (!eventData?.productId) {
      context.error('Invalid event data: missing productId');
      return;
    }

    const repo = getProductRepo();

    const loanEvent: LoanReturnedEvent = {
      id: eventData.id,
      userId: eventData.userId,
      productId: eventData.productId,
      dueDate: '', // Not needed for return operation
    };

    const result = await handleLoanReturned({ repo, event: loanEvent });

    if (result.success === true) {
      context.log(`Product ${result.productId} status updated to available`);

      // Publish Product.Released event with full product data
      const updatedProduct = await repo.getById(result.productId);
      if (updatedProduct) {
        const publisher = getProductEventPublisher();
        await publisher.publishProductReleased(updatedProduct);
        context.log(`Published Product.Released event for ${result.productId}`);
      }
    } else if (result.reason === 'product-not-found') {
      context.warn(`Product ${result.productId} not found`);
    } else if (result.reason === 'not-on-loan') {
      context.warn(`Product ${result.productId} is not on loan`);
    }
  } catch (error: any) {
    context.error('Error processing Loan.Returned event:', error);
    throw error; // Re-throw to trigger retry
  }
}

app.eventGrid('loanReturnedHandler', {
  handler: loanReturnedHandler,
});
