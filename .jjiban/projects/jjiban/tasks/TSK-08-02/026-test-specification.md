# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: 상세설계 기반 테스트 시나리오, 테스트 데이터, data-testid 정의

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-02 |
| Task명 | WBS UI Components Migration |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 레벨 | 범위 | 도구 | 책임 |
|------|------|------|------|
| 단위 테스트 | computed 속성, 함수 로직 | Vitest | 개발자 |
| 통합 테스트 | CSS 클래스 적용, 색상 매핑 | Vitest | 개발자 |
| E2E 테스트 | 시각적 렌더링, 회귀 테스트 | Playwright | QA |

### 1.2 테스트 우선순위

| 우선순위 | 테스트 유형 | 이유 |
|---------|-----------|------|
| P0 (Critical) | E2E 회귀 테스트 | 기존 기능 보장 |
| P1 (High) | 단위 테스트 (computed) | 로직 검증 |
| P2 (Medium) | 통합 테스트 (CSS) | 스타일 일관성 |
| P3 (Low) | 시각적 테스트 | 색상 정확도 |

---

## 2. 테스트 데이터

### 2.1 CategoryTag 테스트 데이터

#### TD-CT-01: 카테고리 유효 데이터

| ID | category | 예상 CSS 클래스 | 예상 배경색 | 예상 테두리 |
|----|----------|---------------|-----------|----------|
| TD-CT-01-01 | 'development' | 'category-tag-development' | `#3b82f6/20%` | `#3b82f6/30%` |
| TD-CT-01-02 | 'defect' | 'category-tag-defect' | `#ef4444/20%` | `#ef4444/30%` |
| TD-CT-01-03 | 'infrastructure' | 'category-tag-infrastructure' | `#8b5cf6/20%` | `#8b5cf6/30%` |

#### TD-CT-02: 카테고리 경계 데이터

| ID | category | 예상 동작 | 비고 |
|----|----------|----------|------|
| TD-CT-02-01 | undefined | Console Warning | 기본 스타일 적용 |
| TD-CT-02-02 | null | Console Warning | 기본 스타일 적용 |
| TD-CT-02-03 | 'invalid' | Console Warning | 기본 스타일 적용 |

### 2.2 ProgressBar 테스트 데이터

#### TD-PB-01: 진행률 유효 데이터

| ID | value | 예상 CSS 클래스 | 예상 배경색 | 비고 |
|----|-------|---------------|-----------|------|
| TD-PB-01-01 | 0 | 'progress-bar-low' | `#ef4444` | 최소값 |
| TD-PB-01-02 | 15 | 'progress-bar-low' | `#ef4444` | 0-30% 구간 |
| TD-PB-01-03 | 29 | 'progress-bar-low' | `#ef4444` | 경계값 (< 30) |
| TD-PB-01-04 | 30 | 'progress-bar-medium' | `#f59e0b` | 경계값 (>= 30) |
| TD-PB-01-05 | 50 | 'progress-bar-medium' | `#f59e0b` | 30-70% 구간 |
| TD-PB-01-06 | 69 | 'progress-bar-medium' | `#f59e0b` | 경계값 (< 70) |
| TD-PB-01-07 | 70 | 'progress-bar-high' | `#22c55e` | 경계값 (>= 70) |
| TD-PB-01-08 | 85 | 'progress-bar-high' | `#22c55e` | 70-100% 구간 |
| TD-PB-01-09 | 100 | 'progress-bar-high' | `#22c55e` | 최대값 |

#### TD-PB-02: 진행률 경계 데이터

| ID | value | 예상 clampedValue | 예상 CSS 클래스 | 비고 |
|----|-------|-----------------|---------------|------|
| TD-PB-02-01 | -10 | 0 | 'progress-bar-low' | 음수 클램핑 |
| TD-PB-02-02 | 150 | 100 | 'progress-bar-high' | 초과 클램핑 |
| TD-PB-02-03 | 50.5 | 50.5 | 'progress-bar-medium' | 소수점 유지 |

---

## 3. 단위 테스트 명세

### 3.1 CategoryTag 단위 테스트

#### TC-UNIT-CT-01: categoryConfig computed

| 테스트 ID | 시나리오 | 입력 | 예상 출력 | 검증 방법 |
|----------|---------|------|----------|----------|
| TC-UNIT-CT-01-01 | development 설정 조회 | category='development' | { icon: 'pi-code', label: 'Dev' } | computed 값 검증 |
| TC-UNIT-CT-01-02 | defect 설정 조회 | category='defect' | { icon: 'pi-exclamation-triangle', label: 'Defect' } | computed 값 검증 |
| TC-UNIT-CT-01-03 | infrastructure 설정 조회 | category='infrastructure' | { icon: 'pi-cog', label: 'Infra' } | computed 값 검증 |
| TC-UNIT-CT-01-04 | color 필드 제거 확인 | category='development' | config.color === undefined | 필드 부재 검증 |

### 3.2 ProgressBar 단위 테스트

#### TC-UNIT-PB-01: barClass computed

| 테스트 ID | 시나리오 | 입력 | 예상 출력 | 검증 방법 |
|----------|---------|------|----------|----------|
| TC-UNIT-PB-01-01 | 낮은 진행률 (0%) | value=0 | 'progress-bar-low' | computed 값 검증 |
| TC-UNIT-PB-01-02 | 낮은 진행률 (29%) | value=29 | 'progress-bar-low' | computed 값 검증 |
| TC-UNIT-PB-01-03 | 중간 진행률 (30%) | value=30 | 'progress-bar-medium' | computed 값 검증 |
| TC-UNIT-PB-01-04 | 중간 진행률 (69%) | value=69 | 'progress-bar-medium' | computed 값 검증 |
| TC-UNIT-PB-01-05 | 높은 진행률 (70%) | value=70 | 'progress-bar-high' | computed 값 검증 |
| TC-UNIT-PB-01-06 | 높은 진행률 (100%) | value=100 | 'progress-bar-high' | computed 값 검증 |

#### TC-UNIT-PB-02: clampedValue computed

| 테스트 ID | 시나리오 | 입력 | 예상 출력 | 검증 방법 |
|----------|---------|------|----------|----------|
| TC-UNIT-PB-02-01 | 음수 클램핑 | value=-10 | 0 | computed 값 검증 |
| TC-UNIT-PB-02-02 | 초과 클램핑 | value=150 | 100 | computed 값 검증 |
| TC-UNIT-PB-02-03 | 정상 범위 | value=50 | 50 | computed 값 검증 |

---

## 4. 통합 테스트 명세

### 4.1 CSS 클래스 적용 테스트

#### TC-INT-CSS-01: main.css 클래스 존재 확인

| 테스트 ID | 시나리오 | 검증 클래스 | 검증 방법 | 예상 결과 |
|----------|---------|-----------|----------|----------|
| TC-INT-CSS-01-01 | CategoryTag 클래스 | .category-tag-development | Grep 검색 | 존재 확인 |
| TC-INT-CSS-01-02 | CategoryTag 클래스 | .category-tag-defect | Grep 검색 | 존재 확인 |
| TC-INT-CSS-01-03 | CategoryTag 클래스 | .category-tag-infrastructure | Grep 검색 | 존재 확인 |
| TC-INT-CSS-01-04 | ProgressBar 클래스 | .progress-bar-low | Grep 검색 | 존재 확인 |
| TC-INT-CSS-01-05 | ProgressBar 클래스 | .progress-bar-medium | Grep 검색 | 존재 확인 |
| TC-INT-CSS-01-06 | ProgressBar 클래스 | .progress-bar-high | Grep 검색 | 존재 확인 |

### 4.2 색상 매핑 테스트

#### TC-INT-THEME-01: PRD 10.1 테마 일관성

| 테스트 ID | 시나리오 | CSS 클래스 | 예상 색상 | 검증 방법 |
|----------|---------|-----------|----------|----------|
| TC-INT-THEME-01-01 | Primary 색상 | .category-tag-development | `#3b82f6/20%` | 개발자 도구 Computed Style |
| TC-INT-THEME-01-02 | Danger 색상 | .category-tag-defect | `#ef4444/20%` | 개발자 도구 Computed Style |
| TC-INT-THEME-01-03 | Level-Project 색상 | .category-tag-infrastructure | `#8b5cf6/20%` | 개발자 도구 Computed Style |
| TC-INT-THEME-01-04 | Danger 진행률 | .progress-bar-low | `#ef4444` | 개발자 도구 Computed Style |
| TC-INT-THEME-01-05 | Warning 진행률 | .progress-bar-medium | `#f59e0b` | 개발자 도구 Computed Style |
| TC-INT-THEME-01-06 | Success 진행률 | .progress-bar-high | `#22c55e` | 개발자 도구 Computed Style |

### 4.3 회귀 테스트

#### TC-INT-REG-01: 기존 기능 유지

| 테스트 ID | 시나리오 | 검증 항목 | 검증 방법 | 예상 결과 |
|----------|---------|----------|----------|----------|
| TC-INT-REG-01-01 | CategoryTag 렌더링 | PrimeVue Tag 표시 | 화면 확인 | 정상 표시 |
| TC-INT-REG-01-02 | ProgressBar 렌더링 | PrimeVue ProgressBar 표시 | 화면 확인 | 정상 표시 |
| TC-INT-REG-01-03 | CategoryTag props | label, icon 전달 | Console 확인 | 정상 전달 |
| TC-INT-REG-01-04 | ProgressBar props | value, pt 전달 | Console 확인 | 정상 전달 |

### 4.4 유지보수성 테스트

#### TC-INT-MAINT-01: CSS 클래스 중앙화

| 테스트 ID | 시나리오 | 검증 항목 | 검증 방법 | 예상 결과 |
|----------|---------|----------|----------|----------|
| TC-INT-MAINT-01-01 | CategoryTag HEX 제거 | 컴포넌트 내 HEX 검색 | Grep '#[0-9a-fA-F]{6}' | 0건 |
| TC-INT-MAINT-01-02 | ProgressBar HEX 제거 | 컴포넌트 내 HEX 검색 | Grep '#[0-9a-fA-F]{6}' | 0건 |
| TC-INT-MAINT-01-03 | CategoryTag :style 제거 | 템플릿 내 :style 검색 | Grep ':style=' | 0건 |
| TC-INT-MAINT-01-04 | ProgressBar barColor 제거 | script 내 barColor 검색 | Grep 'barColor' | 0건 |

### 4.5 성능 테스트

#### TC-INT-PERF-01: 렌더링 성능

| 테스트 ID | 시나리오 | 측정 항목 | Before 기준값 | After 목표값 | 검증 방법 |
|----------|---------|----------|-------------|-----------|----------|
| TC-INT-PERF-01-01 | CategoryTag 100개 렌더링 | First Paint | 50ms | < 52.5ms (< 5% 증가) | Chrome DevTools Performance (3회 평균) |
| TC-INT-PERF-01-02 | ProgressBar 100개 렌더링 | First Paint | 60ms | < 63ms (< 5% 증가) | Chrome DevTools Performance (3회 평균) |
| TC-INT-PERF-01-03 | CSS 클래스 적용 오버헤드 | Style Recalculation | 10ms | < 10.5ms (< 5% 증가) | Before/After 비교 |

---

## 5. E2E 테스트 명세

### 5.1 CategoryTag E2E 테스트

#### TC-CT-01: development 카테고리 렌더링

```typescript
test('CategoryTag: development 렌더링', async ({ page }) => {
  // 준비
  await page.goto('/wbs?project=jjiban')

  // 실행
  const categoryTag = page.locator('[data-testid="category-tag-development"]')

  // 검증
  await expect(categoryTag).toBeVisible()
  await expect(categoryTag).toHaveClass(/category-tag-development/)

  // 색상 검증 (개발자 도구 Computed Style)
  const bgColor = await categoryTag.evaluate((el) =>
    window.getComputedStyle(el).backgroundColor
  )
  expect(bgColor).toMatch(/rgba\(59, 130, 246, 0\.2\)/) // #3b82f6/20%
})
```

#### TC-CT-02: defect/infrastructure 카테고리 렌더링

```typescript
test.describe('CategoryTag: 전체 카테고리 렌더링', () => {
  const testCases = [
    { category: 'defect', color: 'rgba(239, 68, 68, 0.2)' }, // #ef4444/20%
    { category: 'infrastructure', color: 'rgba(139, 92, 246, 0.2)' } // #8b5cf6/20%
  ]

  testCases.forEach(({ category, color }) => {
    test(`CategoryTag: ${category} 렌더링`, async ({ page }) => {
      await page.goto('/wbs?project=jjiban')
      const tag = page.locator(`[data-testid="category-tag-${category}"]`)

      await expect(tag).toBeVisible()
      await expect(tag).toHaveClass(new RegExp(`category-tag-${category}`))

      const bgColor = await tag.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(bgColor).toMatch(new RegExp(color))
    })
  })
})
```

### 5.2 ProgressBar E2E 테스트

#### TC-PB-01: 진행률 구간별 색상 검증

```typescript
test.describe('ProgressBar: 진행률 구간별 색상', () => {
  const testCases = [
    { value: 15, class: 'progress-bar-low', color: 'rgb(239, 68, 68)' }, // #ef4444
    { value: 50, class: 'progress-bar-medium', color: 'rgb(245, 158, 11)' }, // #f59e0b
    { value: 85, class: 'progress-bar-high', color: 'rgb(34, 197, 94)' } // #22c55e
  ]

  testCases.forEach(({ value, class: cssClass, color }) => {
    test(`ProgressBar: ${value}% (${cssClass})`, async ({ page }) => {
      await page.goto('/wbs?project=jjiban')
      const progressBar = page.locator(`[data-testid="progress-bar-${value}"]`)

      await expect(progressBar).toBeVisible()

      // PrimeVue ProgressBar의 value 요소 검색
      const valueElement = progressBar.locator('.p-progressbar-value')
      await expect(valueElement).toHaveClass(new RegExp(cssClass))

      const bgColor = await valueElement.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(bgColor).toMatch(color)
    })
  })
})
```

#### TC-PB-02: 경계값 테스트

```typescript
test.describe('ProgressBar: 경계값 테스트', () => {
  const testCases = [
    { value: 0, class: 'progress-bar-low' },
    { value: 29, class: 'progress-bar-low' },
    { value: 30, class: 'progress-bar-medium' },
    { value: 69, class: 'progress-bar-medium' },
    { value: 70, class: 'progress-bar-high' },
    { value: 100, class: 'progress-bar-high' }
  ]

  testCases.forEach(({ value, class: cssClass }) => {
    test(`ProgressBar: ${value}% 경계값`, async ({ page }) => {
      await page.goto('/wbs?project=jjiban')
      const progressBar = page.locator(`[data-testid="progress-bar-${value}"]`)
      const valueElement = progressBar.locator('.p-progressbar-value')

      await expect(valueElement).toHaveClass(new RegExp(cssClass))
    })
  })
})
```

### 5.3 회귀 테스트

#### TC-REG-01: 기존 E2E 테스트 통과

| 테스트 ID | 시나리오 | 테스트 파일 | 예상 결과 |
|----------|---------|-----------|----------|
| TC-REG-01-01 | WBS 트리 렌더링 | wbs-tree-panel.spec.ts | ✅ PASS |
| TC-REG-01-02 | CategoryTag 표시 | wbs-tree-node.spec.ts | ✅ PASS |
| TC-REG-01-03 | ProgressBar 표시 | wbs-tree-node.spec.ts | ✅ PASS |
| TC-REG-01-04 | StatusBadge 표시 | wbs-tree-node.spec.ts | ✅ PASS |

### 5.4 시각적 회귀 테스트

#### TC-VISUAL-01: Before/After 스크린샷 비교

```typescript
test('Visual Regression: CategoryTag + ProgressBar', async ({ page }) => {
  await page.goto('/wbs?project=jjiban')

  // 스크린샷 촬영
  await expect(page.locator('[data-testid="wbs-tree-panel"]')).toHaveScreenshot(
    'wbs-tree-panel-after-migration.png',
    {
      maxDiffPixels: 100, // 허용 픽셀 차이
      threshold: 0.1 // 허용 색상 차이 (10%)
    }
  )
})
```

---

## 6. data-testid 정의

### 6.1 CategoryTag

| data-testid | 형식 | 예시 | 용도 |
|-------------|------|------|------|
| category-tag-{category} | `category-tag-${props.category}` | `category-tag-development` | E2E 테스트 선택자 |

### 6.2 ProgressBar

| data-testid | 형식 | 예시 | 용도 |
|-------------|------|------|------|
| progress-bar-{value} | `progress-bar-${props.value}` | `progress-bar-50` | E2E 테스트 선택자 |

### 6.3 StatusBadge (변경 없음)

| data-testid | 형식 | 예시 | 용도 |
|-------------|------|------|------|
| status-badge-{status} | `status-badge-${props.status}` | `status-badge-bd` | E2E 테스트 선택자 |

---

## 7. 테스트 실행 계획

### 7.1 실행 순서

| 순서 | 테스트 레벨 | 실행 명령 | 예상 소요 시간 |
|------|-----------|----------|--------------|
| 1 | 단위 테스트 | `npm run test:unit` | 5분 |
| 2 | 통합 테스트 | `npm run test:integration` | 10분 |
| 3 | E2E 테스트 | `npm run test:e2e` | 15분 |
| 4 | 시각적 회귀 | `npm run test:visual` | 5분 |

### 7.2 성공 기준

| 기준 | 목표 | 허용 범위 |
|------|------|----------|
| 단위 테스트 통과율 | 100% | - |
| 통합 테스트 통과율 | 100% | - |
| E2E 테스트 통과율 | 100% | - |
| 시각적 차이 | 0% | < 5% |
| 렌더링 성능 | 변화 없음 | < 5% 증가 |

---

## 8. 테스트 환경

### 8.1 필수 환경

| 항목 | 값 | 비고 |
|------|-----|------|
| Node.js | 20.x | - |
| npm | 10.x | - |
| 브라우저 (Playwright) | Chromium, Firefox, WebKit | - |
| 프로젝트 | jjiban | 테스트 데이터 |

### 8.2 테스트 데이터 준비

- `.jjiban/projects/jjiban/wbs.md` 파일에 다음 Task 포함 필요:
  - development 카테고리 Task (최소 1개)
  - defect 카테고리 Task (최소 1개)
  - infrastructure 카테고리 Task (최소 1개)
  - 진행률 0%, 30%, 70%, 100% WP/ACT (각 1개씩)

---

## 9. 테스트 체크리스트

- [ ] 단위 테스트 TC-UNIT-CT-01 (4개) 통과
- [ ] 단위 테스트 TC-UNIT-PB-01 (6개) 통과
- [ ] 단위 테스트 TC-UNIT-PB-02 (3개) 통과
- [ ] 통합 테스트 TC-INT-CSS-01 (6개) 통과
- [ ] 통합 테스트 TC-INT-THEME-01 (6개) 통과
- [ ] 통합 테스트 TC-INT-REG-01 (4개) 통과
- [ ] 통합 테스트 TC-INT-MAINT-01 (4개) 통과
- [ ] 통합 테스트 TC-INT-PERF-01 (3개) 통과
- [ ] E2E 테스트 TC-CT-01, TC-CT-02 통과
- [ ] E2E 테스트 TC-PB-01, TC-PB-02 통과
- [ ] E2E 테스트 TC-REG-01 (4개) 통과
- [ ] 시각적 회귀 테스트 TC-VISUAL-01 통과

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/jjiban/prd.md`
- TRD: `.jjiban/jjiban/trd.md`

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
-->
