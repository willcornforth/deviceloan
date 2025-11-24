// Azure Function v4 - Delete product HTTP endpoint

import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { deleteProduct } from '../app/delete-product';

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

export async function deleteProductHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const id = request.params.id;
		context.log(`Processing DELETE /products/${id} request`);

		if (!id) {
			return createErrorResponse(400, 'Bad Request', 'Product ID is required');
		}

		const repo = getProductRepo();
		const result = await deleteProduct({ repo, id });

		if (!result.success) {
			return createErrorResponse(
				404,
				'Not Found',
				`Product with ID ${id} not found`
			);
		}

		return {
			status: 204,
			body: undefined,
		};
	} catch (error: any) {
		context.error('Error deleting product:', error);

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
			'An unexpected error occurred while deleting the product'
		);
	}
}

app.http('deleteProductHttp', {
	methods: ['DELETE'],
	route: 'products/{id}',
	authLevel: 'anonymous',
	handler: deleteProductHttp,
});
