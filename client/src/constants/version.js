/**
 * Application Version Constants
 * Update this file when releasing a new version
 */

export const APP_VERSION = '1.0.0';
export const BUILD_DATE = import.meta.env.BUILD_DATE || new Date().toISOString();
export const CHANGELOG_URL = '/changelog';

/**
 * Check if update is available
 * @param {string} latestVersion - Latest version from server
 * @returns {boolean} - True if update is available
 */
export const isUpdateAvailable = (latestVersion) => {
    if (!latestVersion) return false;
    
    const current = APP_VERSION.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if (latest[i] > current[i]) return true;
        if (latest[i] < current[i]) return false;
    }
    
    return false;
};

export default {
    APP_VERSION,
    BUILD_DATE,
    CHANGELOG_URL,
    isUpdateAvailable
};

