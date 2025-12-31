# TimeNexa Deployment Guide

This guide covers deploying the Attendance Management System (AMS) using two methods: **Docker (Containerized)** and **Standalone Server (Manual)**.

---

## Method 1: Docker Deployment (Recommended)
This method is the easiest way to deploy as it bundles all dependencies (Node, Nginx, PostgreSQL config) into portable containers.

### Prerequisites
*   Docker & Docker Compose installed on the host machine.
*   Git (to clone the repository).

### Steps
1.  **Transfer Files:** Copy the entire project folder to your server.
2.  **Configuration:**
    *   Open `docker-compose.yml`.
    *   Update `POSTGRES_PASSWORD` and `JWT_SECRET` for security.
3.  **Build and Run:**
    Run the following command in the project root:
    ```bash
    docker-compose up -d --build
    ```
4.  **Verify:**
    *   **Frontend:** Access `http://YOUR_SERVER_IP` (Port 80).
    *   **Backend API:** Running internally on `http://server:3001`.
    *   **Database:** Persisted in `pgdata` volume.

### Managing Containers
*   **Stop:** `docker-compose down`
*   **Logs:** `docker-compose logs -f`
*   **Restart Server:** `docker-compose restart server`

---

## Method 2: Standalone Server (Manual / VM / Cloud)
Use this method for AWS EC2, DigitalOcean Droplets, or on-premise application servers (Ubuntu 20.04/22.04 recommended).

### 1. Install Dependencies
```bash
# Update and install basic tools
sudo apt update && sudo apt install -y curl git build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Database Setup
```bash
sudo -u postgres psql
# In the psql prompt:
CREATE DATABASE attendance_db;
CREATE USER admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO admin;
\q
```

### 3. Backend Setup
1.  Navigate to `server` directory.
2.  Install dependencies:
    ```bash
    npm install
    # If using native ZKTeco lib:
    sudo apt install python3 make g++
    npm rebuild
    ```
3.  Configure `.env`:
    Create a `.env` file with your DB credentials.
    ```env
    DB_USER=admin
    DB_PASSWORD=your_secure_password
    DB_NAME=attendance_db
    PORT=3001
    ```
4.  Start with PM2 (Process Manager):
    ```bash
    sudo npm install -g pm2
    pm2 start server.js --name "time-nexa-api"
    pm2 save
    pm2 startup
    ```

### 4. Frontend Setup
1.  Navigate to `client` directory.
2.  Build the project:
    ```bash
    npm install
    npm run build
    ```
    This creates a `dist` folder.

### 5. Nginx Setup (Reverse Proxy)
Serve the frontend and proxy API requests to the backend.

1.  Install Nginx: `sudo apt install -y nginx`
2.  Create config: `sudo nano /etc/nginx/sites-available/timenexa`
    ```nginx
    server {
        listen 80;
        server_name YOUR_DOMAIN_OR_IP;

        root /path/to/project/client/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }
        
        location /socket.io {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    ```
3.  Enable site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/timenexa /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## Cloud Deployment (AWS/Azure/GCP)
The process is identical to the "Standalone Server" method above, with one key addition: **Firewall/Security Groups**.

### AWS EC2 Example
1.  **Launch Instance:** Select Ubuntu 22.04 LTS.
2.  **Security Group (Firewall):**
    *   Allow **SSH (22)** from your IP only.
    *   Allow **HTTP (80)** from Anywhere (0.0.0.0/0).
    *   Allow **HTTPS (443)** if configuring SSL.
    *   **CRITICAL:** If your biometric devices push directly to this server over the internet, allow **Custom TCP (3001)** from the specific IP addresses of the office locations (recommended) or Anywhere (if dynamic IPs).
3.  **Elastic IP:** Assign an Elastic IP to ensure the server address doesn't change, which is crucial for device connectivity.
