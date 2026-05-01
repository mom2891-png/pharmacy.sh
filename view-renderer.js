// 뷰 렌더러 모듈 (UI 생성)
import { escapeHtml } from './utils.js';
import { linkifySummary, getMajorCategories, getSubcategories } from './data-service.js';
import { hierarchicalSort } from './utils.js';

const CONTENT_ID = 'app-content';

/**
 * 메인 대시보드 홈 렌더링
 */
export function renderHome() {
  const container = document.getElementById(CONTENT_ID);
  
  // 가이드라인 통계 계산
  const totalGuidelines = window.DB.guidelines.length;
  const summarizedCount = window.DB.guidelines.filter(g => g.aiSummary).length;
  const progressPercent = Math.round((summarizedCount / totalGuidelines) * 100);

  container.innerHTML = `
    <section class="hero-section">
      <h1 class="pixel-title">PharmInfo Portal</h1>
      <p class="section-subtitle">임상 약사를 위한 인공지능 기반 약학 지식 플랫폼</p>
    </section>

    <div class="stats-banner neo-card">
      <div class="stat-item">
        <span class="stat-value">${totalGuidelines}</span>
        <span class="stat-label">임상 가이드라인</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${summarizedCount}</span>
        <span class="stat-label">AI 요약 완료</span>
      </div>
      <div class="stat-progress-container">
          <div class="stat-progress-bar" style="width: ${progressPercent}%"></div>
          <span class="stat-progress-text">요약 진행률 ${progressPercent}%</span>
      </div>
    </div>

    <div class="grid-container">
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
export function renderGuidelineMajors() {
  const majors = getMajorCategories();
  const container = document.getElementById(CONTENT_ID);
  
  let cardsHtml = majors.map(major => {
    // 해당 대분류의 중분류 목록 추출 (모든 항목 표시)
    const subs = Object.keys(getSubcategories(major));
    const subListHtml = subs.map(s => `<li>${escapeHtml(s)}</li>`).join('');

    return `
      <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(major)}')">
        <div class="badge-mini">CATEGORY</div>
        <h3 class="card-title">${escapeHtml(major)}</h3>
        <ul class="card-preview-list">
          ${subListHtml}
        </ul>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/')">← HOME</button>
      <h2 class="section-title">가이드라인 대분류</h2>
    </div>
    <div class="grid-container">${cardsHtml}</div>
  `;
}

/**
 * 특정 대분류 아래의 중분류(Subcategory) 목록 렌더링
 */
export function renderGuidelineSubcategories(majorName) {
  const subsMap = getSubcategories(majorName);
  const container = document.getElementById(CONTENT_ID);
  const sortedSubs = Object.keys(subsMap).sort(hierarchicalSort);

  let cardsHtml = sortedSubs.map(sub => {
    // 해당 중분류의 가이드라인 제목 추출 (모든 항목 표시)
    const items = subsMap[sub];
    const itemListHtml = items.map(i => `<li>${escapeHtml(i.title)}</li>`).join('');

    return `
      <div class="neo-card clickable" onclick="window.app.navigateTo('/guidelines/subcategory/${encodeURIComponent(majorName)}/${encodeURIComponent(sub)}')">
        <div class="badge-mini">SUBCATEGORY</div>
        <h3 class="card-title">${escapeHtml(sub)}</h3>
        <ul class="card-preview-list">
          ${itemListHtml}
        </ul>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines')">← CATEGORIES</button>
      <h2 class="section-title">${escapeHtml(majorName)}</h2>
      <p class="section-subtitle">선택하신 분야의 세부 분류를 선택해주세요.</p>
    </div>
    <div class="grid-container">${cardsHtml}</div>
  `;
}

/**
 * 특정 소분류 아래의 가이드라인(Items) 목록 렌더링
 */
export function renderGuidelineItems(majorName, subName) {
  const subsMap = getSubcategories(majorName);
  const data = (subsMap[subName] || []).sort((a, b) => {
    // 발행연도 내림차순 후 제목 숫자 정렬
    const yearDiff = parseInt(b.year || 0) - parseInt(a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return hierarchicalSort(a.title, b.title);
  });

  const container = document.getElementById(CONTENT_ID);
  
  let listHtml = data.map(g => {
    // 내부 뷰어 가능 여부 판단
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
      <div class="neo-card clickable item-card-cube" onclick="window.app.navigateTo('/guidelines/${g.id}')">
        <div class="item-status-row">
          <span class="item-year">${g.year || '-'}</span>
          ${badgeHtml}
        </div>
        <h3 class="item-title">${escapeHtml(g.title)}</h3>
        <div class="item-meta">
          <span class="source-tag">${escapeHtml(g.publisher || '공식 지침')}</span>
          <div class="status-indicators">
            ${g.aiSummary ? '<span class="status-ai" title="AI 요약 제공">✨ AI 요약</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <button class="neo-back-btn" onclick="window.app.navigateTo('/guidelines/category/${encodeURIComponent(majorName)}')">← SUBCATEGORIES</button>
      <h2 class="section-title">${escapeHtml(subName)}</h2>
      <p class="section-subtitle">${escapeHtml(majorName)}의 세부 가이드라인 목록입니다.</p>
    </div>

    <!-- 새 가이드라인 추가 버튼 -->
    <button class="neo-btn" id="toggleNewGuidelineForm" style="margin-bottom:16px; background: linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; font-weight:700; font-size:15px; padding:12px 24px; cursor:pointer; border-radius:8px;">
      ＋ 새 가이드라인 추가
    </button>

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

  // 새 가이드라인 폼 토글
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
          const response = await fetch('http://localhost:3000/api/guidelines', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();

          if (response.ok) {
            statusDiv.innerHTML = `✅ "${result.guideline.title}" 가이드라인이 추가되었습니다! 페이지를 새로고침합니다...`;
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
export function renderDetail(id) {
  const g = window.DB.guidelines.find(i => i.id === id);
  const container = document.getElementById(CONTENT_ID);
  
  if (!g) {
    container.innerHTML = '<div class="neo-card"><h3>항목을 찾을 수 없습니다.</h3></div>';
    return;
  }

  const ai = g.aiSummary;
  let summaryHtml = '';
  
  if (ai) {
    summaryHtml = `
      <div class="ai-summary-card neo-card">
        <div class="ai-badge">✨ AI PHARMACIST SUMMARY</div>
        <div class="summary-section">
          <h4>💡 핵심 요약</h4>
          <p>${linkifySummary(ai.overview)}</p>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>💊 1차 선택 약제</strong>
            <p>${linkifySummary(ai.firstLine)}</p>
          </div>
          <div class="summary-item">
            <strong>📋 모니터링/수치</strong>
            <p>${linkifySummary(ai.monitoring)}</p>
          </div>
          <div class="summary-item">
            <strong>⚠️ 주의사항/금기</strong>
            <p>${linkifySummary(ai.cautions)}</p>
          </div>
          <div class="summary-item">
            <strong>👥 특수군 (임부/노인)</strong>
            <p>${linkifySummary(ai.special)}</p>
          </div>
        </div>
      </div>
    `;
  } else {
    summaryHtml = `
      <div class="ai-summary-card neo-card pending">
        <div class="ai-badge">⌛ 요약 생성 대기 중</div>
        <p>이 가이드라인의 AI 요약을 현재 생성하고 있습니다. 잠시 후 확인해 주세요.</p>
      </div>
    `;
  }

  const primaryUrl = Array.isArray(g.url) ? g.url[0] : (g.url || '');
  const isExternal = typeof primaryUrl === 'string' && primaryUrl.startsWith('http');
  const isExternalHWP = isExternal && (primaryUrl.includes('boardDownload.es') || primaryUrl.toLowerCase().includes('.hwp'));
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
      ${Array.isArray(g.url) ? `
        <div class="pdf-parts-selector">
          ${g.url.map((url, idx) => `
            <button class="neo-btn-sm ${idx === 0 ? 'active' : ''}" onclick="document.querySelector('.pdf-iframe').src='${url}'; document.querySelectorAll('.pdf-parts-selector .neo-btn-sm').forEach(b => b.classList.remove('active')); this.classList.add('active');">
              ${idx + 1}부 보기
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div class="pdf-container-a4">
        <iframe class="pdf-iframe" src="${primaryUrl}" allow="autoplay"></iframe>
      </div>
    `;
  }

  container.innerHTML = `
    <button class="neo-back-btn" onclick="history.back()">← BACK</button>
    <div class="detail-view neo-card">
      <div class="detail-header">
        <div class="badge">${escapeHtml(g.major || '가이드라인')}</div>
        <h2 class="detail-title">${escapeHtml(g.title)}</h2>
        <p class="detail-meta">발행연도: ${g.year || '미상'} | 출처: ${g.publisher || '공식 가이드라인'}</p>
      </div>
      
      ${summaryHtml}

      <div class="neo-card" style="display:flex; align-items:center; gap:12px; padding:14px 20px; margin-bottom:0; background:linear-gradient(135deg,#eef2ff,#e0e7ff); border:2px solid #6366f1;">
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

      <div class="pdf-section">
        <div class="neo-card-header">📄 원문 PDF 뷰어</div>
        ${viewerHtml}
        
        <div class="local-upload-section neo-card" style="margin-top: 20px; background: #f0fdf4; border: 3px solid var(--black);">
          <h4 style="margin-top:0;">📁 파일 교체 / 직접 업로드 (로컬 관리자용)</h4>
          <p style="font-size:14px; margin-bottom:10px;">이곳에서 파일을 업로드하면 로컬 저장소에 저장되고, 뷰어가 즉시 업데이트됩니다.</p>
          <form id="inlineUploadForm-${g.id}" style="display: flex; gap: 10px; align-items: center;">
            <input type="hidden" name="guidelineId" value="${g.id}">
            <input type="file" name="guidelineFile" accept=".pdf,.hwp" required style="border: 2px solid var(--black); padding: 5px; flex-grow: 1; background: #fff;">
            <button type="submit" class="neo-btn-sm">업로드</button>
          </form>
          <div id="uploadStatus-${g.id}" style="margin-top: 10px; font-weight: bold; font-size: 14px;"></div>
        </div>

        <div class="local-upload-section neo-card" style="margin-top: 20px; background: #eff6ff; border: 3px solid var(--black);">
          <h4 style="margin-top:0;">✏️ 가이드라인 정보 수정 (로컬 관리자용)</h4>
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
          const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
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
          const response = await fetch(`http://localhost:3000/api/guidelines/${g.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
export function renderDrugMajors() {
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
    <div class="section-header">
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
export function renderDrugCategory(majorName) {
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
        <h3 class="drug-minor-badge">${escapeHtml(minor)}</h3>
        <span class="delete-btn" title="중분류 삭제" onclick="window.app.deleteCategory('${escapeHtml(majorName)}', '${escapeHtml(minor)}')">🗑️</span>
      </div>
    `;

    subNames.forEach((subName) => {
      const subInfo = subs[subName];
      const safeId = 'sec-' + btoa(unescape(encodeURIComponent(minor + '|' + subName))).replace(/[^a-zA-Z0-9]/g, '');
      const firstId = subInfo.ids[0];

      html += `
        <div class="drug-sub-section" id="${safeId}">
          <div class="drug-sub-badge-wrapper">
            <div class="drug-sub-badge" contenteditable="true" onblur="window.app.updateSubName('${escapeHtml(majorName)}', '${escapeHtml(minor)}', '${escapeHtml(subName)}', this.innerText)">${escapeHtml(subName)}</div>
            <div style="display:flex; gap:10px;">
              <span class="add-drug-btn" title="약물 추가" onclick="window.app.addNewDrug('${firstId}')">➕</span>
              <span class="delete-btn" title="소분류 삭제" onclick="window.app.deleteCategory('${escapeHtml(majorName)}', '${escapeHtml(minor)}', '${escapeHtml(subName)}')">🗑️</span>
            </div>
          </div>
          <div class="grid-container" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
            ${subInfo.items.map((item, idx) => `
              <div class="drug-item-card compact" draggable="true" ondragstart="window.app.handleDragStart(event, '${firstId}', ${idx})">
                <button class="settings-btn" onclick="window.app.openDrugPropertyModal('${firstId}', ${idx})">⚙️</button>
                <div class="drug-image-container compact-image" onclick="window.app.triggerImageUpload('${firstId}', ${idx}, this)">
                  <img src="${item.image || 'assets/images/no-image.png'}" class="drug-image" onerror="this.src='https://placehold.co/400x400?text=Click+to+Upload'">
                </div>
                <div class="drug-info-compact">
                  <div class="editable-field ingredient-name-compact" contenteditable="true" onblur="window.app.handleDrugTextEdit(this, '${firstId}', ${idx})">${escapeHtml(item.ingredient)}</div>
                  <div class="editable-field reference-name-compact" contenteditable="true" onblur="window.app.handleDrugTextEdit(this, '${firstId}', ${idx})">${escapeHtml(item.reference)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  });

  html += `</div>`;
  container.innerHTML = html;
}
