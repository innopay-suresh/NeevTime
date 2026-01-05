const db = require('../db');

async function fixDevicesSchema() {
    console.log('🚀 Starting devices table schema fix...');

    const columnsToAdd = [
        { name: 'area_id', type: 'INTEGER REFERENCES areas(id) ON DELETE SET NULL' },
        { name: 'transfer_mode', type: "VARCHAR(50) DEFAULT 'realtime'" },
        { name: 'timezone', type: "VARCHAR(50) DEFAULT 'Etc/GMT+5:30'" },
        { name: 'is_registration_device', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_attendance_device', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'connection_interval', type: 'INTEGER DEFAULT 10' },
        { name: 'device_direction', type: "VARCHAR(20) DEFAULT 'both'" },
        { name: 'enable_access_control', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of columnsToAdd) {
        try {
            console.log(`Checking column: ${col.name}...`);
            await db.query(`ALTER TABLE devices ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
            console.log(`✅ Column ${col.name} ensured.`);
        } catch (err) {
            console.error(`❌ Error adding column ${col.name}:`, err.message);
        }
    }

    console.log('\n✅ Devices table schema fix completed!');
    process.exit(0);
}

fixDevicesSchema();
