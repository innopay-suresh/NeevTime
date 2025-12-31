# 🐳 Docker Deployment Guide - Step by Step

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create Environment File](#step-1-create-environment-file)
3. [Step 2: Choose Your Deployment Method](#step-2-choose-your-deployment-method)
4. [Step 3: Build and Start](#step-3-build-and-start)
5. [Step 4: Initialize Database](#step-4-initialize-database)
6. [Step 5: Access Your Application](#step-5-access-your-application)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Docker
- **Windows/Mac**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Install Docker Engine using your package manager

### 2. Verify Docker Installation
Open a terminal/command prompt and run:
```bash
docker --version
docker-compose --version
```

You should see version numbers. If you see "command not found", Docker is not installed correctly.

---

## Step 1: Create Environment File

You need to create a file called `.env` in your project root folder (same folder where `docker-compose.yml` is located).

### What is an environment file?
This file stores secret passwords and settings. **Never share this file publicly!**

### Create the `.env` file:

1. Open a text editor (Notepad, TextEdit, VS Code, etc.)
2. Create a new file
3. Copy and paste this content:

```env
# Database Settings
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=attendance_db
DB_PORT=5432

# JWT Secret (for authentication tokens)
# Generate a random string - you can use: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string

# Server Settings (optional - defaults shown)
HTTP_PORT=80
API_PORT=3001
ADMS_PORT=8080
SERVER_URL=http://localhost
```

4. **IMPORTANT**: Replace `your_secure_password_here` with a strong password (e.g., `MySecurePass123!`)
5. **IMPORTANT**: Replace `your_super_secret_jwt_key_change_this_to_random_string` with a random string (you can generate one online or use: `openssl rand -base64 32`)
6. Save the file as `.env` (with the dot at the beginning) in your project root folder

**Example of a good password**: `Att3nd@nc3Syst3m2024!`
**Example of a good JWT_SECRET**: `k8x9m2p5q7r4s6t8u1v3w5y7z9a1b3c5d7e9f1g3h5`

---

## Step 2: Choose Your Deployment Method

You have two options:

### Option A: Simple Development Setup (Recommended for Testing)
Uses separate containers for database, server, and client.

**File to use**: `docker-compose.yml`

### Option B: Production Setup (Recommended for Live Deployment)
Uses a single optimized container with everything combined.

**File to use**: `docker-compose.production.yml`

**For this guide, we'll use Option B (Production Setup) as it's more efficient.**

---

## Step 3: Build and Start

### Navigate to Your Project Folder

Open terminal/command prompt and go to your project folder:

```bash
cd "/Users/suresh/Desktop/Attendance Management"
```

(Replace the path with your actual project folder path)

### Start Everything

Run this single command:

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

**What does this command do?**
- `docker-compose`: The tool that manages multiple Docker containers
- `-f docker-compose.production.yml`: Use the production configuration file
- `up`: Start the containers
- `-d`: Run in the background (detached mode)
- `--build`: Build the Docker images first

**This will take 5-10 minutes the first time** (downloading images, installing dependencies, building the frontend).

You'll see lots of output. Wait until it says something like:
```
✓ Container attendance_db is running
✓ Container attendance_app is running
```

### Check if Everything is Running

```bash
docker-compose -f docker-compose.production.yml ps
```

You should see all services with status "Up" (running).

---

## Step 4: Initialize Database

The database container is running, but you need to create the database structure (tables).

### Option 1: Automatic (if SQL files are in database folder)
If your `database/schema.sql` file is placed correctly, Docker should run it automatically on first start.

### Option 2: Manual Setup

If the database isn't initialized, run:

```bash
# Connect to the database container
docker exec -it attendance_db psql -U postgres -d attendance_db

# Then run your schema file (exit first with \q, then run):
docker exec -i attendance_db psql -U postgres -d attendance_db < database/schema.sql
```

---

## Step 5: Access Your Application

Once everything is running:

1. **Open your web browser**
2. **Go to**: `http://localhost`
3. You should see the login page!

**Default login credentials** (if you haven't changed them):
- Username: `admin`
- Password: Check your database or initial setup script

---

## Common Commands

### Stop the Application
```bash
docker-compose -f docker-compose.production.yml stop
```

### Start the Application (after stopping)
```bash
docker-compose -f docker-compose.production.yml start
```

### Stop and Remove Everything (keeps database data)
```bash
docker-compose -f docker-compose.production.yml down
```

### Stop and Remove Everything INCLUDING Database Data (⚠️ WARNING: Deletes all data)
```bash
docker-compose -f docker-compose.production.yml down -v
```

### View Logs (see what's happening)
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Just the app
docker-compose -f docker-compose.production.yml logs -f app

# Just the database
docker-compose -f docker-compose.production.yml logs -f db
```

### Restart Everything
```bash
docker-compose -f docker-compose.production.yml restart
```

### Rebuild Everything (if you made code changes)
```bash
docker-compose -f docker-compose.production.yml up -d --build
```

---

## Troubleshooting

### Problem: "Cannot connect to Docker daemon"
**Solution**: Make sure Docker Desktop is running. Look for the Docker icon in your system tray/menu bar.

### Problem: "Port already in use"
**Solution**: Another application is using port 80 or 3001. 
- Change ports in `.env` file:
  ```env
  HTTP_PORT=8080
  API_PORT=3002
  ```
- Or stop the other application using those ports

### Problem: "Permission denied" (Linux)
**Solution**: Add your user to docker group:
```bash
sudo usermod -aG docker $USER
```
Then log out and log back in.

### Problem: Application won't start
**Solution**: Check the logs:
```bash
docker-compose -f docker-compose.production.yml logs
```

### Problem: Database connection error
**Solution**: 
1. Make sure the database container is running: `docker-compose ps`
2. Check that your `.env` file has correct database password
3. Wait a bit - database takes 10-20 seconds to start

### Problem: "Cannot find .env file"
**Solution**: 
1. Make sure the `.env` file is in the same folder as `docker-compose.production.yml`
2. Make sure the filename starts with a dot: `.env` (not `env.txt` or `env`)

### Problem: Frontend shows blank page or 404
**Solution**: 
1. Wait 1-2 minutes for the build to complete
2. Check logs: `docker-compose -f docker-compose.production.yml logs app`
3. Clear your browser cache and refresh

### Problem: Need to reset everything
**Solution**: Complete reset (⚠️ Deletes all data):
```bash
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d --build
```

---

## Security Checklist (Before Going Live)

1. ✅ Change all default passwords in `.env`
2. ✅ Use a strong, random `JWT_SECRET`
3. ✅ Don't commit `.env` file to Git (add to `.gitignore`)
4. ✅ Use HTTPS in production (set up SSL certificates)
5. ✅ Change default database username if possible
6. ✅ Regularly update Docker images: `docker-compose pull`

---

## Quick Reference Card

```bash
# Start everything
docker-compose -f docker-compose.production.yml up -d --build

# Stop everything
docker-compose -f docker-compose.production.yml down

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps

# Restart
docker-compose -f docker-compose.production.yml restart
```

---

## Need Help?

If something doesn't work:
1. Check the logs first: `docker-compose -f docker-compose.production.yml logs`
2. Make sure Docker Desktop is running
3. Verify your `.env` file is correct
4. Try restarting: `docker-compose -f docker-compose.production.yml restart`

---

**That's it! Your application should now be running in Docker! 🎉**

