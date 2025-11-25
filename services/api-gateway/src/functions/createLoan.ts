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

interface CreateLoanRequest {
  productId: string;
  durationDays: number;
}

interface CreateLoanPayload {
  productId: string;
  userId: string;
  dueDate: string;
}

export async function createLoan(
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

    context.log(`User ${authContext.subject} is accessing POST createLoan`);

    if (!authContext.subject) {
      return ResponseBuilder.unauthorized("User subject is missing in token");
    }

    // Validate request body
    const body = (await request.json()) as CreateLoanRequest;
    if (!body.productId) {
      return ResponseBuilder.badRequest("productId is required");
    }

    if (body.durationDays <= 0) {
      return ResponseBuilder.badRequest("Duration must be greater than 0");
    }

    if (body.durationDays > 90) {
      return ResponseBuilder.badRequest("Duration must not exceed 90 days");
    }

		// Calculate the due date for the loan.
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + body.durationDays);

		// Create payload to send to the loans service.
		const payload: CreateLoanPayload = {
      productId: body.productId,
      userId: authContext.subject,
      dueDate: dueDate.toISOString(),
    };

    // Get the loans service client
    const loansService = ServiceConfig.getLoansService();

    // Call the loans service
    const loan = await loansService.request(
      {
        method: "POST",
        path: "/loans",
        body: payload,
      },
      context
    );

    return ResponseBuilder.created(loan, "Loan created successfully");
  } catch (error) {
    context.log(`Error in createLoan: ${error}`);

    if (error instanceof HttpClientError) {
      return ResponseBuilder.serviceError(
        error.statusCode,
        "Failed to create loan in upstream service"
      );
    }

    if (error.message?.includes("not configured")) {
      return ResponseBuilder.internalError(error.message);
    }

    return ResponseBuilder.badRequest(error.message || "Invalid request");
  }
}

app.http("createLoan", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans",
  handler: createLoan,
});
