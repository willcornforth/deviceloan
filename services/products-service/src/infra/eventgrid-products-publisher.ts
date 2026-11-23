import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';
import { InvocationContext } from '@azure/functions';
import { Product } from '../domain/product';
import { CorrelationContext } from './correlation-context';

export const ProductEventTypes = {
  Created: 'Product.Created',
  Updated: 'Product.Updated',
  Deleted: 'Product.Deleted',
  Reserved: 'Product.Reserved',
  Released: 'Product.Released',
} as const;

export type ProductEventType =
  (typeof ProductEventTypes)[keyof typeof ProductEventTypes];

export interface ProductReservedEventData {
  readonly productId: string;
  readonly productName: string;
  readonly serialNumber: string;
  readonly category: string;
  readonly reservedBy: string;
  readonly reservedAt: string;
  readonly returnDate: string;
  readonly _correlationId?: string;
  readonly _invocationId?: string;
}

export interface ProductEventData {
  readonly productId: string;
  readonly productName: string;
  readonly serialNumber: string;
  readonly description: string;
  readonly category: string;
  readonly status: string;
  readonly image?: string;
  readonly createdAt: string;
  readonly reservedBy?: string;
  readonly reservedAt?: string;
  readonly _correlationId?: string;
  readonly _invocationId?: string;
}

interface EventPublisherClient {
  send(events: Array<any>): Promise<void>;
}

class AzureEventGridPublisherClient implements EventPublisherClient {
  private client: EventGridPublisherClient<'EventGrid'>;

  constructor() {
    const endpoint = process.env.EVENTGRID_ENDPOINT;
    const key = process.env.EVENTGRID_KEY;

    if (!endpoint || !key) {
      throw new Error(
        'Missing required environment variables: EVENTGRID_ENDPOINT, EVENTGRID_KEY'
      );
    }

    this.client = new EventGridPublisherClient(
      endpoint,
      'EventGrid',
      new AzureKeyCredential(key)
    );
  }

  async send(events: Array<any>): Promise<void> {
    await this.client.send(events);
  }
}

export class ProductEventPublisher {
  private client: EventPublisherClient;

  constructor(client?: EventPublisherClient) {
    this.client = client || new AzureEventGridPublisherClient();
  }

  async publishProductCreated(product: Product): Promise<void> {
    const data: ProductEventData = {
      productId: product.id,
      productName: product.name,
      serialNumber: product.serialNumber,
      description: product.description,
      category: product.category,
      status: product.status,
      image: product.image,
      createdAt: product.createdAt.toISOString(),
    };

    const event = {
      eventType: ProductEventTypes.Created,
      subject: `products/${product.id}`,
      dataVersion: '1.0',
      data,
    };

    await this.client.send([event]);
  }

  async publishProductUpdated(product: Product): Promise<void> {
    const data: ProductEventData = {
      productId: product.id,
      productName: product.name,
      serialNumber: product.serialNumber,
      description: product.description,
      category: product.category,
      status: product.status,
      image: product.image,
      createdAt: product.createdAt.toISOString(),
      reservedBy: product.reservedBy,
      reservedAt: product.reservedAt?.toISOString(),
    };

    const event = {
      eventType: ProductEventTypes.Updated,
      subject: `products/${product.id}`,
      dataVersion: '1.0',
      data,
    };

    await this.client.send([event]);
  }

  async publishProductDeleted(productId: string): Promise<void> {
    const data = {
      productId,
    };

    const event = {
      eventType: ProductEventTypes.Deleted,
      subject: `products/${productId}`,
      dataVersion: '1.0',
      data,
    };

    await this.client.send([event]);
  }

  async publishProductReserved(
    data: ProductReservedEventData,
    context?: InvocationContext,
    correlationContext?: CorrelationContext
  ): Promise<void> {
    context?.log(
      `${correlationContext?.getLogPrefix() || ''} Publishing Product.Reserved event for ${data.productId}`
    );

    const eventData = {
      ...data,
      _correlationId: correlationContext?.correlationId,
      _invocationId: correlationContext?.invocationId,
    };

    const event = {
      eventType: ProductEventTypes.Reserved,
      subject: `products/${data.productId}`,
      dataVersion: '1.0',
      data: eventData,
    };

    await this.client.send([event]);
  }

  async publishProductReleased(product: Product): Promise<void> {
    const data: ProductEventData = {
      productId: product.id,
      productName: product.name,
      serialNumber: product.serialNumber,
      description: product.description,
      category: product.category,
      status: product.status,
      image: product.image,
      createdAt: product.createdAt.toISOString(),
    };

    const event = {
      eventType: ProductEventTypes.Released,
      subject: `products/${product.id}`,
      dataVersion: '1.0',
      data,
    };

    await this.client.send([event]);
  }
}

export const productEventPublisher = new ProductEventPublisher();
