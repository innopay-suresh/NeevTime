# Quick Start: Using the New Enhancements

## 🚀 Immediate Usage Examples

### 1. Replace Alert with Toast

**Before:**
```javascript
alert('User created successfully!');
```

**After:**
```javascript
import { toast } from '../components/ToastContainer';

toast.success('User created successfully!');
```

### 2. Replace Confirm with Dialog

**Before:**
```javascript
if (confirm('Delete this user?')) {
    await deleteUser();
}
```

**After:**
```javascript
import { confirm } from '../components/ConfirmDialog';

const result = await confirm({
    title: 'Delete User',
    message: 'Are you sure? This cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
});

if (result) {
    await deleteUser();
}
```

### 3. Add Caching to API Calls

**Before:**
```javascript
const fetchEmployees = async () => {
    const res = await api.get('/api/employees');
    setEmployees(res.data);
};
```

**After:**
```javascript
import { cache, createCacheKey, CACHE_DURATION } from '../utils/cache';

const fetchEmployees = async () => {
    const cacheKey = createCacheKey('/api/employees');
    let employees = cache.get(cacheKey);
    
    if (!employees) {
        const res = await api.get('/api/employees');
        employees = res.data;
        cache.set(cacheKey, employees, CACHE_DURATION.MEDIUM);
    }
    
    setEmployees(employees);
};

// When employees are updated, invalidate cache:
cache.invalidate('/api/employees');
```

### 4. Register Keyboard Shortcuts

```javascript
import keyboardShortcuts from '../utils/keyboardShortcuts';

useEffect(() => {
    keyboardShortcuts.register('ctrl+n', () => {
        setShowNewEmployeeModal(true);
    }, {
        description: 'Create new employee',
        preventDefault: true
    });
    
    return () => {
        keyboardShortcuts.unregister('ctrl+n');
    };
}, []);
```

---

## 📦 What's Included

✅ **Toast Notification System** - Beautiful, non-blocking notifications  
✅ **Confirmation Dialogs** - Modern, customizable confirm dialogs  
✅ **Data Caching** - Performance optimization for API calls  
✅ **Keyboard Shortcuts** - Power user productivity features  

---

## 🎯 Next Steps

1. Start replacing `alert()` calls with `toast.*()` in frequently used pages
2. Replace `confirm()` calls with the new `confirm()` dialog
3. Add caching to heavy API endpoints (employees, devices, reports)
4. Register shortcuts for common actions

All enhancements are **optional** and **backward compatible** - your existing code will continue to work!

