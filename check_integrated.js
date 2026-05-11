
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, major, sub, title FROM guidelines WHERE sub = '통합 가이드라인' OR title LIKE '%통합요약%'", [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('Found rows:', JSON.stringify(rows, null, 2));
    db.close();
});
