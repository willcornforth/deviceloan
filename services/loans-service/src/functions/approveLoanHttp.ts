import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { approveLoan } from "../app/approveLoan";
import { getLoanRepo } from "../config/appServices";
import { loanEventPublisher } from "../infra/eventgrid-loans-publisher";
import { Loan } from "../domain/loan";

async function handler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const id = request.params.id;

		if (!id) {
			return {
				status: 400,
				jsonBody: { error: "Loan ID is required" },
			};
		}

		context.log(`Approving loan ${id}`);

		const repo = getLoanRepo();
		const result = await approveLoan(repo, loanEventPublisher)(id, context);

		if (!result.success) {
			const statusCode = result.error === "Loan not found" ? 404 : 400;
			return {
				status: statusCode,
				jsonBody: { error: result.error },
			};
		}

		// Now create an eventgrid message to notify consumers a product has been loaned out.
		// 1. This will be picked up by the product service to update the status.
		// 2. Also the lockbox service to assign the product a lockbox.
		try {
			const loan: Loan | undefined = result.loan;

			if(!loan) {
				throw new Error("Approved loan data is missing");
			}

			console.log("About to publish Loan.Approved event for loan:", loan.id);
			await loanEventPublisher.publishLoanApproved(
				{
					id: loan.id,
					userId: loan.userId,
					productId: loan.productId,
					dueDate: loan.dueDate.toISOString(),
				},
				context
			);
			console.log("Successfully published Loan.Approved event");
		} catch (eventError) {
			console.error("Failed to publish Loan.Approved event:", eventError);
			// Don't fail the request if event publishing fails
		}

		context.log(`Loan ${id} approved successfully`);

		return {
			status: 200,
			jsonBody: {
				message: "Loan approved successfully",
				loan: result.loan,
			},
		};
	} catch (error) {
		context.error("Error approving loan:", error);
		return {
			status: 500,
			jsonBody: { error: "Internal server error" },
		};
	}
}

app.http("approveLoanHttp", {
	methods: ["POST"],
	authLevel: "function",
	route: "loans/{id}/approve",
	handler,
});
