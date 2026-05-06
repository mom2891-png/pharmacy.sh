const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

// 1. g35: 뇌졸중 진료지침 포켓북 (Expansion)
const g35_expanded_md = `# 뇌졸중 진료지침 포켓북 상세 분석 (대한뇌졸중학회)

본 지침은 급성기 뇌졸중의 초동 대처부터 재발 방지를 위한 강력한 이차 예방 전략까지의 핵심 임상 가이드를 제공합니다.

---

## 1. 급성기 허혈성 뇌졸중 관리 (Acute Ischemic Stroke)
*   **정맥내 혈전용해술 (IV Thrombolysis)**:
    *   **약제**: Alteplase (rt-PA) $0.9$mg/kg (최대 $90$mg).
    *   **골든타임**: 증상 발생 **$4.5$시간 이내**.
    *   **금기 사항**: 최근 3개월 내 뇌졸중/외상, 활동성 내출혈, 혈소판 $< 10$만, 혈당 $< 50$mg/dL 등.
*   **급성기 혈압 조절**: 
    *   혈전용해술 대상자: **$< 185/110$ mmHg** 유지 필수.
    *   비대상자: $220/120$ mmHg 이상인 경우에만 완만하게 강하.

---

## 2. 이차 예방을 위한 항혈전 요법 (Secondary Prevention)
*   **비심장성 색전성 (Non-cardioembolic)**:
    *   **항혈소판제**: Aspirin($100$mg), Clopidogrel($75$mg), Cilostazol($200$mg) 단독 요법 권고.
    *   **DAPT (이중 항혈소판 요법)**: 경증 뇌졸중 또는 고위험군 TIA 발병 후 **초기 21~90일간** Aspirin + Clopidogrel 병용 권고 (CHANCE/POINT 연구 기반).
*   **심장성 색전성 (Cardioembolic / AFib)**:
    *   **항응고제**: NOAC (Apixaban, Rivaroxaban 등) 또는 Warfarin 투여. 뇌졸중 크기와 중증도에 따라 **'1-3-6-12 법칙'**에 의거하여 시작 시점을 결정합니다.

---

## 3. 위험 인자 집중 관리 (Risk Factor Control)
*   **혈압**: 이차 예방 목표 **$< 140/90$ mmHg** (일부 고위험군 $< 130/80$ mmHg 고려).
*   **지질**: 죽상경화성 뇌졸중 환자에서 **LDL-C $< 70$ mg/dL** (또는 기저치 대비 $50\\%$ 이상 감소)를 목표로 강력한 스타틴 요법 시행.
*   **당뇨**: HbA1c $< 7.0\\%$ 목표로 개별화된 혈당 관리.

---

## 4. 약사 전문 복약 지도 및 안전 관리
*   **출혈 징후 교육**: 항혈전제 복용 환자에게 멍, 코피, 잇몸 출혈, 흑색변 등 출혈 징후를 교육하고 발생 시 즉시 의료진에게 알리도록 지도합니다.
*   **복약 순응도**: 뇌졸중은 재발 시 치명률이 급격히 높아지므로, "증상이 없어도 혈관을 보호하기 위해 평생 복용해야 한다"는 점을 강력히 인지시킵니다.

---
*Reference: Stroke Clinical Practice Guidelines Pocketbook (KSS)*`;

// 2. 통합 가이드라인 (Stroke Integrated V1)
const integrated_stroke_v1 = `# 뇌졸중 가이드라인 통합본 (Pharmacist-Focused)

본 통합본은 대한뇌졸중학회의 최신 지침과 글로벌 스탠다드를 종합하여, 급성기 대처와 만성기 관리를 위한 약학적 표준을 제시합니다.

---

## 1. 급성기 대처 및 혈전용해술
*   **Time is Brain**: 증상 발생(안면마비, 언어장애, 편마비) 즉시 혈전용해술이 가능한 응급실 방문이 최우선입니다.
*   **Alteplase 관리**: 정밀한 체중당 용량 계산 및 투여 전후 혈압 모니터링이 생존율과 예후를 결정합니다.

---

## 2. 재발 방지를 위한 맞춤형 항혈전 전략
*   **항혈소판제 선택**: 환자의 기저 질환(협심증, 당뇨 등)과 위장관 출혈 위험을 고려하여 Aspirin, Clopidogrel, Cilostazol 중 최적의 약제를 선택합니다.
*   **항응고제 전환**: 심방세동 동반 뇌졸중 환자의 경우 NOAC 사용이 표준이며, 신기능에 따른 정밀 용량 조절이 수반되어야 합니다.

---

## 3. 약학적 중재 및 환자 모니터링
*   **집중 지질 관리**: 뇌졸중 환자는 일반 고혈압 환자보다 더 낮은 LDL-C 목표($<70$ mg/dL)가 요구됩니다.
*   **병용 약물 체크**: 항혈전제와 NSAIDs 병용 시 출혈 위험이 수배 상승하므로 진통제 처방 시 주의 깊게 확인합니다.
*   **생활 습관 교육**: 금연, 절주, 저염식은 약물 치료만큼이나 강력한 뇌졸중 예방 효과를 가집니다.

---
*본 통합본은 뇌졸중 진료지침 전수 조사 및 고도화 작업을 거쳐 최종 완성되었습니다.*`;

db.serialize(() => {
    db.run('UPDATE guidelines SET aiSummary = ? WHERE id = ?', [g35_expanded_md, 'g35']);
    db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '7. 뇌졸중', integrated_stroke_v1], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully completed sequential upgrade for Stroke: g35 expanded first, then Integrated Summary finalized.');
        db.close();
    });
});
