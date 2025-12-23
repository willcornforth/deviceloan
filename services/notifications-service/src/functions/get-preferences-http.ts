import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { getPreferences } from '../app/get-preferences';
import { ResponseBuilder } from '../infra/response-builder';
import { AuthMiddleware } from '../app/auth-middleware';

async function getPreferencesHandler(
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

		const config = createAppConfig();
		const result = await getPreferences({ userId }, config.notificationRepo);

		return ResponseBuilder.success(result);
	} catch (error: any) {
		context.error('Error getting notification preferences:', error);
		return ResponseBuilder.error(error.message);
	}
}

app.http('get-preferences-http', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'notifications/preferences',
	handler: getPreferencesHandler,
});
