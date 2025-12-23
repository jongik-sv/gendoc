# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 추적성 매트릭스

## 문서 정보
- Task ID: TSK-09-01
- 작성일: 2025-12-17
- 상태: [dd] Detail Design

---

## 1. 요구사항 추적성 매트릭스

### 1.1 기능 요구사항 (Functional Requirements)

| REQ-ID | 요구사항 | 설계 컴포넌트 | 테스트 ID | 상태 |
|--------|---------|-------------|----------|------|
| FR-09-01 | `/wbs` URL 접속 시 모든 프로젝트를 한 트리에 표시 | wbs.vue (조건부 로딩), wbsStore.fetchAllWbs() | TC-UI-01, TC-INT-01 | 설계 완료 |
| FR-09-02 | 프로젝트 노드 타입 UI (아이콘, 스타일) | NodeIcon.vue, main.css (.node-icon-project) | TC-UI-02 | 설계 완료 |
| FR-09-03 | 프로젝트 노드 클릭 시 상세 패널 표시 | ProjectDetailPanel.vue, selectionStore.selectNode() | TC-UI-03, TC-INT-02 | 설계 완료 |
| FR-09-04 | 프로젝트 상세 패널에 파일 목록 표시 | ProjectDetailPanel.vue, ProjectFilesResponse | TC-UI-04, TC-API-02 | 설계 완료 |
| FR-09-05 | 파일 클릭 시 타입별 뷰어 표시 | FileViewer.vue (마크다운/이미지/코드) | TC-UI-05, TC-UI-06, TC-UI-07 | 설계 완료 |
| FR-09-06 | `?project=xxx` 파라미터 시 기존 단일 프로젝트 뷰 유지 | wbs.vue (URL 파라미터 분기) | TC-INT-03 | 설계 완료 |
| FR-09-07 | GET /api/wbs/all 엔드포인트 | server/api/wbs/all.get.ts, getAllProjectsWbs() | TC-API-01 | 설계 완료 |
| FR-09-08 | GET /api/projects/:id/files 엔드포인트 | server/api/projects/[id]/files.get.ts, getProjectFiles() | TC-API-02 | 설계 완료 |

---

### 1.2 비기능 요구사항 (Non-Functional Requirements)

| REQ-ID | 요구사항 | 설계 요소 | 테스트 ID | 상태 |
|--------|---------|----------|----------|------|
| NFR-09-01 | 성능: 다중 프로젝트 로드 시 병렬 처리 | Promise.all() 병렬 로드 | TC-PERF-01 | 설계 완료 |
| NFR-09-02 | 에러 복구: 개별 프로젝트 실패 시 전체 실패 방지 | try-catch + null 반환 | TC-ERR-01 | 설계 완료 |
| NFR-09-03 | 접근성: 키보드 네비게이션 지원 | Tree (↑↓ Enter), Listbox (Tab Enter) | TC-A11Y-01 | 설계 완료 |
| NFR-09-04 | 접근성: ARIA 레이블 명시 | role="treeitem", aria-label | TC-A11Y-02 | 설계 완료 |
| NFR-09-05 | 보안: 파일 경로 검증 (프로젝트 폴더 외부 접근 방지) | validateFilePath() | TC-SEC-01 | 설계 완료 |
| NFR-09-06 | 보안: 마크다운 XSS 방지 | sanitizeHtml() | TC-SEC-02 | 설계 완료 |
| NFR-09-07 | 호환성: 기존 API 유지 | GET /api/projects/:id/wbs 유지 | TC-COMPAT-01 | 설계 완료 |

---

## 2. 설계-구현 매핑

### 2.1 Backend API

| 설계 ID | 설계 요소 | 구현 파일 | 메서드/함수 | 상태 |
|---------|----------|----------|------------|------|
| API-01 | 모든 프로젝트 WBS 조회 | server/api/wbs/all.get.ts | defineEventHandler | 미구현 |
| API-02 | 프로젝트 파일 목록 조회 | server/api/projects/[id]/files.get.ts | defineEventHandler | 미구현 |
| SVC-01 | 모든 프로젝트 WBS 조회 서비스 | server/utils/wbs/wbsService.ts | getAllProjectsWbs() | 미구현 |
| SVC-02 | 프로젝트 노드 생성 | server/utils/wbs/wbsService.ts | createProjectNode() | 미구현 |
| SVC-03 | 진행률 계산 | server/utils/wbs/wbsService.ts | calculateProjectProgress() | 미구현 |
| SVC-04 | Task 개수 계산 | server/utils/wbs/wbsService.ts | countAllTasks() | 미구현 |
| SVC-05 | 프로젝트 파일 목록 서비스 | server/utils/projects/projectFilesService.ts | getProjectFiles() | 미구현 |
| SVC-06 | 파일 타입 결정 | server/utils/projects/projectFilesService.ts | getFileType() | 미구현 |

---

### 2.2 Types & Interfaces

| 설계 ID | 타입/인터페이스 | 파일 | 상태 |
|---------|---------------|------|------|
| TYPE-01 | AllWbsResponse | types/index.ts | 미구현 |
| TYPE-02 | ProjectWbsNode | types/index.ts | 미구현 |
| TYPE-03 | ProjectFile | types/index.ts | 미구현 |
| TYPE-04 | ProjectFilesResponse | types/index.ts | 미구현 |

---

### 2.3 Frontend Store

| 설계 ID | 설계 요소 | 파일 | 메서드/상태 | 상태 |
|---------|----------|------|------------|------|
| STORE-01 | 다중 프로젝트 모드 플래그 | app/stores/wbs.ts | isMultiProjectMode | 미구현 |
| STORE-02 | 모든 프로젝트 WBS 조회 | app/stores/wbs.ts | fetchAllWbs() | 미구현 |
| STORE-03 | 프로젝트 파일 목록 상태 | app/stores/selection.ts | selectedProjectFiles | 미구현 |
| STORE-04 | 파일 로딩 상태 | app/stores/selection.ts | loadingFiles | 미구현 |
| STORE-05 | 프로젝트 파일 조회 | app/stores/selection.ts | fetchProjectFiles() | 미구현 |
| STORE-06 | 노드 선택 확장 (프로젝트 처리) | app/stores/selection.ts | selectNode() 수정 | 미구현 |

---

### 2.4 Frontend Components

| 설계 ID | 컴포넌트 | 파일 | Props/Emits | 상태 |
|---------|---------|------|------------|------|
| COMP-01 | 프로젝트 아이콘 | app/components/wbs/NodeIcon.vue | type: 'project' 지원 | 미구현 |
| COMP-02 | 프로젝트 상세 패널 | app/components/wbs/detail/ProjectDetailPanel.vue | Props: projectId, files / Emits: file-select | 미구현 |
| COMP-03 | 파일 뷰어 | app/components/wbs/detail/FileViewer.vue | Props: file, visible / Emits: update:visible | 미구현 |
| COMP-04 | WBS 페이지 조건부 로딩 | app/pages/wbs.vue | 다중/단일 모드 분기 | 미구현 |

---

### 2.5 CSS Styles

| 설계 ID | 스타일 클래스 | 파일 | 용도 | 상태 |
|---------|-------------|------|------|------|
| CSS-01 | .node-icon-project | app/assets/css/main.css | 프로젝트 아이콘 색상 (violet) | 미구현 |
| CSS-02 | .wbs-tree-node-title-project | app/assets/css/main.css | 프로젝트 타이틀 스타일 | 미구현 |
| CSS-03 | .project-file-list | app/assets/css/main.css | 파일 목록 컨테이너 | 미구현 |
| CSS-04 | .project-file-item | app/assets/css/main.css | 파일 아이템 스타일 | 미구현 |
| CSS-05 | .file-icon-md | app/assets/css/main.css | 마크다운 아이콘 색상 | 미구현 |
| CSS-06 | .file-icon-json | app/assets/css/main.css | JSON 아이콘 색상 | 미구현 |
| CSS-07 | .file-icon-image | app/assets/css/main.css | 이미지 아이콘 색상 | 미구현 |
| CSS-08 | .file-icon-other | app/assets/css/main.css | 기타 파일 아이콘 색상 | 미구현 |

---

## 3. 테스트 추적성

### 3.1 API 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 설계 요소 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-API-01 | GET /api/wbs/all 정상 응답 | FR-09-07 | API-01, SVC-01 | High |
| TC-API-01-1 | 프로젝트 목록 빈 배열 응답 | FR-09-07 | SVC-01 | Medium |
| TC-API-01-2 | 개별 프로젝트 로드 실패 시 제외 | NFR-09-02 | SVC-01 (try-catch) | High |
| TC-API-01-3 | 프로젝트 진행률 정확성 검증 | FR-09-07 | SVC-03 | High |
| TC-API-01-4 | Task 개수 계산 정확성 검증 | FR-09-07 | SVC-04 | High |
| TC-API-02 | GET /api/projects/:id/files 정상 응답 | FR-09-08 | API-02, SVC-05 | High |
| TC-API-02-1 | 존재하지 않는 프로젝트 404 에러 | FR-09-08 | SVC-05 (validation) | High |
| TC-API-02-2 | 파일 타입 분류 정확성 (md, json, image, other) | FR-09-08 | SVC-06 | Medium |
| TC-API-02-3 | tasks 폴더 제외 검증 | FR-09-08 | SVC-05 (filter) | Medium |
| TC-API-02-4 | 한글 프로젝트 ID 처리 | FR-09-08 | API-02 (URL 인코딩) | High |

---

### 3.2 UI 컴포넌트 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 설계 요소 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-UI-01 | /wbs 접속 시 다중 프로젝트 트리 표시 | FR-09-01 | COMP-04, STORE-02 | High |
| TC-UI-02 | 프로젝트 노드 아이콘 및 색상 표시 | FR-09-02 | COMP-01, CSS-01 | Medium |
| TC-UI-03 | 프로젝트 노드 클릭 시 상세 패널 표시 | FR-09-03 | COMP-02, STORE-06 | High |
| TC-UI-04 | 프로젝트 상세 패널에 파일 목록 표시 | FR-09-04 | COMP-02, STORE-05 | High |
| TC-UI-05 | 마크다운 파일 클릭 시 렌더링된 뷰어 표시 | FR-09-05 | COMP-03 (markdown) | High |
| TC-UI-06 | 이미지 파일 클릭 시 이미지 뷰어 표시 | FR-09-05 | COMP-03 (image) | High |
| TC-UI-07 | JSON 파일 클릭 시 Monaco Editor 표시 | FR-09-05 | COMP-03 (code) | Medium |
| TC-UI-08 | 프로젝트 기본 펼침 상태 | FR-09-01 | STORE-02 (expandedNodes) | Medium |
| TC-UI-09 | 파일 목록 빈 상태 메시지 | FR-09-04 | COMP-02 (v-else) | Low |
| TC-UI-10 | FileViewer 다이얼로그 닫기 (Esc) | FR-09-05 | COMP-03 (@update:visible) | Medium |

---

### 3.3 통합 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 설계 요소 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-INT-01 | /wbs → API 호출 → 트리 렌더링 플로우 | FR-09-01 | COMP-04 → STORE-02 → API-01 | High |
| TC-INT-02 | 프로젝트 클릭 → 파일 로드 → 패널 표시 플로우 | FR-09-03, FR-09-04 | STORE-06 → API-02 → COMP-02 | High |
| TC-INT-03 | ?project=xxx 파라미터 시 단일 모드 동작 | FR-09-06 | COMP-04 (조건 분기) | High |
| TC-INT-04 | 파일 클릭 → 내용 로드 → 뷰어 표시 플로우 | FR-09-05 | COMP-02 → COMP-03 → API (file content) | High |
| TC-INT-05 | 프로젝트 전환 시 파일 목록 갱신 | FR-09-04 | STORE-06 → STORE-05 | Medium |
| TC-INT-06 | URL 변경 시 모드 전환 (다중 ↔ 단일) | FR-09-06 | COMP-04 (watch route) | Medium |

---

### 3.4 성능 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 측정 기준 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-PERF-01 | 다중 프로젝트 병렬 로드 성능 | NFR-09-01 | 5개 프로젝트 < 2초 | High |
| TC-PERF-02 | 파일 목록 로드 성능 | NFR-09-01 | 100개 파일 < 500ms | Medium |
| TC-PERF-03 | 파일 내용 로드 성능 | NFR-09-01 | 1MB 파일 < 1초 | Medium |
| TC-PERF-04 | 트리 렌더링 성능 (100개 노드) | NFR-09-01 | 렌더링 < 200ms | Low |

---

### 3.5 에러 처리 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 예상 동작 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-ERR-01 | 개별 프로젝트 WBS 로드 실패 | NFR-09-02 | 해당 프로젝트 제외, 나머지 표시 | High |
| TC-ERR-02 | 전체 프로젝트 목록 조회 실패 | NFR-09-02 | 에러 메시지 + 재시도 버튼 | High |
| TC-ERR-03 | 프로젝트 파일 목록 로드 실패 | NFR-09-02 | 빈 파일 목록 표시 | Medium |
| TC-ERR-04 | 파일 내용 로드 실패 | NFR-09-02 | FileViewer 에러 메시지 표시 | Medium |
| TC-ERR-05 | 존재하지 않는 프로젝트 ID | NFR-09-02 | 404 에러 + 사용자 알림 | High |
| TC-ERR-06 | 네트워크 타임아웃 | NFR-09-02 | 재시도 버튼 표시 | Low |

---

### 3.6 접근성 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 검증 방법 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-A11Y-01 | 키보드 네비게이션 (트리) | NFR-09-03 | ↑↓ 키로 이동, Enter로 선택 | High |
| TC-A11Y-02 | ARIA 레이블 명시 | NFR-09-04 | 스크린 리더 테스트 | High |
| TC-A11Y-03 | 색상 대비 검증 | NFR-09-04 | WCAG AA 준수 확인 | Medium |
| TC-A11Y-04 | 포커스 인디케이터 | NFR-09-03 | Tab 키로 포커스 확인 | Medium |
| TC-A11Y-05 | Dialog Esc 키 닫기 | NFR-09-03 | FileViewer Esc 키 동작 | Medium |

---

### 3.7 보안 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 검증 방법 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-SEC-01 | 파일 경로 검증 (디렉토리 탐색 방지) | NFR-09-05 | ../ 경로 시도 → 403 에러 | High |
| TC-SEC-02 | 마크다운 XSS 방지 | NFR-09-06 | `<script>` 태그 삽입 테스트 | High |
| TC-SEC-03 | 프로젝트 ID 검증 | NFR-09-05 | 특수 문자 시도 → 400 에러 | Medium |

---

### 3.8 호환성 테스트

| 테스트 ID | 테스트 케이스 | 요구사항 | 검증 방법 | 우선순위 |
|----------|-------------|---------|----------|---------|
| TC-COMPAT-01 | 기존 단일 프로젝트 API 유지 | NFR-09-07 | GET /api/projects/:id/wbs 정상 동작 | High |
| TC-COMPAT-02 | ?project=xxx 파라미터 호환성 | FR-09-06 | 기존 Task API 연동 확인 | High |
| TC-COMPAT-03 | wbsStore.fetchWbs() 기존 동작 | NFR-09-07 | 단일 프로젝트 모드 정상 동작 | High |

---

## 4. 요구사항-설계-테스트 종합표

| 요구사항 ID | 요구사항 | 설계 컴포넌트 | 테스트 ID | 커버리지 |
|-----------|---------|-------------|----------|---------|
| FR-09-01 | 다중 프로젝트 통합 뷰 | API-01, STORE-02, COMP-04 | TC-API-01, TC-UI-01, TC-INT-01 | 100% |
| FR-09-02 | 프로젝트 노드 UI | COMP-01, CSS-01, CSS-02 | TC-UI-02 | 100% |
| FR-09-03 | 프로젝트 상세 패널 | COMP-02, STORE-06 | TC-UI-03, TC-INT-02 | 100% |
| FR-09-04 | 파일 목록 표시 | API-02, STORE-05, COMP-02 | TC-API-02, TC-UI-04, TC-INT-02 | 100% |
| FR-09-05 | 파일 뷰어 | COMP-03 | TC-UI-05, TC-UI-06, TC-UI-07, TC-INT-04 | 100% |
| FR-09-06 | URL 파라미터 호환성 | COMP-04 (조건 분기) | TC-INT-03, TC-COMPAT-02 | 100% |
| FR-09-07 | GET /api/wbs/all | API-01, SVC-01~04 | TC-API-01~01-4 | 100% |
| FR-09-08 | GET /api/projects/:id/files | API-02, SVC-05~06 | TC-API-02~02-4 | 100% |
| NFR-09-01 | 병렬 처리 성능 | SVC-01 (Promise.all) | TC-PERF-01, TC-PERF-02 | 100% |
| NFR-09-02 | 에러 복구 | SVC-01 (try-catch) | TC-ERR-01~06 | 100% |
| NFR-09-03 | 키보드 네비게이션 | COMP-01, COMP-02, COMP-03 | TC-A11Y-01, TC-A11Y-04, TC-A11Y-05 | 100% |
| NFR-09-04 | ARIA 레이블 | COMP-01, COMP-02 | TC-A11Y-02, TC-A11Y-03 | 100% |
| NFR-09-05 | 파일 경로 검증 | SVC-05 (validateFilePath) | TC-SEC-01, TC-SEC-03 | 100% |
| NFR-09-06 | XSS 방지 | COMP-03 (sanitizeHtml) | TC-SEC-02 | 100% |
| NFR-09-07 | 하위 호환성 | STORE-02, COMP-04 | TC-COMPAT-01~03 | 100% |

---

## 5. 미해결 이슈 및 리스크

### 5.1 미해결 이슈

| 이슈 ID | 이슈 | 영향 범위 | 해결 방안 | 우선순위 |
|--------|------|----------|----------|---------|
| ISSUE-01 | 파일 내용 조회 API 미정의 | TC-INT-04 | GET /api/files/content?path=... 추가 필요 | High |
| ISSUE-02 | 마크다운 sanitize 함수 선택 | TC-SEC-02 | DOMPurify 또는 sanitize-html 선택 | Medium |
| ISSUE-03 | 대용량 파일 뷰어 성능 | TC-PERF-03 | 파일 크기 제한 (예: 5MB) 또는 스트리밍 | Low |

---

### 5.2 리스크 관리

| 리스크 ID | 리스크 | 발생 확률 | 영향도 | 완화 방안 | 담당자 |
|----------|-------|----------|--------|----------|--------|
| RISK-01 | 프로젝트 수 증가 시 로딩 시간 증가 | Medium | High | 페이징 또는 lazy loading 도입 | Backend Dev |
| RISK-02 | 대용량 파일 메모리 부족 | Low | High | 파일 크기 제한 + 에러 처리 | Backend Dev |
| RISK-03 | 한글 파일명 인코딩 이슈 | Medium | Medium | UTF-8 인코딩 검증 | Backend Dev |
| RISK-04 | 브라우저 호환성 (Monaco Editor) | Low | Medium | 폴백 (textarea) 제공 | Frontend Dev |

---

## 6. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-17 | 1.0 | 초안 작성 | System Architect |

---

## 부록

### A. 커버리지 통계

| 항목 | 개수 | 비고 |
|------|------|------|
| 기능 요구사항 (FR) | 8 | 100% 커버 |
| 비기능 요구사항 (NFR) | 7 | 100% 커버 |
| 설계 컴포넌트 | 36 | API(2), Service(6), Type(4), Store(6), Component(4), CSS(8), 기타(6) |
| 테스트 케이스 | 47 | API(10), UI(10), 통합(6), 성능(4), 에러(6), 접근성(5), 보안(3), 호환성(3) |

### B. 우선순위 분포

| 우선순위 | 테스트 케이스 수 | 비율 |
|---------|----------------|------|
| High | 28 | 59.6% |
| Medium | 17 | 36.2% |
| Low | 2 | 4.2% |

### C. 참조 문서
- 010-basic-design.md: 기본 설계
- 011-ui-design.md: 화면 설계
- 020-detail-design.md: 상세 설계
- PRD 섹션 6.5: 다중 프로젝트 통합 뷰
