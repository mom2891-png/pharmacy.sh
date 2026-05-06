const http = require('http');

http.get('http://localhost:3000/api/db', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Guidelines:', json.guidelines.length);
            console.log('Drugs:', json.drugs.length);
            console.log('Supplements:', json.supplements.length);
            if (json.drugs.length > 0) {
                console.log('Sample Drug:', JSON.stringify(json.drugs[0], null, 2));
            }
        } catch (e) {
            console.error('Parse error:', e.message);
            console.log('Raw data sample:', data.substring(0, 200));
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err.message);
});
