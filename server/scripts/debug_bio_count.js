const db = require('../db');

async function checkBioCount() {
    try {
        const res = await db.query("SELECT COUNT(*) FROM biometric_templates");
        console.log("Biometric Templates Count:", res.rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkBioCount();
