import { ProductRepo } from "../domain/product";
import { CosmosProductRepo } from "../infra/cosmos-product-repo";

let productRepoInstance: ProductRepo | null = null;

export const getProductRepo = (): ProductRepo => {
	if (!productRepoInstance) {
		const cosmosKey = process.env.COSMOS_KEY;
		const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
		const cosmosDatabaseId = process.env.COSMOS_DATABASE_ID;
		const cosmosContainerId = process.env.COSMOS_CONTAINER_ID;

		if (!cosmosKey) {
			throw new Error('COSMOS_KEY environment variable is required');
		}
		if (!cosmosEndpoint) {
			throw new Error('COSMOS_ENDPOINT environment variable is required');
		}
		if (!cosmosDatabaseId) {
			throw new Error('COSMOS_DATABASE_ID environment variable is required');
		}
		if (!cosmosContainerId) {
			throw new Error('COSMOS_CONTAINER_ID environment variable is required');
		}

		productRepoInstance = new CosmosProductRepo({
			endpoint: cosmosEndpoint,
			key: cosmosKey,
			databaseId: cosmosDatabaseId,
			containerId: cosmosContainerId,
		});
	}

	return productRepoInstance;
};
