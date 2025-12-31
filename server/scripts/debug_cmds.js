const db = require('../db');

async function checkCmds() {
    try {
        const res = await db.query("SELECT * FROM device_commands ORDER BY id DESC LIMIT 20");
        console.table(res.rows.map(r => ({
            id: r.id,
            cmd: r.command.substring(0, 50),
            status: r.status,
            updated: r.updated_at
        })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCmds();
