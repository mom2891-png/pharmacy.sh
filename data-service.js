// 데이터 서비스 모듈 (검색, 필터링, 상호 연결)
import { hierarchicalSort } from './utils.js';

/**
 * 전역 가이드라인 검색
 */
export function searchGuidelines(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return window.DB.guidelines.filter(g => 
    g.title.toLowerCase().includes(q) || 
    g.major?.toLowerCase().includes(q) || 
    g.sub?.toLowerCase().includes(q)
  );
}

/**
 * 전역 약물 검색
 */
export function searchDrugs(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const results = [];
  
  window.DB.drugs.forEach(d => {
    const matchingItems = (d.items || []).filter(item => 
      item.ingredient?.toLowerCase().includes(q) || 
      item.reference?.toLowerCase().includes(q)
    );
    if (matchingItems.length > 0) {
      matchingItems.forEach(item => {
        results.push({
          id: d.id,
          name: item.ingredient,
          ingredient: item.ingredient,
          reference: item.reference,
          major: d.major,
          sub: d.sub
        });
      });
    }
  });
  return results;
}

/**
 * 요약 텍스트 내부의 약물명을 감지하여 링크로 변환 (스마트 인터링크)
 */
export function linkifySummary(text) {
  if (!text) return '';
  
  if (Array.isArray(text)) {
    return text.map(item => `• ${linkifySummary(item)}`).join('<br>');
  }

  let linkedText = String(text);
  
  // 모든 약물 아이템의 성분명과 대조약을 키워드로 추출
  const keywords = [];
  window.DB.drugs.forEach(d => {
    (d.items || []).forEach(item => {
      if (item.ingredient) keywords.push(item.ingredient);
      if (item.reference) keywords.push(item.reference);
    });
  });

  // 링크에서 제외할 일반 단어 또는 화학 기호
  const BLACKLIST = ['Na', 'K', 'Cl', 'Ca', 'Mg', 'P', 'Cr', 'Hb', 'A1c', 'pH'];

  const drugKeywords = [...new Set(keywords)]
    .filter(k => k && k.length > 1 && !BLACKLIST.includes(k))
    .sort((a, b) => b.length - a.length);
  
  // HTML 태그 내부는 건드리지 않도록 정규식 개선
  drugKeywords.forEach(keyword => {
    // 1. 이미 링크된 부분은 건너뜀 (간단한 처리: 이미 <span>이 있으면 해당 단어는 무시될 확률이 높음)
    // 2. 단어 경계(\b)를 사용하여 부분 일치 방지 (Na -> Naproxen 방지)
    // 3. 한글 단어 경계 처리를 위해 \b 대신 비-단어 문자 체크 필요할 수 있음
    
    // 영어/숫자인 경우 \b 사용, 한글이 포함된 경우 수동 경계 체크
    const isLatin = /^[A-Za-z0-9\s-]+$/.test(keyword);
    // 한글의 경우 앞뒤에 문자가 붙어있지 않은 독립된 단어일 때만 매칭하도록 정규식 개선
    const regex = isLatin 
      ? new RegExp(`\\b(${keyword})\\b`, 'g')
      : new RegExp(`(?<=[^가-힣a-zA-Z0-9]|^)(${keyword})(?=[^가-힣a-zA-Z0-9]|$)`, 'g');

    // 이미 링크된 텍스트(<span>...</span>) 내부를 제외하고 매칭하는 것은 복잡하므로,
    // 간단하게 "태그 외부"만 매칭하도록 시도하거나, 매 루프마다 체크
    // 여기서는 가장 긴 단어부터 처리하므로 Naproxen이 먼저 처리되어 Na가 Naproxen 내부를 파괴하는 것은 \b로 방지됨
    linkedText = linkedText.replace(regex, (match, group, offset) => {
      // 매칭된 위치가 HTML 태그 내부인지 간단히 체크 (불완전하지만 일반적인 요약글에선 작동)
      const before = linkedText.substring(0, offset);
      const after = linkedText.substring(offset + match.length);
      
      // 앞에 < 가 있고 뒤에 > 가 있으면 태그 내부일 가능성 높음
      if (before.lastIndexOf('<') > before.lastIndexOf('>') && after.indexOf('>') < after.indexOf('<')) {
        return match;
      }
      
      return `<span class="smart-link" onclick="window.app.navigateToDrugByName('${keyword}')">${keyword}</span>`;
    });
  });
  
  return linkedText;
}

/**
 * 대분류 목록 가져오기 (정렬됨)
 */
export function getMajorCategories() {
  const majors = [];
  window.DB.guidelines.forEach(g => {
    if(g.major && !majors.includes(g.major)) majors.push(g.major);
  });
  return majors.sort(hierarchicalSort);
}

/**
 * 특정 대분류 아래의 중분류 및 가이드라인 맵 가져오기
 */
export function getSubcategories(majorName) {
  const subsMap = {};
  window.DB.guidelines.filter(g => g.major === majorName).forEach(g => {
    const subName = g.sub || "기타 가이드라인";
    if (!subsMap[subName]) subsMap[subName] = [];
    subsMap[subName].push(g);
  });
  return subsMap;
}
