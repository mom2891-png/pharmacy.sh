const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (Firebase Storage 지원 추가)
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pharmacy-info-portal.firebasestorage.app'
});

const app = express();
const port = 3000;
const rootDir = process.cwd();

// 요청 및 응답 로거 (가장 상단에 배치)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

const MASTER_EMAIL = 'mom2891@gmail.com';
const ADMIN_PASSWORD = '3505';

// API 응답에만 캐시 방지 설정 (단, PDF 스트리밍 API는 제외)
app.use('/api', (req, res, next) => {
  if (req.url.startsWith('/pdf/')) return next();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 모든 응답에 CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 가이드라인 문서 서빙 (관리자 전용, PDF 뷰어 호환성 최적화)
app.get('/api/pdf/:filename', authMiddleware, (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.resolve(rootDir, 'guidelines', 'documents', fileName);
  console.log(`[PDF] 요청: "${fileName}" → ${filePath} → exists: ${fs.existsSync(filePath)}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', 'inline');
    
    // 파일을 스트림으로 직접 전송 (sendFile 대신)
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error(`[PDF] 스트림 에러: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).send('File read error');
      }
    });
    stream.pipe(res);
  } else {
    // 파일명에 공백이나 특수문자 문제가 있을 수 있으므로 유사 파일 찾기
    const docsDir = path.resolve(rootDir, 'guidelines', 'documents');
    const files = fs.readdirSync(docsDir);
    const match = files.find(f => f === fileName || f.replace(/ /g, '%20') === fileName);
    if (match) {
      const matchPath = path.resolve(docsDir, match);
      console.log(`[PDF] 유사 파일 매칭: "${match}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Disposition', 'inline');
      const stream = fs.createReadStream(matchPath);
      stream.on('error', (err) => {
        console.error(`[PDF] 스트림 에러: ${err.message}`);
        if (!res.headersSent) res.status(500).send('File read error');
      });
      stream.pipe(res);
    } else {
      console.error(`[PDF] 파일 없음: "${fileName}"`);
      res.status(404).json({ success: false, error: `File not found: ${fileName}` });
    }
  }
});

app.use('/guidelines/documents', authMiddleware, (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
}, express.static(path.join(rootDir, 'guidelines', 'documents')));

app.use(express.static(rootDir));

async function authMiddleware(req, res, next) {
  // 쿠키 파싱 (cookie-parser 미사용 시 수동 파싱)
  const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => {
    const parts = c.split('=');
    return [parts[0].trim(), parts.slice(1).join('=')];
  })) : {};

  // 헤더 또는 쿠키에서 토큰 추출 (쿼리 파라미터 방식보다 쿠키가 보안 및 호환성 면에서 우수함)
  const idToken = req.headers['x-api-key'] || cookies.firebaseToken;
  
  if (!idToken || idToken === 'null' || idToken === 'undefined') {
    return res.status(401).json({ error: '인증 토큰이 누락되었습니다. 로그인이 필요합니다.' });
  }


  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;
    
    // 오직 mom2891@gmail.com 만이 모든 권한을 가진 마스터 관리자
    if (userEmail === MASTER_EMAIL) {
      req.user = { ...decodedToken, role: 'master' };
      return next();
    }

    // 그 외 계정은 admins 테이블에 등록되어 있어야 함
    const adminUser = await dbGet("SELECT * FROM admins WHERE email = ?", [userEmail]);
    if (!adminUser) {
      console.warn(`🚨 권한 없는 사용자 접근 시도: ${userEmail}`);
      return res.status(403).json({ error: '관리자 권한이 없는 계정입니다.' });
    }
    req.user = { ...decodedToken, role: adminUser.role };
    next();

  } catch (error) {
    console.warn(`🚨 유효하지 않은 토큰 접근 시도: ${req.method} ${req.url}`, error.message);
    res.status(403).json({ error: '유효하지 않은 인증 토큰입니다. 다시 로그인해 주세요.' });
  }
}

app.get('/api/auth-status', authMiddleware, (req, res) => {
  const MASTER_EMAIL = 'mom2891@gmail.com';
  const isAdmin = req.user && req.user.email === MASTER_EMAIL;
  res.json({ isAdmin, role: req.user.role, email: req.user.email });
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
  db.run(`CREATE TABLE IF NOT EXISTS category_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, major TEXT, sub TEXT, summary TEXT, sort_order INTEGER DEFAULT 0, UNIQUE(major, sub))`);
  db.run("ALTER TABLE guidelines ADD COLUMN is_checked INTEGER DEFAULT 0", (err) => {});
  db.run("ALTER TABLE guidelines ADD COLUMN is_deleted INTEGER DEFAULT 0", (err) => {});
  db.run("ALTER TABLE guidelines ADD COLUMN memo TEXT", (err) => {});
  db.run("ALTER TABLE guidelines ADD COLUMN source_url TEXT", (err) => {});
  db.run("ALTER TABLE guidelines ADD COLUMN sort_order INTEGER DEFAULT 0", (err) => {});
  db.run("ALTER TABLE category_metadata ADD COLUMN sort_order INTEGER DEFAULT 0", (err) => {});
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
      
      // Normalize URL paths for the frontend
      const normalize = (p) => {
        if (!p || typeof p !== 'string' || p.startsWith('http')) return p;
        const clean = p.replace(/^(\/|assets\/data\/|guidelines\/documents\/|guidelines\/)/g, '');
        return `guidelines/documents/${clean}`;
      };

      if (Array.isArray(url)) {
        url = url.map(normalize);
      } else {
        url = normalize(url);
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
  if (!req.file || !guidelineId) {
    return res.status(400).json({ error: '가이드라인 ID와 파일이 모두 필요합니다.' });
  }

  try {
    const bucket = admin.storage().bucket();
    const destination = `guideline/${req.file.originalname}`;
    
    console.log(`[Firebase] Uploading ${req.file.originalname} to ${destination}...`);
    
    // 1. Firebase Storage에 업로드
    await bucket.upload(req.file.path, {
      destination: destination,
      metadata: {
        contentType: req.file.mimetype
      }
    });

    // 2. Signed URL 생성 (50년 만료)
    const [signedUrl] = await bucket.file(destination).getSignedUrl({
      action: 'read',
      expires: '01-01-2075'
    });

    console.log(`[Firebase] Upload successful. Signed URL generated.`);

    // 3. DB 업데이트 (Firebase URL로 저장)
    const result = await dbRun("UPDATE guidelines SET url = ? WHERE id = ?", [signedUrl, guidelineId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: `ID가 ${guidelineId}인 항목을 찾을 수 없습니다.` });
    }

    // 4. 로컬 임시 파일 삭제 (선택 사항)
    try { fs.unlinkSync(req.file.path); } catch(e) {}

    res.json({ 
      success: true, 
      message: 'Firebase 업로드 완료', 
      filePath: signedUrl 
    });

  } catch (error) {
    console.error('[Firebase Upload Error]', error);
    res.status(500).json({ error: 'Firebase 업로드 실패: ' + error.message });
  }
});

app.post('/api/guidelines/:id/unlink', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbRun("UPDATE guidelines SET url = '' WHERE id = ?", [id]);
    if (result.changes === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
    res.json({ success: true, message: 'PDF 연결이 해제되었습니다.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/guidelines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, year, publisher, major, sub, source_url, country } = req.body;
  
  try {
    const existing = await dbGet("SELECT * FROM guidelines WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });

    const finalTitle = title !== undefined ? title : existing.title;
    const finalYear = year !== undefined ? year : existing.year;
    const finalPublisher = publisher !== undefined ? publisher : existing.publisher;
    const finalMajor = major !== undefined ? major : existing.major;
    const finalSub = sub !== undefined ? sub : existing.sub;
    const finalMemo = req.body.memo !== undefined ? req.body.memo : existing.memo;
    const finalUrl = req.body.url !== undefined ? req.body.url : existing.url;
    const finalSourceUrl = source_url !== undefined ? source_url : existing.source_url;
    const finalCountry = country !== undefined ? country : existing.country;
    
    console.log(`[UPDATE ${id}] source_url: ${source_url}, country: ${country}`);
    
    const desc = `${finalPublisher || ''} / ${finalYear || ''}년 가이드라인`;
    const category = `${finalMajor} - ${finalSub}`;
    
    // 카테고리가 변경된 경우 순서를 해당 카테고리의 마지막으로 재설정
    let finalOrder = existing.sort_order;
    if (finalMajor !== existing.major || finalSub !== existing.sub) {
      // 새로운 카테고리 메타데이터 초기화 (없을 경우)
      const majorMeta = await dbGet("SELECT * FROM category_metadata WHERE major = ? AND sub = ''", [finalMajor]);
      if (!majorMeta) {
        const maxMajorOrder = await dbGet("SELECT MAX(sort_order) as maxOrder FROM category_metadata WHERE sub = ''");
        const nextMajorOrder = (maxMajorOrder && maxMajorOrder.maxOrder ? maxMajorOrder.maxOrder : 0) + 1;
        await dbRun("INSERT INTO category_metadata (major, sub, sort_order) VALUES (?, '', ?)", [finalMajor, nextMajorOrder]);
      }

      const subMeta = await dbGet("SELECT * FROM category_metadata WHERE major = ? AND sub = ?", [finalMajor, finalSub]);
      if (!subMeta) {
        const maxSubOrder = await dbGet("SELECT MAX(sort_order) as maxOrder FROM category_metadata WHERE major = ?", [finalMajor]);
        const nextSubOrder = (maxSubOrder && maxSubOrder.maxOrder ? maxSubOrder.maxOrder : 0) + 1;
        await dbRun("INSERT INTO category_metadata (major, sub, sort_order) VALUES (?, ?, ?)", [finalMajor, finalSub, nextSubOrder]);
      }

      // 가이드라인 아이템 순서 재계산
      const orderRow = await dbGet("SELECT MAX(sort_order) as maxOrder FROM guidelines WHERE major = ? AND sub = ?", [finalMajor, finalSub]);
      finalOrder = (orderRow && orderRow.maxOrder ? orderRow.maxOrder : 0) + 1;
    }

    const result = await dbRun(`
      UPDATE guidelines 
      SET title = ?, 
          year = ?, 
          publisher = ?, 
          major = ?, 
          sub = ?,
          category = ?,
          desc = ?,
          memo = ?,
          url = ?,
          source_url = ?,
          sort_order = ?,
          country = ?
      WHERE id = ?`, 
      [finalTitle, finalYear, finalPublisher, finalMajor, finalSub, category, desc, finalMemo, finalUrl, finalSourceUrl, finalOrder, finalCountry, id]
    );
    
    console.log(`[UPDATE RESULT ${id}] changes: ${result.changes}`);
    
    const check = await dbGet("SELECT source_url FROM guidelines WHERE id = ?", [id]);
    console.log(`[DB VERIFY ${id}] Saved source_url: ${check ? check.source_url : 'NOT FOUND'}`);
    
    res.json({ success: true, message: '업데이트 완료' });
  } catch (error) { 
    console.error('Update error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

// 메모 전용 업데이트
app.put('/api/guidelines/:id/memo', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { memo } = req.body;
  try {
    await dbRun("UPDATE guidelines SET memo = ? WHERE id = ?", [memo, id]);
    res.json({ success: true, message: '메모가 저장되었습니다.' });
  } catch (error) { 
    console.error('Memo update error:', error);
    res.status(500).json({ error: error.message }); 
  }
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
  const { title, year, publisher, major, sub, source_url, country } = req.body;
  
  if (!major || !sub || !title) {
    return res.status(400).json({ error: '필수 정보(대분류, 중분류, 제목)가 누락되었습니다.' });
  }

  try {
    const rows = await dbQuery("SELECT id FROM guidelines");
    const maxId = rows.reduce((max, g) => {
      const num = parseInt(g.id.replace('g', ''), 10) || 0;
      return num > max ? num : max;
    }, 0);
    const newId = `g${maxId + 1}`;
    
    let firebasePath = '';
    if (req.file) {
      const bucket = admin.storage().bucket();
      const destination = `guideline/${req.file.originalname}`;
      await bucket.upload(req.file.path, {
        destination: destination,
        metadata: { contentType: req.file.mimetype }
      });
      const [signedUrl] = await bucket.file(destination).getSignedUrl({
        action: 'read',
        expires: '01-01-2075'
      });
      firebasePath = signedUrl;
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }

    const desc = `${publisher || ''} / ${year || ''}년 가이드라인`;
    const category = `${major} - ${sub}`;

    // 1. 카테고리 메타데이터(순서) 초기화 (새로운 분류일 경우 마지막으로)
    // 대분류 체크
    const majorMeta = await dbGet("SELECT * FROM category_metadata WHERE major = ? AND sub = ''", [major]);
    if (!majorMeta) {
      const maxMajorOrder = await dbGet("SELECT MAX(sort_order) as maxOrder FROM category_metadata WHERE sub = ''");
      const nextMajorOrder = (maxMajorOrder && maxMajorOrder.maxOrder ? maxMajorOrder.maxOrder : 0) + 1;
      await dbRun("INSERT INTO category_metadata (major, sub, sort_order) VALUES (?, '', ?)", [major, nextMajorOrder]);
    }

    // 중분류 체크
    const subMeta = await dbGet("SELECT * FROM category_metadata WHERE major = ? AND sub = ?", [major, sub]);
    if (!subMeta) {
      const maxSubOrder = await dbGet("SELECT MAX(sort_order) as maxOrder FROM category_metadata WHERE major = ?", [major]);
      const nextSubOrder = (maxSubOrder && maxSubOrder.maxOrder ? maxSubOrder.maxOrder : 0) + 1;
      await dbRun("INSERT INTO category_metadata (major, sub, sort_order) VALUES (?, ?, ?)", [major, sub, nextSubOrder]);
    }

    // 2. 가이드라인 아이템 순서 찾기
    const orderRow = await dbGet("SELECT MAX(sort_order) as maxOrder FROM guidelines WHERE major = ? AND sub = ?", [major, sub]);
    const nextOrder = (orderRow && orderRow.maxOrder ? orderRow.maxOrder : 0) + 1;

    await dbRun(`
      INSERT INTO guidelines (id, major, sub, title, year, publisher, date, url, desc, category, source_url, sort_order, country) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [newId, major, sub, title, year || '', publisher || '', year ? `${year}-01-01` : '', firebasePath, desc, category, source_url || '', nextOrder, country || '']
    );
    
    res.json({ success: true, guidelineId: newId, filePath: firebasePath });
  } catch (error) { 
    console.error('Insert error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/guidelines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: '수정할 데이터가 없습니다.' });
  }

  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await dbRun(`UPDATE guidelines SET ${fields} WHERE id = ?`, values);
    res.json({ success: true, message: '가이드라인 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('Guideline update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/guidelines/:id', authMiddleware, async (req, res) => {
  try {
    // 논리적 삭제 (휴지통으로 이동)
    await dbRun("UPDATE guidelines SET is_deleted = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: '휴지통으로 이동되었습니다.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 가이드라인 복구
app.post('/api/guidelines/:id/restore', authMiddleware, async (req, res) => {
  try {
    await dbRun("UPDATE guidelines SET is_deleted = 0 WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: '복구되었습니다.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 순서 변경 (드래그 앤 드롭 저장용)
app.post('/api/reorder', authMiddleware, async (req, res) => {
  const { type, items } = req.body; // type: 'guideline', 'subcategory', 'major'
  // items: [{id, order}, ...] 또는 {major, sub, order}
  
  try {
    if (type === 'guideline') {
      for (const item of items) {
        await dbRun("UPDATE guidelines SET sort_order = ?, is_old = ? WHERE id = ?", [item.order, item.is_old ?? 0, item.id]);
      }
    } else if (type === 'subcategory') {
      for (const item of items) {
        // subcategory 순서는 category_metadata 테이블에서 관리
        // 존재하지 않으면 생성, 존재하면 업데이트
        await dbRun(`
          INSERT INTO category_metadata (major, sub, sort_order) 
          VALUES (?, ?, ?)
          ON CONFLICT(major, sub) DO UPDATE SET sort_order = excluded.sort_order
        `, [item.major, item.sub, item.order]);
      }
    } else if (type === 'major') {
      for (const item of items) {
        // major 순서는 sub가 빈 문자열인 row로 관리
        await dbRun(`
          INSERT INTO category_metadata (major, sub, sort_order) 
          VALUES (?, '', ?)
          ON CONFLICT(major, sub) DO UPDATE SET sort_order = excluded.sort_order
        `, [item.major, item.order]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 중분류(Subcategory) 통째로 이동
app.post('/api/categories/move', authMiddleware, async (req, res) => {
  const { currentMajor, sub, targetMajor } = req.body;
  
  if (!currentMajor || !sub || !targetMajor) {
    return res.status(400).json({ error: '필수 정보(현재 대분류, 중분류, 대상 대분류)가 누락되었습니다.' });
  }

  try {
    // 1. 해당 중분류에 속한 모든 가이드라인의 대분류(major)와 카테고리명(category) 업데이트
    // 새로운 카테고리명 생성
    const newCategory = `${targetMajor} - ${sub}`;
    
    // 이 중분류의 가이드라인들이 타겟 대분류의 마지막에 붙도록 sort_order 처리
    const maxOrderRow = await dbGet("SELECT MAX(sort_order) as maxOrder FROM guidelines WHERE major = ? AND sub = ?", [targetMajor, sub]);
    let nextOrder = (maxOrderRow && maxOrderRow.maxOrder ? maxOrderRow.maxOrder : 0) + 1;

    // 가이드라인 업데이트
    await dbRun(`
      UPDATE guidelines 
      SET major = ?, category = ? 
      WHERE major = ? AND sub = ?
    `, [targetMajor, newCategory, currentMajor, sub]);

    // 2. 카테고리 메타데이터(순서 정보) 이동
    // 기존 메타데이터 가져오기
    const oldMeta = await dbGet("SELECT sort_order FROM category_metadata WHERE major = ? AND sub = ?", [currentMajor, sub]);
    
    // 타겟 대분류 내에서의 마지막 순서 계산
    const maxSubOrderRow = await dbGet("SELECT MAX(sort_order) as maxOrder FROM category_metadata WHERE major = ?", [targetMajor]);
    const nextSubOrder = (maxSubOrderRow && maxSubOrderRow.maxOrder ? maxSubOrderRow.maxOrder : 0) + 1;

    // 기존 메타데이터 삭제 후 새 대분류로 삽입
    await dbRun("DELETE FROM category_metadata WHERE major = ? AND sub = ?", [currentMajor, sub]);
    await dbRun(`
      INSERT INTO category_metadata (major, sub, sort_order) 
      VALUES (?, ?, ?)
      ON CONFLICT(major, sub) DO UPDATE SET sort_order = excluded.sort_order
    `, [targetMajor, sub, nextSubOrder]);

    res.json({ success: true, message: `[${sub}] 중분류가 [${targetMajor}]로 이동되었습니다.` });
  } catch (error) {
    console.error('Category move error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 가이드라인 영구 삭제
app.delete('/api/guidelines/:id/permanent', authMiddleware, async (req, res) => {
  try {
    await dbRun("DELETE FROM guidelines WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: '영구 삭제되었습니다.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 가이드라인 카테고리 일괄 명칭 변경
app.post('/api/categories/rename', authMiddleware, async (req, res) => {
  const { type, oldName, newName, majorContext } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: '명칭이 누락되었습니다.' });

  try {
    if (type === 'major') {
      await dbRun(`
        UPDATE guidelines 
        SET major = ?, 
            category = ? || SUBSTR(category, INSTR(category, " - ")) 
        WHERE major = ?`, 
        [newName, newName, oldName]
      );
    } else {
      await dbRun(`
        UPDATE guidelines 
        SET sub = ?, 
            category = major || " - " || ? 
        WHERE major = ? AND sub = ?`, 
        [newName, newName, majorContext, oldName]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

app.post('/api/upload-drug-image', authMiddleware, upload.single('drugImage'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  
  try {
    const bucket = admin.storage().bucket();
    const destination = `drug/${req.file.originalname}`;
    
    await bucket.upload(req.file.path, {
      destination: destination,
      metadata: { contentType: req.file.mimetype }
    });

    const [signedUrl] = await bucket.file(destination).getSignedUrl({
      action: 'read',
      expires: '01-01-2075'
    });

    try { fs.unlinkSync(req.file.path); } catch(e) {}

    res.json({ success: true, filePath: signedUrl, filename: req.file.originalname });
  } catch (error) {
    console.error('Drug Image Upload Error:', error);
    res.status(500).json({ error: '이미지 업로드 실패: ' + error.message });
  }
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
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
