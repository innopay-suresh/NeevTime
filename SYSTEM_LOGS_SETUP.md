# System Logs Setup Guide

## 🔍 Why No Logs Are Showing

The System Logs page is showing "No logs found" because:

1. ✅ The `system_logs` table exists in the database schema
2. ✅ The API endpoint exists (`/api/system-logs`)
3. ❌ **No logging is happening yet** - events are not being logged to the table

---

## ✅ Solution: System Logger Implementation

I've created a complete system logging solution:

### Files Created:

1. **`server/utils/systemLogger.js`** - Logging utility
2. **`server/routes/system_logs.js`** - Dedicated system logs route
3. **`server/scripts/seed_system_logs.js`** - Script to create sample logs

### Changes Made:

1. ✅ Registered system logs route in `server.js`
2. ✅ Integrated login logging in `auth.js`
3. ✅ Created logging utility with helper functions

---

## 🚀 How to Enable System Logging

### Step 1: Ensure Database Table Exists

The table should already exist from `database/schema_timetable.sql`. If not, run:

```sql
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
```

### Step 2: Seed Sample Logs (For Testing)

```bash
cd server
node scripts/seed_system_logs.js
```

This will create 50 sample logs from the past 7 days.

### Step 3: Test Login Logging

1. Restart the server
2. Log in to the application
3. A LOGIN event should be logged
4. Check the System Logs page - you should see the login entry

---

## 📝 How to Add Logging to Other Actions

### Example 1: Log Employee Creation

In `server/server.js` or your employee route:

```javascript
const { logCreate } = require('./utils/systemLogger');

// After successful employee creation
app.post('/api/employees', authenticateToken, async (req, res) => {
    try {
        // ... create employee code ...
        
        const result = await db.query(/* insert employee */);
        
        // Log the creation
        if (req.user) {
            await logCreate(
                req.user.username,
                'employee',
                result.rows[0].id,
                { name: result.rows[0].name, code: result.rows[0].employee_code },
                req.ip || req.connection.remoteAddress,
                req.user.id
            );
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        // ...
    }
});
```

### Example 2: Log Employee Update

```javascript
const { logUpdate } = require('./utils/systemLogger');

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        // Get old values first
        const oldEmp = await db.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
        
        // Perform update
        const result = await db.query(/* update employee */);
        
        // Log the update
        if (req.user && oldEmp.rows[0]) {
            await logUpdate(
                req.user.username,
                'employee',
                req.params.id,
                oldEmp.rows[0], // old values
                result.rows[0], // new values
                req.ip || req.connection.remoteAddress,
                req.user.id
            );
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        // ...
    }
});
```

### Example 3: Log Employee Delete

```javascript
const { logDelete } = require('./utils/systemLogger');

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        // Get old values first
        const oldEmp = await db.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
        
        // Delete
        await db.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        
        // Log the delete
        if (req.user && oldEmp.rows[0]) {
            await logDelete(
                req.user.username,
                'employee',
                req.params.id,
                oldEmp.rows[0],
                req.ip || req.connection.remoteAddress,
                req.user.id
            );
        }
        
        res.json({ success: true });
    } catch (err) {
        // ...
    }
});
```

### Example 4: Log Export

```javascript
const { logExport } = require('./utils/systemLogger');

app.get('/api/reports/export', authenticateToken, async (req, res) => {
    try {
        // ... generate export ...
        
        // Log the export
        if (req.user) {
            await logExport(
                req.user.username,
                'report',
                'PDF', // or 'XLSX'
                req.ip || req.connection.remoteAddress,
                req.user.id
            );
        }
        
        res.json({ /* export data */ });
    } catch (err) {
        // ...
    }
});
```

---

## 🎯 Available Logging Functions

All functions are in `server/utils/systemLogger.js`:

- `logLogin(username, ipAddress, userAgent, userId)` - Log user login
- `logLogout(username, ipAddress, userId)` - Log user logout
- `logCreate(username, entityType, entityId, newValues, ipAddress, userId)` - Log creation
- `logUpdate(username, entityType, entityId, oldValues, newValues, ipAddress, userId)` - Log update
- `logDelete(username, entityType, entityId, oldValues, ipAddress, userId)` - Log deletion
- `logExport(username, entityType, format, ipAddress, userId)` - Log export
- `logImport(username, entityType, recordCount, ipAddress, userId)` - Log import
- `logSync(username, entityType, syncType, ipAddress, userId)` - Log sync
- `logEvent(logData)` - Generic log function for custom events

---

## 📊 What Gets Logged

Each log entry includes:
- **User ID** - ID of the user performing the action
- **Username** - Username of the user
- **Action** - Type of action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
- **Entity Type** - What was acted upon (employee, department, device, etc.)
- **Entity ID** - ID of the entity (optional)
- **Old Values** - Previous state (for UPDATE/DELETE) - stored as JSON
- **New Values** - New state (for CREATE/UPDATE) - stored as JSON
- **IP Address** - User's IP address
- **User Agent** - Browser/client information
- **Created At** - Timestamp of the action

---

## 🔧 Integration Priority

### High Priority (Most Important):
1. ✅ **Login/Logout** - Already integrated in `auth.js`
2. **Employee CRUD** - Create, Update, Delete employees
3. **User Management** - Create, Update, Delete users
4. **Department CRUD** - Create, Update, Delete departments

### Medium Priority:
5. **Device Management** - Add, Update, Remove devices
6. **Reports Export** - PDF/XLSX exports
7. **Settings Changes** - Configuration updates
8. **HRMS Sync** - Integration syncs

### Low Priority:
9. **View actions** (optional)
10. **Search actions** (optional)

---

## 🧪 Testing

### Test Login Logging:
1. Restart server
2. Log in to the app
3. Check System Logs page
4. You should see a LOGIN entry

### Test with Sample Data:
```bash
# Seed sample logs
node server/scripts/seed_system_logs.js

# Check System Logs page
# Should see 50+ log entries
```

---

## 📝 Notes

- Logging is **non-blocking** - if logging fails, it won't break the application
- Logs are stored in the `system_logs` table
- Old logs can be archived/deleted periodically
- Consider adding log retention policy (e.g., keep logs for 90 days)

---

## ✅ Quick Start

1. **Restart the server** (to load new routes)
2. **Log in** to create a login log entry
3. **Or seed sample logs**: `node server/scripts/seed_system_logs.js`
4. **Check System Logs page** - should show entries now!

---

*System logging is now ready to use!*

