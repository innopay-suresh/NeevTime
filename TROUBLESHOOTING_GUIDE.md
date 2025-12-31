# TimeNexa Attendance Management - Troubleshooting Guide

## Quick Reference

### Emergency Contacts
- **Server Status**: `pm2 status` or `docker-compose ps`
- **Logs Location**: `server/` directory
- **Database**: `psql -U attendance_user -d attendance_db`

---

## Table of Contents
1. [Server Issues](#server-issues)
2. [Database Issues](#database-issues)
3. [Frontend Issues](#frontend-issues)
4. [Device Synchronization](#device-synchronization)
5. [Network Issues](#network-issues)
6. [Performance Issues](#performance-issues)
7. [Authentication Issues](#authentication-issues)
8. [Common Error Messages](#common-error-messages)

---

## Server Issues

### Problem: Server Won't Start

#### Error: `Port 3001 already in use`

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Find process using port
sudo lsof -i :3001
# Or
sudo netstat -tulpn | grep 3001

# Kill the process
sudo kill -9 <PID>

# Or change port in .env
PORT=3002
```

**Prevention**: Always stop services properly before restarting.

---

#### Error: `Cannot find module`

**Symptoms**:
```
Error: Cannot find module 'express'
```

**Solution**:
```bash
cd server
npm install
# Verify node_modules exists
ls node_modules
```

**Prevention**: Always run `npm install` after cloning or updating code.

---

#### Error: `EACCES: permission denied`

**Symptoms**:
```
Error: EACCES: permission denied, open '/path/to/file'
```

**Solution**:
```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/attendance-management
# Or run with proper permissions
sudo -u www-data node server.js
```

---

### Problem: Server Crashes Frequently

#### Check Crash Logs
```bash
tail -f server/server_crash.log
```

#### Common Causes:
1. **Memory Leak**
   ```bash
   # Monitor memory
   pm2 monit
   # Restart if needed
   pm2 restart attendance-api
   ```

2. **Unhandled Promise Rejection**
   - Check `server_crash.log`
   - Review async/await error handling
   - Add try-catch blocks

3. **Database Connection Issues**
   ```bash
   # Test database connection
   psql -U attendance_user -d attendance_db -h localhost
   ```

---

## Database Issues

### Problem: Cannot Connect to Database

#### Error: `Connection refused`

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Start if stopped
sudo systemctl start postgresql
# Enable auto-start
sudo systemctl enable postgresql
```

---

#### Error: `password authentication failed`

**Symptoms**:
```
Error: password authentication failed for user "attendance_user"
```

**Solution**:
```bash
# Reset password
sudo -u postgres psql
ALTER USER attendance_user WITH PASSWORD 'new_password';
\q

# Update .env file
DB_PASSWORD=new_password
```

---

#### Error: `database does not exist`

**Symptoms**:
```
Error: database "attendance_db" does not exist
```

**Solution**:
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE attendance_db;
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;
\q

# Initialize schema
cd server
node scripts/init_db.js
```

---

### Problem: Slow Database Queries

#### Check Indexes
```sql
-- List all indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check for missing indexes on foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

#### Analyze Slow Queries
```sql
-- Enable query logging in postgresql.conf
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## Frontend Issues

### Problem: Frontend Not Loading

#### Error: `404 on routes`

**Symptoms**: Page shows 404 when navigating to routes

**Solution**:
```nginx
# Ensure Nginx has this in location / block
location / {
    try_files $uri $uri/ /index.html;
}
```

**Verify**:
```bash
# Check Nginx config
sudo nginx -t
# Reload Nginx
sudo systemctl reload nginx
```

---

#### Error: `API calls failing`

**Symptoms**: Frontend shows "Failed to fetch" or network errors

**Solution**:
1. **Check backend is running**:
   ```bash
   pm2 status
   curl http://localhost:3001/api/health
   ```

2. **Check Nginx proxy**:
   ```nginx
   location /api {
       proxy_pass http://localhost:3001;
       proxy_set_header Host $host;
   }
   ```

3. **Check CORS settings** in `server.js`:
   ```javascript
   cors({
       origin: ['http://your-domain.com', 'https://your-domain.com'],
       credentials: true
   })
   ```

---

#### Error: `WebSocket connection failed`

**Symptoms**: Real-time updates not working

**Solution**:
```nginx
# Nginx WebSocket configuration
location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

**Test WebSocket**:
```bash
# Install wscat
npm install -g wscat
# Test connection
wscat -c ws://your-domain.com/socket.io
```

---

### Problem: Build Errors

#### Error: `Module not found` during build

**Solution**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Device Synchronization

### Problem: Devices Showing Offline

#### Check Device Configuration
```sql
-- Verify device settings
SELECT serial_number, device_name, ip_address, port, status 
FROM devices;
```

#### Test Device Connection
```bash
# Test TCP connection
telnet <device-ip> <device-port>
# Or
nc -zv <device-ip> <device-port>
```

#### Check Firewall
```bash
# Allow ADMS port
sudo ufw allow 8080/tcp
# Check firewall status
sudo ufw status
```

#### Verify Device Network Settings
- Device IP should be accessible from server
- Device should point to server IP:8080
- Check device network diagnostics

---

### Problem: Biometric Data Not Syncing

#### Check Command Queue
```sql
-- View pending commands
SELECT * FROM device_commands 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check failed commands
SELECT * FROM device_commands 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Check ADMS Logs
```bash
tail -f server/adms_debug.log
tail -f server/sync_debug.log
```

#### Verify Template Data
```sql
-- Check biometric templates
SELECT e.employee_code, e.name, 
       COUNT(bt.id) as template_count
FROM employees e
LEFT JOIN biometric_templates bt ON e.id = bt.employee_id
GROUP BY e.id, e.employee_code, e.name
HAVING COUNT(bt.id) = 0;
```

#### Common Issues:
1. **Stale Data**: Re-fetch latest templates before sync
2. **Command Order**: Ensure DELETE before UPDATE
3. **Sequence Numbers**: Verify command sequencing
4. **Device Compatibility**: Check device supports template type

---

### Problem: Commands Not Executing

#### Check Command Status
```sql
-- Commands stuck in pending
SELECT device_serial, command, status, created_at
FROM device_commands
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '5 minutes';
```

#### Restart Command Processor
```bash
# Restart server to re-process commands
pm2 restart attendance-api
```

#### Manual Command Execution
```sql
-- Mark command as retry
UPDATE device_commands 
SET status = 'pending', retry_count = retry_count + 1
WHERE id = <command_id>;
```

---

## Network Issues

### Problem: Cannot Access Application

#### Check Service Status
```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Check ports
sudo netstat -tulpn | grep -E '80|443|3001|8080'
```

#### Check Firewall
```bash
# List firewall rules
sudo ufw status verbose

# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 8080/tcp
```

#### Test Connectivity
```bash
# From server
curl http://localhost:3001/api/health

# From external
curl http://your-server-ip:3001/api/health
```

---

### Problem: SSL Certificate Issues

#### Error: `Certificate expired`

**Solution**:
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### Error: `Mixed content` (HTTP/HTTPS)

**Solution**: Ensure all API calls use HTTPS:
```javascript
// In client code
const API_URL = 'https://your-domain.com/api'
```

---

## Performance Issues

### Problem: Slow Page Loads

#### Check Server Resources
```bash
# CPU and Memory
htop
# Or
top

# Disk I/O
iotop

# Network
nethogs
```

#### Optimize Database
```sql
-- Analyze tables
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE attendance_db;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Enable Gzip Compression
```nginx
# In Nginx config
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

### Problem: High Memory Usage

#### Check Memory
```bash
# Current usage
free -h

# Process memory
pm2 monit
# Or
ps aux --sort=-%mem | head
```

#### Restart Services
```bash
# Restart to free memory
pm2 restart all

# Or specific service
pm2 restart attendance-api
```

#### Increase Server Resources
- Add more RAM
- Optimize database queries
- Implement caching

---

## Authentication Issues

### Problem: Login Fails

#### Check User Exists
```sql
SELECT id, username, email, status 
FROM users 
WHERE username = 'admin';
```

#### Reset Password
```sql
-- Generate new password hash (use bcrypt)
-- Or use application reset feature
```

#### Check JWT Secret
```bash
# Verify JWT_SECRET in .env matches
cat server/.env | grep JWT_SECRET
```

---

### Problem: Token Expired

#### Increase Token Expiry
```javascript
// In auth.js
const token = jwt.sign(payload, secret, { expiresIn: '24h' });
```

#### Implement Refresh Token
- Add refresh token mechanism
- Store tokens securely
- Handle token renewal

---

## Common Error Messages

### Database Errors

#### `relation "table_name" does not exist`
```bash
# Run schema migrations
cd server
node scripts/init_db.js
```

#### `duplicate key value violates unique constraint`
- Data already exists
- Check for duplicates before insert
- Use UPSERT if appropriate

#### `foreign key constraint violation`
- Referenced record doesn't exist
- Check foreign key relationships
- Delete in correct order

---

### Application Errors

#### `ECONNREFUSED`
- Service not running
- Wrong host/port
- Firewall blocking

#### `ETIMEDOUT`
- Network issue
- Service overloaded
- Check connectivity

#### `ENOTFOUND`
- DNS resolution failed
- Wrong hostname
- Network configuration issue

---

## Diagnostic Commands

### Quick Health Check
```bash
#!/bin/bash
# health-check.sh

echo "=== System Health Check ==="

# Services
echo "Services:"
pm2 status
sudo systemctl status nginx --no-pager | head -3
sudo systemctl status postgresql --no-pager | head -3

# Ports
echo -e "\nPorts:"
sudo netstat -tulpn | grep -E '80|443|3001|8080|5432'

# Disk
echo -e "\nDisk Space:"
df -h | grep -E 'Filesystem|/dev/'

# Memory
echo -e "\nMemory:"
free -h

# Database
echo -e "\nDatabase Connection:"
psql -U attendance_user -d attendance_db -c "SELECT version();" 2>&1

# API
echo -e "\nAPI Health:"
curl -s http://localhost:3001/api/health || echo "API not responding"
```

---

## Log Analysis

### Important Log Files

#### Server Logs
```bash
# Real-time server logs
tail -f server/server.log

# Error logs only
grep -i error server/server.log | tail -20

# ADMS communication
tail -f server/adms_debug.log

# Sync operations
tail -f server/sync_debug.log
```

#### System Logs
```bash
# Nginx errors
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

#### PM2 Logs
```bash
# All logs
pm2 logs

# Specific app
pm2 logs attendance-api

# Last 100 lines
pm2 logs attendance-api --lines 100
```

---

## Recovery Procedures

### Complete System Recovery

#### 1. Stop All Services
```bash
pm2 stop all
sudo systemctl stop nginx
sudo systemctl stop postgresql
```

#### 2. Backup Current State
```bash
# Database backup
pg_dump -U attendance_user -d attendance_db > recovery_backup.sql

# Application backup
tar -czf app_backup.tar.gz /opt/attendance-management
```

#### 3. Restore from Backup
```bash
# Restore database
psql -U attendance_user -d attendance_db < recovery_backup.sql

# Restore application (if needed)
tar -xzf app_backup.tar.gz -C /
```

#### 4. Restart Services
```bash
sudo systemctl start postgresql
pm2 start all
sudo systemctl start nginx
```

---

## Prevention Best Practices

### Regular Maintenance
1. **Daily**: Check logs for errors
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies (test first)
4. **Quarterly**: Security audit

### Monitoring Setup
```bash
# Install monitoring
npm install -g pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Backup Strategy
```bash
# Automated daily backups
0 2 * * * /opt/backup-attendance.sh
```

---

## Getting Help

### Before Contacting Support

1. ✅ Check this troubleshooting guide
2. ✅ Review relevant log files
3. ✅ Verify configuration files
4. ✅ Test with diagnostic commands
5. ✅ Document error messages and steps to reproduce

### Information to Provide

- Error messages (exact text)
- Log file excerpts
- Steps to reproduce
- System configuration
- Recent changes made

---

**Last Updated**: January 2025  
**Version**: 1.0

