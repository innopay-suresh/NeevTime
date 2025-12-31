#!/bin/bash

# TimeNexa Deployment Script
# This script helps automate the deployment process

set -e

echo "=========================================="
echo "TimeNexa Attendance Management Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "Please do not run as root. Use a regular user with sudo privileges."
   exit 1
fi

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
MISSING_DEPS=()

if ! command_exists node; then
    MISSING_DEPS+=("nodejs")
fi

if ! command_exists npm; then
    MISSING_DEPS+=("npm")
fi

if ! command_exists psql; then
    MISSING_DEPS+=("postgresql")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "Missing dependencies: ${MISSING_DEPS[*]}"
    echo "Please install them first:"
    echo "  sudo apt update"
    echo "  sudo apt install -y ${MISSING_DEPS[*]}"
    exit 1
fi

echo "✓ All prerequisites met"
echo ""

# Ask for deployment method
echo "Select deployment method:"
echo "1) Docker (Recommended)"
echo "2) Standalone Server"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "=== Docker Deployment ==="
        
        if ! command_exists docker; then
            echo "Docker not found. Installing..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            echo "Please log out and log back in, then run this script again."
            exit 0
        fi
        
        if ! command_exists docker-compose; then
            echo "Docker Compose not found. Installing..."
            sudo apt install -y docker-compose-plugin
        fi
        
        # Check for .env file
        if [ ! -f .env ]; then
            echo "Creating .env file..."
            read -p "Enter database password: " db_pass
            read -p "Enter server URL (e.g., http://your-domain.com): " server_url
            
            jwt_secret=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
            
            cat > .env << EOF
DB_PASSWORD=$db_pass
JWT_SECRET=$jwt_secret
SERVER_URL=$server_url
DB_NAME=attendance_db
DB_USER=postgres
EOF
            echo "✓ .env file created"
        fi
        
        echo "Building and starting containers..."
        docker-compose -f docker-compose.production.yml up -d --build
        
        echo "Waiting for services to be ready..."
        sleep 10
        
        echo "Initializing database..."
        docker-compose -f docker-compose.production.yml exec -T app node scripts/init_db.js || echo "Database may already be initialized"
        
        echo ""
        echo "✓ Deployment complete!"
        echo "Application should be available at: http://your-server-ip"
        echo ""
        echo "Check status: docker-compose -f docker-compose.production.yml ps"
        echo "View logs: docker-compose -f docker-compose.production.yml logs -f"
        ;;
        
    2)
        echo ""
        echo "=== Standalone Server Deployment ==="
        echo "Please follow the detailed instructions in DEPLOYMENT_GUIDE.md"
        echo "This script will help with basic setup..."
        
        # Install PM2 if not present
        if ! command_exists pm2; then
            echo "Installing PM2..."
            sudo npm install -g pm2
        fi
        
        # Install dependencies
        echo "Installing server dependencies..."
        cd server && npm install --production && cd ..
        
        echo "Installing client dependencies..."
        cd client && npm install && cd ..
        
        echo "Building frontend..."
        cd client && npm run build && cd ..
        
        echo ""
        echo "✓ Dependencies installed and frontend built"
        echo ""
        echo "Next steps:"
        echo "1. Configure server/.env file (see server/.env.example)"
        echo "2. Set up PostgreSQL database (see DEPLOYMENT_GUIDE.md)"
        echo "3. Start server: cd server && pm2 start server.js --name attendance-api"
        echo "4. Configure Nginx (see DEPLOYMENT_GUIDE.md)"
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo "For troubleshooting, see TROUBLESHOOTING_GUIDE.md"

