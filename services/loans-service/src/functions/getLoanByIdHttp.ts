import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getLoanById } from "../app/getLoanById";
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
    const loan = await getLoanById(repo)(id);

    if (!loan) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" },
      };
    }

    return {
      status: 200,
      jsonBody: loan,
    };
  } catch (error) {
    context.error("Error getting loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getLoanByIdHttp", {
  methods: ["GET"],
  authLevel: "function",
  route: "loans/{id}",
  handler,
});
