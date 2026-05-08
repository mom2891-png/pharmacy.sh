const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(DB_FILE);

db.all("SELECT id, major, sub, title FROM guidelines WHERE title LIKE '%지방간%' OR sub LIKE '%지방간%'", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
