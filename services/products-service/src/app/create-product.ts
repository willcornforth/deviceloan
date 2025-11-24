// Create product use case - application layer

import {
	Product,
	CreateProductParams,
	ProductResult,
	ValidationError,
	createProduct as createProductDomain,
} from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface CreateProductDeps {
	readonly repo: ProductRepo;
	readonly params: CreateProductParams;
}

export interface CreateProductSuccess {
	readonly success: true;
	readonly product: Product;
}

export interface CreateProductError {
	readonly success: false;
	readonly errors: readonly ValidationError[];
}

export type CreateProductResult = CreateProductSuccess | CreateProductError;

export const createProductUseCase = async (
	deps: CreateProductDeps
): Promise<CreateProductResult> => {
	const result: ProductResult = createProductDomain(deps.params);

	if (result.success === false) {
		return { success: false, errors: result.errors };
	}

	const savedProduct = await deps.repo.create(result.product);
	return { success: true, product: savedProduct };
};
