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
| Task ID | TSK-08-04 |
| Task명 | AppHeader PrimeVue Menubar Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 6.1 (헤더 구조) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.3 (PrimeVue 최우선), 2.3.6 (CSS 중앙화) |
| 상위 Work Package | WP-08: PrimeVue Component Migration | - |
| 선행 Task | TSK-08-03: AppLayout PrimeVue Splitter Migration | PrimeVue 통합 패턴 참조 |

---

## 1. 요구사항 분석

### 1.1 PRD/TRD 요구사항 추출

| 요구사항 ID | 출처 | 요구사항 내용 | 우선순위 |
|------------|------|-------------|---------|
| REQ-01 | wbs.md | 커스텀 네비게이션 → PrimeVue Menubar 교체 | 필수 |
| REQ-02 | wbs.md | MenuItem 모델로 메뉴 구성 (enabled/disabled 상태) | 필수 |
| REQ-03 | wbs.md | start/end 슬롯으로 로고 및 프로젝트명 배치 | 필수 |
| REQ-04 | wbs.md | 활성 라우트 하이라이팅 (item 템플릿 사용) | 필수 |
| REQ-05 | wbs.md | disabled 메뉴 클릭 시 "준비 중" 토스트 유지 | 필수 |
| REQ-06 | wbs.md | 접근성 유지 (aria-current, aria-disabled) | 필수 |
| REQ-07 | TRD 2.3.3 | PrimeVue 컴포넌트 최우선 사용 원칙 | 필수 |
| REQ-08 | TRD 2.3.6 | CSS 클래스 중앙화 원칙 준수 | 필수 |

### 1.2 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|-------|---------|-------------------------------|
| FR-001 | PrimeVue Menubar 통합 | Menubar 컴포넌트 사용, MenuItem 모델 적용 |
| FR-002 | start 슬롯 (로고) | jjiban 로고 좌측 표시, 클릭 시 /wbs 이동 |
| FR-003 | end 슬롯 (프로젝트명) | 프로젝트명 우측 표시, 미선택 시 안내 메시지 |
| FR-004 | MenuItem 구성 | 대시보드, 칸반, WBS, Gantt 메뉴 생성 |
| FR-005 | enabled/disabled 상태 | WBS만 활성화, 나머지는 disabled |
| FR-006 | 활성 라우트 하이라이팅 | 현재 페이지 메뉴 Primary 색상 강조 |
| FR-007 | disabled 메뉴 클릭 | "준비 중입니다" 토스트 표시 (warn severity) |
| FR-008 | 접근성 속성 | aria-current="page", aria-disabled="true" 적용 |
| FR-009 | 기존 기능 유지 | 네비게이션, 토스트, 라우팅 동작 100% 유지 |

### 1.3 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 측정 기준 |
|--------|---------|----------|
| NFR-001 | 사용성 | 메뉴 호버 및 클릭 반응성 < 100ms |
| NFR-002 | 접근성 | ARIA 속성 유지, 키보드 탐색 지원 |
| NFR-003 | 테스트 호환성 | 기존 E2E 테스트 data-testid 유지 |
| NFR-004 | 테마 일관성 | Dark Blue 테마 색상 팔레트 100% 일치 |
| NFR-005 | 반응성 | 라우트 변경 시 활성 하이라이팅 즉시 반영 |

---

## 2. 현황 분석

### 2.1 현재 AppHeader.vue 구조

| 현황 | 내용 |
|------|------|
| 레이아웃 방식 | Flex 레이아웃 (좌측/중앙/우측) |
| 메뉴 렌더링 | `v-for` + `<button>` 커스텀 렌더링 |
| 메뉴 데이터 | `MenuItem[]` 배열 (id, label, icon, route, enabled) |
| 활성 하이라이팅 | `getMenuClasses()` 함수로 클래스 동적 생성 |
| disabled 처리 | `handleMenuClick()` 내부 조건 분기 |
| ARIA 속성 | aria-current, aria-disabled, aria-label 수동 적용 |

**현재 메뉴 렌더링 코드 분석**:

```vue
<!-- 중앙: 네비게이션 메뉴 -->
<nav data-testid="nav-menu" class="flex items-center gap-2">
  <button
    v-for="item in menuItems"
    :key="item.id"
    type="button"
    :data-testid="`nav-menu-${item.id}`"
    :data-enabled="item.enabled"
    :class="getMenuClasses(item)"
    :aria-current="isCurrentRoute(item.route) && item.enabled ? 'page' : undefined"
    :aria-disabled="!item.enabled ? 'true' : undefined"
    @click="handleMenuClick(item)"
  >
    {{ item.label }}
  </button>
</nav>
```

**문제점**:
- 커스텀 버튼 렌더링으로 PrimeVue 디자인 시스템 미활용
- 중복 로직 (isCurrentRoute, getMenuClasses 함수)
- item 템플릿이 없어 확장성 제한적 (아이콘 추가 어려움)
- CSS 클래스 중앙화 원칙 일부 위배 (TailwindCSS 직접 사용)

### 2.2 PrimeVue Menubar 기능

| 기능 | 설명 | 해당 Props/Slots |
|------|------|-----------------|
| MenuItem 모델 | 계층형 메뉴 데이터 구조 지원 | `:model` prop |
| start/end 슬롯 | 좌우 커스텀 콘텐츠 배치 | `#start`, `#end` 슬롯 |
| item 템플릿 | 메뉴 아이템 커스텀 렌더링 | `#item` 슬롯 |
| 접근성 | 키보드 탐색, ARIA 자동 지원 | 내장 기능 |
| disabled 상태 | MenuItem.disabled 속성 | `disabled: boolean` |
| command 핸들러 | 메뉴 클릭 이벤트 처리 | `command: (event) => void` |

**PrimeVue Menubar 장점**:
- MenuItem 모델로 통일된 데이터 구조
- start/end 슬롯으로 로고/프로젝트명 배치 간편
- item 템플릿으로 활성 하이라이팅 커스텀 가능
- Pass Through API로 CSS 클래스 중앙화 가능
- PrimeVue 디자인 시스템 일관성

---

## 3. 솔루션 설계

### 3.1 전체 마이그레이션 전략

**원칙**: TSK-08-01, TSK-08-03 패턴 재사용

```
커스텀 버튼 네비게이션 (현재)
    ↓ 교체
PrimeVue Menubar + MenuItem 모델
    ↓ start/end 슬롯
로고 + 프로젝트명 배치
    ↓ item 템플릿
활성 라우트 하이라이팅
    ↓ CSS 클래스 중앙화
main.css (CSS 변수 참조)
```

### 3.2 AppHeader 구조 변경

#### 3.2.1 현재 구조 (Before)

```vue
<template>
  <header class="h-full w-full flex items-center justify-between px-4 bg-bg-header">
    <!-- 좌측: 로고 -->
    <div class="flex items-center">
      <NuxtLink to="/wbs">jjiban</NuxtLink>
    </div>

    <!-- 중앙: 커스텀 버튼 네비게이션 -->
    <nav class="flex items-center gap-2">
      <button
        v-for="item in menuItems"
        :key="item.id"
        :class="getMenuClasses(item)"
        @click="handleMenuClick(item)"
      >
        {{ item.label }}
      </button>
    </nav>

    <!-- 우측: 프로젝트명 -->
    <div class="flex items-center">
      <span>{{ displayProjectName }}</span>
    </div>
  </header>
</template>
```

#### 3.2.2 변경 후 구조 (After)

```vue
<template>
  <header class="h-full w-full bg-bg-header" role="banner">
    <Menubar :model="menuModel" :pt="menubarPassThrough">
      <!-- start 슬롯: 로고 -->
      <template #start>
        <NuxtLink to="/wbs" data-testid="app-logo" class="menubar-logo">
          jjiban
        </NuxtLink>
      </template>

      <!-- item 템플릿: 활성 하이라이팅 -->
      <template #item="{ item, props }">
        <a
          v-bind="props.action"
          :class="getMenuItemClass(item)"
          :aria-current="isActiveRoute(item) ? 'page' : undefined"
          :aria-disabled="item.disabled ? 'true' : undefined"
        >
          <span>{{ item.label }}</span>
        </a>
      </template>

      <!-- end 슬롯: 프로젝트명 -->
      <template #end>
        <span :class="projectNameClass" data-testid="project-name">
          {{ displayProjectName }}
        </span>
      </template>
    </Menubar>
  </header>
</template>
```

### 3.3 핵심 설계 결정

#### 3.3.1 MenuItem 모델 구조

**현재 MenuItem 인터페이스 → PrimeVue MenuItem 변환**:

| 현재 필드 | PrimeVue 필드 | 변환 방식 |
|----------|--------------|----------|
| id | key | 직접 매핑 |
| label | label | 직접 매핑 |
| icon | icon | 직접 매핑 (PrimeIcons) |
| route | to | 직접 매핑 (라우팅) |
| enabled | disabled | 반전 (!enabled → disabled) |

**PrimeVue MenuItem 모델 정의**:

```typescript
import type { MenuItem } from 'primevue/menuitem'

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
```

#### 3.3.2 disabled 메뉴 처리 전략

**command 핸들러 내부 조건 분기**:

```typescript
const handleMenuCommand = (event: MenuItemCommandEvent, key: string) => {
  const item = menuModel.value.find(m => m.key === key)
  if (!item) return

  if (item.disabled) {
    // disabled 메뉴: 토스트 표시
    event.originalEvent?.preventDefault() // 네비게이션 취소
    toast.add({
      severity: 'warn',
      summary: '알림',
      detail: '준비 중입니다',
      life: 3000
    })
  } else {
    // enabled 메뉴: 라우팅 (PrimeVue 내장 to 사용)
    // to 속성으로 자동 처리됨 (별도 라우팅 불필요)
  }
}
```

#### 3.3.3 활성 라우트 하이라이팅

**item 템플릿 활용**:

```vue
<template #item="{ item, props }">
  <a
    v-bind="props.action"
    :class="{
      'menubar-item': true,
      'menubar-item-active': isActiveRoute(item),
      'menubar-item-disabled': item.disabled
    }"
    :aria-current="isActiveRoute(item) ? 'page' : undefined"
    :aria-disabled="item.disabled ? 'true' : undefined"
  >
    <span>{{ item.label }}</span>
  </a>
</template>

<script setup lang="ts">
const isActiveRoute = (item: MenuItem): boolean => {
  return route.path === item.to && !item.disabled
}
</script>
```

#### 3.3.4 CSS 클래스 중앙화

**Pass Through API 적용**:

```typescript
const menubarPassThrough = computed((): MenubarPassThroughOptions => ({
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

**main.css 스타일 정의**:

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

/* 메뉴 아이템 기본 스타일 */
.menubar-item {
  @apply px-4 py-2 rounded text-sm font-medium transition-colors duration-200;
}

/* 메뉴 아이템 - 활성 상태 */
.menubar-item-active {
  @apply text-primary bg-primary/20;
}

/* 메뉴 아이템 - 비활성 상태 */
.menubar-item-disabled {
  @apply text-text-muted opacity-50 cursor-not-allowed;
}

/* 메뉴 아이템 - 호버 (활성 메뉴만) */
.menubar-item:not(.menubar-item-disabled):not(.menubar-item-active):hover {
  @apply text-text bg-surface-50;
}

/* start 슬롯: 로고 */
.menubar-logo {
  @apply text-xl font-bold text-primary hover:opacity-80 transition-opacity;
}

/* end 슬롯: 프로젝트명 */
.menubar-project-name {
  @apply text-sm max-w-[200px] truncate text-text-secondary;
}

.menubar-project-name-empty {
  @apply text-text-muted italic;
}
```

---

## 4. 데이터 흐름 설계

### 4.1 초기 렌더링

```
Props 전달
  → projectName: "jjiban" (또는 빈 문자열)

Computed 계산
  → menuModel: MenuItem[] (4개 메뉴, WBS만 enabled)
  → displayProjectName: projectStore 우선, props 대체
  → projectNameClass: 프로젝트명 유무에 따라 CSS 클래스

Menubar 렌더링
  → #start: 로고 (NuxtLink)
  → :model: 4개 메뉴 (item 템플릿 적용)
  → #end: 프로젝트명 (또는 "프로젝트를 선택하세요")
```

### 4.2 메뉴 클릭 흐름

#### Case 1: 활성 메뉴 클릭 (WBS)

```
사용자 WBS 메뉴 클릭
  ↓
MenuItem.command() 호출
  → handleMenuCommand(event, 'wbs')
  ↓
disabled 체크: false (활성)
  → PrimeVue 내장 to 라우팅 동작
  ↓
router.push('/wbs')
  ↓
route.path 변경 → isActiveRoute() 재계산
  ↓
item 템플릿 re-render (활성 하이라이팅)
```

#### Case 2: 비활성 메뉴 클릭 (대시보드, 칸반, Gantt)

```
사용자 비활성 메뉴 클릭
  ↓
MenuItem.command() 호출
  → handleMenuCommand(event, 'dashboard')
  ↓
disabled 체크: true (비활성)
  → event.originalEvent.preventDefault() (라우팅 취소)
  → toast.add({ severity: 'warn', ... })
  ↓
토스트 표시: "준비 중입니다" (3초)
  ↓
라우팅 없음 (현재 페이지 유지)
```

---

## 5. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| disabled 처리 | (A) disabled + command, (B) visible 제거 | A: disabled + command | 메뉴 구조 노출, 토스트 표시 가능 |
| 활성 하이라이팅 | (A) item 템플릿, (B) Global CSS | A: item 템플릿 | 동적 라우트 반영 가능 |
| 로고 배치 | (A) start 슬롯, (B) Menubar 외부 | A: start 슬롯 | Menubar 통합 구조 일관성 |
| 프로젝트명 배치 | (A) end 슬롯, (B) Menubar 외부 | A: end 슬롯 | Menubar 통합 구조 일관성 |
| CSS 적용 방식 | (A) Pass Through, (B) Global CSS | A: Pass Through | CSS 클래스 중앙화 원칙 |
| 아이콘 사용 | (A) PrimeIcons, (B) 제거 | A: PrimeIcons | 향후 확장성 (현재 미표시) |

---

## 6. 제약사항 및 가정

### 6.1 기술적 제약

| 제약사항 | 설명 | 대응 방안 |
|---------|------|----------|
| disabled 메뉴 라우팅 | PrimeVue는 disabled 상태에서도 to 라우팅 시도 | command 내부 preventDefault() 호출 |
| item 템플릿 복잡도 | 활성 하이라이팅 로직 수동 작성 필요 | isActiveRoute() computed 함수로 단순화 |
| 기존 E2E 테스트 | data-testid 의존성 | start/end 슬롯 내부 요소에 유지 |

### 6.2 가정

- PrimeVue Menubar는 Pass Through API로 class 속성 지원
- main.css의 CSS 변수는 이미 정의되어 있음
- PrimeIcons는 현재 표시하지 않지만 MenuItem 모델에 포함 (향후 확장)
- disabled 메뉴는 시각적으로 구분되어야 함 (opacity, cursor)

---

## 7. 마이그레이션 체크리스트

### 7.1 컴포넌트 변경 사항

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| 메뉴 렌더링 | `v-for` + `<button>` | `<Menubar>` + MenuItem 모델 |
| 로고 배치 | `<div>` + `<NuxtLink>` | `#start` 슬롯 |
| 프로젝트명 배치 | `<div>` + `<span>` | `#end` 슬롯 |
| 활성 하이라이팅 | `getMenuClasses()` 함수 | `#item` 템플릿 + `isActiveRoute()` |
| disabled 처리 | `handleMenuClick()` 조건 분기 | `command` 핸들러 + `disabled` 속성 |
| CSS 스타일 | TailwindCSS 직접 사용 | Pass Through API + main.css |

### 7.2 Props 및 Emit

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| projectName | Props (선택적) | ✅ 유지 |
| menuItems | Data (내부 배열) | ❌ 제거 (menuModel로 대체) |
| navigate 이벤트 | Emit 정의 (미사용) | ❌ 제거 (PrimeVue to 사용) |

### 7.3 ARIA 속성 유지

| 속성 | 현재 | 변경 후 |
|------|------|---------|
| role="banner" | header 요소 | ✅ 유지 (header 요소) |
| role="navigation" | nav 요소 | ✅ 유지 (Menubar 내장) |
| aria-label | "메인 네비게이션" | ✅ 유지 (Menubar 내장) |
| aria-current | "page" (활성 메뉴) | ✅ 유지 (item 템플릿) |
| aria-disabled | "true" (비활성 메뉴) | ✅ 유지 (item 템플릿) |
| aria-label | 비활성 메뉴 안내 | ✅ 유지 (item 템플릿) |

---

## 8. 우선순위 및 일정

### 8.1 마이그레이션 순서

| 순서 | 작업 | 소요 시간 (예상) | 이유 |
|------|------|----------------|------|
| 1 | main.css 스타일 클래스 정의 | 30분 | 컴포넌트가 의존 |
| 2 | MenuItem 모델 작성 | 30분 | Menubar Props 의존 |
| 3 | start/end 슬롯 마이그레이션 | 30분 | 로고 및 프로젝트명 배치 |
| 4 | item 템플릿 작성 | 1시간 | 활성 하이라이팅 로직 |
| 5 | command 핸들러 구현 | 30분 | disabled 메뉴 토스트 처리 |
| 6 | Pass Through API 적용 | 30분 | CSS 클래스 중앙화 |
| 7 | ARIA 속성 검증 | 30분 | 접근성 유지 확인 |
| 8 | 회귀 테스트 | 1시간 | E2E 통과 검증 |

**총 예상 소요 시간**: 5시간

### 8.2 단계별 산출물

| 단계 | 산출물 | 검증 방법 |
|------|--------|----------|
| 상세설계 | `020-detail-design.md` | 설계리뷰 |
| 구현 | 수정된 AppHeader.vue + main.css | 로컬 테스트 |
| 테스트 | 회귀 테스트 통과 | E2E 실행 |
| 완료 | `080-manual.md` | 사용자 매뉴얼 작성 |

---

## 9. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| disabled 메뉴 라우팅 동작 | 중간 | 높음 | command 내부 preventDefault() 강제 호출 |
| item 템플릿 복잡도 증가 | 낮음 | 중간 | isActiveRoute() computed로 단순화 |
| E2E 테스트 실패 | 중간 | 높음 | data-testid 유지, 회귀 테스트 우선 |
| ARIA 속성 손실 | 낮음 | 중간 | 수동 검증 및 접근성 테스트 |
| CSS 스타일 충돌 | 낮음 | 중간 | Pass Through 클래스 명시적 정의 |

---

## 10. 수용 기준 (Acceptance Criteria)

### 10.1 기능 요구사항

| AC ID | 수용 기준 | 검증 방법 |
|-------|----------|----------|
| AC-01 | PrimeVue Menubar 사용 | 컴포넌트 코드 확인 |
| AC-02 | start 슬롯에 로고 표시 | 브라우저 렌더링 확인 |
| AC-03 | end 슬롯에 프로젝트명 표시 | 브라우저 렌더링 확인 |
| AC-04 | 4개 메뉴 표시 (대시보드, 칸반, WBS, Gantt) | 브라우저 렌더링 확인 |
| AC-05 | WBS만 활성화, 나머지는 disabled | 메뉴 클릭 동작 확인 |
| AC-06 | 활성 메뉴 Primary 색상 강조 | 브라우저 시각적 확인 |
| AC-07 | disabled 메뉴 클릭 시 토스트 표시 | 수동 테스트 |
| AC-08 | 기존 E2E 테스트 통과 | Playwright 실행 |

### 10.2 품질 기준

| QC ID | 품질 기준 | 검증 방법 |
|-------|----------|----------|
| QC-01 | CSS 클래스 중앙화 준수 | 인라인 스타일 Grep 검색 결과 0건 |
| QC-02 | ARIA 속성 유지 | 접근성 도구 검증 |
| QC-03 | 메뉴 호버 반응성 < 100ms | Chrome DevTools Performance |
| QC-04 | 다크 테마 일관성 | 시각적 검증 (Before/After) |

---

## 11. 다음 단계

- **상세설계**: `/wf:draft` 명령어로 `020-detail-design.md` 작성
  - MenuItem 모델 상세 인터페이스
  - command 핸들러 상세 로직
  - item 템플릿 HTML 구조
  - Pass Through API 명세
- **설계리뷰**: `/wf:review` 명령어로 LLM 검토

---

## 12. 참고 자료

### 내부 문서
- TSK-08-01 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-01/010-basic-design.md` (PrimeVue 통합 패턴 참조)
- TSK-08-03 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-03/010-basic-design.md` (Pass Through API 패턴 참조)
- PRD 섹션 6.1: 헤더 구조
- TRD 섹션 2.3.3: PrimeVue 최우선 사용 원칙
- TRD 섹션 2.3.6: CSS 클래스 중앙화 원칙

### PrimeVue 공식 문서
- Menubar Component: https://primevue.org/menubar/
- MenuItem Model: https://primevue.org/menumodel/
- Pass Through API: https://primevue.org/passthrough/

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
