const db = require('../db');

async function checkLogTables() {
    try {
        const t1 = await db.query("SELECT * FROM device_operation_logs LIMIT 1");
        console.log("device_operation_logs exists.");
        const t2 = await db.query("SELECT * FROM device_error_logs LIMIT 1");
        console.log("device_error_logs exists.");
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
checkLogTables();
