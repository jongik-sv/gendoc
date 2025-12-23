# 화면설계 (011-ui-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **UI 설계 규칙**
> * 와이어프레임 및 레이아웃 구조 명시
> * 컴포넌트 계층 및 반응형 동작 정의
> * CSS 클래스 중앙화 원칙 준수
> * 접근성(ARIA) 및 테스트 속성 포함

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-04 |
| Task명 | AppHeader PrimeVue Menubar Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-08-04/010-basic-design.md` |
| 현재 컴포넌트 | `app/components/layout/AppHeader.vue` |
| CSS 스타일 | `app/assets/css/main.css` |

---

## 1. 컴포넌트 와이어프레임

### 1.1 전체 레이아웃 구조

```
┌────────────────────────────────────────────────────────────────────┐
│ AppHeader (PrimeVue Menubar)                                       │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────┬──────────────────────────────────────────┬──────────────┐ │
│ │ Start│          Menu Items (Center)             │    End       │ │
│ │      │                                          │              │ │
│ │Logo  │  [대시보드] [칸반] [WBS] [Gantt]        │ 프로젝트명   │ │
│ │      │    (disabled) (disabled) (active) (dis.)  │              │ │
│ └──────┴──────────────────────────────────────────┴──────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

**레이아웃 비율**:
- Start (로고): 고정 너비 (~100px)
- Center (메뉴): 가변 너비 (flex-grow)
- End (프로젝트명): 고정 최대 너비 (max-w-[200px])

### 1.2 현재 구조 vs 변경 후 구조

#### Before (커스텀 버튼 네비게이션)

```html
<header class="flex justify-between">
  <!-- 좌측 로고 -->
  <div>
    <NuxtLink>jjiban</NuxtLink>
  </div>

  <!-- 중앙 메뉴 -->
  <nav class="flex gap-2">
    <button v-for="item">{{ item.label }}</button>
  </nav>

  <!-- 우측 프로젝트명 -->
  <div>
    <span>{{ projectName }}</span>
  </div>
</header>
```

#### After (PrimeVue Menubar)

```html
<header>
  <Menubar :model="menuModel" :pt="menubarPT">
    <!-- start 슬롯: 로고 -->
    <template #start>
      <NuxtLink>jjiban</NuxtLink>
    </template>

    <!-- item 템플릿: 활성 하이라이팅 -->
    <template #item="{ item, props }">
      <a v-bind="props.action" :class="getMenuItemClass(item)">
        {{ item.label }}
      </a>
    </template>

    <!-- end 슬롯: 프로젝트명 -->
    <template #end>
      <span>{{ projectName }}</span>
    </template>
  </Menubar>
</header>
```

---

## 2. 레이아웃 상세 설계

### 2.1 Header 컨테이너

**HTML 구조**:

```html
<header
  data-testid="app-header"
  class="h-full w-full bg-bg-header"
  role="banner"
>
  <Menubar :model="menuModel" :pt="menubarPassThrough">
    <!-- 슬롯 내용 -->
  </Menubar>
</header>
```

**CSS 클래스 (main.css)**:

```css
/* Header 배경 (CSS 변수 사용) */
.bg-bg-header {
  background-color: var(--color-header); /* #16213e */
}
```

### 2.2 Start 슬롯 (로고)

**HTML 구조**:

```html
<template #start>
  <NuxtLink
    to="/wbs"
    data-testid="app-logo"
    class="menubar-logo"
    aria-label="홈으로 이동"
  >
    jjiban
  </NuxtLink>
</template>
```

**CSS 클래스 (main.css)**:

```css
/* 로고 스타일 */
.menubar-logo {
  @apply text-xl font-bold text-primary hover:opacity-80 transition-opacity;
}
```

**시각적 명세**:
- 폰트: 20px (text-xl), Bold
- 색상: Primary (#3b82f6)
- Hover: 투명도 80%
- 트랜지션: opacity 200ms

### 2.3 Center (메뉴 아이템)

#### 2.3.1 MenuItem 모델 구조

```typescript
interface MenuItem {
  key: string          // 'dashboard' | 'kanban' | 'wbs' | 'gantt'
  label: string        // '대시보드' | '칸반' | 'WBS' | 'Gantt'
  icon: string         // PrimeIcons (현재 미사용)
  to: string           // '/dashboard' | '/kanban' | '/wbs' | '/gantt'
  disabled: boolean    // true (대시보드, 칸반, Gantt), false (WBS)
  command: (event) => void
}
```

#### 2.3.2 메뉴 아이템 HTML 구조

```html
<template #item="{ item, props }">
  <a
    v-bind="props.action"
    :data-testid="`nav-menu-${item.key}`"
    :class="{
      'menubar-item': true,
      'menubar-item-active': isActiveRoute(item),
      'menubar-item-disabled': item.disabled
    }"
    :aria-current="isActiveRoute(item) ? 'page' : undefined"
    :aria-disabled="item.disabled ? 'true' : undefined"
    :aria-label="item.disabled ? `${item.label} (준비 중)` : item.label"
  >
    <span>{{ item.label }}</span>
  </a>
</template>
```

#### 2.3.3 메뉴 아이템 CSS 클래스 (main.css)

```css
/* ============================================
 * AppHeader Menubar 스타일 (TSK-08-04)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* Menubar 루트 */
.app-menubar {
  @apply h-full px-4 bg-bg-header;
}

/* Menubar 메뉴 컨테이너 */
.app-menubar-menu {
  @apply flex items-center gap-2;
}

/* 메뉴 아이템 - 기본 스타일 */
.menubar-item {
  @apply px-4 py-2 rounded text-sm font-medium transition-colors duration-200;
}

/* 메뉴 아이템 - 활성 상태 (현재 페이지) */
.menubar-item-active {
  @apply text-primary bg-primary/20;
}

/* 메뉴 아이템 - 비활성 상태 (disabled) */
.menubar-item-disabled {
  @apply text-text-muted opacity-50 cursor-not-allowed;
}

/* 메뉴 아이템 - 호버 (활성 메뉴만) */
.menubar-item:not(.menubar-item-disabled):not(.menubar-item-active):hover {
  @apply text-text bg-surface-50;
}
```

#### 2.3.4 메뉴 상태별 시각적 명세

| 상태 | 배경색 | 텍스트 색상 | Opacity | Cursor |
|------|--------|------------|---------|--------|
| 활성 (현재 페이지) | Primary/20 (#3b82f6/20) | Primary (#3b82f6) | 100% | pointer |
| 비활성 (disabled) | 없음 | text-muted (#666666) | 50% | not-allowed |
| 기본 (다른 페이지) | 없음 | text-secondary (#888888) | 100% | pointer |
| Hover (활성 메뉴만) | surface-50 | text (#e8e8e8) | 100% | pointer |

**시각적 예시**:

```
┌─────────────────────────────────────────────────────┐
│ [대시보드]  [칸반]  [WBS]  [Gantt]                  │
│  (disabled) (disabled) (active) (disabled)          │
│   #666/50%  #666/50%  #3b82f6  #666/50%            │
└─────────────────────────────────────────────────────┘
```

### 2.4 End 슬롯 (프로젝트명)

**HTML 구조**:

```html
<template #end>
  <span
    data-testid="project-name"
    :class="projectNameClass"
  >
    {{ displayProjectName }}
  </span>
</template>
```

**Computed 속성**:

```typescript
const displayProjectName = computed(() => {
  return props.projectName || projectStore.projectName || '프로젝트를 선택하세요'
})

const projectNameClass = computed(() => {
  const hasProject = !!(props.projectName || projectStore.projectName)
  return hasProject
    ? 'menubar-project-name'
    : 'menubar-project-name-empty'
})
```

**CSS 클래스 (main.css)**:

```css
/* 프로젝트명 - 선택된 경우 */
.menubar-project-name {
  @apply text-sm max-w-[200px] truncate text-text-secondary;
}

/* 프로젝트명 - 미선택 (안내 메시지) */
.menubar-project-name-empty {
  @apply text-sm max-w-[200px] truncate text-text-muted italic;
}
```

**시각적 명세**:
- 폰트: 14px (text-sm)
- 최대 너비: 200px (truncate 적용)
- 색상:
  - 선택됨: text-secondary (#888888)
  - 미선택: text-muted (#666666), italic

---

## 3. Pass Through API 설계

### 3.1 Pass Through 옵션

```typescript
import type { MenubarPassThroughOptions } from 'primevue/menubar'

const menubarPassThrough = computed<MenubarPassThroughOptions>(() => ({
  root: {
    class: 'app-menubar'
  },
  menu: {
    class: 'app-menubar-menu'
  },
  menuitem: {
    class: 'app-menubar-menuitem'
  },
  action: {
    class: 'app-menubar-action'
  },
  start: {
    class: 'app-menubar-start'
  },
  end: {
    class: 'app-menubar-end'
  }
}))
```

### 3.2 Pass Through 클래스 매핑

| PrimeVue 요소 | Pass Through 속성 | CSS 클래스 |
|--------------|------------------|-----------|
| Menubar 루트 | root | app-menubar |
| 메뉴 컨테이너 | menu | app-menubar-menu |
| 메뉴 아이템 | menuitem | app-menubar-menuitem |
| 메뉴 액션 | action | app-menubar-action |
| start 슬롯 | start | app-menubar-start |
| end 슬롯 | end | app-menubar-end |

---

## 4. 반응형 설계

### 4.1 브레이크포인트 전략

| 디바이스 | 너비 | 레이아웃 변경 |
|---------|------|-------------|
| Desktop | ≥1200px | 기본 레이아웃 (좌/중/우) |
| Tablet | 768px~1199px | 기본 레이아웃 유지 (최소 스크롤바) |
| Mobile | <768px | **Phase 1에서는 미지원** |

**Phase 1 제약사항**:
- 최소 너비: 1200px (AppLayout.vue와 동일)
- 모바일 최적화는 향후 Task로 이관

### 4.2 반응형 CSS (향후 확장)

```css
/* 태블릿 (미래 구현) */
@media (max-width: 1199px) {
  .menubar-logo {
    @apply text-lg; /* 18px */
  }

  .menubar-item {
    @apply px-3 py-1.5 text-xs;
  }

  .menubar-project-name {
    @apply max-w-[150px];
  }
}

/* 모바일 (미래 구현) */
@media (max-width: 767px) {
  /* 햄버거 메뉴로 전환 필요 */
}
```

---

## 5. 접근성 설계

### 5.1 ARIA 속성 매핑

| 요소 | ARIA 속성 | 값 | 조건 |
|------|----------|-----|------|
| Header | role | "banner" | 항상 |
| Menubar | role | "navigation" | PrimeVue 자동 |
| Menubar | aria-label | "메인 네비게이션" | PrimeVue 자동 |
| 메뉴 아이템 (활성) | aria-current | "page" | isActiveRoute() === true |
| 메뉴 아이템 (비활성) | aria-disabled | "true" | disabled === true |
| 메뉴 아이템 (비활성) | aria-label | "{label} (준비 중)" | disabled === true |
| 로고 링크 | aria-label | "홈으로 이동" | 항상 |

### 5.2 키보드 탐색

| 키 | 동작 | PrimeVue 내장 |
|----|------|--------------|
| Tab | 다음 메뉴 포커스 | ✅ |
| Shift+Tab | 이전 메뉴 포커스 | ✅ |
| Enter | 메뉴 활성화 (command 호출) | ✅ |
| Space | 메뉴 활성화 (command 호출) | ✅ |
| Esc | 포커스 해제 | ✅ |

### 5.3 스크린 리더 지원

**예상 읽기 시나리오**:

```
"jjiban, 홈으로 이동, 링크"
→ "대시보드 (준비 중), 비활성화된 링크"
→ "칸반 (준비 중), 비활성화된 링크"
→ "WBS, 현재 페이지"
→ "Gantt (준비 중), 비활성화된 링크"
→ "프로젝트를 선택하세요" (또는 "jjiban")
```

---

## 6. 컴포넌트 계층 구조

### 6.1 컴포넌트 트리

```
AppHeader.vue
├── Menubar (PrimeVue)
│   ├── #start 슬롯
│   │   └── NuxtLink (로고)
│   ├── #item 슬롯
│   │   ├── a (메뉴 아이템 1: 대시보드) [disabled]
│   │   ├── a (메뉴 아이템 2: 칸반) [disabled]
│   │   ├── a (메뉴 아이템 3: WBS) [active]
│   │   └── a (메뉴 아이템 4: Gantt) [disabled]
│   └── #end 슬롯
│       └── span (프로젝트명)
```

### 6.2 데이터 흐름 다이어그램

```
Props (projectName)
    ↓
Computed (menuModel)
    → MenuItem[] (4개 메뉴)
        → key, label, icon, to, disabled, command
    ↓
Menubar (:model="menuModel")
    ↓
item 템플릿 (v-for 자동 렌더링)
    → isActiveRoute() 계산
    → getMenuItemClass() 계산
    ↓
렌더링 완료
```

### 6.3 이벤트 흐름

```
사용자 클릭
    ↓
MenuItem.command(event)
    ↓
handleMenuCommand(event, key)
    ↓
disabled 체크
    ├─ true: event.preventDefault() → toast.add()
    └─ false: PrimeVue to 라우팅 → router.push()
    ↓
route.path 변경
    ↓
isActiveRoute() 재계산
    ↓
item 템플릿 re-render (활성 하이라이팅)
```

---

## 7. 테스트 시나리오

### 7.1 E2E 테스트 선택자

| 요소 | data-testid | 선택자 |
|------|------------|--------|
| Header | app-header | `[data-testid="app-header"]` |
| 로고 | app-logo | `[data-testid="app-logo"]` |
| 메뉴 (대시보드) | nav-menu-dashboard | `[data-testid="nav-menu-dashboard"]` |
| 메뉴 (칸반) | nav-menu-kanban | `[data-testid="nav-menu-kanban"]` |
| 메뉴 (WBS) | nav-menu-wbs | `[data-testid="nav-menu-wbs"]` |
| 메뉴 (Gantt) | nav-menu-gantt | `[data-testid="nav-menu-gantt"]` |
| 프로젝트명 | project-name | `[data-testid="project-name"]` |

### 7.2 시각적 회귀 테스트

| 시나리오 | 검증 요소 |
|---------|----------|
| 초기 렌더링 | 로고, 4개 메뉴, 프로젝트명 표시 |
| 활성 메뉴 하이라이팅 | WBS 메뉴 Primary 색상 강조 |
| disabled 메뉴 스타일 | 대시보드, 칸반, Gantt opacity 50% |
| 호버 동작 | 활성 메뉴만 호버 스타일 적용 |
| 토스트 표시 | disabled 메뉴 클릭 시 "준비 중" 토스트 |

---

## 8. CSS 클래스 중앙화 체크리스트

### 8.1 컴포넌트 내부 (:style 및 HEX 사용 금지)

| 위치 | 금지 패턴 | 허용 패턴 |
|------|----------|----------|
| 메뉴 아이템 | `:style="{ color: '#3b82f6' }"` | `:class="menubar-item-active"` |
| 로고 | `:style="{ fontSize: '20px' }"` | `class="menubar-logo"` |
| 프로젝트명 | `:style="{ maxWidth: '200px' }"` | `class="menubar-project-name"` |

### 8.2 main.css 클래스 정의 검증

| CSS 클래스 | 정의 위치 | CSS 변수 사용 |
|-----------|----------|-------------|
| menubar-logo | main.css | ✅ (text-primary) |
| menubar-item | main.css | ✅ (TailwindCSS) |
| menubar-item-active | main.css | ✅ (text-primary) |
| menubar-item-disabled | main.css | ✅ (text-text-muted) |
| menubar-project-name | main.css | ✅ (text-text-secondary) |
| menubar-project-name-empty | main.css | ✅ (text-text-muted) |

---

## 9. 마이그레이션 체크리스트

### 9.1 Before → After 변경 사항

| 요소 | Before (커스텀) | After (PrimeVue) |
|------|----------------|-----------------|
| 컨테이너 | `<header>` + `<div>` | `<header>` + `<Menubar>` |
| 로고 | `<div>` + `<NuxtLink>` | `#start` 슬롯 + `<NuxtLink>` |
| 메뉴 | `v-for` + `<button>` | MenuItem 모델 + `#item` 템플릿 |
| 프로젝트명 | `<div>` + `<span>` | `#end` 슬롯 + `<span>` |
| CSS | TailwindCSS 직접 사용 | Pass Through API + main.css |

### 9.2 제거 예정 코드

| 제거 대상 | 파일 | 이유 |
|---------|------|------|
| `menuItems` 배열 | AppHeader.vue | menuModel로 대체 |
| `getMenuClasses()` 함수 | AppHeader.vue | CSS 클래스 중앙화 |
| `handleMenuClick()` 함수 | AppHeader.vue | MenuItem.command로 대체 |
| `navigate` emit | AppHeader.vue | PrimeVue to 사용 |
| TailwindCSS 직접 클래스 | AppHeader.vue | Pass Through API 사용 |

---

## 10. 수용 기준 (Acceptance Criteria)

### 10.1 시각적 일관성

| 검증 항목 | 기준 |
|---------|------|
| 로고 폰트 | 20px, Bold, Primary (#3b82f6) |
| 메뉴 간격 | gap-2 (8px) |
| 활성 메뉴 | Primary 색상 + Primary/20 배경 |
| 비활성 메뉴 | text-muted + opacity 50% |
| 프로젝트명 | 14px, max-w-200px, truncate |

### 10.2 기능 동작

| 검증 항목 | 기준 |
|---------|------|
| 로고 클릭 | /wbs 이동 |
| WBS 클릭 | /wbs 이동 (활성 하이라이팅) |
| disabled 클릭 | 토스트 표시 ("준비 중입니다") |
| 라우트 변경 | 활성 메뉴 즉시 반영 |

### 10.3 접근성

| 검증 항목 | 기준 |
|---------|------|
| aria-current | 활성 메뉴에 "page" |
| aria-disabled | disabled 메뉴에 "true" |
| aria-label | disabled 메뉴에 "(준비 중)" |
| 키보드 탐색 | Tab/Enter/Space 동작 |

---

## 11. 다음 단계

- **상세설계**: `/wf:draft` 명령어로 `020-detail-design.md` 작성
  - TypeScript 인터페이스 상세 명세
  - command 핸들러 구현 로직
  - isActiveRoute() computed 함수
  - Pass Through Options 상세 설정
- **설계리뷰**: `/wf:review` 명령어로 LLM 검토

---

## 12. 참고 자료

### 12.1 내부 문서
- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-04/010-basic-design.md`
- 현재 컴포넌트: `app/components/layout/AppHeader.vue`
- CSS 스타일: `app/assets/css/main.css`
- PRD 섹션 6.1: 헤더 구조
- TRD 섹션 2.3.6: CSS 클래스 중앙화 원칙

### 12.2 PrimeVue 공식 문서
- Menubar: https://primevue.org/menubar/
- MenuItem: https://primevue.org/menumodel/
- Pass Through: https://primevue.org/passthrough/

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
