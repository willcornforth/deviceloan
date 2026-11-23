import {
  Loan,
  CreateLoanRequest,
  createLoan as createLoanEntity,
} from "../domain/loan";
import { LoanRepo } from "../domain/loan-repo";

export const createLoan =
  (repo: LoanRepo) =>
  async (request: CreateLoanRequest): Promise<Loan> => {
    const loan = createLoanEntity(request);
    return repo.create(loan);
  };
