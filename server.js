const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' })); // JSON body parsing
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 정적 자산 캐시 방지 설정
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.includes('data.js')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(__dirname)); // Serve static files from root

// ─────────────────────────────────────────────
// data.js 파싱 / 직렬화 유틸리티
// ─────────────────────────────────────────────

/**
 * data.js 파일에서 guidelines 배열만 추출하여 반환합니다.
 * data.js 구조: const DB = { guidelines: [...], drugs: [...], supplements: [...] };
 */
function readDataJs() {
  const raw = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  // vm 모듈로 안전하게 실행
  const vm = require('vm');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(raw, sandbox);
  return sandbox.DB || sandbox.window.DB;
}

/**
 * DB 객체 전체를 data.js 파일로 직렬화하여 저장합니다.
 */
function writeDataJs(db) {
  const json = JSON.stringify(db, null, 2);
  const content = `// Mock 데이터베이스\r\nconst DB = ${json};\r\n\r\nwindow.DB = DB;\r\n`;
  fs.writeFileSync(path.join(__dirname, 'data.js'), content, 'utf8');
}

/**
 * drugs 데이터의 minor/sub/major 필드에서 개행문자(\n)와 앞뒤 공백을 제거합니다.
 * PDF 파싱 과정에서 유입된 불필요한 문자를 정리합니다.
 */
function sanitizeDrugs() {
  try {
    const db = readDataJs();
    let changed = false;
    if (db.drugs && Array.isArray(db.drugs)) {
      db.drugs.forEach(d => {
        ['major', 'minor', 'sub'].forEach(field => {
          if (d[field] && typeof d[field] === 'string') {
            const cleaned = d[field].replace(/\n/g, '').trim();
            if (cleaned !== d[field]) {
              d[field] = cleaned;
              changed = true;
            }
          }
        });
      });
    }
    if (changed) {
      writeDataJs(db);
      console.log('🧹 data.js drugs 필드 정리 완료 (개행문자 제거)');
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

/**
 * GET /api/guidelines
 * 전체 가이드라인 목록을 반환합니다.
 */
app.get('/api/guidelines', (req, res) => {
  try {
    const db = readDataJs();
    res.json(db.guidelines);
  } catch (err) {
    console.error('Error reading guidelines:', err);
    res.status(500).json({ error: 'data.js 읽기 실패: ' + err.message });
  }
});

/**
 * POST /api/upload
 * 파일을 업로드하고 해당 가이드라인의 URL을 업데이트합니다.
 */
app.post('/api/upload', upload.single('guidelineFile'), (req, res) => {
  const guidelineId = req.body.guidelineId;
  
  if (!req.file || !guidelineId) {
    return res.status(400).json({ error: '가이드라인 ID와 파일이 모두 필요합니다.' });
  }

  const newFilePath = `assets/data/guidelines/${req.file.originalname}`;
  
  try {
    const db = readDataJs();
    const guideline = db.guidelines.find(g => g.id === guidelineId);
    
    if (!guideline) {
      return res.status(404).json({ error: `ID가 ${guidelineId}인 항목을 찾을 수 없습니다.` });
    }

    guideline.url = newFilePath;
    writeDataJs(db);
    console.log(`✅ Updated: ${guidelineId} → ${newFilePath}`);

    return res.json({ 
      success: true, 
      message: '업로드 및 업데이트가 완료되었습니다.', 
      filePath: newFilePath
    });
  } catch (error) {
    console.error('Error updating data.js:', error);
    return res.status(500).json({ error: 'data.js 업데이트 중 오류 발생: ' + error.message });
  }
});

/**
 * PUT /api/guidelines/:id
 * 가이드라인 메타데이터(제목, 연도, 발행기관)를 수정합니다.
 */
app.put('/api/guidelines/:id', (req, res) => {
  const { id } = req.params;
  const { title, year, publisher } = req.body;

  try {
    const db = readDataJs();
    const guideline = db.guidelines.find(g => g.id === id);

    if (!guideline) {
      return res.status(404).json({ error: `ID가 ${id}인 가이드라인을 찾을 수 없습니다.` });
    }

    // 넘어온 필드만 업데이트
    if (title !== undefined) guideline.title = title;
    if (year !== undefined) guideline.year = year;
    if (publisher !== undefined) guideline.publisher = publisher;

    // desc 자동 갱신
    guideline.desc = `${guideline.publisher || ''} / ${guideline.year || ''}년 가이드라인`;

    writeDataJs(db);
    console.log(`✅ Metadata updated: ${id} → title="${guideline.title}", year="${guideline.year}", publisher="${guideline.publisher}"`);

    return res.json({
      success: true,
      message: '메타데이터가 성공적으로 수정되었습니다.',
      guideline
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return res.status(500).json({ error: '메타데이터 수정 중 오류 발생: ' + error.message });
  }
});

/**
 * POST /api/guidelines
 * 새로운 가이드라인을 추가합니다.
 */
app.post('/api/guidelines', upload.single('guidelineFile'), (req, res) => {
  const { title, year, publisher, major, sub } = req.body;

  if (!title || !major || !sub) {
    return res.status(400).json({ error: '제목, 대분류, 중분류는 필수 항목입니다.' });
  }

  try {
    const db = readDataJs();

    // 새 ID 생성 (기존 최대 ID + 1)
    const maxId = db.guidelines.reduce((max, g) => {
      const num = parseInt(g.id.replace('g', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newId = `g${maxId + 1}`;

    const newFilePath = req.file ? `assets/data/guidelines/${req.file.originalname}` : '';

    const newGuideline = {
      id: newId,
      major: major,
      sub: sub,
      title: title,
      year: year || '',
      pages: '',
      publisher: publisher || '',
      date: year ? `${year}-01-01` : '',
      url: newFilePath,
      desc: `${publisher || ''} / ${year || ''}년 가이드라인`,
      category: `${major} - ${sub}`
    };

    db.guidelines.push(newGuideline);
    writeDataJs(db);
    console.log(`✅ New guideline created: ${newId} - "${title}"`);

    return res.json({
      success: true,
      message: '새 가이드라인이 추가되었습니다.',
      guideline: newGuideline
    });
  } catch (error) {
    console.error('Error creating guideline:', error);
    return res.status(500).json({ error: '가이드라인 생성 중 오류 발생: ' + error.message });
  }
});

/**
 * PUT /api/drugs
 * 전체 약물 정보를 업데이트합니다.
 */
app.put('/api/drugs', (req, res) => {
  const newDrugs = req.body.drugs;

  if (!newDrugs || !Array.isArray(newDrugs)) {
    return res.status(400).json({ error: '유효한 약물 데이터(배열)가 필요합니다.' });
  }

  try {
    const db = readDataJs();
    db.drugs = newDrugs;
    writeDataJs(db);
    console.log(`✅ Drugs database updated by user.`);

    return res.json({
      success: true,
      message: '약물 정보가 성공적으로 저장되었습니다.'
    });
  } catch (error) {
    console.error('Error updating drugs:', error);
    return res.status(500).json({ error: '약물 정보 저장 중 오류 발생: ' + error.message });
  }
});

/**
 * POST /api/upload-drug-image
 * 약물 전용 이미지를 업로드합니다.
 */
app.post('/api/upload-drug-image', upload.single('drugImage'), (req, res) => {
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
// 관리자 페이지
// ─────────────────────────────────────────────

app.get('/admin', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'admin.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    res.send(htmlContent);
  } catch (e) {
    res.status(500).send('Error loading admin.html: ' + e.message);
  }
});

app.listen(port, () => {
  console.log(`🚀 로컬 관리자 서버가 실행되었습니다! 브라우저에서 http://localhost:${port} 으로 접속하세요.`);
});
