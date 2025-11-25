// Handle loan created use case - application layer

import { ProductId, loanOutProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface LoanCreatedEvent {
	readonly id: string;
	readonly userId: string;
	readonly productId: ProductId;
	readonly dueDate: string;
}

export interface HandleLoanCreatedDeps {
	readonly repo: ProductRepo;
	readonly event: LoanCreatedEvent;
}

export interface HandleLoanCreatedSuccess {
	readonly success: true;
	readonly productId: ProductId;
}

export interface HandleLoanCreatedNotFound {
	readonly success: false;
	readonly reason: 'product-not-found';
	readonly productId: ProductId;
}

export interface HandleLoanCreatedAlreadyLoaned {
	readonly success: false;
	readonly reason: 'already-on-loan';
	readonly productId: ProductId;
}

export type HandleLoanCreatedResult =
	| HandleLoanCreatedSuccess
	| HandleLoanCreatedNotFound
	| HandleLoanCreatedAlreadyLoaned;

export const handleLoanCreated = async (
	deps: HandleLoanCreatedDeps
): Promise<HandleLoanCreatedResult> => {
	const { repo, event } = deps;

	const product = await repo.getById(event.productId);

	if (!product) {
		return {
			success: false,
			reason: 'product-not-found',
			productId: event.productId,
		};
	}

	if (product.status === 'on-loan') {
		return {
			success: false,
			reason: 'already-on-loan',
			productId: event.productId,
		};
	}

	const updatedProduct = loanOutProduct(product);
	await repo.update(updatedProduct);

	return { success: true, productId: event.productId };
};
