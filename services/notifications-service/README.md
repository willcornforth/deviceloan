# Device Loan Notifications Service

Azure Functions v4 TypeScript service for handling notifications in the device loan system.

## Features

- **Event Grid Integration**: Listens to product and loan events
- **Cosmos DB**: Stores user notification preferences and history
- **Azure Communication Services**: Sends email notifications
- **Notification Types**: Email, SMS, Push (extensible)

## Project Structure

```
src/
  domain/          - Domain models (Notification, NotificationPreference)
  app/             - Application logic (business rules)
  functions/       - Azure Functions (HTTP endpoints, Event Grid handlers)
  infra/           - Infrastructure (Cosmos DB, Azure Communication Services)
  config/          - Configuration and dependency injection
  __tests__/       - Unit and integration tests
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `local.settings.json`:
   - Set Cosmos DB connection details
   - Set Event Grid endpoint and key
   - Set Azure Communication Services connection string

3. Build the project:
   ```bash
   npm run build
   ```

4. Run locally:
   ```bash
   npm start
   ```

## API Endpoints

### Notification Preferences
- `POST /users/{userId}/notifications/subscribe` - Subscribe to product notifications
- `DELETE /users/{userId}/notifications/unsubscribe` - Unsubscribe from notifications
- `GET /users/{userId}/notifications/preferences` - Get user preferences

### Notification History
- `GET /users/{userId}/notifications` - Get notification history

## Event Handlers

- `Product.Released` - Notify users waiting for product availability
- `Loan.Approved` - Notify user when their loan is approved
- `Loan.Rejected` - Notify user when their loan is rejected  
- `Loan.Returned` - Notify admin when loan is returned

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL |
| `COSMOS_KEY` | Cosmos DB access key |
| `COSMOS_DATABASE` | Database name |
| `COSMOS_CONTAINER` | Container name |
| `EVENTGRID_ENDPOINT` | Event Grid topic endpoint |
| `EVENTGRID_KEY` | Event Grid access key |
| `COMMUNICATION_CONNECTION_STRING` | Azure Communication Services connection string |
