import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { handleLoanReturned } from '../app/handle-loan-returned';
import { LoanEventData } from '../domain/events';

async function loanReturnedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	try {
		context.log('Loan.Returned event received:', event);

		const loanEvent: LoanEventData = event.data as unknown as LoanEventData;
		const config = createAppConfig();

		await handleLoanReturned(loanEvent, config.notificationRepo, config.emailSender);

		context.log('Loan.Returned event processed successfully');
	} catch (error: any) {
		context.error('Error processing Loan.Returned event:', error);
		throw error;
	}
}

app.eventGrid('loan-returned-eventgrid', {
	handler: loanReturnedHandler,
});
