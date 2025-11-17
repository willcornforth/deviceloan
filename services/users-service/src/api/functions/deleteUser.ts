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

// Delete User
export async function deleteUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Validate Auth0 token
    const isValid = await auth0Middleware.validateToken(request, context);
    if (!isValid) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized' }
      };
    }

    const userId = request.params.id;
    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: 'User ID is required' }
      };
    }

    const deleted = await userService.delete(userId);
    if (!deleted) {
      return {
        status: 404,
        jsonBody: { error: 'User not found' }
      };
    }

    return {
      status: 204,
      body: ''
    };
  } catch (error: any) {
    context.error('Error deleting user:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error', message: error.message }
    };
  }
}

app.http('deleteUser', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/{id}',
  handler: deleteUser
});
