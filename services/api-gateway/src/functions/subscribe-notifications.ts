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

interface SubscribeRequest {
  productId: string;
  notificationTypes: string[];
}

export async function subscribeNotifications(
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

    context.log(`User ${authContext.subject} is subscribing to notifications`);

    // Validate request body
    const body = (await request.json()) as SubscribeRequest;

    if (!body.productId) {
      return ResponseBuilder.badRequest("productId is required");
    }

    if (!body.notificationTypes || !Array.isArray(body.notificationTypes)) {
      return ResponseBuilder.badRequest("notificationTypes array is required");
    }

    if (body.notificationTypes.length === 0) {
      return ResponseBuilder.badRequest("At least one notification type is required");
    }

    // Create payload with authenticated user ID
    const payload = {
      userId: authContext.subject,
      productId: body.productId,
      notificationTypes: body.notificationTypes,
    };

    // Get the notifications service client
    const notificationsService = ServiceConfig.getNotificationsService();

    // Call the notifications service
    const response = await notificationsService.request({
      method: "POST",
      path: "/api/notifications/subscribe",
      body: payload,
    }, context);

    return ResponseBuilder.success(
      response,
      "Successfully subscribed to notifications"
    );
  } catch (error) {
    context.log(`Error subscribing to notifications: ${error}`);

    if (error instanceof HttpClientError) {
      if (error.statusCode === 400) {
        return ResponseBuilder.badRequest("Invalid subscription request");
      } else if (error.statusCode === 409) {
        return ResponseBuilder.serviceError(409, "Subscription already exists");
      }
    }

    return ResponseBuilder.internalError(
      "Failed to subscribe to notifications"
    );
  }
}

app.http("subscribeNotifications", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/subscribe",
  handler: subscribeNotifications,
});
