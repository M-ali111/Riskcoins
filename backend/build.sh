#!/usr/bin/env bash
# exit on error
set -o errexit

# Debug: Show current directory and contents
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
