const express = require('express');
const router = express.Router();
const db = require('../db');

// ========== SHIFTS ==========
router.get('/shifts', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shifts ORDER BY name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/shifts', async (req, res) => {
    try {
        const { name, start_time, end_time, shift_type, grace_in_minutes, late_threshold_minutes, break_duration_minutes, is_night_shift } = req.body;
        const result = await db.query(`
            INSERT INTO shifts (name, start_time, end_time, shift_type, grace_in_minutes, late_threshold_minutes, break_duration_minutes, is_night_shift)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [name, start_time, end_time, shift_type || 'Fixed', grace_in_minutes || 0, late_threshold_minutes || 15, break_duration_minutes || 0, is_night_shift || false]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/shifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, start_time, end_time, shift_type, grace_in_minutes, late_threshold_minutes, break_duration_minutes, is_night_shift, is_active } = req.body;
        const result = await db.query(`
            UPDATE shifts SET name=$1, start_time=$2, end_time=$3, shift_type=$4, grace_in_minutes=$5, late_threshold_minutes=$6, break_duration_minutes=$7, is_night_shift=$8, is_active=$9
            WHERE id=$10 RETURNING *
        `, [name, start_time, end_time, shift_type, grace_in_minutes, late_threshold_minutes, break_duration_minutes, is_night_shift, is_active, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/shifts/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM shifts WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== ROSTER ==========
router.get('/roster', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, e.name as employee_name, s.name as shift_name 
            FROM employee_shift_roster r
            JOIN employees e ON r.employee_code = e.employee_code
            JOIN shifts s ON r.shift_id = s.id
            ORDER BY r.effective_from DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/roster', async (req, res) => {
    try {
        const { employee_code, shift_id, effective_from, effective_to } = req.body;
        const result = await db.query(`
            INSERT INTO employee_shift_roster (employee_code, shift_id, effective_from, effective_to)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (employee_code, effective_from) DO UPDATE SET shift_id = EXCLUDED.shift_id, effective_to = EXCLUDED.effective_to
            RETURNING *
        `, [employee_code, shift_id, effective_from, effective_to || null]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== WEEKLY OFF RULES ==========
router.get('/weekly-off-rules', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM weekly_off_rules ORDER BY name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/weekly-off-rules', async (req, res) => {
    try {
        const { name, pattern, description } = req.body;
        const result = await db.query(`INSERT INTO weekly_off_rules (name, pattern, description) VALUES ($1, $2, $3) RETURNING *`, [name, pattern, description]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== HOLIDAYS ==========
router.get('/holidays', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM holidays ORDER BY date');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/holidays', async (req, res) => {
    try {
        const { name, date, location_id, is_optional } = req.body;
        const result = await db.query(`
            INSERT INTO holidays (name, date, location_id, is_optional) VALUES ($1, $2, $3, $4)
            ON CONFLICT (date, location_id) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `, [name, date, location_id || null, is_optional || false]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/holidays/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM holidays WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Holiday Update (PUT)
router.put('/holidays/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, location_id, is_optional } = req.body;
        const result = await db.query(`
            UPDATE holidays SET name=$1, date=$2, location_id=$3, is_optional=$4
            WHERE id=$5 RETURNING *
        `, [name, date, location_id || null, is_optional || false, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Holiday not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== TIMETABLES ==========
router.get('/timetables', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, 
                   (SELECT COUNT(*) FROM break_times bt WHERE bt.timetable_id = t.id) as break_count
            FROM timetables t 
            ORDER BY t.name
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/timetables/:id', async (req, res) => {
    try {
        const timetable = await db.query('SELECT * FROM timetables WHERE id=$1', [req.params.id]);
        if (timetable.rows.length === 0) return res.status(404).json({ error: 'Timetable not found' });

        const breaks = await db.query('SELECT * FROM break_times WHERE timetable_id=$1 ORDER BY start_time', [req.params.id]);
        res.json({ ...timetable.rows[0], breaks: breaks.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/timetables', async (req, res) => {
    try {
        const {
            name, code, check_in, check_out, late_in, early_out, overtime_start,
            min_hours_for_full_day, min_hours_for_half_day, is_overnight, is_flexible,
            grace_period_minutes, color, description
        } = req.body;

        const result = await db.query(`
            INSERT INTO timetables (name, code, check_in, check_out, late_in, early_out, overtime_start,
                min_hours_for_full_day, min_hours_for_half_day, is_overnight, is_flexible, 
                grace_period_minutes, color, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [name, code, check_in, check_out, late_in || null, early_out || null, overtime_start || null,
            min_hours_for_full_day || 8, min_hours_for_half_day || 4, is_overnight || false,
            is_flexible || false, grace_period_minutes || 15, color || '#3B82F6', description || '']);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/timetables/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, code, check_in, check_out, late_in, early_out, overtime_start,
            min_hours_for_full_day, min_hours_for_half_day, is_overnight, is_flexible,
            grace_period_minutes, color, description
        } = req.body;

        const result = await db.query(`
            UPDATE timetables SET name=$1, code=$2, check_in=$3, check_out=$4, late_in=$5, 
                early_out=$6, overtime_start=$7, min_hours_for_full_day=$8, min_hours_for_half_day=$9,
                is_overnight=$10, is_flexible=$11, grace_period_minutes=$12, color=$13, description=$14
            WHERE id=$15 RETURNING *
        `, [name, code, check_in, check_out, late_in, early_out, overtime_start,
            min_hours_for_full_day, min_hours_for_half_day, is_overnight, is_flexible,
            grace_period_minutes, color, description, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Timetable not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/timetables/:id', async (req, res) => {
    try {
        // Delete associated breaks first
        await db.query('DELETE FROM break_times WHERE timetable_id=$1', [req.params.id]);
        await db.query('DELETE FROM timetables WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== BREAK TIMES ==========
router.get('/break-times', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM break_times ORDER BY timetable_id, start_time');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/break-times', async (req, res) => {
    try {
        const { timetable_id, name, start_time, end_time, is_paid } = req.body;
        const result = await db.query(`
            INSERT INTO break_times (timetable_id, name, start_time, end_time, is_paid)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [timetable_id, name, start_time, end_time, is_paid ?? true]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/break-times/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM break_times WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

