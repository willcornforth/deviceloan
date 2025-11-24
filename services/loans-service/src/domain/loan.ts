export enum LoanStatus {
  Active = "Active",
  Returned = "Returned",
  Overdue = "Overdue",
  Cancelled = "Cancelled",
}

export interface Loan {
  id: string;
  productId: string;
  userId: string;
  status: LoanStatus;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLoanRequest {
  productId: string;
  userId: string;
  dueDate: Date;
}

export interface UpdateLoanRequest {
  status?: LoanStatus;
  dueDate?: Date;
  returnDate?: Date;
}

export function createLoan(request: CreateLoanRequest): Loan {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    productId: request.productId,
    userId: request.userId,
    status: LoanStatus.Active,
    loanDate: now,
    dueDate: request.dueDate,
    returnDate: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function returnLoan(loan: Loan): Loan {
  const now = new Date();
  return {
    ...loan,
    status: LoanStatus.Returned,
    returnDate: now,
    updatedAt: now,
  };
}

export function updateLoan(loan: Loan, updates: UpdateLoanRequest): Loan {
  return {
    ...loan,
    ...updates,
    updatedAt: new Date(),
  };
}
