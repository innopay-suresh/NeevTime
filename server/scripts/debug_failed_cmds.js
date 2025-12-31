const db = require('../db');

async function checkCmdsByID() {
    try {
        const ids = [55, 56, 57, 58, 59, 60];
        const res = await db.query("SELECT id, command, status FROM device_commands WHERE id = ANY($1)", [ids]);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCmdsByID();
