# 상세설계 (020-detail-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 구현 가능한 수준의 명세 작성 (코드 스켈레톤, 알고리즘, 데이터 구조)
> * API 명세, 인터페이스 정의 포함
> * 단위 테스트 케이스 작성 가이드 제공
> * 기본설계 및 UI 설계와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-03 |
| Task명 | AppLayout PrimeVue Splitter Migration |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Sonnet 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 (솔루션 설계) |
| UI 설계 | `011-ui-design.md` | 전체 (레이아웃, 시각 명세) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.3, 2.3.6, 5 |

---

## 1. 컴포넌트 상세 명세

### 1.1 TypeScript 인터페이스 정의

```typescript
/**
 * AppLayout Props 인터페이스
 */
interface AppLayoutProps {
  /** 좌측 패널 초기 비율 (%) */
  leftWidth?: number
  /** 좌측 패널 최소 너비 (px) */
  minLeftWidth?: number
  /** 우측 패널 최소 너비 (px) */
  minRightWidth?: number
}

/**
 * PrimeVue SplitterResizeEvent 타입
 */
interface SplitterResizeEvent {
  /** 원본 DOM 이벤트 */
  originalEvent: Event
  /** 리사이즈 후 각 패널의 크기 [leftSize%, rightSize%] */
  sizes: [number, number]
}

/**
 * Resize Emit 페이로드
 */
interface ResizePayload {
  /** 좌측 패널 새로운 너비 (%) */
  leftWidth: number
}

/**
 * PrimeVue Pass Through API 타입
 */
interface SplitterPassThroughOptions {
  root?: {
    class?: string
    style?: Record<string, string>
  }
  gutter?: {
    class?: string
    style?: Record<string, string>
  }
  gutterHandle?: {
    class?: string
    style?: Record<string, string>
  }
}
```

### 1.2 컴포넌트 Props 명세

| Prop | 타입 | 기본값 | 필수 | 설명 |
|------|------|--------|------|------|
| leftWidth | number | 60 | No | 좌측 패널 초기 너비 (%) |
| minLeftWidth | number | 400 | No | 좌측 패널 최소 너비 (px) |
| minRightWidth | number | 300 | No | 우측 패널 최소 너비 (px) |

**Props 제약 조건**:
- `leftWidth`: 30 ~ 80 범위 (validation)
- `minLeftWidth`: 300 ~ 800 범위 권장
- `minRightWidth`: 200 ~ 600 범위 권장

### 1.3 컴포넌트 Events 명세

| Event | 페이로드 타입 | 발생 조건 | 설명 |
|-------|-------------|----------|------|
| resize | ResizePayload | Splitter 드래그 완료 시 | 리사이즈 후 좌측 패널 너비 전달 |

**Event 페이로드 예시**:

```typescript
{
  leftWidth: 55  // 좌측 패널 55%로 리사이즈됨
}
```

### 1.4 컴포넌트 Slots 명세

| Slot | 설명 | Fallback |
|------|------|----------|
| header | 헤더 영역 콘텐츠 | 기본 "jjiban" 텍스트 |
| left | 좌측 패널 콘텐츠 | "Left Panel (WBS Tree)" 텍스트 |
| right | 우측 패널 콘텐츠 | "Right Panel (Task Detail)" 텍스트 |

**Slots 사용 예시**:

```vue
<AppLayout>
  <template #header>
    <MyHeader />
  </template>
  <template #left>
    <WbsTreePanel />
  </template>
  <template #right>
    <TaskDetailPanel />
  </template>
</AppLayout>
```

---

## 2. 핵심 로직 상세 설계

### 2.1 minSize px → % 변환 로직

**목표**: PrimeVue Splitter의 minSize는 %만 지원하므로, px 값을 %로 변환

**기준 너비**: 1200px (min-width 기준)

**변환 공식**:

```
minSizePercent = (minSizePx / containerWidth) * 100
```

**구현 코드**:

```typescript
/**
 * 좌측 패널 최소 크기 (%)
 * Props의 minLeftWidth (px)를 %로 변환
 */
const minLeftSizePercent = computed(() => {
  const containerWidth = 1200  // min-width 기준
  return (props.minLeftWidth / containerWidth) * 100
})

/**
 * 우측 패널 최소 크기 (%)
 * Props의 minRightWidth (px)를 %로 변환
 */
const minRightSizePercent = computed(() => {
  const containerWidth = 1200  // min-width 기준
  return (props.minRightWidth / containerWidth) * 100
})
```

**변환 결과 예시**:

| px 값 | 변환 결과 (%) | 계산 |
|-------|--------------|------|
| 400px | 33.33% | (400 / 1200) * 100 |
| 300px | 25% | (300 / 1200) * 100 |

**검증 로직**:

```typescript
/**
 * minSize 변환 결과 검증 (개발 모드)
 */
if (import.meta.dev) {
  const totalMinPercent = minLeftSizePercent.value + minRightSizePercent.value
  if (totalMinPercent > 100) {
    console.warn(
      `AppLayout: minSize 합계가 100%를 초과합니다 (${totalMinPercent.toFixed(2)}%). ` +
      `minLeftWidth 또는 minRightWidth를 조정하세요.`
    )
  }
}
```

### 2.2 Props 유효성 검증

**현재 유지 로직**:

```typescript
/**
 * leftWidth Props 유효성 검증
 * 30% ~ 80% 범위 제약
 */
const validatedLeftWidth = computed(() => {
  const value = props.leftWidth
  if (value < 30) return 30
  if (value > 80) return 80
  return value
})

/**
 * 우측 패널 너비 계산
 */
const rightWidth = computed(() => 100 - validatedLeftWidth.value)
```

**검증 이유**:
- 너무 좁거나 넓은 비율 방지 (UX 품질)
- minSize 제약과 충돌 방지

### 2.3 resize 이벤트 핸들러

**목표**: Splitter @resize 이벤트를 받아 부모 컴포넌트로 emit

**구현 코드**:

```typescript
/**
 * Splitter resize 이벤트 핸들러
 * @param event SplitterResizeEvent - PrimeVue Splitter 이벤트
 */
const handleResize = (event: SplitterResizeEvent): void => {
  const [leftSize, rightSize] = event.sizes

  // 개발 모드 디버깅 로그
  if (import.meta.dev) {
    console.log('[AppLayout] Resize:', {
      leftSize: `${leftSize.toFixed(2)}%`,
      rightSize: `${rightSize.toFixed(2)}%`
    })
  }

  // 부모 컴포넌트로 resize 이벤트 emit
  emit('resize', { leftWidth: leftSize })
}
```

**이벤트 흐름**:

```
사용자 드래그 완료
  ↓
Splitter @resize 발생
  ↓
handleResize() 실행
  ↓
emit('resize', { leftWidth: 55 })
  ↓
부모 컴포넌트 처리 (선택적)
```

**부모 컴포넌트 사용 예시**:

```vue
<script setup lang="ts">
const handleLayoutResize = (payload: ResizePayload) => {
  console.log(`Layout resized: ${payload.leftWidth}%`)

  // 선택적: localStorage 저장
  localStorage.setItem('app-layout-width', payload.leftWidth.toString())
}
</script>

<template>
  <AppLayout @resize="handleLayoutResize">
    <!-- slots -->
  </AppLayout>
</template>
```

---

## 3. Pass Through API 상세 설계

### 3.1 Pass Through 구조

**목표**: CSS 클래스 중앙화 원칙 준수 (TRD 2.3.6)

**구현 코드**:

```typescript
/**
 * PrimeVue Splitter Pass Through API
 * CSS 클래스를 main.css로 중앙 관리
 */
const splitterPassThrough = computed((): SplitterPassThroughOptions => ({
  root: {
    class: 'app-layout-splitter'
  },
  gutter: {
    class: 'app-layout-gutter'
  },
  gutterHandle: {
    class: 'app-layout-gutter-handle'
  }
}))
```

### 3.2 Pass Through 클래스 매핑

| Pass Through 키 | CSS 클래스 | 역할 |
|----------------|-----------|------|
| root | app-layout-splitter | Splitter 루트 컨테이너 |
| gutter | app-layout-gutter | 드래그 가능한 구분선 |
| gutterHandle | app-layout-gutter-handle | Gutter 중앙 시각 표시 |

### 3.3 main.css 스타일 정의

**파일 위치**: `app/assets/css/main.css`

**추가 위치**: ProgressBar 스타일 섹션 이후

**스타일 코드**:

```css
/* ============================================
 * AppLayout Splitter 스타일 (TSK-08-03)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* Splitter 루트 컨테이너 */
.app-layout-splitter {
  @apply h-full;
  min-width: 1200px; /* 반응형 최소 너비 */
}

/* Gutter (구분선) - 기본 상태 */
.app-layout-gutter {
  @apply transition-colors duration-200;
  width: 4px;
  background-color: var(--color-border);
  cursor: col-resize;
}

/* Gutter - Hover 상태 */
.app-layout-gutter:hover {
  background-color: var(--color-border-light);
}

/* Gutter - Active (드래그 중) 상태 */
.app-layout-gutter:active {
  background-color: var(--color-primary);
}

/* Gutter - 포커스 상태 (키보드 탐색) */
.app-layout-gutter:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Gutter Handle (드래그 핸들 시각 표시) */
.app-layout-gutter-handle {
  @apply rounded-full;
  width: 2px;
  height: 24px;
  background-color: rgba(59, 130, 246, 0.3); /* primary/30 */
  margin: auto; /* 중앙 정렬 */
}

/* Gutter Handle - Hover 상태 */
.app-layout-gutter:hover .app-layout-gutter-handle {
  background-color: rgba(59, 130, 246, 0.5); /* primary/50 */
}

/* Gutter Handle - Active (드래그 중) 상태 */
.app-layout-gutter:active .app-layout-gutter-handle {
  background-color: rgba(59, 130, 246, 0.8); /* primary/80 */
}
```

**CSS 변수 의존성**:

| CSS 변수 | 정의 위치 | 용도 |
|---------|----------|------|
| --color-border | main.css :root | Gutter 기본 배경 |
| --color-border-light | main.css :root | Gutter hover 배경 |
| --color-primary | main.css :root | Gutter active, Handle |

---

## 4. 컴포넌트 구현 명세

### 4.1 AppLayout.vue 전체 구조

```vue
<script setup lang="ts">
/**
 * AppLayout 컴포넌트
 * - PrimeVue Splitter 기반 레이아웃
 * - 드래그 리사이즈 기능 지원
 * - Header + 좌우 분할 Content
 *
 * @see TSK-08-03
 * @see 020-detail-design.md
 */

import { computed } from 'vue'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

// ==================== 인터페이스 정의 ====================

interface Props {
  /** 좌측 패널 초기 비율 (%) */
  leftWidth?: number
  /** 좌측 패널 최소 너비 (px) */
  minLeftWidth?: number
  /** 우측 패널 최소 너비 (px) */
  minRightWidth?: number
}

interface SplitterResizeEvent {
  originalEvent: Event
  sizes: [number, number]
}

interface ResizePayload {
  leftWidth: number
}

interface SplitterPassThroughOptions {
  root?: { class?: string }
  gutter?: { class?: string }
  gutterHandle?: { class?: string }
}

// ==================== Props & Emit ====================

const props = withDefaults(defineProps<Props>(), {
  leftWidth: 60,
  minLeftWidth: 400,
  minRightWidth: 300
})

const emit = defineEmits<{
  resize: [payload: ResizePayload]
}>()

// ==================== Computed ====================

/**
 * leftWidth Props 유효성 검증 (30% ~ 80%)
 */
const validatedLeftWidth = computed(() => {
  const value = props.leftWidth
  if (value < 30) return 30
  if (value > 80) return 80
  return value
})

/**
 * 우측 패널 너비 계산
 */
const rightWidth = computed(() => 100 - validatedLeftWidth.value)

/**
 * 좌측 패널 최소 크기 (%) - px → % 변환
 * 1200px 기준으로 400px → 33.33%
 */
const minLeftSizePercent = computed(() => {
  const containerWidth = 1200
  return (props.minLeftWidth / containerWidth) * 100
})

/**
 * 우측 패널 최소 크기 (%) - px → % 변환
 * 1200px 기준으로 300px → 25%
 */
const minRightSizePercent = computed(() => {
  const containerWidth = 1200
  return (props.minRightWidth / containerWidth) * 100
})

/**
 * PrimeVue Splitter Pass Through API
 * CSS 클래스 중앙화 (main.css)
 */
const splitterPassThrough = computed((): SplitterPassThroughOptions => ({
  root: {
    class: 'app-layout-splitter'
  },
  gutter: {
    class: 'app-layout-gutter'
  },
  gutterHandle: {
    class: 'app-layout-gutter-handle'
  }
}))

// ==================== Methods ====================

/**
 * Splitter resize 이벤트 핸들러
 * @param event SplitterResizeEvent
 */
const handleResize = (event: SplitterResizeEvent): void => {
  const [leftSize, _rightSize] = event.sizes

  if (import.meta.dev) {
    console.log('[AppLayout] Resize:', {
      leftSize: `${leftSize.toFixed(2)}%`,
      rightSize: `${_rightSize.toFixed(2)}%`
    })
  }

  emit('resize', { leftWidth: leftSize })
}

// ==================== Development Mode Validation ====================

if (import.meta.dev) {
  const totalMinPercent = minLeftSizePercent.value + minRightSizePercent.value
  if (totalMinPercent > 100) {
    console.warn(
      `[AppLayout] minSize 합계가 100%를 초과합니다 (${totalMinPercent.toFixed(2)}%). ` +
      `minLeftWidth 또는 minRightWidth를 조정하세요.`
    )
  }
}
</script>

<template>
  <div
    data-testid="app-layout"
    class="min-w-[1200px] h-screen flex flex-col bg-bg"
  >
    <!-- Header 영역 (56px 고정) -->
    <header
      data-testid="app-header-container"
      class="h-[56px] w-full flex-shrink-0 bg-bg-header border-b border-border"
      role="banner"
    >
      <slot name="header">
        <div class="h-full flex items-center px-4">
          <span class="text-text font-semibold">jjiban</span>
        </div>
      </slot>
    </header>

    <!-- Content 영역 (Splitter 기반) -->
    <main
      data-testid="app-content"
      class="flex-1 overflow-hidden"
      role="main"
    >
      <Splitter
        layout="horizontal"
        :pt="splitterPassThrough"
        @resize="handleResize"
      >
        <!-- 좌측 패널 (WBS Tree 영역) -->
        <SplitterPanel
          :size="validatedLeftWidth"
          :minSize="minLeftSizePercent"
        >
          <aside
            data-testid="left-panel"
            class="h-full bg-bg-sidebar overflow-auto border-r border-border"
            role="complementary"
            aria-label="WBS Tree Panel"
          >
            <slot name="left">
              <div class="p-4 text-text-secondary">
                Left Panel (WBS Tree)
              </div>
            </slot>
          </aside>
        </SplitterPanel>

        <!-- 우측 패널 (Detail 영역) -->
        <SplitterPanel
          :size="rightWidth"
          :minSize="minRightSizePercent"
        >
          <section
            data-testid="right-panel"
            class="h-full bg-bg overflow-auto"
            role="region"
            aria-label="Task Detail"
          >
            <slot name="right">
              <div class="p-4 text-text-secondary">
                Right Panel (Task Detail)
              </div>
            </slot>
          </section>
        </SplitterPanel>
      </Splitter>
    </main>
  </div>
</template>
```

### 4.2 변경 사항 요약

| 변경 항목 | Before | After |
|---------|--------|-------|
| 패널 분할 | `<aside>` + `:style` 인라인 | `<Splitter>` + `<SplitterPanel>` |
| 크기 제어 | `:style="{ width: '%' }"` | `:size="number"` Props |
| minSize | `:style="{ minWidth: 'px' }"` | `:minSize="percent"` (computed) |
| 리사이즈 | 미지원 | `@resize` 이벤트 + handleResize() |
| CSS | 인라인 스타일 | Pass Through API + main.css |
| ARIA | `<aside>` role="complementary" | SplitterPanel 내부 `<aside>` 유지 |

### 4.3 Import 추가

**필요한 PrimeVue 컴포넌트**:

```typescript
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
```

**package.json 확인 필요**:
- `primevue` 버전 4.x 이상

---

## 5. 접근성 명세

### 5.1 ARIA 속성 유지

**기존 ARIA 속성**:

```html
<!-- Header -->
<header role="banner">

<!-- Left Panel -->
<aside role="complementary" aria-label="WBS Tree Panel">

<!-- Right Panel -->
<section role="region" aria-label="Task Detail">
```

**변경 후**:
- Header: role="banner" ✅ 유지
- Left Panel: SplitterPanel 내부 `<aside>` 유지 ✅
- Right Panel: SplitterPanel 내부 `<section>` 유지 ✅

**PrimeVue Splitter 자동 ARIA**:

```html
<div
  role="separator"
  aria-orientation="horizontal"
  aria-valuemin="33.33"
  aria-valuemax="75"
  aria-valuenow="60"
  aria-label="Resize panels"
  tabindex="0"
>
```

### 5.2 키보드 탐색 지원

**PrimeVue Splitter 내장 키보드 기능**:

| 키 | 동작 |
|----|------|
| Tab | Gutter 포커스 |
| ← (Left Arrow) | 좌측 패널 확대 (5% 단위) |
| → (Right Arrow) | 우측 패널 확대 (5% 단위) |
| Home | 좌측 패널 최소 크기 |
| End | 우측 패널 최소 크기 |

**포커스 스타일**: main.css `.app-layout-gutter:focus-visible` 정의

---

## 6. 단위 테스트 케이스

### 6.1 Props 유효성 검증 테스트

```typescript
describe('AppLayout Props Validation', () => {
  it('leftWidth < 30일 때 30으로 제한', () => {
    const wrapper = mount(AppLayout, {
      props: { leftWidth: 20 }
    })
    const computed = wrapper.vm.validatedLeftWidth
    expect(computed).toBe(30)
  })

  it('leftWidth > 80일 때 80으로 제한', () => {
    const wrapper = mount(AppLayout, {
      props: { leftWidth: 90 }
    })
    const computed = wrapper.vm.validatedLeftWidth
    expect(computed).toBe(80)
  })

  it('leftWidth 정상 범위일 때 그대로 사용', () => {
    const wrapper = mount(AppLayout, {
      props: { leftWidth: 60 }
    })
    const computed = wrapper.vm.validatedLeftWidth
    expect(computed).toBe(60)
  })
})
```

### 6.2 minSize 변환 테스트

```typescript
describe('AppLayout minSize Conversion', () => {
  it('minLeftWidth 400px → 33.33%', () => {
    const wrapper = mount(AppLayout, {
      props: { minLeftWidth: 400 }
    })
    const computed = wrapper.vm.minLeftSizePercent
    expect(computed).toBeCloseTo(33.33, 2)
  })

  it('minRightWidth 300px → 25%', () => {
    const wrapper = mount(AppLayout, {
      props: { minRightWidth: 300 }
    })
    const computed = wrapper.vm.minRightSizePercent
    expect(computed).toBeCloseTo(25, 2)
  })

  it('minSize 합계 100% 초과 시 경고 로그', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    mount(AppLayout, {
      props: { minLeftWidth: 800, minRightWidth: 600 }
    })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('minSize 합계가 100%를 초과합니다')
    )
  })
})
```

### 6.3 resize 이벤트 테스트

```typescript
describe('AppLayout resize Event', () => {
  it('handleResize 호출 시 emit 발생', async () => {
    const wrapper = mount(AppLayout)
    const splitter = wrapper.findComponent(Splitter)

    // Splitter @resize 이벤트 시뮬레이션
    await splitter.vm.$emit('resize', {
      originalEvent: new Event('resize'),
      sizes: [55, 45]
    })

    expect(wrapper.emitted('resize')).toBeTruthy()
    expect(wrapper.emitted('resize')![0]).toEqual([
      { leftWidth: 55 }
    ])
  })
})
```

### 6.4 Pass Through API 테스트

```typescript
describe('AppLayout Pass Through API', () => {
  it('Splitter에 Pass Through 전달', () => {
    const wrapper = mount(AppLayout)
    const splitter = wrapper.findComponent(Splitter)

    expect(splitter.props('pt')).toEqual({
      root: { class: 'app-layout-splitter' },
      gutter: { class: 'app-layout-gutter' },
      gutterHandle: { class: 'app-layout-gutter-handle' }
    })
  })
})
```

---

## 7. E2E 테스트 시나리오

### 7.1 초기 렌더링 테스트

```typescript
test('AppLayout 60:40 초기 비율 표시', async ({ page }) => {
  await page.goto('/dashboard')

  // 좌측 패널 너비 측정
  const leftPanel = page.getByTestId('left-panel')
  const leftBox = await leftPanel.boundingBox()

  // 우측 패널 너비 측정
  const rightPanel = page.getByTestId('right-panel')
  const rightBox = await rightPanel.boundingBox()

  // 비율 계산
  const totalWidth = leftBox!.width + rightBox!.width
  const leftRatio = (leftBox!.width / totalWidth) * 100
  const rightRatio = (rightBox!.width / totalWidth) * 100

  // 60:40 비율 검증 (오차 ±2%)
  expect(leftRatio).toBeCloseTo(60, 0)
  expect(rightRatio).toBeCloseTo(40, 0)
})
```

### 7.2 드래그 리사이즈 테스트

```typescript
test('Gutter 드래그로 리사이즈', async ({ page }) => {
  await page.goto('/dashboard')

  // Gutter 요소 찾기 (PrimeVue Splitter gutter)
  const gutter = page.locator('.app-layout-gutter')

  // Gutter 드래그 (우측으로 100px 이동)
  await gutter.dragTo(gutter, {
    sourcePosition: { x: 0, y: 200 },
    targetPosition: { x: 100, y: 200 }
  })

  // 리사이즈 후 패널 너비 측정
  const leftPanel = page.getByTestId('left-panel')
  const leftBox = await leftPanel.boundingBox()

  // 너비가 변경되었는지 확인
  expect(leftBox!.width).toBeGreaterThan(720) // 60% 기준 초과
})
```

### 7.3 minSize 제약 테스트

```typescript
test('좌측 패널 최소 400px 제약', async ({ page }) => {
  await page.goto('/dashboard')

  const gutter = page.locator('.app-layout-gutter')

  // Gutter를 좌측 끝까지 드래그 (최소 크기 도달 시도)
  await gutter.dragTo(gutter, {
    sourcePosition: { x: 0, y: 200 },
    targetPosition: { x: -500, y: 200 }
  })

  // 좌측 패널 너비 측정
  const leftPanel = page.getByTestId('left-panel')
  const leftBox = await leftPanel.boundingBox()

  // 최소 400px 유지 검증
  expect(leftBox!.width).toBeGreaterThanOrEqual(400)
})
```

### 7.4 키보드 탐색 테스트

```typescript
test('Tab 키로 Gutter 포커스', async ({ page }) => {
  await page.goto('/dashboard')

  // Tab 키로 Gutter 포커스
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab') // 필요 시 반복

  // Gutter 포커스 확인
  const gutter = page.locator('.app-layout-gutter')
  await expect(gutter).toBeFocused()

  // 포커스 outline 스타일 확인
  const outlineColor = await gutter.evaluate(el =>
    window.getComputedStyle(el).outlineColor
  )
  expect(outlineColor).toContain('59, 130, 246') // primary 색상
})

test('화살표 키로 리사이즈', async ({ page }) => {
  await page.goto('/dashboard')

  // Gutter 포커스
  const gutter = page.locator('.app-layout-gutter')
  await gutter.focus()

  // → (Right Arrow) 키 입력 (좌측 패널 축소)
  await page.keyboard.press('ArrowRight')

  // 패널 너비 변경 확인
  const leftPanel = page.getByTestId('left-panel')
  const leftBox = await leftPanel.boundingBox()

  // 60% → 55% 감소 확인
  const totalWidth = 1200
  const expectedWidth = (totalWidth * 55) / 100
  expect(leftBox!.width).toBeCloseTo(expectedWidth, 0)
})
```

---

## 8. CSS 클래스 검증

### 8.1 인라인 스타일 제거 검증

**검증 방법**: Grep 검색

```bash
# AppLayout.vue에서 :style 검색 (결과 0건 기대)
grep -n ":style" app/components/layout/AppLayout.vue
```

**기대 결과**: 인라인 스타일 사용 없음 (Pass Through 및 Tailwind 클래스만 사용)

### 8.2 CSS 클래스 존재 검증

**검증 방법**: main.css 확인

```bash
# main.css에서 app-layout-* 클래스 검색
grep -n "app-layout-" app/assets/css/main.css
```

**기대 결과**:
- `.app-layout-splitter`
- `.app-layout-gutter`
- `.app-layout-gutter:hover`
- `.app-layout-gutter:active`
- `.app-layout-gutter:focus-visible`
- `.app-layout-gutter-handle`

---

## 9. 성능 검증

### 9.1 드래그 리사이즈 성능

**측정 도구**: Chrome DevTools Performance

**측정 방법**:
1. Performance 탭 녹화 시작
2. Gutter 드래그 (좌우 반복)
3. 녹화 중지 및 분석

**성능 기준**:

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 프레임 속도 | 60 FPS | Main Thread 활동 확인 |
| 리사이즈 지연 | < 16ms | requestAnimationFrame 기준 |
| 렌더링 시간 | < 100ms | Paint/Layout 시간 합산 |

### 9.2 메모리 누수 검증

**측정 방법**:
1. Chrome DevTools Memory 탭
2. 드래그 리사이즈 100회 반복
3. Heap Snapshot 비교

**기대 결과**: 메모리 사용량 증가 < 5%

---

## 10. 브라우저 호환성 검증

| 브라우저 | 버전 | 테스트 항목 |
|---------|------|-----------|
| Chrome | 최신 | 전체 기능 테스트 |
| Firefox | 최신 | 드래그 리사이즈, 키보드 탐색 |
| Edge | 최신 | 시각적 회귀 테스트 |
| Safari | 최신 (선택) | CSS 변수, col-resize 커서 |

**검증 도구**:
- BrowserStack (크로스 브라우저 테스트)
- Playwright (자동화 테스트)

---

## 11. 배포 전 체크리스트

### 11.1 코드 품질

- [ ] TypeScript 타입 에러 없음 (`tsc --noEmit`)
- [ ] ESLint 에러 없음 (`npm run lint`)
- [ ] Prettier 포맷 적용 (`npm run format`)
- [ ] 인라인 스타일 제거 확인 (`:style` 검색 0건)

### 11.2 테스트

- [ ] 단위 테스트 통과 (Props, Computed, Events)
- [ ] E2E 테스트 통과 (초기 렌더링, 드래그, 키보드)
- [ ] 회귀 테스트 통과 (기존 E2E 테스트)
- [ ] 접근성 테스트 (axe DevTools)

### 11.3 문서

- [ ] 020-detail-design.md 완료
- [ ] 025-traceability-matrix.md 완료
- [ ] 026-test-specification.md 완료
- [ ] 030-implementation.md 작성 준비

### 11.4 시각 검증

- [ ] 60:40 초기 비율 표시 확인
- [ ] Gutter hover 색상 확인
- [ ] Gutter active 색상 확인
- [ ] Gutter 포커스 outline 확인
- [ ] Handle 투명도 변화 확인

---

## 12. 다음 단계

**추적성 매트릭스 작성** (`025-traceability-matrix.md`):
- 요구사항 → 설계 → 구현 → 테스트 추적성

**테스트 명세 작성** (`026-test-specification.md`):
- 단위 테스트 케이스 상세화
- E2E 테스트 시나리오 상세화

**상태 업데이트**:
- wbs.md 상태: [bd] → [dd]

---

## 13. 참고 자료

### 내부 문서
- `010-basic-design.md`: 솔루션 설계 전체 컨텍스트
- `011-ui-design.md`: 레이아웃 및 시각 명세
- TSK-08-01 `020-detail-design.md`: PrimeVue 통합 패턴
- TSK-08-02 `020-detail-design.md`: CSS 클래스 중앙화 패턴

### PrimeVue 공식 문서
- Splitter API: https://primevue.org/splitter/#api
- Pass Through: https://primevue.org/passthrough/
- SplitterPanel API: https://primevue.org/splitter/#api.SplitterPanel

### TypeScript
- Computed Types: https://vuejs.org/guide/typescript/composition-api.html#typing-computed
- Emit Types: https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

---

<!--
author: Claude Sonnet 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
