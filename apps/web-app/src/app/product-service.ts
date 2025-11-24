export type ProductId = string;

export type ProductCategory =
	| 'laptop'
	| 'phone'
	| 'tablet'
	| 'monitor'
	| 'accessory';

export type ProductStatus =
	| 'available'
	| 'on-loan'
	| 'maintenance'
	| 'retired';

export type Product = {
	readonly id: ProductId;
	readonly name: string;
	readonly serialNumber: string;
	readonly description: string;
	readonly category: ProductCategory;
	readonly status: ProductStatus;
	readonly image?: string;
	readonly createdAt: Date;
}

export type ListProductOutput = {
	readonly availableOnly: boolean;
	readonly products: Product[];
	readonly count: number;
}

export interface ProductService {
	listProducts(): Promise<ListProductOutput>;
}