const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_FILE = path.join(__dirname, '..', 'public', 'data', 'db', 'pharmacy.db');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY, 
    role TEXT DEFAULT 'admin', 
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 초기 관리자 추가
  db.run(`INSERT OR IGNORE INTO admins (email, role) VALUES ('mom2891@gmail.com', 'super')`);
  
  console.log('✅ Admins table created and super admin added.');
});

db.close();
