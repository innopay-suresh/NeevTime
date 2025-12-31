const db = require('../db');

async function createAttendanceRulesTable() {
    try {
        console.log('Dropping existing attendance_rules table...');
        await db.query('DROP TABLE IF EXISTS attendance_rules');

        console.log('Creating attendance_rules table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS attendance_rules (
                id SERIAL PRIMARY KEY,
                rule_type VARCHAR(50) NOT NULL DEFAULT 'global', -- 'global' or 'department'
                department_id INTEGER REFERENCES departments(id),
                name VARCHAR(100) NOT NULL,
                
                -- Thresholds
                late_threshold_minutes INTEGER DEFAULT 15,
                early_leave_threshold_minutes INTEGER DEFAULT 15,
                half_day_threshold_minutes INTEGER DEFAULT 240,
                absent_threshold_minutes INTEGER DEFAULT 480,
                
                -- Overtime
                overtime_enabled BOOLEAN DEFAULT false,
                overtime_threshold_minutes INTEGER DEFAULT 30,
                overtime_multiplier NUMERIC(3, 1) DEFAULT 1.5,
                
                -- Grace Periods
                grace_period_minutes INTEGER DEFAULT 5,
                grace_late_allowed_per_month INTEGER DEFAULT 3,
                
                -- Week Offs
                week_off_days TEXT[] DEFAULT ARRAY['sunday'],
                alternate_saturday BOOLEAN DEFAULT false,
                
                -- Calculations
                round_off_minutes INTEGER DEFAULT 15,
                minimum_punch_gap_minutes INTEGER DEFAULT 30,
                
                -- Meta
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Table attendance_rules created successfully.');

        // Add default global rule if not exists
        const result = await db.query("SELECT COUNT(*) FROM attendance_rules WHERE rule_type = 'global'");
        if (parseInt(result.rows[0].count) === 0) {
            console.log('Inserting default global rule...');
            await db.query(`
                INSERT INTO attendance_rules (name, rule_type) 
                VALUES ('Default Global Policy', 'global')
            `);
            console.log('Default rule inserted.');
        }

    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
}

createAttendanceRulesTable();
