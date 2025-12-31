
async function triggerError() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const loginData = await loginRes.json();

        if (!loginData.token) {
            console.error('Login Failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Got Token:', token.substring(0, 10) + '...');

        // 2. Fetch Employees
        const empRes = await fetch('http://localhost:3001/api/employees', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Fetch Status:', empRes.status);
        const text = await empRes.text();
        console.log('Fetch Body:', text);

    } catch (err) {
        console.error('Script Error:', err.message);
    }
}
triggerError();
