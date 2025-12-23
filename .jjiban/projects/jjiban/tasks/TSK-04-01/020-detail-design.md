# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 구현 가능한 수준의 상세 명세
> * TypeScript 인터페이스 및 로직 포함
> * 테스트 가능한 단위로 분해
> * 기본설계와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Software Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| UI설계 | `011-ui-design.md` | 전체 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-01 |

---

## 1. 아키텍처 개요

### 1.1 컴포넌트 구조

```
app/components/wbs/
├── WbsTreePanel.vue         (컨테이너 - 데이터 로드 조정)
├── WbsTreeHeader.vue        (프레젠테이션 - 헤더 UI)
├── WbsSummaryCards.vue      (프레젠테이션 - 통계 카드)
└── WbsSearchBox.vue         (프레젠테이션 - 검색 입력)
```

### 1.2 데이터 흐름

```
┌──────────────────┐
│  WbsTreePanel    │ ← route.query.projectId
│  (onMounted)     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│  useWbsStore()          │
│  .fetchWbs(projectId)   │
└────────┬────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  /api/projects/:id/wbs        │
│  (GET Request)                │
└────────┬──────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  WbsNode[] 트리 데이터          │
│  { id, type, title, ...}       │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Pinia Store State              │
│  - tree: WbsNode[]              │
│  - flatNodes: Map<id, node>     │
│  - expandedNodes: Set<string>   │
│  - searchQuery: string          │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Reactive Components             │
│  - WbsTreeHeader                 │
│  - WbsSummaryCards (computed)    │
│  - WbsSearchBox                  │
│  - WbsTreeNode (TSK-04-02)       │
└──────────────────────────────────┘
```

### 1.3 상태 관리 전략

**Pinia Store (app/stores/wbs.ts)**:
- 이미 구현된 `useWbsStore` 활용
- 추가 필요 기능:
  - `searchQuery` state 추가
  - `setSearchQuery()` action 추가
  - `filteredTree` getter 추가 (검색 필터링)

---

## 2. 컴포넌트 상세 설계

### 2.1 WbsTreePanel (컨테이너)

**파일 경로**: `app/components/wbs/WbsTreePanel.vue`

#### 2.1.1 TypeScript 인터페이스

```typescript
interface WbsTreePanelProps {
  // Props 없음 (route에서 projectId 추출)
}

interface WbsTreePanelEmits {
  // Emits 없음
}
```

#### 2.1.2 스크립트 섹션

```vue
<script setup lang="ts">
/**
 * WbsTreePanel 컴포넌트
 * WBS 트리 패널의 컨테이너 역할
 * - 데이터 로드 조정
 * - 로딩/에러 상태 관리
 * - 자식 컴포넌트 통합
 *
 * @see TSK-04-01
 * @see 020-detail-design.md
 */

import { useWbsStore } from '~/stores/wbs'
import { useRoute } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import WbsTreeHeader from './WbsTreeHeader.vue'
// WbsTreeNode는 TSK-04-02에서 구현

const route = useRoute()
const wbsStore = useWbsStore()

// Route에서 projectId 추출
const projectId = computed(() => route.query.projectId as string)

// 스토어 상태 구독
const { loading, error, tree } = storeToRefs(wbsStore)

// 컴포넌트 마운트 시 WBS 데이터 로드
onMounted(async () => {
  if (!projectId.value) {
    console.error('Project ID is required')
    return
  }

  try {
    await wbsStore.fetchWbs(projectId.value)
  } catch (e) {
    console.error('Failed to load WBS:', e)
  }
})

// 컴포넌트 언마운트 시 클린업
onUnmounted(() => {
  wbsStore.clearWbs()
})
</script>
```

#### 2.1.3 템플릿 섹션

```vue
<template>
  <div
    data-testid="wbs-tree-panel"
    class="wbs-tree-panel h-full bg-[#0f0f23] flex flex-col overflow-hidden"
    role="region"
    aria-label="WBS Tree Panel"
    :aria-busy="loading"
  >
    <!-- 로딩 상태 -->
    <div
      v-if="loading"
      data-testid="loading-state"
      class="flex items-center justify-center h-full"
    >
      <ProgressSpinner
        style="width: 50px; height: 50px"
        strokeWidth="4"
        fill="transparent"
        animationDuration="1s"
        aria-label="Loading WBS data"
      />
    </div>

    <!-- 에러 상태 -->
    <div
      v-else-if="error"
      data-testid="error-state"
      class="p-4"
    >
      <Message
        severity="error"
        :closable="false"
      >
        {{ error }}
      </Message>
    </div>

    <!-- 정상 상태 -->
    <div
      v-else
      data-testid="content-state"
      class="flex flex-col h-full"
    >
      <!-- 헤더 (고정) -->
      <WbsTreeHeader class="flex-shrink-0" />

      <!-- 트리 노드 (스크롤) -->
      <div class="flex-1 overflow-y-auto">
        <!-- WbsTreeNode는 TSK-04-02에서 구현 -->
        <div
          v-if="tree && tree.length > 0"
          class="p-2"
        >
          <!-- <WbsTreeNode v-for="node in tree" :key="node.id" :node="node" /> -->
          <div class="text-text-secondary text-sm">
            Tree nodes will be rendered here (TSK-04-02)
          </div>
        </div>

        <!-- 빈 상태 -->
        <div
          v-else
          data-testid="empty-state"
          class="flex flex-col items-center justify-center h-full text-text-secondary"
        >
          <i class="pi pi-inbox text-4xl mb-4 opacity-50"></i>
          <p>WBS 데이터가 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 2.1.4 테스트 시나리오

| ID | 시나리오 | 예상 결과 |
|---|----------|-----------|
| TC-01 | 컴포넌트 마운트 시 projectId가 있는 경우 | `fetchWbs()` 호출됨 |
| TC-02 | 컴포넌트 마운트 시 projectId가 없는 경우 | 콘솔 에러 출력, API 호출 안 됨 |
| TC-03 | 로딩 중 상태 | ProgressSpinner 표시 |
| TC-04 | 에러 발생 시 | Message 컴포넌트로 에러 표시 |
| TC-05 | 정상 로드 시 | WbsTreeHeader와 트리 노드 렌더링 |
| TC-06 | tree가 빈 배열인 경우 | 빈 상태 메시지 표시 |
| TC-07 | 컴포넌트 언마운트 시 | `clearWbs()` 호출됨 |

---

### 2.2 WbsTreeHeader (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsTreeHeader.vue`

#### 2.2.1 TypeScript 인터페이스

```typescript
interface WbsTreeHeaderProps {
  // Props 없음 (스토어에서 직접 조회)
}

interface WbsTreeHeaderEmits {
  // Emits 없음 (스토어 액션 직접 호출)
}
```

#### 2.2.2 스크립트 섹션

```vue
<script setup lang="ts">
/**
 * WbsTreeHeader 컴포넌트
 * WBS 트리 패널의 헤더 UI
 * - 타이틀 표시
 * - 검색 박스 통합
 * - 요약 카드 통합
 * - 전체 펼치기/접기 버튼
 *
 * @see TSK-04-01
 * @see 020-detail-design.md
 */

import { useWbsStore } from '~/stores/wbs'
import Button from 'primevue/button'
import WbsSearchBox from './WbsSearchBox.vue'
import WbsSummaryCards from './WbsSummaryCards.vue'

const wbsStore = useWbsStore()

// 액션 핸들러
const handleExpandAll = () => {
  wbsStore.expandAll()
}

const handleCollapseAll = () => {
  wbsStore.collapseAll()
}
</script>
```

#### 2.2.3 템플릿 섹션

```vue
<template>
  <div
    data-testid="wbs-tree-header"
    class="wbs-tree-header bg-[#16213e] border-b border-[#3d3d5c] p-4"
  >
    <!-- 타이틀 및 액션 버튼 -->
    <div class="flex items-center justify-between mb-4">
      <!-- 타이틀 -->
      <h2
        id="wbs-tree-title"
        class="text-lg font-semibold text-[#e8e8e8] flex items-center gap-2"
      >
        <i class="pi pi-sitemap text-purple-500"></i>
        WBS 트리
      </h2>

      <!-- 액션 버튼 -->
      <div class="flex gap-2">
        <Button
          data-testid="expand-all-button"
          label="전체 펼치기"
          icon="pi pi-angle-double-down"
          size="small"
          severity="secondary"
          outlined
          @click="handleExpandAll"
          aria-label="Expand all tree nodes"
          aria-describedby="wbs-tree-title"
        />
        <Button
          data-testid="collapse-all-button"
          label="전체 접기"
          icon="pi pi-angle-double-up"
          size="small"
          severity="secondary"
          outlined
          @click="handleCollapseAll"
          aria-label="Collapse all tree nodes"
          aria-describedby="wbs-tree-title"
        />
      </div>
    </div>

    <!-- 검색 박스 -->
    <WbsSearchBox class="mb-4" />

    <!-- 요약 카드 -->
    <WbsSummaryCards />
  </div>
</template>
```

#### 2.2.4 테스트 시나리오

| ID | 시나리오 | 예상 결과 |
|---|----------|-----------|
| TC-01 | 컴포넌트 렌더링 | 타이틀, 버튼, 검색, 카드 모두 표시 |
| TC-02 | 전체 펼치기 버튼 클릭 | `expandAll()` 호출됨 |
| TC-03 | 전체 접기 버튼 클릭 | `collapseAll()` 호출됨 |
| TC-04 | 타이틀 아이콘 표시 | purple-500 색상의 sitemap 아이콘 |
| TC-05 | 자식 컴포넌트 통합 | WbsSearchBox, WbsSummaryCards 렌더링 |

---

### 2.3 WbsSummaryCards (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSummaryCards.vue`

#### 2.3.1 TypeScript 인터페이스

```typescript
interface CardData {
  label: string
  value: number | string
  colorClass: string
  ariaLabel: string
}

interface WbsSummaryCardsProps {
  // Props 없음 (스토어에서 직접 조회)
}

interface WbsSummaryCardsEmits {
  // Emits 없음
}
```

#### 2.3.2 스크립트 섹션

```vue
<script setup lang="ts">
/**
 * WbsSummaryCards 컴포넌트
 * WBS 통계 요약 카드 표시
 * - WP/ACT/TSK 개수
 * - 전체 진행률
 *
 * @see TSK-04-01
 * @see 020-detail-design.md
 */

import { useWbsStore } from '~/stores/wbs'
import Card from 'primevue/card'

const wbsStore = useWbsStore()

// 스토어에서 통계 데이터 구독
const { wpCount, actCount, tskCount, overallProgress } = storeToRefs(wbsStore)

// 카드 데이터 구성
interface CardData {
  label: string
  value: ComputedRef<number>
  colorClass: string
  ariaLabel: ComputedRef<string>
  testId: string
}

const cards = computed<CardData[]>(() => [
  {
    label: 'WP',
    value: wpCount,
    colorClass: 'text-blue-500',
    ariaLabel: computed(() => `Work Package count: ${wpCount.value}`),
    testId: 'wp-card'
  },
  {
    label: 'ACT',
    value: actCount,
    colorClass: 'text-green-500',
    ariaLabel: computed(() => `Activity count: ${actCount.value}`),
    testId: 'act-card'
  },
  {
    label: 'TSK',
    value: tskCount,
    colorClass: 'text-orange-500',
    ariaLabel: computed(() => `Task count: ${tskCount.value}`),
    testId: 'tsk-card'
  },
  {
    label: 'Progress',
    value: computed(() => overallProgress.value),
    colorClass: 'text-purple-500',
    ariaLabel: computed(() => `Overall progress: ${overallProgress.value}%`),
    testId: 'progress-card'
  }
])
</script>
```

#### 2.3.3 템플릿 섹션

```vue
<template>
  <div
    data-testid="wbs-summary-cards"
    class="grid grid-cols-4 gap-3"
  >
    <Card
      v-for="card in cards"
      :key="card.label"
      :data-testid="card.testId"
      class="bg-[#1e1e38] border border-[#3d3d5c]"
      :aria-label="card.ariaLabel.value"
    >
      <template #content>
        <div class="text-center p-2">
          <!-- 카드 값 -->
          <div
            :class="card.colorClass"
            class="text-2xl font-bold"
          >
            {{ card.value.value }}{{ card.label === 'Progress' ? '%' : '' }}
          </div>

          <!-- 카드 레이블 -->
          <div class="text-sm text-[#888888] mt-1 uppercase">
            {{ card.label }}
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
```

#### 2.3.4 테스트 시나리오

| ID | 시나리오 | 예상 결과 |
|---|----------|-----------|
| TC-01 | 컴포넌트 렌더링 | 4개 카드 표시 (WP, ACT, TSK, Progress) |
| TC-02 | WP 카드 | blue-500 색상, wpCount 값 표시 |
| TC-03 | ACT 카드 | green-500 색상, actCount 값 표시 |
| TC-04 | TSK 카드 | orange-500 색상, tskCount 값 표시 |
| TC-05 | Progress 카드 | purple-500 색상, overallProgress 값 + '%' 표시 |
| TC-06 | 통계 업데이트 | 스토어 값 변경 시 카드 값 반영 |
| TC-07 | ARIA 레이블 | 각 카드에 적절한 aria-label 존재 |

---

### 2.4 WbsSearchBox (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSearchBox.vue`

#### 2.4.1 TypeScript 인터페이스

```typescript
interface WbsSearchBoxProps {
  // Props 없음
}

interface WbsSearchBoxEmits {
  // Emits 없음 (스토어 직접 업데이트)
}
```

#### 2.4.2 스크립트 섹션

```vue
<script setup lang="ts">
/**
 * WbsSearchBox 컴포넌트
 * WBS 트리 검색 입력 UI
 * - 검색어 입력 처리
 * - Debounce 적용 (300ms)
 * - 검색어 초기화
 *
 * @see TSK-04-01
 * @see 020-detail-design.md
 */

import { useWbsStore } from '~/stores/wbs'
import { useDebounceFn } from '@vueuse/core'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'

const wbsStore = useWbsStore()

// 로컬 검색어 상태
const searchQuery = ref('')

// Debounced 검색어 업데이트 (300ms)
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300)

// 검색어 변경 감지
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

// 검색어 초기화
const clearSearch = () => {
  searchQuery.value = ''
  wbsStore.setSearchQuery('')
}

// ESC 키 핸들러
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    clearSearch()
  }
}
</script>
```

#### 2.4.3 템플릿 섹션

```vue
<template>
  <div
    data-testid="wbs-search-box"
    class="wbs-search-box relative"
  >
    <IconField iconPosition="left">
      <InputIcon>
        <i class="pi pi-search text-[#888888]" />
      </InputIcon>
      <InputText
        v-model="searchQuery"
        data-testid="search-input"
        placeholder="Task ID 또는 제목으로 검색..."
        class="w-full bg-[#1e1e38] border-[#3d3d5c] text-[#e8e8e8]
               placeholder:text-gray-500
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500
               transition-colors duration-200"
        role="searchbox"
        aria-label="Search WBS tree by Task ID or title"
        aria-describedby="search-hint"
        @keydown="handleKeydown"
      />
    </IconField>

    <!-- 검색어 초기화 버튼 (검색어 입력 시만 표시) -->
    <Button
      v-if="searchQuery"
      data-testid="clear-search-button"
      icon="pi pi-times"
      text
      rounded
      size="small"
      severity="secondary"
      @click="clearSearch"
      class="absolute right-2 top-1/2 -translate-y-1/2 hover:text-red-500 transition-colors"
      aria-label="Clear search"
    />

    <!-- 스크린 리더용 힌트 -->
    <span id="search-hint" class="sr-only">
      Type to filter tasks. Press ESC to clear.
    </span>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

#### 2.4.4 테스트 시나리오

| ID | 시나리오 | 예상 결과 |
|---|----------|-----------|
| TC-01 | 컴포넌트 렌더링 | 검색 입력 필드 표시 |
| TC-02 | 검색어 입력 | 300ms 후 `setSearchQuery()` 호출 |
| TC-03 | 빠른 연속 입력 | Debounce로 마지막 입력만 처리 |
| TC-04 | X 버튼 클릭 | 검색어 초기화, `setSearchQuery('')` 호출 |
| TC-05 | ESC 키 입력 | 검색어 초기화 |
| TC-06 | 검색어 없을 때 | X 버튼 미표시 |
| TC-07 | 검색어 있을 때 | X 버튼 표시 |
| TC-08 | 포커스 시 | 파란색 테두리 표시 |

---

## 3. Pinia Store 확장

### 3.1 추가 State

**파일**: `app/stores/wbs.ts`

```typescript
// 기존 state에 추가
const searchQuery = ref('')
```

### 3.2 추가 Getters

```typescript
/**
 * 검색어로 필터링된 트리
 * - 검색어가 없으면 원본 트리 반환
 * - 검색어가 있으면 매칭되는 노드만 포함
 */
const filteredTree = computed<WbsNode[]>(() => {
  if (!searchQuery.value.trim()) {
    return tree.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return filterTreeNodes(tree.value, query)
})

/**
 * 트리 노드 필터링 헬퍼 함수
 * - 노드 ID 또는 title이 검색어를 포함하면 해당 노드와 상위 경로 유지
 * - 재귀적으로 자식 노드 검색
 */
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []

  for (const node of nodes) {
    // 현재 노드가 검색어와 매칭되는지 확인
    const nodeMatches =
      node.id.toLowerCase().includes(query) ||
      node.title.toLowerCase().includes(query)

    // 자식 노드 재귀 필터링
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []

    // 현재 노드가 매칭되거나 자식 중 매칭되는 노드가 있으면 포함
    if (nodeMatches || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren
      })
    }
  }

  return result
}
```

### 3.3 추가 Actions

```typescript
/**
 * 검색어 설정
 */
function setSearchQuery(query: string) {
  searchQuery.value = query
}
```

### 3.4 Return 객체 확장

```typescript
return {
  // State
  tree,
  flatNodes,
  loading,
  error,
  expandedNodes,
  searchQuery, // 추가
  // Getters
  wpCount,
  actCount,
  tskCount,
  overallProgress,
  filteredTree, // 추가
  // Actions
  fetchWbs,
  saveWbs,
  getNode,
  toggleExpand,
  isExpanded,
  expandAll,
  collapseAll,
  clearWbs,
  setSearchQuery // 추가
}
```

---

## 4. API 연동 명세

### 4.1 GET /api/projects/:id/wbs

**요청**:
```typescript
GET /api/projects/jjiban/wbs
```

**응답**:
```typescript
// 성공 시 (200 OK)
{
  "id": "jjiban",
  "type": "project",
  "title": "jjiban - AI 기반 프로젝트 관리 도구",
  "progress": 0,
  "children": [
    {
      "id": "WP-01",
      "type": "wp",
      "title": "기본 인프라",
      "progress": 0,
      "children": [...]
    }
  ]
}

// 에러 시 (404, 500 등)
{
  "success": false,
  "error": "Project not found"
}
```

**에러 핸들링**:
```typescript
try {
  const data = await $fetch<WbsNode[]>(`/api/projects/${projectId}/wbs`)
  tree.value = data
} catch (e) {
  if (e.statusCode === 404) {
    error.value = '프로젝트를 찾을 수 없습니다.'
  } else if (e.statusCode === 500) {
    error.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  } else {
    error.value = e instanceof Error ? e.message : 'WBS 로드 실패'
  }
}
```

---

## 5. 에러 핸들링

### 5.1 에러 시나리오

| 시나리오 | 에러 유형 | 사용자 피드백 |
|---------|----------|-------------|
| 네트워크 오류 | NetworkError | "네트워크 연결을 확인해주세요." |
| 404 Not Found | ApiError | "프로젝트를 찾을 수 없습니다." |
| 500 Server Error | ServerError | "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." |
| 타임아웃 | TimeoutError | "요청 시간이 초과되었습니다. 다시 시도해주세요." |
| 파싱 오류 | ParseError | "데이터 형식이 올바르지 않습니다." |
| ProjectID 없음 | ValidationError | 콘솔 에러만 (UI 미표시) |

### 5.2 에러 복구 전략

```typescript
// 재시도 로직 (선택적)
async function fetchWbsWithRetry(projectId: string, maxRetries = 3) {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      await wbsStore.fetchWbs(projectId)
      return // 성공 시 종료
    } catch (e) {
      lastError = e as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // 지수 백오프
      }
    }
  }

  // 최종 실패
  console.error('Failed after retries:', lastError)
}
```

---

## 6. 성능 최적화

### 6.1 Debounce 설정

```typescript
// 검색어 입력 debounce: 300ms
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300)
```

**근거**:
- 300ms: 사용자 입력 완료 대기 시간으로 적절
- 너무 짧으면 불필요한 필터링 빈번
- 너무 길면 사용자 경험 저하

### 6.2 Computed 최적화

```typescript
// filteredTree getter는 computed로 캐싱
// searchQuery 또는 tree 변경 시에만 재계산
const filteredTree = computed<WbsNode[]>(() => {
  // ... 필터링 로직
})
```

### 6.3 렌더링 최적화

- **v-if vs v-show**: 로딩/에러 상태는 `v-if` (조건부 렌더링)
- **key 속성**: 카드 리스트에 `key` 사용으로 Vue의 재사용 최적화
- **storeToRefs**: Pinia store의 reactive 속성을 ref로 추출하여 불필요한 재렌더링 방지

---

## 7. 접근성 구현

### 7.1 ARIA 속성 적용

| 컴포넌트 | ARIA 속성 | 값 |
|---------|----------|-----|
| WbsTreePanel | `role` | `"region"` |
| WbsTreePanel | `aria-label` | `"WBS Tree Panel"` |
| WbsTreePanel | `aria-busy` | `loading` (동적) |
| WbsSearchBox | `role` | `"searchbox"` |
| WbsSearchBox | `aria-label` | `"Search WBS tree by Task ID or title"` |
| WbsSearchBox | `aria-describedby` | `"search-hint"` |
| Button (Expand) | `aria-label` | `"Expand all tree nodes"` |
| Button (Collapse) | `aria-label` | `"Collapse all tree nodes"` |
| Card | `aria-label` | `"Work Package count: 12"` (동적) |

### 7.2 키보드 네비게이션

| 키 | 동작 | 컴포넌트 |
|----|------|---------|
| Tab | 포커스 이동 | 전체 |
| Enter | 버튼 실행 | Button |
| Space | 버튼 실행 | Button |
| ESC | 검색어 초기화 | WbsSearchBox |

### 7.3 스크린 리더 지원

```vue
<!-- 힌트 텍스트 (스크린 리더 전용) -->
<span id="search-hint" class="sr-only">
  Type to filter tasks. Press ESC to clear.
</span>
```

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest)

**파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WbsTreePanel from '~/components/wbs/WbsTreePanel.vue'
import { useWbsStore } from '~/stores/wbs'

describe('WbsTreePanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('로딩 중 상태를 표시한다', () => {
    const wrapper = mount(WbsTreePanel, {
      global: {
        mocks: {
          $route: { query: { projectId: 'test' } }
        }
      }
    })

    const store = useWbsStore()
    store.loading = true

    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
  })

  it('에러 발생 시 에러 메시지를 표시한다', async () => {
    const wrapper = mount(WbsTreePanel, {
      global: {
        mocks: {
          $route: { query: { projectId: 'test' } }
        }
      }
    })

    const store = useWbsStore()
    store.error = 'Test error'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test error')
  })

  // 추가 테스트 케이스...
})
```

### 8.2 컴포넌트 테스트 (Playwright)

**파일**: `tests/e2e/wbs-tree-panel.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('WBS Tree Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?projectId=jjiban')
  })

  test('WBS 트리 패널이 로드된다', async ({ page }) => {
    await expect(page.locator('[data-testid="wbs-tree-panel"]')).toBeVisible()
  })

  test('검색 기능이 동작한다', async ({ page }) => {
    const searchBox = page.locator('[data-testid="search-input"]')
    await searchBox.fill('TSK-01')

    // 300ms debounce 대기
    await page.waitForTimeout(400)

    // 검색 결과 확인 (TSK-04-02에서 구현)
  })

  test('전체 펼치기 버튼이 동작한다', async ({ page }) => {
    await page.click('[data-testid="expand-all-button"]')
    // 노드 확장 상태 확인 (TSK-04-02에서 구현)
  })

  // 추가 E2E 테스트...
})
```

---

## 9. 의존성 및 제약사항

### 9.1 외부 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @vueuse/core | ^11.x | `useDebounceFn` 유틸리티 |
| primevue | ^4.x | UI 컴포넌트 |
| pinia | ^2.x | 상태 관리 |

### 9.2 내부 의존성

| 모듈 | 위치 | 설명 |
|------|------|------|
| useWbsStore | `app/stores/wbs.ts` | WBS 데이터 관리 |
| WbsNode | `types/index.ts` | 타입 정의 |
| WbsTreeNode | `app/components/wbs/WbsTreeNode.vue` | TSK-04-02에서 구현 |

### 9.3 제약사항

| 제약 | 설명 | 영향 |
|------|------|------|
| WBS 노드 수 | < 1000개 권장 | 클라이언트 사이드 필터링 성능 |
| 검색어 길이 | < 100자 | UI 레이아웃 깨짐 방지 |
| Debounce 시간 | 300ms 고정 | 사용자 설정 불가 |
| API 타임아웃 | Nuxt 기본값 (30s) | 장시간 로딩 시 타임아웃 |

---

## 10. 배포 및 롤백 계획

### 10.1 배포 체크리스트

- [ ] 단위 테스트 통과 (≥80% 커버리지)
- [ ] E2E 테스트 통과
- [ ] TypeScript 타입 에러 없음
- [ ] ESLint/Prettier 규칙 통과
- [ ] 접근성 자동 테스트 (axe-core) 통과
- [ ] 성능 테스트 (검색 응답 시간 < 300ms)
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 (README, CHANGELOG)

### 10.2 롤백 기준

| 상황 | 롤백 여부 | 조치 |
|------|----------|------|
| API 에러율 > 5% | 즉시 롤백 | 이전 버전 복원 |
| 검색 응답 시간 > 1s | 롤백 고려 | 성능 최적화 후 재배포 |
| 접근성 이슈 발견 | 패치 배포 | 핫픽스 적용 |
| 사용자 피드백 부정적 | 롤백 고려 | 이슈 분석 후 결정 |

---

## 11. 다음 단계

### 11.1 추적성 매트릭스 작성 (025-traceability-matrix.md)
- 요구사항 ↔ 컴포넌트 ↔ 테스트 케이스 매핑

### 11.2 테스트 명세 작성 (026-test-specification.md)
- 단위 테스트 케이스 상세 명세
- E2E 테스트 시나리오 상세 명세

### 11.3 구현 단계 (/wf:build)
- 4개 Vue 컴포넌트 파일 작성
- Pinia 스토어 확장 (searchQuery, filteredTree)
- 단위 테스트 및 E2E 테스트 작성

### 11.4 검증 단계 (/wf:verify)
- 테스트 실행 및 커버리지 확인
- 접근성 검증 (axe-core, 스크린 리더)
- 성능 테스트 (검색 응답 시간)
- 코드 리뷰 및 품질 검증

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md` (다음 단계)
- 테스트 명세: `026-test-specification.md` (다음 단계)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-01)
- 타입 정의: `types/index.ts`
- Pinia 스토어: `app/stores/wbs.ts`

---

<!--
author: Claude (Software Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
