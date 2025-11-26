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

export async function listLoansByUserId(
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

		context.log(`User ${authContext.subject} is accessing GET loans for user ${userId}`);

		// Check if the authenticated user is requesting their own loans
		// or has admin privileges to view other users' loans
		if (authContext.subject !== userId) {
			const permissionError = AuthMiddleware.requirePermission(authContext, 'read:all-loans', context);
			if (permissionError) {
				return permissionError;
			}
		}

		// Get the loans service client
		const loansService = ServiceConfig.getLoansService();

		// Call the loans service
		const loans: any[] = await loansService.request(
			{
				method: "GET",
				path: `/users/${userId}/loans`,
			},
			context
		);

		// Get the products service client to fetch product details
		const productsService = ServiceConfig.getProductsService();

		// Fetch product details for each loan
		const loansWithProducts = await Promise.all(
			loans.map(async (loan) => {
				try {
					const response: any = await productsService.request(
						{
							method: "GET",
							path: `/products/${loan.productId}`,
						},
						context
					);

					// Handle both cases where the product is wrapped in a 'product' field or returned directly
					const product = response?.product ?? response;

					return { ...loan, product };
				} catch (err) {
					context.log(`Failed to fetch product ${loan.productId}: ${err}`);
					return { ...loan, product: null };
				}
			})
		);

		return ResponseBuilder.success(
			loansWithProducts,
			"Loans retrieved successfully"
		);
	} catch (error) {
		context.log(`Error in listLoansByUserId: ${error}`);

		if (error instanceof HttpClientError) {
			return ResponseBuilder.serviceError(
				error.statusCode,
				"Failed to retrieve loans from upstream service"
			);
		}

		if (error.message?.includes("not configured")) {
			return ResponseBuilder.internalError(error.message);
		}

		return ResponseBuilder.badGateway("Unable to connect to loans service");
	}
}

app.http("listLoansByUserId", {
	methods: ["GET"],
	authLevel: "anonymous",
	route: "users/{userId}/loans",
	handler: listLoansByUserId,
});
