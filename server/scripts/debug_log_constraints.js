const db = require('../db');

async function check() {
    try {
        const tables = ['device_operation_logs', 'device_error_logs'];
        for (const t of tables) {
            console.log(`\n--- ${t} Constraints ---`);
            const res = await db.query(`
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE conrelid = '${t}'::regclass
            `);
            res.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
