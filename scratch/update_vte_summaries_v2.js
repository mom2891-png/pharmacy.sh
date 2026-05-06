const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const g36_md = `# 하지심부정맥혈전증(DVT) 진단과 치료: 한국형 진료지침 상세 요약

본 지침은 한국인 환자의 특성을 고려한 하지 심부정맥 혈전증의 진단 알고리즘과 항응고 요법을 중심으로 한 합병증 예방 전략을 제시합니다.

---

## 1. 진단 및 위험도 평가
*   **임상적 의심**: 다리의 부종, 통증, 홍반 등이 있을 때 D-dimer 검사 및 초음파(Compression Ultrasonography)를 통해 확진합니다.
*   **위험 인자 확인**: 수술, 부동(Immobilization), 암, 고령, 혈전증 과거력 등을 평가합니다.

---

## 2. 약물 치료: 항응고 요법 (Anticoagulation)
*   **초기 치료**: 저분자량 헤파린(LMWH), Fondaparinux 또는 NOAC(Rivaroxaban, Apixaban)을 즉시 시작합니다.
*   **유지 및 연장 치료**: 
    *   유발 인자가 있는 DVT: 최소 **3개월** 투여.
    *   유발 인자가 없거나 암 동반 환자: 재발 위험이 높으므로 **장기 투여**를 고려합니다.
*   **약제 선택**: 와파린(Warfarin) 사용 시 초기 5일간 헤파린계 약물과 병용(Bridge therapy)하며 INR 2.0-3.0 도달 후 단독 투여합니다.

---

## 3. 약사 전문 상담 및 모니터링
*   **출혈 징후 감시**: 항응고 치료 중 발생할 수 있는 주요 출혈 증상을 환자에게 교육합니다.
*   **합병증 예방**: **혈전 후 증후군(PTS)** 예방을 위해 압박 스타킹 착용과 적절한 활동을 권장합니다.
*   **상호작용**: 와파린 복용 환자는 비타민 K 함유 음식 및 다른 약물(NSAIDs 등)과의 상호작용에 대해 철저한 교육이 필요합니다.

---
*Reference: Korean Guideline for the Diagnosis and Treatment of Lower Extremity Deep Vein Thrombosis*`;

const integrated_md = `# 정맥혈전색전증 가이드라인 통합본

본 통합본은 하지 심부정맥 혈전증(DVT) 및 폐색전증(PE)을 포함하는 정맥혈전색전증(VTE)의 한국형 및 글로벌 진료지침을 종합하여 약학적 핵심 관리 포인트를 정리한 가이드입니다.

---

## 1. VTE 치료의 원칙
*   **항응고 요법의 즉각적 개시**: 혈전의 파급 및 치명적인 폐색전증을 막기 위해 신속하게 항응고 치료를 시작합니다.
*   **NOAC의 역할 확대**: 최근 지침은 와파린보다 사용이 간편하고 모니터링 부담이 적은 **NOAC(Rivaroxaban, Apixaban, Edoxaban, Dabigatran)**을 1차 약제로 선호합니다.

---

## 2. 약학적 중재 및 모니터링
*   **치료 기간 설정**: 유발 인자가 있는 첫 번째 VTE는 **3개월**간의 치료가 표준이며, 재발성 또는 암 동반 환자는 **무기한(Extended)** 치료를 검토합니다.
*   **출혈 위험 평가**: 치료 시작 전 및 과정 중에 출혈 위험을 상시 평가하며, 특히 고령자 및 신기능 저하 환자의 용량 조절에 유의합니다.

---

## 3. 약사 전문 복약 지도 포인트
*   **복약 이행도**: 항응고제의 미복용은 즉각적인 혈전 재발로 이어질 수 있음을 경고합니다.
*   **생활 습관 및 예방**: 장시간 여행 시 발목 운동 권장, 충분한 수분 섭취, 수술 전후 조기 보행 유도 등의 예방법을 안내합니다.
*   **응급 상황**: 갑작스러운 호흡 곤란이나 가슴 통증 발생 시 폐색전증 가능성을 염두에 두고 즉시 응급실로 방문하도록 지도합니다.

---
*본 통합본은 한국형 DVT 진료지침 및 최신 글로벌 VTE 가이드라인을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g36_md, 'g36']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '8. 정맥혈전색전증', integrated_md], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated individual and integrated summaries for VTE');
        db.close();
    });
});
