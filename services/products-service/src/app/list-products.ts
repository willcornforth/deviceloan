// List products use case - application layer

import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface ListProductsDeps {
	readonly repo: ProductRepo;
	readonly availableOnly?: boolean;
}

export const listProducts = async (
	deps: ListProductsDeps
): Promise<readonly Product[]> => {
	return deps.repo.list(deps.availableOnly ?? false);
};
