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

export async function returnLoan(
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

		// Get loan ID from route parameters
		const loanId = request.params.id;

		if (!loanId) {
			return ResponseBuilder.badRequest("Loan ID is required");
		}

		context.log(`User ${authContext.subject} is returning loan ${loanId}`);

		// Get the loans service client
		const loansService = ServiceConfig.getLoansService();

		// First, fetch the loan to validate ownership
		const existingLoan: any = await loansService.request(
			{
				method: "GET",
				path: `/loans/${loanId}`,
			},
			context
		);

		// Extract loan from response if wrapped
		const loanData = existingLoan?.loan ?? existingLoan;

		// Validate the user is returning their own loan (or has admin scope)
		if (loanData?.userId !== authContext.subject) {
			const scopeError = AuthMiddleware.requireScope(authContext, 'return:all-loans', context);
			if (scopeError) {
				context.log(`User ${authContext.subject} attempted to return loan belonging to ${loanData?.userId}`);
				return ResponseBuilder.forbidden("You can only return your own loans");
			}
		}

		// Call the loans service to return the loan
		const loan: any = await loansService.request(
			{
				method: "POST",
				path: `/loans/${loanId}/return`,
			},
			context
		);

		// TODO: This should be done by the product service when it receives an EventGrid response.
		// Update the product status back to available
		// if (loan?.productId) {
		// 	const productService = ServiceConfig.getProductsService();
		// 	productService.request(
		// 		{
		// 			method: "PUT",
		// 			path: `/products/${loan.productId}`,
		// 			body: { status: "available" }
		// 		},
		// 		context
		// 	);
		// }

		return ResponseBuilder.success(loan, "Loan returned successfully");
	} catch (error) {
		context.log(`Error in returnLoan: ${error}`);

		if (error instanceof HttpClientError) {
			return ResponseBuilder.serviceError(
				error.statusCode,
				"Failed to return loan in upstream service"
			);
		}

		if (error.message?.includes("not configured")) {
			return ResponseBuilder.internalError(error.message);
		}

		return ResponseBuilder.badGateway("Unable to connect to loans service");
	}
}

app.http("returnLoan", {
	methods: ["POST"],
	authLevel: "anonymous",
	route: "loans/{id}/return",
	handler: returnLoan,
});
