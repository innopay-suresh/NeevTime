const db = require('../db');

async function checkCmdsDate() {
    try {
        const res = await db.query("SELECT id, command, status, updated_at FROM device_commands ORDER BY id DESC LIMIT 5");
        console.log("Recent Commands:");
        res.rows.forEach(r => console.log(`${r.id}: ${r.status} at ${r.updated_at}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCmdsDate();
