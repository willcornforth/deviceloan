import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ResponseBuilder } from '../app/response-builder';
import { getProductRepo } from '../infra/cosmos-product-repo';

export async function getProducts(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		// Get products from local Cosmos DB projection
		const productRepo = getProductRepo();
		const products = await productRepo.list();

		context.log(`Retrieved ${products.length} products from local projection`);

		return ResponseBuilder.success(products, 'Products retrieved successfully');
	} catch (error) {
		context.log(`Error in getProducts: ${error}`);

		return ResponseBuilder.internalError('Failed to retrieve products from database');
	}
}

app.http('getProducts', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'products',
	handler: getProducts
});
