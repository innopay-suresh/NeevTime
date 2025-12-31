const db = require('../db');

async function checkSchema() {
    try {
        const check = async (table) => {
            const res = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}';
            `);
            console.log(`\n--- ${table} Columns ---`);
            res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
        }

        await check('devices');
        await check('employees');
        await check('biometric_templates');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
