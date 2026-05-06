const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const detailedSummary = {
  overview: "2021년 합의문은 심근경색 환자의 골든타임 확보와 최적의 재개통술(PCI/혈전용해) 전략을 다룹니다. [진단 및 결정] 증상 발현 10분 내 ECG 판독과 hs-TnI/T 추적을 통한 신속한 분류를 강조하며, 120분 내 PCI 불가능 시 10분 내 혈전용해제 투여(전송 전 전략)를 권고합니다. [치료 목표] Door-to-Balloon 90분(비이송) 또는 FMC-to-Balloon 120분(이송) 내 달성을 통해 TIMI flow grade 3 완전 관류와 LVEF 보존, 심실 재형성 방지를 목표로 합니다.",
  firstLine: [
    "항혈소판 부하 요법 (DAPT Loading): 시술 전 Aspirin 300mg + 강력한 P2Y12 억제제(Ticagrelor 180mg 또는 Prasugrel 60mg) 조기 투여",
    "항응고 요법: 시술 중 UFH(ACT 250~300초 유지) 또는 Enoxaparin을 통한 혈전 사건 방지",
    "2차 예방 핵심 약제 (Big 4): 시술 직후 고강도 스타틴(Atorvastatin 80mg 등), 24시간 내 베타차단제, ACEI/ARB 조기 도입",
    "혈전용해술: PCI 지연 시 Alteplase, Tenecteplase 등 혈전용해제 즉시 투여 고려"
  ],
  monitoring: [
    "DAPT 복약 순응도: 스텐트 혈전증 예방을 위해 시술 후 6~12개월간 '단 하루도 거르지 않는' 복약 이행 및 임의 중단 시 위험성 강력 지도",
    "조영제 유발 신병증 (CIN) 관리: 시술 전후 충분한 수액(0.9% Saline) 공급 확인 및 시술 후 48시간 신기능(eGFR) 추적 관찰",
    "메트포르민(Metformin) 복용 관리: 시술 당일 및 후 48시간 중단 지침 준수 확인 및 신기능 안정화 후 재개 시점 안내",
    "출혈 부작용 감시: 멍, 코피, 잇몸 출혈, 흑색변 등 항혈소판제 관련 출혈 징후 모니터링 및 자가 중단 방지 교육"
  ],
  cautions: [
    "약물 상호작용: Clopidogrel 사용 시 일부 PPI(Omeprazole, Esomeprazole)와의 상호작용 고려 및 대안 제제(Rabeprazole 등) 검토",
    "NSAIDs 사용 금지: 심근경색 후 NSAIDs는 허혈 사건 및 출혈 위험을 높이므로 아세트아미노펜 등으로 대체 가이드",
    "Prasugrel 주의군: 75세 이상, 60kg 미만, 뇌졸중/TIA 병력자에서 출혈 위험에 따른 용량 조절 또는 사용 제한"
  ],
  special: "약사 전문 상담 가이드: 1) 절대 금연 교육(가장 강력한 예후 개선 인자), 2) 스텐트 혈전증 예방을 위한 DAPT 복약 완수 강조, 3) 시술 중 No-reflow 발생 시 당단백 IIb/IIIa 억제제(Tirofiban 등) 사용 가능성 인지, 4) 하루 6g 미만 소금 섭취 및 규칙적 유산소 운동 권고"
};

db.run(
  'UPDATE guidelines SET aiSummary = ? WHERE id = ?',
  [JSON.stringify(detailedSummary), 'g14'],
  (err) => {
    if (err) {
      console.error('Update failed:', err);
    } else {
      console.log('Update successful for g14');
    }
    db.close();
  }
);
