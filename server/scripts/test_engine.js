const db = require('../db');

async function test() {
    try {
        console.log('--- Attendance Engine Test ---');

        // 1. Create Mock Employee & Device
        const empCode = 'TEST_ENG_001';
        await db.query(`
            INSERT INTO employees (employee_code, name, department_id)
            VALUES ($1, 'Engine Tester', NULL)
            ON CONFLICT (employee_code) DO NOTHING
        `, [empCode]);

        await db.query(`
            INSERT INTO devices (serial_number, device_name, status)
            VALUES ('MOCK', 'Mock Device', 'online')
            ON CONFLICT (serial_number) DO NOTHING
        `);

        // 2. Insert Mock Logs (Late Entry)
        // Shift 09:00 - 18:00
        const today = new Date().toISOString().split('T')[0];
        console.log(`Inserting logs for ${today}...`);

        await db.query('DELETE FROM attendance_logs WHERE employee_code = $1', [empCode]);
        await db.query(`
            INSERT INTO attendance_logs (employee_code, device_serial, punch_time, punch_state)
            VALUES 
            ($1, 'MOCK', $2, '0'), -- 09:15 (15 mins late)
            ($1, 'MOCK', $3, '1')  -- 18:05
        `, [empCode, `${today} 09:15:00`, `${today} 18:05:00`]);

        // 3. Trigger Process Direct Call
        console.log('Triggering Process (Direct Service Call)...');
        const attendanceEngine = require('../services/attendance_engine');
        const results = await attendanceEngine.processDateRange(today, today, null);
        console.log('Processed Count:', results.length);

        // 4. Check Summary
        const summary = await db.query('SELECT * FROM attendance_daily_summary WHERE employee_code = $1 AND date = $2', [empCode, today]);
        const row = summary.rows[0];

        console.log('--- Summary Result ---');
        console.log('Status:', row.status);
        console.log('In Time:', row.in_time);
        console.log('Late Minutes:', row.late_minutes);

        if (row.status === 'Present' && row.late_minutes === 15) {
            console.log('✅ TEST PASSED');
        } else {
            console.log('❌ TEST FAILED');
        }

        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

test();
