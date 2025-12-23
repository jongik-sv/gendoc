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
| Task ID | TSK-06-03 |
| Task명 | 의존관계 그래프 필터 및 계층 접기 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 11.4 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 해당 없음 |
| 선행 Task | `TSK-06-01/010-basic-design.md` | 전체 (기존 그래프 구조) |

---

## 1. 목적 및 범위

### 1.1 목적

TSK-06-01에서 구현된 의존관계 그래프에 **필터링, 계층 접기, 초점 뷰** 기능을 추가하여, 대규모 프로젝트에서도 의존관계를 효과적으로 탐색할 수 있게 합니다.

- **대규모 프로젝트 대응**: 100개 이상 Task가 있어도 가독성 유지
- **계층적 탐색**: WP/ACT 단위로 그룹화하여 구조 파악 용이
- **초점 뷰**: 특정 Task 중심으로 직접 연관된 의존관계만 표시
- **지속성**: 필터 설정을 URL에 저장하여 뷰 공유 가능

### 1.2 범위

**포함 범위**:
- WP/ACT 단위 그룹 노드 생성 및 축소/확장 기능
- 카테고리/상태별 필터 UI 및 적용 로직
- 특정 Task 중심 의존관계 표시 (depth 제한)
- 필터 상태 URL 파라미터 저장/복원
- GraphFilter 패널 UI 개선 (토글, 초기화 버튼)

**제외 범위**:
- 의존관계 편집 기능 → 추후 기능
- 그래프 레이아웃 커스터마이징 (수동 배치 저장) → 추후 기능
- 프로젝트 간 의존관계 → 현재 단일 프로젝트 범위

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WP/ACT 단위 그룹 노드로 축소/확장 | High | 11.4 |
| FR-002 | 카테go리별 필터 (development, defect, infrastructure) | High | 11.4 |
| FR-003 | 상태별 필터 ([ ], [bd], [dd], [im], [vf], [xx] 등) | High | 11.4 |
| FR-004 | 특정 Task 중심 의존관계만 표시 (depth 1~3 제한) | Medium | wbs.md |
| FR-005 | 필터 상태 URL 파라미터 저장 (?categories=dev,inf&statuses=im,vf) | Medium | wbs.md |
| FR-006 | 필터 패널 토글 (접기/펼치기) | Low | - |
| FR-007 | 필터 초기화 버튼 (전체 보기) | Low | - |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 필터 적용 응답 속도 | < 200ms (100개 노드 기준) |
| NFR-002 | 그룹 노드 축소/확장 반응 | < 100ms |
| NFR-003 | URL 파라미터 복원 시간 | < 300ms |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│ DependencyGraphModal                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ GraphFilterPanel (확장됨)                       │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ [필터 토글] [초기화]                        │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ 카테고리: ☑ 개발 ☑ 결함 ☑ 인프라           │ │ │
│ │ │ 상태: ☑ Todo ☑ 설계 ☑ 구현 ☑ 검증 ☑ 완료  │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ 계층 뷰: ⭘ 전체 ◉ WP 그룹 ⭘ ACT 그룹      │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ 초점 Task: [TSK-06-03 ▼]  Depth: [2 ▼]    │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ DependencyGraph (Vue Flow 캔버스)               │ │
│ │   + TaskNode (개별 Task)                        │ │
│ │   + GroupNode (WP/ACT 그룹)                     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 신규/수정 |
|----------|------|----------|
| `GraphFilterPanel.vue` | 필터 UI (카테고리, 상태, 계층, 초점) | 신규 |
| `GroupNode.vue` | WP/ACT 그룹 노드 표시 | 신규 |
| `useDependencyGraph.ts` | 필터/그룹 데이터 변환 로직 확장 | 수정 |
| `DependencyGraph.client.vue` | 그룹 노드 지원, 축소/확장 이벤트 | 수정 |
| `DependencyGraphModal.vue` | URL 파라미터 저장/복원 | 수정 |
| `app/types/graph.ts` | GroupNode, GraphFilter 타입 확장 | 수정 |

### 3.3 데이터 흐름

```
URL 파라미터 (?categories=dev&focus=TSK-06-03&depth=2)
         │
         ▼
DependencyGraphModal (parseURLParams)
         │
         │ GraphFilter 객체 생성
         ▼
useDependencyGraph.buildGraphData(filter)
         │
         │ 1. 카테고리/상태 필터링
         │ 2. 초점 Task 기준 depth 제한 (BFS)
         │ 3. 계층 뷰 모드에 따라 그룹 노드 생성
         │    - mode: 'full' → 모든 Task 노드
         │    - mode: 'wp' → WP 그룹 + Task 노드
         │    - mode: 'act' → ACT 그룹 + Task 노드
         ▼
GraphData { nodes: (TaskNode | GroupNode)[], edges: TaskEdge[] }
         │
         ▼
DependencyGraph.client.vue 렌더링
         │
         │ GroupNode 클릭 시 축소/확장 토글
         ▼
useDependencyGraph.toggleGroup(groupId)
         │
         │ 그룹 내 Task 노드 숨김/표시
         ▼
GraphData 업데이트
```

---

## 4. 기술적 결정

### 4.1 필터링 전략

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 필터 적용 시점 | 클라이언트, 서버 | 클라이언트 | wbs.md 이미 로드됨, 서버 요청 불필요 |
| 카테고리 필터 UI | Checkbox, MultiSelect | Checkbox | 3개 항목만, 한눈에 상태 파악 |
| 상태 필터 UI | Checkbox, MultiSelect | MultiSelect | 6~9개 항목, 공간 절약 |
| 초점 Task 선택 | Dropdown, 검색 입력 | Dropdown | Task 수 < 200 예상, 단순 선택 |

### 4.2 계층 그룹 전략

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 그룹 노드 표현 | 별도 GroupNode, 확장된 TaskNode | 별도 GroupNode 컴포넌트 | 명확한 역할 분리, 스타일 관리 용이 |
| 축소 상태 저장 | 로컬 상태, URL, localStorage | 로컬 상태 (Vue ref) | 일시적 UI 상태, 세션 지속성 불필요 |
| 그룹 레이아웃 | 수동 배치, Vue Flow 자동 | Vue Flow 자동 (hierarchical) | 일관된 레이아웃, 계산 복잡도 감소 |
| 그룹 내 Task 배치 | 수직 스택, 그리드 | 수직 스택 | 의존관계 화살표 가독성 |

### 4.3 초점 뷰 (Focus Mode)

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| Depth 계산 알고리즘 | DFS, BFS | BFS | 최단 거리 기준, 레벨별 탐색 |
| Depth 범위 | 1~5 | 1~3 | 3 depth면 충분, 성능 고려 |
| 방향성 | 양방향, 선행만, 후행만 | 양방향 | 선행(depends) + 후행(dependedBy) 모두 표시 |

### 4.4 URL 파라미터 설계

```
?categories=development,infrastructure
&statuses=im,vf,xx
&hierarchyMode=wp
&focusTask=TSK-06-03
&focusDepth=2
```

| 파라미터 | 타입 | 예시 | 설명 |
|---------|------|------|------|
| categories | string[] | `dev,inf` | 약어 사용 (공간 절약) |
| statuses | string[] | `im,vf,xx` | 상태 코드 ([ ], [bd] → bd) |
| hierarchyMode | enum | `full\|wp\|act` | 계층 뷰 모드 |
| focusTask | string | `TSK-06-03` | 초점 Task ID |
| focusDepth | number | `1~3` | 초점 깊이 |

---

## 5. 주요 기능 설계

### 5.1 WP/ACT 그룹 노드

**GroupNode 타입 정의**:
```typescript
interface GroupNodeData {
  groupId: string          // 예: "WP-01", "ACT-02"
  groupType: 'wp' | 'act'  // 그룹 타입
  title: string            // 그룹 제목
  taskCount: number        // 포함된 Task 개수
  completedCount: number   // 완료된 Task 개수
  isExpanded: boolean      // 확장/축소 상태
  childTaskIds: string[]   // 포함된 Task ID 목록
}
```

**그룹 생성 로직**:
1. wbsStore.flatNodes에서 WP/ACT 노드 수집
2. 각 WP/ACT의 하위 Task 수집 (재귀)
3. 모든 하위 Task가 필터 조건 미충족 시 그룹 제외
4. 그룹 노드 position: 하위 Task 평균 좌표

**축소/확장 동작**:
- `isExpanded = true`: GroupNode + 하위 TaskNode 모두 표시, 엣지 정상
- `isExpanded = false`: GroupNode만 표시, 하위 TaskNode 숨김, 그룹 간 엣지만 표시

### 5.2 카테고리/상태 필터

**필터 UI**:
```
카테고리: ☑ 개발  ☑ 결함  ☑ 인프라
상태:     [MultiSelect: 구현, 검증, 완료 선택됨]
```

**필터 적용 로직**:
```typescript
function applyFilter(node: WbsNode, filter: GraphFilter): boolean {
  const category = node.category || 'development'
  const status = extractStatusCode(node.status)

  const categoryMatch = filter.categories.length === 0 || filter.categories.includes(category)
  const statusMatch = filter.statuses.length === 0 || filter.statuses.includes(status)

  return categoryMatch && statusMatch
}
```

### 5.3 초점 뷰 (Focus Mode)

**BFS 기반 depth 제한**:
```typescript
function buildFocusGraph(focusTaskId: string, depth: number): Set<string> {
  const visited = new Set<string>([focusTaskId])
  const queue: Array<{ taskId: string, currentDepth: number }> = [{ taskId: focusTaskId, currentDepth: 0 }]

  while (queue.length > 0) {
    const { taskId, currentDepth } = queue.shift()!

    if (currentDepth >= depth) continue

    // 선행 Task (depends)
    const task = taskNodes.get(taskId)
    if (task?.depends) {
      const deps = parseDependencies(task.depends)
      deps.forEach(depId => {
        if (!visited.has(depId)) {
          visited.add(depId)
          queue.push({ taskId: depId, currentDepth: currentDepth + 1 })
        }
      })
    }

    // 후행 Task (dependedBy)
    edges.forEach(edge => {
      if (edge.source === taskId && !visited.has(edge.target)) {
        visited.add(edge.target)
        queue.push({ taskId: edge.target, currentDepth: currentDepth + 1 })
      }
    })
  }

  return visited
}
```

### 5.4 URL 파라미터 관리

**저장 (encodeFilterToURL)**:
```typescript
function encodeFilterToURL(filter: GraphFilter): string {
  const params = new URLSearchParams()

  if (filter.categories.length > 0) {
    params.set('categories', filter.categories.join(','))
  }
  if (filter.statuses.length > 0) {
    params.set('statuses', filter.statuses.map(s => s.replace(/[\[\]]/g, '')).join(','))
  }
  if (filter.hierarchyMode !== 'full') {
    params.set('hierarchyMode', filter.hierarchyMode)
  }
  if (filter.focusTask) {
    params.set('focusTask', filter.focusTask)
    params.set('focusDepth', filter.focusDepth.toString())
  }

  return params.toString()
}
```

**복원 (parseURLParams)**:
```typescript
function parseURLParams(searchParams: URLSearchParams): GraphFilter {
  return {
    categories: searchParams.get('categories')?.split(',') || [],
    statuses: searchParams.get('statuses')?.split(',').map(s => `[${s}]`) || [],
    hierarchyMode: (searchParams.get('hierarchyMode') as 'full' | 'wp' | 'act') || 'full',
    focusTask: searchParams.get('focusTask') || null,
    focusDepth: parseInt(searchParams.get('focusDepth') || '2')
  }
}
```

---

## 6. UI/UX 설계

### 6.1 GraphFilterPanel 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ [▼ 필터] [🔄 초기화] [📊 통계: 노드 45 / 엣지 52]    │
├─────────────────────────────────────────────────────┤
│ 카테고리:                                           │
│   ☑ 개발 (35)  ☑ 결함 (8)  ☑ 인프라 (2)            │
│                                                     │
│ 상태:                                               │
│   [MultiSelect: 구현 (12), 검증 (5), 완료 (18)]    │
│                                                     │
│ 계층 뷰:                                            │
│   ⭘ 전체  ◉ WP 그룹  ⭘ ACT 그룹                    │
│                                                     │
│ 초점 Task:                                          │
│   [TSK-06-03 ▼]  깊이: [◉ 1  ⭘ 2  ⭘ 3]           │
│   [초점 적용]                                       │
└─────────────────────────────────────────────────────┘
```

### 6.2 GroupNode 스타일

**확장 상태**:
```
┌────────────────────────────┐
│ ▼ WP-06: 의존관계 시각화   │ ← 클릭 시 축소
│ ├─ TSK-06-01 [im]          │
│ ├─ TSK-06-02 [ ]           │
│ └─ TSK-06-03 [bd]          │
│ 완료: 0/3 (0%)             │
└────────────────────────────┘
```

**축소 상태**:
```
┌────────────────────────────┐
│ ▶ WP-06: 의존관계 시각화   │ ← 클릭 시 확장
│ 완료: 0/3 (0%)             │
└────────────────────────────┘
```

### 6.3 초점 뷰 시각 표현

- **초점 Task**: 노란색 하이라이트 (기존 selected 스타일)
- **Depth 1 Task**: 정상 색상, 실선 테두리
- **Depth 2 Task**: 정상 색상, 점선 테두리
- **Depth 3 Task**: 정상 색상, 얇은 점선 테두리
- **범위 밖 Task**: 숨김 처리 (노드 제거)

---

## 7. 인수 기준

- [ ] AC-01: GraphFilterPanel 컴포넌트 생성 및 모달에 통합
- [ ] AC-02: 카테고리 필터 적용 시 해당 카테고리 Task만 표시
- [ ] AC-03: 상태 필터 적용 시 해당 상태 Task만 표시
- [ ] AC-04: WP 그룹 뷰에서 그룹 노드 클릭 시 축소/확장 동작
- [ ] AC-05: 초점 Task 선택 시 depth 제한 내 Task만 표시
- [ ] AC-06: 필터 설정이 URL 파라미터에 반영됨
- [ ] AC-07: URL 파라미터로 페이지 로드 시 필터 상태 복원
- [ ] AC-08: 필터 초기화 버튼 클릭 시 전체 그래프 표시

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 대규모 프로젝트 성능 저하 | Medium | 가상화 적용, 노드 200개 이상 시 경고 |
| 그룹 노드 레이아웃 충돌 | Low | Vue Flow 자동 레이아웃 활용, 수동 조정 최소화 |
| URL 파라미터 길이 초과 | Low | 약어 사용, 기본값 생략 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-06-01 | 선행 Task | 기존 그래프 구조, Vue Flow 통합 |
| wbsStore.flatNodes | 데이터 | WP/ACT 계층 정보 |
| Vue Router | 기능 | URL 파라미터 관리 (useRoute, useRouter) |

---

## 9. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행
- 상세설계에서 GraphFilterPanel 인터페이스, GroupNode Props, BFS 알고리즘 의사코드 작성
- UI 프로토타입 검토

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 11.4
- 선행 Task: `TSK-06-01/010-basic-design.md`, `TSK-06-01/030-implementation.md`
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude
Template Version: 1.0.0
-->
