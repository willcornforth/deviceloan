import { HttpClient, HttpClientConfig } from './http-client';

export class ServiceConfig {
  private static validateConfig(name: string, url?: string): string {
    if (!url) {
      throw new Error(`${name} service URL is not configured`);
    }
    return url;
  }

  static getProductsService(): HttpClient {
    const config: HttpClientConfig = {
      baseUrl: this.validateConfig(
        'Products',
        process.env.PRODUCTS_SERVICE_BASE_URL
      ),
      hostKey: process.env.PRODUCTS_SERVICE_HOST_KEY,
    };
    return new HttpClient(config);
  }

  static getLoansService(): HttpClient {
    const config: HttpClientConfig = {
      baseUrl: this.validateConfig(
        'Loans',
        process.env.LOANS_SERVICE_BASE_URL
      ),
      hostKey: process.env.LOANS_SERVICE_HOST_KEY,
    };
    return new HttpClient(config);
  }

  static getAuth0Config() {
    const domain = process.env.AUTH0_DOMAIN;
    const audience = process.env.AUTH0_AUDIENCE;

    if (!domain || !audience) {
      throw new Error('Auth0 configuration is missing');
    }

    return {
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      issuer: `https://${domain}/`,
      audience,
    };
  }
}
