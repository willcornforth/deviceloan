import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { createPreference } from '../app/create-preference';
import { ResponseBuilder } from '../infra/response-builder';

async function subscribeHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const body = await request.json();
		const { userId, productId, notificationTypes } = body as any;

		if (!userId || !productId || !notificationTypes || !Array.isArray(notificationTypes)) {
			return ResponseBuilder.badRequest(
				'userId, productId and notificationTypes (array) are required'
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
	authLevel: 'function',
	route: 'notifications/subscribe',
	handler: subscribeHandler,
});
