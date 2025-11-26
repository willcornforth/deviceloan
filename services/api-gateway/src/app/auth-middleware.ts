import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OAuth2Validator } from '../infra/oauth2-validator';
import { AuthContext } from './auth-context';
import { ResponseBuilder } from './response-builder';
import { ServiceConfig } from '../infra/service-config';

export class AuthMiddleware {
  private static validator: OAuth2Validator | null = null;

  private static getValidator(): OAuth2Validator {
    if (!this.validator) {
      const config = ServiceConfig.getAuth0Config();
      this.validator = new OAuth2Validator(config);
    }
    return this.validator;
  }

  static async authenticate(
    request: HttpRequest,
    context: InvocationContext
  ): Promise<{ authContext: AuthContext; error?: HttpResponseInit }> {
    const validator = this.getValidator();
    const authContext = await validator.validate(request);

    if (!authContext.authenticated) {
      context.log('Authentication failed - no valid token provided');
      return {
        authContext,
        error: ResponseBuilder.unauthorized(),
      };
    }

    context.log(`User ${authContext.subject} authenticated successfully`);
    return { authContext };
  }

  static requirePermission(
    authContext: AuthContext,
    requiredPermission: string,
    context: InvocationContext
  ): HttpResponseInit | null {
    const validator = this.getValidator();
    
    if (!validator.hasPermission(authContext, requiredPermission)) {
      context.log(`User ${authContext.subject} lacks required permission: ${requiredPermission}`);
      return ResponseBuilder.forbidden(
        `Required permission '${requiredPermission}' not present in token`
      );
    }

    return null;
  }
}
