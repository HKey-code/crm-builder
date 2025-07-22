#!/bin/bash

# Set environment variables for the application
export DATABASE_URL="${DATABASE_URL:-}"
export JWT_SECRET="${JWT_SECRET:-}"
export NODE_ENV="production"

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "🔧 Please configure DATABASE_URL in Azure App Service settings"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set"
    echo "🔧 Please configure JWT_SECRET in Azure App Service settings"
    exit 1
fi

# Debug: Check if environment variables are set
echo "🔍 Environment variables check:"
echo "DATABASE_URL is ${DATABASE_URL:+SET}"
echo "JWT_SECRET is ${JWT_SECRET:+SET}"
echo "NODE_ENV is ${NODE_ENV:+SET}"

# Start the application
echo "🚀 Starting NestJS application..."
node main.js 