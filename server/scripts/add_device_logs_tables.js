const db = require('../db');

async function migrate() {
    try {
        console.log('Starting migration to add device log tables...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS device_operation_logs (
                id SERIAL PRIMARY KEY,
                device_serial VARCHAR(50) REFERENCES devices(serial_number),
                operator VARCHAR(50), -- Who performed the operation (often '0' or admin ID)
                operation_type INTEGER, -- Op code
                log_time TIMESTAMP NOT NULL,
                details TEXT, -- Raw value 1, value 2 etc
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS device_error_logs (
                id SERIAL PRIMARY KEY,
                device_serial VARCHAR(50) REFERENCES devices(serial_number),
                error_code INTEGER,
                log_time TIMESTAMP NOT NULL,
                data_origin VARCHAR(100),
                command_id INTEGER,
                details TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Successfully created device_operation_logs and device_error_logs tables.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
