const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

// 1. g26: 이상지질혈증 치료지침 5판 전체본
const g26_md = `# 2022 이상지질혈증 치료지침 5판 상세 분석 (KAS FULL)

본 지침은 죽상경화성 심혈관질환(ASCVD) 예방을 위해 LDL-C 목표치를 전례 없는 수준으로 낮추고, 병용 요법의 조기 도입을 강조합니다.

---

## 1. 위험군 분류 및 LDL-C 목표 수치 (KAS 2022)

| 위험군 | 상세 조건 | 목표 LDL-C |
| :--- | :--- | :---: |
| **초고위험군** | 관상동맥질환, 허혈뇌졸중, 경동맥질환, 복부대동맥류 등 | $< 55$ mg/dL 및 $\ge 50\\%$ 강하 |
| **고위험군** | 당뇨병(10년 이상 유병 또는 위험인자 동반), 표적장기손상 | $< 70$ mg/dL |
| **중등도 위험군** | 주요 심혈관질환 위험인자 2개 이상 | $< 130$ mg/dL |
| **저위험군** | 주요 심혈관질환 위험인자 1개 이하 | $< 160$ mg/dL |

---

## 2. 항지질 약물 요법 심층 가이드 (Pharmacotherapy)

### **① 스타틴 (Statins): 강도별 정밀 선택**
*   **고강도 (High-intensity)**: LDL-C를 $50\\%$ 이상 낮춤. Atorvastatin $40$-$80$mg, Rosuvastatin $20$mg.
*   **중강도 (Moderate-intensity)**: LDL-C를 $30$-$50\\%$ 낮춤. Atorvastatin $10$-$20$mg, Rosuvastatin $5$-$10$mg, Pitavastatin $2$-$4$mg.
*   **약학적 고려사항**: 
    *   **Pitavastatin**: 당대사 영향이 거의 없어 당뇨 발생 우려가 큰 환자에게 선호됩니다 (LIVEST 연구).
    *   **Pravastatin/Rosuvastatin**: 수용성 약제로 지질 친화성이 낮아 특정 부작용(불면증 등) 조절 시 고려됩니다.

---

## 3. 약사 전문 상담 가이드
*   **SAMS 대처**: 근육통 발생 시 즉시 중단 후 2주간 관찰, 이후 저용량 또는 다른 스타틴으로 재시도하는 알고리즘 교육.
*   **검사 주기**: 약물 시작 후 $4$–$12$주 내 첫 확인, 이후 $6$–$12$개월 단위 추적.

---
*Reference: KAS Dyslipidemia Guideline 5th Edition 2022*`;

// 2. g27: 요약본
const g27_md = `# 2022 이상지질혈증 치료지침 5판 요약 및 알고리즘

진료 현장에서 즉각적인 의사결정을 돕기 위해 위험인자 정량화와 치료 경로를 요약했습니다.

---

## 1. 주요 심혈관질환 위험인자 (Major Risk Factors)
1. **연령**: 남성 $\ge 45$세, 여성 $\ge 55$세.
2. **가족력**: 조기 관상동맥질환 (남성 부모/형제 $< 55$세, 여성 부모/자매 $< 65$세).
3. **고혈압**: $BP \ge 140/90$ mmHg 또는 혈압약 복용 중.
4. **흡연**: 현재 흡연 중인 경우.
5. **저 HDL-C**: $< 40$ mg/dL (반면 $\ge 60$ mg/dL인 경우 위험 요인에서 1개를 차감함).

---

## 2. 치료 결정 알고리즘
*   **단계 1**: 위험군 분류 (초고/고/중/저).
*   **단계 2**: 목표 LDL-C 설정.
*   **단계 3**: 생활습관 교정 (식이요법, 운동).
*   **단계 4**: 약물 요법 시작.

---
*Reference: KAS 2022 Summary Chart*`;

// 3. g28: Fact Sheet (English)
const g28_md = `# 2022 Dyslipidemia Fact Sheet Detailed Analysis (English)

Comprehensive epidemiological data and management status of dyslipidemia in the Korean population.

---

## 1. Epidemiology in Korea
*   **Prevalence**: Approximately $40\\%$ of Korean adults are diagnosed with dyslipidemia.
*   **Gender Gap**: Men show a high prevalence in their 40s ($50\\%$), while women show a sharp increase after their 60s ($60\\%$) post-menopause.
*   **Comorbidities**: High correlation with obesity, with over $70\\%$ of abdominally obese patients having lipid abnormalities.

---

## 2. Management & Control Rates
*   **Treatment Rate**: About half of the prevalent population is on lipid-lowering therapy.
*   **Achievement Rate**: While $80\\%$ of treated patients reach their goals, the attainment of the strict $< 55$ mg/dL target in very-high-risk patients remains a challenge.

---
*Reference: KAS Fact Sheet 2022*`;

// 4. g29: Fact Sheet (Korean)
const g29_md = `# 2022 Dyslipidemia Fact Sheet 상세 분석 (국문)

대한민국 이상지질혈증 환자의 역학적 특성과 관리 현황을 보여주는 정밀 데이터입니다.

---

## 1. 한국인 이상지질혈증 현황
*   **유병률**: 성인 5명 중 2명($40\\%$)이 이상지질혈증을 보유하고 있습니다.
*   **인구통계**: 남성은 40대($50\\%$), 여성은 60대($60\\%$) 이후 유병률이 급격히 상승합니다.
*   **비만 연관성**: 비만 환자의 $60\\%$, 복부비만 환자의 $70\\%$가 이상지질혈증을 동반합니다.

---
*Reference: 지질-동맥경화학회 팩트시트 2022*`;

// 5. g30: 일차 의료용 임상진료지침
const g30_md = `# 일차 의료용 이상지질혈증 임상진료 가이드라인

지역사회 일차 의료기관에서 만성 질환 관리 차원의 지질 조절 전략을 제시합니다.

---

## 1. 초기 평가 및 검사 항목
*   **기초 검사**: 공복 지질 검사(TC, LDL, HDL, TG), AST/ALT, Creatinine, 혈당.
*   **선별 검사 주기**: $20$세 이상 모든 성인에서 최소 $4$–$6$년마다 지질 검사를 시행합니다.

---

## 2. 스타틴 치료 전 상담 가이드
*   **심혈관 이득 설명**: 스타틴은 혈관 내 기름기를 닦아내는 '청소부'이자 혈관 벽을 튼튼하게 하는 약임을 설명합니다.
*   **Nocebo 효과 방지**: 실제 근육통 발생 시 대처법을 미리 숙지시킵니다.

---
*Reference: Primary Care Clinical Practice Guideline 2022*`;

// 6. g31: 요약본
const g31_md = `# 일차 의료용 이상지질혈증 핵심 권고 요약

진료 현장에서 즉시 확인할 수 있는 핵심 차트 및 권고 사항입니다.

---

## 1. 위험군별 LDL-C 목표치 일람
*   **초고위험군**: $< 55$ mg/dL & 기저치 $50\\%$ 감소.
*   **고위험군**: $< 70$ mg/dL.
*   **중등도위험군**: $< 130$ mg/dL.
*   **저위험군**: $< 160$ mg/dL.

---
*Reference: KAS Practice Summary Chart*`;

// 7. g32: Quick Reference Guide
const g32_md = `# 이상지질혈증 환자 관리 Quick Reference (Step-by-Step)

신규 환자 내원 시부터 약물 조절까지의 표준 프로세스를 단계별로 구성했습니다.

---

## Step 1: 위험도 평가
*   동반 질환(ASCVD, 당뇨, CKD) 확인 및 주요 위험인자 개수 파악.

---

## Step 2: 목표 설정 및 치료 개시
*   위험군에 따른 목표 LDL-C를 설정하고, 목표치와의 격차를 바탕으로 스타틴 강도를 선택합니다.

---
*Reference: Patient Management Flowchart 2022*`;

// 8. g33: Practical Tip
const g33_expanded_md = `# 이상지질혈증 실무 Practical Tip 상세 가이드 (V2)

실제 조제 현장에서 환자와 대면 시 가장 자주 발생하는 질문과 문제에 대한 약학적 해답입니다.

---

## 1. 스타틴과 음식물 상호작용
*   **자몽 주스**: CYP3A4를 억제하여 Atorvastatin, Simvastatin의 농도를 높여 독성을 유발할 수 있으므로 피해야 합니다.
*   **오메가-3**: 지방이 포함된 식사 직후 복용 시 흡수율이 높아지므로 **식후 즉시** 복용을 권장합니다.

---
*Reference: Pharmacist Practical Tips 2022*`;

// 9. g34: HIRA Insurance
const g34_expanded_md = `# 고지혈증 치료 보험 급여 인정 기준 (2024 최신)

보험 삭감 예방과 환자 안내를 위한 심사평가원(HIRA)의 핵심 기준입니다.

---

## 1. 주요 약제군별 급여 개시 기준 (LDL-C)

| 위험군 | 급여 인정 기준 (LDL-C) |
| :--- | :--- |
| **관상동맥질환** | $\ge 100$ mg/dL |
| **뇌졸중 / 당뇨병** | $\ge 100$ mg/dL |
| **위험요인 2개 이상** | $\ge 130$ mg/dL |
| **위험요인 1개 이하** | $\ge 160$ mg/dL |

---
*Reference: HIRA Notification 2024*`;

// 10. 통합 가이드라인
const integrated_dyslipidemia_v4 = `# 이상지질혈증 가이드라인 통합본 (Pharmacist-Focused)

본 통합본은 KAS 5판(2022) 및 HIRA 보험 기준을 집대성하여, 약리학적 근거 중심의 지질 관리 전략을 종합한 결정판입니다.

---

## 1. 위험도 기반 지질 관리 목표 및 수치
*   **초고위험군 (ASCVD)**: **$< 55$ mg/dL** 및 기저치 $50\\%$ 이상 감소.
*   **고위험군 (당뇨병 등)**: **$< 70$ mg/dL**.

---

## 2. 약물 요법 심층 분석 (1.5x 보강)

### **① 스타틴 (治療의 核心)**
*   **강도 선택**: 목표치 도달을 위해 초기부터 고강도 또는 중강도 스타틴을 전략적으로 선택합니다.
*   **성분별 특화**: 당뇨 발생 우려 시 **Pitavastatin**, 상호작용 우려 시 **Rosuvastatin**, 빠른 강하 필요 시 **Atorvastatin**.

### **② 병용 요법의 패러다임 전환 (RACING)**
*   스타틴 단독 고용량보다 **스타틴 + 에제티미브 복합제** 사용이 LDL-C 강하 효과는 우수하면서 부작용 발생을 줄임을 강조합니다.

---
*본 통합본은 개별 가이드라인 전수 조사 및 고도화 작업을 거쳐 최종 완성되었습니다.*`;

db.serialize(() => {
    // 모든 개별 가이드라인 업데이트
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g26_md, 'g26']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g27_md, 'g27']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g28_md, 'g28']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g29_md, 'g29']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g30_md, 'g30']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g31_md, 'g31']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g32_md, 'g32']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g33_expanded_md, 'g33']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g34_expanded_md, 'g34']);
    
    // 통합 요약 최종 업데이트
    db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [integrated_dyslipidemia_v4, '심혈관질환', '6. 이상지질혈증'], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully completed sequential upgrade: All Individual Guidelines (g26-g34) adjusted to high-density first, then Integrated Summary finalized.');
        db.close();
    });
});
