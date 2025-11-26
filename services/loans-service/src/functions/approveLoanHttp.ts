import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { approveLoan } from "../app/approveLoan";
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

    context.log(`Approving loan ${id}`);

    const repo = getLoanRepo();
    const result = await approveLoan(repo, loanEventPublisher)(id, context);

    if (!result.success) {
      const statusCode = result.error === "Loan not found" ? 404 : 400;
      return {
        status: statusCode,
        jsonBody: { error: result.error },
      };
    }

    context.log(`Loan ${id} approved successfully`);

    return {
      status: 200,
      jsonBody: {
        message: "Loan approved successfully",
        loan: result.loan,
      },
    };
  } catch (error) {
    context.error("Error approving loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("approveLoanHttp", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans/{id}/approve",
  handler,
});
