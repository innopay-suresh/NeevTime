const db = require('../db');

async function fixAllSchemas() {
    console.log('🚀 Starting comprehensive schema fix...\n');

    // Fix Areas table
    console.log('📦 Fixing areas table...');
    const areasColumns = [
        { name: 'code', type: 'VARCHAR(50)' },
        { name: 'parent_area_id', type: 'INTEGER' }
    ];

    for (const col of areasColumns) {
        try {
            await db.query(`ALTER TABLE areas ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
            console.log(`  ✅ Column areas.${col.name} ensured.`);
        } catch (err) {
            console.error(`  ❌ Error adding areas.${col.name}:`, err.message);
        }
    }

    // Fix Devices table
    console.log('\n📦 Fixing devices table...');
    const devicesColumns = [
        { name: 'area_id', type: 'INTEGER' },
        { name: 'transfer_mode', type: "VARCHAR(50) DEFAULT 'realtime'" },
        { name: 'timezone', type: "VARCHAR(50) DEFAULT 'Etc/GMT+5:30'" },
        { name: 'is_registration_device', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_attendance_device', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'connection_interval', type: 'INTEGER DEFAULT 10' },
        { name: 'device_direction', type: "VARCHAR(20) DEFAULT 'both'" },
        { name: 'enable_access_control', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of devicesColumns) {
        try {
            await db.query(`ALTER TABLE devices ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
            console.log(`  ✅ Column devices.${col.name} ensured.`);
        } catch (err) {
            console.error(`  ❌ Error adding devices.${col.name}:`, err.message);
        }
    }

    // Fix Employees table
    console.log('\n📦 Fixing employees table...');
    const employeesColumns = [
        { name: 'area_id', type: 'INTEGER' },
        { name: 'gender', type: 'VARCHAR(10)' },
        { name: 'dob', type: 'DATE' },
        { name: 'joining_date', type: 'DATE' },
        { name: 'mobile', type: 'VARCHAR(20)' },
        { name: 'email', type: 'VARCHAR(100)' },
        { name: 'address', type: 'TEXT' },
        { name: 'status', type: "VARCHAR(20) DEFAULT 'active'" },
        { name: 'employment_type', type: 'VARCHAR(50)' }
    ];

    for (const col of employeesColumns) {
        try {
            await db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
            console.log(`  ✅ Column employees.${col.name} ensured.`);
        } catch (err) {
            console.error(`  ❌ Error adding employees.${col.name}:`, err.message);
        }
    }

    console.log('\n✅ Comprehensive schema fix completed!');
    process.exit(0);
}

fixAllSchemas().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
