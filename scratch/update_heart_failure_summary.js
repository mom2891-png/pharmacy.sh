const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const summary = `# 심부전 치료 및 관리 통합 지침 (2022-2024 글로벌 & 국내 종합)

본 통합 지침은 최신 미국(AHA/ACC/HFSA 2022), 유럽(ESC 2023 Focused Update) 가이드라인 및 국내 역학 자료(KSHF Fact Sheet 2022)를 종합하여, 심부전의 단계별 진단과 'The Fantastic Four'로 불리는 핵심 약물 요법(GDMT)을 중심으로 정리한 전문 약사 가이드입니다.

---

## 1. 심부전의 단계별 정의 및 분류 (New Stages)
심부전은 증상이 나타나기 전부터 적극적인 예방과 개입이 필요한 진행성 질환입니다.

*   **진행 단계 (AHA/ACC Stages)**:
    *   **Stage A (At-Risk)**: 증상은 없으나 고혈압, 당뇨 등 위험 인자 보유 단계.
    *   **Stage B (Pre-HF)**: 증상은 없으나 심장 구조적 이상이나 BNP 상승이 확인된 단계.
    *   **Stage C (Symptomatic)**: 현재 또는 과거에 심부전 증상이 발현된 상태. (집중적인 GDMT 필요)
    *   **Stage D (Advanced)**: 적극적 약물 치료에도 증상이 조절되지 않는 말기 단계.
*   **박출률(LVEF)에 따른 분류**:
    *   **HFrEF**: $LVEF \le 40\%$ (박출률 감소 심부전)
    *   **HFmrEF**: $LVEF 41$–$49\%$ (박출률 경미 감소 심부전)
    *   **HFpEF**: $LVEF \ge 50\%$ (박출률 보존 심부전)

---

## 2. 핵심 약물 요법 (The Fantastic Four: GDMT)
HFrEF 환자의 사망률과 입원율을 낮추기 위해 반드시 병용되어야 하는 4가지 핵심 약제군입니다.

1.  **ARNI / ACEi / ARB**: 
    *   **ARNI (Sacubitril/Valsartan)**를 1차 약제로 우선 권고합니다. (ACEi에서 전환 시 **$36$시간**의 휴약 기간 필수)
2.  **베타차단제 (Beta-blockers)**: 
    *   Bisoprolol, Carvedilol, Metoprolol succinate가 주로 사용됩니다.
3.  **알도스테론 길항제 (MRA)**: 
    *   Spironolactone, Eplerenone 등을 사용하여 섬유화 및 심장 재형성을 방지합니다.
4.  **SGLT2 억제제 (SGLT2i)**: 
    *   Dapagliflozin, Empagliflozin이 해당하며, 최근에는 **박출률에 관계없이(HFrEF, HFmrEF, HFpEF 모두)** 강력하게 권고(Class I)되는 추세입니다.

---

## 3. 최신 치료 패러다임의 변화
*   **GDMT의 가속화**: 과거에는 순차적으로 한 종류씩 도입했으나, 최신 지침은 **퇴원 전 및 첫 6주 이내**에 4제 요법을 모두 도입하고 목표 용량까지 빠르게 증량할 것을 권장합니다.
*   **HFpEF 치료의 진전**: 과거 마땅한 치료제가 없던 HFpEF 환자에게도 SGLT2i가 입원 및 심혈관 사망 감소 효과를 입증하여 필수 약제로 자리 잡았습니다.
*   **정맥 철분 요법**: 철분 결핍이 동반된 심부전 환자에게 정맥 철분 보충(Ferric carboxymaltose 등)이 입원율 감소 및 삶의 질 개선을 위해 강력히 권고됩니다.

---

## 4. 국내 역학 현황 및 시사점 (KSHF Fact Sheet)
*   **국내 유병률**: 2018년 기준 **2.24%**이며, 고령화에 따라 급격히 증가하고 있습니다. 특히 80세 이상의 12%가 심부전 환자입니다.
*   **입원 부담**: 심부전 의료비의 70% 이상이 입원 관련 비용이며, 퇴원 후 1년 내 25%가 재입원합니다. 따라서 **퇴원 후 초기 1개월 내의 집중 관리**가 매우 중요합니다.

---

## 5. 약사 전문 복약지도 및 모니터링 포인트
*   **부작용 교육**: 
    *   **저혈압**: ARNI/ACEi 및 베타차단제 증량 시 어지러움 주의.
    *   **고칼륨혈증**: RAS 차단제와 MRA 병용 시 K+ 수치 정기 모니터링 ($> 5.0$ mEq/L 시 주의).
    *   **신기능 저하**: 약물 조절 시 eGFR 변화 확인.
*   **SGLT2i 특이 사항**: 비뇨기계 감염 방지를 위한 위생 관리 및 정상 혈당 상태에서의 케토산증(eDKA) 위험성 교육.
*   **순응도 강조**: "박출률 개선 심부전(HFimpEF)"으로 심장 기능이 회복되었더라도, 임의로 약을 중단하면 재악화 위험이 크므로 **지속적인 복용**을 독려합니다.

---
*본 통합 요약은 AHA/ACC/HFSA 2022 및 ESC 2023 Focused Update, KSHF Fact Sheet 2022를 기반으로 작성되었습니다.*`;

db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [summary, '심혈관질환', '2. 심부전'], (err) => {
    if (err) {
        console.error('❌ Error updating database:', err);
    } else {
        console.log('✅ Successfully updated integrated summary for Heart Failure');
    }
    db.close();
});
