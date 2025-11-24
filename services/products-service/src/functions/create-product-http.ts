// Azure Function v4 - Create product HTTP endpoint

import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import { randomUUID } from 'crypto';
import { getProductRepo } from '../config/appServices';
import { createProductUseCase } from '../app/create-product';

interface ErrorResponse {
	readonly error: string;
	readonly message: string;
	readonly details?: unknown;
	readonly timestamp: string;
}

const createErrorResponse = (
	status: number,
	error: string,
	message: string,
	details?: unknown
): HttpResponseInit => ({
	status,
	jsonBody: {
		error,
		message,
		details,
		timestamp: new Date().toISOString(),
	} as ErrorResponse,
});

export async function createProductHttp(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		context.log('Processing POST /products request');

		const body = (await request.json()) as Record<string, unknown>;

		if (!body || typeof body !== 'object') {
			return createErrorResponse(
				400,
				'Bad Request',
				'Request body is required'
			);
		}

		const repo = getProductRepo();

		const result = await createProductUseCase({
			repo,
			params: {
				id: (body.id as string) ?? randomUUID(),
				name: body.name as string,
				serialNumber: body.serialNumber as string,
				description: body.description as string,
				category: body.category as any,
				status: body.status as any,
				image: body.image as string | undefined,
			},
		});

		if (result.success === false) {
			return createErrorResponse(
				400,
				'Validation Error',
				'Invalid product data',
				result.errors
			);
		}

		return {
			status: 201,
			jsonBody: { product: result.product },
		};
	} catch (error: any) {
		context.error('Error creating product:', error);

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
			'An unexpected error occurred while creating the product'
		);
	}
}

app.http('createProductHttp', {
	methods: ['POST'],
	route: 'products',
	authLevel: 'anonymous',
	handler: createProductHttp,
});
