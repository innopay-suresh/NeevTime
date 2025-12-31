#!/bin/bash

# Fix Docker Container Name Conflict
# Run this script to clean up old containers and start fresh

echo "🔧 Fixing Docker container conflicts..."

# Stop all containers
echo "Stopping containers..."
docker-compose -f docker-compose.production.yml down

# Remove the conflicting containers
echo "Removing old containers..."
docker rm -f attendance_db 2>/dev/null || true
docker rm -f attendance_app 2>/dev/null || true

# Remove any orphaned containers
echo "Cleaning up..."
docker container prune -f

# Start services fresh
echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo "✅ Done! Check status with: docker-compose -f docker-compose.production.yml ps"

