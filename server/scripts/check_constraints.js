const db = require('../db');

async function checkConstraints() {
    try {
        const check = async (table) => {
            const res = await db.query(`
                SELECT conname, pg_get_constraintdef(oid) 
                FROM pg_constraint 
                WHERE conrelid = '${table}'::regclass;
            `);
            console.log(`\n--- ${table} Constraints ---`);
            res.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));
        }

        await check('employees');
        await check('devices');
        await check('areas');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConstraints();
