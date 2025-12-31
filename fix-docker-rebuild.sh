#!/bin/bash

# Fix Docker Compose Image Not Found Error
# This script stops containers, removes them, and rebuilds fresh

echo "🔧 Fixing Docker Compose image issues..."

# Stop all containers
echo "Stopping containers..."
docker-compose -f docker-compose.production.yml down

# Remove the problematic container if it exists
echo "Removing old container..."
docker rm -f attendance_app 2>/dev/null || true

# Remove the old image if it exists (optional, will be rebuilt)
echo "Cleaning up old images..."
docker image prune -f

# Rebuild the image from scratch
echo "Building fresh image..."
docker-compose -f docker-compose.production.yml build --no-cache app

# Start services
echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo "✅ Done! Check status with: docker-compose -f docker-compose.production.yml ps"

