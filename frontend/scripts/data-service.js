// 데이터 서비스 모듈 (\uAC80\uC0C9, 필터링, 상호 연결)
import { hierarchicalSort } from './utils.js';

/**
 * 전역 \uAC00\uC774\uB4DC\uB77C\uC778 \uAC80\uC0C9
 */
export function searchGuidelines(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return window.DB.guidelines.filter(g => 
    !g.is_deleted && (
      g.title.toLowerCase().includes(q) || 
      g.major?.toLowerCase().includes(q) || 
      g.sub?.toLowerCase().includes(q)
    )
  );
}

/**
 * 전역 \uC57D\uBB3C \uAC80\uC0C9
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
 * \uC694\uC57D 텍스트 내부의 \uC57D\uBB3C명을 감지하여 링크로 변환 (스마트 인터링크)
 */
export function linkifySummary(text) {
  if (!text) return '';
  
  if (Array.isArray(text)) {
    return text.map(item => `• ${linkifySummary(item)}`).join('<br>');
  }

  let linkedText = String(text);
  
  // 모든 \uC57D\uBB3C 아이템의 성분명과 대조약을 키워드로 추출
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
    // 특수문자 (괄호 등) 이스케이프 처리
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 한글의 경우 앞뒤에 문자가 붙어있지 않은 독립된 단어일 때만 매칭하도록 정규식 개선
    const regex = isLatin 
      ? new RegExp(`\\b(${escapedKeyword})\\b`, 'g')
      : new RegExp(`(?<=[^가-힣a-zA-Z0-9]|^)(${escapedKeyword})(?=[^가-힣a-zA-Z0-9]|$)`, 'g');

    // 이미 링크된 텍스트(<span>...</span>) 내부를 제외하고 매칭하는 것은 복잡하므로,
    // 간단하게 "태그 외부"만 매칭하도록 시도하거나, 매 루프마다 체크
    // 여기서는 가장 긴 단어부터 처리하므로 Naproxen이 먼저 처리되어 Na가 Naproxen 내부를 파괴하는 것은 \b로 방지됨
    linkedText = linkedText.replace(regex, (match, group, offset) => {
      // 매칭된 위치가 HTML 태그 내부인지 간단히 체크 (불완전하지만 일반적인 \uC694\uC57D글에선 작동)
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
 * \uB300\uBD84\uB958 \uBAA9\uB85D 가져오기 (정렬됨)
 */
export function getMajorCategories() {
  const majorsSet = new Set();
  window.DB.guidelines.forEach(g => {
    if(!g.is_deleted && g.major) majorsSet.add(g.major);
  });
  
  const majors = Array.from(majorsSet);
  const metadata = window.DB.categoryMetadata || [];

  return majors.sort((a, b) => {
    // sub가 ''이거나 null인 metadata가 \uB300\uBD84\uB958 순서 \uC815\uBCF4
    const metaA = metadata.find(m => m.major === a && (!m.sub || m.sub === ''));
    const metaB = metadata.find(m => m.major === b && (!m.sub || m.sub === ''));
    
    const orderA = metaA ? (metaA.sort_order || 0) : 0;
    const orderB = metaB ? (metaB.sort_order || 0) : 0;
    
    if (orderA !== orderB) return orderA - orderB;
    return hierarchicalSort(a, b);
  });
}

/**
 * 특정 \uB300\uBD84\uB958 아래의 \uC911\uBD84\uB958 및 \uAC00\uC774\uB4DC\uB77C\uC778 맵 가져오기
 */
export function getSubcategories(majorName) {
  const subsMap = {};
  const metadata = window.DB.categoryMetadata || [];
  
  window.DB.guidelines.filter(g => !g.is_deleted && g.major === majorName).forEach(g => {
    const subName = g.sub || "\uAE30\uD0C0 \uAC00\uC774\uB4DC\uB77C\uC778";
    if (!subsMap[subName]) subsMap[subName] = [];
    subsMap[subName].push(g);
  });

  // \uC911\uBD84\uB958(Subcategory) 정렬
  const sortedSubNames = Object.keys(subsMap).sort((a, b) => {
    const metaA = metadata.find(m => m.major === majorName && m.sub === a);
    const metaB = metadata.find(m => m.major === majorName && m.sub === b);
    
    const orderA = metaA ? (metaA.sort_order || 0) : 0;
    const orderB = metaB ? (metaB.sort_order || 0) : 0;
    
    if (orderA !== orderB) return orderA - orderB;
    return hierarchicalSort(a, b);
  });

  // 정렬된 순서대로 맵 재구성
  const orderedMap = {};
  sortedSubNames.forEach(name => {
    orderedMap[name] = subsMap[name];
  });
  
  return orderedMap;
}
