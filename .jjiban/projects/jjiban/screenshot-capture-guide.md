# 스크린샷 캡쳐 가이드

매뉴얼에 첨부할 스크린샷 목록입니다. 체크리스트로 활용하세요.

**저장 위치**: `.jjiban/projects/jjiban/manual-images/`
**파일 형식**: PNG (권장 너비: 800-1200px)

---

## 1. WBS 트리 & Task 상세 (user-manual-wbs-detail.md)

### 시나리오 1: 프로젝트 현황 파악하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `wbs-01-tree-loaded.png` | WBS 트리가 로드된 초기 화면 |
| 2 | `wbs-01-stats-cards.png` | 상단 통계 카드 (WP, ACT, TSK, %) 클로즈업 |
| 3 | `wbs-01-node-expand.png` | 노드 펼침/접힘 버튼 클릭 전후 |
| 4 | `wbs-01-expand-all.png` | 전체 펼치기 버튼 클릭 후 |

### 시나리오 2: 특정 Task 빠르게 찾기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `wbs-02-search-box.png` | 검색 박스 포커스 상태 |
| 2 | `wbs-02-search-input.png` | 검색어 입력 중 (예: "TSK-04") |
| 3 | `wbs-02-search-result.png` | 검색 결과 하이라이트 |
| 4 | `wbs-02-task-selected.png` | Task 선택 후 Detail 패널 표시 |

### 시나리오 3: Task 상세 정보 확인하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `wbs-03-task-click.png` | 트리에서 Task 노드 클릭 |
| 2 | `wbs-03-loading.png` | 로딩 상태 (가능하면) |
| 3 | `wbs-03-basic-info.png` | 기본 정보 섹션 |
| 4 | `wbs-03-workflow.png` | 진행 상태/워크플로우 시각화 |

### 시나리오 4: Task 정보 수정하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `wbs-04-title-hover.png` | 제목 필드 호버 시 편집 아이콘 |
| 2 | `wbs-04-title-edit.png` | 제목 입력 필드 활성화 |
| 3 | `wbs-04-dropdown-open.png` | 카테고리/우선순위 드롭다운 열림 |
| 4 | `wbs-04-saved.png` | 저장 완료 상태 |

### 시나리오 5: 카테고리별 워크플로우 이해하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `wbs-05-workflow-dev.png` | development 워크플로우 (6단계) |
| - | `wbs-05-workflow-defect.png` | defect 워크플로우 (5단계) |
| - | `wbs-05-workflow-infra.png` | infrastructure 워크플로우 (4단계) |

---

## 2. Tree Node 상호작용 (user-manual-tree-node.md)

### 시나리오 1: 노드 상태 이해하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `node-01-status-todo.png` | Todo [ ] 상태 노드 |
| - | `node-01-status-design.png` | Design [bd] 상태 노드 |
| - | `node-01-status-impl.png` | Implement [im] 상태 노드 |
| - | `node-01-status-done.png` | Done [xx] 상태 노드 |
| - | `node-01-category-tags.png` | 카테고리별 태그 색상 비교 |
| - | `node-01-progress-bar.png` | 다양한 진행률 바 예시 |

### 시나리오 2: 키보드로 트리 탐색하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `node-02-focus.png` | 트리 패널 포커스 상태 |
| 2 | `node-02-arrow-nav.png` | Arrow 키로 이동 중 (포커스 표시) |
| 3 | `node-02-enter-select.png` | Enter로 선택된 노드 |

### 시나리오 3: 노드 펼침/접힘 조작하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `node-03-collapsed.png` | 접힌 노드 (> 버튼) |
| 2 | `node-03-expanded.png` | 펼친 노드 (v 버튼) |
| 3 | `node-03-doubleclick.png` | 더블클릭 토글 |

### 시나리오 4: 펼침 상태 유지 확인하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `node-04-before-refresh.png` | 새로고침 전 펼침 상태 |
| - | `node-04-after-refresh.png` | 새로고침 후 상태 유지 |
| - | `node-04-localstorage.png` | DevTools localStorage (선택) |

### 시나리오 5: 노드 선택 및 하이라이트

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `node-05-hover.png` | 호버 상태 |
| - | `node-05-focus.png` | 포커스 상태 |
| - | `node-05-selected.png` | 선택됨 상태 |

---

## 3. Detail 섹션 & 액션 (user-manual-detail-sections.md)

### 시나리오 1: 워크플로우 진행 상태 확인

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 2 | `detail-01-workflow-section.png` | 워크플로우 섹션 전체 |
| - | `detail-01-workflow-progress.png` | 진행률 바와 단계 표시 |

### 시나리오 2: 인수조건 확인하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `detail-02-requirements-collapsed.png` | 요구사항 섹션 접힌 상태 |
| 2 | `detail-02-requirements-expanded.png` | 요구사항 섹션 펼친 상태 |
| - | `detail-02-checklist.png` | 체크박스 목록 클로즈업 |

### 시나리오 3: 관련 문서 확인하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `detail-03-documents-section.png` | 문서 섹션 펼침 |
| 2 | `detail-03-doc-exists.png` | [존재] 상태 문서 |
| 3 | `detail-03-doc-expected.png` | [예정] 상태 문서 |

### 시나리오 4: 변경 이력 확인하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `detail-04-history-section.png` | 히스토리 섹션 펼침 |
| 2 | `detail-04-timeline.png` | 타임라인 표시 |

### 시나리오 5: 상태 전이 액션 실행하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `detail-05-actions-section.png` | 액션 섹션 |
| 2 | `detail-05-transition-btn.png` | 전이 버튼 클릭 전 |
| 3 | `detail-05-confirm-dialog.png` | 확인 다이얼로그 |
| 4 | `detail-05-after-transition.png` | 전이 후 상태 변경 |

### 시나리오 6: 편집 모드 전환하기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `detail-06-edit-btn.png` | 편집 모드 버튼 |
| 2 | `detail-06-edit-mode.png` | 편집 모드 활성화 |
| 3 | `detail-06-save-cancel.png` | 저장/취소 버튼 |

---

## 4. Document Viewer (user-manual-document-viewer.md)

### 시나리오 1: 문서 열기

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 2 | `docview-01-doc-list.png` | 문서 섹션 목록 |
| 3 | `docview-01-doc-click.png` | 문서 클릭 |
| 4 | `docview-01-viewer-open.png` | Document Viewer 열림 |
| - | `docview-01-loading.png` | 로딩 상태 (Skeleton) |

### 시나리오 2: 코드 블록 확인

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `docview-02-code-ts.png` | TypeScript 코드 하이라이팅 |
| - | `docview-02-code-vue.png` | Vue 코드 하이라이팅 |
| - | `docview-02-code-bash.png` | Bash 코드 하이라이팅 |

### 시나리오 3: GFM 요소 확인

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `docview-03-table.png` | 테이블 렌더링 |
| - | `docview-03-checkbox.png` | 체크박스 렌더링 |
| - | `docview-03-strikethrough.png` | 취소선 렌더링 |

### 시나리오 4: 긴 문서 스크롤

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `docview-04-scroll-top.png` | 문서 상단 |
| - | `docview-04-scroll-middle.png` | 문서 중간 (스크롤바 표시) |
| - | `docview-04-scroll-bottom.png` | 문서 하단 |

### 시나리오 5: 문서 로드 실패 처리

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `docview-05-error-404.png` | 파일 없음 에러 |
| - | `docview-05-retry-btn.png` | 재시도 버튼 |

---

## 5. Projects Page (user-manual-projects-page.md)

### 시나리오 1: 프로젝트 목록 확인

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `projects-01-page.png` | Projects Page 전체 화면 |
| 2 | `projects-01-card.png` | 프로젝트 카드 클로즈업 |
| - | `projects-01-card-info.png` | 카드 내 정보 (진행률, Tasks 등) |

### 시나리오 2: 상태별 필터링

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `projects-02-filter-btns.png` | 필터 버튼들 |
| 2 | `projects-02-filter-active.png` | 진행중 필터 선택 |
| 3 | `projects-02-filter-completed.png` | 완료 필터 선택 |

### 시나리오 3: WBS 화면으로 이동

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `projects-03-card-hover.png` | 카드 호버 상태 |
| 2 | `projects-03-loading.png` | 이동 중 로딩 |
| 3 | `projects-03-wbs-page.png` | WBS 화면 도착 |

---

## 6. 레이아웃 & 헤더 (user-manual-layout-header.md)

### 시나리오 1: 헤더 네비게이션 사용

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `layout-01-header-full.png` | 헤더 전체 |
| 2 | `layout-01-nav-menu.png` | 네비게이션 메뉴 클로즈업 |
| - | `layout-01-nav-disabled.png` | 비활성 메뉴 클릭 시 토스트 |

### 시나리오 2: 현재 프로젝트 확인

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `layout-02-project-name.png` | 헤더 우측 프로젝트명 |

### 시나리오 3: 로고로 홈 이동

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| 1 | `layout-03-logo.png` | 로고 클로즈업 |
| 2 | `layout-03-home-page.png` | 홈(Projects Page) 화면 |

### 시나리오 4: 패널 레이아웃 이해

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `layout-04-panels.png` | 좌우 패널 분할 전체 |
| - | `layout-04-left-panel.png` | 좌측 패널 (40%) |
| - | `layout-04-right-panel.png` | 우측 패널 (60%) |

### 시나리오 5: 반응형 화면 대응

| Step | 파일명 | 캡쳐 내용 |
|------|--------|----------|
| - | `layout-05-desktop.png` | 데스크톱 레이아웃 |
| - | `layout-05-tablet.png` | 태블릿 레이아웃 |
| - | `layout-05-mobile.png` | 모바일 레이아웃 |

---

## 캡쳐 팁

### 브라우저 설정
- **창 크기**: 1280x800 (데스크톱 기준)
- **확대율**: 100%
- **DevTools**: 닫은 상태

### 캡쳐 도구
- **Windows**: Win + Shift + S (캡쳐 도구)
- **Mac**: Cmd + Shift + 4
- **Chrome**: DevTools > Ctrl + Shift + P > "Capture screenshot"

### 파일 저장
```
.jjiban/projects/jjiban/manual-images/
├── wbs-01-tree-loaded.png
├── wbs-01-stats-cards.png
├── ...
└── layout-05-mobile.png
```

### 이미지 최적화
- 포맷: PNG (품질 유지) 또는 WebP (용량 절약)
- 너비: 800-1200px 권장
- 압축: TinyPNG 등 사용 가능

---

## 총 스크린샷 수

| 매뉴얼 | 예상 개수 |
|--------|----------|
| WBS 트리 & Task 상세 | ~20개 |
| Tree Node 상호작용 | ~15개 |
| Detail 섹션 & 액션 | ~18개 |
| Document Viewer | ~14개 |
| Projects Page | ~10개 |
| 레이아웃 & 헤더 | ~12개 |
| **합계** | **~89개** |

---

<!--
Created: 2025-12-16
Purpose: Screenshot capture checklist for user manuals
-->
