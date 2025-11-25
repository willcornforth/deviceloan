import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { createLoan } from "../app/createLoan";
import { getLoanRepo } from "../config/appServices";
import { CreateLoanRequest } from "../domain/loan";
import { loanEventPublisher } from "../infra/eventgrid-loans-publisher";

interface CreateLoanBody {
  productId: string;
  userId: string;
  dueDate: string;
}

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as CreateLoanBody;

    if (!body.productId || !body.userId || !body.dueDate) {
      return {
        status: 400,
        jsonBody: { error: "productId, userId, and dueDate are required" },
      };
    }

    const createLoanRequest: CreateLoanRequest = {
      productId: body.productId,
      userId: body.userId,
      dueDate: new Date(body.dueDate),
    };

    const repo = getLoanRepo();
    const loan = await createLoan(repo)(createLoanRequest);

		// Now create an eventgrid message to notify consumers a product has been loaned out.
		// 1. This will be picked up by the product service to update the status.
		// 2. Also the lockbox service to assign the product a lockbox.
		await loanEventPublisher.publishLoanCreated({
      id: loan.id,
      userId: loan.userId,
      productId: loan.productId,
      dueDate: loan.dueDate.toISOString(),
    });

    return {
      status: 201,
      jsonBody: loan,
    };
  } catch (error) {
    context.error("Error creating loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("createLoanHttp", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans",
  handler,
});
