const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'attendance_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function applySchema() {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema_easytime.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        console.log('Applying EasyTime Pro schema...');
        await pool.query(sql);
        console.log('✅ Schema applied successfully!');

        // Insert some default positions
        await pool.query(`
      INSERT INTO positions (position_code, position_name) VALUES
        ('POS001', 'Software Engineer'),
        ('POS002', 'HR Manager'),
        ('POS003', 'Team Lead'),
        ('POS004', 'Designer'),
        ('POS005', 'QA Engineer')
      ON CONFLICT (position_code) DO NOTHING
    `);
        console.log('✅ Default positions created');

        // Insert default holiday locations
        await pool.query(`
      INSERT INTO holiday_locations (location_code, location_name) VALUES
        ('LOC001', 'Head Office'),
        ('LOC002', 'Branch Office'),
        ('LOC003', 'Remote')
      ON CONFLICT (location_code) DO NOTHING
    `);
        console.log('✅ Default holiday locations created');

        // Insert default approval roles
        await pool.query(`
      INSERT INTO approval_roles (role_code, role_name, description) VALUES
        ('ROLE001', 'Manager', 'Department Manager with approval rights'),
        ('ROLE002', 'HR Admin', 'HR Administrator'),
        ('ROLE003', 'Super Admin', 'System Administrator with full access')
      ON CONFLICT (role_code) DO NOTHING
    `);
        console.log('✅ Default approval roles created');

    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
    } finally {
        await pool.end();
    }
}

applySchema();
