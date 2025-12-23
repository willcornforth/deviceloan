import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { deletePreference } from '../app/delete-preference';
import { ResponseBuilder } from '../infra/response-builder';

async function unsubscribeHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const userId = request.query.get('userId');
		if (!userId) {
			return ResponseBuilder.badRequest('userId query parameter is required');
		}

		const productId = request.params.productId;

		const config = createAppConfig();
		await deletePreference({ userId, productId }, config.notificationRepo);

		return ResponseBuilder.success({ message: 'Unsubscribed successfully' });
	} catch (error: any) {
		context.error('Error deleting notification preference:', error);
		return ResponseBuilder.error(error.message);
	}
}

app.http('unsubscribe-http', {
	methods: ['DELETE'],
	authLevel: 'function',
	route: 'notifications/unsubscribe/{productId}',
	handler: unsubscribeHandler,
});
