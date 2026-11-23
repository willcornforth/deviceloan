import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { handleLoanApproved } from '../app/handle-loan-approved';
import { LoanEventData } from '../domain/events';

async function loanApprovedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	try {
		context.log('Loan.Approved event received:', event);

		const loanEvent: LoanEventData = event.data as unknown as LoanEventData;
		const config = createAppConfig();

		await handleLoanApproved(
			loanEvent,
			config.notificationRepo,
			config.emailSender,
			config.userService
		);

		context.log('Loan.Approved event processed successfully');
	} catch (error: any) {
		context.error('Error processing Loan.Approved event:', error);
		throw error;
	}
}

app.eventGrid('loan-approved-eventgrid', {
	handler: loanApprovedHandler,
});
