const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const g26_md = `# 2022 이상지질혈증 치료지침 5판 상세 요약 (한국지질·동맥경화학회)

본 지침은 죽상경화성 심혈관질환(ASCVD) 예방을 위한 LDL 콜레스테롤 조절 목표의 하향 조정과 최신 약물 요법인 PCSK9 억제제 및 Icosapent ethyl의 역할을 강조합니다.

---

## 1. 위험군별 LDL-C 치료 목표
*   **초고위험군 (ASCVD 환자)**: **$55$mg/dL 미만** 및 기저치 대비 **$50\\%$ 이상 감소** 권고.
*   **고위험군 (당뇨병 10년 이상 또는 추가 위험인자)**: **$70$mg/dL 미만**.
*   **중등도 위험군**: **$130$mg/dL 미만**.

---

## 2. 주요 약물 치료 전략
*   **스타틴 (Statin)**: 1차 선택 약제입니다. Atorvastatin, Rosuvastatin, Pitavastatin 등이 포함됩니다.
*   **에제티미브 (Ezetimibe)**: 스타틴 최대 관용 용량에도 목표치 미달 시 병용 투여합니다.
*   **PCSK9 억제제 (Alirocumab, Evolocumab)**: 초고위험군에서 스타틴+에제티미브 병용 후에도 목표 미달 시 추가를 고려합니다.
*   **Icosapent ethyl (IPE)**: 스타틴 치료 후에도 중성지방이 높은 ASCVD 환자에게 고려합니다.

---

## 3. 약사 전문 상담 및 모니터링
*   **스타틴 부작용**: 근육통, 근육 위약감(SAMS) 발생 시 CK 수치를 확인하고 필요 시 약물 중단 후 재평가합니다.
*   **당뇨병 발생 위험**: 스타틴 장기 복용 시 혈당 상승 가능성이 있으나, 심혈관 이득이 더 크므로 지속 복용을 독려합니다.

---
*Reference: KAS Dyslipidemia Guideline 5th Edition 2022*`;

const g27_md = `# 2022 이상지질혈증 치료지침 5판 요약본

주요 위험인자와 동반 질환에 따른 지질 관리 수치와 약물 시작 시점을 정리한 실무용 요약입니다.

---

## 1. 주요 심혈관질환 위험인자
*   흡연, 고혈압($\\ge 140/90$ mmHg), 낮은 HDL-C($< 40$ mg/dL), 조기 관상동맥질환 가족력, 연령(남 $\\ge 45$, 여 $\\ge 55$).

---

## 2. 치료 시작 기준 (LDL-C)
*   **초고위험군**: 수치와 관계없이 **즉시 스타틴** 시작.
*   **고위험군**: $\\ge 70$ mg/dL 시 시작.
*   **저위험군**: $\\ge 160$ mg/dL 시 시작 (생활습관 교정 우선).

---

## 3. 약사 모니터링 포인트
*   **지질 검사 시점**: 약물 시작 또는 변경 후 **4~12주** 이내에 추적 검사를 시행하여 목표 도달 여부를 확인합니다.
*   **비약물 요법**: 포화지방 및 트랜스지방 섭취 제한, 하루 30분 이상의 유산소 운동 교육을 병행합니다.

---
*Reference: KAS 2022 Summary*`;

const g29_md = `# 2022 Dyslipidemia Fact Sheet (대한민국 지질 관리 현황)

국내 이상지질혈증 환자의 유병률과 치료 현황을 분석한 자료로, 적극적인 지질 관리의 필요성을 시사합니다.

---

## 1. 국내 유병 현황
*   성인 5명 중 2명이 이상지질혈증을 보유하고 있으나, 조절률은 여전히 낮은 수준입니다.
*   **고콜레스테롤혈증**: 총 콜레스테롤 $\\ge 240$ mg/dL.

---

## 2. 동반 질환별 관리 실태
*   고혈압 및 당뇨병 환자의 대다수가 이상지질혈증을 동반하고 있으나, 목표 LDL-C 도달률은 학회 권고안에 비해 미흡합니다.
*   **생활습관**: 비만 및 복부 비만이 지질 수치 악화의 주요 요인으로 확인됩니다.

---
*Reference: KAS Fact Sheet 2022*`;

const g34_md = `# 고지혈증 치료 보험 급여 기준 개정 요약

건강보험 심사평가원의 지질강하제 처방 급여 인정 기준을 실무적으로 정리한 가이드입니다.

---

## 1. 스타틴 및 에제티미브 급여 기준
*   **관상동맥질환, 뇌졸중, 당뇨병**: LDL-C **$\\ge 100$ mg/dL** 시 급여 인정.
*   **위험요인 2개 이상**: LDL-C **$\\ge 130$ mg/dL** 시 급여 인정.
*   **위험요인 1개 이하**: LDL-C **$\\ge 160$ mg/dL** 시 급여 인정.

---

## 2. 중성지방(TG) 강하제 (피브레이트, 오마코)
*   **TG $\\ge 500$ mg/dL**: 즉시 급여 인정.
*   **위험요인/당뇨 동반 시**: TG **$\\ge 200$ mg/dL** 시 급여 인정.

---

## 3. 약사 중재 사항
*   보험 기준에 맞는 처방 여부를 확인하고, 환자의 기저 질환에 따른 본인 부담률 및 처방 가능 일수 등을 안내합니다.

---
*Reference: HIRA 2024 Criteria*`;

const integrated_md = `# 이상지질혈증 가이드라인 통합본

본 통합본은 한국지질·동맥경화학회(2022) 및 보험 급여 기준을 바탕으로, 지질 관리 목표와 약물 요법의 최신 트렌드를 약학적 관점에서 종합한 가이드입니다.

---

## 1. 위험도 기반 LDL-C 목표치 요약
*   **초고위험군 (ASCVD)**: **$55$mg/dL 미만** (Class I).
*   **고위험군 (당뇨, CKD)**: **$70$mg/dL 미만**.
*   **일반 목표**: 환자의 위험 요인(흡연, 고혈압 등) 수에 따라 **$130$-$160$mg/dL**로 설정합니다 (KAS 2022).

---

## 2. 주요 약물 요법 및 약사 중재
*   **Statin + Ezetimibe**: 최근 대규모 임상(RACING 연구 등)을 통해 저-중강도 스타틴과 에제티미브 복합제가 고강도 스타틴 단독 요법 대비 우수한 효과와 안전성을 입증하여 널리 사용됩니다.
*   **Fibrate & Omega-3**: 중성지방(TG)이 **$200$-$500$mg/dL**인 경우 심혈관 위험 감소를 위해 추가를 고려하며, 스타틴과 병용 시 근육 독성 위험을 주의 깊게 관찰합니다.
*   **PCSK9 억제제**: 초고위험군 환자 중 기존 약물로 목표 미달 시 주사제 형태의 이 약물을 병용합니다.

---

## 3. 약사 전문 복약 지도 포인트
*   **복용 시간**: 단기 작용 스타틴(Simvastatin, Lovastatin 등)은 저녁 복용이 필수이나, **Atorvastatin, Rosuvastatin, Pitavastatin**은 하루 중 아무 때나 복용 가능함을 안내합니다.
*   **근육통 자가 모니터링**: 이유 없는 근육통이나 진한 소변색 발생 시 즉시 상담하도록 지도합니다.
*   **보험 기준 확인**: 환자의 기저 질환에 따른 LDL-C 급여 인정 수치를 숙지하여 원활한 처방 상담을 지원합니다.

---
*본 통합본은 이상지질혈증 치료지침 5판 및 HIRA 보험 기준을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g26_md, 'g26']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g27_md, 'g27']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g29_md, 'g29']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g34_md, 'g34']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '6. 이상지질혈증', integrated_md], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated individual and integrated summaries for Dyslipidemia');
        db.close();
    });
});
