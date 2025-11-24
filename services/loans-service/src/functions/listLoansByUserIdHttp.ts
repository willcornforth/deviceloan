import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listLoansByUserId } from "../app/listLoansByUserId";
import { getLoanRepo } from "../config/appServices";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;

    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: "User ID is required" },
      };
    }

    const repo = getLoanRepo();
    const loans = await listLoansByUserId(repo)(userId);

    return {
      status: 200,
      jsonBody: loans,
    };
  } catch (error) {
    context.error("Error listing loans by user:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("listLoansByUserIdHttp", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/{userId}/loans",
  handler,
});
