# Post-Build Steps - After Docker Build Success

## ✅ Build Completed Successfully!

Your Docker image has been built. Now follow these steps:

## 📋 Next Steps

### Step 1: Set Environment Variables (If Not Already Set)

Create or check your `.env` file:

```bash
cd ~/NeevTime/Attendance-Management-VayuTime

# Create .env file if it doesn't exist
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=attendance_db
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
SERVER_URL=http://192.168.1.237
HTTP_PORT=80
API_PORT=3001
ADMS_PORT=8080
LOG_LEVEL=info
EOF
```

**Important**: 
- Replace `your_secure_password_here` with a strong password
- Replace `your_jwt_secret_key_here_min_32_chars` with a random secret (at least 32 characters)
- The `.env` file should NOT be committed to git (it's already in .gitignore)

### Step 2: Start the Containers

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Step 3: Verify Containers Are Running

```bash
docker-compose -f docker-compose.production.yml ps
```

You should see both `attendance_db` and `attendance_app` with status "Up".

### Step 4: Initialize Database

```bash
docker-compose -f docker-compose.production.yml exec app node server/scripts/init_all_schemas.js
```

**Expected Output:**
```
🚀 Starting database initialization...
📄 Applying schema.sql...
✅ schema.sql applied successfully!
...
✅ Database initialization completed successfully!
```

### Step 5: Check Logs

```bash
docker-compose -f docker-compose.production.yml logs -f app
```

Look for:
- ✅ "Server running on port 3001"
- ✅ No database errors
- ✅ Health check endpoints responding

### Step 6: Test Login

1. Open browser: `http://192.168.1.237/login`
2. Login credentials:
   - Username: `admin`
   - Password: `admin`
3. Change password after first login!

## 🔍 Troubleshooting

### If containers won't start:

1. **Check environment variables:**
   ```bash
   docker-compose -f docker-compose.production.yml config
   ```

2. **Check logs:**
   ```bash
   docker-compose -f docker-compose.production.yml logs app
   docker-compose -f docker-compose.production.yml logs db
   ```

3. **Verify database connection:**
   ```bash
   docker-compose -f docker-compose.production.yml exec db psql -U postgres -d attendance_db -c "\dt"
   ```

### If database initialization fails:

```bash
# Check if database is accessible
docker-compose -f docker-compose.production.yml exec db psql -U postgres -c "\l"

# Try connecting from app container
docker-compose -f docker-compose.production.yml exec app node -e "const db=require('./db');db.query('SELECT 1').then(()=>console.log('DB OK')).catch(e=>console.error(e))"
```

## ✅ Success Indicators

- ✅ Containers are running (status: Up)
- ✅ Database initialized (tables created)
- ✅ Login page loads
- ✅ Can login with admin/admin
- ✅ Dashboard displays
- ✅ No errors in logs

## 🎯 Quick Command Reference

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop services
docker-compose -f docker-compose.production.yml down

# Rebuild and restart
docker-compose -f docker-compose.production.yml build --no-cache app
docker-compose -f docker-compose.production.yml up -d

# Access database
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d attendance_db
```

