const http = require('http');

console.log('Sending request to /api/db...');
http.get('http://localhost:3000/api/db', (res) => {
    console.log('Response received, status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Response ended. Length:', data.length);
    });
}).on('error', (err) => {
    console.error('Request error:', err.message);
});
