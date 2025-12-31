const db = require('../db');

async function checkBioTemplates() {
    try {
        const res = await db.query('SELECT * FROM biometric_templates');
        console.log(`Found ${res.rowCount} biometric templates:`);
        res.rows.forEach(r => {
            console.log(`- Emp: ${r.employee_code}, Type: ${r.template_type}, No: ${r.template_no}, Valid: ${r.valid}, Source: ${r.source_device}`);
        });

        const pendingCmds = await db.query("SELECT * FROM device_commands WHERE command LIKE '%DATA UPDATE BIODATA%' AND status = 'pending'");
        console.log(`Found ${pendingCmds.rowCount} pending BIODATA update commands.`);

        process.exit(0);
    } catch (err) {
        console.error('Error checking templates:', err);
        process.exit(1);
    }
}

checkBioTemplates();
