/**
 * Device Health Monitor
 * 
 * Enterprise-grade health monitoring for biometric devices:
 * - Real-time health scoring
 * - Uptime tracking
 * - Connection quality metrics
 * - Alert generation
 * - Trend analysis
 * 
 * @author DevTeam
 * @version 2.0.0
 */

const db = require('../db');
const fs = require('fs');

// Health Status Levels
const HEALTH_STATUS = {
    HEALTHY: 'healthy',      // 80-100%
    WARNING: 'warning',      // 50-79%
    CRITICAL: 'critical',    // 20-49%
    OFFLINE: 'offline'       // 0% or no data
};

// Alert Types
const ALERT_TYPE = {
    DEVICE_OFFLINE: 'device_offline',
    HIGH_FAILURE_RATE: 'high_failure_rate',
    SYNC_DELAYED: 'sync_delayed',
    LOW_STORAGE: 'low_storage',
    CONNECTION_UNSTABLE: 'connection_unstable'
};

// Logger
const log = (level, msg, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [HealthMonitor] ${msg} ${JSON.stringify(data)}`;
    console.log(logEntry);
    fs.appendFileSync('health_monitor.log', logEntry + '\n');
};

/**
 * Calculate device health score (0-100)
 */
const calculateHealthScore = async (deviceSerial) => {
    try {
        // Get device info
        const deviceResult = await db.query(`
            SELECT 
                d.*,
                EXTRACT(EPOCH FROM (NOW() - d.last_activity)) as idle_seconds
            FROM devices d WHERE d.serial_number = $1
        `, [deviceSerial]);

        if (deviceResult.rows.length === 0) {
            return { score: 0, status: HEALTH_STATUS.OFFLINE, factors: {} };
        }

        const device = deviceResult.rows[0];

        // Factor 1: Online Status (30 points)
        const isOnline = device.status === 'online';
        const onlineScore = isOnline ? 30 : 0;

        // Factor 2: Recent Activity (25 points)
        // Full score if active in last 5 min, degraded up to 30 min, 0 after
        const idleMinutes = device.idle_seconds / 60;
        let activityScore = 0;
        if (idleMinutes <= 5) activityScore = 25;
        else if (idleMinutes <= 15) activityScore = 20;
        else if (idleMinutes <= 30) activityScore = 10;
        else activityScore = 0;

        // Factor 3: Command Success Rate (25 points)
        const cmdResult = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'success') as success_count,
                COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) as fail_count,
                COUNT(*) as total_count
            FROM device_commands 
            WHERE device_serial = $1 
            AND created_at > NOW() - INTERVAL '24 hours'
        `, [deviceSerial]);

        let cmdSuccessScore = 25;
        if (cmdResult.rows[0].total_count > 0) {
            const successRate = cmdResult.rows[0].success_count / cmdResult.rows[0].total_count;
            cmdSuccessScore = Math.round(successRate * 25);
        }

        // Factor 4: Pending Queue Health (20 points)
        // Penalize if too many pending commands (indicates device not responding)
        const pendingResult = await db.query(`
            SELECT COUNT(*) as pending FROM device_commands 
            WHERE device_serial = $1 AND status = 'pending'
        `, [deviceSerial]);

        const pendingCount = parseInt(pendingResult.rows[0].pending);
        let queueScore = 20;
        if (pendingCount > 100) queueScore = 0;
        else if (pendingCount > 50) queueScore = 5;
        else if (pendingCount > 20) queueScore = 10;
        else if (pendingCount > 10) queueScore = 15;

        // Calculate total score
        const totalScore = onlineScore + activityScore + cmdSuccessScore + queueScore;

        // Determine status
        let status;
        if (!isOnline) status = HEALTH_STATUS.OFFLINE;
        else if (totalScore >= 80) status = HEALTH_STATUS.HEALTHY;
        else if (totalScore >= 50) status = HEALTH_STATUS.WARNING;
        else status = HEALTH_STATUS.CRITICAL;

        return {
            score: totalScore,
            status,
            factors: {
                online: { score: onlineScore, max: 30, isOnline },
                activity: { score: activityScore, max: 25, idleMinutes: Math.round(idleMinutes) },
                commandSuccess: { score: cmdSuccessScore, max: 25, ...cmdResult.rows[0] },
                queueHealth: { score: queueScore, max: 20, pendingCount }
            }
        };
    } catch (err) {
        log('ERROR', 'Health score calculation failed', { device: deviceSerial, error: err.message });
        return { score: 0, status: HEALTH_STATUS.OFFLINE, factors: {}, error: err.message };
    }
};

/**
 * Get health status for all devices
 */
const getAllDevicesHealth = async () => {
    const devices = await db.query('SELECT serial_number, device_name FROM devices');
    const healthData = [];

    for (const device of devices.rows) {
        const health = await calculateHealthScore(device.serial_number);
        healthData.push({
            serial_number: device.serial_number,
            device_name: device.device_name,
            ...health
        });
    }

    return healthData;
};

/**
 * Record device activity (called on each communication)
 */
const recordActivity = async (deviceSerial, activityType) => {
    try {
        // Update activity timestamp is handled by ADMS
        // Here we can record additional metrics if needed

        // For now, just ensure device is online
        await db.query(`
            UPDATE devices 
            SET status = 'online', last_activity = NOW()
            WHERE serial_number = $1
        `, [deviceSerial]);

    } catch (err) {
        log('ERROR', 'Failed to record activity', { device: deviceSerial, error: err.message });
    }
};

/**
 * Generate alerts based on health conditions
 */
const checkAndGenerateAlerts = async () => {
    const alerts = [];

    try {
        // Check 1: Devices offline for more than 30 minutes
        const offlineDevices = await db.query(`
            SELECT serial_number, device_name, last_activity,
                   EXTRACT(EPOCH FROM (NOW() - last_activity))/60 as offline_minutes
            FROM devices 
            WHERE status = 'online' 
            AND last_activity < NOW() - INTERVAL '30 minutes'
        `);

        for (const device of offlineDevices.rows) {
            alerts.push({
                type: ALERT_TYPE.DEVICE_OFFLINE,
                severity: 'high',
                device: device.serial_number,
                deviceName: device.device_name,
                message: `Device ${device.device_name} has been unresponsive for ${Math.round(device.offline_minutes)} minutes`,
                timestamp: new Date()
            });
        }

        // Check 2: High failure rate (>30% in last hour)
        const failureRates = await db.query(`
            SELECT 
                device_serial,
                COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) as failures,
                COUNT(*) as total,
                ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) / NULLIF(COUNT(*), 0), 2) as failure_rate
            FROM device_commands
            WHERE created_at > NOW() - INTERVAL '1 hour'
            GROUP BY device_serial
            HAVING COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) > 5
               AND (100.0 * COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) / COUNT(*)) > 30
        `);

        for (const device of failureRates.rows) {
            alerts.push({
                type: ALERT_TYPE.HIGH_FAILURE_RATE,
                severity: 'medium',
                device: device.device_serial,
                message: `Device ${device.device_serial} has ${device.failure_rate}% command failure rate (${device.failures}/${device.total})`,
                timestamp: new Date()
            });
        }

        // Check 3: Large pending queue
        const largeQueues = await db.query(`
            SELECT 
                device_serial,
                COUNT(*) as pending_count,
                MIN(created_at) as oldest_command
            FROM device_commands
            WHERE status = 'pending'
            GROUP BY device_serial
            HAVING COUNT(*) > 50
        `);

        for (const device of largeQueues.rows) {
            alerts.push({
                type: ALERT_TYPE.SYNC_DELAYED,
                severity: 'medium',
                device: device.device_serial,
                message: `Device ${device.device_serial} has ${device.pending_count} pending commands`,
                timestamp: new Date()
            });
        }

        if (alerts.length > 0) {
            log('WARN', 'Alerts generated', { count: alerts.length });
        }

        return alerts;
    } catch (err) {
        log('ERROR', 'Alert check failed', { error: err.message });
        return [];
    }
};

/**
 * Get device uptime statistics
 */
const getUptimeStats = async (deviceSerial, days = 7) => {
    try {
        // This would require historical status tracking
        // For now, return basic stats
        const result = await db.query(`
            SELECT 
                serial_number,
                device_name,
                status,
                last_activity,
                created_at,
                EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as days_since_added
            FROM devices
            WHERE serial_number = $1
        `, [deviceSerial]);

        if (result.rows.length === 0) {
            return null;
        }

        const device = result.rows[0];

        // Get successful communication count
        const commResult = await db.query(`
            SELECT 
                COUNT(*) as total_commands,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter')) as failed
            FROM device_commands
            WHERE device_serial = $1
            AND created_at > NOW() - INTERVAL '${days} days'
        `, [deviceSerial]);

        return {
            device: result.rows[0],
            period: `${days} days`,
            commands: commResult.rows[0],
            successRate: commResult.rows[0].total_commands > 0
                ? Math.round(100 * commResult.rows[0].successful / commResult.rows[0].total_commands)
                : 100
        };
    } catch (err) {
        log('ERROR', 'Uptime stats failed', { device: deviceSerial, error: err.message });
        return null;
    }
};

/**
 * Get system-wide health summary
 */
const getSystemHealthSummary = async () => {
    try {
        const [devicesResult, commandsResult, biometricsResult] = await Promise.all([
            db.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'online') as online,
                    COUNT(*) FILTER (WHERE status = 'offline') as offline,
                    COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes') as active_now
                FROM devices
            `),
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'success' AND completed_at > NOW() - INTERVAL '1 hour') as success_1h,
                    COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter') AND completed_at > NOW() - INTERVAL '1 hour') as failed_1h,
                    COUNT(*) FILTER (WHERE status = 'dead_letter') as dead_letter_total
                FROM device_commands
            `),
            db.query(`
                SELECT 
                    COUNT(*) as total_templates,
                    COUNT(*) FILTER (WHERE template_type = 9) as face_templates,
                    COUNT(*) FILTER (WHERE template_type IN (1, 2)) as finger_templates
                FROM biometric_templates
            `)
        ]);

        const devices = devicesResult.rows[0];
        const commands = commandsResult.rows[0];
        const biometrics = biometricsResult.rows[0];

        // Calculate overall health
        const deviceHealth = devices.total > 0 ? Math.round(100 * devices.online / devices.total) : 0;
        const commandHealth = (parseInt(commands.success_1h) + parseInt(commands.failed_1h)) > 0
            ? Math.round(100 * commands.success_1h / (parseInt(commands.success_1h) + parseInt(commands.failed_1h)))
            : 100;

        return {
            overall_health: Math.round((deviceHealth + commandHealth) / 2),
            devices: {
                total: parseInt(devices.total),
                online: parseInt(devices.online),
                offline: parseInt(devices.offline),
                active_now: parseInt(devices.active_now),
                health_percentage: deviceHealth
            },
            commands: {
                pending: parseInt(commands.pending),
                success_last_hour: parseInt(commands.success_1h),
                failed_last_hour: parseInt(commands.failed_1h),
                dead_letter_total: parseInt(commands.dead_letter_total),
                success_rate: commandHealth
            },
            biometrics: {
                total: parseInt(biometrics.total_templates),
                face: parseInt(biometrics.face_templates),
                fingerprint: parseInt(biometrics.finger_templates)
            },
            timestamp: new Date()
        };
    } catch (err) {
        log('ERROR', 'System health summary failed', { error: err.message });
        throw err;
    }
};

// Background job: Check health every 5 minutes
const startHealthMonitor = (alertCallback) => {
    const runCheck = async () => {
        const alerts = await checkAndGenerateAlerts();
        if (alerts.length > 0 && alertCallback) {
            alertCallback(alerts);
        }
    };

    setInterval(runCheck, 5 * 60 * 1000);
    log('INFO', 'Health monitor started');

    // Run initial check
    setTimeout(runCheck, 10000);
};

module.exports = {
    HEALTH_STATUS,
    ALERT_TYPE,
    calculateHealthScore,
    getAllDevicesHealth,
    recordActivity,
    checkAndGenerateAlerts,
    getUptimeStats,
    getSystemHealthSummary,
    startHealthMonitor
};
