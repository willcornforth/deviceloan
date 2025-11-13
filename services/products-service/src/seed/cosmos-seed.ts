// Cosmos DB seed utility for development

import { createProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

// Sample seed data
const seedData = [
	{
		id: 'laptop-001',
		name: 'MacBook Pro 16"',
		description: 'High-performance laptop for development work',
		category: 'laptop' as const,
		stockQuantity: 5,
	},
	{
		id: 'laptop-002',
		name: 'Dell XPS 15',
		description: 'Premium Windows laptop for enterprise use',
		category: 'laptop' as const,
		stockQuantity: 3,
	},
	{
		id: 'phone-001',
		name: 'iPhone 15 Pro',
		description: 'Latest iPhone for mobile testing',
		category: 'phone' as const,
		stockQuantity: 8,
	},
	{
		id: 'phone-002',
		name: 'Samsung Galaxy S24',
		description: 'Android flagship device',
		category: 'phone' as const,
		stockQuantity: 6,
	},
	{
		id: 'tablet-001',
		name: 'iPad Pro 12.9"',
		description: 'Large tablet for design and testing',
		category: 'tablet' as const,
		stockQuantity: 4,
	},
	{
		id: 'monitor-001',
		name: 'Dell UltraSharp 27"',
		description: '4K monitor for workstation setup',
		category: 'monitor' as const,
		stockQuantity: 10,
	},
	{
		id: 'accessory-001',
		name: 'USB-C Hub',
		description: 'Multi-port adapter for connectivity',
		category: 'accessory' as const,
		stockQuantity: 15,
	},
];

// Pure function to seed the database
export const seedCosmosDb = async (repo: ProductRepo): Promise<void> => {
	console.log('Starting Cosmos DB seed...');

	for (const data of seedData) {
		const result = createProduct(data);

		if (result.success) {
			try {
				await repo.create(result.product);
				console.log(`✓ Seeded product: ${data.name} (${data.id})`);
			} catch (error) {
				console.error(`✗ Failed to seed product ${data.id}:`, error);
			}
		}
	}
	console.log('Cosmos DB seed completed!');
};
