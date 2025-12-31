/**
 * System Logs Routes
 * Endpoint for retrieving system audit logs
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/system-logs
 * Get system logs with optional filters
 * Query params: limit, user_id, action, entity_type, dateFrom, dateTo
 */
router.get('/', async (req, res) => {
    try {
        const { 
            limit = 100, 
            user_id, 
            action, 
            entity_type,
            dateFrom,
            dateTo
        } = req.query;

        let query = `
            SELECT 
                id,
                user_id,
                username,
                action,
                entity_type,
                entity_id,
                old_values,
                new_values,
                ip_address,
                user_agent,
                created_at
            FROM system_logs 
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (user_id) {
            paramCount++;
            params.push(user_id);
            query += ` AND user_id = $${paramCount}`;
        }

        if (action) {
            paramCount++;
            params.push(action);
            query += ` AND action = $${paramCount}`;
        }

        if (entity_type) {
            paramCount++;
            params.push(entity_type);
            query += ` AND entity_type = $${paramCount}`;
        }

        if (dateFrom) {
            paramCount++;
            params.push(dateFrom);
            query += ` AND DATE(created_at) >= $${paramCount}`;
        }

        if (dateTo) {
            paramCount++;
            params.push(dateTo);
            query += ` AND DATE(created_at) <= $${paramCount}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
        params.push(parseInt(limit));

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching system logs:', err);
        
        // If table doesn't exist, return empty array instead of error
        if (err.message.includes('does not exist') || err.message.includes('relation')) {
            return res.json([]);
        }
        
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

