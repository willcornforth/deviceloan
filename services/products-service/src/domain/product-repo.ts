// Product repository interface - pure domain abstraction

import { Product, ProductId } from './product';

export interface ProductRepo {
	readonly create: (product: Product) => Promise<Product>;
	readonly getById: (id: ProductId) => Promise<Product | null>;
	readonly list: () => Promise<readonly Product[]>;
}
