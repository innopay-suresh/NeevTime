const db = require('../db');

async function checkTables() {
    try {
        const dept = await db.query("SELECT * FROM departments LIMIT 1");
        console.log('Departments:', dept.rows);
        const area = await db.query("SELECT * FROM areas LIMIT 1");
        console.log('Areas:', area.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err.message);
        process.exit(1);
    }
}
checkTables();
