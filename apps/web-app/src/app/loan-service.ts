import { Loan, LoanId, LoanProductDTO, ProductId, UserId } from "../domain/loans";
import { Product } from "./product-service";

export type CreateLoanInput = {
  readonly productId: ProductId;
  readonly returnDate: Date;
}

export type CreateLoanOutput = {
  readonly product: Product;
  readonly message: string;
}

export type ListLoansInput = {
	readonly userId?: UserId;
}
export type ListLoansOutput = {
	readonly loans: LoanProductDTO[];
}

export type ReturnLoanInput = {
	readonly loanId: LoanId;
}

export type ReturnLoanOutput = {
	readonly loan: Loan;
}

export type ListPendingApprovalsOutput = {
	readonly loans: LoanProductDTO[];
}

export type ApproveLoanInput = {
	readonly loanId: LoanId;
}

export type ApproveLoanOutput = {
	readonly loan: Loan;
}

export type RejectLoanInput = {
	readonly loanId: LoanId;
}

export type RejectLoanOutput = {
	readonly loan: Loan;
}

export interface LoanService {
  createLoan(input: CreateLoanInput): Promise<CreateLoanOutput>;
	listLoans(input: ListLoansInput): Promise<ListLoansOutput>;
	returnLoan(input: ReturnLoanInput): Promise<ReturnLoanOutput>;
	listPendingApprovals(): Promise<ListPendingApprovalsOutput>;
	approveLoan(input: ApproveLoanInput): Promise<ApproveLoanOutput>;
	rejectLoan(input: RejectLoanInput): Promise<RejectLoanOutput>;
}