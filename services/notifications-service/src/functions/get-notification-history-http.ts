import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { getNotificationHistory } from '../app/get-notification-history';
import { ResponseBuilder } from '../infra/response-builder';

async function getNotificationHistoryHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const userId = request.query.get('userId');
		if (!userId) {
			return ResponseBuilder.badRequest('userId query parameter is required');
		}

		const limitParam = request.query.get('limit');
		const limit = limitParam ? parseInt(limitParam) : undefined;

		const config = createAppConfig();
		const result = await getNotificationHistory(
			{ userId, limit },
			config.notificationRepo
		);

		return ResponseBuilder.success(result);
	} catch (error: any) {
		context.error('Error getting notification history:', error);
		return ResponseBuilder.error(error.message);
	}
}

app.http('get-notification-history-http', {
	methods: ['GET'],
	authLevel: 'function',
	route: 'notifications/history',
	handler: getNotificationHistoryHandler,
});
