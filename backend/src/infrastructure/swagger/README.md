# API Documentation - Happy Balance

## Overview
Complete API documentation for Happy Balance application using Swagger/OpenAPI 3.0 specification.

## Accessing Swagger Documentation

### 1. Web Interface (Swagger UI)
Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

Alternative servers:
- `http://192.168.1.139:3000/api-docs`
- `http://100.100.8.83:3000/api-docs`

### 2. OpenAPI Specification (JSON)
Download the raw OpenAPI specification:
```
http://localhost:3000/api-docs.json
```

## Features

### Interactive Documentation
- **Try it out**: Test API endpoints directly from the browser
- **Request/Response Examples**: View sample requests and responses
- **Schema Definitions**: Explore data models and structures
- **Authentication**: Test authenticated endpoints (when configured)

### API Endpoints Documented

#### Transactions (`/api/transactions`)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - List transactions with filters
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `DELETE /api/transactions` - Delete all transactions
- `GET /api/transactions/statistics` - Get transaction statistics
- `GET /api/transactions/dashboard` - Get dashboard data

#### Import Operations (`/api/import`)
- `POST /api/import/csv` - Import from CSV file
- `POST /api/import/excel` - Import from Excel file
- `POST /api/import/preview` - Preview CSV file before import
- `POST /api/import/validate` - Validate CSV file
- `POST /api/import/check-duplicates` - Check for duplicate transactions
- `POST /api/import/selected` - Import selected transactions
- `GET /api/import/history` - Get import history

#### User Preferences (`/api/preferences`)
- `GET /api/preferences` - Get current user preferences
- `POST /api/preferences` - Create user preferences
- `GET /api/preferences/:userId` - Get preferences by user ID
- `PUT /api/preferences/:userId` - Update user preferences
- `DELETE /api/preferences/:userId` - Delete user preferences

#### Health Check
- `GET /health` - API health status

## Data Models

### Transaction
- Complete transaction entity with amount, currency, date, merchant, type, and category

### Dashboard Data
- Summary statistics (income, expenses, balance, savings rate)
- Category breakdown with percentages
- Monthly trends
- Recent transactions

### Import Operations
- CSV/Excel file upload with column mapping
- Duplicate detection using transaction hashes
- Validation with detailed error reporting
- Import history tracking

### User Preferences
- Theme settings (light/dark/auto)
- Currency and language preferences
- Notification settings
- Privacy settings

## Request/Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... },
  "code": "ERROR_CODE"
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Testing the API

### Using Swagger UI
1. Navigate to `/api-docs`
2. Select an endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"
6. View the response

### Using cURL
Example requests are provided in Swagger UI for each endpoint.

### Using Postman
Import the OpenAPI spec from `/api-docs.json` into Postman for a complete collection.

## Configuration

### Environment Variables
Ensure the following are configured:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Additional CORS origins

### Security
- CORS is configured for specified origins
- Helmet.js for security headers
- Input validation using Zod schemas
- File upload limits configured

## Development

### Adding New Endpoints
1. Define the route in the appropriate routes file
2. Add JSDoc comments with @swagger annotations
3. Update schema definitions in `swagger.config.ts`
4. Restart the server to see changes

### Updating Documentation
The documentation is generated from:
- JSDoc comments in `api-docs.ts`
- Schema definitions in `swagger.config.ts`
- Route definitions in route files

## Support
For issues or questions about the API documentation, please refer to the main project README or contact the development team.