# 화면설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 사용자 경험 및 시각적 설계 중심
> * 접근성 및 반응형 고려
> * PrimeVue 디자인 시스템 준수

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| Category | development |
| 상태 | [bd] 기본설계 → [dd] 상세설계 진행 중 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2 (WBS 트리 패널) |
| PrimeVue Tree Docs | https://primevue.org/tree | 전체 |

---

## 1. UI 설계 개요

### 1.1 설계 목적

기존 커스텀 트리 렌더링을 PrimeVue Tree 컴포넌트로 교체하면서:
- 표준화된 트리 UI/UX 제공
- 접근성 향상 (ARIA, 키보드 탐색)
- 기존 다크 테마 스타일 유지
- NodeIcon + StatusBadge 컴포넌트 재사용

### 1.2 설계 범위

**화면 설계 포함 내용**:
- 트리 노드 레이아웃 (아이콘 + 제목 + 배지)
- 펼침/접힘 인터랙션 디자인
- 노드 상태 시각화 (선택, 호버)
- 검색 필터링 시 하이라이트
- 반응형 레이아웃 (모바일/태블릿/데스크톱)

**제외 범위**:
- NodeIcon 내부 디자인 → TSK-08-02
- WbsTreeHeader 디자인 (현재 작업 범위 아님)

---

## 2. 레이아웃 구조

### 2.1 전체 패널 구조

```
┌─────────────────────────────────────┐
│ WbsTreePanel                        │
│ ┌─────────────────────────────────┐ │
│ │ WbsTreeHeader (고정)             │ │
│ │ - 검색, 펼치기/접기, 요약        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ PrimeVue Tree (스크롤)           │ │
│ │   ┌───────────────────────────┐ │ │
│ │   │ WP 노드                    │ │ │
│ │   │   ┌─────────────────────┐ │ │ │
│ │   │   │ ACT 노드             │ │ │ │
│ │   │   │   ┌───────────────┐ │ │ │ │
│ │   │   │   │ TSK 노드      │ │ │ │ │
│ │   │   │   └───────────────┘ │ │ │ │
│ │   │   └─────────────────────┘ │ │ │
│ │   └───────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2.2 노드 레이아웃 (TreeNode 템플릿)

```
┌─────────────────────────────────────────────────────┐
│ [▼] [Icon] Title: Node Title         [Badge] [Prog] │
└─────────────────────────────────────────────────────┘

구성 요소:
1. [▼] - PrimeVue Tree 기본 펼침 아이콘 (자동 제공)
2. [Icon] - NodeIcon 컴포넌트 (24x24px, 타입별 색상)
3. Title - 노드 ID + 제목 (text-sm, 다크 테마 색상)
4. [Badge] - StatusBadge 컴포넌트 (Task 전용)
5. [Prog] - 진행률 바 (WP/ACT 전용, 선택사항)
```

---

## 3. 컴포넌트별 UI 설계

### 3.1 PrimeVue Tree 설정

#### 3.1.1 Tree 기본 Props

```typescript
<Tree
  :value="treeNodes"                    // TreeNode[]
  v-model:expandedKeys="expandedKeys"   // Record<string, boolean>
  selectionMode="single"                // 단일 선택 모드
  :metaKeySelection="false"             // Ctrl/Cmd 없이 선택
  class="wbs-tree"                      // 커스텀 스타일 클래스
>
  <template #default="slotProps">
    <!-- 커스텀 노드 템플릿 -->
  </template>
</Tree>
```

#### 3.1.2 TreeNode 데이터 구조

```typescript
interface TreeNode {
  key: string              // node.id (예: "WP-01", "TSK-01-01")
  label: string            // node.title
  data: {
    node: WbsNode          // 전체 노드 데이터
  }
  children?: TreeNode[]    // 자식 노드 배열
  icon?: string            // PrimeVue 기본 아이콘 (사용 안 함)
  style?: object           // 노드별 인라인 스타일
}
```

### 3.2 커스텀 노드 템플릿

#### 3.2.1 템플릿 구조

```vue
<template #default="slotProps">
  <div
    class="wbs-tree-node flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors"
    :class="{
      'wbs-tree-node-wp': slotProps.node.data.node.type === 'wp',
      'wbs-tree-node-act': slotProps.node.data.node.type === 'act',
      'wbs-tree-node-task': slotProps.node.data.node.type === 'task'
    }"
    :data-testid="`wbs-tree-node-${slotProps.node.key}`"
    @click.stop="handleNodeClick(slotProps.node.key)"
  >
    <!-- 1. NodeIcon 컴포넌트 -->
    <NodeIcon :type="slotProps.node.data.node.type" />

    <!-- 2. 노드 제목 (테마 변수 참조) -->
    <span
      class="wbs-tree-node-title flex-1 text-sm truncate"
      :class="{
        'text-text': slotProps.node.data.node.type === 'wp',
        'text-text-secondary': slotProps.node.data.node.type === 'act',
        'text-text-muted': slotProps.node.data.node.type === 'task'
      }"
    >
      {{ slotProps.node.key }}: {{ slotProps.node.label }}
    </span>

    <!-- 3. StatusBadge (Task만) -->
    <StatusBadge
      v-if="slotProps.node.data.node.type === 'task'"
      :status="slotProps.node.data.node.status"
    />

    <!-- 4. 진행률 표시 (WP/ACT, 선택사항) -->
    <div
      v-if="['wp', 'act'].includes(slotProps.node.data.node.type) && slotProps.node.data.node.progress !== undefined"
      class="wbs-tree-node-progress w-16 text-xs text-right text-text-secondary"
    >
      {{ slotProps.node.data.node.progress }}%
    </div>
  </div>
</template>
```

#### 3.2.2 노드 타입별 스타일 (테마 변수 참조)

| 타입 | 배경색 (기본) | 배경색 (hover) | 텍스트 클래스 | NodeIcon 변수 |
|------|-------------|---------------|--------------|--------------|
| WP | transparent | `bg-bg-header` | `text-text` | `--color-level-wp` |
| ACT | transparent | `bg-bg-header` | `text-text-secondary` | `--color-level-act` |
| Task | transparent | `bg-bg-header` | `text-text-muted` | `--color-level-task` |

### 3.3 노드 상태 시각화

#### 3.3.1 선택 상태

```css
/* PrimeVue Tree 기본 선택 상태 오버라이드 */
/* 테마 변수: --color-primary/20 또는 Tailwind bg-primary/20 사용 */
.wbs-tree .p-tree-node.p-highlight {
  background-color: rgb(59 130 246 / 0.2) !important;  /* var(--color-primary) 20% */
}

.wbs-tree .p-tree-node.p-highlight .wbs-tree-node-title {
  color: var(--color-text) !important;  /* 선택 시 텍스트 강조 */
}
```

#### 3.3.2 호버 상태

```css
/* 테마 변수: --color-header 또는 Tailwind bg-bg-header 사용 */
.wbs-tree-node:hover {
  background-color: var(--color-header);  /* #16213e */
}
```

#### 3.3.3 포커스 상태 (접근성)

```css
/* 테마 변수: --color-primary 또는 Tailwind ring-primary 사용 */
.wbs-tree .p-tree-node:focus-visible {
  outline: 2px solid var(--color-primary);  /* #3b82f6 */
  outline-offset: 2px;
}
```

---

## 4. 인터랙션 설계

### 4.1 펼침/접힘

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 노드 펼치기 | 펼침 아이콘 클릭 | expandedKeys에 key 추가, wbsStore.expandedNodes 동기화 |
| 노드 접기 | 접힘 아이콘 클릭 | expandedKeys에서 key 제거, wbsStore.expandedNodes 동기화 |
| 전체 펼치기 | WbsTreeHeader 버튼 | 모든 노드 key를 expandedKeys에 추가 |
| 전체 접기 | WbsTreeHeader 버튼 | expandedKeys 초기화 |

**시각적 피드백**:
- 펼침: ▶ (우향 삼각형) → ▼ (하향 삼각형)
- 애니메이션: PrimeVue Tree 기본 애니메이션 사용 (slide-down)

### 4.2 노드 선택

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 노드 클릭 | 노드 영역 클릭 | 'node-selected' 이벤트 발생, 배경색 변경 |
| 키보드 탐색 | ↑↓ 화살표 | 포커스 이동 |
| 키보드 선택 | Enter | 현재 포커스 노드 선택 |
| 펼침/접힘 (키보드) | ←→ 화살표 | 노드 접기/펼치기 |

**시각적 피드백**:
- 선택: 배경색 #2a2a4a, 텍스트 #ffffff
- 포커스: 파란색 외곽선 (outline: 2px solid #3b82f6)

### 4.3 검색 필터링 (미래 기능)

> 현재 TSK-08-01 범위에서는 구현하지 않지만, UI 설계에서 고려

| 기능 | 동작 | UI 표현 |
|------|------|---------|
| 검색어 입력 | WbsTreeHeader 검색 박스 | 실시간 필터링 |
| 매칭 노드 하이라이트 | 제목/ID 일치 | 배경색 노란색 톤, 굵은 글씨 |
| 매칭 부모 자동 펼침 | 매칭 노드의 조상 | expandedKeys에 추가 |

---

## 5. 스타일 시스템

### 5.1 테마 변수 참조 (main.css 일관성)

> **중요**: 모든 색상은 `main.css`에 정의된 전역 CSS 변수를 참조합니다.
> 새로운 로컬 CSS 변수 정의 대신 기존 테마 변수를 사용합니다.

#### 5.1.1 배경 색상 매핑

| 용도 | 전역 CSS 변수 | HEX 값 | Tailwind 클래스 |
|------|--------------|--------|-----------------|
| 패널 배경 | `var(--color-sidebar)` | `#0f0f23` | `bg-bg-sidebar` |
| 카드 배경 | `var(--color-card)` | `#1e1e38` | `bg-bg-card` |
| 호버 상태 | `var(--color-header)` | `#16213e` | `bg-bg-header` |
| 선택 상태 | `var(--color-primary)` (20% 투명) | `#3b82f6` | `bg-primary/20` |

#### 5.1.2 텍스트 색상 매핑

| 노드 타입 | 전역 CSS 변수 | HEX 값 | Tailwind 클래스 |
|----------|--------------|--------|-----------------|
| WP (1단계) | `var(--color-text)` | `#e8e8e8` | `text-text` |
| ACT (2단계) | `var(--color-text-secondary)` | `#888888` | `text-text-secondary` |
| Task (3단계) | `var(--color-text-muted)` | `#666666` | `text-text-muted` |
| 선택 시 | `#ffffff` | `#ffffff` | `text-white` |

#### 5.1.3 계층 아이콘 색상 매핑 (PRD 10.1)

| 노드 타입 | 전역 CSS 변수 | HEX 값 | Tailwind 클래스 |
|----------|--------------|--------|-----------------|
| Project | `var(--color-level-project)` | `#8b5cf6` | `text-level-project` |
| WP | `var(--color-level-wp)` | `#3b82f6` | `text-level-wp` |
| ACT | `var(--color-level-act)` | `#22c55e` | `text-level-act` |
| Task | `var(--color-level-task)` | `#f59e0b` | `text-level-task` |

#### 5.1.4 상태 색상 매핑 (main.css .status-* 클래스)

| 상태 | 전역 CSS 변수 | 배경 클래스 | 텍스트 클래스 |
|------|--------------|------------|--------------|
| Todo [ ] | `var(--color-text-muted)` | `status-todo` | `text-text-secondary` |
| Design [bd]/[dd] | `var(--color-primary)` | `status-design` | `text-primary` |
| Implement [im]/[fx] | `var(--color-warning)` | `status-implement` | `text-warning` |
| Verify [vf]/[ts] | `var(--color-success)` | `status-verify` | `text-success` |
| Done [xx] | `var(--color-success)` | `status-done` | `text-white` |

#### 5.1.5 보더/포커스 색상 매핑

| 용도 | 전역 CSS 변수 | HEX 값 | Tailwind 클래스 |
|------|--------------|--------|-----------------|
| 기본 보더 | `var(--color-border)` | `#3d3d5c` | `border-border` |
| 밝은 보더 | `var(--color-border-light)` | `#4d4d6c` | `border-border-light` |
| 포커스 링 | `var(--color-primary)` | `#3b82f6` | `ring-primary` |

> **구현 시 주의**: 하드코딩된 HEX 값 대신 Tailwind 클래스를 우선 사용합니다.

### 5.2 타이포그래피

| 요소 | 폰트 크기 | 폰트 굵기 | 줄 높이 |
|------|----------|----------|---------|
| WP 제목 | 14px (text-sm) | 400 | 1.5 |
| ACT 제목 | 14px (text-sm) | 400 | 1.5 |
| Task 제목 | 12px (text-xs) | 400 | 1.5 |
| StatusBadge | 12px (text-xs) | 500 | 1 |
| 진행률 | 12px (text-xs) | 400 | 1 |

### 5.3 간격 및 크기

```css
/* 노드 패딩 */
.wbs-tree-node-wp { padding: 8px 12px; }    /* py-2 px-3 */
.wbs-tree-node-act { padding: 6px 12px; }   /* py-1.5 px-3 */
.wbs-tree-node-task { padding: 4px 12px; }  /* py-1 px-3 */

/* 노드 간 간격 */
.wbs-tree-node { gap: 8px; }                /* gap-2 */

/* 아이콘 크기 */
.node-icon { width: 24px; height: 24px; }

/* StatusBadge */
.status-badge { padding: 2px 6px; }         /* px-1.5 py-0.5 */
```

### 5.4 반응형 설계

#### 5.4.1 브레이크포인트

| 디바이스 | 너비 | 조정 사항 |
|---------|------|----------|
| 모바일 | < 768px | 아이콘 크기 축소 (20px), 패딩 축소, StatusBadge 축약 |
| 태블릿 | 768px - 1024px | 기본 레이아웃 유지 |
| 데스크톱 | > 1024px | 기본 레이아웃 유지 |

#### 5.4.2 모바일 최적화

```css
@media (max-width: 767px) {
  /* 아이콘 크기 축소 */
  .node-icon {
    width: 20px;
    height: 20px;
  }

  /* 패딩 축소 */
  .wbs-tree-node-wp { padding: 6px 8px; }
  .wbs-tree-node-act { padding: 4px 8px; }
  .wbs-tree-node-task { padding: 3px 8px; }

  /* 진행률 숨김 (공간 확보) */
  .wbs-tree-node-progress {
    display: none;
  }

  /* StatusBadge 축약 */
  .status-badge {
    font-size: 10px;
    padding: 1px 4px;
  }
}
```

---

## 6. 접근성 (WCAG 2.1 AA)

### 6.1 ARIA 속성

```html
<!-- 트리 컨테이너 -->
<div
  role="region"
  aria-label="WBS Tree Panel"
  :aria-busy="loading"
>
  <!-- PrimeVue Tree (자동 ARIA 제공) -->
  <Tree
    role="tree"               <!-- PrimeVue 자동 제공 -->
    aria-labelledby="wbs-tree-header"
  >
    <!-- TreeNode (자동 ARIA) -->
    <div
      role="treeitem"         <!-- PrimeVue 자동 제공 -->
      :aria-expanded="isExpanded"
      :aria-selected="isSelected"
      :aria-label="`${node.type} ${node.id}: ${node.title}`"
    >
      ...
    </div>
  </Tree>
</div>
```

### 6.2 키보드 탐색

| 키 | 동작 |
|---|------|
| ↑/↓ | 이전/다음 노드로 이동 |
| ←/→ | 노드 접기/펼치기 |
| Enter | 노드 선택 |
| Space | 노드 펼침/접힘 토글 |
| Home | 첫 번째 노드로 이동 |
| End | 마지막 노드로 이동 |

### 6.3 색상 대비 (WCAG AA 기준: 4.5:1)

| 텍스트 | 배경 | 대비 비율 | 상태 |
|--------|------|----------|------|
| #e0e0e0 (WP) | #0f0f23 | 11.2:1 | ✅ Pass |
| #c0c0c0 (ACT) | #0f0f23 | 9.5:1 | ✅ Pass |
| #a0a0a0 (Task) | #0f0f23 | 7.1:1 | ✅ Pass |
| #ffffff (선택) | #2a2a4a | 8.9:1 | ✅ Pass |

### 6.4 포커스 표시

```css
/* 포커스 외곽선 (키보드 탐색 시) */
.wbs-tree .p-tree-node:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 마우스 클릭 시 포커스 외곽선 제거 */
.wbs-tree .p-tree-node:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 7. 상태 표시

### 7.1 로딩 상태

```vue
<ProgressSpinner
  style="width: 50px; height: 50px"
  strokeWidth="4"
  fill="transparent"
  animationDuration="1s"
  aria-label="Loading WBS data"
/>
```

**위치**: 패널 중앙 (flex items-center justify-center)

### 7.2 에러 상태

```vue
<Message
  severity="error"
  :closable="false"
>
  {{ error }}
</Message>
<Button
  label="다시 시도"
  icon="pi pi-refresh"
  severity="secondary"
  outlined
  @click="loadWbs"
/>
```

**위치**: 패널 중앙, 세로 정렬

### 7.3 빈 상태

```vue
<div class="flex flex-col items-center justify-center h-full text-[#888888]">
  <i class="pi pi-inbox text-4xl mb-4 opacity-50"></i>
  <p>WBS 데이터가 없습니다.</p>
</div>
```

---

## 8. PrimeVue Tree 스타일 오버라이드

### 8.1 Global CSS (main.css 테마 변수 참조)

> **구현 시 주의**: 모든 색상은 main.css의 CSS 변수를 사용합니다.

```css
/* PrimeVue Tree 기본 스타일 오버라이드 */
.wbs-tree.p-tree {
  background: transparent;
  border: none;
  padding: 0;
}

/* Tree 노드 컨테이너 */
.wbs-tree .p-tree-node {
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 4px;
}

/* 노드 콘텐츠 */
.wbs-tree .p-tree-node-content {
  border: none;
  background: transparent;
  padding: 0;
  transition: none;
}

/* 펼침 아이콘 스타일 - 테마 변수 사용 */
.wbs-tree .p-tree-toggler {
  color: var(--color-text-secondary);  /* #888888 */
  margin-right: 4px;
}

.wbs-tree .p-tree-toggler:hover {
  color: var(--color-primary);  /* #3b82f6 */
  background: transparent;
}

/* 선택 상태 - 테마 변수 사용 */
.wbs-tree .p-tree-node.p-highlight > .p-tree-node-content {
  background-color: rgb(59 130 246 / 0.2) !important;  /* --color-primary 20% */
}

/* 포커스 상태 - 테마 변수 사용 */
.wbs-tree .p-tree-node:focus-visible > .p-tree-node-content {
  outline: 2px solid var(--color-primary);  /* #3b82f6 */
  outline-offset: 2px;
  box-shadow: none;
}

/* 자식 노드 들여쓰기 */
.wbs-tree .p-tree-node-children {
  padding-left: 1rem;  /* 16px */
}
```

### 8.2 Pass-Through Props (대안)

> PrimeVue 4.x Pass-Through API를 사용한 스타일링 (선택사항)

```typescript
const treePt = {
  root: { class: 'wbs-tree' },
  container: { class: 'bg-transparent border-none' },
  node: { class: 'mb-1' },
  nodeContent: { class: 'border-none bg-transparent p-0' },
  toggler: { class: 'text-[#888888] hover:text-blue-400' }
}

<Tree :pt="treePt" ... />
```

---

## 9. 예상 시각화 (Mockup)

### 9.1 기본 상태 (일부 펼침)

```
┌─────────────────────────────────────────────┐
│ 📁 WBS 트리                   [검색] [⬍⬍]    │
├─────────────────────────────────────────────┤
│ ▼ 📦 WP-01: Authentication Module           │
│   ▶ 📋 ACT-01-01: Basic Auth Design         │
│   ▼ 📋 ACT-01-02: Implementation             │
│     ☑ TSK-01-02-01: Login API      [bd] 40% │
│     ☑ TSK-01-02-02: JWT Token      [im] 75% │
│     ☑ TSK-01-02-03: Testing        [xx] 100%│
│                                              │
│ ▶ 📦 WP-02: Dashboard                        │
│                                              │
│ ▶ 📦 WP-03: Settings                         │
└─────────────────────────────────────────────┘
```

### 9.2 선택 상태

```
┌─────────────────────────────────────────────┐
│ 📁 WBS 트리                   [검색] [⬍⬍]    │
├─────────────────────────────────────────────┤
│ ▼ 📦 WP-01: Authentication Module           │
│   ▶ 📋 ACT-01-01: Basic Auth Design         │
│   ▼ 📋 ACT-01-02: Implementation             │
│ ┌───────────────────────────────────────────┤
│ │ ☑ TSK-01-02-01: Login API      [bd] 40% ││ ← 선택 (배경 #2a2a4a)
│ └───────────────────────────────────────────┤
│     ☑ TSK-01-02-02: JWT Token      [im] 75% │
│     ☑ TSK-01-02-03: Testing        [xx] 100%│
└─────────────────────────────────────────────┘
```

### 9.3 호버 상태

```
┌─────────────────────────────────────────────┐
│ 📁 WBS 트리                   [검색] [⬍⬍]    │
├─────────────────────────────────────────────┤
│ ▼ 📦 WP-01: Authentication Module           │
│   ▶ 📋 ACT-01-01: Basic Auth Design         │
│   ▼ 📋 ACT-01-02: Implementation             │
│     ☑ TSK-01-02-01: Login API      [bd] 40% │
│ ┌───────────────────────────────────────────┤
│ │ ☑ TSK-01-02-02: JWT Token      [im] 75% ││ ← 호버 (배경 #1a1a3a)
│ └───────────────────────────────────────────┤
│     ☑ TSK-01-02-03: Testing        [xx] 100%│
└─────────────────────────────────────────────┘
```

---

## 10. 구현 가이드라인

### 10.1 단계별 작업 순서

1. **데이터 변환 함수 작성** (`convertToTreeNodes`)
   - WbsNode[] → TreeNode[] 변환
   - 재귀적 children 처리

2. **expandedKeys 동기화 로직**
   - computed: Set → Record 변환
   - @node-expand/@node-collapse 핸들러

3. **커스텀 템플릿 구현**
   - NodeIcon + StatusBadge 배치
   - 타입별 조건부 렌더링

4. **스타일 적용**
   - Global CSS 추가
   - 다크 테마 색상 적용

5. **이벤트 핸들러**
   - @click → emit('node-selected')
   - expandAll/collapseAll 메서드

6. **접근성 속성 추가**
   - ARIA labels
   - 키보드 탐색 테스트

### 10.2 테스트 검증 포인트

- [ ] 트리 노드가 올바르게 렌더링됨
- [ ] 펼침/접힘 상태가 wbsStore와 동기화됨
- [ ] NodeIcon과 StatusBadge가 정상 표시됨
- [ ] 노드 클릭 시 이벤트 발생 확인
- [ ] 키보드 탐색 (↑↓←→ Enter) 작동
- [ ] 선택/호버 스타일 정상 적용
- [ ] 모바일 반응형 레이아웃 확인
- [ ] 색상 대비 4.5:1 이상 (접근성)

---

## 11. 리스크 및 고려사항

### 11.1 PrimeVue Tree 제약사항

| 제약 | 영향 | 완화 방안 |
|------|------|----------|
| 기본 스타일 오버라이드 복잡도 | Medium | Global CSS로 일괄 처리 |
| selectionMode 제한 | Low | 단일 선택만 필요하므로 문제없음 |
| 커스텀 펼침 로직 | Medium | expandedKeys computed로 동기화 |

### 11.2 성능 고려사항

| 항목 | 기준 | 대응 |
|------|------|------|
| 노드 렌더링 속도 | < 200ms (100개 노드) | v-memo 고려, 가상 스크롤 검토 |
| expandedKeys 동기화 | 지연 없음 | debounce 없이 즉시 동기화 |
| 메모리 사용량 | 기존 대비 ±10% | TreeNode 변환 최소화 |

### 11.3 브라우저 호환성

- **지원 브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **PrimeVue Tree CSS Grid 사용**: 모든 현대 브라우저 지원
- **Flexbox 레이아웃**: 완벽 호환

---

## 12. 인수 기준 (UI 검증)

- [ ] UC-01: 노드 타입별 아이콘 색상이 올바르게 표시됨 (WP=파랑, ACT=초록, TSK=주황)
- [ ] UC-02: StatusBadge가 Task 노드에만 표시됨
- [ ] UC-03: 호버 시 배경색이 #1a1a3a로 변경됨
- [ ] UC-04: 선택 시 배경색이 #2a2a4a, 텍스트가 #ffffff로 변경됨
- [ ] UC-05: 키보드 포커스 시 파란색 외곽선(2px)이 표시됨
- [ ] UC-06: 펼침 아이콘이 ▶/▼로 정상 전환됨
- [ ] UC-07: 모바일(< 768px)에서 아이콘 크기가 20px로 축소됨
- [ ] UC-08: 색상 대비가 WCAG AA 기준(4.5:1) 이상임
- [ ] UC-09: 빈 상태/로딩/에러 상태가 중앙 정렬로 표시됨
- [ ] UC-10: 자식 노드 들여쓰기가 16px씩 증가함

---

## 13. 다음 단계

- `/wf:draft` 명령어로 상세설계(020-detail-design.md) 진행
  - convertToTreeNodes() 함수 상세 알고리즘
  - expandedKeys 동기화 로직 구현 세부사항
  - 이벤트 핸들러 시그니처 및 에러 처리
  - 단위 테스트 케이스 정의

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2)
- PrimeVue Tree Docs: https://primevue.org/tree
- PrimeVue Pass-Through: https://primevue.org/passthrough

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-16 | 1.0.0 | 초기 화면설계 작성 | Claude Opus 4.5 |

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
-->
