// Application services - lazy singleton instances

import { CosmosProductRepo } from '../infra/cosmos-product-repo';
import { ProductRepo } from '../domain/product-repo';

let productRepoInstance: ProductRepo | null = null;

export const getProductRepo = (): ProductRepo => {
	if (!productRepoInstance) {
		const cosmosKey = process.env.COSMOS_KEY;

		if (!cosmosKey) {
			throw new Error('COSMOS_KEY environment variable is required');
		}

		productRepoInstance = new CosmosProductRepo({
			endpoint: process.env.COSMOS_ENDPOINT,
			key: cosmosKey,
			databaseId: process.env.COSMOS_DATABASE_ID,
			containerId: process.env.COSMOS_CONTAINER_ID,
		});
	}

	return productRepoInstance;
};
