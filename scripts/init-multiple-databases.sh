#!/bin/bash

# 🐘 PostgreSQL Multi-Database Initialization Script
# Creates multiple databases for different worktrees automatically

set -e
set -u

function create_user_and_database() {
	local database=$1
	echo "🔧 Creating database '$database'..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
	echo "✅ Database '$database' created successfully!"
}

# Create main database if it doesn't exist
echo "🚀 Initializing PostgreSQL databases..."

# Create additional databases from environment variable if provided
if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
	echo "📋 Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		if [ "$db" != "$POSTGRES_DB" ]; then
			create_user_and_database $db
		fi
	done
	echo "🎉 All databases initialized!"
else
	echo "ℹ️  No additional databases to create"
fi
