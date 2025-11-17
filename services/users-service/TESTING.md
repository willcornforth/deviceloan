# Testing the Users Service API

This document provides examples for testing the API endpoints locally.

## Prerequisites

1. Start the Azure Functions locally:
   ```bash
   npm run build
   npm start
   ```

2. Obtain an Auth0 JWT token (you'll need this for all requests)

## Example Requests

### 1. Create a User

```bash
curl -X POST http://localhost:7071/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "auth0UserId": "auth0|123456789"
  }'
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "auth0UserId": "auth0|123456789",
  "createdAt": "2024-11-17T12:00:00.000Z",
  "isActive": true
}
```

### 2. Get All Users

```bash
curl http://localhost:7071/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "auth0UserId": "auth0|123456789",
    "createdAt": "2024-11-17T12:00:00.000Z",
    "isActive": true
  }
]
```

### 3. Get User by ID

```bash
curl http://localhost:7071/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "auth0UserId": "auth0|123456789",
  "createdAt": "2024-11-17T12:00:00.000Z",
  "isActive": true
}
```

### 4. Update User

```bash
curl -X PUT http://localhost:7071/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "isActive": true
  }'
```

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "auth0UserId": "auth0|123456789",
  "createdAt": "2024-11-17T12:00:00.000Z",
  "updatedAt": "2024-11-17T12:30:00.000Z",
  "isActive": true
}
```

### 5. Delete User

```bash
curl -X DELETE http://localhost:7071/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (204):**
No content

## Error Responses

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Not Found (404)
```json
{
  "error": "User not found"
}
```

### Bad Request (400)
```json
{
  "error": "Missing required fields: email, firstName, lastName, auth0UserId"
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## Using Postman

1. Import the collection (create a new collection in Postman)
2. Set the base URL: `http://localhost:7071/api`
3. Add Authorization header: `Bearer YOUR_JWT_TOKEN`
4. Test each endpoint

## Getting an Auth0 Token for Testing

### Method 1: Using Auth0 Dashboard

1. Go to your Auth0 Dashboard
2. Navigate to Applications > APIs
3. Click on your API
4. Go to "Test" tab
5. Copy the test token

### Method 2: Using Client Credentials Flow

```bash
curl --request POST \
  --url https://YOUR_DOMAIN.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"YOUR_CLIENT_ID",
    "client_secret":"YOUR_CLIENT_SECRET",
    "audience":"YOUR_API_AUDIENCE",
    "grant_type":"client_credentials"
  }'
```

## Troubleshooting

### Issue: Connection to Cosmos DB fails
- Make sure Cosmos DB is running (emulator or cloud)
- Verify connection string in `local.settings.json`
- Check that database and container exist

### Issue: Auth0 validation fails
- Verify `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are correct
- Check that token is valid and not expired
- Ensure token is for the correct audience

### Issue: Functions not starting
- Run `npm run build` first
- Check that all dependencies are installed
- Verify Node.js version (20.x recommended)
