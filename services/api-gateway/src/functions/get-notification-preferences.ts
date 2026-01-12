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
import { CorrelationContext } from "../infra/correlation-context";

export async function getNotificationPreferences(
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

    context.log(`User ${authContext.subject} is retrieving notification preferences`);

    // Build query string
    const queryParams = new URLSearchParams({
      userId: authContext.subject,
    });

    // Get the notifications service client
    const notificationsService = ServiceConfig.getNotificationsService();

    // Extract correlation context from request headers
    const headers: Record<string, string | string[]> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const correlationContext = CorrelationContext.fromContext(context, headers);

    // Call the notifications service
    const response = await notificationsService.request({
      method: "GET",
      path: `/api/notifications/preferences?${queryParams.toString()}`,
      correlationContext,
    }, context);

    return ResponseBuilder.success(
      response,
      "Notification preferences retrieved successfully"
    );
  } catch (error) {
    context.error(`Error retrieving notification preferences: ${error}`);

    if (error instanceof HttpClientError) {
      // HTTP error from service (4xx, 5xx after retries)
      if (error.statusCode === 404) {
        return ResponseBuilder.serviceError(404, "Notification preferences not found");
      } else if (error.statusCode === 400) {
        return ResponseBuilder.badRequest("Invalid request parameters");
      }
      return ResponseBuilder.serviceError(
        error.statusCode,
        "The notifications service is experiencing issues. Please try again later."
      );
    }

    // Network error after retries exhausted
    return ResponseBuilder.serviceUnavailable(
      "The notifications service is temporarily unavailable. Please try again in a few moments."
    );
  }
}

app.http("getNotificationPreferences", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "notifications/preferences",
  handler: getNotificationPreferences,
});
