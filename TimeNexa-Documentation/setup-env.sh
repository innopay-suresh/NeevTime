#!/bin/bash

# Environment Setup Helper Script
# This script helps create the .env file with secure defaults

echo "=========================================="
echo "TimeNexa Environment Setup"
echo "=========================================="
echo ""

# Check if .env already exists
if [ -f server/.env ]; then
    read -p ".env file already exists. Overwrite? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

# Gather information
echo "Please provide the following information:"
echo ""

read -p "Database Host [localhost]: " db_host
db_host=${db_host:-localhost}

read -p "Database Port [5432]: " db_port
db_port=${db_port:-5432}

read -p "Database Name [attendance_db]: " db_name
db_name=${db_name:-attendance_db}

read -p "Database User [attendance_user]: " db_user
db_user=${db_user:-attendance_user}

read -sp "Database Password: " db_password
echo ""

read -p "Server URL [http://localhost:3001]: " server_url
server_url=${server_url:-http://localhost:3001}

read -p "Server Port [3001]: " server_port
server_port=${server_port:-3001}

read -p "ADMS Port [8080]: " adms_port
adms_port=${adms_port:-8080}

# Generate JWT secret
echo ""
echo "Generating secure JWT secret..."
jwt_secret=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>/dev/null || openssl rand -hex 64)

# Create .env file
cat > server/.env << EOF
# Server Configuration
NODE_ENV=production
PORT=${server_port}
SERVER_URL=${server_url}

# Database Configuration
DB_HOST=${db_host}
DB_PORT=${db_port}
DB_NAME=${db_name}
DB_USER=${db_user}
DB_PASSWORD=${db_password}

# JWT Secret (Auto-generated)
JWT_SECRET=${jwt_secret}

# ADMS Configuration
ADMS_PORT=${adms_port}
ADMS_TIMEOUT=30000

# Email Configuration (Optional - leave empty if not using)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@timenexa.com

# Logging
LOG_LEVEL=info
LOG_FILE=server.log
EOF

echo ""
echo "✓ .env file created at server/.env"
echo ""
echo "Next steps:"
echo "1. Review server/.env and adjust if needed"
echo "2. Ensure database is set up"
echo "3. Start the application"
echo ""
echo "For Docker: docker-compose -f docker-compose.production.yml up -d"
echo "For Standalone: pm2 start server/server.js --name attendance-api"

