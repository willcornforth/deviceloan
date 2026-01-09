import { Product } from "./products";

export enum LoanStatus {
	PendingApproval = "PendingApproval",
	Active = "Active",
	Returned = "Returned",
	Overdue = "Overdue",
	Cancelled = "Cancelled",
	Rejected = "Rejected",
}

export type LoanId = string;
export type UserId = string;
export type ProductId = string;

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

export interface LoanProductDTO {
	id: string;
	productId: string;
	userId: string;
	status: LoanStatus;
	loanDate: Date;
	dueDate: Date;
	returnDate?: Date;
	createdAt: Date;
	updatedAt: Date;
	product?: Product;
}