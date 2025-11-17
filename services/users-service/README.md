# deviceloan-users-service

An Azure serverless function application service for managing and creating users within the device loan system.

## Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/          # Core business entities and interfaces
│   ├── entities/    # User entity
│   └── interfaces/  # Repository interfaces
├── application/     # Business logic and use cases
│   ├── dtos/        # Data Transfer Objects
│   ├── interfaces/  # Service interfaces
│   └── services/    # Business logic implementation
├── infrastructure/  # External services and data access
│   ├── config/      # Configuration models
│   └── repositories/# Cosmos DB implementation
└── api/            # Azure Functions HTTP triggers
    ├── functions/   # CRUD endpoint handlers
    └── middleware/  # Auth0 authentication
```

## Features

- ✅ **Clean Architecture** - Maintainable and testable code structure
- ✅ **TypeScript** - Type-safe development
- ✅ **Azure Functions** - Serverless HTTP endpoints
- ✅ **Cosmos DB** - NoSQL database for user storage
- ✅ **Auth0 Integration** - JWT-based authentication
- ✅ **CRUD Operations** - Complete user management

## API Endpoints

All endpoints require Auth0 JWT token in the `Authorization` header.

### Create User
```
POST /api/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "auth0UserId": "auth0|123456"
}
```

### Get User by ID
```
GET /api/users/{id}
Authorization: Bearer <token>
```

### Get All Users
```
GET /api/users
Authorization: Bearer <token>
```

### Update User
```
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "isActive": true
}
```

### Delete User
```
DELETE /api/users/{id}
Authorization: Bearer <token>
```

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- Azure Functions Core Tools (optional for local development)
- Azure Cosmos DB (or Cosmos DB Emulator for local dev)
- Auth0 account for authentication

## Installation

1. Clone the repository:
```bash
git clone https://github.com/willcornforth/deviceloan-users-service.git
cd deviceloan-users-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure local settings (see Configuration section below)

4. Build the project:
```bash
npm run build
```

## Configuration

The application uses `local.settings.json` for local development. This file contains sensitive information and should NOT be committed to source control.

Update `local.settings.json` with your values:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_CONNECTION_STRING": "AccountEndpoint=https://your-account.documents.azure.com:443/;AccountKey=YOUR_KEY_HERE",
    "COSMOS_DB_DATABASE_NAME": "deviceloan",
    "COSMOS_DB_CONTAINER_NAME": "users",
    "AUTH0_DOMAIN": "your-tenant.auth0.com",
    "AUTH0_AUDIENCE": "your-api-audience"
  }
}
```

### Configuration Values

| Variable | Description | Example |
|----------|-------------|---------|
| `COSMOS_DB_CONNECTION_STRING` | Azure Cosmos DB connection string | `AccountEndpoint=https://...` |
| `COSMOS_DB_DATABASE_NAME` | Cosmos DB database name | `deviceloan` |
| `COSMOS_DB_CONTAINER_NAME` | Cosmos DB container name for users | `users` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API audience identifier | `https://your-api` |

## Local Development

### Using Cosmos DB Emulator (Windows)

1. Install [Azure Cosmos DB Emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
2. Use the default connection string in `local.settings.json`
3. Create the database and container manually or via code

### Using Azure Cosmos DB

1. Create an Azure Cosmos DB account
2. Create a database (e.g., "deviceloan")
3. Create a container (e.g., "users") with partition key `/id`
4. Copy the connection string to `local.settings.json`

### Setting up Auth0

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create an API in Auth0 dashboard
3. Note the Domain and API Identifier (Audience)
4. Update `local.settings.json` with these values
5. Configure your client application to obtain JWT tokens

## Running Locally

### With Azure Functions Core Tools

```bash
npm start
```

The API will be available at `http://localhost:7071/api`

### Development Mode (Watch)

```bash
npm run watch
```

This will recompile TypeScript files on changes.

## Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

## Testing

To test the endpoints, you'll need:

1. A valid Auth0 JWT token
2. Cosmos DB running (emulator or cloud)

Example using curl:

```bash
# Create a user
curl -X POST http://localhost:7071/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "auth0UserId": "auth0|123"
  }'

# Get all users
curl http://localhost:7071/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Azure Portal

1. Create a Function App in Azure Portal
2. Configure Application Settings with the environment variables
3. Deploy using VS Code Azure Functions extension or Azure CLI

### Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name deviceloan-rg --location eastus

# Create storage account
az storage account create --name deviceloanstorage --resource-group deviceloan-rg

# Create function app
az functionapp create \
  --resource-group deviceloan-rg \
  --name deviceloan-users-service \
  --storage-account deviceloanstorage \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4

# Configure app settings
az functionapp config appsettings set \
  --name deviceloan-users-service \
  --resource-group deviceloan-rg \
  --settings \
    COSMOS_DB_CONNECTION_STRING="your-connection-string" \
    COSMOS_DB_DATABASE_NAME="deviceloan" \
    COSMOS_DB_CONTAINER_NAME="users" \
    AUTH0_DOMAIN="your-tenant.auth0.com" \
    AUTH0_AUDIENCE="your-api-audience"

# Deploy
npm run build
func azure functionapp publish deviceloan-users-service
```

## Project Structure

- **Domain Layer**: Pure business logic with no external dependencies
- **Application Layer**: Use cases and business workflows
- **Infrastructure Layer**: External services (Cosmos DB)
- **API Layer**: HTTP triggers and authentication

## Security

- All endpoints require Auth0 JWT authentication
- Tokens are validated using JWKS (JSON Web Key Set)
- Connection strings and secrets should be stored in Azure Key Vault in production
- Use Managed Identity for accessing Azure resources

## License

ISC

