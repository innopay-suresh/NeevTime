const db = require('../db');

async function resetCommands() {
    try {
        await db.query("DELETE FROM device_commands WHERE status = 'pending'");
        console.log('Cleared pending commands.');

        await db.query("DELETE FROM biometric_templates");
        console.log('Cleared biometric templates.');

        process.exit(0);
    } catch (err) {
        console.error('Error resetting:', err);
        process.exit(1);
    }
}

resetCommands();
