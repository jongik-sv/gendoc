# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-01 |
| Task명 | Detail Panel Structure |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.3, 6.3.1, 6.3.2 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-05-01 |
| 의존 Task | TSK-04-03 (Tree Interaction) | 노드 선택 및 상태 관리 |
| 타입 정의 | `types/index.ts` | TaskDetail, TaskCategory, TaskStatus |

---

## 1. 목적 및 범위

### 1.1 목적

Task 상세 정보를 표시하는 우측 패널의 기본 구조를 설계합니다. 사용자가 WBS 트리에서 선택한 Task의 핵심 정보(ID, 제목, 카테고리, 우선순위, 담당자)와 현재 워크플로우 상태를 직관적으로 확인하고 편집할 수 있는 인터페이스를 제공합니다.

**해결하는 문제**:
- Task 기본 정보를 명확하게 시각화하여 빠른 파악 가능
- 인라인 편집을 통한 즉시 수정 기능 제공
- 현재 워크플로우 상태를 시각적으로 표현하여 진행 상황 이해
- 카테고리별 워크플로우 흐름 차별화

**제공하는 가치**:
- 효율적인 Task 정보 관리
- 직관적인 편집 UX (인라인 편집)
- 워크플로우 진행 상황 투명성
- 일관된 PrimeVue 기반 UI

### 1.2 범위

**포함 범위**:
- TaskDetailPanel: 컨테이너 컴포넌트 (데이터 로드, 레이아웃, 스크롤 관리)
- TaskBasicInfo: 기본 정보 컴포넌트 (ID, 제목, 카테고리, 우선순위, 담당자, 인라인 편집)
- TaskProgress: 워크플로우 진행 상태 컴포넌트 (현재 상태, 워크플로우 시각화)
- Pinia 스토어 연동 (selection.ts)
- Task API 통합 (GET /api/tasks/:id)

**제외 범위**:
- 요구사항, 문서, 이력 섹션 → TSK-05-02
- 편집/액션 버튼 → TSK-05-03
- 문서 뷰어 → TSK-05-04
- 실제 API 저장 로직 (낙관적 업데이트만 포함) → TSK-05-03

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | 선택된 Task 데이터를 API에서 로드하여 표시 | Critical | 섹션 6.3 |
| FR-002 | Task 기본 정보 표시 (ID, 제목, 카테고리, 우선순위, 담당자) | Critical | 섹션 6.3.1 |
| FR-003 | 제목 인라인 편집 (클릭 시 InputText 전환) | High | 섹션 6.3.1 |
| FR-004 | 카테고리 인라인 편집 (Dropdown) | High | 섹션 6.3.1 |
| FR-005 | 우선순위 인라인 편집 (Dropdown) | High | 섹션 6.3.1 |
| FR-006 | 담당자 인라인 편집 (Dropdown, team.json 연동) | High | 섹션 6.3.1 |
| FR-007 | 현재 워크플로우 상태 표시 (상태명, 아이콘) | Critical | 섹션 6.3.2 |
| FR-008 | 워크플로우 흐름 시각화 (카테고리별 차별화) | High | 섹션 6.3.2 |
| FR-009 | 로딩 상태 및 에러 핸들링 표시 | High | 사용자 경험 |
| FR-010 | 선택 없을 시 빈 상태 메시지 표시 | Medium | 사용자 경험 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | Task 로딩 응답 시간 | < 200ms |
| NFR-002 | 인라인 편집 반응성 | < 100ms (낙관적 업데이트) |
| NFR-003 | 컴포넌트 재사용성 | 독립적 Props 인터페이스 |
| NFR-004 | 접근성 | ARIA 속성, 키보드 네비게이션 |
| NFR-005 | 반응형 디자인 | 우측 패널 40% 너비 적응 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌──────────────────────────────────────────┐
│      TaskDetailPanel (Container)         │
│  ┌────────────────────────────────────┐  │
│  │  [Empty State or Loading]          │  │ ← 선택 없음/로딩 중
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      TaskBasicInfo                 │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ ID: TSK-05-01                │  │  │
│  │  │ Title: [Inline Edit]         │  │  │
│  │  │ Category: [Dropdown]         │  │  │
│  │  │ Priority: [Dropdown]         │  │  │
│  │  │ Assignee: [Dropdown]         │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      TaskProgress                  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Current: [bd] Design         │  │  │
│  │  │                               │  │  │
│  │  │ Workflow Flow:                │  │  │
│  │  │ [○] → [●] → [○] → [○] → [○]  │  │  │
│  │  │ Todo  Design Detail Impl Done│  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                           │
│  [Future: Requirements, Docs, History]   │ ← TSK-05-02
└──────────────────────────────────────────┘
         ↕ (Pinia Store)
   ┌───────────────────────┐
   │  useSelectionStore()  │
   │  - selectedNodeId     │
   │  - selectedTask       │
   │  - loadingTask        │
   │  - isTaskSelected     │
   └───────────────────────┘
```

**컨테이너-프레젠테이션 패턴**:
- **TaskDetailPanel**: 컨테이너 (데이터 로드, 상태 관리 조정)
- **TaskBasicInfo, TaskProgress**: 프레젠테이션 (UI 렌더링, 인라인 편집)

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| TaskDetailPanel | 컨테이너 | - Task 데이터 로드 조정<br>- 자식 컴포넌트 통합<br>- 에러 바운더리<br>- 빈 상태 처리 |
| TaskBasicInfo | 기본 정보 UI | - Task 메타데이터 표시<br>- 인라인 편집 UI 제공<br>- 낙관적 업데이트 처리 |
| TaskProgress | 진행 상태 UI | - 현재 워크플로우 상태 표시<br>- 워크플로우 흐름 시각화<br>- 카테고리별 차별화 |

### 3.3 데이터 흐름

```
┌─────────────────┐
│  WbsTreeNode    │
│  (TSK-04-02)    │
└────────┬────────┘
         │ (selectNode 호출)
         ▼
┌───────────────────────────┐
│  useSelectionStore()      │
│  .selectNode(nodeId)      │
└────────┬──────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  /api/tasks/:id             │
│  (GET Request)              │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  TaskDetail 데이터            │
│  { id, title, category, ... }│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Pinia Store State           │
│  - selectedTask: TaskDetail  │
│  - loadingTask: boolean      │
│  - error: string | null      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Reactive Components         │
│  - TaskDetailPanel           │
│  - TaskBasicInfo             │
│  - TaskProgress              │
└──────────────────────────────┘
```

**인라인 편집 흐름**:
```
User Edit → TaskBasicInfo (낙관적 업데이트) → Pinia Store 임시 반영
          → PUT /api/tasks/:id (백그라운드) → 성공: 확정 | 실패: 롤백
```

---

## 4. 컴포넌트 상세 설계

### 4.1 TaskDetailPanel (컨테이너)

**파일 경로**: `app/components/detail/TaskDetailPanel.vue`

**책임**:
- Task 상세 데이터 로드 조정
- 자식 컴포넌트 통합
- 로딩/에러/빈 상태 관리
- 스크롤 가능한 콘텐츠 영역 제공

**Props**: 없음 (스토어에서 선택 정보 직접 조회)

**Emits**: 없음

**주요 로직**:
```typescript
const selectionStore = useSelectionStore()

// Reactive 상태
const selectedTask = computed(() => selectionStore.selectedTask)
const loading = computed(() => selectionStore.loadingTask)
const error = computed(() => selectionStore.error)
const hasSelection = computed(() => selectionStore.hasSelection)
const isTaskSelected = computed(() => selectionStore.isTaskSelected)

// 빈 상태 체크
const isEmpty = computed(() => !hasSelection.value)
const isNonTask = computed(() => hasSelection.value && !isTaskSelected.value)
```

**템플릿 구조**:
```vue
<div class="task-detail-panel h-full overflow-auto">
  <!-- 빈 상태: 선택 없음 -->
  <div v-if="isEmpty" class="empty-state">
    <i class="pi pi-inbox text-6xl text-gray-400" />
    <p class="text-gray-500 mt-4">Task를 선택하세요</p>
  </div>

  <!-- 비-Task 선택 (WP, ACT) -->
  <div v-else-if="isNonTask" class="empty-state">
    <i class="pi pi-info-circle text-6xl text-blue-400" />
    <p class="text-gray-500 mt-4">Task를 선택하여 상세 정보를 확인하세요</p>
  </div>

  <!-- 로딩 중 -->
  <div v-else-if="loading" class="loading-state">
    <ProgressSpinner />
    <p class="text-gray-500 mt-4">Task 정보를 불러오는 중...</p>
  </div>

  <!-- 에러 상태 -->
  <div v-else-if="error" class="error-state">
    <Message severity="error" :closable="false">
      {{ error }}
    </Message>
  </div>

  <!-- Task 상세 정보 -->
  <div v-else-if="selectedTask" class="task-detail-content p-4">
    <TaskBasicInfo :task="selectedTask" />
    <Divider />
    <TaskProgress :task="selectedTask" />
    <Divider />
    <!-- TSK-05-02: Requirements, Documents, History -->
  </div>
</div>
```

**스타일링**:
- 전체 높이: `h-full`
- 스크롤: `overflow-auto`
- 패딩: `p-4` (콘텐츠 영역)
- 빈 상태/로딩/에러: 중앙 정렬

---

### 4.2 TaskBasicInfo (프레젠테이션)

**파일 경로**: `app/components/detail/TaskBasicInfo.vue`

**책임**:
- Task 기본 정보 표시 (ID, 제목, 카테고리, 우선순위, 담당자)
- 인라인 편집 UI 제공
- 편집 모드 토글 관리
- 낙관적 업데이트 처리

**Props**:
```typescript
interface Props {
  task: TaskDetail;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'update:task', value: Partial<TaskDetail>): void;
}
```

**주요 상태**:
```typescript
// 편집 모드
const editingField = ref<'title' | 'category' | 'priority' | 'assignee' | null>(null)

// 편집 중 임시 값
const editingValue = ref<any>(null)

// 카테고리 옵션
const categoryOptions = ref<{ label: string; value: string }[]>([
  { label: 'Development', value: 'development' },
  { label: 'Defect', value: 'defect' },
  { label: 'Infrastructure', value: 'infrastructure' },
])

// 우선순위 옵션
const priorityOptions = ref<{ label: string; value: string }[]>([
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
])

// 담당자 옵션 (team.json에서 로드)
const assigneeOptions = computed(() => {
  // TODO: team.json에서 팀원 목록 로드
  return []
})
```

**템플릿 구조**:
```vue
<Card>
  <template #title>
    <div class="flex items-center gap-2">
      <i class="pi pi-info-circle text-blue-500" />
      <span>기본 정보</span>
    </div>
  </template>

  <template #content>
    <!-- Task ID (읽기 전용) -->
    <div class="field grid grid-cols-3 gap-2 items-center">
      <label class="font-semibold">ID</label>
      <div class="col-span-2">
        <Tag :value="task.id" severity="info" />
      </div>
    </div>

    <!-- 제목 (인라인 편집) -->
    <div class="field grid grid-cols-3 gap-2 items-center">
      <label class="font-semibold">제목</label>
      <div class="col-span-2">
        <InputText
          v-if="editingField === 'title'"
          v-model="editingValue"
          @blur="saveField('title')"
          @keyup.enter="saveField('title')"
          @keyup.esc="cancelEdit"
          class="w-full"
          autofocus
        />
        <div
          v-else
          @click="startEdit('title', task.title)"
          class="editable-field"
        >
          {{ task.title }}
          <i class="pi pi-pencil text-xs text-gray-400 ml-2" />
        </div>
      </div>
    </div>

    <!-- 카테고리 (인라인 편집) -->
    <div class="field grid grid-cols-3 gap-2 items-center">
      <label class="font-semibold">카테고리</label>
      <div class="col-span-2">
        <Dropdown
          v-if="editingField === 'category'"
          v-model="editingValue"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          @change="saveField('category')"
          @blur="cancelEdit"
          class="w-full"
          autofocus
        />
        <div
          v-else
          @click="startEdit('category', task.category)"
          class="editable-field"
        >
          <CategoryTag :category="task.category" />
          <i class="pi pi-pencil text-xs text-gray-400 ml-2" />
        </div>
      </div>
    </div>

    <!-- 우선순위 (인라인 편집) -->
    <div class="field grid grid-cols-3 gap-2 items-center">
      <label class="font-semibold">우선순위</label>
      <div class="col-span-2">
        <Dropdown
          v-if="editingField === 'priority'"
          v-model="editingValue"
          :options="priorityOptions"
          option-label="label"
          option-value="value"
          @change="saveField('priority')"
          @blur="cancelEdit"
          class="w-full"
          autofocus
        />
        <div
          v-else
          @click="startEdit('priority', task.priority)"
          class="editable-field"
        >
          <Tag :value="task.priority" :severity="getPrioritySeverity(task.priority)" />
          <i class="pi pi-pencil text-xs text-gray-400 ml-2" />
        </div>
      </div>
    </div>

    <!-- 담당자 (인라인 편집) -->
    <div class="field grid grid-cols-3 gap-2 items-center">
      <label class="font-semibold">담당자</label>
      <div class="col-span-2">
        <Dropdown
          v-if="editingField === 'assignee'"
          v-model="editingValue"
          :options="assigneeOptions"
          option-label="name"
          option-value="id"
          @change="saveField('assignee')"
          @blur="cancelEdit"
          class="w-full"
          autofocus
        />
        <div
          v-else
          @click="startEdit('assignee', task.assignee?.id)"
          class="editable-field"
        >
          <span v-if="task.assignee">{{ task.assignee.name }}</span>
          <span v-else class="text-gray-400">미배정</span>
          <i class="pi pi-pencil text-xs text-gray-400 ml-2" />
        </div>
      </div>
    </div>
  </template>
</Card>
```

**주요 메서드**:
```typescript
// 편집 시작
const startEdit = (field: string, value: any) => {
  editingField.value = field
  editingValue.value = value
}

// 편집 취소
const cancelEdit = () => {
  editingField.value = null
  editingValue.value = null
}

// 필드 저장 (낙관적 업데이트)
const saveField = async (field: string) => {
  const newValue = editingValue.value
  cancelEdit()

  // Emit 업데이트 (낙관적)
  emit('update:task', { [field]: newValue })

  // TODO: API 저장 (TSK-05-03에서 구현)
  // try {
  //   await $fetch(`/api/tasks/${props.task.id}`, {
  //     method: 'PUT',
  //     body: { [field]: newValue }
  //   })
  // } catch (error) {
  //   // 롤백 처리
  // }
}

// 우선순위 severity 매핑
const getPrioritySeverity = (priority: string) => {
  const severities: Record<string, string> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'secondary',
  }
  return severities[priority] || 'secondary'
}
```

**스타일링**:
- PrimeVue Card 컴포넌트
- Grid 레이아웃 (3컬럼: label | value)
- `editable-field`: hover 시 배경색, 커서 포인터, 편집 아이콘 표시

---

### 4.3 TaskProgress (프레젠테이션)

**파일 경로**: `app/components/detail/TaskProgress.vue`

**책임**:
- 현재 워크플로우 상태 표시
- 워크플로우 흐름 시각화
- 카테고리별 워크플로우 차별화 (development, defect, infrastructure)

**Props**:
```typescript
interface Props {
  task: TaskDetail;
}
```

**Emits**: 없음

**주요 Computed**:
```typescript
// 현재 상태 코드 추출 (예: "basic-design [bd]" → "bd")
const currentStateCode = computed(() => {
  const match = props.task.status.match(/\[([^\]]+)\]/)
  return match ? match[1].trim() : ' '
})

// 현재 상태명
const currentStateName = computed(() => {
  const labels: Record<string, string> = {
    ' ': 'Todo',
    'bd': 'Basic Design',
    'dd': 'Detail Design',
    'an': 'Analyze',
    'ds': 'Design',
    'im': 'Implement',
    'fx': 'Fix',
    'vf': 'Verify',
    'xx': 'Done',
  }
  return labels[currentStateCode.value] || currentStateCode.value
})

// 카테고리별 워크플로우 정의
const workflowStates = computed(() => {
  const workflows: Record<string, { code: string; label: string }[]> = {
    development: [
      { code: ' ', label: 'Todo' },
      { code: 'bd', label: 'Design' },
      { code: 'dd', label: 'Detail' },
      { code: 'im', label: 'Implement' },
      { code: 'vf', label: 'Verify' },
      { code: 'xx', label: 'Done' },
    ],
    defect: [
      { code: ' ', label: 'Todo' },
      { code: 'an', label: 'Analyze' },
      { code: 'fx', label: 'Fix' },
      { code: 'vf', label: 'Verify' },
      { code: 'xx', label: 'Done' },
    ],
    infrastructure: [
      { code: ' ', label: 'Todo' },
      { code: 'ds', label: 'Design' },
      { code: 'im', label: 'Implement' },
      { code: 'xx', label: 'Done' },
    ],
  }
  return workflows[props.task.category] || workflows.development
})

// 현재 상태 인덱스
const currentStateIndex = computed(() => {
  return workflowStates.value.findIndex(s => s.code === currentStateCode.value)
})
```

**템플릿 구조**:
```vue
<Card>
  <template #title>
    <div class="flex items-center gap-2">
      <i class="pi pi-chart-line text-green-500" />
      <span>진행 상태</span>
    </div>
  </template>

  <template #content>
    <!-- 현재 상태 -->
    <div class="current-state mb-4">
      <div class="text-sm text-gray-500 mb-2">현재 상태</div>
      <Tag
        :value="`[${currentStateCode}] ${currentStateName}`"
        severity="info"
        class="text-lg"
      />
    </div>

    <!-- 워크플로우 시각화 -->
    <div class="workflow-visualization">
      <div class="text-sm text-gray-500 mb-3">워크플로우 흐름</div>
      <div class="flex items-center justify-between">
        <div
          v-for="(state, index) in workflowStates"
          :key="state.code"
          class="workflow-state-node flex flex-col items-center"
        >
          <!-- 상태 노드 -->
          <div
            class="state-circle"
            :class="{
              'state-completed': index < currentStateIndex,
              'state-current': index === currentStateIndex,
              'state-pending': index > currentStateIndex,
            }"
          >
            <i
              v-if="index < currentStateIndex"
              class="pi pi-check text-white"
            />
            <i
              v-else-if="index === currentStateIndex"
              class="pi pi-circle-fill text-white"
            />
            <span v-else class="text-gray-400">{{ index + 1 }}</span>
          </div>

          <!-- 상태 레이블 -->
          <div class="text-xs mt-2 text-center">
            {{ state.label }}
          </div>

          <!-- 연결선 (마지막 노드 제외) -->
          <div
            v-if="index < workflowStates.length - 1"
            class="workflow-connector"
            :class="{
              'connector-completed': index < currentStateIndex,
              'connector-pending': index >= currentStateIndex,
            }"
          />
        </div>
      </div>
    </div>

    <!-- 카테고리 정보 -->
    <div class="workflow-category mt-4 text-sm text-gray-500">
      <i class="pi pi-info-circle mr-2" />
      <span>{{ task.category }} 워크플로우</span>
    </div>
  </template>
</Card>
```

**스타일링**:
```css
/* 상태 노드 */
.state-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.state-completed {
  background-color: #22c55e; /* green-500 */
  border: 2px solid #22c55e;
}

.state-current {
  background-color: #3b82f6; /* blue-500 */
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.state-pending {
  background-color: #e5e7eb; /* gray-200 */
  border: 2px solid #d1d5db; /* gray-300 */
}

/* 연결선 */
.workflow-connector {
  width: 60px;
  height: 2px;
  margin: 0 8px;
  transition: background-color 0.3s;
}

.connector-completed {
  background-color: #22c55e; /* green-500 */
}

.connector-pending {
  background-color: #d1d5db; /* gray-300 */
}

/* 편집 가능 필드 */
.editable-field {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.editable-field:hover {
  background-color: var(--surface-100);
}
```

---

## 5. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 상태 관리 | 1) Local State<br>2) Pinia Store | Pinia Store | - 전역 선택 상태 필요<br>- 이미 구현된 selection.ts 활용<br>- 다른 컴포넌트와 상태 공유 |
| 인라인 편집 | 1) 모달<br>2) 인라인 편집 | 인라인 편집 | - UX 효율성<br>- 즉각적 피드백<br>- PRD 6.3.1 요구사항 |
| 업데이트 방식 | 1) 동기 저장<br>2) 낙관적 업데이트 | 낙관적 업데이트 | - 빠른 UI 반응성<br>- 백그라운드 API 호출<br>- 실패 시 롤백 |
| 워크플로우 시각화 | 1) Stepper<br>2) 커스텀 노드 | 커스텀 노드 | - 카테고리별 차별화 필요<br>- 더 유연한 스타일링<br>- 진행 상태 명확히 표현 |
| 빈 상태 처리 | 1) 숨김<br>2) 빈 상태 메시지 | 빈 상태 메시지 | - 사용자 가이드<br>- 일관된 UX<br>- 로딩/에러 구분 |

---

## 6. 인터페이스 설계

### 6.1 Props/Emits 인터페이스

#### TaskDetailPanel
```typescript
// Props: 없음 (스토어 직접 접근)
// Emits: 없음
```

#### TaskBasicInfo
```typescript
interface Props {
  task: TaskDetail;
}

interface Emits {
  (e: 'update:task', value: Partial<TaskDetail>): void;
}
```

#### TaskProgress
```typescript
interface Props {
  task: TaskDetail;
}

// Emits: 없음
```

### 6.2 타입 정의 (types/index.ts - 기존)

```typescript
// 이미 정의됨
export interface TaskDetail {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: Priority;
  assignee?: TeamMember;
  parentWp: string;
  parentAct?: string;
  schedule?: { start: string; end: string };
  requirements: string[];
  tags: string[];
  depends?: string[];
  ref?: string;
  documents: DocumentInfo[];
  history: HistoryEntry[];
  availableActions: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}
```

### 6.3 Pinia Store 인터페이스 (사용 부분만)

```typescript
// stores/selection.ts (기존 구현 활용)
interface SelectionStore {
  // State
  selectedNodeId: string | null;
  selectedTask: TaskDetail | null;
  loadingTask: boolean;
  error: string | null;

  // Getters
  hasSelection: boolean;
  selectedNodeType: WbsNodeType | null;
  isTaskSelected: boolean;

  // Actions
  selectNode: (nodeId: string) => Promise<void>;
  loadTaskDetail: (taskId: string) => Promise<void>;
  refreshTaskDetail: () => Promise<void>;
  clearSelection: () => void;
}
```

### 6.4 API 인터페이스

```typescript
// GET /api/tasks/:id
type TaskDetailApiResponse = {
  success: boolean;
  data: TaskDetail;
}

// PUT /api/tasks/:id (향후 TSK-05-03)
type TaskUpdateRequest = Partial<TaskDetail>

type TaskUpdateResponse = {
  success: boolean;
  data: TaskDetail;
}
```

---

## 7. 인수 기준

- [ ] AC-01: TaskDetailPanel이 선택 없을 시 빈 상태 메시지 표시
- [ ] AC-02: TaskDetailPanel이 비-Task 선택 시 안내 메시지 표시
- [ ] AC-03: TaskDetailPanel이 로딩 중 스피너 표시
- [ ] AC-04: TaskDetailPanel이 에러 시 에러 메시지 표시
- [ ] AC-05: TaskBasicInfo가 ID, 제목, 카테고리, 우선순위, 담당자 정확히 표시
- [ ] AC-06: 제목 클릭 시 InputText로 전환하여 인라인 편집 가능
- [ ] AC-07: 카테고리 클릭 시 Dropdown으로 전환하여 선택 가능
- [ ] AC-08: 우선순위 클릭 시 Dropdown으로 전환하여 선택 가능
- [ ] AC-09: 담당자 클릭 시 Dropdown으로 전환하여 선택 가능
- [ ] AC-10: TaskProgress가 현재 상태를 Tag로 명확히 표시
- [ ] AC-11: TaskProgress가 워크플로우 흐름을 시각적 노드로 표현
- [ ] AC-12: development 카테고리는 6단계 워크플로우 표시
- [ ] AC-13: defect 카테고리는 5단계 워크플로우 표시
- [ ] AC-14: infrastructure 카테고리는 4단계 워크플로우 표시
- [ ] AC-15: 현재 상태 노드가 파란색으로 강조 표시
- [ ] AC-16: 완료된 상태 노드가 초록색으로 표시
- [ ] AC-17: 대기 중 상태 노드가 회색으로 표시
- [ ] AC-18: 인라인 편집 시 ESC로 취소 가능
- [ ] AC-19: 인라인 편집 시 Enter로 저장 가능 (제목)
- [ ] AC-20: 모든 컴포넌트가 PrimeVue 테마 일관성 유지

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| API 응답 지연 | Medium | - 로딩 상태 명확히 표시<br>- 타임아웃 설정<br>- 낙관적 업데이트로 체감 속도 향상 |
| 인라인 편집 UX | Medium | - 명확한 편집 아이콘 표시<br>- hover 시 배경색 변경<br>- 키보드 단축키 지원 |
| 낙관적 업데이트 롤백 | High | - 실패 시 이전 값으로 복구<br>- 토스트 메시지로 사용자 알림<br>- API 저장 로직은 TSK-05-03에서 구현 |
| 워크플로우 시각화 복잡도 | Low | - 카테고리별 정적 정의<br>- CSS로 단순화<br>- 상태 인덱스 계산 최적화 |
| team.json 미구현 | Medium | - 담당자 옵션 빈 배열 기본값<br>- TSK-02-03-03 완료 후 연동<br>- 현재는 "미배정" 표시 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-04-03 | 선행 | 트리 노드 선택 기능 필요 |
| TSK-03-02 | 선행 | Task API (GET /api/tasks/:id) 필요 |
| TSK-01-02-01 | 선행 | AppLayout 우측 패널 슬롯 필요 |
| TSK-05-02 | 후행 | 요구사항, 문서, 이력 섹션 |
| TSK-05-03 | 후행 | 편집/액션 버튼, API 저장 로직 |
| stores/selection.ts | 기존 구현 | 선택 상태 관리 스토어 |
| types/index.ts | 기존 구현 | TaskDetail, TeamMember 타입 |
| TSK-02-03-03 | 선행 | team.json 구조 (담당자 옵션) |

---

## 9. 다음 단계

### 9.1 상세설계 단계 (/wf:draft)
- 컴포넌트별 스타일 가이드 (TailwindCSS 클래스)
- 인라인 편집 UX 세부 플로우
- 접근성 속성 세부 정의 (ARIA labels, roles)
- 단위 테스트 시나리오 작성
- API 저장 로직 상세 설계 (TSK-05-03 참조)

### 9.2 구현 단계 (/wf:build)
- 3개 컴포넌트 Vue 파일 작성
- PrimeVue 컴포넌트 통합 (Card, InputText, Dropdown, Tag)
- TailwindCSS 스타일링 및 커스텀 CSS
- 인라인 편집 로직 구현
- 워크플로우 시각화 구현

### 9.3 검증 단계 (/wf:verify)
- 단위 테스트 (컴포넌트별 Props, Emits 검증)
- E2E 테스트 (인라인 편집, 워크플로우 표시)
- 접근성 검증 (ARIA, 키보드 네비게이션)
- UX 테스트 (인라인 편집 플로우)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.3, 6.3.1, 6.3.2)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-05-01)
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-04-03: `.jjiban/projects/jjiban/tasks/TSK-04-03/010-basic-design.md`
  - TSK-03-02: `.jjiban/projects/jjiban/tasks/TSK-03-02/010-basic-design.md`
  - TSK-01-02-01: `.jjiban/projects/jjiban/tasks/TSK-01-02-01/010-basic-design.md`
- 타입 정의: `types/index.ts`
- Pinia 스토어: `app/stores/selection.ts`, `app/stores/wbs.ts`
- 참조 컴포넌트:
  - TSK-04-01: WbsTreePanel (컨테이너 패턴 참조)
  - TSK-04-02: CategoryTag, StatusBadge (재사용)

---

<!--
author: Claude (Requirements Analyst)
Template Version: 1.0.0
Created: 2025-12-15
-->
