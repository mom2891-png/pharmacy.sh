const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const summary = `# 심부전 치료 및 약물 요법 통합 지침 (약사 전문 가이드)

본 지침은 AHA/ACC/HFSA 2022, ESC 2023 Focused Update 및 국내 역학 자료(KSHF 2022)를 바탕으로, 심부전의 단계별 진단 및 핵심 약물 요법(GDMT)인 'The Fantastic Four'를 약학적 관점에서 심층 분석합니다.

---

## 1. 심부전의 정의 및 목표 요약
*   **분류**: $LVEF \\le 40\\%$ (HFrEF), $41$–$49\\%$ (HFmrEF), $\\ge 50\\%$ (HFpEF).
*   **치료 목표**: 증상 완화, 삶의 질 개선, 사망률 및 재입원율 감소를 위해 **초기부터 적극적인 GDMT 도입**이 핵심입니다 (ESC 2023).

---

## 2. 'The Fantastic Four' 핵심 약제군 심층 분석 (GDMT)
HFrEF 환자의 예후 개선을 위해 반드시 병용되어야 하는 4대 핵심 약제입니다.

### **① ARNI / ACEi / ARB (RAS 차단제)**
*   **ARNI (Sacubitril/Valsartan)**: 심박출률 감소 심부전에서 **1차 약제로 우선 권고**됩니다. Neprilysin 억제를 통해 Natriuretic peptide를 활성화하고 Angiotensin II를 차단합니다 (AHA/ACC 2022).
*   **복약 지도**:
    *   **Wash-out Period**: ACEi에서 ARNI로 전환 시 **$36$시간**의 휴약 기간이 필수입니다 (혈관부종 위험 방지).
    *   **혈압 모니터링**: 강력한 혈관 확장으로 초기 저혈압이 발생할 수 있으므로 점진적 증량이 필요합니다.

### **② 베타차단제 (Beta-blockers)**
*   **선택 약제**: Bisoprolol, Carvedilol, Metoprolol succinate가 입증된 약제입니다.
*   **복약 지도**:
    *   **Low and Slow**: 급성 비대상성 상태가 안정된 후, 아주 낮은 용량부터 시작하여 2~4주 간격으로 점진적으로 증량합니다.
    *   **서맥 및 피로감**: 초기 복용 시 나타날 수 있는 부작용을 설명하고 임의 중단을 방지합니다.

### **③ 알도스테론 길항제 (MRA)**
*   **약제**: Spironolactone, Eplerenone.
*   **복약 지도**:
    *   **고칼륨혈증 모니터링**: 특히 RAS 차단제와 병용 시 **$K+ > 5.0$ mEq/L** 이상으로 상승할 위험이 크므로 정기적인 혈액 검사를 안내합니다 (KSHF 2022).
    *   **여성형 유방**: Spironolactone 사용 시 발생 가능하며, 필요 시 Eplerenone으로 변경을 고려할 수 있습니다.

### **④ SGLT2 억제제 (SGLT2i)**
*   **약제**: Dapagliflozin, Empagliflozin.
*   **강점**: 박출률에 관계없이(HFrEF, HFmrEF, HFpEF 모두) **Class I**로 강력하게 권고됩니다 (ESC 2023).
*   **복약 지도**:
    *   **비뇨기계 위생**: 당뇨 유무와 관계없이 소변으로 당이 배출되므로 요로감염 및 생식기 감염 방지를 위한 위생 교육이 필수적입니다.
    *   **정상 혈당 케토산증(eDKA)**: 드물지만 발생 가능하므로 수술 전이나 심한 탈수 시 일시 중단(Sick day rules)을 안내합니다.

---

## 3. 약학적 중재: 복약 상담 및 모니터링
*   **GDMT 가속화 전략**: 과거와 달리 핵심 4제 요법을 **퇴원 전 또는 첫 6주 이내**에 신속하게 모두 도입할 것을 권고합니다 (ESC 2023).
*   **NSAIDs 금기**: NSAIDs는 나트륨 저류 및 신혈류 감소를 유발하여 심부전을 급격히 악화시키므로 사용을 절대 피해야 합니다.
*   **순응도 유지 (HFimpEF)**: 박출률이 정상 범위로 회복되었더라도 GDMT를 중단할 경우 다시 악화될 위험이 매우 높으므로 **지속 복용**을 강조합니다 (AHA/ACC 2022).
*   **정맥 철분 요법**: 철분 결핍(Ferritin < 100 등) 시 정맥 철분 보충이 입원 예방에 도움이 됨을 안내합니다 (ESC 2023).

---

## 4. 동반 질환 및 특수 약물 관리
| 동반 상황 | 약제 전략 | 근거 |
| :--- | :--- | :--- |
| **체액 저류 (부종)** | 루프 이뇨제 (Furosemide 등) | 증상 조절을 위해 최저 용량 유지 |
| **심방세동** | 항응고제 (DOAC) 및 베타차단제 | 뇌졸중 예방 및 심박수 조절 |
| **만성 콩팥병** | RAS 차단제/MRA 용량 조절 | eGFR 및 전해질 수시 확인 |
| **당뇨병** | SGLT2i 우선 고려 | 심혈관 및 신장 보호 동시 추구 |

---
*본 통합 지침은 AHA/ACC/HFSA 2022, ESC 2023 Focused Update를 기반으로 약사 전문 실무를 위해 작성되었습니다.*`;

db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '2. 심부전', summary], (err) => {
    if (err) {
        console.error('❌ Error updating database:', err);
    } else {
        console.log('✅ Successfully updated integrated summary for Heart Failure with pharmacist focus');
    }
    db.close();
});
