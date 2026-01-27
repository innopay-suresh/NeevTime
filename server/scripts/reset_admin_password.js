const db = require('../db');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    try {
        console.log('🔄 Resetting admin password...');
        
        // Hash 'admin'
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        // Update user
        const result = await db.query(`
            UPDATE users 
            SET password_hash = $1 
            WHERE username = 'admin'
            RETURNING id, username, role, is_active
        `, [hashedPassword]);

        if (result.rows.length > 0) {
            console.log('✅ Admin password has been reset to: admin');
            console.log('User details:', result.rows[0]);
        } else {
            console.log('❌ Admin user not found! Creating it now...');
            // Create if missing
            await db.query(`
                INSERT INTO users (username, password_hash, role, email, is_active)
                VALUES ('admin', $1, 'admin', 'admin@example.com', true)
            `, [hashedPassword]);
            console.log('✅ Admin user created with password: admin');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting password:', err);
        process.exit(1);
    }
}

resetAdminPassword();
