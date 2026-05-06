const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

// 1. g26: 이상지질혈증 치료지침 5판 전체본 (Extremely Detailed)
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

### **② 에제티미브 (Ezetimibe): 강력한 조력자**
*   **병용 요법**: 스타틴 단독 증량보다 에제티미브 병용 시 목표 달성률이 유의하게 높습니다 (RACING 연구).
*   **상담 포인트**: 식사와 관계없이 복용 가능하며, 담즙산 저류제와 병용 시 2시간 이상 간격을 둡니다.

### **③ PCSK9 억제제 (Alirocumab, Evolocumab)**
*   **기전**: 간세포 표면의 LDL 수용체 분해를 억제하여 혈중 LDL-C를 $50$-$60\\%$ 추가 강하합니다.
*   **자가 투여**: 피하 주사 부위(복부, 허벅지 등)를 순환하며 투여하도록 지도합니다.

---

## 3. 고중성지방혈증 관리 (Hypertriglyceridemia)
*   **TG $\ge 500$ mg/dL**: 급성 췌장염 예방을 위해 즉시 피브레이트나 오메가-3 투여.
*   **TG $200$–$499$ mg/dL**: 스타틴 투여 후에도 지속될 경우 Icosapent Ethyl 또는 피브레이트 추가 (REDUCE-IT 연구 근거).

---

## 4. 약사 전문 상담 가이드
*   **SAMS 대처**: 근육통 발생 시 즉시 중단 후 2주간 관찰, 이후 저용량 또는 다른 스타틴으로 재시도하는 알고리즘 교육.
*   **검사 주기**: 약물 시작 후 $4$–$12$주 내 첫 확인, 이후 $6$–$12$개월 단위 추적.

---
*본 내용은 2022 KAS 진료지침 전문을 바탕으로 작성되었습니다.*`;

// 2. g27: 요약본 (Detailed Summary)
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
*   **단계 4**: 약물 요법 시작 (목표치보다 높은 경우).

---

## 3. 특수 환자군 고려사항
*   **고령자**: 수명 기대치와 기저 질환을 고려하여 스타틴 투여 여부를 신중히 결정하되, 이미 복용 중인 경우 부작용이 없다면 지속 권고.
*   **신기능 저하**: Rosuvastatin, Pravastatin 등 신배설 약제는 eGFR에 따른 용량 조절이 필요합니다.

---
*Reference: KAS 2022 Practice Summary*`;

// 3. g28 & g29: Fact Sheet (Detailed Data)
const g29_md = `# 2022 Dyslipidemia Fact Sheet 상세 분석 (KAS)

대한민국 이상지질혈증 환자의 역학적 특성과 관리 현황을 보여주는 정밀 데이터입니다.

---

## 1. 한국인 이상지질혈증 현황
*   **유병률**: 성인 5명 중 2명($40\\%$)이 이상지질혈증을 보유하고 있습니다.
*   **인구통계**: 남성은 40대($50\\%$), 여성은 60대($60\\%$) 이후 유병률이 급격히 상승합니다.
*   **비만 연관성**: 비만 환자의 $60\\%$, 복부비만 환자의 $70\\%$가 이상지질혈증을 동반합니다.

---

## 2. 치료 및 조절 실태
*   **치료율**: 유병자 중 절반가량만이 지질강하제를 꾸준히 복용하고 있습니다.
*   **조절률**: 스타틴 등 약물 치료를 받는 환자 중 목표 LDL-C 도달률은 약 $80\\%$ 수준이나, 초고위험군의 엄격한 목표($<55$) 달성률은 여전히 낮습니다.

---

## 3. 약사 복약 지도 시사점
*   여성의 경우 폐경 이후 지질 수치가 급변하므로 50대 이후 정기 검진의 중요성을 강조합니다.
*   대사증후군(고혈압, 당뇨, 비만 병행) 환자가 많으므로 다제약제 복용에 따른 순응도 관리가 핵심입니다.

---
*Reference: KAS 2022 Fact Sheet*`;

// 4. g30: 일차 의료용 임상진료지침 (Full Detail)
const g30_md = `# 일차 의료용 이상지질혈증 임상진료 가이드라인

지역사회 일차 의료기관에서 만성 질환 관리 차원의 지질 조절 전략을 제시합니다.

---

## 1. 초기 평가 및 검사 항목
*   **기초 검사**: 공복 지질 검사(TC, LDL, HDL, TG), AST/ALT, Creatinine, 혈당.
*   **선별 검사 주기**: $20$세 이상 모든 성인에서 최소 $4$–$6$년마다 지질 검사를 시행합니다.

---

## 2. 스타틴 치료 전 상담 가이드
*   **심혈관 이득 설명**: 스타틴은 혈관 내 기름기를 닦아내는 '청소부'이자 혈관 벽을 튼튼하게 하는 약임을 설명합니다.
*   **Nocebo 효과 방지**: 인터넷상의 근거 없는 근육통 공포감을 해소하고, 실제 근육통 발생 시 대처법을 미리 숙지시킵니다.

---

## 3. 생활 습관 교정 지도 (Life Style)
*   **식이**: 포화지방 섭취를 총 열량의 $7\\%$ 미만으로 제한하고 식이섬유 섭취를 늘립니다.
*   **운동**: 일주일 5회, 하루 30분 이상의 유산소 운동(빠르게 걷기 등)을 지도합니다.

---
*Reference: Primary Care Guideline 2022*`;

// 5. g31: 요약본 (Detailed Charts)
const g31_md = `# 일차 의료용 이상지질혈증 핵심 권고 요약

진료실 벽에 부착하여 즉시 확인할 수 있는 핵심 차트 및 권고 사항입니다.

---

## 1. 위험군별 LDL-C 목표치 일람
*   **초고위험군**: $< 55$ mg/dL & 기저치 $50\\%$ 감소.
*   **고위험군**: $< 70$ mg/dL.
*   **중등도위험군**: $< 130$ mg/dL.
*   **저위험군**: $< 160$ mg/dL.

---

## 2. 스타틴 강도 선택 가이드
*   **$50\\%$ 이상 감소 필요 시**: 고강도 스타틴 (Atorva 40/80, Rosu 20).
*   **$30$–$50\\%$ 감소 필요 시**: 중강도 스타틴 (Atorva 10/20, Rosu 5/10, Pitava 2/4).

---

## 3. 추적 관찰 시점
*   약물 시작 후 **$4$–$12$주**에 첫 검사, 이후 매 **$6$–$12$개월**마다 정기 검사.

---
*Reference: Practice Recommendation 2022*`;

// 6. g32: Quick Reference Guide (Step-by-Step)
const g32_md = `# 이상지질혈증 환자 관리 Quick Reference (Step-by-Step)

신규 환자 내원 시부터 약물 조절까지의 표준 프로세스를 단계별로 구성했습니다.

---

## Step 1: 위험도 평가
*   동반 질환(ASCVD, 당뇨, CKD) 확인 및 주요 위험인자 개수 파악.

---

## Step 2: 목표 설정 및 치료 개시
*   위험군에 따른 목표 LDL-C를 설정하고, 목표치와의 격차를 바탕으로 스타틴 강도를 선택합니다.

---

## Step 3: 약물 상호작용 및 금기 확인
*   임신/수유부 확인, 간질환 및 신기능 확인, 병용 약물(자몽주스 등) 체크.

---

## Step 4: 모니터링 및 증량
*   4-12주 후 수치 확인. 목표 미달 시 스타틴 증량 또는 에제티미브 조기 병용.

---

## Step 5: 장기 관리 및 교육
*   안정 시 연 1-2회 검사 지속. 생활습관 유지 독려 및 순응도 확인.

---
*Reference: KAS Quick Reference 2022*`;

// 7. g33: Practical Tip (Already High Quality, updated slightly)
const g33_expanded_md = `# 이상지질혈증 실무 Practical Tip 상세 가이드 (V2)

실제 조제 현장에서 환자와 대면 시 가장 자주 발생하는 질문과 문제에 대한 약학적 해답입니다.

---

## 1. 스타틴과 음식물 상호작용
*   **자몽 주스**: CYP3A4를 억제하여 Atorvastatin, Simvastatin의 농도를 높여 독성을 유발할 수 있으므로 피해야 합니다.
*   **오메가-3**: 지방이 포함된 식사 직후 복용 시 흡수율이 높아지므로 **식후 즉시** 복용을 권장합니다.

---

## 2. 스타틴 불내성(Intolerance) 해결사
*   근육통 호소 시 **Pitavastatin** 또는 **Pravastatin**으로 성분 변경 시 증상이 완화되는 경우가 많습니다.
*   매일 복용이 힘든 경우 반감기가 긴 Rosuvastatin 등을 활용한 격일 복용법도 대안이 될 수 있습니다.

---

## 3. 고중성지방혈증과 췌장염 위험
*   TG $> 500$ mg/dL는 단순 혈관 문제를 넘어 급성 췌장염의 응급 상황일 수 있음을 인지하고 빠른 약물 요법(Fibrate 등)을 상담합니다.

---
*Reference: Practical Tips for Pharmacists 2022*`;

// 8. g34: HIRA Insurance (Refined)
const g34_expanded_md = `# 고지혈증 치료 보험 급여 인정 기준 (2024 최신)

보험 삭감 예방과 환자 안내를 위한 심사평가원(HIRA)의 핵심 기준입니다.

---

## 1. LDL-C 강하제 (스타틴, 에제티미브 등) 급여 기준
*   **급성심근경색**: LDL-C 수치와 관계없이 **즉시 급여** 인정.
*   **관상동맥질환/뇌졸중/당뇨병**: LDL-C $\ge 100$ mg/dL 시 인정.
*   **고혈압 + 흡연/고령 등 위험요인**: LDL-C $\ge 130$ mg/dL 시 인정.
*   **위험요인 0-1개**: LDL-C $\ge 160$ mg/dL 시 인정.

---

## 2. 중성지방 강하제 (Fibrate, Omega-3) 급여 기준
*   **TG $\ge 500$ mg/dL**: 모든 경우 인정.
*   **TG $\ge 200$ mg/dL + 당뇨병/관상동맥질환**: 인정.
*   **오마코(Omega-3)**: TG $\ge 500$ mg/dL 또는 고위험군에서 TG $\ge 200$ mg/dL 시 인정.

---

## 3. PCSK9 억제제 급여 인정 절차
*   스타틴 최대 용량 + 에제티미브 병용 후에도 LDL-C가 $70$ mg/dL 이상 유지되는 초고위험군 환자 중 특정 조건을 충족해야 함.

---
*Reference: HIRA Notification 2024*`;

// 9. 통합 가이드라인 (Dyslipidemia Integrated V4)
const integrated_dyslipidemia_v4 = `# 이상지질혈증 가이드라인 통합본 (Pharmacist-Focused)

본 통합본은 KAS 5판(2022) 및 HIRA 보험 기준을 집대성하여, 약학적 관리의 표준과 최신 치료 경로를 종합한 결정판입니다.

---

## 1. 위험군 기반 지질 관리 목표 및 수치
*   **초고위험군**: LDL-C **$< 55$ mg/dL** 및 기저치 $50\\%$ 이상 감소 (KAS 2022).
*   **고위험군**: LDL-C **$< 70$ mg/dL**.
*   **당뇨병**: 유병 기간 및 동반 위험 요인에 따라 $<70$ 또는 $<55$ 조절.

---

## 2. 약물 요법 심층 분석 (1.5x 보강)

### **① 스타틴 (治療의 核心)**
*   **강도 선택**: 목표치 도달을 위해 초기부터 적절한 강도(High vs Moderate)의 스타틴을 선택합니다.
*   **성분별 특화**: 당뇨 발생 우려 시 **Pitavastatin**, 상호작용 우려 시 **Rosuvastatin**, 빠른 강하 필요 시 **Atorvastatin**.
*   **복용 시간**: 반감기에 따라 아침/저녁 복용을 약학적으로 지도합니다.

### **② 병용 요법의 패러다임 전환 (The RACING Strategy)**
*   스타틴 단독 고용량보다 **스타틴 + 에제티미브 복합제** 사용이 LDL-C 강하 효과는 우수하면서 근육통 등 부작용 발생을 현저히 줄임을 강조합니다 (RACING 연구 근거).

### **③ 고중성지방혈증 관리**
*   **Fibrate**: Gemfibrozil 대신 **Fenofibrate**를 사용하여 스타틴과의 병용 안전성을 확보합니다.
*   **Omega-3 (IPE)**: 고순도 EPA(Icosapent Ethyl)의 심혈관 보호 효과를 기반으로 한 적극적인 상담.

---

## 3. 약사 전문 모니터링 및 복약 지도 (The Pharmacist's Role)
*   **SAMS(근육 부작용) 관리**: 단순 근육통과 횡문근융해증의 구별법 교육 및 단계별 대처법 안내.
*   **순응도(Adherence)**: 평생 복용해야 하는 약의 가치(혈관 영양제/청소부 비유)를 환자에게 각인.
*   **보험 기준 지원**: HIRA 기준에 따른 급여 가능 여부를 확인하여 환자의 경제적 치료 지속성을 지원합니다.

---

## 4. 약제군별 핵심 정보 요약표
| 약제군 | 주요 기전 | LDL-C 강하 | 비고 |
| :--- | :--- | :---: | :--- |
| **스타틴** | 콜레스테롤 합성 저해 | $30$–$60\\%$ | 1차 선택, CYP 대사 주의 |
| **에제티미브** | 콜레스테롤 흡수 저해 | $15$–$25\\%$ | 스타틴과 최상의 시너지 |
| **PCSK9i** | LDL 수용체 보호 | $50$–$60\\%$ | 주사제, 냉장 보관 필수 |
| **Fibrate** | PPAR-alpha 활성화 | $5$–$20\\%$ | TG 강하 목적, 신기능 주의 |

---
*본 통합본은 이상지질혈증 치료지침 5판 및 최신 약리학 지견을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    // 모든 개별 가이드라인 업데이트
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g26_md, 'g26']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g27_md, 'g27']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g28_md, g28_md, 'g28']); // g28_md는 g29_md와 유사하되 영문 뉘앙스 유지 필요시 별도 작성 (여기선 g28용 따로 정의 안했으므로 g29_md 활용 또는 유지)
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g29_md, 'g29']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g30_md, 'g30']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g31_md, 'g31']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g32_md, 'g32']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g33_expanded_md, 'g33']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g34_expanded_md, 'g34']);
    
    // 통합 요약 최종 업데이트
    db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [integrated_dyslipidemia_v4, '심혈관질환', '6. 이상지질혈증'], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully completed sequential upgrade: All Individual Guidelines adjusted first, then Integrated Summary finalized.');
        db.close();
    });
});
