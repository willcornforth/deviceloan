import { Loan } from "../domain/loan";
import { LoanRepo } from "../domain/loan-repo";

export const listPendingApprovalLoans =
	(repo: LoanRepo) => async (): Promise<readonly Loan[]> => {
		return repo.listPendingApproval();
	};
