const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const INTEGRATED_FILE = path.join(__dirname, '..', 'guidelines', 'summaries', 'categories', '호흡기질환_1._천식.md');

const db = new sqlite3.Database(DB_FILE);

const content = fs.readFileSync(INTEGRATED_FILE, 'utf8');

db.run(`INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) 
        ON CONFLICT(major, sub) DO UPDATE SET summary = excluded.summary`, 
        ["호흡기질환", "9. 천식", content], function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`✅ Integrated summary for '호흡기질환 - 9. 천식' updated in DB. (Changes: ${this.changes})`);
  db.close();
});
