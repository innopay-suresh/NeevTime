
const db = require('../db');

async function migrate() {
    try {
        console.log('Adding device_direction column to devices table...');
        await db.query(`
            ALTER TABLE devices 
            ADD COLUMN IF NOT EXISTS device_direction VARCHAR(20) DEFAULT 'both';
        `);
        console.log('Column added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
