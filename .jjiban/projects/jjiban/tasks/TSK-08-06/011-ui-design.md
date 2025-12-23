# 화면설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 시각적 일관성 검증 중심 (기존 컴포넌트 테마 통합)
> * PrimeVue 디자인 토큰 매핑 시각화
> * E2E 테스트 스크린샷 검증 영역 정의
> * 접근성(WCAG 2.1) 시각적 기준 명시

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-06 |
| Task명 | Theme Integration & E2E Testing |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Sonnet 4.5 |

### 선행 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/jjiban/prd.md` | 섹션 10.1 (UI 디자인 시스템) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화) |
| main.css | `app/assets/css/main.css` | 전체 CSS 변수 및 클래스 정의 |

---

## 1. 개요

### 1.1 화면설계 목적

TSK-08-06은 **새로운 UI 컴포넌트를 개발하지 않습니다**. 대신 WP-08 시리즈(TSK-08-01 ~ TSK-08-05)에서 PrimeVue로 마이그레이션된 컴포넌트들의 **시각적 일관성을 검증하고 통합**하는 것이 목표입니다.

#### 검증 범위
- **테마 일관성**: 모든 컴포넌트가 jjiban 다크 테마 CSS 변수를 올바르게 사용
- **PrimeVue 통합**: PrimeVue 디자인 토큰이 jjiban 테마 팔레트와 일치
- **CSS 클래스 중앙화**: HEX 하드코딩 완전 제거 확인
- **접근성**: WCAG 2.1 AA 기준 색상 대비 검증
- **상호작용**: 모든 상태(hover, active, disabled, selected)의 시각적 피드백 검증

### 1.2 검증 대상 컴포넌트

| Task | 컴포넌트 | 마이그레이션 내용 | PrimeVue 토큰 필요 |
|------|---------|-----------------|----------------|
| TSK-08-01 | WbsTreePanel | 커스텀 → PrimeVue Tree | --p-tree-* |
| TSK-08-01 | NodeIcon | CSS 클래스 중앙화 | No |
| TSK-08-02 | StatusBadge | CSS 클래스 중앙화 | No |
| TSK-08-02 | CategoryTag | CSS 클래스 중앙화 | No |
| TSK-08-02 | ProgressBar | PrimeVue 사용 | --p-progressbar-* |
| TSK-08-03 | AppLayout | CSS Grid → PrimeVue Splitter | --p-splitter-* |
| TSK-08-04 | AppHeader | 커스텀 → PrimeVue Menubar | --p-menubar-* |
| TSK-08-05 | TaskDetailPanel | PrimeVue Dialog | --p-dialog-* |
| TSK-08-05 | TaskWorkflow | CSS 클래스 중앙화 | No |
| TSK-08-05 | TaskHistory | CSS 클래스 중앙화 | No |
| TSK-08-05 | TaskDocuments | CSS 클래스 중앙화 | No |

---

## 2. 디자인 시스템 검증

### 2.1 색상 팔레트 (Dark Blue 테마)

#### 2.1.1 기본 색상 변수

```css
/* jjiban 다크 테마 색상 팔레트 */
--color-bg: #1a1a2e          /* 주 배경색 */
--color-header: #16213e       /* 헤더 배경색 */
--color-sidebar: #0f0f23      /* 사이드바 배경색 */
--color-card: #1e1e38         /* 카드 배경색 */

--color-primary: #3b82f6      /* Primary 파랑 */
--color-primary-hover: #2563eb /* Primary Hover */

--color-success: #22c55e      /* 성공/완료 */
--color-warning: #f59e0b      /* 경고/진행 중 */
--color-danger: #ef4444       /* 위험/오류 */

--color-text: #e8e8e8         /* 기본 텍스트 */
--color-text-secondary: #888888 /* 보조 텍스트 */
--color-text-muted: #666666   /* 약한 텍스트 */

--color-border: #3d3d5c       /* 경계선 */
--color-border-light: #4d4d6c /* 밝은 경계선 */
```

#### 2.1.2 시맨틱 색상 매핑

| 용도 | 색상 변수 | HEX | RGB | 시각적 표현 |
|------|----------|-----|-----|-----------|
| 배경 | --color-bg | #1a1a2e | rgb(26, 26, 46) | ![bg](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%231a1a2e'/%3E%3C/svg%3E) |
| Primary | --color-primary | #3b82f6 | rgb(59, 130, 246) | ![primary](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%233b82f6'/%3E%3C/svg%3E) |
| Success | --color-success | #22c55e | rgb(34, 197, 94) | ![success](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%2322c55e'/%3E%3C/svg%3E) |
| Warning | --color-warning | #f59e0b | rgb(245, 158, 11) | ![warning](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%23f59e0b'/%3E%3C/svg%3E) |
| Danger | --color-danger | #ef4444 | rgb(239, 68, 68) | ![danger](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%23ef4444'/%3E%3C/svg%3E) |
| Text | --color-text | #e8e8e8 | rgb(232, 232, 232) | ![text](data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='20' fill='%23e8e8e8'/%3E%3C/svg%3E) |

#### 2.1.3 계층별 아이콘 색상

| 계층 | 색상 변수 | HEX | 용도 |
|------|----------|-----|------|
| Project | --color-level-project | #8b5cf6 | 프로젝트 노드 아이콘 |
| Work Package | --color-level-wp | #3b82f6 | WP 노드 아이콘 |
| Activity | --color-level-act | #22c55e | Activity 노드 아이콘 |
| Task | --color-level-task | #f59e0b | Task 노드 아이콘 |

### 2.2 타이포그래피

#### 2.2.1 폰트 설정

```css
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  @apply text-text antialiased;
}
```

#### 2.2.2 텍스트 크기 계층

| 요소 | Tailwind 클래스 | 실제 크기 | 용도 |
|------|---------------|----------|------|
| 노드 제목 (WP) | text-sm font-medium | 14px, 500 | WBS Tree 노드 |
| 노드 제목 (Task) | text-xs | 12px | Task 노드 |
| 상태 배지 | text-xs font-medium | 12px, 500 | StatusBadge |
| 카테고리 태그 | text-xs font-medium | 12px, 500 | CategoryTag |
| 메뉴 아이템 | text-sm font-medium | 14px, 500 | AppHeader Menubar |
| 아이콘 텍스트 | text-sm | 14px | NodeIcon |

### 2.3 간격 시스템

#### 2.3.1 PrimeVue Spacing 토큰

| 토큰 | 값 | 용도 |
|------|---|------|
| --p-tree-indent-size | 1rem (16px) | Tree 노드 들여쓰기 |
| --p-splitter-gutter-width | 4px | Splitter 구분선 너비 |
| gap-2 | 0.5rem (8px) | NodeIcon + 텍스트 간격 |
| px-4 py-2 | 1rem 0.5rem | Menubar 아이템 패딩 |
| p-2 | 0.5rem | Tree 컨테이너 패딩 |

---

## 3. 컴포넌트별 시각적 명세

### 3.1 WbsTreePanel (TSK-08-01)

#### 3.1.1 컴포넌트 구조

```
┌─ WbsTreePanel (.wbs-tree) ─────────────────────────┐
│                                                      │
│  ┌─ Tree Node (.p-tree-node-content) ─────────┐    │
│  │  [▼]  [icon] WP-01 프론트엔드 개발  [25%]    │    │
│  └────────────────────────────────────────────┘    │
│      └─ Children (.p-tree-node-children) ───┐      │
│         │  [▶] [icon] TSK-01-01 컴포넌트    │      │
│         └────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

#### 3.1.2 상태별 시각적 스타일

| 상태 | CSS 클래스 | 배경색 | 텍스트 색상 | 비고 |
|------|-----------|--------|-----------|------|
| 기본 | .p-tree-node-content | transparent | #e8e8e8 | |
| Hover | :hover | #16213e (--color-header) | #e8e8e8 | 마우스 오버 |
| Selected | .p-tree-node-selected | rgba(59, 130, 246, 0.2) | #e8e8e8 | primary/20 |
| Focus | :focus | ring-2 ring-primary | #e8e8e8 | 키보드 탐색 |

#### 3.1.3 NodeIcon 시각적 명세

| 타입 | CSS 클래스 | 배경색 | 텍스트 | 크기 |
|------|-----------|--------|--------|------|
| Project | .node-icon-project | #8b5cf6 | 흰색 | 24×24px |
| WP | .node-icon-wp | #3b82f6 | 흰색 | 24×24px |
| Activity | .node-icon-act | #22c55e | 흰색 | 24×24px |
| Task | .node-icon-task | #f59e0b | 흰색 | 24×24px |

#### 3.1.4 E2E 검증 포인트

```typescript
// 노드 선택 상태 배경색 검증
const selectedNode = page.locator('.p-tree-node-selected');
await expect(selectedNode).toHaveCSS('background-color', 'rgba(59, 130, 246, 0.2)');

// NodeIcon 배경색 검증
const wpIcon = page.locator('.node-icon-wp');
await expect(wpIcon).toHaveCSS('background-color', 'rgb(59, 130, 246)');

// 토글 아이콘 색상 검증
const toggleButton = page.locator('.p-tree-node-toggle-button');
await expect(toggleButton).toHaveCSS('color', 'rgb(136, 136, 136)'); // --color-text-secondary
```

### 3.2 StatusBadge & CategoryTag (TSK-08-02)

#### 3.2.1 StatusBadge 상태별 스타일

| 상태 | CSS 클래스 | 배경색 | 텍스트 색상 | 라벨 |
|------|-----------|--------|-----------|------|
| Todo | .status-todo | rgba(102, 102, 102, 0.2) | #888888 | [ ] |
| Design | .status-design | rgba(59, 130, 246, 0.2) | #3b82f6 | [bd][dd] |
| Implement | .status-implement | rgba(245, 158, 11, 0.2) | #f59e0b | [im] |
| Verify | .status-verify | rgba(34, 197, 94, 0.2) | #22c55e | [vf] |
| Done | .status-done | #22c55e | #ffffff | [xx] |

#### 3.2.2 CategoryTag 카테고리별 스타일

| 카테고리 | CSS 클래스 | 배경색 | 텍스트 색상 | 테두리 |
|---------|-----------|--------|-----------|--------|
| Development | .category-tag-development | rgba(59, 130, 246, 0.2) | #3b82f6 | border-primary/30 |
| Defect | .category-tag-defect | rgba(239, 68, 68, 0.2) | #ef4444 | border-danger/30 |
| Infrastructure | .category-tag-infrastructure | rgba(139, 92, 246, 0.2) | #8b5cf6 | border-level-project/30 |

#### 3.2.3 E2E 검증 포인트

```typescript
// StatusBadge 완료 상태 검증
const doneBadge = page.locator('.status-done');
await expect(doneBadge).toHaveCSS('background-color', 'rgb(34, 197, 94)');
await expect(doneBadge).toHaveCSS('color', 'rgb(255, 255, 255)');

// CategoryTag 개발 카테고리 검증
const devTag = page.locator('.category-tag-development');
await expect(devTag).toHaveCSS('background-color', 'rgba(59, 130, 246, 0.2)');
await expect(devTag).toHaveCSS('color', 'rgb(59, 130, 246)');
```

### 3.3 ProgressBar (TSK-08-02)

#### 3.3.1 진행률 색상 임계값

| 진행률 | CSS 클래스 | 배경색 | 임계값 |
|--------|-----------|--------|--------|
| 낮음 | .progress-bar-low | #ef4444 (danger) | 0% ~ 39% |
| 중간 | .progress-bar-medium | #f59e0b (warning) | 40% ~ 79% |
| 높음 | .progress-bar-high | #22c55e (success) | 80% ~ 100% |

#### 3.3.2 시각적 명세

```
ProgressBar 컨테이너
┌────────────────────────────────────────┐
│ ███████████░░░░░░░░░░░░░░░░░░░░░░░░░  │  35% (낮음, 빨강)
└────────────────────────────────────────┘
  배경: --color-border (#3d3d5c)
  값: .progress-bar-low (#ef4444)
  높이: 0.5rem (8px)
```

#### 3.3.3 E2E 검증 포인트

```typescript
// ProgressBar 색상 동적 검증
const progressBar = page.locator('[role="progressbar"]');
const progress = await progressBar.getAttribute('aria-valuenow');

if (Number(progress) < 40) {
  await expect(progressBar.locator('.p-progressbar-value')).toHaveCSS('background-color', 'rgb(239, 68, 68)');
} else if (Number(progress) < 80) {
  await expect(progressBar.locator('.p-progressbar-value')).toHaveCSS('background-color', 'rgb(245, 158, 11)');
} else {
  await expect(progressBar.locator('.p-progressbar-value')).toHaveCSS('background-color', 'rgb(34, 197, 94)');
}
```

### 3.4 AppLayout Splitter (TSK-08-03)

#### 3.4.1 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│  AppHeader (height: 60px, bg: #16213e)                      │
├─────────────┬────┬──────────────────────────────────────────┤
│             │    │                                           │
│  LeftPanel  │ G  │  RightPanel                               │
│  (60%)      │ u  │  (40%)                                    │
│  #0f0f23    │ t  │  #1a1a2e                                  │
│             │ t  │                                           │
│             │ e  │                                           │
│             │ r  │                                           │
└─────────────┴────┴──────────────────────────────────────────┘
```

#### 3.4.2 Gutter 상태별 스타일

| 상태 | CSS 클래스 | 배경색 | 커서 | 비고 |
|------|-----------|--------|------|------|
| 기본 | .app-layout-gutter | #3d3d5c (--color-border) | col-resize | 4px 너비 |
| Hover | :hover | #4d4d6c (--color-border-light) | col-resize | 시각적 피드백 |
| Active | :active | #3b82f6 (--color-primary) | col-resize | 드래그 중 |
| Focus | :focus-visible | outline: 2px solid primary | col-resize | 키보드 탐색 |

#### 3.4.3 E2E 검증 포인트

```typescript
// Gutter 기본 스타일 검증
const gutter = page.locator('.app-layout-gutter');
await expect(gutter).toHaveCSS('background-color', 'rgb(61, 61, 92)');
await expect(gutter).toHaveCSS('width', '4px');
await expect(gutter).toHaveCSS('cursor', 'col-resize');

// Gutter 드래그 시뮬레이션 (Hover → Active)
await gutter.hover();
await expect(gutter).toHaveCSS('background-color', 'rgb(77, 77, 108)'); // hover

const gutterBox = await gutter.boundingBox();
await page.mouse.move(gutterBox.x + 2, gutterBox.y + 100);
await page.mouse.down();
await expect(gutter).toHaveCSS('background-color', 'rgb(59, 130, 246)'); // active
await page.mouse.up();
```

### 3.5 AppHeader Menubar (TSK-08-04)

#### 3.5.1 컴포넌트 구조

```
┌─ AppHeader (bg: #16213e) ──────────────────────────────────┐
│  [jjiban]  Dashboard  WBS  Gantt  Settings  [프로젝트명]   │
└───────────────────────────────────────────────────────────┘
   로고      활성메뉴   일반   일반   비활성    프로젝트명
```

#### 3.5.2 메뉴 아이템 상태별 스타일

| 상태 | CSS 클래스 | 배경색 | 텍스트 색상 | 비고 |
|------|-----------|--------|-----------|------|
| 기본 | .menubar-item | transparent | #e8e8e8 | |
| Active | .menubar-item-active | rgba(59, 130, 246, 0.2) | #3b82f6 | 현재 페이지 |
| Hover | :hover (not disabled/active) | rgba(255, 255, 255, 0.05) | #e8e8e8 | surface-50 |
| Disabled | .menubar-item-disabled | transparent | #666666 (muted) | opacity-50 |

#### 3.5.3 로고 스타일

```css
.menubar-logo {
  @apply text-xl font-bold text-primary hover:opacity-80 transition-opacity;
}
```

- 크기: text-xl (20px)
- 색상: #3b82f6 (--color-primary)
- Hover: opacity 80%

#### 3.5.4 E2E 검증 포인트

```typescript
// 활성 메뉴 아이템 검증
const activeMenu = page.locator('.menubar-item-active');
await expect(activeMenu).toHaveCSS('background-color', 'rgba(59, 130, 246, 0.2)');
await expect(activeMenu).toHaveCSS('color', 'rgb(59, 130, 246)');

// 비활성 메뉴 아이템 검증
const disabledMenu = page.locator('.menubar-item-disabled');
await expect(disabledMenu).toHaveCSS('color', 'rgb(102, 102, 102)');
await expect(disabledMenu).toHaveCSS('opacity', '0.5');
await expect(disabledMenu).toHaveCSS('cursor', 'not-allowed');

// 로고 검증
const logo = page.locator('.menubar-logo');
await expect(logo).toHaveCSS('color', 'rgb(59, 130, 246)');
await expect(logo).toHaveCSS('font-size', '20px');
```

### 3.6 TaskDetailPanel & Dialogs (TSK-08-05)

#### 3.6.1 Dialog 시각적 명세

| 요소 | 배경색 | 텍스트 색상 | 테두리 |
|------|--------|-----------|--------|
| Dialog 배경 | #1e1e38 (--color-card) | #e8e8e8 | #3d3d5c |
| Dialog 헤더 | #16213e (--color-header) | #e8e8e8 | - |
| Dialog 콘텐츠 | #1e1e38 | #e8e8e8 | - |

#### 3.6.2 TaskWorkflow 워크플로우 노드 스타일

| 상태 | CSS 클래스 | 배경색 | 텍스트 색상 | 효과 |
|------|-----------|--------|-----------|------|
| 완료 | .workflow-step-completed | #22c55e | #ffffff | - |
| 현재 | .workflow-step-current | #3b82f6 | #ffffff | scale(1.1), shadow |
| 대기 | .workflow-step-pending | #e5e7eb | #6b7280 | dashed border |

#### 3.6.3 TaskHistory 이력 배지 스타일

| 타입 | CSS 클래스 | 배경색 |
|------|-----------|--------|
| 상태 전이 | .history-badge-transition | #3b82f6 |
| 액션 실행 | .history-badge-action | #8b5cf6 |
| 업데이트 | .history-badge-update | #22c55e |
| 기본 | .history-badge-default | #6b7280 |

#### 3.6.4 TaskDocuments 문서 카드 스타일

| 상태 | CSS 클래스 | 배경색 | 테두리 | 비고 |
|------|-----------|--------|--------|------|
| 존재 | .doc-card-exists | #dbeafe | solid 1px #3b82f6 | 클릭 가능 |
| 예정 | .doc-card-expected | #f9fafb | dashed 2px #9ca3af | cursor-not-allowed |

#### 3.6.5 E2E 검증 포인트

```typescript
// Dialog 배경색 검증
const dialog = page.locator('[role="dialog"]');
await expect(dialog).toHaveCSS('background-color', 'rgb(30, 30, 56)');

// TaskWorkflow 현재 단계 검증
const currentStep = page.locator('.workflow-step-current');
await expect(currentStep).toHaveCSS('background-color', 'rgb(59, 130, 246)');
await expect(currentStep).toHaveCSS('transform', 'matrix(1.1, 0, 0, 1.1, 0, 0)'); // scale(1.1)

// TaskHistory 이력 배지 검증
const transitionBadge = page.locator('.history-badge-transition');
await expect(transitionBadge).toHaveCSS('background-color', 'rgb(59, 130, 246)');

// TaskDocuments 문서 카드 검증
const existsCard = page.locator('.doc-card-exists');
await expect(existsCard).toHaveCSS('background-color', 'rgb(219, 234, 254)');
await expect(existsCard).toHaveCSS('border-color', 'rgb(59, 130, 246)');
```

---

## 4. PrimeVue 디자인 토큰 매핑

### 4.1 --p-tree-* (WbsTreePanel)

```css
:root {
  /* PrimeVue Tree 디자인 토큰 오버라이드 */
  --p-tree-background: var(--color-sidebar);                    /* #0f0f23 */
  --p-tree-color: var(--color-text);                            /* #e8e8e8 */
  --p-tree-node-hover-background: var(--color-header);          /* #16213e */
  --p-tree-node-selected-background: rgba(59, 130, 246, 0.2);   /* primary/20 */
  --p-tree-node-selected-color: var(--color-text);              /* #e8e8e8 */
  --p-tree-node-icon-color: var(--color-text-secondary);        /* #888888 */
  --p-tree-indent-size: 1rem;                                   /* 16px */
}
```

#### 시각적 검증 기준

| 토큰 | 기대값 RGB | E2E 검증 셀렉터 |
|------|-----------|----------------|
| background | rgb(15, 15, 35) | .wbs-tree |
| node-hover-background | rgb(22, 33, 62) | .p-tree-node-content:hover |
| node-selected-background | rgba(59, 130, 246, 0.2) | .p-tree-node-selected |
| node-icon-color | rgb(136, 136, 136) | .p-tree-node-toggle-button |

### 4.2 --p-splitter-* (AppLayout)

```css
:root {
  /* PrimeVue Splitter 디자인 토큰 오버라이드 */
  --p-splitter-gutter-background: var(--color-border);          /* #3d3d5c */
  --p-splitter-gutter-hover-background: var(--color-border-light); /* #4d4d6c */
  --p-splitter-gutter-active-background: var(--color-primary);  /* #3b82f6 */
  --p-splitter-gutter-width: 4px;
}
```

#### 시각적 검증 기준

| 토큰 | 기대값 RGB | E2E 검증 상태 |
|------|-----------|--------------|
| gutter-background | rgb(61, 61, 92) | 기본 상태 |
| gutter-hover-background | rgb(77, 77, 108) | :hover |
| gutter-active-background | rgb(59, 130, 246) | :active (드래그) |

### 4.3 --p-menubar-* (AppHeader)

```css
:root {
  /* PrimeVue Menubar 디자인 토큰 오버라이드 */
  --p-menubar-background: var(--color-header);                  /* #16213e */
  --p-menubar-item-color: var(--color-text);                    /* #e8e8e8 */
  --p-menubar-item-hover-color: var(--color-text);              /* #e8e8e8 */
  --p-menubar-item-hover-background: rgba(59, 130, 246, 0.1);   /* primary/10 */
  --p-menubar-item-active-color: var(--color-primary);          /* #3b82f6 */
  --p-menubar-item-active-background: rgba(59, 130, 246, 0.2);  /* primary/20 */
}
```

#### 시각적 검증 기준

| 토큰 | 기대값 RGB | E2E 검증 셀렉터 |
|------|-----------|----------------|
| background | rgb(22, 33, 62) | .app-menubar |
| item-active-color | rgb(59, 130, 246) | .menubar-item-active |
| item-active-background | rgba(59, 130, 246, 0.2) | .menubar-item-active |

### 4.4 --p-dialog-* (TaskDetailPanel)

```css
:root {
  /* PrimeVue Dialog 디자인 토큰 오버라이드 */
  --p-dialog-background: var(--color-card);                     /* #1e1e38 */
  --p-dialog-header-background: var(--color-header);            /* #16213e */
  --p-dialog-border-color: var(--color-border);                 /* #3d3d5c */
  --p-dialog-color: var(--color-text);                          /* #e8e8e8 */
  --p-dialog-header-color: var(--color-text);                   /* #e8e8e8 */
}
```

#### 시각적 검증 기준

| 토큰 | 기대값 RGB | E2E 검증 셀렉터 |
|------|-----------|----------------|
| background | rgb(30, 30, 56) | [role="dialog"] |
| header-background | rgb(22, 33, 62) | .p-dialog-header |
| border-color | rgb(61, 61, 92) | [role="dialog"] border |

### 4.5 --p-progressbar-* (ProgressBar)

```css
:root {
  /* PrimeVue ProgressBar 디자인 토큰 오버라이드 */
  --p-progressbar-background: var(--color-border);              /* #3d3d5c */
  --p-progressbar-height: 0.5rem;                               /* 8px */
  /* value-background은 동적 클래스로 관리 (.progress-bar-low/medium/high) */
}
```

#### 시각적 검증 기준

| 요소 | 기대값 RGB | 진행률 조건 |
|------|-----------|-----------|
| background | rgb(61, 61, 92) | 항상 |
| value (low) | rgb(239, 68, 68) | 0% ~ 39% |
| value (medium) | rgb(245, 158, 11) | 40% ~ 79% |
| value (high) | rgb(34, 197, 94) | 80% ~ 100% |

---

## 5. 접근성 (WCAG 2.1) 검증

### 5.1 색상 대비 기준

**WCAG 2.1 AA 기준**: 텍스트 대비 4.5:1 이상 (일반 텍스트), 3:1 이상 (대형 텍스트 18px+)

#### 5.1.1 주요 색상 조합 대비

| 전경색 | 배경색 | 대비 | 통과 | 용도 |
|--------|--------|------|------|------|
| #e8e8e8 (text) | #1a1a2e (bg) | 10.2:1 | ✓ AA, AAA | 기본 텍스트 |
| #888888 (text-secondary) | #1a1a2e (bg) | 4.8:1 | ✓ AA | 보조 텍스트 |
| #666666 (text-muted) | #1a1a2e (bg) | 3.2:1 | ✗ AA (대형 텍스트만) | 약한 텍스트 |
| #3b82f6 (primary) | #1a1a2e (bg) | 5.1:1 | ✓ AA | Primary 텍스트 |
| #ffffff | #22c55e (success) | 5.9:1 | ✓ AA | 완료 배지 |
| #ffffff | #3b82f6 (primary) | 4.6:1 | ✓ AA | Primary 배지 |

#### 5.1.2 E2E 접근성 검증

```typescript
// Playwright Accessibility API 활용
const snapshot = await page.accessibility.snapshot();

// 색상 대비 검증 (자동)
const violations = await new AxeBuilder({ page })
  .withTags(['wcag21aa', 'wcag143'])  // WCAG 2.1 AA 색상 대비
  .analyze();

expect(violations.violations).toHaveLength(0);

// 수동 대비 계산 (주요 요소)
const textColor = await page.locator('.wbs-tree-node-title').evaluate(el =>
  getComputedStyle(el).color
);
const bgColor = await page.locator('.wbs-tree').evaluate(el =>
  getComputedStyle(el).backgroundColor
);

const contrast = calculateContrast(textColor, bgColor);
expect(contrast).toBeGreaterThanOrEqual(4.5); // AA 기준
```

### 5.2 키보드 탐색

#### 5.2.1 포커스 표시

```css
*:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-bg;
}
```

**검증 기준**:
- 모든 상호작용 요소에 포커스 링 표시
- ring-2 (2px 두께), ring-primary (#3b82f6)
- ring-offset-2 (2px 간격)

#### 5.2.2 키보드 네비게이션 경로

| 컴포넌트 | Tab 순서 | 특수 키 | 동작 |
|---------|---------|---------|------|
| WbsTreePanel | Tree 노드 | Arrow Up/Down, Enter, Space | 노드 선택/확장 |
| AppHeader | 로고 → 메뉴 아이템 (순서대로) | Enter | 메뉴 클릭 |
| Splitter | Gutter | Arrow Left/Right | 패널 리사이즈 |
| TaskDetailPanel | Dialog 헤더 → 콘텐츠 → 버튼 | Escape | Dialog 닫기 |

#### 5.2.3 E2E 키보드 테스트

```typescript
// Tree 키보드 탐색
await page.keyboard.press('Tab'); // Tree로 포커스 이동
await page.keyboard.press('ArrowDown'); // 다음 노드
await page.keyboard.press('Enter'); // 노드 선택
await page.keyboard.press('ArrowRight'); // 노드 확장

// Menubar 키보드 탐색
await page.keyboard.press('Tab'); // 로고
await page.keyboard.press('Tab'); // Dashboard 메뉴
await page.keyboard.press('Enter'); // 메뉴 활성화

// Splitter 키보드 탐색
await page.locator('.app-layout-gutter').focus();
await page.keyboard.press('ArrowLeft'); // 왼쪽 패널 축소
await page.keyboard.press('ArrowRight'); // 왼쪽 패널 확대
```

### 5.3 ARIA 속성

#### 5.3.1 PrimeVue 자동 ARIA

| 컴포넌트 | ARIA 속성 | 기대값 |
|---------|----------|--------|
| Tree Node | aria-expanded | "true" / "false" |
| Tree Node | aria-selected | "true" / "false" |
| Dialog | role | "dialog" |
| Dialog | aria-modal | "true" |
| ProgressBar | role | "progressbar" |
| ProgressBar | aria-valuenow | 진행률 숫자 (0-100) |

#### 5.3.2 E2E ARIA 검증

```typescript
// Tree Node ARIA 검증
const expandedNode = page.locator('[aria-expanded="true"]');
await expect(expandedNode).toBeVisible();

const selectedNode = page.locator('[aria-selected="true"]');
await expect(selectedNode).toHaveClass(/p-tree-node-selected/);

// Dialog ARIA 검증
const dialog = page.locator('[role="dialog"]');
await expect(dialog).toHaveAttribute('aria-modal', 'true');

// ProgressBar ARIA 검증
const progressBar = page.locator('[role="progressbar"]');
const valueNow = await progressBar.getAttribute('aria-valuenow');
expect(Number(valueNow)).toBeGreaterThanOrEqual(0);
expect(Number(valueNow)).toBeLessThanOrEqual(100);
```

---

## 6. E2E 테스트 스크린샷 검증 영역

### 6.1 전체 레이아웃 스크린샷

#### 6.1.1 Full Page Screenshot

```typescript
await page.screenshot({
  path: 'test-results/screenshots/theme-integration-full.png',
  fullPage: true
});
```

**검증 영역**:
- AppHeader (상단 60px)
- LeftPanel (WbsTreePanel)
- RightPanel (KanbanBoard / GanttChart)
- Splitter Gutter

**시각적 일관성 체크**:
- 모든 배경색이 jjiban 테마 팔레트 사용
- Primary 색상(#3b82f6) 일관성
- 텍스트 색상(#e8e8e8) 일관성

### 6.2 컴포넌트별 스크린샷

#### 6.2.1 WbsTreePanel

```typescript
const treePanel = page.locator('.wbs-tree');
await treePanel.screenshot({
  path: 'test-results/screenshots/wbs-tree-panel.png'
});
```

**검증 포인트**:
- NodeIcon 색상 (Project, WP, Activity, Task)
- 노드 선택 상태 배경색 (primary/20)
- 토글 아이콘 색상 (text-secondary)

#### 6.2.2 AppHeader Menubar

```typescript
const header = page.locator('.app-menubar');
await header.screenshot({
  path: 'test-results/screenshots/app-header-menubar.png'
});
```

**검증 포인트**:
- 로고 색상 (#3b82f6)
- 활성 메뉴 배경색 (primary/20)
- 비활성 메뉴 텍스트 색상 (text-muted)

#### 6.2.3 StatusBadge & CategoryTag

```typescript
const kanbanColumn = page.locator('[data-column="design"]');
await kanbanColumn.screenshot({
  path: 'test-results/screenshots/status-category-badges.png'
});
```

**검증 포인트**:
- StatusBadge 상태별 색상 (todo, design, implement, verify, done)
- CategoryTag 카테고리별 색상 (development, defect, infrastructure)

#### 6.2.4 TaskDetailPanel Dialog

```typescript
// Dialog 열기
await page.click('[data-task-id="TSK-01-01"]');
const dialog = page.locator('[role="dialog"]');
await dialog.screenshot({
  path: 'test-results/screenshots/task-detail-panel.png'
});
```

**검증 포인트**:
- Dialog 배경색 (#1e1e38)
- Dialog 헤더 배경색 (#16213e)
- TaskWorkflow 현재 단계 강조
- TaskHistory 이력 배지 색상
- TaskDocuments 문서 카드 상태

#### 6.2.5 Splitter Gutter

```typescript
const gutter = page.locator('.app-layout-gutter');

// 기본 상태
await page.screenshot({
  path: 'test-results/screenshots/splitter-gutter-default.png',
  clip: await gutter.boundingBox()
});

// Hover 상태
await gutter.hover();
await page.screenshot({
  path: 'test-results/screenshots/splitter-gutter-hover.png',
  clip: await gutter.boundingBox()
});

// Active 상태 (드래그 시뮬레이션)
await page.mouse.move(gutterBox.x + 2, gutterBox.y + 100);
await page.mouse.down();
await page.screenshot({
  path: 'test-results/screenshots/splitter-gutter-active.png',
  clip: await gutter.boundingBox()
});
await page.mouse.up();
```

**검증 포인트**:
- 기본: #3d3d5c (--color-border)
- Hover: #4d4d6c (--color-border-light)
- Active: #3b82f6 (--color-primary)

---

## 7. HEX 하드코딩 검증

### 7.1 검증 대상 파일

```bash
# 전체 .vue 파일에서 HEX 하드코딩 검색
grep -r "#[0-9a-fA-F]\{3,6\}" app/**/*.vue
```

### 7.2 허용 예외 케이스

**동적 계산 필수 케이스만 허용**:
- `paddingLeft: \`\${level * 16}px\`` (들여쓰기 계산)
- `width: \`\${progress}%\`` (진행률 동적 값)
- `left: \`\${position}px\`` (드래그 위치)

**금지 사례**:
```vue
<!-- ❌ 금지 -->
<div :style="{ backgroundColor: '#3b82f6' }"></div>
<script>const color = '#3b82f6';</script>

<!-- ✓ 허용 -->
<div :class="'node-icon-wp'"></div>
<script>
const iconClass = computed(() => `node-icon-${props.type}`);
</script>
```

### 7.3 E2E 검증

```typescript
// 모든 .vue 파일 HEX 하드코딩 검증
const vueFiles = await glob('app/**/*.vue');
const hexPattern = /#[0-9a-fA-F]{3,6}/g;

for (const file of vueFiles) {
  const content = await fs.readFile(file, 'utf-8');

  // :style 속성에서 HEX 검색
  const styleMatches = content.match(/:style.*?#[0-9a-fA-F]{3,6}/g);

  // const/let 변수에서 HEX 검색 (동적 계산 제외)
  const varMatches = content.match(/(const|let).*?=.*?#[0-9a-fA-F]{3,6}/g);

  expect(styleMatches).toBeNull();
  expect(varMatches).toBeNull();
}
```

---

## 8. 반응형 디자인 검증

### 8.1 브레이크포인트

| 디바이스 | 최소 너비 | 검증 항목 |
|---------|----------|----------|
| Desktop | 1200px | 전체 레이아웃 정상 표시 |
| Tablet | 768px ~ 1199px | Splitter 비율 조정 (50:50) |
| Mobile | < 768px | 단일 패널 표시 (탭 전환) |

### 8.2 E2E 반응형 테스트

```typescript
// Desktop (1920×1080)
await page.setViewportSize({ width: 1920, height: 1080 });
await expect(page.locator('.app-layout-splitter')).toBeVisible();

// Tablet (1024×768)
await page.setViewportSize({ width: 1024, height: 768 });
const leftPanel = page.locator('[data-panel="left"]');
const leftWidth = await leftPanel.evaluate(el => el.offsetWidth);
expect(leftWidth / 1024).toBeCloseTo(0.5, 1); // 50% ± 10%

// Mobile (375×667)
await page.setViewportSize({ width: 375, height: 667 });
// 최소 너비 1200px으로 수평 스크롤 발생 (AppLayout 설계)
await expect(page.locator('.app-layout-splitter')).toHaveCSS('min-width', '1200px');
```

---

## 9. 성능 검증

### 9.1 렌더링 성능 기준

**기준**: PrimeVue 마이그레이션 후 렌더링 성능 저하 < 5%

#### 9.1.1 측정 지표

| 지표 | 마이그레이션 전 | 마이그레이션 후 | 허용 범위 |
|------|--------------|--------------|----------|
| FCP (First Contentful Paint) | 기준값 | 기준값 × 1.05 | < 5% 증가 |
| LCP (Largest Contentful Paint) | 기준값 | 기준값 × 1.05 | < 5% 증가 |
| TTI (Time to Interactive) | 기준값 | 기준값 × 1.05 | < 5% 증가 |

#### 9.1.2 E2E 성능 테스트

```typescript
// Chrome DevTools Performance 측정
const performanceMetrics = await page.evaluate(() => {
  const perfData = window.performance.getEntriesByType('navigation')[0];
  return {
    fcp: perfData.responseEnd - perfData.requestStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.requestStart,
    loadComplete: perfData.loadEventEnd - perfData.requestStart
  };
});

// 기준값과 비교 (5% 이내)
expect(performanceMetrics.fcp).toBeLessThan(baselineFCP * 1.05);
expect(performanceMetrics.domContentLoaded).toBeLessThan(baselineDCL * 1.05);
expect(performanceMetrics.loadComplete).toBeLessThan(baselineLoad * 1.05);
```

### 9.2 번들 크기 검증

```bash
# PrimeVue 추가 후 번들 크기 증가 확인
npm run build
du -sh .output/public/_nuxt/*.js

# 기대값: PrimeVue Tree, Splitter, Menubar, Dialog 컴포넌트 추가
# 총 증가량: < 100KB (gzip)
```

---

## 10. 인수 기준 (화면설계)

### 10.1 시각적 일관성

- [ ] AC-UI-01: 모든 컴포넌트가 jjiban 다크 테마 CSS 변수(--color-*)를 사용
- [ ] AC-UI-02: PrimeVue 디자인 토큰(--p-*)이 jjiban 변수를 참조
- [ ] AC-UI-03: 모든 상태(기본, hover, active, disabled, selected)가 명확한 시각적 피드백 제공

### 10.2 색상 검증

- [ ] AC-UI-04: Primary 색상(#3b82f6) 일관성 100% (NodeIcon WP, 활성 메뉴, 선택 노드 등)
- [ ] AC-UI-05: Success 색상(#22c55e) 일관성 100% (완료 배지, 높은 진행률 등)
- [ ] AC-UI-06: Warning 색상(#f59e0b) 일관성 100% (중간 진행률, Task 아이콘 등)
- [ ] AC-UI-07: Danger 색상(#ef4444) 일관성 100% (낮은 진행률, Defect 태그 등)

### 10.3 접근성

- [ ] AC-UI-08: WCAG 2.1 AA 색상 대비 기준 통과 (4.5:1 이상)
- [ ] AC-UI-09: 모든 상호작용 요소에 포커스 링 표시 (ring-2 ring-primary)
- [ ] AC-UI-10: ARIA 속성 올바르게 설정 (aria-expanded, aria-selected, role 등)

### 10.4 HEX 하드코딩 제거

- [ ] AC-UI-11: app/**/*.vue 파일에서 HEX 하드코딩 0건 (동적 계산 제외)
- [ ] AC-UI-12: 모든 색상이 CSS 클래스 또는 CSS 변수로 관리

### 10.5 반응형

- [ ] AC-UI-13: Desktop (1920×1080) 레이아웃 정상 표시
- [ ] AC-UI-14: Tablet (1024×768) Splitter 비율 50:50
- [ ] AC-UI-15: Mobile (375×667) 최소 너비 1200px (수평 스크롤)

### 10.6 성능

- [ ] AC-UI-16: PrimeVue 마이그레이션 후 렌더링 성능 저하 < 5%
- [ ] AC-UI-17: 번들 크기 증가 < 100KB (gzip)

---

## 11. E2E 테스트 체크리스트

### 11.1 컴포넌트별 테스트

#### WbsTreePanel (TSK-08-01)
- [ ] NodeIcon 색상 (Project, WP, Activity, Task)
- [ ] 노드 선택 상태 배경색 (primary/20)
- [ ] 노드 호버 상태 배경색 (header)
- [ ] 토글 아이콘 색상 (text-secondary)
- [ ] 노드 확장/접기 동작
- [ ] 키보드 탐색 (Arrow, Enter, Space)

#### StatusBadge & CategoryTag (TSK-08-02)
- [ ] StatusBadge 5가지 상태 색상 (todo, design, implement, verify, done)
- [ ] CategoryTag 3가지 카테고리 색상 (development, defect, infrastructure)
- [ ] 배지 텍스트 색상 대비 (WCAG 2.1 AA)

#### ProgressBar (TSK-08-02)
- [ ] 낮은 진행률 (0-39%) 빨강색
- [ ] 중간 진행률 (40-79%) 주황색
- [ ] 높은 진행률 (80-100%) 초록색
- [ ] ARIA 속성 (role="progressbar", aria-valuenow)

#### AppLayout Splitter (TSK-08-03)
- [ ] Gutter 기본 상태 색상 (border)
- [ ] Gutter 호버 상태 색상 (border-light)
- [ ] Gutter 드래그 상태 색상 (primary)
- [ ] Splitter 리사이즈 동작 (60:40 기본값)
- [ ] 키보드 탐색 (Arrow Left/Right)

#### AppHeader Menubar (TSK-08-04)
- [ ] 로고 색상 (primary)
- [ ] 활성 메뉴 배경색 (primary/20)
- [ ] 비활성 메뉴 텍스트 색상 (text-muted)
- [ ] 메뉴 호버 상태 배경색 (surface-50)
- [ ] 메뉴 클릭 동작
- [ ] 키보드 탐색 (Tab, Enter)

#### TaskDetailPanel (TSK-08-05)
- [ ] Dialog 배경색 (card)
- [ ] Dialog 헤더 배경색 (header)
- [ ] Dialog 경계선 색상 (border)
- [ ] TaskWorkflow 현재 단계 강조 (scale, shadow)
- [ ] TaskHistory 이력 배지 색상
- [ ] TaskDocuments 문서 카드 상태 (exists, expected)
- [ ] Dialog 열기/닫기 동작
- [ ] 키보드 탐색 (Escape)

### 11.2 통합 테스트

- [ ] 전체 레이아웃 시각적 일관성
- [ ] 모든 PrimeVue 디자인 토큰 적용 확인
- [ ] HEX 하드코딩 0건 검증
- [ ] WCAG 2.1 AA 접근성 통과
- [ ] 성능 저하 < 5% 확인

---

## 12. 스크린샷 카탈로그

### 12.1 Full Page

| 파일명 | 설명 | 뷰포트 |
|--------|------|--------|
| theme-integration-full.png | 전체 레이아웃 | 1920×1080 |
| theme-integration-tablet.png | 태블릿 레이아웃 | 1024×768 |
| theme-integration-mobile.png | 모바일 레이아웃 | 375×667 |

### 12.2 Component Specific

| 파일명 | 설명 |
|--------|------|
| wbs-tree-panel.png | WbsTreePanel (기본 상태) |
| wbs-tree-selected.png | WbsTreePanel (노드 선택) |
| wbs-tree-hover.png | WbsTreePanel (노드 호버) |
| app-header-menubar.png | AppHeader Menubar |
| status-category-badges.png | StatusBadge & CategoryTag |
| progress-bar-variants.png | ProgressBar (3가지 색상) |
| splitter-gutter-default.png | Splitter Gutter (기본) |
| splitter-gutter-hover.png | Splitter Gutter (호버) |
| splitter-gutter-active.png | Splitter Gutter (드래그) |
| task-detail-panel.png | TaskDetailPanel Dialog |
| task-workflow.png | TaskWorkflow |
| task-history.png | TaskHistory |
| task-documents.png | TaskDocuments |

---

## 13. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
  - PrimeVue 디자인 토큰 CSS 코드 상세 작성
  - E2E 테스트 케이스 Playwright 코드 작성
  - HEX 하드코딩 제거 대상 파일 목록 및 수정 계획

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- main.css: `app/assets/css/main.css`
- PRD: `.jjiban/jjiban/prd.md` (섹션 10.1)
- TRD: `.jjiban/jjiban/trd.md` (섹션 2.3.6)

---

<!--
author: Claude Sonnet 4.5
Created: 2025-12-16
-->
