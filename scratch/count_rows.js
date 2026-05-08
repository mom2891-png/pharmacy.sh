const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

const tables = ['guidelines', 'drugs', 'drug_items', 'supplements', 'category_metadata', 'admins'];

db.serialize(() => {
  tables.forEach(table => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
      if (err) {
        console.error(`Error counting ${table}:`, err.message);
      } else {
        console.log(`${table}: ${row.count} rows`);
      }
    });
  });
  db.close();
});
