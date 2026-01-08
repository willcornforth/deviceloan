// Product projection domain model - read-only view for API Gateway

export type ProductId = string;

export type ProductCategory =
	| 'laptop'
	| 'phone'
	| 'tablet'
	| 'monitor'
	| 'accessory';

export type ProductStatus = 'available' | 'reserved' | 'on-loan' | 'maintenance' | 'retired';

export interface ConcurrencyError {
	readonly type: 'concurrency-error';
	readonly message: string;
}

export interface Product {
	readonly id: ProductId;
	readonly name: string;
	readonly serialNumber: string;
	readonly description: string;
	readonly category: ProductCategory;
	readonly status: ProductStatus;
	readonly image?: string;
	readonly createdAt: Date;
	readonly _etag?: string;
	readonly reservedBy?: string;
	readonly reservedAt?: Date;
}

export interface ProductRepo {
	readonly create: (product: Product) => Promise<Product>;
	readonly getById: (id: ProductId) => Promise<Product | null>;
	readonly list: (availableOnly: boolean) => Promise<Product[]>;
	readonly update: (product: Product) => Promise<Product>;
	readonly updateWithEtag: (
		product: Product,
		etag: string
	) => Promise<Product | ConcurrencyError>;
	readonly delete: (id: ProductId) => Promise<void>;
}

