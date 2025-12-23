# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * 코드 작성 금지 (시그니처 표, 다이어그램만 사용)
> * 기본설계 FR/NFR과 일관성 유지
> * 구현 가능한 수준의 상세 명세

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-01 |
| Task명 | 의존관계 그래프 시각화 기능 구현 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 11 |

---

## 1. 아키텍처 상세

### 1.1 컴포넌트 구조

```
app/
├── types/
│   └── graph.ts                          # 그래프 관련 타입 정의
├── composables/
│   └── useDependencyGraph.ts             # 데이터 변환 컴포저블
└── components/
    └── wbs/
        ├── WbsTreeHeader.vue             # 수정: 그래프 버튼 추가
        └── graph/
            ├── DependencyGraphModal.vue  # 모달 컨테이너
            ├── DependencyGraph.vue       # vis-network 캔버스
            └── GraphLegend.vue           # 범례 컴포넌트
```

### 1.2 의존성 다이어그램

```
┌──────────────────────────────────────────────────────────────────┐
│                           External                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ vis-network │  │  vis-data   │  │ PrimeVue Dialog/Select  │   │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘   │
└─────────│────────────────│─────────────────────│─────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DependencyGraph.vue                           │
│   - vis.Network 인스턴스 생성/관리                                │
│   - 노드/엣지 렌더링                                              │
│   - 인터랙션 이벤트 처리                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DependencyGraphModal.vue                         │
│   - PrimeVue Dialog 래핑                                         │
│   - 필터링 UI (카테고리, 상태)                                    │
│   - 줌 리셋 버튼                                                  │
├──────────────────────────┬──────────────────────────────────────┤
│      GraphLegend.vue     │       useDependencyGraph.ts          │
│   - 카테고리별 색상 범례   │   - flatNodes → GraphData 변환       │
│   - 상태 설명             │   - 위상정렬 레벨 계산                │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       wbsStore                                   │
│   - flatNodes: Map<string, WbsNode>                             │
│   - isMultiProjectMode: boolean                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 타입 정의

### 2.1 app/types/graph.ts

| 타입명 | 설명 | 필드 |
|--------|------|------|
| `GraphNode` | vis-network 노드 | id, label, title, group, level, color, font |
| `GraphEdge` | vis-network 엣지 | id, from, to, arrows, color |
| `GraphData` | 그래프 전체 데이터 | nodes: DataSet, edges: DataSet |
| `GraphFilter` | 필터링 옵션 | categories: string[], statuses: string[] |
| `GraphOptions` | vis-network 옵션 | layout, physics, interaction, nodes, edges, groups |

### 2.2 GraphNode 상세

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| id | string | Task ID | "TSK-06-01" |
| label | string | 노드 라벨 (줄바꿈 포함) | "TSK-06-01\n의존관계 그래프" |
| title | string | 호버 툴팁 (HTML) | "<b>TSK-06-01</b><br>상태: [bd]" |
| group | string | 카테고리 (색상 그룹) | "development" |
| level | number | 위상정렬 레벨 (LR 배치) | 0, 1, 2, ... |
| color | object | 커스텀 색상 (optional) | { background, border } |
| font | object | 폰트 설정 (optional) | { color, size } |

### 2.3 GraphEdge 상세

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| id | string | 엣지 고유 ID | "TSK-01-01→TSK-01-02" |
| from | string | 출발 노드 ID (의존 대상) | "TSK-01-01" |
| to | string | 도착 노드 ID (현재 Task) | "TSK-01-02" |
| arrows | string | 화살표 방향 | "to" |
| color | object | 엣지 색상 | { color, highlight, hover } |

---

## 3. 컴포저블 설계

### 3.1 useDependencyGraph.ts

| 메서드 | 입력 | 출력 | 설명 |
|--------|------|------|------|
| buildGraphData | flatNodes: Map, filter?: GraphFilter | GraphData | 노드/엣지 데이터 생성 |
| calculateLevels | taskNodes: Map | Map<string, number> | 위상정렬 레벨 계산 |
| getNodeColor | status: string | { background, border } | 상태별 노드 색상 |
| truncateTitle | title: string, maxLen: number | string | 제목 자르기 |
| buildTooltip | node: WbsNode | string | HTML 툴팁 생성 |

### 3.2 buildGraphData 로직

```
입력: wbsStore.flatNodes (Map<string, WbsNode>)

1. Task 노드 필터링
   └── type === 'task' 인 노드만 추출
   └── isMultiProjectMode 시 projectId:taskId 복합키 처리

2. 필터 적용 (optional)
   └── categories 필터: node.category in filter.categories
   └── statuses 필터: node.status in filter.statuses

3. 레벨 계산 (위상정렬)
   └── calculateLevels(taskNodes) 호출
   └── 의존성 없는 노드: level = 0
   └── 의존성 있는 노드: level = max(deps.level) + 1

4. GraphNode 배열 생성
   └── 각 taskNode에 대해:
       - id: taskId (또는 projectId:taskId)
       - label: taskId + '\n' + truncateTitle(title, 15)
       - title: buildTooltip(node)
       - group: node.category || 'development'
       - level: levelMap.get(taskId)

5. GraphEdge 배열 생성
   └── 각 taskNode.depends에 대해:
       - depends 문자열 쉼표 split
       - 유효한 의존 ID만 엣지 생성
       - from: depId, to: taskId, arrows: 'to'

6. DataSet 래핑
   └── nodes: new DataSet(nodeArray)
   └── edges: new DataSet(edgeArray)

출력: { nodes: DataSet, edges: DataSet }
```

### 3.3 calculateLevels 알고리즘

```
입력: taskNodes (Map<string, WbsNode>)

1. 초기화
   └── inDegree: Map<string, number> (진입 차수)
   └── adjacency: Map<string, string[]> (인접 리스트)
   └── levels: Map<string, number> (결과)

2. 그래프 구축
   └── 모든 노드 진입 차수 0 초기화
   └── depends 파싱하여 adjacency, inDegree 갱신

3. BFS 레벨 할당
   └── 진입 차수 0인 노드 큐에 추가, level = 0
   └── 큐에서 노드 꺼내며:
       - 인접 노드 진입 차수 감소
       - 새 레벨 = max(현재 레벨, 부모 레벨 + 1)
       - 진입 차수 0 되면 큐에 추가

4. 순환 의존성 처리
   └── 방문하지 않은 노드 있으면 순환
   └── 순환 노드는 최대 레벨 + 1 할당

출력: Map<string, number>
```

---

## 4. 컴포넌트 설계

### 4.1 DependencyGraph.vue

#### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| graphData | GraphData | Y | - | 노드/엣지 데이터 |
| options | Partial<GraphOptions> | N | defaultOptions | vis-network 옵션 오버라이드 |
| height | string | N | "100%" | 캔버스 높이 |

#### Emits

| Event | Payload | 설명 |
|-------|---------|------|
| nodeClick | { nodeId: string } | 노드 클릭 |
| nodeDoubleClick | { nodeId: string } | 노드 더블클릭 |
| stabilized | void | 레이아웃 안정화 완료 |

#### Exposed Methods

| Method | 인자 | 반환 | 설명 |
|--------|------|------|------|
| fit | void | void | 전체 노드 화면에 맞춤 |
| zoomIn | void | void | 확대 |
| zoomOut | void | void | 축소 |
| resetZoom | void | void | 줌 리셋 (fit 호출) |
| focusNode | nodeId: string | void | 특정 노드로 포커스 |

#### 내부 상태

| 상태 | 타입 | 설명 |
|------|------|------|
| networkInstance | Network \| null | vis.Network 인스턴스 |
| isStabilizing | boolean | 안정화 진행 중 여부 |
| stabilizationProgress | number | 안정화 진행률 (0-100) |

### 4.2 DependencyGraphModal.vue

#### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| visible | boolean | Y | - | 모달 표시 여부 (v-model) |

#### Emits

| Event | Payload | 설명 |
|-------|---------|------|
| update:visible | boolean | 모달 닫힘 |
| taskSelect | taskId: string | Task 선택 (노드 클릭) |

#### 내부 상태

| 상태 | 타입 | 설명 |
|------|------|------|
| selectedCategories | string[] | 선택된 카테고리 필터 |
| selectedStatuses | string[] | 선택된 상태 필터 |
| graphRef | ComponentRef | DependencyGraph 컴포넌트 ref |

### 4.3 GraphLegend.vue

#### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| showStatus | boolean | N | false | 상태별 범례 표시 여부 |

#### 표시 내용

| 카테고리 | 색상 | 라벨 |
|----------|------|------|
| development | #3b82f6 | 개발 |
| defect | #ef4444 | 결함 |
| infrastructure | #22c55e | 인프라 |

### 4.4 WbsTreeHeader.vue (수정)

#### 추가 요소

| 요소 | 타입 | 위치 | 동작 |
|------|------|------|------|
| 그래프 버튼 | Button | 검색박스 우측 | 클릭 시 DependencyGraphModal 열기 |

#### 추가 상태

| 상태 | 타입 | 설명 |
|------|------|------|
| showGraphModal | boolean | 그래프 모달 표시 여부 |

---

## 5. vis-network 옵션 설정

### 5.1 Layout 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| hierarchical.enabled | true | Hierarchical 레이아웃 활성화 |
| hierarchical.direction | 'LR' | 왼쪽 → 오른쪽 방향 |
| hierarchical.sortMethod | 'directed' | 의존관계 기반 정렬 |
| hierarchical.levelSeparation | 200 | 레벨 간 거리 (px) |
| hierarchical.nodeSpacing | 100 | 노드 간 간격 (px) |
| hierarchical.treeSpacing | 200 | 트리 간 간격 (px) |
| hierarchical.blockShifting | true | 블록 이동 최적화 |
| hierarchical.edgeMinimization | true | 엣지 교차 최소화 |
| hierarchical.parentCentralization | true | 부모 노드 중앙 배치 |

### 5.2 Physics 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| enabled | false | Hierarchical 사용 시 비활성화 |

### 5.3 Interaction 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| dragNodes | true | 노드 드래그 허용 |
| dragView | true | 뷰 드래그 (팬) 허용 |
| zoomView | true | 마우스 휠 줌 허용 |
| hover | true | 호버 효과 활성화 |
| tooltipDelay | 200 | 툴팁 표시 지연 (ms) |
| multiselect | false | 다중 선택 비활성화 |
| navigationButtons | false | 네비게이션 버튼 숨김 |
| keyboard.enabled | true | 키보드 네비게이션 |

### 5.4 Nodes 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| shape | 'box' | 사각형 노드 |
| margin | 10 | 내부 여백 |
| font.size | 12 | 폰트 크기 |
| font.face | 'Pretendard, sans-serif' | 폰트 패밀리 |
| font.color | '#e5e7eb' | 폰트 색상 (gray-200) |
| borderWidth | 2 | 테두리 두께 |
| shadow | true | 그림자 효과 |

### 5.5 Edges 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| arrows.to.enabled | true | 화살표 표시 |
| arrows.to.scaleFactor | 0.8 | 화살표 크기 |
| smooth.type | 'cubicBezier' | 곡선 타입 |
| smooth.forceDirection | 'horizontal' | 수평 방향 강제 |
| color.color | '#6c9bcf' | 기본 색상 |
| color.highlight | '#3b82f6' | 하이라이트 색상 |
| color.hover | '#93c5fd' | 호버 색상 |
| width | 2 | 선 두께 |

### 5.6 Groups 옵션 (카테고리별 색상)

| 그룹 | background | border |
|------|------------|--------|
| development | #3b82f6 | #2563eb |
| defect | #ef4444 | #dc2626 |
| infrastructure | #22c55e | #16a34a |

---

## 6. UI/UX 상세

### 6.1 모달 레이아웃

```
+------------------------------------------------------------------+
| 의존관계 그래프                                              [X]  |
+------------------------------------------------------------------+
| ┌────────────┐ ┌────────────┐ ┌─────────────────────────────────┐|
| │ 카테고리 ▼ │ │  상태 ▼   │ │  [줌인] [줌아웃] [리셋]        ││
| └────────────┘ └────────────┘ └─────────────────────────────────┘|
+------------------------------------------------------------------+
|                                                                   |
|                                                                   |
|    ┌─────────┐      ┌─────────┐      ┌─────────┐                 |
|    │ TSK-01  │ ───> │ TSK-02  │ ───> │ TSK-04  │                 |
|    │ 환경설정 │      │ 파서    │      │ 통합    │                 |
|    └─────────┘      └─────────┘      └─────────┘                 |
|         │                                  ↑                      |
|         │           ┌─────────┐           │                      |
|         └─────────> │ TSK-03  │ ──────────┘                      |
|                     │ API     │                                   |
|                     └─────────┘                                   |
|                                                                   |
|                                                                   |
+------------------------------------------------------------------+
| ● 개발 (파랑)   ● 결함 (빨강)   ● 인프라 (녹색)                   |
+------------------------------------------------------------------+
```

### 6.2 노드 스타일 상세

| 상태 | 테두리 스타일 | 투명도 | 설명 |
|------|--------------|--------|------|
| [ ] Todo | 점선 (dashes: true) | 1.0 | 시작 전 |
| [bd]/[dd]/[im] 등 | 실선 | 1.0 | 진행 중 |
| [xx] Done | 실선 + 굵게 | 0.6 | 완료 |

### 6.3 호버 툴팁 내용

```html
<div class="graph-tooltip">
  <strong>{Task ID}</strong><br>
  {Task 제목}<br>
  <hr>
  상태: {상태명}<br>
  카테고리: {카테고리}<br>
  담당자: {담당자 또는 '-'}
</div>
```

### 6.4 인터랙션 흐름

| 동작 | 결과 |
|------|------|
| 노드 클릭 | selectionStore.selectTask(taskId) 호출 → WBS 트리에서 선택 |
| 노드 더블클릭 | 모달 닫기 + 해당 Task 상세 패널로 포커스 |
| 노드 호버 | 툴팁 표시 + 연결된 엣지 하이라이트 |
| 배경 클릭 | 선택 해제 |
| 마우스 휠 | 줌 인/아웃 |
| 드래그 (노드) | 노드 위치 이동 |
| 드래그 (배경) | 뷰 팬 |

---

## 7. 에러 처리

### 7.1 에러 시나리오

| 시나리오 | 처리 |
|---------|------|
| flatNodes 비어있음 | "표시할 Task가 없습니다" 메시지 |
| 순환 의존성 감지 | 콘솔 경고 + 순환 노드 빨간 테두리 |
| vis-network 로드 실패 | ClientOnly fallback 메시지 |
| 대규모 노드 (100+) | 안정화 진행률 표시 |

### 7.2 SSR 대응

```
ClientOnly 래퍼 사용:
- vis-network는 브라우저 전용 (window 객체 필요)
- <ClientOnly> 컴포넌트로 DependencyGraph 래핑
- fallback: "그래프 로딩 중..." 스피너
```

---

## 8. 일관성 검증

### CHK-PRD: PRD ↔ 기본설계

| 검증 항목 | PRD 섹션 | 기본설계 | 결과 |
|----------|---------|---------|------|
| Hierarchical LR | 11.2 | FR-001 | PASS |
| 인터랙티브 | 11.2 | FR-002 | PASS |
| 모달 형태 | 11.2 | FR-003 | PASS |
| 전체 프로젝트 | 11.2 | FR-004 | PASS |
| 노드 색상 | 11.5 | FR-005 | PASS |
| vis-network | 11.3 | 기술적 결정 | PASS |

### CHK-BD: 기본설계 ↔ 상세설계

| 검증 항목 | 기본설계 | 상세설계 | 결과 |
|----------|---------|---------|------|
| useDependencyGraph | 3.2 | 섹션 3 | PASS |
| DependencyGraph.vue | 3.2 | 섹션 4.1 | PASS |
| DependencyGraphModal.vue | 3.2 | 섹션 4.2 | PASS |
| GraphLegend.vue | 3.2 | 섹션 4.3 | PASS |
| WbsTreeHeader 수정 | 3.1 | 섹션 4.4 | PASS |
| 데이터 흐름 | 3.3 | 섹션 3.2 | PASS |

---

## 9. 다음 단계

- `/wf:build` 명령어로 구현 진행
- 구현 순서:
  1. vis-network, vis-data 패키지 설치
  2. app/types/graph.ts 타입 정의
  3. useDependencyGraph.ts 컴포저블
  4. DependencyGraph.vue 캔버스
  5. GraphLegend.vue 범례
  6. DependencyGraphModal.vue 모달
  7. WbsTreeHeader.vue 버튼 추가

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 11
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`

---

<!--
author: Claude
Template Version: 1.0.0
-->
