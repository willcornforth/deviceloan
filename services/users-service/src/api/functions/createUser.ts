import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { UserService } from '../../application/services/UserService';
import { CosmosDbUserRepository } from '../../infrastructure/repositories/CosmosDbUserRepository';
import { CosmosDbConfig } from '../../infrastructure/config/CosmosDbConfig';
import { Auth0Middleware } from '../middleware/Auth0Middleware';

// Initialize dependencies
const cosmosConfig: CosmosDbConfig = {
  connectionString: process.env.COSMOS_DB_CONNECTION_STRING || '',
  databaseName: process.env.COSMOS_DB_DATABASE_NAME || 'deviceloan',
  containerName: process.env.COSMOS_DB_CONTAINER_NAME || 'users'
};

const userRepository = new CosmosDbUserRepository(cosmosConfig);
const userService = new UserService(userRepository);

const auth0Middleware = new Auth0Middleware({
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || ''
});

// Create User
export async function createUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Validate Auth0 token
    const isValid = await auth0Middleware.validateToken(request, context);
    if (!isValid) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized' }
      };
    }

    const body = await request.json() as any;
    
    if (!body.email || !body.firstName || !body.lastName || !body.auth0UserId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields: email, firstName, lastName, auth0UserId' }
      };
    }

    const user = await userService.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      auth0UserId: body.auth0UserId
    });

    return {
      status: 201,
      jsonBody: user
    };
  } catch (error: any) {
    context.error('Error creating user:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error', message: error.message }
    };
  }
}

app.http('createUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users',
  handler: createUser
});
