import { UserService, UserInfo } from '../domain/user-service';

export class Auth0UserService implements UserService {
	private domain: string;
	private clientId: string;
	private clientSecret: string;
	private tokenCache: { token: string; expiresAt: number } | null = null;

	constructor(domain: string, clientId: string, clientSecret: string) {
		this.domain = domain;
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	private async getManagementToken(): Promise<string> {
		// Check if we have a valid cached token
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.token;
		}

		const response = await fetch(`https://${this.domain}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				audience: `https://${this.domain}/api/v2/`,
				grant_type: 'client_credentials',
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to get Auth0 management token: ${response.statusText}`);
		}

		const data = await response.json();
		
		// Cache the token (expires_in is in seconds, convert to ms and subtract 5 minutes for safety)
		this.tokenCache = {
			token: data.access_token,
			expiresAt: Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000),
		};

		return data.access_token;
	}

	async getUserInfo(userId: string): Promise<UserInfo> {
		const token = await this.getManagementToken();

		const response = await fetch(
			`https://${this.domain}/api/v2/users/${encodeURIComponent(userId)}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to get user info from Auth0: ${response.statusText}`);
		}

		const userData = await response.json();

		return {
			userId: userData.user_id,
			email: userData.email,
			name: userData.name,
		};
	}
}
