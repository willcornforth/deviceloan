import { Loan } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";

export const getLoanById =
  (repo: LoanRepo) =>
  async (id: LoanId): Promise<Loan | null> => {
    return repo.getById(id);
  };
