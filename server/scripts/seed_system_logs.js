/**
 * Seed System Logs
 * Creates sample system logs for testing the System Logs page
 * Run: node server/scripts/seed_system_logs.js
 */

const db = require('../db');
const { logEvent } = require('../utils/systemLogger');

async function seedLogs() {
    try {
        console.log('Seeding system logs...');

        // Check if system_logs table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'system_logs'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            console.error('system_logs table does not exist. Please run the database schema migration first.');
            process.exit(1);
        }

        // Get a user for logging (or use 'admin' as default)
        let userId = null;
        let username = 'admin';
        try {
            const userResult = await db.query('SELECT id, username FROM users LIMIT 1');
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
                username = userResult.rows[0].username;
            }
        } catch (err) {
            console.warn('Could not fetch user, using default username');
        }

        // Sample logs for the past 7 days
        const now = new Date();
        const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'];
        const entityTypes = ['employee', 'department', 'device', 'user', 'report', 'settings'];

        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 7);
            const hoursAgo = Math.floor(Math.random() * 24);
            const minutesAgo = Math.floor(Math.random() * 60);
            
            const createdAt = new Date(now);
            createdAt.setDate(createdAt.getDate() - daysAgo);
            createdAt.setHours(createdAt.getHours() - hoursAgo);
            createdAt.setMinutes(createdAt.getMinutes() - minutesAgo);

            const action = actions[Math.floor(Math.random() * actions.length)];
            const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
            const entityId = Math.floor(Math.random() * 100) + 1;

            // Insert log directly with custom timestamp
            await db.query(
                `INSERT INTO system_logs 
                (user_id, username, action, entity_type, entity_id, ip_address, user_agent, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userId,
                    username,
                    action,
                    entityType,
                    entityId,
                    `192.168.1.${Math.floor(Math.random() * 255)}`,
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    createdAt
                ]
            );
        }

        console.log('✅ Successfully seeded 50 system logs');
        console.log('   - Random actions: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, EXPORT, IMPORT');
        console.log('   - Random entities: employee, department, device, user, report, settings');
        console.log('   - Time range: Past 7 days');
        console.log('\n📊 View logs at: /system-logs');

    } catch (err) {
        console.error('Error seeding logs:', err);
        process.exit(1);
    } finally {
        await db.pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    seedLogs();
}

module.exports = seedLogs;

