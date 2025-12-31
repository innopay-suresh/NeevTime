const db = require('../db');

async function testQuery() {
    try {
        const result = await db.query(`
            SELECT 
                e.*,
                d.name as department_name,
                a.name as area_name,
                e.designation as position_code
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN areas a ON e.area_id = a.id
            ORDER BY e.name
        `);
        console.log('Query Success. Rows:', result.rowCount);
        process.exit(0);
    } catch (err) {
        console.error('Query Failed:', err.message);
        process.exit(1);
    }
}
testQuery();
