# 화면설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * UI 레이아웃 및 컴포넌트별 상세 화면 구성
> * PrimeVue 4.x 컴포넌트 활용 계획
> * CSS 클래스 중앙화 원칙 준수
> * 접근성(ARIA) 고려사항 포함

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [bd] 기본설계 완료 → [dd] 상세설계 대기 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (Frontend Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md` | 전체 |
| CSS 규칙 | `app/assets/css/main.css` | Dark Blue 테마, PrimeVue 토큰 |
| 기존 컴포넌트 | `app/components/wbs/detail/TaskDetailPanel.vue` | 레이아웃 참조 |
| 기존 컴포넌트 | `app/components/wbs/detail/TaskBasicInfo.vue` | UI 패턴 참조 |

---

## 1. 전체 레이아웃 구조

### 1.1 노드 타입별 패널 분기

```
wbs.vue (우측 패널)
├── Loading/Error/Empty State
└── NodeDetailPanel (분기 컨테이너)
    ├── TaskDetailPanel (type === 'task') ← 기존 유지
    └── WpActDetailPanel (type === 'wp' || 'act') ← 신규
        ├── WpActBasicInfo (기본 정보)
        ├── WpActProgress (진행률 시각화)
        └── WpActChildren (하위 노드 목록)
```

### 1.2 화면 비율 및 레이아웃

**우측 패널 제약사항** (기존 AppLayout):
- 패널 너비: 40% (Splitter 조절 가능)
- 최소 너비: 400px
- 스크롤: Y축 자동 스크롤

**WpActDetailPanel 내부 구조**:
```
┌────────────────────────────────────────┐
│ PrimeVue Card (전체 컨테이너)           │
├────────────────────────────────────────┤
│ ▼ 기본 정보 (WpActBasicInfo)           │
│   [ID] [제목] [일정] [진행률]          │
│                                        │
│ ▼ 진행 상황 (WpActProgress)            │
│   [전체/완료/진행/대기]                 │
│   [ProgressBar]                        │
│   [상태별 분포]                         │
│                                        │
│ ▼ 하위 노드 (WpActChildren)            │
│   [필터/정렬 (향후)]                    │
│   [노드 목록 - 스크롤 가능]             │
└────────────────────────────────────────┘
```

---

## 2. 컴포넌트별 UI 상세 명세

### 2.1 NodeDetailPanel (분기 컨테이너)

#### 2.1.1 목적
- Task/WP/ACT 타입별 패널 분기 렌더링
- TaskDetailPanel 기존 동작 유지
- WP/ACT 선택 시 WpActDetailPanel 표시

#### 2.1.2 UI 구조

**템플릿 구조**:
```vue
<template>
  <div class="node-detail-panel h-full" role="region" aria-label="노드 상세 정보">
    <!-- Task 선택 시 -->
    <TaskDetailPanel v-if="selectionStore.isTaskSelected" />

    <!-- WP/ACT 선택 시 -->
    <WpActDetailPanel
      v-else-if="isWpOrActSelected"
      :node="selectedNode"
    />

    <!-- 선택 없음 -->
    <Message v-else severity="info" data-testid="empty-state-message">
      왼쪽에서 노드를 선택하세요
    </Message>
  </div>
</template>
```

#### 2.1.3 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Message | 빈 상태 표시 | `severity="info"` |

#### 2.1.4 CSS 클래스

```css
/* 기본 컨테이너 - Tailwind 유틸리티 사용 */
.node-detail-panel {
  @apply h-full flex flex-col;
}
```

#### 2.1.5 접근성 (ARIA)

```html
<div role="region" aria-label="노드 상세 정보">
```

---

### 2.2 WpActDetailPanel (WP/ACT 컨테이너)

#### 2.2.1 목적
- WP/ACT 노드 전체 정보 표시
- 3개 섹션 컴포넌트 조정
- 하위 노드 선택 이벤트 처리

#### 2.2.2 UI 구조

**템플릿 구조**:
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

#### 2.2.3 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Card | 전체 컨테이너 | - |

#### 2.2.4 CSS 클래스

```css
/* main.css에 추가 */

/* WP/ACT Detail Panel 컨테이너 */
.wp-act-detail-panel {
  @apply h-full flex flex-col;
}

/* 콘텐츠 영역 - 스크롤 가능 */
.wp-act-detail-content {
  @apply p-4 space-y-4 overflow-y-auto;
  max-height: calc(100vh - 8rem); /* 헤더 높이 제외 */
}
```

#### 2.2.5 접근성 (ARIA)

```html
<Card
  role="region"
  :aria-label="`${nodeTypeLabel} 상세 정보`"
  data-testid="wp-act-detail-panel"
>
```

---

### 2.3 WpActBasicInfo (기본 정보)

#### 2.3.1 목적
- WP/ACT ID, 제목, 일정, 진행률 표시
- 읽기 전용 (편집 없음)

#### 2.3.2 UI 구조

**비주얼 레이아웃**:
```
┌─────────────────────────────────────────┐
│ 기본 정보                                │
├─────────────────────────────────────────┤
│ 🔷 WP-01                                │
│ Platform Infrastructure                 │
│                                         │
│ 📅 일정                                 │
│    2025-12-13 ~ 2025-12-20             │
│                                         │
│ 📊 전체 진행률                          │
│    ████████████░░░░░░░░ 75%            │
└─────────────────────────────────────────┘
```

**템플릿 구조**:
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

#### 2.3.3 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Panel | 섹션 컨테이너 | `header="기본 정보"` |
| Badge | 노드 ID 표시 | `severity="info"` |
| ProgressBar | 진행률 표시 | `:value="progress"`, `:show-value="true"` |

#### 2.3.4 CSS 클래스

```css
/* main.css에 추가 */

/* WpActBasicInfo 컨테이너 */
.wp-act-basic-info .field {
  @apply mb-3;
}

.wp-act-basic-info .field:last-child {
  @apply mb-0;
}

/* 노드 타입 아이콘 (main.css 기존 클래스 재사용) */
.node-icon-wp {
  @apply bg-level-wp; /* #3b82f6 */
}

.node-icon-act {
  @apply bg-level-act; /* #22c55e */
}
```

#### 2.3.5 상태별 UI 변화

**진행률에 따른 ProgressBar 색상**:
```typescript
const progressBarClass = computed(() => {
  const progress = props.node.progress || 0
  if (progress >= 80) return 'progress-bar-high' // 초록색
  if (progress >= 40) return 'progress-bar-medium' // 주황색
  return 'progress-bar-low' // 빨간색
})
```

#### 2.3.6 접근성 (ARIA)

```html
<Panel
  header="기본 정보"
  role="region"
  aria-label="WP/ACT 기본 정보"
>
  <ProgressBar
    :value="progress"
    aria-label="전체 진행률"
    :aria-valuenow="progress"
    :aria-valuemin="0"
    :aria-valuemax="100"
  />
</Panel>
```

---

### 2.4 WpActProgress (진행률 시각화)

#### 2.4.1 목적
- 하위 Task 상태 집계 표시
- 완료/진행/대기 비율 시각화
- 상태별 Task 카운트 표시

#### 2.4.2 UI 구조

**비주얼 레이아웃**:
```
┌─────────────────────────────────────────┐
│ 진행 상황                                │
├─────────────────────────────────────────┤
│ 전체 Task: 10개                          │
│                                         │
│ 완료: 5개 (50%) | 진행: 3개 (30%) | 대기: 2개 (20%) │
│                                         │
│ [████████████░░░░░░░░]                  │
│   완료 50%   진행 30%   대기 20%        │
│                                         │
│ ─── 상태별 분포 ───                     │
│ [ ] Todo: 2        [bd] Design: 1       │
│ [dd] Detail: 1     [im] Implement: 1    │
│ [vf] Verify: 0     [xx] Done: 5         │
└─────────────────────────────────────────┘
```

**템플릿 구조**:
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
          <span class="font-semibold text-success">{{ stats.completed }}개 ({{ completedPercentage }}%)</span>
        </div>
        <div class="flex items-center gap-1">
          <i class="pi pi-spinner text-warning"></i>
          <span class="text-text-secondary">진행:</span>
          <span class="font-semibold text-warning">{{ stats.inProgress }}개 ({{ inProgressPercentage }}%)</span>
        </div>
        <div class="flex items-center gap-1">
          <i class="pi pi-clock text-text-muted"></i>
          <span class="text-text-secondary">대기:</span>
          <span class="font-semibold text-text-muted">{{ stats.todo }}개 ({{ todoPercentage }}%)</span>
        </div>
      </div>

      <!-- 다단계 ProgressBar (완료/진행/대기) -->
      <div class="progress-segments" data-testid="progress-segments">
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
            :severity="getStatusSeverity(status)"
            data-testid="`status-count-${status}`"
          />
        </div>
      </div>
    </div>
  </Panel>
</template>
```

#### 2.4.3 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Panel | 섹션 컨테이너 | `header="진행 상황"` |
| Divider | 섹션 구분선 | - |
| Badge | 상태별 카운트 표시 | `:value="count"`, `:severity="..."` |

#### 2.4.4 CSS 클래스

```css
/* main.css에 추가 */

/* 다단계 ProgressBar 트랙 */
.progress-segments {
  @apply w-full;
}

.progress-segment-track {
  @apply flex h-4 rounded-full overflow-hidden bg-border;
}

.progress-segment {
  @apply transition-all duration-300;
}

/* 완료 세그먼트 (초록색) */
.progress-segment-completed {
  @apply bg-success;
}

/* 진행 세그먼트 (주황색) */
.progress-segment-inprogress {
  @apply bg-warning;
}

/* 대기 세그먼트 (회색) */
.progress-segment-todo {
  @apply bg-text-muted;
}
```

#### 2.4.5 상태별 UI 변화

**Badge 색상 매핑**:
```typescript
function getStatusSeverity(status: string): string {
  const severityMap: Record<string, string> = {
    '[ ]': 'secondary', // 회색
    '[bd]': 'info',     // 파란색
    '[dd]': 'info',     // 파란색
    '[im]': 'warning',  // 주황색
    '[vf]': 'success',  // 초록색
    '[xx]': 'success',  // 초록색
  }
  return severityMap[status] || 'secondary'
}
```

#### 2.4.6 접근성 (ARIA)

```html
<div
  class="progress-segments"
  role="progressbar"
  :aria-valuenow="completedPercentage"
  :aria-valuemin="0"
  :aria-valuemax="100"
  :aria-label="`전체 진행률 ${completedPercentage}%`"
>
```

---

### 2.5 WpActChildren (하위 노드 목록)

#### 2.5.1 목적
- 하위 노드 목록 렌더링
- 노드별 상태/진행률 표시
- 클릭 시 노드 선택 변경

#### 2.5.2 UI 구조

**비주얼 레이아웃**:
```
┌─────────────────────────────────────────┐
│ 하위 노드 (10)                           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔶 ACT-01-01: Project Setup        │ │
│ │    진행률: 100% | Task: 5개         │ │
│ │    [xx] Done                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔶 ACT-01-02: App Layout           │ │
│ │    진행률: 100% | Task: 2개         │ │
│ │    [xx] Done                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔸 TSK-01-03: Integration          │ │
│ │    [vf] Verify                      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**템플릿 구조**:
```vue
<template>
  <Panel
    :header="`하위 노드 (${children.length})`"
    data-testid="wp-act-children-panel"
    class="wp-act-children"
  >
    <!-- 빈 상태 -->
    <div v-if="children.length === 0" class="empty-state">
      <Message severity="info" data-testid="children-empty-message">
        하위 노드가 없습니다
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

#### 2.5.3 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Panel | 섹션 컨테이너 | `:header="..."` |
| Message | 빈 상태 표시 | `severity="info"` |
| Badge | 상태 표시 (Task만) | `:value="status"` |

#### 2.5.4 CSS 클래스

```css
/* main.css에 추가 */

/* 하위 노드 목록 컨테이너 */
.children-list {
  @apply space-y-2 max-h-[400px] overflow-y-auto;
}

/* 하위 노드 아이템 - 기본 */
.child-item {
  @apply p-3 rounded-lg border border-border bg-bg-card cursor-pointer transition-all;
}

/* 하위 노드 아이템 - Hover */
.child-item:hover {
  @apply border-border-light bg-slate-700/50 shadow-md;
}

/* 하위 노드 아이템 - Focus */
.child-item:focus {
  @apply ring-2 ring-primary ring-offset-2 ring-offset-bg;
}

/* 하위 노드 헤더 */
.child-header {
  @apply flex items-center justify-between gap-2;
}

/* 하위 노드 정보 */
.child-info {
  @apply mt-2 pt-2 border-t border-border/50;
}
```

#### 2.5.5 상태별 UI 변화

**선택된 노드 하이라이트** (향후 추가 가능):
```css
.child-item.selected {
  @apply border-primary bg-primary/10;
}
```

#### 2.5.6 접근성 (ARIA)

```html
<div
  class="children-list"
  role="list"
  aria-label="하위 노드 목록"
>
  <div
    role="listitem"
    tabindex="0"
    :aria-label="`${child.title} 선택`"
    @click="handleChildClick(child.id)"
    @keydown.enter="handleChildClick(child.id)"
  >
```

**키보드 네비게이션**:
- `Tab`: 다음 노드로 이동
- `Shift+Tab`: 이전 노드로 이동
- `Enter`: 노드 선택

---

## 3. PrimeVue 컴포넌트 사용 계획

### 3.1 컴포넌트 매핑 테이블

| 화면 요소 | PrimeVue 컴포넌트 | 버전 | 사용 이유 |
|----------|------------------|------|-----------|
| 전체 컨테이너 | Card | 4.x | TaskDetailPanel과 일관된 스타일 |
| 섹션 컨테이너 | Panel | 4.x | 접을 수 있는 섹션 구조 |
| 노드 ID 표시 | Badge | 4.x | 강조 표시 및 시맨틱 색상 |
| 진행률 표시 | ProgressBar | 4.x | 시각적 진행률 표시 |
| 상태 표시 | Badge | 4.x | 상태별 색상 구분 |
| 빈 상태 메시지 | Message | 4.x | 정보성 메시지 표시 |
| 섹션 구분선 | Divider | 4.x | 명확한 영역 구분 |

### 3.2 PrimeVue 테마 통합

**Dark Blue 테마와 통합** (main.css 기존 정의 활용):
```css
/* main.css에 이미 정의된 PrimeVue 디자인 토큰 사용 */
:root {
  --p-panel-background: var(--color-card);         /* #1e1e38 */
  --p-panel-color: var(--color-text);              /* #e8e8e8 */
  --p-panel-border-color: var(--color-border);     /* #3d3d5c */

  --p-badge-info-background: var(--color-primary); /* #3b82f6 */
  --p-badge-success-background: var(--color-success); /* #22c55e */
  --p-badge-warning-background: var(--color-warning); /* #f59e0b */
}
```

### 3.3 컴포넌트별 Props 설정

**ProgressBar**:
```vue
<ProgressBar
  :value="progress"
  :show-value="true"
  :class="progressBarClass"
  data-testid="progress-bar"
/>
```

**Badge**:
```vue
<Badge
  :value="status"
  :severity="severity"
  class="font-mono text-xs"
/>
```

**Panel**:
```vue
<Panel
  header="섹션 제목"
  :toggleable="false"
  data-testid="panel"
>
```

---

## 4. CSS 클래스 설계

### 4.1 CSS 클래스 중앙화 원칙 준수

**원칙**:
- 모든 색상/스타일은 `main.css`에 정의
- 컴포넌트 내 `:style` 사용 금지
- HEX 하드코딩 금지
- Tailwind 유틸리티 우선 사용

**예외**:
- 동적 계산 필수 (예: `paddingLeft`, `width: ${percentage}%`)

### 4.2 신규 CSS 클래스 목록

**main.css에 추가할 클래스**:
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
```

### 4.3 기존 클래스 재사용

**main.css에서 재사용할 클래스**:
- `.node-icon`, `.node-icon-wp`, `.node-icon-act`, `.node-icon-task` (노드 아이콘)
- `.progress-bar-low`, `.progress-bar-medium`, `.progress-bar-high` (ProgressBar 색상)
- `.status-badge`, `.status-todo`, `.status-done` 등 (상태 배지)

---

## 5. 반응형 디자인

### 5.1 브레이크포인트 전략

**Tailwind 기본 브레이크포인트**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**적용 우선순위**:
1. Desktop (1024px+): 기본 레이아웃
2. Tablet (768px-1023px): 일부 간격 축소
3. Mobile (<768px): 현재 범위 외 (향후 추가)

### 5.2 반응형 클래스

**텍스트 크기**:
```css
/* Desktop */
.child-item .text-sm {
  @apply text-sm;
}

/* Tablet */
@media (max-width: 1023px) {
  .child-item .text-sm {
    @apply text-xs;
  }
}
```

**아이콘 크기**:
```css
/* Desktop */
.node-icon {
  @apply w-6 h-6;
}

/* Tablet */
@media (max-width: 1023px) {
  .node-icon {
    @apply w-5 h-5 text-xs;
  }
}
```

### 5.3 스크롤 영역 최적화

**하위 노드 목록 최대 높이**:
```css
.children-list {
  @apply max-h-[400px] overflow-y-auto;
}

/* Tablet에서 높이 축소 */
@media (max-width: 1023px) {
  .children-list {
    @apply max-h-[300px];
  }
}
```

---

## 6. 접근성 (ARIA) 고려사항

### 6.1 ARIA 속성 체크리스트

| 컴포넌트 | ARIA 속성 | 목적 |
|---------|-----------|------|
| NodeDetailPanel | `role="region"`, `aria-label="노드 상세 정보"` | 랜드마크 역할 |
| WpActDetailPanel | `role="region"`, `:aria-label="..."` | 노드 타입별 라벨 |
| WpActChildren 목록 | `role="list"` | 목록 구조 명시 |
| child-item | `role="listitem"`, `tabindex="0"`, `:aria-label="..."` | 키보드 접근 및 선택 |
| ProgressBar | `role="progressbar"`, `:aria-valuenow="..."` | 진행률 정보 제공 |

### 6.2 키보드 네비게이션

**하위 노드 목록**:
- `Tab`: 다음 노드로 포커스 이동
- `Shift+Tab`: 이전 노드로 포커스 이동
- `Enter`: 선택된 노드 활성화
- `Escape`: 포커스 해제 (옵션)

**구현**:
```vue
<div
  role="listitem"
  tabindex="0"
  @click="handleChildClick(child.id)"
  @keydown.enter="handleChildClick(child.id)"
>
```

### 6.3 스크린 리더 지원

**동적 콘텐츠 업데이트**:
```vue
<div
  aria-live="polite"
  aria-atomic="true"
  role="status"
>
  <!-- 선택된 노드 정보 업데이트 시 스크린 리더에 알림 -->
</div>
```

**숨김 라벨** (아이콘 전용):
```vue
<i class="pi pi-chart-bar" aria-hidden="true"></i>
<span class="sr-only">진행률</span>
```

---

## 7. 상태별 UI 변화

### 7.1 진행률에 따른 색상 변화

**ProgressBar 색상 매핑**:
```typescript
const progressBarClass = computed(() => {
  const progress = props.node.progress || 0
  if (progress >= 80) return 'progress-bar-high'    // 초록색 (#22c55e)
  if (progress >= 40) return 'progress-bar-medium'  // 주황색 (#f59e0b)
  return 'progress-bar-low'                         // 빨간색 (#ef4444)
})
```

**적용 예시**:
- 진행률 90%: 초록색 ProgressBar
- 진행률 50%: 주황색 ProgressBar
- 진행률 20%: 빨간색 ProgressBar

### 7.2 상태별 Badge 색상

**PrimeVue Badge severity 매핑**:
```typescript
function getStatusSeverity(status: string): string {
  const severityMap: Record<string, string> = {
    '[ ]': 'secondary',   // 회색
    '[bd]': 'info',       // 파란색
    '[dd]': 'info',       // 파란색
    '[im]': 'warning',    // 주황색
    '[vf]': 'success',    // 초록색
    '[xx]': 'success',    // 초록색
  }
  return severityMap[status] || 'secondary'
}
```

### 7.3 빈 상태 처리

**하위 노드가 없는 경우**:
```vue
<div v-if="children.length === 0" class="empty-state">
  <Message severity="info">
    하위 노드가 없습니다
  </Message>
</div>
```

**통계가 0인 경우**:
```vue
<div v-if="stats.total === 0" class="text-sm text-text-muted">
  하위 Task가 없습니다
</div>
```

---

## 8. 애니메이션 및 전환 효과

### 8.1 전환 애니메이션

**노드 패널 전환** (Task ↔ WP/ACT):
```vue
<Transition name="fade" mode="out-in">
  <TaskDetailPanel v-if="isTaskSelected" key="task" />
  <WpActDetailPanel v-else-if="isWpOrActSelected" key="wpact" />
</Transition>
```

**CSS**:
```css
/* main.css에 추가 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

### 8.2 호버 효과

**하위 노드 아이템 호버**:
```css
.child-item {
  @apply transition-all duration-200;
}

.child-item:hover {
  @apply border-border-light bg-slate-700/50 shadow-md transform scale-[1.01];
}
```

### 8.3 진행률 애니메이션

**다단계 ProgressBar 전환**:
```css
.progress-segment {
  @apply transition-all duration-300 ease-in-out;
}
```

---

## 9. 성능 최적화

### 9.1 가상 스크롤링 (향후)

**대량 하위 노드 처리** (100개 이상):
- PrimeVue VirtualScroller 적용 고려
- 초기 단계에서는 일반 v-for 사용

### 9.2 Computed 캐싱

**progressStats 계산**:
```typescript
const progressStats = computed(() => calculateProgressStats(props.node))
// Vue Reactivity로 자동 캐싱 - props.node 변경 시만 재계산
```

### 9.3 이벤트 핸들러 최적화

**디바운스 적용** (향후 필요 시):
```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedSelectNode = useDebounceFn((nodeId: string) => {
  selectionStore.selectNode(nodeId)
}, 100)
```

---

## 10. 컴포넌트 인터랙션 흐름

### 10.1 하위 노드 선택 흐름

```
1. 사용자가 WpActChildren에서 하위 노드 클릭
   └─> child-item @click="handleChildClick(child.id)"

2. WpActChildren이 select 이벤트 emit
   └─> emit('select', childId)

3. WpActDetailPanel이 이벤트 수신
   └─> handleNodeSelect(childId)
       └─> selectionStore.selectNode(childId)

4. selectionStore 업데이트
   ├─> selectedNodeId.value = childId
   └─> selectedNodeType.value 재계산

5. NodeDetailPanel 자동 업데이트
   ├─> childId가 Task면 TaskDetailPanel 렌더링
   └─> childId가 ACT면 WpActDetailPanel 재렌더링
```

### 10.2 진행률 업데이트 흐름

```
1. WBS 데이터 변경 (wbsStore)
   └─> Task 완료 등

2. wbsStore.nodes 반응형 업데이트

3. WpActDetailPanel의 props.node 자동 업데이트

4. progressStats computed 재계산
   └─> calculateProgressStats(props.node)

5. WpActProgress 자동 재렌더링
   └─> ProgressBar, Badge 값 업데이트
```

---

## 11. 테스트 고려사항

### 11.1 E2E 테스트 시나리오

**시나리오 1: WP 선택 및 정보 표시**
```typescript
test('WP 선택 시 WpActDetailPanel 렌더링', async ({ page }) => {
  // WP 노드 클릭
  await page.click('[data-testid="node-WP-01"]')

  // WpActDetailPanel 표시 확인
  await expect(page.locator('[data-testid="wp-act-detail-panel"]')).toBeVisible()

  // 기본 정보 표시 확인
  await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('WP-01')

  // 진행률 표시 확인
  await expect(page.locator('[data-testid="node-progress-bar"]')).toBeVisible()
})
```

**시나리오 2: 하위 노드 클릭 및 전환**
```typescript
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
```

### 11.2 단위 테스트 케이스

**WpActBasicInfo.test.ts**:
```typescript
describe('WpActBasicInfo', () => {
  it('노드 ID와 제목을 표시한다', () => {
    const wrapper = mount(WpActBasicInfo, {
      props: {
        node: { id: 'WP-01', title: 'Test WP', type: 'wp', ... }
      }
    })
    expect(wrapper.find('[data-testid="node-id-badge"]').text()).toBe('WP-01')
  })

  it('진행률에 따라 ProgressBar 색상이 변경된다', () => {
    // 진행률 90% → 초록색
    const wrapper1 = mount(WpActBasicInfo, {
      props: { node: { progress: 90, ... } }
    })
    expect(wrapper1.find('.progress-bar-high').exists()).toBe(true)

    // 진행률 50% → 주황색
    const wrapper2 = mount(WpActBasicInfo, {
      props: { node: { progress: 50, ... } }
    })
    expect(wrapper2.find('.progress-bar-medium').exists()).toBe(true)
  })
})
```

**WpActChildren.test.ts**:
```typescript
describe('WpActChildren', () => {
  it('하위 노드 목록을 렌더링한다', () => {
    const children = [
      { id: 'ACT-01-01', title: 'Test ACT', type: 'act', ... },
      { id: 'TSK-01-01', title: 'Test Task', type: 'task', ... }
    ]
    const wrapper = mount(WpActChildren, {
      props: { children }
    })
    expect(wrapper.findAll('.child-item').length).toBe(2)
  })

  it('하위 노드 클릭 시 select 이벤트를 emit한다', async () => {
    const wrapper = mount(WpActChildren, {
      props: { children: [{ id: 'ACT-01-01', ... }] }
    })
    await wrapper.find('[data-testid="child-item-ACT-01-01"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['ACT-01-01']])
  })
})
```

---

## 12. 향후 확장 가능성

### 12.1 필터링/정렬 UI

**WpActChildren에 추가 가능**:
```vue
<template>
  <Panel :header="`하위 노드 (${filteredChildren.length})`">
    <!-- 필터/정렬 컨트롤 -->
    <div class="filters mb-4 flex gap-2">
      <Dropdown
        v-model="filterStatus"
        :options="statusOptions"
        placeholder="상태 필터"
      />
      <Dropdown
        v-model="sortBy"
        :options="sortOptions"
        placeholder="정렬"
      />
    </div>

    <!-- 필터링된 목록 -->
    <div v-for="child in filteredChildren" ...>
  </Panel>
</template>
```

### 12.2 편집 기능 UI (향후)

**WpActBasicInfo 제목 인라인 편집**:
```vue
<InputText
  v-if="isEditingTitle"
  v-model="editedTitle"
  @blur="saveTitle"
/>
<div v-else @click="startEditTitle">
  {{ node.title }}
</div>
```

### 12.3 시각화 개선

**Gantt 차트 미니 뷰**:
- 하위 Task 일정을 미니 Gantt로 표시
- PrimeVue Chart 또는 Frappe Gantt 재사용

**담당자별 분포 차트**:
- PrimeVue PieChart 활용

---

## 13. 요약 및 체크리스트

### 13.1 UI 설계 완료 항목

- [x] 전체 레이아웃 구조 설계
- [x] NodeDetailPanel 분기 로직 UI
- [x] WpActDetailPanel 컨테이너 UI
- [x] WpActBasicInfo 상세 UI (ID, 제목, 일정, 진행률)
- [x] WpActProgress 상세 UI (다단계 ProgressBar, 상태별 분포)
- [x] WpActChildren 상세 UI (하위 노드 목록, 클릭 이벤트)
- [x] PrimeVue 컴포넌트 매핑 및 Props 설정
- [x] CSS 클래스 중앙화 설계 (main.css)
- [x] 반응형 디자인 고려 (Desktop/Tablet)
- [x] 접근성 (ARIA) 속성 정의
- [x] 키보드 네비게이션 설계
- [x] 상태별 UI 변화 정의
- [x] 애니메이션 및 전환 효과
- [x] 테스트 시나리오 작성

### 13.2 다음 단계 준비

**상세설계 (020-detail-design.md)**:
- TypeScript 타입 정의
- 컴포넌트별 Props/Emits 인터페이스
- 메서드 시그니처 및 로직
- API 연동 (향후 필요 시)

**구현 (030-implementation.md)**:
- Vue 3 Composition API 구현
- PrimeVue 컴포넌트 통합
- CSS 클래스 적용
- 단위 테스트 작성

---

## 14. 참고 자료

### 14.1 관련 문서

- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md`
- PRD 섹션 6.3: Task Detail Panel
- CSS 규칙: `app/assets/css/main.css`

### 14.2 참조 컴포넌트

- `app/components/wbs/detail/TaskDetailPanel.vue`: 레이아웃 참조
- `app/components/wbs/detail/TaskBasicInfo.vue`: UI 패턴 참조
- `app/components/wbs/WbsTreeNode.vue`: 노드 아이콘 참조

### 14.3 외부 리소스

- [PrimeVue 4.x Documentation](https://primevue.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**다음 단계**: 상세설계 (020-detail-design.md)
