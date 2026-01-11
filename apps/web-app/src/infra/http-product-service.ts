import { ListProductOutput, ProductService } from "../app/product-service";
import { withErrorHandling } from "./service-error-handler";

export class HttpProductService implements ProductService {
	constructor(private readonly token?: string) { }

	async listProducts(): Promise<ListProductOutput> {
		// In development, use relative path to leverage Vite proxy and avoid CORS
		const baseUrl = import.meta.env.DEV
			? '/api'
			: import.meta.env.VITE_API_GATEWAY_BASE_URL;

		if (!baseUrl) {
			throw new Error('Missing API Gateway base URL configuration. Please check your environment variables.');
		}

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		const response = await withErrorHandling<{ data: ListProductOutput }>(
			() => fetch(`${baseUrl}/products`, {
				method: 'GET',
				headers,
			}),
			{ operation: 'list products', resource: 'products' }
		);
		
		return response.data;
	}
}