# UI 설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 시각적 일관성 및 접근성 중심
> * PrimeVue 4.x 및 TailwindCSS 표준 준수
> * Dark Blue 테마 적용
> * 반응형 및 인터랙티브 상태 정의

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-02 |
| Task명 | Tree Node |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Frontend Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2.2, 10.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-02 |

---

## 1. 디자인 시스템 개요

### 1.1 테마 기반

**Dark Blue Theme** 적용:
- Primary: Indigo/Blue 계열
- Background: Dark gray tones
- Text: High contrast white/gray
- Accent: Status/Category specific colors

### 1.2 컴포넌트 계층

```
WbsTreeNode (Container)
├── Expand/Collapse Button (PrimeVue Button)
├── NodeIcon (Custom Badge)
├── Node Content Area
│   ├── Title Text
│   ├── Meta Row
│   │   ├── StatusBadge (PrimeVue Tag)
│   │   └── CategoryTag (PrimeVue Tag)
│   └── ProgressBar (PrimeVue ProgressBar)
└── Children (Recursive WbsTreeNode[])
```

---

## 2. WbsTreeNode Layout Design

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│ [Indent] [Expand] [Icon] Title                    [Meta]   │
│                                                    [Status] │
│                                                    [Category]│
│          ▓▓▓▓▓▓▓░░░░░░░░░░ 45%                              │
│                                                              │
│   ├─ [Child Node 1]                                         │
│   └─ [Child Node 2]                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 레이아웃 스펙

| 요소 | 크기/간격 | 설명 |
|------|----------|------|
| 전체 높이 | `auto` (min 48px) | 컨텐츠에 따라 가변 |
| 들여쓰기 | `depth × 20px` | 최대 80px (depth 4) |
| 수평 패딩 | `12px` | 좌우 여백 |
| 수직 패딩 | `8px` | 상하 여백 |
| 아이콘 간격 | `8px` | 각 아이콘 사이 |
| 행 간격 | `4px` | Title과 Meta 사이 |

### 2.3 Flexbox 구조

```css
.wbs-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.node-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
```

---

## 3. 계층별 NodeIcon 설계

### 3.1 아이콘 배지 스펙

**공통 스타일**:
- 형태: 라운드 사각형 (`border-radius: 4px`)
- 크기: `24px × 24px`
- 패딩: `4px`
- 아이콘 색상: `#ffffff` (white)
- Shadow: `0 1px 2px rgba(0, 0, 0, 0.1)`

### 3.2 계층별 디자인

| 계층 | 타입 | 아이콘 | 배경색 | HEX | Tailwind |
|------|------|--------|--------|-----|----------|
| L1 | Project | `pi-folder` | Indigo | `#6366f1` | `bg-indigo-500` |
| L2 | WP | `pi-briefcase` | Blue | `#3b82f6` | `bg-blue-500` |
| L3 | ACT | `pi-list` | Green | `#10b981` | `bg-emerald-500` |
| L4 | Task | `pi-check-square` | Amber | `#f59e0b` | `bg-amber-500` |

### 3.3 시각적 예시

```
┌─────┐
│  📁 │  Project (Indigo)
└─────┘

┌─────┐
│  💼 │  WP (Blue)
└─────┘

┌─────┐
│  📋 │  ACT (Green)
└─────┘

┌─────┐
│  ✓ │  Task (Amber)
└─────┘
```

### 3.4 CSS 구현

```css
.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.node-icon-project { background-color: #6366f1; }
.node-icon-wp { background-color: #3b82f6; }
.node-icon-act { background-color: #10b981; }
.node-icon-task { background-color: #f59e0b; }
```

---

## 4. StatusBadge 설계

### 4.1 상태별 색상 팔레트

| 상태 코드 | 레이블 | 색상 | HEX | PrimeVue Severity |
|-----------|--------|------|-----|-------------------|
| `[ ]` | Todo | Gray | `#6b7280` | `secondary` |
| `[bd]` | Design | Blue | `#3b82f6` | `info` |
| `[dd]` | Detail | Violet | `#8b5cf6` | `info` |
| `[an]` | Analyze | Violet | `#8b5cf6` | `info` |
| `[ds]` | Design | Violet | `#8b5cf6` | `info` |
| `[im]` | Implement | Amber | `#f59e0b` | `warning` |
| `[fx]` | Fix | Amber | `#f59e0b` | `warning` |
| `[vf]` | Verify | Green | `#22c55e` | `success` |
| `[xx]` | Done | Emerald | `#10b981` | `success` |

### 4.2 배지 스타일

**PrimeVue Tag 사용**:
```vue
<Tag
  value="Design"
  severity="info"
  rounded
  size="small"
/>
```

**커스터마이징**:
- 크기: `small` (높이 20px)
- 폰트: `12px`, `font-weight: 500`
- 패딩: `4px 8px`
- Border radius: `12px` (rounded)

### 4.3 시각적 예시

```
[  Todo  ]  ← Gray
[  Design  ]  ← Blue
[  Detail  ]  ← Violet
[ Implement ]  ← Amber
[  Verify  ]  ← Green
[  Done  ]  ← Emerald
```

---

## 5. CategoryTag 설계

### 5.1 카테고리별 디자인

| 카테고리 | 아이콘 | 색상 | HEX | 레이블 |
|----------|--------|------|-----|--------|
| development | `pi-code` | Blue | `#3b82f6` | Dev |
| defect | `pi-exclamation-triangle` | Red | `#ef4444` | Defect |
| infrastructure | `pi-cog` | Violet | `#8b5cf6` | Infra |

### 5.2 태그 스타일

**PrimeVue Tag with Icon**:
```vue
<Tag
  value="Dev"
  icon="pi pi-code"
  rounded
  size="small"
  :style="{ backgroundColor: '#3b82f6' }"
/>
```

**스타일 속성**:
- 크기: `small`
- 아이콘 크기: `12px`
- 아이콘-텍스트 간격: `4px`
- 패딩: `4px 8px`

### 5.3 시각적 예시

```
[</> Dev]  ← Blue
[⚠ Defect]  ← Red
[⚙ Infra]  ← Violet
```

---

## 6. ProgressBar 설계

### 6.1 색상 구간 정의

| 진행률 범위 | 색상 | HEX | 의미 |
|------------|------|-----|------|
| 0% - 30% | Red | `#ef4444` | 시작 단계 |
| 30% - 70% | Amber | `#f59e0b` | 진행 중 |
| 70% - 100% | Green | `#22c55e` | 거의 완료 |

### 6.2 프로그레스 바 스펙

**PrimeVue ProgressBar**:
```vue
<ProgressBar
  :value="45"
  :show-value="true"
  :pt="{
    value: { style: { backgroundColor: '#f59e0b' } }
  }"
/>
```

**스타일 속성**:
- 높이: `16px`
- Border radius: `8px`
- 배경색 (empty): `#374151` (gray-700)
- 텍스트 색상: `#ffffff`
- 텍스트 크기: `10px`
- 애니메이션: `transition: width 0.3s ease`

### 6.3 시각적 예시

```
0-30%:   ▓▓▓░░░░░░░░░░░░░ 15%   (Red)
30-70%:  ▓▓▓▓▓▓▓░░░░░░░░ 45%   (Amber)
70-100%: ▓▓▓▓▓▓▓▓▓▓▓▓▓░ 85%   (Green)
```

---

## 7. 인터랙티브 상태 설계

### 7.1 Hover 상태

**WbsTreeNode Hover**:
```css
.wbs-tree-node:hover {
  background-color: rgba(55, 65, 81, 0.3); /* gray-700 with opacity */
}
```

**아이콘 호버 효과**: 없음 (정적 표시)

### 7.2 선택 상태

**Selected Node**:
```css
.wbs-tree-node.selected {
  background-color: rgba(59, 130, 246, 0.15); /* blue-500 with low opacity */
  border-left: 3px solid #3b82f6; /* blue-500 accent border */
}
```

**시각적 강조**:
- 배경: 약한 파란색 틴트
- 왼쪽 테두리: 3px 파란색 강조선
- 아이콘: 변화 없음

### 7.3 펼침/접기 버튼

**PrimeVue Button**:
```vue
<Button
  :icon="isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
  text
  rounded
  size="small"
  severity="secondary"
/>
```

**스타일 속성**:
- 크기: `24px × 24px`
- 아이콘 색상: `#9ca3af` (gray-400)
- Hover: `#d1d5db` (gray-300)
- Transition: `transform 0.2s ease`
- 펼침 상태: 아이콘 회전 (chevron-right → chevron-down)

### 7.4 포커스 상태

**키보드 네비게이션**:
```css
.wbs-tree-node:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

**접근성**:
- `tabindex="0"` 적용
- ARIA 속성: `role="treeitem"`, `aria-expanded`, `aria-selected`

---

## 8. 들여쓰기 및 계층 시각화

### 8.1 들여쓰기 계산

| 계층 깊이 | Depth 값 | 들여쓰기 (px) | 시각적 표현 |
|----------|----------|--------------|------------|
| L1 (Project) | 0 | 0px | `Project` |
| L2 (WP) | 1 | 20px | `  WP-01` |
| L3 (ACT) | 2 | 40px | `    ACT-01-01` |
| L4 (Task) | 3 | 60px | `      TSK-01-01-01` |

### 8.2 시각적 계층 예시

```
┌───────────────────────────────────────┐
│ [📁] Project Alpha                    │  ← depth 0 (0px)
│   [💼] WP-01: Backend                 │  ← depth 1 (20px)
│     [📋] ACT-01-01: API Design        │  ← depth 2 (40px)
│       [✓] TSK-01-01-01: Auth Endpoint │  ← depth 3 (60px)
│       [✓] TSK-01-01-02: User CRUD     │  ← depth 3 (60px)
│     [📋] ACT-01-02: Database Schema   │  ← depth 2 (40px)
│   [💼] WP-02: Frontend                │  ← depth 1 (20px)
└───────────────────────────────────────┘
```

### 8.3 CSS 구현

```css
.wbs-tree-node {
  /* 동적 패딩 (Vue style binding) */
  padding-left: calc(var(--indent-width) + 12px);
}
```

```vue
<div
  class="wbs-tree-node"
  :style="{ '--indent-width': `${depth * 20}px` }"
>
```

---

## 9. 반응형 디자인

### 9.1 브레이크포인트

| 화면 크기 | 최소 너비 | 조정 사항 |
|----------|----------|----------|
| Mobile | 320px | - 메타 정보 줄바꿈<br>- 폰트 크기 축소 |
| Tablet | 768px | - 표준 레이아웃 |
| Desktop | 1024px | - 표준 레이아웃 |

### 9.2 Mobile 최적화

**작은 화면 (<768px)**:
```css
@media (max-width: 767px) {
  .node-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .node-icon {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .wbs-tree-node {
    font-size: 14px;
  }
}
```

---

## 10. 접근성 (Accessibility)

### 10.1 ARIA 속성

**WbsTreeNode**:
```vue
<div
  role="treeitem"
  :aria-expanded="hasChildren ? isExpanded : undefined"
  :aria-selected="isSelected"
  :aria-level="depth + 1"
  tabindex="0"
>
```

**StatusBadge/CategoryTag**:
```vue
<Tag
  :value="statusLabel"
  :aria-label="`Status: ${statusLabel}`"
/>
```

**ProgressBar**:
```vue
<ProgressBar
  :value="45"
  :aria-label="`Progress: ${45}%`"
  role="progressbar"
  :aria-valuenow="45"
  aria-valuemin="0"
  aria-valuemax="100"
/>
```

### 10.2 키보드 네비게이션

| 키 | 동작 |
|----|------|
| Arrow Up/Down | 노드 간 이동 |
| Arrow Right | 펼치기 |
| Arrow Left | 접기 |
| Enter/Space | 노드 선택 |
| Tab | 포커스 이동 |

### 10.3 색상 대비

**WCAG 2.1 AA 준수**:
- 텍스트-배경 대비비: 최소 4.5:1
- 아이콘-배경 대비비: 최소 3:1
- 상태 구분: 색상 외 레이블로도 구분 가능

---

## 11. 애니메이션 및 트랜지션

### 11.1 트랜지션 스펙

| 요소 | 속성 | Duration | Easing |
|------|------|----------|--------|
| Background hover | `background-color` | 200ms | ease |
| Selection state | `background-color`, `border` | 200ms | ease |
| Expand icon | `transform` | 200ms | ease |
| Progress bar | `width` | 300ms | ease |
| Children expand | `max-height`, `opacity` | 250ms | ease-in-out |

### 11.2 CSS 구현

```css
.wbs-tree-node {
  transition: background-color 0.2s ease;
}

.expand-button i {
  transition: transform 0.2s ease;
}

.expand-button.expanded i {
  transform: rotate(90deg);
}

.node-children {
  transition: max-height 0.25s ease-in-out, opacity 0.25s ease-in-out;
  overflow: hidden;
}

.node-children.collapsed {
  max-height: 0;
  opacity: 0;
}

.node-children.expanded {
  max-height: 10000px; /* 충분히 큰 값 */
  opacity: 1;
}
```

---

## 12. 다크 테마 색상 시스템

### 12.1 배경 색상

| 요소 | 색상 | HEX | Tailwind |
|------|------|-----|----------|
| 기본 배경 | Dark gray | `#1f2937` | `bg-gray-800` |
| Hover 배경 | Medium gray | `#374151` | `bg-gray-700` |
| 선택 배경 | Blue tint | `rgba(59,130,246,0.15)` | Custom |
| 패널 배경 | Darker gray | `#111827` | `bg-gray-900` |

### 12.2 텍스트 색상

| 요소 | 색상 | HEX | Tailwind |
|------|------|-----|----------|
| 제목 (Title) | White | `#ffffff` | `text-white` |
| 서브텍스트 | Light gray | `#d1d5db` | `text-gray-300` |
| Muted text | Medium gray | `#9ca3af` | `text-gray-400` |

### 12.3 테마 일관성

**PrimeVue Lara Dark Blue 테마**:
- 프로젝트 전체 테마와 일관성 유지
- Pass Through API로 커스터마이징
- CSS 변수 활용: `var(--surface-900)`, `var(--primary-500)` 등

---

## 13. 컴포넌트 조합 예시

### 13.1 완전한 트리 노드 예시

```vue
<div class="wbs-tree-node selected" style="padding-left: 60px;">
  <!-- Expand Button -->
  <Button
    icon="pi pi-chevron-down"
    text
    rounded
    size="small"
  />

  <!-- NodeIcon -->
  <div class="node-icon node-icon-task">
    <i class="pi pi-check-square"></i>
  </div>

  <!-- Content -->
  <div class="node-content">
    <div class="node-title">TSK-04-02: Tree Node</div>
    <div class="node-meta">
      <Tag value="Design" severity="info" rounded size="small" />
      <Tag value="Dev" icon="pi pi-code" rounded size="small" />
    </div>
    <ProgressBar :value="45" :show-value="true" />
  </div>
</div>
```

### 13.2 시각적 렌더링

```
┌─────────────────────────────────────────────────────┐
│       ▼  [✓]  TSK-04-02: Tree Node                  │ ← 선택됨 (파란 테두리)
│              [Design] [</> Dev]                     │
│              ▓▓▓▓▓▓▓░░░░░░░░░ 45%                   │
└─────────────────────────────────────────────────────┘
```

---

## 14. 구현 체크리스트

### 14.1 WbsTreeNode
- [ ] 재귀 렌더링 구조
- [ ] 동적 들여쓰기 (depth × 20px)
- [ ] 펼침/접기 버튼 (children 있을 때만)
- [ ] Hover/Selection 상태 스타일
- [ ] 키보드 네비게이션 지원
- [ ] ARIA 속성 적용

### 14.2 NodeIcon
- [ ] 계층별 아이콘 매핑
- [ ] 라운드 사각형 배지 스타일
- [ ] 색상 적용 (Indigo/Blue/Green/Amber)
- [ ] 24px × 24px 고정 크기

### 14.3 StatusBadge
- [ ] PrimeVue Tag 사용
- [ ] 상태 코드 → 레이블 변환
- [ ] Severity 매핑 (secondary/info/warning/success)
- [ ] 9개 상태 모두 지원

### 14.4 CategoryTag
- [ ] PrimeVue Tag with Icon
- [ ] 카테고리별 색상 적용
- [ ] 아이콘 + 레이블 조합
- [ ] 3개 카테고리 지원 (dev/defect/infra)

### 14.5 ProgressBar
- [ ] PrimeVue ProgressBar 사용
- [ ] Pass Through로 색상 커스터마이징
- [ ] 구간별 색상 (Red/Amber/Green)
- [ ] 퍼센트 텍스트 표시

### 14.6 반응형 및 접근성
- [ ] 모바일 레이아웃 최적화
- [ ] WCAG 2.1 AA 대비비 준수
- [ ] 키보드 네비게이션 완전 지원
- [ ] Screen reader 호환성

---

## 15. 디자인 토큰 정의

### 15.1 Spacing Tokens

```typescript
export const SPACING = {
  nodeIndent: 20,        // px per depth level
  nodePadding: 12,       // horizontal padding
  nodeGap: 8,            // gap between elements
  metaGap: 6,            // gap in meta row
  iconSize: 24,          // icon badge size
} as const
```

### 15.2 Color Tokens

```typescript
export const COLORS = {
  hierarchy: {
    project: '#6366f1',    // indigo-500
    wp: '#3b82f6',         // blue-500
    act: '#10b981',        // emerald-500
    task: '#f59e0b',       // amber-500
  },
  status: {
    todo: '#6b7280',       // gray-500
    design: '#3b82f6',     // blue-500
    detail: '#8b5cf6',     // violet-500
    implement: '#f59e0b',  // amber-500
    verify: '#22c55e',     // green-500
    done: '#10b981',       // emerald-500
  },
  category: {
    development: '#3b82f6',      // blue-500
    defect: '#ef4444',           // red-500
    infrastructure: '#8b5cf6',   // violet-500
  },
  progress: {
    low: '#ef4444',        // red-500
    medium: '#f59e0b',     // amber-500
    high: '#22c55e',       // green-500
  },
} as const
```

### 15.3 Animation Tokens

```typescript
export const TRANSITIONS = {
  background: '0.2s ease',
  transform: '0.2s ease',
  progress: '0.3s ease',
  expand: '0.25s ease-in-out',
} as const
```

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2.2, 10.1)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-02)
- 다음 단계: `020-detail-design.md` (상세설계)

---

<!--
author: Claude (Frontend Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
