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

    // Get the loans service client
    const loansService = ServiceConfig.getLoansService();

    // Call the loans service approve endpoint
    const result = await loansService.request(
      {
        method: "POST",
        path: `/loans/${loanId}/approve`,
      },
      context
    );

    return ResponseBuilder.success(result, "Loan approved successfully");
  } catch (error) {
    context.log(`Error in approveLoan: ${error}`);

    if (error instanceof HttpClientError) {
      return ResponseBuilder.serviceError(
        error.statusCode,
        "Failed to approve loan in upstream service"
      );
    }

    if (error.message?.includes("not configured")) {
      return ResponseBuilder.internalError(error.message);
    }

    return ResponseBuilder.badGateway("Unable to connect to loans service");
  }
}

app.http("approveLoan", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans/{id}/approve",
  handler: approveLoan,
});
