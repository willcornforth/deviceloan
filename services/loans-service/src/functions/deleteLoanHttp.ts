import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { deleteLoan } from "../app/deleteLoan";
import { getLoanRepo } from "../config/appServices";

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
    const deleted = await deleteLoan(repo)(id);

    if (!deleted) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" },
      };
    }

    return {
      status: 204,
    };
  } catch (error) {
    context.error("Error deleting loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("deleteLoanHttp", {
  methods: ["DELETE"],
  authLevel: "function",
  route: "loans/{id}",
  handler,
});
