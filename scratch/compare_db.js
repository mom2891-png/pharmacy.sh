
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path relative to the script location
const DB_FILE = path.join(process.cwd(), 'public', 'data', 'db', 'pharmacy.db');
console.log('Opening DB:', DB_FILE);

const db = new sqlite3.Database(DB_FILE);

function dbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function check() {
    try {
        const guidelines = await dbQuery("SELECT COUNT(*) as count FROM guidelines");
        const drugs = await dbQuery("SELECT COUNT(*) as count FROM drugs");
        const items = await dbQuery("SELECT COUNT(*) as count FROM drug_items");
        
        console.log('DB Counts:', {
            guidelines: guidelines[0].count,
            drugs: drugs[0].count,
            items: items[0].count
        });

        const sampleGuideline = await dbQuery("SELECT id, title FROM guidelines LIMIT 1");
        console.log('DB Sample Guideline:', sampleGuideline[0]);

        const sampleDrug = await dbQuery("SELECT id, major, minor, sub FROM drugs LIMIT 1");
        console.log('DB Sample Drug:', sampleDrug[0]);
    } catch (e) {
        console.error(e);
    } finally {
        db.close();
    }
}

check();
