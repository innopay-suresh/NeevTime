# Quick Fix for Login 500 Error

## Problem
`POST /api/login` returns 500 Internal Server Error

## Root Cause
The database tables (especially `users` table) don't exist yet.

## Solution: Initialize Database

### Step 1: Check Current Logs
```bash
docker-compose -f docker-compose.production.yml logs app | tail -50
```

Look for errors like:
- `relation "users" does not exist`
- `relation "devices" does not exist`

### Step 2: Initialize Database
```bash
docker-compose -f docker-compose.production.yml exec app node server/scripts/init_all_schemas.js
```

### Step 3: Verify Database Tables Were Created
```bash
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d attendance_db -c "\dt"
```

You should see tables like:
- users
- employees
- devices
- departments
- etc.

### Step 4: Verify Admin User Was Created
```bash
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d attendance_db -c "SELECT username, role FROM users;"
```

Should show:
```
 username | role
----------+-------
 admin    | admin
```

### Step 5: Test Login Again
1. Go to: http://192.168.1.237/login
2. Username: `admin`
3. Password: `admin`

## If Initialization Fails

### Check Database Connection
```bash
docker-compose -f docker-compose.production.yml exec app node -e "const db=require('./db');db.query('SELECT 1').then(()=>{console.log('✅ DB Connected');process.exit(0)}).catch(e=>{console.error('❌ DB Error:',e.message);process.exit(1)})"
```

### Check Environment Variables
```bash
docker-compose -f docker-compose.production.yml exec app env | grep DB_
```

Should show:
- DB_HOST=db
- DB_PORT=5432
- DB_NAME=attendance_db
- DB_USER=postgres
- DB_PASSWORD=postgres@123

### Manual Table Creation (if script fails)
```bash
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d attendance_db -c "
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
"
```

## Expected Result After Fix

✅ Login page loads  
✅ Can submit login form  
✅ No 500 errors  
✅ Successfully redirected to dashboard  
✅ Admin user can login with admin/admin

