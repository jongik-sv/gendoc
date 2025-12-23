# 기본설계 (010-basic-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 기능 요구사항 중심, 해결책(How) 지향 작성
> * 세부 구현(코드)은 상세설계로 이관
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-05 |
| Task명 | TaskDetailPanel Dialog Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 6.3 (Task Detail Panel), 10.1 (UI 디자인 시스템) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화) |
| 상위 Work Package | WP-08: PrimeVue Component Migration | - |
| 선행 Task | TSK-08-02: WBS UI Components Migration | CSS 클래스 중앙화 패턴 참조 |

---

## 1. 요구사항 분석

### 1.1 PRD/TRD 요구사항 추출

| 요구사항 ID | 출처 | 요구사항 내용 | 우선순위 |
|------------|------|-------------|---------|
| REQ-01 | wbs.md | TaskDetailPanel: 인라인 스타일 제거 → PrimeVue Dialog 활용 | 필수 |
| REQ-02 | wbs.md | TaskWorkflow: WORKFLOW_THEME 제거 → CSS 클래스 (.workflow-*) 적용 | 필수 |
| REQ-03 | wbs.md | TaskHistory: HISTORY_THEME 제거 → CSS 클래스 (.history-marker-*) 적용 | 필수 |
| REQ-04 | wbs.md | TaskDocuments: 인라인 스타일 제거 → CSS 클래스 (.doc-card-*) 적용 | 필수 |
| REQ-05 | wbs.md | themeConfig.ts 의존성 완전 제거 | 필수 |
| REQ-06 | TRD 2.3.6 | CSS 클래스 중앙화 원칙 준수 (인라인 스타일 금지) | 필수 |
| REQ-07 | TRD 2.3.4 | Dark Blue 테마 색상 팔레트 일관성 유지 | 필수 |
| REQ-08 | TRD 2.3.3 | PrimeVue 컴포넌트 최우선 사용 원칙 | 필수 |

### 1.2 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|-------|---------|-------------------------------|
| FR-001 | TaskDetailPanel 인라인 스타일 제거 | :style 속성 전무, PrimeVue Dialog 최대 활용 |
| FR-002 | TaskWorkflow WORKFLOW_THEME 제거 | themeConfig.ts import 제거, CSS 클래스만 사용 |
| FR-003 | TaskHistory HISTORY_THEME 제거 | themeConfig.ts import 제거, CSS 클래스만 사용 |
| FR-004 | TaskDocuments 인라인 스타일 제거 | getDocumentCardStyle 제거, CSS 클래스만 사용 |
| FR-005 | CSS 클래스 정의 | main.css에 .workflow-*, .history-marker-*, .doc-card-* 정의 |
| FR-006 | themeConfig.ts 삭제 | 파일 삭제 및 모든 참조 제거 |
| FR-007 | 기존 기능 유지 | 시각적 모습 및 동작 100% 유지 (회귀 방지) |

### 1.3 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 측정 기준 |
|--------|---------|----------|
| NFR-001 | 유지보수성 | CSS 클래스 중앙화로 스타일 변경 용이성 |
| NFR-002 | 일관성 | PRD 10.1 Dark Blue 테마와 100% 일치 |
| NFR-003 | 테스트 호환성 | 기존 E2E 테스트 data-testid 유지 |
| NFR-004 | 성능 | 렌더링 성능 영향 없음 (< 5% 차이) |

---

## 2. 현황 분석

### 2.1 현재 컴포넌트 상태

#### TaskDetailPanel.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | PrimeVue Dialog + Card 컴포넌트 사용 |
| 인라인 스타일 | Dialog: `:style="{ width: '80vw', maxWidth: '1200px' }"` |
| 인라인 스타일 | task-detail-content: `style="max-height: calc(100vh - 200px)"` |
| 문제점 | **부분적 인라인 스타일** - Dialog width 및 콘텐츠 max-height |

**인라인 스타일 위치**:
```vue
<Dialog :style="{ width: '80vw', maxWidth: '1200px' }">
  <!-- line 6 -->

<div style="max-height: calc(100vh - 200px);">
  <!-- line 71 -->
```

**결론**: TaskDetailPanel은 **부분 마이그레이션 필요**. Dialog width를 CSS 클래스로 이동, 동적 계산은 예외 처리.

#### TaskWorkflow.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | Panel 컴포넌트 + computed 스타일 |
| 색상 제어 | **getNodeStyle() → WORKFLOW_THEME** ← themeConfig.ts 의존 |
| 문제점 | WORKFLOW_THEME.completed/current/pending HEX 하드코딩 |

**themeConfig.ts 의존성**:
```typescript
import { WORKFLOW_THEME } from '~/utils/themeConfig'

function getNodeStyle(index: number): Record<string, string> {
  if (index < currentStepIndex.value) {
    return { ...WORKFLOW_THEME.completed }  // { backgroundColor: '#22c55e', ... }
  } else if (index === currentStepIndex.value) {
    return { ...WORKFLOW_THEME.current }  // { backgroundColor: '#3b82f6', ... }
  } else {
    return { ...WORKFLOW_THEME.pending }  // { backgroundColor: '#e5e7eb', ... }
  }
}
```

**결론**: TaskWorkflow는 **마이그레이션 필수**. WORKFLOW_THEME 제거 후 CSS 클래스 바인딩 필요.

#### TaskHistory.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | Timeline + marker 템플릿 |
| 색상 제어 | **getEntryColor() → HISTORY_THEME** ← themeConfig.ts 의존 |
| 문제점 | HISTORY_THEME.transition/action/update/default HEX 하드코딩 |

**themeConfig.ts 의존성**:
```typescript
import { HISTORY_THEME } from '~/utils/themeConfig'

function getEntryColor(entry: HistoryEntry): string {
  const theme = HISTORY_THEME[entry.action as keyof typeof HISTORY_THEME] || HISTORY_THEME.default
  return theme.color  // '#3b82f6', '#8b5cf6', '#22c55e', '#6b7280'
}
```

**결론**: TaskHistory는 **마이그레이션 필수**. HISTORY_THEME 제거 후 CSS 클래스 바인딩 필요.

#### TaskDocuments.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | Card 컴포넌트 + wrapper div |
| 색상 제어 | **getDocumentCardStyle() → HEX 하드코딩** |
| 문제점 | backgroundColor, border 직접 정의 |

**HEX 하드코딩 위치**:
```typescript
function getDocumentCardStyle(doc: DocumentInfo): Record<string, string> {
  if (doc.exists) {
    return {
      backgroundColor: '#dbeafe',  // blue-100
      border: '1px solid #3b82f6'  // blue-500
    }
  } else {
    return {
      backgroundColor: '#f9fafb',  // gray-50
      border: '2px dashed #9ca3af',  // gray-400
      opacity: '0.6'
    }
  }
}
```

**결론**: TaskDocuments는 **마이그레이션 필수**. getDocumentCardStyle 제거 후 CSS 클래스 바인딩 필요.

### 2.2 인라인 스타일 및 themeConfig.ts 의존성 정리

| 컴포넌트 | 인라인 스타일 / themeConfig 의존 | 영향 범위 | 마이그레이션 필요성 |
|----------|-------------------------------|----------|-------------------|
| TaskDetailPanel | ✅ 2개 (Dialog width, content height) | Dialog, 스크롤 영역 | ✅ 부분 (width만) |
| TaskWorkflow | ✅ WORKFLOW_THEME (3개 상태) | completed, current, pending | ✅ 필수 |
| TaskHistory | ✅ HISTORY_THEME (4개 액션) | transition, action, update, default | ✅ 필수 |
| TaskDocuments | ✅ HEX 하드코딩 (2개 상태) | exists, expected | ✅ 필수 |

### 2.3 themeConfig.ts 분석

**파일**: `app/utils/themeConfig.ts`

**의존 컴포넌트**:
- TaskWorkflow.vue (WORKFLOW_THEME)
- TaskHistory.vue (HISTORY_THEME)

**내용**:
```typescript
export const WORKFLOW_THEME = {
  completed: { backgroundColor: '#22c55e', color: '#ffffff', border: 'none' },
  current: { backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 'bold', ... },
  pending: { backgroundColor: '#e5e7eb', color: '#6b7280', border: '2px dashed #9ca3af' }
}

export const HISTORY_THEME = {
  transition: { color: '#3b82f6', icon: 'pi pi-arrow-right' },
  action: { color: '#8b5cf6', icon: 'pi pi-bolt' },
  update: { color: '#22c55e', icon: 'pi pi-pencil' },
  default: { color: '#6b7280', icon: 'pi pi-circle' }
}

export const DOCUMENT_THEME = { ... }  // 미사용
```

**결론**: WORKFLOW_THEME와 HISTORY_THEME를 CSS 클래스로 대체 후 **파일 전체 삭제 가능**.

---

## 3. 솔루션 설계

### 3.1 전체 마이그레이션 전략

**원칙**: TSK-08-01, TSK-08-02 패턴 재사용

```
themeConfig.ts (HEX 하드코딩)
    ↓ 제거
CSS 변수 (main.css)
    ↓ 참조
Tailwind 클래스 (tailwind.config.ts)
    ↓ 사용
컴포넌트 (:class 바인딩)
```

### 3.2 TaskDetailPanel 솔루션

#### 3.2.1 문제

```vue
<!-- 현재: 인라인 스타일 -->
<Dialog :style="{ width: '80vw', maxWidth: '1200px' }">
  <!-- ... -->
</Dialog>

<div class="task-detail-content overflow-y-auto" style="max-height: calc(100vh - 200px);">
  <!-- ... -->
</div>
```

#### 3.2.2 해결책

**Step 1**: main.css에 Dialog width 클래스 정의

```css
.document-viewer-dialog {
  width: 80vw;
  max-width: 1200px;
}
```

**Step 2**: 컴포넌트에서 class 바인딩

```vue
<!-- 변경 후: CSS 클래스 -->
<Dialog class="document-viewer-dialog">
  <!-- ... -->
</Dialog>
```

**Step 3**: 동적 계산은 유지 (예외 처리)

```vue
<!-- max-height는 동적 계산이므로 인라인 스타일 예외 허용 -->
<div :style="{ maxHeight: 'calc(100vh - 200px)' }">
  <!-- CLAUDE.md 예외 사항: 동적 계산 필수 -->
</div>
```

### 3.3 TaskWorkflow 솔루션

#### 3.3.1 문제

```typescript
import { WORKFLOW_THEME } from '~/utils/themeConfig'

function getNodeStyle(index: number): Record<string, string> {
  if (index < currentStepIndex.value) {
    return { ...WORKFLOW_THEME.completed }
  } else if (index === currentStepIndex.value) {
    return { ...WORKFLOW_THEME.current }
  } else {
    return { ...WORKFLOW_THEME.pending }
  }
}
```

```vue
<div :style="getNodeStyle(index)">
```

#### 3.3.2 해결책

**Step 1**: main.css에 워크플로우 노드 CSS 클래스 정의

```css
/* 워크플로우 노드 - 완료 상태 */
.workflow-node-completed {
  @apply bg-success text-white;
}

/* 워크플로우 노드 - 현재 상태 */
.workflow-node-current {
  @apply bg-primary text-white font-bold;
  transform: scale(1.1);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

/* 워크플로우 노드 - 미완료 상태 */
.workflow-node-pending {
  @apply bg-gray-200 text-gray-500 border-2 border-dashed border-gray-400;
}
```

**Step 2**: getNodeStyle → getNodeClass로 변경

```typescript
// WORKFLOW_THEME import 제거

function getNodeClass(index: number): string {
  if (index < currentStepIndex.value) {
    return 'workflow-node-completed'
  } else if (index === currentStepIndex.value) {
    return 'workflow-node-current'
  } else {
    return 'workflow-node-pending'
  }
}
```

**Step 3**: :style → :class 바인딩

```vue
<div :class="getNodeClass(index)">
```

### 3.4 TaskHistory 솔루션

#### 3.4.1 문제

```typescript
import { HISTORY_THEME } from '~/utils/themeConfig'

function getEntryColor(entry: HistoryEntry): string {
  const theme = HISTORY_THEME[entry.action as keyof typeof HISTORY_THEME] || HISTORY_THEME.default
  return theme.color
}
```

```vue
<div :style="{ backgroundColor: getEntryColor(slotProps.item) }">
```

#### 3.4.2 해결책

**Step 1**: main.css에 히스토리 마커 CSS 클래스 정의

```css
/* 이력 마커 - 상태 전이 */
.history-marker-transition {
  @apply bg-primary;
}

/* 이력 마커 - 액션 실행 */
.history-marker-action {
  @apply bg-level-project;  /* purple */
}

/* 이력 마커 - 업데이트 */
.history-marker-update {
  @apply bg-success;
}

/* 이력 마커 - 기본값 */
.history-marker-default {
  @apply bg-gray-500;
}
```

**Step 2**: getEntryColor → getEntryMarkerClass로 변경

```typescript
// HISTORY_THEME import 제거

function getEntryMarkerClass(entry: HistoryEntry): string {
  const action = entry.action || 'default'
  return `history-marker-${action}`
}
```

**Step 3**: :style → :class 바인딩

```vue
<div :class="['flex items-center justify-center w-8 h-8 rounded-full', getEntryMarkerClass(slotProps.item)]">
```

**Step 4**: getEntryIcon 유지 (아이콘 매핑)

```typescript
function getEntryIcon(entry: HistoryEntry): string {
  switch (entry.action) {
    case 'transition': return 'pi pi-arrow-right'
    case 'action': return 'pi pi-bolt'
    case 'update': return 'pi pi-pencil'
    default: return 'pi pi-circle'
  }
}
```

### 3.5 TaskDocuments 솔루션

#### 3.5.1 문제

```typescript
function getDocumentCardStyle(doc: DocumentInfo): Record<string, string> {
  if (doc.exists) {
    return {
      backgroundColor: '#dbeafe',
      border: '1px solid #3b82f6'
    }
  } else {
    return {
      backgroundColor: '#f9fafb',
      border: '2px dashed #9ca3af',
      opacity: '0.6'
    }
  }
}
```

```vue
<Card :style="getDocumentCardStyle(doc)">
```

#### 3.5.2 해결책

**Step 1**: main.css에 문서 카드 CSS 클래스 정의

```css
/* 문서 카드 - 존재함 */
.doc-card-exists {
  @apply bg-blue-100 border border-primary;
}

.doc-card-exists:hover {
  @apply shadow-md;
}

/* 문서 카드 - 예정 */
.doc-card-expected {
  @apply bg-gray-50 border-2 border-dashed border-gray-400 opacity-60 cursor-not-allowed;
}
```

**Step 2**: getDocumentCardStyle → getDocumentCardClass로 변경

```typescript
function getDocumentCardClass(doc: DocumentInfo): string {
  return doc.exists ? 'doc-card-exists' : 'doc-card-expected'
}
```

**Step 3**: :style 제거, :class 바인딩

```vue
<Card :class="getDocumentCardClass(doc)">
```

**Step 4**: getDocumentCardClasses 병합

```typescript
// 기존 getDocumentCardClasses와 병합
function getDocumentCardClasses(doc: DocumentInfo): string[] {
  const classes = ['transition-all', 'duration-200']
  classes.push(doc.exists ? 'doc-card-exists' : 'doc-card-expected')
  return classes
}
```

### 3.6 themeConfig.ts 제거

**삭제 조건**:
1. TaskWorkflow.vue에서 WORKFLOW_THEME import 제거 완료
2. TaskHistory.vue에서 HISTORY_THEME import 제거 완료
3. 전체 프로젝트에서 themeConfig.ts import 검색 결과 0건

**삭제 파일**:
- `app/utils/themeConfig.ts`

---

## 4. 컴포넌트별 마이그레이션 상세

### 4.1 TaskDetailPanel.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| Dialog width | `:style="{ width: '80vw', maxWidth: '1200px' }"` | `class="document-viewer-dialog"` |
| 콘텐츠 높이 | `style="max-height: calc(100vh - 200px)"` | `:style="{ maxHeight: 'calc(100vh - 200px)' }"` (예외) |
| main.css | - | `.document-viewer-dialog` 클래스 추가 |

**마이그레이션 전 코드 구조**:
```vue
<Dialog :style="{ width: '80vw', maxWidth: '1200px' }">
<div style="max-height: calc(100vh - 200px);">
```

**마이그레이션 후 코드 구조**:
```vue
<Dialog class="document-viewer-dialog">
<div :style="{ maxHeight: 'calc(100vh - 200px)' }">  <!-- 동적 계산 예외 -->
```

### 4.2 TaskWorkflow.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| import | `import { WORKFLOW_THEME } from '~/utils/themeConfig'` | ❌ 삭제 |
| getNodeStyle | `function getNodeStyle() { return { ...WORKFLOW_THEME } }` | `function getNodeClass() { return 'workflow-node-*' }` |
| 템플릿 바인딩 | `:style="getNodeStyle(index)"` | `:class="[getNodeClasses(index), getNodeClass(index)]"` |
| main.css | - | `.workflow-node-*` 클래스 추가 |

**마이그레이션 전 코드 구조**:
```vue
<template>
  <div :class="getNodeClasses(index)" :style="getNodeStyle(index)">
</template>

<script>
import { WORKFLOW_THEME } from '~/utils/themeConfig'
function getNodeStyle(index: number) {
  if (index < currentStepIndex.value) {
    return { ...WORKFLOW_THEME.completed }
  }
  // ...
}
</script>
```

**마이그레이션 후 코드 구조**:
```vue
<template>
  <div :class="[getNodeClasses(index), getNodeClass(index)]">
</template>

<script>
// WORKFLOW_THEME import 제거
function getNodeClass(index: number): string {
  if (index < currentStepIndex.value) {
    return 'workflow-node-completed'
  }
  // ...
}
</script>
```

### 4.3 TaskHistory.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| import | `import { HISTORY_THEME } from '~/utils/themeConfig'` | ❌ 삭제 |
| getEntryColor | `function getEntryColor() { return HISTORY_THEME[].color }` | `function getEntryMarkerClass() { return 'history-marker-*' }` |
| marker 템플릿 | `:style="{ backgroundColor: getEntryColor() }"` | `:class="['...', getEntryMarkerClass()]"` |
| getEntryIcon | `HISTORY_THEME[].icon` 참조 | switch 문으로 변경 |
| main.css | - | `.history-marker-*` 클래스 추가 |

**마이그레이션 전 코드 구조**:
```vue
<template #marker="slotProps">
  <div :style="{ backgroundColor: getEntryColor(slotProps.item) }">
    <i :class="getEntryIcon(slotProps.item)" />
  </div>
</template>

<script>
import { HISTORY_THEME } from '~/utils/themeConfig'
function getEntryColor(entry: HistoryEntry): string {
  const theme = HISTORY_THEME[entry.action] || HISTORY_THEME.default
  return theme.color
}
</script>
```

**마이그레이션 후 코드 구조**:
```vue
<template #marker="slotProps">
  <div :class="['flex items-center justify-center w-8 h-8 rounded-full', getEntryMarkerClass(slotProps.item)]">
    <i :class="getEntryIcon(slotProps.item)" class="text-white text-sm" />
  </div>
</template>

<script>
// HISTORY_THEME import 제거
function getEntryMarkerClass(entry: HistoryEntry): string {
  const action = entry.action || 'default'
  return `history-marker-${action}`
}

function getEntryIcon(entry: HistoryEntry): string {
  switch (entry.action) {
    case 'transition': return 'pi pi-arrow-right'
    case 'action': return 'pi pi-bolt'
    case 'update': return 'pi pi-pencil'
    default: return 'pi pi-circle'
  }
}
</script>
```

### 4.4 TaskDocuments.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| getDocumentCardStyle | `function { return { backgroundColor, border } }` | ❌ 삭제 |
| getDocumentCardClasses | 기본 classes만 반환 | `doc-card-*` 클래스 포함 |
| Card 바인딩 | `:style="getDocumentCardStyle(doc)"` | `:class="getDocumentCardClasses(doc)"` |
| main.css | - | `.doc-card-exists`, `.doc-card-expected` 추가 |

**마이그레이션 전 코드 구조**:
```vue
<template>
  <Card :class="getDocumentCardClasses(doc)" :style="getDocumentCardStyle(doc)">
</template>

<script>
function getDocumentCardStyle(doc: DocumentInfo) {
  if (doc.exists) {
    return { backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }
  } else {
    return { backgroundColor: '#f9fafb', border: '2px dashed #9ca3af', opacity: '0.6' }
  }
}
</script>
```

**마이그레이션 후 코드 구조**:
```vue
<template>
  <Card :class="getDocumentCardClasses(doc)">
</template>

<script>
function getDocumentCardClasses(doc: DocumentInfo): string[] {
  const classes = ['transition-all', 'duration-200']
  classes.push(doc.exists ? 'doc-card-exists' : 'doc-card-expected')
  return classes
}
</script>
```

---

## 5. main.css 통합 스타일 정의

### 5.1 추가할 CSS 클래스

```css
/* ============================================
 * Task Detail Components 스타일 (TSK-08-05)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* TaskDetailPanel - Document Viewer Dialog */
.document-viewer-dialog {
  width: 80vw;
  max-width: 1200px;
}

/* TaskWorkflow - 워크플로우 노드 */
.workflow-node-completed {
  @apply bg-success text-white;
}

.workflow-node-current {
  @apply bg-primary text-white font-bold;
  transform: scale(1.1);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.workflow-node-pending {
  @apply bg-gray-200 text-gray-500 border-2 border-dashed border-gray-400;
}

/* TaskHistory - 이력 마커 */
.history-marker-transition {
  @apply bg-primary;
}

.history-marker-action {
  @apply bg-level-project;  /* purple-500 */
}

.history-marker-update {
  @apply bg-success;
}

.history-marker-default {
  @apply bg-gray-500;
}

/* TaskDocuments - 문서 카드 */
.doc-card-exists {
  @apply bg-blue-100 border border-primary;
}

.doc-card-exists:hover {
  @apply shadow-md;
}

.doc-card-expected {
  @apply bg-gray-50 border-2 border-dashed border-gray-400 opacity-60 cursor-not-allowed;
}
```

### 5.2 CSS 변수 매핑

| 용도 | CSS 변수 | HEX 값 | Tailwind 클래스 |
|------|----------|--------|-----------------|
| Primary (Workflow Current) | `--color-primary` | `#3b82f6` | `bg-primary` |
| Success (Workflow Completed) | `--color-success` | `#22c55e` | `bg-success` |
| Purple (History Action) | `--color-level-project` | `#8b5cf6` | `bg-level-project` |
| Gray (Workflow Pending) | - | `#e5e7eb` | `bg-gray-200` |
| Blue (Document Exists) | - | `#dbeafe` | `bg-blue-100` |

---

## 6. 테스트 전략

### 6.1 회귀 테스트 (Regression)

| 컴포넌트 | 테스트 항목 | 검증 방법 |
|----------|-----------|----------|
| TaskDetailPanel | Dialog width 시각적 일치 | 브라우저 개발자 도구 확인 |
| TaskWorkflow | 워크플로우 노드 색상 일치 | 스크린샷 비교 (Before/After) |
| TaskHistory | 이력 마커 색상 일치 | E2E: data-testid="history-marker-*" |
| TaskDocuments | 문서 카드 스타일 일치 | E2E: data-testid="document-exists-*" |

### 6.2 E2E 테스트 유지

**data-testid 속성 유지**:

```vue
<!-- TaskWorkflow -->
<div :data-testid="index === currentStepIndex ? 'workflow-node-current' : `workflow-node-${index}`">

<!-- TaskHistory -->
<div :data-testid="`history-entry-${slotProps.index}`">

<!-- TaskDocuments -->
<Card :data-testid="doc.exists ? `document-exists-${getDocumentBaseName(doc.name)}` : `document-expected-${getDocumentBaseName(doc.name)}`">
```

### 6.3 색상 일관성 검증

| CSS 클래스 | 예상 색상 | 검증 방법 |
|-----------|----------|----------|
| `.workflow-node-completed` | `#22c55e` (green-500) | 개발자 도구 Computed Style |
| `.workflow-node-current` | `#3b82f6` (blue-500) | 개발자 도구 Computed Style |
| `.workflow-node-pending` | `#e5e7eb` (gray-200) | 개발자 도구 Computed Style |
| `.history-marker-transition` | `#3b82f6` | 개발자 도구 Computed Style |
| `.history-marker-action` | `#8b5cf6` (purple-500) | 개발자 도구 Computed Style |
| `.doc-card-exists` | `#dbeafe` (blue-100) | 개발자 도구 Computed Style |

---

## 7. 제약사항 및 가정

### 7.1 기술적 제약

| 제약사항 | 설명 | 대응 방안 |
|---------|------|----------|
| 동적 계산 필수 스타일 | max-height: calc() | 예외 허용 (CLAUDE.md 규칙) |
| CSS 변수 스코프 | Tailwind 클래스 우선순위 | tailwind.config.ts에서 CSS 변수 참조 확인 |
| 기존 E2E 테스트 | data-testid 의존성 | 속성 유지 필수 |

### 7.2 가정

- main.css의 CSS 변수 (`--color-primary`, `--color-success` 등)는 이미 정의되어 있음
- tailwind.config.ts에서 CSS 변수를 참조하는 구조 유지
- themeConfig.ts는 TaskWorkflow, TaskHistory에서만 사용 중

### 7.3 예외 처리

**인라인 스타일 예외 허용 케이스**:
1. TaskDetailPanel: `max-height: calc(100vh - 200px)` - 동적 계산 필수
2. (다른 동적 계산 스타일은 발견되지 않음)

---

## 8. 우선순위 및 일정

### 8.1 마이그레이션 순서

| 순서 | 작업 | 소요 시간 (예상) | 이유 |
|------|------|----------------|------|
| 1 | main.css 클래스 정의 | 30분 | 모든 컴포넌트가 의존 |
| 2 | TaskWorkflow 마이그레이션 | 1시간 | WORKFLOW_THEME 제거 |
| 3 | TaskHistory 마이그레이션 | 1시간 | HISTORY_THEME 제거 |
| 4 | TaskDocuments 마이그레이션 | 1시간 | getDocumentCardStyle 제거 |
| 5 | TaskDetailPanel 마이그레이션 | 30분 | Dialog width만 변경 |
| 6 | themeConfig.ts 삭제 | 15분 | 의존성 확인 후 삭제 |
| 7 | 회귀 테스트 | 1시간 | 색상 일치 검증 |

**총 예상 소요 시간**: 5.25시간

### 8.2 단계별 산출물

| 단계 | 산출물 | 검증 방법 |
|------|--------|----------|
| 상세설계 | `020-detail-design.md` | 설계리뷰 |
| 구현 | 수정된 컴포넌트 + main.css + themeConfig.ts 삭제 | 로컬 테스트 |
| 테스트 | 회귀 테스트 통과 | E2E 실행 |
| 완료 | `080-manual.md` | 사용자 매뉴얼 작성 |

---

## 9. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| 색상 시각적 불일치 | 중간 | 중간 | Before/After 스크린샷 비교 |
| E2E 테스트 실패 | 낮음 | 높음 | data-testid 유지 확인 |
| CSS 변수 참조 오류 | 낮음 | 중간 | tailwind.config.ts 검증 |
| themeConfig.ts 다른 의존성 | 낮음 | 높음 | 전체 프로젝트 grep 검색 |
| 동적 계산 스타일 누락 | 중간 | 중간 | 철저한 코드 리뷰 |

---

## 10. 수용 기준 (Acceptance Criteria)

### 10.1 기능 요구사항

| AC ID | 수용 기준 | 검증 방법 |
|-------|----------|----------|
| AC-01 | TaskWorkflow: WORKFLOW_THEME import 전무 | Grep 검색 결과 0건 |
| AC-02 | TaskHistory: HISTORY_THEME import 전무 | Grep 검색 결과 0건 |
| AC-03 | TaskDocuments: getDocumentCardStyle 제거 | 함수 존재 여부 확인 |
| AC-04 | TaskDetailPanel: Dialog width CSS 클래스화 | :style 검색 결과 1건 (max-height만) |
| AC-05 | main.css에 .workflow-*, .history-marker-*, .doc-card-* 클래스 존재 | 파일 확인 |
| AC-06 | themeConfig.ts 파일 삭제 | 파일 존재 여부 확인 |
| AC-07 | 기존 기능 100% 유지 | E2E 테스트 통과 |
| AC-08 | 색상 시각적 일치 | 스크린샷 비교 |

### 10.2 품질 기준

| QC ID | 품질 기준 | 검증 방법 |
|-------|----------|----------|
| QC-01 | CSS 클래스 중앙화 원칙 준수 | 코드 리뷰 |
| QC-02 | PRD 10.1 테마 일관성 | 색상 매핑 검증 |
| QC-03 | 기존 E2E 테스트 통과 | Playwright 실행 |
| QC-04 | 렌더링 성능 영향 < 5% | Chrome DevTools Performance |
| QC-05 | themeConfig.ts 의존성 전무 | 전체 프로젝트 grep 검색 |

---

## 11. 다음 단계

- **상세설계**: `/wf:draft` 명령어로 `020-detail-design.md` 작성
- **설계리뷰**: `/wf:review` 명령어로 LLM 검토
- **구현**: `/wf:build` 명령어로 마이그레이션 실행

---

## 12. 참고 자료

### 내부 문서
- TSK-08-01 상세설계: `.jjiban/projects/jjiban/tasks/TSK-08-01/020-detail-design.md` (NodeIcon 패턴 참조)
- TSK-08-02 상세설계: `.jjiban/projects/jjiban/tasks/TSK-08-02/020-detail-design.md` (CategoryTag, ProgressBar 패턴 참조)
- PRD 섹션 6.3: Task Detail Panel
- PRD 섹션 10.1: UI 디자인 시스템
- TRD 섹션 2.3.6: CSS 클래스 중앙화 원칙

### PrimeVue 공식 문서
- Dialog Component: https://primevue.org/dialog/
- Timeline Component: https://primevue.org/timeline/
- Card Component: https://primevue.org/card/

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
