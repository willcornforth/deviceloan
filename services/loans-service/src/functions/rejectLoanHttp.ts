import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { rejectLoan } from "../app/rejectLoan";
import { getLoanRepo } from "../config/appServices";
import { loanEventPublisher } from "../infra/eventgrid-loans-publisher";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;

    if (!id) {
      return {
        status: 400,
        jsonBody: { error: "Loan ID is required" },
      };
    }

    const repo = getLoanRepo();
    const result = await rejectLoan(repo)(id);

    if (result === null) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" },
      };
    }

    if ("error" in result) {
      return {
        status: 400,
        jsonBody: { error: result.error },
      };
    }

    // Publish Loan.Rejected event to unreserve the product
    await loanEventPublisher.publishLoanRejected(
      {
        id: result.id,
        userId: result.userId,
        productId: result.productId,
        dueDate: result.dueDate.toISOString(),
      },
      context
    );

    return {
      status: 200,
      jsonBody: result,
    };
  } catch (error) {
    context.error("Error rejecting loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("rejectLoanHttp", {
  methods: ["POST"],
  authLevel: "function",
  route: "loans/{id}/reject",
  handler,
});
