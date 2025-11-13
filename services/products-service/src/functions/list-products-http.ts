// Azure Function v4 - List products HTTP endpoint

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { listProducts } from '../app/list-products';

interface ErrorResponse {
	readonly error: string;
	readonly message: string;
	readonly timestamp: string;
}

const createErrorResponse = (status: number, error: string, message: string): HttpResponseInit => ({
	status,
	jsonBody: {
		error,
		message,
		timestamp: new Date().toISOString(),
	} as ErrorResponse,
});

export async function listProductsHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		context.log('Processing GET /products request');

		const repo = getProductRepo();
		const products = await listProducts({ repo });

		return {
			status: 200,
			jsonBody: {
				products,
				count: products.length,
			},
		};
	} catch (error: any) {
		context.error('Error listing products:', error);

		// Handle known error types
		if (error.message?.includes('COSMOS_KEY')) {
			return createErrorResponse(500, 'Configuration Error', 'Database configuration is missing');
		}

		// Generic server error
		return createErrorResponse(
			500,
			'Internal Server Error',
			'An unexpected error occurred while listing products'
		);
	}
}

app.http('listProductsHttp', {
	methods: ['GET'],
	route: 'products',
	authLevel: 'anonymous',
	handler: listProductsHttp,
});
