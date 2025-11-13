export type ProductId = string;

export type ProductCategory =
	| 'laptop'
	| 'phone'
	| 'tablet'
	| 'monitor'
	| 'accessory';

export type Product {
	readonly id: ProductId;
	readonly name: string;
	readonly description: string;
	readonly category: ProductCategory;
	readonly stockQuantity: number;
	readonly createdAt: Date;
}

export type ListProductOutput = {
    readonly products: Product[];
    readonly count: number;
}

export interface ProductService {
    listProducts(): Promise<ListProductOutput>;
}