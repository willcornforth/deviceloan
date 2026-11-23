import {
  Loan,
  UpdateLoanRequest,
  updateLoan as updateLoanEntity,
} from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";

export const updateLoan =
  (repo: LoanRepo) =>
  async (id: LoanId, updates: UpdateLoanRequest): Promise<Loan | null> => {
    const existingLoan = await repo.getById(id);
    if (!existingLoan) {
      return null;
    }

    const updatedLoan = updateLoanEntity(existingLoan, updates);
    return repo.update(updatedLoan);
  };
