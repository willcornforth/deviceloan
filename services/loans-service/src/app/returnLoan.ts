import { Loan, returnLoan as returnLoanEntity } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";

export const returnLoan =
  (repo: LoanRepo) =>
  async (id: LoanId): Promise<Loan | null> => {
    const existingLoan = await repo.getById(id);
    if (!existingLoan) {
      return null;
    }

    const returnedLoan = returnLoanEntity(existingLoan);
    return repo.update(returnedLoan);
  };
