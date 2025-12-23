# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **목적**: PRD → 기본설계 → 상세설계 → 테스트의 추적성 확보

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-03 |
| Task명 | 의존관계 그래프 필터 및 계층 접기 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

---

## 1. PRD → 기본설계 추적성

| PRD 요구사항 | 기본설계 요구사항 | 상태 | 비고 |
|-------------|------------------|------|------|
| 11.4 의존관계 필터링 - 카테고리별 필터 | FR-002 | ✅ 완료 | Checkbox 3개 (개발, 결함, 인프라) |
| 11.4 의존관계 필터링 - 상태별 필터 | FR-003 | ✅ 완료 | MultiSelect 드롭다운 ([ ], [bd], [dd], [im], [vf], [xx] 등) |
| 11.4 계층 접기 - WP/ACT 단위 그룹화 | FR-001 | ✅ 완료 | GroupNode 컴포넌트, 축소/확장 기능 |
| 11.4 초점 뷰 - 특정 Task 중심 표시 | FR-004 | ✅ 완료 | BFS depth 1~3 제한 |
| (암묵적) 필터 상태 지속성 | FR-005 | ✅ 완료 | URL 파라미터 저장/복원 |
| (암묵적) 필터 패널 토글 | FR-006 | ✅ 완료 | 접기/펼치기 버튼 |
| (암묵적) 필터 초기화 | FR-007 | ✅ 완료 | 초기화 버튼 |

---

## 2. 기본설계 → 상세설계 추적성

### 2.1 기능 요구사항 매핑

| 기본설계 요구사항 | 상세설계 구현 | 담당 모듈/컴포넌트 | 상태 |
|------------------|--------------|-------------------|------|
| FR-001: WP/ACT 그룹 노드 축소/확장 | GroupNode 컴포넌트, useGroupNodes composable | GroupNode.vue, useGroupNodes.ts | ✅ 설계 완료 |
| FR-002: 카테고리 필터 | GraphFilterPanel - 카테고리 Checkbox | GraphFilterPanel.vue, useDependencyGraph.ts | ✅ 설계 완료 |
| FR-003: 상태 필터 | GraphFilterPanel - 상태 MultiSelect | GraphFilterPanel.vue, useDependencyGraph.ts | ✅ 설계 완료 |
| FR-004: 초점 Task 중심 의존관계 표시 | useFocusView - BFS 알고리즘 | useFocusView.ts, useDependencyGraph.ts | ✅ 설계 완료 |
| FR-005: URL 파라미터 저장 | useGraphFilter - encode/parse 함수 | useGraphFilter.ts, DependencyGraphModal.vue | ✅ 설계 완료 |
| FR-006: 필터 패널 토글 | GraphFilterPanel - isExpanded ref | GraphFilterPanel.vue | ✅ 설계 완료 |
| FR-007: 필터 초기화 버튼 | GraphFilterPanel - reset 이벤트 | GraphFilterPanel.vue, DependencyGraphModal.vue | ✅ 설계 완료 |

### 2.2 비기능 요구사항 매핑

| 기본설계 요구사항 | 상세설계 구현 | 검증 방법 | 상태 |
|------------------|--------------|----------|------|
| NFR-001: 필터 적용 < 200ms | computed 기반 반응형 계산 | 성능 테스트 (100개 노드) | ✅ 설계 완료 |
| NFR-002: 그룹 토글 < 100ms | CSS transition 0.2s | E2E 테스트 | ✅ 설계 완료 |
| NFR-003: URL 복원 < 300ms | parseURLParams 비동기 없음 | 성능 테스트 | ✅ 설계 완료 |

---

## 3. 상세설계 → 구현 추적성

### 3.1 타입 정의 매핑

| 상세설계 타입 | 파일 경로 | 구현 상태 |
|--------------|----------|----------|
| GraphFilter | app/types/graph.ts | 🔄 구현 예정 |
| GroupNodeData | app/types/graph.ts | 🔄 구현 예정 |
| FocusViewConfig | app/types/graph.ts | 🔄 구현 예정 |
| URLParams | app/types/graph.ts | 🔄 구현 예정 |

### 3.2 Composable 함수 매핑

| 상세설계 함수 | 파일 경로 | 구현 상태 |
|--------------|----------|----------|
| useDependencyGraph.buildGraphData (오버로드) | app/composables/useDependencyGraph.ts | 🔄 구현 예정 |
| useDependencyGraph.buildGroupNodes | app/composables/useDependencyGraph.ts | 🔄 구현 예정 |
| useDependencyGraph.buildFocusGraph | app/composables/useDependencyGraph.ts | 🔄 구현 예정 |
| useGraphFilter.encodeFilterToURL | app/composables/useGraphFilter.ts | 🔄 구현 예정 |
| useGraphFilter.parseURLParams | app/composables/useGraphFilter.ts | 🔄 구현 예정 |
| useGroupNodes.toggleGroup | app/composables/useGroupNodes.ts | 🔄 구현 예정 |
| useFocusView.buildFocusGraph | app/composables/useFocusView.ts | 🔄 구현 예정 |

### 3.3 컴포넌트 매핑

| 상세설계 컴포넌트 | 파일 경로 | 구현 상태 |
|------------------|----------|----------|
| GraphFilterPanel | app/components/wbs/graph/GraphFilterPanel.vue | 🔄 구현 예정 |
| GroupNode | app/components/wbs/graph/GroupNode.vue | 🔄 구현 예정 |
| TaskNode | app/components/wbs/graph/TaskNode.vue | 🔄 구현 예정 |
| DependencyGraph (수정) | app/components/wbs/graph/DependencyGraph.client.vue | 🔄 구현 예정 |
| DependencyGraphModal (수정) | app/components/wbs/graph/DependencyGraphModal.vue | 🔄 구현 예정 |

### 3.4 스타일 매핑

| 상세설계 CSS 클래스 | 파일 경로 | 구현 상태 |
|--------------------|----------|----------|
| .graph-filter-panel | app/assets/css/main.css | 🔄 구현 예정 |
| .filter-header | app/assets/css/main.css | 🔄 구현 예정 |
| .category-checkboxes | app/assets/css/main.css | 🔄 구현 예정 |
| .group-node | app/assets/css/main.css | 🔄 구현 예정 |
| .group-node-progress | app/assets/css/main.css | 🔄 구현 예정 |
| .task-node-highlight-* | app/assets/css/main.css | 🔄 구현 예정 |
| .task-node-focus-depth-* | app/assets/css/main.css | 🔄 구현 예정 |

---

## 4. 구현 → 테스트 추적성

### 4.1 단위 테스트 매핑

| 구현 대상 | 테스트 케이스 | 테스트 파일 | 상태 |
|----------|--------------|------------|------|
| useDependencyGraph.buildGraphData | TC-UNIT-001: 카테고리 필터 적용 | tests/composables/useDependencyGraph.spec.ts | 🔄 작성 예정 |
| useDependencyGraph.buildGraphData | TC-UNIT-002: 상태 필터 적용 | tests/composables/useDependencyGraph.spec.ts | 🔄 작성 예정 |
| useDependencyGraph.buildGroupNodes | TC-UNIT-003: WP 그룹 노드 생성 | tests/composables/useDependencyGraph.spec.ts | 🔄 작성 예정 |
| useDependencyGraph.buildGroupNodes | TC-UNIT-004: 빈 그룹 제외 | tests/composables/useDependencyGraph.spec.ts | 🔄 작성 예정 |
| useFocusView.buildFocusGraph | TC-UNIT-005: BFS depth 1 탐색 | tests/composables/useFocusView.spec.ts | 🔄 작성 예정 |
| useFocusView.buildFocusGraph | TC-UNIT-006: BFS depth 3 탐색 | tests/composables/useFocusView.spec.ts | 🔄 작성 예정 |
| useGraphFilter.encodeFilterToURL | TC-UNIT-007: URL 파라미터 직렬화 | tests/composables/useGraphFilter.spec.ts | 🔄 작성 예정 |
| useGraphFilter.parseURLParams | TC-UNIT-008: URL 파라미터 역직렬화 | tests/composables/useGraphFilter.spec.ts | 🔄 작성 예정 |
| useGroupNodes.toggleGroup | TC-UNIT-009: 그룹 축소/확장 상태 토글 | tests/composables/useGroupNodes.spec.ts | 🔄 작성 예정 |

### 4.2 E2E 테스트 매핑

| 기능 요구사항 | 테스트 시나리오 | 테스트 파일 | 상태 |
|--------------|----------------|------------|------|
| FR-002 | TC-E2E-001: 카테고리 필터 적용 | tests/e2e/graph-filter.spec.ts | 🔄 작성 예정 |
| FR-003 | TC-E2E-002: 상태 필터 적용 | tests/e2e/graph-filter.spec.ts | 🔄 작성 예정 |
| FR-001 | TC-E2E-003: 그룹 노드 축소/확장 | tests/e2e/group-node.spec.ts | 🔄 작성 예정 |
| FR-004 | TC-E2E-004: 초점 뷰 적용 | tests/e2e/focus-view.spec.ts | 🔄 작성 예정 |
| FR-005 | TC-E2E-005: URL 파라미터 복원 | tests/e2e/url-sync.spec.ts | 🔄 작성 예정 |
| FR-006 | TC-E2E-006: 필터 패널 토글 | tests/e2e/graph-filter.spec.ts | 🔄 작성 예정 |
| FR-007 | TC-E2E-007: 필터 초기화 | tests/e2e/graph-filter.spec.ts | 🔄 작성 예정 |

---

## 5. 비즈니스 규칙 추적성

| 규칙 ID | 규칙 설명 | 구현 위치 | 검증 테스트 | 상태 |
|---------|----------|----------|------------|------|
| BR-001 | 빈 필터 = 전체 표시 | useDependencyGraph.buildGraphData | TC-UNIT-010 | 🔄 구현 예정 |
| BR-002 | 그룹 내 Task 0개 시 그룹 제외 | useDependencyGraph.buildGroupNodes | TC-UNIT-004 | 🔄 구현 예정 |
| BR-003 | 초점 Task 선택 없으면 depth 비활성 | GraphFilterPanel.vue | TC-E2E-008 | 🔄 구현 예정 |
| BR-004 | URL 파라미터 기본값 생략 | useGraphFilter.encodeFilterToURL | TC-UNIT-011 | 🔄 구현 예정 |
| BR-005 | 순환 의존성 처리 | useDependencyGraph.calculateLevels | TC-UNIT-012 | 🔄 구현 예정 |

---

## 6. 인수 기준 추적성

### 6.1 기본설계 인수 기준 매핑

| 인수 기준 | 상세설계 구현 | 검증 테스트 | 상태 |
|----------|--------------|------------|------|
| AC-01: GraphFilterPanel 컴포넌트 생성 및 모달에 통합 | GraphFilterPanel.vue, DependencyGraphModal.vue 수정 | TC-E2E-006 | 🔄 구현 예정 |
| AC-02: 카테고리 필터 적용 시 해당 카테고리 Task만 표시 | useDependencyGraph.buildGraphData | TC-E2E-001 | 🔄 구현 예정 |
| AC-03: 상태 필터 적용 시 해당 상태 Task만 표시 | useDependencyGraph.buildGraphData | TC-E2E-002 | 🔄 구현 예정 |
| AC-04: WP 그룹 뷰에서 그룹 노드 클릭 시 축소/확장 동작 | GroupNode.vue, useGroupNodes.toggleGroup | TC-E2E-003 | 🔄 구현 예정 |
| AC-05: 초점 Task 선택 시 depth 제한 내 Task만 표시 | useFocusView.buildFocusGraph | TC-E2E-004 | 🔄 구현 예정 |
| AC-06: 필터 설정이 URL 파라미터에 반영됨 | useGraphFilter.encodeFilterToURL, DependencyGraphModal watch | TC-E2E-005 | 🔄 구현 예정 |
| AC-07: URL 파라미터로 페이지 로드 시 필터 상태 복원 | useGraphFilter.parseURLParams, DependencyGraphModal onMounted | TC-E2E-005 | 🔄 구현 예정 |
| AC-08: 필터 초기화 버튼 클릭 시 전체 그래프 표시 | GraphFilterPanel reset 이벤트 | TC-E2E-007 | 🔄 구현 예정 |

---

## 7. 추적성 매트릭스 (전체 매핑)

| PRD | 기본설계 | 상세설계 | 구현 | 테스트 | 상태 |
|-----|---------|---------|------|--------|------|
| 11.4 카테고리 필터 | FR-002 | GraphFilterPanel, useDependencyGraph | GraphFilterPanel.vue, useDependencyGraph.ts | TC-E2E-001 | ✅ 추적 완료 |
| 11.4 상태 필터 | FR-003 | GraphFilterPanel, useDependencyGraph | GraphFilterPanel.vue, useDependencyGraph.ts | TC-E2E-002 | ✅ 추적 완료 |
| 11.4 계층 접기 | FR-001 | GroupNode, useGroupNodes | GroupNode.vue, useGroupNodes.ts | TC-E2E-003 | ✅ 추적 완료 |
| 11.4 초점 뷰 | FR-004 | useFocusView BFS | useFocusView.ts, useDependencyGraph.ts | TC-E2E-004 | ✅ 추적 완료 |
| (암묵적) URL 저장 | FR-005 | useGraphFilter | useGraphFilter.ts, DependencyGraphModal.vue | TC-E2E-005 | ✅ 추적 완료 |
| (암묵적) 패널 토글 | FR-006 | GraphFilterPanel isExpanded | GraphFilterPanel.vue | TC-E2E-006 | ✅ 추적 완료 |
| (암묵적) 초기화 | FR-007 | GraphFilterPanel reset | GraphFilterPanel.vue | TC-E2E-007 | ✅ 추적 완료 |

---

## 8. 추적성 검증 체크리스트

- [x] PRD 요구사항이 기본설계에 모두 반영됨
- [x] 기본설계 요구사항이 상세설계에 모두 반영됨
- [x] 상세설계 구현 항목이 파일 경로로 매핑됨
- [x] 모든 기능 요구사항에 대한 테스트 케이스 정의됨
- [x] 비즈니스 규칙이 구현 위치 및 검증 테스트와 매핑됨
- [x] 인수 기준이 구현 및 테스트와 매핑됨
- [ ] 구현 완료 후 각 항목의 상태를 ✅로 변경 (구현 단계에서 수행)

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban개선/prd.md` (섹션 11.4)

---

<!--
author: Claude
Template Version: 1.0.0
-->
