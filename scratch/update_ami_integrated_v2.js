const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const summary = `# 급성심근경색증 가이드라인 통합본

본 통합본은 대한심장학회(2011-2021) 전문가 합의안을 바탕으로, 급성심근경색(STEMI/NSTEMI)의 긴급 재개통 전략과 예후 개선을 위한 **약물 요법**을 약학적 관점에서 상세히 다룹니다.

---

## 1. 재개통술 및 초기 약물 전략 요약
*   **골든타임**: FMC-to-Balloon $120$분 내 PCI 시행이 원칙입니다 (Class I).
*   **항응고**: 시술 중 UFH 또는 Enoxaparin을 사용하여 혈전 생성을 차단합니다.

---

## 2. 주요 약물 요법 상세 분석 (GDMT)
심실 재형성 방지와 재발 억제를 위한 약제군별 핵심 포인트입니다.

### **① 이중 항혈소판 요법 (DAPT)**
*   **부하 요법 (Loading)**: 아스피린 **$300$mg** + 강력한 P2Y12 억제제(**Ticagrelor $180$mg** 또는 **Prasugrel $60$mg**)를 PCI 전 조기 투여합니다 (AHA/ACC 2021).
*   **유지 요법**: 최소 **$12$개월**간 유지를 강력히 권고합니다. 출혈 위험이 높은 한국인 환자의 경우 1개월 후 Clopidogrel로의 강도 조절(De-escalation)을 고려할 수 있습니다 (KSH 2021).
*   **약사 중재**: 스텐트 혈전증 방지를 위한 복약 순응도 교육 및 PPI 상호작용(특히 Omeprazole/Clopidogrel)을 확인합니다.

### **② 지질 강하 요법 (High-intensity Statins)**
*   **목표**: 초고위험군으로서 **LDL-C < $55$mg/dL** 및 기저치 대비 $50\\%$ 이상 감소를 목표로 고강도 스타틴(Atorvastatin 40/80mg 등)을 사용합니다.
*   **약사 중재**: 조기 투여의 중요성을 강조하고 부작용(근육통 등)을 모니터링합니다.

### **③ 베타차단제 (Beta-blockers)**
*   **역할**: 혈역학적으로 안정된 후 **$24$시간 내** 시작하며, 최소 **$1$년 이상** 유지를 권고합니다 (Class I).
*   **목표 심박수**: 분당 **$55$–$60$회**로 조절합니다.

### **④ ACE 억제제 / ARB**
*   **역할**: 전벽 심근경색, $LVEF < 40\\%$, DM, CKD 동반 환자에게 필수적이며 심실 재형성을 억제합니다.
*   **약사 중재**: 신기능 및 혈청 칼륨 수치를 정기적으로 모니터링합니다.

### **⑤ 알도스테론 길항제 (MRA)**
*   **역할**: ACEi/BB 사용 중에도 $LVEF \\le 35\\%$ 이면서 심부전 증상이나 당뇨 동반 시 추가를 고려합니다.

---

## 3. 약학적 중재 및 복약 상담
*   **Triple Whammy 주의**: 신기능 보호를 위해 고혈압 약제(ACEi/ARB) 및 이뇨제 복용 중 **NSAIDs 병용을 절대 금기**해야 함을 안내합니다 (KSH 2022).
*   **출혈 징후 교육**: DAPT 복용 환자에게 흑색변, 잇몸 출혈, 피하 멍 등 출혈 증상을 인지하도록 교육합니다.
*   **임의 중단 방지**: 치과 치료나 수술 전 반드시 전문의와 상의해야 하며, 아스피린/P2Y12 억제제의 임의 중단이 치명적일 수 있음을 경고합니다.

---
*본 통합본은 대한심장학회 급성심근경색증 전문가 합의안(2011-2021)을 기반으로 작성되었습니다.*`;

db.run('INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) ON CONFLICT(major, sub) DO UPDATE SET summary = EXCLUDED.summary', ['심혈관질환', '4. 급성심근경색증', summary], (err) => {
    if (err) {
        console.error('❌ Error updating database:', err);
    } else {
        console.log('✅ Successfully updated integrated summary for AMI');
    }
    db.close();
});
