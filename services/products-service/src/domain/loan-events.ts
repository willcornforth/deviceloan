// Shared Event Grid event types for loan domain events

export const LoanEventTypes = {
	Approved: 'Loan.Approved',
	Returned: 'Loan.Returned',
	Extended: 'Loan.Extended',
	Overdue: 'Loan.Overdue',
	CreationFailed: 'Loan.CreationFailed',
} as const;

export type LoanEventType =
	(typeof LoanEventTypes)[keyof typeof LoanEventTypes];

// Base event data shared across loan events
export interface BaseLoanEventData {
	readonly id: string;
	readonly userId: string;
	readonly productId: string;
}

// Loan.Approved event data
export interface LoanApprovedEventData extends BaseLoanEventData {
	readonly dueDate: string;
}

// Loan.Returned event data
export interface LoanReturnedEventData extends BaseLoanEventData {
	readonly returnedAt: string;
}

// Loan.Extended event data
export interface LoanExtendedEventData extends BaseLoanEventData {
	readonly previousDueDate: string;
	readonly newDueDate: string;
}

// Loan.Overdue event data
export interface LoanOverdueEventData extends BaseLoanEventData {
	readonly dueDate: string;
	readonly daysOverdue: number;
}

// Loan.CreationFailed event data
export interface LoanCreationFailedEventData extends BaseLoanEventData {
	readonly reason: string;
	readonly failedAt: string;
}
