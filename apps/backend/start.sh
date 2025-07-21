#!/bin/bash

# Set environment variables for the application
export DATABASE_URL="$DATABASE_URL"
export JWT_SECRET="$JWT_SECRET"
export NODE_ENV="production"

# Debug: Check if environment variables are set
echo "🔍 Environment variables check:"
echo "DATABASE_URL is ${DATABASE_URL:+SET}"
echo "JWT_SECRET is ${JWT_SECRET:+SET}"
echo "NODE_ENV is ${NODE_ENV:+SET}"

# Start the application
echo "🚀 Starting NestJS application..."
node dist/main.js 