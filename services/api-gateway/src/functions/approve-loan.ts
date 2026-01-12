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

export async function approveLoan(
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

    // Get loan ID from route parameters
    const loanId = request.params.id;

    if (!loanId) {
      return ResponseBuilder.badRequest("Loan ID is required");
    }

    context.log(`User ${authContext.subject} is approving loan ${loanId}`);

    // TODO: Add role-based authorization check here
    const permissionError = AuthMiddleware.requirePermission(authContext, 'approve:loans', context);
    if (permissionError) {
      return ResponseBuilder.forbidden("Only administrators can approve loans");
    }

    // Extract correlation context from request headers
    const headers: Record<string, string | string[]> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const correlationContext = CorrelationContext.fromContext(context, headers);

    // Get the loans service client
    const loansService = ServiceConfig.getLoansService();

    // Call the loans service approve endpoint
    const result = await loansService.request(
      {
        method: "POST",
        path: `/loans/${loanId}/approve`,
        correlationContext,
      },
      context
    );

    return ResponseBuilder.success(result, "Loan approved successfully");
  } catch (error) {
    context.error(`Error in approveLoan: ${error}`);

    if (error instanceof HttpClientError) {
      // HTTP error from service (4xx, 5xx after retries)
      return ResponseBuilder.serviceError(
        error.statusCode,
        "The loans service is experiencing issues. Please try again later."
      );
    }

    if (error.message?.includes("not configured")) {
      return ResponseBuilder.internalError(error.message);
    }

    // Network error after retries exhausted (service unavailable)
    return ResponseBuilder.serviceUnavailable(
      "The loans service is temporarily unavailable. Please try again in a few moments."
    );
  }
}

app.http("approveLoan", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans/{id}/approve",
  handler: approveLoan,
});
