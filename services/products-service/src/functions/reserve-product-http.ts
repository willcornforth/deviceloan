// Azure Function v4 - Reserve product HTTP endpoint
// Uses optimistic concurrency to handle concurrent reservations

import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import { getProductRepo } from '../config/appServices';
import { reserveProduct, ReserveProductParams } from '../app/reserve-product';
import { productEventPublisher } from '../infra/eventgrid-products-publisher';

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

export async function reserveProductHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const productId = request.params.id;
		context.log(`Processing POST /products/${productId}/reserve request`);

		if (!productId) {
			return createErrorResponse(400, 'Bad Request', 'Product ID is required');
		}

		let params: ReserveProductParams;
		try {
			params = (await request.json()) as ReserveProductParams;
		} catch {
			return createErrorResponse(400, 'Bad Request', 'Invalid JSON in request body');
		}

		const repo = getProductRepo();
		const result = await reserveProduct({ repo, productId, params, eventPublisher: productEventPublisher });

		if (result.success === true) {
			return {
				status: 200,
				jsonBody: {
					message: 'Product reserved successfully',
					product: result.product,
				},
			};
		}

		switch (result.reason) {
			case 'not-found':
				return createErrorResponse(
					404,
					'Not Found',
					`Product with ID ${productId} not found`
				);

			case 'not-available':
				return createErrorResponse(
					409,
					'Conflict',
					`Product is not available for reservation (current status: ${result.currentStatus})`
				);

			case 'concurrency-conflict':
				return createErrorResponse(
					409,
					'Conflict',
					'Product was modified by another request. Please retry.'
				);

			default:
				return createErrorResponse(
					500,
					'Internal Server Error',
					'An unexpected error occurred'
				);
		}
	} catch (error: any) {
		context.error('Error reserving product:', error);

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
			'An unexpected error occurred while reserving the product'
		);
	}
}

app.http('reserveProductHttp', {
	methods: ['POST'],
	route: 'products/{id}/reserve',
	authLevel: 'anonymous',
	handler: reserveProductHttp,
});
