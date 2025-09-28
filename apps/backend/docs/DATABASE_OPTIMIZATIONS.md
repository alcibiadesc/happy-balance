# Database Optimizations

## Current Indices

The following indices are configured in the database schema for optimal query performance:

### Transactions Table

- **date** - For date range queries (dashboard, reports)
- **merchant** - For merchant-based searches and filters
- **type** - For filtering by transaction type (INCOME/EXPENSE/INVESTMENT)
- **categoryId** - For category-based aggregations
- **currency** - For currency filtering
- **createdAt** - For sorting by creation time
- **hash** - For duplicate detection
- **hidden** - For filtering hidden transactions

### Categories Table

- **type** - For filtering categories by transaction type
- **isActive** - For filtering active/inactive categories
- **parentId** - For hierarchical category queries
- **Unique(name, type)** - Ensures no duplicate category names per type

### Import Logs Table

- **status** - For filtering by import status
- **startedAt** - For time-based queries

### Performance Improvements

1. **Compound indices for common queries**:
   - Consider adding `(date, type)` for dashboard queries
   - Consider adding `(merchant, date)` for merchant history

2. **Query optimization tips**:
   - Use pagination for large result sets
   - Implement cursor-based pagination for infinite scroll
   - Cache frequently accessed data (dashboard metrics)

3. **Future optimizations**:
   - Partition transactions table by date for very large datasets
   - Implement materialized views for complex aggregations
   - Add database connection pooling for high concurrency

## Query Analysis

### Most Common Queries

1. **Dashboard metrics** - Uses date, type indices
2. **Transaction list** - Uses date, createdAt indices
3. **Category breakdown** - Uses categoryId, type indices
4. **Duplicate detection** - Uses hash index
5. **Merchant search** - Uses merchant index

### Monitoring

- Monitor slow queries using PostgreSQL's `pg_stat_statements`
- Use `EXPLAIN ANALYZE` for query optimization
- Set up alerts for queries taking > 1 second
