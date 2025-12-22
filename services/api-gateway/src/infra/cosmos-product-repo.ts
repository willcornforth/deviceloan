// Cosmos DB implementation of ProductRepo - infrastructure layer

import { CosmosClient, Container } from '@azure/cosmos';
import {
	Product,
	ProductId,
	ProductCategory,
	ProductStatus,
	ProductRepo,
	ConcurrencyError,
} from '../domain/product';

// Internal DTO type for Cosmos DB container shape
interface ProductDocument {
	id: string;
	name: string;
	description: string;
	category: string;
	serialNumber: string;
	status: string;
	image?: string;
	createdAt: string;
	_ts?: number;
	_etag?: string;
	reservedBy?: string;
	reservedAt?: string;
}

export interface CosmosProductRepoOptions {
	readonly endpoint: string;
	readonly key?: string; // Optional for access-key auth
	readonly databaseId: string;
	readonly containerId: string;
}

export class CosmosProductRepo implements ProductRepo {
	private readonly container: Container;

	constructor(options: CosmosProductRepoOptions) {
		const clientOptions = options.key
			? { endpoint: options.endpoint, key: options.key }
			: { endpoint: options.endpoint };

		const client = new CosmosClient(clientOptions);
		this.container = client
			.database(options.databaseId)
			.container(options.containerId);
	}

	async create(product: Product): Promise<Product> {
		const document = this.toDocument(product);

		const { resource } = await this.container.items.create(document);

		if (!resource) {
			throw new Error('Failed to create product in Cosmos DB');
		}

		return this.toDomain(resource);
	}

	async getById(id: ProductId): Promise<Product | null> {
		try {
			const { resource } = await this.container
				.item(id, id)
				.read<ProductDocument>();

			return resource ? this.toDomain(resource) : null;
		} catch (error: any) {
			if (error.code === 404) {
				return null;
			}
			throw error;
		}
	}

	async list(availableOnly: boolean): Promise<Product[]> {
		const { resources } = await this.container.items
			.readAll<ProductDocument>()
			.fetchAll();

		return availableOnly
			? resources
				.filter((doc) => doc.status === 'available')
				.map((doc) => this.toDomain(doc))
			: resources.map((doc) => this.toDomain(doc));
	}

	async update(product: Product): Promise<Product> {
		const document = this.toDocument(product);

		const { resource } = await this.container
			.item(product.id, product.id)
			.replace(document);

		if (!resource) {
			throw new Error('Failed to update product in Cosmos DB');
		}

		return this.toDomain(resource);
	}

	async delete(id: ProductId): Promise<void> {
		await this.container.item(id, id).delete();
	}

	async updateWithEtag(
		product: Product,
		etag: string
	): Promise<Product | ConcurrencyError> {
		const document = this.toDocument(product);

		try {
			const { resource } = await this.container
				.item(product.id, product.id)
				.replace(document, {
					accessCondition: {
						type: 'IfMatch',
						condition: etag,
					},
				});

			if (!resource) {
				throw new Error('Failed to update product in Cosmos DB');
			}

			return this.toDomain(resource);
		} catch (error: any) {
			// 412 Precondition Failed = ETag mismatch (concurrent modification)
			if (error.code === 412) {
				return {
					type: 'concurrency-error',
					message: 'Product was modified by another request',
				};
			}
			throw error;
		}
	}

	// Mapping functions - convert between domain and DTO
	private toDocument(product: Product): ProductDocument {
		return {
			id: product.id,
			name: product.name,
			description: product.description,
			category: product.category,
			serialNumber: product.serialNumber,
			status: product.status,
			image: product.image,
			createdAt: product.createdAt.toISOString(),
			reservedBy: product.reservedBy,
			reservedAt: product.reservedAt?.toISOString(),
		};
	}

	private toDomain(document: ProductDocument): Product {
		return {
			id: document.id,
			name: document.name,
			description: document.description,
			category: document.category as ProductCategory,
			serialNumber: document.serialNumber,
			status: document.status as ProductStatus,
			image: document.image,
			createdAt: new Date(document.createdAt),
			_etag: document._etag,
			reservedBy: document.reservedBy,
			reservedAt: document.reservedAt
				? new Date(document.reservedAt)
				: undefined,
		};
	}
}
