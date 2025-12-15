// Delete product use case - application layer

import { ProductId } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';
import { ProductEventPublisher } from '../infra/eventgrid-products-publisher';

export interface DeleteProductDeps {
	readonly repo: ProductRepo;
	readonly id: ProductId;
	readonly publisher: ProductEventPublisher;
}

export interface DeleteProductSuccess {
	readonly success: true;
}

export interface DeleteProductNotFound {
	readonly success: false;
	readonly reason: 'not-found';
}

export type DeleteProductResult = DeleteProductSuccess | DeleteProductNotFound;

export const deleteProduct = async (
	deps: DeleteProductDeps
): Promise<DeleteProductResult> => {
	const existing = await deps.repo.getById(deps.id);

	if (!existing) {
		return { success: false, reason: 'not-found' };
	}

	await deps.repo.delete(deps.id);
	
	// Publish event for projections
	await deps.publisher.publishProductDeleted(deps.id);
	
	return { success: true };
};
