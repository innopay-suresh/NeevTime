const db = require('../db');

async function testDelete() {
    try {
        console.log('Creating test area...');
        const insert = await db.query("INSERT INTO areas (name, code) VALUES ('Test Delete Area', 'TDA001') RETURNING id");
        const id = insert.rows[0].id;
        console.log(`Created area with ID: ${id}`);

        console.log('Attempting delete...');
        await db.query('DELETE FROM areas WHERE id = $1', [id]);
        console.log('Delete successful.');

        // Verify
        const check = await db.query('SELECT * FROM areas WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            console.log('Verification: Area is gone.');
        } else {
            console.error('Verification Failed: Area still exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testDelete();
