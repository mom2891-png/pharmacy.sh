// 메인 애플리케이션 진입점 (라우터 및 초기화)
import * as renderer from './view-renderer.js?v=25';
import * as dataService from './data-service.js?v=25';

export class App {
  constructor() {
    this.activeSidebarDrug = null;
    this.isAdmin = sessionStorage.getItem('is_admin') === 'true';
    this.apiKey = this.isAdmin ? '3505' : (localStorage.getItem('pharm_api_key') || '');
    
    this.init();
  }

  // 관리자 모드 토글
  async toggleAdminMode() {
    if (this.isAdmin) {
      if (confirm('관리자 모드를 해제하시겠습니까?')) {
        this.isAdmin = false;
        sessionStorage.removeItem('is_admin');
        this.updateAdminUI();
        this.handleRoute(); // UI 갱신
      }
    } else {
      this.openAdminLoginModal();
    }
  }

  // 모달 열기/닫기
  openAdminLoginModal() {
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('login-error-msg').innerText = '';
    document.getElementById('admin-login-modal').style.display = 'flex';
    document.getElementById('admin-pw-input').focus();
  }

  closeAdminLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'none';
  }

  // 로그인 제출
  async submitAdminLogin() {
    const pwInput = document.getElementById('admin-pw-input');
    const errorMsg = document.getElementById('login-error-msg');
    const pw = pwInput.value;

    if (pw === '3505') {
      this.isAdmin = true;
      this.apiKey = pw;
      localStorage.setItem('pharm_api_key', pw);
      sessionStorage.setItem('is_admin', 'true');
      this.updateAdminUI();
      this.closeAdminLoginModal();
      this.showToast('관리자 인증에 성공했습니다.');
      this.navigateTo('/admin/guide'); // 로그인 시 가이드 페이지로 바로 이동
      
      // 만약 권한 대기 중인 리졸버가 있다면 해결
      if (this._authResolver) {
        this._authResolver(true);
        this._authResolver = null;
      }
    } else {
      errorMsg.innerText = '❌ 비밀번호가 일치하지 않습니다.';
      pwInput.style.borderColor = '#ef4444';
      setTimeout(() => pwInput.style.borderColor = '', 1000);
    }
  }

  // API Key 요청 및 저장 (데이터 수정 시 호출됨)
  async promptApiKey() {
    if (this.isAdmin && this.apiKey === '3505') return true;
    
    this.openAdminLoginModal();
    
    // 사용자가 모달을 통해 인증할 때까지 대기하는 Promise 반환
    return new Promise((resolve) => {
        this._authResolver = resolve;
    });
  }

  updateAdminUI() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const trashBtn = document.getElementById('trashNavBtn');
    
    if (this.isAdmin) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'flex';
      if (trashBtn) trashBtn.style.display = 'inline-block';
    } else {
      if (loginBtn) loginBtn.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (trashBtn) trashBtn.style.display = 'none';
    }
  }

  async init() {
    // 서버로부터 초기 데이터 로드
    try {
        const response = await fetch('/api/db');
        const db = await response.json();
        window.DB = db;
        if (!window.DB.trash) window.DB.trash = [];
        console.log('✅ 데이터베이스 로드 완료');
    } catch (err) {
        console.error('❌ 데이터베이스 로드 실패:', err);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
        return;
    }

    window.addEventListener('hashchange', () => this.handleRoute());
    // DOMContentLoaded는 이미 발생했을 수 있으므로 즉시 실행
    this.handleRoute();
    this.updateAdminUI();
    
    // 전역 검색 설정
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
  }

  handleRoute() {
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
          // ID 기반 상세 (예: /guidelines/g1)
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
      } else if (root === 'trash') {
        renderer.renderTrash();
      } else if (root === 'supplements') {
        if (parts.length === 2) {
          renderer.renderDetail(parts[1]);
        }
      } else if (root === 'search') {
        // 검색 결과는 navigateTo나 초기 로드 시 state가 없으므로 
        // 필요한 경우 여기서 세션스토리지나 쿼리 파라미터로 복구 가능
        // 현재는 빈 화면 방지를 위해 홈으로 리다이렉트하거나 메시지 표시
        if (!container.innerHTML.trim()) {
           this.navigateTo('/');
        }
      }
      
      this.updateActiveNav('/' + root);
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
      alert(`'${name}'에 대한 상세 정보를 찾을 수 없습니다.`);
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

  // 자동 저장 (특정 항목만 서버로 전송)
  async autoSave(drugId) {
    if (!drugId) return;
    const drugEntry = window.DB.drugs.find(d => d.id === drugId);
    if (!drugEntry) return;

    try {
        const response = await fetch(`/api/drugs/${drugId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(drugEntry)
        });
        
        if (response.status === 401) {
            if (await this.promptApiKey()) return this.autoSave(drugId);
            return;
        }

        const result = await response.json();
        if (result.success) {
            console.log(`✅ 항목 저장 완료: ${drugId}`);
            this.showToast('저장되었습니다');
        } else {
            console.error('❌ 저장 실패:', result.error);
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

  // 수정된 데이터를 수집하여 서버로 전송
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
                'x-api-key': this.apiKey
            },
            body: JSON.stringify({ drugs: updatedDrugs })
        });
        
        if (response.status === 401) {
            if (await this.promptApiKey()) return this.saveDrugs();
            return;
        }
        
        const result = await response.json();
        if (result.success) {
            alert('✅ 약물 정보가 성공적으로 저장되었습니다!');
            window.DB.drugs = updatedDrugs; // 메모리 상의 DB 업데이트
            const bar = document.getElementById('save-bar');
            if (bar) bar.style.display = 'none';
        } else {
            alert('❌ 저장 실패: ' + result.error);
        }
    } catch (err) {
        alert('❌ 서버 통신 오류가 발생했습니다.');
        console.error(err);
    }
  }

  // 개별 약물 텍스트 수정 시 호출
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
            headers: { 'x-api-key': this.apiKey },
            body: formData
        });

        if (response.status === 401) {
            if (await this.promptApiKey()) return this.handleImageUpload(drugId, itemIdx, file, container);
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
            
            this.showSaveBar(); // 변경사항이 있으므로 저장 바 표시
        } else {
            alert('❌ 업로드 실패: ' + result.error);
        }
    } catch (err) {
        console.error('Image Upload Error:', err);
        alert('❌ 이미지 업로드 중 오류가 발생했습니다.');
    }
  }

  // 중분류 이름 업데이트 (해당 대분류 내에서만)
  updateMinorName(major, oldName, newName) {
      newName = newName.trim();
      oldName = oldName.trim();
      major = major.trim();
      if (!newName || oldName === newName) return;
      window.DB.drugs.forEach(d => {
          if (d.major.trim() === major && d.minor.trim() === oldName) d.minor = newName;
      });
      renderer.renderDrugCategory(major); // UI 갱신
      this.autoSave(); // 즉시 저장
  }

  // 소분류 이름 업데이트 (해당 대분류 및 중분류 내에서만)
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
      this.autoSave(); // 즉시 저장
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
          
          // 원본 섹션이 비었으면 삭제
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

  // 중분류 특정 위치에 추가
  addMinorCategoryAt(major, atIndex) {
      const name = prompt('새 중분류 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: name,
          sub: '기본 소분류',
          items: []
      };
      
      // DB 배열의 특정 위치에 삽입
      window.DB.drugs.splice(atIndex, 0, newEntry);
      
      renderer.renderDrugCategory(major);
      this.autoSave();
  }

  // 개별 약물 추가
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

  // 중분류 추가
  addMinorCategory(major) {
      const name = prompt('새 중분류 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_m_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: name,
          sub: '기본 소분류',
          items: []
      };
      
      window.DB.drugs.push(newEntry);
      renderer.renderDrugCategory(major);
      this.autoSave();
  }

  // 소분류 추가
  addSubCategory(major, minor) {
      const name = prompt('새 소분류 이름을 입력하세요:');
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

  // 카테고리 삭제 (전역)
  deleteCategory(major, minor, sub = null) {
      if (!confirm(`정말로 이 ${sub ? '소분류' : '중분류'}를 삭제하시겠습니까? 관련 약물 데이터가 모두 사라집니다.`)) return;
      
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

      if (confirm('정말로 이 약물 정보를 삭제하시겠습니까?')) {
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
      html += `<option value="__ADD_NEW__">+ 새 중분류 추가</option>`;
      minorSelect.innerHTML = html;
  }

  updateModalSubOptions(major, minor, selectedSub) {
      const subSelect = document.getElementById('modal-drug-sub');
      const subs = [...new Set(window.DB.drugs.filter(d => d.major === major && d.minor === minor).map(d => d.sub))];
      
      let html = '';
      subs.forEach(s => {
          html += `<option value="${s}" ${s === selectedSub ? 'selected' : ''}>${s}</option>`;
      });
      html += `<option value="__ADD_NEW__">+ 새 소분류 추가</option>`;
      subSelect.innerHTML = html;
  }

  handleModalMinorChange(val) {
      const major = document.getElementById('modal-drug-major').value;
      if (val === '__ADD_NEW__') {
          const newMinor = prompt('새 중분류 이름을 입력하세요:');
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
          const newSub = prompt('새 소분류 이름을 입력하세요:');
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
              // 적절한 위치(같은 minor 그룹 끝)에 추가하는 로직 개선
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
      this.autoSave(); // 모달 저장 시 자동 저장
  }
  // 카테고리 삭제
  deleteCategory(major, minor, sub = null) {
      const msg = sub ? `소분류 [${sub}]와 해당 약물들을 삭제하시겠습니까?` : `중분류 [${minor}]와 하위 모든 항목을 삭제하시겠습니까?`;
      if (!confirm(msg)) return;
      
      if (sub) {
          // 특정 소분류 삭제
          window.DB.drugs = window.DB.drugs.filter(d => !(d.major === major && d.minor === minor && d.sub === sub));
      } else {
          // 중분류 전체 삭제
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
          <label>약물 설명 / 효능효과</label>
          <textarea id="sidebar-desc" class="sidebar-textarea" placeholder="상세 정보를 입력하세요...">${item.desc || ''}</textarea>
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
      console.log('✅ 상세 정보 저장 완료');
  }

  // 가이드라인 대분류 추가
  async addGuidelineMajor() {
    const name = prompt('새 대분류 이름을 입력하세요:');
    if (!name) return;
    
    const payload = {
        major: name,
        sub: '기본 중분류',
        title: '새 가이드라인 (내용을 수정하세요)',
        year: new Date().getFullYear().toString(),
        publisher: '출처 미정'
    };

    try {
        const response = await fetch('/api/guidelines', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': '3505'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            // 전체 데이터 재로드하여 정합성 유지
            const dbRes = await fetch('/api/db');
            window.DB = await dbRes.json();
            renderer.renderGuidelineMajors();
            this.showToast('새 대분류가 서버에 저장되었습니다.');
        } else {
            alert('저장 실패: ' + result.error);
        }
    } catch (err) {
        console.error('Error adding guideline major:', err);
        alert('서버 연결 오류가 발생했습니다.');
    }
  }

  // 가이드라인 중분류 추가
  async addGuidelineSubcategory(major) {
    const name = prompt('새 중분류 이름을 입력하세요:');
    if (!name) return;
    
    const payload = {
        major: major,
        sub: name,
        title: '새 가이드라인 (내용을 수정하세요)',
        year: new Date().getFullYear().toString(),
        publisher: '출처 미정'
    };

    try {
        const response = await fetch('/api/guidelines', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': '3505'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            const dbRes = await fetch('/api/db');
            window.DB = await dbRes.json();
            renderer.renderGuidelineSubcategories(major);
            this.showToast('새 중분류가 서버에 저장되었습니다.');
        } else {
            alert('저장 실패: ' + result.error);
        }
    } catch (err) {
        console.error('Error adding guideline sub:', err);
        alert('서버 연결 오류가 발생했습니다.');
    }
  }

  // 가이드라인 카테고리 삭제
  async deleteGuidelineCategory(major, sub = null) {
    const type = sub ? '중분류' : '대분류';
    const msg = sub 
        ? `[${major} > ${sub}] 중분류와 그 안의 모든 가이드라인을 삭제하시겠습니까?`
        : `[${major}] 대분류와 하위 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    
    if (!confirm(msg)) return;

    // 실제로는 서버에서 삭제 로직이 필요하지만, 여기서는 클라이언트 측 필터링 후 전체 저장 시뮬레이션
    // 가이드라인 데이터는 현재 개별 삭제 API가 없으므로 추후 서버 보강 필요
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

  // 휴지통 복구
  restoreFromTrash(id) {
    const idx = window.DB.trash.findIndex(item => item.id === id);
    if (idx === -1) return;
    
    const item = window.DB.trash.splice(idx, 1)[0];
    window.DB.guidelines.push(item);
    this.showToast('가이드라인이 복구되었습니다.');
    renderer.renderTrash();
  }

  // 휴지통 비우기
  emptyTrash() {
    if (confirm('휴지통을 완전히 비우시겠습니까? 모든 데이터가 영구 삭제됩니다.')) {
        window.DB.trash = [];
        renderer.renderTrash();
    }
  }

  // --- 질병 통합요약 관련 ---
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
          'x-api-key': '3505'
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
        
        alert('✅ 통합 요약이 저장되었습니다.');
        this.handleRoute(); // 화면 갱신
      } else {
        const text = await response.text();
        console.error(`Save failed (${response.status}):`, text);
        alert(`❌ 저장 실패 (상태 코드: ${response.status})\n내용: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('Error in saveIntegrationSummary:', err);
      alert('❌ 오류 발생: ' + err.message);
    }
  }

  // --- 개별 가이드라인 AI 요약 편집 ---
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
          'x-api-key': '3505'
        },
        body: JSON.stringify({ aiSummary })
      });

      if (response.ok) {
        // 로컬 데이터 갱신
        const index = window.DB.guidelines.findIndex(g => g.id === id);
        if (index > -1) {
          window.DB.guidelines[index].aiSummary = aiSummary;
        }
        
        this.showToast('✨ 요약이 저장되었으며, 자동으로 완료 체크 되었습니다.');
        // 요약이 저장되면 자동으로 작업 완료 체크 활성화
        await this.toggleGuidelineCheck(id, true);
      } else {
        const text = await response.text();
        console.error(`Save failed (${response.status}):`, text);
        alert(`❌ 저장 실패 (상태 코드: ${response.status})\n내용: ${text.substring(0, 100)}`);
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
        this.showToast('✅ 마크다운 내용을 불러왔습니다. 확인 후 [저장하기]를 눌러주세요.');
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
        this.showToast('✅ 통합 요약 마크다운 내용을 불러왔습니다. 확인 후 [저장]을 눌러주세요.');
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
          'x-api-key': '3505'
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

  async deleteGuideline(id, title) {
    if (!confirm(`"${title}" 가이드라인을 영구히 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/guidelines/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': '3505'
        }
      });

      if (response.ok) {
        // 로컬 데이터에서 제거
        window.DB.guidelines = window.DB.guidelines.filter(g => g.id !== id);
        this.showToast('가이드라인이 삭제되었습니다.');
        this.handleRoute(); // 화면 갱신
      } else {
        const result = await response.json();
        alert('삭제 실패: ' + result.error);
      }
    } catch (err) {
      console.error('Error deleting guideline:', err);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  }
}

// 전역 앱 객체 등록 (onclick 핸들러 등에서 참조)
window.app = new App();
