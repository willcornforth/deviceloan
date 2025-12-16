// End-to-end integration tests for product use cases
// Tests the complete flow: Use Case -> Repository -> Cosmos DB -> Event Publisher

import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	beforeEach,
	vi,
} from 'vitest';
import { CosmosClient } from '@azure/cosmos';
import { CosmosProductRepo } from '../../../infra/cosmos-product-repo';
import { createProductUseCase } from '../../../app/create-product';
import { updateProduct } from '../../../app/update-product';
import { deleteProduct } from '../../../app/delete-product';
import type { Product } from '../../../domain/product';

// Mock Event Grid publisher to avoid external dependencies
const mockPublishProductEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../infra/eventgrid-products-publisher', () => ({
	publishProductEvent: mockPublishProductEvent,
	ProductEventTypes: {
		Created: 'Product.Created',
		Updated: 'Product.Updated',
		Deleted: 'Product.Deleted',
		Reserved: 'Product.Reserved',
		Released: 'Product.Released',
	},
}));

// Test configuration
const COSMOS_ENDPOINT =
	process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const COSMOS_KEY =
	process.env.COSMOS_KEY ||
	'KEY';
const COSMOS_DATABASE_ID =
	process.env.COSMOS_DATABASE_ID || 'deviceloan-e2e-test';
const COSMOS_CONTAINER_ID =
	process.env.COSMOS_CONTAINER_ID || 'products-e2e-test';

describe('Product Use Cases - End-to-End Integration', () => {
	let repo: CosmosProductRepo;
	let cosmosClient: CosmosClient;
	let testProductIds: string[] = [];

	beforeAll(async () => {
		// Initialize Cosmos client and test database
		cosmosClient = new CosmosClient({
			endpoint: COSMOS_ENDPOINT,
			key: COSMOS_KEY,
		});

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
	}, 30000);

	afterAll(async () => {
		// Cleanup test database
		try {
			await cosmosClient.database(COSMOS_DATABASE_ID).delete();
		} catch (error) {
			console.warn('Failed to cleanup test database:', error);
		}
		await cosmosClient.dispose();
	}, 10000);

	beforeEach(() => {
		testProductIds = [];
		mockPublishProductEvent.mockClear();
	});

	describe('Create Product - Full Flow', () => {
		it('should create product in database and publish event', async () => {
			const result = await createProductUseCase(
				{
					id: `e2e-${Date.now()}-1`,
					name: 'MacBook Pro',
					serialNumber: 'E2E-SN-001',
					description: 'End-to-end test laptop',
					category: 'laptop',
				},
				{ productRepo: repo }
			);

			expect(result.success).toBe(true);
			if (!result.success) return;

			testProductIds.push(result.product.id);

			// Verify product in database
			const retrieved = await repo.getById(result.product.id);
			expect(retrieved).not.toBeNull();
			expect(retrieved!.name).toBe('MacBook Pro');
			expect(retrieved!.status).toBe('available');

			// Verify event was published
			expect(mockPublishProductEvent).toHaveBeenCalledTimes(1);
			expect(mockPublishProductEvent).toHaveBeenCalledWith(
				'Product.Created',
				expect.objectContaining({
					id: result.product.id,
					name: 'MacBook Pro',
				})
			);
		}, 15000);

		it('should fail when serial number already exists', async () => {
			const serialNumber = `E2E-DUP-${Date.now()}`;

			// Create first product
			const first = await createProductUseCase(
				{
					id: `e2e-${Date.now()}-2`,
					name: 'Product 1',
					serialNumber,
					description: 'First product',
					category: 'laptop',
				},
				{ productRepo: repo }
			);

			if (first.success) {
				testProductIds.push(first.product.id);
			}

			// Attempt to create duplicate
			const duplicate = await createProductUseCase(
				{
					id: `e2e-${Date.now()}-3`,
					name: 'Product 2',
					serialNumber,
					description: 'Duplicate product',
					category: 'laptop',
				},
				{ productRepo: repo }
			);

			expect(duplicate.success).toBe(false);
			if (!duplicate.success) {
				expect(duplicate.errors[0].field).toBe('serialNumber');
			}
		}, 15000);
	});

	describe('Update Product - Full Flow', () => {
		it('should update product in database and publish event', async () => {
			// Create initial product
			const created = await createProductUseCase(
				{
					id: `e2e-${Date.now()}-4`,
					name: 'Original Name',
					serialNumber: `E2E-SN-${Date.now()}`,
					description: 'Original description',
					category: 'tablet',
				},
				{ productRepo: repo }
			);

			if (!created.success) throw new Error('Setup failed');
			testProductIds.push(created.product.id);

			mockPublishProductEvent.mockClear();

			// Update the product
			const updated = await updateProduct(
				created.product.id,
				{
					name: 'Updated Name',
					description: 'Updated description',
				},
				{ productRepo: repo }
			);

			expect(updated.success).toBe(true);
			if (!updated.success) return;

			// Verify in database
			const retrieved = await repo.getById(created.product.id);
			expect(retrieved!.name).toBe('Updated Name');
			expect(retrieved!.description).toBe('Updated description');

			// Verify event published
			expect(mockPublishProductEvent).toHaveBeenCalledWith(
				'Product.Updated',
				expect.objectContaining({
					name: 'Updated Name',
				})
			);
		}, 15000);

		it('should fail when product does not exist', async () => {
			const result = await updateProduct(
				'non-existent-id',
				{ name: 'New Name' },
				{ productRepo: repo }
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.reason).toBe('not-found');
			}
		}, 10000);
	});

	describe('Delete Product - Full Flow', () => {
		it('should delete product from database and publish event', async () => {
			// Create product to delete
			const created = await createProductUseCase(
				{
					id: `e2e-${Date.now()}-5`,
					name: 'To Delete',
					serialNumber: `E2E-DEL-${Date.now()}`,
					description: 'Will be deleted',
					category: 'accessory',
				},
				{ productRepo: repo }
			);

			if (!created.success) throw new Error('Setup failed');
			testProductIds.push(created.product.id);

			mockPublishProductEvent.mockClear();

			// Delete the product
			const deleted = await deleteProduct(created.product.id, {
				productRepo: repo,
			});

			expect(deleted.success).toBe(true);

			// Verify removed from database
			const retrieved = await repo.getById(created.product.id);
			expect(retrieved).toBeNull();

			// Verify event published
			expect(mockPublishProductEvent).toHaveBeenCalledWith(
				'Product.Deleted',
				expect.objectContaining({
					id: created.product.id,
				})
			);
		}, 15000);

		it('should fail when product does not exist', async () => {
			const result = await deleteProduct('non-existent-id', {
				productRepo: repo,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.reason).toBe('not-found');
			}
		}, 10000);
	});

	describe('Complete Product Lifecycle', () => {
		it('should handle create -> update -> delete flow', async () => {
			// 1. Create
			const created = await createProductUseCase(
				{
					id: `e2e-lifecycle-${Date.now()}`,
					name: 'Lifecycle Product',
					serialNumber: `E2E-LC-${Date.now()}`,
					description: 'Testing lifecycle',
					category: 'phone',
				},
				{ productRepo: repo }
			);

			expect(created.success).toBe(true);
			if (!created.success) return;
			testProductIds.push(created.product.id);

			// 2. Update
			const updated = await updateProduct(
				created.product.id,
				{ description: 'Updated in lifecycle test' },
				{ productRepo: repo }
			);

			expect(updated.success).toBe(true);

			// 3. Verify state
			const retrieved = await repo.getById(created.product.id);
			expect(retrieved!.description).toBe('Updated in lifecycle test');

			// 4. Delete
			const deleted = await deleteProduct(created.product.id, {
				productRepo: repo,
			});

			expect(deleted.success).toBe(true);

			// 5. Verify deletion
			const afterDelete = await repo.getById(created.product.id);
			expect(afterDelete).toBeNull();

			// 6. Verify all events published (Created, Updated, Deleted)
			expect(mockPublishProductEvent).toHaveBeenCalledTimes(3);
		}, 20000);
	});
});
