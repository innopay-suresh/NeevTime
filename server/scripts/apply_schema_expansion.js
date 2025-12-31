const fs = require('fs');
const path = require('path');
const db = require('../db');

async function applySchema() {
    try {
        console.log('Applying schema expansion...');
        const schemaPath = path.join(__dirname, '../../database/schema_expansion.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await db.query(sql);
        console.log('Schema expansion applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply schema:', err);
        process.exit(1);
    }
}

applySchema();
