const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const SUMMARIES_DIR = path.join(__dirname, '..', 'guidelines', 'summaries');

const db = new sqlite3.Database(DB_FILE);

const TEMPLATE = (title, major, sub) => `# ${title} (TCREI Master Template)

본 가이드라인은 ${major} - ${sub}에 대한 약학적 전문 지식을 집대성한 표준 가이드입니다.

---

## 1. 개요 및 병태생리 (Title & Concept)
*   **정의**: ${title}에 대한 임상적 정의 및 핵심 병태생리 기전.
*   **증상**: 환자가 호소하는 주요 임상 양상.

---

## 2. 치료 목표 및 원칙 (Goal & Principle)
*   **치료 목표**: 약물 요법을 통해 달성하고자 하는 최종 결과 (예: 혈당 조절, 통증 완화).
*   **비약물 요법**: 생활 습관 교정 및 식이 요법.

---

## 3. 약물 요법 상세 (Pharmacotherapy)
*   **1차 선택 약제**: 성분명, 기전, 표준 용량.
*   **병용 및 대체 요법**: 2차 선택지 및 복합제 활용 전략.
*   **주의사항**: 금기(Contraindications) 및 주요 상호작용.

---

## 4. 약사 전문 복약 중재 (TCREI Insight)
*   **모니터링**: 치료 효과 및 부작용 추적 관찰 포인트.
*   **환자 교육**: 복약 순응도를 높이기 위한 핵심 메시지.
*   **전문적 통찰**: 약사로서 반드시 확인해야 할 임상적 Tip.

---
*본 가이드라인은 최신 임상 근거를 바탕으로 작성 중인 템플릿입니다.*
`;

async function run() {
    if (!fs.existsSync(SUMMARIES_DIR)) fs.mkdirSync(SUMMARIES_DIR, { recursive: true });

    const guidelines = await new Promise((resolve, reject) => {
        db.all("SELECT id, major, sub, title FROM guidelines", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });

    console.log(`Checking ${guidelines.length} guidelines for missing files...`);

    for (const g of guidelines) {
        const filePath = path.join(SUMMARIES_DIR, `${g.id}.md`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, TEMPLATE(g.title, g.major, g.sub), 'utf8');
            console.log(`✅ Created: ${g.id}.md (${g.title})`);
        }
    }

    db.close();
    console.log('🏁 Markdown generation completed.');
}

run().catch(console.error);
