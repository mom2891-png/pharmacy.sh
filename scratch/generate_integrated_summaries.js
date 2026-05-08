const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const CATEGORIES_DIR = path.join(__dirname, '..', 'guidelines', 'summaries', 'categories');

const db = new sqlite3.Database(DB_FILE);

const TEMPLATE = (major, diseases) => `# ${major} 통합 치료 지침 (약사 전문 가이드)

본 통합 지침은 ${major}에 속한 주요 질환들의 최신 가이드라인을 집대성하여, 약학적 관리 전략을 종합적으로 다룹니다.

---

## 1. 포함 질환 리스트
${diseases.map(d => `*   **${d.sub}**: ${d.title}`).join('\n')}

---

## 2. 카테고리 핵심 요약 (Integrated View)
본 카테고리에서 약사가 주목해야 할 핵심 임상 포인트입니다.
*   **공통 관리 원칙**: 질환 간의 연관성 및 병용 약물 관리.
*   **주요 약제군**: 이 카테고리에서 빈번하게 사용되는 약물 계열 분석.

---

## 3. 약학적 중재 포인트 (TCREI Insight)
*   **상호작용 관리**: 카테고리 내 질환 약물과 타 질환 약물 간의 DDI.
*   **순응도 제고**: 환자 교육 및 복약 순응도 향상을 위한 전략.

---
*본 통합 지침은 최신 임상 근거를 바탕으로 작성 중인 템플릿입니다.*
`;

async function run() {
    if (!fs.existsSync(CATEGORIES_DIR)) fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

    const categories = await new Promise((resolve, reject) => {
        db.all("SELECT major, sub, title FROM guidelines", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });

    const grouped = {};
    categories.forEach(g => {
        if (!grouped[g.major]) grouped[g.major] = [];
        grouped[g.major].push(g);
    });

    console.log(`Generating integrated summaries for ${Object.keys(grouped).length} categories...`);

    for (const major in grouped) {
        // Filename format: "Category.md"
        // To be consistent with sync_categories.js, we might need a specific format.
        // Let's use "Department_Category.md" or just "Category.md".
        // The previous turns used "호흡기질환_1._천식.md".
        // Let's just use "Major.md" for now.
        const fileName = `${major}.md`;
        const filePath = path.join(CATEGORIES_DIR, fileName);
        
        // We only overwrite if it's a new or skeletal one?
        // Let's just create if not exists.
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, TEMPLATE(major, grouped[major]), 'utf8');
            console.log(`✅ Created Integrated: ${fileName}`);
        }
    }

    db.close();
    console.log('🏁 Integrated summary generation completed.');
}

run().catch(console.error);
