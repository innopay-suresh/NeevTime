#!/bin/bash

# Database Initialization Script for Docker Deployment
# Run this script to initialize the database with all required tables

echo "🚀 Initializing database for VayuTime Attendance Management System"
echo ""

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container..."
    cd /app
    node server/scripts/init_all_schemas.js
else
    echo "Running database initialization inside Docker container..."
    echo ""
    
    # Run the initialization script inside the app container
    docker-compose -f docker-compose.production.yml exec app node server/scripts/init_all_schemas.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database initialization completed!"
        echo "You may need to restart the container for changes to take effect:"
        echo "  docker-compose -f docker-compose.production.yml restart app"
    else
        echo ""
        echo "❌ Database initialization failed. Please check the error messages above."
    fi
fi

