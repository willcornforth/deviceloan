// Unreserve product use case - application layer
// Releases a reserved product back to available status

import { Product, ProductId } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface UnreserveProductDeps {
	readonly repo: ProductRepo;
	readonly productId: ProductId;
}

export interface UnreserveProductSuccess {
	readonly success: true;
	readonly product: Product;
	readonly wasReserved: boolean;
}

export interface UnreserveProductNotFound {
	readonly success: false;
	readonly reason: 'not-found';
	readonly productId: ProductId;
}

export type UnreserveProductResult =
	| UnreserveProductSuccess
	| UnreserveProductNotFound;

export const unreserveProduct = async (
	deps: UnreserveProductDeps
): Promise<UnreserveProductResult> => {
	const { repo, productId } = deps;

	const product = await repo.getById(productId);

	if (!product) {
		return {
			success: false,
			reason: 'not-found',
			productId,
		};
	}

	// Idempotent: if already available, treat as success
	if (product.status === 'available') {
		return {
			success: true,
			product,
			wasReserved: false,
		};
	}

	// Only unreserve if currently reserved
	if (product.status !== 'reserved') {
		// Product is in another state (on-loan, maintenance, retired)
		// Still return success for idempotency but indicate it wasn't reserved
		return {
			success: true,
			product,
			wasReserved: false,
		};
	}

	const unreservedProduct: Product = {
		...product,
		status: 'available',
		reservedBy: undefined,
		reservedAt: undefined,
	};

	const updatedProduct = await repo.update(unreservedProduct);

	return {
		success: true,
		product: updatedProduct,
		wasReserved: true,
	};
};
