// Event Grid handler for product events - synchronizes the product projection

import { app, InvocationContext, EventGridEvent as AzureEventGridEvent } from '@azure/functions';
import { Product } from '../domain/product';
import { getProductRepo } from '../config/appServices';

// Event types published by the Products Service
const ProductEventTypes = {
	Created: 'Product.Created',
	Updated: 'Product.Updated',
	Deleted: 'Product.Deleted',
	Reserved: 'Product.Reserved',
	Released: 'Product.Released',
} as const;

export async function productEventsHandler(
	event: AzureEventGridEvent,
	context: InvocationContext
): Promise<void> {
	try {
		context.log(`Processing event: ${event.eventType} for ${event.subject}`);
		
		const productRepo = getProductRepo();

		switch (event.eventType) {
			case ProductEventTypes.Created:
				await handleProductCreated(event.data, productRepo, context);
				break;
			
			case ProductEventTypes.Updated:
				await handleProductUpdated(event.data, productRepo, context);
				break;
			
			case ProductEventTypes.Deleted:
				await handleProductDeleted(event.data, productRepo, context);
				break;
			
			case ProductEventTypes.Reserved:
				await handleProductReserved(event.data, productRepo, context);
				break;
			
			case ProductEventTypes.Released:
				await handleProductReleased(event.data, productRepo, context);
				break;
			
			default:
				context.log(`Unhandled event type: ${event.eventType}`);
		}
	} catch (error) {
		context.error(`Error processing product event: ${error}`);
		throw error; // Re-throw to trigger Event Grid retry
	}
}

async function handleProductCreated(
	data: any,
	repo: any,
	context: InvocationContext
): Promise<void> {
	const product: Product = {
		id: data.productId || data.id,
		name: data.productName || data.name,
		serialNumber: data.serialNumber,
		description: data.description,
		category: data.category,
		status: data.status,
		image: data.image,
		createdAt: new Date(data.createdAt),
	};

	await repo.create(product);
	context.log(`Created product projection: ${product.id}`);
}

async function handleProductUpdated(
	data: any,
	repo: any,
	context: InvocationContext
): Promise<void> {
	const product: Product = {
		id: data.productId || data.id,
		name: data.productName || data.name,
		serialNumber: data.serialNumber,
		description: data.description,
		category: data.category,
		status: data.status,
		image: data.image,
		createdAt: new Date(data.createdAt),
		reservedBy: data.reservedBy,
		reservedAt: data.reservedAt ? new Date(data.reservedAt) : undefined,
	};

	await repo.update(product);
	context.log(`Updated product projection: ${product.id}`);
}

async function handleProductDeleted(
	data: any,
	repo: any,
	context: InvocationContext
): Promise<void> {
	const productId = data.productId || data.id;
	await repo.delete(productId);
	context.log(`Deleted product projection: ${productId}`);
}

async function handleProductReserved(
	data: any,
	repo: any,
	context: InvocationContext
): Promise<void> {
	// Fetch existing product and update with reservation info
	const productId = data.productId;
	const existingProduct = await repo.getById(productId);
	
	if (!existingProduct) {
		context.warn(`Product not found for reservation: ${productId}`);
		return;
	}

	const updatedProduct: Product = {
		...existingProduct,
		status: 'reserved',
		reservedBy: data.reservedBy,
		reservedAt: new Date(data.reservedAt),
	};

	await repo.update(updatedProduct);
	context.log(`Updated product reservation: ${productId}`);
}

async function handleProductReleased(
	data: any,
	repo: any,
	context: InvocationContext
): Promise<void> {
	// Fetch existing product and clear reservation info
	const productId = data.productId;
	const existingProduct = await repo.getById(productId);
	
	if (!existingProduct) {
		context.warn(`Product not found for release: ${productId}`);
		return;
	}

	const updatedProduct: Product = {
		...existingProduct,
		status: 'available',
		reservedBy: undefined,
		reservedAt: undefined,
	};

	await repo.update(updatedProduct);
	context.log(`Released product: ${productId}`);
}

app.eventGrid('productEventsHandler', {
	handler: productEventsHandler
});
