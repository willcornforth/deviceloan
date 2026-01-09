import { ListProductOutput, ProductService } from "../app/product-service";

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

		const response = await fetch(`${baseUrl}/products`, {
			method: 'GET',
			headers,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch products: ${response.statusText}`);
		}
		
		const json = await response.json();
		return json.data;
	}
}