import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { getNotificationHistory } from '../app/get-notification-history';
import { ResponseBuilder } from '../infra/response-builder';
import { AuthMiddleware } from '../app/auth-middleware';

async function getNotificationHistoryHandler(
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
	authLevel: 'anonymous',
	route: 'notifications/history',
	handler: getNotificationHistoryHandler,
});
