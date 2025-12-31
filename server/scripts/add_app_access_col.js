const db = require('../db');

async function migrate() {
    try {
        console.log('Adding app_login_enabled column to employees...');

        await db.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS app_login_enabled BOOLEAN DEFAULT FALSE;
        `);

        console.log('Migration successful: app_login_enabled column added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
