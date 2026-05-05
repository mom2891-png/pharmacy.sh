
async function testAuth() {
    console.log('--- Phase 1 Verification Start ---');
    
    // 1. Test without API Key
    try {
        console.log('Test 1: Request without API Key');
        const res = await fetch('http://localhost:3000/api/drugs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drugs: [] })
        });
        console.log('Result:', res.status, await res.json());
    } catch (e) {
        console.error('Test 1 Failed (Network):', e.message);
    }

    // 2. Test with Wrong API Key
    try {
        console.log('\nTest 2: Request with Wrong API Key');
        const res = await fetch('http://localhost:3000/api/drugs', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': 'wrong-pw'
            },
            body: JSON.stringify({ drugs: [] })
        });
        console.log('Result:', res.status, await res.json());
    } catch (e) {
        console.error('Test 2 Failed (Network):', e.message);
    }

    // 3. Test with Correct API Key (3505)
    try {
        console.log('\nTest 3: Request with Correct API Key');
        const res = await fetch('http://localhost:3000/api/guidelines/g6', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': '3505'
            },
            body: JSON.stringify({ title: '고혈압 FACTSHEET' })
        });
        console.log('Result:', res.status, await res.json());
    } catch (e) {
        console.error('Test 3 Failed (Network):', e.message);
    }
}

testAuth();
