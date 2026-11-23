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
import { CorrelationContext } from "../infra/correlation-context";
import { getProductRepo } from "../config/app-services";

export async function getActiveLoans(
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

		// Validate user has return:all-loans permission
		const permissionError = AuthMiddleware.requirePermission(
			authContext,
			"return:all-loans",
			context
		);
		if (permissionError) {
			return permissionError;
		}

		context.log(`User ${authContext.subject} is accessing active loans`);

		// Extract correlation context from request headers
		const headers: Record<string, string | string[]> = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});
		const correlationContext = CorrelationContext.fromContext(context, headers);

		// Get the loans service client
		const loansService = ServiceConfig.getLoansService();

		// Call the loans service to get active loans
		const loans: any[] = await loansService.request(
			{
				method: "GET",
				path: "/loans/status/active",
				correlationContext,
			},
			context
		);

		// Get product repository to fetch product details from local projection
		const productRepo = getProductRepo();

		// Enrich loans with product details
		const loansWithProducts = await Promise.all(
			loans.map(async (loan) => {
				try {
					const product = await productRepo.getById(loan.productId);

					if (!product) {
						context.warn(`Product ${loan.productId} not found in projection`);
					}

					return { ...loan, product };
				} catch (err) {
					context.error(`Failed to fetch product ${loan.productId} from projection: ${err}`);
					return { ...loan, product: null };
				}
			})
		);

		return ResponseBuilder.success(loansWithProducts, "Active loans retrieved successfully");
	} catch (error) {
		context.error(`Error in getActiveLoans: ${error}`);

		if (error instanceof HttpClientError) {
			// HTTP error from service (4xx, 5xx after retries)
			return ResponseBuilder.serviceError(
				error.statusCode,
				"The loans service is experiencing issues. Please try again later."
			);
		}

		if (error.message?.includes("not configured")) {
			return ResponseBuilder.internalError(error.message);
		}

		// Network error after retries exhausted
		return ResponseBuilder.serviceUnavailable(
			"The loans service is temporarily unavailable. Please try again in a few moments."
		);
	}
}

app.http("getActiveLoans", {
	methods: ["GET"],
	authLevel: "anonymous",
	route: "loans/status/active",
	handler: getActiveLoans,
});
