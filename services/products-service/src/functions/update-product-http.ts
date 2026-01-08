// Azure Function v4 - Update product HTTP endpoint

import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import { getProductRepo, getProductEventPublisher } from '../config/appServices';
import { updateProduct } from '../app/update-product';

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

export async function updateProductHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const id = request.params.id;
		context.log(`Processing PUT /products/${id} request`);

		if (!id) {
			return createErrorResponse(400, 'Bad Request', 'Product ID is required');
		}

		const body = (await request.json()) as Record<string, unknown>;

		if (!body || typeof body !== 'object') {
			return createErrorResponse(
				400,
				'Bad Request',
				'Request body is required'
			);
		}

		const repo = getProductRepo();
		const publisher = getProductEventPublisher();

		const result = await updateProduct({
			repo,
			publisher,
			id,
			params: {
				name: body.name as string | undefined,
				description: body.description as string | undefined,
				category: body.category as any,
				status: body.status as any,
				image: body.image as string | undefined,
			},
		});

		if (!result.success) {
			return createErrorResponse(
				404,
				'Not Found',
				`Product with ID ${id} not found`
			);
		}

		return {
			status: 200,
			jsonBody: { product: result.product },
		};
	} catch (error: any) {
		context.error('Error updating product:', error);

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
			'An unexpected error occurred while updating the product'
		);
	}
}

app.http('updateProductHttp', {
	methods: ['PUT', 'PATCH'],
	route: 'products/{id}',
	authLevel: 'function',
	handler: updateProductHttp,
});
