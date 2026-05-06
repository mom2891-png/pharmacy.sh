
async function testPatch() {
    console.log('--- Phase 2 Verification Start ---');
    const API_KEY = '3505';
    const TARGET_ID = 'drug_v4_1'; 

    try {
        const res = await fetch(`http://localhost:3000/api/drugs/${TARGET_ID}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({
                minor: '고혈압 치료제',
                items: [
                    { ingredient: 'Ramipril', reference: 'Altace', desc: 'Updated via PATCH' }
                ]
            })
        });
        
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body:', text);
    } catch (e) {
        console.error('Verification Failed:', e.message);
    }
}

testPatch();
