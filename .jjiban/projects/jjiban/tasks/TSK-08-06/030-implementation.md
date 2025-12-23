# 구현 (030-implementation.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **구현 규칙**
> * 실제 작성한 코드와 수정 사항 기록
> * 설계와의 차이점 및 변경 근거 명시
> * 테스트 결과 및 검증 내용 포함

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-06 |
| Task명 | Theme Integration & E2E Testing |
| Category | development |
| 상태 | [im] 구현 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Sonnet 4.5 |

### 선행 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| 화면설계 | `011-ui-design.md` | 전체 |
| 상세설계 | `020-detail-design.md` | 전체 |

---

## 1. 구현 개요

### 1.1 구현 범위

**Phase 1: PrimeVue 디자인 토큰 정의 (완료)**
- main.css에 PrimeVue 디자인 토큰 추가
- --p-tree-*, --p-splitter-*, --p-menubar-*, --p-dialog-*, --p-progressbar-* 정의
- jjiban 다크 테마 CSS 변수와 통합

**Phase 2: HEX 하드코딩 제거 (완료)**
- 16건의 HEX 하드코딩을 CSS 변수 또는 Tailwind 클래스로 변경
- 컴포넌트별 수정 내역:
  1. TaskDocuments.vue (1건)
  2. TaskProgress.vue (6건)
  3. WbsSearchBox.vue (2건)
  4. WbsSummaryCards.vue (2건)
  5. WbsTreeHeader.vue (2건)
  6. WbsTreeNode.vue (3건)

### 1.2 설계와의 차이점

**설계 문서 예상**: 020-detail-design.md 섹션 3.2에서 16건의 HEX 하드코딩 발견
**실제 구현**: 16건 모두 제거 완료

**차이점 없음** - 설계 문서대로 정확히 구현

---

## 2. 파일별 구현 내역

### 2.1 app/assets/css/main.css

**수정 위치**: Line 171 (NodeIcon 스타일 위)

**추가 내용**:
```css
/* ============================================
 * PrimeVue 디자인 토큰 오버라이드 (TSK-08-06)
 * jjiban 다크 테마와 통합
 * ============================================ */

/* PrimeVue Tree 컴포넌트 (WbsTreePanel - TSK-08-01) */
:root {
  /* Tree 배경 및 텍스트 */
  --p-tree-background: var(--color-sidebar);
  --p-tree-color: var(--color-text);
  --p-tree-padding: 0.5rem;

  /* Tree 노드 상태별 배경색 */
  --p-tree-node-background: transparent;
  --p-tree-node-hover-background: var(--color-header);
  --p-tree-node-selected-background: rgba(59, 130, 246, 0.2);
  --p-tree-node-focus-background: var(--color-header);

  /* Tree 노드 텍스트 색상 */
  --p-tree-node-color: var(--color-text);
  --p-tree-node-hover-color: var(--color-text);
  --p-tree-node-selected-color: var(--color-text);
  --p-tree-node-focus-color: var(--color-text);

  /* Tree 토글 아이콘 */
  --p-tree-node-icon-color: var(--color-text-secondary);
  --p-tree-node-icon-hover-color: var(--color-text);

  /* Tree 들여쓰기 */
  --p-tree-indent-size: 1rem;

  /* Tree 경계선 */
  --p-tree-border-color: var(--color-border);

  /* Tree 로딩 아이콘 */
  --p-tree-loading-icon-color: var(--color-primary);
}

/* PrimeVue Splitter 컴포넌트 (AppLayout - TSK-08-03) */
:root {
  --p-splitter-gutter-background: var(--color-border);
  --p-splitter-gutter-hover-background: var(--color-border-light);
  --p-splitter-gutter-active-background: var(--color-primary);
  --p-splitter-gutter-size: 4px;
  --p-splitter-handle-background: var(--color-primary);
  --p-splitter-handle-size: 24px;
}

/* PrimeVue Menubar 컴포넌트 (AppHeader - TSK-08-04) */
:root {
  --p-menubar-background: var(--color-header);
  --p-menubar-border-color: transparent;
  --p-menubar-padding: 0.75rem 1rem;
  --p-menubar-item-color: var(--color-text);
  --p-menubar-item-hover-color: var(--color-text);
  --p-menubar-item-active-color: var(--color-primary);
  --p-menubar-item-focus-color: var(--color-text);
  --p-menubar-item-background: transparent;
  --p-menubar-item-hover-background: rgba(255, 255, 255, 0.05);
  --p-menubar-item-active-background: rgba(59, 130, 246, 0.2);
  --p-menubar-item-focus-background: rgba(59, 130, 246, 0.1);
  --p-menubar-item-padding: 0.5rem 1rem;
  --p-menubar-item-gap: 0.5rem;
  --p-menubar-submenu-background: var(--color-card);
  --p-menubar-submenu-border-color: var(--color-border);
}

/* PrimeVue Dialog 컴포넌트 (TaskDetailPanel - TSK-08-05) */
:root {
  --p-dialog-background: var(--color-card);
  --p-dialog-color: var(--color-text);
  --p-dialog-border-color: var(--color-border);
  --p-dialog-border-radius: 1rem;
  --p-dialog-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5),
                     0 10px 10px -5px rgba(0, 0, 0, 0.4);
  --p-dialog-header-background: var(--color-header);
  --p-dialog-header-color: var(--color-text);
  --p-dialog-header-padding: 1rem 1.5rem;
  --p-dialog-header-border-width: 0 0 1px 0;
  --p-dialog-header-border-color: var(--color-border);
  --p-dialog-content-padding: 1.5rem;
  --p-dialog-content-background: var(--color-card);
  --p-dialog-footer-padding: 1rem 1.5rem;
  --p-dialog-footer-background: var(--color-card);
  --p-dialog-footer-border-width: 1px 0 0 0;
  --p-dialog-footer-border-color: var(--color-border);
  --p-dialog-mask-background: rgba(0, 0, 0, 0.6);
}

/* PrimeVue ProgressBar 컴포넌트 (ProgressBar - TSK-08-02) */
:root {
  --p-progressbar-background: var(--color-border);
  --p-progressbar-height: 0.5rem;
  --p-progressbar-border-radius: 0.25rem;
  --p-progressbar-value-background: var(--color-warning);
  --p-progressbar-label-color: var(--color-text);
  --p-progressbar-label-font-size: 0.75rem;
}
```

**변경 근거**: 020-detail-design.md 섹션 1.1의 설계 그대로 적용

---

### 2.2 app/components/wbs/detail/TaskDocuments.vue

**수정 위치**: Line 131

**Before**:
```typescript
function getDocumentColor(doc: DocumentInfo): string {
  return DOCUMENT_TYPE_CONFIG[doc.type]?.color || '#6b7280'
}
```

**After**:
```typescript
/**
 * 문서 타입별 색상 가져오기
 * TSK-08-06: HEX 하드코딩 제거, CSS 변수 사용
 */
function getDocumentColor(doc: DocumentInfo): string {
  return DOCUMENT_TYPE_CONFIG[doc.type]?.color || 'var(--color-text-muted)'
}
```

**변경 내용**: HEX 값 `'#6b7280'` → CSS 변수 `'var(--color-text-muted)'`

**변경 근거**: CSS 클래스 중앙화 원칙 준수, 테마 변경 시 일관성 유지

---

### 2.3 app/components/wbs/detail/TaskProgress.vue

**수정 위치**: Line 220-256 (scoped style)

**Before**:
```css
.workflow-step-current {
  background-color: #3b82f6; /* blue-500 */
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.workflow-step-completed {
  background-color: #22c55e; /* green-500 */
}

.workflow-step-pending {
  background-color: #e5e7eb; /* gray-200 */
  border: 2px solid #d1d5db; /* gray-300 */
}

.workflow-connector-completed {
  background-color: #22c55e; /* green-500 */
}

.workflow-connector-pending {
  background-color: #d1d5db; /* gray-300 */
}
```

**After**:
```css
/* 워크플로우 단계 원형 (TSK-08-06: HEX 하드코딩 제거) */
.workflow-step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-in-out;
}

.workflow-step-current {
  @apply workflow-step-current;
}

.workflow-step-completed {
  @apply workflow-step-completed;
}

.workflow-step-pending {
  @apply workflow-step-pending;
}

.workflow-connector-completed {
  @apply bg-success;
}

.workflow-connector-pending {
  @apply bg-gray-300;
}
```

**변경 내용**: HEX 색상 6건을 Tailwind 클래스로 변경

**변경 근거**: main.css에 이미 정의된 workflow-step-* 클래스 재사용

---

### 2.4 app/components/wbs/WbsSearchBox.vue

**수정 위치**: Line 56, 62

**Before**:
```vue
<i class="pi pi-search text-[#888888]" />
<InputText
  class="w-full bg-[#1e1e38] border-[#3d3d5c] text-[#e8e8e8] ..."
/>
```

**After**:
```vue
<i class="pi pi-search text-text-secondary" />
<InputText
  class="w-full bg-bg-card border-border text-text ..."
/>
```

**변경 내용**: 인라인 HEX 색상 2건을 Tailwind 클래스로 변경

**변경 근거**: 일관된 테마 적용, 재사용 가능한 클래스 활용

---

### 2.5 app/components/wbs/WbsSummaryCards.vue

**수정 위치**: Line 76, 90

**Before**:
```vue
<Card class="bg-[#1e1e38] border border-[#3d3d5c]" />
<div class="text-sm text-[#888888] mt-1 uppercase">
```

**After**:
```vue
<Card class="bg-bg-card border border-border" />
<div class="text-sm text-text-secondary mt-1 uppercase">
```

**변경 내용**: 인라인 HEX 색상 2건을 Tailwind 클래스로 변경

**변경 근거**: 배경색과 보더색을 테마 변수로 통일

---

### 2.6 app/components/wbs/WbsTreeHeader.vue

**수정 위치**: Line 34, 41

**Before**:
```vue
<div class="wbs-tree-header bg-[#16213e] border-b border-[#3d3d5c] p-4">
<h2 class="text-lg font-semibold text-[#e8e8e8] flex items-center gap-2">
```

**After**:
```vue
<div class="wbs-tree-header bg-bg-header border-b border-border p-4">
<h2 class="text-lg font-semibold text-text flex items-center gap-2">
```

**변경 내용**: 인라인 HEX 색상 2건을 Tailwind 클래스로 변경

**변경 근거**: 헤더 배경과 텍스트 색상을 테마 변수로 통일

---

### 2.7 app/components/wbs/WbsTreeNode.vue

**수정 위치**: Line 143, 147, 166

**Before**:
```css
.wbs-tree-node.selected {
  background-color: rgba(59, 130, 246, 0.15);
  border-left: 3px solid #3b82f6;
}

.wbs-tree-node:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.node-title {
  color: #ffffff;
}
```

**After**:
```css
.wbs-tree-node.selected {
  @apply bg-primary/15 border-l-[3px] border-primary;
}

.wbs-tree-node:focus-visible {
  @apply outline-2 outline-primary outline-offset-2;
}

.node-title {
  @apply text-white;
}
```

**변경 내용**: 인라인 HEX 색상 3건을 Tailwind 클래스로 변경

**변경 근거**: 선택 상태, 포커스 링, 텍스트 색상 통일

---

## 3. 검증 결과

### 3.1 HEX 하드코딩 제거 검증

**검색 명령어**:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" app/components/wbs --include="*.vue" | grep -v "//" | grep -v "main.css" | grep -v "#default"
```

**결과**: 0건 (모든 HEX 하드코딩 제거 완료)

### 3.2 TypeScript 타입 체크

**실행**: `npm run typecheck` (예정)

**예상 결과**: 타입 오류 없음

### 3.3 Lint 검사

**실행**: `npm run lint:fix` (예정)

**예상 결과**: 코드 스타일 오류 없음

---

## 4. 인수 기준 검증

| 인수 기준 | 상태 | 검증 방법 |
|---------|------|----------|
| AC-01: PrimeVue 디자인 토큰 정의 | ✅ 완료 | main.css Line 171-300 확인 |
| AC-02: jjiban 다크 테마 CSS 변수 참조 | ✅ 완료 | 모든 토큰이 var(--color-*) 사용 |
| AC-03: HEX 하드코딩 제거 | ✅ 완료 | grep 검색 결과 0건 |
| AC-04: 기존 E2E 테스트 100% 통과 | ⏳ 보류 | Phase 3에서 실행 예정 |
| AC-05: 신규 E2E 테스트 통과 | ⏳ 보류 | Phase 3에서 작성 예정 |

---

## 5. 알려진 이슈 및 제한 사항

**없음** - 설계대로 정확히 구현 완료

---

## 6. 다음 단계

### 6.1 Phase 3: E2E 테스트 작성 (예정)

1. `tests/e2e/theme-integration.spec.ts` 생성
2. TC-01 ~ TC-08 테스트 케이스 작성
3. 기존 테스트 파일 수정 (wbs-tree-panel.spec.ts, layout.spec.ts, header.spec.ts)

### 6.2 검증 및 완료

1. E2E 테스트 전체 실행
2. 스크린샷 확인
3. 접근성 검증 (WCAG 2.1)
4. 사용자 매뉴얼 작성 (080-user-manual.md)

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 화면설계: `011-ui-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md` (예정)
- 테스트 명세: `026-test-specification.md` (예정)
- 사용자 매뉴얼: `080-user-manual.md` (예정)

---

<!--
author: Claude Sonnet 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
