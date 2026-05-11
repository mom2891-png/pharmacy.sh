const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'backend', 'database', 'pharmacy.db'));

db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) { console.error(err); return; }
  rows.forEach(r => console.log(r.name + ':\n' + r.sql + '\n'));
  
  db.get("SELECT * FROM guidelines LIMIT 1", (err2, row) => {
    if (err2) console.error(err2);
    else console.log('\nSample guideline record:\n', JSON.stringify(row, null, 2));
    
    db.get("SELECT COUNT(*) as total FROM guidelines", (err3, count) => {
      console.log('\nTotal guidelines:', count?.total);
      
      db.get("SELECT COUNT(*) as total FROM guidelines WHERE is_deleted = 0", (err4, active) => {
        console.log('Active guidelines:', active?.total);
        
        // Get distinct categories
        db.all("SELECT DISTINCT major FROM guidelines WHERE is_deleted = 0 ORDER BY major", (err5, majors) => {
          console.log('\nDistinct major categories:', majors?.map(m => m.major).join(', '));
          db.close();
        });
      });
    });
  });
});
