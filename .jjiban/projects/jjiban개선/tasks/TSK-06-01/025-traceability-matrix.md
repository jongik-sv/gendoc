# 추적성 매트릭스 (025-traceability-matrix.md)

**Task ID:** TSK-06-01 | **작성일:** 2025-12-17

---

## 요구사항 → 설계 → 테스트 추적

| FR ID | 요구사항 | PRD | 기본설계 | 상세설계 | 테스트 |
|-------|----------|-----|---------|---------|--------|
| FR-001 | Hierarchical LR 레이아웃 | 11.2 | 3.1 | 5.1 | TC-001 |
| FR-002 | 노드 드래그/줌/팬 | 11.2 | 3.1 | 5.3 | TC-002 |
| FR-003 | 모달 형태 전체화면 | 11.2 | 3.1 | 4.2 | TC-003 |
| FR-004 | 전체 Task 의존관계 표시 | 11.2 | 3.3 | 3.2 | TC-004 |
| FR-005 | 카테고리별 노드 색상 | 11.5 | 3.2 | 5.6 | TC-005 |
| FR-006 | 노드 클릭 → Task 선택 | - | 6.2 | 6.4 | TC-006 |
| FR-007 | 필터링 (카테고리/상태) | 11.4 | - | 4.2 | TC-007 |

---

## 컴포넌트 → 파일 추적

| 컴포넌트 | 파일 경로 | 의존 대상 |
|----------|----------|----------|
| useDependencyGraph | app/composables/useDependencyGraph.ts | wbsStore |
| DependencyGraph | app/components/wbs/graph/DependencyGraph.vue | vis-network, useDependencyGraph |
| DependencyGraphModal | app/components/wbs/graph/DependencyGraphModal.vue | DependencyGraph, GraphLegend |
| GraphLegend | app/components/wbs/graph/GraphLegend.vue | - |
| WbsTreeHeader (수정) | app/components/wbs/WbsTreeHeader.vue | DependencyGraphModal |

---

## 인수 기준 → 테스트 추적

| AC ID | 인수 기준 | 테스트 케이스 |
|-------|----------|--------------|
| AC-01 | vis-network 설치 완료 | TC-001 |
| AC-02 | 모든 Task 노드 표시 | TC-004 |
| AC-03 | 의존관계 화살표 엣지 | TC-004 |
| AC-04 | 왼쪽→오른쪽 정렬 | TC-001 |
| AC-05 | 드래그/줌/팬 동작 | TC-002 |
| AC-06 | 카테고리별 색상 구분 | TC-005 |
| AC-07 | 노드 클릭 → Task 선택 | TC-006 |
| AC-08 | 모달 열기/닫기 | TC-003 |

---

<!--
author: Claude
-->
