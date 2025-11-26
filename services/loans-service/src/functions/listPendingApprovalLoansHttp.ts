import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listPendingApprovalLoans } from "../app/listPendingApprovalLoans";
import { getLoanRepo } from "../config/appServices";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const repo = getLoanRepo();
    const loans = await listPendingApprovalLoans(repo)();

    return {
      status: 200,
      jsonBody: loans,
    };
  } catch (error) {
    context.error("Error listing pending approval loans:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("listPendingApprovalLoansHttp", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "loans/status/pending-approval",
  handler,
});
