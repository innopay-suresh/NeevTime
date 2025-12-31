const db = require('../db');

async function checkBiometrics() {
    try {
        console.log('--- Employees (First 5 with active status) ---');
        const emps = await db.query('SELECT id, name, area_id, fingerprint_count, face_count FROM employees WHERE status IS DISTINCT FROM \'resigned\' LIMIT 5');
        console.table(emps.rows);

        console.log('\n--- Biometric Templates Count ---');
        const templates = await db.query('SELECT COUNT(*) as total_templates, type FROM biometric_templates GROUP BY type');
        console.table(templates.rows);

        console.log('\n--- Join Check (Templates per Employee) ---');
        const joinCheck = await db.query(`
            SELECT e.id, e.name, COUNT(bt.id) as real_template_count
            FROM employees e
            LEFT JOIN biometric_templates bt ON e.employee_code = bt.employee_code
            WHERE bt.type = 1 -- 1 usually implies fingerprint, need to verify type mapping
            GROUP BY e.id, e.name
            LIMIT 5
        `);
        console.table(joinCheck.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBiometrics();
