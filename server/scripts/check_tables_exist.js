const db = require('../db');

async function checkTables() {
    try {
        const res = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('device_operation_logs', 'device_error_logs');
        `);
        console.log('Found tables:', res.rows.map(r => r.table_name));
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err);
        process.exit(1);
    }
}

checkTables();
