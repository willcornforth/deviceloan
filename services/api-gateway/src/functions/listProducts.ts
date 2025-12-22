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

		// No authentication here as this is just to view the products available.
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

app.http("listProducts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products",
  handler: listProducts,
});
