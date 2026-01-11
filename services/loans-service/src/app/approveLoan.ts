import { Loan, LoanStatus } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";
import { LoanEventPublisher } from "../infra/eventgrid-loans-publisher";
import { InvocationContext } from "@azure/functions";
import { CorrelationContext } from "../infra/correlation-context";

export interface ApproveLoanResult {
  success: boolean;
  loan?: Loan;
  error?: string;
}

export const approveLoan =
  (repo: LoanRepo, eventPublisher: LoanEventPublisher) =>
  async (
    id: LoanId,
    context?: InvocationContext,
    correlationContext?: CorrelationContext
  ): Promise<ApproveLoanResult> => {
    const logPrefix = correlationContext?.getLogPrefix() || '';
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

    return {
      success: true,
      loan: updatedLoan,
    };
  };
