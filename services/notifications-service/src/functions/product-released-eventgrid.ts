import { app, EventGridEvent, InvocationContext } from '@azure/functions';
import { createAppConfig } from '../config/app-services';
import { handleProductReleased } from '../app/handle-product-released';
import { ProductEventData } from '../domain/events';

async function productReleasedHandler(
	event: EventGridEvent,
	context: InvocationContext
): Promise<void> {
	try {
		context.log('Product.Released event received:', event);

		const productEvent: ProductEventData = event.data as unknown as ProductEventData;
		const config = createAppConfig();

		await handleProductReleased(productEvent, config.notificationRepo, config.emailSender);

		context.log('Product.Released event processed successfully');
	} catch (error: any) {
		context.error('Error processing Product.Released event:', error);
		throw error;
	}
}

app.eventGrid('product-released-eventgrid', {
	handler: productReleasedHandler,
});
