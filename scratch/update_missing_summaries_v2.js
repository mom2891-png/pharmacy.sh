const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

// --- 5. 부정맥 추가 가이드라인 (g17~g21) ---
const g17_md = `# 일차 의료용 심방세동 권고 요약본 (대한의학회/대한부정맥학회)

일차 의료 현장에서 심방세동 환자를 신속하게 진단하고 상급 의료기관 전원 여부 및 항응고 요법 시작을 결정하기 위한 가이드라인입니다.

---

## 1. 진단 및 전원 기준
*   **진단**: 표준 12유도 심전도 또는 30초 이상의 단일 유도 심전도 기록을 통해 확진합니다.
*   **전원 고려**: 원인 불명의 실신, 약물 치료로 조절되지 않는 빈맥, 심부전 증상 동반 시 심장전문의에게 의뢰합니다.

---

## 2. 항응고 요법 (Stroke Prevention)
*   **CHA₂DS₂-VASc** 점수를 평가하여 고위험군(남 2, 여 3 이상)에게 NOAC 투여를 우선 고려합니다.
*   **복약 상담**: 항응고제 복용의 목적이 '증상 완화'가 아닌 '뇌졸중 예방'임을 명확히 인지시킵니다.

---
*Reference: Clinical Practice Guideline for Primary Care 2022*`;

const g18_md = `# 2022 심방세동 환자 NOAC 사용 지침 (대한부정맥학회)

비타민 K 비의존성 경구 항응고제(NOAC)의 올바른 선택, 용량 조절 및 특수 상황 대처법을 다룬 전문 지침입니다.

---

## 1. 약제별 용량 조절 (신기능 기반)
*   **Apixaban**: 연령($\ge 80$), 체중($\le 60$kg), SCr($\ge 1.5$mg/dL) 중 2가지 해당 시 감량(2.5mg bid).
*   **Rivaroxaban**: CrCl $15$-$49$mL/min 시 감량(15mg qd).
*   **Edoxaban**: CrCl $15$-$50$mL/min 또는 체중 $\le 60$kg 시 감량(30mg qd).
*   **Dabigatran**: CrCl $30$-$49$mL/min 시 감량(110mg bid) 고려.

---

## 2. 약사 전문 모니터링
*   **P-gp 상호작용**: Itraconazole, Cyclosporine 등 강한 P-gp 억제제 병용 시 NOAC 혈중 농도가 상승하여 출혈 위험이 커지므로 주의합니다.
*   **수술 전 중단**: 약제의 반감기와 환자의 신기능에 따라 수술 24~48시간 전 중단 스케줄을 관리합니다.

---
*Reference: KHRS NOAC Guideline 2022*`;

const g19_md = `# 심방세동 진료지침 (대한심장학회/대한부정맥학회)

심방세동의 전반적인 관리 전략인 'ABC 경로'를 중심으로 한 포괄적인 진료 지침입니다.

---

## 1. Atrial Fibrillation Better Care (ABC) 경로
*   **A (Anticoagulation)**: 뇌졸중 예방.
*   **B (Better symptom management)**: 심박수 및 리듬 조절을 통한 증상 개선.
*   **C (Cardiovascular risk & Comorbidity optimization)**: 동반 질환 관리.

---

## 2. 리듬 조절 (Rhythm Control) 전략
*   **적응증**: 심박수 조절에도 증상이 지속되거나, 젊은 환자, 심부전 동반 환자에서 고려합니다.
*   **약제**: Amiodarone, Flecainide, Propafenone, Sotalol 등을 기저 심질환에 맞춰 선택합니다.

---
*Reference: Clinical Practice Guideline for AF 2021*`;

const g20_md = `# 심방세동 위험인자 및 동반 질환 관리 가이드

심방세동을 유발하거나 악화시키는 고혈압, 심부전, 당뇨 등 기저 질환의 최적화된 관리 방안을 제시합니다.

---

## 1. 고혈압 관리
*   심방세동 발생 위험을 낮추기 위해 혈압을 **$130/80$ mmHg 미만**으로 조절할 것을 권고합니다. **RAS 차단제(ACEi/ARB)**가 선호됩니다.

---

## 2. 심부전 및 당뇨 관리
*   심부전 동반 시 베타차단제(Bisoprolol 등)를 통해 심박수를 조절하고, 당뇨 환자는 SGLT2 억제제 사용을 통해 심혈관 위험을 낮춥니다.

---
*Reference: Management of Comorbidities in AF 2021*`;

const g21_md = `# 심방세동 환자의 통합적 관리 지침

다학제적 접근을 통한 심방세동 환자의 장기 예후 개선 및 생활 습관 교정 지침입니다.

---

## 1. 환자 중심의 통합 관리
*   의사, 약사, 간호사가 협력하여 항응고 요법의 순응도를 높이고 생활 습관(절주, 체중 조절)을 교육합니다.
*   **순응도 측정**: 환자가 약을 제시간에 복용하고 있는지 정기적으로 확인하고 미복용 시 대처법을 반복 교육합니다.

---

## 2. 생활 습관 교정
*   **절주**: 알코올은 심방세동 발생의 직접적인 위험 인자이므로 엄격한 제한을 권고합니다.
*   **운동**: 중등도의 규칙적인 유산소 운동은 증상 조절에 도움이 됩니다.

---
*Reference: Integrated Management of Atrial Fibrillation 2021*`;

// --- 6. 이상지질혈증 추가 가이드라인 (g28, g30~g33) ---
const g28_md = `# Dyslipidemia Fact Sheet 2022 (English Version)

Epidemiological status of dyslipidemia in Korea, providing clinical statistics and management trends.

---

## 1. Prevalence in Korea
*   The prevalence of dyslipidemia among Korean adults continues to rise, especially in populations with obesity and metabolic syndrome.
*   **LDL-C Control**: Despite high awareness, the achievement rate of target LDL-C levels remains suboptimal in high-risk groups.

---
*Reference: KAS Fact Sheet 2022*`;

const g30_md = `# 일차 의료용 이상지질혈증 임상진료지침

일차 의료기관에서 이상지질혈증 환자를 선별하고 약물 치료를 시작하기 위한 표준 가이드입니다.

---

## 1. 약물 치료의 시작
*   위험군 분류에 따라 스타틴 치료 시작 기준을 결정합니다. 
*   **생활습관 교정**: 약물 시작 전후로 식이 요법과 운동을 병행하도록 강력히 권고합니다.

---

## 2. 약사 상담 포인트
*   **초기 투여 시**: 스타틴 복용 시 발생할 수 있는 근육통에 대해 설명하되, 과도한 불안감을 갖지 않도록 교육합니다.

---
*Reference: Primary Care Guideline 2022*`;

const g31_md = `# 일차 의료용 이상지질혈증 권고 요약본

진료 현장에서 즉시 활용 가능한 위험도 평가 및 목표 LDL-C 설정 요약표를 제공합니다.

---

## 1. LDL-C 목표치 (KAS 2022)
*   **초고위험군**: < 55 mg/dL.
*   **고위험군**: < 70 mg/dL.
*   **중등도위험군**: < 130 mg/dL.
*   **저위험군**: < 160 mg/dL.

---
*Reference: KAS Practice Summary 2022*`;

const g32_md = `# 일차 의료용 이상지질혈증 Quick Reference Guide

이상지질혈증 환자 관리 프로세스를 도식화하여 신속한 의사결정을 돕는 가이드입니다.

---

## 1. 관리 알고리즘
*   위험인자 수 확인 → 위험군 분류 → 목표 LDL-C 설정 → 스타틴 강도 선택 → 추적 관찰 및 약제 조절.

---
*Reference: KAS Quick Guide 2022*`;

const g33_md = `# 이상지질혈증 Practical Tip (약사/의료진용)

임상 실무에서 빈번하게 발생하는 문제 상황에 대한 해결 팁을 제공합니다.

---

## 1. 스타틴 불내성(Intolerance) 대처
*   스타틴 종류 변경, 용량 감량 또는 격일 복용 전략을 고려합니다.
*   **Ezetimibe 병용**: 스타틴 용량을 높이기 어려운 경우 에제티미브를 조기에 추가하여 목표치에 도달합니다.

---
*Reference: KAS Practical Tips 2022*`;

// --- 통합 요약 업데이트 (Sub 5, Sub 6) ---

const integrated_arrhythmia_v2 = `# 부정맥 가이드라인 통합본

본 통합본은 심방세동(AFib)을 비롯한 주요 부정맥의 치료 전략과 **통합적 환자 관리 경로(ABC)**를 약학적 관점에서 종합한 가이드입니다.

---

## 1. 뇌졸중 예방 전략 (Anticoagulation)
*   **CHA₂DS₂-VASc 평가**: 고위험군(남 2, 여 3 이상)에게 NOAC 투여가 강력히 권고됩니다 (KJM 2021).
*   **NOAC 용량 조절**: 연령, 체중, 신기능(CrCl)에 따른 약제별 정밀 감량 기준을 준수해야 합니다 (대한부정맥학회 2022).
*   **판막성 심방세동**: 기계 판막 또는 중등도 이상의 승모판 협착증 환자에게는 **와파린(Warfarin)**만이 유일한 표준입니다 (NOAC 금기).

---

## 2. 증상 및 리듬 관리 (Rate & Rhythm Control)
*   **Rate Control**: 베타차단제 또는 Non-DHP CCB를 우선 사용하며, 안정 시 심박수 **110회 미만**을 목표로 합니다.
*   **Rhythm Control**: 증상이 지속되는 환자에게 Amiodarone, Flecainide 등을 사용하며, 기저 심질환(심부전, 관상동맥질환) 여부에 따른 약제 선택이 중요합니다 (Flecainide 등 Class Ic는 구조적 심질환 시 금기).

---

## 3. 약사 전문 복약 지도 및 통합 관리 (ABC 경로)
*   **A (Anticoagulation)**: 뇌졸중 예방의 중요성 및 출혈 징후 교육.
*   **B (Better symptom management)**: 항부정맥제 부작용(QT 연장 등) 및 심박수 모니터링.
*   **C (Cardiovascular risk & Comorbidity)**: 고혈압, 당뇨 등 동반 질환 최적화 및 절주 등 생활 습관 교정 (ABC 경로 준수).
*   **상호작용 주의**: P-gp 및 CYP3A4 억제제 병용 시 NOAC 농도 변화를 수시로 확인합니다.

---
*본 통합본은 대한부정맥학회 2022 NOAC 지침 및 2021 심방세동 진료지침을 기반으로 작성되었습니다.*`;

const integrated_dyslipidemia_v2 = `# 이상지질혈증 가이드라인 통합본

본 통합본은 한국지질·동맥경화학회(2022)의 5판 지침과 일차 의료용 임상진료지침을 바탕으로, 위험도 기반 지질 관리 전략을 종합한 가이드입니다.

---

## 1. 위험도 기반 LDL-C 목표치 및 치료 시작
*   **초고위험군 (ASCVD)**: **$55$mg/dL 미만** 및 $50\\%$ 이상 감소를 목표로 하며, 즉시 스타틴을 시작합니다.
*   **고위험군 (당뇨 10년 이상 등)**: **$70$mg/dL 미만**을 목표로 합니다 (KAS 2022).
*   **저/중등도 위험군**: 생활습관 교정 후에도 목표치 미달 시 약물 요법을 고려합니다 ($130$-$160$mg/dL).

---

## 2. 주요 약물 요법 및 최신 트렌드
*   **강력한 강하 전략**: 스타틴 단독 요법보다 스타틴+에제티미브 병용 요법이 부작용은 줄이면서 목표 도달률을 높이는 전략으로 선호됩니다 (RACING 연구 등 반영).
*   **신규 약제 도입**: 기존 약물로 조절되지 않는 초고위험군에게 PCSK9 억제제 사용이 권고되며, 고중성지방혈증 관리를 위해 Icosapent ethyl의 역할이 강조됩니다.

---

## 3. 약사 전문 상담 및 실무 팁
*   **스타틴 불내성 관리**: 근육통 발생 시 약제 변경, 용량 감량 또는 격일 복용법을 통해 순응도를 유지합니다 (Practical Tips).
*   **복용 지도**: 아토르바스타틴, 로수바스타틴 등 장기 작용 약제는 시간에 관계없이 복용 가능함을 안내하고, 건강기능식품(오메가-3 등)과의 병용 시 중복 여부를 확인합니다.
*   **급여 기준 준수**: HIRA 보험 인정 기준(LDL-C 시작 수치 등)을 확인하여 환자의 경제적 부담을 최소화하는 상담을 지원합니다.

---
*본 통합본은 이상지질혈증 치료지침 5판 및 일차 의료용 임상지침(2022)을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    // 개별 요약 업데이트
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g17_md, 'g17']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g18_md, 'g18']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g19_md, 'g19']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g20_md, 'g20']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g21_md, 'g21']);
    
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g28_md, 'g28']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g30_md, 'g30']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g31_md, 'g31']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g32_md, 'g32']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g33_md, 'g33']);
    
    // 통합 요약 업데이트
    db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [integrated_arrhythmia_v2, '심혈관질환', '5. 부정맥']);
    db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [integrated_dyslipidemia_v2, '심혈관질환', '6. 이상지질혈증'], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated missing individual guidelines and enhanced integrated summaries');
        db.close();
    });
});
