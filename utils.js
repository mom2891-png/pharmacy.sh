// 유틸리티 함수 모듈

/**
 * HTML 특수문자 이스케이프
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 문자열 앞의 숫자("1.", "1.2.", "10." 등) 기준 계층적 정렬 비교 함수
 */
export function hierarchicalSort(a, b) {
  const getNums = str => {
    const m = String(str || '').match(/^([\d.]+)/);
    return m ? m[1].split('.').filter(x => x !== '').map(Number) : [Infinity];
  };
  const numsA = getNums(a);
  const numsB = getNums(b);
  for (let i = 0; i < Math.max(numsA.length, numsB.length); i++) {
    const nA = numsA[i] ?? 0;
    const nB = numsB[i] ?? 0;
    if (nA !== nB) return nA - nB;
  }
  return 0;
}
