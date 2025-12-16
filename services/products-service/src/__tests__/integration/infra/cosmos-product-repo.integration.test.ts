// Integration tests for CosmosProductRepo
// These tests require a running Cosmos DB instance (emulator or Azure)

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CosmosClient } from '@azure/cosmos';
import { CosmosProductRepo } from '../../../infra/cosmos-product-repo';
import type { Product } from '../../../domain/product';

// Test configuration - uses environment variables or defaults to local emulator
const COSMOS_ENDPOINT =
	process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const COSMOS_KEY =
	process.env.COSMOS_KEY ||
	'KEY';
const COSMOS_DATABASE_ID = process.env.COSMOS_DATABASE_ID || 'deviceloan-test';
const COSMOS_CONTAINER_ID = process.env.COSMOS_CONTAINER_ID || 'products-test';

describe('CosmosProductRepo Integration Tests', () => {
	let repo: CosmosProductRepo;
	let cosmosClient: CosmosClient;
	let testProductIds: string[] = [];

	beforeAll(async () => {
		// Initialize Cosmos client
		cosmosClient = new CosmosClient({
			endpoint: COSMOS_ENDPOINT,
			key: COSMOS_KEY,
		});

		// Create test database and container if they don't exist
		const { database } = await cosmosClient.databases.createIfNotExists({
			id: COSMOS_DATABASE_ID,
		});

		await database.containers.createIfNotExists({
			id: COSMOS_CONTAINER_ID,
			partitionKey: { paths: ['/id'] },
		});

		// Initialize repository
		repo = new CosmosProductRepo({
			endpoint: COSMOS_ENDPOINT,
			key: COSMOS_KEY,
			databaseId: COSMOS_DATABASE_ID,
			containerId: COSMOS_CONTAINER_ID,
		});
	}, 30000); // 30 second timeout for setup

	afterAll(async () => {
		// Cleanup: Delete test database
		try {
			await cosmosClient.database(COSMOS_DATABASE_ID).delete();
		} catch (error) {
			console.warn('Failed to cleanup test database:', error);
		}
		await cosmosClient.dispose();
	}, 10000);

	beforeEach(() => {
		// Reset test product tracking
		testProductIds = [];
	});

	describe('create', () => {
		it('should create a product in Cosmos DB', async () => {
			const product: Product = {
				id: `test-${Date.now()}-1`,
				name: 'MacBook Pro',
				serialNumber: 'SN12345',
				description: 'A powerful laptop',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);
			testProductIds.push(created.id);

			expect(created.id).toBe(product.id);
			expect(created.name).toBe(product.name);
			expect(created.serialNumber).toBe(product.serialNumber);
			expect(created.status).toBe('available');
		}, 10000);

		it('should store and retrieve dates correctly', async () => {
			const now = new Date();
			const product: Product = {
				id: `test-${Date.now()}-2`,
				name: 'iPhone 15',
				serialNumber: 'SN67890',
				description: 'A smartphone',
				category: 'phone',
				status: 'available',
				createdAt: now,
			};

			const created = await repo.create(product);
			testProductIds.push(created.id);

			const retrieved = await repo.getById(created.id);

			expect(retrieved).not.toBeNull();
			expect(retrieved!.createdAt).toBeInstanceOf(Date);
			expect(retrieved!.createdAt.getTime()).toBeCloseTo(
				now.getTime(),
				-2
			); // Within 100ms
		}, 10000);
	});

	describe('getById', () => {
		it('should retrieve an existing product', async () => {
			const product: Product = {
				id: `test-${Date.now()}-3`,
				name: 'iPad Pro',
				serialNumber: 'SN11111',
				description: 'A tablet',
				category: 'tablet',
				status: 'available',
				createdAt: new Date(),
			};

			await repo.create(product);
			testProductIds.push(product.id);

			const retrieved = await repo.getById(product.id);

			expect(retrieved).not.toBeNull();
			expect(retrieved!.id).toBe(product.id);
			expect(retrieved!.name).toBe(product.name);
		}, 10000);

		it('should return null for non-existent product', async () => {
			const retrieved = await repo.getById('non-existent-id');
			expect(retrieved).toBeNull();
		}, 10000);
	});

	describe('update', () => {
		it('should update an existing product', async () => {
			const product: Product = {
				id: `test-${Date.now()}-4`,
				name: 'Dell Monitor',
				serialNumber: 'SN22222',
				description: 'Original description',
				category: 'monitor',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);
			testProductIds.push(created.id);

			const updated = await repo.update({
				...created,
				description: 'Updated description',
				status: 'maintenance',
			});

			expect(updated.description).toBe('Updated description');
			expect(updated.status).toBe('maintenance');

			// Verify in database
			const retrieved = await repo.getById(created.id);
			expect(retrieved!.description).toBe('Updated description');
			expect(retrieved!.status).toBe('maintenance');
		}, 10000);

		it('should handle concurrent updates with optimistic locking', async () => {
			const product: Product = {
				id: `test-${Date.now()}-5`,
				name: 'Laptop',
				serialNumber: 'SN33333',
				description: 'Test',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);
			testProductIds.push(created.id);

			// Simulate concurrent update
			await repo.update({ ...created, description: 'First update' });

			// Second update with stale data should fail
			await expect(
				repo.update({ ...created, description: 'Second update' })
			).rejects.toThrow();
		}, 10000);
	});

	describe('delete', () => {
		it('should delete an existing product', async () => {
			const product: Product = {
				id: `test-${Date.now()}-6`,
				name: 'Keyboard',
				serialNumber: 'SN44444',
				description: 'Mechanical keyboard',
				category: 'accessory',
				status: 'available',
				createdAt: new Date(),
			};

			const created = await repo.create(product);
			testProductIds.push(created.id);

			await repo.delete(created.id);

			const retrieved = await repo.getById(created.id);
			expect(retrieved).toBeNull();
		}, 10000);

		it('should not throw when deleting non-existent product', async () => {
			await expect(
				repo.delete('non-existent-id')
			).resolves.not.toThrow();
		}, 10000);
	});

	describe('list', () => {
		it('should list all products', async () => {
			const product1: Product = {
				id: `test-${Date.now()}-7`,
				name: 'Product 1',
				serialNumber: 'SN55555',
				description: 'Test product 1',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			const product2: Product = {
				id: `test-${Date.now()}-8`,
				name: 'Product 2',
				serialNumber: 'SN66666',
				description: 'Test product 2',
				category: 'phone',
				status: 'available',
				createdAt: new Date(),
			};

			await repo.create(product1);
			await repo.create(product2);
			testProductIds.push(product1.id, product2.id);

			const products = await repo.list();

			expect(products.length).toBeGreaterThanOrEqual(2);
			expect(products.some((p) => p.id === product1.id)).toBe(true);
			expect(products.some((p) => p.id === product2.id)).toBe(true);
		}, 10000);
	});

	describe('getBySerialNumber', () => {
		it('should find product by serial number', async () => {
			const serialNumber = `SN-${Date.now()}`;
			const product: Product = {
				id: `test-${Date.now()}-9`,
				name: 'Unique Serial Product',
				serialNumber,
				description: 'Test',
				category: 'laptop',
				status: 'available',
				createdAt: new Date(),
			};

			await repo.create(product);
			testProductIds.push(product.id);

			const found = await repo.getBySerialNumber(serialNumber);

			expect(found).not.toBeNull();
			expect(found!.serialNumber).toBe(serialNumber);
		}, 10000);

		it('should return null for non-existent serial number', async () => {
			const found = await repo.getBySerialNumber('non-existent-serial');
			expect(found).toBeNull();
		}, 10000);
	});
});
