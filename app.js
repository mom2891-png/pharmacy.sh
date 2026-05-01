// Vanilla JS SPA Router and UI Logic

// DOM 요소
const appContent = document.getElementById('app-content');
const navBtns = document.querySelectorAll('.nav-btn');

// 라우팅 시스템
function navigateTo(path) {
  let current = window.location.hash.replace('#', '') || '/';
  if (current === path) return;
  window.location.hash = path;
}

// 템플릿용 이스케이프 함수
function safeText(str) {
  if(!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 문자열 앞의 숫자("1.", "1.2.", "10." 등) 기준 계층적 정렬 비교 함수
function hierarchicalSort(a, b) {
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

// 경로 파싱 및 렌더링
function renderPath(path) {
  navBtns.forEach(btn => {
    if (path === '/' && btn.dataset.path === '/') {
      btn.classList.add('active');
    } else if (path !== '/' && btn.dataset.path !== '/' && path.startsWith(btn.dataset.path)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  appContent.classList.remove('fade-in');
  void appContent.offsetWidth; // Trigger reflow
  appContent.classList.add('fade-in');

  if (path === '/') return renderHome();
  if (path === '/guidelines') return renderList('guidelines');
  if (path === '/drugs') return renderList('drugs');
  if (path === '/supplements') return renderList('supplements');
  
  if (path.startsWith('/guidelines/category/')) return renderGuidelineCategory(path.replace('/guidelines/category/', ''));
  if (path.startsWith('/guidelines/subcategory/')) {
       // split by '/' to get [2] as major, [3] as sub
       const parts = path.replace('/guidelines/subcategory/', '').split('/');
       return renderGuidelineSubcategory(parts[0], parts[1] || 'none');
  }
  if (path.startsWith('/guidelines/')) return renderDetail('guidelines', path.split('/')[2]);
  if (path.startsWith('/drugs/category/')) return renderDrugCategory(path.replace('/drugs/category/', ''));
  if (path.startsWith('/drugs/')) return renderDetail('drugs', path.split('/')[2]);
  if (path.startsWith('/supplements/')) return renderDetail('supplements', path.split('/')[2]);

  appContent.innerHTML = `<div class="section-header"><h1 class="section-title">404 - Not Found</h1></div>`;
}

function renderHome() {
  appContent.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">환영합니다! PharmInfo 대시보드</h1>
      <p class="section-subtitle">안전하고 정확한 최신 약학 정보 포털입니다.</p>
    </div>
    <div class="grid-container">
      <div class="card" onclick="navigateTo('/guidelines')">
        <h2 class="card-title">주요 가이드라인</h2>
        <p class="card-desc">최신 질환 치료 지침 및 요약문을 대분류별로 탐색하고 확인하세요.</p>
      </div>
      <div class="card" onclick="navigateTo('/drugs')">
        <h2 class="card-title">약물 정보</h2>
        <p class="card-desc">효능, 용법, 주의사항 등 성분별 상세 약물 정보를 검색하세요.</p>
      </div>
      <div class="card" onclick="navigateTo('/supplements')">
        <h2 class="card-title">건강기능식품</h2>
        <p class="card-desc">성분별, 적응증별 검증된 건강기능식품 정보를 알아보세요.</p>
      </div>
    </div>
  `;
}

function renderList(type) {
  let title = '';
  let desc = '';
  let data = DB[type] || [];
  
  if (type === 'guidelines') {
    const majors = [];
    data.forEach(g => {
        if(g.major && !majors.includes(g.major)) majors.push(g.major);
    });
    majors.sort(hierarchicalSort);
    
    title = '가이드라인 (대분류 선택)'; 
    desc = '조회하실 질환의 대분류를 선택해주세요.'; 

    let html = `
      <div class="section-header">
        <h1 class="section-title">${title}</h1>
        <p class="section-subtitle">${desc}</p>
      </div>
      <div class="grid-container">
    `;
    majors.forEach(major => {
      // Find subs under this major
      const subs = [...new Set(data.filter(g => g.major === major).map(g => g.sub || '기타 가이드라인'))];
      const count = data.filter(g => g.major === major).length;
      
      let subListHtml = '';
      subs.forEach(sub => {
          subListHtml += `<li>${safeText(sub.replace(/^[0-9]+\.\s*/, ''))}</li>`;
      });

      html += `
        <div class="card" onclick="navigateTo('/guidelines/category/${encodeURIComponent(major)}')">
          <span class="badge" style="background:#091e42;">${major}</span>
          <h2 class="card-title">${major} 가이드라인</h2>
          <p class="card-desc">총 ${count}개의 소분류 지침 포함</p>
          <ul class="card-list">
             ${subListHtml}
          </ul>
        </div>
      `;
    });
    html += `</div>`;
    appContent.innerHTML = html;
    return;
  }
  
  if (type === 'drugs') {
    const majors = [...new Set(data.map(d => d.major))];
    title = '약물 정보 (대분류)';
    desc = '원하시는 질환군(대분류)을 선택하여 성분별 상세 정보를 확인하세요.';
    
    let html = `
      <div class="section-header">
        <h1 class="section-title">${title}</h1>
        <p class="section-subtitle">${desc}</p>
      </div>
      <div class="grid-container">
    `;
    majors.forEach(major => {
        const count = data.filter(d => d.major === major).length;
        html += `
          <div class="card drug-major-card" onclick="navigateTo('/drugs/category/${encodeURIComponent(major)}')">
            <h2 class="card-title" style="color:white;">${major}</h2>
            <p class="card-desc" style="color:rgba(255,255,255,0.8);">총 ${count}개의 분류 포함</p>
          </div>
        `;
    });
    html += `</div>`;
    appContent.innerHTML = html;
    return;
  }

  if (type === 'supplements') { title = '건강기능식품'; desc = '증상 및 목적 관리 맞춤형 성분 안내입니다.'; }

  let html = `
    <div class="section-header">
      <h1 class="section-title">${title}</h1>
      <p class="section-subtitle">${desc}</p>
    </div>
    <div class="grid-container">
  `;

  data.forEach(item => {
    let name = item.name || item.title;
    let subtitle = item.class || item.category || item.target;
    let descText = item.indication || item.desc || item.components;
    html += `
      <div class="card" onclick="navigateTo('/${type}/${item.id}')">
        <span class="badge">${subtitle}</span>
        <h2 class="card-title">${name}</h2>
        <p class="card-desc">${descText}</p>
      </div>
    `;
  });

  html += `</div>`;
  appContent.innerHTML = html;
}

// 대분류 클릭 시 나타나는 중분류 모음
function renderGuidelineCategory(encodedMajor) {
  const major = decodeURIComponent(encodedMajor);
  const data = DB.guidelines.filter(g => g.major === major);
  
  // Extract unique subcategories
  const subsMap = {};
  data.forEach(g => {
    const subName = g.sub || '기타 가이드라인';
    if(!subsMap[subName]) subsMap[subName] = [];
    subsMap[subName].push(g);
  });
  
  const subs = Object.keys(subsMap).sort(hierarchicalSort);
  
  let html = `
    <button class="back-btn" onclick="navigateTo('/guidelines')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      대분류 목록으로
    </button>
    <div class="section-header">
      <h1 class="section-title">[${major}] 중분류 선택</h1>
      <p class="section-subtitle">조회하실 하위 카테고리(중분류)를 선택하세요. 소분류 지침들이 함께 나열되어 있습니다.</p>
    </div>
    <div class="grid-container fade-in">
  `;

  subs.forEach(sub => {
    const items = subsMap[sub];
    let itemsListHtml = '';
    items.forEach(item => {
        itemsListHtml += `<li>${safeText(item.title)}</li>`;
    });
    
    const displaySubName = sub.replace(/^[0-9]+\.\s*/, '');
    html += `
      <div class="card" onclick="navigateTo('/guidelines/subcategory/${encodeURIComponent(major)}/${encodeURIComponent(sub)}')">
        <h2 class="card-title">${displaySubName}</h2>
        <ul class="card-list">
           ${itemsListHtml}
        </ul>
      </div>
    `;
  });

  html += `</div>`;
  appContent.innerHTML = html;
}

// 중분류 클릭 시 나타나는 실제 가이드라인(소분류) 모음
function renderGuidelineSubcategory(encodedMajor, encodedSub) {
  const major = decodeURIComponent(encodedMajor);
  const sub = decodeURIComponent(encodedSub);
  
  // 빈 문자열인 경우 "기타 가이드라인" 처리
  const data = DB.guidelines.filter(g => g.major === major && (g.sub === sub || (sub === '기타 가이드라인' && !g.sub)));
  const displaySubName = sub.replace(/^[0-9]+\.\s*/, '');
  
  // 연도 내림차순, 같으면 title 앞 숫자 오름차순
  data.sort((a, b) => {
    const yearDiff = parseInt(b.year || 0) - parseInt(a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return hierarchicalSort(a.title, b.title);
  });

  let html = `
    <button class="back-btn" onclick="navigateTo('/guidelines/category/${encodeURIComponent(major)}')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      중분류로 돌아가기
    </button>
    <div class="section-header">
      <h1 class="section-title">소분류: ${displaySubName}</h1>
      <p class="section-subtitle">동일한 질환 가이드라인의 경우 최신 버전이 위쪽에 표시됩니다.</p>
    </div>
    <div class="grid-container fade-in">
  `;

  data.forEach(item => {
    let name = item.title;
    let descText = item.desc || "";
    
    // View logic should not override data context. (Moved to data.js)

    html += `
      <div class="card" onclick="navigateTo('/guidelines/${item.id}')">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span class="badge" style="background:#00b8d9;">${item.year || '-'}</span>
            ${(item.url && item.url.trim()) ? '<span class="badge" style="background:#10b981;">📄 PDF 제공됨</span>' : '<span class="badge" style="background:#f43f5e;">🚫 PDF 없음</span>'}
        </div>
        <h2 class="card-title" style="margin-top: 8px;">${name}</h2>
        <p class="card-desc">${descText}</p>
      </div>
    `;
  });

  html += `</div>`;
  appContent.innerHTML = html;
}

function renderDetail(type, id) {
  const item = DB[type].find(i => i.id === id);
  if (!item) {
    appContent.innerHTML = `<button class="back-btn" onclick="window.history.back()">← 뒤로가기</button><h2>데이터를 찾을 수 없습니다.</h2>`;
    return;
  }

  let backRoute = `/${type}`;
  if (type === 'guidelines' && item.major) {
      const sub = item.sub || '기타 가이드라인';
      backRoute = `/guidelines/subcategory/${encodeURIComponent(item.major)}/${encodeURIComponent(sub)}`;
  }

  let html = `
    <button class="back-btn" onclick="navigateTo('${backRoute}')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      목록으로
    </button>
    <div class="detail-view fade-in">
  `;

  if (type === 'guidelines') {
    html += `
      <div class="detail-header">
        <span class="badge">${item.category || item.major}</span>
        <h1 class="detail-title">${item.title}</h1>
        <p style="color: var(--text-muted);">연도: ${item.year || '-'}, 발행: ${item.publisher || '-'}, 페이지: ${item.pages || '-'}</p>
        ${item.url ? `<p style="margin-top: 12px;"><a href="${item.url}" target="_blank" style="display:inline-block; padding:8px 16px; background:#0052cc; color:white; border-radius:4px; text-decoration:none; font-weight:600; font-size:14px;">🔗 원문 가이드라인 링크 열기</a></p>` : ''}
      </div>
      ${item.aiSummary ? `
      <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6);"></div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <span style="font-size: 22px;">🤖</span>
          <h3 style="font-size: 17px; font-weight: 700; color: #1e40af; margin: 0;">AI 약사 요약</h3>
          <span style="margin-left: auto; font-size: 11px; color: #64748b; background: #dbeafe; padding: 3px 8px; border-radius: 20px; font-weight: 600;">Gemini AI</span>
        </div>
        <div style="background: white; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; border-left: 4px solid #3b82f6;">
          <p style="font-size: 14px; line-height: 1.7; color: #334155; margin: 0;">📋 ${item.aiSummary.overview || ''}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div style="background: white; border-radius: 8px; padding: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #059669; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">💊 1차 약제</p>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${(item.aiSummary.firstLine || []).map(d => `<li style="font-size: 13px; color: #374151; padding: 3px 0; border-bottom: 1px solid #f3f4f6;">• ${d}</li>`).join('')}
            </ul>
          </div>
          <div style="background: white; border-radius: 8px; padding: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #0284c7; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">🔍 모니터링</p>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${(item.aiSummary.monitoring || []).map(m => `<li style="font-size: 13px; color: #374151; padding: 3px 0; border-bottom: 1px solid #f3f4f6;">• ${m}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: white; border-radius: 8px; padding: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #dc2626; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">⚠️ 주의사항</p>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${(item.aiSummary.cautions || []).map(c => `<li style="font-size: 13px; color: #374151; padding: 3px 0; border-bottom: 1px solid #f3f4f6;">• ${c}</li>`).join('')}
            </ul>
          </div>
          <div style="background: white; border-radius: 8px; padding: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #7c3aed; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">👥 특수 환자군</p>
            <p style="font-size: 13px; color: #374151; margin: 0; line-height: 1.6;">${item.aiSummary.special || '-'}</p>
          </div>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 14px 0 0; text-align: right;">⚠️ AI 생성 요약은 참고용입니다. 임상 적용 전 원문 가이드라인을 확인하세요.</p>
      </div>` : ''}
      ${item.content ? `
      <div class="content-block">
        <h3>가이드라인 참고 정보</h3>
        <p>${item.content}</p>
      </div>` : ''}
      <div class="pdf-container" style="display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div class="pdf-header" style="width: 100%; text-align: left; margin-bottom: 15px;">
          <span style="font-weight: bold; color: #334155;">📄 원문 PDF 뷰어</span>
        </div>
        ${(item.url && item.url.trim()) ? `<iframe src="${encodeURI(item.url.trim())}#toolbar=1&navpanes=0&scrollbar=1&page=1&view=Fit" style="width: 100%; aspect-ratio: 210 / 297; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: block;" title="${item.title} PDF"></iframe>` 
                  : `<div style="width: 100%; aspect-ratio: 210 / 297; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#e2e8f0; color:#64748b; border: 2px dashed #cbd5e1; border-radius: 8px; gap: 12px;"><span style="font-size:48px;">📄</span><span style="font-size:16px; font-weight:600;">PDF 미리보기를 제공하지 않는 가이드라인입니다</span><span style="font-size:14px; color:#94a3b8;">원문 가이드라인 링크를 통해 확인하세요</span></div>`}
      </div>
    `;
  } else if (type === 'drugs') {
    html += `
      <div class="detail-header">
        <span class="badge">${item.class}</span>
        <h1 class="detail-title">${item.name}</h1>
      </div>
      <div class="content-block">
        <h3>효능 / 효과 (Indication)</h3>
        <p>${item.indication}</p>
      </div>
      <div class="content-block">
        <h3>용법 / 용량 (Dosage)</h3>
        <p>${item.dosage}</p>
      </div>
      <div class="content-block" style="border-left-color: #ff5630; background: #fff8f6;">
        <h3 style="color: #de350b;">주의 및 부작용 (Caution)</h3>
        <p>${item.caution}</p>
      </div>
    `;
  } else if (type === 'supplements') {
    html += `
      <div class="detail-header">
        <span class="badge">${item.target}</span>
        <h1 class="detail-title">${item.name}</h1>
      </div>
      <div class="content-block">
        <h3>핵심 성분</h3>
        <p>${item.components}</p>
      </div>
      <div class="content-block">
        <h3>복약지도 Tip</h3>
        <p>${item.tip}</p>
      </div>
    `;
  }

  html += `</div>`;
  appContent.innerHTML = html;
}

// 약물 정보 상세 계층 렌더링 (중분류/소분류/아이템)
function renderDrugCategory(encodedMajor) {
  const major = decodeURIComponent(encodedMajor);
  const data = DB.drugs.filter(d => d.major === major);
  
  let html = `
    <button class="back-btn" onclick="navigateTo('/drugs')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      대분류 목록으로
    </button>
    <div class="section-header">
      <h1 class="section-title">${major} 상세 정보</h1>
      <p class="section-subtitle">성분명과 대조약 이름을 클릭하여 직접 수정할 수 있습니다. 수정 후 우측 하단의 저장 버튼을 눌러주세요.</p>
    </div>
    <div class="drugs-container fade-in">
  `;

  // 중분류(minor)별로 그룹화
  const minorGroups = {};
  data.forEach(d => {
    if(!minorGroups[d.minor]) minorGroups[d.minor] = [];
    minorGroups[d.minor].push(d);
  });

  Object.keys(minorGroups).forEach(minor => {
    html += `<div class="drug-minor-header">${minor}</div>`;
    
    // 소분류(sub)별로 표시
    minorGroups[minor].forEach(subGroup => {
        html += `
          <div class="drug-sub-section" style="margin-bottom: 32px;">
            <div class="drug-sub-badge">${subGroup.sub}</div>
            <div class="grid-container" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
        `;
        
        subGroup.items.forEach((item, idx) => {
            html += `
              <div class="drug-item-card" data-drug-id="${subGroup.id}" data-item-idx="${idx}">
                <img src="${item.image || 'assets/images/no-image.png'}" class="drug-image" onerror="this.src='https://placehold.co/400x400?text=No+Image'">
                <div class="editable-field ingredient-name" contenteditable="true" oninput="showSaveBar()">${safeText(item.ingredient)}</div>
                <div style="font-size:12px; color:#94a3b8; font-weight:700; margin-top:4px;">대조약(Original/Reference)</div>
                <div class="editable-field reference-name" contenteditable="true" oninput="showSaveBar()">${safeText(item.reference)}</div>
              </div>
            `;
        });
        
        html += `</div></div>`;
    });
  });

  html += `</div>`;
  
  // 저장 바 (초기에는 숨김)
  html += `
    <div id="save-bar" class="save-bar" style="display:none;">
      <span style="font-weight:800; color:var(--black);">⚠️ 수정된 내용이 있습니다.</span>
      <button class="save-btn" onclick="saveDrugs()">변경사항 저장하기</button>
    </div>
  `;
  
  appContent.innerHTML = html;
}

// 저장 바 표시
function showSaveBar() {
    document.getElementById('save-bar').style.display = 'flex';
}

// 수정된 데이터를 수집하여 서버로 전송
async function saveDrugs() {
    const cards = document.querySelectorAll('.drug-item-card');
    const updatedDrugs = JSON.parse(JSON.stringify(DB.drugs)); // Deep copy
    
    cards.forEach(card => {
        const drugId = card.dataset.drugId;
        const itemIdx = parseInt(card.dataset.itemIdx);
        const ingredient = card.querySelector('.ingredient-name').innerText.trim();
        const reference = card.querySelector('.reference-name').innerText.trim();
        
        const drugEntry = updatedDrugs.find(d => d.id === drugId);
        if (drugEntry && drugEntry.items[itemIdx]) {
            drugEntry.items[itemIdx].ingredient = ingredient;
            drugEntry.items[itemIdx].reference = reference;
        }
    });

    try {
        const response = await fetch('/api/drugs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drugs: updatedDrugs })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ 약물 정보가 성공적으로 저장되었습니다!');
            DB.drugs = updatedDrugs; // 메모리 상의 DB 업데이트
            document.getElementById('save-bar').style.display = 'none';
        } else {
            alert('❌ 저장 실패: ' + result.error);
        }
    } catch (err) {
        alert('❌ 서버 통신 오류가 발생했습니다.');
        console.error(err);
    }
}


window.addEventListener('hashchange', () => {
  let hash = window.location.hash.replace('#', '') || '/';
  renderPath(hash);
});

document.addEventListener('DOMContentLoaded', () => {
  let initPath = window.location.hash.replace('#', '') || '/';
  renderPath(initPath);
});
