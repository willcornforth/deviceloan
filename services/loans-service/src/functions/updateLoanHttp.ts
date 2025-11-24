import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { updateLoan } from "../app/updateLoan";
import { getLoanRepo } from "../config/appServices";
import { LoanStatus, UpdateLoanRequest } from "../domain/loan";

interface UpdateLoanBody {
  status?: LoanStatus;
  dueDate?: string;
  returnDate?: string;
}

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

    const body = (await request.json()) as UpdateLoanBody;

    const updates: UpdateLoanRequest = {
      ...(body.status && { status: body.status }),
      ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
      ...(body.returnDate && { returnDate: new Date(body.returnDate) }),
    };

    const repo = getLoanRepo();
    const loan = await updateLoan(repo)(id, updates);

    if (!loan) {
      return {
        status: 404,
        jsonBody: { error: "Loan not found" },
      };
    }

    return {
      status: 200,
      jsonBody: loan,
    };
  } catch (error) {
    context.error("Error updating loan:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("updateLoanHttp", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "loans/{id}",
  handler,
});
