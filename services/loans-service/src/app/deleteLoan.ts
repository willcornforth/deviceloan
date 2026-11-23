import { LoanId, LoanRepo } from "../domain/loan-repo";

export const deleteLoan =
  (repo: LoanRepo) =>
  async (id: LoanId): Promise<boolean> => {
    const existingLoan = await repo.getById(id);
    if (!existingLoan) {
      return false;
    }

    await repo.delete(id);
    return true;
  };
