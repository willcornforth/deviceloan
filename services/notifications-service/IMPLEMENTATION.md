# Notifications Service - Implementation Summary

## Overview

The `deviceloan-notifications-service` has been successfully created following the same clean architecture pattern as the existing services in the device loan system.

## Architecture

### Domain Layer (`src/domain/`)
- **notification.ts** - Core domain models:
  - `Notification`: Represents a sent or pending notification
  - `NotificationPreference`: User subscription to product notifications
  - `NotificationRepo`: Repository interface for data access
  - Types: `NotificationType` (email, sms, push), `NotificationStatus` (pending, sent, failed)

- **email-sender.ts** - Email sending abstraction
- **events.ts** - Event data models for Event Grid integration

### Application Layer (`src/app/`)
Business logic for:
- `create-preference.ts` - Subscribe to product notifications
- `delete-preference.ts` - Unsubscribe from notifications
- `get-preferences.ts` - Get user's notification preferences
- `get-notification-history.ts` - View sent notifications
- `handle-product-released.ts` - Notify users when watched products become available
- `handle-loan-approved.ts` - Notify user when loan is approved
- `handle-loan-rejected.ts` - Notify user when loan is rejected
- `handle-loan-returned.ts` - Notify user when loan is returned

### Infrastructure Layer (`src/infra/`)
- **cosmos-notification-repo.ts** - Cosmos DB implementation using partition keys
  - Partition strategy: `preference-{userId}` for preferences, `notification-{userId}` for notifications
  - Supports querying by user, product, and notification history
  
- **azure-communication-email-sender.ts** - Azure Communication Services email integration
- **response-builder.ts** - Standardized HTTP response formatting

### Functions Layer (`src/functions/`)

#### HTTP Endpoints
1. **subscribe-http** - `POST /users/{userId}/notifications/subscribe`
   - Body: `{ productId, notificationTypes }`
   - Creates notification preference for a user/product

2. **unsubscribe-http** - `DELETE /users/{userId}/notifications/unsubscribe/{productId}`
   - Removes notification preference

3. **get-preferences-http** - `GET /users/{userId}/notifications/preferences`
   - Returns all user's notification preferences

4. **get-notification-history-http** - `GET /users/{userId}/notifications?limit=50`
   - Returns notification history with optional limit

#### Event Grid Handlers
1. **product-released-eventgrid** - Listens to `Product.Released`
   - Finds users watching the product
   - Sends email notifications
   - Stores notification history

2. **loan-approved-eventgrid** - Listens to `Loan.Approved`
   - Sends approval email to user
   - Includes return date

3. **loan-rejected-eventgrid** - Listens to `Loan.Rejected`
   - Sends rejection email with reason

4. **loan-returned-eventgrid** - Listens to `Loan.Returned`
   - Sends confirmation email

### Configuration (`src/config/`)
- **app-config.ts** - Dependency injection container
  - Creates Cosmos DB client
  - Creates Azure Communication Services client
  - Wires up repositories and services

## Data Model

### Cosmos DB Container: `notifications`

**Preference Document:**
```json
{
  "id": "uuid",
  "type": "preference",
  "partitionKey": "preference-{userId}",
  "userId": "user123",
  "productId": "product456",
  "notificationTypes": ["email"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Notification Document:**
```json
{
  "id": "uuid",
  "type": "notification",
  "partitionKey": "notification-{userId}",
  "userId": "user123",
  "type": "email",
  "subject": "Product Available: Laptop",
  "message": "The product you were watching is now available!",
  "status": "sent",
  "productId": "product456",
  "loanId": "loan789",
  "createdAt": "2025-01-01T00:00:00Z",
  "sentAt": "2025-01-01T00:00:05Z"
}
```

## Event Flow

1. **Product becomes available** (returned, rejected loan, etc.)
   - Products Service publishes `Product.Released` event
   - Notifications Service receives event
   - Queries for users subscribed to that product
   - Sends email to each subscribed user
   - Records notification in database

2. **Loan state changes** (approved, rejected, returned)
   - Loans Service publishes `Loan.Approved/Rejected/Returned` event
   - Notifications Service receives event
   - Sends email to loan owner
   - Records notification in database

## Environment Variables

Required configuration in `local.settings.json` and Azure:

- `COSMOS_ENDPOINT` - Cosmos DB endpoint URL
- `COSMOS_KEY` - Cosmos DB access key
- `COSMOS_DATABASE` - Database name (default: `deviceloan-notifications`)
- `COSMOS_CONTAINER` - Container name (default: `notifications`)
- `COMMUNICATION_CONNECTION_STRING` - Azure Communication Services connection string
- `SENDER_EMAIL_ADDRESS` - Sender email address (default: `DoNotReply@deviceloan.com`)

## Testing

Run tests with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Azure resource provisioning (Cosmos DB, Communication Services, Function App)
- Event Grid subscription setup
- Environment variable configuration
- Deployment commands

## Integration Points

### With Products Service
- Listens to `Product.Released` events
- Notifies users watching the product

### With Loans Service
- Listens to `Loan.Approved`, `Loan.Rejected`, `Loan.Returned` events
- Notifies loan owners of status changes

### With API Gateway (Future)
- Could expose notification endpoints through gateway
- Gateway could aggregate notifications with other user data

## Status

✅ Complete and building successfully
- All TypeScript compiles without errors
- Dependencies installed
- Clean architecture implemented
- HTTP endpoints created
- Event Grid handlers implemented
- Cosmos DB repository with proper partitioning
- Azure Communication Services integration
- Ready for testing and deployment
