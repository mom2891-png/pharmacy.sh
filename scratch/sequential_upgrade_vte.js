const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

// 1. g36: 하지심부정맥혈전증 진단과 치료 (Expansion)
const g36_expanded_md = `# 하지심부정맥혈전증(DVT) 진단과 치료 상세 분석 (한국형 가이드라인)

본 지침은 하지 정맥에서 발생한 혈전이 폐동맥을 막는 치명적인 폐색전증(PE)으로 진행되는 것을 막기 위한 정밀 항응고 전략을 제시합니다.

---

## 1. 정맥혈전색전증(VTE)의 진단 및 위험도 평가
*   **임상 증상**: 갑작스러운 하지 부종, 통증, 피부색 변화(청색/적색).
*   **검사**: D-dimer 검사(음성 배제용) 및 하지 정맥 초음파(Compression Ultrasonography)를 통해 확진합니다.
*   **유발 인자 분류**:
    *   **Provoked (유발)**: 수술, 외상, 장기 부동, 임신, 호르몬제 복용 등.
    *   **Unprovoked (비유발)**: 원인을 알 수 없는 경우 (재발 위험 높음).

---

## 2. 약물 치료: 항응고 요법 (Anticoagulation Strategy)
*   **초기 치료 (Initial)**: 
    *   **NOAC 우선 권고**: Rivaroxaban, Apixaban은 초기부터 단독 투여 가능. Edoxaban, Dabigatran은 LMWH 5일 투여 후 전환.
    *   **Warfarin**: 투여 초기 혈전 유발 가능성으로 인해 반드시 헤파린계 약물과 **5일 이상 병용(Overlap)**해야 합니다.
*   **유지 기간 (Duration)**:
    *   유발 인자가 있는 첫 VTE: **3개월** 투여 후 중단 고려.
    *   비유발 또는 재발성 VTE: 출혈 위험이 낮다면 **장기(무기한)** 투여 고려.
    *   암 동반 환자 (CAT): 최소 6개월 이상 투여하며, 최근 NOAC 사용이 늘고 있으나 위장관 암 등에서는 LMWH를 선호할 수 있습니다.

---

## 3. 약사 전문 상담 및 모니터링
*   **복약 이행도**: 항응고 요법 중단 시 며칠 내로 재발할 수 있음을 강력히 경고합니다.
*   **상호작용 주의**: 세인트존스워트, Rifampin 등 NOAC 농도를 낮추는 약물과 Itraconazole 등 농도를 높이는 약물을 철저히 체크합니다.
*   **합병증 교육**: 혈전 후 증후군(PTS) 예방을 위한 압박 스타킹 착용법과 다리 올리기 등 생활 습관을 안내합니다.

---

## 4. 응급 상황 대처 (PE 의심 증상)
*   항응고 치료 중에도 갑작스러운 **호흡 곤란, 흉통, 각혈**이 발생하면 폐색전증(PE) 가능성을 염두에 두고 즉시 응급실 방문을 지도합니다.

---
*Reference: Korean Guideline for DVT Diagnosis and Treatment*`;

// 2. 통합 가이드라인 (VTE Integrated V1)
const integrated_vte_v1 = `# 정맥혈전색전증 가이드라인 통합본 (Pharmacist-Focused)

본 통합본은 하지 심부정맥 혈전증(DVT)과 폐색전증(PE)을 아우르는 최신 정맥혈전색전증(VTE) 관리 지침을 약학적 관점에서 종합한 가이드입니다.

---

## 1. VTE 치료의 핵심: 항응고 요법의 표준화
*   **NOAC의 1차 약제화**: 모니터링의 편의성과 낮은 출혈 위험으로 인해 NOAC이 와파린을 대체하여 표준 치료로 자리 잡았습니다.
*   **치료 기간의 개별화**: 환자의 혈전 유발 인자 유무에 따라 3개월 단기 치료와 무기한 연장 치료를 명확히 구분하여 상담합니다.

---

## 2. 고위험군 및 특수 환자 관리
*   **암 동반 환자 (CAT)**: 암 환자는 일반인보다 혈전 위험이 수배 높으며, 항암제와의 상호작용 및 출혈 위험을 고려한 정밀한 약물 선택이 필요합니다.
*   **고령자 및 신부전**: 신기능에 따른 NOAC 용량 조절이 치료의 성패를 좌우합니다.

---

## 3. 약사의 역할: 안전한 항응고 요법 지원
*   **출혈 관리**: 항응고제 사용 중 발생할 수 있는 주요/미세 출혈을 모니터링하고 환자에게 조기 발견법을 교육합니다.
*   **생활 예방 지도**: 장거리 비행 시 운동법, 수술 전후 예방적 항응고 요법의 중요성을 안내하여 VTE 발생 자체를 억제하는 데 기여합니다.

---
*본 통합본은 정맥혈전색전증 진료지침 전수 조사 및 고도화 작업을 거쳐 최종 완성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g36_expanded_md, 'g36']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '8. 정맥혈전색전증', integrated_vte_v1], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully completed sequential upgrade for VTE: g36 expanded first, then Integrated Summary finalized.');
        db.close();
    });
});
