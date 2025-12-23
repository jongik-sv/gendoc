# 테스트 명세 (026-test-specification.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **문서 목적**
> * 단위 테스트, E2E 테스트, 성능 테스트 케이스 상세 명세
> * 테스트 자동화 스크립트 및 실행 절차 정의
> * 품질 보증을 위한 검증 기준 명확화

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

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `010-basic-design.md` |
| UI 설계 | `011-ui-design.md` |
| 상세설계 | `020-detail-design.md` |
| 추적성 매트릭스 | `025-traceability-matrix.md` |

---

## 1. 테스트 전략

### 1.1 테스트 피라미드

```
        ┌─────────────────┐
        │  E2E Tests (8)  │  시각적, 통합 시나리오
        ├─────────────────┤
        │ Component (8)   │  단위 테스트
        └─────────────────┘
       /                   \
    Manual (10)         Automated (20)
```

### 1.2 테스트 범위

| 테스트 레벨 | 테스트 개수 | 자동화 | 도구 |
|-----------|-----------|--------|------|
| 단위 테스트 | 8 | 100% | Vitest |
| 컴포넌트 테스트 | 8 | 87.5% | Playwright |
| 시각적 회귀 테스트 | 6 | 16.7% | Playwright + 수동 |
| 성능 테스트 | 3 | 0% | Chrome DevTools |
| 코드 품질 테스트 | 5 | 80% | ESLint, TypeScript |

**총 테스트 케이스**: 30개 (자동화 20개, 수동 10개)

### 1.3 수용 기준

| 기준 | 목표 | 필수 |
|------|------|------|
| 단위 테스트 통과율 | 100% | ✅ |
| E2E 테스트 통과율 | 100% | ✅ |
| 코드 커버리지 | ≥ 90% | ✅ |
| TypeScript 타입 에러 | 0건 | ✅ |
| ESLint 에러 | 0건 | ✅ |
| 성능 목표 달성 | 100% | ✅ |

---

## 2. 단위 테스트 명세

### 2.1 테스트 환경 설정

**테스트 프레임워크**: Vitest + Vue Test Utils

**설정 파일**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/components/**/*.vue'],
      exclude: ['**/*.spec.ts', '**/*.test.ts']
    }
  }
})
```

### 2.2 테스트 케이스: Props 유효성 검증

**파일**: `app/components/layout/AppLayout.spec.ts`

**테스트 ID**: TC-UNIT-01

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLayout from './AppLayout.vue'

describe('AppLayout Props Validation', () => {
  describe('TC-UNIT-01-A: leftWidth 하한 제한 (30%)', () => {
    it('leftWidth < 30일 때 validatedLeftWidth는 30을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 20 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(30)
    })

    it('leftWidth = 10일 때 validatedLeftWidth는 30을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 10 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(30)
    })
  })

  describe('TC-UNIT-01-B: leftWidth 상한 제한 (80%)', () => {
    it('leftWidth > 80일 때 validatedLeftWidth는 80을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 90 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(80)
    })

    it('leftWidth = 100일 때 validatedLeftWidth는 80을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 100 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(80)
    })
  })

  describe('TC-UNIT-01-C: leftWidth 정상 범위', () => {
    it('leftWidth = 60일 때 validatedLeftWidth는 60을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 60 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(60)
    })

    it('leftWidth = 50일 때 validatedLeftWidth는 50을 반환해야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 50 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(50)
    })

    it('leftWidth = 30일 때 validatedLeftWidth는 30을 반환해야 함 (경계값)', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 30 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(30)
    })

    it('leftWidth = 80일 때 validatedLeftWidth는 80을 반환해야 함 (경계값)', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 80 }
      })

      const vm = wrapper.vm as any
      expect(vm.validatedLeftWidth).toBe(80)
    })
  })

  describe('TC-UNIT-01-D: rightWidth 계산', () => {
    it('leftWidth = 60일 때 rightWidth는 40이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 60 }
      })

      const vm = wrapper.vm as any
      expect(vm.rightWidth).toBe(40)
    })

    it('leftWidth = 70일 때 rightWidth는 30이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { leftWidth: 70 }
      })

      const vm = wrapper.vm as any
      expect(vm.rightWidth).toBe(30)
    })
  })
})
```

### 2.3 테스트 케이스: minSize 변환 로직

**테스트 ID**: TC-UNIT-02

```typescript
describe('AppLayout minSize Conversion', () => {
  describe('TC-UNIT-02-A: minLeftWidth px → % 변환', () => {
    it('minLeftWidth = 400px일 때 minLeftSizePercent는 33.33%이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { minLeftWidth: 400 }
      })

      const vm = wrapper.vm as any
      expect(vm.minLeftSizePercent).toBeCloseTo(33.33, 2)
    })

    it('minLeftWidth = 600px일 때 minLeftSizePercent는 50%이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { minLeftWidth: 600 }
      })

      const vm = wrapper.vm as any
      expect(vm.minLeftSizePercent).toBeCloseTo(50, 2)
    })

    it('minLeftWidth = 240px일 때 minLeftSizePercent는 20%이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { minLeftWidth: 240 }
      })

      const vm = wrapper.vm as any
      expect(vm.minLeftSizePercent).toBeCloseTo(20, 2)
    })
  })

  describe('TC-UNIT-02-B: minRightWidth px → % 변환', () => {
    it('minRightWidth = 300px일 때 minRightSizePercent는 25%이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { minRightWidth: 300 }
      })

      const vm = wrapper.vm as any
      expect(vm.minRightSizePercent).toBeCloseTo(25, 2)
    })

    it('minRightWidth = 480px일 때 minRightSizePercent는 40%이어야 함', () => {
      const wrapper = mount(AppLayout, {
        props: { minRightWidth: 480 }
      })

      const vm = wrapper.vm as any
      expect(vm.minRightSizePercent).toBeCloseTo(40, 2)
    })
  })

  describe('TC-UNIT-02-C: minSize 합계 검증 (개발 모드)', () => {
    it('minSize 합계가 100% 초과 시 경고 로그 출력', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn')

      mount(AppLayout, {
        props: {
          minLeftWidth: 800,   // 66.67%
          minRightWidth: 600   // 50%
        }
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('minSize 합계가 100%를 초과합니다')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('116.67%')
      )

      consoleWarnSpy.mockRestore()
    })

    it('minSize 합계가 100% 이하일 때 경고 없음', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn')

      mount(AppLayout, {
        props: {
          minLeftWidth: 400,   // 33.33%
          minRightWidth: 300   // 25%
        }
      })

      expect(consoleWarnSpy).not.toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })
})
```

### 2.4 테스트 케이스: resize 이벤트

**테스트 ID**: TC-UNIT-03

```typescript
import Splitter from 'primevue/splitter'

describe('AppLayout resize Event', () => {
  it('TC-UNIT-03: Splitter @resize 이벤트 시 emit 발생', async () => {
    const wrapper = mount(AppLayout)
    const splitter = wrapper.findComponent(Splitter)

    // Splitter @resize 이벤트 시뮬레이션
    await splitter.vm.$emit('resize', {
      originalEvent: new Event('resize'),
      sizes: [55, 45]
    })

    // resize 이벤트 emit 확인
    expect(wrapper.emitted('resize')).toBeTruthy()
    expect(wrapper.emitted('resize')!.length).toBe(1)
    expect(wrapper.emitted('resize')![0]).toEqual([
      { leftWidth: 55 }
    ])
  })

  it('TC-UNIT-03-B: 여러 번 리사이즈 시 모든 이벤트 emit', async () => {
    const wrapper = mount(AppLayout)
    const splitter = wrapper.findComponent(Splitter)

    // 첫 번째 리사이즈
    await splitter.vm.$emit('resize', {
      originalEvent: new Event('resize'),
      sizes: [50, 50]
    })

    // 두 번째 리사이즈
    await splitter.vm.$emit('resize', {
      originalEvent: new Event('resize'),
      sizes: [70, 30]
    })

    expect(wrapper.emitted('resize')!.length).toBe(2)
    expect(wrapper.emitted('resize')![0]).toEqual([{ leftWidth: 50 }])
    expect(wrapper.emitted('resize')![1]).toEqual([{ leftWidth: 70 }])
  })
})
```

### 2.5 테스트 케이스: Pass Through API

**테스트 ID**: TC-UNIT-04

```typescript
describe('AppLayout Pass Through API', () => {
  it('TC-UNIT-04: Splitter에 Pass Through 객체 전달', () => {
    const wrapper = mount(AppLayout)
    const splitter = wrapper.findComponent(Splitter)

    expect(splitter.props('pt')).toEqual({
      root: { class: 'app-layout-splitter' },
      gutter: { class: 'app-layout-gutter' },
      gutterHandle: { class: 'app-layout-gutter-handle' }
    })
  })

  it('TC-UNIT-04-B: Pass Through 객체가 반응형으로 업데이트되지 않음 (정적)', () => {
    const wrapper = mount(AppLayout)
    const vm = wrapper.vm as any

    const pt1 = vm.splitterPassThrough
    const pt2 = vm.splitterPassThrough

    // Computed이지만 매번 새 객체를 반환하지 않음 (캐싱)
    expect(pt1).toEqual(pt2)
  })
})
```

### 2.6 단위 테스트 실행 명령어

```bash
# 전체 단위 테스트 실행
npm run test:unit

# 특정 파일만 실행
npm run test:unit AppLayout.spec.ts

# 커버리지 리포트 생성
npm run test:coverage

# Watch 모드 (개발 중)
npm run test:unit -- --watch
```

**기대 결과**:
- 모든 테스트 통과 (8/8)
- 코드 커버리지 ≥ 90%

---

## 3. E2E 테스트 명세

### 3.1 테스트 환경 설정

**테스트 프레임워크**: Playwright

**설정 파일**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 3.2 테스트 케이스: 초기 렌더링 (60:40 비율)

**테스트 ID**: TC-E2E-01

**파일**: `tests/e2e/app-layout.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('AppLayout 초기 렌더링', () => {
  test('TC-E2E-01: 60:40 초기 비율 표시', async ({ page }) => {
    await page.goto('/dashboard')

    // 좌측 패널 너비 측정
    const leftPanel = page.getByTestId('left-panel')
    const leftBox = await leftPanel.boundingBox()
    expect(leftBox).not.toBeNull()

    // 우측 패널 너비 측정
    const rightPanel = page.getByTestId('right-panel')
    const rightBox = await rightPanel.boundingBox()
    expect(rightBox).not.toBeNull()

    // 총 너비 계산
    const totalWidth = leftBox!.width + rightBox!.width

    // 비율 계산
    const leftRatio = (leftBox!.width / totalWidth) * 100
    const rightRatio = (rightBox!.width / totalWidth) * 100

    // 60:40 비율 검증 (오차 ±2%)
    expect(leftRatio).toBeGreaterThanOrEqual(58)
    expect(leftRatio).toBeLessThanOrEqual(62)
    expect(rightRatio).toBeGreaterThanOrEqual(38)
    expect(rightRatio).toBeLessThanOrEqual(42)
  })

  test('TC-E2E-01-B: Header 높이 56px 고정', async ({ page }) => {
    await page.goto('/dashboard')

    const header = page.getByTestId('app-header-container')
    const headerBox = await header.boundingBox()
    expect(headerBox).not.toBeNull()

    // Header 높이 검증
    expect(headerBox!.height).toBe(56)
  })

  test('TC-E2E-01-C: 슬롯 콘텐츠 표시 확인', async ({ page }) => {
    await page.goto('/dashboard')

    // 좌측 슬롯 콘텐츠 존재 확인
    const leftPanel = page.getByTestId('left-panel')
    await expect(leftPanel).toBeVisible()

    // 우측 슬롯 콘텐츠 존재 확인
    const rightPanel = page.getByTestId('right-panel')
    await expect(rightPanel).toBeVisible()
  })
})
```

### 3.3 테스트 케이스: 드래그 리사이즈

**테스트 ID**: TC-E2E-02

```typescript
test.describe('AppLayout 드래그 리사이즈', () => {
  test('TC-E2E-02: Gutter 드래그로 패널 크기 변경', async ({ page }) => {
    await page.goto('/dashboard')

    // 초기 좌측 패널 너비 측정
    const leftPanel = page.getByTestId('left-panel')
    const initialLeftBox = await leftPanel.boundingBox()
    const initialLeftWidth = initialLeftBox!.width

    // Gutter 요소 찾기
    const gutter = page.locator('.app-layout-gutter').first()

    // Gutter 드래그 (우측으로 100px 이동)
    await gutter.dragTo(gutter, {
      sourcePosition: { x: 0, y: 200 },
      targetPosition: { x: 100, y: 200 }
    })

    // 대기 (리사이즈 완료)
    await page.waitForTimeout(300)

    // 리사이즈 후 패널 너비 측정
    const finalLeftBox = await leftPanel.boundingBox()
    const finalLeftWidth = finalLeftBox!.width

    // 너비가 증가했는지 확인
    expect(finalLeftWidth).toBeGreaterThan(initialLeftWidth)
  })

  test('TC-E2E-02-B: Gutter hover 시 커서 변경', async ({ page }) => {
    await page.goto('/dashboard')

    const gutter = page.locator('.app-layout-gutter').first()

    // Gutter 호버
    await gutter.hover()

    // 커서 스타일 확인
    const cursor = await gutter.evaluate(el =>
      window.getComputedStyle(el).cursor
    )
    expect(cursor).toBe('col-resize')
  })
})
```

### 3.4 테스트 케이스: minSize 제약

**테스트 ID**: TC-E2E-03

```typescript
test.describe('AppLayout minSize 제약', () => {
  test('TC-E2E-03-A: 좌측 패널 최소 400px 제약', async ({ page }) => {
    await page.goto('/dashboard')

    const gutter = page.locator('.app-layout-gutter').first()

    // Gutter를 좌측 끝까지 드래그 시도
    await gutter.dragTo(gutter, {
      sourcePosition: { x: 0, y: 200 },
      targetPosition: { x: -500, y: 200 }
    })

    await page.waitForTimeout(300)

    // 좌측 패널 너비 측정
    const leftPanel = page.getByTestId('left-panel')
    const leftBox = await leftPanel.boundingBox()

    // 최소 400px 유지 검증 (오차 ±5px)
    expect(leftBox!.width).toBeGreaterThanOrEqual(395)
  })

  test('TC-E2E-03-B: 우측 패널 최소 300px 제약', async ({ page }) => {
    await page.goto('/dashboard')

    const gutter = page.locator('.app-layout-gutter').first()

    // Gutter를 우측 끝까지 드래그 시도
    await gutter.dragTo(gutter, {
      sourcePosition: { x: 0, y: 200 },
      targetPosition: { x: 800, y: 200 }
    })

    await page.waitForTimeout(300)

    // 우측 패널 너비 측정
    const rightPanel = page.getByTestId('right-panel')
    const rightBox = await rightPanel.boundingBox()

    // 최소 300px 유지 검증 (오차 ±5px)
    expect(rightBox!.width).toBeGreaterThanOrEqual(295)
  })
})
```

### 3.5 테스트 케이스: 키보드 탐색

**테스트 ID**: TC-E2E-04

```typescript
test.describe('AppLayout 키보드 탐색', () => {
  test('TC-E2E-04-A: Tab 키로 Gutter 포커스', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab 키 반복 (Gutter까지 이동)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Gutter 포커스 확인
    const gutter = page.locator('.app-layout-gutter').first()
    await expect(gutter).toBeFocused()

    // 포커스 outline 스타일 확인
    const outlineColor = await gutter.evaluate(el =>
      window.getComputedStyle(el).outlineColor
    )

    // Primary 색상 확인 (RGB 값)
    expect(outlineColor).toContain('59')  // R
    expect(outlineColor).toContain('130') // G
    expect(outlineColor).toContain('246') // B
  })

  test('TC-E2E-04-B: 화살표 키로 리사이즈', async ({ page }) => {
    await page.goto('/dashboard')

    // Gutter 포커스
    const gutter = page.locator('.app-layout-gutter').first()
    await gutter.focus()

    // 초기 좌측 패널 너비
    const leftPanel = page.getByTestId('left-panel')
    const initialBox = await leftPanel.boundingBox()
    const initialWidth = initialBox!.width

    // → (Right Arrow) 키 입력 (좌측 패널 축소)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)

    // 변경된 너비 확인
    const finalBox = await leftPanel.boundingBox()
    const finalWidth = finalBox!.width

    // 좌측 패널이 축소되었는지 확인
    expect(finalWidth).toBeLessThan(initialWidth)
  })

  test('TC-E2E-04-C: Home 키로 최소 크기 이동', async ({ page }) => {
    await page.goto('/dashboard')

    const gutter = page.locator('.app-layout-gutter').first()
    await gutter.focus()

    // Home 키 입력 (좌측 패널 최소 크기)
    await page.keyboard.press('Home')
    await page.waitForTimeout(200)

    // 좌측 패널 너비 확인
    const leftPanel = page.getByTestId('left-panel')
    const leftBox = await leftPanel.boundingBox()

    // 최소 크기 (400px) 근처 확인
    expect(leftBox!.width).toBeGreaterThanOrEqual(395)
    expect(leftBox!.width).toBeLessThanOrEqual(405)
  })
})
```

### 3.6 테스트 케이스: data-testid 유지

**테스트 ID**: TC-E2E-05

```typescript
test.describe('AppLayout data-testid 호환성', () => {
  test('TC-E2E-05: 기존 data-testid 접근 가능', async ({ page }) => {
    await page.goto('/dashboard')

    // 기존 data-testid 존재 확인
    await expect(page.getByTestId('app-layout')).toBeVisible()
    await expect(page.getByTestId('app-header-container')).toBeVisible()
    await expect(page.getByTestId('app-content')).toBeVisible()
    await expect(page.getByTestId('left-panel')).toBeVisible()
    await expect(page.getByTestId('right-panel')).toBeVisible()
  })
})
```

### 3.7 테스트 케이스: ARIA 속성

**테스트 ID**: TC-E2E-06

```typescript
test.describe('AppLayout ARIA 속성', () => {
  test('TC-E2E-06: ARIA 속성 존재 확인', async ({ page }) => {
    await page.goto('/dashboard')

    // Header role="banner"
    const header = page.getByTestId('app-header-container')
    const headerRole = await header.getAttribute('role')
    expect(headerRole).toBe('banner')

    // Left Panel role="complementary"
    const leftPanel = page.getByTestId('left-panel')
    const leftRole = await leftPanel.getAttribute('role')
    expect(leftRole).toBe('complementary')

    // Right Panel role="region"
    const rightPanel = page.getByTestId('right-panel')
    const rightRole = await rightPanel.getAttribute('role')
    expect(rightRole).toBe('region')
  })

  test('TC-E2E-06-B: Splitter ARIA 속성 확인', async ({ page }) => {
    await page.goto('/dashboard')

    // Splitter gutter role="separator"
    const gutter = page.locator('[role="separator"]').first()
    await expect(gutter).toBeVisible()

    // aria-orientation="horizontal"
    const orientation = await gutter.getAttribute('aria-orientation')
    expect(orientation).toBe('horizontal')

    // aria-valuenow 존재 확인
    const valueNow = await gutter.getAttribute('aria-valuenow')
    expect(valueNow).not.toBeNull()
  })
})
```

### 3.8 E2E 테스트 실행 명령어

```bash
# 전체 E2E 테스트 실행
npm run test:e2e

# Headed 모드 (브라우저 표시)
npm run test:e2e -- --headed

# 특정 브라우저만 실행
npm run test:e2e -- --project=chromium

# UI 모드 (대화형 테스트)
npm run test:e2e -- --ui
```

**기대 결과**:
- 모든 E2E 테스트 통과 (8/8)
- Chromium, Firefox 모두 통과

---

## 4. 코드 품질 테스트 명세

### 4.1 테스트 케이스: PrimeVue 사용 확인

**테스트 ID**: TC-CODE-01

**검증 방법**: 수동 코드 리뷰

**체크리스트**:
- [ ] AppLayout.vue에서 Splitter import 확인
- [ ] AppLayout.vue에서 SplitterPanel import 확인
- [ ] `<Splitter>` 컴포넌트 사용 확인
- [ ] `<SplitterPanel>` 컴포넌트 사용 확인

**실행 명령어**:

```bash
# Splitter import 확인
grep -n "import Splitter from 'primevue/splitter'" app/components/layout/AppLayout.vue

# Splitter 사용 확인
grep -n "<Splitter" app/components/layout/AppLayout.vue
```

**기대 결과**: 각 검색 결과 1건 이상

### 4.2 테스트 케이스: CSS 중앙화 확인

**테스트 ID**: TC-CODE-02

**검증 방법**: Grep 검색 자동화

**실행 명령어**:

```bash
# AppLayout.vue에서 :style 검색 (0건 기대)
grep -n ":style" app/components/layout/AppLayout.vue

# main.css에서 app-layout-* 클래스 검색 (8건 기대)
grep -n "app-layout-" app/assets/css/main.css
```

**기대 결과**:
- `:style` 검색 결과: 0건
- `app-layout-*` 클래스: 8건 이상

### 4.3 테스트 케이스: TypeScript 타입 에러

**테스트 ID**: TC-CODE-03

**실행 명령어**:

```bash
# TypeScript 컴파일 검사
npx tsc --noEmit
```

**기대 결과**: 에러 0건

### 4.4 테스트 케이스: ESLint 에러

**테스트 ID**: TC-CODE-04

**실행 명령어**:

```bash
# ESLint 실행
npm run lint
```

**기대 결과**: 에러 0건 (경고는 허용)

### 4.5 테스트 케이스: Prettier 포맷

**테스트 ID**: TC-CODE-05

**실행 명령어**:

```bash
# Prettier 검사
npm run format -- --check app/components/layout/AppLayout.vue
npm run format -- --check app/assets/css/main.css
```

**기대 결과**: 포맷 위반 0건

---

## 5. 시각적 회귀 테스트 명세

### 5.1 테스트 케이스: Gutter 시각 검증

**테스트 ID**: TC-VISUAL-01

**검증 방법**: 수동 시각 확인

**테스트 절차**:

1. 로컬 서버 실행 (`npm run dev`)
2. 브라우저에서 `/dashboard` 접속
3. Chrome DevTools 열기 (F12)

**TC-VISUAL-01-A: Gutter 기본 색상**

- [ ] Gutter 요소 선택 (`.app-layout-gutter`)
- [ ] Computed 탭에서 `background-color` 확인
- [ ] 기대값: `var(--color-border)` 또는 `#3d3d5c`

**TC-VISUAL-01-B: Gutter hover 색상**

- [ ] Gutter 위에 마우스 호버
- [ ] Computed 탭에서 `background-color` 확인
- [ ] 기대값: `var(--color-border-light)` 또는 `#4d4d6c`

**TC-VISUAL-01-C: Gutter active 색상**

- [ ] Gutter 클릭 + 드래그 (active 상태)
- [ ] Computed 탭에서 `background-color` 확인
- [ ] 기대값: `var(--color-primary)` 또는 `#3b82f6`

**TC-VISUAL-01-D: Handle 투명도 변화**

| 상태 | Handle 배경색 | 기대값 |
|------|-------------|-------|
| 기본 | `background-color` | `rgba(59, 130, 246, 0.3)` |
| Hover | `background-color` | `rgba(59, 130, 246, 0.5)` |
| Active | `background-color` | `rgba(59, 130, 246, 0.8)` |

### 5.2 테스트 케이스: 다크 테마 일관성

**테스트 ID**: TC-VISUAL-02

**검증 방법**: Playwright 스크린샷 비교

**실행 코드**:

```typescript
test('TC-VISUAL-02: 다크 테마 일관성 (스크린샷 비교)', async ({ page }) => {
  await page.goto('/dashboard')

  // 전체 화면 스크린샷
  await expect(page).toHaveScreenshot('app-layout-dark-theme.png', {
    fullPage: true,
    maxDiffPixels: 100
  })

  // Gutter 부분 스크린샷
  const gutter = page.locator('.app-layout-gutter').first()
  await expect(gutter).toHaveScreenshot('gutter-default.png')

  // Gutter hover 스크린샷
  await gutter.hover()
  await expect(gutter).toHaveScreenshot('gutter-hover.png')
})
```

**기대 결과**: 스크린샷 차이 ≤ 100 pixels

### 5.3 테스트 케이스: 포커스 outline

**테스트 ID**: TC-VISUAL-03

**검증 방법**: 수동 시각 확인

**테스트 절차**:

1. 브라우저에서 `/dashboard` 접속
2. Tab 키를 눌러 Gutter 포커스
3. DevTools에서 `.app-layout-gutter:focus-visible` 스타일 확인

**체크리스트**:
- [ ] `outline` 속성: `2px solid var(--color-primary)`
- [ ] `outline-offset` 속성: `2px`
- [ ] 시각적으로 포커스가 명확하게 표시됨

---

## 6. 성능 테스트 명세

### 6.1 테스트 케이스: 드래그 프레임 속도

**테스트 ID**: TC-PERF-01

**검증 방법**: Chrome DevTools Performance

**테스트 절차**:

1. Chrome에서 `/dashboard` 접속
2. DevTools → Performance 탭 열기
3. Record 시작 (⚫️ 버튼)
4. Gutter 드래그 (좌우 반복 3회)
5. Record 중지
6. 분석

**측정 지표**:

| 지표 | 측정 위치 | 목표 |
|------|----------|------|
| FPS | Main Thread 활동 | ≥ 60 FPS |
| Frame Time | Frames | ≤ 16ms |
| Scripting Time | Summary | ≤ 50ms |
| Rendering Time | Summary | ≤ 30ms |

**판정 기준**:
- FPS ≥ 60: ✅ 통과
- 50 ≤ FPS < 60: ⚠️ 경고
- FPS < 50: ❌ 실패

### 6.2 테스트 케이스: 리사이즈 지연

**테스트 ID**: TC-PERF-02

**검증 방법**: Performance API

**실행 코드** (브라우저 콘솔):

```javascript
// Performance 측정 시작
performance.mark('resize-start')

// Gutter 드래그 (수동)
// ... 드래그 완료 후 ...

// Performance 측정 종료
performance.mark('resize-end')
performance.measure('resize-duration', 'resize-start', 'resize-end')

// 결과 확인
const measures = performance.getEntriesByName('resize-duration')
console.log('Resize Duration:', measures[0].duration, 'ms')

// 기대: < 100ms
```

**판정 기준**:
- < 100ms: ✅ 통과
- 100ms ~ 200ms: ⚠️ 경고
- > 200ms: ❌ 실패

### 6.3 테스트 케이스: 메모리 누수

**테스트 ID**: TC-PERF-03

**검증 방법**: Chrome DevTools Memory

**테스트 절차**:

1. Chrome에서 `/dashboard` 접속
2. DevTools → Memory 탭 열기
3. Heap Snapshot 촬영 (스냅샷 1)
4. Gutter 드래그 100회 반복
5. Heap Snapshot 촬영 (스냅샷 2)
6. 메모리 증가량 비교

**측정 지표**:

| 지표 | 측정 위치 | 목표 |
|------|----------|------|
| Heap Size 증가 | Snapshot Comparison | < 5% |
| Detached DOM | Detached DOM tree | 0개 |

**판정 기준**:
- 메모리 증가 < 5%: ✅ 통과
- 5% ~ 10%: ⚠️ 경고
- > 10%: ❌ 실패

---

## 7. 테스트 실행 계획

### 7.1 테스트 실행 순서

| 순서 | 테스트 유형 | 소요 시간 | 자동화 |
|------|-----------|----------|-------|
| 1 | 코드 품질 테스트 | 5분 | 80% |
| 2 | 단위 테스트 | 10분 | 100% |
| 3 | E2E 테스트 | 15분 | 87.5% |
| 4 | 시각적 회귀 테스트 | 10분 | 16.7% |
| 5 | 성능 테스트 | 10분 | 0% |

**총 예상 소요 시간**: 50분

### 7.2 CI/CD 통합

**GitHub Actions 워크플로우**: `.github/workflows/test.yml`

```yaml
name: Test AppLayout Migration

on:
  pull_request:
    paths:
      - 'app/components/layout/AppLayout.vue'
      - 'app/assets/css/main.css'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      # 코드 품질
      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint

      # 단위 테스트
      - name: Unit Tests
        run: npm run test:unit

      # E2E 테스트
      - name: E2E Tests
        run: npm run test:e2e

      # 커버리지 리포트
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

### 7.3 테스트 실패 시 대응

| 실패 유형 | 대응 방안 | 우선순위 |
|---------|----------|---------|
| 단위 테스트 실패 | 로직 버그 수정, 테스트 재실행 | 🔴 높음 |
| E2E 테스트 실패 | 통합 이슈 분석, 디버깅 | 🔴 높음 |
| 시각적 회귀 | 스타일 수정, 시각 재검증 | 🟡 중간 |
| 성능 테스트 실패 | 최적화 작업, 재측정 | 🟢 낮음 |
| 코드 품질 실패 | 포맷 수정, 린트 에러 해결 | 🔴 높음 |

---

## 8. 테스트 리포트 템플릿

### 8.1 단위 테스트 리포트

```
========================================
AppLayout 단위 테스트 리포트
========================================

실행 일시: 2025-12-16 14:30:00
테스트 프레임워크: Vitest
테스트 파일: AppLayout.spec.ts

----------------------------------------
테스트 결과
----------------------------------------
총 테스트 케이스: 8
통과: 8
실패: 0
건너뜀: 0

통과율: 100%

----------------------------------------
코드 커버리지
----------------------------------------
Statements: 95.2%
Branches: 90.5%
Functions: 100%
Lines: 94.8%

----------------------------------------
테스트 케이스 상세
----------------------------------------
✅ TC-UNIT-01-A: leftWidth < 30 제한
✅ TC-UNIT-01-B: leftWidth > 80 제한
✅ TC-UNIT-01-C: leftWidth 정상 범위
✅ TC-UNIT-02-A: minLeftWidth 변환
✅ TC-UNIT-02-B: minRightWidth 변환
✅ TC-UNIT-02-C: minSize 합계 검증
✅ TC-UNIT-03: resize 이벤트 emit
✅ TC-UNIT-04: Pass Through API

----------------------------------------
실행 시간: 1.2초
========================================
```

### 8.2 E2E 테스트 리포트

```
========================================
AppLayout E2E 테스트 리포트
========================================

실행 일시: 2025-12-16 14:35:00
테스트 프레임워크: Playwright
브라우저: Chromium, Firefox

----------------------------------------
테스트 결과
----------------------------------------
총 테스트 케이스: 8
통과: 8
실패: 0
건너뜀: 0

통과율: 100%

----------------------------------------
브라우저별 결과
----------------------------------------
Chromium: 8/8 ✅
Firefox: 8/8 ✅

----------------------------------------
테스트 케이스 상세
----------------------------------------
✅ TC-E2E-01: 초기 렌더링 (60:40)
✅ TC-E2E-02: 드래그 리사이즈
✅ TC-E2E-03-A: 좌측 minSize 제약
✅ TC-E2E-03-B: 우측 minSize 제약
✅ TC-E2E-04-A: Tab 키 포커스
✅ TC-E2E-04-B: 화살표 키 리사이즈
✅ TC-E2E-05: data-testid 유지
✅ TC-E2E-06: ARIA 속성 확인

----------------------------------------
실행 시간: 12.4초
========================================
```

---

## 9. 다음 단계

**구현 단계** (`030-implementation.md`):
- AppLayout.vue 컴포넌트 수정
- main.css 스타일 추가
- 테스트 실행 및 검증

**상태 업데이트**:
- wbs.md 상태: [bd] → [dd]

---

## 10. 참고 자료

### 테스트 프레임워크 문서
- Vitest: https://vitest.dev/
- Vue Test Utils: https://test-utils.vuejs.org/
- Playwright: https://playwright.dev/

### 테스트 베스트 프랙티스
- Testing Library: https://testing-library.com/docs/guiding-principles
- Vue Testing Handbook: https://lmiller1990.github.io/vue-testing-handbook/

---

<!--
author: Claude Sonnet 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
