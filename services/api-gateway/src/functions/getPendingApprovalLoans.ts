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

export async function getPendingApprovalLoans(
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

		// Validate user has approve:loans permission
		const permissionError = AuthMiddleware.requirePermission(
			authContext,
			"approve:loans",
			context
		);
		if (permissionError) {
			return permissionError;
		}

		context.log(`User ${authContext.subject} is accessing pending approval loans`);

		// Get the loans service client
		const loansService = ServiceConfig.getLoansService();

		// Call the loans service to get pending approval loans
		const loans: any[] = await loansService.request(
			{
				method: "GET",
				path: "/loans/status/pending-approval",
			},
			context
		);

		// Get product service client.
		const productsService = ServiceConfig.getProductsService();

		// TODO: Send loans as an array and fetch multiple.
		// Enrich loans with product details
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

		return ResponseBuilder.success(loansWithProducts, "Pending approval loans retrieved successfully");
	} catch (error) {
		context.log(`Error in getPendingApprovalLoans: ${error}`);

		if (error instanceof HttpClientError) {
			return ResponseBuilder.serviceError(
				error.statusCode,
				"Failed to retrieve pending approval loans from upstream service"
			);
		}

		if (error.message?.includes("not configured")) {
			return ResponseBuilder.internalError(error.message);
		}

		return ResponseBuilder.badGateway("Unable to connect to loans service");
	}
}

app.http("getPendingApprovalLoans", {
	methods: ["GET"],
	authLevel: "anonymous",
	route: "loans/status/pending-approval",
	handler: getPendingApprovalLoans,
});
