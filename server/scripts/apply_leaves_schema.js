const fs = require('fs');
const path = require('path');
const db = require('../db');

async function applySchema() {
    try {
        console.log('Applying Leave Management schema...');
        const schemaPath = path.join(__dirname, '../../database/schema_leaves.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await db.query(sql);
        console.log('Leave Management schema applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply schema:', err);
        process.exit(1);
    }
}

applySchema();
