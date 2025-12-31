const db = require('../db');

async function migrate() {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        console.log('Creating biometric_templates table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS biometric_templates (
                id SERIAL PRIMARY KEY,
                employee_code VARCHAR(50) REFERENCES employees(employee_code) ON DELETE CASCADE,
                type INTEGER NOT NULL, -- 1: Fingerprint, 2: Face
                finger_index INTEGER DEFAULT 0,
                template_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Seeding mock biometric data...');
        // Get some employees
        const res = await client.query('SELECT employee_code FROM employees LIMIT 5');

        for (const emp of res.rows) {
            // Add 2 Fingerprints
            await client.query(`
                INSERT INTO biometric_templates (employee_code, type, finger_index, template_data)
                VALUES 
                ($1, 1, 6, 'mock_fp_data_1'),
                ($1, 1, 7, 'mock_fp_data_2')
            `, [emp.employee_code]);

            // Add 1 Face
            await client.query(`
                INSERT INTO biometric_templates (employee_code, type, template_data)
                VALUES 
                ($1, 2, 'mock_face_data')
            `, [emp.employee_code]);

            // Update Counts in Employees Table
            await client.query(`
                UPDATE employees 
                SET fingerprint_count = 2, face_count = 1 
                WHERE employee_code = $1
            `, [emp.employee_code]);
        }

        await client.query('COMMIT');
        console.log('Migration and seeding successful.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
