# 🐧 Docker Deployment Guide for Linux Server

## 📋 Table of Contents
1. [Server Requirements](#server-requirements)
2. [Step 1: Connect to Your Linux Server](#step-1-connect-to-your-linux-server)
3. [Step 2: Install Docker on Linux](#step-2-install-docker-on-linux)
4. [Step 3: Upload Your Application](#step-3-upload-your-application)
5. [Step 4: Create Environment File](#step-4-create-environment-file)
6. [Step 5: Build and Start](#step-5-build-and-start)
7. [Step 6: Set Up Auto-Start on Reboot](#step-6-set-up-auto-start-on-reboot)
8. [Step 7: Configure Firewall](#step-7-configure-firewall)
9. [Common Commands](#common-commands)
10. [Troubleshooting](#troubleshooting)
11. [Production Optimizations](#production-optimizations)

---

## Server Requirements

- **Operating System**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Disk Space**: At least 10GB free
- **Root or Sudo Access**: Required for installation

---

## Step 1: Connect to Your Linux Server

### If you have SSH access:

```bash
ssh username@your-server-ip
```

**Example:**
```bash
ssh root@192.168.1.100
# or
ssh ubuntu@example.com
```

Enter your password when prompted.

### If you're already on the server:
Open a terminal and continue to Step 2.

---

## Step 2: Install Docker on Linux

### For Ubuntu/Debian:

```bash
# Update package index
sudo apt-get update

# Install required packages
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

### For CentOS/RHEL:

```bash
# Install required packages
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
sudo docker compose version
```

### Add your user to docker group (Optional but Recommended):

This allows you to run Docker commands without `sudo`:

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply the changes (you'll need to log out and back in, or run:)
newgrp docker

# Verify you can run docker without sudo
docker ps
```

**Note**: After adding user to docker group, you may need to log out and log back in for changes to take effect.

---

## Step 3: Upload Your Application

You have several options:

### Option A: Using Git (Recommended)

```bash
# Install Git if not already installed
sudo apt-get install -y git  # Ubuntu/Debian
# or
sudo yum install -y git      # CentOS/RHEL

# Clone your repository (if using Git)
cd /opt
sudo git clone https://github.com/yourusername/your-repo.git attendance-app
cd attendance-app

# Or if you have a private repo, use SSH or provide credentials
```

### Option B: Using SCP (from your local machine)

From your local computer (Mac/Windows/Linux), upload the files:

```bash
# Compress your project folder first (on local machine)
cd "/Users/suresh/Desktop"
tar -czf attendance-app.tar.gz "Attendance Management"

# Upload to server
scp attendance-app.tar.gz username@your-server-ip:/opt/

# Then on the server:
ssh username@your-server-ip
cd /opt
tar -xzf attendance-app.tar.gz
cd "Attendance Management"
```

### Option C: Using SFTP (FileZilla, WinSCP, etc.)

1. Connect to your server using SFTP
2. Navigate to `/opt` directory
3. Upload your entire project folder
4. Extract if compressed

### Option D: Direct Transfer (if you have server file access)

```bash
# Create directory
sudo mkdir -p /opt/attendance-app
cd /opt/attendance-app

# Copy files here (use your preferred method)
```

**Recommended Location**: `/opt/attendance-app` or `/var/www/attendance-app`

---

## Step 4: Create Environment File

Navigate to your application directory:

```bash
cd /opt/attendance-app
# or wherever you placed your files
cd "/opt/Attendance Management"
```

Create the `.env` file:

```bash
# Create the .env file
nano .env
```

**Paste this content** (use `Ctrl+Shift+V` to paste in nano):

```env
# Database Settings
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!ChangeThis
DB_NAME=attendance_db
DB_PORT=5432

# JWT Secret - Generate a random string: openssl rand -base64 32
JWT_SECRET=change_this_to_random_string_at_least_32_characters_long

# Server Settings
HTTP_PORT=80
API_PORT=3001
ADMS_PORT=8080
SERVER_URL=http://your-server-ip
```

**Important**: 
- Replace `YourSecurePassword123!ChangeThis` with a STRONG password
- Replace `change_this_to_random_string_at_least_32_characters_long` with a random string
- Replace `your-server-ip` with your actual server IP or domain name

**To generate a random JWT secret:**
```bash
openssl rand -base64 32
```

**Save the file:**
- Press `Ctrl+O` (to write/overwrite)
- Press `Enter` (to confirm filename)
- Press `Ctrl+X` (to exit)

**Set proper permissions** (important for security):
```bash
chmod 600 .env
```

---

## Step 5: Build and Start

### Navigate to your application directory:

```bash
cd /opt/attendance-app
# or your actual path
```

### Build and start everything:

```bash
# Using docker compose (newer syntax)
sudo docker compose -f docker-compose.production.yml up -d --build

# OR if you have older docker-compose (separate binary)
sudo docker-compose -f docker-compose.production.yml up -d --build
```

**What this does:**
- Builds the Docker images
- Starts all containers (database, backend, frontend)
- Runs in background (`-d` flag)

**This takes 5-10 minutes the first time.** Wait for it to complete.

### Check if everything is running:

```bash
sudo docker compose -f docker-compose.production.yml ps
```

You should see:
- `attendance_db` - Status: Up
- `attendance_app` - Status: Up

### View logs (to see what's happening):

```bash
# All services
sudo docker compose -f docker-compose.production.yml logs -f

# Just the app (press Ctrl+C to exit)
sudo docker compose -f docker-compose.production.yml logs -f app
```

---

## Step 6: Set Up Auto-Start on Reboot

Docker Compose will automatically start containers if you use the `restart: always` policy (which your compose file should have).

However, to ensure Docker itself starts on boot:

```bash
# Enable Docker service
sudo systemctl enable docker

# Enable Docker Compose (if installed as plugin, it's part of Docker)
# The restart: always in docker-compose.yml handles container auto-start
```

**Test auto-start:**
```bash
# Reboot the server
sudo reboot

# After reboot, SSH back in and check:
sudo docker compose -f docker-compose.production.yml ps
```

All containers should automatically start.

---

## Step 7: Configure Firewall

Your server needs to allow connections on specific ports.

### For UFW (Ubuntu/Debian):

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443) - for future SSL setup
sudo ufw allow 443/tcp

# If you need direct API access (usually not needed if behind reverse proxy)
sudo ufw allow 3001/tcp

# Enable firewall if not already enabled
sudo ufw enable

# Check status
sudo ufw status
```

### For firewalld (CentOS/RHEL):

```bash
# Allow HTTP
sudo firewall-cmd --permanent --add-service=http

# Allow HTTPS
sudo firewall-cmd --permanent --add-service=https

# If needed, allow port 3001
sudo firewall-cmd --permanent --add-port=3001/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

---

## Common Commands

### View running containers:
```bash
sudo docker compose -f docker-compose.production.yml ps
```

### Stop everything:
```bash
sudo docker compose -f docker-compose.production.yml stop
```

### Start everything:
```bash
sudo docker compose -f docker-compose.production.yml start
```

### Restart everything:
```bash
sudo docker compose -f docker-compose.production.yml restart
```

### View logs:
```bash
# All services
sudo docker compose -f docker-compose.production.yml logs -f

# Specific service
sudo docker compose -f docker-compose.production.yml logs -f app
sudo docker compose -f docker-compose.production.yml logs -f db

# Last 100 lines
sudo docker compose -f docker-compose.production.yml logs --tail=100
```

### Stop and remove (keeps database data):
```bash
sudo docker compose -f docker-compose.production.yml down
```

### Complete reset (⚠️ DELETES ALL DATA):
```bash
sudo docker compose -f docker-compose.production.yml down -v
sudo docker compose -f docker-compose.production.yml up -d --build
```

### Rebuild after code changes:
```bash
sudo docker compose -f docker-compose.production.yml up -d --build
```

### Access container shell (for debugging):
```bash
# App container
sudo docker exec -it attendance_app sh

# Database container
sudo docker exec -it attendance_db psql -U postgres -d attendance_db
```

---

## Troubleshooting

### Problem: "Cannot connect to Docker daemon"
**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Check Docker status
sudo systemctl status docker
```

### Problem: "Permission denied" errors
**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, OR run:
newgrp docker

# Verify
docker ps  # Should work without sudo
```

### Problem: Port 80 already in use
**Solution:**
Check what's using port 80:
```bash
sudo netstat -tulpn | grep :80
# or
sudo lsof -i :80
```

If it's Apache/Nginx, stop it:
```bash
# Ubuntu/Debian
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or for Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### Problem: Out of disk space
**Solution:**
```bash
# Check disk usage
df -h

# Clean up Docker (removes unused images, containers, volumes)
sudo docker system prune -a

# Remove old logs
sudo docker compose -f docker-compose.production.yml logs --tail=0
```

### Problem: Application won't start
**Solution:**
```bash
# Check detailed logs
sudo docker compose -f docker-compose.production.yml logs app

# Check if .env file exists and is correct
cat .env

# Check container status
sudo docker compose -f docker-compose.production.yml ps -a

# Restart everything
sudo docker compose -f docker-compose.production.yml restart
```

### Problem: Database connection errors
**Solution:**
```bash
# Check if database container is running
sudo docker compose -f docker-compose.production.yml ps db

# Check database logs
sudo docker compose -f docker-compose.production.yml logs db

# Verify .env file has correct database password
cat .env | grep DB_PASSWORD

# Wait a bit - database takes 20-30 seconds to fully start
sleep 30
sudo docker compose -f docker-compose.production.yml ps
```

### Problem: Can't access from browser
**Solution:**
1. Check firewall: `sudo ufw status` or `sudo firewall-cmd --list-all`
2. Check if port is listening: `sudo netstat -tulpn | grep :80`
3. Check server IP: `curl ifconfig.me` or `hostname -I`
4. Try accessing: `http://your-server-ip`
5. Check Docker logs: `sudo docker compose -f docker-compose.production.yml logs`

---

## Production Optimizations

### 1. Set up SSL/HTTPS (Recommended)

Use Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt-get install -y certbot  # Ubuntu/Debian
# or
sudo yum install -y certbot      # CentOS/RHEL

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in: /etc/letsencrypt/live/yourdomain.com/
```

Then set up a reverse proxy (Nginx) in front of Docker to handle SSL.

### 2. Set up Reverse Proxy (Nginx) - Recommended for Production

```bash
# Install Nginx
sudo apt-get install -y nginx  # Ubuntu/Debian

# Create Nginx config
sudo nano /etc/nginx/sites-available/attendance
```

Paste this (replace `yourdomain.com` with your domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Regular Backups

Create a backup script:

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup-attendance.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker compose -f /opt/attendance-app/docker-compose.production.yml exec -T db pg_dump -U postgres attendance_db > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

Make it executable:
```bash
chmod +x ~/backup-attendance.sh
```

Set up cron job (daily at 2 AM):
```bash
crontab -e
```

Add:
```
0 2 * * * /home/yourusername/backup-attendance.sh
```

### 4. Monitor Disk Space

```bash
# Check disk usage
df -h

# Set up alert if disk > 80% full
# (add to monitoring solution)
```

### 5. Update Regularly

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y  # Ubuntu/Debian
# or
sudo yum update -y                               # CentOS/RHEL

# Update Docker images
cd /opt/attendance-app
sudo docker compose -f docker-compose.production.yml pull
sudo docker compose -f docker-compose.production.yml up -d
```

---

## Quick Reference Card

```bash
# Navigate to app directory
cd /opt/attendance-app

# Start everything
sudo docker compose -f docker-compose.production.yml up -d --build

# Stop everything
sudo docker compose -f docker-compose.production.yml down

# View logs
sudo docker compose -f docker-compose.production.yml logs -f

# Check status
sudo docker compose -f docker-compose.production.yml ps

# Restart
sudo docker compose -f docker-compose.production.yml restart

# Access database
sudo docker exec -it attendance_db psql -U postgres -d attendance_db
```

---

## Complete Installation Script (All-in-One)

If you want to automate everything, here's a complete script:

```bash
#!/bin/bash
set -e

echo "=== Attendance Management Docker Setup ==="

# Install Docker (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

echo "=== Docker installed successfully ==="
echo "Please log out and log back in, then run the application setup"
```

Save as `install-docker.sh`, make executable: `chmod +x install-docker.sh`, run: `./install-docker.sh`

---

**That's it! Your application is now running on Linux! 🎉**

For help, check logs first: `sudo docker compose -f docker-compose.production.yml logs`

