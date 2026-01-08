import { Loan } from "../domain/loan";
import { LoanRepo } from "../domain/loan-repo";

export const listLoansByUserId =
  (repo: LoanRepo) =>
  async (userId: string): Promise<readonly Loan[]> => {
    return repo.listByUserId(userId);
  };
