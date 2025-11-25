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

interface CreateLoanBody {
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
    const { authContext, error } = await AuthMiddleware.authenticate(request, context);
    if (error) {
      return error;
    }

    context.log(`User ${authContext.subject} is accessing POST createLoan`);

    // Validate request body
    const body = (await request.json()) as CreateLoanBody;
    if (!body.productId || !body.userId || !body.dueDate) {
      return ResponseBuilder.badRequest("productId, userId, and dueDate are required");
    }

    // Get the loans service client
    const loansService = ServiceConfig.getLoansService();

    // Call the loans service
    const loan = await loansService.request({
      method: "POST",
      path: "/loans",
      body,
    }, context);

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
