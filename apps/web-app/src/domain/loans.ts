import { Product } from "./products";

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
	product: Product
}