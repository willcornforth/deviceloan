// Product projection domain model - read-only view for API Gateway

export type ProductId = string;

export type ProductCategory =
	| 'laptop'
	| 'phone'
	| 'tablet'
	| 'monitor'
	| 'accessory';

export type ProductStatus = 'available' | 'reserved' | 'on-loan' | 'maintenance' | 'retired';

export interface Product {
	readonly id: ProductId;
	readonly name: string;
	readonly serialNumber: string;
	readonly description: string;
	readonly category: ProductCategory;
	readonly status: ProductStatus;
	readonly image?: string;
	readonly createdAt: Date;
	readonly reservedBy?: string;
	readonly reservedAt?: Date;
}

export interface ProductRepo {
	create(product: Product): Promise<Product>;
	update(product: Product): Promise<Product>;
	delete(id: ProductId): Promise<void>;
	getById(id: ProductId): Promise<Product | null>;
	list(): Promise<Product[]>;
}
