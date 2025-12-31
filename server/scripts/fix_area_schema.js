const db = require('../db');

async function migrate() {
    try {
        console.log('Migrating areas table...');
        await db.query(`
            ALTER TABLE areas 
            ADD COLUMN IF NOT EXISTS parent_area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL;
        `);
        console.log('Migration successful: parent_area_id added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
