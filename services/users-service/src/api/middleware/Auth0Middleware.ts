import { HttpRequest, InvocationContext } from '@azure/functions';
import * as jwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';
import * as jsonwebtoken from 'jsonwebtoken';

export interface Auth0Config {
  domain: string;
  audience: string;
}

export class Auth0Middleware {
  private jwtCheck: any;

  constructor(config: Auth0Config) {
    this.jwtCheck = jwt.expressjwt({
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.domain}/.well-known/jwks.json`
      }) as jwt.GetVerificationKey,
      audience: config.audience,
      issuer: `https://${config.domain}/`,
      algorithms: ['RS256']
    });
  }

  async validateToken(request: HttpRequest, context: InvocationContext): Promise<boolean> {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      context.log('No authorization header or invalid format');
      return false;
    }

    try {
      // Create a mock Express request object for express-jwt
      const mockReq: any = {
        headers: {
          authorization: authHeader
        }
      };

      // Promisify the JWT check
      await new Promise((resolve, reject) => {
        this.jwtCheck(mockReq, {}, (err: any) => {
          if (err) reject(err);
          else resolve(mockReq.auth);
        });
      });

      return true;
    } catch (error: any) {
      context.log('Token validation failed:', error.message);
      return false;
    }
  }

  extractUserId(request: HttpRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded: any = jsonwebtoken.decode(token);
      return decoded?.sub || null;
    } catch {
      return null;
    }
  }
}
