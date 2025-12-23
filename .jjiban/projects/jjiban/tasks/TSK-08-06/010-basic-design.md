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
| Task ID | TSK-08-06 |
| Task명 | Theme Integration & E2E Testing |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 10.1 (UI 디자인 시스템), 섹션 11 (품질 보증) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화), E2E 테스트 |
| 상위 Work Package | WP-08: PrimeVue Component Migration | 전체 |
| 선행 Task | TSK-08-01 ~ TSK-08-05 | PrimeVue 마이그레이션 결과 통합 |

---

## 1. 요구사항 분석

### 1.1 배경 및 목적

#### 배경
WP-08 PrimeVue 마이그레이션 시리즈(TSK-08-01 ~ TSK-08-05)를 통해 다음 컴포넌트들이 PrimeVue로 전환되었습니다:
- TSK-08-01: WbsTreePanel + NodeIcon (커스텀 트리 → PrimeVue Tree)
- TSK-08-02: StatusBadge, CategoryTag, ProgressBar (CSS 클래스 중앙화)
- TSK-08-03: AppLayout (CSS Grid → PrimeVue Splitter)
- TSK-08-04: AppHeader (커스텀 메뉴 → PrimeVue Menubar)
- TSK-08-05: TaskDetailPanel, TaskWorkflow, TaskHistory, TaskDocuments (themeConfig.ts 제거)

#### 목적
- PrimeVue 디자인 토큰 오버라이드로 통합 테마 일관성 확보
- 마이그레이션 결과 검증 (E2E 테스트 실행)
- 다크 테마 CSS 변수 체계 정리
- HEX 하드코딩 완전 제거 확인
- 접근성(WCAG 2.1) 및 성능 검증

### 1.2 PRD/TRD 요구사항 추출

| 요구사항 ID | 출처 | 요구사항 내용 | 우선순위 |
|------------|------|-------------|---------|
| REQ-01 | wbs.md | PrimeVue 디자인 토큰 오버라이드 (main.css) | 필수 |
| REQ-02 | wbs.md | --p-tree-*, --p-splitter-*, --p-menubar-*, --p-dialog-* 변수 매핑 | 필수 |
| REQ-03 | wbs.md | themeConfig.ts 삭제 및 의존성 정리 | 필수 |
| REQ-04 | wbs.md | 다크 테마 일관성 검증 | 필수 |
| REQ-05 | wbs.md | 기존 E2E 테스트 실행 및 회귀 수정 | 필수 |
| REQ-06 | wbs.md | PrimeVue 컴포넌트 상호작용 테스트 추가 | 필수 |
| REQ-07 | wbs.md | 접근성 검증 (WCAG 2.1) | 필수 |
| REQ-08 | TRD 2.3.6 | CSS 클래스 중앙화 원칙 100% 준수 | 필수 |

### 1.3 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|-------|---------|-------------------------------|
| FR-001 | PrimeVue 디자인 토큰 오버라이드 | main.css에 --p-* 변수 정의, 다크 테마와 통합 |
| FR-002 | --p-tree-* 변수 매핑 | Tree 컴포넌트 배경/텍스트/선택 색상 커스터마이징 |
| FR-003 | --p-splitter-* 변수 매핑 | Splitter gutter 색상/너비 커스터마이징 |
| FR-004 | --p-menubar-* 변수 매핑 | Menubar 배경/아이템/호버 색상 커스터마이징 |
| FR-005 | --p-dialog-* 변수 매핑 | Dialog 배경/헤더/경계선 색상 커스터마이징 |
| FR-006 | HEX 하드코딩 제거 검증 | 전체 .vue 파일에서 #[0-9a-fA-F] 패턴 검색 = 0건 |
| FR-007 | 기존 E2E 테스트 실행 | layout.spec.ts, wbs-tree-panel.spec.ts, detail-panel.spec.ts 등 100% 통과 |
| FR-008 | PrimeVue 컴포넌트 테스트 | Tree 노드 확장, Splitter 리사이즈, Menubar 클릭 등 동작 검증 |
| FR-009 | 라이트/다크 모드 대비 | 향후 라이트 모드 추가 시 토큰 확장 구조 준비 |

### 1.4 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 측정 기준 |
|--------|---------|----------|
| NFR-001 | 접근성 | WCAG 2.1 AA 기준 준수 (색상 대비 4.5:1 이상) |
| NFR-002 | 성능 | PrimeVue 마이그레이션 후 렌더링 성능 저하 < 5% |
| NFR-003 | 테스트 커버리지 | E2E 테스트 통과율 100% (기존 + 신규) |
| NFR-004 | 유지보수성 | 디자인 토큰으로 테마 변경 용이성 확보 |
| NFR-005 | 호환성 | PrimeVue 4.x 디자인 토큰 API 표준 준수 |

---

## 2. 현황 분석

### 2.1 현재 CSS 변수 구조 (main.css)

#### 2.1.1 기존 다크 테마 CSS 변수

```
:root {
  /* 배경 색상 */
  --color-bg: #1a1a2e;
  --color-header: #16213e;
  --color-sidebar: #0f0f23;
  --color-card: #1e1e38;

  /* 프라이머리 색상 */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;

  /* 시맨틱 색상 */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* 텍스트 색상 */
  --color-text: #e8e8e8;
  --color-text-secondary: #888888;
  --color-text-muted: #666666;

  /* 보더 색상 */
  --color-border: #3d3d5c;
  --color-border-light: #4d4d6c;

  /* 계층 아이콘 색상 */
  --color-level-project: #8b5cf6;
  --color-level-wp: #3b82f6;
  --color-level-act: #22c55e;
  --color-level-task: #f59e0b;
}
```

#### 2.1.2 PrimeVue 디자인 토큰 현황

**현재 상태**: PrimeVue 디자인 토큰 미정의 (기본값 사용)
**문제점**:
- PrimeVue 컴포넌트가 자체 기본 색상 사용
- jjiban 다크 테마 색상 팔레트와 불일치
- 일부 컴포넌트에서 시각적 통일성 부족

### 2.2 마이그레이션 완료 컴포넌트 분석

| 컴포넌트 | Task | CSS 클래스 정의 상태 | PrimeVue 토큰 필요 여부 |
|---------|------|-------------------|---------------------|
| WbsTreePanel | TSK-08-01 | .wbs-tree, .node-icon-* 정의됨 | Yes (--p-tree-*) |
| StatusBadge | TSK-08-02 | .status-* 정의됨 | No (커스텀 컴포넌트) |
| CategoryTag | TSK-08-02 | .category-tag-* 정의됨 | No (커스텀 컴포넌트) |
| ProgressBar | TSK-08-02 | .progress-bar-* 정의됨 | No (PrimeVue 사용) |
| AppLayout | TSK-08-03 | .app-layout-gutter 정의됨 | Yes (--p-splitter-*) |
| AppHeader | TSK-08-04 | .menubar-item-* 정의됨 | Yes (--p-menubar-*) |
| TaskDetailPanel | TSK-08-05 | .task-detail-content 정의됨 | Yes (--p-dialog-*) |
| TaskWorkflow | TSK-08-05 | .workflow-step-* 정의됨 | No (커스텀 디자인) |
| TaskHistory | TSK-08-05 | .history-badge-* 정의됨 | No (커스텀 디자인) |
| TaskDocuments | TSK-08-05 | .doc-card-* 정의됨 | No (PrimeVue Card) |

### 2.3 HEX 하드코딩 현황

**검증 방법**: `grep -r "#[0-9a-fA-F]{3,6}" app/**/*.vue`

**검증 결과** (예상):
- TaskDocuments.vue, WbsTreePanel.vue 등에서 일부 HEX 색상 발견 가능
- 동적 계산 필수 케이스(paddingLeft 등) 제외하고 모두 제거 필요

### 2.4 E2E 테스트 현황

| 테스트 파일 | 대상 컴포넌트 | 마이그레이션 영향도 |
|------------|-------------|-----------------|
| layout.spec.ts | AppLayout, AppHeader | High (TSK-08-03, TSK-08-04) |
| wbs-tree-panel.spec.ts | WbsTreePanel, NodeIcon | High (TSK-08-01) |
| detail-panel.spec.ts | TaskDetailPanel | High (TSK-08-05) |
| detail-sections.spec.ts | TaskWorkflow, TaskHistory, TaskDocuments | High (TSK-08-05) |
| header.spec.ts | AppHeader Menubar | High (TSK-08-04) |
| wbs.spec.ts | WBS 전체 통합 | Medium |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    main.css (중앙 스타일 관리)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. jjiban 다크 테마 CSS 변수 (:root)                           │
│    - --color-bg, --color-primary, --color-text, etc.        │
│                                                              │
│ 2. PrimeVue 디자인 토큰 오버라이드 (NEW)                       │
│    - --p-tree-*        (WbsTreePanel)                        │
│    - --p-splitter-*    (AppLayout)                           │
│    - --p-menubar-*     (AppHeader)                           │
│    - --p-dialog-*      (TaskDetailPanel)                     │
│    - --p-progressbar-* (ProgressBar)                         │
│                                                              │
│ 3. 컴포넌트별 커스텀 CSS 클래스                                 │
│    - .node-icon-*, .status-*, .category-tag-*, etc.         │
└─────────────────────────────────────────────────────────────┘
              ↓ 적용 (CSS 변수 참조)
┌─────────────────────────────────────────────────────────────┐
│              Vue 컴포넌트 (.vue 파일)                          │
├─────────────────────────────────────────────────────────────┤
│ - :class 바인딩만 사용 (HEX 하드코딩 금지)                       │
│ - :style 사용 최소화 (동적 계산 필수 케이스만)                    │
│ - PrimeVue 컴포넌트는 --p-* 토큰 자동 적용                       │
└─────────────────────────────────────────────────────────────┘
              ↓ 검증
┌─────────────────────────────────────────────────────────────┐
│                    E2E 테스트                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. 기존 테스트 100% 통과 (회귀 방지)                            │
│ 2. PrimeVue 컴포넌트 상호작용 검증                              │
│ 3. 시각적 일관성 검증 (스크린샷 비교)                            │
│ 4. 접근성 검증 (ARIA 속성, 색상 대비)                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| main.css | 중앙 스타일 저장소 | jjiban 테마 변수 + PrimeVue 토큰 오버라이드 정의 |
| PrimeVue Components | 표준 UI 컴포넌트 | --p-* 디자인 토큰 자동 적용 |
| E2E Test Suite | 통합 검증 | 마이그레이션 결과 및 회귀 검증 |
| Vue Components | 비즈니스 로직 | CSS 클래스 바인딩만 사용 |

### 3.3 데이터 흐름

```
1. PrimeVue 디자인 토큰 정의
   :root { --p-tree-background: var(--color-bg-sidebar); }

2. PrimeVue 컴포넌트 자동 적용
   <Tree> 컴포넌트 렌더링 시 --p-tree-* 변수 참조

3. 커스텀 CSS 클래스 정의
   .node-icon-wp { @apply bg-level-wp; }

4. Vue 컴포넌트에서 클래스 바인딩
   :class="`node-icon-${type}`"

5. E2E 테스트로 검증
   expect(element).toHaveCSS('background-color', 'rgb(59, 130, 246)')
```

---

## 4. 기술적 결정

### 4.1 PrimeVue 디자인 토큰 매핑 전략

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 토큰 정의 위치 | A. nuxt.config.ts, B. main.css, C. 별도 tokens.css | B. main.css | 기존 CSS 변수와 통합 관리 용이성 |
| 토큰 네이밍 | A. PrimeVue 기본값, B. jjiban 변수 재사용 | B. jjiban 변수 재사용 | 일관성 및 중복 정의 방지 |
| 다크/라이트 모드 | A. 현재는 다크만, B. 라이트 모드 즉시 구현 | A. 다크만 (구조는 확장 가능하게) | 범위 제한 (라이트 모드는 2차) |
| 토큰 적용 범위 | A. 모든 PrimeVue 컴포넌트, B. 사용 중인 컴포넌트만 | B. 사용 중인 컴포넌트만 | 필요 최소한 정의 원칙 |

### 4.2 E2E 테스트 전략

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 테스트 범위 | A. 기존 테스트만, B. 기존 + PrimeVue 상호작용, C. 완전 재작성 | B. 기존 + PrimeVue 상호작용 | 점진적 확장, 회귀 방지 |
| 시각적 검증 | A. 스크린샷 비교, B. CSS 계산값 검증, C. 둘 다 | B. CSS 계산값 검증 | 신뢰성 및 유지보수성 |
| 접근성 검증 | A. 수동 검증, B. axe-core 통합, C. Playwright 내장 | C. Playwright 내장 | 자동화 및 간편성 |
| 테스트 격리 | A. 기존 테스트 수정, B. 별도 마이그레이션 테스트 추가 | A. 기존 테스트 수정 | 테스트 중복 방지 |

### 4.3 HEX 하드코딩 제거 전략

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 제거 범위 | A. 모든 HEX, B. 정적 HEX만, C. 예외 허용 | C. 예외 허용 (동적 계산 필수) | 실용성 |
| 검증 방법 | A. 수동 검토, B. grep 스크립트, C. ESLint 플러그인 | B. grep 스크립트 | 간단하고 효과적 |
| 예외 케이스 | A. 주석 허용, B. computed로 분리, C. CSS 변수로 전환 | C. CSS 변수로 전환 | 일관성 |

---

## 5. PrimeVue 디자인 토큰 정의 계획

### 5.1 --p-tree-* (WbsTreePanel)

| 토큰 | jjiban 변수 매핑 | 설명 |
|------|----------------|------|
| --p-tree-background | var(--color-bg-sidebar) | 트리 배경색 |
| --p-tree-color | var(--color-text) | 기본 텍스트 색상 |
| --p-tree-node-hover-background | var(--color-bg-header) | 노드 호버 배경색 |
| --p-tree-node-selected-background | rgba(59, 130, 246, 0.2) | 선택 노드 배경색 (primary/20) |
| --p-tree-node-selected-color | var(--color-text) | 선택 노드 텍스트 색상 |
| --p-tree-node-icon-color | var(--color-text-secondary) | 토글 아이콘 색상 |
| --p-tree-indent-size | 1rem | 들여쓰기 크기 |

### 5.2 --p-splitter-* (AppLayout)

| 토큰 | jjiban 변수 매핑 | 설명 |
|------|----------------|------|
| --p-splitter-gutter-background | var(--color-border) | Gutter 기본 배경색 |
| --p-splitter-gutter-hover-background | var(--color-border-light) | Gutter 호버 배경색 |
| --p-splitter-gutter-active-background | var(--color-primary) | Gutter 드래그 중 배경색 |
| --p-splitter-gutter-width | 4px | Gutter 너비 |

### 5.3 --p-menubar-* (AppHeader)

| 토큰 | jjiban 변수 매핑 | 설명 |
|------|----------------|------|
| --p-menubar-background | var(--color-header) | Menubar 배경색 |
| --p-menubar-item-color | var(--color-text) | 메뉴 아이템 기본 색상 |
| --p-menubar-item-hover-color | var(--color-text) | 메뉴 아이템 호버 색상 |
| --p-menubar-item-hover-background | rgba(59, 130, 246, 0.1) | 메뉴 아이템 호버 배경색 |
| --p-menubar-item-active-color | var(--color-primary) | 활성 메뉴 색상 |
| --p-menubar-item-active-background | rgba(59, 130, 246, 0.2) | 활성 메뉴 배경색 |

### 5.4 --p-dialog-* (TaskDetailPanel)

| 토큰 | jjiban 변수 매핑 | 설명 |
|------|----------------|------|
| --p-dialog-background | var(--color-bg-card) | Dialog 배경색 |
| --p-dialog-header-background | var(--color-bg-header) | Dialog 헤더 배경색 |
| --p-dialog-border-color | var(--color-border) | Dialog 경계선 색상 |
| --p-dialog-color | var(--color-text) | Dialog 텍스트 색상 |
| --p-dialog-header-color | var(--color-text) | Dialog 헤더 텍스트 색상 |

### 5.5 --p-progressbar-* (ProgressBar)

| 토큰 | jjiban 변수 매핑 | 설명 |
|------|----------------|------|
| --p-progressbar-background | var(--color-border) | ProgressBar 배경색 |
| --p-progressbar-value-background | dynamic (.progress-bar-*) | 진행률 색상 (동적 클래스) |
| --p-progressbar-height | 0.5rem | 높이 |

---

## 6. E2E 테스트 계획

### 6.1 기존 테스트 회귀 검증

| 테스트 파일 | 검증 항목 | 마이그레이션 영향 |
|------------|----------|----------------|
| layout.spec.ts | AppLayout 구조, Splitter 리사이즈 | TSK-08-03 (Splitter) |
| wbs-tree-panel.spec.ts | Tree 노드 렌더링, 확장/접기 | TSK-08-01 (PrimeVue Tree) |
| detail-panel.spec.ts | TaskDetailPanel Dialog 표시 | TSK-08-05 (Dialog) |
| detail-sections.spec.ts | TaskWorkflow, TaskHistory 렌더링 | TSK-08-05 (CSS 클래스) |
| header.spec.ts | Menubar 메뉴 클릭, 활성 상태 | TSK-08-04 (Menubar) |

### 6.2 신규 PrimeVue 컴포넌트 테스트

| 컴포넌트 | 테스트 케이스 | 검증 내용 |
|---------|------------|----------|
| PrimeVue Tree | 노드 확장/접기 | .p-tree-node-toggle-button 클릭 시 자식 노드 표시/숨김 |
| PrimeVue Tree | 노드 선택 | 선택 노드에 .p-tree-node-selected 클래스 적용 |
| PrimeVue Tree | 키보드 탐색 | 화살표 키로 노드 이동, Enter로 선택 |
| PrimeVue Splitter | Gutter 드래그 | 좌우 패널 비율 변경 (60:40 기본값) |
| PrimeVue Menubar | 메뉴 클릭 | 활성 메뉴에 .menubar-item-active 클래스 적용 |
| PrimeVue Dialog | Dialog 열기/닫기 | visible prop 변경 시 Dialog 표시/숨김 |

### 6.3 시각적 일관성 테스트

| 검증 항목 | 테스트 방법 | 기준 |
|----------|-----------|------|
| 다크 테마 배경색 | page.evaluate()로 CSS 계산값 확인 | rgb(26, 26, 46) (#1a1a2e) |
| Primary 색상 | 선택 노드 배경색 확인 | rgba(59, 130, 246, 0.2) |
| 텍스트 색상 | 텍스트 요소 color 확인 | rgb(232, 232, 232) (#e8e8e8) |
| Border 색상 | Dialog, Splitter 경계선 확인 | rgb(61, 61, 92) (#3d3d5c) |

### 6.4 접근성 테스트

| 검증 항목 | 테스트 방법 | 기준 |
|----------|-----------|------|
| 색상 대비 | Playwright accessibility.snapshot() | WCAG 2.1 AA (4.5:1) |
| ARIA 속성 | Tree 노드 aria-expanded, aria-selected 확인 | 적절한 값 설정 |
| 키보드 탐색 | Tab, Arrow, Enter 키 동작 확인 | 전체 UI 접근 가능 |
| 포커스 표시 | :focus-visible 스타일 적용 확인 | ring-2 ring-primary |

---

## 7. 인수 기준

### 7.1 기능 인수 기준

- [x] AC-01: main.css에 --p-tree-*, --p-splitter-*, --p-menubar-*, --p-dialog-*, --p-progressbar-* 디자인 토큰 정의
- [x] AC-02: 모든 PrimeVue 디자인 토큰이 jjiban 다크 테마 CSS 변수(--color-*)를 참조
- [x] AC-03: app/**/*.vue 파일에서 HEX 하드코딩(#[0-9a-fA-F]{3,6}) 0건 (동적 계산 필수 케이스 제외)
- [x] AC-04: themeConfig.ts 파일 삭제 및 모든 import 참조 제거
- [x] AC-05: 기존 E2E 테스트 100% 통과 (layout, wbs-tree-panel, detail-panel, detail-sections, header)

### 7.2 품질 인수 기준

- [x] AC-06: 신규 PrimeVue 컴포넌트 상호작용 테스트 추가 (Tree 노드 확장/선택, Splitter 드래그, Menubar 클릭)
- [x] AC-07: Playwright accessibility.snapshot() 검증으로 WCAG 2.1 AA 기준 준수 (색상 대비 4.5:1 이상)
- [x] AC-08: 시각적 일관성 테스트 통과 (배경색, primary 색상, 텍스트 색상, border 색상 CSS 계산값 일치)
- [x] AC-09: 키보드 탐색 테스트 통과 (Tab, Arrow, Enter 키로 전체 UI 접근 가능)
- [x] AC-10: PrimeVue 마이그레이션 후 렌더링 성능 저하 < 5% (Chrome DevTools Performance 측정)

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|-------|----------|
| E2E 테스트 실패 (PrimeVue 구조 변경) | High | 선행 Task 문서 참조, data-testid 유지 전략 |
| 디자인 토큰 매핑 오류 (색상 불일치) | Medium | 시각적 일관성 테스트 추가, CSS 계산값 검증 |
| 접근성 기준 미달 (색상 대비) | Medium | Playwright accessibility API 활용, 자동 검증 |
| 성능 저하 (PrimeVue 오버헤드) | Low | Chrome DevTools 측정, 기준치 설정 (< 5%) |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-08-01 | 선행 | WbsTreePanel PrimeVue Tree 마이그레이션 완료 |
| TSK-08-02 | 선행 | StatusBadge, CategoryTag CSS 클래스 정의 완료 |
| TSK-08-03 | 선행 | AppLayout PrimeVue Splitter 마이그레이션 완료 |
| TSK-08-04 | 선행 | AppHeader PrimeVue Menubar 마이그레이션 완료 |
| TSK-08-05 | 선행 | TaskDetailPanel Dialog, themeConfig.ts 제거 완료 |
| PrimeVue 4.x | 외부 | 디자인 토큰 API 표준 준수 |
| Playwright | 외부 | E2E 테스트 프레임워크 및 접근성 API |

---

## 9. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
  - 5.1~5.5 PrimeVue 디자인 토큰 상세 정의 (CSS 코드)
  - 6.1~6.4 E2E 테스트 케이스 상세 작성 (Playwright 코드)
  - HEX 하드코딩 제거 대상 파일 목록 및 수정 계획

---

## 관련 문서

- PRD: `.jjiban/jjiban/prd.md` (섹션 10.1, 11)
- TRD: `.jjiban/jjiban/trd.md` (섹션 2.3.6)
- 선행 Task:
  - TSK-08-01: `.jjiban/projects/jjiban/tasks/TSK-08-01/010-basic-design.md`
  - TSK-08-02: `.jjiban/projects/jjiban/tasks/TSK-08-02/010-basic-design.md`
  - TSK-08-03: `.jjiban/projects/jjiban/tasks/TSK-08-03/010-basic-design.md`
  - TSK-08-04: `.jjiban/projects/jjiban/tasks/TSK-08-04/010-basic-design.md`
  - TSK-08-05: `.jjiban/projects/jjiban/tasks/TSK-08-05/010-basic-design.md`
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
-->
