// Cosmos DB repository for product projection in API Gateway

import { CosmosClient, Database, Container } from '@azure/cosmos';
import { Product, ProductId, ProductRepo } from '../domain/product';

export class CosmosProductRepo implements ProductRepo {
	private client: CosmosClient;
	private database: Database;
	private container: Container;

	constructor() {
		const endpoint = process.env.COSMOS_ENDPOINT;
		const key = process.env.COSMOS_KEY;
		const databaseId = process.env.COSMOS_DATABASE_ID || 'device-loan';
		const containerId = process.env.COSMOS_CONTAINER_ID || 'product-projection';

		if (!endpoint || !key) {
			throw new Error('Missing Cosmos DB configuration: COSMOS_ENDPOINT and COSMOS_KEY are required');
		}

		this.client = new CosmosClient({ endpoint, key });
		this.database = this.client.database(databaseId);
		this.container = this.database.container(containerId);
	}

	async create(product: Product): Promise<Product> {
		const { resource } = await this.container.items.create({
			...product,
			createdAt: product.createdAt.toISOString(),
			reservedAt: product.reservedAt?.toISOString(),
		});

		return this.mapToProduct(resource);
	}

	async update(product: Product): Promise<Product> {
		const { resource } = await this.container.item(product.id, product.id).replace({
			...product,
			createdAt: product.createdAt.toISOString(),
			reservedAt: product.reservedAt?.toISOString(),
		});

		return this.mapToProduct(resource);
	}

	async delete(id: ProductId): Promise<void> {
		await this.container.item(id, id).delete();
	}

	async getById(id: ProductId): Promise<Product | null> {
		try {
			const { resource } = await this.container.item(id, id).read();
			return resource ? this.mapToProduct(resource) : null;
		} catch (error: any) {
			if (error.code === 404) {
				return null;
			}
			throw error;
		}
	}

	async list(): Promise<Product[]> {
		const querySpec = {
			query: 'SELECT * FROM c ORDER BY c.name ASC',
		};

		const { resources } = await this.container.items
			.query(querySpec)
			.fetchAll();

		return resources.map(this.mapToProduct);
	}

	private mapToProduct(item: any): Product {
		return {
			id: item.id,
			name: item.name,
			serialNumber: item.serialNumber,
			description: item.description,
			category: item.category,
			status: item.status,
			image: item.image,
			createdAt: new Date(item.createdAt),
			reservedBy: item.reservedBy,
			reservedAt: item.reservedAt ? new Date(item.reservedAt) : undefined,
		};
	}
}

// Singleton instance
let repoInstance: ProductRepo | null = null;

export const getProductRepo = (): ProductRepo => {
	if (!repoInstance) {
		repoInstance = new CosmosProductRepo();
	}
	return repoInstance;
};
