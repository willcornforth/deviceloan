// Integration tests for CosmosProductRepo
// These tests require Cosmos DB

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CosmosProductRepo } from '../../../infra/cosmos-product-repo';
import type { Product } from '../../../domain/product';
import { CosmosClient } from '@azure/cosmos';

// Check if Cosmos DB is available
const isCosmosAvailable = async () => {
	try {
		const endpoint =
			process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
		const key =
			process.env.COSMOS_KEY ||
			'KEY';

		const client = new CosmosClient({ endpoint, key });
		await client.getDatabaseAccount();
		return true;
	} catch {
		return false;
	}
};

describe.skipIf(!(await isCosmosAvailable()))(
	'CosmosProductRepo Integration Tests',
	() => {
		let repo: CosmosProductRepo;
		const testDatabaseId = 'TestProductsDB';
		const testContainerId = 'TestProducts';

		beforeAll(async () => {
			const endpoint =
				process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
			const key =
				process.env.COSMOS_KEY ||
				'KEY';

			// Set environment variables for the repo
			process.env.COSMOS_ENDPOINT = endpoint;
			process.env.COSMOS_KEY = key;
			process.env.COSMOS_DATABASE_ID = testDatabaseId;
			process.env.COSMOS_CONTAINER_ID = testContainerId;

			// Create test database and container
			const client = new CosmosClient({ endpoint, key });
			const { database } = await client.databases.createIfNotExists({
				id: testDatabaseId,
			});
			await database.containers.createIfNotExists({
				id: testContainerId,
				partitionKey: { paths: ['/id'] },
			});

			repo = new CosmosProductRepo();
		});

		afterAll(async () => {
			// Clean up test database
			const endpoint =
				process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
			const key =
				process.env.COSMOS_KEY ||
				'KEY';

			const client = new CosmosClient({ endpoint, key });
			await client.database(testDatabaseId).delete();
		});

		it('should create and retrieve a product', async () => {
			const product: Product = {
				id: 'prod-test-001',
				name: 'Test Laptop',
				serialNumber: 'SN-TEST-001',
				description: 'A test laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);

			expect(created.id).toBe(product.id);
			expect(created.name).toBe(product.name);
			expect(created.status).toBe(product.status);

			const retrieved = await repo.getById(product.id);

			expect(retrieved).toBeDefined();
			expect(retrieved!.id).toBe(product.id);
		});

		it('should update a product', async () => {
			const product: Product = {
				id: `prod-test-${Date.now()}`,
				name: 'Test Phone',
				serialNumber: 'SN-TEST-002',
				description: 'A test phone',
				category: 'phone',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);

			const updated = await repo.update({
				...created,
				status: 'reserved',
				reservedBy: 'user-123',
				reservedAt: new Date(),
			});

			expect(updated.status).toBe('reserved');
			expect(updated.reservedBy).toBe('user-123');
			expect(updated.reservedAt).toBeDefined();
		});

		it('should delete a product', async () => {
			const product: Product = {
				id: `prod-test-${Date.now()}`,
				name: 'Test Tablet',
				serialNumber: 'SN-TEST-003',
				description: 'A test tablet',
				category: 'tablet',
				status: 'available',
				createdAt: new Date(),
			};

			await repo.create(product);
			await repo.delete(product.id);

			const retrieved = await repo.getById(product.id);
			expect(retrieved).toBeNull();
		});

		it('should list all products', async () => {
			const product1: Product = {
				id: `prod-list-${Date.now()}-1`,
				name: 'List Test 1',
				serialNumber: 'SN-LIST-001',
				description: 'List test product 1',
				category: 'monitor',
				status: 'available',
				createdAt: new Date(),
			};

			const product2: Product = {
				id: `prod-list-${Date.now()}-2`,
				name: 'List Test 2',
				serialNumber: 'SN-LIST-002',
				description: 'List test product 2',
				category: 'accessory',
				status: 'available',
				createdAt: new Date(),
			};

			await repo.create(product1);
			await repo.create(product2);

			const products = await repo.list();

			expect(products.length).toBeGreaterThanOrEqual(2);
			expect(
				products.some((p) => p.id === product1.id)
			).toBe(true);
			expect(
				products.some((p) => p.id === product2.id)
			).toBe(true);
		});

		it('should return null for non-existent product', async () => {
			const retrieved = await repo.getById('non-existent-id');
			expect(retrieved).toBeNull();
		});
	}
);
