// Product repository interface - pure domain abstraction

import { Product, ProductId } from './product';

export interface ProductRepo {
	readonly create: (product: Product) => Promise<Product>;
	readonly getById: (id: ProductId) => Promise<Product | null>;
	readonly list: (availableOnly: boolean) => Promise<readonly Product[]>;
	readonly update: (product: Product) => Promise<Product>;
	readonly delete: (id: ProductId) => Promise<void>;
}
