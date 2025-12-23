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
			context.error('Missing userId query parameter');
			return ResponseBuilder.badRequest('userId query parameter is required');
		}

		const productId = request.params.productId;
		if (!productId) {
			context.error('Missing productId parameter');
			return ResponseBuilder.badRequest('productId parameter is required');
		}

		context.log(`Attempting to delete preference for userId: ${userId}, productId: ${productId}`);

		const config = createAppConfig();
		await deletePreference({ userId, productId }, config.notificationRepo);

		context.log(`Successfully deleted preference for userId: ${userId}, productId: ${productId}`);
		return ResponseBuilder.success({ message: 'Unsubscribed successfully' });
	} catch (error: any) {
		context.error('Error deleting notification preference:', error);
		context.error('Error stack:', error.stack);
		return ResponseBuilder.error(error.message || 'Internal server error');
	}
}

app.http('unsubscribe-http', {
	methods: ['DELETE'],
	authLevel: 'function',
	route: 'notifications/unsubscribe/{productId}',
	handler: unsubscribeHandler,
});
