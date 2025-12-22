import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { ResponseBuilder } from "../app/response-builder";
import { getProductRepo } from "../infra/cosmos-product-repo";
import { AuthMiddleware } from "../app/auth-middleware";

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

    const products = await productRepo.list();
    const filteredProducts = availableOnly 
      ? products.filter(p => p.status === 'available')
      : products;

    context.log(`Retrieved ${filteredProducts.length} products from local projection`);

    const output = {
      availableOnly,
      products: filteredProducts,
      count: filteredProducts.length
    };

    return ResponseBuilder.success(output, "Products retrieved successfully");
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
