/**
 * Simple Cache Utility for API Responses
 * Improves performance by caching frequently accessed data
 * 
 * Note: This is a vanilla JS utility. For React hooks, import React in your component.
 */

const CACHE_DURATION = {
    SHORT: 30 * 1000,      // 30 seconds
    MEDIUM: 5 * 60 * 1000,  // 5 minutes
    LONG: 30 * 60 * 1000,   // 30 minutes
    VERY_LONG: 60 * 60 * 1000 // 1 hour
};

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.listeners = new Set();
    }

    /**
     * Get cached data if valid, otherwise return null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Set cache with expiration
     */
    set(key, data, duration = CACHE_DURATION.MEDIUM) {
        const expiresAt = Date.now() + duration;
        this.cache.set(key, { data, expiresAt });
        this.notifyListeners(key, data);
    }

    /**
     * Invalidate cache by key or pattern
     */
    invalidate(keyOrPattern) {
        if (typeof keyOrPattern === 'string') {
            // Exact match
            this.cache.delete(keyOrPattern);
        } else if (keyOrPattern instanceof RegExp) {
            // Pattern match
            for (const key of this.cache.keys()) {
                if (keyOrPattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
        this.notifyListeners(keyOrPattern, null);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.notifyListeners('*', null);
    }

    /**
     * Subscribe to cache changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners(key, data) {
        this.listeners.forEach(listener => {
            try {
                listener(key, data);
            } catch (err) {
                console.error('Cache listener error:', err);
            }
        });
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const cache = new CacheManager();

// Helper function to create cache key
export const createCacheKey = (endpoint, params = {}) => {
    const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return paramString ? `${endpoint}?${paramString}` : endpoint;
};

// React hook for cached API calls (requires React import in component)
export const useCachedFetch = (key, fetcher, options = {}) => {
    // This hook should be used in components that import React
    // Example usage in component:
    // import React from 'react';
    // import { useCachedFetch } from '../utils/cache';
    throw new Error('useCachedFetch requires React. Import React in your component and use React.useState/React.useEffect');
};

// Helper for manual cache usage
export const useCache = () => {
    return {
        get: (key) => cache.get(key),
        set: (key, data, duration) => cache.set(key, data, duration),
        invalidate: (key) => cache.invalidate(key),
        clear: () => cache.clear()
    };
};
        if (!enabled) return;

        const cached = cache.get(key);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetcher()
            .then(response => {
                const result = response?.data || response;
                cache.set(key, result, duration);
                setData(result);
                setError(null);
            })
            .catch(err => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [key, enabled]);

};

export { CACHE_DURATION };
export default cache;

