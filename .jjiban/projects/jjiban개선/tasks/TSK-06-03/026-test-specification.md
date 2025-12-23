# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **목적**: 단위 테스트, E2E 테스트 시나리오 및 data-testid 정의

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-03 |
| Task명 | 의존관계 그래프 필터 및 계층 접기 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

---

## 1. 테스트 전략

### 1.1 테스트 범위

| 테스트 유형 | 대상 | 도구 | 커버리지 목표 |
|------------|------|------|--------------|
| 단위 테스트 | Composable 함수 (useDependencyGraph, useGraphFilter, useGroupNodes, useFocusView) | Vitest | > 80% |
| 컴포넌트 테스트 | GraphFilterPanel, GroupNode, TaskNode | Vitest + @vue/test-utils | > 70% |
| E2E 테스트 | 필터 적용, 그룹 토글, 초점 뷰, URL 동기화 | Playwright | 주요 시나리오 100% |
| 성능 테스트 | 필터 응답 시간, 그룹 토글 애니메이션 | Playwright Performance API | NFR 기준 충족 |

### 1.2 테스트 환경

| 환경 | 설정 |
|------|------|
| 테스트 프로젝트 | `.jjiban/test-project` (100개 Task 샘플 데이터) |
| 브라우저 | Chromium, Firefox, WebKit (Playwright) |
| 화면 크기 | Desktop (1920x1080), Tablet (1024x768), Mobile (375x667) |

---

## 2. data-testid 정의

### 2.1 GraphFilterPanel

| 요소 | data-testid | 설명 |
|------|-------------|------|
| 필터 패널 컨테이너 | `graph-filter-panel` | 전체 필터 패널 |
| 필터 토글 버튼 | `filter-toggle-btn` | 접기/펼치기 버튼 |
| 필터 초기화 버튼 | `filter-reset-btn` | 초기화 버튼 |
| 통계 영역 | `filter-stats` | 노드/엣지 개수 표시 |
| 카테고리 Checkbox (개발) | `category-checkbox-development` | 개발 카테고리 |
| 카테고리 Checkbox (결함) | `category-checkbox-defect` | 결함 카테고리 |
| 카테고리 Checkbox (인프라) | `category-checkbox-infrastructure` | 인프라 카테고리 |
| 상태 MultiSelect | `status-multiselect` | 상태 다중 선택 드롭다운 |
| 계층 뷰 RadioButton (전체) | `hierarchy-radio-full` | 전체 보기 |
| 계층 뷰 RadioButton (WP) | `hierarchy-radio-wp` | WP 그룹 |
| 계층 뷰 RadioButton (ACT) | `hierarchy-radio-act` | ACT 그룹 |
| 초점 Task Select | `focus-task-select` | 초점 Task 선택 드롭다운 |
| 초점 Depth RadioButton (1) | `focus-depth-radio-1` | 깊이 1 |
| 초점 Depth RadioButton (2) | `focus-depth-radio-2` | 깊이 2 |
| 초점 Depth RadioButton (3) | `focus-depth-radio-3` | 깊이 3 |
| 초점 적용 버튼 | `focus-apply-btn` | 초점 뷰 적용 |

### 2.2 GroupNode

| 요소 | data-testid | 설명 |
|------|-------------|------|
| 그룹 노드 컨테이너 | `group-node-{groupId}` | 예: `group-node-WP-06` |
| 그룹 헤더 (클릭 영역) | `group-node-header-{groupId}` | 축소/확장 토글 |
| 진행률 바 | `group-node-progress-{groupId}` | 진행률 프로그레스 바 |
| 진행률 텍스트 | `group-node-progress-text-{groupId}` | 진행률 퍼센트 |
| 하위 Task 목록 | `group-node-children-{groupId}` | 확장 시 표시 |

### 2.3 TaskNode

| 요소 | data-testid | 설명 |
|------|-------------|------|
| Task 노드 컨테이너 | `task-node-{taskId}` | 예: `task-node-TSK-06-03` |
| Task ID | `task-node-id-{taskId}` | Task ID 텍스트 |
| Task 제목 | `task-node-title-{taskId}` | Task 제목 |
| 상태 배지 | `task-node-status-{taskId}` | 상태 표시 |

### 2.4 DependencyGraphModal

| 요소 | data-testid | 설명 |
|------|-------------|------|
| 모달 컨테이너 | `dependency-graph-modal` | 전체 모달 |
| 그래프 캔버스 | `dependency-graph-canvas` | Vue Flow 영역 |
| 범례 | `graph-legend` | 범례 표시 |

---

## 3. 단위 테스트 케이스

### 3.1 useDependencyGraph

#### TC-UNIT-001: 카테고리 필터 적용

**요구사항**: FR-002

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildGraphData({ categories: ['development'] }) 호출 | development 카테고리 Task만 반환 |
| 2 | 반환된 nodes 배열 확인 | node.data.category === 'development' |
| 3 | defect, infrastructure Task 제외 확인 | 해당 카테고리 노드 0개 |

**테스트 데이터**:
- 3개 Task: TSK-01 (development), TSK-02 (defect), TSK-03 (infrastructure)

#### TC-UNIT-002: 상태 필터 적용

**요구사항**: FR-003

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildGraphData({ statuses: ['[im]', '[vf]'] }) 호출 | [im], [vf] 상태 Task만 반환 |
| 2 | 반환된 nodes 배열 확인 | node.data.status in ['[im]', '[vf]'] |
| 3 | 다른 상태 Task 제외 확인 | [ ], [bd], [xx] 노드 0개 |

**테스트 데이터**:
- 5개 Task: 각각 [ ], [bd], [im], [vf], [xx] 상태

#### TC-UNIT-003: WP 그룹 노드 생성

**요구사항**: FR-001

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildGroupNodes('wp', filteredTaskIds) 호출 | WP 그룹 노드 배열 반환 |
| 2 | groupNodes[0] 확인 | groupType === 'wp', groupId === 'WP-01' |
| 3 | taskCount, completedCount 확인 | 정확한 개수 계산됨 |
| 4 | childTaskIds 확인 | WP 하위 Task ID 배열 |

**테스트 데이터**:
- WP-01: 3개 Task (TSK-01-01, TSK-01-02, TSK-01-03)
- 1개 완료, 2개 진행 중

#### TC-UNIT-004: 빈 그룹 제외

**요구사항**: BR-002

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildGroupNodes('wp', emptyTaskIds) 호출 | 빈 배열 반환 |
| 2 | WP-01 하위 Task 모두 필터링되어 제외 | groupNodes.length === 0 |

**테스트 데이터**:
- WP-01: 3개 Task (모두 defect 카테고리)
- 필터: { categories: ['development'] }

### 3.2 useFocusView

#### TC-UNIT-005: BFS depth 1 탐색

**요구사항**: FR-004

**테스트 파일**: `tests/composables/useFocusView.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildFocusGraph('TSK-03', 1, taskNodes, edges) 호출 | 초점 Task + depth 1 Task Set 반환 |
| 2 | includesNodes.size 확인 | 3개 (TSK-03 + 선행 1개 + 후행 1개) |
| 3 | 선행 Task 포함 확인 | includesNodes.has('TSK-02') === true |
| 4 | 후행 Task 포함 확인 | includesNodes.has('TSK-04') === true |
| 5 | depth 2 Task 제외 확인 | includesNodes.has('TSK-01') === false |

**테스트 데이터**:
- 의존관계: TSK-01 → TSK-02 → TSK-03 → TSK-04 → TSK-05

#### TC-UNIT-006: BFS depth 3 탐색

**요구사항**: FR-004

**테스트 파일**: `tests/composables/useFocusView.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildFocusGraph('TSK-03', 3, taskNodes, edges) 호출 | depth 3 내 모든 Task 반환 |
| 2 | includesNodes.size 확인 | 5개 (TSK-01 ~ TSK-05 전체) |
| 3 | depth 3 선행 Task 포함 | includesNodes.has('TSK-01') === true |
| 4 | depth 3 후행 Task 포함 | includesNodes.has('TSK-05') === true |

**테스트 데이터**:
- 의존관계: TSK-01 → TSK-02 → TSK-03 → TSK-04 → TSK-05

### 3.3 useGraphFilter

#### TC-UNIT-007: URL 파라미터 직렬화

**요구사항**: FR-005

**테스트 파일**: `tests/composables/useGraphFilter.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | encodeFilterToURL(filter) 호출 | 쿼리 문자열 반환 |
| 2 | categories 확인 | `categories=development,infrastructure` |
| 3 | statuses 확인 | `statuses=im,vf,xx` (괄호 제거) |
| 4 | hierarchyMode 확인 | `hierarchyMode=wp` (full이면 생략) |
| 5 | focusTask 확인 | `focusTask=TSK-06-03` |
| 6 | focusDepth 확인 | `focusDepth=2` |

**테스트 데이터**:
```typescript
{
  categories: ['development', 'infrastructure'],
  statuses: ['[im]', '[vf]', '[xx]'],
  hierarchyMode: 'wp',
  focusTask: 'TSK-06-03',
  focusDepth: 2
}
```

#### TC-UNIT-008: URL 파라미터 역직렬화

**요구사항**: FR-005

**테스트 파일**: `tests/composables/useGraphFilter.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | parseURLParams(searchParams) 호출 | GraphFilter 객체 반환 |
| 2 | categories 확인 | ['development', 'infrastructure'] |
| 3 | statuses 확인 | ['[im]', '[vf]', '[xx]'] (괄호 복원) |
| 4 | hierarchyMode 확인 | 'wp' |
| 5 | focusTask 확인 | 'TSK-06-03' |
| 6 | focusDepth 확인 | 2 (number) |

**테스트 데이터**:
```
?categories=development,infrastructure&statuses=im,vf,xx&hierarchyMode=wp&focusTask=TSK-06-03&focusDepth=2
```

### 3.4 useGroupNodes

#### TC-UNIT-009: 그룹 축소/확장 상태 토글

**요구사항**: FR-001

**테스트 파일**: `tests/composables/useGroupNodes.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | toggleGroup('WP-01') 호출 | groupExpandedStates.get('WP-01') 반전 |
| 2 | 초기 상태 true 확인 | true → false |
| 3 | 재호출 | false → true |
| 4 | Map에 없는 그룹 토글 | 기본값 true → false |

**테스트 데이터**:
- groupExpandedStates: Map { 'WP-01': true }

### 3.5 비즈니스 규칙 검증

#### TC-UNIT-010: 빈 필터 = 전체 표시

**요구사항**: BR-001

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | buildGraphData({}) 호출 (빈 필터) | 모든 Task 반환 |
| 2 | nodes.length 확인 | 전체 Task 개수와 일치 |

**테스트 데이터**:
- 10개 Task (다양한 카테고리/상태)

#### TC-UNIT-011: URL 파라미터 기본값 생략

**요구사항**: BR-004

**테스트 파일**: `tests/composables/useGraphFilter.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | encodeFilterToURL({ hierarchyMode: 'full', focusDepth: 2 }) 호출 | `hierarchyMode`, `focusDepth` 생략된 쿼리 문자열 |
| 2 | 쿼리 문자열 확인 | 빈 문자열 또는 다른 파라미터만 포함 |

**테스트 데이터**:
```typescript
{
  categories: [],
  statuses: [],
  hierarchyMode: 'full',
  focusTask: null,
  focusDepth: 2
}
```

#### TC-UNIT-012: 순환 의존성 처리

**요구사항**: BR-005

**테스트 파일**: `tests/composables/useDependencyGraph.spec.ts`

| 단계 | 동작 | 예상 결과 |
|------|------|----------|
| 1 | 순환 의존 데이터로 calculateLevels 호출 | 모든 Task에 레벨 할당 |
| 2 | 순환 노드 레벨 확인 | maxLevel + 1 |
| 3 | 콘솔 경고 확인 | console.warn 호출됨 |

**테스트 데이터**:
- TSK-01 → TSK-02 → TSK-03 → TSK-01 (순환)

---

## 4. E2E 테스트 시나리오

### 4.1 필터 적용

#### TC-E2E-001: 카테고리 필터 적용

**요구사항**: FR-002, AC-02

**테스트 파일**: `tests/e2e/graph-filter.spec.ts`

**전제 조건**:
- 의존관계 그래프 모달이 열려 있음
- 100개 Task (development: 60개, defect: 30개, infrastructure: 10개)

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | GraphFilterPanel의 "개발" Checkbox 해제 | defect, infrastructure Task만 표시됨 | `category-checkbox-development` |
| 2 | 그래프 노드 개수 확인 | 40개 노드 (30+10) | `dependency-graph-canvas` |
| 3 | 통계 확인 | "노드 40" 표시 | `filter-stats` |
| 4 | "개발" Checkbox 재선택 | 전체 100개 Task 표시 | - |

**검증 포인트**:
- development 카테고리 노드가 사라짐/나타남
- 엣지도 함께 업데이트됨
- 필터 통계가 실시간 업데이트됨

#### TC-E2E-002: 상태 필터 적용

**요구사항**: FR-003, AC-03

**테스트 파일**: `tests/e2e/graph-filter.spec.ts`

**전제 조건**:
- 의존관계 그래프 모달이 열려 있음
- 100개 Task ([ ]: 20개, [bd]: 15개, [dd]: 10개, [im]: 30개, [vf]: 15개, [xx]: 10개)

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 상태 MultiSelect 클릭 | 드롭다운 열림 | `status-multiselect` |
| 2 | "[im] 구현" 선택 | [im] 상태만 선택됨 | - |
| 3 | 그래프 노드 개수 확인 | 30개 노드 | `dependency-graph-canvas` |
| 4 | "[vf] 검증", "[xx] 완료" 추가 선택 | 55개 노드 (30+15+10) | - |
| 5 | 통계 확인 | "노드 55" 표시 | `filter-stats` |

**검증 포인트**:
- MultiSelect 라벨에 선택된 상태 표시
- 그래프가 실시간 필터링됨

### 4.2 그룹 노드 축소/확장

#### TC-E2E-003: 그룹 노드 축소/확장

**요구사항**: FR-001, AC-04

**테스트 파일**: `tests/e2e/group-node.spec.ts`

**전제 조건**:
- 계층 뷰 "WP 그룹" 선택
- WP-06에 3개 Task (TSK-06-01, TSK-06-02, TSK-06-03)

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 계층 뷰 "WP 그룹" RadioButton 선택 | 그룹 노드 표시 | `hierarchy-radio-wp` |
| 2 | WP-06 그룹 노드 클릭 | 축소 애니메이션 (100ms) | `group-node-header-WP-06` |
| 3 | 하위 Task 노드 사라짐 확인 | TSK-06-01~03 노드 안 보임 | `task-node-TSK-06-01` |
| 4 | 그룹 노드 아이콘 확인 | ▼ → ▶ | - |
| 5 | WP-06 그룹 노드 재클릭 | 확장 애니메이션 (100ms) | - |
| 6 | 하위 Task 노드 나타남 확인 | TSK-06-01~03 노드 표시 | - |
| 7 | 그룹 노드 아이콘 확인 | ▶ → ▼ | - |

**검증 포인트**:
- 애니메이션이 부드럽게 동작
- 엣지도 함께 숨김/표시됨
- 진행률 바는 항상 표시됨

### 4.3 초점 뷰

#### TC-E2E-004: 초점 뷰 적용

**요구사항**: FR-004, AC-05, AC-07

**테스트 파일**: `tests/e2e/focus-view.spec.ts`

**전제 조건**:
- 의존관계: TSK-01 → TSK-02 → TSK-03 → TSK-04 → TSK-05 (선형)

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 초점 Task Select 클릭 → TSK-03 선택 | TSK-03 선택됨 | `focus-task-select` |
| 2 | 깊이 RadioButton "2" 선택 | depth 2 선택됨 | `focus-depth-radio-2` |
| 3 | [적용] 버튼 클릭 | 초점 뷰 활성화 | `focus-apply-btn` |
| 4 | 그래프 노드 개수 확인 | 5개 (TSK-01~05 중 TSK-03 중심 depth 2) | `dependency-graph-canvas` |
| 5 | TSK-03 노드 하이라이트 확인 | 노란색 테두리 + 링 효과 | `task-node-TSK-03` |
| 6 | Depth 1 노드 테두리 확인 | TSK-02, TSK-04 실선 테두리 | `task-node-TSK-02` |
| 7 | Depth 2 노드 테두리 확인 | TSK-01, TSK-05 점선 테두리 | `task-node-TSK-01` |

**검증 포인트**:
- 초점 Task만 하이라이트됨
- Depth별 테두리 스타일이 다름
- depth 밖 노드는 숨겨짐

### 4.4 URL 파라미터 동기화

#### TC-E2E-005: URL 파라미터 저장 및 복원

**요구사항**: FR-005, AC-06, AC-07

**테스트 파일**: `tests/e2e/url-sync.spec.ts`

**전제 조건**:
- 의존관계 그래프 모달이 열려 있음

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 카테고리 "개발" 선택 | URL에 `categories=development` 추가됨 | `category-checkbox-development` |
| 2 | 상태 "[im]" 선택 | URL에 `statuses=im` 추가됨 | `status-multiselect` |
| 3 | 계층 뷰 "WP 그룹" 선택 | URL에 `hierarchyMode=wp` 추가됨 | `hierarchy-radio-wp` |
| 4 | 브라우저 URL 확인 | `?categories=development&statuses=im&hierarchyMode=wp` | - |
| 5 | 페이지 새로고침 (F5) | 필터 설정 복원됨 | - |
| 6 | 카테고리 Checkbox 확인 | "개발"만 선택되어 있음 | `category-checkbox-development` |
| 7 | 상태 MultiSelect 확인 | "[im]"만 선택되어 있음 | `status-multiselect` |
| 8 | 계층 뷰 RadioButton 확인 | "WP 그룹" 선택되어 있음 | `hierarchy-radio-wp` |

**검증 포인트**:
- 필터 변경 시 URL이 즉시 업데이트됨
- URL로 페이지 로드 시 필터 설정이 정확히 복원됨
- 기본값은 URL에 포함되지 않음

### 4.5 필터 패널 토글

#### TC-E2E-006: 필터 패널 접기/펼치기

**요구사항**: FR-006, AC-01

**테스트 파일**: `tests/e2e/graph-filter.spec.ts`

**전제 조건**:
- 의존관계 그래프 모달이 열려 있음

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 필터 패널 기본 상태 확인 | 펼쳐진 상태 (Desktop) | `graph-filter-panel` |
| 2 | [▲ 필터] 버튼 클릭 | 0.3초 애니메이션으로 접힘 | `filter-toggle-btn` |
| 3 | 필터 내용 영역 확인 | 숨겨짐 (display: none) | - |
| 4 | 헤더만 표시 확인 | 통계는 계속 표시됨 | `filter-stats` |
| 5 | [▼ 필터] 버튼 클릭 | 0.3초 애니메이션으로 펼쳐짐 | - |
| 6 | 필터 내용 영역 확인 | 다시 표시됨 | - |

**검증 포인트**:
- 애니메이션이 부드럽게 동작
- 헤더는 항상 표시됨

### 4.6 필터 초기화

#### TC-E2E-007: 필터 초기화

**요구사항**: FR-007, AC-08

**테스트 파일**: `tests/e2e/graph-filter.spec.ts`

**전제 조건**:
- 여러 필터가 적용된 상태

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | 카테고리 "개발" 선택 | 필터 적용됨 | `category-checkbox-development` |
| 2 | 상태 "[im]" 선택 | 필터 적용됨 | `status-multiselect` |
| 3 | 계층 뷰 "WP 그룹" 선택 | 필터 적용됨 | `hierarchy-radio-wp` |
| 4 | [초기화] 버튼 클릭 | 모든 필터 해제 | `filter-reset-btn` |
| 5 | 카테고리 확인 | 모두 선택 해제 또는 전체 선택 | - |
| 6 | 상태 확인 | 선택 해제됨 | - |
| 7 | 계층 뷰 확인 | "전체" 선택됨 | `hierarchy-radio-full` |
| 8 | 그래프 확인 | 전체 Task 표시됨 | `dependency-graph-canvas` |
| 9 | URL 확인 | 쿼리 파라미터 제거됨 | - |

**검증 포인트**:
- 모든 필터가 기본값으로 복원됨
- URL도 함께 정리됨

### 4.7 접근성 검증

#### TC-E2E-008: 키보드 탐색 및 초점 Task 비활성화

**요구사항**: BR-003

**테스트 파일**: `tests/e2e/accessibility.spec.ts`

**전제 조건**:
- 의존관계 그래프 모달이 열려 있음

| 단계 | 동작 | 예상 결과 | data-testid |
|------|------|----------|-------------|
| 1 | Tab 키 누름 | 필터 토글 버튼에 포커스 | `filter-toggle-btn` |
| 2 | Tab 키 누름 | 초기화 버튼에 포커스 | `filter-reset-btn` |
| 3 | Tab 키 누름 | 카테고리 Checkbox에 포커스 | `category-checkbox-development` |
| 4 | Space 키 누름 | Checkbox 선택/해제 | - |
| 5 | 초점 Task 선택 안 함 | depth RadioButton disabled 확인 | `focus-depth-radio-1` |
| 6 | 초점 Task 선택 | depth RadioButton enabled 확인 | `focus-task-select` |
| 7 | [적용] 버튼 disabled 확인 | 초점 Task 없을 때 비활성화 | `focus-apply-btn` |

**검증 포인트**:
- Tab 순서가 논리적임
- Space/Enter 키로 모든 컨트롤 조작 가능
- 초점 Task 없을 때 관련 컨트롤 비활성화

---

## 5. 성능 테스트

### 5.1 필터 응답 시간

**요구사항**: NFR-001

**테스트 파일**: `tests/e2e/performance.spec.ts`

| 테스트 케이스 | 조건 | 기준 | 측정 방법 |
|-------------|------|------|----------|
| TC-PERF-001 | 100개 노드, 카테고리 필터 변경 | < 200ms | performance.measure() |
| TC-PERF-002 | 100개 노드, 상태 필터 변경 | < 200ms | performance.measure() |
| TC-PERF-003 | 200개 노드, 필터 변경 | < 500ms | performance.measure() |

**측정 포인트**:
- 필터 변경 이벤트 발생 → 그래프 렌더링 완료

### 5.2 그룹 노드 토글 응답 시간

**요구사항**: NFR-002

**테스트 파일**: `tests/e2e/performance.spec.ts`

| 테스트 케이스 | 조건 | 기준 | 측정 방법 |
|-------------|------|------|----------|
| TC-PERF-004 | 10개 하위 Task, 그룹 축소 | < 100ms | Playwright waitForFunction() |
| TC-PERF-005 | 10개 하위 Task, 그룹 확장 | < 100ms | Playwright waitForFunction() |

**측정 포인트**:
- 그룹 노드 클릭 → 애니메이션 완료

### 5.3 URL 파라미터 복원 시간

**요구사항**: NFR-003

**테스트 파일**: `tests/e2e/performance.spec.ts`

| 테스트 케이스 | 조건 | 기준 | 측정 방법 |
|-------------|------|------|----------|
| TC-PERF-006 | 복잡한 필터 URL 로드 | < 300ms | navigation.timing |

**측정 포인트**:
- 페이지 로드 시작 → 그래프 렌더링 완료 (필터 적용)

---

## 6. 테스트 데이터

### 6.1 샘플 프로젝트 구조

**경로**: `.jjiban/test-project/wbs.md`

```
WP-01: 터미널 시스템 (10개 Task, development)
  TSK-01-01 ~ TSK-01-10 ([ ], [bd], [dd], [im], [vf], [xx] 혼합)

WP-02: 워크플로우 시스템 (15개 Task, development)
  TSK-02-01 ~ TSK-02-15

WP-03: 결함 수정 (30개 Task, defect)
  TSK-03-01 ~ TSK-03-30

WP-04: 인프라 개선 (10개 Task, infrastructure)
  TSK-04-01 ~ TSK-04-10

WP-05: 대시보드 (20개 Task, development)
  TSK-05-01 ~ TSK-05-20

WP-06: 의존관계 시각화 (15개 Task, development)
  TSK-06-01 ~ TSK-06-15
```

**의존관계 예시**:
- TSK-01-01 → TSK-02-01 → TSK-03-01
- TSK-06-01 → TSK-06-02 → TSK-06-03
- TSK-05-01 → TSK-05-05 → TSK-05-10

### 6.2 상태 분포

| 상태 | 개수 | 비율 |
|------|------|------|
| [ ] | 20 | 20% |
| [bd] | 15 | 15% |
| [dd] | 10 | 10% |
| [im] | 30 | 30% |
| [vf] | 15 | 15% |
| [xx] | 10 | 10% |

### 6.3 카테고리 분포

| 카테고리 | 개수 | 비율 |
|----------|------|------|
| development | 60 | 60% |
| defect | 30 | 30% |
| infrastructure | 10 | 10% |

---

## 7. 테스트 실행 계획

### 7.1 단위 테스트 실행

```bash
# 전체 단위 테스트
npm run test:unit

# 특정 파일
npm run test:unit tests/composables/useDependencyGraph.spec.ts

# 커버리지 포함
npm run test:unit -- --coverage
```

### 7.2 E2E 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 특정 파일
npm run test:e2e tests/e2e/graph-filter.spec.ts

# 특정 브라우저
npm run test:e2e -- --project=chromium

# 헤드리스 모드 해제 (디버깅)
npm run test:e2e -- --headed
```

### 7.3 성능 테스트 실행

```bash
npm run test:performance
```

---

## 8. 테스트 체크리스트

### 단위 테스트
- [ ] TC-UNIT-001: 카테고리 필터 적용
- [ ] TC-UNIT-002: 상태 필터 적용
- [ ] TC-UNIT-003: WP 그룹 노드 생성
- [ ] TC-UNIT-004: 빈 그룹 제외
- [ ] TC-UNIT-005: BFS depth 1 탐색
- [ ] TC-UNIT-006: BFS depth 3 탐색
- [ ] TC-UNIT-007: URL 파라미터 직렬화
- [ ] TC-UNIT-008: URL 파라미터 역직렬화
- [ ] TC-UNIT-009: 그룹 축소/확장 상태 토글
- [ ] TC-UNIT-010: 빈 필터 = 전체 표시
- [ ] TC-UNIT-011: URL 파라미터 기본값 생략
- [ ] TC-UNIT-012: 순환 의존성 처리

### E2E 테스트
- [ ] TC-E2E-001: 카테고리 필터 적용
- [ ] TC-E2E-002: 상태 필터 적용
- [ ] TC-E2E-003: 그룹 노드 축소/확장
- [ ] TC-E2E-004: 초점 뷰 적용
- [ ] TC-E2E-005: URL 파라미터 저장 및 복원
- [ ] TC-E2E-006: 필터 패널 접기/펼치기
- [ ] TC-E2E-007: 필터 초기화
- [ ] TC-E2E-008: 키보드 탐색 및 접근성

### 성능 테스트
- [ ] TC-PERF-001: 100개 노드 카테고리 필터 < 200ms
- [ ] TC-PERF-002: 100개 노드 상태 필터 < 200ms
- [ ] TC-PERF-003: 200개 노드 필터 < 500ms
- [ ] TC-PERF-004: 그룹 축소 < 100ms
- [ ] TC-PERF-005: 그룹 확장 < 100ms
- [ ] TC-PERF-006: URL 복원 < 300ms

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: Claude
Template Version: 1.0.0
-->
