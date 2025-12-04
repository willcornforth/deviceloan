// Reserve product use case - application layer
// Uses optimistic concurrency (ETag) to handle concurrent reservations

import { Product, ProductId } from '../domain/product';
import { ProductRepo, ConcurrencyError } from '../domain/product-repo';
import {
	ProductEventPublisher,
	ProductReservedEventData,
} from '../infra/eventgrid-products-publisher';

export interface ReserveProductParams {
	readonly userId: string;
	readonly returnDate: string;
}

export interface ReserveProductDeps {
	readonly repo: ProductRepo;
	readonly productId: ProductId;
	readonly params: ReserveProductParams;
	readonly eventPublisher?: ProductEventPublisher;
}

export interface ReserveProductSuccess {
	readonly success: true;
	readonly product: Product;
}

export interface ReserveProductNotFound {
	readonly success: false;
	readonly reason: 'not-found';
	readonly productId: ProductId;
}

export interface ReserveProductNotAvailable {
	readonly success: false;
	readonly reason: 'not-available';
	readonly productId: ProductId;
	readonly currentStatus: string;
}

export interface ReserveProductConcurrencyError {
	readonly success: false;
	readonly reason: 'concurrency-conflict';
	readonly productId: ProductId;
	readonly message: string;
}

export type ReserveProductResult =
	| ReserveProductSuccess
	| ReserveProductNotFound
	| ReserveProductNotAvailable
	| ReserveProductConcurrencyError;

const isConcurrencyError = (
	result: Product | ConcurrencyError
): result is ConcurrencyError => {
	return (result as ConcurrencyError).type === 'concurrency-error';
};

export const reserveProduct = async (
	deps: ReserveProductDeps
): Promise<ReserveProductResult> => {
	const { repo, productId, params, eventPublisher } = deps;

	const product = await repo.getById(productId);

	if (!product) {
		return {
			success: false,
			reason: 'not-found',
			productId,
		};
	}

	if (product.status !== 'available') {
		return {
			success: false,
			reason: 'not-available',
			productId,
			currentStatus: product.status,
		};
	}

	if (!product._etag) {
		throw new Error('Product is missing _etag for concurrency control');
	}

	const reservedProduct: Product = {
		...product,
		status: 'reserved',
		reservedBy: params.userId,
		reservedAt: new Date(),
	};

	const result = await repo.updateWithEtag(reservedProduct, product._etag);

	if (isConcurrencyError(result)) {
		return {
			success: false,
			reason: 'concurrency-conflict',
			productId,
			message: result.message,
		};
	}

	// Publish Product.Reserved event
	if (eventPublisher && result.reservedAt) {
		const eventData: ProductReservedEventData = {
			productId: result.id,
			productName: result.name,
			serialNumber: result.serialNumber,
			category: result.category,
			reservedBy: result.reservedBy!,
			reservedAt: result.reservedAt.toISOString(),
			returnDate: params.returnDate,
		};
		await eventPublisher.publishProductReserved(eventData);
	}

	return {
		success: true,
		product: result,
	};
};
