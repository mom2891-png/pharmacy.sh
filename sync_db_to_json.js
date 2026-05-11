
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

async function sync() {
    const guidelines = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM guidelines", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    const drugs = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM drugs", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    // drugs의 items 필드가 JSON 스트링일 수 있으므로 파싱
    const processedDrugs = drugs.map(d => {
        if (typeof d.items === 'string') {
            try {
                d.items = JSON.parse(d.items);
            } catch (e) {
                console.error(`Failed to parse items for drug ${d.id}`);
            }
        }
        return d;
    });

    const data = {
        guidelines: guidelines,
        drugs: processedDrugs
    };

    fs.writeFileSync(path.join(__dirname, 'data', 'db.json'), JSON.stringify(data, null, 2));
    console.log('Successfully synced database to data/db.json');
    db.close();
}

sync().catch(console.error);
