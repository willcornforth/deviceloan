// Azure Function v4 - Get product by ID HTTP endpoint

import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { getProduct } from '../app/get-product';

interface ErrorResponse {
	readonly error: string;
	readonly message: string;
	readonly timestamp: string;
}

const createErrorResponse = (
	status: number,
	error: string,
	message: string
): HttpResponseInit => ({
	status,
	jsonBody: {
		error,
		message,
		timestamp: new Date().toISOString(),
	} as ErrorResponse,
});

export async function getProductHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const id = request.params.id;
		context.log(`Processing GET /products/${id} request`);

		if (!id) {
			return createErrorResponse(400, 'Bad Request', 'Product ID is required');
		}

		const repo = getProductRepo();
		const product = await getProduct({ repo, id });

		if (!product) {
			return createErrorResponse(
				404,
				'Not Found',
				`Product with ID ${id} not found`
			);
		}

		return {
			status: 200,
			jsonBody: { product },
		};
	} catch (error: any) {
		context.error('Error getting product:', error);

		if (error.message?.includes('COSMOS_KEY')) {
			return createErrorResponse(
				500,
				'Configuration Error',
				'Database configuration is missing'
			);
		}

		return createErrorResponse(
			500,
			'Internal Server Error',
			'An unexpected error occurred while getting the product'
		);
	}
}

app.http('getProductHttp', {
	methods: ['GET'],
	route: 'products/{id}',
	authLevel: 'anonymous',
	handler: getProductHttp,
});
