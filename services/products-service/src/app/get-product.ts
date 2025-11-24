// Get product use case - application layer

import { Product, ProductId } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface GetProductDeps {
	readonly repo: ProductRepo;
	readonly id: ProductId;
}

export const getProduct = async (
	deps: GetProductDeps
): Promise<Product | null> => {
	return deps.repo.getById(deps.id);
};
