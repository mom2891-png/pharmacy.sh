// 뷰 렌더러 모듈 (UI 생성)
import { escapeHtml, cleanName } from './utils.js';
import { linkifySummary, getMajorCategories, getSubcategories } from './data-service.js';
import { hierarchicalSort } from './utils.js';

const CONTENT_ID = 'app-content';

// 내부 헬퍼: ID로 가이드라인 찾기
function getGuidelineById(id) {
    return window.DB.guidelines.find(g => g.id === id);
}

// 내부 헬퍼: 관리자용 개발자 레이블 생성
function devLabel(name, isAdmin) {
  if (!isAdmin) return '';
  return `
    <div class="dev-label" style="
      position: absolute;
      top: 4px;
      left: 4px;
      background: rgba(253, 224, 71, 0.95); 
      color: #000; 
      font-family: monospace; 
      font-size: 10px; 
      font-weight: 800; 
      padding: 2px 6px; 
      border: 1.5px solid #000; 
      border-radius: 3px; 
      pointer-events: none; 
      z-index: 1000;
      white-space: nowrap;
      line-height: 1;
      box-shadow: 2px 2px 0px #000;
    ">
      ${name}
    </div>`;
}

/**
 * 메인 대시보드 홈 렌더링
 */
export function renderHome(isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  
  // 가이드라인 통계 계산
  const totalGuidelines = window.DB.guidelines.length;
  const summarizedCount = window.DB.guidelines.filter(g => g.aiSummary).length;
  const progressPercent = Math.round((summarizedCount / totalGuidelines) * 100);

  container.innerHTML = `
    <section class="hero-section" style="position: relative;">
      ${devLabel('HeroSection', isAdmin)}
      <h1 class="pixel-title">PharmInfo Portal</h1>
      <p class="section-subtitle">임상 약사를 위한 인공지능 기반 약학 지식 플랫폼</p>
      ${isAdmin ? `
        <div style="margin-top: 20px;">
          <button class="neo-btn-sm" onclick="window.app.navigateTo('/admin/guide')" style="background: var(--secondary); color: white; border: 2px solid var(--black);">🛠️ 시스템 구성 가이드 확인</button>
        </div>
      ` : ''}
    </section>

    <div class="grid-container">
      ${devLabel('CategoryGrid', isAdmin)}
      <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines')">
        <h2 class="card-title">📦 가이드라인</h2>
        <p class="card-desc">질환별 최신 임상 가이드라인과 AI 요약을 확인하세요.</p>
        <div class="neo-btn-sm center-margin">바로가기</div>
      </div>
      <div class="neo-card clickable" onclick="window.app.navigateTo('/drugs')">
        <h2 class="card-title">💊 약물 정보</h2>
        <p class="card-desc">성분별 효능, 용법 및 주의사항을 탐색합니다.</p>
        <div class="neo-btn-sm center-margin">바로가기</div>
      </div>
      <div class="neo-card clickable" onclick="window.app.navigateTo('/supplements')">
        <h2 class="card-title">🌿 건강기능식품</h2>
        <p class="card-desc">기능성 원료별 효과와 섭취 가이드를 확인하세요.</p>
        <div class="neo-btn-sm center-margin">바로가기</div>
      </div>
    </div>
  `;
}

/**
 * 가이드라인 대분류 목록 렌더링
 */
export function renderGuidelineMajors(isAdmin) {
  const majors = getMajorCategories();
  const container = document.getElementById(CONTENT_ID);

  let cardsHtml = majors.map((major) => {
    const subsMap = getSubcategories(major);
    const subNames = Object.keys(subsMap).sort(hierarchicalSort);
    const hasMore = subNames.length > 4;
    const initialItems = subNames.slice(0, 4);
    const extraItems = subNames.slice(4);
    
    const renderSubBtn = (sub, isExtra = false) => `
      <button class="neo-btn-sm guideline-sub-btn ${isExtra ? 'extra-item' : ''}" 
              onclick="event.stopPropagation(); window.app.navigateTo('/guidelines/category/${encodeURIComponent(major)}/${encodeURIComponent(sub)}')">
        ${escapeHtml(cleanName(sub))}
      </button>
    `;

    const subButtonsHtml = initialItems.map(s => renderSubBtn(s)).join('') + 
                           extraItems.map(s => renderSubBtn(s, true)).join('');

    return `
      <div class="neo-card clickable guideline-major-card" 
           onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(major)}')">
        <div class="badge-mini">GUIDELINE</div>
        <h3 class="card-title">${escapeHtml(cleanName(major))}</h3>
        
        <div class="guideline-sub-grid">
          ${subButtonsHtml}
        </div>

        ${hasMore ? `
          <button class="more-toggle-btn" 
            onclick="event.stopPropagation(); 
            const card = this.closest('.guideline-major-card');
            const isExpanded = card.classList.toggle('expanded');
            this.classList.toggle('active');
            this.innerText = isExpanded ? '간략히 보기 ▴' : '더보기 (+${extraItems.length}) ▾';
          ">더보기 (+${extraItems.length}) ▾</button>
        ` : ''}

        ${isAdmin ? `<button class="delete-btn-mini" onclick="event.stopPropagation(); window.app.deleteGuidelineCategory('${escapeHtml(major)}')">🗑️</button>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header" style="position: relative;">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
      ${devLabel('GuidelineMajors', isAdmin)}
      <h2 class="section-title">가이드라인 대분류</h2>
    </div>
    <div class="grid-container">
      ${cardsHtml}
      ${isAdmin ? `
        <div class="neo-card clickable add-card" onclick="window.app.addGuidelineMajor()" style="border-style: dashed; background: #f8fafc; border-width: 4px; display: flex; align-items: center; justify-content: center; min-height: 200px;">
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">➕</div>
            <div style="font-weight: 800;">새 대분류 추가</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 특정 대분류 아래의 중분류(Subcategory) 목록 렌더링
 */
export function renderGuidelineSubcategories(majorName, isAdmin) {
  const subsMap = getSubcategories(majorName);
  const container = document.getElementById(CONTENT_ID);
  const sortedSubs = Object.keys(subsMap).sort(hierarchicalSort);

  let cardsHtml = sortedSubs.map(sub => {
    const items = subsMap[sub];
    const itemListHtml = items.map(i => `<li>${escapeHtml(i.title)}</li>`).join('');

    return `
      <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines/subcategory/${encodeURIComponent(majorName)}/${encodeURIComponent(sub)}')">
        <div class="badge-mini">SUBCATEGORY</div>
        <h3 class="card-title">${escapeHtml(sub)}</h3>
        <ul class="card-preview-list">
          ${itemListHtml}
        </ul>
        ${isAdmin ? `<button class="delete-btn-mini" onclick="event.stopPropagation(); window.app.deleteGuidelineCategory('${escapeHtml(majorName)}', '${escapeHtml(sub)}')">🗑️</button>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines')">← CATEGORIES</button>
      ${devLabel('GuidelineSubs', isAdmin)}
      <h2 class="section-title">${escapeHtml(majorName)}</h2>
      <p class="section-subtitle">선택하신 분야의 세부 분류를 선택해주세요.</p>
    </div>
    <div class="grid-container">
      ${cardsHtml}
      ${isAdmin ? `
        <div class="neo-card clickable add-card" onclick="window.app.addGuidelineSubcategory('${escapeHtml(majorName)}')" style="border-style: dashed; background: #f8fafc; border-width: 4px; display: flex; align-items: center; justify-content: center; min-height: 200px;">
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">➕</div>
            <div style="font-weight: 800;">새 중분류 추가</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 특정 소분류 아래의 가이드라인(Items) 목록 렌더링
 */
export function renderGuidelineItems(majorName, subName, isAdmin) {
  const subsMap = getSubcategories(majorName);
  const data = (subsMap[subName] || []).sort((a, b) => {
    const yearDiff = parseInt(b.year || 0) - parseInt(a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return hierarchicalSort(a.title, b.title);
  });

  const container = document.getElementById(CONTENT_ID);
  
  let listHtml = data.map(g => {
    const pUrl = Array.isArray(g.url) ? g.url[0] : (g.url || '');
    const isLocalFile = (Array.isArray(g.url) && g.url.length > 0) || (typeof g.url === 'string' && g.url.startsWith('assets/'));
    const isHwp = typeof pUrl === 'string' && pUrl.toLowerCase().endsWith('.hwp');
    
    let badgeHtml;
    if (isHwp) {
      badgeHtml = '<span class="badge-hwp" style="background:#f97316; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700;">📎 HWP</span>';
    } else if (isLocalFile) {
      badgeHtml = '<span class="badge-pdf">📄 내부 뷰어</span>';
    } else {
      badgeHtml = '<span class="badge-link">🔗 외부 링크</span>';
    }
    
    return `
      <div class="neo-card clickable item-card-cube ${g.is_checked ? 'is-done' : ''}" onclick="window.app.navigateTo('/guidelines/${g.id}')">
        <div class="item-status-row">
          <span class="item-year">${g.year || '-'}</span>
          <div class="guideline-check-tool" 
               onclick="event.stopPropagation(); window.app.toggleGuidelineCheck('${g.id}', ${!g.is_checked})"
               style="cursor: pointer; font-size: 18px; color: ${g.is_checked ? '#10b981' : '#cbd5e1'}; transition: all 0.2s;">
            <i class="${g.is_checked ? 'fas fa-check-square' : 'far fa-square'}"></i>
          </div>
          ${badgeHtml}
          ${isAdmin ? `
            <div class="guideline-delete-tool" 
                 onclick="event.stopPropagation(); window.app.deleteGuideline('${g.id}', '${escapeHtml(g.title)}')"
                 style="cursor: pointer; font-size: 16px; color: #f87171; transition: all 0.2s; margin-left: 8px;"
                 title="삭제">
              <i class="fas fa-trash-alt"></i>
            </div>
          ` : ''}
        </div>
        <h3 class="item-title">${escapeHtml(g.title)}</h3>
        <div class="item-meta">
          <span class="source-tag">${escapeHtml(g.publisher || '공식 지침')}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(majorName)}')">← SUBS</button>
      ${devLabel('GuidelineList', isAdmin)}
      <h2 class="section-title">${escapeHtml(subName)}</h2>
      <p class="section-subtitle">${escapeHtml(majorName)}의 세부 가이드라인 목록입니다.</p>
    </div>

    <!-- 질환 통합요약 칸 -->
    ${(() => {
      const metadata = (window.DB.categoryMetadata || []).find(m => m.major === majorName && m.sub === subName);
      const summaryText = metadata ? metadata.summary : '';
      return `
        <div class="disease-integration-card neo-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 900;">🛡️ 질환 통합요약</h3>
            ${isAdmin ? `<button class="neo-btn-sm" onclick="window.app.toggleEditIntegrationSummary()" style="background: #4f46e5; color: white; border: none;">수정</button>` : ''}
          </div>
          <div id="integration-summary-display" style="font-size: 15px; line-height: 1.8; color: #334155;">
            ${window.renderMarkdown(linkifySummary(summaryText || '아직 등록된 통합 요약이 없습니다. 내용을 입력해 주세요.'))}
          </div>
          ${isAdmin ? `
          <div id="integration-summary-edit" style="display: none; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 800; font-size: 14px;">✏️ 통합 요약 편집</label>
              <div>
                <button class="neo-btn-sm" onclick="document.getElementById('category-md-file-input').click()" style="background: #4f46e5; color: white; border: none; font-size: 11px;">📄 MD 파일 불러오기</button>
                <input type="file" id="category-md-file-input" accept=".md" style="display: none;" onchange="window.app.handleCategoryMdFileUpload(event)">
              </div>
            </div>
            <textarea id="integration-summary-textarea" style="width: 100%; min-height: 200px; padding: 12px; border: 3px solid #4f46e5; border-radius: 4px; font-family: inherit; font-size: 14px; line-height: 1.6;">${escapeHtml(summaryText)}</textarea>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <button class="neo-btn-sm" onclick="window.app.saveIntegrationSummary('${escapeHtml(majorName)}', '${escapeHtml(subName)}')" style="background: #4f46e5; color: white; border: none;">💾 저장</button>
              <button class="neo-btn-sm" onclick="window.app.toggleEditIntegrationSummary()" style="background: #94a3b8; color: white; border: none;">취소</button>
            </div>
          </div>
          ` : ''}
        </div>
      `;
    })()}

    ${isAdmin ? `
    <button class="neo-btn" id="toggleNewGuidelineForm" style="margin-bottom:16px; background: linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; font-weight:700; font-size:15px; padding:12px 24px; cursor:pointer; border-radius:8px;">
      ＋ 새 가이드라인 추가
    </button>
    ` : ''}

    <div id="newGuidelineFormWrapper" style="display:none; margin-bottom:24px;">
      <div class="neo-card" style="background:#f0fdf4; border:3px solid var(--black);">
        <h4 style="margin-top:0;">📝 새 가이드라인 등록</h4>
        <form id="newGuidelineForm" style="display:grid; gap:12px;">
          <input type="hidden" name="major" value="${escapeHtml(majorName)}">
          <input type="hidden" name="sub" value="${escapeHtml(subName)}">
          <div style="display:grid; gap:6px;">
            <label style="font-weight:600; font-size:13px;">제목 *</label>
            <input type="text" name="title" required placeholder="가이드라인 제목을 입력하세요" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="display:grid; gap:6px;">
              <label style="font-weight:600; font-size:13px;">발행연도</label>
              <input type="text" name="year" placeholder="예: 2024" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
            </div>
            <div style="display:grid; gap:6px;">
              <label style="font-weight:600; font-size:13px;">발행기관</label>
              <input type="text" name="publisher" placeholder="예: 대한의학회" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
            </div>
          </div>
          <div style="display:grid; gap:6px;">
            <label style="font-weight:600; font-size:13px;">파일 첨부 (PDF/HWP, 선택)</label>
            <input type="file" name="guidelineFile" accept=".pdf,.hwp" style="padding:8px; border:2px solid var(--black); border-radius:6px; background:#fff;">
          </div>
          <div style="display:flex; gap:10px; margin-top:4px;">
            <button type="submit" class="neo-btn-sm" style="background:#10b981; color:#fff; border:none; padding:10px 20px; font-weight:700; cursor:pointer;">저장</button>
            <button type="button" class="neo-btn-sm" id="cancelNewGuideline" style="background:#e5e7eb; color:#333; border:none; padding:10px 20px; cursor:pointer;">취소</button>
          </div>
        </form>
        <div id="newGuidelineStatus" style="margin-top:10px; font-weight:bold; font-size:14px;"></div>
      </div>
    </div>

    <div class="grid-container">
      ${listHtml || '<p>등록된 가이드라인이 없습니다.</p>'}
    </div>
  `;

  setTimeout(() => {
    const toggleBtn = document.getElementById('toggleNewGuidelineForm');
    const formWrapper = document.getElementById('newGuidelineFormWrapper');
    const cancelBtn = document.getElementById('cancelNewGuideline');
    const form = document.getElementById('newGuidelineForm');

    if (toggleBtn && formWrapper) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = formWrapper.style.display === 'none';
        formWrapper.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '✕ 폼 닫기' : '＋ 새 가이드라인 추가';
      });
    }

    if (cancelBtn && formWrapper && toggleBtn) {
      cancelBtn.addEventListener('click', () => {
        formWrapper.style.display = 'none';
        toggleBtn.textContent = '＋ 새 가이드라인 추가';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById('newGuidelineStatus');
        statusDiv.innerHTML = '저장 중... ⏳';
        statusDiv.style.color = 'var(--primary)';

        try {
          const formData = new FormData(form);
          const response = await fetch('/api/guidelines', {
            method: 'POST',
            headers: {
              'x-api-key': '3505'
            },
            body: formData
          });
          const result = await response.json();

          if (response.ok) {
            statusDiv.innerHTML = `✅ "${formData.get('title')}" 가이드라인이 추가되었습니다! 페이지를 새로고침합니다...`;
            statusDiv.style.color = '#065F46';
            setTimeout(() => window.location.reload(), 1500);
          } else {
            statusDiv.innerHTML = `❌ 오류: ${result.error}`;
            statusDiv.style.color = 'red';
          }
        } catch (err) {
          statusDiv.innerHTML = `❌ 서버 연결 실패. 'node server.js'가 실행 중인지 확인하세요.`;
          statusDiv.style.color = 'red';
        }
      });
    }
  }, 100);
}

/**
 * 가이드라인 상세 페이지 렌더링
 */
export function renderDetail(id, isAdmin) {
  const g = getGuidelineById(id);
  const container = document.getElementById(CONTENT_ID);
  
  if (!g) {
    container.innerHTML = '<div class="neo-card"><h3>항목을 찾을 수 없습니다.</h3></div>';
    return;
  }

  const primaryUrl = Array.isArray(g.url) ? g.url[0] : (g.url || '');
  const isExternal = typeof primaryUrl === 'string' && primaryUrl.startsWith('http');
  const isExternalHWP = isExternal && (primaryUrl.includes('boardDownload.es') || primaryUrl.toLowerCase().includes('.hwp'));

  // AI 요약 렌더링 (데이터가 있거나 관리자일 때 표시)
  let summaryHtml = '';
  if (g.aiSummary || isAdmin) {
    const ai = g.aiSummary || '';
    
    // 기존에 분리된 데이터가 있다면 하나로 합침
    let fullText = '';
    if (typeof ai === 'string') {
      fullText = ai;
    } else if (typeof ai === 'object') {
      const parts = [];
      if (ai.overview) parts.push(`💡 핵심 요약: ${ai.overview}`);
      if (ai.firstLine) parts.push(`💊 1차 선택 약제: ${ai.firstLine}`);
      if (ai.monitoring) parts.push(`📋 모니터링/수치: ${ai.monitoring}`);
      if (ai.cautions) parts.push(`⚠️ 주의사항/금기: ${ai.cautions}`);
      if (ai.special) parts.push(`👥 특수군 (임부/노인): ${ai.special}`);
      fullText = parts.length > 0 ? parts.join('\n\n') : (ai.content || '');
    }

    if (!fullText && isAdmin) {
      fullText = '아직 요약이 등록되지 않았습니다. 수정 버튼을 눌러 마크다운 형식으로 요약을 작성해 주세요.';
    }

    summaryHtml = `
      <div class="ai-summary-card neo-card unified-summary">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div class="ai-badge" style="margin: 0;">✨ AI PHARMACIST SUMMARY</div>
          ${isAdmin ? `<button class="neo-btn-sm" onclick="window.app.toggleEditAiSummary()" style="background: var(--secondary); color: white; border: none; font-size: 12px; padding: 6px 12px;">✏️ 요약 수정</button>` : ''}
        </div>

        <!-- 보기 모드 -->
        <div id="ai-summary-display" class="summary-content" style="white-space: normal; font-size: 15px; line-height: 1.8;">
          ${window.renderMarkdown(linkifySummary(fullText))}
        </div>

        <!-- 편집 모드 (하나의 커다란 편집칸) -->
        ${isAdmin ? `
        <div id="ai-summary-edit" class="summary-content" style="display: none; border-top: 2px dashed #ddd; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label style="font-weight: 900; font-size: 16px;">✏️ 요약 내용 통합 편집</label>
            <div>
              <button class="neo-btn-sm" onclick="document.getElementById('md-file-input').click()" style="background: #4f46e5; color: white; border: none; font-size: 11px;">📄 MD 파일 불러오기</button>
              <input type="file" id="md-file-input" accept=".md" style="display: none;" onchange="window.app.handleMdFileUpload(event, '${id}')">
            </div>
          </div>
          <div class="edit-field" style="margin-bottom: 15px;">
            <textarea id="edit-ai-content" style="width: 100%; min-height: 400px; padding: 16px; border: 3px solid #000; font-family: inherit; font-size: 14px; line-height: 1.6; background: #fff;">${escapeHtml(fullText)}</textarea>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">
              * 줄바꿈을 사용하여 내용을 자유롭게 구분해 주세요. <br>
              * 저장 시 <strong>assets/data/summaries/${id}.md</strong> 파일이 자동으로 생성/수정됩니다.
            </p>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="neo-btn-sm" onclick="window.app.saveAiSummary('${id}')" style="background: var(--primary); color: white; border: none; font-weight: 900;">💾 저장하기 (파일 동기화)</button>
            <button class="neo-btn-sm" onclick="document.getElementById('edit-ai-content').value = '';" style="background: #ef4444; color: white; border: none;">🗑️ 내용 비우기</button>
            <button class="neo-btn-sm" onclick="window.app.toggleEditAiSummary()" style="background: #94a3b8; color: white; border: none;">취소</button>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }
  const isInternalHWP = !isExternal && primaryUrl.toLowerCase().endsWith('.hwp');

  let viewerHtml = '';
  if (isExternal) {
    viewerHtml = `
      <div class="external-link-container">
        <div class="external-link-card">
          <div class="external-icon">🌐</div>
          <h3>원문 가이드라인 연결</h3>
          <p>이 지침은 외부 보안 정책 또는 파일 형식으로 인해<br>플랫폼 내부 뷰어로 직접 로딩할 수 없습니다.</p>
          <a href="${primaryUrl}" target="_blank" class="neo-btn-lg">원문 가이드라인 새 창에서 열기</a>
          ${isExternalHWP ? '<div class="hwp-alert">⚠️ 한글(HWP) 파일인 경우 다운로드 후 별도의 뷰어가 필요합니다.</div>' : ''}
          <div class="external-tip">Tip: 관리자 페이지(/admin)에서 로컬로 업로드하면 내부 뷰어로 통합할 수 있습니다.</div>
        </div>
      </div>
    `;
  } else if (isInternalHWP) {
    viewerHtml = `
      <div class="pdf-container-a4 hwp-container" style="background:#fff; padding:20px; overflow:auto; min-height:800px;">
        <div id="hwp-render-area" style="text-align:center; padding-top:50px; font-weight:bold; font-size:18px;">
          HWP 뷰어를 불러오는 중입니다... ⏳
        </div>
      </div>
    `;
    
    // DOM이 그려진 후 hwp.js 실행 (로컬 셀프호스팅 버전)
    setTimeout(() => {
      const hwpArea = document.getElementById('hwp-render-area');
      if (!hwpArea) return;

      fetch(primaryUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(buffer => {
          // 로컬에 저장한 hwp-viewer.js 사용 (CDN 의존성 제거)
          import('./hwp-viewer.js')
            .then(module => {
              hwpArea.innerHTML = ''; // clear loading text
              hwpArea.style.minHeight = '800px';
              const HwpViewer = module.Viewer;
              new HwpViewer(hwpArea, new Uint8Array(buffer), { type: 'binary' });
            })
            .catch(err => {
              console.error("HWP Module Load Error:", err);
              hwpArea.innerHTML = `<div style="text-align:center; padding:40px;">
                <p style="font-size:16px; font-weight:bold; color:#dc2626;">⚠️ HWP 뷰어를 로드할 수 없습니다</p>
                <p style="font-size:13px; color:#666; margin:12px 0;">오류: ${err.message}</p>
                <p style="font-size:13px; color:#666;">PDF로 변환 후 업로드하시면 안정적으로 열람할 수 있습니다.</p>
                <a href="${primaryUrl}" download class="neo-btn" style="margin-top:16px; display:inline-block;">📥 HWP 파일 다운로드</a>
              </div>`;
            });
        })
        .catch(err => {
          console.error("HWP File Fetch Error:", err);
          hwpArea.innerHTML = `<div style="text-align:center; padding:40px;">
            <p style="font-size:16px; font-weight:bold; color:#dc2626;">⚠️ HWP 파일을 불러올 수 없습니다</p>
            <p style="font-size:13px; color:#666;">파일 경로를 확인해 주세요: ${primaryUrl}</p>
            <a href="${primaryUrl}" download class="neo-btn" style="margin-top:16px; display:inline-block;">📥 HWP 파일 다운로드</a>
          </div>`;
        });
    }, 500);

  } else {
    viewerHtml = `
      <div class="pdf-new-tab-container" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; margin-top: 20px;">
        <i class="fas fa-file-pdf" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
        <h3 style="margin-bottom: 20px; color: #334155;">가이드라인 원문 확인</h3>
        ${Array.isArray(g.url) ? `
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            ${g.url.map((url, idx) => `
              <button class="neo-btn" style="background: #3b82f6; color: white; padding: 10px 20px; font-weight: bold;" onclick="window.open('${url}', '_blank')">
                <i class="fas fa-external-link-alt"></i> ${idx + 1}부 원문 새 탭으로 열기
              </button>
            `).join('')}
          </div>
        ` : `
          <button class="neo-btn" style="background: #3b82f6; color: white; padding: 10px 20px; font-weight: bold;" onclick="window.open('${primaryUrl}', '_blank')">
            <i class="fas fa-external-link-alt"></i> 가이드라인 원문 새 탭으로 열기
          </button>
        `}
      </div>
    `;
  }

  container.innerHTML = `
    <button class="neo-back-btn" onclick="history.back()">← BACK</button>
    <div class="detail-view neo-card" style="position: relative;">
      ${devLabel('GuidelineDetail', isAdmin)}
      <div class="detail-header" style="display: flex; align-items: flex-start; gap: 15px;">
        <div class="guideline-check-tool" 
             onclick="event.stopPropagation(); window.app.toggleGuidelineCheck('${id}', ${!g.is_checked})"
             style="cursor: pointer; font-size: 24px; color: ${g.is_checked ? '#10b981' : '#cbd5e1'}; margin-top: 5px;">
          <i class="${g.is_checked ? 'fas fa-check-square' : 'far fa-square'}"></i>
        </div>
        <div style="flex: 1;">
          <div class="badge">${escapeHtml(g.major || '가이드라인')}</div>
          <h2 class="detail-title" style="margin-top: 4px;">${escapeHtml(g.title)}</h2>
          <p class="detail-meta">발행연도: ${g.year || '미상'} | 출처: ${g.publisher || '공식 가이드라인'}</p>
        </div>
      </div>
      
      <!-- AI 요약본 (모든 사용자 공개, 데이터가 있을 때만 노출) -->
      ${summaryHtml}
      <!-- 원본 링크/다운로드 (모든 사용자 공개) -->
      <div class="neo-card" style="display:flex; align-items:center; gap:12px; padding:14px 20px; margin-bottom:20px; background:linear-gradient(135deg,#eef2ff,#e0e7ff); border:2px solid #6366f1;">
        <span style="font-size:20px;">${isExternal ? '🌐' : '📎'}</span>
        <div style="flex:1;">
          <span style="font-weight:700; font-size:14px; color:#4338ca;">원본 ${isExternal ? '페이지' : '파일'}</span>
          <span style="font-size:12px; color:#6366f1; margin-left:8px;">${isExternal ? '새 창에서 열기' : (primaryUrl.toLowerCase().endsWith('.hwp') ? 'HWP 파일 다운로드' : 'PDF 파일 열기')}</span>
        </div>
        ${Array.isArray(g.url) && g.url.length > 1
          ? g.url.map((u, i) => `<a href="${u}" target="_blank" ${!u.startsWith('http') ? 'download' : ''} class="neo-btn-sm" style="background:#6366f1; color:#fff; border:none; text-decoration:none; font-weight:600;">${i+1}부</a>`).join('')
          : `<a href="${primaryUrl}" target="_blank" ${!isExternal ? 'download' : ''} class="neo-btn-sm" style="background:#6366f1; color:#fff; border:none; text-decoration:none; font-weight:600;">열기 / 다운로드</a>`
        }
      </div>

      ${isAdmin ? `
      <div class="pdf-section" style="position: relative;">
        ${devLabel('PDFViewer', isAdmin)}
        <div class="neo-card-header" style="background: var(--secondary); color: white;">📄 원문 미리보기 (관리자 전용)</div>
        ${viewerHtml}
        
        <div class="local-upload-section neo-card" style="margin-top: 20px; background: #f0fdf4; border: 3px solid var(--black);">
          <h4 style="margin-top:0;">📁 파일 교체 / 직접 업로드</h4>
          <form id="inlineUploadForm-${g.id}" style="display: flex; gap: 10px; align-items: center;">
            <input type="hidden" name="guidelineId" value="${g.id}">
            <input type="file" name="guidelineFile" accept=".pdf,.hwp" required style="border: 2px solid var(--black); padding: 5px; flex-grow: 1; background: #fff;">
            <button type="submit" class="neo-btn-sm">업로드</button>
          </form>
          <div id="uploadStatus-${g.id}" style="margin-top: 10px; font-weight: bold; font-size: 14px;"></div>
        </div>

        <div class="local-upload-section neo-card" style="margin-top: 20px; background: #eff6ff; border: 3px solid var(--black); position: relative;">
          ${devLabel('MetadataForm', isAdmin)}
          <h4 style="margin-top:0;">✏️ 가이드라인 정보 수정</h4>
          <form id="metadataEditForm-${g.id}" style="display:grid; gap:12px;">
            <div style="display:grid; gap:6px;">
              <label style="font-weight:600; font-size:13px;">제목</label>
              <input type="text" name="title" value="${escapeHtml(g.title)}" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div style="display:grid; gap:6px;">
                <label style="font-weight:600; font-size:13px;">발행연도</label>
                <input type="text" name="year" value="${escapeHtml(g.year || '')}" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
              </div>
              <div style="display:grid; gap:6px;">
                <label style="font-weight:600; font-size:13px;">발행기관</label>
                <input type="text" name="publisher" value="${escapeHtml(g.publisher || '')}" style="padding:10px; border:2px solid var(--black); border-radius:6px; font-size:14px;">
              </div>
            </div>
            <button type="submit" class="neo-btn-sm" style="background:#3b82f6; color:#fff; border:none; padding:10px 20px; font-weight:700; cursor:pointer; width:fit-content;">💾 정보 저장</button>
          </form>
          <div id="metadataStatus-${g.id}" style="margin-top: 10px; font-weight: bold; font-size: 14px;"></div>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  // 업로드 폼 이벤트 리스너 등록
  setTimeout(() => {
    const uploadForm = document.getElementById(`inlineUploadForm-${g.id}`);
    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById(`uploadStatus-${g.id}`);
        statusDiv.innerHTML = '업로드 중... ⏳';
        statusDiv.style.color = 'var(--primary)';

        try {
          const formData = new FormData(uploadForm);
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'x-api-key': '3505'
            },
            body: formData
          });
          const result = await response.json();
          
          if (response.ok) {
            statusDiv.innerHTML = `✅ 성공! 뷰어를 새로고침합니다... (경로: ${result.filePath})`;
            statusDiv.style.color = '#065F46';
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            statusDiv.innerHTML = `❌ 오류: ${result.error}`;
            statusDiv.style.color = 'red';
          }
        } catch (err) {
          statusDiv.innerHTML = `❌ 서버 연결 실패. 터미널에서 'node server.js'가 실행 중인지 확인하세요.`;
          statusDiv.style.color = 'red';
        }
      });
    }

    // 메타데이터 수정 폼 이벤트 리스너 등록
    const metadataForm = document.getElementById(`metadataEditForm-${g.id}`);
    if (metadataForm) {
      metadataForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById(`metadataStatus-${g.id}`);
        statusDiv.innerHTML = '저장 중... ⏳';
        statusDiv.style.color = 'var(--primary)';

        const formData = new FormData(metadataForm);
        const payload = {
          title: formData.get('title'),
          year: formData.get('year'),
          publisher: formData.get('publisher')
        };

        try {
          const response = await fetch(`/api/guidelines/${g.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': '3505'
            },
            body: JSON.stringify(payload)
          });
          const result = await response.json();

          if (response.ok) {
            statusDiv.innerHTML = `✅ 정보가 수정되었습니다! 페이지를 새로고침합니다...`;
            statusDiv.style.color = '#065F46';
            setTimeout(() => window.location.reload(), 1500);
          } else {
            statusDiv.innerHTML = `❌ 오류: ${result.error}`;
            statusDiv.style.color = 'red';
          }
        } catch (err) {
          statusDiv.innerHTML = `❌ 서버 연결 실패. 'node server.js'가 실행 중인지 확인하세요.`;
          statusDiv.style.color = 'red';
        }
      });
    }
  }, 100);
}

/**
 * 검색 결과 렌더링
 */
export function renderSearchResults(results, query) {
  const container = document.getElementById(CONTENT_ID);
  
  if (results.length === 0) {
    container.innerHTML = `
      <div class="neo-card">
        <h3>'${escapeHtml(query)}'에 대한 검색 결과가 없습니다.</h3>
        <p>다른 검색어를 입력해 보세요.</p>
      </div>
    `;
    return;
  }

  const guidelines = results.filter(r => r.id.startsWith('g'));
  const drugs = results.filter(r => !r.id.startsWith('g'));

  let html = `
    <div class="section-header">
      <h2 class="section-title">검색 결과: "${escapeHtml(query)}"</h2>
      <p class="section-subtitle">총 ${results.length}개의 항목이 검색되었습니다.</p>
    </div>
  `;

  if (guidelines.length > 0) {
    html += `<h3>📄 가이드라인 (${guidelines.length})</h3>
    <div class="grid-container">
      ${guidelines.map(g => `
        <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines/${g.id}')">
          <h3 class="card-title">${escapeHtml(g.title)}</h3>
          <p class="card-desc">${escapeHtml(g.major)} > ${escapeHtml(g.sub)}</p>
        </div>
      `).join('')}
    </div>`;
  }

  if (drugs.length > 0) {
    html += `<h3 style="margin-top:32px">💊 약물 정보 (${drugs.length})</h3>
    <div class="grid-container">
      ${drugs.map(d => `
        <div class="neo-card clickable" onclick="window.app.navigateTo('/drugs/${d.id}')">
          <h3 class="card-title">${escapeHtml(d.name)}</h3>
          <p class="card-desc">${escapeHtml(d.ingredient)}</p>
        </div>
      `).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

/**
 * 약물 정보 대분류 목록 렌더링
 */
export function renderDrugMajors(isAdmin) {
  const data = window.DB.drugs;
  // Get unique major categories that start with "[Number."
  const majors = [...new Set(data.map(d => d.major))]
      .filter(m => /^\[\d+\./.test(m)) // Only [1. ...], [2. ...] etc.
      .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
      });
  const container = document.getElementById(CONTENT_ID);
  
  let cardsHtml = majors.map(major => {
    const count = data.filter(d => d.major === major).length;
    return `
      <div class="neo-card clickable drug-major-card" onclick="window.app.navigateTo('/drugs/category/${encodeURIComponent(major)}')">
        <div class="badge-mini">MAJOR CATEGORY</div>
        <h3 class="card-title">${escapeHtml(major)}</h3>
        <p class="card-desc">총 ${count}개의 세부 분류 포함</p>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header" style="position: relative;">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
      <h2 class="section-title">약물 정보 (대분류)</h2>
      <p class="section-subtitle">원하시는 질환군을 선택하여 성분별 상세 정보를 확인하세요.</p>
    </div>
    <div class="grid-container">${cardsHtml}</div>
  `;
}

/**
 * 약물 정보 상세 계층 렌더링 (중분류/소분류/아이템)
 */
export function renderDrugCategory(majorName, isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  if (!container) return;

  // 1. 데이터 필터링 및 정규화
  const targetMajorNormalized = (majorName || "").normalize('NFKC').trim();
  const rawData = (window.DB.drugs || []).filter(d => 
    (d.major || "").normalize('NFKC').trim() === targetMajorNormalized
  );

  if (rawData.length === 0) {
    container.innerHTML = `<div class="section-header"><button class="neo-back-btn" onclick="window.app.navigateTo('/drugs')">← BACK</button><h2>'${escapeHtml(majorName)}' 카테고리에 데이터가 없습니다.</h2></div>`;
    return;
  }

  // 데이터 정제
  const cleanData = rawData.map(d => ({
    ...d,
    minor: (d.minor || "기타").normalize('NFKC').trim().replace(/\s+/g, ' '),
    sub: (d.sub || "기타").normalize('NFKC').trim().replace(/\s+/g, ' ')
  }));

  // 2. 계층 구조화 (중분류 > 소분류 병합)
  const minorOrder = [];
  const minorMap = {}; // { minorName: { subName: { ids: [], items: [] } } }
  cleanData.forEach(d => {
    if (!minorMap[d.minor]) {
      minorMap[d.minor] = {};
      minorOrder.push(d.minor);
    }
    if (!minorMap[d.minor][d.sub]) {
      minorMap[d.minor][d.sub] = { ids: [], items: [] };
    }
    minorMap[d.minor][d.sub].ids.push(d.id);
    minorMap[d.minor][d.sub].items.push(...(d.items || []));
  });

  let html = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/drugs')">← CATEGORIES</button>
      <h2 class="section-title">${escapeHtml(majorName)} 상세 정보</h2>
      <p class="section-subtitle">성분명/대조약은 클릭하여 직접 수정할 수 있으며, 자동 저장됩니다.</p>
    </div>
    <div class="drugs-container fade-in">
  `;

  // 3. TOC (Quick Navigation) 렌더링
  html += `
    <div class="drug-toc neo-card">
      <div class="toc-header"><span class="toc-icon">📋</span><h3 class="toc-title">Quick Navigation: 포함된 계열 목록</h3></div>
      <div class="toc-grid">
        ${minorOrder.map(minor => {
          const subs = Object.keys(minorMap[minor]);
          return `
            <div class="toc-section">
              <div class="toc-minor-label">${escapeHtml(minor)}</div>
              <div class="toc-sub-tags">
                ${subs.map(sub => {
                  const safeId = 'sec-' + btoa(unescape(encodeURIComponent(minor + '|' + sub))).replace(/[^a-zA-Z0-9]/g, '');
                  return `<span class="toc-sub-tag" onclick="window.app.scrollToSection('${safeId}')">${escapeHtml(sub)}</span>`;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // 4. 메인 리스트 렌더링
  minorOrder.forEach((minor) => {
    const subs = minorMap[minor];
    const subNames = Object.keys(subs);
    
    html += `
      <div class="drug-minor-header">
        <h3 class="drug-minor-badge" ${isAdmin ? 'contenteditable="true"' : ''} onblur="window.app.updateMinorName('${escapeHtml(majorName)}', '${escapeHtml(minor)}', this.innerText)">${escapeHtml(minor)}</h3>
        ${isAdmin ? `
        <div style="display:flex; gap:10px;">
          <button class="add-sub-btn" onclick="window.app.addSubCategory('${escapeHtml(majorName)}', '${escapeHtml(minor)}')" title="소분류 추가">➕ 소분류 추가</button>
          <span class="delete-btn" title="중분류 삭제" onclick="window.app.deleteCategory('${escapeHtml(majorName)}', '${escapeHtml(minor)}')">🗑️</span>
        </div>
        ` : ''}
      </div>
    `;

    subNames.forEach((subName) => {
      const subInfo = subs[subName];
      const safeId = 'sec-' + btoa(unescape(encodeURIComponent(minor + '|' + subName))).replace(/[^a-zA-Z0-9]/g, '');
      const firstId = subInfo.ids[0];

      html += `
        <div class="drug-sub-section" id="${safeId}" 
             ondragover="${isAdmin ? 'event.preventDefault()' : 'null'}" 
             ondrop="${isAdmin ? `window.app.handleDrop(event, '${escapeHtml(minor)}', '${escapeHtml(subName)}')` : 'null'}">
          <div class="drug-sub-badge-wrapper">
            <div class="drug-sub-badge" ${isAdmin ? 'contenteditable="true"' : ''} onblur="window.app.updateSubName('${escapeHtml(majorName)}', '${escapeHtml(minor)}', '${escapeHtml(subName)}', this.innerText)">${escapeHtml(subName)}</div>
            ${isAdmin ? `
            <div style="display:flex; gap:10px;">
              <span class="add-drug-btn" title="약물 추가" onclick="window.app.addNewDrug('${firstId}')">➕</span>
              <span class="delete-btn" title="소분류 삭제" onclick="window.app.deleteCategory('${escapeHtml(majorName)}', '${escapeHtml(minor)}', '${escapeHtml(subName)}')">🗑️</span>
            </div>
            ` : ''}
          </div>
          <div class="grid-container" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
            ${subInfo.items.map((item, idx) => `
              <div class="drug-item-card compact" style="position: relative;" ${isAdmin ? 'draggable="true"' : ''} 
                   onclick="window.app.openDrugDetailSidebar('${firstId}', ${idx})"
                   ondragstart="${isAdmin ? `window.app.handleDragStart(event, '${firstId}', ${idx})` : ''}"
                   ondragend="${isAdmin ? 'window.app.handleDragEnd(event)' : ''}">
                ${devLabel('DrugItemCard', isAdmin)}
                ${isAdmin ? `<button class="settings-btn" onclick="event.stopPropagation(); window.app.openDrugPropertyModal('${firstId}', ${idx})">⚙️</button>` : ''}
                <div class="drug-image-container compact-image" onclick="${isAdmin ? `event.stopPropagation(); window.app.triggerImageUpload('${firstId}', ${idx}, this)` : ''}">
                  <img src="${item.image || 'assets/images/no-image.png'}" class="drug-image" onerror="this.src='https://placehold.co/400x400?text=Click+to+Upload'">
                </div>
                <div class="drug-info-compact">
                  <div class="editable-field ingredient-name-compact" ${isAdmin ? 'contenteditable="true"' : ''} 
                       onclick="event.stopPropagation()"
                       onblur="window.app.handleDrugTextEdit(this, '${firstId}', ${idx})">${escapeHtml(item.ingredient)}</div>
                  <div class="editable-field reference-name-compact" ${isAdmin ? 'contenteditable="true"' : ''} 
                       onclick="event.stopPropagation()"
                       onblur="window.app.handleDrugTextEdit(this, '${firstId}', ${idx})">${escapeHtml(item.reference)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  });

  html += `
  ${isAdmin ? `
    <div class="add-minor-container">
      <button class="add-minor-btn" onclick="window.app.addMinorCategory('${escapeHtml(majorName)}')">➕ 새 중분류 추가</button>
    </div>
  ` : ''}
  </div>`;
  container.innerHTML = html;
}

/**
 * 시스템 구성 가이드 페이지 렌더링 (관리자 전용)
 * project_overview.md의 시각화 자료를 연동하여 초보 개발자가 고쳐야 할 부분을 쉽게 알 수 있도록 합니다.
 */
export function renderSystemGuide() {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← BACK</button>
    <div class="detail-view neo-card" style="max-width: 1000px; margin: 0 auto; padding: 40px; background: #fff;">
      <h2 class="pixel-title" style="font-size: 32px; margin-bottom: 10px; text-align: center;">📊 PharmInfo 시스템 개발 지도</h2>
      <p style="margin-bottom: 40px; line-height: 1.6; color: #475569; text-align: center; font-size: 17px;">
        프로젝트의 구조를 시각화하여 어떤 기능을 수정할 때 어떤 파일을 열어야 하는지 안내합니다.
      </p>

      <!-- 1. 아키텍처 및 데이터 흐름 -->
      <div class="guide-section" style="margin-bottom: 60px;">
        <h3 style="border-left: 8px solid var(--primary); padding-left: 15px; margin-bottom: 20px; font-weight: 900;">🏗️ 1. 시스템 작동 원리 (Architecture)</h3>
        <div class="mermaid" style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          graph TD
            subgraph "🌐 Client (Browser)"
                UI[index.html / CSS] -- "이벤트 발생" --> AppLogic[app-new.js]
                AppLogic -- "UI 업데이트" --> Renderer[view-renderer.js]
                AppLogic -- "데이터 요청" --> API_Call[Fetch API]
            end

            subgraph "💻 Server (Node.js)"
                API_Call -- "HTTP Request" --> Express[server.js]
                Express -- "SQL 실행" --> SQLite[pharmacy.db]
            end

            style UI fill:#fdf,stroke:#333,stroke-width:2px
            style AppLogic fill:#bbf,stroke:#333,stroke-width:4px
            style Server fill:#bfb,stroke:#333,stroke-width:2px
            style SQLite fill:#f96,stroke:#333,stroke-width:2px
        </div>
        <div class="fix-table-wrapper" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid var(--black); font-size: 14px;">
            <thead style="background: var(--black); color: white;">
              <tr>
                <th style="padding: 12px; border: 1px solid #444;">수정하고 싶은 부분</th>
                <th style="padding: 12px; border: 1px solid #444;">열어야 할 파일 (Fix Location)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid var(--black); font-weight: 700;">전체 레이아웃, 폰트, 모달창 구조</td>
                <td style="padding: 12px; border: 1px solid var(--black); color: var(--primary); font-weight: 800;">index.html</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid var(--black); font-weight: 700;">색상, 크기, 애니메이션, 버튼 디자인</td>
                <td style="padding: 12px; border: 1px solid var(--black); color: var(--primary); font-weight: 800;">style-new.css</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid var(--black); font-weight: 700;">화면 전환(라우팅), 버튼 클릭 이벤트, API 통신</td>
                <td style="padding: 12px; border: 1px solid var(--black); color: var(--primary); font-weight: 800;">app-new.js</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid var(--black); font-weight: 700;">HTML 카드 모양, 텍스트 배치, 데이터 표시 방식</td>
                <td style="padding: 12px; border: 1px solid var(--black); color: var(--primary); font-weight: 800;">view-renderer.js</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid var(--black); font-weight: 700;">데이터 저장 방식, 파일 업로드, 비밀번호 인증</td>
                <td style="padding: 12px; border: 1px solid var(--black); color: var(--primary); font-weight: 800;">server.js</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 컴포넌트 맵 -->
      <div class="guide-section" style="margin-bottom: 60px;">
        <h3 style="border-left: 8px solid var(--secondary); padding-left: 15px; margin-bottom: 20px; font-weight: 900;">🧩 2. 화면 구성 요소 (Component Map)</h3>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
          각 화면 요소는 <strong>view-renderer.js</strong> 내의 특정 함수에 의해 생성됩니다.
        </p>
        <div class="guide-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="neo-card" style="padding: 20px; background: #ecfdf5; border-width: 2px;">
            <h4 style="margin:0 0 10px 0; color: #065f46;">🏠 홈 & 네비게이션</h4>
            <ul style="font-size: 13px; line-height: 1.8;">
              <li>• <strong>HeroSection</strong> → <code>renderHome()</code></li>
              <li>• <strong>CategoryGrid</strong> → <code>renderHome()</code></li>
              <li>• <strong>MainHeader</strong> → <code>index.html</code> (정적)</li>
            </ul>
          </div>
          <div class="neo-card" style="padding: 20px; background: #eff6ff; border-width: 2px;">
            <h4 style="margin:0 0 10px 0; color: #1e40af;">📦 가이드라인</h4>
            <ul style="font-size: 13px; line-height: 1.8;">
              <li>• <strong>GuidelineMajors</strong> → <code>renderGuidelineMajors()</code></li>
              <li>• <strong>GuidelineSubs</strong> → <code>renderGuidelineSubcategories()</code></li>
              <li>• <strong>GuidelineDetail</strong> → <code>renderDetail()</code></li>
            </ul>
          </div>
          <div class="neo-card" style="padding: 20px; background: #fff7ed; border-width: 2px;">
            <h4 style="margin:0 0 10px 0; color: #9a3412;">💊 약물 정보</h4>
            <ul style="font-size: 13px; line-height: 1.8;">
              <li>• <strong>DrugTree</strong> → <code>renderDrugCategory()</code></li>
              <li>• <strong>DrugItemCard</strong> → <code>renderDrugCategory()</code> (내부 루프)</li>
              <li>• <strong>DrugSidebar</strong> → <code>app-new.js</code> (DOM 직접 조작)</li>
            </ul>
          </div>
          <div class="neo-card" style="padding: 20px; background: #fdf2f8; border-width: 2px;">
            <h4 style="margin:0 0 10px 0; color: #9d174d;">⚙️ 공통 도구</h4>
            <ul style="font-size: 13px; line-height: 1.8;">
              <li>• <strong>LoginModal</strong> → <code>index.html</code> (정적)</li>
              <li>• <strong>SearchList</strong> → <code>renderSearchResults()</code></li>
              <li>• <strong>Toast/Alert</strong> → <code>app-new.js</code></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 3. 데이터 업데이트 흐름 -->
      <div class="guide-section">
        <h3 style="border-left: 8px solid #f97316; padding-left: 15px; margin-bottom: 20px; font-weight: 900;">🔄 3. 데이터 저장 흐름 (Data Flow)</h3>
        <div class="mermaid" style="background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          sequenceDiagram
              participant User as 사용자(Admin)
              participant UI as 브라우저(app-new.js)
              participant Server as 서버(server.js)
              participant DB as 데이터베이스(pharmacy.db)

              User->>UI: 텍스트 수정 (onblur)
              UI->>Server: HTTP PATCH /api/drugs/:id
              Server->>DB: UPDATE SQL 실행
              DB-->>Server: 완료
              Server-->>UI: 200 OK (성공 메시지)
              UI->>User: 토스트 알림 ("저장되었습니다")
        </div>
      </div>

      <div class="neo-card" style="margin-top: 40px; background: var(--black); color: white; text-align: center; padding: 20px;">
        <p style="margin:0; font-weight: 700; font-size: 15px;">💡 AI 팁: "가이드라인 상세 페이지의 텍스트 크기를 키우고 싶은데, view-renderer.js의 어느 부분을 고쳐야 해?" 라고 질문해보세요!</p>
      </div>
    </div>
  `;

  // 렌더링 후 Mermaid 다이어그램 초기화
  setTimeout(() => {
    if (window.mermaid) {
      window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }
  }, 100);
}

/**
 * 휴지통 목록 렌더링
 */
export function renderTrash() {
  const container = document.getElementById(CONTENT_ID);
  const trash = window.DB.trash || [];

  let itemsHtml = trash.length === 0 
    ? `<div style="text-align:center; padding:50px; color:#64748b; border:2px dashed #cbd5e1; border-radius:12px; grid-column: 1 / -1;">
        <div style="font-size:40px; margin-bottom:10px;">♻️</div>
        <p>휴지통이 비어 있습니다.</p>
       </div>`
    : trash.map(item => `
      <div class="neo-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px;">
        <div>
          <span class="badge-mini" style="background:#64748b;">${item.type === 'guideline_major' ? '대분류' : '중분류'}</span>
          <span style="font-weight:700; margin-left:8px;">${escapeHtml(item.title || item.sub || item.major)}</span>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">삭제일시: ${new Date(item.deletedAt).toLocaleString()}</div>
        </div>
        <button class="neo-btn-sm" style="background:#10b981; color:#fff; border:none;" onclick="window.app.restoreFromTrash('${item.id}')">복구</button>
      </div>
    `).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
      <h2 class="section-title">🗑️ 휴지통</h2>
      <p class="section-subtitle">삭제된 항목들을 복구하거나 완전히 삭제할 수 있습니다.</p>
      ${trash.length > 0 ? `<button class="neo-btn-sm" style="background:#ef4444; color:#fff; border:none; margin-top:10px;" onclick="window.app.emptyTrash()">휴지통 비우기</button>` : ''}
    </div>
    <div style="display:grid; gap:12px; margin-top:20px;">
      ${itemsHtml}
    </div>
  `;
}

/**
 * 약물 전체 목록 렌더링 (대체용)
 */
export function renderDrugList(isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  if (!container) return;
  
  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/drugs')">← BACK</button>
      <h2 class="section-title">💊 약물 전체 목록</h2>
      <p class="section-subtitle">현재 대분류별로 탐색 중입니다. 전체 목록 기능은 준비 중입니다.</p>
    </div>
  `;
}

/**
 * 관리자(사용자) 권한 관리 페이지 렌더링
 */
export function renderUserManagement(admins, isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  const CONTENT_ID_VAL = "app-content"; 
  const target = container || document.getElementById(CONTENT_ID_VAL);
  
  if (!Array.isArray(admins)) {
    target.innerHTML = `
      <div class="section-header">
        <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
        <h2 class="section-title">⚠️ 접근 권한 오류</h2>
      </div>
      <div class="neo-card" style="padding: 30px; text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 20px;"></i>
        <p>관리자 목록을 불러올 권한이 없거나 서버 오류가 발생했습니다.</p>
        <p style="font-size: 13px; color: #64748b; margin-top: 10px;">${admins.error || 'Unknown Error'}</p>
      </div>
    `;
    return;
  }
  
  const adminsHtml = admins.map(admin => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${admin.email}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <span class="badge-mini" style="background: ${admin.role === 'super' ? '#8b5cf6' : '#64748b'};">
          ${admin.role === 'super' ? '최고 관리자' : '관리자'}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ${new Date(admin.added_at).toLocaleString()}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
        ${admin.role !== 'super' ? `
          <button class="neo-btn-sm danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.deleteAdmin('${admin.email}')">제거</button>
        ` : '-'}
      </td>
    </tr>
  `).join('');

  target.innerHTML = `
    <div class="section-header" style="position: relative;">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
      <h2 class="section-title">👥 사용자 권한 관리</h2>
      <p class="section-subtitle">시스템에 접근하여 데이터를 수정할 수 있는 관리자 목록을 관리합니다.</p>
    </div>

    <div class="neo-card" style="margin-top: 20px; padding: 25px;">
      <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">➕ 새로운 관리자 추가</h3>
      <div style="display: flex; gap: 10px; margin-bottom: 30px;">
        <input type="email" id="new-admin-email" placeholder="추가할 구글 계정 이메일 입력 (예: user@gmail.com)" class="neo-input" style="flex: 1;">
        <button class="neo-btn" style="white-space: nowrap;" onclick="window.app.addAdmin()">관리자 등록</button>
      </div>

      <h3 style="margin-bottom: 15px; font-size: 18px;">📋 현재 관리자 목록</h3>
      <div class="fix-table-wrapper" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">이메일 주소</th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">권한</th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">등록일</th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black); text-align: right;">작업</th>
            </tr>
          </thead>
          <tbody>
            ${adminsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
