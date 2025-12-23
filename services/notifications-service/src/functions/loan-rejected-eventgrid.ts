import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { handleLoanRejected } from '../app/handle-loan-rejected';
import { LoanEventData } from '../domain/events';

async function loanRejectedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	try {
		context.log('Loan.Rejected event received:', event);

		const loanEvent: LoanEventData = event.data as unknown as LoanEventData;
		const config = createAppConfig();

		await handleLoanRejected(loanEvent, config.notificationRepo, config.emailSender);

		context.log('Loan.Rejected event processed successfully');
	} catch (error: any) {
		context.error('Error processing Loan.Rejected event:', error);
		throw error;
	}
}

app.eventGrid('loan-rejected-eventgrid', {
	handler: loanRejectedHandler,
});
