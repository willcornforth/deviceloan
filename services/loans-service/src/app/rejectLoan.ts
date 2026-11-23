import { Loan, LoanStatus, rejectLoan as rejectLoanEntity } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";

export const rejectLoan =
  (repo: LoanRepo) =>
  async (id: LoanId): Promise<Loan | null | { error: string }> => {
    const existingLoan = await repo.getById(id);
    if (!existingLoan) {
      return null;
    }

    if (existingLoan.status !== LoanStatus.PendingApproval) {
      return { error: "Only pending approval loans can be rejected" };
    }

    const rejectedLoan = rejectLoanEntity(existingLoan);
    return repo.update(rejectedLoan);
  };
