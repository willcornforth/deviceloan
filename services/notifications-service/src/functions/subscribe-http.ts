import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { createPreference } from '../app/create-preference';
import { ResponseBuilder } from '../infra/response-builder';
import { AuthMiddleware } from '../app/auth-middleware';

async function subscribeHandler(
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
		const body = await request.json();
		const { productId, notificationTypes } = body as any;

		if (!productId || !notificationTypes || !Array.isArray(notificationTypes)) {
			return ResponseBuilder.badRequest(
				'productId and notificationTypes (array) are required'
			);
		}

		const config = createAppConfig();
		const result = await createPreference(
			{ userId, productId, notificationTypes },
			config.notificationRepo
		);

		return ResponseBuilder.success(result.preference, 201);
	} catch (error: any) {
		context.error('Error creating notification preference:', error);
		return ResponseBuilder.error(error.message);
	}
}

app.http('subscribe-http', {
	methods: ['POST'],
	authLevel: 'anonymous',
	route: 'notifications/subscribe',
	handler: subscribeHandler,
});
