import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listLoansByProductId } from "../app/listLoansByProductId";
import { getLoanRepo } from "../config/appServices";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const productId = request.params.productId;

    if (!productId) {
      return {
        status: 400,
        jsonBody: { error: "Product ID is required" },
      };
    }

    const repo = getLoanRepo();
    const loans = await listLoansByProductId(repo)(productId);

    return {
      status: 200,
      jsonBody: loans,
    };
  } catch (error) {
    context.error("Error listing loans by product:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("listLoansByProductIdHttp", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products/{productId}/loans",
  handler,
});
