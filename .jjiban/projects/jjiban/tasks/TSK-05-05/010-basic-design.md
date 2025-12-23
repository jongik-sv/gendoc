# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.3 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-05-05 |
| 의존 Task | TSK-05-01 (Detail Panel Structure) | 컨테이너 구조 및 스토어 연동 |
| 타입 정의 | `types/index.ts` | WbsNode, WbsNodeType |

---

## 1. 목적 및 범위

### 1.1 목적

WBS 트리에서 WP(Work Package) 또는 ACT(Activity) 노드를 선택했을 때, 우측 Detail Panel에 해당 노드의 정보를 표시하는 기능을 설계합니다. Task 노드와 달리 WP/ACT는 하위 노드들의 집계 정보(진행률, 하위 노드 목록, 상태별 카운트)를 중심으로 표시합니다.

**해결하는 문제**:
- 현재 우측 패널은 Task만 표시 가능, WP/ACT 선택 시 빈 상태
- WP/ACT의 전체 진행 상황을 한눈에 파악하기 어려움
- 하위 Task 목록을 확인하려면 트리를 일일이 펼쳐야 함

**제공하는 가치**:
- WP/ACT 레벨에서 프로젝트 진행 상황 조망
- 하위 노드 목록을 필터링/정렬하여 빠른 탐색 가능
- 상태별 카운트로 병목 구간 식별 용이

### 1.2 범위

**포함 범위**:
- NodeDetailPanel: 노드 타입별 분기 처리 (Task/WP/ACT)
- WpActBasicInfo: WP/ACT 기본 정보 (ID, 제목, 일정, 진행률)
- WpActChildren: 하위 노드 목록 및 상태별 카운트
- WpActProgress: 진행률 시각화 (완료/진행/대기 비율)
- selectionStore 확장: WP/ACT 선택 시 노드 데이터 제공
- wbs.vue 패널 분기 로직 수정

**제외 범위**:
- WP/ACT 편집 기능 (현재 요구사항에 없음)
- 상태 전이 기능 (WP/ACT는 집계값만 표시)
- 문서 관리 기능 (Task만 해당)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WP/ACT 선택 시 기본 정보 표시 (ID, 제목, 일정, 진행률) | Critical | 섹션 6.3 |
| FR-002 | 하위 노드 목록 표시 (WP의 ACT/Task, ACT의 Task) | Critical | 섹션 6.3 |
| FR-003 | 상태별 카운트 표시 (Todo/Design/Detail/Implement/Verify/Done) | High | 섹션 6.3 |
| FR-004 | 진행률 시각화 (완료/진행/대기 비율) | High | 섹션 6.3 |
| FR-005 | 하위 노드 클릭 시 선택 변경 및 상세 패널 업데이트 | Medium | 사용자 경험 |
| FR-006 | wbs.vue에서 노드 타입별 패널 분기 처리 | Critical | 통합 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 노드 선택 응답 시간 | < 100ms (이미 로드된 데이터 사용) |
| NFR-002 | 하위 노드 카운팅 성능 | < 50ms (재귀 탐색 최적화) |
| NFR-003 | 컴포넌트 재사용성 | WP/ACT 공통 컴포넌트 활용 |
| NFR-004 | 타입 안전성 | WbsNode 타입 기반 타입 가드 |

---

## 3. 기존 구현 분석

### 3.1 TaskDetailPanel 구조

**현재 구현** (`TaskDetailPanel.vue`):
```
TaskDetailPanel (Container)
├── 로딩/에러/빈 상태 분기
├── TaskBasicInfo (ID, 제목, 카테고리, 우선순위, 담당자)
├── TaskProgress (현재 상태, 워크플로우)
├── TaskWorkflow (워크플로우 흐름)
├── TaskActions (편집, 상태 전이)
├── TaskRequirements (요구사항 목록)
├── TaskDocuments (문서 목록)
└── TaskHistory (상태 변경 이력)
```

**특징**:
- selectionStore.selectedTask (TaskDetail 타입) 사용
- Task 전용 API 호출 (`/api/tasks/:id`)
- 인라인 편집 및 상태 전이 기능 포함

### 3.2 selectionStore 현재 구현

**파일**: `app/stores/selection.ts`

**주요 속성**:
```typescript
selectedNodeId: ref<string | null>(null)      // 선택된 노드 ID
selectedTask: ref<TaskDetail | null>(null)    // Task 상세 정보 (Task만)
loadingTask: ref(false)                       // Task 로딩 상태
error: ref<string | null>(null)               // 에러 메시지
```

**주요 메서드**:
```typescript
selectNode(nodeId: string)                    // 노드 선택
loadTaskDetail(taskId: string)                // Task 상세 로드
refreshTaskDetail()                           // Task 새로고침
clearSelection()                              // 선택 해제
```

**주요 Computed**:
```typescript
hasSelection: computed(() => selectedNodeId.value !== null)
selectedNodeType: computed((): WbsNodeType | null => {
  // ID 패턴으로 타입 추론: WP-XX, ACT-XX-XX, TSK-XX-XX-XX
})
isTaskSelected: computed(() => selectedNodeType.value === 'task')
```

**현재 동작**:
- Task 선택 시: `loadTaskDetail()` 호출하여 API에서 상세 정보 로드
- WP/ACT 선택 시: `selectedTask.value = null` 설정 (빈 상태)

### 3.3 wbs.vue 패널 렌더링 로직

**파일**: `app/pages/wbs.vue`

**현재 구현**:
```vue
<template #right>
  <div class="h-full" aria-label="Task 상세 패널">
    <!-- 로딩/에러/프로젝트없음 상태 -->
    <div v-if="!isContentReady" ...>
      빈 상태 표시
    </div>

    <!-- Task 상세 정보 표시 -->
    <TaskDetailPanel v-else />
  </div>
</template>
```

**문제점**:
- `TaskDetailPanel` 내부에서 `selectedTask`가 null이면 빈 상태 메시지 표시
- WP/ACT 전용 패널 없음

---

## 4. WP/ACT vs Task 차이점 분석

### 4.1 데이터 구조 차이

| 속성 | Task (TaskDetail) | WP/ACT (WbsNode) |
|------|-------------------|------------------|
| 데이터 소스 | API (`/api/tasks/:id`) | wbsStore.nodes (이미 로드됨) |
| 타입 정의 | TaskDetail (전용 인터페이스) | WbsNode (공통 타입) |
| 주요 속성 | status, category, priority, assignee, documents, history | title, schedule, progress, taskCount, children |
| 편집 가능 여부 | 가능 (인라인 편집) | 불가 (집계값) |
| 하위 노드 | 없음 | children 배열 |

### 4.2 표시 콘텐츠 차이

**Task 패널**:
- 기본 정보: ID, 제목, 카테고리, 우선순위, 담당자
- 워크플로우: 현재 상태, 가능한 전이
- 요구사항: requirements 배열
- 문서: 문서 목록 및 뷰어
- 이력: 상태 변경 이력

**WP/ACT 패널**:
- 기본 정보: ID, 제목, 일정, 진행률
- 하위 노드: children 목록 (상태별 필터링)
- 진행률: 완료/진행/대기 비율 시각화
- 상태별 카운트: Todo/Design/Detail/Implement/Verify/Done

### 4.3 사용자 인터랙션 차이

**Task 패널**:
- 인라인 편집 (제목, 우선순위, 담당자)
- 상태 전이 버튼 (start, draft, build, verify, done)
- 문서 열기/생성

**WP/ACT 패널**:
- 읽기 전용 (편집 불가)
- 하위 노드 클릭 → 선택 변경
- 필터링/정렬 (옵션)

---

## 5. 설계 방향

### 5.1 아키텍처 개요

**분기 전략**: 컨테이너 레벨에서 노드 타입별 분기

```
wbs.vue (우측 패널)
├── [로딩/에러/빈 상태]
└── NodeDetailPanel (새로운 분기 컨테이너)
    ├── TaskDetailPanel (selectedNodeType === 'task')
    └── WpActDetailPanel (selectedNodeType === 'wp' || 'act')
        ├── WpActBasicInfo (ID, 제목, 일정, 진행률)
        ├── WpActProgress (진행률 시각화)
        └── WpActChildren (하위 노드 목록, 상태별 카운트)
```

**대안 검토**:

| 방안 | 장점 | 단점 | 선택 |
|------|------|------|------|
| 1. TaskDetailPanel 내부 분기 | 기존 구조 유지 | Task 전용 로직과 혼재, 복잡도 증가 | ❌ |
| 2. 별도 WpActDetailPanel | 관심사 분리, 명확한 책임 | 컴포넌트 수 증가 | ✅ |
| 3. wbs.vue에서 직접 분기 | 간단한 구조 | 페이지 로직 비대화 | ❌ |

**선택 이유**: 방안 2 (별도 컴포넌트)
- Task와 WP/ACT는 데이터 소스, 표시 내용, 인터랙션이 완전히 다름
- 단일 책임 원칙 (SRP): 각 컴포넌트가 하나의 노드 타입만 처리
- 유지보수성: Task 로직 수정 시 WP/ACT 영향 없음

### 5.2 컴포넌트 구조 설계

#### 5.2.1 NodeDetailPanel (새로운 분기 컨테이너)

**위치**: `app/components/wbs/detail/NodeDetailPanel.vue`

**책임**:
- selectionStore 구독
- 선택된 노드 타입 확인
- Task/WP/ACT 패널 분기 렌더링

**Props**: 없음 (스토어에서 직접 참조)

**템플릿 구조**:
```vue
<template>
  <TaskDetailPanel v-if="selectionStore.isTaskSelected" />
  <WpActDetailPanel v-else-if="isWpOrActSelected" :node="selectedNode" />
  <EmptyState v-else />
</template>
```

#### 5.2.2 WpActDetailPanel (WP/ACT 전용 컨테이너)

**위치**: `app/components/wbs/detail/WpActDetailPanel.vue`

**책임**:
- WP/ACT 노드 데이터 받기
- 하위 노드 집계 (상태별 카운트, 진행률 계산)
- 하위 컴포넌트 조정

**Props**:
```typescript
interface Props {
  node: WbsNode  // 선택된 WP 또는 ACT 노드
}
```

**템플릿 구조**:
```vue
<template>
  <Card class="wp-act-detail-panel">
    <WpActBasicInfo :node="node" />
    <WpActProgress :stats="progressStats" />
    <WpActChildren :children="node.children" @select="handleNodeSelect" />
  </Card>
</template>
```

#### 5.2.3 WpActBasicInfo (기본 정보)

**위치**: `app/components/wbs/detail/WpActBasicInfo.vue`

**책임**:
- ID, 제목, 일정, 진행률 표시
- 읽기 전용 (편집 없음)

**Props**:
```typescript
interface Props {
  node: WbsNode
}
```

**표시 항목**:
- 노드 ID (Badge)
- 노드 타입 아이콘 (WP/ACT)
- 제목 (읽기 전용)
- 일정 범위 (schedule.start ~ schedule.end)
- 전체 진행률 (node.progress)

**UI 구조**:
```
┌─────────────────────────────────┐
│ 기본 정보                        │
├─────────────────────────────────┤
│ 🔷 WP-01: Platform Infrastructure│
│ 일정: 2025-12-13 ~ 2025-12-20    │
│ 진행률: ████████████ 100%        │
└─────────────────────────────────┘
```

#### 5.2.4 WpActProgress (진행률 시각화)

**위치**: `app/components/wbs/detail/WpActProgress.vue`

**책임**:
- 하위 노드 상태 집계
- 완료/진행/대기 비율 시각화
- 상태별 Task 카운트 표시

**Props**:
```typescript
interface Props {
  stats: ProgressStats  // 계산된 통계
}

interface ProgressStats {
  total: number           // 전체 Task 수
  completed: number       // 완료 Task 수 (status === '[xx]')
  inProgress: number      // 진행 중 Task 수 (status !== '[ ]' && !== '[xx]')
  todo: number            // 대기 Task 수 (status === '[ ]')
  byStatus: Record<string, number>  // 상태별 카운트
}
```

**UI 구조**:
```
┌─────────────────────────────────┐
│ 진행 상황                        │
├─────────────────────────────────┤
│ 전체: 10개 Task                  │
│ 완료: 5개 (50%) | 진행: 3개 (30%) | 대기: 2개 (20%) │
│ ████████████░░░░░░░░            │
│                                  │
│ 상태별 분포:                     │
│ [ ] Todo: 2   [bd] Design: 1     │
│ [dd] Detail: 1   [im] Implement: 1│
│ [vf] Verify: 0   [xx] Done: 5    │
└─────────────────────────────────┘
```

#### 5.2.5 WpActChildren (하위 노드 목록)

**위치**: `app/components/wbs/detail/WpActChildren.vue`

**책임**:
- 하위 노드 목록 렌더링
- 노드별 상태/진행률 표시
- 클릭 시 선택 이벤트 emit

**Props**:
```typescript
interface Props {
  children: WbsNode[]  // 하위 노드 배열
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  select: [nodeId: string]  // 하위 노드 선택 이벤트
}>()
```

**UI 구조**:
```
┌─────────────────────────────────┐
│ 하위 노드 (10)                   │
├─────────────────────────────────┤
│ 🔶 ACT-01-01: Project Setup     │
│    진행률: 100% | Task: 5개      │
│    [xx] Done                     │
│                                  │
│ 🔶 ACT-01-02: App Layout        │
│    진행률: 100% | Task: 2개      │
│    [xx] Done                     │
│                                  │
│ 🔸 TSK-01-03: Integration       │
│    [vf] Verify                   │
└─────────────────────────────────┘
```

### 5.3 데이터 흐름 설계

#### 5.3.1 WP/ACT 선택 시 흐름

```
1. 사용자가 트리에서 WP/ACT 노드 클릭
   └─> WbsTreeNode.handleSelectNode()
       └─> selectionStore.selectNode(nodeId)

2. selectionStore.selectNode() 실행
   ├─> selectedNodeId.value = nodeId
   ├─> selectedNodeType.value 계산 (computed)
   │   └─> 'wp' 또는 'act' 반환
   └─> selectedTask.value = null (Task 아니므로)

3. wbs.vue 우측 패널 반응형 업데이트
   └─> NodeDetailPanel 렌더링
       └─> isWpOrActSelected === true
           └─> WpActDetailPanel 렌더링

4. WpActDetailPanel이 selectedNode 계산
   ├─> wbsStore.nodes에서 selectedNodeId로 노드 검색
   └─> 찾은 WbsNode를 하위 컴포넌트에 전달

5. 하위 컴포넌트 렌더링
   ├─> WpActBasicInfo: node.title, schedule, progress 표시
   ├─> WpActProgress: node.children 순회하여 통계 계산
   └─> WpActChildren: node.children 목록 렌더링
```

#### 5.3.2 하위 노드 클릭 시 흐름

```
1. 사용자가 WpActChildren에서 하위 노드 클릭
   └─> WpActChildren.handleChildClick(childId)
       └─> emit('select', childId)

2. WpActDetailPanel이 이벤트 수신
   └─> handleNodeSelect(childId)
       └─> selectionStore.selectNode(childId)

3. 선택 변경에 따라 패널 자동 업데이트
   ├─> childId가 Task면 TaskDetailPanel 렌더링
   └─> childId가 ACT면 WpActDetailPanel 재렌더링
```

---

## 6. selectionStore 확장 설계

### 6.1 추가 Computed 속성

**현재**:
```typescript
const selectedNodeType = computed((): WbsNodeType | null => {
  if (!selectedNodeId.value) return null
  const id = selectedNodeId.value.toUpperCase()
  if (id.startsWith('WP-')) return 'wp'
  if (id.startsWith('ACT-')) return 'act'
  if (id.startsWith('TSK-')) return 'task'
  return 'project'
})
```

**추가 필요**:
```typescript
// WP 또는 ACT 선택 여부
const isWpOrActSelected = computed(() => {
  const type = selectedNodeType.value
  return type === 'wp' || type === 'act'
})

// 선택된 WbsNode 반환 (WP/ACT 전용)
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value || isTaskSelected.value) return null
  return wbsStore.findNodeById(selectedNodeId.value)
})
```

### 6.2 wbsStore 헬퍼 메서드

**필요 메서드**:
```typescript
// wbsStore에 추가
function findNodeById(nodeId: string): WbsNode | null {
  // nodes 배열을 재귀 탐색하여 nodeId와 일치하는 노드 반환
}
```

**구현 로직**:
```typescript
function findNodeById(nodeId: string, nodes: WbsNode[] = wbsStore.nodes): WbsNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node
    if (node.children.length > 0) {
      const found = findNodeById(nodeId, node.children)
      if (found) return found
    }
  }
  return null
}
```

---

## 7. wbs.vue 수정 설계

### 7.1 현재 구조

```vue
<template #right>
  <div v-if="!isContentReady" ...>빈 상태</div>
  <TaskDetailPanel v-else />
</template>
```

### 7.2 수정 후 구조

```vue
<template #right>
  <div v-if="!isContentReady" ...>빈 상태</div>
  <NodeDetailPanel v-else />
</template>
```

**변경 사항**:
- `TaskDetailPanel` → `NodeDetailPanel` 교체
- NodeDetailPanel 내부에서 Task/WP/ACT 분기 처리

---

## 8. 진행률 계산 로직

### 8.1 ProgressStats 계산 함수

**함수 시그니처**:
```typescript
function calculateProgressStats(node: WbsNode): ProgressStats {
  // node.children 재귀 순회하여 전체 Task 수집
  // 상태별 카운트 집계
  // 완료/진행/대기 비율 계산
}
```

**구현 전략**:
```typescript
function calculateProgressStats(node: WbsNode): ProgressStats {
  const allTasks: WbsNode[] = []

  // 재귀적으로 모든 Task 수집
  function collectTasks(n: WbsNode) {
    if (n.type === 'task') {
      allTasks.push(n)
    } else if (n.children.length > 0) {
      n.children.forEach(collectTasks)
    }
  }

  collectTasks(node)

  // 상태별 카운트
  const byStatus: Record<string, number> = {}
  let completed = 0
  let inProgress = 0
  let todo = 0

  allTasks.forEach(task => {
    const status = task.status || '[ ]'
    byStatus[status] = (byStatus[status] || 0) + 1

    if (status === '[xx]') completed++
    else if (status === '[ ]') todo++
    else inProgress++
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

---

## 9. 컴포넌트 인터페이스 정의

### 9.1 NodeDetailPanel

```typescript
// Props: 없음 (스토어에서 직접 참조)

// Computed:
const selectionStore = useSelectionStore()
const wbsStore = useWbsStore()
const isWpOrActSelected = computed(() => /* ... */)
const selectedNode = computed(() => /* ... */)
```

### 9.2 WpActDetailPanel

```typescript
interface Props {
  node: WbsNode
}

// Computed:
const progressStats = computed(() => calculateProgressStats(props.node))

// Methods:
function handleNodeSelect(nodeId: string) {
  selectionStore.selectNode(nodeId)
}
```

### 9.3 WpActBasicInfo

```typescript
interface Props {
  node: WbsNode
}

// Computed:
const nodeTypeLabel = computed(() => {
  return props.node.type === 'wp' ? 'Work Package' : 'Activity'
})

const scheduleText = computed(() => {
  if (!props.node.schedule) return '-'
  return `${props.node.schedule.start} ~ ${props.node.schedule.end}`
})
```

### 9.4 WpActProgress

```typescript
interface Props {
  stats: ProgressStats
}

// Computed:
const completedPercentage = computed(() => {
  return (props.stats.completed / props.stats.total) * 100
})

const inProgressPercentage = computed(() => {
  return (props.stats.inProgress / props.stats.total) * 100
})

const todoPercentage = computed(() => {
  return (props.stats.todo / props.stats.total) * 100
})
```

### 9.5 WpActChildren

```typescript
interface Props {
  children: WbsNode[]
}

const emit = defineEmits<{
  select: [nodeId: string]
}>()

function handleChildClick(childId: string) {
  emit('select', childId)
}
```

---

## 10. 타입 정의

### 10.1 ProgressStats 타입

```typescript
// types/index.ts에 추가
export interface ProgressStats {
  total: number           // 전체 Task 수
  completed: number       // 완료 Task 수 (status === '[xx]')
  inProgress: number      // 진행 중 Task 수
  todo: number            // 대기 Task 수 (status === '[ ]')
  byStatus: Record<string, number>  // 상태별 카운트
}
```

### 10.2 WbsNode 활용

**이미 정의된 타입 활용**:
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

**WP/ACT에서 사용하는 주요 속성**:
- `id`, `type`, `title`: 기본 식별
- `schedule`: 일정 범위
- `progress`: 진행률 (집계값)
- `taskCount`: 하위 Task 수 (집계값)
- `children`: 하위 노드 배열

---

## 11. 에러 처리 및 엣지 케이스

### 11.1 에러 케이스

| 케이스 | 처리 방안 |
|--------|----------|
| selectedNode가 null | 빈 상태 메시지 표시 |
| children 배열이 비어있음 | "하위 노드가 없습니다" 메시지 |
| wbsStore.findNodeById() 실패 | 에러 메시지 표시 및 로그 |
| progress/taskCount undefined | 기본값 0 사용 |

### 11.2 엣지 케이스

**케이스 1**: WP 바로 아래 Task가 있는 경우 (ACT 없이 3단계 구조)
- WpActChildren에서 Task 노드도 렌더링
- 노드 타입별 아이콘 구분 (ACT vs Task)

**케이스 2**: 빈 WP/ACT (children.length === 0)
```vue
<div v-if="props.children.length === 0" class="empty-state">
  <Message severity="info">하위 노드가 없습니다</Message>
</div>
```

**케이스 3**: 모든 하위 Task가 완료된 경우
- 진행률 100% 표시
- 완료 배지 또는 축하 메시지 (옵션)

---

## 12. 접근성 고려사항

### 12.1 ARIA 속성

**NodeDetailPanel**:
```vue
<div role="region" aria-label="노드 상세 정보">
```

**WpActChildren**:
```vue
<div role="list" aria-label="하위 노드 목록">
  <div v-for="child in children" role="listitem">
```

**하위 노드 클릭**:
```vue
<div
  role="button"
  :aria-label="`${child.title} 선택`"
  tabindex="0"
  @click="handleChildClick(child.id)"
  @keydown.enter="handleChildClick(child.id)"
>
```

### 12.2 키보드 네비게이션

- 하위 노드 목록: 화살표 키로 이동, Enter로 선택
- 포커스 표시: 현재 포커스된 노드 하이라이트

---

## 13. 성능 최적화

### 13.1 Computed 캐싱

**progressStats 계산**:
- `computed(() => calculateProgressStats(props.node))`
- props.node가 변경되지 않으면 재계산 안 함
- Vue의 Reactivity 시스템 활용

### 13.2 재귀 탐색 최적화

**findNodeById 최적화**:
```typescript
// Early return 전략
function findNodeById(nodeId: string, nodes: WbsNode[]): WbsNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node  // 찾으면 즉시 반환
    if (node.children.length > 0) {
      const found = findNodeById(nodeId, node.children)
      if (found) return found  // 하위에서 찾으면 즉시 반환
    }
  }
  return null
}
```

### 13.3 children 목록 렌더링

**가상 스크롤링** (옵션):
- 하위 노드가 100개 이상일 경우 PrimeVue VirtualScroller 적용
- 초기 단계에서는 일반 v-for 사용

---

## 14. 구현 전략

### 14.1 단계별 구현 계획

**Phase 1: 기반 구조** (우선순위: Critical)
1. NodeDetailPanel 생성 (분기 로직)
2. WpActDetailPanel 컨테이너 생성
3. selectionStore에 `isWpOrActSelected`, `selectedNode` computed 추가
4. wbsStore에 `findNodeById` 메서드 추가
5. wbs.vue 패널 분기 로직 수정

**Phase 2: 기본 표시** (우선순위: Critical)
1. WpActBasicInfo 구현 (ID, 제목, 일정, 진행률)
2. 타입 정의 추가 (ProgressStats)
3. 간단한 하위 노드 목록 표시 (WpActChildren)

**Phase 3: 진행률 시각화** (우선순위: High)
1. calculateProgressStats 함수 구현
2. WpActProgress 컴포넌트 구현
3. 상태별 카운트 표시

**Phase 4: 인터랙션** (우선순위: Medium)
1. 하위 노드 클릭 이벤트 연결
2. 선택 변경 시 패널 업데이트 확인

**Phase 5: 개선** (우선순위: Low)
1. 접근성 속성 추가
2. 키보드 네비게이션
3. 성능 최적화 (필요 시)

### 14.2 테스트 포인트

**단위 테스트**:
- `calculateProgressStats()`: 다양한 children 구조에 대한 통계 계산 검증
- `findNodeById()`: 재귀 탐색 정확성 검증
- WpActChildren: 하위 노드 렌더링 및 이벤트 emit 검증

**통합 테스트**:
- WP 선택 → WpActDetailPanel 렌더링 확인
- ACT 선택 → WpActDetailPanel 렌더링 확인
- 하위 노드 클릭 → 선택 변경 및 패널 업데이트 확인

**E2E 테스트**:
- 트리에서 WP 클릭 → 우측 패널에 WP 정보 표시
- WpActChildren에서 Task 클릭 → TaskDetailPanel로 전환

---

## 15. 의존성 및 제약사항

### 15.1 의존 관계

**필수 의존**:
- TSK-05-01 (Detail Panel Structure): TaskDetailPanel 구현 완료
- wbsStore: nodes 데이터 로드 완료
- selectionStore: 노드 선택 기능

**선택 의존**:
- PrimeVue 컴포넌트: Card, Panel, Badge, ProgressBar

### 15.2 제약사항

**데이터 제약**:
- WbsNode는 읽기 전용 (편집 불가)
- progress/taskCount는 집계값 (수동 계산 필요)

**UI 제약**:
- 우측 패널 40% 너비 제약
- 스크롤 가능 영역 고려

**성능 제약**:
- 재귀 탐색 깊이: 최대 4단계 (Project → WP → ACT → Task)
- children 최대 개수: 100개 이하 가정 (초기)

---

## 16. 마이그레이션 및 호환성

### 16.1 기존 기능 보존

**변경 없음**:
- TaskDetailPanel: 기존 기능 그대로 유지
- Task 선택 시 동작: 변경 없음

**변경 사항**:
- wbs.vue 우측 패널: `TaskDetailPanel` → `NodeDetailPanel`로 교체
- selectionStore: computed 속성 추가 (기존 기능 유지)

### 16.2 점진적 마이그레이션

**Step 1**: NodeDetailPanel 생성 및 분기 로직 추가
- Task 선택 시: 기존 TaskDetailPanel 렌더링 (동작 동일)
- WP/ACT 선택 시: 빈 상태 또는 개발 중 메시지

**Step 2**: WpActDetailPanel 구현
- 기본 표시부터 점진적으로 기능 추가

**Step 3**: 완전 통합
- 모든 노드 타입 정상 동작 확인

---

## 17. 향후 확장 가능성

### 17.1 가능한 확장 기능

**필터링/정렬**:
- 하위 노드 목록 상태별 필터링
- 우선순위별, 담당자별 정렬

**편집 기능** (향후 요구사항 발생 시):
- WP/ACT 제목, 일정 수정
- 하위 노드 순서 변경 (드래그 앤 드롭)

**시각화 개선**:
- Gantt 차트 미니 뷰
- 담당자별 Task 분포 차트

### 17.2 확장 설계 고려

**컴포넌트 재사용**:
- WpActChildren: 필터/정렬 props 추가 가능
- WpActProgress: 차트 타입 선택 가능 (Bar/Pie/Donut)

**API 통합** (향후):
- WP/ACT 정보도 API로 제공 가능
- 현재는 wbsStore.nodes 사용

---

## 18. 요약 및 체크리스트

### 18.1 핵심 설계 결정

| 결정 사항 | 이유 |
|----------|------|
| 별도 WpActDetailPanel 생성 | Task와 WP/ACT는 데이터 소스, UI, 인터랙션이 다름 (관심사 분리) |
| NodeDetailPanel 분기 컨테이너 도입 | wbs.vue 단순화, 타입별 패널 명확한 분리 |
| wbsStore.nodes 재사용 | API 호출 없이 이미 로드된 데이터 활용 (성능) |
| 재귀 탐색으로 통계 계산 | progress/taskCount는 집계값, 실시간 계산 필요 |

### 18.2 설계 완료 체크리스트

- [x] 목적 및 범위 명확화
- [x] 요구사항 분석 완료
- [x] 기존 구현 분석 (TaskDetailPanel, selectionStore, wbs.vue)
- [x] WP/ACT vs Task 차이점 분석
- [x] 아키텍처 설계 (분기 전략, 컴포넌트 구조)
- [x] 데이터 흐름 설계
- [x] selectionStore 확장 설계
- [x] wbsStore 헬퍼 메서드 설계
- [x] 컴포넌트 인터페이스 정의
- [x] 타입 정의 (ProgressStats)
- [x] 에러 처리 및 엣지 케이스 고려
- [x] 접근성 고려사항
- [x] 성능 최적화 전략
- [x] 단계별 구현 계획
- [x] 테스트 포인트 정의
- [x] 의존성 및 제약사항 정리

---

## 19. 참고 자료

### 19.1 관련 문서

- PRD 섹션 6.3: Task Detail Panel
- TSK-05-01 기본설계: Detail Panel Structure
- types/index.ts: WbsNode, TaskDetail 타입 정의

### 19.2 코드 참조

- `app/components/wbs/detail/TaskDetailPanel.vue`: Task 패널 구조 참조
- `app/stores/selection.ts`: 현재 선택 스토어 구현
- `app/pages/wbs.vue`: 패널 렌더링 로직

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**다음 단계**: 상세설계 (020-detail-design.md)
