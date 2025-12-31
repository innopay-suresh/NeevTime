const db = require('../db');
const attendanceEngine = require('./attendance_engine');

/**
 * ADMS Protocol Handler
 * 
 * Endpoints:
 * - GET /iclock/cdata: Initialization / Handshake
 * - POST /iclock/cdata: Receive Log Data
 * - GET /iclock/getrequest: Device asks for commands
 * - POST /iclock/devicecmd: Device responds to command result
 */

// Format timestamp for DB
const formatTime = (ts) => {
    // If ts is not provided or invalid, return now
    if (!ts) return new Date();
    return ts;
};

// Helper to process Key=Value lines (BIODATA/FP/FACE)
const processBiodataLine = async (line, SN, table) => {
    try {
        const fields = {};
        // Handle space OR tab separated
        line.split(/\s+/).forEach(part => {
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                if (key && value !== undefined) {
                    fields[key.trim()] = value.trim();
                }
            }
        });

        const PIN = fields['PIN'];
        if (!PIN) return; // Must have PIN

        // Handle USER info (no template)
        if (line.startsWith('USER')) {
            const Name = fields['Name'];
            /*
            if (Name) {
                await db.query(`
                   INSERT INTO employees (employee_code, name, department_id, status)
                   VALUES ($1, $2, NULL, 'Active')
                   ON CONFLICT (employee_code) DO UPDATE SET name = EXCLUDED.name
               `, [PIN, Name]);
            }
            */
            return;
        }

        const No = fields['No'] || fields['FID'] || fields['Index'] || '0';
        let Type = fields['Type'];

        // Infer type if missing
        if (!Type) {
            if (line.startsWith('FACE')) Type = '9';
            else if (line.startsWith('FP')) Type = '1';
            else if (table === 'FACE') Type = '9';
            else if (table === 'FINGERTMP') Type = '1';
            else if (table === 'USERVF') Type = '9';
        }

        const Temp = fields['Temp'] || fields['TMP'] || fields['Tmp'];
        const Valid = fields['Valid'] || '1';
        const Duress = fields['Duress'] || '0';

        if (!Type || !Temp) return;

        const templateNo = No || '0';
        const templateType = parseInt(Type || '1');

        // Ensure employee exists
        await db.query(`
            INSERT INTO employees (employee_code, name, department_id, status)
            VALUES ($1, 'Unknown', NULL, 'Active')
            ON CONFLICT (employee_code) DO NOTHING
        `, [PIN]);

        // Store/update biometric template
        await db.query(`
            INSERT INTO biometric_templates 
            (employee_code, template_type, template_no, valid, duress, template_data, source_device)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (employee_code, template_type, template_no) 
            DO UPDATE SET 
                template_data = EXCLUDED.template_data,
                valid = EXCLUDED.valid,
                duress = EXCLUDED.duress,
                source_device = EXCLUDED.source_device,
                updated_at = NOW()
        `, [PIN, templateType, parseInt(templateNo), parseInt(Valid || 1), parseInt(Duress || 0), Temp, SN]);

        console.log(`[ADMS] Saved template for PIN=${PIN} Type=${templateType} No=${templateNo} from ${SN}`);

        // Update employee biometric flags
        if (templateType === 1 || templateType === 2) {
            await db.query('UPDATE employees SET has_fingerprint = true WHERE employee_code = $1', [PIN]);
        } else if (templateType === 9) {
            await db.query('UPDATE employees SET has_face = true WHERE employee_code = $1', [PIN]);
        }
    } catch (e) {
        console.error('[ADMS] Template Error:', e.message);
    }
};

// 1. Handshake
const handleHandshake = async (req, res, io) => {
// ... existing code ...
