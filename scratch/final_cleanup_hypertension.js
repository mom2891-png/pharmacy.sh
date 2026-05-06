const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const g4_md = `# 2023 고혈압 진료지침 요약본 (KSH)

진료 현장에서 즉시 활용 가능한 고혈압 진단, 분류 및 약물 치료 시작 기준 요약입니다.

---

## 1. 혈압의 분류 및 진단
*   **고혈압**: $140/90$ mmHg 이상.
*   **주의 혈압**: $120$-$129 / 80$ mmHg 미만.
*   **목표 혈압**: 일반 고혈압 환자 $< 140/90$ mmHg, 합병증 동반 시 $< 130/80$ mmHg.

---

## 2. 약물 치료 원칙
*   **1차 약제**: ACEi, ARB, CCB, 이뇨제 중 선택.
*   **병용 요법**: 목표 혈압 도달을 위해 기전이 다른 두 약제의 병용(SPC 권장)을 적극 고려합니다.

---
*Reference: KSH Clinical Practice Guidelines 2023 Summary*`;

const g9_md = `# 2023 Hypertension Fact Sheet (Korea)

대한민국 고혈압 유병률, 인지율, 치료율 및 조절률 현황을 분석한 통계 자료입니다.

---

## 1. 주요 통계
*   국내 고혈압 유병자 수는 지속적으로 증가하여 약 1,200만 명에 육박합니다.
*   **조절률**: 치료를 받는 환자 중 목표 혈압에 도달하는 비율은 약 $70\\%$ 수준으로 개선이 필요합니다.

---
*Reference: KSH Hypertension Fact Sheet 2023*`;

const g10_md = `# Korean Society of Hypertension (KSH) Guidelines 2023 (English)

English version of the clinical practice guidelines for the management of hypertension in Korea.

---

## 1. Key Recommendations
*   Emphasis on out-of-office BP measurement (HBPM, ABPM) for accurate diagnosis.
*   Strong recommendation for **Single Pill Combinations (SPC)** to improve adherence.

---
*Reference: KSH 2023 English Edition*`;

const g12_md = `# 고혈압 실무 가이드 (약사/의료진용 Practical Guide)

임상 현장에서 고혈압 환자 상담 시 유용한 실무 팁과 주의사항을 정리했습니다.

---

## 1. 올바른 혈압 측정 지도
*   등받이가 있는 의자에 앉아 5분간 휴식 후 측정.
*   커프의 높이를 심장 높이와 맞출 것을 강조합니다.

---

## 2. 복약 상담 팁
*   **백의 고혈압/가면 고혈압**: 진료실 밖 혈압 측정의 중요성을 설명하여 과잉 투여나 과소 투여를 방지합니다.
*   **저염식**: 하루 소금 섭취량을 6g(나트륨 2.4g) 이하로 줄일 것을 구체적으로 안내합니다.

---
*Reference: Practical Guide for Hypertension Management*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g4_md, 'g4']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g9_md, 'g9']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g10_md, 'g10']);
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g12_md, 'g12'], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully cleaned up final JSON summaries in Hypertension');
        db.close();
    });
});
