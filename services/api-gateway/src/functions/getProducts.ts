import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ServiceConfig } from '../infra/service-config';
import { ResponseBuilder } from '../app/response-builder';
import { HttpClientError } from '../infra/http-client';

export async function getProducts(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		// Get the products service client
		const productsService = ServiceConfig.getProductsService();

		// Call the products service
		const products = await productsService.request({
			method: 'GET',
			path: '/products',
		}, context);

		return ResponseBuilder.success(products, 'Products retrieved successfully');
	} catch (error) {
		context.log(`Error in getProducts: ${error}`);

		if (error instanceof HttpClientError) {
			return ResponseBuilder.serviceError(
				error.statusCode,
				'Failed to retrieve products from upstream service'
			);
		}

		if (error.message?.includes('not configured')) {
			return ResponseBuilder.internalError(error.message);
		}

		return ResponseBuilder.badGateway('Unable to connect to products service');
	}
}

app.http('getProducts', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'products',
	handler: getProducts
});
