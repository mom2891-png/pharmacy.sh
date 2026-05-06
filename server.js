const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
// 서비스 계정 키 파일이 있다면 path를 지정하고, 없다면 기본 설정을 사용합니다.
admin.initializeApp({
  projectId: "pharmacy-info-portal"
});

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' })); // JSON body parsing
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 요청 로거 (디버깅용)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────────────────────
// 보안 설정 (Authentication)
// ─────────────────────────────────────────────
const ADMIN_PASSWORD = '3505';

/**
 * API Key 인증 미들웨어
 */
/**
 * Firebase ID 토큰 인증 미들웨어
 */
async function authMiddleware(req, res, next) {
  const idToken = req.headers['x-api-key'];
  
  if (!idToken) {
    return res.status(401).json({ error: '인증 토큰이 누락되었습니다.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    // DB에서 관리자 권한 확인
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

/**
 * GET /api/auth-status
 * 현재 로그인한 사용자의 권한 정보를 반환합니다.
 */
app.get('/api/auth-status', authMiddleware, (req, res) => {
  res.json({ isAdmin: true, role: req.user.role, email: req.user.email });
});

// ─────────────────────────────────────────────
// SQLite DB 초기화 및 유틸리티
// ─────────────────────────────────────────────

const DB_FILE = path.join(__dirname, 'public', 'data', 'db', 'pharmacy.db');
const db = new sqlite3.Database(DB_FILE);

/**
 * DB 쿼리 실행 (Promise 래퍼)
 */
function dbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// 테이블 초기화
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS category_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    major TEXT,
    sub TEXT,
    summary TEXT,
    UNIQUE(major, sub)
  )`);

  // guidelines 테이블에 is_checked 컬럼 추가 (기존 데이터 보존을 위해 ALTER 사용)
  db.run("ALTER TABLE guidelines ADD COLUMN is_checked INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.log("ℹ️ guidelines table is_checked column check done.");
    }
  });
});

/**
 * 전체 DB 객체를 반환합니다. (호환성 및 초기 로드용)
 */
async function getFullDb() {
  const guidelinesRaw = await dbQuery("SELECT * FROM guidelines");
  const drugsRows = await dbQuery("SELECT * FROM drugs");
  const itemsRows = await dbQuery("SELECT * FROM drug_items");
  const supplements = await dbQuery("SELECT * FROM supplements");
  const categoryMetadata = await dbQuery("SELECT * FROM category_metadata");

  // 가이드라인 데이터 정제 (JSON 파싱)
  const guidelines = guidelinesRaw.map(g => {
    let url = g.url;
    if (url && (url.startsWith('[') || url.startsWith('{'))) {
      try { url = JSON.parse(url); } catch (e) { /* ignore */ }
    }
    
    let aiSummary = g.aiSummary;
    if (aiSummary && (aiSummary.startsWith('{'))) {
      try { aiSummary = JSON.parse(aiSummary); } catch (e) { /* ignore */ }
    }

    return { ...g, url, aiSummary };
  });

  // 약물 데이터 구조 재조합 (Category + Items)
  const drugs = drugsRows.map(d => ({
    ...d,
    items: itemsRows.filter(item => item.drug_id === d.id)
  }));

  return { guidelines, drugs, supplements, categoryMetadata };
}

/**
 * drugs 데이터의 minor/sub/major 필드에서 개행문자(\n)와 앞뒤 공백을 제거합니다.
 * PDF 파싱 과정에서 유입된 불필요한 문자를 정리합니다.
 */
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
          if (cleaned !== d[field]) {
            updates[field] = cleaned;
            changed = true;
          }
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
    
    if (changedCount > 0) {
      console.log(`🧹 SQLite drugs 테이블 정리 완료 (${changedCount}건 수정)`);
    }
  } catch (err) {
    console.error('sanitizeDrugs error:', err);
  }
}

// 서버 시작 시 데이터 정리 실행
sanitizeDrugs();

// ─────────────────────────────────────────────
// 파일 업로드 설정
// ─────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'data', 'guidelines');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// ─────────────────────────────────────────────
// API 엔드포인트
// ─────────────────────────────────────────────

app.get('/api/db', async (req, res) => {
  try {
    const fullDb = await getFullDb();
    res.json(fullDb);
  } catch (err) {
    res.status(500).json({ error: 'DB 로드 실패: ' + err.message });
  }
});

/**
 * GET /api/guidelines
 * 전체 가이드라인 목록을 반환합니다.
 */
app.get('/api/guidelines', async (req, res) => {
  try {
    const guidelines = await dbQuery("SELECT * FROM guidelines");
    res.json(guidelines);
  } catch (err) {
    console.error('Error reading guidelines:', err);
    res.status(500).json({ error: 'DB 조회 실패: ' + err.message });
  }
});

/**
 * POST /api/category-metadata
 * 특정 카테고리(질환)의 통합 요약 정보를 저장합니다.
 */
app.post('/api/category-metadata', authMiddleware, async (req, res) => {
  try {
    const { major, sub, summary } = req.body;
    if (!major || !sub) {
      return res.status(400).json({ 
        success: false,
        error: 'Major and Sub category names are required.' 
      });
    }

    // 마크다운 등 긴 텍스트가 포함된 summary를 안전하게 저장
    const result = await dbRun(`
      INSERT INTO category_metadata (major, sub, summary) 
      VALUES (?, ?, ?)
      ON CONFLICT(major, sub) DO UPDATE SET summary = excluded.summary
    `, [major, sub, summary || '']);

    res.json({ 
      success: true, 
      id: result.id, 
      changes: result.changes 
    });
  } catch (err) {
    console.error('Error saving category metadata:', err);
    res.status(500).json({ 
      success: false,
      error: '데이터 저장 실패: ' + err.message 
    });
  }
});

app.post('/api/upload', authMiddleware, upload.single('guidelineFile'), async (req, res) => {
  const guidelineId = req.body.guidelineId;
  
  if (!req.file || !guidelineId) {
    return res.status(400).json({ error: '가이드라인 ID와 파일이 모두 필요합니다.' });
  }

  const newFilePath = `assets/data/guidelines/${req.file.originalname}`;
  
  try {
    const result = await dbRun("UPDATE guidelines SET url = ? WHERE id = ?", [newFilePath, guidelineId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: `ID가 ${guidelineId}인 항목을 찾을 수 없습니다.` });
    }

    console.log(`✅ Updated: ${guidelineId} → ${newFilePath}`);

    return res.json({ 
      success: true, 
      message: '업로드 및 업데이트가 완료되었습니다.', 
      filePath: newFilePath
    });
  } catch (error) {
    console.error('Error updating guidelines:', error);
    return res.status(500).json({ error: 'DB 업데이트 중 오류 발생: ' + error.message });
  }
});

/**
 * PUT /api/guidelines/:id
 * 가이드라인 메타데이터(제목, 연도, 발행기관)를 수정합니다.
 */
app.put('/api/guidelines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, year, publisher } = req.body;

  try {
    const desc = `${publisher || ''} / ${year || ''}년 가이드라인`;
    const result = await dbRun(
      "UPDATE guidelines SET title = COALESCE(?, title), year = COALESCE(?, year), publisher = COALESCE(?, publisher), desc = ? WHERE id = ?",
      [title, year, publisher, desc, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: `ID가 ${id}인 가이드라인을 찾을 수 없습니다.` });
    }

    console.log(`✅ Metadata updated: ${id}`);

    return res.json({
      success: true,
      message: '메타데이터가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return res.status(500).json({ error: '메타데이터 수정 중 오류 발생: ' + error.message });
  }
});

/**
 * PUT /api/guidelines/:id/check
 * 가이드라인의 완료 체크 상태를 업데이트합니다.
 */
app.put('/api/guidelines/:id/check', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_checked } = req.body;

  console.log(`[API] Toggle Check Status for ID: ${id} to ${is_checked}`);

  try {
    const checkedVal = is_checked ? 1 : 0;
    const result = await dbRun(
      "UPDATE guidelines SET is_checked = ? WHERE id = ?",
      [checkedVal, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '가이드라인을 찾을 수 없습니다.' });
    }

    res.json({ success: true, is_checked: !!checkedVal });
  } catch (error) {
    console.error('❌ [API] Error updating check status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/guidelines/:id/ai-summary
 * 가이드라인의 AI 요약 정보(문자열 또는 JSON)를 업데이트합니다.
 */
app.put('/api/guidelines/:id/ai-summary', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { aiSummary } = req.body;

  console.log(`[API] AI Summary Update Request for ID: ${id}`);
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Guideline ID is required.' });
  }

  try {
    // 데이터가 객체라면 문자열화, 문자열이라면 그대로 사용
    const aiSummaryValue = (typeof aiSummary === 'string') ? aiSummary : JSON.stringify(aiSummary);
    
    // 1. DB 업데이트
    const result = await dbRun(
      "UPDATE guidelines SET aiSummary = ? WHERE id = ?",
      [aiSummaryValue, id]
    );

    if (result.changes === 0) {
      console.warn(`[API] Guideline not found: ${id}`);
      return res.status(404).json({ success: false, error: `ID가 ${id}인 가이드라인을 찾을 수 없습니다.` });
    }

    // 2. 물리적 MD 파일로 저장 (상호 동기화)
    const summaryDir = path.join(__dirname, 'assets', 'data', 'summaries');
    if (!fs.existsSync(summaryDir)) {
      fs.mkdirSync(summaryDir, { recursive: true });
    }
    
    const filePath = path.join(summaryDir, `${id}.md`);
    fs.writeFileSync(filePath, aiSummaryValue, 'utf8');

    console.log(`✨ [API] AI Summary updated & File saved: ${id}.md`);

    return res.json({
      success: true,
      message: 'AI 요약 및 마크다운 파일이 성공적으로 저장되었습니다.',
      filePath: `assets/data/summaries/${id}.md`
    });
  } catch (error) {
    console.error('❌ [API] Error updating AI summary:', error);
    return res.status(500).json({ 
      success: false,
      error: 'AI 요약 서버 저장 오류: ' + error.message 
    });
  }
});

/**
 * POST /api/guidelines
 * 새로운 가이드라인을 추가합니다.
 */
app.post('/api/guidelines', authMiddleware, upload.single('guidelineFile'), async (req, res) => {
  const { title, year, publisher, major, sub } = req.body;

  if (!title || !major || !sub) {
    return res.status(400).json({ error: '제목, 대분류, 중분류는 필수 항목입니다.' });
  }

  try {
    // 새 ID 생성
    const rows = await dbQuery("SELECT id FROM guidelines");
    const maxId = rows.reduce((max, g) => {
      const num = parseInt(g.id.replace('g', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newId = `g${maxId + 1}`;

    const newFilePath = req.file ? `assets/data/guidelines/${req.file.originalname}` : '';
    const desc = `${publisher || ''} / ${year || ''}년 가이드라인`;
    const date = year ? `${year}-01-01` : '';
    const category = `${major} - ${sub}`;

    await dbRun(
      "INSERT INTO guidelines (id, major, sub, title, year, pages, publisher, date, url, desc, category) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [newId, major, sub, title, year || '', '', publisher || '', date, newFilePath, desc, category]
    );

    console.log(`✅ New guideline created: ${newId}`);

    return res.json({
      success: true,
      message: '새 가이드라인이 추가되었습니다.',
      guidelineId: newId
    });
  } catch (error) {
    console.error('Error creating guideline:', error);
    return res.status(500).json({ error: '가이드라인 생성 중 오류 발생: ' + error.message });
  }
});

/**
 * DELETE /api/guidelines/:id
 * 특정 가이드라인을 삭제합니다.
 */
app.delete('/api/guidelines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await dbRun("DELETE FROM guidelines WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '삭제할 가이드라인을 찾을 수 없습니다.' });
    }

    console.log(`🗑️ Guideline deleted: ${id}`);
    res.json({ success: true, message: '가이드라인이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting guideline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/drugs
 * 전체 약물 정보를 업데이트합니다.
 */
app.put('/api/drugs', authMiddleware, async (req, res) => {
  const newDrugs = req.body.drugs;

  if (!newDrugs || !Array.isArray(newDrugs)) {
    return res.status(400).json({ error: '유효한 약물 데이터(배열)가 필요합니다.' });
  }

  try {
    await dbRun("BEGIN TRANSACTION");
    
    // 기존 데이터 삭제
    await dbRun("DELETE FROM drug_items");
    await dbRun("DELETE FROM drugs");

    for (const d of newDrugs) {
      await dbRun("INSERT INTO drugs (id, major, minor, sub) VALUES (?,?,?,?)", 
        [d.id, d.major, d.minor, d.sub]);
      
      if (d.items && Array.isArray(d.items)) {
        for (const item of d.items) {
          await dbRun(
            "INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)",
            [d.id, item.ingredient, item.reference, item.image, item.desc || '', item.usage || '', item.caution || '']
          );
        }
      }
    }
    
    await dbRun("COMMIT");
    console.log(`✅ Drugs database updated by user (SQLite).`);
    res.json({ success: true, message: '약물 정보가 성공적으로 저장되었습니다.' });
  } catch (error) {
    await dbRun("ROLLBACK").catch(() => {});
    console.error('Error updating drugs:', error);
    res.status(500).json({ error: '약물 정보 저장 중 오류 발생: ' + error.message });
  }
});

/**
 * PATCH /api/drugs/:id
 * 특정 약물 카테고리(엔트리)의 정보를 부분 업데이트합니다.
 */
app.patch('/api/drugs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { major, minor, sub, items } = req.body;

  try {
    await dbRun("BEGIN TRANSACTION");

    // 1. 기본 정보 업데이트
    await dbRun(
      "UPDATE drugs SET major = COALESCE(?, major), minor = COALESCE(?, minor), sub = COALESCE(?, sub) WHERE id = ?",
      [major, minor, sub, id]
    );

    // 2. 아이템 업데이트 (해당 카테고리 내 아이템만 교체)
    if (items && Array.isArray(items)) {
      await dbRun("DELETE FROM drug_items WHERE drug_id = ?", [id]);
      for (const item of items) {
        await dbRun(
          "INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)",
          [id, item.ingredient, item.reference, item.image || '', item.desc || '', item.usage || '', item.caution || '']
        );
      }
    }

    await dbRun("COMMIT");
    console.log(`✅ Drug entry updated: ${id}`);
    res.json({ success: true, message: '항목이 성공적으로 업데이트되었습니다.' });
  } catch (error) {
    await dbRun("ROLLBACK").catch(() => {});
    console.error('Error patching drug:', error);
    res.status(500).json({ error: '데이터 업데이트 중 오류 발생: ' + error.message });
  }
});

/**
 * POST /api/upload-drug-image
 * 약물 전용 이미지를 업로드합니다.
 */
app.post('/api/upload-drug-image', authMiddleware, upload.single('drugImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }

  const drugId = req.body.drugId;
  const itemIdx = req.body.itemIdx;
  
  // 저장된 상대 경로 반환
  const filePath = `assets/data/guidelines/${req.file.filename}`; 
  // 실제로는 assets/images/drugs/ 에 저장하고 싶지만, 
  // 현재 multer 설정이 assets/data/guidelines/ 로 되어 있으므로 일단 통일합니다.
  // (필요시 multer 설정을 분기할 수 있습니다.)

  res.json({
    success: true,
    filePath: filePath,
    filename: req.file.filename
  });
});



// ─────────────────────────────────────────────
/**
 * POST /api/drugs/import
 * 엑셀 또는 CSV 파일을 업로드하여 약물 정보를 일괄 업데이트합니다.
 */
app.post('/api/drugs/import', authMiddleware, upload.single('drugFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: '파일에 유효한 데이터가 없습니다.' });
    }

    // 데이터 정규화 및 그룹화
    const groups = {};
    let lastMajor = "", lastMinor = "", lastSub = "";

    rows.forEach((row, index) => {
      // 헤더 매핑 (한글/영문 대응)
      let major = (row['분류1'] || row['Major'] || row['분류 1'] || '').toString().trim();
      let minor = (row['분류2'] || row['Minor'] || row['분류 2'] || '').toString().trim();
      let sub = (row['분류3(기전)'] || row['분류3'] || row['Sub'] || row['분류 3'] || '').toString().trim();
      const ingredient = (row['성분명'] || row['Ingredient'] || '').toString().trim();
      const reference = (row['상품명'] || row['Reference'] || row['제품명'] || '').toString().trim();

      // 병합된 셀(빈 칸) 처리
      if (major) lastMajor = major; else major = lastMajor;
      if (minor) lastMinor = minor; else minor = lastMinor;
      if (sub) lastSub = sub; else sub = lastSub;

      if (!major || !ingredient) return;

      const key = `${major}|${minor}|${sub}`;
      if (!groups[key]) {
        groups[key] = { major, minor, sub, items: [] };
      }
      groups[key].items.push({ ingredient, reference, image: '' });
    });

    // DB 트랜잭션 업데이트
    await dbRun("BEGIN TRANSACTION");
    try {
      await dbRun("DELETE FROM drug_items");
      await dbRun("DELETE FROM drugs");

      let count = 1;
      for (const key in groups) {
        const { major, minor, sub, items } = groups[key];
        const drugId = `drug_imported_${count++}`;
        await dbRun("INSERT INTO drugs (id, major, minor, sub) VALUES (?,?,?,?)", [drugId, major, minor, sub]);
        
        for (const item of items) {
          await dbRun(
            "INSERT INTO drug_items (drug_id, ingredient, reference, image, desc, usage, caution) VALUES (?,?,?,?,?,?,?)",
            [drugId, item.ingredient, item.reference, '', '', '', '']
          );
        }
      }
      await dbRun("COMMIT");
      
      // 업로드된 임시 파일 삭제
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      res.json({ 
        success: true, 
        message: `${Object.keys(groups).length}개의 카테고리와 데이터가 성공적으로 임포트되었습니다.` 
      });
    } catch (err) {
      await dbRun("ROLLBACK").catch(() => {});
      throw err;
    }
  } catch (error) {
    console.error('Error importing drugs:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: '데이터 임포트 중 오류 발생: ' + error.message });
  }
});

// ─────────────────────────────────────────────
// 관리자 페이지
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 사용자(관리자) 관리 API
// ─────────────────────────────────────────────

/**
 * GET /api/admins
 * 관리자 목록을 가져옵니다. (슈퍼 관리자 전용)
 */
app.get('/api/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await dbQuery("SELECT * FROM admins ORDER BY added_at DESC");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: '관리자 목록 로드 실패' });
  }
});

/**
 * POST /api/admins
 * 새로운 관리자를 추가합니다.
 */
app.post('/api/admins', authMiddleware, async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });

  try {
    await dbRun("INSERT OR REPLACE INTO admins (email, role) VALUES (?, ?)", [email, role || 'admin']);
    res.json({ success: true, message: '관리자가 추가되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '관리자 추가 실패' });
  }
});

/**
 * DELETE /api/admins/:email
 * 관리자를 삭제합니다.
 */
app.delete('/api/admins/:email', authMiddleware, async (req, res) => {
  const { email } = req.params;
  if (email === 'mom2891@gmail.com') {
    return res.status(400).json({ error: '최고 관리자는 삭제할 수 없습니다.' });
  }

  try {
    await dbRun("DELETE FROM admins WHERE email = ?", [email]);
    res.json({ success: true, message: '관리자가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '관리자 삭제 실패' });
  }
});

app.get('/admin', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'admin.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    res.send(htmlContent);
  } catch (e) {
    res.status(500).send('Error loading admin.html: ' + e.message);
  }
});

// ─────────────────────────────────────────────
// 정적 파일 및 캐시 설정
// ─────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.includes('data.js')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(__dirname));

// ─────────────────────────────────────────────
// 404 및 전역 에러 핸들러 (HTML 응답 방지)
// ─────────────────────────────────────────────

// 404 Handler
app.use((req, res) => {
  console.warn(`[404] Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `요청하신 경로를 찾을 수 없습니다: ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ [Global Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다: ' + (err.message || 'Unknown Error')
  });
});

app.listen(port, () => {
  console.log(`🚀 Pharmacy Info Portal server running at http://localhost:${port}`);
});
