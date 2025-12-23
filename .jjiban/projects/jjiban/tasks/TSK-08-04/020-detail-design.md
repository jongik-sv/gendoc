# 상세설계 (020-detail-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **상세설계 규칙**
> * 구현 가능한 수준의 기술 명세
> * TypeScript 인터페이스, 함수 시그니처 정의
> * PrimeVue API 정확한 사용법 명시
> * CSS 클래스 중앙화 원칙 100% 준수

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-04 |
| Task명 | AppHeader PrimeVue Menubar Migration |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-08-04/010-basic-design.md` |
| 화면설계 | `.jjiban/projects/jjiban/tasks/TSK-08-04/011-ui-design.md` |

---

## 1. 컴포넌트 구조 상세

### 1.1 TypeScript 인터페이스

```typescript
// ============================================================
// PrimeVue MenuItem 타입 임포트
// ============================================================
import type { MenuItem } from 'primevue/menuitem'
import type { MenubarPassThroughOptions } from 'primevue/menubar'
import type { MenuItemCommandEvent } from 'primevue/menuitem'

// ============================================================
// Props 인터페이스
// ============================================================
interface Props {
  /**
   * 현재 프로젝트명
   * - props 우선, 없으면 projectStore에서 가져옴
   * - 둘 다 없으면 "프로젝트를 선택하세요" 표시
   */
  projectName?: string
}

// ============================================================
// MenuItem 확장 인터페이스 (커스텀 필드)
// ============================================================
interface AppMenuItem extends MenuItem {
  key: string          // 메뉴 고유 ID ('dashboard' | 'kanban' | 'wbs' | 'gantt')
  label: string        // 표시 라벨
  icon: string         // PrimeIcons 클래스명 (현재 미사용)
  to: string           // 라우트 경로
  disabled: boolean    // 비활성 상태
  command: (event: MenuItemCommandEvent) => void  // 클릭 핸들러
}
```

### 1.2 컴포넌트 구조

```vue
<script setup lang="ts">
/**
 * AppHeader 컴포넌트 - PrimeVue Menubar Migration
 *
 * @migration TSK-08-04
 * - 커스텀 버튼 네비게이션 → PrimeVue Menubar
 * - MenuItem 모델 + Pass Through API
 * - start/end 슬롯으로 로고/프로젝트명 배치
 *
 * @see 010-basic-design.md
 * @see 011-ui-design.md
 */

import { useToast } from 'primevue/usetoast'
import type { MenuItem } from 'primevue/menuitem'
import type { MenubarPassThroughOptions } from 'primevue/menubar'
import type { MenuItemCommandEvent } from 'primevue/menuitem'

// Props 정의
interface Props {
  projectName?: string
}

const props = withDefaults(defineProps<Props>(), {
  projectName: ''
})

// Composables
const router = useRouter()
const route = useRoute()
const toast = useToast()
const projectStore = useProjectStore()

// MenuItem 모델 (computed로 반응성 유지)
const menuModel = computed<MenuItem[]>(() => [
  {
    key: 'dashboard',
    label: '대시보드',
    icon: 'pi pi-home',
    to: '/dashboard',
    disabled: true,
    command: (event) => handleMenuCommand(event, 'dashboard')
  },
  {
    key: 'kanban',
    label: '칸반',
    icon: 'pi pi-th-large',
    to: '/kanban',
    disabled: true,
    command: (event) => handleMenuCommand(event, 'kanban')
  },
  {
    key: 'wbs',
    label: 'WBS',
    icon: 'pi pi-sitemap',
    to: '/wbs',
    disabled: false,
    command: (event) => handleMenuCommand(event, 'wbs')
  },
  {
    key: 'gantt',
    label: 'Gantt',
    icon: 'pi pi-chart-line',
    to: '/gantt',
    disabled: true,
    command: (event) => handleMenuCommand(event, 'gantt')
  }
])

// 프로젝트명 표시
const displayProjectName = computed(() => {
  return props.projectName || projectStore.projectName || '프로젝트를 선택하세요'
})

// 프로젝트 선택 여부
const hasProject = computed(() => {
  return !!(props.projectName || projectStore.projectName)
})

// 프로젝트명 CSS 클래스
const projectNameClass = computed(() => {
  return hasProject.value
    ? 'menubar-project-name'
    : 'menubar-project-name-empty'
})

// 활성 라우트 체크
const isActiveRoute = (item: MenuItem): boolean => {
  return route.path === item.to && !item.disabled
}

// 메뉴 아이템 CSS 클래스 동적 생성
const getMenuItemClass = (item: MenuItem): string => {
  const classes = ['menubar-item']

  if (item.disabled) {
    classes.push('menubar-item-disabled')
  } else if (isActiveRoute(item)) {
    classes.push('menubar-item-active')
  }

  return classes.join(' ')
}

// 메뉴 클릭 핸들러
const handleMenuCommand = (event: MenuItemCommandEvent, key: string) => {
  const item = menuModel.value.find(m => m.key === key)
  if (!item) return

  if (item.disabled) {
    // disabled 메뉴: 라우팅 취소 + 토스트 표시
    event.originalEvent?.preventDefault()
    toast.add({
      severity: 'warn',
      summary: '알림',
      detail: '준비 중입니다',
      life: 3000
    })
  }
  // enabled 메뉴는 PrimeVue의 to 속성으로 자동 라우팅
}

// Pass Through API 설정
const menubarPassThrough = computed<MenubarPassThroughOptions>(() => ({
  root: {
    class: 'app-menubar'
  },
  menu: {
    class: 'app-menubar-menu'
  },
  start: {
    class: 'app-menubar-start'
  },
  end: {
    class: 'app-menubar-end'
  }
}))
</script>

<template>
  <header
    data-testid="app-header"
    class="h-full w-full bg-bg-header"
    role="banner"
  >
    <Menubar :model="menuModel" :pt="menubarPassThrough">
      <!-- start 슬롯: 로고 -->
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

      <!-- item 템플릿: 메뉴 아이템 커스텀 렌더링 -->
      <template #item="{ item, props: itemProps }">
        <a
          v-bind="itemProps.action"
          :data-testid="`nav-menu-${item.key}`"
          :class="getMenuItemClass(item)"
          :aria-current="isActiveRoute(item) ? 'page' : undefined"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :aria-label="item.disabled ? `${item.label} (준비 중)` : item.label"
        >
          <span>{{ item.label }}</span>
        </a>
      </template>

      <!-- end 슬롯: 프로젝트명 -->
      <template #end>
        <span
          data-testid="project-name"
          :class="projectNameClass"
        >
          {{ displayProjectName }}
        </span>
      </template>
    </Menubar>
  </header>
</template>
```

---

## 2. 데이터 모델 상세

### 2.1 MenuItem 모델 필드 설명

| 필드 | 타입 | 필수 | 설명 | 예시 값 |
|------|------|------|------|---------|
| key | string | ✅ | 메뉴 고유 식별자 | 'dashboard', 'wbs' |
| label | string | ✅ | 표시 라벨 | '대시보드', 'WBS' |
| icon | string | ❌ | PrimeIcons 클래스 (현재 미사용) | 'pi pi-home' |
| to | string | ✅ | 라우트 경로 | '/dashboard', '/wbs' |
| disabled | boolean | ✅ | 비활성 상태 | true, false |
| command | function | ✅ | 클릭 핸들러 | (event) => void |

### 2.2 menuModel 생성 로직

```typescript
const menuModel = computed<MenuItem[]>(() => [
  // 대시보드 (비활성)
  {
    key: 'dashboard',
    label: '대시보드',
    icon: 'pi pi-home',        // 향후 확장용
    to: '/dashboard',
    disabled: true,             // Phase 1: 비활성
    command: (event) => handleMenuCommand(event, 'dashboard')
  },

  // 칸반 (비활성)
  {
    key: 'kanban',
    label: '칸반',
    icon: 'pi pi-th-large',
    to: '/kanban',
    disabled: true,
    command: (event) => handleMenuCommand(event, 'kanban')
  },

  // WBS (활성)
  {
    key: 'wbs',
    label: 'WBS',
    icon: 'pi pi-sitemap',
    to: '/wbs',
    disabled: false,            // Phase 1: 활성
    command: (event) => handleMenuCommand(event, 'wbs')
  },

  // Gantt (비활성)
  {
    key: 'gantt',
    label: 'Gantt',
    icon: 'pi pi-chart-line',
    to: '/gantt',
    disabled: true,
    command: (event) => handleMenuCommand(event, 'gantt')
  }
])
```

**computed 사용 이유**:
- MenuItem 모델이 반응형 데이터 (route.path)에 의존
- 라우트 변경 시 자동으로 재계산 필요
- 향후 projectStore 상태에 따라 enabled 상태 동적 변경 가능

---

## 3. 이벤트 처리 상세

### 3.1 handleMenuCommand 함수

```typescript
/**
 * 메뉴 클릭 핸들러
 *
 * @param event - PrimeVue MenuItemCommandEvent
 * @param key - 메뉴 고유 ID
 *
 * @behavior
 * - disabled 메뉴: preventDefault() → 토스트 표시
 * - enabled 메뉴: PrimeVue to 라우팅 (자동 처리)
 */
const handleMenuCommand = (event: MenuItemCommandEvent, key: string) => {
  // 1. menuModel에서 해당 아이템 찾기
  const item = menuModel.value.find(m => m.key === key)
  if (!item) return  // 아이템 없으면 무시

  // 2. disabled 메뉴 처리
  if (item.disabled) {
    // 2-1. PrimeVue 기본 라우팅 동작 취소
    event.originalEvent?.preventDefault()

    // 2-2. "준비 중" 토스트 표시
    toast.add({
      severity: 'warn',        // warn 레벨 (노란색)
      summary: '알림',
      detail: '준비 중입니다',
      life: 3000               // 3초 후 자동 닫힘
    })
  }

  // 3. enabled 메뉴는 별도 처리 불필요
  // PrimeVue Menubar가 to 속성으로 자동 라우팅 수행
}
```

**주요 설계 결정**:
1. **preventDefault() 위치**: disabled 체크 후에만 호출 (enabled 메뉴는 PrimeVue 기본 동작 유지)
2. **토스트 severity**: `warn` (기존 코드와 동일)
3. **토스트 life**: 3000ms (기존 코드와 동일)
4. **라우팅 처리**: enabled 메뉴는 PrimeVue의 to 속성으로 자동 처리 (router.push 불필요)

### 3.2 이벤트 흐름 다이어그램

```
사용자 메뉴 클릭
    ↓
PrimeVue Menubar 이벤트 감지
    ↓
MenuItem.command() 호출
    → handleMenuCommand(event, key)
    ↓
menuModel에서 item 검색
    ↓
item.disabled 체크
    ├─ true (비활성 메뉴)
    │   → event.preventDefault()
    │   → toast.add({ severity: 'warn', ... })
    │   → 라우팅 없음 (현재 페이지 유지)
    │
    └─ false (활성 메뉴)
        → PrimeVue to 속성 동작
        → router.push(item.to)
        → route.path 변경
        → isActiveRoute() 재계산
        → item 템플릿 re-render
        → 활성 하이라이팅 업데이트
```

---

## 4. Computed 속성 상세

### 4.1 displayProjectName

```typescript
/**
 * 표시할 프로젝트명 계산
 *
 * @returns 프로젝트명 또는 안내 메시지
 *
 * @priority
 * 1. props.projectName (부모 컴포넌트 전달)
 * 2. projectStore.projectName (전역 상태)
 * 3. '프로젝트를 선택하세요' (기본값)
 */
const displayProjectName = computed(() => {
  return props.projectName || projectStore.projectName || '프로젝트를 선택하세요'
})
```

**우선순위 설계 이유**:
- Props가 최우선: 부모 컴포넌트가 명시적으로 전달한 값 존중
- Store 대체: Props 없을 때 전역 상태 사용
- 기본 메시지: 프로젝트 미선택 시 사용자 안내

### 4.2 hasProject

```typescript
/**
 * 프로젝트 선택 여부 확인
 *
 * @returns 프로젝트 선택됨 여부 (boolean)
 *
 * @usage projectNameClass computed에서 사용
 */
const hasProject = computed(() => {
  return !!(props.projectName || projectStore.projectName)
})
```

**!! 연산자 사용 이유**:
- 명시적 boolean 변환 (빈 문자열 `""` → `false`)
- TypeScript 타입 안정성

### 4.3 projectNameClass

```typescript
/**
 * 프로젝트명 CSS 클래스 동적 생성
 *
 * @returns CSS 클래스명
 *
 * @css-centralization
 * - 프로젝트 선택됨: 'menubar-project-name' (main.css 정의)
 * - 프로젝트 미선택: 'menubar-project-name-empty' (main.css 정의)
 */
const projectNameClass = computed(() => {
  return hasProject.value
    ? 'menubar-project-name'
    : 'menubar-project-name-empty'
})
```

**CSS 클래스 중앙화 준수**:
- `:style` 사용 금지
- HEX 코드 하드코딩 금지
- 모든 스타일은 main.css에서 정의된 클래스 사용

### 4.4 isActiveRoute

```typescript
/**
 * 활성 라우트 체크
 *
 * @param item - MenuItem 객체
 * @returns 현재 페이지 여부 (boolean)
 *
 * @condition
 * - route.path === item.to
 * - AND !item.disabled (비활성 메뉴는 절대 활성 불가)
 */
const isActiveRoute = (item: MenuItem): boolean => {
  return route.path === item.to && !item.disabled
}
```

**disabled 조건 포함 이유**:
- 비활성 메뉴는 절대 "활성" 상태 표시하지 않음
- ARIA 속성 일관성 유지 (aria-disabled + aria-current 충돌 방지)

### 4.5 getMenuItemClass

```typescript
/**
 * 메뉴 아이템 CSS 클래스 동적 생성
 *
 * @param item - MenuItem 객체
 * @returns CSS 클래스 문자열
 *
 * @css-centralization
 * - 기본: 'menubar-item'
 * - 비활성: 'menubar-item-disabled'
 * - 활성 (현재 페이지): 'menubar-item-active'
 */
const getMenuItemClass = (item: MenuItem): string => {
  const classes = ['menubar-item']  // 기본 클래스

  if (item.disabled) {
    classes.push('menubar-item-disabled')
  } else if (isActiveRoute(item)) {
    classes.push('menubar-item-active')
  }

  return classes.join(' ')
}
```

**클래스 우선순위**:
1. `menubar-item` (항상 포함)
2. `menubar-item-disabled` (disabled 상태 우선)
3. `menubar-item-active` (enabled이고 현재 페이지일 때만)

---

## 5. Pass Through API 상세

### 5.1 menubarPassThrough 설정

```typescript
/**
 * PrimeVue Menubar Pass Through API 설정
 *
 * @purpose CSS 클래스 중앙화 원칙 준수
 *
 * @see https://primevue.org/passthrough/
 */
const menubarPassThrough = computed<MenubarPassThroughOptions>(() => ({
  // Menubar 루트 컨테이너
  root: {
    class: 'app-menubar'
  },

  // 메뉴 아이템 리스트 (ul)
  menu: {
    class: 'app-menubar-menu'
  },

  // start 슬롯 컨테이너
  start: {
    class: 'app-menubar-start'
  },

  // end 슬롯 컨테이너
  end: {
    class: 'app-menubar-end'
  }
}))
```

### 5.2 Pass Through 클래스 매핑

| PrimeVue 요소 | Pass Through 키 | CSS 클래스 | 정의 파일 |
|--------------|----------------|-----------|----------|
| Menubar 루트 | `root` | `app-menubar` | main.css |
| 메뉴 리스트 (ul) | `menu` | `app-menubar-menu` | main.css |
| start 슬롯 | `start` | `app-menubar-start` | main.css |
| end 슬롯 | `end` | `app-menubar-end` | main.css |

**item 템플릿 제외 이유**:
- item 템플릿은 `#item` 슬롯으로 완전히 오버라이드
- 템플릿 내부에서 `:class` 바인딩으로 직접 제어
- Pass Through API 불필요

---

## 6. CSS 클래스 명세

### 6.1 main.css 추가 클래스 정의

```css
/* ============================================
 * AppHeader Menubar 스타일 (TSK-08-04)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* Menubar 루트 컨테이너 */
.app-menubar {
  @apply h-full px-4 bg-bg-header;
}

/* Menubar 메뉴 컨테이너 (ul) */
.app-menubar-menu {
  @apply flex items-center gap-2;
}

/* start 슬롯 컨테이너 */
.app-menubar-start {
  @apply flex items-center;
}

/* end 슬롯 컨테이너 */
.app-menubar-end {
  @apply flex items-center;
}

/* ============================================
 * 로고 스타일
 * ============================================ */
.menubar-logo {
  @apply text-xl font-bold text-primary hover:opacity-80 transition-opacity;
}

/* ============================================
 * 메뉴 아이템 스타일
 * ============================================ */

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

/* ============================================
 * 프로젝트명 스타일
 * ============================================ */

/* 프로젝트명 - 선택된 경우 */
.menubar-project-name {
  @apply text-sm max-w-[200px] truncate text-text-secondary;
}

/* 프로젝트명 - 미선택 (안내 메시지) */
.menubar-project-name-empty {
  @apply text-sm max-w-[200px] truncate text-text-muted italic;
}
```

### 6.2 CSS 클래스 상세 명세

#### 6.2.1 로고 (.menubar-logo)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| font-size | text-xl | 20px |
| font-weight | font-bold | 700 |
| color | text-primary | var(--color-primary) → #3b82f6 |
| hover:opacity | hover:opacity-80 | 0.8 |
| transition | transition-opacity | opacity 150ms |

#### 6.2.2 메뉴 아이템 기본 (.menubar-item)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| padding-x | px-4 | 1rem (16px) |
| padding-y | py-2 | 0.5rem (8px) |
| border-radius | rounded | 0.25rem (4px) |
| font-size | text-sm | 14px |
| font-weight | font-medium | 500 |
| transition | transition-colors duration-200 | colors 200ms |

#### 6.2.3 메뉴 아이템 활성 (.menubar-item-active)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| color | text-primary | #3b82f6 |
| background | bg-primary/20 | rgba(59, 130, 246, 0.2) |

#### 6.2.4 메뉴 아이템 비활성 (.menubar-item-disabled)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| color | text-text-muted | #666666 |
| opacity | opacity-50 | 0.5 |
| cursor | cursor-not-allowed | not-allowed |

#### 6.2.5 메뉴 아이템 호버 (활성 메뉴만)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| color | text-text | #e8e8e8 |
| background | bg-surface-50 | (TailwindCSS 색상) |

**호버 조건**:
- `:not(.menubar-item-disabled)`: 비활성 메뉴 제외
- `:not(.menubar-item-active)`: 현재 페이지 메뉴 제외
- 즉, 다른 페이지의 활성 메뉴만 호버 스타일 적용

#### 6.2.6 프로젝트명 - 선택됨 (.menubar-project-name)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| font-size | text-sm | 14px |
| max-width | max-w-[200px] | 200px |
| overflow | truncate | text-overflow: ellipsis |
| color | text-text-secondary | #888888 |

#### 6.2.7 프로젝트명 - 미선택 (.menubar-project-name-empty)

| 속성 | TailwindCSS | 실제 값 |
|------|------------|---------|
| font-size | text-sm | 14px |
| max-width | max-w-[200px] | 200px |
| overflow | truncate | text-overflow: ellipsis |
| color | text-text-muted | #666666 |
| font-style | italic | italic |

---

## 7. 템플릿 상세

### 7.1 Header 컨테이너

```vue
<header
  data-testid="app-header"
  class="h-full w-full bg-bg-header"
  role="banner"
>
```

**속성 설명**:
- `data-testid`: E2E 테스트 선택자
- `class`: 높이/너비 100%, 배경색 CSS 변수 사용
- `role="banner"`: 접근성 landmark (헤더임을 명시)

### 7.2 Menubar 컴포넌트

```vue
<Menubar :model="menuModel" :pt="menubarPassThrough">
```

**Props**:
- `:model`: MenuItem[] 배열 (computed로 동적 생성)
- `:pt`: Pass Through Options (CSS 클래스 중앙화)

### 7.3 start 슬롯 (로고)

```vue
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

**속성 설명**:
- `to="/wbs"`: 로고 클릭 시 WBS 페이지 이동
- `data-testid`: E2E 테스트 선택자
- `class="menubar-logo"`: CSS 클래스 중앙화 (main.css 정의)
- `aria-label`: 스크린 리더 안내

### 7.4 item 템플릿 (메뉴 아이템)

```vue
<template #item="{ item, props: itemProps }">
  <a
    v-bind="itemProps.action"
    :data-testid="`nav-menu-${item.key}`"
    :class="getMenuItemClass(item)"
    :aria-current="isActiveRoute(item) ? 'page' : undefined"
    :aria-disabled="item.disabled ? 'true' : undefined"
    :aria-label="item.disabled ? `${item.label} (준비 중)` : item.label"
  >
    <span>{{ item.label }}</span>
  </a>
</template>
```

**슬롯 Props**:
- `item`: 현재 MenuItem 객체
- `props`: PrimeVue가 제공하는 기본 props (이름 충돌 방지를 위해 `itemProps`로 리네임)

**속성 설명**:
- `v-bind="itemProps.action"`: PrimeVue 기본 동작 바인딩 (클릭 이벤트 등)
- `data-testid`: E2E 테스트 선택자 (동적 생성)
- `:class`: CSS 클래스 동적 생성 (getMenuItemClass 함수)
- `aria-current`: 현재 페이지 표시 (활성 메뉴만)
- `aria-disabled`: 비활성 메뉴 표시
- `aria-label`: 비활성 메뉴에 "(준비 중)" 안내 추가

**itemProps.action 바인딩 이유**:
- PrimeVue Menubar가 제공하는 기본 동작 유지
- 클릭 이벤트, 키보드 탐색 등 자동 처리
- command 핸들러 호출 포함

### 7.5 end 슬롯 (프로젝트명)

```vue
<template #end>
  <span
    data-testid="project-name"
    :class="projectNameClass"
  >
    {{ displayProjectName }}
  </span>
</template>
```

**속성 설명**:
- `data-testid`: E2E 테스트 선택자
- `:class`: 동적 CSS 클래스 (projectNameClass computed)
- `{{ displayProjectName }}`: 프로젝트명 또는 안내 메시지

---

## 8. 접근성 (ARIA) 상세

### 8.1 ARIA 속성 매핑

| 요소 | ARIA 속성 | 값 | 조건 |
|------|----------|-----|------|
| Header | `role` | `"banner"` | 항상 |
| Menubar | `role` | `"navigation"` | PrimeVue 자동 |
| Menubar | `aria-label` | `"메인 네비게이션"` | PrimeVue 자동 |
| 로고 링크 | `aria-label` | `"홈으로 이동"` | 항상 |
| 메뉴 아이템 (활성) | `aria-current` | `"page"` | `isActiveRoute(item) === true` |
| 메뉴 아이템 (비활성) | `aria-disabled` | `"true"` | `item.disabled === true` |
| 메뉴 아이템 (비활성) | `aria-label` | `"{label} (준비 중)"` | `item.disabled === true` |

### 8.2 스크린 리더 예상 출력

```
"jjiban, 홈으로 이동, 링크"
→ "대시보드 (준비 중), 비활성화된 링크"
→ "칸반 (준비 중), 비활성화된 링크"
→ "WBS, 현재 페이지"
→ "Gantt (준비 중), 비활성화된 링크"
→ "프로젝트를 선택하세요" (또는 "jjiban")
```

### 8.3 키보드 탐색

| 키 | 동작 | 구현 방식 |
|----|------|----------|
| Tab | 다음 메뉴 포커스 | PrimeVue 내장 |
| Shift+Tab | 이전 메뉴 포커스 | PrimeVue 내장 |
| Enter | 메뉴 활성화 (command 호출) | PrimeVue 내장 |
| Space | 메뉴 활성화 (command 호출) | PrimeVue 내장 |
| Esc | 포커스 해제 | PrimeVue 내장 |

**PrimeVue 내장 기능 활용**:
- 별도 키보드 이벤트 핸들러 구현 불필요
- itemProps.action 바인딩으로 자동 처리

---

## 9. 테스트 시나리오

### 9.1 E2E 테스트 선택자

| 요소 | data-testid | 선택자 예시 |
|------|------------|-----------|
| Header | `app-header` | `page.getByTestId('app-header')` |
| 로고 | `app-logo` | `page.getByTestId('app-logo')` |
| 대시보드 메뉴 | `nav-menu-dashboard` | `page.getByTestId('nav-menu-dashboard')` |
| 칸반 메뉴 | `nav-menu-kanban` | `page.getByTestId('nav-menu-kanban')` |
| WBS 메뉴 | `nav-menu-wbs` | `page.getByTestId('nav-menu-wbs')` |
| Gantt 메뉴 | `nav-menu-gantt` | `page.getByTestId('nav-menu-gantt')` |
| 프로젝트명 | `project-name` | `page.getByTestId('project-name')` |

### 9.2 기존 E2E 테스트 호환성

**유지되는 선택자**:
- `app-header`
- `app-logo`
- `nav-menu-{id}` (동적 생성 패턴 유지)
- `project-name`

**제거되는 선택자**:
- `nav-menu` (Menubar로 대체, 별도 선택 불필요)

**변경 사항**:
- `data-enabled` 속성: 제거 (item.disabled로 대체)
- 선택자 변경: `button[data-testid="nav-menu-wbs"]` → `a[data-testid="nav-menu-wbs"]`

### 9.3 회귀 테스트 체크리스트

| 테스트 케이스 | 현재 구현 | 변경 후 | 호환성 |
|-------------|----------|---------|--------|
| 로고 클릭 → /wbs 이동 | ✅ | ✅ | ✅ 유지 |
| WBS 메뉴 클릭 → /wbs 이동 | ✅ | ✅ | ✅ 유지 |
| 비활성 메뉴 클릭 → 토스트 | ✅ | ✅ | ✅ 유지 |
| 활성 메뉴 하이라이팅 | ✅ | ✅ | ✅ 유지 |
| 프로젝트명 표시 | ✅ | ✅ | ✅ 유지 |
| 프로젝트 미선택 안내 | ✅ | ✅ | ✅ 유지 |

**추가 테스트 필요**:
- PrimeVue Menubar 렌더링 확인
- item 템플릿 동적 클래스 적용 확인
- Pass Through API 클래스 적용 확인

---

## 10. 마이그레이션 체크리스트

### 10.1 제거 예정 코드

| 제거 대상 | 현재 위치 | 이유 |
|---------|----------|------|
| `menuItems` 배열 | AppHeader.vue Data | `menuModel` computed로 대체 |
| `getMenuClasses()` 함수 | AppHeader.vue Methods | `getMenuItemClass()` computed로 대체 |
| `handleMenuClick()` 함수 | AppHeader.vue Methods | `handleMenuCommand()` + MenuItem.command로 대체 |
| `navigate` emit | AppHeader.vue Emits | PrimeVue to 속성 사용 (emit 불필요) |
| TailwindCSS 직접 클래스 | Template | Pass Through API + main.css로 대체 |

### 10.2 추가되는 코드

| 추가 대상 | 위치 | 목적 |
|---------|------|------|
| `menuModel` computed | AppHeader.vue | MenuItem 모델 생성 |
| `handleMenuCommand()` 함수 | AppHeader.vue | command 핸들러 |
| `isActiveRoute()` 함수 | AppHeader.vue | 활성 라우트 체크 |
| `getMenuItemClass()` 함수 | AppHeader.vue | 메뉴 아이템 CSS 클래스 |
| `projectNameClass` computed | AppHeader.vue | 프로젝트명 CSS 클래스 |
| `menubarPassThrough` computed | AppHeader.vue | Pass Through API 설정 |
| Menubar 스타일 클래스 | main.css | CSS 클래스 중앙화 |

### 10.3 변경되는 코드

| 변경 대상 | Before | After |
|---------|--------|-------|
| 메뉴 렌더링 | `v-for` + `<button>` | `<Menubar>` + MenuItem 모델 |
| 로고 배치 | `<div>` + `<NuxtLink>` | `#start` 슬롯 + `<NuxtLink>` |
| 프로젝트명 배치 | `<div>` + `<span>` | `#end` 슬롯 + `<span>` |
| 메뉴 클릭 처리 | `@click="handleMenuClick"` | `command: handleMenuCommand` |
| CSS 적용 | `:class="getMenuClasses(item)"` | `:class="getMenuItemClass(item)"` + Pass Through |

---

## 11. 구현 순서

### 11.1 단계별 작업

| 순서 | 작업 | 파일 | 예상 소요 시간 |
|------|------|------|---------------|
| 1 | main.css 클래스 정의 추가 | `app/assets/css/main.css` | 15분 |
| 2 | AppHeader.vue 백업 | - | 5분 |
| 3 | PrimeVue 타입 임포트 추가 | `app/components/layout/AppHeader.vue` | 5분 |
| 4 | menuModel computed 작성 | `app/components/layout/AppHeader.vue` | 15분 |
| 5 | handleMenuCommand 함수 작성 | `app/components/layout/AppHeader.vue` | 15분 |
| 6 | 헬퍼 computed 작성 (isActiveRoute 등) | `app/components/layout/AppHeader.vue` | 15분 |
| 7 | menubarPassThrough 작성 | `app/components/layout/AppHeader.vue` | 10분 |
| 8 | Template 전체 교체 | `app/components/layout/AppHeader.vue` | 20분 |
| 9 | 기존 코드 제거 (menuItems, 이전 함수) | `app/components/layout/AppHeader.vue` | 10분 |
| 10 | 로컬 테스트 (브라우저 확인) | - | 15분 |
| 11 | E2E 테스트 실행 및 수정 | - | 30분 |
| 12 | 최종 검증 | - | 15분 |

**총 예상 소요 시간**: 2시간 50분

### 11.2 검증 체크포인트

| 체크포인트 | 검증 방법 | 수용 기준 |
|----------|----------|----------|
| main.css 적용 | 브라우저 개발자 도구 | CSS 클래스 적용 확인 |
| Menubar 렌더링 | 브라우저 확인 | 4개 메뉴 표시 |
| 로고 클릭 | 수동 테스트 | /wbs 이동 |
| WBS 클릭 | 수동 테스트 | /wbs 이동 + 활성 하이라이팅 |
| 비활성 메뉴 클릭 | 수동 테스트 | 토스트 표시 |
| 활성 하이라이팅 | 라우트 변경 후 확인 | Primary 색상 적용 |
| E2E 테스트 | Playwright 실행 | 기존 테스트 통과 |
| 접근성 | axe DevTools | ARIA 속성 유지 |

---

## 12. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| disabled 메뉴 라우팅 동작 | 중간 | 높음 | command 내부 preventDefault() 강제 호출 |
| item 템플릿 props 이름 충돌 | 낮음 | 중간 | `props: itemProps`로 리네임 |
| E2E 테스트 선택자 변경 | 중간 | 높음 | data-testid 패턴 유지, 회귀 테스트 우선 |
| CSS 클래스 적용 누락 | 낮음 | 중간 | Pass Through 검증, 브라우저 DevTools 확인 |
| ARIA 속성 손실 | 낮음 | 중간 | item 템플릿에 명시적 정의 |

---

## 13. 수용 기준 (Acceptance Criteria)

### 13.1 기능 요구사항

| AC ID | 수용 기준 | 검증 방법 |
|-------|----------|----------|
| AC-01 | PrimeVue Menubar 사용 | 컴포넌트 코드 확인 (`<Menubar>` 사용) |
| AC-02 | start 슬롯에 로고 표시 | 브라우저 렌더링 확인 |
| AC-03 | end 슬롯에 프로젝트명 표시 | 브라우저 렌더링 확인 |
| AC-04 | 4개 메뉴 표시 | 브라우저 렌더링 확인 |
| AC-05 | WBS만 활성화 | 메뉴 클릭 동작 확인 |
| AC-06 | 활성 메뉴 Primary 색상 | 브라우저 DevTools 확인 |
| AC-07 | disabled 메뉴 클릭 시 토스트 | 수동 테스트 |
| AC-08 | 기존 E2E 테스트 통과 | Playwright 실행 결과 |

### 13.2 품질 기준

| QC ID | 품질 기준 | 검증 방법 |
|-------|----------|----------|
| QC-01 | CSS 클래스 중앙화 준수 | 인라인 `:style` Grep 검색 결과 0건 |
| QC-02 | ARIA 속성 유지 | axe DevTools 실행 |
| QC-03 | 메뉴 호버 반응성 < 100ms | Chrome DevTools Performance |
| QC-04 | 다크 테마 일관성 | 시각적 비교 (Before/After) |

---

## 14. 다음 단계

- **추적성 매트릭스**: `025-traceability-matrix.md` 생성
- **테스트 명세**: `026-test-specification.md` 생성
- **구현**: `/wf:build` 명령어로 구현 시작
- **wbs.md 상태 업데이트**: `[bd]` → `[dd]`

---

## 15. 참고 자료

### 15.1 내부 문서
- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-04/010-basic-design.md`
- 화면설계: `.jjiban/projects/jjiban/tasks/TSK-08-04/011-ui-design.md`
- 현재 컴포넌트: `app/components/layout/AppHeader.vue`
- CSS 스타일: `app/assets/css/main.css`

### 15.2 PrimeVue 공식 문서
- Menubar: https://primevue.org/menubar/
- MenuItem Model: https://primevue.org/menumodel/
- Pass Through API: https://primevue.org/passthrough/
- MenuItemCommandEvent: https://primevue.org/menumodel/#api.menuitem.interfaces.MenuItemCommandEvent

### 15.3 선행 Task 참조
- TSK-08-01: NodeIcon PrimeVue 통합 패턴
- TSK-08-03: AppLayout PrimeVue Splitter Pass Through API 패턴

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
