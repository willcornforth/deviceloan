import { Loan, LoanStatus } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";
import { LoanEventPublisher } from "../infra/eventgrid-loans-publisher";
import { InvocationContext } from "@azure/functions";

export interface ApproveLoanResult {
  success: boolean;
  loan?: Loan;
  error?: string;
}

export const approveLoan =
  (repo: LoanRepo, eventPublisher: LoanEventPublisher) =>
  async (id: LoanId, context?: InvocationContext): Promise<ApproveLoanResult> => {
    const existingLoan = await repo.getById(id);
    
    if (!existingLoan) {
      return {
        success: false,
        error: "Loan not found",
      };
    }

    // Validate that the loan is in PendingApproval status
    if (existingLoan.status !== LoanStatus.PendingApproval) {
      return {
        success: false,
        error: `Loan cannot be approved. Current status: ${existingLoan.status}`,
      };
    }

    // Update loan status to Active
    const approvedLoan: Loan = {
      ...existingLoan,
      status: LoanStatus.Active,
      updatedAt: new Date(),
    };

    const updatedLoan = await repo.update(approvedLoan);

    // Publish Loan.Created event now that the loan is approved
    // This will trigger the product service to mark the product as on-loan
    await eventPublisher.publishLoanApproved(
      {
        id: updatedLoan.id,
        userId: updatedLoan.userId,
        productId: updatedLoan.productId,
        dueDate: updatedLoan.dueDate.toISOString(),
      },
      context
    );

    return {
      success: true,
      loan: updatedLoan,
    };
  };
