# Contributing to Device Loan Users Service

## Clean Architecture Overview

This project follows Clean Architecture principles to maintain separation of concerns and improve testability.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│            API Layer                    │  ← HTTP Triggers (Azure Functions)
│  src/api/functions, src/api/middleware  │
└────────────────┬────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────┐
│       Application Layer                 │  ← Business Logic & Use Cases
│  src/application/services, dtos         │
└────────────────┬────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────┐
│          Domain Layer                   │  ← Core Business Entities
│  src/domain/entities, interfaces        │  ← No external dependencies
└─────────────────────────────────────────┘
         ▲
         │ implemented by
┌────────┴─────────────────────────────────┐
│      Infrastructure Layer                │  ← External Services
│  src/infrastructure/repositories, config │  ← Cosmos DB, etc.
└──────────────────────────────────────────┘
```

### Layer Responsibilities

#### Domain Layer (`src/domain/`)
- **Entities**: Core business objects (User)
- **Interfaces**: Repository contracts
- **Rules**: 
  - No external dependencies
  - Pure TypeScript interfaces and types
  - No framework-specific code

#### Application Layer (`src/application/`)
- **Services**: Business logic implementation
- **DTOs**: Data Transfer Objects for API contracts
- **Interfaces**: Service contracts
- **Rules**:
  - Depends only on Domain layer
  - Contains use case orchestration
  - No direct database or HTTP concerns

#### Infrastructure Layer (`src/infrastructure/`)
- **Repositories**: Data access implementations (Cosmos DB)
- **Config**: Configuration models
- **Rules**:
  - Implements Domain interfaces
  - Contains external service integrations
  - Framework-specific code allowed

#### API Layer (`src/api/`)
- **Functions**: HTTP trigger handlers
- **Middleware**: Authentication, validation
- **Rules**:
  - Depends on Application and Infrastructure
  - Handles HTTP requests/responses
  - Minimal logic - delegates to Application layer

## Development Guidelines

### Adding a New Endpoint

1. **Define the contract** (if needed)
   - Add DTO in `src/application/dtos/`
   
2. **Add business logic** (if needed)
   - Update service in `src/application/services/`
   - Update interface in `src/application/interfaces/`

3. **Create the HTTP trigger**
   - Add function in `src/api/functions/`
   - Use existing middleware for auth
   - Delegate to service layer

4. **Update infrastructure** (if needed)
   - Modify repository if data access changes
   - Update `src/infrastructure/repositories/`

### Example: Adding a "Search Users by Name" Feature

```typescript
// 1. Add to Application interface
// src/application/interfaces/IUserService.ts
searchByName(name: string): Promise<UserResponse[]>;

// 2. Implement in Application service
// src/application/services/UserService.ts
async searchByName(name: string): Promise<UserResponse[]> {
  const users = await this.userRepository.searchByName(name);
  return users.map(user => this.mapToResponse(user));
}

// 3. Add to Domain repository interface
// src/domain/interfaces/IUserRepository.ts
searchByName(name: string): Promise<User[]>;

// 4. Implement in Infrastructure
// src/infrastructure/repositories/CosmosDbUserRepository.ts
async searchByName(name: string): Promise<User[]> {
  const querySpec = {
    query: 'SELECT * FROM c WHERE CONTAINS(c.firstName, @name) OR CONTAINS(c.lastName, @name)',
    parameters: [{ name: '@name', value: name }]
  };
  const { resources } = await this.container.items.query<User>(querySpec).fetchAll();
  return resources;
}

// 5. Create API endpoint
// src/api/functions/searchUsers.ts
export async function searchUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Validate token
  // Extract search query
  // Call service
  // Return response
}

app.http('searchUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/search',
  handler: searchUsers
});
```

## Code Style

### TypeScript Guidelines
- Use strict type checking
- Prefer interfaces over types for public APIs
- Use `async/await` for asynchronous operations
- Handle errors explicitly

### Naming Conventions
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IUserService`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Files**: Match class/interface name (e.g., `UserService.ts`)
- **Functions**: camelCase (e.g., `getById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### File Organization
```
src/
├── domain/
│   ├── entities/
│   │   └── User.ts              # Single entity per file
│   └── interfaces/
│       └── IUserRepository.ts   # Single interface per file
├── application/
│   ├── dtos/
│   │   ├── CreateUserRequest.ts # Request DTOs
│   │   ├── UpdateUserRequest.ts
│   │   └── UserResponse.ts      # Response DTOs
│   ├── interfaces/
│   │   └── IUserService.ts      # Service contracts
│   └── services/
│       └── UserService.ts       # Service implementations
├── infrastructure/
│   ├── config/
│   │   └── CosmosDbConfig.ts    # Configuration models
│   └── repositories/
│       └── CosmosDbUserRepository.ts  # Data access
└── api/
    ├── functions/
    │   ├── createUser.ts        # One function per file
    │   ├── getUser.ts
    │   └── ...
    └── middleware/
        └── Auth0Middleware.ts   # Reusable middleware
```

## Testing

### Unit Tests
- Test domain entities and application services
- Mock dependencies
- Use Jest or similar framework

### Integration Tests
- Test repository implementations with test database
- Test API endpoints with test tokens

### Example Unit Test Structure
```typescript
// UserService.test.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = {
      getById: jest.fn(),
      create: jest.fn(),
      // ... other methods
    };
    service = new UserService(mockRepository);
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com', ... };
      mockRepository.getById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getById('123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('123');
    });
  });
});
```

## Pull Request Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/add-search-endpoint
   ```

2. **Make your changes** following the guidelines above

3. **Build and test**
   ```bash
   npm run build
   npm test  # When tests are added
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add user search endpoint"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/add-search-endpoint
   ```

6. **PR Checklist**
   - [ ] Code follows clean architecture principles
   - [ ] All layers properly separated
   - [ ] Tests added/updated (when applicable)
   - [ ] Documentation updated
   - [ ] No linting errors
   - [ ] Builds successfully

## Common Patterns

### Dependency Injection
Always initialize dependencies at the function level:

```typescript
const cosmosConfig: CosmosDbConfig = {
  connectionString: process.env.COSMOS_DB_CONNECTION_STRING || '',
  // ...
};
const repository = new CosmosDbUserRepository(cosmosConfig);
const service = new UserService(repository);
```

### Error Handling
Use try-catch and return appropriate HTTP status codes:

```typescript
try {
  const result = await service.doSomething();
  return { status: 200, jsonBody: result };
} catch (error: any) {
  context.error('Error:', error);
  if (error.message.includes('not found')) {
    return { status: 404, jsonBody: { error: error.message } };
  }
  return { status: 500, jsonBody: { error: 'Internal server error' } };
}
```

### Authentication
Always validate tokens in function handlers:

```typescript
const isValid = await auth0Middleware.validateToken(request, context);
if (!isValid) {
  return { status: 401, jsonBody: { error: 'Unauthorized' } };
}
```

## Questions?

If you have questions about the architecture or contribution process, please open an issue for discussion.
