const db = require('../db');

async function migrate() {
    try {
        console.log('Creating resignations table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS resignations (
                id SERIAL PRIMARY KEY,
                employee_code VARCHAR(50) NOT NULL REFERENCES employees(employee_code),
                resignation_date DATE NOT NULL,
                resignation_type VARCHAR(50) NOT NULL,
                report_end_date DATE NOT NULL,
                attendance_enabled BOOLEAN DEFAULT FALSE,
                reason_enabled BOOLEAN DEFAULT FALSE,
                reason TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Migration successful: resignations table created.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
