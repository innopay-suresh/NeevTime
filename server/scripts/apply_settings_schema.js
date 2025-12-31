const db = require('../db');
const fs = require('fs');
const path = require('path');

async function applySettingsSchema() {
    try {
        console.log('Applying settings schema...');

        const schemaPath = path.join(__dirname, '../../database/schema_settings.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await db.query(sql);

        console.log('✅ Settings schema applied successfully!');

        // Verify by counting settings
        const result = await db.query('SELECT category, COUNT(*) as count FROM app_settings GROUP BY category ORDER BY category');
        console.log('\nSettings by category:');
        result.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count} settings`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error applying settings schema:', err.message);
        process.exit(1);
    }
}

applySettingsSchema();
