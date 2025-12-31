const db = require('../db');

async function checkBio() {
    try {
        const temps = await db.query('SELECT * FROM biometric_templates');
        console.log(`\n=== STORED TEMPLATES (${temps.rowCount}) ===`);
        temps.rows.forEach(t => console.log(`[${t.employee_code}] Type: ${t.template_type}, Size: ${t.template_data?.length}`));

        const cmds = await db.query("SELECT * FROM device_commands ORDER BY id DESC LIMIT 20");
        console.log(`\n=== RECENT COMMANDS ===`);
        cmds.rows.forEach(c => console.log(`[${c.status}] ${c.command.substring(0, 100)}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkBio();
