# Quick Start Deployment Guide

## 🚀 Fastest Way to Deploy

### Option 1: Docker (Recommended for Beginners)

```bash
# 1. Clone or copy application files
cd /opt
git clone <your-repo> attendance-management
cd attendance-management

# 2. Create .env file
cat > .env << EOF
DB_PASSWORD=your_secure_password_here
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SERVER_URL=http://your-domain.com
EOF

# 3. Start everything
docker-compose -f docker-compose.production.yml up -d

# 4. Initialize database
docker-compose -f docker-compose.production.yml exec app node scripts/init_db.js

# 5. Check status
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

**That's it!** Your application is running at `http://your-server-ip`

---

### Option 2: Traditional Server Setup

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql nginx

# 2. Setup database
sudo -u postgres createdb attendance_db
sudo -u postgres createuser attendance_user

# 3. Install app dependencies
cd server && npm install
cd ../client && npm install && npm run build

# 4. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your settings

# 5. Start services
pm2 start server/server.js --name attendance-api
# Configure Nginx (see DEPLOYMENT_GUIDE.md)
```

---

## 📚 Full Documentation

For complete deployment instructions, see:
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **APPLICATION_REPORT.md** - Application overview and features
- **TROUBLESHOOTING_GUIDE.md** - Error resolution guide

---

## ⚡ Quick Commands

### Docker
```bash
# Start
docker-compose -f docker-compose.production.yml up -d

# Stop
docker-compose -f docker-compose.production.yml down

# Logs
docker-compose -f docker-compose.production.yml logs -f

# Restart
docker-compose -f docker-compose.production.yml restart
```

### Traditional
```bash
# Start backend
pm2 start server/server.js

# View logs
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all
```

---

## 🔧 Common Issues

**Port already in use?**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Database connection failed?**
```bash
sudo systemctl start postgresql
psql -U attendance_user -d attendance_db
```

**Frontend not loading?**
- Check Nginx is running: `sudo systemctl status nginx`
- Verify build exists: `ls client/dist`

---

## 📞 Need Help?

1. Check **TROUBLESHOOTING_GUIDE.md**
2. Review log files in `server/` directory
3. See **DEPLOYMENT_GUIDE.md** for detailed steps

---

**Happy Deploying! 🎉**

