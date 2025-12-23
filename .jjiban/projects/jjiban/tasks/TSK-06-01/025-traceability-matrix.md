# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 2.0.0 — **Last Updated:** 2025-12-15

> **문서 목적**
> PRD 요구사항 → 기본설계 요구사항 → 상세설계 요소 → 테스트 케이스 간의 추적성을 보장합니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-01 |
| Task명 | Integration |
| Category | development |
| 작성일 | 2025-12-15 |
| 작성자 | System Architect |

--- 

## 1. 추적성 매트릭스 (Traceability Matrix)

### 1.1 요구사항 → 설계 → 테스트 매핑

| PRD 요구사항 | 기본설계 FR | 상세설계 요소 | 구현 위치(개념) | 테스트 케이스 | 비고 |
|-------------|------------|--------------|----------------|--------------|------|
| 섹션 6.2: WBS 트리 뷰 | FR-001 | URL 쿼리 파싱, onMounted 라이프사이클 | pages/wbs.vue | TC-001, TC-002 | 프로젝트 ID 추출 및 로딩 |
| 섹션 6.2: WBS 트리 뷰 | FR-002 | watch(currentProject) → fetchWbs | pages/wbs.vue | TC-003 | 프로젝트 로드 후 WBS 자동 조회 |
| 섹션 6.3: Task 상세 패널 | FR-003 | watch(selectedNodeId) → loadTaskDetail | pages/wbs.vue, selectionStore | TC-004, TC-005 | 노드 선택 시 상세 패널 업데이트 |
| 섹션 11: 사용자 피드백 | FR-004 | ProgressSpinner, loading ref | pages/wbs.vue | TC-006, TC-007 | 로딩 중 스피너 표시 |
| 섹션 11: 에러 핸들링 | FR-005 | useToast, try-catch, Message 컴포넌트 | pages/wbs.vue | TC-008, TC-009, TC-010 | 에러 발생 시 Toast 표시 |
| 섹션 11: Empty State | FR-006 | v-if="!projectId", Empty State 템플릿 | pages/wbs.vue | TC-011 | 프로젝트 없음 상태 처리 |
| 섹션 11: Empty State | FR-007 | v-if="tree.length === 0", Empty State 템플릿 | pages/wbs.vue, WbsTreePanel | TC-012 | WBS 데이터 없음 상태 처리 |
| 섹션 11: Empty State | FR-008 | v-if="!selectedTask", Empty State 템플릿 | TaskDetailPanel | TC-013 | Task 미선택 상태 처리 |
| 섹션 9.3: 상태 관리 | FR-009 | onUnmounted, clearWbs, clearSelection | pages/wbs.vue | TC-014 | 페이지 언마운트 시 상태 초기화 |
| 섹션 9.3: 반응형 연동 | FR-010 | storeToRefs, watch 패턴 | pages/wbs.vue | TC-015 | 스토어 간 반응형 상태 연동 |

### 1.2 비기능 요구사항 → 설계 → 테스트 매핑

| PRD 비기능 요구사항 | 기본설계 NFR | 상세설계 요소 | 구현 위치(개념) | 테스트 케이스 | 목표 기준 |
|--------------------|-------------|--------------|----------------|--------------|----------|
| 성능: 페이지 로딩 속도 | NFR-001 | 순차 로딩 최적화, API 병렬 호출 (향후) | pages/wbs.vue | TC-016 | < 1초 |
| 성능: 노드 선택 반응성 | NFR-002 | computed, watch 최적화 | pages/wbs.vue, selectionStore | TC-017 | < 200ms |
| 안정성: 에러 복구 | NFR-003 | 재시도 버튼, 롤백 메커니즘 | pages/wbs.vue | TC-018 | 100% |
| UX: Toast 자동 사라짐 | NFR-004 | useToast({ life: 3000 }) | pages/wbs.vue | TC-019 | 3초 |
| 반응형: 최소 너비 | NFR-005 | TailwindCSS min-width 클래스 | pages/wbs.vue 템플릿 | TC-020 | 1200px |

---

## 2. 기능 요구사항 상세 추적

### FR-001: URL 쿼리에서 projectId 읽어 프로젝트 로딩

**PRD 참조**: 섹션 9.1 (프로젝트 선택)

**기본설계 명세**:
- URL 쿼리 파라미터 `?projectId=xxx`에서 프로젝트 ID 추출
- onMounted 라이프사이클에서 projectStore.loadProject(projectId) 호출

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `const projectId = computed(() => route.query.projectId as string)`
  - `onMounted` 훅에서 projectId 검증 및 loadProject 호출
- **에러 처리**: projectId 없으면 Empty State 표시

**구현 체크리스트**:
- [ ] useRoute()로 route 객체 접근
- [ ] computed로 projectId 추출
- [ ] onMounted에서 loadProject 호출
- [ ] projectId 없을 때 Empty State 렌더링

**테스트 케이스**: TC-001, TC-002

---

### FR-002: 프로젝트 로드 후 WBS 데이터 자동 조회

**PRD 참조**: 섹션 9.1, 9.3 (데이터 로딩)

**기본설계 명세**:
- 프로젝트 로드 성공 시 WBS 데이터 조회 트리거
- 순차 로딩 패턴: 프로젝트 → WBS

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `watch(currentProject, (newProject) => { if (newProject) fetchWbs(projectId) })`
- **에러 처리**: 프로젝트 로드 실패 시 WBS 로딩 skip

**구현 체크리스트**:
- [ ] watch로 currentProject 변화 감지
- [ ] 프로젝트 로드 성공 시 fetchWbs 호출
- [ ] 프로젝트 로드 실패 시 WBS 로딩 중단

**테스트 케이스**: TC-003

---

### FR-003: WBS 트리 노드 선택 시 상세 패널 자동 업데이트

**PRD 참조**: 섹션 9.3 (Task 상세 패널)

**기본설계 명세**:
- WbsTreePanel에서 노드 선택 이벤트 발생
- selectionStore.selectNode(nodeId) 호출
- Task 타입이면 loadTaskDetail 자동 실행

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue, selectionStore
- **구현 방식**:
  - WbsTreePanel `@node-selected` 이벤트 수신
  - selectionStore의 selectNode 메서드가 Task 타입 검증 후 loadTaskDetail 호출
- **에러 처리**: Task 로드 실패 시 Toast 에러 메시지

**구현 체크리스트**:
- [ ] WbsTreePanel 이벤트 리스너 추가
- [ ] selectionStore.selectNode 호출
- [ ] Task 타입 검증 로직
- [ ] loadTaskDetail 자동 실행

**테스트 케이스**: TC-004, TC-005

---

### FR-004: 로딩 중 스피너 표시

**PRD 참조**: 섹션 11 (사용자 피드백)

**기본설계 명세**:
- 프로젝트, WBS, Task 로딩 시 각각 스피너 표시
- ProgressSpinner 컴포넌트 사용

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `loading` ref 상태 관리
  - `v-if="loading"` → ProgressSpinner 렌더링
  - `v-else` → 정상 콘텐츠 렌더링

**구현 체크리스트**:
- [ ] loading ref 선언
- [ ] API 호출 전 loading = true
- [ ] API 호출 후 loading = false
- [ ] ProgressSpinner 컴포넌트 통합

**테스트 케이스**: TC-006, TC-007

---

### FR-005: 에러 발생 시 Toast 메시지 표시

**PRD 참조**: 섹션 11 (에러 핸들링)

**기본설계 명세**:
- API 실패 시 Toast로 에러 메시지 표시
- PrimeVue Toast 컴포넌트 활용

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `try-catch` 블록으로 에러 캐치
  - `useToast().add({ severity: "error", summary: "에러", detail: message })`

**구현 체크리스트**:
- [ ] useToast composable 통합
- [ ] try-catch 블록 구현
- [ ] 에러 메시지 한글 변환
- [ ] Toast 표시 (severity: error)

**테스트 케이스**: TC-008, TC-009, TC-010

---

### FR-006: 프로젝트 없음 상태 처리 (Empty State)

**PRD 참조**: 섹션 11 (Empty State)

**기본설계 명세**:
- URL 쿼리에 projectId 없을 때 Empty State 표시
- 대시보드로 이동 버튼 제공

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `v-if="!projectId"` → Empty State 템플릿
  - 아이콘 + 메시지 + 버튼

**구현 체크리스트**:
- [ ] projectId 검증 로직
- [ ] Empty State 템플릿 작성
- [ ] 대시보드 이동 버튼

**테스트 케이스**: TC-011

---

### FR-007: WBS 데이터 없음 상태 처리 (Empty State)

**PRD 참조**: 섹션 11 (Empty State)

**기본설계 명세**:
- WBS 트리 빈 배열일 때 Empty State 표시
- WBS 생성 안내 메시지 (향후 WBS 생성 버튼)

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue, WbsTreePanel
- **구현 방식**:
  - `v-if="tree.length === 0"` → Empty State 템플릿

**구현 체크리스트**:
- [ ] tree 배열 검증 로직
- [ ] Empty State 템플릿 작성
- [ ] WBS 생성 안내 메시지

**테스트 케이스**: TC-012

---

### FR-008: Task 미선택 상태 처리 (Empty State)

**PRD 참조**: 섹션 11 (Empty State)

**기본설계 명세**:
- 노드 미선택 또는 Task 아닌 노드 선택 시 Empty State 표시
- "Task를 선택하세요" 메시지

**상세설계 명세**:
- **컴포넌트**: TaskDetailPanel
- **구현 방식**:
  - `v-if="!selectedTask"` → Empty State 템플릿

**구현 체크리스트**:
- [ ] selectedTask 검증 로직
- [ ] Empty State 템플릿 작성
- [ ] "Task를 선택하세요" 메시지

**테스트 케이스**: TC-013

---

### FR-009: 페이지 언마운트 시 상태 초기화

**PRD 참조**: 섹션 9.3 (상태 관리)

**기본설계 명세**:
- 페이지 언마운트 시 스토어 상태 초기화
- 메모리 누수 방지

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `onUnmounted(() => { wbsStore.clearWbs(); selectionStore.clearSelection(); })`

**구현 체크리스트**:
- [ ] onUnmounted 훅 구현
- [ ] clearWbs() 호출
- [ ] clearSelection() 호출

**테스트 케이스**: TC-014

---

### FR-010: 스토어 간 반응형 상태 연동 (watch)

**PRD 참조**: 섹션 9.3 (반응형 연동)

**기본설계 명세**:
- watch를 통한 스토어 간 자동 동기화
- currentProject 변화 → fetchWbs 트리거

**상세설계 명세**:
- **컴포넌트**: pages/wbs.vue
- **구현 방식**:
  - `watch(currentProject, ...)`
  - `watch(selectedNodeId, ...)`

**구현 체크리스트**:
- [ ] watch로 currentProject 감지
- [ ] watch로 selectedNodeId 감지
- [ ] 반응형 업데이트 검증

**테스트 케이스**: TC-015

---

## 3. 비즈니스 규칙 추적

| 규칙 ID | 규칙 설명 | 구현 위치(개념) | 검증 테스트 | 비고 |
|---------|----------|----------------|------------|------|
| BR-001 | 프로젝트 → WBS 순서로 로딩 | pages/wbs.vue | TC-003 | 순차 로딩 패턴 |
| BR-002 | 프로젝트 로드 실패 시 WBS 로드 중단 | pages/wbs.vue | TC-009 | 에러 전파 방지 |
| BR-003 | WBS 로드 실패 시 Empty State 표시 | pages/wbs.vue | TC-012 | 사용자 피드백 |
| BR-004 | 에러 발생 시 Toast 표시 | pages/wbs.vue | TC-008 | 에러 알림 |
| BR-005 | 네트워크/서버 오류 시 재시도 버튼 제공 | pages/wbs.vue | TC-018 | 복구 옵션 |
| BR-006 | 에러 메시지 사용자 친화적 변환 | useWbsPage.ts (선택적) | TC-010 | 한글 메시지 |
| BR-007 | 스토어 간 반응형 연동 | pages/wbs.vue | TC-015 | watch 패턴 |
| BR-008 | 페이지 언마운트 시 상태 초기화 | pages/wbs.vue | TC-014 | 메모리 누수 방지 |

---

## 4. 컴포넌트 → 테스트 매핑

| 컴포넌트/모듈 | 책임 | 관련 요구사항 | 테스트 케이스 |
|--------------|------|--------------|--------------|
| pages/wbs.vue | 페이지 컨트롤러 | FR-001~FR-010 | TC-001~TC-015 |
| useWbsPage.ts (선택적) | 페이지 로직 추출 | FR-004, FR-005 | TC-006~TC-010 |
| WbsTreePanel | 좌측 패널 | FR-003, FR-007 | TC-004, TC-012 |
| TaskDetailPanel | 우측 패널 | FR-003, FR-008 | TC-005, TC-013 |
| useProjectStore | 프로젝트 상태 | FR-001, FR-002 | TC-001, TC-003 |
| useWbsStore | WBS 상태 | FR-002, FR-007 | TC-003, TC-012 |
| useSelectionStore | 선택 상태 | FR-003 | TC-004, TC-005 |

---

## 5. 누락 검증 (Coverage Check)

### 5.1 PRD 요구사항 커버리지

| PRD 섹션 | 요구사항 수 | 매핑된 FR | 커버리지 |
|---------|-----------|----------|---------|
| 섹션 6.2 (WBS 트리 뷰) | 2개 | FR-001, FR-002 | 100% |
| 섹션 6.3 (Task 상세 패널) | 1개 | FR-003 | 100% |
| 섹션 9.1 (프로젝트 선택) | 1개 | FR-001 | 100% |
| 섹션 9.3 (상태 관리) | 2개 | FR-009, FR-010 | 100% |
| 섹션 11 (사용자 피드백) | 4개 | FR-004~FR-008 | 100% |
| **전체** | **10개** | **FR-001~FR-010** | **100%** |

### 5.2 미구현 요구사항

없음 (모든 PRD 요구사항이 기본설계 및 상세설계에 매핑됨)

---

## 6. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-15 | 1.0.0 | 초안 작성 | System Architect |

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban/prd.md`

---

<!--
author: System Architect
Template Version: 2.0.0
-->
