// 메인 애플리케이션 진입점 (라우터 및 초기화)
import * as renderer from './view-renderer.js?v=25';
import * as dataService from './data-service.js?v=25';

export class App {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
    
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
        renderer.renderHome();
        this.updateActiveNav('/');
        return;
      }

      const root = parts[0];
      
      if (root === 'guidelines') {
        if (parts.length === 1) {
          renderer.renderGuidelineMajors();
        } else if (parts[1] === 'category') {
          renderer.renderGuidelineSubcategories(decodeURIComponent(parts[2]));
        } else if (parts[1] === 'subcategory') {
          renderer.renderGuidelineItems(decodeURIComponent(parts[2]), decodeURIComponent(parts[3]));
        } else {
          // ID 기반 상세 (예: /guidelines/g1)
          renderer.renderDetail(parts[1]);
        }
      } else if (root === 'drugs') {
        if (parts.length === 1) {
          renderer.renderDrugMajors();
        } else if (parts[1] === 'category') {
          renderer.renderDrugCategory(decodeURIComponent(parts[2]));
        } else if (parts.length === 2) {
          renderer.renderDetail(parts[1]);
        }
      } else if (root === 'supplements') {
        if (parts.length === 2) {
          renderer.renderDetail(parts[1]);
        }
      } else if (root === 'search') {
        // 검색은 navigateTo에서 처리됨
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

  // 자동 저장 (데이터가 변경될 때마다 서버로 전송)
  async autoSave() {
    try {
        const response = await fetch('/api/drugs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drugs: window.DB.drugs })
        });
        const result = await response.json();
        if (result.success) {
            console.log('✅ 자동 저장 완료');
        } else {
            console.error('❌ 저장 실패:', result.error);
        }
    } catch (err) {
        console.error('AutoSave Error:', err);
    }
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drugs: updatedDrugs })
        });
        
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
          this.autoSave();
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
            body: formData
        });
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

  // 드롭 처리 (개별 약품 이동)
  handleDrop(e, targetMinor, targetSub) {
      e.preventDefault();
      let data;
      try {
          data = JSON.parse(e.dataTransfer.getData('text/plain'));
      } catch (err) {
          return; // 올바르지 않은 데이터
      }
      const sourceDrugId = data.drugId;
      const itemIdx = parseInt(data.itemIdx);
      
      const sourceEntry = window.DB.drugs.find(d => d.id === sourceDrugId);
      // 타겟 카테고리를 가진 기존 엔트리 찾기
      let targetEntry = window.DB.drugs.find(d => d.major === sourceEntry.major && d.minor === targetMinor && d.sub === targetSub);

      if (sourceEntry) {
          if (targetEntry && sourceEntry.id === targetEntry.id) return; // 같은 위치

          const item = sourceEntry.items.splice(itemIdx, 1)[0];
          
          if (targetEntry) {
              targetEntry.items.push(item);
          } else {
              // 타겟 엔트리가 없는 경우 (이론상 발생하지 않으나 방어적 코드)
              const newId = 'drug_new_' + Date.now();
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
          
          renderer.renderDrugCategory(sourceEntry.major);
          this.showSaveBar();
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

  // 소분류 특정 위치에 추가
  addSubCategoryAt(major, minor, atIndex) {
      const name = prompt('새 소분류 이름을 입력하세요:');
      if (!name) return;
      
      const newId = 'drug_new_' + Date.now();
      const newEntry = {
          id: newId,
          major: major,
          minor: minor,
          sub: name,
          items: []
      };
      
      window.DB.drugs.splice(atIndex, 0, newEntry);
      
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
}

// 전역 앱 객체 등록 (onclick 핸들러 등에서 참조)
window.app = new App();
