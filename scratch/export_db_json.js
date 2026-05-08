// 데이터베이스를 정적 JSON으로 내보내는 스크립트
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'db.json');

const db = new sqlite3.Database(DB_FILE);

function dbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

async function exportDb() {
  console.log('📦 Exporting database to static JSON...');
  
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

  const fullDb = { guidelines, drugs, supplements, categoryMetadata };

  // 출력 디렉토리 생성
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fullDb), 'utf8');
  
  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`✅ Exported to ${OUTPUT_FILE} (${sizeKB} KB)`);
  console.log(`   Guidelines: ${guidelines.length}`);
  console.log(`   Drugs: ${drugs.length}`);
  console.log(`   Supplements: ${supplements.length}`);
  console.log(`   Category Metadata: ${categoryMetadata.length}`);
  
  db.close();
}

exportDb().catch(err => {
  console.error('❌ Export failed:', err);
  db.close();
  process.exit(1);
});
