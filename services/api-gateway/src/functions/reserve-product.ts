import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { AuthMiddleware } from "../app/auth-middleware";
import { ServiceConfig } from "../infra/service-config";
import { ResponseBuilder } from "../app/response-builder";
import { HttpClientError } from "../infra/http-client";

interface ReserveProductRequest {
  returnDate: string;
}

interface ReserveProductPayload {
  userId: string;
  returnDate: string;
}

export async function reserveProduct(
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

    // Get product ID from route parameters
    const productId = request.params.id;

    if (!productId) {
      return ResponseBuilder.badRequest("Product ID is required");
    }

    context.log(`User ${authContext.subject} is reserving product ${productId}`);

    if (!authContext.subject) {
      return ResponseBuilder.unauthorized("User subject is missing in token");
    }

    // Validate request body
    const body = (await request.json()) as ReserveProductRequest;

    if (!body.returnDate) {
      return ResponseBuilder.badRequest("returnDate is required");
    }

    // Calculate the return date for validation
    const returnDate = new Date(body.returnDate);

    // Validate the return date is not more than 90 days from now
    const now = new Date();
    const maxReturnDate = new Date(now);
    maxReturnDate.setDate(maxReturnDate.getDate() + 90);

    if (returnDate > maxReturnDate) {
      return ResponseBuilder.badRequest("Return date cannot be more than 90 days from today");
    }

    if (returnDate <= now) {
      return ResponseBuilder.badRequest("Return date must be in the future");
    }

    // Create payload to send to the products service
    const payload: ReserveProductPayload = {
      userId: authContext.subject,
      returnDate: returnDate.toISOString(),
    };

    // Get the products service client
    const productsService = ServiceConfig.getProductsService();

    // Call the products service reserve endpoint
    const result = await productsService.request<{
      message: string;
      product: any;
    }>(
      {
        method: "POST",
        path: `/products/${productId}/reserve`,
        body: payload,
      },
      context
    );

    // Return the product reservation details
    return ResponseBuilder.success(result, "Product reserved successfully");
  } catch (error) {
    context.log(`Error in reserveProduct: ${error}`);

    if (error instanceof HttpClientError) {
      return ResponseBuilder.serviceError(
        error.statusCode,
        "Failed to reserve product in upstream service"
      );
    }

    if (error.message?.includes("not configured")) {
      return ResponseBuilder.internalError(error.message);
    }

    return ResponseBuilder.badRequest(error.message || "Invalid request");
  }
}

app.http("reserveProduct", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "products/{id}/reserve",
  handler: reserveProduct,
});
