// Cosmos DB seed utility for development

import { randomUUID } from 'crypto';
import { createProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

// Sample seed data
const seedData = [
  {
    id: randomUUID(),
    name: 'MacBook Pro 16"',
    serialNumber: 'MBP-2024-001',
    description: 'High-performance laptop for development work',
    category: 'laptop' as const,
    isLoanedOut: true,
  },
  {
    id: randomUUID(),
    name: 'Dell XPS 15',
    serialNumber: 'DELL-XPS-002',
    description: 'Premium Windows laptop for enterprise use',
    category: 'laptop' as const,
    isLoanedOut: false,
  },
  {
    id: randomUUID(),
    name: 'iPhone 15 Pro',
    serialNumber: 'IPHONE-15P-003',
    description: 'Latest iPhone for mobile testing',
    category: 'phone' as const,
    isLoanedOut: false,
  },
  {
    id: randomUUID(),
    name: 'Samsung Galaxy S24',
    serialNumber: 'SAM-S24-004',
    description: 'Android flagship device',
    category: 'phone' as const,
    isLoanedOut: true,
  },
  {
    id: randomUUID(),
    name: 'iPad Pro 12.9"',
    serialNumber: 'IPAD-PRO-005',
    description: 'Large tablet for design and testing',
    category: 'tablet' as const,
    isLoanedOut: false,
  },
  {
    id: randomUUID(),
    name: 'Dell UltraSharp 27"',
    serialNumber: 'MONITOR-DS27-006',
    description: '4K monitor for workstation setup',
    category: 'monitor' as const,
    isLoanedOut: false,
  },
  {
    id: randomUUID(),
    name: 'USB-C Hub',
    serialNumber: 'USBC-HUB-007',
    description: 'Multi-port adapter for connectivity',
    category: 'accessory' as const,
    isLoanedOut: false,
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
