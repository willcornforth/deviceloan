import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listActiveLoans } from "../app/listActiveLoans";
import { getLoanRepo } from "../config/appServices";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const repo = getLoanRepo();
    const loans = await listActiveLoans(repo)();

    return {
      status: 200,
      jsonBody: loans,
    };
  } catch (error) {
    context.error("Error listing active loans:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("listActiveLoansHttp", {
  methods: ["GET"],
  authLevel: "function",
  route: "loans/status/active",
  handler,
});
