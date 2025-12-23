import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { HttpRequest } from '@azure/functions';
import type { AuthContext } from '../app/auth-context';

export type OAuth2ValidatorOptions = {
  jwksUri: string;
  issuer: string;
  audience: string;
};

export class OAuth2Validator {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;
  private audience: string;

  constructor(options: OAuth2ValidatorOptions) {
    this.jwks = createRemoteJWKSet(new URL(options.jwksUri));
    this.issuer = options.issuer;
    this.audience = options.audience;
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractToken(request: HttpRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Validate the access token and extract authentication context
   */
  async validate(request: HttpRequest): Promise<AuthContext> {
    const token = this.extractToken(request);

    if (!token) {
      return { authenticated: false, permissions: [] };
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Extract permissions from token
      // Auth0 includes permissions in the 'permissions' claim as an array
      // The 'scope' claim contains OAuth scopes (openid, profile, email) - not used for authorization
      let permissions: string[] = [];

      if (Array.isArray(payload.permissions)) {
        permissions = payload.permissions as string[];
      } else if (typeof payload.permissions === 'string') {
        permissions = payload.permissions.split(' ').filter((s: string) => s.trim() !== '');
      }

      return {
        authenticated: true,
        permissions: permissions,
        subject: typeof payload.sub === 'string' ? payload.sub : undefined,
      };
    } catch (error) {
      // Token validation failed (expired, invalid signature, wrong issuer/audience, etc.)
      console.warn('Token validation failed:', (error as Error).message);
      return { authenticated: false, permissions: [] };
    }
  }

  /**
   * Check if the auth context has a specific scope
   */
  hasPermission(authContext: AuthContext, permission: string): boolean {
    return authContext.authenticated && authContext.permissions.includes(permission);
  }
}