# 테스트 명세 (026-test-specification.md)

**Template Version:** 2.0.0 — **Last Updated:** 2025-12-15

> **문서 목적**
> 단위 테스트, 통합 테스트, E2E 테스트 시나리오 및 data-testid 속성을 정의합니다.

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

## 1. 테스트 전략

### 1.1 테스트 레벨

| 테스트 레벨 | 도구 | 커버리지 목표 | 책임 |
|-----------|------|--------------|------|
| 단위 테스트 | Vitest | 80% (컴포넌트 로직, composable) | 개별 함수/컴포넌트 검증 |
| 통합 테스트 | Vitest + @vue/test-utils | 70% (스토어 연동, API 모킹) | 컴포넌트 간 상호작용 검증 |
| E2E 테스트 | Playwright | 주요 시나리오 100% | 사용자 흐름 검증 |

### 1.2 테스트 우선순위

| 우선순위 | 시나리오 | 이유 |
|---------|---------|------|
| P0 (Critical) | 페이지 초기화, 프로젝트 로딩, WBS 로딩 | 핵심 기능 |
| P1 (High) | 에러 핸들링, Empty State, 노드 선택 연동 | 사용자 경험 핵심 |
| P2 (Medium) | 로딩 스피너, Toast 메시지, 상태 초기화 | 피드백 및 정리 |
| P3 (Low) | 접근성, 키보드 네비게이션 | 품질 향상 |

---
 
## 2. 단위 테스트 (Unit Tests)

### 2.1 pages/wbs.vue 컴포넌트 테스트

#### TC-001: URL 쿼리에서 projectId 추출

**요구사항**: FR-001

**테스트 목적**: URL 쿼리 파라미터에서 projectId를 올바르게 추출하는지 검증

**전제조건**:
- Vue Router 모킹
- route.query.projectId = "jjiban"

**테스트 단계**:
1. 컴포넌트 마운트
2. projectId computed 값 확인

**기대 결과**:
- projectId === "jjiban"

**data-testid**: N/A (로직 테스트)

---

#### TC-002: projectId 없을 때 Empty State 표시

**요구사항**: FR-006

**테스트 목적**: projectId 쿼리가 없을 때 Empty State를 표시하는지 검증

**전제조건**:
- route.query.projectId = undefined

**테스트 단계**:
1. 컴포넌트 마운트
2. Empty State 엘리먼트 존재 확인

**기대 결과**:
- `[data-testid="empty-state-no-project"]` 요소 존재
- "프로젝트를 선택하세요" 메시지 표시

**data-testid**: `empty-state-no-project`

---

#### TC-003: 프로젝트 로드 후 WBS 자동 조회

**요구사항**: FR-002

**테스트 목적**: 프로젝트 로드 성공 시 WBS 데이터 자동 조회를 트리거하는지 검증

**전제조건**:
- projectStore.loadProject 모킹 (성공)
- wbsStore.fetchWbs 모킹

**테스트 단계**:
1. 컴포넌트 마운트
2. onMounted 트리거
3. watch(currentProject) 실행 대기
4. fetchWbs 호출 확인

**기대 결과**:
- wbsStore.fetchWbs(projectId) 호출됨
- 호출 순서: loadProject → fetchWbs

**data-testid**: N/A (로직 테스트)

---

#### TC-004: 노드 선택 시 selectionStore 호출

**요구사항**: FR-003

**테스트 목적**: WbsTreePanel 노드 선택 이벤트 발생 시 selectionStore.selectNode 호출 검증

**전제조건**:
- WbsTreePanel 모킹
- selectionStore.selectNode 스파이

**테스트 단계**:
1. 컴포넌트 마운트
2. WbsTreePanel에서 `@node-selected` 이벤트 발생 (nodeId: "TSK-05-03")
3. selectNode 호출 확인

**기대 결과**:
- selectionStore.selectNode("TSK-05-03") 호출됨

**data-testid**: N/A (이벤트 테스트)

---

### 2.2 useWbsPage Composable 테스트 (선택적)

#### TC-005: 에러 메시지 한글 변환

**요구사항**: FR-005

**테스트 목적**: 에러 코드를 사용자 친화적인 한글 메시지로 변환하는지 검증

**전제조건**:
- useWbsPage composable 구현 (선택적)

**테스트 단계**:
1. handleError("PROJECT_NOT_FOUND") 호출
2. 반환 메시지 확인

**기대 결과**:
- 반환 값: "프로젝트를 찾을 수 없습니다."

**data-testid**: N/A (유틸리티 함수 테스트)

---

## 3. 통합 테스트 (Integration Tests)

### 3.1 스토어 연동 테스트

#### TC-006: 프로젝트 로딩 중 스피너 표시

**요구사항**: FR-004

**테스트 목적**: API 호출 중 로딩 스피너가 표시되는지 검증

**전제조건**:
- projectStore.loadProject 모킹 (지연 응답)

**테스트 단계**:
1. 컴포넌트 마운트
2. loadProject 호출 (지연 모킹)
3. 로딩 스피너 존재 확인
4. API 응답 후 스피너 사라짐 확인

**기대 결과**:
- 로딩 중: `[data-testid="loading-spinner"]` 존재
- 로딩 완료 후: 스피너 제거, 콘텐츠 표시

**data-testid**: `loading-spinner`, `wbs-content`

---

#### TC-007: WBS 로딩 중 스켈레톤 UI 표시 (선택적)

**요구사항**: FR-004

**테스트 목적**: WBS 데이터 로딩 중 스켈레톤 UI가 표시되는지 검증

**전제조건**:
- wbsStore.fetchWbs 모킹 (지연 응답)

**테스트 단계**:
1. 컴포넌트 마운트
2. fetchWbs 호출 (지연 모킹)
3. 스켈레톤 UI 존재 확인
4. API 응답 후 실제 트리 렌더링 확인

**기대 결과**:
- 로딩 중: `[data-testid="skeleton-tree"]` 존재
- 로딩 완료 후: 실제 WBS 트리 표시

**data-testid**: `skeleton-tree`, `wbs-tree`

---

#### TC-008: API 에러 발생 시 Toast 표시

**요구사항**: FR-005

**테스트 목적**: API 실패 시 Toast 에러 메시지가 표시되는지 검증

**전제조건**:
- projectStore.loadProject 모킹 (404 에러)
- useToast 모킹

**테스트 단계**:
1. 컴포넌트 마운트
2. loadProject 실패 (404)
3. Toast.add 호출 확인

**기대 결과**:
- Toast.add 호출됨
- severity: "error"
- summary: "에러"
- detail: "프로젝트를 찾을 수 없습니다."

**data-testid**: N/A (Toast 모킹 검증)

---

### 3.2 에러 핸들링 테스트

#### TC-009: 프로젝트 로드 실패 시 WBS 로딩 중단

**요구사항**: FR-002, BR-002

**테스트 목적**: 프로젝트 로드 실패 시 WBS 로딩이 실행되지 않는지 검증

**전제조건**:
- projectStore.loadProject 모킹 (에러)
- wbsStore.fetchWbs 스파이

**테스트 단계**:
1. 컴포넌트 마운트
2. loadProject 실패
3. fetchWbs 호출 여부 확인

**기대 결과**:
- wbsStore.fetchWbs 호출되지 않음
- Empty State 또는 에러 메시지 표시

**data-testid**: `error-message`

---

#### TC-010: 네트워크 오류 시 재시도 버튼 제공

**요구사항**: NFR-003

**테스트 목적**: 네트워크 오류 발생 시 재시도 버튼이 표시되는지 검증

**전제조건**:
- projectStore.loadProject 모킹 (NETWORK_ERROR)

**테스트 단계**:
1. 컴포넌트 마운트
2. loadProject 실패 (네트워크 오류)
3. 재시도 버튼 존재 확인
4. 재시도 버튼 클릭 → loadProject 재호출 확인

**기대 결과**:
- `[data-testid="retry-button"]` 존재
- 버튼 클릭 시 loadProject 재호출

**data-testid**: `retry-button`

---

### 3.3 Empty State 테스트

#### TC-011: 프로젝트 없음 Empty State

**요구사항**: FR-006

**테스트 목적**: projectId 없을 때 적절한 Empty State 표시 검증

**전제조건**:
- route.query.projectId = undefined

**테스트 단계**:
1. 컴포넌트 마운트
2. Empty State 요소 확인
3. 대시보드 이동 버튼 확인

**기대 결과**:
- `[data-testid="empty-state-no-project"]` 존재
- "프로젝트를 선택하세요" 메시지
- `[data-testid="dashboard-link"]` 버튼 존재

**data-testid**: `empty-state-no-project`, `dashboard-link`

---

#### TC-012: WBS 데이터 없음 Empty State

**요구사항**: FR-007

**테스트 목적**: WBS 트리 빈 배열일 때 Empty State 표시 검증

**전제조건**:
- wbsStore.tree = []

**테스트 단계**:
1. 컴포넌트 마운트
2. WbsTreePanel 내부 Empty State 확인

**기대 결과**:
- `[data-testid="empty-state-no-wbs"]` 존재
- "WBS 데이터가 없습니다" 메시지

**data-testid**: `empty-state-no-wbs`

---

#### TC-013: Task 미선택 Empty State

**요구사항**: FR-008

**테스트 목적**: Task 미선택 시 TaskDetailPanel에 Empty State 표시 검증

**전제조건**:
- selectionStore.selectedTask = null

**테스트 단계**:
1. 컴포넌트 마운트
2. TaskDetailPanel 내부 Empty State 확인

**기대 결과**:
- `[data-testid="empty-state-no-task"]` 존재
- "Task를 선택하세요" 메시지

**data-testid**: `empty-state-no-task`

---

### 3.4 라이프사이클 테스트

#### TC-014: 페이지 언마운트 시 상태 초기화

**요구사항**: FR-009

**테스트 목적**: onUnmounted에서 스토어 상태가 초기화되는지 검증

**전제조건**:
- wbsStore.clearWbs 스파이
- selectionStore.clearSelection 스파이

**테스트 단계**:
1. 컴포넌트 마운트
2. 컴포넌트 언마운트
3. clearWbs, clearSelection 호출 확인

**기대 결과**:
- wbsStore.clearWbs() 호출됨
- selectionStore.clearSelection() 호출됨

**data-testid**: N/A (라이프사이클 테스트)

---

#### TC-015: watch로 스토어 간 반응형 연동

**요구사항**: FR-010

**테스트 목적**: currentProject 변화 시 fetchWbs가 자동 트리거되는지 검증

**전제조건**:
- projectStore 반응형 모킹
- wbsStore.fetchWbs 스파이

**테스트 단계**:
1. 컴포넌트 마운트
2. projectStore.currentProject 변경
3. fetchWbs 호출 확인

**기대 결과**:
- currentProject 변경 후 fetchWbs(projectId) 호출됨

**data-testid**: N/A (watch 테스트)

---

## 4. E2E 테스트 (End-to-End Tests)

### 4.1 정상 흐름 시나리오

#### TC-016: 페이지 초기화 → 프로젝트 → WBS → Task 선택 (Happy Path)

**요구사항**: FR-001, FR-002, FR-003, NFR-001

**테스트 목적**: 정상 흐름에서 전체 페이지가 올바르게 동작하는지 검증

**전제조건**:
- 테스트 프로젝트 ID: "jjiban"
- WBS 데이터 존재
- Task TSK-05-03 존재

**테스트 단계**:
1. `/wbs?projectId=jjiban` 페이지 접속
2. 로딩 스피너 표시 확인
3. WBS 트리 렌더링 확인 (WP-05 노드 존재)
4. Task 노드 클릭 (TSK-05-03)
5. TaskDetailPanel에 상세 정보 표시 확인

**기대 결과**:
- 1초 이내 페이지 로딩 완료 (NFR-001)
- WBS 트리 표시
- Task 상세 패널 표시
- 헤더에 프로젝트명 "JJIBAN Project Manager" 표시

**data-testid**:
- `loading-spinner`
- `wbs-tree`
- `wbs-tree-node-TSK-05-03`
- `task-detail-panel`
- `task-title`

---

#### TC-017: 노드 선택 → Task 상세 로드 성능

**요구사항**: NFR-002

**테스트 목적**: 노드 선택 후 Task 상세 패널 표시까지 200ms 이내 완료되는지 검증

**전제조건**:
- 페이지 로딩 완료
- WBS 트리 렌더링 완료

**테스트 단계**:
1. Task 노드 클릭 시작 시간 기록
2. TaskDetailPanel 렌더링 완료 시간 기록
3. 시간 차이 계산

**기대 결과**:
- 노드 선택 → Task 상세 표시: < 200ms (NFR-002)

**data-testid**:
- `wbs-tree-node-TSK-05-03`
- `task-detail-panel`

---

### 4.2 에러 시나리오

#### TC-018: 프로젝트 로드 실패 → 재시도 → 성공

**요구사항**: NFR-003

**테스트 목적**: 에러 복구 메커니즘이 올바르게 동작하는지 검증

**전제조건**:
- 첫 번째 API 호출: 500 에러
- 두 번째 API 호출: 성공

**테스트 단계**:
1. `/wbs?projectId=jjiban` 접속
2. 에러 메시지 확인
3. 재시도 버튼 클릭
4. 정상 로딩 확인

**기대 결과**:
- 에러 Toast 표시
- 재시도 버튼 표시
- 재시도 후 정상 WBS 트리 렌더링

**data-testid**:
- `error-message`
- `retry-button`
- `wbs-tree`

---

#### TC-019: Toast 자동 사라짐

**요구사항**: NFR-004

**테스트 목적**: Toast 메시지가 3초 후 자동으로 사라지는지 검증

**전제조건**:
- API 성공 또는 실패로 Toast 표시

**테스트 단계**:
1. Toast 표시 트리거 (예: 에러 발생)
2. Toast 요소 존재 확인
3. 3초 대기
4. Toast 요소 사라짐 확인

**기대 결과**:
- Toast 표시 후 3초 이내 자동 사라짐 (NFR-004)

**data-testid**: N/A (PrimeVue Toast DOM 확인)

---

### 4.3 Empty State 시나리오

#### TC-020: 프로젝트 없음 → 대시보드 이동

**요구사항**: FR-006

**테스트 목적**: projectId 없을 때 Empty State 표시 및 대시보드 이동 검증

**전제조건**:
- URL: `/wbs` (쿼리 없음)

**테스트 단계**:
1. `/wbs` 페이지 접속
2. Empty State 확인
3. "대시보드로 이동" 버튼 클릭
4. 대시보드 페이지로 이동 확인

**기대 결과**:
- "프로젝트를 선택하세요" 메시지
- 대시보드로 이동 버튼 클릭 → `/` 페이지 이동

**data-testid**:
- `empty-state-no-project`
- `dashboard-link`

---

### 4.4 반응형 테스트

#### TC-021: 최소 너비 1200px 레이아웃

**요구사항**: NFR-005

**테스트 목적**: 1200px 최소 너비에서 레이아웃이 정상 표시되는지 검증

**전제조건**:
- 브라우저 너비: 1200px

**테스트 단계**:
1. 브라우저 너비 1200px 설정
2. 페이지 로딩
3. 좌우 패널 레이아웃 확인

**기대 결과**:
- 좌측 패널: 60% 너비
- 우측 패널: 40% 너비
- 스크롤 없이 정상 표시

**data-testid**:
- `wbs-tree-panel`
- `task-detail-panel`

---

## 5. 접근성 테스트

### TC-022: 키보드 네비게이션

**요구사항**: 접근성 가이드

**테스트 목적**: Tab, Escape 키로 페이지 네비게이션이 가능한지 검증

**전제조건**:
- 페이지 로딩 완료

**테스트 단계**:
1. Tab 키로 포커스 이동 (헤더 → 좌측 패널 → 우측 패널)
2. Escape 키로 선택 해제 (향후)
3. 포커스 순서 확인

**기대 결과**:
- Tab 키로 논리적 순서대로 포커스 이동
- 모든 인터랙티브 요소 접근 가능

**data-testid**: N/A (접근성 테스트)

---

### TC-023: ARIA 라벨

**요구사항**: 접근성 가이드

**테스트 목적**: 모든 주요 요소에 ARIA 라벨이 설정되어 있는지 검증

**전제조건**:
- 페이지 로딩 완료

**테스트 단계**:
1. WbsTreePanel aria-label 확인
2. TaskDetailPanel aria-label 확인
3. 로딩 상태 aria-busy 확인

**기대 결과**:
- WbsTreePanel: aria-label="WBS 트리 패널"
- TaskDetailPanel: aria-label="Task 상세 패널"
- 로딩 중: aria-busy="true"

**data-testid**: N/A (ARIA 속성 테스트)

---

## 6. data-testid 속성 목록

### 6.1 pages/wbs.vue

| 요소 | data-testid | 용도 |
|------|-------------|------|
| 로딩 스피너 | `loading-spinner` | 페이지 로딩 중 표시 |
| WBS 콘텐츠 영역 | `wbs-content` | 정상 콘텐츠 표시 영역 |
| Empty State: 프로젝트 없음 | `empty-state-no-project` | projectId 없을 때 |
| Empty State: WBS 없음 | `empty-state-no-wbs` | WBS 데이터 빈 배열 |
| 에러 메시지 | `error-message` | API 에러 발생 시 |
| 재시도 버튼 | `retry-button` | 에러 복구 버튼 |
| 대시보드 링크 | `dashboard-link` | 대시보드 이동 버튼 |

### 6.2 WbsTreePanel (TSK-04-03에서 정의)

| 요소 | data-testid | 용도 |
|------|-------------|------|
| 트리 패널 | `wbs-tree-panel` | 좌측 패널 컨테이너 |
| WBS 트리 | `wbs-tree` | 트리 노드 렌더링 영역 |
| 트리 노드 | `wbs-tree-node-{id}` | 개별 노드 (예: wbs-tree-node-TSK-05-03) |
| 검색 박스 | `wbs-search-box` | WBS 검색 입력 |
| 펼치기 버튼 | `expand-all-button` | 전체 펼치기 |
| 접기 버튼 | `collapse-all-button` | 전체 접기 |

### 6.3 TaskDetailPanel (TSK-05-03에서 정의)

| 요소 | data-testid | 용도 |
|------|-------------|------|
| Task 상세 패널 | `task-detail-panel` | 우측 패널 컨테이너 |
| Task 제목 | `task-title` | Task 이름 표시 |
| Empty State: Task 미선택 | `empty-state-no-task` | Task 미선택 시 |
| 편집 버튼 | `edit-button` | Task 편집 |
| 상태 전이 버튼 | `transition-button-{command}` | 워크플로우 명령 (예: transition-button-start) |

---

## 7. 테스트 데이터

### 7.1 Mock 프로젝트 데이터

```json
{
  "id": "jjiban",
  "name": "JJIBAN Project Manager",
  "status": "active",
  "description": "AI 기반 프로젝트 관리 도구"
}
```

### 7.2 Mock WBS 데이터

```json
[
  {
    "id": "WP-05",
    "type": "wp",
    "title": "Task Detail & Document (Frontend)",
    "status": "[im]",
    "progress": 60,
    "children": [
      {
        "id": "TSK-05-03",
        "type": "task",
        "title": "Detail Actions",
        "status": "[dd]",
        "progress": 50,
        "children": []
      }
    ]
  }
]
```

### 7.3 Mock 에러 응답

```json
{
  "statusCode": 404,
  "message": "PROJECT_NOT_FOUND",
  "error": "Not Found"
}
```

---

## 8. 테스트 실행 계획

### 8.1 테스트 실행 순서

1. **단위 테스트** (Vitest)
   - TC-001 ~ TC-005
   - 실행: `npm run test:unit`
   - 목표 시간: 30초 이내

2. **통합 테스트** (Vitest + @vue/test-utils)
   - TC-006 ~ TC-015
   - 실행: `npm run test:integration`
   - 목표 시간: 1분 이내

3. **E2E 테스트** (Playwright)
   - TC-016 ~ TC-023
   - 실행: `npm run test:e2e`
   - 목표 시간: 3분 이내

### 8.2 CI/CD 통합

- PR 생성 시 자동 실행: 단위 + 통합 테스트
- main 브랜치 머지 시: 전체 테스트 (단위 + 통합 + E2E)

---

## 9. 커버리지 목표

| 테스트 유형 | 목표 커버리지 | 현재 상태 |
|-----------|--------------|----------|
| 단위 테스트 | 80% | 0% (미구현) |
| 통합 테스트 | 70% | 0% (미구현) |
| E2E 테스트 | 주요 시나리오 100% | 0% (미구현) |

---

## 10. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-15 | 1.0.0 | 초안 작성 | System Architect |

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- PRD: `.jjiban/projects/jjiban/prd.md`

---

<!--
author: System Architect
Template Version: 2.0.0
-->
