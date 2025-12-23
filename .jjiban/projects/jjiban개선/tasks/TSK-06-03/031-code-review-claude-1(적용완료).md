# TSK-06-03 코드 리뷰

## 개요
- **리뷰 일시**: 2025-12-17
- **리뷰어**: Claude (refactoring-expert)
- **대상 파일**: 10개 (신규 5개, 수정 5개)
- **리뷰 범위**: 의존관계 그래프 필터 및 계층 접기 기능

## 리뷰 결과 요약

| 구분 | 건수 | 세부 내용 |
|------|------|----------|
| Critical | 2 | 그룹 노드 축소/확장 미구현, 하드코딩된 색상값 |
| Major | 3 | 타입 안정성, 에러 처리, 성능 최적화 |
| Minor | 5 | 코드 품질, 일관성, 가독성 개선 |
| Suggestion | 4 | 아키텍처 개선, 재사용성 향상 |

**리뷰 결과**: **APPROVED_WITH_COMMENTS**

> 핵심 기능은 정상 동작하지만 Critical/Major 이슈를 해결해야 프로덕션 배포 가능. 특히 CRITICAL-01(그룹 노드 토글 미구현)은 핵심 요구사항이므로 우선 해결 필요.

---

## 상세 리뷰

### Critical Issues

#### CRITICAL-01: 그룹 노드 축소/확장 미구현
**파일**: `app/composables/useDependencyGraph.ts`
**위치**: Line 107-176 (buildGraphNodes, buildEdgesWithGroups)
**심각도**: 🔴 Critical

**문제점**:
- 구현 문서(030-implementation.md:296)에 "그룹 노드 축소/확장 이벤트는 발행되지만, 실제로 하위 Task 노드를 숨기는 로직은 구현되지 않았습니다"라고 명시
- 설계 문서(020-detail-design.md:729-752)의 "8.2 그룹 노드 축소/확장 프로세스"와 "엣지 처리 전략"이 미구현 상태
- `DependencyGraph.client.vue` Line 72-74에서 `onGroupToggle` 핸들러는 이벤트만 emit하고, `useGroupNodes.toggleGroup`과 통합되지 않음

**현재 코드**:
```typescript
// DependencyGraph.client.vue (Line 72-74)
function onGroupToggle(groupId: string) {
  emit('groupToggle', { groupId })  // 이벤트만 발행
}

// useGroupNodes.ts (Line 15-23)
function toggleGroup(groupId: string) {
  const currentState = groupExpandedStates.value.get(groupId)
  const newState = currentState === undefined ? false : !currentState

  const newMap = new Map(groupExpandedStates.value)
  newMap.set(groupId, newState)
  groupExpandedStates.value = newMap
  // ⚠️ 노드 가시성 변경 로직 없음
}
```

**수정 방안**:
1. `useDependencyGraph.buildGraphData`에서 `groupExpandedStates`를 파라미터로 받아 축소된 그룹의 하위 Task 필터링
2. `DependencyGraphModal.vue`에서 `useGroupNodes` composable 통합
3. 설계 문서의 엣지 리라우팅 로직 구현 (그룹 내부 엣지 숨김, 외부 엣지 리라우팅)

**예상 코드**:
```typescript
// useDependencyGraph.ts
function buildGraphData(
  filter?: GraphFilter,
  groupStates?: Map<string, boolean>  // 추가
): GraphData {
  // ... 기존 로직 ...

  if (filter?.hierarchyMode === 'wp' || filter?.hierarchyMode === 'act') {
    // 그룹 노드 생성 후 groupStates 적용
    const filteredNodes = nodes.filter(node => {
      if (node.type === 'task') {
        // 속한 그룹이 축소되어 있으면 제외
        const groupId = extractGroupId(node.id, groupType)
        return groupStates?.get(groupId) !== false
      }
      return true
    })
    nodes = filteredNodes
  }
}
```

**우선순위**: P0 (핵심 요구사항 FR-001 미충족)

---

#### CRITICAL-02: 하드코딩된 색상값 (CSS 클래스 중앙화 원칙 위반)
**파일**:
- `app/components/wbs/graph/GroupNode.vue` (Line 47-48, 61)
- `app/components/wbs/graph/TaskNode.vue` (Line 60, 66, 68, 70, 76)
- `app/components/wbs/graph/DependencyGraph.client.vue` (Line 116, 133)

**심각도**: 🔴 Critical

**문제점**:
- CLAUDE.md의 "CSS 클래스 중앙화 원칙"을 명시적으로 위반
  > **금지**: `:style="{ backgroundColor: '#3b82f6' }"`, `const color = '#3b82f6'`
- GroupNode.vue에서 `groupColor` computed에 HEX 하드코딩 (Line 47-48)
- TaskNode.vue의 `borderStyle` computed에 다수의 HEX 색상 하드코딩 (Line 60, 66, 68, 70, 76)
- DependencyGraph.client.vue의 엣지 스타일에 HEX 하드코딩 (Line 116, 133)

**현재 코드**:
```vue
<!-- GroupNode.vue (Line 46-48) -->
const groupColor = computed(() => {
  return props.data.groupType === 'wp' ? '#3b82f6' : '#22c55e'  // ❌ 하드코딩
})

<!-- TaskNode.vue (Line 58-79) -->
const borderStyle = computed(() => {
  if (props.focusDepth === 0) {
    return '4px solid #fbbf24'  // ❌ 하드코딩
  }
  if (props.focusDepth === 1) {
    return '3px solid #3b82f6'  // ❌ 하드코딩
  }
  // ... 더 많은 하드코딩
})
```

**수정 방안**:
1. `main.css`에 모든 색상 클래스 정의
2. computed에서 CSS 클래스명 반환으로 변경
3. `:style` 대신 `:class` 사용

**예시 수정**:
```css
/* main.css */
.group-node-wp {
  border-color: theme('colors.blue.500');
}

.group-node-act {
  border-color: theme('colors.green.500');
}

.task-node-focus-depth-0 {
  border: 4px solid theme('colors.yellow.500');
}

.task-node-focus-depth-1 {
  border: 3px solid theme('colors.blue.500');
}

/* ... */
```

```vue
<!-- GroupNode.vue -->
<template>
  <div
    class="group-node"
    :class="[
      `group-node-${data.groupType}`,
      { 'group-node-selected': selected }
    ]"
  >
```

```vue
<!-- TaskNode.vue -->
<template>
  <div
    :class="[
      'task-node',
      focusDepthClass,
      ...nodeClass
    ]"
  >
```

**우선순위**: P0 (프로젝트 코딩 규칙 필수 준수 사항)

---

### Major Issues

#### MAJOR-01: 타입 안정성 부족 - Optional Chaining 미사용
**파일**: `app/composables/useDependencyGraph.ts`
**위치**: Line 269, 281
**심각도**: 🟠 Major

**문제점**:
- `group.node.title`, `group.tasks.map` 등에서 undefined 체크 없이 접근
- TypeScript 사용하지만 런타임 에러 가능성 존재

**현재 코드**:
```typescript
// Line 267
const groupNodeData: GroupNodeData = {
  groupId,
  groupType,
  title: group.node.title,  // ⚠️ group.node가 undefined일 수 있음
  // ...
}

// Line 281
y: avgY  // ⚠️ NaN 가능성 (childTaskNodes.length === 0)
```

**수정 방안**:
```typescript
const groupNodeData: GroupNodeData = {
  groupId,
  groupType,
  title: group.node?.title || groupId,
  taskCount: group.tasks?.length || 0,
  // ...
}

const avgY = childTaskNodes.length > 0
  ? childTaskNodes.reduce((sum, n) => sum + n.position.y, 0) / childTaskNodes.length
  : 0
```

**우선순위**: P1

---

#### MAJOR-02: 에러 처리 부재
**파일**:
- `app/composables/useGraphFilter.ts` (Line 90-126)
- `app/composables/useFocusView.ts` (Line 19-75)

**심각도**: 🟠 Major

**문제점**:
- `parseURLParams`에서 잘못된 URL 파라미터 처리 시 try-catch 없음
- 설계 문서(020-detail-design.md:1036)에 "INVALID_URL_PARAMS" 에러 핸들링 명시되어 있으나 미구현
- `buildFocusGraph`에서 존재하지 않는 focusTaskId 전달 시 검증 없음

**현재 코드**:
```typescript
// useGraphFilter.ts (Line 90)
function parseURLParams(searchParams: URLSearchParams): GraphFilter {
  // ⚠️ try-catch 없음, parseInt NaN 체크만 존재
  const focusDepth = focusDepthParam ? parseInt(focusDepthParam, 10) : 2
  // ...
}

// useFocusView.ts (Line 19-24)
function buildFocusGraph(
  focusTaskId: string,
  depth: number,
  taskNodes: Map<string, WbsNode>,
  edges: TaskEdge[]
): FocusViewConfig {
  // ⚠️ focusTaskId가 taskNodes에 존재하는지 검증 없음
  const includesNodes = new Set<string>()
  // ...
}
```

**수정 방안**:
```typescript
function parseURLParams(searchParams: URLSearchParams): GraphFilter {
  try {
    // 기존 로직
  } catch (error) {
    console.error('[useGraphFilter] URL 파라미터 복원 실패:', error)
    // 설계 문서의 기본값 반환
    return {
      categories: [],
      statuses: [],
      hierarchyMode: 'full',
      focusTask: null,
      focusDepth: 2
    }
  }
}

function buildFocusGraph(...): FocusViewConfig {
  if (!taskNodes.has(focusTaskId)) {
    console.warn(`[useFocusView] 초점 Task가 존재하지 않음: ${focusTaskId}`)
    return {
      focusTaskId,
      depth,
      includesNodes: new Set()
    }
  }
  // 기존 로직
}
```

**우선순위**: P1

---

#### MAJOR-03: 성능 최적화 누락 - computed deep watch
**파일**: `app/components/wbs/graph/DependencyGraphModal.vue`
**위치**: Line 48-53
**심각도**: 🟠 Major

**문제점**:
- `graphData` watch에 `{ deep: true }` 옵션 사용 (Line 53)
- 대규모 그래프(500개 노드)에서 매 필터 변경 시 전체 객체 deep comparison 발생
- 설계 문서의 성능 제약(200ms 이내 응답, 100개 노드 기준)을 충족하기 어려움

**현재 코드**:
```typescript
// Line 48-53
watch(() => props.graphData, (newData) => {
  nodes.value = [...newData.nodes]
  edges.value = [...newData.edges]
  clearHighlight()
}, { immediate: true, deep: true })  // ⚠️ deep: true 불필요
```

**수정 방안**:
```typescript
// graphData는 computed이므로 참조가 변경되면 자동으로 watch 트리거
// deep 옵션 제거
watch(() => props.graphData, (newData) => {
  nodes.value = [...newData.nodes]
  edges.value = [...newData.edges]
  clearHighlight()
}, { immediate: true })  // deep 제거
```

**우선순위**: P2

---

### Minor Issues

#### MINOR-01: 중복 코드 - 상태 코드 추출 로직
**파일**: `app/composables/useDependencyGraph.ts`
**위치**: Line 57, 123, 158, 235, 305, 402-406
**심각도**: 🟡 Minor

**문제점**:
- `extractStatusCode` 함수가 정의되어 있지만(Line 402-406), 여러 곳에서 직접 코드 추출 로직 중복 사용
- DRY 원칙 위반

**현재 코드**:
```typescript
// Line 57 (buildGraphData 내부)
const status = extractStatusCode(node.status)  // ✅ 함수 사용

// Line 235 (buildGroupNodes 내부)
const completedCount = group.tasks.filter(t => extractStatusCode(t.node.status) === '[xx]').length  // ✅ 함수 사용

// 하지만 다른 곳에서는 일관성 유지됨 (이슈 철회)
```

**재검토 결과**: 실제로 모든 곳에서 `extractStatusCode` 함수를 사용하고 있음. **이슈 철회**.

---

#### MINOR-02: 매직 넘버 - 레이아웃 상수
**파일**: `app/composables/useDependencyGraph.ts`
**위치**: Line 137, 247, 280, 334
**심각도**: 🟡 Minor

**문제점**:
- `280`, `140`, `300`, `100`, `-100` 등 레이아웃 관련 매직 넘버 하드코딩
- 유지보수성 및 일관성 저하

**현재 코드**:
```typescript
// Line 137
x: level * 280,
y: yIndex * 140

// Line 247
x: groupIndex * 300 + 120,
y: taskIndex * 100

// Line 280
x: groupIndex * 300 - 100,
```

**수정 방안**:
```typescript
// 파일 상단에 상수 정의
const LAYOUT_CONSTANTS = {
  LEVEL_SPACING: 280,
  NODE_SPACING: 140,
  GROUP_SPACING: 300,
  GROUP_OFFSET_X: -100,
  TASK_OFFSET_X: 120,
  TASK_SPACING_Y: 100
} as const

// 사용
position: {
  x: level * LAYOUT_CONSTANTS.LEVEL_SPACING,
  y: yIndex * LAYOUT_CONSTANTS.NODE_SPACING
}
```

**우선순위**: P2

---

#### MINOR-03: 불필요한 타입 단언 - groupType 변수
**파일**: `app/components/wbs/graph/GraphFilterPanel.vue`
**위치**: Line 103
**심각도**: 🟡 Minor

**문제점**:
- `hierarchyModeParam`에 대한 타입 가드가 명확하지만 `as` 단언 사용
- TypeScript의 타입 추론 활용 가능

**현재 코드**:
```typescript
// Line 103-105
const hierarchyMode = (['full', 'wp', 'act'].includes(hierarchyModeParam || ''))
  ? hierarchyModeParam as 'full' | 'wp' | 'act'  // ⚠️ 타입 단언
  : 'full'
```

**수정 방안**:
```typescript
const isValidHierarchyMode = (value: string | null): value is 'full' | 'wp' | 'act' => {
  return ['full', 'wp', 'act'].includes(value || '')
}

const hierarchyMode = isValidHierarchyMode(hierarchyModeParam)
  ? hierarchyModeParam
  : 'full'
```

**우선순위**: P3

---

#### MINOR-04: 가독성 저하 - 복잡한 조건문
**파일**: `app/components/wbs/graph/DependencyGraphModal.vue`
**위치**: Line 59-66
**심각도**: 🟡 Minor

**문제점**:
- `hasFilter` 조건 로직이 복잡하고 재사용되지 않음
- 의도 파악이 어려움

**현재 코드**:
```typescript
// Line 59-66
const graphData = computed(() => {
  const hasFilter =
    selectedCategories.value.length > 0 ||
    selectedStatuses.value.length > 0 ||
    hierarchyMode.value !== 'full' ||
    focusTask.value !== null

  return buildGraphData(hasFilter ? currentFilter.value : undefined)
})
```

**수정 방안**:
```typescript
// composable로 분리
const isFilterActive = computed(() => {
  return (
    selectedCategories.value.length > 0 ||
    selectedStatuses.value.length > 0 ||
    hierarchyMode.value !== 'full' ||
    focusTask.value !== null
  )
})

const graphData = computed(() => {
  return buildGraphData(isFilterActive.value ? currentFilter.value : undefined)
})
```

**우선순위**: P3

---

#### MINOR-05: 일관성 부족 - data-testid 명명 규칙
**파일**:
- `app/components/wbs/graph/GraphFilterPanel.vue`
- `app/components/wbs/graph/GroupNode.vue`

**심각도**: 🟡 Minor

**문제점**:
- 일부는 kebab-case (`graph-filter-panel`), 일부는 camelCase 없음
- 테스트 유지보수성 저하

**현재 코드**:
```vue
<!-- GraphFilterPanel.vue -->
:data-testid="'graph-filter-panel'"  // kebab-case
:data-testid="'filter-toggle-btn'"   // kebab-case
:data-testid="'category-checkbox-${option.value}'" // kebab-case

<!-- GroupNode.vue -->
:data-testid="`group-node-header-${data.groupId}`"  // kebab-case
```

**재검토 결과**: 실제로 모든 data-testid가 kebab-case로 일관성 있게 작성됨. **이슈 철회**.

---

### Suggestions

#### SUGGESTION-01: 아키텍처 개선 - URL 동기화 로직 분리
**파일**: `app/components/wbs/graph/DependencyGraphModal.vue`
**위치**: Line 86-104, 135-140
**심각도**: 💡 Suggestion

**제안 배경**:
- URL 동기화 로직이 모달 컴포넌트에 강결합
- 다른 필터 기능에서 재사용 불가능

**개선 방안**:
```typescript
// app/composables/useFilterURLSync.ts (신규)
export function useFilterURLSync<T>(
  filter: Ref<T>,
  encode: (filter: T) => string,
  decode: (params: URLSearchParams) => T
) {
  const route = useRoute()
  const router = useRouter()

  // URL → Filter
  function restore() {
    const searchParams = new URLSearchParams(route.query as Record<string, string>)
    return decode(searchParams)
  }

  // Filter → URL
  const sync = useDebounceFn(() => {
    const queryString = encode(filter.value)
    const newQuery = Object.fromEntries(new URLSearchParams(queryString))
    router.replace({ query: newQuery })
  }, 300)

  watch(filter, sync, { deep: true })

  return { restore, sync }
}
```

**장점**:
- 재사용 가능한 제네릭 composable
- 단일 책임 원칙 준수
- 테스트 가능성 향상

**우선순위**: P3

---

#### SUGGESTION-02: 성능 개선 - 인접 리스트 캐싱
**파일**: `app/composables/useFocusView.ts`
**위치**: Line 80-106
**심각도**: 💡 Suggestion

**제안 배경**:
- `buildFocusGraph` 호출 시마다 `buildAdjacencyList` 재계산
- 동일한 taskNodes/edges에 대해 중복 연산

**개선 방안**:
```typescript
// composable 최상단
const adjacencyCache = new Map<string, Map<string, { predecessors: string[], successors: string[] }>>()

function getCacheKey(taskNodes: Map<string, WbsNode>, edges: TaskEdge[]): string {
  return `${taskNodes.size}-${edges.length}-${Array.from(taskNodes.keys()).sort().join(',')}`
}

function buildFocusGraph(...) {
  const cacheKey = getCacheKey(taskNodes, edges)
  let adjacency = adjacencyCache.get(cacheKey)

  if (!adjacency) {
    adjacency = buildAdjacencyList(taskNodes, edges)
    adjacencyCache.set(cacheKey, adjacency)
  }
  // 기존 로직
}
```

**장점**:
- 대규모 그래프(500개 노드)에서 성능 향상
- 메모리 사용량 약간 증가하지만 제어 가능

**우선순위**: P3

---

#### SUGGESTION-03: 접근성 개선 - ARIA 속성 추가
**파일**:
- `app/components/wbs/graph/GroupNode.vue`
- `app/components/wbs/graph/GraphFilterPanel.vue`

**심각도**: 💡 Suggestion

**제안 배경**:
- 설계 문서(020-detail-design.md:1009-1012)에 접근성 요구사항 명시
  > ARIA 속성: GroupNode에 `role="button"`, `aria-expanded` 추가
- 현재 구현에서 누락

**개선 방안**:
```vue
<!-- GroupNode.vue -->
<div
  class="group-header"
  role="button"
  tabindex="0"
  :aria-expanded="data.isExpanded"
  :aria-label="`${data.groupId} 그룹, ${data.taskCount}개 Task 중 ${data.completedCount}개 완료`"
  @click="handleToggle"
  @keydown.enter="handleToggle"
  @keydown.space.prevent="handleToggle"
>

<!-- GraphFilterPanel.vue -->
<div
  class="filter-stats"
  :data-testid="'filter-stats'"
  aria-live="polite"
  :aria-label="`노드 ${stats.nodeCount}개, 엣지 ${stats.edgeCount}개`"
>
```

**우선순위**: P3

---

#### SUGGESTION-04: 코드 구조 개선 - buildGraphData 분할
**파일**: `app/composables/useDependencyGraph.ts`
**위치**: Line 45-179
**심각도**: 💡 Suggestion

**제안 배경**:
- `buildGraphData` 함수가 135줄로 너무 길고 복잡도 높음(cyclomatic complexity 추정 10+)
- 단일 책임 원칙 위반 (필터 적용 + 초점 뷰 + 그룹 생성 + 레이아웃)

**개선 방안**:
```typescript
function buildGraphData(filter?: GraphFilter): GraphData {
  // 1. Task 필터링
  let taskNodes = filterTasks(filter)

  // 2. 초점 뷰 적용
  if (filter?.focusTask) {
    taskNodes = applyFocusView(taskNodes, filter)
  }

  // 3. 노드/엣지 생성
  if (filter?.hierarchyMode === 'wp' || filter?.hierarchyMode === 'act') {
    return buildHierarchicalGraph(taskNodes, filter.hierarchyMode)
  } else {
    return buildFlatGraph(taskNodes)
  }
}

function filterTasks(filter?: GraphFilter): Map<string, WbsNode> {
  // 카테고리/상태 필터 로직
}

function applyFocusView(taskNodes: Map<string, WbsNode>, filter: GraphFilter): Map<string, WbsNode> {
  // BFS 탐색 로직
}

function buildHierarchicalGraph(taskNodes: Map<string, WbsNode>, mode: 'wp' | 'act'): GraphData {
  // 그룹 노드 생성 로직
}

function buildFlatGraph(taskNodes: Map<string, WbsNode>): GraphData {
  // 기본 레이아웃 로직
}
```

**장점**:
- 함수당 20-30줄로 유지 (단일 책임)
- 테스트 가능성 향상
- 가독성 및 유지보수성 개선

**우선순위**: P3

---

## 긍정적 측면

### 설계 준수도
1. ✅ **타입 정의 완전성**: `GraphFilter`, `GroupNodeData`, `FocusViewConfig` 타입이 설계 문서와 100% 일치
2. ✅ **요구사항 추적성**: FR-001~007 모두 구현됨 (FR-001은 부분 구현)
3. ✅ **BFS 알고리즘 정확성**: `useFocusView`의 BFS 구현이 설계 문서의 의사코드와 정확히 일치
4. ✅ **URL 파라미터 직렬화**: `useGraphFilter`의 직렬화/역직렬화 로직이 설계 명세 준수

### 코드 품질
1. ✅ **Vue 3 Composition API 준수**: 모든 컴포넌트에서 `<script setup>` 사용
2. ✅ **TypeScript 타입 안정성**: 대부분의 함수에 명확한 타입 정의
3. ✅ **반응성 관리**: `ref`, `computed`, `watch` 적절히 활용
4. ✅ **PrimeVue 컴포넌트 활용**: Checkbox, MultiSelect, RadioButton 등 일관성 있게 사용

### 성능 최적화
1. ✅ **인접 리스트 최적화**: `useFocusView`에서 O(E) → O(1) 탐색 최적화 구현
2. ✅ **Debounce 적용**: URL 업데이트에 300ms debounce 적용 (설계 명세 준수)
3. ✅ **순환 의존성 처리**: visited Set으로 무한 루프 방지

### 사용자 경험
1. ✅ **반응형 디자인**: Desktop/Tablet/Mobile 브레이크포인트 적용
2. ✅ **초점 Task 애니메이션**: `focus-pulse` keyframe으로 시각적 피드백 제공
3. ✅ **로딩 상태 처리**: ClientOnly fallback으로 SSR 고려

---

## 개선 우선순위 로드맵

### Phase 1: Critical 이슈 해결 (필수)
**예상 작업시간**: 4-6시간

1. **CRITICAL-01**: 그룹 노드 축소/확장 로직 구현
   - `useDependencyGraph.buildGraphData`에 groupStates 통합
   - 엣지 리라우팅 로직 추가
   - E2E 테스트 작성

2. **CRITICAL-02**: 하드코딩된 색상값 제거
   - `main.css`에 모든 색상 클래스 정의
   - 모든 컴포넌트의 `:style` → `:class` 마이그레이션
   - 시각적 회귀 테스트

### Phase 2: Major 이슈 해결 (권장)
**예상 작업시간**: 2-3시간

3. **MAJOR-01**: Optional chaining 적용
4. **MAJOR-02**: 에러 처리 추가
5. **MAJOR-03**: computed deep watch 제거

### Phase 3: Minor 이슈 및 Suggestions (선택)
**예상 작업시간**: 3-4시간

6. **MINOR-02**: 레이아웃 상수 추출
7. **SUGGESTION-01**: URL 동기화 로직 분리
8. **SUGGESTION-03**: 접근성 개선
9. **SUGGESTION-04**: buildGraphData 함수 분할

---

## 테스트 권장사항

### 단위 테스트 (추가 필요)
```typescript
// tests/composables/useGraphFilter.spec.ts
describe('useGraphFilter', () => {
  it('should encode filter to URL correctly', () => {
    const filter: GraphFilter = {
      categories: ['development'],
      statuses: ['[im]'],
      hierarchyMode: 'wp',
      focusTask: 'TSK-06-03',
      focusDepth: 2
    }
    const result = encodeFilterToURL(filter)
    expect(result).toBe('categories=development&statuses=im&hierarchyMode=wp&focusTask=TSK-06-03')
  })

  it('should handle URL length overflow', () => {
    const filter: GraphFilter = {
      categories: Array(100).fill('development'),
      // ...
    }
    const result = encodeFilterToURL(filter)
    expect(result.length).toBeLessThanOrEqual(2000)
  })
})
```

### E2E 테스트 (추가 필요)
```typescript
// tests/e2e/graph-filter.spec.ts
test('should filter graph by category', async ({ page }) => {
  await page.goto('/projects/jjiban개선')
  await page.click('[data-testid="open-graph-btn"]')

  await page.click('[data-testid="category-checkbox-development"]')

  const nodeCount = await page.locator('[data-testid="filter-stats"]').textContent()
  expect(nodeCount).toContain('노드')
})

test('should toggle group node', async ({ page }) => {
  // CRITICAL-01 구현 후 작성
})
```

---

## 성능 메트릭

### 복잡도 분석
| 함수 | LOC | 순환 복잡도 (추정) | 권장 조치 |
|------|-----|-------------------|----------|
| `useDependencyGraph.buildGraphData` | 135 | 12 | 🔴 리팩토링 필요 (SUGGESTION-04) |
| `useDependencyGraph.buildGroupNodes` | 63 | 5 | 🟢 양호 |
| `useFocusView.buildFocusGraph` | 57 | 4 | 🟢 양호 |
| `useGraphFilter.encodeFilterToURL` | 40 | 6 | 🟢 양호 |
| `DependencyGraph.highlightConnections` | 31 | 5 | 🟢 양호 |

### 메모리 사용량 (추정)
- 100개 노드 그래프: ~50KB (nodes + edges)
- 500개 노드 그래프: ~250KB (경고 메시지 표시 권장)
- 인접 리스트 캐시(SUGGESTION-02 적용 시): +30KB

---

## 결론

### 전체 평가
- **구현 완성도**: 85% (핵심 기능 구현 완료, 그룹 토글 미구현)
- **설계 준수도**: 90% (대부분 설계 문서 준수, CSS 중앙화 미준수)
- **코드 품질**: 75% (타입 안정성 우수, 에러 처리 부족)
- **유지보수성**: 70% (일부 함수 복잡도 높음, 리팩토링 필요)

### 배포 권장사항
1. **Phase 1 (Critical)** 이슈 해결 필수
2. **Phase 2 (Major)** 이슈 중 MAJOR-02(에러 처리) 강력 권장
3. Phase 3는 선택적으로 진행

### 최종 의견
핵심 기능(필터링, 초점 뷰, URL 동기화)은 잘 구현되었으나, **그룹 노드 축소/확장 미구현(CRITICAL-01)**과 **CSS 중앙화 원칙 위반(CRITICAL-02)**은 반드시 해결되어야 합니다. 이 두 가지만 해결되면 프로덕션 배포 가능 수준입니다.

특히 CRITICAL-02는 프로젝트 코딩 규칙의 필수 준수 사항이므로, 향후 모든 컴포넌트에서 동일한 패턴을 따라야 기술 부채가 쌓이지 않습니다.

---

**작성자**: Claude (refactoring-expert)
**리뷰 완료 일시**: 2025-12-17
**다음 단계**: `/wf:verify` 명령어로 검증 단계 진행 (Critical 이슈 해결 후)
