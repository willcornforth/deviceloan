// Update product use case - application layer

import {
	Product,
	ProductId,
	ProductCategory,
	ProductStatus,
} from '../domain/product';
import { ProductRepo } from '../domain/product-repo';
import { ProductEventPublisher } from '../infra/eventgrid-products-publisher';

export interface UpdateProductParams {
	readonly name?: string;
	readonly description?: string;
	readonly category?: ProductCategory;
	readonly status?: ProductStatus;
	readonly image?: string;
}

export interface UpdateProductDeps {
	readonly repo: ProductRepo;
	readonly id: ProductId;
	readonly params: UpdateProductParams;
	readonly publisher: ProductEventPublisher;
}

export interface UpdateProductSuccess {
	readonly success: true;
	readonly product: Product;
}

export interface UpdateProductNotFound {
	readonly success: false;
	readonly reason: 'not-found';
}

export type UpdateProductResult = UpdateProductSuccess | UpdateProductNotFound;

export const updateProduct = async (
	deps: UpdateProductDeps
): Promise<UpdateProductResult> => {
	const existing = await deps.repo.getById(deps.id);

	if (!existing) {
		return { success: false, reason: 'not-found' };
	}

	const updated: Product = {
		...existing,
		name: deps.params.name?.trim() ?? existing.name,
		description: deps.params.description?.trim() ?? existing.description,
		category: deps.params.category ?? existing.category,
		status: deps.params.status ?? existing.status,
		image: deps.params.image ?? existing.image,
	};

	const savedProduct = await deps.repo.update(updated);
	
	// Publish event for projections
	await deps.publisher.publishProductUpdated(savedProduct);
	
	return { success: true, product: savedProduct };
};
