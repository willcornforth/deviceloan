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

export async function unsubscribeNotifications(
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

    // Get product ID from route parameters
    const productId = request.params.productId;

    if (!productId) {
      return ResponseBuilder.badRequest("Product ID is required");
    }

    context.log(`User ${authContext.subject} is unsubscribing from notifications for product ${productId}`);

    // Build query string with user ID
    const queryParams = new URLSearchParams({
      userId: authContext.subject,
    });

    // Get the notifications service client
    const notificationsService = ServiceConfig.getNotificationsService();

    // Call the notifications service
    const response = await notificationsService.request({
      method: "DELETE",
      path: `/api/notifications/unsubscribe/${productId}?${queryParams.toString()}`,
    }, context);

    return ResponseBuilder.success(
      response,
      "Successfully unsubscribed from notifications"
    );
  } catch (error) {
    context.log(`Error unsubscribing from notifications: ${error}`);

    if (error instanceof HttpClientError) {
      if (error.statusCode === 404) {
        return ResponseBuilder.notFound("Subscription not found");
      } else if (error.statusCode === 400) {
        return ResponseBuilder.badRequest("Invalid unsubscribe request");
      }
    }

    return ResponseBuilder.internalError(
      "Failed to unsubscribe from notifications"
    );
  }
}

app.http("unsubscribeNotifications", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "notifications/unsubscribe/{productId}",
  handler: unsubscribeNotifications,
});
