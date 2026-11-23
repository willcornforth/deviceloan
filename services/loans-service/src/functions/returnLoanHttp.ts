import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { returnLoan } from "../app/returnLoan";
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
    const loan = await returnLoan(repo)(id);

    if (!loan) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" },
      };
    }

		// Let other services know this has been returned.
		loanEventPublisher.publishLoanReturned(
			{ 
				id: loan.id, 
				userId: loan.userId, 
				productId: loan.productId, 
				dueDate: loan.dueDate.toISOString() 
			},
			context
		);

    return {
      status: 200,
      jsonBody: loan,
    };
  } catch (error) {
    context.error("Error returning loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("returnLoanHttp", {
  methods: ["POST"],
  authLevel: "function",
  route: "loans/{id}/return",
  handler,
});
