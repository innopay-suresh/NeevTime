const express = require('express');
const router = express.Router();
const db = require('../db');

// module.exports = (db) => { <- OLD
// Standard Export
// ============================================
// ============================================
// APPROVAL ROLES API
// ============================================

router.get('/approval/roles', async (req, res) => {
    try {
        const result = await db.query(`
                SELECT r.*,
                    (SELECT COUNT(*) FROM employee_approval_roles ear WHERE ear.role_id = r.id) as employee_count
                FROM approval_roles r
                ORDER BY r.id
            `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        // Return empty array if table doesn't exist yet
        res.json([]);
    }
});

router.post('/approval/roles', async (req, res) => {
    const { role_code, role_name, description } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO approval_roles (role_code, role_name, description) VALUES ($1, $2, $3) RETURNING *`,
            [role_code, role_name, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/approval/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { role_code, role_name, description } = req.body;
    try {
        const result = await db.query(
            `UPDATE approval_roles SET role_code = $1, role_name = $2, description = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
            [role_code, role_name, description, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/approval/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM approval_roles WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// APPROVAL FLOWS API
// ============================================

router.get('/approval/flows', async (req, res) => {
    try {
        const result = await db.query(`
                SELECT f.*, d.name as department_name
                FROM approval_flows f
                LEFT JOIN departments d ON f.department_id = d.id
                ORDER BY f.id
            `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

router.post('/approval/flows', async (req, res) => {
    const { flow_code, name, start_date, end_date, request_type, requester, position_id, department_id, nodes } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO approval_flows (flow_code, name, start_date, end_date, request_type, requester, position_id, department_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [flow_code, name, start_date, end_date, request_type, requester, position_id || null, department_id || null]
        );
        const flowId = result.rows[0].id;

        // Insert flow nodes if provided
        if (nodes && nodes.length > 0) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].node_id) {
                    await db.query(
                        `INSERT INTO flow_nodes (flow_id, node_id, node_order) VALUES ($1, $2, $3)`,
                        [flowId, nodes[i].node_id, i + 1]
                    );
                }
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/approval/flows/:id', async (req, res) => {
    const { id } = req.params;
    const { flow_code, name, start_date, end_date, request_type, requester, position_id, department_id, nodes } = req.body;
    try {
        const result = await db.query(
            `UPDATE approval_flows SET flow_code = $1, name = $2, start_date = $3, end_date = $4, 
                 request_type = $5, requester = $6, position_id = $7, department_id = $8, updated_at = NOW()
                 WHERE id = $9 RETURNING *`,
            [flow_code, name, start_date, end_date, request_type, requester, position_id || null, department_id || null, id]
        );

        // Update flow nodes
        await db.query(`DELETE FROM flow_nodes WHERE flow_id = $1`, [id]);
        if (nodes && nodes.length > 0) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].node_id) {
                    await db.query(
                        `INSERT INTO flow_nodes (flow_id, node_id, node_order) VALUES ($1, $2, $3)`,
                        [id, nodes[i].node_id, i + 1]
                    );
                }
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/approval/flows/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM flow_nodes WHERE flow_id = $1`, [id]);
        await db.query(`DELETE FROM approval_flows WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// APPROVAL NODES API
// ============================================

router.get('/approval/nodes', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM approval_nodes ORDER BY id`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

router.post('/approval/nodes', async (req, res) => {
    const { node_code, node_name, approver_type, approver_id, description } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO approval_nodes (node_code, node_name, approver_type, approver_id, description)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [node_code, node_name, approver_type, approver_id || null, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/approval/nodes/:id', async (req, res) => {
    const { id } = req.params;
    const { node_code, node_name, approver_type, approver_id, description } = req.body;
    try {
        const result = await db.query(
            `UPDATE approval_nodes SET node_code = $1, node_name = $2, approver_type = $3, 
                 approver_id = $4, description = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
            [node_code, node_name, approver_type, approver_id || null, description, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/approval/nodes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM approval_nodes WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
