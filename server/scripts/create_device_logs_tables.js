const db = require('../db');

async function createTables() {
    try {
        console.log('Creating device_operation_logs table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS device_operation_logs (
                id SERIAL PRIMARY KEY,
                device_serial VARCHAR(50),
                operator VARCHAR(50),
                operation_type VARCHAR(100),
                log_time TIMESTAMP DEFAULT NOW(),
                details TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating device_error_logs table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS device_error_logs (
                id SERIAL PRIMARY KEY,
                device_serial VARCHAR(50),
                error_code VARCHAR(50),
                log_time TIMESTAMP DEFAULT NOW(),
                details TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Tables created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating tables:', err);
        process.exit(1);
    }
}

createTables();
