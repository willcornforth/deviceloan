import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { deletePreference } from '../app/delete-preference';
import { ResponseBuilder } from '../infra/response-builder';
import { AuthMiddleware } from '../app/auth-middleware';

async function unsubscribeHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		// Authenticate user
		const { authContext, error } = await AuthMiddleware.authenticate(request, context);
		if (error) {
			return error;
		}

		// Extract userId from authenticated user's subject
		const userId = authContext.subject!;
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
	authLevel: 'anonymous',
	route: 'notifications/unsubscribe/{productId}',
	handler: unsubscribeHandler,
});
