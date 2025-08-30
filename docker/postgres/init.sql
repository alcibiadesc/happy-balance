-- Initialize database with required extensions and setup

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Europe/Madrid';

-- Create indexes for better performance (will be created by Prisma migrations too)
-- These are just for reference and will be managed by Prisma

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO expense_user;

-- Set default search path
ALTER DATABASE expense_tracker SET search_path TO public;

-- Performance tuning for better query performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Log configuration for debugging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;