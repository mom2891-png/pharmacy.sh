const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../public/data/db/pharmacy.db');
const JSON_DIR = path.join(__dirname, '../public/data/db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // 1. 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS guidelines (
    id TEXT PRIMARY KEY,
    major TEXT,
    sub TEXT,
    title TEXT,
    year TEXT,
    pages TEXT,
    publisher TEXT,
    date TEXT,
    url TEXT,
    desc TEXT,
    category TEXT,
    aiSummary TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS drugs (
    id TEXT PRIMARY KEY,
    major TEXT,
    minor TEXT,
    sub TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS drug_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_id TEXT,
    ingredient TEXT,
    reference TEXT,
    image TEXT,
    desc TEXT,
    usage TEXT,
    caution TEXT,
    FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS supplements (
    id TEXT PRIMARY KEY,
    name TEXT,
    target TEXT,
    components TEXT,
    tip TEXT
  )`);

  console.log('✅ Tables created.');

  // 2. 가이드라인 데이터 이관
  const guidelines = JSON.parse(fs.readFileSync(path.join(JSON_DIR, 'guidelines.json'), 'utf8'));
  const stmtG = db.prepare(`INSERT OR REPLACE INTO guidelines VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  guidelines.forEach(g => {
    const urlStr = typeof g.url === 'string' ? g.url : JSON.stringify(g.url);
    const aiSummaryStr = g.aiSummary ? JSON.stringify(g.aiSummary) : null;
    stmtG.run(g.id, g.major, g.sub, g.title, g.year, g.pages, g.publisher, g.date, urlStr, g.desc, g.category, aiSummaryStr);
  });
  stmtG.finalize();
  console.log(`✅ ${guidelines.length} guidelines migrated.`);

  // 3. 약물 데이터 이관
  const drugs = JSON.parse(fs.readFileSync(path.join(JSON_DIR, 'drugs.json'), 'utf8'));
  const stmtD = db.prepare(`INSERT OR REPLACE INTO drugs VALUES (?,?,?,?)`);
  const stmtDI = db.prepare(`INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)`);
  
  drugs.forEach(d => {
    stmtD.run(d.id, d.major, d.minor, d.sub);
    if (d.items && Array.isArray(d.items)) {
      d.items.forEach(item => {
        stmtDI.run(d.id, item.ingredient, item.reference, item.image, item.desc || '', item.usage || '', item.caution || '');
      });
    }
  });
  stmtD.finalize();
  stmtDI.finalize();
  console.log(`✅ ${drugs.length} drug categories and their items migrated.`);

  // 4. 건기식 데이터 이관
  const supplements = JSON.parse(fs.readFileSync(path.join(JSON_DIR, 'supplements.json'), 'utf8'));
  const stmtS = db.prepare(`INSERT OR REPLACE INTO supplements VALUES (?,?,?,?,?)`);
  supplements.forEach(s => {
    stmtS.run(s.id, s.name, s.target, s.components, s.tip);
  });
  stmtS.finalize();
  console.log(`✅ ${supplements.length} supplements migrated.`);
});

db.close((err) => {
  if (err) console.error(err.message);
  console.log('🔒 Database connection closed.');
});
