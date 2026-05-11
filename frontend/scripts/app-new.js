// 메인 애플리케이션 진입점 (라우터 및 초기화)
import * as renderer from './view-renderer.js?v=26';
import * as dataService from './data-service.js?v=25';
import { watchAuthState, loginWithGoogle, logout, getValidToken } from './auth.js';

export class App {
  constructor() {
    this.activeSidebarDrug = null;
    this.isAdmin = false;
    this.user = null;
    
    // Firebase 인증 상태 관찰
    watchAuthState(async (user) => {
      console.log('🔐 Auth State Changed:', user ? user.email : 'Logged Out');
      this.user = user;
      
      if (user) {
        try {
          const response = await fetch('/api/auth-status', {
            headers: { 'x-api-key': localStorage.getItem('firebaseToken') }
          });
          const status = await response.json();
          this.isAdmin = status.isAdmin === true;
        } catch (e) {
          this.isAdmin = false;
        }
      } else {
        this.isAdmin = false;
      }
      
      this.updateAuthUI();
      setTimeout(() => this.handleRoute(), 100);
    });

    this.init();
  }

  // 관리자 모드 토글
  async loginWithGoogle() {
    try {
      await loginWithGoogle();
      this.showToast('\uC131\uACF5적으로 로그인되었습니다.');
    } catch (error) {
      this.showToast('로그인에 \uC2E4\uD328했습니다.');
    }
  }

  async logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout();
      this.user = null;
      this.isAdmin = false;
      this.showToast('로그아웃 되었습니다.');
      window.location.href = '/#/'; // 강제 \uD648 이동 및 해시 초기화
      window.location.reload(); // 확실한 UI 초기화를 위해 새로고침
    }
  }

  // API 권한 체크 (데이터 \uC218\uC815 시 호출됨)
  async checkAuth() {
    if (this.isAdmin) return true;
    this.showToast('이 작업을 수행하려면 관리자 로그인이 필요합니다.');
    return false;
  }

  updateAuthUI() {
    const loginBtn = document.getElementById('google-login-btn');
    const profileArea = document.getElementById('user-profile');
    const trashBtn = document.getElementById('trashNavBtn');
    
    if (this.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (profileArea) {
        profileArea.style.display = 'flex';
        document.getElementById('user-name').innerText = this.user.displayName;
        document.getElementById('user-photo').src = this.user.photoURL;
        
        // 최고 관리자일 경우 권한 관리 버튼 \uCD94\uAC00 (이미 있으면 중복 생성 방지)
        const mgmtBtn = document.getElementById('user-mgmt-btn');
        if (this.user.email === 'mom2891@gmail.com') {
          if (!mgmtBtn) {
            const newBtn = document.createElement('button');
            newBtn.id = 'user-mgmt-btn';
            newBtn.className = 'nav-btn-sm';
            newBtn.style.cssText = 'padding: 4px 8px; font-size: 11px; background: #8b5cf6; color: white; border: none;';
            newBtn.innerText = '👥 권한 관리';
            newBtn.onclick = () => this.navigateTo('/admin/users');
            profileArea.insertBefore(newBtn, profileArea.lastElementChild);
          }
        } else {
          if (mgmtBtn) mgmtBtn.remove();
        }
      }
      if (trashBtn) trashBtn.style.display = 'inline-block';
    } else {
      if (loginBtn) loginBtn.style.display = 'flex';
      if (profileArea) {
        profileArea.style.display = 'none';
        const mgmtBtn = document.getElementById('user-mgmt-btn');
        if (mgmtBtn) mgmtBtn.remove();
      }
      if (trashBtn) trashBtn.style.display = 'none';
    }
  }

  // 서버로부터 최신 데이터를 다시 불러오는 함수
  async fetchData() {
    console.log('🔄 데이터 재로드 중...');
    try {
      let response = await fetch(`/api/db?t=${Date.now()}`);
      if (!response || !response.ok) {
        response = await fetch(`/data/db.json?t=${Date.now()}`);
      }
      if (response.ok) {
        const db = await response.json();
        // \uC0AD\uC11C되지 않은 \uAC00\uC774\uB4DC\uB77C\uC778과 \uC0AD\uC11C된 \uAC00\uC774\uB4DC\uB77C\uC778 분류
        const activeGuidelines = (db.guidelines || []).filter(g => !g.is_deleted);
        const trashItems = (db.guidelines || []).filter(g => g.is_deleted).map(g => ({
          ...g,
          type: 'guideline',
          deletedAt: new Date().toISOString() // DB에 deleted_at이 없으므로 현재 시간으로 대체 (필요시 DB \uCD94\uAC00 가능)
        }));
        
        window.DB = {
          ...db,
          guidelines: activeGuidelines,
          trash: trashItems
        };
        console.log(`✅ 데이터 재로드 완료 (활성: ${activeGuidelines.length}, 휴지통: ${trashItems.length})`);
      }
    } catch (err) {
      console.error('❌ 데이터 재로드 \uC2E4\uD328:', err);
    }
  }

  async init() {
    // 서버로부터 초기 데이터 로드 (로컬: /api/db, Vercel: /data/db.json)
    try {
        console.log('🌐 Fetching initial database...');
        let response;
        try {
          response = await fetch(`/api/db?t=${Date.now()}`);
        } catch (e) {
          response = null;
        }
        
        // /api/db \uC2E4\uD328 시 정적 JSON 폴백
        if (!response || !response.ok) {
          console.log('⚡ API 서버 없음, 정적 데이터 로드 중...');
          response = await fetch(`/data/db.json?t=${Date.now()}`);
        }
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errData.error || `Server returned ${response.status}`);
        }
        const db = await response.json();
        
        // \uC0AD\uC11C되지 않은 \uAC00\uC774\uB4DC\uB77C\uC778과 \uC0AD\uC11C된 \uAC00\uC774\uB4DC\uB77C\uC778 분류
        const activeGuidelines = (db.guidelines || []).filter(g => !g.is_deleted);
        const trashItems = (db.guidelines || []).filter(g => g.is_deleted).map(g => ({
          ...g,
          type: 'guideline',
          deletedAt: new Date().toISOString()
        }));
        
        window.DB = {
          ...db,
          guidelines: activeGuidelines,
          trash: trashItems
        };
        console.log(`✅ 데이터베이스 로드 완료 (활성: ${activeGuidelines.length}, 휴지통: ${trashItems.length})`);
    } catch (err) {
        console.error('❌ 데이터베이스 로드 \uC2E4\uD328:', err);
        const errorLog = document.getElementById('error-log');
        if (errorLog) {
            errorLog.innerHTML = `<div style="padding:20px; border:2px solid red; border-radius:8px; margin:20px;">
                <h2 style="margin-top:0;">⚠️ 데이터베이스 로드 오류</h2>
                <p>서버로부터 데이터를 가져오는 데 \uC2E4\uD328했습니다.</p>
                <code style="display:block; background:#f8f8f8; padding:10px; border:1px solid #ddd;">${err.message}</code>
                <p style="margin-bottom:0; font-size:0.9rem; color:#666;">서버가 실행 중인지, 네트워크 연결이 안정적인지 \uD655\uC778해 주세요.</p>
            </div>`;
        }
        return;
    }

    window.addEventListener('hashchange', () => this.handleRoute());
    
    // DB 로드 후에만 handleRoute 호출
    this.handleRoute();
    this.updateAuthUI();
    
    // 전역 \uAC80\uC0C9 설정
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          const results = [
            ...dataService.searchGuidelines(query),
            ...dataService.searchDrugs(query)
          ];
          this.navigateTo('/search', { results, query });
        }
      });
    }

    // 전역 액션 버튼 리스너 (동적 생성된 버튼 대응)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      console.log(`[Action] ${action} for ID: ${id}`);
      
      if (action === 'delete') {
        this.deleteGuideline(id);
      } else if (action === 'move') {
        this.openGuidelineMoveModal(id);
      }
    });

    // 드래그 앤 드롭 이벤트 초기화
    this.initDragAndDrop();
  }


  async handleRoute() {
    if (!window.DB) {
      console.warn('DB not ready, skipping route handling');
      return;
    }
    const path = window.location.hash.slice(1) || '/';
    console.log('--- Routing Start ---');
    console.log('Path:', path);

    const parts = path.split('/').filter(p => p !== '');
    console.log('Parts:', parts);

    try {
      if (parts.length === 0 || path === '/') {
        renderer.renderHome(this.isAdmin);
        this.updateActiveNav('/');
        return;
      }

      const root = parts[0];
      
      if (root === 'guidelines') {
        if (parts.length === 1) {
          renderer.renderGuidelineMajors(this.isAdmin);
        } else if (parts[1] === 'category') {
          renderer.renderGuidelineSubcategories(decodeURIComponent(parts[2]), this.isAdmin);
        } else if (parts[1] === 'subcategory') {
          renderer.renderGuidelineItems(decodeURIComponent(parts[2]), decodeURIComponent(parts[3]), this.isAdmin);
        } else {
          // ID 기반 \uC0C1\uC138 (예: /guidelines/g1)
          renderer.renderDetail(parts[1], this.isAdmin);
        }
      } else if (root === 'drugs') {
        if (parts.length === 1) {
          renderer.renderDrugMajors(this.isAdmin);
        } else if (parts[1] === 'category') {
          renderer.renderDrugCategory(decodeURIComponent(parts[2]), this.isAdmin);
        } else {
          renderer.renderDrugList(this.isAdmin);
        }
      } else if (root === 'admin' && parts[1] === 'guide') {
        renderer.renderSystemGuide();
      } else if (root === 'admin' && parts[1] === 'users') {
        // 관리자 \uBAA9\uB85D 가져오기
        const response = await fetch('/api/admins', {
          headers: { 'x-api-key': localStorage.getItem('firebaseToken') }
        });
        const admins = await response.json();
        renderer.renderUserManagement(admins, this.isAdmin);
      } else if (root === 'trash') {
        renderer.renderTrash();
      } else if (root === 'supplements') {
        if (parts.length === 2) {
          renderer.renderDetail(parts[1]);
        }
      } else if (root === 'search') {
        const appContent = document.getElementById('app-content');
        if (appContent && !appContent.innerHTML.trim()) {
           this.navigateTo('/');
        }
      }
      
      this.updateActiveNav('/' + root);

      // 드래그 앤 드롭 순서 변경 초기화 (관리자 모드일 때만)
      if (this.isAdmin) {
        setTimeout(() => {
          if (root === 'guidelines') {
            if (parts.length === 1) {
              this.initSortable('major', 'major-list-container');
            } else if (parts.includes('category')) {
              this.initSortable('subcategory', 'subcategory-list-container');
            } else if (parts.includes('subcategory')) {
              this.initSortable('guideline', 'guideline-list-container');
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('Routing Error:', error);
      document.getElementById('error-log').innerHTML += `<p>Routing Error [${path}]: ${error.message}</p>`;
    }
  }

  navigateTo(path, state = null) {
    console.log('Navigating to:', path);
    if (path === '/search' && state) {
      renderer.renderSearchResults(state.results, state.query);
      return;
    }
    window.location.hash = path;
  }

  navigateToDrugByName(name) {
    const drug = window.DB.drugs.find(d => d.name === name);
    if (drug) {
      this.navigateTo(`/drugs/${drug.id}`);
    } else {
      alert(`'${name}'에 대한 \uC0C1\uC138 \uC815\uBCF4를 찾을 수 없습니다.`);
    }
  }

  updateActiveNav(rootPath) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const btnPath = btn.getAttribute('data-path');
      if (rootPath === btnPath || (rootPath.startsWith(btnPath) && btnPath !== '/')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      // 시각적 피드백
      element.classList.add('section-highlight');
      setTimeout(() => {
        element.classList.remove('section-highlight');
      }, 1500);
    }
  }

  // 자동 \uC800\uC7A5 (특정 항목만 서버로 전송)
  async autoSave(drugId) {
    if (!drugId) return;
    const drugEntry = window.DB.drugs.find(d => d.id === drugId);
    if (!drugEntry) return;

    try {
        const response = await fetch(`/api/drugs/${drugId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': localStorage.getItem('firebaseToken')
            },
            body: JSON.stringify(drugEntry)
        });
        
        if (response.status === 401) {
            this.showToast('로그인이 필요합니다. Google 계정으로 로그인해 주세요.');
            return;
        }

        const result = await response.json();
        if (result.success) {
            console.log(`✅ 항목 \uC800\uC7A5 완료: ${drugId}`);
            this.showToast('\uC800\uC7A5되었습니다');
        } else {
            console.error('❌ \uC800\uC7A5 \uC2E4\uD328:', result.error);
        }
    } catch (err) {
        console.error('AutoSave Error:', err);
    }
  }

  // 간단한 알림 표시
  showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'neo-toast';
      toast.innerText = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
  }

  // 기존 showSaveBar는 하위 호환성을 위해 빈 함수로 둠
  showSaveBar() {}

  // \uC218\uC815된 데이터를 수집하여 서버로 전송
  async saveDrugs() {
    const cards = document.querySelectorAll('.drug-item-card');
    const updatedDrugs = JSON.parse(JSON.stringify(window.DB.drugs)); // Deep copy
    
    cards.forEach(card => {
        const drugId = card.dataset.drugId;
        const itemIdx = parseInt(card.dataset.itemIdx);
        
        const ingNode = card.querySelector('.ingredient-name') || card.querySelector('.ingredient-name-compact');
        const refNode = card.querySelector('.reference-name') || card.querySelector('.reference-name-compact');
        
        if (!ingNode || !refNode) return;
        
        const ingredient = ingNode.innerText.trim();
        const reference = refNode.innerText.trim();
        
        const drugEntry = updatedDrugs.find(d => d.id === drugId);
        if (drugEntry && drugEntry.items[itemIdx]) {
            drugEntry.items[itemIdx].ingredient = ingredient;
            drugEntry.items[itemIdx].reference = reference;
        }
    });

    try {
        const response = await fetch('/api/drugs', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': localStorage.getItem('firebaseToken')
            },
            body: JSON.stringify({ drugs: updatedDrugs })
        });
        
        if (response.status === 401) {
            this.showToast('로그인이 필요합니다. Google 계정으로 로그인해 주세요.');
            return;
        }
        
        const result = await response.json();
        if (result.success) {
            alert('✅ \uC57D\uBB3C \uC815\uBCF4가 \uC131\uACF5적으로 \uC800\uC7A5되었습니다!');
            window.DB.drugs = updatedDrugs; // 메모리 상의 DB 업데이트
            const bar = document.getElementById('save-bar');
            if (bar) bar.style.display = 'none';
        } else {
            alert('❌ \uC800\uC7A5 \uC2E4\uD328: ' + result.error);
        }
    } catch (err) {
        alert('❌ 서버 통신 오류가 발생했습니다.');
        console.error(err);
    }
  }

  // 개별 \uC57D\uBB3C 텍스트 \uC218\uC815 시 호출
  handleDrugTextEdit(node, drugId, itemIdx) {
      const ingredientNode = node.parentElement.querySelector('.ingredient-name-compact');
      const referenceNode = node.parentElement.querySelector('.reference-name-compact');
      
      const entry = window.DB.drugs.find(d => d.id === drugId);
      if (entry && entry.items[itemIdx]) {
          entry.items[itemIdx].ingredient = ingredientNode.innerText.trim();
          entry.items[itemIdx].reference = referenceNode.innerText.trim();
          this.autoSave(drugId);
      }
  }

  // 이미지 업로드 창 트리거
  triggerImageUpload(drugId, itemIdx, container) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.value ? e.target.files[0] : null;
        if (file) {
            await this.handleImageUpload(drugId, itemIdx, file, container);
        }
    };
    input.click();
  }

  // 실제 이미지 업로드 처리
  async handleImageUpload(drugId, itemIdx, file, container) {
    const formData = new FormData();
    formData.append('drugImage', file);
    formData.append('drugId', drugId);
    formData.append('itemIdx', itemIdx);

    try {
        const response = await fetch('/api/upload-drug-image', {
            method: 'POST',
            headers: { 'x-api-key': localStorage.getItem('firebaseToken') },
            body: formData
        });

        if (response.status === 401) {
            this.showToast('로그인이 필요합니다. Google 계정으로 로그인해 주세요.');
            return;
        }
        const result = await response.json();

        if (result.success) {
            // 화면의 이미지 소스 즉시 업데이트
            const img = container.querySelector('img');
            img.src = result.filePath;
            
            // 메모리 내 DB 업데이트
            const drugEntry = window.DB.drugs.find(d => d.id === drugId);
            if (drugEntry && drugEntry.items[itemIdx]) {
                drugEntry.items[itemIdx].image = result.filePath;
            }
            
            this.showSaveBar(); // 변경사항이 있으므로 \uC800\uC7A5 바 표시
        } else {
            alert('❌ 업로드 \uC2E4\uD328: ' + result.error);
        }
    } catch (err) {
        console.error('Image Upload Error:', err);
        alert('❌ 이미지 업로드 중 오류가 발생했습니다.');
    }
  }

  // \uC911\uBD84\uB958 이름 업데이트 (해당 \uB300\uBD84\uB958 내에서만)
  updateMinorName(major, oldName, newName) {
      newName = newName.trim();
      oldName = oldName.trim();
      major = major.trim();
      if (!newName || oldName === newName) return;
      window.DB.drugs.forEach(d => {
          if (d.major.trim() === major && d.minor.trim() === oldName) d.minor = newName;
      });
      renderer.renderDrugCategory(major); // UI 갱신
      this.autoSave(); // 즉시 \uC800\uC7A5
  }

  // \uC18C\uBD84\uB958 이름 업데이트 (해당 \uB300\uBD84\uB958 및 \uC911\uBD84\uB958 내에서만)
  updateSubName(major, minor, oldName, newName) {
      newName = newName.trim();
      oldName = oldName.trim();
      major = major.trim();
      minor = minor.trim();
      if (!newName || oldName === newName) return;
      window.DB.drugs.forEach(d => {
          if (d.major.trim() === major && d.minor.trim() === minor && d.sub.trim() === oldName) d.sub = newName;
      });
      renderer.renderDrugCategory(major); // UI 갱신
      this.autoSave(); // 즉시 \uC800\uC7A5
  }

  // 드래그 시작
  handleDragStart(e, drugId, itemIdx) {
      e.dataTransfer.setData('text/plain', JSON.stringify({ drugId, itemIdx }));
      e.target.classList.add('dragging');
  }

  // 드래그 종료
  handleDragEnd(e) {
      e.target.classList.remove('dragging');
  }

  // 드롭 처리 (개별 약품 이동 및 순서 변경)
  handleDrop(e, targetMinor, targetSub) {
      e.preventDefault();
      let data;
      try {
          data = JSON.parse(e.dataTransfer.getData('text/plain'));
      } catch (err) {
          return;
      }
      const sourceDrugId = data.drugId;
      const sourceItemIdx = parseInt(data.itemIdx);
      
      const sourceEntry = window.DB.drugs.find(d => d.id === sourceDrugId);
      if (!sourceEntry) return;

      // 타겟 카테고리를 가진 기존 엔트리 찾기
      let targetEntry = window.DB.drugs.find(d => 
          d.major === sourceEntry.major && 
          d.minor === targetMinor && 
          d.sub === targetSub
      );

      // 같은 엔트리 내에서의 이동 (순서 변경)
      if (targetEntry && sourceEntry.id === targetEntry.id) {
          // 순서 변경 로직 (현재는 맨 뒤로 보내기만 함. 더 정교한 삽입은 추후 구현 가능)
          const item = sourceEntry.items.splice(sourceItemIdx, 1)[0];
          sourceEntry.items.push(item);
      } else {
          // 다른 엔트리로 이동
          const item = sourceEntry.items.splice(sourceItemIdx, 1)[0];
          
          if (targetEntry) {
              targetEntry.items.push(item);
          } else {
              const newId = 'drug_v4_' + Date.now();
              targetEntry = {
                  id: newId,
                  major: sourceEntry.major,
                  minor: targetMinor,
                  sub: targetSub,
                  items: [item]
              };
              window.DB.drugs.push(targetEntry);
          }
          
          // 원본 섹션이 비었으면 \uC0AD\uC11C
          if (sourceEntry.items.length === 0) {
              window.DB.drugs = window.DB.drugs.filter(d => d.id !== sourceDrugId);
          }
      }
      
      renderer.renderDrugCategory(sourceEntry.major);
      this.autoSave(sourceDrugId);
      if (targetEntry && targetEntry.id !== sourceDrugId) {
          this.autoSave(targetEntry.id);
      }
  }

  // \uC911\uBD84\uB958 특정 위치에 \uCD94\uAC00
  addMinorCategoryAt(major, atIndex) {
      const name = prompt('새 \uC911\uBD84\uB958 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: name,
          sub: '기본 \uC18C\uBD84\uB958',
          items: []
      };
      
      // DB 배열의 특정 위치에 삽입
      window.DB.drugs.splice(atIndex, 0, newEntry);
      
      renderer.renderDrugCategory(major);
      this.autoSave();
  }

  // 개별 \uC57D\uBB3C \uCD94\uAC00
  addNewDrug(drugId) {
      const entry = window.DB.drugs.find(d => d.id === drugId);
      if (!entry) return;
      
      const newItem = {
          ingredient: "새 성분명",
          reference: "새 대조약",
          image: ""
      };
      
      entry.items.push(newItem);
      renderer.renderDrugCategory(entry.major);
      this.autoSave();
  }

  // \uC911\uBD84\uB958 \uCD94\uAC00
  addMinorCategory(major) {
      const name = prompt('새 \uC911\uBD84\uB958 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_m_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: name,
          sub: '기본 \uC18C\uBD84\uB958',
          items: []
      };
      
      window.DB.drugs.push(newEntry);
      renderer.renderDrugCategory(major);
      this.autoSave();
  }

  // \uC18C\uBD84\uB958 \uCD94\uAC00
  addSubCategory(major, minor) {
      const name = prompt('새 \uC18C\uBD84\uB958 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_s_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: minor,
          sub: name,
          items: []
      };
      
      window.DB.drugs.push(newEntry);
      renderer.renderDrugCategory(major);
      this.autoSave();
  }

  // 카테고리 \uC0AD\uC11C (전역)
  deleteCategory(major, minor, sub = null) {
      if (!confirm(`정말로 이 ${sub ? '\uC18C\uBD84\uB958' : '\uC911\uBD84\uB958'}를 \uC0AD\uC11C하시겠습니까? 관련 \uC57D\uBB3C 데이터가 모두 사라집니다.`)) return;
      
      if (sub) {
          window.DB.drugs = window.DB.drugs.filter(d => 
              !(d.major === major && d.minor === minor && d.sub === sub)
          );
      } else {
          window.DB.drugs = window.DB.drugs.filter(d => 
              !(d.major === major && d.minor === minor)
          );
      }
      
      renderer.renderDrugCategory(major);
      this.autoSave();
  }
  // 카테고리 속성 모달 로직
  openDrugPropertyModal(drugId, itemIdx) {
      const entry = window.DB.drugs.find(d => d.id === drugId);
      if (!entry) return;
      const item = entry.items[itemIdx];

      document.getElementById('modal-drug-id').value = drugId;
      document.getElementById('modal-drug-item-idx').value = itemIdx;
      document.getElementById('modal-drug-major').value = entry.major;
      document.getElementById('modal-drug-ingredient').value = item.ingredient;
      document.getElementById('modal-drug-reference').value = item.reference;

      this.updateModalMinorOptions(entry.major, entry.minor);
      this.updateModalSubOptions(entry.major, entry.minor, entry.sub);

      document.getElementById('drug-property-modal').style.display = 'flex';
  }

  closeDrugPropertyModal() {
      document.getElementById('drug-property-modal').style.display = 'none';
  }

  deleteDrugItem() {
      const drugId = document.getElementById('modal-drug-id').value;
      const itemIdx = parseInt(document.getElementById('modal-drug-item-idx').value);
      const major = document.getElementById('modal-drug-major').value;

      if (confirm('정말로 이 \uC57D\uBB3C \uC815\uBCF4를 \uC0AD\uC11C하시겠습니까?')) {
          const entry = window.DB.drugs.find(d => d.id === drugId);
          if (entry) {
              entry.items.splice(itemIdx, 1);
              this.closeDrugPropertyModal();
              renderer.renderDrugCategory(major);
              this.autoSave();
          }
      }
  }

  updateModalMinorOptions(major, selectedMinor) {
      const minorSelect = document.getElementById('modal-drug-minor');
      const minors = [...new Set(window.DB.drugs.filter(d => d.major === major).map(d => d.minor))];
      
      let html = '';
      minors.forEach(m => {
          html += `<option value="${m}" ${m === selectedMinor ? 'selected' : ''}>${m}</option>`;
      });
      html += `<option value="__ADD_NEW__">+ 새 \uC911\uBD84\uB958 \uCD94\uAC00</option>`;
      minorSelect.innerHTML = html;
  }

  updateModalSubOptions(major, minor, selectedSub) {
      const subSelect = document.getElementById('modal-drug-sub');
      const subs = [...new Set(window.DB.drugs.filter(d => d.major === major && d.minor === minor).map(d => d.sub))];
      
      let html = '';
      subs.forEach(s => {
          html += `<option value="${s}" ${s === selectedSub ? 'selected' : ''}>${s}</option>`;
      });
      html += `<option value="__ADD_NEW__">+ 새 \uC18C\uBD84\uB958 \uCD94\uAC00</option>`;
      subSelect.innerHTML = html;
  }

  handleModalMinorChange(val) {
      const major = document.getElementById('modal-drug-major').value;
      if (val === '__ADD_NEW__') {
          const newMinor = prompt('새 \uC911\uBD84\uB958 이름을 입력하세요:');
          if (newMinor && newMinor.trim() !== '') {
              this.updateModalMinorOptions(major, newMinor.trim());
              this.updateModalSubOptions(major, newMinor.trim(), '');
          } else {
              // 롤백 (이전 선택 복구를 위해 다시 로드, 혹은 첫번째 선택)
              this.updateModalMinorOptions(major, '');
          }
      } else {
          this.updateModalSubOptions(major, val, '');
      }
  }

  handleModalSubChange(val) {
      if (val === '__ADD_NEW__') {
          const newSub = prompt('새 \uC18C\uBD84\uB958 이름을 입력하세요:');
          if (newSub && newSub.trim() !== '') {
              const major = document.getElementById('modal-drug-major').value;
              const minor = document.getElementById('modal-drug-minor').value;
              
              const subSelect = document.getElementById('modal-drug-sub');
              const newOption = document.createElement('option');
              newOption.value = newSub.trim();
              newOption.text = newSub.trim();
              newOption.selected = true;
              subSelect.insertBefore(newOption, subSelect.lastChild);
          } else {
              // 롤백
              document.getElementById('modal-drug-sub').selectedIndex = 0;
          }
      }
  }

  saveDrugPropertyModal() {
      const drugId = document.getElementById('modal-drug-id').value;
      const itemIdx = parseInt(document.getElementById('modal-drug-item-idx').value);
      const newIngredient = document.getElementById('modal-drug-ingredient').value;
      const newReference = document.getElementById('modal-drug-reference').value;
      const newMinor = document.getElementById('modal-drug-minor').value;
      const newSub = document.getElementById('modal-drug-sub').value;

      const sourceEntry = window.DB.drugs.find(d => d.id === drugId);
      if (!sourceEntry) return;

      const item = sourceEntry.items[itemIdx];
      item.ingredient = newIngredient;
      item.reference = newReference;

      if (sourceEntry.minor !== newMinor || sourceEntry.sub !== newSub) {
          // 카테고리가 변경된 경우 이동 처리
          sourceEntry.items.splice(itemIdx, 1);
          
          let targetEntry = window.DB.drugs.find(d => d.major === sourceEntry.major && d.minor === newMinor && d.sub === newSub);
          if (targetEntry) {
              targetEntry.items.push(item);
          } else {
              const newId = 'drug_new_' + Date.now();
              targetEntry = {
                  id: newId,
                  major: sourceEntry.major,
                  minor: newMinor,
                  sub: newSub,
                  items: [item]
              };
              // 적절한 위치(같은 minor 그룹 끝)에 \uCD94\uAC00하는 로직 개선
              let minorIndex = -1;
              for (let i = window.DB.drugs.length - 1; i >= 0; i--) {
                  const d = window.DB.drugs[i];
                  if (d.major === sourceEntry.major && d.minor === newMinor) {
                      minorIndex = i;
                      break;
                  }
              }
              
              if (minorIndex !== -1) {
                  window.DB.drugs.splice(minorIndex + 1, 0, targetEntry);
              } else {
                  window.DB.drugs.push(targetEntry);
              }
          }
          
          if (sourceEntry.items.length === 0) {
              window.DB.drugs = window.DB.drugs.filter(d => d.id !== drugId);
          }
      }

      this.closeDrugPropertyModal();
      renderer.renderDrugCategory(sourceEntry.major);
      this.autoSave(); // 모달 \uC800\uC7A5 시 자동 \uC800\uC7A5
  }
  // 카테고리 \uC0AD\uC11C
  deleteCategory(major, minor, sub = null) {
      const msg = sub ? `\uC18C\uBD84\uB958 [${sub}]와 해당 \uC57D\uBB3C들을 \uC0AD\uC11C하시겠습니까?` : `\uC911\uBD84\uB958 [${minor}]와 하위 모든 항목을 \uC0AD\uC11C하시겠습니까?`;
      if (!confirm(msg)) return;
      
      if (sub) {
          // 특정 \uC18C\uBD84\uB958 \uC0AD\uC11C
          window.DB.drugs = window.DB.drugs.filter(d => !(d.major === major && d.minor === minor && d.sub === sub));
      } else {
          // \uC911\uBD84\uB958 전체 \uC0AD\uC11C
          window.DB.drugs = window.DB.drugs.filter(d => !(d.major === major && d.minor === minor));
      }
      
      renderer.renderDrugCategory(major);
      this.showSaveBar();
  }

  // Sidebar 관련
  openDrugDetailSidebar(drugId, itemIdx) {
      const drugEntry = window.DB.drugs.find(d => d.id === drugId);
      if (!drugEntry || !drugEntry.items[itemIdx]) return;
      
      this.activeSidebarDrug = { drugId, itemIdx };
      const item = drugEntry.items[itemIdx];
      
      const content = document.getElementById('sidebar-content');
      content.innerHTML = `
        <div class="sidebar-field">
          <label>성분명</label>
          <div style="font-size: 1.2rem; font-weight: 900; margin-bottom: 4px; color: var(--secondary);">${item.ingredient}</div>
          <div style="font-size: 1rem; font-weight: 700; color: #64748b; margin-bottom: 24px;">${item.reference}</div>
        </div>
        <div class="sidebar-field">
          <label>\uC57D\uBB3C 설명 / 효능효과</label>
          <textarea id="sidebar-desc" class="sidebar-textarea" placeholder="\uC0C1\uC138 \uC815\uBCF4를 입력하세요...">${item.desc || ''}</textarea>
        </div>
        <div class="sidebar-field">
          <label>용법/용량</label>
          <textarea id="sidebar-usage" class="sidebar-textarea" placeholder="용법 및 용량을 입력하세요...">${item.usage || ''}</textarea>
        </div>
        <div class="sidebar-field">
          <label>주의사항 / 부작용</label>
          <textarea id="sidebar-caution" class="sidebar-textarea" placeholder="주의사항을 입력하세요...">${item.caution || ''}</textarea>
        </div>
      `;
      
      document.getElementById('drug-detail-sidebar').classList.add('open');
      document.getElementById('sidebar-overlay').classList.add('open');
  }

  closeDrugDetailSidebar() {
      document.getElementById('drug-detail-sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('open');
      this.activeSidebarDrug = null;
  }

  async saveDrugDetails() {
      if (!this.activeSidebarDrug) return;
      const { drugId, itemIdx } = this.activeSidebarDrug;
      const drugEntry = window.DB.drugs.find(d => d.id === drugId);
      if (!drugEntry || !drugEntry.items[itemIdx]) return;
      
      const item = drugEntry.items[itemIdx];
      item.desc = document.getElementById('sidebar-desc').value;
      item.usage = document.getElementById('sidebar-usage').value;
      item.caution = document.getElementById('sidebar-caution').value;
      
      await this.autoSave();
      this.closeDrugDetailSidebar();
      console.log('✅ \uC0C1\uC138 \uC815\uBCF4 \uC800\uC7A5 완료');
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 \uB300\uBD84\uB958 \uCD94\uAC00
  async addGuidelineMajor() {
    const name = prompt('새 \uB300\uBD84\uB958 이름을 입력하세요:');
    if (!name) return;
    
    const payload = {
        major: name,
        sub: '기본 \uC911\uBD84\uB958',
        title: '새 \uAC00\uC774\uB4DC\uB77C\uC778 (내용을 \uC218\uC815하세요)',
        year: new Date().getFullYear().toString(),
        publisher: '출처 미정'
    };

    try {
        const response = await fetch('/api/guidelines', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': localStorage.getItem('firebaseToken')
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            // 전체 데이터 재로드하여 정합성 유지
            const dbRes = await fetch('/api/db');
            window.DB = await dbRes.json();
            renderer.renderGuidelineMajors(this.isAdmin);
            this.showToast('새 \uB300\uBD84\uB958가 서버에 \uC800\uC7A5되었습니다.');
        } else {
            alert('\uC800\uC7A5 \uC2E4\uD328: ' + result.error);
        }
    } catch (err) {
        console.error('Error adding guideline major:', err);
        alert('서버 연결 오류가 발생했습니다.');
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 \uC911\uBD84\uB958 \uCD94\uAC00
  async addGuidelineSubcategory(major) {
    const name = prompt('새 \uC911\uBD84\uB958 이름을 입력하세요:');
    if (!name) return;
    
    const payload = {
        major: major,
        sub: name,
        title: '새 \uAC00\uC774\uB4DC\uB77C\uC778 (내용을 \uC218\uC815하세요)',
        year: new Date().getFullYear().toString(),
        publisher: '출처 미정'
    };

    try {
        const response = await fetch('/api/guidelines', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': localStorage.getItem('firebaseToken')
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            const dbRes = await fetch('/api/db');
            window.DB = await dbRes.json();
            renderer.renderGuidelineSubcategories(major, this.isAdmin);
            this.showToast('새 \uC911\uBD84\uB958가 서버에 \uC800\uC7A5되었습니다.');
        } else {
            alert('\uC800\uC7A5 \uC2E4\uD328: ' + result.error);
        }
    } catch (err) {
        console.error('Error adding guideline sub:', err);
        alert('서버 연결 오류가 발생했습니다.');
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 카테고리 \uC0AD\uC11C
  async deleteGuidelineCategory(major, sub = null) {
    const type = sub ? '\uC911\uBD84\uB958' : '\uB300\uBD84\uB958';
    const msg = sub 
        ? `[${major} > ${sub}] \uC911\uBD84\uB958와 그 안의 모든 \uAC00\uC774\uB4DC\uB77C\uC778을 \uC0AD\uC11C하시겠습니까?`
        : `[${major}] \uB300\uBD84\uB958와 하위 모든 데이터를 \uC0AD\uC11C하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    
    if (!confirm(msg)) return;

    // 실제로는 서버에서 \uC0AD\uC11C 로직이 필요하지만, 여기서는 클라이언트 측 필터링 후 전체 \uC800\uC7A5 시뮬레이션
    // \uAC00\uC774\uB4DC\uB77C\uC778 데이터는 현재 개별 \uC0AD\uC11C API가 없으므로 추후 서버 보강 필요
    // 현재는 window.DB에서 제거 후 UI 갱신
    if (sub) {
        const toDelete = window.DB.guidelines.filter(g => g.major === major && g.sub === sub);
        window.DB.trash.push(...toDelete.map(g => ({ ...g, deletedAt: new Date().toISOString(), type: 'guideline_sub' })));
        window.DB.guidelines = window.DB.guidelines.filter(g => !(g.major === major && g.sub === sub));
    } else {
        const toDelete = window.DB.guidelines.filter(g => g.major === major);
        window.DB.trash.push(...toDelete.map(g => ({ ...g, deletedAt: new Date().toISOString(), type: 'guideline_major' })));
        window.DB.guidelines = window.DB.guidelines.filter(g => g.major !== major);
    }

    this.showToast(`${type}이(가) 휴지통으로 이동되었습니다.`);
    if (sub) renderer.renderGuidelineSubcategories(major, this.isAdmin);
    else renderer.renderGuidelineMajors(this.isAdmin);
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 카테고리 명칭 변경
  async renameGuidelineCategory(major, sub = null) {
    const isSub = !!sub;
    const oldName = isSub ? sub : major;
    const type = isSub ? 'sub' : 'major';
    const newName = prompt(`"${oldName}" ${isSub ? '\uC911\uBD84\uB958' : '\uB300\uBD84\uB958'}의 새 이름을 입력하세요:`, oldName);
    
    if (!newName || newName === oldName) return;

    try {
      const response = await fetch('/api/categories/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({
          type,
          oldName,
          newName,
          majorContext: major
        })
      });

      if (response.ok) {
        // 로컬 데이터 갱신
        window.DB.guidelines.forEach(g => {
          if (type === 'major' && g.major === oldName) {
            g.major = newName;
            g.category = `${newName} - ${g.sub}`;
          } else if (type === 'sub' && g.major === major && g.sub === oldName) {
            g.sub = newName;
            g.category = `${g.major} - ${newName}`;
          }
        });
        
        // 카테고리 메타데이터도 있다면 갱신
        if (window.DB.categoryMetadata) {
          window.DB.categoryMetadata.forEach(m => {
            if (type === 'major' && m.major === oldName) m.major = newName;
            else if (type === 'sub' && m.major === major && m.sub === oldName) m.sub = newName;
          });
        }

        this.showToast('분류 명칭이 변경되었습니다.');
        this.handleRoute(); // 화면 갱신
      } else {
        alert('변경 \uC2E4\uD328: ' + await response.text());
      }
    } catch (err) {
      console.error('Rename error:', err);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  }

  // 휴지통 복구
  async restoreFromTrash(id) {
    try {
      const response = await fetch(`/api/guidelines/${id}/restore`, {
        method: 'POST',
        headers: {
          'x-api-key': localStorage.getItem('firebaseToken')
        }
      });

      if (response.ok) {
        this.showToast('\uAC00\uC774\uB4DC\uB77C\uC778이 복구되었습니다.');
        await this.fetchData();
        renderer.renderTrash();
      } else {
        const result = await response.json();
        alert('복구 \uC2E4\uD328: ' + result.error);
      }
    } catch (err) {
      console.error('Error restoring guideline:', err);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  }

  // 휴지통 비우기 (영구 \uC0AD\uC11C)
  async emptyTrash() {
    if (confirm('휴지통을 완전히 비우시겠습니까? 모든 데이터가 영구 \uC0AD\uC11C됩니다.')) {
        const trashItems = window.DB.trash || [];
        let successCount = 0;
        
        for (const item of trashItems) {
            try {
                const response = await fetch(`/api/guidelines/${item.id}/permanent`, {
                    method: 'DELETE',
                    headers: {
                        'x-api-key': localStorage.getItem('firebaseToken')
                    }
                });
                if (response.ok) successCount++;
            } catch (e) {
                console.error(`Failed to permanently delete ${item.id}`, e);
            }
        }
        
        this.showToast(`${successCount}개의 항목이 영구 \uC0AD\uC11C되었습니다.`);
        await this.fetchData();
        renderer.renderTrash();
    }
  }

  // --- 질병 통합\uC694\uC57D 관련 ---
  toggleEditIntegrationSummary() {
    const display = document.getElementById('integration-summary-display');
    const edit = document.getElementById('integration-summary-edit');
    if (display && edit) {
      const isEditing = edit.style.display === 'block';
      edit.style.display = isEditing ? 'none' : 'block';
      display.style.display = isEditing ? 'block' : 'none';
    }
  }

  async saveIntegrationSummary(major, sub) {
    const textarea = document.getElementById('integration-summary-textarea');
    if (!textarea) return;

    const summary = textarea.value;
    
    try {
      const response = await fetch('/api/category-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({ major, sub, summary })
      });

      if (response.ok) {
        // 로컬 데이터 갱신
        if (!window.DB.categoryMetadata) window.DB.categoryMetadata = [];
        const index = window.DB.categoryMetadata.findIndex(m => m.major === major && m.sub === sub);
        if (index > -1) {
          window.DB.categoryMetadata[index].summary = summary;
        } else {
          window.DB.categoryMetadata.push({ major, sub, summary });
        }
        
        alert('✅ 통합 \uC694\uC57D이 \uC800\uC7A5되었습니다.');
        this.handleRoute(); // 화면 갱신
      } else {
        const text = await response.text();
        console.error(`Save failed (${response.status}):`, text);
        alert(`❌ \uC800\uC7A5 \uC2E4\uD328 (상태 코드: ${response.status})\n내용: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('Error in saveIntegrationSummary:', err);
      alert('❌ 오류 발생: ' + err.message);
    }
  }

  // --- 개별 \uAC00\uC774\uB4DC\uB77C\uC778 AI \uC694\uC57D 편집 ---
  toggleEditAiSummary() {
    const display = document.getElementById('ai-summary-display');
    const edit = document.getElementById('ai-summary-edit');
    if (display && edit) {
      const isEditing = edit.style.display === 'block';
      edit.style.display = isEditing ? 'none' : 'block';
      display.style.display = isEditing ? 'block' : 'none';
    }
  }

  async saveAiSummary(id) {
    const aiSummary = document.getElementById('edit-ai-content').value;

    try {
      const response = await fetch(`/api/guidelines/${id}/ai-summary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({ aiSummary })
      });

      if (response.ok) {
        // 로컬 데이터 갱신
        const index = window.DB.guidelines.findIndex(g => g.id === id);
        if (index > -1) {
          window.DB.guidelines[index].aiSummary = aiSummary;
        }
        
        this.showToast('✨ \uC694\uC57D이 \uC800\uC7A5되었으며, 자동으로 완료 체크 되었습니다.');
        // \uC694\uC57D이 \uC800\uC7A5되면 자동으로 작업 완료 체크 활성화
        await this.toggleGuidelineCheck(id, true);
      } else {
        const text = await response.text();
        console.error(`Save failed (${response.status}):`, text);
        alert(`❌ \uC800\uC7A5 \uC2E4\uD328 (상태 코드: ${response.status})\n내용: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('Error in saveAiSummary:', err);
      alert('❌ 오류 발생: ' + err.message);
    }
  }

  handleMdFileUpload(event, id) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.md')) {
      alert('❌ .md 확장자 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const textarea = document.getElementById('edit-ai-content');
      if (textarea) {
        textarea.value = content;
        this.showToast('✅ 마크다운 내용을 불러왔습니다. \uD655\uC778 후 [\uC800\uC7A5하기]를 눌러주세요.');
      }
    };
    reader.onerror = () => {
      alert('❌ 파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
  }

  handleCategoryMdFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.md')) {
      alert('❌ .md 확장자 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const textarea = document.getElementById('integration-summary-textarea');
      if (textarea) {
        textarea.value = content;
        this.showToast('✅ 통합 \uC694\uC57D 마크다운 내용을 불러왔습니다. \uD655\uC778 후 [\uC800\uC7A5]을 눌러주세요.');
      }
    };
    reader.onerror = () => {
      alert('❌ 파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
  }

  async toggleGuidelineCheck(id, isChecked) {
    try {
      const response = await fetch(`/api/guidelines/${id}/check`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({ is_checked: isChecked })
      });

      if (response.ok) {
        // 로컬 데이터 갱신
        const index = window.DB.guidelines.findIndex(g => g.id === id);
        if (index > -1) {
          window.DB.guidelines[index].is_checked = isChecked ? 1 : 0;
        }
        this.handleRoute(); // 화면 갱신
      } else {
        const text = await response.text();
        console.error('Check toggle failed:', text);
      }
    } catch (err) {
      console.error('Error in toggleGuidelineCheck:', err);
    }
  }




  // --- 순서 조정 (드래그 앤 드롭) ---
  initSortable(type, containerId) {
    if (!this.isAdmin) return;
    console.log(`[Sortable] Initializing ${type}...`);

    // 1. \uAC00\uC774\uB4DC\uB77C\uC778 (신판/구판 그룹화 이동 대응)
    if (type === 'guideline') {
      const containers = document.querySelectorAll('.guideline-list-container');
      console.log(`[Sortable] Found ${containers.length} guideline containers.`);
      if (containers.length === 0) return;
      
      containers.forEach(el => {
        if (el._sortable) el._sortable.destroy();
        el._sortable = window.Sortable.create(el, {
          group: 'guidelines', // 다른 \uAC00\uC774\uB4DC\uB77C\uC778 \uBAA9\uB85D과 그룹화 (이동 가능)
          handle: '.drag-handle',
          animation: 200,
          ghostClass: 'sortable-ghost',
          dragClass: 'sortable-drag',
          draggable: '.item-card-cube',
          onEnd: async (evt) => {
            const items = [];
            document.querySelectorAll('.guideline-list-container').forEach(container => {
              const isOld = parseInt(container.dataset.isOld) || 0;
              const children = Array.from(container.children).filter(c => c.dataset.id);
              children.forEach((child, idx) => {
                items.push({ 
                  id: child.dataset.id, 
                  order: idx + 1,
                  is_old: isOld 
                });
              });
            });
            
            if (items.length === 0) return;
            
            try {
              const response = await fetch('/api/reorder', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': localStorage.getItem('firebaseToken')
                },
                body: JSON.stringify({ type: 'guideline', items })
              });
              
              if (response.ok) {
                this.showToast('📍 위치와 순서가 변경되어 \uC800\uC7A5되었습니다.');
                await this.fetchData();
              }
            } catch (err) {
              console.error('Reorder error:', err);
            }
          }
        });
      });
      return;
    }

    // 2. \uB300\uBD84\uB958/\uC911\uBD84\uB958 (단일 컨테이너 내 순서 변경)
    const el = document.getElementById(containerId);
    if (!el) return;
    
    if (el._sortable) el._sortable.destroy();
    
    console.log(`[Sortable] Initializing for ${type} on #${containerId}`);
    
    el._sortable = window.Sortable.create(el, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'sortable-ghost',
      draggable: '.neo-card', 
      filter: '.add-card', 
      onEnd: async (evt) => {
        const items = [];
        // 실제 데이터 카드만 필터링
        const children = Array.from(el.children).filter(c => c.dataset.major || c.dataset.id);
        
        children.forEach((child, index) => {
          if (type === 'guideline') {
            if (child.dataset.id) items.push({ id: child.dataset.id, order: index + 1 });
          } else if (type === 'major') {
            if (child.dataset.major) items.push({ major: child.dataset.major, order: index + 1 });
          } else if (type === 'subcategory') {
            if (child.dataset.major && child.dataset.sub) {
              items.push({ major: child.dataset.major, sub: child.dataset.sub, order: index + 1 });
            }
          }
        });
        
        if (items.length === 0) return;
        
        try {
          const response = await fetch('/api/reorder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': localStorage.getItem('firebaseToken')
            },
            body: JSON.stringify({ type, items })
          });
          
          if (response.ok) {
            this.showToast('📍 순서가 변경되어 \uC800\uC7A5되었습니다.');
            // 전체 데이터를 다시 불러와서 로컬 window.DB 동기화
            await this.fetchData();
          } else {
            const err = await response.json();
            alert('순서 \uC800\uC7A5 \uC2E4\uD328: ' + (err.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Order Save Error:', err);
        }
      }
    });
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 개별 \uC0AD\uC11C (휴지통으로 이동)
  async deleteGuideline(id) {
    if (!await this.checkAuth()) return;
    
    // 제목 찾기 (\uD655\uC778 메시지용)
    const g = (window.DB.guidelines || []).find(item => item.id === id);
    const title = g ? g.title : id;
    
    if (!confirm(`[${title}]\n이 \uAC00\uC774\uB4DC\uB77C\uC778을 휴지통으로 버리시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/guidelines/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': localStorage.getItem('firebaseToken')
        }
      });

      if (response.ok) {
        this.showToast('✅ 휴지통으로 이동되었습니다.');
        await this.fetchData(); // 데이터 재로드 및 window.DB 갱신
        this.handleRoute(); // 화면 갱신
      } else {
        const result = await response.json();
        alert('❌ \uC0AD\uC11C \uC2E4\uD328: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('❌ 서버와 통신 중 오류가 발생했습니다.');
    }
  }

  // 분류 선택 변경 핸들러 (\uB300\uBD84\uB958 변경 시 \uC911\uBD84\uB958 \uBAA9\uB85D 갱신 및 새로운 분류 입력창 제어)
  handleCategorySelectChange(type, value) {
    if (type === 'major') {
      const newMajorInput = document.getElementById('new-major-input');
      const subSelect = document.getElementById('edit-sub');
      
      if (value === '__NEW__') {
        newMajorInput.style.display = 'block';
        newMajorInput.focus();
        // \uB300\uBD84\uB958가 새로 \uCD94\uAC00될 경우 \uC911\uBD84\uB958도 무조건 새로 \uCD94\uAC00하거나 선택해야 함
        subSelect.innerHTML = '<option value="__NEW__">🆕 + 새로운 \uC911\uBD84\uB958 \uCD94\uAC00</option>';
        document.getElementById('new-sub-input').style.display = 'block';
      } else {
        newMajorInput.style.display = 'none';
        // 선택한 \uB300\uBD84\uB958에 해당하는 \uC911\uBD84\uB958 \uBAA9\uB85D으로 갱신
        const subsMap = dataService.getSubcategories(value);
        const subNames = Object.keys(subsMap);
        let optionsHtml = subNames.map(s => `<option value="${s}">${s}</option>`).join('');
        optionsHtml += '<option value="__NEW__">🆕 + 새로운 \uC911\uBD84\uB958 \uCD94\uAC00</option>';
        subSelect.innerHTML = optionsHtml;
        document.getElementById('new-sub-input').style.display = 'none';
      }
    } else if (type === 'sub') {
      const newSubInput = document.getElementById('new-sub-input');
      if (value === '__NEW__') {
        newSubInput.style.display = 'block';
        newSubInput.focus();
      } else {
        newSubInput.style.display = 'none';
      }
    } else if (type === 'country') {
      const newCountryInput = document.getElementById('new-country-input');
      if (value === '__NEW__') {
        newCountryInput.style.display = 'block';
        newCountryInput.focus();
      } else {
        newCountryInput.style.display = 'none';
      }
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 \uC815\uBCF4 업데이트 (제목, 년도, 출처, 링크 및 분류/국가 포함)
  async updateGuidelineDetails(id) {
    if (!this.isAdmin) return;
    
    // 기본 \uC815\uBCF4
    const title = document.getElementById('edit-title')?.value.trim();
    const year = document.getElementById('edit-year')?.value.trim();
    const publisher = document.getElementById('edit-publisher')?.value.trim();
    const sourceUrl = document.getElementById('edit-source-url')?.value.trim();
    const url = document.getElementById('edit-url')?.value.trim();

    // 분류 및 국가 \uC815\uBCF4 처리
    let major = document.getElementById('edit-major')?.value;
    let sub = document.getElementById('edit-sub')?.value;
    let country = document.getElementById('edit-country')?.value;

    if (major === '__NEW__') {
      major = document.getElementById('new-major-input')?.value.trim();
    }
    if (sub === '__NEW__') {
      sub = document.getElementById('new-sub-input')?.value.trim();
    }
    if (country === '__NEW__') {
      country = document.getElementById('new-country-input')?.value.trim();
    }

    if (!title) {
      alert('\uAC00\uC774\uB4DC\uB77C\uC778 제목은 필수입니다.');
      return;
    }
    if (!major || !sub) {
      alert('\uB300\uBD84\uB958와 \uC911\uBD84\uB958를 올바르게 선택하거나 입력해 주세요.');
      return;
    }

    console.log(`[updateGuidelineDetails] id: ${id}, major: ${major}, sub: ${sub}, country: ${country}, title: ${title}`);

    try {
      const response = await fetch(`/api/guidelines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({
          major,
          sub,
          country,
          title,
          year,
          publisher,
          source_url: sourceUrl,
          url
        })
      });

      if (response.ok) {
        this.showToast('✅ 모든 \uC815\uBCF4가 업데이트되었습니다.');
        
        // 메모리 내 DB 업데이트
        const guideline = (window.DB.guidelines || []).find(g => g.id === id);
        if (guideline) {
          guideline.major = major;
          guideline.sub = sub;
          guideline.country = country;
          guideline.title = title;
          guideline.year = year;
          guideline.publisher = publisher;
          guideline.source_url = sourceUrl;
          guideline.url = url;
        }
        
        // 분류가 바뀌었을 가능성이 높으므로 1초 후 새로고침 (\uBAA9\uB85D 위치가 바뀔 수 있음)
        setTimeout(() => {
          // 만약 분류가 바뀌었다면 해당 분류 \uBAA9\uB85D으로 이동하는 것이 친절함
          if (major && sub) {
            this.navigateTo(`/guidelines/subcategory/${encodeURIComponent(major)}/${encodeURIComponent(sub)}`);
          } else {
            this.handleRoute();
          }
        }, 1000);
      } else {
        const result = await response.json();
        alert('업데이트 \uC2E4\uD328: ' + (result.error || 'Unknown Error'));
      }
    } catch (err) {
      console.error('Update Error:', err);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  }

  // --- \uC911\uBD84\uB958 이동 모달 ---
  openSubcategoryMoveModal(currentMajor, sub) {
    const majors = dataService.getMajorCategories();
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'subcategory-move-modal';
    modalOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
      z-index: 9999; backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'neo-card';
    modalContent.style.cssText = `
      width: 90%; max-width: 500px; padding: 24px; background: #fff;
      border: 4px solid #000; box-shadow: 10px 10px 0px #000;
    `;

    modalContent.innerHTML = `
      <h3 style="margin-top: 0; font-weight: 900; font-size: 20px;">📁 \uC911\uBD84\uB958 이동: ${sub}</h3>
      <p style="margin-bottom: 20px; font-weight: 600; color: #64748b; font-size: 14px;">
        이 \uC911\uBD84\uB958에 속한 모든 \uAC00\uC774\uB4DC\uB77C\uC778을 다른 \uB300\uBD84\uB958로 이동합니다.<br>
        현재 위치: <b>${currentMajor}</b>
      </p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 800; font-size: 13px;">새로운 \uB300\uBD84\uB958 선택</label>
        <select id="target-major-select" style="width: 100%; padding: 12px; border: 3px solid #000; font-weight: 700; background: #fff; outline: none;">
          ${majors.map(m => `<option value="${m}" ${m === currentMajor ? 'disabled' : ''}>${m}</option>`).join('')}
        </select>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-move-btn" class="neo-btn" style="background: #e2e8f0; color: #000; padding: 10px 20px;">\uC128\uC18C</button>
        <button id="confirm-move-btn" class="neo-btn" style="background: #3b82f6; color: #fff; padding: 10px 20px;">이동 실행</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // 이벤트 리스너
    modalOverlay.onclick = (e) => { if(e.target === modalOverlay) document.body.removeChild(modalOverlay); };
    document.getElementById('cancel-move-btn').onclick = () => document.body.removeChild(modalOverlay);
    
    document.getElementById('confirm-move-btn').onclick = async () => {
      const targetMajor = document.getElementById('target-major-select').value;
      if (!targetMajor) return;

      try {
        const response = await fetch('/api/categories/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': localStorage.getItem('firebaseToken')
          },
          body: JSON.stringify({ currentMajor, sub, targetMajor })
        });

        if (response.ok) {
          const result = await response.json();
          this.showToast('🚀 ' + result.message);
          document.body.removeChild(modalOverlay);
          await this.fetchData();
          this.handleRoute(); // 화면 갱신
        } else {
          const err = await response.json();
          alert('이동 \uC2E4\uD328: ' + (err.error || '알 수 없는 오류'));
        }
      } catch (err) {
        console.error('Move error:', err);
        alert('이동 처리 중 오류가 발생했습니다.');
      }
    };
  }

  // --- \uAC00\uC774\uB4DC\uB77C\uC778 분류 이동 모달 ---
  openGuidelineMoveModal(id) {
    const guideline = window.DB.guidelines.find(g => g.id === id);
    if (!guideline) return;
    const { title, major: currentMajor, sub: currentSub } = guideline;
    
    const majors = dataService.getMajorCategories();
    
    // 모달 컨테이너 생성
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'guideline-move-modal';
    modalOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
      z-index: 9999; backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'neo-card';
    modalContent.style.cssText = `
      width: 90%; max-width: 500px; padding: 24px; background: #fff;
      border: 4px solid #000; box-shadow: 10px 10px 0px #000;
    `;

    modalContent.innerHTML = `
      <h3 style="margin-top: 0; font-weight: 900; font-size: 20px;">📁 분류 이동: ${title}</h3>
      <p style="font-size: 14px; color: #666; margin-bottom: 20px;">\uAC00\uC774\uB4DC\uB77C\uC778의 \uB300\uBD84\uB958와 \uC911\uBD84\uB958를 변경합니다.</p>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 800; margin-bottom: 6px;">\uB300\uBD84\uB958 (Major)</label>
        <select id="move-major-select" style="width: 100%; padding: 12px; border: 3px solid #000; border-radius: 4px; font-weight: 700; font-size: 15px; background: white;">
          ${majors.map(m => `<option value="${m}" ${m === currentMajor ? 'selected' : ''}>${m}</option>`).join('')}
          <option value="__NEW__">+ [새 \uB300\uBD84\uB958 \uCD94\uAC00]</option>
        </select>
        <input type="text" id="new-major-input" placeholder="새 \uB300\uBD84\uB958 명칭 입력" style="display: none; width: 100%; margin-top: 8px; padding: 12px; border: 3px solid #ef4444; border-radius: 4px;">
      </div>

      <div style="margin-bottom: 24px;">
        <label style="display: block; font-weight: 800; margin-bottom: 6px;">\uC911\uBD84\uB958 (Sub)</label>
        <select id="move-sub-select" style="width: 100%; padding: 12px; border: 3px solid #000; border-radius: 4px; font-weight: 700; font-size: 15px; background: white;">
          <!-- 동적으로 채워짐 -->
        </select>
        <input type="text" id="new-sub-input" placeholder="새 \uC911\uBD84\uB958 명칭 입력" style="display: none; width: 100%; margin-top: 8px; padding: 12px; border: 3px solid #ef4444; border-radius: 4px;">
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="confirm-move-btn" class="neo-btn-sm" style="flex: 1; background: #3b82f6; color: white; border: none; font-weight: 900; font-size: 16px; padding: 12px;">\uC800\uC7A5 및 이동</button>
        <button id="cancel-move-btn" class="neo-btn-sm" style="flex: 1; background: #e2e8f0; color: #000; border: none; font-weight: 900; font-size: 16px; padding: 12px;">\uC128\uC18C</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // \uC911\uBD84\uB958 드롭다운 갱신 함수
    const updateSubOptions = (major) => {
      const subSelect = document.getElementById('move-sub-select');
      const existingSubs = [...new Set(window.DB.guidelines.filter(g => g.major === major).map(g => g.sub))].sort();
      
      subSelect.innerHTML = existingSubs.map(s => `<option value="${s}" ${s === currentSub ? 'selected' : ''}>${s}</option>`).join('') + 
                           `<option value="__NEW__">+ [새 \uC911\uBD84\uB958 \uCD94\uAC00]</option>`;
      
      // \uB300\uBD84\uB958가 새 분류라면 \uC911\uBD84\uB958도 새 입력창 강제
      if (major === '__NEW__') {
        subSelect.value = '__NEW__';
        subSelect.style.display = 'none';
        document.getElementById('new-sub-input').style.display = 'block';
      } else {
        subSelect.style.display = 'block';
        document.getElementById('new-sub-input').style.display = subSelect.value === '__NEW__' ? 'block' : 'none';
      }
    };

    updateSubOptions(currentMajor);

    // 이벤트 바인딩
    document.getElementById('move-major-select').onchange = (e) => {
      const isNew = e.target.value === '__NEW__';
      document.getElementById('new-major-input').style.display = isNew ? 'block' : 'none';
      updateSubOptions(e.target.value);
    };

    document.getElementById('move-sub-select').onchange = (e) => {
      const isNew = e.target.value === '__NEW__';
      document.getElementById('new-sub-input').style.display = isNew ? 'block' : 'none';
    };

    document.getElementById('cancel-move-btn').onclick = () => modalOverlay.remove();
    document.getElementById('confirm-move-btn').onclick = async () => {
      const majorSelect = document.getElementById('move-major-select');
      const subSelect = document.getElementById('move-sub-select');
      
      const finalMajor = majorSelect.value === '__NEW__' ? document.getElementById('new-major-input').value.trim() : majorSelect.value;
      const finalSub = subSelect.value === '__NEW__' ? document.getElementById('new-sub-input').value.trim() : subSelect.value;
      
      if (!finalMajor || !finalSub) {
        alert('분류 명칭을 정확히 입력해 주세요.');
        return;
      }

      const btn = document.getElementById('confirm-move-btn');
      btn.innerText = '처리 중...';
      btn.disabled = true;

      try {
        const response = await fetch(`/api/guidelines/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': localStorage.getItem('firebaseToken')
          },
          body: JSON.stringify({ major: finalMajor, sub: finalSub })
        });

        if (response.ok) {
          this.showToast('분류가 변경되었습니다.');
          modalOverlay.remove();
          await this.fetchData(); // 서버로부터 전체 데이터 재로드 (가장 확실한 방법)
          this.handleRoute(); // 화면 갱신
        } else {
          alert('변경 \uC2E4\uD328: ' + await response.text());
          btn.innerText = '\uC800\uC7A5 및 이동';
          btn.disabled = false;
        }
      } catch (err) {
        console.error('Move error:', err);
        alert('서버와 통신 중 오류가 발생했습니다.');
        modalOverlay.remove();
      }
    };
  }

  // --- 관리자 권한 관리 ---
  async addAdmin() {
    const emailInput = document.getElementById('new-admin-email');
    const email = emailInput.value.trim();
    if (!email) return;

    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({ email, role: 'admin' })
      });

      if (response.ok) {
        this.showToast('관리자가 등록되었습니다.');
        this.handleRoute(); // \uBAA9\uB85D 갱신
      } else {
        alert('등록 \uC2E4\uD328: ' + await response.text());
      }
    } catch (err) {
      alert('오류 발생: ' + err.message);
    }
  }

  async deleteAdmin(email) {
    if (!confirm(`[${email}] 관리자 권한을 해제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/admins/${email}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': localStorage.getItem('firebaseToken')
        }
      });

      if (response.ok) {
        this.showToast('관리자가 제거되었습니다.');
        this.handleRoute(); // \uBAA9\uB85D 갱신
      } else {
        alert('\uC0AD\uC11C \uC2E4\uD328: ' + await response.text());
      }
    } catch (err) {
      alert('오류 발생: ' + err.message);
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 개별 메모 \uC800\uC7A5
  async saveGuidelineMemo(id, memo) {
    if (!this.isAdmin) return;

    // 로컬 데이터 선반영 (Optimistic Update)
    const guideline = window.DB.guidelines.find(g => g.id === id);
    if (guideline) {
      if (guideline.memo === memo) return; // 변경사항 없으면 무시
      guideline.memo = memo;
    }

    try {
      const token = localStorage.getItem('firebaseToken');
      const response = await fetch(`/api/guidelines/${id}/memo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token
        },
        body: JSON.stringify({ memo })
      });

      if (response.ok) {
        console.log(`✅ Memo saved for ${id}`);
        // 메모가 있는 경우 배경색을 노란색 계열로 변경하여 피드백 제공
        const textareas = document.querySelectorAll('.guideline-memo-textarea');
        textareas.forEach(ta => {
          if (ta.getAttribute('onblur') && ta.getAttribute('onblur').includes(id)) {
            ta.style.background = memo ? '#fefce8' : '#f8fafc';
          }
        });
      } else {
        const result = await response.json();
        console.error('Memo save failed:', result.error);
        this.showToast('메모 \uC800\uC7A5에 \uC2E4\uD328했습니다.');
      }
    } catch (err) {
      console.error('Error saving memo:', err);
      this.showToast('서버 통신 중 오류가 발생했습니다.');
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 PDF 연결 해제
  async unlinkGuidelinePDF(id) {
    if (!this.isAdmin) return;
    if (!confirm('정말로 이 \uAC00\uC774\uB4DC\uB77C\uC778과 PDF의 연결을 끊으시겠습니까?\n(파일 자체가 \uC0AD\uC11C되지는 않습니다.)')) return;

    try {
      const response = await fetch(`/api/guidelines/${id}/unlink`, {
        method: 'POST',
        headers: {
          'x-api-key': localStorage.getItem('firebaseToken')
        }
      });
      const result = await response.json();

      if (response.ok) {
        this.showToast('PDF 연결이 해제되었습니다.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('연결 해제 \uC2E4\uD328: ' + result.error);
      }
    } catch (err) {
      console.error('Error unlinking PDF:', err);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  }

  // Firebase URL 직접 연결
  async linkManualFirebaseUrl(id) {
    if (!this.isAdmin) return;
    const input = document.getElementById(`manualUrlInput-${id}`);
    const url = input.value.trim();
    const statusDiv = document.getElementById(`linkStatus-${id}`);

    if (!url) {
      alert('URL을 입력해 주세요.');
      return;
    }

    statusDiv.innerHTML = '연결 중... ⏳';
    statusDiv.style.color = 'var(--primary)';

    try {
      const response = await fetch(`/api/guidelines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        statusDiv.innerHTML = '✅ \uC131\uACF5적으로 연결되었습니다! 새로고침합니다...';
        statusDiv.style.color = '#065F46';
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const result = await response.json();
        statusDiv.innerHTML = `❌ 오류: ${result.error}`;
        statusDiv.style.color = 'red';
      }
    } catch (err) {
      console.error('Manual link error:', err);
      statusDiv.innerHTML = '❌ 서버 통신 연결 \uC2E4\uD328';
      statusDiv.style.color = 'red';
    }
  }

  // \uAC00\uC774\uB4DC\uB77C\uC778 파일 직접 업로드 (기존 파일 교체)
  async uploadGuidelineFile(id, form) {
    if (!this.isAdmin) return;
    const statusDiv = document.getElementById(`uploadStatus-${id}`);
    if (statusDiv) {
      statusDiv.innerHTML = '업로드 중... ⏳';
      statusDiv.style.color = 'var(--primary)';
    }

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: formData
      });

      if (response.ok) {
        if (statusDiv) {
          statusDiv.innerHTML = '✅ 업로드 \uC131\uACF5! 화면을 갱신합니다...';
          statusDiv.style.color = '#065F46';
        }
        this.showToast('파일이 \uC131\uACF5적으로 교체되었습니다.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const result = await response.json();
        if (statusDiv) {
          statusDiv.innerHTML = `❌ 오류: ${result.error}`;
          statusDiv.style.color = 'red';
        }
        alert('업로드 \uC2E4\uD328: ' + result.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Upload error:', err);
      if (statusDiv) {
        statusDiv.innerHTML = '❌ 서버 통신 오류';
        statusDiv.style.color = 'red';
      }
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  }
  // 분류 설정 모달 열기
  async openCategoryModal(id) {
    if (!this.isAdmin) return;
    const g = (window.DB.guidelines || []).find(x => x.id === id);
    if (!g) return;

    const majors = [...new Set(window.DB.guidelines.map(x => x.major))];
    
    // 모달용 컨테이너 생성
    let modal = document.getElementById('category-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'category-modal';
      modal.className = 'neo-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="neo-modal-content" style="max-width: 400px; padding: 30px; border: 4px solid var(--black); box-shadow: 10px 10px 0px var(--black); background: #fff;">
        <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px; font-weight: 900;">
          📂 분류 이동 / 설정
        </h3>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">'${g.title}' 항목의 분류를 변경합니다.</p>
        
        <div style="display: grid; gap: 15px;">
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 800; font-size: 13px;">\uB300\uBD84\uB958</label>
            <select id="modal-major" class="neo-input" onchange="window.app.updateModalSubs('${id}', this.value)" style="width: 100%; padding: 10px; border: 2px solid #000;">
              ${majors.map(m => `<option value="${m}" ${m === g.major ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 800; font-size: 13px;">\uC911\uBD84\uB958</label>
            <select id="modal-sub" class="neo-input" style="width: 100%; padding: 10px; border: 2px solid #000;">
              ${[...new Set(window.DB.guidelines.filter(x => x.major === g.major).map(x => x.sub))].map(s => `<option value="${s}" ${s === g.sub ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 25px;">
          <button onclick="window.app.saveQuickCategory('${id}')" class="neo-btn" style="flex: 1; background: #3b82f6; color: white; padding: 12px; border: 2px solid #000; font-weight: 900; cursor: pointer;">💾 \uC800\uC7A5</button>
          <button onclick="document.getElementById('category-modal').style.display='none'" class="neo-btn" style="flex: 1; background: #94a3b8; color: white; padding: 12px; border: 2px solid #000; font-weight: 900; cursor: pointer;">\uC128\uC18C</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  // 모달 내 \uB300\uBD84\uB958 변경 시 \uC911\uBD84\uB958 \uBAA9\uB85D 업데이트
  updateModalSubs(id, major) {
    const subs = [...new Set(window.DB.guidelines.filter(x => x.major === major).map(x => x.sub))];
    const subSelect = document.getElementById('modal-sub');
    if (subSelect) {
      subSelect.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  }

  // 모달에서 분류 \uC800\uC7A5
  async saveQuickCategory(id) {
    const major = document.getElementById('modal-major').value;
    const sub = document.getElementById('modal-sub').value;
    const g = (window.DB.guidelines || []).find(x => x.id === id);

    if (!major || !sub) return;

    try {
      const response = await fetch(`/api/guidelines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('firebaseToken')
        },
        body: JSON.stringify({
          ...g,
          major,
          sub
        })
      });

      if (response.ok) {
        this.showToast('✅ 분류가 변경되었습니다.');
        document.getElementById('category-modal').style.display = 'none';
        
        g.major = major;
        g.sub = sub;
        
        this.handleRoute();
      } else {
        alert('\uC800\uC7A5 \uC2E4\uD328');
      }
    } catch (err) {
      console.error(err);
      alert('오류 발생');
    }
  }

  // 드래그 앤 드롭 시스템 초기화
  initDragAndDrop() {
    let draggedItem = null;
    let canDrag = false;

    // 핸들을 클릭했을 때만 드래그 허용 플래그 설정
    document.addEventListener('mousedown', (e) => {
      if (!this.isAdmin) return;
      const handle = e.target.closest('.drag-handle');
      canDrag = !!handle;
    });

    document.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.neo-card');
      if (!card || !this.isAdmin || !canDrag) {
        e.preventDefault();
        return;
      }
      
      draggedItem = card;
      draggedItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      
      // 투명도 조절 등을 위해 약간의 지연 후 클래스 추가 (선택사항)
      setTimeout(() => draggedItem.classList.add('drag-ghost'), 0);
      console.log('📦 Drag Start:', draggedItem.dataset.id);
    });

    document.addEventListener('dragend', (e) => {
      if (draggedItem) {
        draggedItem.classList.remove('dragging', 'drag-ghost');
        draggedItem = null;
        canDrag = false;
        console.log('🏁 Drag End');
      }
    });

    document.addEventListener('dragover', (e) => {
      if (!draggedItem) return;
      e.preventDefault();
      
      const container = draggedItem.parentNode;
      const closestElement = this.getDragAfterElement(container, e.clientX, e.clientY);
      
      if (closestElement && closestElement !== draggedItem) {
        const box = closestElement.getBoundingClientRect();
        // 수평/수직 모두 대응하는 범용 로직
        const isAfter = (e.clientX > box.left + box.width / 2) || (e.clientY > box.top + box.height / 2);
        
        if (isAfter) {
          container.insertBefore(draggedItem, closestElement.nextElementSibling);
        } else {
          container.insertBefore(draggedItem, closestElement);
        }
      }
    });




    document.addEventListener('drop', async (e) => {
      if (!draggedItem) return;
      e.preventDefault();
      
      const type = draggedItem.dataset.type;
      const container = draggedItem.parentNode;
      const items = Array.from(container.querySelectorAll(`:scope > [data-type="${type}"]`));

      
      const reorderData = items.map((item, index) => {
        const id = item.dataset.id;
        if (type === 'subcategory') {
          return { major: item.dataset.major, sub: id, order: index + 1 };
        } else if (type === 'major') {
          return { major: id, order: index + 1 };
        } else {
          return { id: id, order: index + 1 };
        }
      });

      await this.saveReorder(type, reorderData);
    });
  }

  getDragAfterElement(container, x, y) {
    // :scope를 사용하여 컨테이너의 직계 자식인 .neo-card들만 대상으로 함
    const draggableElements = [...container.querySelectorAll(':scope > .neo-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      
      const distance = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);

      if (distance < closest.distance) {
        return { distance: distance, element: child, box: box };
      } else {
        return closest;
      }
    }, { distance: Number.POSITIVE_INFINITY }).element;
  }



  async saveReorder(type, items) {
    try {
      const token = await getValidToken();
      if (!token) {
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해 주세요.');
        return;
      }

      const response = await fetch('/api/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token
        },
        body: JSON.stringify({ type, items })
      });

      if (response.ok) {
        console.log(`✅ ${type} 순서 저장 완료`);
        // 로컬 데이터 업데이트 및 재렌더링
        await this.fetchData();
        this.handleRoute();
      } else {
        const err = await response.json();
        alert('순서 저장 실패: ' + err.error);
      }
    } catch (err) {
      console.error('Reorder error:', err);
      alert('서버 통신 오류가 발생했습니다.');
    }
  }

}


// 전역 앱 객체 등록 (onclick 필터 등에서 참조)
window.app = new App();