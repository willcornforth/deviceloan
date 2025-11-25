import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OAuth2Validator } from '../infra/oauth2-validator';

// Initialize OAuth2 validator with Auth0 configuration
const oauth2Validator = new OAuth2Validator({
	jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
	issuer: `https://${process.env.AUTH0_DOMAIN}/`,
	audience: process.env.AUTH0_AUDIENCE || '',
});

export async function getProducts(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	// Validate the OAuth2 token
	const authContext = await oauth2Validator.validate(request);

	// Check if user is authenticated - REMOVED to allow anon access.
	// if (!authContext.authenticated) {
	// 	context.log('Authentication failed - no valid token provided');
	// 	return {
	// 		status: 401,
	// 		jsonBody: {
	// 			error: 'Unauthorized',
	// 			message: 'Invalid or missing authentication token'
	// 		}
	// 	};
	// }
	// context.log(`User ${authContext.subject} is accessing GET products`);

	// Contact products service and retrieve products using HOST_KEY
	// Host key can be undefined for local development.
	const productsServiceUrl = process.env.PRODUCTS_SERVICE_BASE_URL;
	const productsServiceHostKey = process.env.PRODUCTS_SERVICE_HOST_KEY;

	if (!productsServiceUrl) {
		context.log('Products service configuration missing');
		return {
			status: 500,
			jsonBody: {
				error: 'Internal Server Error',
				message: 'Products service is not configured'
			}
		};
	}

	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Only add host key header if it's defined (for deployed environments)
		if (productsServiceHostKey) {
			headers['x-functions-key'] = productsServiceHostKey;
		}

		context.log(`Calling products service at: ${productsServiceUrl}/products`);

		const response = await fetch(`${productsServiceUrl}/products`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			context.log(`Products service returned status: ${response.status}`);
			return {
				status: response.status,
				jsonBody: {
					error: 'Products Service Error',
					message: 'Failed to retrieve products from upstream service'
				}
			};
		}

		const products = await response.json();

		return {
			status: 200,
			jsonBody: {
				message: 'Products retrieved successfully',
				user: authContext.subject,
				data: products
			}
		};
	} catch (error) {
		context.log(`Error calling products service: ${error}`);
		return {
			status: 502,
			jsonBody: {
				error: 'Bad Gateway',
				message: 'Unable to connect to products service'
			}
		};
	}
}

app.http('getProducts', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'products',
	handler: getProducts
});
