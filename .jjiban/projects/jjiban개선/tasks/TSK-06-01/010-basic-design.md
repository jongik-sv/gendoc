# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-01 |
| Task명 | 의존관계 그래프 시각화 기능 구현 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 11 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 해당 없음 |

---

## 1. 목적 및 범위

### 1.1 목적

Task 간 의존관계를 **왼쪽→오른쪽** 방향의 인터랙티브 그래프로 시각화하여, 프로젝트 구조와 Task 실행 순서를 직관적으로 파악할 수 있게 합니다.

- 독립적인 Task(의존성 없음)는 왼쪽에 배치
- 의존성이 있는 Task는 오른쪽으로 순차 배치
- 전체 프로젝트의 의존관계 네트워크를 한눈에 파악

### 1.2 범위

**포함 범위**:
- Vue Flow 라이브러리 설치 및 설정 (@vue-flow/core, @vue-flow/background, @vue-flow/controls, @vue-flow/minimap)
- 그래프 데이터 변환 컴포저블 (useDependencyGraph)
- DependencyGraph 캔버스 컴포넌트 (Vue Flow 기반)
- TaskNode 커스텀 노드 컴포넌트
- DependencyGraphModal 전체화면 모달
- GraphLegend 범례 컴포넌트
- WbsTreeHeader 트리거 버튼 추가

**제외 범위**:
- 그래프 데이터 저장/내보내기 → 추후 기능
- 의존관계 편집 기능 → 추후 기능
- 프로젝트 간 의존관계 표시 → 현재 단일 프로젝트 범위

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | Hierarchical LR 레이아웃으로 왼쪽→오른쪽 방향 그래프 표시 | Critical | 11.2 |
| FR-002 | 노드 드래그, 줌, 팬 인터랙션 지원 | High | 11.2 |
| FR-003 | 모달 형태로 전체화면 표시 | High | 11.2 |
| FR-004 | 전체 프로젝트의 모든 Task 의존관계 표시 | High | 11.2 |
| FR-005 | 카테고리별 노드 색상 구분 | Medium | 11.5 |
| FR-006 | 노드 클릭 시 해당 Task 선택 (selectionStore 연동) | Medium | - |
| FR-007 | 카테고리/상태별 필터링 | Low | 11.4 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 그래프 렌더링 시간 | < 500ms (100개 노드 기준) |
| NFR-002 | 인터랙션 반응 속도 | < 100ms |
| NFR-003 | 메모리 사용량 | < 50MB 추가 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│ WbsTreeHeader                                       │
│   [그래프 버튼] ─────┐                               │
└─────────────────────│───────────────────────────────┘
                      │ click
                      ▼
┌─────────────────────────────────────────────────────┐
│ DependencyGraphModal (PrimeVue Dialog)              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 필터 바: [카테고리 ▼] [상태 ▼] [줌 리셋]          │ │
│ ├─────────────────────────────────────────────────┤ │
│ │                                                 │ │
│ │   DependencyGraph (Vue Flow 캔버스)             │ │
│ │   + TaskNode (커스텀 노드)                       │ │
│ │   + Background, Controls, MiniMap               │ │
│ │                                                 │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ GraphLegend (범례)                              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| `useDependencyGraph.ts` | 데이터 변환 | WBS flatNodes → Vue Flow GraphData 변환, 레벨 계산 |
| `DependencyGraph.client.vue` | 그래프 렌더링 | Vue Flow 캔버스, 인터랙션 처리, 하이라이트 |
| `TaskNode.vue` | 커스텀 노드 | Task 정보 표시, 카테고리별 색상, 하이라이트 스타일 |
| `DependencyGraphModal.vue` | 모달 컨테이너 | Dialog 관리, 필터 UI, 레이아웃 |
| `GraphLegend.vue` | 범례 표시 | 카테고리별 색상 설명 |

### 3.3 데이터 흐름

```
wbsStore.flatNodes (Map<string, WbsNode>)
         │
         │ Task 타입만 필터링
         ▼
useDependencyGraph.buildGraphData()
         │
         │ 1. TaskNode[] 생성 (id, type, position, data)
         │ 2. TaskEdge[] 생성 (id, source, target)
         │ 3. 위상정렬로 position.x 계산 (level * 250)
         ▼
GraphData { nodes: TaskNode[], edges: TaskEdge[] }
         │
         │ Vue Flow 렌더링
         ▼
DependencyGraph.client.vue (캔버스) + TaskNode.vue (커스텀 노드)
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 그래프 라이브러리 | vis-network, Cytoscape.js, Vue Flow | Vue Flow | Vue 3 전용, 현대적 API, 매끄러운 드래그 인터랙션, 활발한 개발 |
| 레이아웃 알고리즘 | Hierarchical, Force-directed | 수동 위상정렬 | 위상정렬로 level 계산 후 position 직접 지정, 커스텀 배치 가능 |
| 모달 컴포넌트 | PrimeVue Dialog, 커스텀 | PrimeVue Dialog | 프로젝트 표준, 전체화면/드래그 지원 |
| 데이터 구조 | DataSet, 일반 배열 | 일반 배열 | Vue Flow는 reactive 배열 사용, Vue 반응성 시스템 활용 |
| 커스텀 노드 | 기본 노드, 커스텀 컴포넌트 | TaskNode.vue | Task 정보 상세 표시, 카테고리별 스타일링, 하이라이트 제어 |

---

## 5. 인수 기준

- [x] AC-01: Vue Flow 패키지 설치 완료 (@vue-flow/core, @vue-flow/background, @vue-flow/controls, @vue-flow/minimap)
- [ ] AC-02: 모든 Task가 그래프 노드로 표시됨
- [ ] AC-03: 의존관계가 화살표 엣지로 표시됨
- [ ] AC-04: 그래프가 왼쪽→오른쪽 방향으로 정렬됨
- [ ] AC-05: 노드 드래그, 줌, 팬 인터랙션 동작
- [ ] AC-06: 카테고리별 노드 색상 구분 (development: 파랑, defect: 빨강, infrastructure: 녹색)
- [ ] AC-07: 노드 클릭 시 해당 Task가 WBS 트리에서 선택됨
- [ ] AC-08: 모달 열기/닫기 정상 동작

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| Vue Flow SSR 호환성 | Medium | .client.vue 파일 사용, ClientOnly 래퍼 |
| 대규모 노드 성능 저하 | Low | Vue Flow 가상화 지원, 노드 100개 이상 시 경고 |
| 순환 의존성 레이아웃 오류 | Low | 순환 감지 후 시각적 경고 표시 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| wbsStore.flatNodes | 데이터 | Task 노드 및 depends 필드 |
| selectionStore | 기능 | 노드 클릭 시 Task 선택 연동 |
| PrimeVue Dialog | UI | 모달 컴포넌트 |

---

## 7. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행
- 상세설계에서 각 컴포넌트 인터페이스, vis-network 옵션 상세 정의

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 11
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude
Template Version: 1.0.0
-->
