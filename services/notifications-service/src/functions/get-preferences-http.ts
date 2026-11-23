import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { getPreferences } from '../app/get-preferences';
import { ResponseBuilder } from '../infra/response-builder';

async function getPreferencesHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const userId = request.query.get('userId');
		if (!userId) {
			return ResponseBuilder.badRequest('userId query parameter is required');
		}

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
	authLevel: 'function',
	route: 'notifications/preferences',
	handler: getPreferencesHandler,
});
