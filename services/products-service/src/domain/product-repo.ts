// Product repository interface - pure domain abstraction

import { Product, ProductId } from './product';

export interface ConcurrencyError {
	readonly type: 'concurrency-error';
	readonly message: string;
}

export interface ProductRepo {
	readonly create: (product: Product) => Promise<Product>;
	readonly getById: (id: ProductId) => Promise<Product | null>;
	readonly list: (availableOnly: boolean) => Promise<readonly Product[]>;
	readonly update: (product: Product) => Promise<Product>;
	readonly updateWithEtag: (
		product: Product,
		etag: string
	) => Promise<Product | ConcurrencyError>;
	readonly delete: (id: ProductId) => Promise<void>;
}
