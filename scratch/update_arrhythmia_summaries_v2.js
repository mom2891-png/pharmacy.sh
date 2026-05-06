const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const g22_md = `# 2018 심방세동 환자의 항응고 요법 권고안 상세 요약

본 권고안은 심방세동 환자의 뇌졸중 및 전신 색전증 예방을 위한 와파린 및 비판막성 심방세동 환자에서의 NOAC(DOAC) 사용 기준을 제시합니다.

---

## 1. 항응고 요법의 적응증 (CHA₂DS₂-VASc)
*   **남성 2점 이상, 여성 3점 이상**: 항응고 요법 강력 권고 (Class I).
*   **남성 1점, 여성 2점**: 환자의 선호도 및 출혈 위험을 고려하여 항응고 요법 고려 (Class IIa).
*   **0점 (남성), 1점 (여성)**: 항응고 요법 권고되지 않음.

---

## 2. 약제 선택 및 용량 조절
*   **와파린 (Warfarin)**: 기계 판막 또는 중등도 이상의 승모판 협착증이 있는 판막성 심방세동 환자에게 필수적입니다. 목표 INR은 **2.0-3.0**입니다.
*   **NOAC (Apixaban, Edoxaban, Rivaroxaban, Dabigatran)**: 비판막성 심방세동 환자에서 와파린보다 우선 권고됩니다.
*   **약사 중재 (신기능 모니터링)**: 모든 NOAC은 신배설 비율이 다르므로, **Cockcroft-Gault 공식**에 따른 CrCl 측정이 필수입니다. 
    *   Dabigatran: CrCl < 30 mL/min 시 금기.
    *   기타 NOAC: CrCl 15-30 mL/min 범위에서 용량 감량 또는 주의 사용.

---

## 3. 약사 모니터링 및 복약 지도
*   **출혈 관리**: 고령, 신기능 저하, 항혈소판제 병용 환자에서 출혈 징후(잇몸 출혈, 흑색변 등)를 면밀히 관찰합니다.
*   **상호작용**: P-gp 및 CYP3A4에 영향을 주는 약물(Amiodarone, Ketoconazole 등) 병용 시 NOAC 농도 변화에 주의합니다.

---
*Reference: The Korean Journal of Medicine 2018*`;

const g23_md = `# 부정맥 특수 상황 및 고위험군 약물치료 가이드

부정맥 환자 중 심부전, 관상동맥질환, 만성 콩팥병 등 복합 질환을 가진 고위험군을 위한 전문 약학 지침입니다.

---

## 1. 구조적 심질환 동반 환자의 약제 선택
*   **심부전(HFrEF) 동반**: 리듬 조절 시 **Amiodarone**이 유일하게 안전한 선택지입니다. Class Ic(Flecainide 등)는 금기입니다.
*   **관상동맥질환 동반**: 베타차단제와 Amiodarone을 선호하며, Flecainide 등은 부정맥 유발 위험으로 피해야 합니다.

---

## 2. 만성 콩팥병(CKD) 환자 관리
*   **항응고제**: CrCl이 감소함에 따라 NOAC 용량을 조정하거나 중증($<15$ mL/min) 시 와파린 사용을 고려합니다.
*   **항부정맥제**: Sotalol 등 신배설 약제는 QT 연장 위험이 급격히 증가하므로 사용 시 용량 조절 및 ECG 감시가 필수입니다.

---

## 3. 약사 전문 모니터링
*   **Amiodarone 독성**: 갑상선(TSH), 폐(CXR), 간(AST/ALT) 기능을 최소 6개월 단위로 정기 점검하도록 안내합니다.
*   **전해질 관리**: 저칼륨혈증($K+ < 3.5$)은 항부정맥제의 부정맥 유발 효과를 증폭시키므로 엄격히 관리합니다.

---
*Reference: Clinical Practice Guidelines for Special Populations 2018*`;

const g24_md = `# 심방세동 환자의 심박수 조절(Rate Control) 지침

심방세동 환자의 증상 완화 및 심박수 유발 심근병증 방지를 위한 표준 약물 치료 가이드입니다.

---

## 1. 1차 선택 약제
*   **베타차단제**: 심부전이나 관상동맥질환 동반 환자에게 최우선적으로 권고됩니다.
*   **Non-DHP CCB (Diltiazem, Verapamil)**: 심부전이 없는 환자에서 효과적이며 베타차단제 대용으로 사용 가능합니다.

---

## 2. 2차 및 보조 약제
*   **디곡신 (Digoxin)**: 활동량이 적은 고령 환자나 심부전 동반 환자에서 추가 요법으로 사용됩니다.
*   **복약 지도**: 디곡신은 치료 영역이 좁으므로 독성 증상(오심, 시각 장애 등)을 확인하고 신기능에 따른 용량 조절이 필요합니다.

---

## 3. 치료 목표 심박수
*   **관대한 조절 (Lenient)**: 안정 시 분당 **110회 미만**.
*   **엄격한 조절 (Strict)**: 증상이 지속될 경우 분당 **80회 미만**을 목표로 합니다.

---
*Reference: KJM 2018*`;

const g25_md = `# 비판막성 심방세동 동율동 조절(Rhythm Control) 지침

정상 맥박 회복 및 유지를 위한 항부정맥제(AAD) 사용의 안전성과 유효성을 극대화하기 위한 지침입니다.

---

## 1. 항부정맥제 선택 원칙
*   **구조적 심질환 없음**: Flecainide, Propafenone(Class Ic)을 우선 사용하며 'Pill-in-the-pocket' 전략이 가능합니다.
*   **심부전/관상동맥질환**: **Amiodarone**이 1차 권고됩니다. Dronedarone은 중증 심부전 환자에게 사망률 증가 위험으로 금기입니다.

---

## 2. 안전성 모니터링 (ECG)
*   **QRS 폭**: Class Ic 사용 시 QRS 폭이 $50\\%$ 이상 증가하면 중단을 고려합니다.
*   **QTc 간격**: Class III(Sotalol, Amiodarone) 사용 시 **QTc > 500ms** 초과 시 Torsades de Pointes 위험이 크므로 즉시 조치해야 합니다.

---

## 3. 약사 전문 상담
*   **Pill-in-the-pocket**: 발작성 심방세동 환자에게 증상 발생 시 즉시 복용법을 정확히 교육하고 첫 복용은 반드시 의료기관에서 감시하에 수행하도록 안내합니다.

---
*Reference: EKJM 2018*`;

const integrated_md = `# 부정맥 가이드라인 통합본

본 통합본은 심방세동(AFib)을 비롯한 주요 부정맥의 치료 전략(심박수 조절, 리듬 조절, 뇌졸중 예방)을 약학적 관점에서 종합한 가이드입니다.

---

## 1. 뇌졸중 예방 전략 (항응고 요법)
*   **CHA₂DS₂-VASc 평가**: 남성 2점, 여성 3점 이상 시 항응고 요법이 필수입니다.
*   **NOAC 우선 권고**: 비판막성 환자에게 와파린보다 우선 권고되며, **CrCl에 기반한 개별 용량 조절**이 약사 중재의 핵심입니다 (KJM 2018).

---

## 2. 심박수 및 리듬 조절 전략
*   **Rate Control**: 베타차단제 또는 Non-DHP CCB를 사용하며 안정 시 **110회 미만**을 1차 목표로 합니다.
*   **Rhythm Control**: 환자의 기저 심질환 여부에 따라 약제를 선택합니다. 
    *   구조적 심질환이 있다면 **Amiodarone**이 가장 안전한 선택입니다.
    *   심부전 환자에게 **Dronedarone**은 절대 금기입니다.

---

## 3. 약학적 모니터링 및 복약 지도
*   **Amiodarone 장기 독성**: 폐, 갑상선, 간 기능을 정기적으로 모니터링해야 함을 강조합니다.
*   **QT 연장 및 전해질**: Sotalol, Amiodarone 사용 시 저칼륨혈증을 방지하고 QTc 간격을 수시로 확인하여 치명적 부정맥(Tdp)을 예방합니다.
*   **복용 순응도**: 항응고제 임의 중단 시 뇌졸중 위험이 급격히 증가함을 반복적으로 교육합니다.

---
*본 통합본은 대한심장학회 및 관련 부정맥 지침(2018)을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g22_md, 'g22']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g23_md, 'g23']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g24_md, 'g24']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g25_md, 'g25']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '5. 부정맥', integrated_md], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated individual and integrated summaries for Arrhythmia');
        db.close();
    });
});
