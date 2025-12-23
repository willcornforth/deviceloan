export interface ProductReleasedEvent {
	productId: string;
	name: string;
	category: string;
}

export interface LoanApprovedEvent {
	loanId: string;
	userId: string;
	productId: string;
	productName: string;
	returnDate: string;
}

export interface LoanRejectedEvent {
	loanId: string;
	userId: string;
	productId: string;
	productName: string;
	reason?: string;
}

export interface LoanReturnedEvent {
	loanId: string;
	userId: string;
	productId: string;
	productName: string;
	returnedAt: string;
}
