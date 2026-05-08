const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
admin.initializeApp({
  projectId: "pharmacy-info-portal"
});

const app = express();
const port = 3000;
const rootDir = process.cwd();

// 캐시 제어 미들웨어
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 요청 로거
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const ADMIN_PASSWORD = '3505';

async function authMiddleware(req, res, next) {
  const idToken = req.headers['x-api-key'];
  if (!idToken) return res.status(401).json({ error: '인증 토큰이 누락되었습니다.' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;
    const adminUser = await dbGet("SELECT * FROM admins WHERE email = ?", [userEmail]);
    if (!adminUser) {
      console.warn(`🚨 권한 없는 사용자 접근 시도: ${userEmail}`);
      return res.status(403).json({ error: '관리자 권한이 없는 계정입니다.' });
    }
    req.user = { ...decodedToken, role: adminUser.role };
    next();
  } catch (error) {
    console.warn(`🚨 유효하지 않은 토큰 접근 시도: ${req.method} ${req.url}`, error.message);
    res.status(403).json({ error: '유효하지 않은 인증 토큰입니다.' });
  }
}

app.get('/api/auth-status', authMiddleware, (req, res) => {
  res.json({ isAdmin: true, role: req.user.role, email: req.user.email });
});

const DB_FILE = path.join(__dirname, 'database', 'pharmacy.db');
const db = new sqlite3.Database(DB_FILE);

function dbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err); else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS category_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, major TEXT, sub TEXT, summary TEXT, UNIQUE(major, sub))`);
  db.run("ALTER TABLE guidelines ADD COLUMN is_checked INTEGER DEFAULT 0", (err) => {});
});

async function getFullDb() {
  console.log('📦 getFullDb: Fetching all tables...');
  const start = Date.now();
  const guidelinesRaw = await dbQuery("SELECT * FROM guidelines");
  const drugsRows = await dbQuery("SELECT * FROM drugs");
  const itemsRows = await dbQuery("SELECT * FROM drug_items");
  const supplements = await dbQuery("SELECT * FROM supplements");
  const categoryMetadata = await dbQuery("SELECT * FROM category_metadata");

  const guidelines = guidelinesRaw.map(g => {
    let url = g.url;
    if (url && (url.startsWith('[') || url.startsWith('{'))) {
      try { url = JSON.parse(url); } catch (e) {}
    }
    let aiSummary = g.aiSummary;
    if (aiSummary && (aiSummary.startsWith('{'))) {
      try { aiSummary = JSON.parse(aiSummary); } catch (e) {}
    }
    return { ...g, url, aiSummary };
  });

  const drugs = drugsRows.map(d => ({
    ...d,
    items: itemsRows.filter(item => item.drug_id === d.id)
  }));

  console.log(`✅ getFullDb completed in ${Date.now() - start}ms`);
  return { guidelines, drugs, supplements, categoryMetadata };
}

async function sanitizeDrugs() {
  try {
    const drugs = await dbQuery("SELECT * FROM drugs");
    let changedCount = 0;
    for (const d of drugs) {
      let changed = false;
      const updates = {};
      ['major', 'minor', 'sub'].forEach(field => {
        if (d[field] && typeof d[field] === 'string') {
          const cleaned = d[field].replace(/\n/g, '').trim();
          if (cleaned !== d[field]) { updates[field] = cleaned; changed = true; }
        }
      });
      if (changed) {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(d.id);
        await dbRun(`UPDATE drugs SET ${setClause} WHERE id = ?`, values);
        changedCount++;
      }
    }
    if (changedCount > 0) console.log(`🧹 SQLite drugs 테이블 정리 완료 (${changedCount}건 수정)`);
  } catch (err) { console.error('sanitizeDrugs error:', err); }
}

console.log('🚀 Starting sanitizeDrugs...');
sanitizeDrugs().then(() => console.log('✅ sanitizeDrugs finished')).catch(err => console.error('❌ sanitizeDrugs failed:', err));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Hide paths from Vercel's static analyzer to prevent bundling huge directories
    const baseDir = process.cwd();
    let dir = (file.fieldname === 'drugImage' || file.fieldname === 'drugFile') 
      ? path.join(baseDir, 'drugs', 'images') 
      : path.join(baseDir, 'guidelines', 'documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.get('/api/db', async (req, res) => {
  try {
    const fullDb = await getFullDb();
    res.json(fullDb);
  } catch (err) {
    res.status(500).json({ error: 'DB 로드 실패: ' + err.message });
  }
});

app.get('/api/guidelines', async (req, res) => {
  try {
    const guidelines = await dbQuery("SELECT * FROM guidelines");
    res.json(guidelines);
  } catch (err) {
    res.status(500).json({ error: 'DB 조회 실패: ' + err.message });
  }
});

app.post('/api/category-metadata', authMiddleware, async (req, res) => {
  try {
    const { major, sub, summary } = req.body;
    if (!major || !sub) return res.status(400).json({ error: 'Major and Sub category names are required.' });
    const result = await dbRun(`INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = excluded.summary`, [major, sub, summary || '']);
    res.json({ success: true, id: result.id, changes: result.changes });
  } catch (err) { res.status(500).json({ error: '데이터 저장 실패: ' + err.message }); }
});

app.post('/api/upload', authMiddleware, upload.single('guidelineFile'), async (req, res) => {
  const guidelineId = req.body.guidelineId;
  if (!req.file || !guidelineId) return res.status(400).json({ error: '가이드라인 ID와 파일이 모두 필요합니다.' });
  const newFilePath = `guidelines/documents/${req.file.originalname}`;
  try {
    const result = await dbRun("UPDATE guidelines SET url = ? WHERE id = ?", [newFilePath, guidelineId]);
    if (result.changes === 0) return res.status(404).json({ error: `ID가 ${guidelineId}인 항목을 찾을 수 없습니다.` });
    res.json({ success: true, message: '업로드 완료', filePath: newFilePath });
  } catch (error) { res.status(500).json({ error: 'DB 업데이트 실패: ' + error.message }); }
});

app.put('/api/guidelines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, year, publisher } = req.body;
  try {
    const desc = `${publisher || ''} / ${year || ''}년 가이드라인`;
    const result = await dbRun("UPDATE guidelines SET title = COALESCE(?, title), year = COALESCE(?, year), publisher = COALESCE(?, publisher), desc = ? WHERE id = ?", [title, year, publisher, desc, id]);
    res.json({ success: true, message: '수정 완료' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/guidelines/:id/check', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_checked } = req.body;
  try {
    const result = await dbRun("UPDATE guidelines SET is_checked = ? WHERE id = ?", [is_checked ? 1 : 0, id]);
    res.json({ success: true, is_checked: !!is_checked });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/guidelines/:id/ai-summary', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { aiSummary } = req.body;
  try {
    const aiSummaryValue = (typeof aiSummary === 'string') ? aiSummary : JSON.stringify(aiSummary);
    await dbRun("UPDATE guidelines SET aiSummary = ? WHERE id = ?", [aiSummaryValue, id]);
    const summaryDir = path.join(process.cwd(), 'guidelines', 'summaries');
    if (!fs.existsSync(summaryDir)) fs.mkdirSync(summaryDir, { recursive: true });
    fs.writeFileSync(path.join(summaryDir, `${id}.md`), aiSummaryValue, 'utf8');
    res.json({ success: true, message: '저장 완료' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/guidelines', authMiddleware, upload.single('guidelineFile'), async (req, res) => {
  const { title, year, publisher, major, sub } = req.body;
  try {
    const rows = await dbQuery("SELECT id FROM guidelines");
    const maxId = rows.reduce((max, g) => {
      const num = parseInt(g.id.replace('g', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newId = `g${maxId + 1}`;
    const newFilePath = req.file ? `guidelines/documents/${req.file.originalname}` : '';
    const desc = `${publisher || ''} / ${year || ''}년 가이드라인`;
    await dbRun("INSERT INTO guidelines (id, major, sub, title, year, publisher, date, url, desc, category) VALUES (?,?,?,?,?,?,?,?,?,?)", [newId, major, sub, title, year || '', publisher || '', year ? `${year}-01-01` : '', newFilePath, desc, `${major} - ${sub}`]);
    res.json({ success: true, guidelineId: newId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/guidelines/:id', authMiddleware, async (req, res) => {
  try {
    await dbRun("DELETE FROM guidelines WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/drugs', authMiddleware, async (req, res) => {
  const newDrugs = req.body.drugs;
  try {
    await dbRun("BEGIN TRANSACTION");
    await dbRun("DELETE FROM drug_items");
    await dbRun("DELETE FROM drugs");
    for (const d of newDrugs) {
      await dbRun("INSERT INTO drugs (id, major, minor, sub) VALUES (?,?,?,?)", [d.id, d.major, d.minor, d.sub]);
      for (const item of (d.items || [])) {
        await dbRun("INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)", [d.id, item.ingredient, item.reference, item.image, item.desc || '', item.usage || '', item.caution || '']);
      }
    }
    await dbRun("COMMIT");
    res.json({ success: true });
  } catch (error) { await dbRun("ROLLBACK").catch(() => {}); res.status(500).json({ error: error.message }); }
});

app.patch('/api/drugs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { major, minor, sub, items } = req.body;
  try {
    await dbRun("BEGIN TRANSACTION");
    await dbRun("UPDATE drugs SET major = COALESCE(?, major), minor = COALESCE(?, minor), sub = COALESCE(?, sub) WHERE id = ?", [major, minor, sub, id]);
    if (items) {
      await dbRun("DELETE FROM drug_items WHERE drug_id = ?", [id]);
      for (const item of items) {
        await dbRun("INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)", [id, item.ingredient, item.reference, item.image || '', item.desc || '', item.usage || '', item.caution || '']);
      }
    }
    await dbRun("COMMIT");
    res.json({ success: true });
  } catch (error) { await dbRun("ROLLBACK").catch(() => {}); res.status(500).json({ error: error.message }); }
});

app.post('/api/upload-drug-image', authMiddleware, upload.single('drugImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  res.json({ success: true, filePath: `drugs/images/${req.file.filename}`, filename: req.file.filename });
});

app.post('/api/drugs/import', authMiddleware, upload.single('drugFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  try {
    const workbook = XLSX.readFile(req.file.path);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const groups = {};
    let lastMajor = "", lastMinor = "", lastSub = "";
    rows.forEach(row => {
      let major = (row['분류1'] || row['Major'] || '').toString().trim() || lastMajor;
      let minor = (row['분류2'] || row['Minor'] || '').toString().trim() || lastMinor;
      let sub = (row['분류3(기전)'] || row['Sub'] || '').toString().trim() || lastSub;
      const ingredient = (row['성분명'] || row['Ingredient'] || '').toString().trim();
      const reference = (row['상품명'] || row['Reference'] || '').toString().trim();
      lastMajor = major; lastMinor = minor; lastSub = sub;
      if (!major || !ingredient) return;
      const key = `${major}|${minor}|${sub}`;
      if (!groups[key]) groups[key] = { major, minor, sub, items: [] };
      groups[key].items.push({ ingredient, reference });
    });
    await dbRun("BEGIN TRANSACTION");
    await dbRun("DELETE FROM drug_items");
    await dbRun("DELETE FROM drugs");
    let count = 1;
    for (const key in groups) {
      const { major, minor, sub, items } = groups[key];
      const drugId = `drug_imported_${count++}`;
      await dbRun("INSERT INTO drugs (id, major, minor, sub) VALUES (?,?,?,?)", [drugId, major, minor, sub]);
      for (const item of items) {
        await dbRun("INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)", [drugId, item.ingredient, item.reference, '', '', '', '']);
      }
    }
    await dbRun("COMMIT");
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, message: '임포트 완료' });
  } catch (error) { if (req.file) fs.unlinkSync(req.file.path); res.status(500).json({ error: error.message }); }
});

app.get('/api/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await dbQuery("SELECT * FROM admins ORDER BY added_at DESC");
    res.json(admins);
  } catch (error) { res.status(500).json({ error: '실패' }); }
});

app.post('/api/admins', authMiddleware, async (req, res) => {
  try {
    await dbRun("INSERT OR REPLACE INTO admins (email, role) VALUES (?, ?)", [req.body.email, req.body.role || 'admin']);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: '실패' }); }
});

app.delete('/api/admins/:email', authMiddleware, async (req, res) => {
  if (req.params.email === 'mom2891@gmail.com') return res.status(400).json({ error: '삭제 불가' });
  try {
    await dbRun("DELETE FROM admins WHERE email = ?", [req.params.email]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: '실패' }); }
});

app.get('/admin', (req, res) => {
  try {
    res.send(fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8'));
  } catch (e) { res.status(500).send('Error: ' + e.message); }
});

app.use(express.static(rootDir));
app.use((req, res) => res.status(404).json({ success: false, error: 'ANTIGRAVITY_404_NOT_FOUND' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ success: false, error: err.message }));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
