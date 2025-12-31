const db = require('../db');

/**
 * Attendance Processing Engine
 * Core logic to calculate daily attendance based on raw logs and shift rules.
 */
class AttendanceEngine {

    async processDateRange(startDate, endDate, employeeId = null) {
        // Build employee filter
        let empQuery = 'SELECT employee_code FROM employees';
        let params = [];
        if (employeeId) {
            empQuery += ' WHERE id = $1';
            params.push(employeeId);
        }

        const employees = await db.query(empQuery, params);

        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        let results = [];

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            console.log(`Processing ${dateStr}...`);

            for (const emp of employees.rows) {
                const res = await this.processDailyAttendance(emp.employee_code, dateStr);
                results.push(res);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return results;
    }

    async processDailyAttendance(employeeCode, date) {
        // 1. Fetch Logs for the day
        // Note: For night shifts this needs to look ahead, but for MVP assuming same-day shifts
        const logsResult = await db.query(`
            SELECT punch_time 
            FROM attendance_logs 
            WHERE employee_code = $1 
            AND DATE(punch_time) = $2
            ORDER BY punch_time ASC
        `, [employeeCode, date]);

        const logs = logsResult.rows;

        // 2. Determine IN and OUT
        let inTime = null;
        let outTime = null;
        let status = 'Absent';
        let durationMinutes = 0;

        if (logs.length > 0) {
            inTime = logs[0].punch_time;
            outTime = logs[logs.length - 1].punch_time;

            // If only one punch, treat as missing out punch? or just check in
            if (logs.length === 1) {
                outTime = null; // Open entry
                status = 'Miss Punch';
            } else {
                status = 'Present';
                durationMinutes = (new Date(outTime) - new Date(inTime)) / (1000 * 60);
            }
        }

        // 3. Apply Shift Rules (Mocking Default Shift 09:00 - 18:00 for now)
        // In real version, fetch actual shift from employee_shifts table
        const shiftStart = `${date} 09:00:00`;
        const shiftEnd = `${date} 18:00:00`;

        let lateMinutes = 0;
        let earlyMinutes = 0;

        if (inTime) {
            const entry = new Date(inTime);
            const start = new Date(shiftStart);
            if (entry > start) {
                lateMinutes = Math.floor((entry - start) / (1000 * 60));
            }
        }

        // 4. Save to Summary
        // Upsert logic
        await db.query(`
            INSERT INTO attendance_daily_summary 
            (employee_code, date, in_time, out_time, duration_minutes, late_minutes, status, last_calculated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (employee_code, date) DO UPDATE 
            SET in_time = EXCLUDED.in_time,
                out_time = EXCLUDED.out_time,
                duration_minutes = EXCLUDED.duration_minutes,
                late_minutes = EXCLUDED.late_minutes,
                status = EXCLUDED.status,
                last_calculated_at = NOW()
        `, [employeeCode, date, inTime, outTime, Math.floor(durationMinutes), lateMinutes, status]);

        return { employeeCode, date, status, lateMinutes };
    }
}

module.exports = new AttendanceEngine();
