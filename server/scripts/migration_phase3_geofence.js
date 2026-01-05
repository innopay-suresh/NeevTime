const db = require('../db');

async function runMigration() {
    console.log('🚀 Starting Phase 3 Migration: Geofencing & Mobile Attendance...');

    try {
        // 1. Create Geofences Table
        console.log('1️⃣ Creating geofences table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS geofences (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius_meters INTEGER DEFAULT 100,
                address TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ geofences table created.');

        // 2. Update attendance_logs table
        console.log('2️⃣ Updating attendance_logs table...');
        const logColumns = [
            'ADD COLUMN IF NOT EXISTS punch_source VARCHAR(50) DEFAULT \'biometric\'', // 'biometric', 'mobile', 'manual'
            'ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)',
            'ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)',
            'ADD COLUMN IF NOT EXISTS is_geofence_verified BOOLEAN DEFAULT FALSE',
            'ADD COLUMN IF NOT EXISTS geofence_id INTEGER REFERENCES geofences(id) ON DELETE SET NULL'
        ];

        for (const col of logColumns) {
            await db.query(`ALTER TABLE attendance_logs ${col}`);
        }
        console.log('✅ attendance_logs table updated.');

        // 3. Update employees table
        console.log('3️⃣ Updating employees table...');
        await db.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS assigned_geofence_id INTEGER REFERENCES geofences(id) ON DELETE SET NULL
        `);
        console.log('✅ employees table updated.');

        // 4. Insert a default geofence (Example: Head Office)
        // Note: Using a dummy lat/long (Bangalore) as placeholder
        const check = await db.query('SELECT count(*) FROM geofences');
        if (parseInt(check.rows[0].count) === 0) {
            console.log('4️⃣ Seeding default Head Office geofence...');
            await db.query(`
                INSERT INTO geofences (name, latitude, longitude, radius_meters, address)
                VALUES ('Head Office (Default)', 12.9715987, 77.5945627, 200, 'MG Road, Bangalore')
            `);
        } else {
            console.log('4️⃣ Geofences already exist, skipping seed.');
        }

        console.log('\n✨ Phase 3 Migration Completed Successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

runMigration();
