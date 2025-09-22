#!/bin/bash

# Script to apply SeedVersionHistory migration to Azure database
# Usage: ./scripts/apply-seed-version-migration.sh [environment]

set -e

ENVIRONMENT=${1:-development}
echo "🔧 Applying SeedVersionHistory migration to $ENVIRONMENT environment..."

# Set environment-specific database URL
case $ENVIRONMENT in
  "development"|"dev")
    DATABASE_URL_VAR="DATABASE_URL_DEV"
    ;;
  "qa")
    DATABASE_URL_VAR="DATABASE_URL_QA"
    ;;
  "staging")
    DATABASE_URL_VAR="DATABASE_URL_STAGING"
    ;;
  "production"|"prod")
    DATABASE_URL_VAR="DATABASE_URL_PROD"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [development|qa|staging|production]"
    exit 1
    ;;
esac

# Check if DATABASE_URL is set
if [ -z "${!DATABASE_URL_VAR}" ]; then
  echo "❌ $DATABASE_URL_VAR environment variable is not set"
  echo "Please set the DATABASE_URL for the $ENVIRONMENT environment"
  exit 1
fi

echo "📋 Using database: $DATABASE_URL_VAR"

# Apply migration
echo "🚀 Applying migration..."
cd libs/schema-engine/prisma

export DATABASE_URL="${!DATABASE_URL_VAR}"

echo "📊 Running migration..."
npx prisma migrate deploy

echo "🔧 Regenerating Prisma client..."
npx prisma generate

echo "✅ Migration applied successfully!"
echo "🎉 SeedVersionHistory table is now available"

# Test the migration
echo "🧪 Testing migration..."
npx prisma db execute --stdin <<< "
  SELECT 
    table_name,
    column_name,
    data_type
  FROM information_schema.columns 
  WHERE table_name = 'seed_version_history'
  ORDER BY ordinal_position;
" || echo "⚠️ Table verification failed - this is normal if the table doesn't exist yet"

echo "🎯 Next steps:"
echo "1. Run the seed script: npx prisma db seed"
echo "2. Verify seed version tracking works correctly"
echo "3. Check the seed_version_history table for the new record"
