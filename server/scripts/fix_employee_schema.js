const db = require('../db');

async function migrate() {
    try {
        console.log('Migrating employees and positions tables...');

        // Employees: Add area_id, biometrics
        await db.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS fingerprint_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS face_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS palm_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS device_password VARCHAR(50);
        `);

        // Positions: Add code
        await db.query(`
            ALTER TABLE positions 
            ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        `);

        // Seed some position codes if they don't exist
        await db.query(`
            UPDATE positions SET code = 'POS-' || id WHERE code IS NULL;
        `);

        console.log('Migration successful: Employee and Position columns added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
