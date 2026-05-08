const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/database/pharmacy.db');

db.all("SELECT id, major, sub, title, year FROM guidelines WHERE sub LIKE '%기침%' OR sub LIKE '%폐렴%' OR sub LIKE '%결핵%' OR sub LIKE '%인플루엔자%' OR sub LIKE '%말라리아%'", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
