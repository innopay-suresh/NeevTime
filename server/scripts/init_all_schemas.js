/**
 * Initialize All Database Schemas
 * 
 * This script applies all database schemas in the correct order:
 * 1. Base schema (devices, employees, users, etc.)
 * 2. EasyTime schema (positions, approval roles, etc.)
 * 3. Expansion schema (companies, branches, leaves)
 * 4. Leaves schema (leave types, applications)
 * 5. Timetable schema (shifts, breaks, schedules)
 * 6. Settings schema (app settings)
 * 7. Phase 3 schema (additional features)
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

const SCHEMA_FILES = [
    'schema.sql',
    'schema_easytime.sql',
    'schema_expansion.sql',
    'schema_leaves.sql',
    'schema_timetable.sql',
    'schema_settings.sql',
    'schema_phase3.sql'
];

async function applySchema(fileName) {
    const schemaPath = path.join(__dirname, '../../database', fileName);
    
    if (!fs.existsSync(schemaPath)) {
        console.log(`⚠️  Schema file not found: ${fileName}, skipping...`);
        return;
    }

    try {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📄 Applying ${fileName}...`);
        await db.query(sql);
        console.log(`✅ ${fileName} applied successfully!`);
    } catch (err) {
        if (err.code === '42P07' || err.message.includes('already exists')) {
            console.log(`ℹ️  ${fileName} - tables already exist, skipping...`);
        } else {
            console.error(`❌ Error applying ${fileName}:`, err.message);
            throw err;
        }
    }
}

async function createDefaultUser() {
    try {
        const bcrypt = require('bcryptjs');
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await db.query(`
            INSERT INTO users (username, password_hash, role, email)
            VALUES ('admin', $1, 'admin', 'admin@vayutime.com')
            ON CONFLICT (username) DO NOTHING
        `, [hashedPassword]);
        
        console.log('✅ Default admin user created (username: admin, password: admin)');
    } catch (err) {
        if (err.code === '42P07' || err.message.includes('already exists')) {
            console.log('ℹ️  Default user already exists');
        } else {
            console.error('❌ Error creating default user:', err.message);
        }
    }
}

async function initAllSchemas() {
    try {
        console.log('🚀 Starting database initialization...\n');

        // Apply all schema files in order
        for (const schemaFile of SCHEMA_FILES) {
            await applySchema(schemaFile);
        }

        console.log('\n👤 Creating default admin user...');
        await createDefaultUser();

        console.log('\n✅ Database initialization completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Database initialization failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

initAllSchemas();

