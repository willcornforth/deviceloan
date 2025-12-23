# Notifications Service Deployment Guide

## Azure Resources Setup

### 1. Cosmos DB Setup

Create a Cosmos DB account and database:

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name deviceloan-notifications-db \
  --resource-group deviceloan-rg \
  --locations regionName=northeurope

# Create database
az cosmosdb sql database create \
  --account-name deviceloan-notifications-db \
  --resource-group deviceloan-rg \
  --name deviceloan-notifications

# Create container with partition key
az cosmosdb sql container create \
  --account-name deviceloan-notifications-db \
  --resource-group deviceloan-rg \
  --database-name deviceloan-notifications \
  --name notifications \
  --partition-key-path "/partitionKey"
```

### 2. Azure Communication Services Setup

Create an Azure Communication Services resource:

```bash
# Create Communication Services
az communication create \
  --name deviceloan-notifications-comm \
  --resource-group deviceloan-rg \
  --location global \
  --data-location Europe

# Get connection string
az communication list-key \
  --name deviceloan-notifications-comm \
  --resource-group deviceloan-rg
```

### 3. Event Grid Setup

Subscribe to events from Products and Loans services:

```bash
# Get the Function App endpoint
FUNCTION_APP_URL="https://deviceloan-notifications-service.azurewebsites.net"

# Subscribe to Product.Released events
az eventgrid event-subscription create \
  --name product-released-notifications \
  --source-resource-id /subscriptions/{subscription-id}/resourceGroups/deviceloan-rg/providers/Microsoft.EventGrid/topics/deviceloan-products \
  --endpoint "${FUNCTION_APP_URL}/runtime/webhooks/eventgrid?functionName=product-released-eventgrid" \
  --endpoint-type webhook \
  --included-event-types Product.Released

# Subscribe to Loan.Approved events
az eventgrid event-subscription create \
  --name loan-approved-notifications \
  --source-resource-id /subscriptions/{subscription-id}/resourceGroups/deviceloan-rg/providers/Microsoft.EventGrid/topics/deviceloan-loans \
  --endpoint "${FUNCTION_APP_URL}/runtime/webhooks/eventgrid?functionName=loan-approved-eventgrid" \
  --endpoint-type webhook \
  --included-event-types Loan.Approved

# Subscribe to Loan.Rejected events
az eventgrid event-subscription create \
  --name loan-rejected-notifications \
  --source-resource-id /subscriptions/{subscription-id}/resourceGroups/deviceloan-rg/providers/Microsoft.EventGrid/topics/deviceloan-loans \
  --endpoint "${FUNCTION_APP_URL}/runtime/webhooks/eventgrid?functionName=loan-rejected-eventgrid" \
  --endpoint-type webhook \
  --included-event-types Loan.Rejected

# Subscribe to Loan.Returned events
az eventgrid event-subscription create \
  --name loan-returned-notifications \
  --source-resource-id /subscriptions/{subscription-id}/resourceGroups/deviceloan-rg/providers/Microsoft.EventGrid/topics/deviceloan-loans \
  --endpoint "${FUNCTION_APP_URL}/runtime/webhooks/eventgrid?functionName=loan-returned-eventgrid" \
  --endpoint-type webhook \
  --included-event-types Loan.Returned
```

### 4. Function App Deployment

```bash
# Create Function App
az functionapp create \
  --name deviceloan-notifications-service \
  --resource-group deviceloan-rg \
  --storage-account deviceloanstorageacc \
  --consumption-plan-location northeurope \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4

# Configure app settings
az functionapp config appsettings set \
  --name deviceloan-notifications-service \
  --resource-group deviceloan-rg \
  --settings \
    "COSMOS_ENDPOINT=<cosmos-endpoint>" \
    "COSMOS_KEY=<cosmos-key>" \
    "COSMOS_DATABASE=deviceloan-notifications" \
    "COSMOS_CONTAINER=notifications" \
    "COMMUNICATION_CONNECTION_STRING=<comm-connection-string>" \
    "SENDER_EMAIL_ADDRESS=DoNotReply@deviceloan.com"

# Deploy the function app
npm run build
func azure functionapp publish deviceloan-notifications-service
```

## Environment Variables

Configure these in Azure Portal or via CLI:

- `COSMOS_ENDPOINT` - Cosmos DB endpoint URL
- `COSMOS_KEY` - Cosmos DB access key
- `COSMOS_DATABASE` - Database name (deviceloan-notifications)
- `COSMOS_CONTAINER` - Container name (notifications)
- `COMMUNICATION_CONNECTION_STRING` - Azure Communication Services connection string
- `SENDER_EMAIL_ADDRESS` - Sender email address for notifications

## Testing

Test HTTP endpoints:

```bash
# Subscribe to notifications
curl -X POST https://deviceloan-notifications-service.azurewebsites.net/api/users/user123/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product456",
    "notificationTypes": ["email"]
  }'

# Get preferences
curl https://deviceloan-notifications-service.azurewebsites.net/api/users/user123/notifications/preferences

# Get notification history
curl https://deviceloan-notifications-service.azurewebsites.net/api/users/user123/notifications

# Unsubscribe
curl -X DELETE https://deviceloan-notifications-service.azurewebsites.net/api/users/user123/notifications/unsubscribe/product456
```
