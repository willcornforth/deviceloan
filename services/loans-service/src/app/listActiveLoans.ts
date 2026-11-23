import { Loan } from "../domain/loan";
import { LoanRepo } from "../domain/loan-repo";

export const listActiveLoans =
	(repo: LoanRepo) => async (): Promise<readonly Loan[]> => {
		return repo.listActive();
	};
