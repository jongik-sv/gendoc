# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * TypeScript 타입 시그니처 및 인터페이스 정의
> * 메서드 로직 및 알고리즘 상세 명세
> * 컴포넌트 Props/Emits 인터페이스
> * 유틸리티 함수 및 Composable 설계

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (System Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md` | 전체 |
| 화면설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md` | 전체 |
| 기존 구현 | `app/components/wbs/detail/TaskDetailPanel.vue` | 컨테이너 패턴 참조 |
| 기존 구현 | `app/stores/selection.ts` | 선택 스토어 확장 |
| 기존 구현 | `app/stores/wbs.ts` | WBS 노드 검색 |

---

## 1. 타입 정의

### 1.1 ProgressStats 타입

**파일**: `app/types/index.ts`

```typescript
/**
 * WP/ACT의 하위 Task 진행률 통계
 * WpActProgress 컴포넌트에서 사용
 */
export interface ProgressStats {
  total: number           // 전체 Task 수
  completed: number       // 완료 Task 수 (status === '[xx]')
  inProgress: number      // 진행 중 Task 수 (status !== '[ ]' && !== '[xx]')
  todo: number            // 대기 Task 수 (status === '[ ]')
  byStatus: Record<string, number>  // 상태별 카운트 맵 { '[ ]': 2, '[bd]': 1, ... }
}
```

**사용 위치**:
- `WpActDetailPanel.vue`: computed로 계산
- `WpActProgress.vue`: props로 받아서 시각화

### 1.2 기존 타입 확장 필요 여부

**WbsNode 타입**: 기존 타입 그대로 사용 가능 (확장 불필요)
```typescript
export interface WbsNode {
  id: string
  type: WbsNodeType
  title: string
  status?: string
  category?: TaskCategory
  priority?: Priority
  assignee?: string
  schedule?: ScheduleRange
  tags?: string[]
  depends?: string
  requirements?: string[]
  ref?: string
  progress?: number
  taskCount?: number
  children: WbsNode[]
  expanded?: boolean
  attributes?: Record<string, string>
  completed?: CompletedTimestamps
}
```

---

## 2. 컴포넌트별 상세 설계

### 2.1 NodeDetailPanel (분기 컨테이너)

#### 2.1.1 파일 정보

**경로**: `app/components/wbs/detail/NodeDetailPanel.vue`

#### 2.1.2 Props 및 Emits

```typescript
// Props: 없음 (스토어에서 직접 참조)
// Emits: 없음 (스토어를 통해 상태 변경)
```

#### 2.1.3 Composables & Stores

```typescript
const selectionStore = useSelectionStore()
const wbsStore = useWbsStore()
```

#### 2.1.4 Computed Properties

```typescript
/**
 * WP 또는 ACT 선택 여부
 */
const isWpOrActSelected = computed(() => {
  const type = selectionStore.selectedNodeType
  return type === 'wp' || type === 'act'
})

/**
 * 선택된 WbsNode 반환
 * - Task가 선택되었으면 null 반환 (TaskDetailPanel이 처리)
 * - WP/ACT가 선택되었으면 해당 노드 반환
 */
const selectedNode = computed((): WbsNode | null => {
  if (!selectionStore.selectedNodeId) return null
  if (selectionStore.isTaskSelected) return null
  return wbsStore.getNode(selectionStore.selectedNodeId) || null
})
```

#### 2.1.5 Template 구조

```vue
<template>
  <div class="node-detail-panel h-full" role="region" aria-label="노드 상세 정보">
    <!-- Task 선택 시 -->
    <TaskDetailPanel v-if="selectionStore.isTaskSelected" />

    <!-- WP/ACT 선택 시 -->
    <WpActDetailPanel
      v-else-if="isWpOrActSelected && selectedNode"
      :node="selectedNode"
    />

    <!-- 선택 없음 -->
    <Message v-else severity="info" data-testid="empty-state-message">
      왼쪽에서 노드를 선택하세요
    </Message>
  </div>
</template>
```

#### 2.1.6 의존성

- `TaskDetailPanel`: 기존 컴포넌트 (변경 없음)
- `WpActDetailPanel`: 신규 컴포넌트 (섹션 2.2)
- `useSelectionStore`: 기존 스토어 (확장 필요, 섹션 3)
- `useWbsStore`: 기존 스토어 (확장 필요, 섹션 3)

---

### 2.2 WpActDetailPanel (WP/ACT 컨테이너)

#### 2.2.1 파일 정보

**경로**: `app/components/wbs/detail/WpActDetailPanel.vue`

#### 2.2.2 Props 및 Emits

```typescript
interface Props {
  node: WbsNode  // 선택된 WP 또는 ACT 노드
}

const props = defineProps<Props>()

// Emits: 없음 (하위 컴포넌트에서 직접 스토어 호출)
```

#### 2.2.3 Composables & Stores

```typescript
const selectionStore = useSelectionStore()
```

#### 2.2.4 Computed Properties

```typescript
/**
 * 노드 타입 레이블
 */
const nodeTypeLabel = computed(() => {
  return props.node.type === 'wp' ? 'Work Package' : 'Activity'
})

/**
 * 진행률 통계 계산
 */
const progressStats = computed((): ProgressStats => {
  return calculateProgressStats(props.node)
})
```

#### 2.2.5 Methods

```typescript
/**
 * 하위 노드 선택 핸들러
 * WpActChildren에서 emit된 select 이벤트 수신
 */
function handleNodeSelect(nodeId: string): void {
  selectionStore.selectNode(nodeId)
}
```

#### 2.2.6 Template 구조

```vue
<template>
  <Card
    class="wp-act-detail-panel h-full"
    data-testid="wp-act-detail-panel"
    role="region"
    :aria-label="`${nodeTypeLabel} 상세 정보`"
  >
    <template #content>
      <div class="wp-act-detail-content overflow-y-auto space-y-4">
        <!-- 섹션 1: 기본 정보 -->
        <WpActBasicInfo :node="node" />

        <!-- 섹션 2: 진행률 시각화 -->
        <WpActProgress :stats="progressStats" />

        <!-- 섹션 3: 하위 노드 목록 -->
        <WpActChildren
          :children="node.children"
          @select="handleNodeSelect"
        />
      </div>
    </template>
  </Card>
</template>
```

#### 2.2.7 의존성

- `WpActBasicInfo`: 신규 컴포넌트 (섹션 2.3)
- `WpActProgress`: 신규 컴포넌트 (섹션 2.4)
- `WpActChildren`: 신규 컴포넌트 (섹션 2.5)
- `calculateProgressStats`: 유틸리티 함수 (섹션 4)

---

### 2.3 WpActBasicInfo (기본 정보)

#### 2.3.1 파일 정보

**경로**: `app/components/wbs/detail/WpActBasicInfo.vue`

#### 2.3.2 Props 및 Emits

```typescript
interface Props {
  node: WbsNode
}

const props = defineProps<Props>()

// Emits: 없음 (읽기 전용)
```

#### 2.3.3 Computed Properties

```typescript
/**
 * 노드 타입 레이블
 */
const nodeTypeLabel = computed(() => {
  return props.node.type === 'wp' ? 'Work Package' : 'Activity'
})

/**
 * 노드 타입 아이콘
 */
const nodeTypeIcon = computed(() => {
  return props.node.type === 'wp' ? '🔷' : '🔶'
})

/**
 * 일정 텍스트
 */
const scheduleText = computed(() => {
  if (!props.node.schedule) return '-'
  return `${props.node.schedule.start} ~ ${props.node.schedule.end}`
})

/**
 * 진행률에 따른 ProgressBar CSS 클래스
 */
const progressBarClass = computed(() => {
  const progress = props.node.progress || 0
  if (progress >= 80) return 'progress-bar-high'    // 초록색
  if (progress >= 40) return 'progress-bar-medium'  // 주황색
  return 'progress-bar-low'                         // 빨간색
})
```

#### 2.3.4 Template 구조

```vue
<template>
  <Panel
    header="기본 정보"
    data-testid="wp-act-basic-info-panel"
    class="wp-act-basic-info"
  >
    <div class="space-y-4">
      <!-- 노드 ID 및 타입 -->
      <div class="flex items-center gap-2">
        <div :class="`node-icon node-icon-${node.type}`">
          {{ nodeTypeIcon }}
        </div>
        <Badge
          :value="node.id"
          severity="info"
          class="text-sm"
          data-testid="node-id-badge"
        />
      </div>

      <!-- 제목 -->
      <div class="field">
        <label class="font-semibold text-sm text-gray-400">제목</label>
        <div class="mt-1 text-base font-medium text-white">
          {{ node.title }}
        </div>
      </div>

      <!-- 일정 범위 -->
      <div class="field">
        <label class="font-semibold text-sm text-gray-400 flex items-center gap-1">
          <i class="pi pi-calendar text-xs"></i>
          일정
        </label>
        <div class="mt-1 text-sm text-text-secondary">
          {{ scheduleText }}
        </div>
      </div>

      <!-- 전체 진행률 -->
      <div class="field">
        <label class="font-semibold text-sm text-gray-400 flex items-center gap-1">
          <i class="pi pi-chart-bar text-xs"></i>
          전체 진행률
        </label>
        <div class="mt-2">
          <ProgressBar
            :value="node.progress || 0"
            :show-value="true"
            :class="progressBarClass"
            data-testid="node-progress-bar"
          />
        </div>
      </div>
    </div>
  </Panel>
</template>
```

---

### 2.4 WpActProgress (진행률 시각화)

#### 2.4.1 파일 정보

**경로**: `app/components/wbs/detail/WpActProgress.vue`

#### 2.4.2 Props 및 Emits

```typescript
interface Props {
  stats: ProgressStats
}

const props = defineProps<Props>()

// Emits: 없음 (읽기 전용)
```

#### 2.4.3 Computed Properties

```typescript
/**
 * 완료 비율 (%)
 */
const completedPercentage = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.completed / props.stats.total) * 100)
})

/**
 * 진행 중 비율 (%)
 */
const inProgressPercentage = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.inProgress / props.stats.total) * 100)
})

/**
 * 대기 비율 (%)
 */
const todoPercentage = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.todo / props.stats.total) * 100)
})
```

#### 2.4.4 Methods

**R-06 반영**: getStatusSeverity 함수는 utils/wbsProgress.ts로 이동 (중복 제거)

```typescript
import { getStatusSeverity } from '~/utils/wbsProgress'

// 로컬 함수 제거 (유틸리티 함수로 대체)
```

#### 2.4.5 Template 구조

```vue
<template>
  <Panel
    header="진행 상황"
    data-testid="wp-act-progress-panel"
    class="wp-act-progress"
  >
    <div class="space-y-4">
      <!-- 전체 Task 수 -->
      <div class="text-sm text-text-secondary">
        전체 Task: <span class="font-semibold text-white">{{ stats.total }}개</span>
      </div>

      <!-- 완료/진행/대기 요약 -->
      <div class="flex items-center justify-between gap-4 text-sm">
        <div class="flex items-center gap-1">
          <i class="pi pi-check-circle text-success"></i>
          <span class="text-text-secondary">완료:</span>
          <span class="font-semibold text-success">
            {{ stats.completed }}개 ({{ completedPercentage }}%)
          </span>
        </div>
        <div class="flex items-center gap-1">
          <i class="pi pi-spinner text-warning"></i>
          <span class="text-text-secondary">진행:</span>
          <span class="font-semibold text-warning">
            {{ stats.inProgress }}개 ({{ inProgressPercentage }}%)
          </span>
        </div>
        <div class="flex items-center gap-1">
          <i class="pi pi-clock text-text-muted"></i>
          <span class="text-text-secondary">대기:</span>
          <span class="font-semibold text-text-muted">
            {{ stats.todo }}개 ({{ todoPercentage }}%)
          </span>
        </div>
      </div>

      <!-- 다단계 ProgressBar (완료/진행/대기) -->
      <div
        class="progress-segments"
        data-testid="progress-segments"
        role="progressbar"
        :aria-valuenow="completedPercentage"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-label="`전체 진행률 ${completedPercentage}%`"
      >
        <div class="progress-segment-track">
          <div
            class="progress-segment progress-segment-completed"
            :style="{ width: `${completedPercentage}%` }"
          ></div>
          <div
            class="progress-segment progress-segment-inprogress"
            :style="{ width: `${inProgressPercentage}%` }"
          ></div>
          <div
            class="progress-segment progress-segment-todo"
            :style="{ width: `${todoPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- 상태별 분포 -->
      <Divider>
        <span class="text-xs text-text-muted">상태별 분포</span>
      </Divider>

      <div class="grid grid-cols-2 gap-2 text-sm">
        <div
          v-for="(count, status) in stats.byStatus"
          :key="status"
          class="flex items-center justify-between px-3 py-2 rounded bg-bg-card border border-border"
        >
          <span class="font-mono text-text-secondary">{{ status }}</span>
          <Badge
            :value="count"
            :severity="getStatusSeverity(status as string)"
            :data-testid="`status-count-${status}`"
          />
        </div>
      </div>
    </div>
  </Panel>
</template>
```

---

### 2.5 WpActChildren (하위 노드 목록)

#### 2.5.1 파일 정보

**경로**: `app/components/wbs/detail/WpActChildren.vue`

#### 2.5.2 Props 및 Emits

```typescript
interface Props {
  children: WbsNode[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [nodeId: string]  // 하위 노드 선택 이벤트
}>()
```

#### 2.5.3 Methods

```typescript
/**
 * 하위 노드 클릭 핸들러
 * @param childId - 선택할 하위 노드 ID
 */
function handleChildClick(childId: string): void {
  emit('select', childId)
}

/**
 * 노드 타입별 아이콘 반환
 * @param type - 노드 타입
 */
function getNodeTypeIcon(type: WbsNodeType): string {
  const iconMap: Record<WbsNodeType, string> = {
    project: '🏠',
    wp: '🔷',
    act: '🔶',
    task: '🔸'
  }
  return iconMap[type] || '📄'
}

// R-06 반영: getStatusSeverity 함수는 utils/wbsProgress.ts로 이동 (중복 제거)
import { getStatusSeverity } from '~/utils/wbsProgress'
```

#### 2.5.4 Template 구조

```vue
<template>
  <Panel
    :header="`하위 노드 (${children.length})`"
    data-testid="wp-act-children-panel"
    class="wp-act-children"
  >
    <!-- 빈 상태 (M-02 개선 권장사항 포함) -->
    <div v-if="children.length === 0" class="empty-state p-6 text-center">
      <i class="pi pi-inbox text-4xl text-text-muted mb-3"></i>
      <Message severity="info" :closable="false" data-testid="children-empty-message">
        <p class="mb-2">하위 노드가 없습니다</p>
        <p class="text-xs text-text-secondary">
          wbs.md 파일에 하위 노드를 추가해주세요
        </p>
      </Message>
    </div>

    <!-- 하위 노드 목록 -->
    <div
      v-else
      class="children-list space-y-2"
      role="list"
      aria-label="하위 노드 목록"
    >
      <div
        v-for="child in children"
        :key="child.id"
        class="child-item"
        role="listitem"
        tabindex="0"
        :aria-label="`${child.title} 선택`"
        :data-testid="`child-item-${child.id}`"
        @click="handleChildClick(child.id)"
        @keydown.enter="handleChildClick(child.id)"
      >
        <!-- 노드 헤더 -->
        <div class="child-header">
          <!-- 타입 아이콘 + ID + 제목 -->
          <div class="flex items-center gap-2 flex-1">
            <div :class="`node-icon node-icon-${child.type}`">
              {{ getNodeTypeIcon(child.type) }}
            </div>
            <span class="text-sm font-medium text-white truncate">
              {{ child.id }}: {{ child.title }}
            </span>
          </div>

          <!-- 상태 배지 (Task만) -->
          <Badge
            v-if="child.type === 'task' && child.status"
            :value="child.status"
            :severity="getStatusSeverity(child.status)"
            class="font-mono text-xs"
          />
        </div>

        <!-- 노드 정보 (WP/ACT만) -->
        <div
          v-if="child.type !== 'task'"
          class="child-info"
        >
          <div class="flex items-center gap-4 text-xs text-text-secondary">
            <span>
              <i class="pi pi-chart-bar text-xs mr-1"></i>
              진행률: {{ child.progress || 0 }}%
            </span>
            <span>
              <i class="pi pi-list text-xs mr-1"></i>
              Task: {{ child.taskCount || 0 }}개
            </span>
          </div>
        </div>
      </div>
    </div>
  </Panel>
</template>
```

---

## 3. 스토어 확장 설계

### 3.1 selectionStore 확장

**파일**: `app/stores/selection.ts`

#### 3.1.1 추가 Computed 속성

```typescript
/**
 * WP 또는 ACT 선택 여부
 */
const isWpOrActSelected = computed(() => {
  const type = selectedNodeType.value
  return type === 'wp' || type === 'act'
})

/**
 * 선택된 WbsNode 반환 (WP/ACT 전용)
 * Task가 선택되었으면 null 반환
 *
 * H-01 지적사항 반영:
 * - wbsStore.flatNodes 초기화 검증 추가
 * - 노드 조회 실패 시 경고 로그 출력
 */
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value) return null
  if (isTaskSelected.value) return null

  const wbsStore = useWbsStore()

  // wbsStore.flatNodes가 초기화되었는지 확인
  if (!wbsStore.flatNodes || wbsStore.flatNodes.size === 0) {
    console.warn('[selectionStore] WBS data not loaded yet')
    return null
  }

  const node = wbsStore.getNode(selectedNodeId.value)
  if (!node) {
    console.warn(`[selectionStore] Node not found: ${selectedNodeId.value}`)
  }

  return node || null
})
```

#### 3.1.2 Return에 추가

```typescript
return {
  // State
  selectedNodeId,
  selectedTask,
  loadingTask,
  error,
  // Getters
  hasSelection,
  selectedNodeType,
  isTaskSelected,
  isWpOrActSelected,     // 추가
  selectedNode,          // 추가
  // Actions
  selectNode,
  loadTaskDetail,
  refreshTaskDetail,
  clearSelection
}
```

---

### 3.2 wbsStore 기존 메서드 활용

**파일**: `app/stores/wbs.ts`

#### 3.2.1 기존 `getNode` 메서드 활용

**현재 구현**:
```typescript
/**
 * ID로 노드 조회
 */
function getNode(id: string): WbsNode | undefined {
  return flatNodes.value.get(id)
}
```

**분석**:
- `flatNodes` Map을 통해 O(1) 시간복잡도로 노드 검색
- 추가 메서드 불필요 (기존 메서드 활용)

---

## 4. 유틸리티 함수 설계

### 4.1 calculateProgressStats

**파일**: `app/utils/wbsProgress.ts` (신규 생성)

**R-06 권장사항**: `getStatusSeverity` 함수도 이 파일에 추가하여 중복 제거

#### 4.1.1 함수 시그니처

```typescript
/**
 * WP/ACT 노드의 하위 Task 진행률 통계 계산
 * 재귀적으로 모든 하위 Task를 수집하여 상태별 카운트 집계
 *
 * @param node - WP 또는 ACT 노드
 * @returns 진행률 통계 객체
 *
 * @example
 * const stats = calculateProgressStats(wpNode)
 * console.log(stats.total)       // 10
 * console.log(stats.completed)   // 5
 * console.log(stats.byStatus)    // { '[ ]': 2, '[bd]': 1, '[xx]': 5 }
 */
export function calculateProgressStats(node: WbsNode): ProgressStats {
  // ...
}
```

#### 4.1.2 알고리즘 상세

```typescript
export function calculateProgressStats(node: WbsNode): ProgressStats {
  const allTasks: WbsNode[] = []

  /**
   * 재귀적으로 모든 Task 수집
   * - Task 타입이면 배열에 추가
   * - WP/ACT 타입이면 children 재귀 탐색
   *
   * R-05 지적사항 반영:
   * - null/undefined 방어 로직 추가
   * - Task 타입일 때 Early return 적용
   * - Array.isArray() 검증 추가
   */
  function collectTasks(n: WbsNode): void {
    // null/undefined 방어
    if (!n) return

    if (n.type === 'task') {
      allTasks.push(n)
      return  // Early return (자식 탐색 불필요)
    }

    // children 유효성 검증
    if (n.children && Array.isArray(n.children) && n.children.length > 0) {
      n.children.forEach(collectTasks)
    }
  }

  // 재귀 탐색 시작
  collectTasks(node)

  // 초기화
  const byStatus: Record<string, number> = {}
  let completed = 0
  let inProgress = 0
  let todo = 0

  // Task별 상태 카운팅
  allTasks.forEach(task => {
    const status = task.status || '[ ]'
    byStatus[status] = (byStatus[status] || 0) + 1

    if (status === '[xx]') {
      completed++
    } else if (status === '[ ]') {
      todo++
    } else {
      inProgress++
    }
  })

  return {
    total: allTasks.length,
    completed,
    inProgress,
    todo,
    byStatus
  }
}
```

#### 4.1.3 시간 복잡도

- **재귀 탐색**: O(N), N = 모든 노드 수
- **상태 카운팅**: O(T), T = Task 노드 수
- **전체**: O(N) (T ≤ N)

#### 4.1.4 테스트 케이스

```typescript
describe('calculateProgressStats', () => {
  it('빈 WP 노드는 total=0 반환', () => {
    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Empty WP',
      children: []
    }
    const stats = calculateProgressStats(node)
    expect(stats.total).toBe(0)
    expect(stats.completed).toBe(0)
  })

  it('완료된 Task만 있는 WP는 completed=total', () => {
    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Completed WP',
      children: [
        { id: 'TSK-01', type: 'task', title: 'T1', status: '[xx]', children: [] },
        { id: 'TSK-02', type: 'task', title: 'T2', status: '[xx]', children: [] }
      ]
    }
    const stats = calculateProgressStats(node)
    expect(stats.total).toBe(2)
    expect(stats.completed).toBe(2)
    expect(stats.inProgress).toBe(0)
    expect(stats.todo).toBe(0)
  })

  it('다양한 상태의 Task가 있는 WP는 정확한 카운트', () => {
    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Mixed WP',
      children: [
        {
          id: 'ACT-01-01',
          type: 'act',
          title: 'Act 1',
          children: [
            { id: 'TSK-01', type: 'task', title: 'T1', status: '[ ]', children: [] },
            { id: 'TSK-02', type: 'task', title: 'T2', status: '[bd]', children: [] },
            { id: 'TSK-03', type: 'task', title: 'T3', status: '[xx]', children: [] }
          ]
        },
        { id: 'TSK-04', type: 'task', title: 'T4', status: '[im]', children: [] }
      ]
    }
    const stats = calculateProgressStats(node)
    expect(stats.total).toBe(4)
    expect(stats.todo).toBe(1)           // [ ]
    expect(stats.inProgress).toBe(2)     // [bd], [im]
    expect(stats.completed).toBe(1)      // [xx]
    expect(stats.byStatus['[ ]']).toBe(1)
    expect(stats.byStatus['[bd]']).toBe(1)
    expect(stats.byStatus['[im]']).toBe(1)
    expect(stats.byStatus['[xx]']).toBe(1)
  })

  it('중첩된 ACT 구조에서 모든 Task 수집', () => {
    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Nested WP',
      children: [
        {
          id: 'ACT-01-01',
          type: 'act',
          title: 'Act 1',
          children: [
            {
              id: 'ACT-01-01-01',
              type: 'act',
              title: 'Sub Act',
              children: [
                { id: 'TSK-01', type: 'task', title: 'T1', status: '[xx]', children: [] }
              ]
            }
          ]
        }
      ]
    }
    const stats = calculateProgressStats(node)
    expect(stats.total).toBe(1)
    expect(stats.completed).toBe(1)
  })
})
```

---

### 4.2 getStatusSeverity (신규 추가)

**파일**: `app/utils/wbsProgress.ts` (기존 파일에 추가)

**R-06 지적사항 반영**: WpActProgress와 WpActChildren에서 중복 정의된 함수를 유틸리티로 분리

#### 4.2.1 함수 시그니처

```typescript
/**
 * Task 상태 코드에 따른 PrimeVue Badge severity 반환
 * WpActProgress, WpActChildren에서 공통 사용
 *
 * @param status - Task 상태 코드 ('[ ]', '[bd]', '[dd]', '[im]', '[vf]', '[xx]', 등)
 * @returns PrimeVue Badge severity ('secondary' | 'info' | 'warning' | 'success')
 *
 * @example
 * const severity = getStatusSeverity('[xx]')  // 'success'
 * const severity = getStatusSeverity('[bd]')  // 'info'
 */
export function getStatusSeverity(status: string): string {
  const severityMap: Record<string, string> = {
    '[ ]': 'secondary',   // 회색 - 대기
    '[bd]': 'info',       // 파란색 - 기본설계
    '[dd]': 'info',       // 파란색 - 상세설계
    '[an]': 'warning',    // 주황색 - 분석 (defect)
    '[ds]': 'info',       // 파란색 - 설계 (infrastructure)
    '[im]': 'warning',    // 주황색 - 구현
    '[fx]': 'warning',    // 주황색 - 수정 (defect)
    '[vf]': 'success',    // 초록색 - 검증
    '[xx]': 'success',    // 초록색 - 완료
  }
  return severityMap[status] || 'secondary'
}
```

#### 4.2.2 사용 위치

**WpActProgress.vue**:
```typescript
import { getStatusSeverity } from '~/utils/wbsProgress'

// 기존 로컬 함수 제거
// function getStatusSeverity(status: string): string { ... }

// Template에서 직접 사용
<Badge :severity="getStatusSeverity(status as string)" />
```

**WpActChildren.vue**:
```typescript
import { getStatusSeverity } from '~/utils/wbsProgress'

// 기존 로컬 함수 제거
// function getStatusSeverity(status: string): string { ... }

// Template에서 직접 사용
<Badge :severity="getStatusSeverity(child.status)" />
```

---

## 5. wbs.vue 수정 설계

### 5.1 파일 정보

**경로**: `app/pages/wbs.vue`

### 5.2 변경 사항

#### 5.2.1 Import 추가

```typescript
import NodeDetailPanel from '~/components/wbs/detail/NodeDetailPanel.vue'
```

#### 5.2.2 Template 수정

**Before**:
```vue
<template #right>
  <div class="h-full" aria-label="Task 상세 패널">
    <div v-if="!isContentReady" ...>
      <!-- 빈 상태 -->
    </div>
    <TaskDetailPanel v-else />
  </div>
</template>
```

**After**:
```vue
<template #right>
  <div class="h-full" aria-label="노드 상세 패널">
    <div v-if="!isContentReady" ...>
      <!-- 빈 상태 -->
    </div>
    <NodeDetailPanel v-else />
  </div>
</template>
```

#### 5.2.3 변경 영향

- `TaskDetailPanel` → `NodeDetailPanel` 교체
- NodeDetailPanel 내부에서 Task/WP/ACT 분기 처리
- 기존 로직 변경 없음 (호환성 유지)

---

## 6. CSS 클래스 설계

### 6.1 파일 정보

**경로**: `app/assets/css/main.css`

### 6.2 신규 CSS 클래스

```css
/* ============================================
 * WP/ACT Detail Panel 스타일 (TSK-05-05)
 * ============================================ */

/* WpActDetailPanel 컨테이너 */
.wp-act-detail-panel {
  @apply h-full flex flex-col;
}

.wp-act-detail-content {
  @apply p-4 space-y-4 overflow-y-auto;
  max-height: calc(100vh - 8rem);
}

/* WpActBasicInfo */
.wp-act-basic-info .field {
  @apply mb-3;
}

.wp-act-basic-info .field:last-child {
  @apply mb-0;
}

/* WpActProgress - 다단계 ProgressBar */
.progress-segments {
  @apply w-full;
}

.progress-segment-track {
  @apply flex h-4 rounded-full overflow-hidden bg-border;
}

.progress-segment {
  @apply transition-all duration-300;
}

.progress-segment-completed {
  @apply bg-success;
}

.progress-segment-inprogress {
  @apply bg-warning;
}

.progress-segment-todo {
  @apply bg-text-muted;
}

/* WpActChildren - 하위 노드 목록 */
.children-list {
  @apply space-y-2 max-h-[400px] overflow-y-auto;
}

.child-item {
  @apply p-3 rounded-lg border border-border bg-bg-card cursor-pointer transition-all;
}

.child-item:hover {
  @apply border-border-light bg-slate-700/50 shadow-md;
}

.child-item:focus {
  @apply ring-2 ring-primary ring-offset-2 ring-offset-bg;
}

.child-header {
  @apply flex items-center justify-between gap-2;
}

.child-info {
  @apply mt-2 pt-2 border-t border-border/50;
}

/* 애니메이션: 패널 전환 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

### 6.3 기존 클래스 재사용

**이미 정의된 클래스**:
- `.node-icon`, `.node-icon-wp`, `.node-icon-act`, `.node-icon-task`
- `.progress-bar-low`, `.progress-bar-medium`, `.progress-bar-high`
- Tailwind 유틸리티: `text-success`, `text-warning`, `text-text-muted`, `bg-border`, 등

---

## 7. 에러 처리 및 검증

### 7.1 에러 케이스

| 케이스 | 검증 방법 | 처리 방안 |
|--------|----------|----------|
| `selectedNode === null` | NodeDetailPanel computed | 빈 상태 메시지 표시 |
| `children.length === 0` | WpActChildren template | "하위 노드가 없습니다" 표시 |
| `wbsStore.getNode() === undefined` | selectionStore computed | null 반환 및 빈 상태 표시 |
| `progress === undefined` | WpActBasicInfo computed | 기본값 0 사용 |
| `taskCount === undefined` | WpActChildren template | 기본값 0 표시 |

### 7.2 타입 가드

```typescript
// selectionStore에서 사용
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value) return null
  if (isTaskSelected.value) return null

  const wbsStore = useWbsStore()
  const node = wbsStore.getNode(selectedNodeId.value)

  // undefined → null 변환
  return node || null
})
```

---

## 8. 접근성 (ARIA) 설계

### 8.1 ARIA 속성 매핑

| 컴포넌트 | 요소 | ARIA 속성 |
|---------|------|-----------|
| NodeDetailPanel | 컨테이너 | `role="region"`, `aria-label="노드 상세 정보"` |
| WpActDetailPanel | Card | `role="region"`, `:aria-label="\`${nodeTypeLabel} 상세 정보\`"` |
| WpActChildren | 목록 컨테이너 | `role="list"`, `aria-label="하위 노드 목록"` |
| WpActChildren | 아이템 | `role="listitem"`, `tabindex="0"`, `:aria-label="\`${child.title} 선택\`"` |
| WpActProgress | ProgressBar | `role="progressbar"`, `:aria-valuenow="..."`, `aria-valuemin="0"`, `aria-valuemax="100"` |

### 8.2 키보드 네비게이션

**하위 노드 목록 (WpActChildren)**:
```vue
<div
  role="listitem"
  tabindex="0"
  @click="handleChildClick(child.id)"
  @keydown.enter="handleChildClick(child.id)"
>
```

**지원 키**:
- `Tab`: 다음 노드로 포커스 이동
- `Shift+Tab`: 이전 노드로 포커스 이동
- `Enter`: 선택된 노드 활성화

---

## 9. 성능 최적화 전략

### 9.1 Computed 캐싱

**progressStats**:
```typescript
const progressStats = computed((): ProgressStats => {
  return calculateProgressStats(props.node)
})
```
- Vue Reactivity 시스템으로 자동 캐싱
- `props.node` 변경 시에만 재계산

### 9.2 재귀 탐색 최적화

**Early Return 전략**:
```typescript
function collectTasks(n: WbsNode): void {
  if (n.type === 'task') {
    allTasks.push(n)
    return  // Early return - children 탐색 불필요
  }
  if (n.children && n.children.length > 0) {
    n.children.forEach(collectTasks)
  }
}
```

### 9.3 렌더링 최적화

**v-for 키 바인딩**:
```vue
<div
  v-for="child in children"
  :key="child.id"
>
```
- 고유 ID로 Vue의 패치 알고리즘 최적화

---

## 10. 테스트 명세 (상세)

### 10.1 단위 테스트

#### 10.1.1 calculateProgressStats

**파일**: `tests/unit/utils/wbsProgress.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateProgressStats } from '~/utils/wbsProgress'
import type { WbsNode } from '~/types'

describe('calculateProgressStats', () => {
  // 테스트 케이스는 섹션 4.1.4 참조
})
```

#### 10.1.2 WpActChildren

**파일**: `tests/unit/components/wbs/detail/WpActChildren.test.ts`

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import WpActChildren from '~/components/wbs/detail/WpActChildren.vue'

describe('WpActChildren', () => {
  it('하위 노드 목록을 렌더링한다', () => {
    const children = [
      { id: 'ACT-01-01', title: 'Test ACT', type: 'act', children: [] },
      { id: 'TSK-01-01', title: 'Test Task', type: 'task', status: '[xx]', children: [] }
    ]
    const wrapper = mount(WpActChildren, {
      props: { children }
    })
    expect(wrapper.findAll('.child-item').length).toBe(2)
  })

  it('빈 children 배열일 때 빈 상태 메시지를 표시한다', () => {
    const wrapper = mount(WpActChildren, {
      props: { children: [] }
    })
    expect(wrapper.find('[data-testid="children-empty-message"]').exists()).toBe(true)
  })

  it('하위 노드 클릭 시 select 이벤트를 emit한다', async () => {
    const children = [
      { id: 'ACT-01-01', title: 'Test', type: 'act', children: [] }
    ]
    const wrapper = mount(WpActChildren, {
      props: { children }
    })
    await wrapper.find('[data-testid="child-item-ACT-01-01"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['ACT-01-01']])
  })

  it('Enter 키로 하위 노드를 선택할 수 있다', async () => {
    const children = [
      { id: 'ACT-01-01', title: 'Test', type: 'act', children: [] }
    ]
    const wrapper = mount(WpActChildren, {
      props: { children }
    })
    const item = wrapper.find('[data-testid="child-item-ACT-01-01"]')
    await item.trigger('keydown.enter')
    expect(wrapper.emitted('select')).toEqual([['ACT-01-01']])
  })
})
```

### 10.2 통합 테스트

#### 10.2.1 selectionStore 확장

**파일**: `tests/unit/stores/selection.test.ts`

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '~/stores/selection'
import { useWbsStore } from '~/stores/wbs'

describe('selectionStore - WP/ACT 확장', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isWpOrActSelected: WP 선택 시 true', () => {
    const store = useSelectionStore()
    store.selectedNodeId = 'WP-01'
    expect(store.isWpOrActSelected).toBe(true)
  })

  it('isWpOrActSelected: ACT 선택 시 true', () => {
    const store = useSelectionStore()
    store.selectedNodeId = 'ACT-01-01'
    expect(store.isWpOrActSelected).toBe(true)
  })

  it('isWpOrActSelected: Task 선택 시 false', () => {
    const store = useSelectionStore()
    store.selectedNodeId = 'TSK-01-01-01'
    expect(store.isWpOrActSelected).toBe(false)
  })

  it('selectedNode: WP 선택 시 해당 노드 반환', () => {
    const wbsStore = useWbsStore()
    wbsStore.flatNodes.set('WP-01', {
      id: 'WP-01',
      type: 'wp',
      title: 'Test WP',
      children: []
    })

    const store = useSelectionStore()
    store.selectedNodeId = 'WP-01'
    expect(store.selectedNode?.id).toBe('WP-01')
  })

  it('selectedNode: Task 선택 시 null 반환', () => {
    const store = useSelectionStore()
    store.selectedNodeId = 'TSK-01-01-01'
    expect(store.selectedNode).toBeNull()
  })
})
```

### 10.3 E2E 테스트

**파일**: `tests/e2e/wp-act-detail-panel.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('WP/ACT Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=jjiban')
    await page.waitForSelector('[data-testid="wbs-content"]')
  })

  test('WP 선택 시 WpActDetailPanel 렌더링', async ({ page }) => {
    // WP 노드 클릭
    await page.click('[data-testid="node-WP-01"]')

    // WpActDetailPanel 표시 확인
    await expect(page.locator('[data-testid="wp-act-detail-panel"]')).toBeVisible()

    // 기본 정보 확인
    await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('WP-01')
    await expect(page.locator('[data-testid="node-progress-bar"]')).toBeVisible()

    // 진행 상황 확인
    await expect(page.locator('[data-testid="wp-act-progress-panel"]')).toBeVisible()

    // 하위 노드 목록 확인
    await expect(page.locator('[data-testid="wp-act-children-panel"]')).toBeVisible()
  })

  test('ACT 선택 시 WpActDetailPanel 렌더링', async ({ page }) => {
    // ACT 노드 클릭
    await page.click('[data-testid="node-ACT-01-01"]')

    // WpActDetailPanel 표시 확인
    await expect(page.locator('[data-testid="wp-act-detail-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('ACT-01-01')
  })

  test('하위 노드 클릭 시 선택 변경', async ({ page }) => {
    // WP 선택
    await page.click('[data-testid="node-WP-01"]')

    // 하위 ACT 클릭
    await page.click('[data-testid="child-item-ACT-01-01"]')

    // WpActDetailPanel이 ACT 정보로 업데이트 확인
    await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('ACT-01-01')

    // 하위 Task 클릭
    await page.click('[data-testid="child-item-TSK-01-01-01"]')

    // TaskDetailPanel로 전환 확인
    await expect(page.locator('[data-testid="task-detail-panel"]')).toBeVisible()
  })

  test('진행률 시각화 정확성 검증', async ({ page }) => {
    await page.click('[data-testid="node-WP-01"]')

    // 다단계 ProgressBar 표시 확인
    const progressSegments = page.locator('[data-testid="progress-segments"]')
    await expect(progressSegments).toBeVisible()

    // 상태별 분포 확인
    const statusCounts = page.locator('[data-testid^="status-count-"]')
    await expect(statusCounts.first()).toBeVisible()
  })

  test('빈 WP/ACT의 빈 상태 메시지', async ({ page }) => {
    // 하위 노드가 없는 WP 클릭 (테스트 데이터 필요)
    await page.click('[data-testid="node-WP-EMPTY"]')

    // 빈 상태 메시지 확인
    await expect(page.locator('[data-testid="children-empty-message"]')).toBeVisible()
  })

  test('키보드 네비게이션: Enter로 하위 노드 선택', async ({ page }) => {
    await page.click('[data-testid="node-WP-01"]')

    // 첫 번째 하위 노드에 포커스
    const firstChild = page.locator('[data-testid^="child-item-"]').first()
    await firstChild.focus()

    // Enter 키로 선택
    await firstChild.press('Enter')

    // 선택 변경 확인
    await expect(page.locator('[data-testid="node-id-badge"]')).not.toHaveText('WP-01')
  })
})
```

---

## 11. 의존성 및 임포트

### 11.1 신규 파일별 임포트

#### NodeDetailPanel.vue
```typescript
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import TaskDetailPanel from './TaskDetailPanel.vue'
import WpActDetailPanel from './WpActDetailPanel.vue'
import Message from 'primevue/message'
```

#### WpActDetailPanel.vue
```typescript
import { computed } from 'vue'
import Card from 'primevue/card'
import WpActBasicInfo from './WpActBasicInfo.vue'
import WpActProgress from './WpActProgress.vue'
import WpActChildren from './WpActChildren.vue'
import type { WbsNode, ProgressStats } from '~/types'
import { calculateProgressStats } from '~/utils/wbsProgress'
```

#### WpActBasicInfo.vue
```typescript
import { computed } from 'vue'
import Panel from 'primevue/panel'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import type { WbsNode } from '~/types'
```

#### WpActProgress.vue
```typescript
import { computed } from 'vue'
import Panel from 'primevue/panel'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import type { ProgressStats } from '~/types'
```

#### WpActChildren.vue
```typescript
import { computed } from 'vue'
import Panel from 'primevue/panel'
import Message from 'primevue/message'
import Badge from 'primevue/badge'
import type { WbsNode, WbsNodeType } from '~/types'
```

#### utils/wbsProgress.ts
```typescript
import type { WbsNode, ProgressStats } from '~/types'

/**
 * R-06 반영: calculateProgressStats, getStatusSeverity 함수 모두 export
 */
export { calculateProgressStats, getStatusSeverity }
```

---

## 12. 마이그레이션 계획

### 12.1 단계별 마이그레이션

**Phase 1: 타입 정의 추가**
1. `app/types/index.ts`에 `ProgressStats` 타입 추가
2. selectionStore에 `isWpOrActSelected`, `selectedNode` computed 추가
3. 테스트로 타입 정의 검증

**Phase 2: 유틸리티 함수 구현**
1. `app/utils/wbsProgress.ts` 생성
2. `calculateProgressStats` 구현
3. 단위 테스트 작성 및 실행

**Phase 3: 하위 컴포넌트 구현**
1. `WpActBasicInfo.vue` 구현
2. `WpActProgress.vue` 구현
3. `WpActChildren.vue` 구현
4. 각 컴포넌트별 단위 테스트

**Phase 4: 컨테이너 통합**
1. `WpActDetailPanel.vue` 구현
2. `NodeDetailPanel.vue` 구현
3. `wbs.vue` 수정 (TaskDetailPanel → NodeDetailPanel)

**Phase 5: CSS 및 스타일링**
1. `main.css`에 신규 클래스 추가
2. 반응형 테스트

**Phase 6: E2E 테스트**
1. WP/ACT 선택 시나리오
2. 하위 노드 클릭 시나리오
3. 키보드 네비게이션 테스트

**Phase 7: 문서화 및 배포**
1. 코드 리뷰
2. 문서 업데이트 (README, CHANGELOG)
3. wbs.md 상태 업데이트: `[dd]` → `[im]`

---

## 13. 향후 확장 고려사항

### 13.1 필터링/정렬 기능

**WpActChildren 확장**:
```typescript
interface Props {
  children: WbsNode[]
  filterStatus?: string    // 상태 필터 (예: '[xx]')
  sortBy?: 'id' | 'title' | 'progress'  // 정렬 기준
}

const filteredChildren = computed(() => {
  let result = [...props.children]

  // 필터링
  if (props.filterStatus) {
    result = result.filter(child => child.status === props.filterStatus)
  }

  // 정렬
  if (props.sortBy === 'progress') {
    result.sort((a, b) => (b.progress || 0) - (a.progress || 0))
  }

  return result
})
```

### 13.2 편집 기능

**WpActBasicInfo 인라인 편집**:
```typescript
const isEditingTitle = ref(false)
const editedTitle = ref('')

function startEditTitle() {
  isEditingTitle.value = true
  editedTitle.value = props.node.title
}

async function saveTitle() {
  // API 호출
  await updateNodeTitle(props.node.id, editedTitle.value)
  isEditingTitle.value = false
}
```

### 13.3 시각화 개선

**Gantt 차트 미니 뷰**:
- 하위 Task 일정을 간단한 타임라인으로 표시
- Frappe Gantt 라이브러리 재사용

**담당자별 분포 차트**:
- PrimeVue Chart (PieChart) 활용
- 담당자별 Task 카운트 시각화

---

## 14. 요약 및 체크리스트

### 14.1 설계 완료 항목

- [x] 타입 정의 (ProgressStats)
- [x] 컴포넌트별 Props/Emits 인터페이스
- [x] Computed 속성 및 메서드 시그니처
- [x] 유틸리티 함수 알고리즘 (calculateProgressStats)
- [x] 스토어 확장 설계 (selectionStore)
- [x] Template 구조 설계
- [x] CSS 클래스 설계
- [x] 에러 처리 및 타입 가드
- [x] 접근성 (ARIA) 설계
- [x] 성능 최적화 전략
- [x] 단위 테스트 명세
- [x] 통합 테스트 명세
- [x] E2E 테스트 명세
- [x] 의존성 및 임포트 정리
- [x] 마이그레이션 계획
- [x] 향후 확장 고려사항

### 14.2 다음 단계

**구현 준비**:
1. 타입 정의 추가
2. 유틸리티 함수 구현 및 테스트
3. 컴포넌트 순차 구현 (BasicInfo → Progress → Children → DetailPanel → NodeDetailPanel)
4. CSS 추가 및 스타일링
5. E2E 테스트 실행
6. 코드 리뷰 및 배포

**산출물**:
- `030-implementation.md`: 구현 완료 후 작성
- `031-code-review-claude-1.md`: 코드 리뷰 결과
- `070-integration-test.md`: 통합 테스트 결과
- `080-manual.md`: 사용자 매뉴얼

---

## 15. 참고 자료

### 15.1 관련 문서

- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md`
- 화면설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md`
- PRD 섹션 6.3: Task Detail Panel
- 기존 구현: `app/components/wbs/detail/TaskDetailPanel.vue`

### 15.2 타입 정의

- `app/types/index.ts`: 기존 타입 정의
- `app/stores/selection.ts`: 선택 스토어
- `app/stores/wbs.ts`: WBS 스토어

### 15.3 외부 리소스

- [Vue 3 Composition API](https://vuejs.org/guide/typescript/composition-api.html)
- [PrimeVue 4.x Components](https://primevue.org/)
- [Vitest Unit Testing](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)

---

## 16. 변경 이력

| 버전 | 날짜 | 변경 내용 | 변경 사유 | 영향 범위 |
|------|------|----------|----------|----------|
| 1.1 | 2025-12-16 | H-01 지적사항 반영: selectionStore.selectedNode에 wbsStore 데이터 로드 검증 추가 | 설계리뷰 피드백 | §3.1.1 |
| 1.1 | 2025-12-16 | R-05 지적사항 반영: calculateProgressStats 타입 안전성 강화 (null 방어, Early return, Array.isArray 검증) | 설계리뷰 피드백 | §4.1.2 |
| 1.1 | 2025-12-16 | R-06 권장사항 반영: getStatusSeverity 함수 중복 제거, utils/wbsProgress.ts로 통합 | 설계리뷰 피드백 | §2.4.4, §2.5.3, §4.2 |
| 1.1 | 2025-12-16 | M-02 개선 권장사항 반영: WpActChildren 빈 상태 UX 개선 (아이콘, 안내 메시지 추가) | 설계리뷰 피드백 | §2.5.4 |
| 1.0 | 2025-12-16 | 초기 작성 | - | 전체 |

---

**문서 버전**: 1.1
**최종 수정**: 2025-12-16
**리뷰 반영**: 021-design-review-claude-1.md (H-01, R-05, R-06, M-02)
**다음 단계**: 추적성 매트릭스 (025-traceability-matrix.md), 테스트 명세 (026-test-specification.md)
