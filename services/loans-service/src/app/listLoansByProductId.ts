import { Loan } from "../domain/loan";
import { LoanRepo } from "../domain/loan-repo";

export const listLoansByProductId =
  (repo: LoanRepo) =>
  async (productId: string): Promise<readonly Loan[]> => {
    return repo.listByProductId(productId);
  };
