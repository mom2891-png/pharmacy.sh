const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.cwd(), 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, title, is_old FROM guidelines LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
