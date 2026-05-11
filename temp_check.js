// ????더??모듈 (UI ??성)
import { escapeHtml, cleanName } from './utils.js';
import { linkifySummary, getMajorCategories, getSubcategories } from './data-service.js';
import { hierarchicalSort } from './utils.js';

const CONTENT_ID = 'app-content';

// ???? ??퍼: ID??가??드??인 찾기
function getGuidelineById(id) {
    return window.DB.guidelines.find(g => g.id === id);
}

// ???? ??퍼: 관리자??개발????이????성
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
 * 메인 ????보??????더??
 */
function renderHome(isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  
  // 가??드??인 ??계 계산
  const totalGuidelines = window.DB.guidelines.length;
  const summarizedCount = window.DB.guidelines.filter(g => g.aiSummary).length;
  const progressPercent = Math.round((summarizedCount / totalGuidelines) * 100);

  container.innerHTML = `
    <section class="hero-section" style="position: relative;">
      ${devLabel('HeroSection', isAdmin)}
      <h1 class="pixel-title">PharmInfo Portal</h1>
      <p class="section-subtitle">??상 ??사????한 ??공지??기반 ??학 지????랫??/p>
      ${isAdmin ? `
        <div style="margin-top: 20px;">
          <button class="neo-btn-sm" onclick="window.app.navigateTo('/admin/guide')" style="background: var(--secondary); color: white; border: 2px solid var(--black);">???????스??구성 가??드 ??인</button>
        </div>
      ` : ''}
    </section>

    <div class="grid-container">
      ${devLabel('CategoryGrid', isAdmin)}
      <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines')">
        <h2 class="card-title">??? 가??드??인</h2>
        <p class="card-desc">질환??최신 ??상 가??드??인??AI ??약????인??세??</p>
        <div class="neo-btn-sm center-margin">바로가??/div>
      </div>
      <div class="neo-card clickable" onclick="window.app.navigateTo('/drugs')">
        <h2 class="card-title">??? ??물 ??보</h2>
        <p class="card-desc">??분????능, ??법 ??주의??항????색??니??</p>
        <div class="neo-btn-sm center-margin">바로가??/div>
      </div>
      <div class="neo-card clickable" onclick="window.app.navigateTo('/supplements')">
        <h2 class="card-title">??? 건강기능??품</h2>
        <p class="card-desc">기능????료????과?? ???? 가??드????인??세??</p>
        <div class="neo-btn-sm center-margin">바로가??/div>
      </div>
    </div>
  `;
}

/**
 * 가??드??인 ??분류 \uBAA9\uB85D ??더??
 */
function renderGuidelineMajors(isAdmin) {
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
           data-major="${major}"
           onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(major)}')"
           style="position: relative;">
        ${isAdmin ? `<div class="drag-handle" style="position:absolute; top:12px; left:12px; cursor:grab; color:var(--black); z-index:100; background:rgba(255,255,255,0.9); border:2px solid var(--black); padding:4px 6px; border-radius:4px; box-shadow: 2px 2px 0px #000;"><i class="fas fa-grip-vertical"></i></div>` : ''}
        <div class="badge-mini" style="${isAdmin ? 'margin-left: 15px;' : ''}">GUIDELINE</div>
        <h3 class="card-title" style="${isAdmin ? 'margin-left: 15px;' : ''}">${escapeHtml(cleanName(major))}</h3>
        
        <div class="guideline-sub-grid">
          ${subButtonsHtml}
        </div>

        ${hasMore ? `
          <button class="more-toggle-btn" 
            onclick="event.stopPropagation(); 
            const card = this.closest('.guideline-major-card');
            const isExpanded = card.classList.toggle('expanded');
            this.classList.toggle('active');
            this.innerText = isExpanded ? '간략??보기 ?? : '??보??(+${extraItems.length}) ??;
          ">??보??(+${extraItems.length}) ??/button>
        ` : ''}

        ${isAdmin ? `
          <div class="category-admin-tools">
            <button class="admin-btn-mini edit-btn" onclick="event.stopPropagation(); window.app.renameGuidelineCategory('${escapeHtml(major)}')" title="??름 ??정">
              <i class="fas fa-edit"></i>
            </button>
            <button class="admin-btn-mini trash-btn" onclick="event.stopPropagation(); window.app.deleteGuidelineCategory('${escapeHtml(major)}')" title="????">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header" style="position: relative;">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">??HOME</button>
      ${devLabel('GuidelineMajors', isAdmin)}
      <h2 class="section-title">가??드??인 ??분류</h2>
    </div>
    <div class="grid-container" id="major-list-container">
      ${cardsHtml}
      ${isAdmin ? `
        <div class="neo-card clickable add-card" onclick="window.app.addGuidelineMajor()" style="border-style: dashed; background: #f8fafc; border-width: 4px; display: flex; align-items: center; justify-content: center; min-height: 200px;">
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">??/div>
            <div style="font-weight: 800;">????분류 추??</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * ??정 ??분류 ??래??중분??Subcategory) \uBAA9\uB85D ??더??
 */
function renderGuidelineSubcategories(majorName, isAdmin) {
  const subsMap = getSubcategories(majorName);
  const container = document.getElementById(CONTENT_ID);
  const sortedSubs = Object.keys(subsMap).sort((a, b) => {
    const metadata = window.DB.categoryMetadata || [];
    const metaA = metadata.find(m => m.major === majorName && m.sub === a);
    const metaB = metadata.find(m => m.major === majorName && m.sub === b);
    
    const orderA = metaA ? (metaA.sort_order || 0) : 0;
    const orderB = metaB ? (metaB.sort_order || 0) : 0;
    
    if (orderA !== orderB) return orderA - orderB;
    return hierarchicalSort(a, b);
  });

  let cardsHtml = sortedSubs.map(sub => {
    const items = (subsMap[sub] || []).sort((a, b) => {
      // 1. ??용??지????서 (sort_order) ??선
      const orderA = a.sort_order || 0;
      const orderB = b.sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      // 2. 발행??도 (최신??
      const yearDiff = parseInt(b.year || 0) - parseInt(a.year || 0);
      if (yearDiff !== 0) return yearDiff;
      // 3. ??목??
      return hierarchicalSort(a.title, b.title);
    });
    
    const itemListHtml = items.map(i => `<li>${escapeHtml(i.title)}</li>`).join('');

    return `
      <div class="neo-card clickable guideline-subcategory-card" 
           data-major="${escapeHtml(majorName)}"
           data-sub="${escapeHtml(sub)}"
           onclick="window.app.navigateTo('/guidelines/subcategory/${encodeURIComponent(majorName)}/${encodeURIComponent(sub)}')"
           style="position: relative;">
        ${isAdmin ? `<div class="drag-handle" style="position:absolute; top:12px; left:12px; cursor:grab; color:var(--black); z-index:100; background:rgba(255,255,255,0.9); border:2px solid var(--black); padding:4px 6px; border-radius:4px; box-shadow: 2px 2px 0px #000;"><i class="fas fa-grip-vertical"></i></div>` : ''}
        <div class="badge-mini" style="${isAdmin ? 'margin-left: 25px; margin-top: 5px;' : ''}">SUBCATEGORY</div>
        <h3 class="card-title" style="${isAdmin ? 'margin-left: 25px;' : ''}">${escapeHtml(sub)}</h3>
        <ul class="card-preview-list">
          ${itemListHtml}
        </ul>
        ${isAdmin ? `
          <div class="category-admin-tools">
            <button class="admin-btn-mini move-btn" onclick="event.stopPropagation(); window.app.openSubcategoryMoveModal('${escapeHtml(majorName)}', '${escapeHtml(sub)}')" title="??분류 ??동" style="background: #fbbf24;">
              <i class="fas fa-file-export" style="color: #000;"></i>
            </button>
            <button class="admin-btn-mini edit-btn" onclick="event.stopPropagation(); window.app.renameGuidelineCategory('${escapeHtml(majorName)}', '${escapeHtml(sub)}')" title="??름 ??정">
              <i class="fas fa-edit"></i>
            </button>
            <button class="admin-btn-mini trash-btn" onclick="event.stopPropagation(); window.app.deleteGuidelineCategory('${escapeHtml(majorName)}', '${escapeHtml(sub)}')" title="????">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines')">??CATEGORIES</button>
      ${devLabel('GuidelineSubs', isAdmin)}
      <h2 class="section-title">${escapeHtml(majorName)}</h2>
      <p class="section-subtitle">??택??신 분야?????? 분류????택??주??요.</p>
    </div>
    <div class="grid-container" id="subcategory-list-container">
      ${cardsHtml}
      ${isAdmin ? `
        <div class="neo-card clickable add-card" onclick="window.app.addGuidelineSubcategory('${escapeHtml(majorName)}')" style="border-style: dashed; background: #f8fafc; border-width: 4px; display: flex; align-items: center; justify-content: center; min-height: 200px;">
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">??/div>
            <div style="font-weight: 800;">??중분??추??</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * ??정 ??분????래??가??드??인(Items) \uBAA9\uB85D ??더??
 */
function renderGuidelineItems(majorName, subName, isAdmin) {
  const subsMap = getSubcategories(majorName);
  const rawData = (subsMap[subName] || []);
  
  const sortFn = (a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    const yearDiff = parseInt(b.year || 0) - parseInt(a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return hierarchicalSort(a.title, b.title);
  };

  const currentGuidelines = rawData.filter(g => !g.is_old).sort(sortFn);
  const oldGuidelines = rawData.filter(g => g.is_old).sort(sortFn);

  const container = document.getElementById(CONTENT_ID);
  if (!container) return;

  const renderItem = (g) => {
    const countryFlags = { "\uD55C\uAD6D": "????", "\uBBF8\uAD6D": "????", "\uC720\uB7FD": "????" };
    const flag = countryFlags[g.country] || "??";
    const countryHtml = `<div class="item-country-container" style="width: 150px; height: 34px; display: flex; align-items: center; flex-shrink: 0;">${g.country ? `<span class="item-country" style="font-size: 11px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px; background: #f8fafc; padding: 0 8px; border-radius: 4px; border: 1.5px solid #000; box-shadow: 2px 2px 0px #000; height: 28px; line-height: 28px; white-space: nowrap;">(${flag}) ${g.country}</span>` : ''}</div>`;

    return `
      <div class="neo-card clickable item-card-cube ${g.is_checked ? 'is-done' : ''}" 
           data-id="${g.id}"
           onclick="window.app.navigateTo('/guidelines/${g.id}')"
           style="position: relative; padding: 16px !important;">
        
        <div class="item-status-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; height: 34px;">
          ${isAdmin ? `
            <div class="drag-handle" style="cursor:grab; color:var(--black); background:rgba(255,255,255,0.9); border:2px solid var(--black); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius:4px; box-shadow: 2px 2px 0px #000; flex-shrink: 0;">
              <i class="fas fa-grip-vertical"></i>
            </div>
          ` : ''}
          
          <div style="width: 65px; height: 34px; display: flex; align-items: center; flex-shrink: 0;">
            <span class="item-year" style="width: 100%; margin: 0;">${g.year || '-'}</span>
          </div>
          
          ${countryHtml}
          
          <div style="margin-left: auto; display: flex; align-items: center; gap: 4px;">
            <div class="guideline-check-tool" 
                 onclick="event.stopPropagation(); window.app.toggleGuidelineCheck('${g.id}', ${!g.is_checked})"
                 style="cursor: pointer; font-size: 20px; color: ${g.is_checked ? '#10b981' : '#cbd5e1'}; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="${g.is_checked ? 'fas fa-check-square' : 'far fa-square'}"></i>
            </div>
            
            ${isAdmin ? `
              <button class="guideline-move-tool action-btn" 
                      onclick="event.stopPropagation(); window.app.openGuidelineMoveModal('${g.id}')"
                      style="background:none; border:none; cursor: pointer; font-size: 18px; color: #3b82f6; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; padding: 0;"
                      title="분류 이동">
                <i class="fas fa-folder-open"></i>
              </button>
              <button class="guideline-delete-tool action-btn" 
                      onclick="event.stopPropagation(); window.app.deleteGuideline('${g.id}')"
                      style="background:none; border:none; cursor: pointer; font-size: 18px; color: #f87171; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; padding: 0;"
                      title="\uC0AD\uC11C">
                <i class="fas fa-trash-alt"></i>
              </button>
            ` : ''}
          </div>
        </div>
        
        <h4 class="item-title" style="margin-top: 0; font-size: 18px; line-height: 1.4;">${escapeHtml(g.title)}</h4>
        <p class="item-desc" style="margin-top: 8px;">${escapeHtml(g.desc || '')}</p>

        <div class="guideline-memo-container" style="margin-top: 10px;" onclick="event.stopPropagation()">
          <textarea 
            class="guideline-memo-textarea" 
            placeholder="메모를 입력하세요"
            onblur="window.app.saveGuidelineMemo('${g.id}', this.value)"
            style="width: 100%; min-height: 40px; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11px; line-height: 1.4; background: ${g.memo ? '#fefce8' : '#f8fafc'}; color: #334155; resize: none; transition: all 0.2s; font-family: inherit;"
          >${escapeHtml(g.memo || '')}</textarea>
        </div>
      </div>
    `;
  };

  const currentHtml = currentGuidelines.map(renderItem).join('');
  const oldHtml = oldGuidelines.map(renderItem).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(majorName)}')">← SUBS</button>
      ${devLabel('GuidelineList', isAdmin)}
      <h2 class="section-title">${escapeHtml(subName)}</h2>
      <p class="section-subtitle">${escapeHtml(majorName)}의 세부 \uAC00\uC774\uB4DC\uB77C\uC778 \uBAA9\uB85D입니다.</p>
    </div>

    ${(() => {
      const metadata = (window.DB.categoryMetadata || []).find(m => m.major === majorName && m.sub === subName);
      const summaryText = metadata ? metadata.summary : '';
      return `
        <div class="disease-integration-card neo-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 900;">??? 질환 통합\uC694\uC57D</h3>
            ${isAdmin ? `<button class="neo-btn-sm" onclick="window.app.toggleEditIntegrationSummary()" style="background: #4f46e5; color: white; border: none;">\uC218\uC815</button>` : ''}
          </div>
          <div id="integration-summary-display" style="font-size: 15px; line-height: 1.8; color: #334155;">
            ${window.renderMarkdown(linkifySummary(summaryText || '아직 등록된 통합 \uC694\uC57D이 없습니다. 사용자가 입력해 주세요.'))}
          </div>
          ${isAdmin ? `
          <div id="integration-summary-edit" style="display: none; margin-top: 12px;">
            <textarea id="integration-summary-textarea" style="width: 100%; min-height: 200px; padding: 12px; border: 3px solid #4f46e5; border-radius: 4px; font-family: inherit; font-size: 14px; line-height: 1.6;">${escapeHtml(summaryText)}</textarea>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <button class="neo-btn-sm" onclick="window.app.saveIntegrationSummary('${majorName.replace(/'/g, "\\'")}', '${subName.replace(/'/g, "\\'")}')" style="background: #4f46e5; color: white; border: none;">변경 내용 \uC800\uC7A5</button>
              <button class="neo-btn-sm" onclick="window.app.toggleEditIntegrationSummary()" style="background: #94a3b8; color: white; border: none;">\uC128\uC18C</button>
            </div>
          </div>
          ` : ''}
        </div>
      `;
    })()}

    ${isAdmin ? `
    <button class="neo-btn" id="toggleNewGuidelineForm" style="margin-bottom:16px; background: linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; font-weight:700; font-size:15px; padding:12px 24px; cursor:pointer; border-radius:8px;">
      + 새 \uAC00\uC774\uB4DC\uB77C\uC778 \uCD94\uAC00
    </button>
    ` : ''}

    <div id="newGuidelineFormWrapper" style="display:none; margin-bottom:24px;">
      <div class="neo-card" style="background:#f0fdf4; border:3px solid var(--black);">
        <h4 style="margin-top:0;">?? 새 \uAC00\uC774\uB4DC\uB77C\uC778 등록</h4>
        <form id="newGuidelineForm" style="display:grid; gap:12px;">
          <input type="hidden" name="major" value="${escapeHtml(majorName)}">
          <input type="hidden" name="sub" value="${escapeHtml(subName)}">
          <input type="text" name="title" required placeholder="제목 *" style="padding:10px; border:2px solid var(--black); border-radius:6px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <input type="text" name="year" placeholder="년도" style="padding:10px; border:2px solid var(--black); border-radius:6px;">
            <input type="text" name="publisher" placeholder="발행기관" style="padding:10px; border:2px solid var(--black); border-radius:6px;">
          </div>
          <input type="text" name="source_url" placeholder="학회/사이트 링크" style="padding:10px; border:2px solid var(--black); border-radius:6px;">
          <input type="file" name="guidelineFile" accept=".pdf,.hwp" style="padding:8px; border:2px solid var(--black); border-radius:6px; background:#fff;">
          <button type="submit" class="neo-btn-sm" style="background:#10b981; color:#fff; border:none; padding:10px 20px;">\uC800\uC7A5</button>
        </form>
        <div id="newGuidelineStatus" style="margin-top:10px;"></div>
      </div>
    </div>

    <div class="guideline-grid" id="guideline-sort-container">
      ${currentHtml}
    </div>

    ${oldGuidelines.length > 0 ? `
      <div class="old-guidelines-section" style="margin-top: 48px;">
        <h3 class="section-title" style="font-size: 20px; color: #64748b; margin-bottom: 16px;">?? 구판 \uAC00\uC774\uB4DC\uB77C\uC778</h3>
        <div class="guideline-grid">
          ${oldHtml}
        </div>
      </div>
    ` : ''}
  `;
  
  if (isAdmin) {
    window.app.initSortable();
    window.app.initNewGuidelineForm();
  }
}



function renderDetail(id, isAdmin) {
  const g = getGuidelineById(id);
  const container = document.getElementById(CONTENT_ID);
  
  if (!g) {
    if (container) container.innerHTML = '<div class="neo-card"><h3>??????찾을 ????습??다.</h3></div>';
    return;
  }

  // Runtime path correction: ensure all local paths use the correct documents directory
  const normalizeUrl = (u) => {
    if (!u || typeof u !== 'string' || u.trim() === '' || u === 'null') return '';
    if (u.startsWith('http')) return u;
    const segments = u.split('/');
    const fileName = segments[segments.length - 1];
    if (!fileName) return '';
    return 'guidelines/documents/' + fileName;
  };

  const normalizedUrls = Array.isArray(g.url) ? g.url.map(normalizeUrl).filter(u => u) : normalizeUrl(g.url || '');
  const primaryUrl = Array.isArray(normalizedUrls) ? (normalizedUrls[0] || '') : (normalizedUrls || '');
  const hasDocument = primaryUrl && primaryUrl.length > 0;

  const isExternal = hasDocument && typeof primaryUrl === 'string' && primaryUrl.startsWith('http');
  const isExternalHWP = isExternal && (primaryUrl.includes('boardDownload.es') || primaryUrl.toLowerCase().includes('.hwp'));

  // AI ??약 ??더??(??이???? ??거??관리자??????시)
  let summaryHtml = '';
  if (g.aiSummary || isAdmin) {
    const ai = g.aiSummary || '';
    
    // 기존??분리????이???? ??다????나????침
    let fullText = '';
    if (typeof ai === 'string') {
      fullText = ai;
    } else if (ai && typeof ai === 'object') {
      const parts = [];
      if (ai.overview) parts.push(`??? ??심 ??약: ${ai.overview}`);
      if (ai.firstLine) parts.push(`??? 1????택 ??제: ${ai.firstLine}`);
      if (ai.monitoring) parts.push(`??? 모니??링/??치: ${ai.monitoring}`);
      if (ai.cautions) parts.push(`??? 주의??항/금기: ${ai.cautions}`);
      if (ai.special) parts.push(`??? ??수??(????/??인): ${ai.special}`);
      fullText = parts.length > 0 ? parts.join('\n\n') : (ai.content || '');
    }

    if (!fullText && isAdmin) {
      fullText = '??직 ??약????록???? ??았??니?? ??정 버튼????러 마크??운 ??식??로 ??약????성??주세??';
    }

    summaryHtml = `
      <div class="ai-summary-card neo-card unified-summary">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div class="ai-badge" style="margin: 0;">??AI PHARMACIST SUMMARY</div>
          ${isAdmin ? `<button class="neo-btn-sm" onclick="window.app.toggleEditAiSummary()" style="background: var(--secondary); color: white; border: none; font-size: 12px; padding: 6px 12px;">??? ??약 ??정</button>` : ''}
        </div>

        <!-- 보기 모드 -->
        <div id="ai-summary-display" class="summary-content" style="white-space: normal; font-size: 15px; line-height: 1.8;">
          ${window.renderMarkdown(linkifySummary(fullText))}
        </div>

        <!-- ??집 모드 (??나??커다?? ??집?? -->
        ${isAdmin ? `
        <div id="ai-summary-edit" class="summary-content" style="display: none; border-top: 2px dashed #ddd; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label style="font-weight: 900; font-size: 16px;">??? ??약 ??용 ??합 ??집</label>
            <div>
              <button class="neo-btn-sm" onclick="document.getElementById('md-file-input').click()" style="background: #4f46e5; color: white; border: none; font-size: 11px;">??? MD ??일 불러??기</button>
              <input type="file" id="md-file-input" accept=".md" style="display: none;" onchange="window.app.handleMdFileUpload(event, '${id}')">
            </div>
          </div>
          <div class="edit-field" style="margin-bottom: 15px;">
            <textarea id="edit-ai-content" style="width: 100%; min-height: 400px; padding: 16px; border: 3px solid #000; font-family: inherit; font-size: 14px; line-height: 1.6; background: #fff;">${escapeHtml(fullText)}</textarea>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">
              * 줄바꿈을 ??용??여 ??용????유???? 구분??주세?? <br>
              * ??????<strong>assets/data/summaries/${id}.md</strong> ??일????동??로 ??성/??정??니??
            </p>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="neo-btn-sm" onclick="window.app.saveAiSummary('${id}')" style="background: var(--primary); color: white; border: none; font-weight: 900;">??? ????하??(??일 ??기??</button>
            <button class="neo-btn-sm" onclick="document.getElementById('edit-ai-content').value = '';" style="background: #ef4444; color: white; border: none;">???????용 비우??/button>
            <button class="neo-btn-sm" onclick="window.app.toggleEditAiSummary()" style="background: #94a3b8; color: white; border: none;">\uC128\uC18C</button>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }
  const isInternalHWP = hasDocument && !isExternal && primaryUrl.toLowerCase().endsWith('.hwp');

  let viewerHtml = '';
  const isPdf = primaryUrl.toLowerCase().includes('.pdf');

  if (!hasDocument) {
    viewerHtml = `
      <div style="margin-top: 20px; border: 3px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc;">
        <div style="padding: 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">???</div>
          <p style="font-size: 16px; font-weight: bold; color: #475569;">??문 가??드??인????결???? ??았??니??/p>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 8px;">관리자 모드??서 PDF ??일????로??하?????? 뷰어????람??????습??다.</p>
        </div>
      </div>
    `;
  } else if (isPdf) {
    // PDF 뷰어 (로컬/Firebase ??합 지??
    const viewerId = `pdf-viewer-${Date.now()}`;
    const fileName = primaryUrl.split('/').pop();
    const fetchUrl = isExternal ? primaryUrl : `/api/pdf/${encodeURIComponent(fileName)}`;
    
    viewerHtml = `
      <div class="pdf-viewer-container" style="background: #fff; overflow: hidden;">
        <div id="${viewerId}" style="width: 100%; height: 800px; display: flex; align-items: center; justify-content: center; background: #f1f5f9;">
          <div class="loading-spinner">PDF 문서????전??게 불러??는 중입??다... ??/div>
        </div>
      </div>
    `;

    setTimeout(async () => {
      const viewerArea = document.getElementById(viewerId);
      if (!viewerArea) return;

      const isActuallyExternal = fetchUrl.toLowerCase().startsWith('http');
      console.log(`[PDF Viewer] ID: ${id}, URL: ${fetchUrl}, External: ${isActuallyExternal}`);

      if (isActuallyExternal) {
        viewerArea.innerHTML = `<iframe src="${fetchUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
      } else {
        try {
          const response = await fetch(fetchUrl, {
            headers: { 'x-api-key': localStorage.getItem('firebaseToken') }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          viewerArea.innerHTML = `<iframe src="${blobUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
        } catch (err) {
          console.error("PDF Load Error:", err);
          viewerArea.innerHTML = `<div style="padding: 40px; text-align: center;">
            <p style="color: #ef4444; font-weight: bold;">??PDF 문서??로드???? 못했??니??</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">??인: ${err.message}</p>
            <a href="${fetchUrl}" target="_blank" class="neo-btn" style="margin-top: 20px; display: inline-block;">??? 직접 ??기 / ??운로드</a>
          </div>`;
        }
      }
    }, 200);

  } else if (isInternalHWP) {
    viewerHtml = `
      <div class="pdf-container-a4 hwp-container" style="background:#fff; padding:20px; overflow:auto; min-height:800px;">
        <div id="hwp-render-area" style="text-align:center; padding-top:50px; font-weight:bold; font-size:18px;">
          HWP 뷰어??불러??는 중입??다... ??
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const hwpArea = document.getElementById('hwp-render-area');
      if (!hwpArea) return;

      fetch(primaryUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(buffer => {
          import('./hwp-viewer.js')
            .then(module => {
              hwpArea.innerHTML = '';
              hwpArea.style.minHeight = '800px';
              const HwpViewer = module.Viewer;
              new HwpViewer(hwpArea, new Uint8Array(buffer), { type: 'binary' });
            })
            .catch(err => {
              console.error("HWP Module Load Error:", err);
              hwpArea.innerHTML = `<div style="text-align:center; padding:40px;">
                <p style="font-size:16px; font-weight:bold; color:#dc2626;">??? HWP 뷰어??로드??????습??다</p>
                <a href="${primaryUrl}" download class="neo-btn" style="margin-top:16px; display:inline-block;">??? HWP ??일 ??운로드</a>
              </div>`;
            });
        })
        .catch(err => {
          console.error("HWP File Fetch Error:", err);
          hwpArea.innerHTML = `<div style="text-align:center; padding:40px;">
            <p style="font-size:16px; font-weight:bold; color:#dc2626;">??? HWP ??일??불러??????습??다</p>
            <a href="${primaryUrl}" download class="neo-btn" style="margin-top:16px; display:inline-block;">??? HWP ??일 ??운로드</a>
          </div>`;
        });
    }, 500);

  } else {
    viewerHtml = `
      <div class="external-link-container">
        <div class="external-link-card">
          <div class="external-icon">???</div>
          <h3>??문 가??드??인 ??결</h3>
          <p>??지침?? ???? 링크 ??는 ??정 ??식????용??니?? ??래????문 바로가??버튼????용??주??요.</p>
          <a href="${primaryUrl}" target="_blank" class="neo-btn-lg">??문 가??드??인 ??창에????기</a>
          ${isExternalHWP ? '<div class="hwp-alert">??? ????(HWP) ??일??경우 별도??뷰어가 ??요??니??</div>' : ''}
        </div>
      </div>
    `;
  }

  const linkSectionHtml = isAdmin ? `
    <div style="display: grid; gap: 15px;">
      <!-- 분류 ????? ??택 ??션 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f1f5f9; padding: 12px; border-radius: 8px; border: 2px dashed #cbd5e1;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #475569;">??? ??분류 (Major)</label>
          <select id="edit-major" class="neo-input" onchange="window.app.handleCategorySelectChange('major', this.value)" style="padding: 10px; font-size: 14px; background: white;">
            ${getMajorCategories().map(m => `<option value="${escapeHtml(m)}" ${m === g.major ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
            <option value="__NEW__">??? + ??로????분류 추??</option>
          </select>
          <input type="text" id="new-major-input" class="neo-input" style="display:none; margin-top:5px; padding: 10px; font-size: 14px; border-color: #8b5cf6;" placeholder="????분류 ??름 ??력">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #475569;">??? 중분??(Sub)</label>
          <select id="edit-sub" class="neo-input" onchange="window.app.handleCategorySelectChange('sub', this.value)" style="padding: 10px; font-size: 14px; background: white;">
            ${Object.keys(getSubcategories(g.major)).map(s => `<option value="${escapeHtml(s)}" ${s === g.sub ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
            <option value="__NEW__">??? + ??로??중분??추??</option>
          </select>
          <input type="text" id="new-sub-input" class="neo-input" style="display:none; margin-top:5px; padding: 10px; font-size: 14px; border-color: #8b5cf6;" placeholder="??중분????름 ??력">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #475569;">??? ??? (Country)</label>
          <select id="edit-country" class="neo-input" onchange="window.app.handleCategorySelectChange('country', this.value)" style="padding: 10px; font-size: 14px; background: white;">
            <option value="" ${!g.country ? 'selected' : ''}>??택 ??함</option>
            <option value="???" ${g.country === '???' ? 'selected' : ''}>?????? South Korea</option>
            <option value="???" ${g.country === '???' ? 'selected' : ''}>?????? United States</option>
            <option value="????" ${g.country === '????' ? 'selected' : ''}>?????? European Union</option>
            ${g.country && !['???', '???', '????'].includes(g.country) ? `<option value="${escapeHtml(g.country)}" selected>${escapeHtml(g.country)}</option>` : ''}
            <option value="__NEW__">??? + ??로????? 추??</option>
          </select>
          <input type="text" id="new-country-input" class="neo-input" style="display:none; margin-top:5px; padding: 10px; font-size: 14px; border-color: #8b5cf6;" placeholder="????? ??름 ??력">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b;">??? 가??드??인 명칭 (Title)</label>
          <input type="text" id="edit-title" value="${escapeHtml(g.title || '')}" class="neo-input" style="padding: 10px; font-size: 14px;" placeholder="가??드??인 ??목">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b;">??? 발행??도 (Year)</label>
          <input type="text" id="edit-year" value="${escapeHtml(g.year || '')}" class="neo-input" style="padding: 10px; font-size: 14px;" placeholder="?? 2024">
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <label style="font-size: 12px; font-weight: 700; color: #64748b;">??? 발행기?? (Publisher)</label>
        <input type="text" id="edit-publisher" value="${escapeHtml(g.publisher || '')}" class="neo-input" style="padding: 10px; font-size: 14px;" placeholder="?? ????고??압??회">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b;">??? ??회/??이??링크 (????문)</label>
          <div style="display: flex; gap: 6px;">
            <input type="text" id="edit-source-url" value="${escapeHtml(g.source_url || '')}" class="neo-input" style="padding: 8px; font-size: 13px; flex: 1;" placeholder="https://...">
            <a id="test-source-url" href="${g.source_url || '#'}" target="_blank" class="neo-btn-sm" style="background: #6366f1; color: white; border: none; text-decoration: none; padding: 0 12px; display: flex; align-items: center; font-weight: 700; border-radius: 4px;">??스??/a>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b;">??? PDF ??일??(기존 ??일)</label>
          <div style="display: flex; gap: 6px;">
            <input type="text" id="edit-url" value="${escapeHtml(g.url && typeof g.url === 'string' ? g.url : primaryUrl)}" class="neo-input" style="padding: 8px; font-size: 13px; flex: 1;" placeholder="filename.pdf">
            <a id="test-pdf-url" href="${primaryUrl.startsWith('http') ? primaryUrl : `/api/pdf/${encodeURIComponent(primaryUrl.split('/').pop())}`}" target="_blank" class="neo-btn-sm" style="background: #3b82f6; color: white; border: none; text-decoration: none; padding: 0 12px; display: flex; align-items: center; font-weight: 700; border-radius: 4px;">??스??/a>
          </div>
        </div>
      </div>
      <div style="margin-top: 5px;">
        <button class="neo-btn" onclick="window.app.updateGuidelineDetails('${id}')" style="width: 100%; background: #10b981; color: white; border: none; font-weight: 900; height: 44px; font-size: 16px; box-shadow: 4px 4px 0px #000;">??? 모든 ??보 ????????목/??도 ??데??트</button>
      </div>
    </div>
  ` : `
    <div style="display: grid; gap: 15px; background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
        <div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">가??드??인 명칭</div>
          <div style="font-weight: 700; color: var(--black); font-size: 15px;">${escapeHtml(g.title)}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">발행??도 / 기??</div>
          <div style="font-weight: 700; color: var(--black); font-size: 15px;">${g.year || '미상'} | ${escapeHtml(g.publisher || '공식 가??드??인')}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">발행 ???</div>
          <div style="font-weight: 700; color: var(--black); font-size: 15px;">
            ${(() => {
              const flags = { '???': '??????', '???': '??????', '????': '??????' };
              const flag = flags[g.country] || '???';
              return g.country ? `(${flag}) ${g.country}` : '미????;
            })()}
          </div>
        </div>
      </div>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; display: flex; justify-content: flex-end;">
        ${g.source_url ? `
          <a href="${g.source_url}" target="_blank" class="neo-btn-sm" style="background: #6366f1; color: white; border: none; text-decoration: none; display: flex; align-items: center; gap: 6px; font-weight: 700;">
            <i class="fas fa-globe"></i> 공식 ??회 ??이??방문
          </a>
        ` : ''}
      </div>
    </div>
  `;

  container.innerHTML = `
    <button class="neo-back-btn" onclick="history.back()">??BACK</button>
    <div class="detail-view neo-card" style="position: relative;">
      ${devLabel('GuidelineDetail', isAdmin)}
      <div class="detail-header" style="display: flex; align-items: flex-start; gap: 15px;">
        <div class="guideline-check-tool" 
             onclick="event.stopPropagation(); window.app.toggleGuidelineCheck('${id}', ${!g.is_checked})"
             style="cursor: pointer; font-size: 24px; color: ${g.is_checked ? '#10b981' : '#cbd5e1'}; margin-top: 5px;">
          <i class="${g.is_checked ? 'fas fa-check-square' : 'far fa-square'}"></i>
        </div>
        <div style="flex: 1;">
          <div class="badge">${escapeHtml(g.major || '가??드??인')}</div>
          <h2 class="detail-title" style="margin-top: 4px;">${escapeHtml(g.title)}</h2>
          <p class="detail-meta">발행??도: ${g.year || '미상'} | 출처: ${g.publisher || '공식 가??드??인'}</p>
        </div>
      </div>
      
      ${summaryHtml}

      <div class="neo-card" style="margin-bottom: 25px; padding: 20px; background: #f8fafc; border: 2px solid var(--black);">
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">???</span> 가??드??인 ??문 ????회 링크
        </h3>
        ${linkSectionHtml}
      </div>

      ${isAdmin && hasDocument ? `
        <div class="pdf-section" style="margin-top: 20px;">
          <div class="neo-card-header" style="background: #334155; color: white; border-radius: 8px 8px 0 0; padding: 10px 15px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
            <span>??? 가??드??인 ??문 미리보기 (관리자 ??용)</span>
            <button class="neo-btn-sm" onclick="const s = document.getElementById('viewer-content'); s.style.display = s.style.display === 'none' ? 'block' : 'none'; this.innerText = s.style.display === 'none' ? '??치???? : '??기 ??;" style="background: #475569; border: 1px solid #94a3b8; font-size: 11px; color: white;">??기 ??/button>
          </div>
          <div id="viewer-content" style="border: 3px solid #334155; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; background: #fff;">
            ${viewerHtml}
          </div>
        </div>
      ` : ''}

      ${isAdmin ? `
      <div class="admin-only-section" style="margin-top: 30px; border-top: 2px dashed #cbd5e1; padding-top: 20px;">
        <div class="badge" style="background: #ef4444; color: white; margin-bottom: 15px;">ADMIN ONLY</div>
        
        <div class="local-upload-section neo-card" style="background: #f0fdf4; border: 3px solid var(--black);">
          <h4 style="margin-top:0;">??? ??일 교체 / 직접 ??로??(Firebase ??동 ??송)</h4>
          <form id="inlineUploadForm-${g.id}" style="display: flex; gap: 10px; align-items: center;">
            <input type="hidden" name="guidelineId" value="${g.id}">
            <input type="file" name="guidelineFile" accept=".pdf,.hwp" required style="border: 2px solid var(--black); padding: 5px; flex-grow: 1; background: #fff;">
            <div style="display: flex; gap: 8px;">
              <button type="submit" class="neo-btn-sm">??로??/button>
            </div>
          </form>
          <div id="uploadStatus-${g.id}" style="margin-top: 10px; font-weight: bold; font-size: 14px;"></div>
        </div>

        <div class="local-upload-section neo-card" style="margin-top: 20px; background: #fffbeb; border: 3px solid var(--black);">
          <h4 style="margin-top:0;">??? Firebase URL 직접 ??결</h4>
          <p style="font-size: 12px; color: #92400e; margin-bottom: 10px;">Firebase Console??서 복사??'Download URL'??직접 ??력??여 ??결??니??</p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="text" id="manualUrlInput-${g.id}" placeholder="https://firebasestorage.googleapis.com/..." style="border: 2px solid var(--black); padding: 10px; flex-grow: 1; background: #fff; font-size: 13px;">
            <button class="neo-btn-sm" onclick="window.app.linkManualFirebaseUrl('${g.id}')">링크 ??결</button>
            <button class="neo-btn-sm" onclick="window.app.unlinkGuidelinePDF('${g.id}')" style="background: #ef4444; color: white; border: none;">??결 ??제</button>
          </div>
          <div id="linkStatus-${g.id}" style="margin-top: 10px; font-weight: bold; font-size: 14px;"></div>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  setTimeout(() => {
    const inlineForm = document.getElementById(`inlineUploadForm-${g.id}`);
    if (inlineForm) {
      inlineForm.onsubmit = (e) => {
        e.preventDefault();
        window.app.uploadGuidelineFile(g.id, inlineForm);
      };
    }
  }, 0);
}

function renderTrash() {
  const container = document.getElementById(CONTENT_ID);
  const trash = window.DB.trash || [];

  let itemsHtml = trash.length === 0 
    ? `<div style="text-align:center; padding:50px; color:#64748b; border:2px dashed #cbd5e1; border-radius:12px; grid-column: 1 / -1;">
        <div style="font-size:40px; margin-bottom:10px;">???</div>
        <p>??????이 비어 ??습??다.</p>
       </div>`
    : trash.map(item => `
      <div class="neo-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px;">
        <div>
          <span class="badge-mini" style="background:#64748b;">${item.type === 'guideline_major' ? '??분류' : '중분??}</span>
          <span style="font-weight:700; margin-left:8px;">${escapeHtml(item.title || item.sub || item.major)}</span>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">??????시: ${new Date(item.deletedAt).toLocaleString()}</div>
        </div>
        <button class="neo-btn-sm" style="background:#10b981; color:#fff; border:none;" onclick="window.app.restoreFromTrash('${item.id}')">복구</button>
      </div>
    `).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">??HOME</button>
      <h2 class="section-title">???????????/h2>
      <p class="section-subtitle">????????????을 복구??거????전????????????습??다.</p>
      ${trash.length > 0 ? `<button class="neo-btn-sm" style="background:#ef4444; color:#fff; border:none; margin-top:10px;" onclick="window.app.emptyTrash()">??????비우??/button>` : ''}
    </div>
    <div style="display:grid; gap:12px; margin-top:20px;">
      ${itemsHtml}
    </div>
  `;
}

/**
 * ??물 ??체 \uBAA9\uB85D ??더??(??체용)
 */
function renderDrugList(isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  if (!container) return;
  
  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/drugs')">??BACK</button>
      <h2 class="section-title">??? ??물 ??체 \uBAA9\uB85D</h2>
      <p class="section-subtitle">??재 ??분류별로 ??색 중입??다. ??체 \uBAA9\uB85D 기능?? 준??중입??다.</p>
    </div>
  `;
}

/**
 * 관리자(??용?? 권한 관????이지 ??더??
 */
function renderUserManagement(admins, isAdmin) {
  const container = document.getElementById(CONTENT_ID);
  const CONTENT_ID_VAL = "app-content"; 
  const target = container || document.getElementById(CONTENT_ID_VAL);
  
  if (!Array.isArray(admins)) {
    target.innerHTML = `
      <div class="section-header">
        <button class="neo-back-btn" onclick="window.app.navigateTo('/')">??HOME</button>
        <h2 class="section-title">??? ??근 권한 ??류</h2>
      </div>
      <div class="neo-card" style="padding: 30px; text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 20px;"></i>
        <p>관리자 \uBAA9\uB85D??불러??권한????거????버 ??류가 발생??습??다.</p>
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
          <button class="neo-btn-sm danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.deleteAdmin('${admin.email}')">??거</button>
        ` : '-'}
      </td>
    </tr>
  `).join('');

  target.innerHTML = `
    <div class="section-header" style="position: relative;">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">??HOME</button>
      <h2 class="section-title">??? ??용??권한 관??/h2>
      <p class="section-subtitle">??스??에 ??근??여 ??이???? ??정??????는 관리자 \uBAA9\uB85D??관리합??다.</p>
    </div>

    <div class="neo-card" style="margin-top: 20px; padding: 25px;">
      <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">????로??관리자 추??</h3>
      <div style="display: flex; gap: 10px; margin-bottom: 30px;">
        <input type="email" id="new-admin-email" placeholder="추????구?? 계정 ??메????력 (?? user@gmail.com)" class="neo-input" style="flex: 1;">
        <button class="neo-btn" style="white-space: nowrap;" onclick="window.app.addAdmin()">관리자 ??록</button>
      </div>

      <h3 style="margin-bottom: 15px; font-size: 18px;">??? ??재 관리자 \uBAA9\uB85D</h3>
      <div class="fix-table-wrapper" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">??메??주소</th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">권한</th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black);">??록??/th>
              <th style="padding: 12px; border-bottom: 2px solid var(--black); text-align: right;">??업</th>
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
