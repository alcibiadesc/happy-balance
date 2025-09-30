#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss --skip-generate || echo "⚠️  Database migration failed, continuing anyway..."

echo "✅ Starting backend server..."
exec pnpm dev
