// List products use case - application layer

import { Product, ProductRepo } from "../domain/product";

export interface ListProductsDeps {
	readonly repo: ProductRepo;
	readonly availableOnly?: boolean;
}

export const listProducts = async (
	deps: ListProductsDeps
): Promise<readonly Product[]> => {
	//Test
	return deps.repo.list(deps.availableOnly ?? false); 
};