# 화면설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * UI/UX 중심 설계 문서
> * PrimeVue 4.x 컴포넌트 우선 활용
> * CSS 클래스 중앙화 원칙 준수 (main.css)
> * 컴포넌트별 와이어프레임 포함

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
| 기본설계 | `010-basic-design.md` | 전체 |
| 선행 Task | `TSK-06-01/030-implementation.md` | 전체 (기존 구현) |

---

## 1. 화면 개요

### 1.1 화면 목적

TSK-06-01에서 구현된 의존관계 그래프 모달에 **필터링, 계층 접기, 초점 뷰** 기능을 추가하여 대규모 프로젝트의 의존관계를 효과적으로 탐색합니다.

### 1.2 화면 구성 요소

| 컴포넌트 | 파일명 | 역할 |
|----------|--------|------|
| GraphFilterPanel | `GraphFilterPanel.vue` | 필터 패널 (카테고리, 상태, 계층, 초점) |
| GroupNode | `GroupNode.vue` | WP/ACT 그룹 노드 표시 |
| DependencyGraph | `DependencyGraph.client.vue` | 그래프 캔버스 (수정) |
| DependencyGraphModal | `DependencyGraphModal.vue` | 모달 레이아웃 (수정) |

---

## 2. 화면 레이아웃

### 2.1 전체 모달 레이아웃 (DependencyGraphModal)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [X] 의존관계 그래프                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ GraphFilterPanel (접힌 상태)                                    │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ [▼ 필터] [🔄 초기화]          [📊 노드 45 / 엣지 52]        │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ GraphFilterPanel (펼친 상태)                                    │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ [▲ 필터] [🔄 초기화]          [📊 노드 45 / 엣지 52]        │ │ │
│ │ ├─────────────────────────────────────────────────────────────┤ │ │
│ │ │ 카테고리:                                                   │ │ │
│ │ │   ☑ 개발 (35)  ☑ 결함 (8)  ☑ 인프라 (2)                    │ │ │
│ │ │                                                             │ │ │
│ │ │ 상태:                                                       │ │ │
│ │ │   [MultiSelect: 구현 (12), 검증 (5), 완료 (18) 선택됨]    │ │ │
│ │ │                                                             │ │ │
│ │ │ 계층 뷰:                                                    │ │ │
│ │ │   ⭘ 전체  ◉ WP 그룹  ⭘ ACT 그룹                            │ │ │
│ │ │                                                             │ │ │
│ │ │ 초점 Task:                                                  │ │ │
│ │ │   [TSK-06-03 ▼]  깊이: ⭘ 1  ◉ 2  ⭘ 3  [적용]             │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ DependencyGraph (Vue Flow 캔버스)                               │ │
│ │                                                                 │ │
│ │   ┌────────────────────┐         ┌────────────────────┐       │ │
│ │   │ ▶ WP-06            │────────▶│ TSK-06-01 [im]     │       │ │
│ │   │ 의존관계 시각화    │         │ 그래프 시각화      │       │ │
│ │   │ 0/3 (0%)           │         │                    │       │ │
│ │   └────────────────────┘         └────────────────────┘       │ │
│ │                                           │                    │ │
│ │                                           ▼                    │ │
│ │                                  ┌────────────────────┐       │ │
│ │                                  │ TSK-06-03 [bd]     │       │ │
│ │                                  │ 필터 및 계층 접기  │       │ │
│ │                                  └────────────────────┘       │ │
│ │                                                                 │ │
│ │   [Controls]  [MiniMap]                                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ GraphLegend                                                     │ │
│ │ ■ 개발  ■ 결함  ■ 인프라  ● 선택  ● 선행  ● 후행  ○ 희미       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 필터 패널 세부 레이아웃 (펼친 상태)

```
┌─────────────────────────────────────────────────────────────────┐
│ [▲ 필터]  [🔄 초기화]                    [📊 노드 45 / 엣지 52] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 카테고리:                                                       │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │  ☑ 개발 (35)   ☑ 결함 (8)   ☑ 인프라 (2)              │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 상태:                                                           │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │  [MultiSelect Dropdown]                                 │ │
│   │  구현 (12), 검증 (5), 완료 (18) 선택됨                 │ │
│   │  (클릭 시 전체 상태 목록 표시)                          │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 계층 뷰:                                                        │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │  ( ) 전체     (●) WP 그룹     ( ) ACT 그룹             │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 초점 Task:                                                      │
│   ┌─────────────────────┐  깊이:  ┌─────────────────────────┐ │
│   │ [Select Dropdown]   │         │ ( ) 1  (●) 2  ( ) 3     │ │
│   │ TSK-06-03           │         │                         │ │
│   └─────────────────────┘         └─────────────────────────┘ │
│   [적용] 버튼                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트별 UI 상세 설계

### 3.1 GraphFilterPanel.vue

#### 3.1.1 컴포넌트 구조

```vue
<template>
  <div class="graph-filter-panel">
    <!-- 헤더 (항상 표시) -->
    <div class="filter-header">
      <div class="filter-header-left">
        <Button
          :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          text
          rounded
          @click="toggleExpand"
          v-tooltip.right="isExpanded ? '필터 접기' : '필터 펼치기'"
        />
        <span class="filter-title">필터</span>
        <Button
          icon="pi pi-filter-slash"
          text
          rounded
          size="small"
          v-tooltip.top="'필터 초기화'"
          @click="resetFilters"
        />
      </div>

      <div class="filter-header-right">
        <Tag severity="info" class="filter-stat-tag">
          <i class="pi pi-sitemap mr-1" />
          노드 {{ stats.nodeCount }}
        </Tag>
        <Tag severity="secondary" class="filter-stat-tag">
          <i class="pi pi-arrow-right-arrow-left mr-1" />
          엣지 {{ stats.edgeCount }}
        </Tag>
      </div>
    </div>

    <!-- 필터 내용 (접힌 상태에서는 숨김) -->
    <Transition name="filter-expand">
      <div v-if="isExpanded" class="filter-content">
        <!-- 카테고리 필터 -->
        <div class="filter-section">
          <label class="filter-label">카테고리:</label>
          <div class="category-checkboxes">
            <div
              v-for="category in categoryOptions"
              :key="category.value"
              class="category-checkbox-item"
            >
              <Checkbox
                v-model="selectedCategories"
                :value="category.value"
                :input-id="`category-${category.value}`"
              />
              <label :for="`category-${category.value}`" class="checkbox-label">
                {{ category.label }} ({{ category.count }})
              </label>
            </div>
          </div>
        </div>

        <!-- 상태 필터 -->
        <div class="filter-section">
          <label class="filter-label">상태:</label>
          <MultiSelect
            v-model="selectedStatuses"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="상태 선택"
            :max-selected-labels="3"
            class="filter-multiselect"
          />
        </div>

        <!-- 계층 뷰 -->
        <div class="filter-section">
          <label class="filter-label">계층 뷰:</label>
          <div class="hierarchy-radios">
            <div
              v-for="mode in hierarchyModes"
              :key="mode.value"
              class="hierarchy-radio-item"
            >
              <RadioButton
                v-model="selectedHierarchyMode"
                :value="mode.value"
                :input-id="`hierarchy-${mode.value}`"
              />
              <label :for="`hierarchy-${mode.value}`" class="radio-label">
                {{ mode.label }}
              </label>
            </div>
          </div>
        </div>

        <!-- 초점 Task -->
        <div class="filter-section">
          <label class="filter-label">초점 Task:</label>
          <div class="focus-controls">
            <Select
              v-model="selectedFocusTask"
              :options="taskOptions"
              option-label="label"
              option-value="value"
              placeholder="Task 선택"
              class="focus-select"
              show-clear
            />

            <div class="focus-depth">
              <span class="focus-depth-label">깊이:</span>
              <div class="focus-depth-radios">
                <div
                  v-for="depth in [1, 2, 3]"
                  :key="depth"
                  class="focus-depth-radio"
                >
                  <RadioButton
                    v-model="selectedFocusDepth"
                    :value="depth"
                    :input-id="`depth-${depth}`"
                    :disabled="!selectedFocusTask"
                  />
                  <label :for="`depth-${depth}`" class="radio-label">
                    {{ depth }}
                  </label>
                </div>
              </div>
            </div>

            <Button
              label="적용"
              icon="pi pi-check"
              severity="primary"
              size="small"
              :disabled="!selectedFocusTask"
              @click="applyFocusMode"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
```

#### 3.1.2 PrimeVue 컴포넌트 사용

| 컴포넌트 | 용도 | 속성 |
|----------|------|------|
| Button | 토글, 초기화 버튼 | `text`, `rounded`, `icon` |
| Tag | 통계 표시 | `severity="info\|secondary"` |
| Checkbox | 카테고리 선택 | `v-model`, `value`, `input-id` |
| MultiSelect | 상태 다중 선택 | `option-label`, `option-value`, `max-selected-labels` |
| RadioButton | 계층 뷰, 깊이 선택 | `v-model`, `value`, `input-id` |
| Select | 초점 Task 선택 | `option-label`, `option-value`, `show-clear` |

#### 3.1.3 CSS 클래스 (main.css에 추가 예정)

```css
/* GraphFilterPanel 스타일 */
.graph-filter-panel {
  @apply border-b border-border bg-bg-card;
}

.filter-header {
  @apply flex items-center justify-between px-4 py-3;
}

.filter-header-left {
  @apply flex items-center gap-2;
}

.filter-header-right {
  @apply flex items-center gap-2;
}

.filter-title {
  @apply text-base font-semibold text-text;
}

.filter-stat-tag {
  @apply flex items-center gap-1;
}

.filter-content {
  @apply px-4 pb-4 space-y-4;
}

.filter-section {
  @apply space-y-2;
}

.filter-label {
  @apply block text-sm font-medium text-text-secondary;
}

.category-checkboxes {
  @apply flex flex-wrap gap-4;
}

.category-checkbox-item {
  @apply flex items-center gap-2;
}

.checkbox-label {
  @apply text-sm text-text cursor-pointer;
}

.filter-multiselect {
  @apply w-full;
}

.hierarchy-radios {
  @apply flex gap-6;
}

.hierarchy-radio-item {
  @apply flex items-center gap-2;
}

.radio-label {
  @apply text-sm text-text cursor-pointer;
}

.focus-controls {
  @apply flex flex-col gap-3;
}

.focus-select {
  @apply w-full;
}

.focus-depth {
  @apply flex items-center gap-3;
}

.focus-depth-label {
  @apply text-sm text-text-secondary;
}

.focus-depth-radios {
  @apply flex gap-4;
}

.focus-depth-radio {
  @apply flex items-center gap-2;
}

/* 필터 확장 애니메이션 */
.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
```

---

### 3.2 GroupNode.vue

#### 3.2.1 컴포넌트 구조

```vue
<template>
  <div
    :class="['group-node', `group-node-${data.groupType}`, { 'group-node-expanded': data.isExpanded }]"
    @click="toggleExpand"
  >
    <!-- 헤더 -->
    <div class="group-node-header">
      <i :class="['group-node-toggle', data.isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right']" />
      <span class="group-node-title">{{ data.groupId }}: {{ data.title }}</span>
    </div>

    <!-- 진행률 바 -->
    <div class="group-node-progress">
      <div class="group-node-progress-bar">
        <div
          class="group-node-progress-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="group-node-progress-text">
        {{ data.completedCount }}/{{ data.taskCount }} ({{ progressPercent }}%)
      </span>
    </div>

    <!-- 확장 상태에서 하위 Task 목록 (선택 사항) -->
    <Transition name="group-children">
      <div v-if="data.isExpanded && showChildren" class="group-node-children">
        <div
          v-for="childId in data.childTaskIds"
          :key="childId"
          class="group-node-child"
        >
          <i class="pi pi-circle-fill group-child-icon" />
          <span class="group-child-title">{{ childId }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>
```

#### 3.2.2 노드 스타일 (CSS 클래스)

```css
/* GroupNode 스타일 */
.group-node {
  @apply bg-bg-card border-2 rounded-lg p-3 cursor-pointer transition-all;
  min-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.group-node:hover {
  @apply shadow-lg;
  transform: translateY(-2px);
}

.group-node-wp {
  @apply border-level-wp;
}

.group-node-act {
  @apply border-level-act;
}

.group-node-expanded {
  @apply bg-bg-header;
}

.group-node-header {
  @apply flex items-center gap-2 mb-2;
}

.group-node-toggle {
  @apply text-text-secondary transition-transform;
}

.group-node-title {
  @apply text-sm font-semibold text-text truncate;
}

.group-node-progress {
  @apply space-y-1;
}

.group-node-progress-bar {
  @apply w-full h-2 bg-border rounded-full overflow-hidden;
}

.group-node-progress-fill {
  @apply h-full bg-success transition-all duration-300;
}

.group-node-progress-text {
  @apply text-xs text-text-secondary;
}

.group-node-children {
  @apply mt-3 pt-3 border-t border-border space-y-1;
}

.group-node-child {
  @apply flex items-center gap-2 text-xs text-text-secondary;
}

.group-child-icon {
  @apply text-[6px] text-primary;
}

.group-child-title {
  @apply truncate;
}

/* 자식 노드 애니메이션 */
.group-children-enter-active,
.group-children-leave-active {
  transition: all 0.2s ease;
}

.group-children-enter-from,
.group-children-leave-to {
  max-height: 0;
  opacity: 0;
}
```

#### 3.2.3 그룹 노드 시각 예시

**축소 상태 (isExpanded = false)**

```
┌────────────────────────┐
│ ▶ WP-06: 의존관계 시각화│ ← 클릭하여 확장
│ ██████░░░░░░░░ 33%     │
│ 1/3 (33%)              │
└────────────────────────┘
```

**확장 상태 (isExpanded = true)**

```
┌────────────────────────┐
│ ▼ WP-06: 의존관계 시각화│ ← 클릭하여 축소
│ ██████░░░░░░░░ 33%     │
│ 1/3 (33%)              │
├────────────────────────┤
│ ● TSK-06-01 [im]       │
│ ● TSK-06-02 [ ]        │
│ ● TSK-06-03 [bd]       │
└────────────────────────┘
```

---

### 3.3 TaskNode.vue (신규 생성 필요)

현재 DependencyGraph.client.vue에서 `#node-task` 템플릿 슬롯으로 인라인 렌더링하고 있으나, 분리된 컴포넌트로 생성 필요.

#### 3.3.1 컴포넌트 구조

```vue
<template>
  <div
    :class="[
      'task-node',
      `task-node-${data.category}`,
      highlightClass
    ]"
  >
    <!-- 상태 인디케이터 -->
    <div :class="['task-node-status', `task-node-status-${statusColor}`]" />

    <!-- 내용 -->
    <div class="task-node-content">
      <div class="task-node-header">
        <span class="task-node-id">{{ data.taskId }}</span>
        <span class="task-node-status-badge">{{ data.statusName }}</span>
      </div>
      <div class="task-node-title">{{ data.title }}</div>
      <div v-if="data.assignee" class="task-node-assignee">
        <i class="pi pi-user task-node-assignee-icon" />
        <span>{{ data.assignee }}</span>
      </div>
    </div>
  </div>
</template>
```

#### 3.3.2 CSS 클래스

```css
/* TaskNode 스타일 */
.task-node {
  @apply bg-bg-card border-2 rounded-lg overflow-hidden transition-all;
  width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.task-node:hover {
  @apply shadow-lg;
  transform: translateY(-2px);
}

.task-node-development {
  @apply border-primary;
}

.task-node-defect {
  @apply border-danger;
}

.task-node-infrastructure {
  @apply border-level-project;
}

/* 하이라이트 상태 */
.task-node-highlight-selected {
  @apply border-warning ring-4 ring-warning/30;
  transform: scale(1.05);
}

.task-node-highlight-dependsOn {
  @apply border-danger ring-2 ring-danger/30;
}

.task-node-highlight-dependedBy {
  @apply border-success ring-2 ring-success/30;
}

.task-node-highlight-dimmed {
  @apply opacity-30;
}

/* 초점 뷰 Depth 표시 */
.task-node-focus-depth-1 {
  @apply border-solid;
}

.task-node-focus-depth-2 {
  @apply border-dashed;
}

.task-node-focus-depth-3 {
  border-style: dotted;
}

/* 상태 인디케이터 (왼쪽 색상 바) */
.task-node-status {
  @apply w-1.5 h-full absolute left-0 top-0;
}

.task-node-status-done {
  @apply bg-success;
}

.task-node-status-inprogress {
  @apply bg-warning;
}

.task-node-status-pending {
  @apply bg-text-muted;
}

/* 내용 영역 */
.task-node-content {
  @apply p-3 pl-5 space-y-2;
}

.task-node-header {
  @apply flex items-center justify-between;
}

.task-node-id {
  @apply text-xs font-mono font-bold text-primary;
}

.task-node-status-badge {
  @apply text-[10px] px-1.5 py-0.5 rounded bg-border text-text-secondary;
}

.task-node-title {
  @apply text-sm font-medium text-text line-clamp-2;
}

.task-node-assignee {
  @apply flex items-center gap-1 text-xs text-text-secondary;
}

.task-node-assignee-icon {
  @apply text-[10px];
}
```

---

### 3.4 DependencyGraphModal.vue (수정)

기존 모달에 GraphFilterPanel을 상단에 추가합니다.

#### 3.4.1 수정 사항

**현재 구조:**
```
<Dialog>
  <div class="graph-toolbar">
    <!-- 기존 필터 (카테고리, 상태 MultiSelect) -->
  </div>
  <div class="graph-area">
    <DependencyGraph />
  </div>
  <div class="graph-footer">
    <GraphLegend />
  </div>
</Dialog>
```

**수정 후 구조:**
```
<Dialog>
  <GraphFilterPanel
    v-model:categories="selectedCategories"
    v-model:statuses="selectedStatuses"
    v-model:hierarchy-mode="hierarchyMode"
    v-model:focus-task="focusTask"
    v-model:focus-depth="focusDepth"
    :stats="stats"
    @reset="resetFilters"
    @apply-focus="applyFocusMode"
  />

  <div class="graph-area">
    <DependencyGraph
      :graph-data="filteredGraphData"
      @node-click="handleNodeClick"
      @node-double-click="handleNodeDoubleClick"
    />
  </div>

  <div class="graph-footer">
    <GraphLegend />
  </div>
</Dialog>
```

#### 3.4.2 URL 파라미터 동기화

모달이 열릴 때 URL에서 필터 설정 복원, 필터 변경 시 URL 업데이트:

```typescript
// URL 파라미터 예시
?categories=development,infrastructure
&statuses=im,vf,xx
&hierarchyMode=wp
&focusTask=TSK-06-03
&focusDepth=2
```

**구현 로직 (의사코드):**
```typescript
// 모달 열릴 때
onMounted(() => {
  const query = route.query
  if (query.categories) {
    selectedCategories.value = query.categories.split(',')
  }
  if (query.statuses) {
    selectedStatuses.value = query.statuses.split(',')
  }
  // ...
})

// 필터 변경 시
watch([selectedCategories, selectedStatuses, ...], () => {
  const query = {
    categories: selectedCategories.value.join(','),
    statuses: selectedStatuses.value.join(','),
    // ...
  }
  router.push({ query })
})
```

---

## 4. 인터랙션 설계

### 4.1 필터 패널 접기/펼치기

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 펼치기 | 헤더의 [▼ 필터] 버튼 클릭 | 필터 내용 영역이 0.3초 애니메이션으로 나타남 |
| 접기 | 헤더의 [▲ 필터] 버튼 클릭 | 필터 내용 영역이 0.3초 애니메이션으로 사라짐 |

### 4.2 필터 적용

| 필터 타입 | 동작 | 즉시 적용 여부 |
|----------|------|----------------|
| 카테고리 | Checkbox 클릭 | 즉시 적용 (watch로 자동) |
| 상태 | MultiSelect 선택 | 즉시 적용 (watch로 자동) |
| 계층 뷰 | RadioButton 클릭 | 즉시 적용 (watch로 자동) |
| 초점 Task | [적용] 버튼 클릭 | 버튼 클릭 시 적용 |

### 4.3 그룹 노드 축소/확장

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 확장 | GroupNode 클릭 (축소 상태) | 그룹 내 하위 Task 노드 표시, 아이콘 ▶ → ▼ |
| 축소 | GroupNode 클릭 (확장 상태) | 그룹 내 하위 Task 노드 숨김, 아이콘 ▼ → ▶ |

**레이아웃 동작:**
- 확장: 하위 Task 노드가 그룹 노드 아래/오른쪽에 나타남 (Vue Flow 자동 레이아웃)
- 축소: 하위 Task 노드 제거, 그룹 간 엣지만 표시

### 4.4 초점 뷰 적용

| 단계 | 동작 | UI 변화 |
|------|------|---------|
| 1 | Task 선택 (Select Dropdown) | 초점 Task 설정, 깊이 RadioButton 활성화 |
| 2 | 깊이 선택 (1~3) | 깊이 값 설정 |
| 3 | [적용] 버튼 클릭 | BFS 알고리즘으로 그래프 필터링, 초점 Task 노란색 하이라이트 |

**시각적 표현:**
- 초점 Task: 노란색 테두리 + 링 효과 (`.task-node-highlight-selected`)
- Depth 1: 실선 테두리 (`.task-node-focus-depth-1`)
- Depth 2: 점선 테두리 (`.task-node-focus-depth-2`)
- Depth 3: 점 테두리 (`.task-node-focus-depth-3`)

---

## 5. 반응형 디자인

### 5.1 화면 크기별 레이아웃

| 화면 크기 | 모달 크기 | 필터 패널 | 그래프 영역 |
|----------|----------|----------|------------|
| Desktop (>1200px) | 90vw × 85vh | 펼침 (기본) | 최대 크기 |
| Tablet (768-1199px) | 95vw × 80vh | 접힘 (기본) | 중간 크기 |
| Mobile (<767px) | 100vw × 100vh | 접힘 (고정) | 전체 화면 |

### 5.2 모바일 최적화

- 필터 패널: 접힌 상태 기본, 헤더만 표시
- 카테고리 필터: 가로 스크롤 가능
- 초점 Task 선택: Select Dropdown → Bottom Sheet로 변경 (선택 사항)
- 그래프: 터치 제스처 지원 (핀치 줌, 팬)

---

## 6. 접근성 (Accessibility)

### 6.1 키보드 탐색

| 요소 | 키 | 동작 |
|------|-----|------|
| 필터 토글 버튼 | Enter, Space | 펼치기/접기 |
| Checkbox | Space | 선택/해제 |
| RadioButton | Arrow Up/Down | 선택 이동 |
| Select Dropdown | Enter | 옵션 목록 열기 |
| [적용] 버튼 | Enter | 초점 뷰 적용 |

### 6.2 스크린 리더 지원

- 모든 Checkbox/RadioButton에 `<label for="">` 연결
- Button에 `v-tooltip` 또는 `aria-label` 속성 추가
- 필터 통계: `aria-live="polite"` 영역으로 설정
- GroupNode: `role="button"` + `aria-expanded` 속성

---

## 7. 성능 고려사항

### 7.1 렌더링 최적화

- Vue Flow 가상화: 노드 200개 이상 시 자동 가상 스크롤
- 필터 debounce: 상태 MultiSelect 변경 시 300ms 딜레이 적용
- 그룹 노드 memoization: `computed`로 그룹 데이터 캐싱

### 7.2 애니메이션 성능

- CSS `transform`, `opacity`만 사용 (GPU 가속)
- `max-height` 대신 `height: 0 → auto` 트랜지션 (필터 패널)
- 그룹 노드 확장: 0.2초 이하 애니메이션

---

## 8. 다크 테마 적용

모든 컴포넌트는 main.css의 CSS 변수 기반 다크 테마를 따릅니다.

### 8.1 색상 변수 사용

| 요소 | CSS 변수 |
|------|----------|
| 배경 | `var(--color-bg-card)` |
| 텍스트 | `var(--color-text)` |
| 보조 텍스트 | `var(--color-text-secondary)` |
| 보더 | `var(--color-border)` |
| 프라이머리 | `var(--color-primary)` |
| 성공 | `var(--color-success)` |
| 경고 | `var(--color-warning)` |
| 위험 | `var(--color-danger)` |

### 8.2 PrimeVue 토큰 오버라이드

기존 main.css의 PrimeVue 토큰 설정을 그대로 활용:
- `--p-surface-*`
- `--p-content-*`
- `--p-select-*`
- `--p-dialog-*`

---

## 9. 컴포넌트 Props/Emits 인터페이스

### 9.1 GraphFilterPanel.vue

```typescript
interface Props {
  categories: string[]       // 선택된 카테고리
  statuses: string[]         // 선택된 상태
  hierarchyMode: 'full' | 'wp' | 'act'  // 계층 뷰 모드
  focusTask: string | null   // 초점 Task ID
  focusDepth: number         // 초점 깊이
  stats: {                   // 그래프 통계
    nodeCount: number
    edgeCount: number
  }
}

interface Emits {
  'update:categories': [categories: string[]]
  'update:statuses': [statuses: string[]]
  'update:hierarchyMode': [mode: 'full' | 'wp' | 'act']
  'update:focusTask': [taskId: string | null]
  'update:focusDepth': [depth: number]
  'reset': []                // 필터 초기화
  'applyFocus': []           // 초점 뷰 적용
}
```

### 9.2 GroupNode.vue

```typescript
interface Props {
  id: string                 // 노드 ID (Vue Flow)
  data: GroupNodeData        // 그룹 노드 데이터
  selected?: boolean         // 선택 여부
}

interface GroupNodeData {
  groupId: string            // 예: "WP-01"
  groupType: 'wp' | 'act'
  title: string
  taskCount: number
  completedCount: number
  isExpanded: boolean
  childTaskIds: string[]
}

interface Emits {
  'toggle': [groupId: string]  // 축소/확장 토글
}
```

### 9.3 TaskNode.vue

```typescript
interface Props {
  id: string                 // 노드 ID (Vue Flow)
  data: TaskNodeData         // Task 노드 데이터
  selected?: boolean         // 선택 여부
  highlightType?: 'selected' | 'dependsOn' | 'dependedBy' | 'dimmed' | null
  focusDepth?: number        // 초점 뷰의 깊이 (1~3)
}

interface TaskNodeData {
  taskId: string
  title: string
  status: string
  statusName: string
  category: string
  categoryName: string
  assignee?: string
  depends?: string
}
```

---

## 10. 개발 우선순위

### Phase 1: 필터 패널 기본 구조 (High)
1. GraphFilterPanel 컴포넌트 생성
2. 카테고리/상태 필터 UI (Checkbox, MultiSelect)
3. 필터 패널 접기/펼치기 기능
4. 필터 초기화 버튼

### Phase 2: 계층 접기 기능 (High)
1. GroupNode 컴포넌트 생성
2. useDependencyGraph에 그룹 노드 생성 로직 추가
3. 그룹 노드 축소/확장 이벤트 처리
4. Vue Flow 레이아웃 자동 조정

### Phase 3: 초점 뷰 (Medium)
1. 초점 Task 선택 UI (Select + RadioButton)
2. BFS 기반 depth 제한 알고리즘 구현
3. 초점 노드 하이라이트 스타일
4. Depth별 테두리 스타일 (실선/점선/점)

### Phase 4: URL 파라미터 및 최적화 (Medium)
1. URL 파라미터 인코딩/디코딩 함수
2. Vue Router 연동
3. 성능 최적화 (debounce, memoization)
4. 모바일 반응형 최적화

---

## 11. 인수 기준 체크리스트

- [ ] AC-01: GraphFilterPanel 컴포넌트가 모달 상단에 표시됨
- [ ] AC-02: 카테고리 필터 적용 시 해당 카테고리 Task만 표시됨
- [ ] AC-03: 상태 필터 적용 시 해당 상태 Task만 표시됨
- [ ] AC-04: 계층 뷰 "WP 그룹" 선택 시 WP 그룹 노드로 표시됨
- [ ] AC-05: 그룹 노드 클릭 시 축소/확장이 0.2초 애니메이션으로 동작함
- [ ] AC-06: 초점 Task 선택 및 [적용] 시 depth 제한 내 Task만 표시됨
- [ ] AC-07: 초점 Task가 노란색 테두리로 하이라이트됨
- [ ] AC-08: 필터 설정이 URL 파라미터에 반영됨
- [ ] AC-09: URL 파라미터로 페이지 로드 시 필터 상태가 복원됨
- [ ] AC-10: 필터 초기화 버튼 클릭 시 전체 그래프가 표시됨
- [ ] AC-11: 키보드만으로 모든 필터 조작이 가능함 (접근성)
- [ ] AC-12: 스크린 리더로 필터 상태를 정확히 인식할 수 있음
- [ ] AC-13: 모바일 화면에서 필터 패널이 접힌 상태로 표시됨
- [ ] AC-14: 다크 테마 색상이 main.css 변수와 일치함

---

## 12. 참고 자료

### 12.1 기존 구현
- `app/components/wbs/graph/DependencyGraph.client.vue`
- `app/components/wbs/graph/DependencyGraphModal.vue`
- `app/composables/useDependencyGraph.ts`
- `app/types/graph.ts`

### 12.2 PrimeVue 컴포넌트 문서
- [Checkbox](https://primevue.org/checkbox/)
- [MultiSelect](https://primevue.org/multiselect/)
- [RadioButton](https://primevue.org/radiobutton/)
- [Select](https://primevue.org/select/)
- [Button](https://primevue.org/button/)
- [Tag](https://primevue.org/tag/)

### 12.3 Vue Flow 문서
- [Custom Nodes](https://vueflow.dev/guide/nodes.html#custom-nodes)
- [Node Types](https://vueflow.dev/guide/nodes.html#node-types)
- [Layout](https://vueflow.dev/examples/layout.html)

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- 선행 Task: `TSK-06-01/030-implementation.md`
- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 11.4

---

<!--
author: Claude
Template Version: 1.0.0
-->
