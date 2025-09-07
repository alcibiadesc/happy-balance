-- Development Database Initialization
-- This file is automatically run when the PostgreSQL container starts

-- Create additional databases if needed
-- CREATE DATABASE expense_tracker_test;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Development database initialized successfully!';
END $$;