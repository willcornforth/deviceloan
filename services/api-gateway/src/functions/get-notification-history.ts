import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { AuthMiddleware } from "../app/auth-middleware";
import { ServiceConfig } from "../infra/service-config";
import { ResponseBuilder } from "../app/response-builder";
import { HttpClientError } from "../infra/http-client";

export async function getNotificationHistory(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate the user
    const { authContext, error } = await AuthMiddleware.authenticate(
      request,
      context
    );
    if (error) {
      return error;
    }

    if (!authContext.subject) {
      return ResponseBuilder.unauthorized("User subject is missing in token");
    }

    context.log(`User ${authContext.subject} is retrieving notification history`);

    // Get optional limit parameter
    const limitParam = request.query.get("limit");

    // Build query string
    const queryParams = new URLSearchParams({
      userId: authContext.subject,
    });

    if (limitParam) {
      queryParams.append("limit", limitParam);
    }

    // Get the notifications service client
    const notificationsService = ServiceConfig.getNotificationsService();

    // Call the notifications service
    const response = await notificationsService.request({
      method: "GET",
      path: `/api/notifications/history?${queryParams.toString()}`,
    }, context);

    return ResponseBuilder.success(
      response,
      "Notification history retrieved successfully"
    );
  } catch (error) {
    context.log(`Error retrieving notification history: ${error}`);

    if (error instanceof HttpClientError) {
      if (error.statusCode === 404) {
        return ResponseBuilder.serviceError(404, "Notification history not found");
      } else if (error.statusCode === 400) {
        return ResponseBuilder.badRequest("Invalid request parameters");
      }
    }

    return ResponseBuilder.internalError(
      "Failed to retrieve notification history"
    );
  }
}

app.http("getNotificationHistory", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "notifications/history",
  handler: getNotificationHistory,
});
