const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const summary5 = `# 부정맥 치료 및 관리 통합 지침 (심방세동 중심 전문가 가이드)

본 통합 지침은 심방세동(AFib)을 비롯한 주요 부정맥의 치료 원칙인 심박수 조절(Rate Control), 리듬 조절(Rhythm Control), 그리고 뇌졸중 예방 전략을 최신 가이드라인을 바탕으로 정리하였습니다.

---

## 1. 심박수 조절 (Rate Control) 전략
부정맥 증상 완화 및 빈맥 유발 심근병증 방지를 위해 심박수를 적절히 유지합니다.

*   **1차 약제**: **베타차단제** (Bisoprolol, Carvedilol 등) 또는 **비디하이드로피리딘계 CCB** (Diltiazem, Verapamil)를 사용합니다.
*   **심부전 동반 시**: CCB 사용을 금하며, 베타차단제와 **디곡신(Digoxin)**을 병용합니다.
*   **목표**: 안정 시 심박수 분당 **$80$–$110$회** 미만을 목표로 합니다.

---

## 2. 리듬 조절 (Rhythm Control) 요법
정상 맥박(동율동) 회복 및 유지를 위해 항부정맥제(AAD)를 선택하며, 환자의 **구조적 심질환 유무**가 선택의 핵심 기준입니다.

*   **심질환 없는 경우**: **Flecainide, Propafenone** (Class Ic) 등 강력한 약제 사용이 가능합니다.
*   **심부전/관상동맥질환 동반 시**: **아미오다론(Amiodarone)**이 가장 안전하고 효과적인 선택지입니다.
*   **주의**: 모든 항부정맥제는 새로운 부정맥을 유발할 수 있는 **부정맥 유발 효과(Proarrhythmia)**가 있으므로 심전도 모니터링이 필수적입니다.

---

## 3. 뇌졸중 예방 및 항응고 요법
심방세동 환자의 혈전 생성 억제를 위해 CHA₂DS₂-VASc 점수에 따라 항응고제를 투여합니다.

*   **DOACs (Apixaban, Edoxaban, Rivaroxaban, Dabigatran)**: 와파린보다 우선 권고되며, 정기적인 신기능(eGFR) 확인을 통한 용량 조절이 필수입니다.
*   **와파린 (Warfarin)**: 기계 판막 환자나 중등도 이상의 승모판 협착증 환자에게 사용하며, **INR 2.0~3.0** 범위를 유지합니다.

---

## 4. 약사 전문 모니터링 포인트
*   **아미오다론 특이 독성**: 장기 복용 시 **갑상선 기능 이상, 폐섬유화, 간독성**이 발생할 수 있으므로 정기 검사(TSH, CXR, AST/ALT)를 안내합니다.
*   **QT 간격 연장**: Sotalol, Amiodarone 등 사용 시 QT 연장에 따른 치명적 부정맥(Tdp) 위험을 심전도로 확인합니다.
*   **신기능 및 전해질**: 신배설 항부정맥제의 독성 방지를 위해 신기능을 확인하고, 저칼륨혈증($K+ < 3.5$)이 부정맥을 악화시키지 않도록 관리합니다.

---
*본 통합 요약은 2018-2024 부정맥 전문가 지침을 기반으로 작성되었습니다.*`;

const summary6 = `# 이상지질혈증 치료 및 관리 통합 지침 (2022 KAS & 보험 기준 종합)

본 지침은 한국지질-동맥경화학회(KAS)의 최신 가이드라인과 급여 기준을 바탕으로, 죽상경화성 심혈관질환(ASCVD) 예방을 위한 LDL-C 조절 목표와 약물 선택 기준을 제시합니다.

---

## 1. 위험군별 LDL-C 치료 목표
환자의 기저 질환에 따라 목표 수치를 차등화하여 강력하게 조절합니다.

*   **초고위험군 (급성관동맥증후군, 당뇨+표적장기손상)**: **$55$mg/dL 미만** 및 기저치 대비 $50\%$ 이상 감소.
*   **고위험군 (당뇨병 유병기간 10년 이상, CKD)**: **$70$mg/dL 미만**.
*   **중등도 위험군**: **$130$mg/dL 미만**.
*   **저위험군**: **$160$mg/dL 미만**.

---

## 2. 주요 약물 요법 (Lipid-lowering Therapy)
*   **스타틴 (Statins)**: **HMG-CoA 환원효소 억제제**로, 1차 치료제입니다. Atorvastatin, Rosuvastatin 등이 대표적입니다.
*   **에제티미브 (Ezetimibe)**: 스타틴 단독으로 목표치 도달 실패 시 SPC(복합제) 형태로 추가합니다.
*   **피브레이트 (Fibrate) / 오메가-3**: **중성지방(TG) $\ge 500$mg/dL**이거나 위험인자 동반 시 **$200$mg/dL** 이상일 때 췌장염 예방 및 심혈관 보호를 위해 투여합니다.

---

## 3. 보험 급여 및 처방 가이드
*   **복합형 고지혈증**: LDL-C와 TG가 모두 높은 경우 스타틴과 피브레이트/오메가-3 병용이 가능하나, 스타틴+피브레이트 병용 시 근육 독성(횡문근융해증) 위험에 주의합니다.
*   **오마코 (Omega-3)**: TG 수치 조절 및 심혈관 위험 요인 보유 시 급여 적용 범위를 확인합니다.

---

## 4. 약사 복약지도 포인트
*   **스타틴 부작용**: 원인 모를 근육통, 진한 소변색 등이 나타나면 즉시 상담하도록 안내합니다.
*   **복용 시간**: 간의 콜레스테롤 합성이 활발한 **저녁 시간** 복용을 권장합니다. (단, 작용 시간이 긴 Atorvastatin, Rosuvastatin은 무관)
*   **생활 습관**: 포화지방 및 당류 섭취 제한, 하루 $30$분 이상의 규칙적인 운동을 독려합니다.

---
*본 통합 요약은 2022 이상지질혈증 팩트시트 및 보험 기준을 기반으로 작성되었습니다.*`;

const summary7 = `# 뇌졸중 진료 및 이차 예방 통합 지침 (Stroke Pocketbook 종합)

본 지침은 뇌졸중의 급성기 관리와 재발 방지를 위한 이차 예방 전략을 중심으로, 항혈소판제 및 항응고제 사용 가이드를 전문적으로 정리하였습니다.

---

## 1. 급성기 뇌졸중 처치
*   **정맥내 혈전용해술 (IV Thrombolysis)**: 증상 발현 **$4.5$시간 이내** 방문 시 Alteplase 투여를 고려합니다.
*   **급성기 혈압 관리**: 혈전용해술 시행 여부에 따라 목표 혈압($< 185/110$ 또는 $< 220/120$ mmHg)을 엄격히 조절합니다.

---

## 2. 이차 예방을 위한 항혈전 요법
*   **비심장성 색전 (Non-cardioembolic)**: 죽상경화성 뇌졸중 환자에게는 **항혈소판제**를 투여합니다.
    *   **단독 요법**: 아스피린, 클로피도그렐, 실로스타졸(Cilostazol) 등.
    *   **단기 병용 (DAPT)**: 초기 $21$일 또는 $90$일간 아스피린+클로피도그렐 병용 후 단독으로 전환합니다.
*   **심장성 색전 (Cardioembolic, 심방세동)**: **항응고제(DOACs 또는 와파린)** 투여가 원칙이며 항혈소판제보다 효과적입니다.

---

## 3. 동반 위험 인자의 집중 관리
*   **고혈압**: 뇌졸중 재발 방지를 위해 ACEi/ARB 또는 이뇨제를 포함하여 **$140/90$ mmHg 미만**으로 조절합니다.
*   **이상지질혈증**: 허혈성 뇌졸중 환자에서 고용량 스타틴을 사용하여 **LDL-C < $70$mg/dL**를 달성합니다.
*   **당뇨병**: 인슐린 저항성 개선 및 심혈관 보호 효과가 입증된 Pioglitazone이나 최신 SGLT2i 등을 고려합니다.

---

## 4. 약사 상담 및 주의사항
*   **출혈 징후 감시**: 항혈전제 복용 환자에게 잇몸 출혈, 코피, 위장관 출혈 증상을 교육합니다.
*   **뇌압 조절 보조**: 필요 시 Mannitol 등을 사용하며 전해질 불균형을 모니터링합니다.

---
*본 통합 요약은 뇌졸중 진료지침 포켓북을 기반으로 작성되었습니다.*`;

const summary8 = `# 정맥혈전색전증(VTE) 진단 및 항응고 치료 통합 지침 (한국형 가이드라인)

본 지침은 하지 심부정맥 혈전증(DVT) 및 폐색전증(PE)의 합병증 예방을 위한 항응고 요법의 원칙을 담고 있습니다.

---

## 1. 치료의 목표
*   **급성기**: 혈전의 파급 및 폐색전증으로의 진행 방지.
*   **만성기**: 혈전 후 증후군(Post-thrombotic Syndrome) 예방 및 재발 방지.

---

## 2. 항응고 요법 (Anticoagulation)
*   **초기 치료**: 저분자량 헤파린(LMWH) 또는 DOACs(Rivaroxaban, Apixaban)를 즉시 시작합니다.
*   **유지 치료**: 경구 항응고제(DOACs 또는 와파린)를 최소 **$3$개월 이상** 복용할 것을 권장합니다. 유발 인자가 없는 경우 장기 복용을 고려합니다.

---

## 3. 약사 복약지도 포인트
*   **활동 격려**: 장시간 부동 자세를 피하고 하체 운동 및 압박 스타킹 착용을 권장합니다.
*   **출혈 주의**: 항응고 치료 중 심한 타박상이나 지혈되지 않는 상처 발생 시 즉시 내원하도록 안내합니다.

---
*본 통합 요약은 하지심부정맥혈전증 한국형 진료지침을 기반으로 작성되었습니다.*`;

db.serialize(() => {
    db.run("INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary", ['심혈관질환', '5. 부정맥', summary5]);
    db.run("INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary", ['심혈관질환', '6. 이상지질혈증', summary6]);
    db.run("INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary", ['심혈관질환', '7. 뇌졸중', summary7]);
    db.run("INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary", ['심혈관질환', '8. 정맥혈전색전증', summary8], (err) => {
        if (err) console.error('❌ Error updating database:', err);
        else console.log('✅ Successfully updated integrated summaries for 5, 6, 7, 8');
        db.close();
    });
});
