export type LoanId = string;
export type UserId = string;
export type ProductId = string;

export enum LoanStatus {
  Active = "Active",
  Returned = "Returned",
  Overdue = "Overdue",
  Cancelled = "Cancelled",
}

export interface Loan {
  readonly id: LoanId;
  readonly productId: ProductId;
  readonly userId: UserId;
  readonly status: LoanStatus;
  readonly loanDate: Date;
  readonly dueDate: Date;
  readonly returnDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CreateLoanInput = {
  readonly productId: ProductId;
  readonly returnDate: Date;
}

export type CreateLoanOutput = {
  readonly loan: Loan;
}

export type ListLoansInput = {
  readonly userId?: UserId;
  readonly productId?: ProductId;
  readonly status?: LoanStatus;
}

export type ListLoansOutput = {
  readonly loans: readonly Loan[];
  readonly count: number;
}

export type GetLoanInput = {
  readonly loanId: LoanId;
}

export type GetLoanOutput = {
  readonly loan: Loan;
}

export type ReturnLoanInput = {
  readonly loanId: LoanId;
}

export type ReturnLoanOutput = {
  readonly loan: Loan;
}

export interface LoanService {
  createLoan(input: CreateLoanInput): Promise<CreateLoanOutput>;
  listLoans(input?: ListLoansInput): Promise<ListLoansOutput>;
  getLoan(input: GetLoanInput): Promise<GetLoanOutput>;
  returnLoan(input: ReturnLoanInput): Promise<ReturnLoanOutput>;
}