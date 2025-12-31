/**
 * Device Capabilities Detection Service
 * 
 * Automatically detects and stores device capabilities including:
 * - Device model and firmware version
 * - Face algorithm version (MajorVer, MinorVer)
 * - Fingerprint algorithm version
 * - Supported biometric types (face, finger, palm, card)
 * - Device capacities
 * 
 * This enables automatic adaptation to different device models from various vendors.
 */

const db = require('../db');
const fs = require('fs');

// Log helper
const logCapability = (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[DeviceCapabilities] ${msg}`);
    fs.appendFileSync('device_capabilities.log', `[${timestamp}] ${msg}\n`);
};

/**
 * Parse device INFO string from getrequest
 * Actual ZKTeco Format observed:
 * ZAM70-NF24HA-Ver3.3.12,1,1,0,10.81.20.170,10,40,12,1,11010,0,0,0
 * Parts:
 *   [0] = Model-Firmware (ZAM70-NF24HA-Ver3.3.12)
 *   [1] = Face supported (1=yes)
 *   [2] = Finger supported (1=yes)
 *   [3] = Palm supported (1=yes)
 *   [4] = Device IP
 *   [5] = Unknown (10)
 *   [6] = Face MajorVer (40)
 *   [7] = Face MinorVer or related (12)
 *   [8] = Unknown (1)
 *   [9] = Unknown (11010)
 *   ... more fields
 */
const parseDeviceInfo = (infoString) => {
    if (!infoString) return null;

    const capabilities = {
        raw_info: infoString,
        device_model: null,
        firmware_version: null,
        face_supported: false,
        face_major_ver: 40,  // Default ZKTeco face algorithm version
        face_minor_ver: 1,
        finger_supported: false,
        finger_version: null,
        palm_supported: false,
        card_supported: true  // Most devices support cards
    };

    try {
        const parts = infoString.split(',');

        if (parts.length > 0) {
            // First part contains model and firmware
            // Format: ZAM70-NF24HA-Ver3.3.12
            const modelPart = parts[0];

            // Extract firmware version (after "Ver")
            const verMatch = modelPart.match(/-[Vv]er([\d.]+)/);
            if (verMatch) {
                capabilities.firmware_version = verMatch[1];
            }

            // Extract model (everything before -Ver)
            const verIndex = modelPart.search(/-[Vv]er/i);
            if (verIndex > 0) {
                capabilities.device_model = modelPart.substring(0, verIndex);
            } else {
                capabilities.device_model = modelPart;
            }
        }

        // Parse capability flags
        // [1] = Face, [2] = Finger, [3] = Palm
        if (parts.length > 1) {
            capabilities.face_supported = parts[1] === '1';
        }
        if (parts.length > 2) {
            capabilities.finger_supported = parts[2] === '1';
        }
        if (parts.length > 3) {
            capabilities.palm_supported = parts[3] === '1';
        }

        // [6] = Face MajorVer (typically 40 for ZKTeco)
        if (parts.length > 6) {
            const majorVer = parseInt(parts[6]);
            if (majorVer >= 30 && majorVer <= 100) {
                capabilities.face_major_ver = majorVer;
            }
        }

        // [7] might be MinorVer but we'll default to 1
        // The actual MinorVer is usually obtained from BIODATA responses
        capabilities.face_minor_ver = 1;

    } catch (err) {
        logCapability(`Error parsing device info: ${err.message}`);
    }

    return capabilities;
};

/**
 * Parse BIODATA response to extract actual algorithm versions
 * This is more accurate than INFO parsing
 */
const parseBiodataVersions = (biodataLine) => {
    const versions = {
        major_ver: 0,
        minor_ver: 0,
        format: 0
    };

    try {
        // Parse MajorVer=XX
        const majorMatch = biodataLine.match(/MajorVer[=:](\d+)/i);
        if (majorMatch) versions.major_ver = parseInt(majorMatch[1]);

        // Parse MinorVer=XX
        const minorMatch = biodataLine.match(/MinorVer[=:](\d+)/i);
        if (minorMatch) versions.minor_ver = parseInt(minorMatch[1]);

        // Parse Format=XX
        const formatMatch = biodataLine.match(/Format[=:](\d+)/i);
        if (formatMatch) versions.format = parseInt(formatMatch[1]);

    } catch (err) {
        logCapability(`Error parsing BIODATA versions: ${err.message}`);
    }

    return versions;
};

/**
 * Store or update device capabilities in database
 */
const storeCapabilities = async (deviceSerial, capabilities) => {
    try {
        await db.query(`
            INSERT INTO device_capabilities 
            (device_serial, device_model, firmware_version, face_supported, face_major_ver, face_minor_ver,
             finger_supported, palm_supported, card_supported, raw_info, detected_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ON CONFLICT (device_serial) 
            DO UPDATE SET 
                device_model = COALESCE(EXCLUDED.device_model, device_capabilities.device_model),
                firmware_version = COALESCE(EXCLUDED.firmware_version, device_capabilities.firmware_version),
                face_supported = EXCLUDED.face_supported,
                face_major_ver = CASE WHEN EXCLUDED.face_major_ver > 0 THEN EXCLUDED.face_major_ver ELSE device_capabilities.face_major_ver END,
                face_minor_ver = CASE WHEN EXCLUDED.face_minor_ver > 0 THEN EXCLUDED.face_minor_ver ELSE device_capabilities.face_minor_ver END,
                finger_supported = EXCLUDED.finger_supported,
                palm_supported = EXCLUDED.palm_supported,
                card_supported = EXCLUDED.card_supported,
                raw_info = COALESCE(EXCLUDED.raw_info, device_capabilities.raw_info),
                updated_at = NOW()
        `, [
            deviceSerial,
            capabilities.device_model,
            capabilities.firmware_version,
            capabilities.face_supported,
            capabilities.face_major_ver || 0,
            capabilities.face_minor_ver || 0,
            capabilities.finger_supported,
            capabilities.palm_supported,
            capabilities.card_supported,
            capabilities.raw_info
        ]);

        logCapability(`Stored capabilities for ${deviceSerial}: Model=${capabilities.device_model}, Face=${capabilities.face_supported} (v${capabilities.face_major_ver}.${capabilities.face_minor_ver}), Finger=${capabilities.finger_supported}`);
        return true;
    } catch (err) {
        logCapability(`Error storing capabilities for ${deviceSerial}: ${err.message}`);
        return false;
    }
};

/**
 * Get device capabilities from database
 */
const getCapabilities = async (deviceSerial) => {
    try {
        const result = await db.query(`
            SELECT * FROM device_capabilities WHERE device_serial = $1
        `, [deviceSerial]);

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
        logCapability(`Error getting capabilities for ${deviceSerial}: ${err.message}`);
        return null;
    }
};

/**
 * Get all device capabilities
 */
const getAllCapabilities = async () => {
    try {
        const result = await db.query(`
            SELECT dc.*, d.device_name, d.status 
            FROM device_capabilities dc
            LEFT JOIN devices d ON dc.device_serial = d.serial_number
            ORDER BY dc.device_serial
        `);
        return result.rows;
    } catch (err) {
        logCapability(`Error getting all capabilities: ${err.message}`);
        return [];
    }
};

/**
 * Update face algorithm version for a device
 * Called when we receive BIODATA from the device with version info
 */
const updateFaceVersion = async (deviceSerial, majorVer, minorVer, format = 0) => {
    try {
        await db.query(`
            UPDATE device_capabilities 
            SET face_major_ver = $2, face_minor_ver = $3, face_supported = true, updated_at = NOW()
            WHERE device_serial = $1
        `, [deviceSerial, majorVer, minorVer]);

        // If no row exists, create one with just face info
        const result = await db.query(`SELECT 1 FROM device_capabilities WHERE device_serial = $1`, [deviceSerial]);
        if (result.rows.length === 0) {
            await db.query(`
                INSERT INTO device_capabilities (device_serial, face_supported, face_major_ver, face_minor_ver)
                VALUES ($1, true, $2, $3)
            `, [deviceSerial, majorVer, minorVer]);
        }

        logCapability(`Updated face version for ${deviceSerial}: MajorVer=${majorVer}, MinorVer=${minorVer}`);
        return true;
    } catch (err) {
        logCapability(`Error updating face version for ${deviceSerial}: ${err.message}`);
        return false;
    }
};

/**
 * Detect device capabilities from handshake/getrequest
 * Called automatically when device connects
 */
const detectFromHandshake = async (deviceSerial, infoString) => {
    logCapability(`Detecting capabilities for ${deviceSerial} from INFO: ${infoString?.substring(0, 100)}...`);

    const capabilities = parseDeviceInfo(infoString);
    if (capabilities) {
        await storeCapabilities(deviceSerial, capabilities);
        return capabilities;
    }

    // If no INFO string, create basic entry
    await storeCapabilities(deviceSerial, {
        device_model: 'Unknown',
        face_supported: true,  // Assume supported, will be confirmed on first sync
        finger_supported: true,
        palm_supported: false,
        card_supported: true,
        face_major_ver: 40,  // Default ZKTeco face version
        face_minor_ver: 1
    });

    return null;
};

/**
 * Queue commands to probe device capabilities
 * Call this to actively query a device's capabilities
 */
const probeDeviceCapabilities = async (deviceSerial) => {
    try {
        // Queue commands to query device capabilities
        const commands = [
            'DATA QUERY BIODATA',   // Will return with version info
            'DATA QUERY FACE',      // Check if face supported
            'DATA QUERY FINGERTMP', // Check if finger supported
        ];

        for (const cmd of commands) {
            await db.query(`
                INSERT INTO device_commands (device_serial, command, status)
                VALUES ($1, $2, 'pending')
            `, [deviceSerial, cmd]);
        }

        logCapability(`Queued capability probe commands for ${deviceSerial}`);
        return true;
    } catch (err) {
        logCapability(`Error probing capabilities for ${deviceSerial}: ${err.message}`);
        return false;
    }
};

/**
 * Get optimal sync format for a device
 * Returns the command format to use based on device capabilities
 */
const getSyncFormat = async (deviceSerial, templateType) => {
    const caps = await getCapabilities(deviceSerial);

    if (templateType === 9) {  // Face
        return {
            command: 'DATA UPDATE BIODATA',
            majorVer: caps?.face_major_ver || 40,
            minorVer: caps?.face_minor_ver || 1,
            format: 0,
            supported: caps?.face_supported !== false
        };
    } else {  // Fingerprint
        return {
            command: 'DATA UPDATE FINGERTMP',
            supported: caps?.finger_supported !== false
        };
    }
};

module.exports = {
    parseDeviceInfo,
    parseBiodataVersions,
    storeCapabilities,
    getCapabilities,
    getAllCapabilities,
    updateFaceVersion,
    detectFromHandshake,
    probeDeviceCapabilities,
    getSyncFormat
};
