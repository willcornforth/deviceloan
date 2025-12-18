import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { ResponseBuilder } from "../app/response-builder";
import { AuthMiddleware } from "../app/auth-middleware";
import { getProductRepo } from "../config/appServices";

export async function listProducts(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate the user
    const { authContext, error } = await AuthMiddleware.authenticate(
      request,
      context
    );
    if (error) {
      return error;
    }

    // Get userId from route parameters
    const userId = request.params.userId;

    if (!userId) {
      return ResponseBuilder.badRequest("userId is required");
    }

    context.log(
      `User ${authContext.subject} is accessing GET products for user ${userId}`
    );

    if (authContext.subject !== userId) {
      const permissionError = AuthMiddleware.requirePermission(
        authContext,
        "read:products",
        context
      );
      if (permissionError) {
        return permissionError;
      }
    }

    const productRepo = getProductRepo();
    const availableOnly = request.query.get('availableOnly') === 'true';

    const products = await productRepo.list(availableOnly);

    context.log(`Retrieved ${products.length} products from local projection`);

    return ResponseBuilder.success(products, "Products retrieved successfully");
  } catch (error) {
    context.log(`Error in getProducts: ${error}`);

    return ResponseBuilder.internalError(
      "Failed to retrieve products from database"
    );
  }
}

app.http("getProducts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products",
  handler: listProducts,
});
