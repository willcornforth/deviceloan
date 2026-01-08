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

		// Require return:all-loans permission for all product returns
		const permissionError = AuthMiddleware.requirePermission(authContext, 'return:all-loans', context);
		if (permissionError) {
			return ResponseBuilder.forbidden("Only administrators with return:all-loans permission can return products");
		}

		// Get loan ID from route parameters
		const loanId = request.params.id;

		if (!loanId) {
			return ResponseBuilder.badRequest("Loan ID is required");
		}

		context.log(`User ${authContext.subject} is returning loan ${loanId}`);

		// Get the loans service client
		const loansService = ServiceConfig.getLoansService();

		// Call the loans service to return the loan
		const loan: any = await loansService.request(
			{
				method: "POST",
				path: `/loans/${loanId}/return`,
			},
			context
		);

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
