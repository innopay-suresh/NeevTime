# 🚀 Post-Launch Update Guide

This guide outlines what to update and improve after publishing the app, preparing for future updates.

---

## 📋 Immediate Post-Launch Checklist

### 1. ✅ Version Management

**Current Setup:**
- Client: `version: "0.0.0"` (dev)
- Server: `version: "1.0.0"`

**Action Items:**

#### A. Update Package Versions
```json
// client/package.json
{
  "name": "timenexa-client",
  "version": "1.0.0",  // ← Update to 1.0.0 for initial release
  "description": "TimeNexa Attendance Management System - Client"
}

// server/package.json
{
  "name": "timenexa-server",
  "version": "1.0.0",  // ← Already at 1.0.0
  "description": "TimeNexa Attendance Management System - Server"
}
```

#### B. Create Version Constants
Create `client/src/constants/version.js`:
```javascript
export const APP_VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
export const CHANGELOG_URL = '/changelog';
```

#### C. Display Version in App
Add version display in Settings/About page:
```jsx
import { APP_VERSION } from '../constants/version';

<div className="text-sm text-gray-500">
  Version {APP_VERSION}
</div>
```

---

### 2. ✅ Changelog Creation

**Create:** `CHANGELOG.md`

```markdown
# Changelog

All notable changes to TimeNexa will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added
- Complete attendance management system
- Device sync (ADMS integration)
- Employee management
- Multiple report types (PDF & XLSX export)
- HRMS integrations (8+ systems)
- Toast notification system
- Confirmation dialogs
- Global search (Cmd+K)
- Dark mode support
- Error boundaries
- Form auto-save
- Bulk operations
- Enhanced loading states
- Keyboard shortcuts

### Fixed
- PDF export compatibility issues
- Border overlap in navigation
- Import errors resolved

### Security
- JWT authentication
- Password hashing (bcrypt)
- API route protection

## [Unreleased]

### Planned
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] SSO integration
```

---

### 3. ✅ Update Mechanism

#### A. Check for Updates (Optional)
Create `client/src/hooks/useAppUpdate.js`:

```javascript
import { useState, useEffect } from 'react';
import { APP_VERSION } from '../constants/version';

export const useAppUpdate = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState(null);

    useEffect(() => {
        // Check for updates (optional - can call your API)
        const checkForUpdates = async () => {
            try {
                // Replace with your update endpoint
                const response = await fetch('/api/version/check');
                const data = await response.json();
                
                if (data.version && data.version !== APP_VERSION) {
                    setLatestVersion(data.version);
                    setUpdateAvailable(true);
                }
            } catch (err) {
                console.warn('Could not check for updates:', err);
            }
        };

        // Check on mount and every hour
        checkForUpdates();
        const interval = setInterval(checkForUpdates, 60 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    return { updateAvailable, latestVersion };
};
```

#### B. Update Notification Component
```jsx
// client/src/components/UpdateNotification.jsx
import { useAppUpdate } from '../hooks/useAppUpdate';
import { toast } from './ToastContainer';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
    const { updateAvailable, latestVersion } = useAppUpdate();

    useEffect(() => {
        if (updateAvailable) {
            toast.info(
                `Update available: v${latestVersion}. Refresh to update.`,
                10000
            );
        }
    }, [updateAvailable, latestVersion]);

    if (!updateAvailable) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
            <p>Update available: v{latestVersion}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-white text-blue-600 rounded"
            >
                <RefreshCw size={16} /> Update Now
            </button>
        </div>
    );
}
```

---

### 4. ✅ Analytics & Monitoring

#### A. Error Tracking
**Recommended:** Sentry or similar

Create `client/src/utils/errorTracking.js`:
```javascript
// Optional: Error tracking service integration
export const initErrorTracking = () => {
    // Initialize Sentry or similar
    // Sentry.init({ dsn: 'YOUR_DSN' });
};

export const captureError = (error, context) => {
    // Sentry.captureException(error, { extra: context });
    console.error('Error captured:', error, context);
};
```

#### B. Analytics
**Recommended:** Google Analytics or privacy-friendly alternative

Create `client/src/utils/analytics.js`:
```javascript
// Optional: Analytics integration
export const trackEvent = (eventName, properties) => {
    // Google Analytics, Plausible, or custom analytics
    console.log('Event:', eventName, properties);
};

export const trackPageView = (path) => {
    // Track page views
    console.log('Page view:', path);
};
```

---

### 5. ✅ User Feedback Collection

#### A. Feedback Widget
Create `client/src/components/FeedbackWidget.jsx`:

```jsx
import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import api from '../api';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/feedback', {
                feedback,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
            setFeedback('');
            setIsOpen(false);
            toast.success('Thank you for your feedback!');
        } catch (err) {
            toast.error('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50"
                aria-label="Send feedback"
            >
                <MessageSquare size={24} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Send Feedback</h3>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full border rounded p-2 mb-4"
                                rows={4}
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    {submitting ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
```

#### B. Feedback API Endpoint
Add to `server/routes/feedback.js`:
```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/api/feedback', async (req, res) => {
    try {
        const { feedback, url, userAgent, timestamp } = req.body;
        
        await db.query(
            'INSERT INTO feedback (feedback, url, user_agent, created_at) VALUES ($1, $2, $3, $4)',
            [feedback, url, userAgent, timestamp || new Date()]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Feedback error:', err);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

module.exports = router;
```

---

### 6. ✅ Performance Monitoring

#### A. Performance Metrics
Create `client/src/utils/performance.js`:

```javascript
// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
    if (process.env.NODE_ENV === 'development') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    return fn();
};

export const reportWebVitals = (metric) => {
    // Report to analytics
    console.log('Web Vital:', metric);
    
    // Example: Send to your analytics endpoint
    // fetch('/api/analytics/vitals', {
    //     method: 'POST',
    //     body: JSON.stringify(metric)
    // });
};
```

#### B. Add to main.jsx
```jsx
import { reportWebVitals } from './utils/performance';

// After app renders
reportWebVitals();
```

---

### 7. ✅ Database Migrations

**Create:** `server/migrations/` directory structure

```
server/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_feedback_table.sql
│   ├── 003_add_analytics_table.sql
│   └── migration-runner.js
```

**Example Migration:**
```sql
-- migrations/002_add_feedback_table.sql
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    feedback TEXT NOT NULL,
    url VARCHAR(500),
    user_agent TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_created_at ON feedback(created_at);
```

---

### 8. ✅ Security Updates

#### A. Security Headers
Update `server/server.js`:

```javascript
// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});
```

#### B. Rate Limiting
Install: `npm install express-rate-limit`

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

### 9. ✅ Backup & Recovery

#### A. Automated Backups
Create `server/scripts/backup.js`:

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

// Use pg_dump for PostgreSQL
const command = `pg_dump -U your_user -d your_database > ${backupFile}`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Backup failed:', error);
        return;
    }
    console.log('Backup completed:', backupFile);
});

// Cleanup old backups (keep last 30 days)
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
fs.readdirSync(backupDir).forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
    }
});
```

---

### 10. ✅ Documentation Updates

#### A. API Documentation
Create `API_DOCUMENTATION.md`:

```markdown
# API Documentation

## Authentication
POST /api/login
- Body: { username, password }
- Returns: { token, user }

## Endpoints
- GET /api/employees
- POST /api/employees
- ...
```

#### B. Deployment Documentation
Update deployment guides with:
- Environment variables
- Database setup
- SSL certificates
- Domain configuration

---

## 🔄 Update Workflow

### Version Release Process

1. **Development**
   - Work on features in `develop` branch
   - Test thoroughly

2. **Staging**
   - Merge to `staging` branch
   - Test in staging environment
   - Get QA approval

3. **Release**
   - Update version numbers
   - Update CHANGELOG.md
   - Create release tag
   - Merge to `main` branch
   - Deploy to production

4. **Post-Release**
   - Monitor errors
   - Collect feedback
   - Plan next version

---

## 📊 Suggested Future Updates

### Version 1.1.0 (Minor Update)
- [ ] Bug fixes from user feedback
- [ ] Performance improvements
- [ ] UI/UX refinements
- [ ] Additional report types

### Version 1.2.0 (Feature Update)
- [ ] Real-time notifications
- [ ] Advanced filtering
- [ ] Export templates
- [ ] Bulk import improvements

### Version 2.0.0 (Major Update)
- [ ] Mobile app
- [ ] Offline mode
- [ ] Multi-language support
- [ ] SSO integration
- [ ] Advanced analytics dashboard

---

## 🎯 Quick Start Checklist

- [ ] Update package.json versions
- [ ] Create CHANGELOG.md
- [ ] Add version display in app
- [ ] Set up error tracking (optional)
- [ ] Set up analytics (optional)
- [ ] Create feedback collection system
- [ ] Add security headers
- [ ] Set up automated backups
- [ ] Document API endpoints
- [ ] Create deployment checklist

---

## 📝 Notes

- All features are **optional** - implement based on your needs
- Start with version management and changelog
- Add monitoring gradually
- Prioritize security updates
- Collect user feedback early

---

*This guide prepares you for professional app maintenance and updates!*

