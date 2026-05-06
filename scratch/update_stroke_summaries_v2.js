const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const g35_md = `# 뇌졸중 진료지침 포켓북 상세 요약 (대한뇌졸중학회)

본 지침은 뇌졸중의 급성기 치료부터 이차 예방을 위한 항혈소판제, 항응고제 사용 및 주요 위험인자(고혈압, 당뇨, 이상지질혈증) 관리 전략을 제시합니다.

---

## 1. 급성기 뇌졸중 관리 (Acute Management)
*   **정맥내 혈전용해술 (IVT)**: 증상 발현 **$4.5$시간 이내** 방문한 허혈성 뇌졸중 환자에게 Alteplase 투여를 고려합니다.
*   **급성기 혈압 조절**: 혈전용해술 시행 시 목표 혈압을 **$< 185/110$ mmHg**로 엄격히 관리합니다.

---

## 2. 이차 예방을 위한 항혈전 요법
*   **항혈소판제 (Antiplatelets)**: 비심장성 색전성 뇌졸중 환자에게 권고됩니다. 아스피린, 클로피도그렐, 실로스타졸(Cilostazol) 등이 사용됩니다.
*   **이중 항혈소판 요법 (DAPT)**: 고위험군 TIA 또는 경증 뇌졸중 초기 $21$-$90$일간 아스피린+클로피도그렐 병용을 고려합니다.
*   **항응고제 (Anticoagulants)**: 심방세동 동반 환자에게 뇌졸중 재발 방지를 위해 NOAC 또는 와파린을 우선적으로 사용합니다.

---

## 3. 약사 전문 상담 및 모니터링
*   **출혈 부작용**: 항혈전제 복용 환자에게 뇌출혈 징후(심한 두통, 구토) 및 전신 출혈 증상을 주의 깊게 관찰하도록 교육합니다.
*   **위험인자 조절**: 
    *   **혈압**: $< 140/90$ mmHg 목표.
    *   **LDL-C**: $< 70$ mg/dL (또는 고위험군 시 $< 55$ mg/dL) 목표.
    *   **당뇨**: 저혈당 주의 및 혈당 목표치 개별화.

---
*Reference: Stroke Clinical Practice Guidelines Pocketbook*`;

const integrated_md = `# 뇌졸중 가이드라인 통합본

본 통합본은 대한뇌졸중학회의 지침을 바탕으로, 뇌졸중의 재발 방지를 위한 이차 예방 전략과 동반 질환 관리를 약학적 관점에서 종합한 가이드입니다.

---

## 1. 이차 예방의 핵심: 항혈전 요법
*   **비심장성 뇌졸중**: 죽상경화성 변화에 의한 경우 항혈소판제(Aspirin, Clopidogrel)를 장기 투여합니다. 한국인 환자에서 **Cilostazol**은 혈관 확장 효과와 출혈 위험 저감 측면에서 유용한 선택지가 될 수 있습니다.
*   **심장성 뇌졸중 (심방세동)**: NOAC 사용이 표준이며, 항혈소판제보다 재발 방지 효과가 탁월합니다.

---

## 2. 위험 인자 통합 관리 (ABCD 전략)
*   **A (Antiplatelets/Anticoagulants)**: 환자의 뇌졸중 기전에 따른 약제 선택.
*   **B (Blood Pressure)**: 재발 방지를 위해 **$140/90$ mmHg 미만**으로 강력 조절합니다.
*   **C (Cholesterol)**: 고용량 스타틴을 통한 LDL-C 조절 및 죽상판 안정화를 도모합니다.
*   **D (Diabetes & Diet)**: 인슐린 저항성 개선 및 생활 습관 교정.

---

## 3. 약사 전문 복약 지도 및 중재
*   **항혈전제 임의 중단 금지**: 수술이나 치과 치료 전 임의 중단 시 뇌졸중 재발 위험이 크므로 반드시 상의하도록 지도합니다.
*   **출혈 감시**: 항응고제 복용 환자에서 외상 후 지혈 지연이나 멍 발생 시 대처법을 안내합니다.
*   **순응도 교육**: 뇌졸중은 한 번 발생하면 재발 위험이 매우 높으므로 평생 관리 및 약물 복용의 중요성을 강조합니다.

---
*본 통합본은 대한뇌졸중학회 진료지침 및 포켓북을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g35_md, 'g35']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '7. 뇌졸중', integrated_md], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated individual and integrated summaries for Stroke');
        db.close();
    });
});
