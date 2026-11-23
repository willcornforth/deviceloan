// Application logic for handling loan rejection
// Unreserves the product when a loan is rejected

import { ProductId } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';
import { unreserveProduct } from './unreserve-product';

export interface LoanRejectedEvent {
	readonly id: string;
	readonly userId: string;
	readonly productId: ProductId;
}

export interface HandleLoanRejectedDeps {
	readonly repo: ProductRepo;
	readonly event: LoanRejectedEvent;
}

export const handleLoanRejected = async (
	deps: HandleLoanRejectedDeps
): Promise<void> => {
	const { repo, event } = deps;

	// Unreserve the product using the existing use case
	const result = await unreserveProduct({
		repo,
		productId: event.productId,
	});

	if (!result.success) {
		throw new Error(`Product ${event.productId} not found`);
	}
};
