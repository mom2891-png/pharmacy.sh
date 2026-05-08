const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', 'guidelines', 'legacy', 'medical_classification.csv');
const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');

const db = new sqlite3.Database(DB_FILE);

function parseCsv(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const header = lines[0].split(',');
    return lines.slice(1).filter(l => l.trim()).map(line => {
        // Simple CSV parser for quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += line[i];
            }
        }
        parts.push(current.trim());
        return {
            dept: parts[0],
            category: parts[1] || parts[0],
            disease: parts[2]
        };
    });
}

db.all("SELECT id, major, sub, title FROM guidelines", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    const csvData = parseCsv(CSV_FILE);
    const dbData = rows;

    console.log('--- Audit Results ---');
    const missing = [];

    csvData.forEach(item => {
        const found = dbData.find(d => 
            (d.major === item.category || d.major === item.dept) && 
            (d.sub && d.sub.includes(item.disease))
        );
        if (!found && item.disease) {
            missing.push(item);
        }
    });

    console.log(`Total missing diseases in DB: ${missing.length}`);
    console.log(JSON.stringify(missing, null, 2));

    db.close();
});
