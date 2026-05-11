const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(process.cwd(), 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(DB_FILE);

db.all("SELECT * FROM guidelines WHERE id='g10' OR id='g252'", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
