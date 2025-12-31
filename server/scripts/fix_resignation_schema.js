const db = require('../db');

async function migrate() {
    try {
        console.log('Migrating employees table for Resignation...');

        await db.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS resignation_date DATE,
            ADD COLUMN IF NOT EXISTS resignation_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS report_end_date DATE,
            ADD COLUMN IF NOT EXISTS resign_reason TEXT,
            ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN DEFAULT TRUE;
        `);

        console.log('Migration successful: Resignation columns added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
