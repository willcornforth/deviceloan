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
  returnDate: string;
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

    if (!body.returnDate) {
      return ResponseBuilder.badRequest("returnDate is required");
    }

		// Calculate the due date for the loan.
    const dueDate = new Date(body.returnDate);

    // Validate the return date is not more than 90 days from now
    const now = new Date();
    const maxReturnDate = new Date(now);
    maxReturnDate.setDate(maxReturnDate.getDate() + 90);

    if (dueDate > maxReturnDate) {
      return ResponseBuilder.badRequest("Return date cannot be more than 90 days from today");
    }

    if (dueDate <= now) {
      return ResponseBuilder.badRequest("Return date must be in the future");
    }

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

		// TODO: This should be done by the product service when it recieves an EventGrid response.
		// const productService = ServiceConfig.getProductsService();
		// productService.request(
		// 	{
		// 		method: "PUT",
		// 		path: `/products/${body.productId}`,
		// 		body: { status: "on-loan" }
		// 	},
		// 	context
		// );

    return ResponseBuilder.created(loan, "Loan created successfully and is pending approval");
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
