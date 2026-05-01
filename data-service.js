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
  return window.DB.drugs.filter(d => 
    d.name.toLowerCase().includes(q) || 
    d.ingredient?.toLowerCase().includes(q)
  );
}

/**
 * 요약 텍스트 내부의 약물명을 감지하여 링크로 변환 (스마트 인터링크)
 */
export function linkifySummary(text) {
  if (!text) return '';
  
  // 만약 배열(Array)인 경우, 각 요소를 처리한 후 불렛 포인트와 함께 합침
  if (Array.isArray(text)) {
    return text.map(item => `• ${linkifySummary(item)}`).join('<br>');
  }

  // 문자열이 아닌 경우 문자열로 강제 변환
  let linkedText = String(text);
  
  // 약물 리스트에서 키워드 추출 (이름이 긴 순서로 정렬하여 부분 매칭 방지)
  const drugKeywords = window.DB.drugs
    .map(d => d.name)
    .sort((a, b) => b.length - a.length);
  
  // 성분명/이름 매칭 (이미 링크가 걸린 부분은 제외하는 정교한 정규식은 성능상 생략하고 간단히 구현)
  drugKeywords.forEach(keyword => {
    // 단어 경계이거나 한글인 경우 체크하는 간단한 시각적 치환
    const regex = new RegExp(`(${keyword})`, 'g');
    linkedText = linkedText.replace(regex, `<span class="smart-link" onclick="window.app.navigateToDrugByName('$1')">$1</span>`);
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
