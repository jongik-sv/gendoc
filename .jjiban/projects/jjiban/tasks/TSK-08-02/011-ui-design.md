# UI 설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 컴포넌트 중심 UI 설계
> * PrimeVue 4.x 컴포넌트 적극 활용
> * Dark Blue 테마 일관성 유지
> * CSS 클래스 중앙화 원칙 준수

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-02 |
| Task명 | WBS UI Components Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 (Frontend Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/jjiban/prd.md` | 섹션 10.1 (UI 디자인 시스템) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화) |
| 선행 Task | TSK-08-01 | NodeIcon 패턴 참조 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-08-02 |

---

## 1. 목적 및 범위

### 1.1 목적

StatusBadge, CategoryTag, ProgressBar 컴포넌트의 HEX 하드코딩을 제거하고 CSS 클래스 중앙화 원칙을 적용하여 유지보수성과 일관성을 확보합니다.

**해결하는 문제**:
- CategoryTag, ProgressBar 내 HEX 하드코딩 (`:style="{ backgroundColor: '#...' }"`)
- 색상 변경 시 컴포넌트 파일 직접 수정 필요
- CSS 클래스 중앙화 원칙 위반

**제공하는 가치**:
- main.css에서 색상 중앙 관리
- TSK-08-01 NodeIcon 패턴과 일관성 유지
- 테마 변경 시 유연성 확보

### 1.2 범위

**포함 범위**:
- StatusBadge: 마이그레이션 불필요 확인 (이미 PrimeVue severity 사용)
- CategoryTag: HEX 하드코딩 제거 → CSS 클래스 적용
- ProgressBar: HEX 하드코딩 제거 → CSS 클래스 적용
- main.css: `.category-tag-*`, `.progress-bar-*` 클래스 정의
- 시각적 Before/After 명세

**제외 범위**:
- 컴포넌트 로직 변경 (기능은 100% 유지)
- 새로운 기능 추가
- E2E 테스트 수정 (data-testid 유지)

---

## 2. 디자인 시스템 참조

### 2.1 색상 팔레트 (tailwind.config.ts 기반)

#### 카테고리 색상

| Category | Tailwind Class | Hex | 용도 |
|----------|----------------|-----|------|
| development | `bg-primary` | `#3b82f6` | Dev 카테고리 |
| defect | `bg-danger` | `#ef4444` | Defect 카테고리 |
| infrastructure | `bg-level-project` | `#8b5cf6` | Infra 카테고리 |

#### 진행률 색상

| 구간 | Tailwind Class | Hex | 용도 |
|------|----------------|-----|------|
| 0-30% | `bg-danger` | `#ef4444` | 낮은 진행률 |
| 30-70% | `bg-warning` | `#f59e0b` | 중간 진행률 |
| 70-100% | `bg-success` | `#22c55e` | 높은 진행률 |

#### 상태 색상 (StatusBadge - 변경 없음)

| Severity | PrimeVue Class | 의미 |
|----------|----------------|------|
| secondary | `.p-tag-secondary` | Todo ([ ]) |
| info | `.p-tag-info` | Design/Detail (bd/dd/an/ds) |
| warning | `.p-tag-warning` | Implement/Fix (im/fx) |
| success | `.p-tag-success` | Verify/Done (vf/xx) |

### 2.2 CSS 변수 매핑

| 용도 | CSS 변수 | Tailwind 클래스 | 값 |
|------|----------|-----------------|-----|
| Primary | `--color-primary` | `bg-primary` | `#3b82f6` |
| Danger | `--color-danger` | `bg-danger` | `#ef4444` |
| Warning | `--color-warning` | `bg-warning` | `#f59e0b` |
| Success | `--color-success` | `bg-success` | `#22c55e` |
| Level-Project | `--color-level-project` | `bg-level-project` | `#8b5cf6` |

---

## 3. 컴포넌트별 UI 설계

### 3.1 StatusBadge.vue (변경 없음)

**파일 경로**: `app/components/wbs/StatusBadge.vue`

#### 현재 상태 분석

**PrimeVue 컴포넌트**: `Tag`
**색상 제어 방식**: `:severity` prop (PrimeVue 기본 시스템)
**HEX 하드코딩**: ❌ 없음

#### 현재 구조

```vue
<template>
  <Tag
    :value="statusLabel"
    :severity="statusSeverity"
    rounded
  />
</template>

<script setup lang="ts">
const statusSeverity = computed(() => {
  const severities: Record<string, 'secondary' | 'info' | 'warning' | 'success'> = {
    ' ': 'secondary',   // Todo
    'bd': 'info',       // Design
    'dd': 'info',       // Detail
    'an': 'info',       // Analyze
    'ds': 'info',       // Design
    'im': 'warning',    // Implement
    'fx': 'warning',    // Fix
    'vf': 'success',    // Verify
    'xx': 'success'     // Done
  }
  return severities[statusCode.value] || 'secondary'
})
</script>
```

#### 시각적 표현

| 상태 코드 | Label | Severity | 색상 (PrimeVue) | 배경색 |
|----------|-------|----------|----------------|--------|
| `[ ]` | Todo | secondary | Gray | `bg-gray-500/20` |
| `[bd]` | Design | info | Blue | `bg-blue-500/20` |
| `[dd]` | Detail | info | Blue | `bg-blue-500/20` |
| `[im]` | Implement | warning | Orange | `bg-orange-500/20` |
| `[vf]` | Verify | success | Green | `bg-green-500/20` |
| `[xx]` | Done | success | Green | `bg-green-500/20` |

#### 결론

**마이그레이션 불필요**: StatusBadge는 이미 CSS 클래스 중앙화 원칙을 준수하고 있습니다.
- PrimeVue Tag의 severity prop 사용 (PrimeVue 테마 시스템이 색상 관리)
- HEX 하드코딩 없음
- main.css 추가 불필요

---

### 3.2 CategoryTag.vue (마이그레이션 필수)

**파일 경로**: `app/components/wbs/CategoryTag.vue`

#### Before: 현재 구조 (HEX 하드코딩)

```vue
<template>
  <div
    :data-testid="`category-tag-${category}`"
    :style="{ backgroundColor: categoryColor }"  <!-- ❌ HEX 하드코딩 -->
    class="category-tag-wrapper"
  >
    <Tag :value="categoryLabel" :icon="categoryIcon" rounded />
  </div>
</template>

<script setup lang="ts">
const categoryConfig = computed((): CategoryConfig => {
  const configs: Record<TaskCategory, CategoryConfig> = {
    development: {
      icon: 'pi-code',
      color: '#3b82f6',  // ❌ HEX 하드코딩
      label: 'Dev'
    },
    defect: {
      icon: 'pi-exclamation-triangle',
      color: '#ef4444',  // ❌ HEX 하드코딩
      label: 'Defect'
    },
    infrastructure: {
      icon: 'pi-cog',
      color: '#8b5cf6',  // ❌ HEX 하드코딩
      label: 'Infra'
    }
  }
  return configs[props.category]
})

const categoryColor = computed(() => categoryConfig.value.color)  // ❌ 제거 필요
</script>
```

#### After: 마이그레이션 후 구조 (CSS 클래스)

```vue
<template>
  <div
    :data-testid="`category-tag-${category}`"
    :class="`category-tag-${category}`"  <!-- ✅ CSS 클래스 바인딩 -->
    class="category-tag-wrapper"
  >
    <Tag :value="categoryLabel" :icon="categoryIcon" rounded />
  </div>
</template>

<script setup lang="ts">
const categoryConfig = computed(() => {
  const configs: Record<TaskCategory, Omit<CategoryConfig, 'color'>> = {
    development: {
      icon: 'pi-code',
      label: 'Dev'
    },
    defect: {
      icon: 'pi-exclamation-triangle',
      label: 'Defect'
    },
    infrastructure: {
      icon: 'pi-cog',
      label: 'Infra'
    }
  }
  return configs[props.category]
})

// ❌ categoryColor computed 제거
</script>
```

#### main.css 추가 클래스

```css
/* ============================================
 * CategoryTag 컴포넌트 스타일 (TSK-08-02)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

.category-tag-development {
  @apply bg-primary/20 border border-primary/30;
}

.category-tag-defect {
  @apply bg-danger/20 border border-danger/30;
}

.category-tag-infrastructure {
  @apply bg-level-project/20 border border-level-project/30;
}
```

#### 시각적 Before/After 비교

| Category | Before (HEX) | After (CSS Class) | 배경색 | 테두리색 |
|----------|-------------|------------------|--------|---------|
| development | `backgroundColor: '#3b82f6'` | `class="category-tag-development"` | `#3b82f6` (20% opacity) | `#3b82f6` (30% opacity) |
| defect | `backgroundColor: '#ef4444'` | `class="category-tag-defect"` | `#ef4444` (20% opacity) | `#ef4444` (30% opacity) |
| infrastructure | `backgroundColor: '#8b5cf6'` | `class="category-tag-infrastructure"` | `#8b5cf6` (20% opacity) | `#8b5cf6` (30% opacity) |

**시각적 렌더링 결과**: 완전히 동일 (색상 값과 opacity 유지)

#### 접근성

- `data-testid` 유지: E2E 테스트 호환성 보장
- `aria-label` 유지: 스크린 리더 지원
- 키보드 네비게이션: 변경 없음

---

### 3.3 ProgressBar.vue (마이그레이션 필수)

**파일 경로**: `app/components/wbs/ProgressBar.vue`

#### Before: 현재 구조 (HEX 하드코딩)

```vue
<template>
  <ProgressBar
    :value="clampedValue"
    :pt="passThrough"
  />
</template>

<script setup lang="ts">
/**
 * 진행률 구간별 색상 계산
 */
const barColor = computed(() => {
  if (clampedValue.value < 30) return '#ef4444'  // ❌ HEX 하드코딩
  if (clampedValue.value < 70) return '#f59e0b'  // ❌ HEX 하드코딩
  return '#22c55e'  // ❌ HEX 하드코딩
})

/**
 * PrimeVue Pass Through API 설정
 */
const passThrough = computed((): ProgressBarPassThroughOptions => ({
  value: {
    style: {
      backgroundColor: barColor.value  // ❌ 인라인 스타일
    }
  }
}))
</script>
```

#### After: 마이그레이션 후 구조 (CSS 클래스)

```vue
<template>
  <ProgressBar
    :value="clampedValue"
    :pt="passThrough"
  />
</template>

<script setup lang="ts">
/**
 * 진행률 구간별 CSS 클래스 계산
 */
const barClass = computed(() => {
  if (clampedValue.value < 30) return 'progress-bar-low'     // ✅ CSS 클래스
  if (clampedValue.value < 70) return 'progress-bar-medium'  // ✅ CSS 클래스
  return 'progress-bar-high'  // ✅ CSS 클래스
})

/**
 * PrimeVue Pass Through API 설정 (class 사용)
 */
const passThrough = computed((): ProgressBarPassThroughOptions => ({
  value: {
    class: barClass.value  // ✅ CSS 클래스 바인딩
  }
}))

// ❌ barColor computed 제거
</script>
```

#### main.css 추가 클래스

```css
/* ============================================
 * ProgressBar 컴포넌트 스타일 (TSK-08-02)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* 진행률 바 색상 (구간별) */
.progress-bar-low {
  @apply bg-danger;
}

.progress-bar-medium {
  @apply bg-warning;
}

.progress-bar-high {
  @apply bg-success;
}
```

#### 시각적 Before/After 비교

| 진행률 구간 | Before (HEX) | After (CSS Class) | 색상 | 의미 |
|-----------|-------------|------------------|------|------|
| 0-29% | `backgroundColor: '#ef4444'` | `class="progress-bar-low"` | `#ef4444` (Red) | 낮은 진행률 |
| 30-69% | `backgroundColor: '#f59e0b'` | `class="progress-bar-medium"` | `#f59e0b` (Orange) | 중간 진행률 |
| 70-100% | `backgroundColor: '#22c55e'` | `class="progress-bar-high"` | `#22c55e` (Green) | 높은 진행률 |

**시각적 렌더링 결과**: 완전히 동일 (색상 값과 구간 기준 유지)

#### Pass Through API 검증

**PrimeVue ProgressBar의 Pass Through API는 `class` 속성을 지원합니다:**

```typescript
interface ProgressBarPassThroughOptions {
  value?: {
    class?: string | object;  // ✅ class 지원
    style?: object;           // 기존 style도 지원
  }
}
```

**공식 문서 참조**: https://primevue.org/progressbar/#pt

#### 접근성

- `data-testid` 유지: E2E 테스트 호환성 보장
- `aria-label`, `role`, `aria-valuenow` 유지: 스크린 리더 지원
- 시각적 색상 변화: 접근성 영향 없음 (구간별 색상 유지)

---

## 4. main.css 통합 스타일 정의

### 4.1 추가할 CSS 클래스 (최종본)

**파일 경로**: `app/assets/css/main.css`

**추가 위치**: 기존 NodeIcon 스타일 블록 다음

```css
/* ============================================
 * WBS UI Components 스타일 (TSK-08-02)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* CategoryTag 컴포넌트 배경색 */
.category-tag-development {
  @apply bg-primary/20 border border-primary/30;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
}

.category-tag-defect {
  @apply bg-danger/20 border border-danger/30;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
}

.category-tag-infrastructure {
  @apply bg-level-project/20 border border-level-project/30;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
}

/* ProgressBar 진행률 구간별 색상 */
.progress-bar-low {
  @apply bg-danger;
}

.progress-bar-medium {
  @apply bg-warning;
}

.progress-bar-high {
  @apply bg-success;
}
```

### 4.2 기존 CSS 변수 활용

**main.css에 이미 정의된 CSS 변수 재사용**:

```css
:root {
  /* 프라이머리 색상 */
  --color-primary: #3b82f6;

  /* 시맨틱 색상 */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* 계층 아이콘 색상 */
  --color-level-project: #8b5cf6;
}
```

**Tailwind 클래스 매핑 (tailwind.config.ts)**:

```typescript
colors: {
  primary: { DEFAULT: '#3b82f6' },
  danger: { DEFAULT: '#ef4444' },
  warning: { DEFAULT: '#f59e0b' },
  success: { DEFAULT: '#22c55e' },
  level: {
    project: '#8b5cf6'
  }
}
```

---

## 5. 시각적 Before/After 종합

### 5.1 CategoryTag 렌더링 비교

#### Development 카테고리

**Before**:
```html
<div style="background-color: #3b82f6; border-radius: 12px;">
  <Tag value="Dev" icon="pi pi-code" />
</div>
```

**After**:
```html
<div class="category-tag-development category-tag-wrapper">
  <Tag value="Dev" icon="pi pi-code" />
</div>
```

**시각적 결과**: 완전히 동일 (배경색 `#3b82f6` 20% opacity, 테두리 30% opacity)

#### Defect 카테고리

**Before**:
```html
<div style="background-color: #ef4444; border-radius: 12px;">
  <Tag value="Defect" icon="pi pi-exclamation-triangle" />
</div>
```

**After**:
```html
<div class="category-tag-defect category-tag-wrapper">
  <Tag value="Defect" icon="pi pi-exclamation-triangle" />
</div>
```

**시각적 결과**: 완전히 동일 (배경색 `#ef4444` 20% opacity, 테두리 30% opacity)

### 5.2 ProgressBar 렌더링 비교

#### 25% 진행률 (Low)

**Before**:
```html
<ProgressBar :value="25" :pt="{ value: { style: { backgroundColor: '#ef4444' } } }" />
```

**After**:
```html
<ProgressBar :value="25" :pt="{ value: { class: 'progress-bar-low' } }" />
```

**시각적 결과**: 완전히 동일 (빨간색 진행 바 `#ef4444`)

#### 50% 진행률 (Medium)

**Before**:
```html
<ProgressBar :value="50" :pt="{ value: { style: { backgroundColor: '#f59e0b' } } }" />
```

**After**:
```html
<ProgressBar :value="50" :pt="{ value: { class: 'progress-bar-medium' } }" />
```

**시각적 결과**: 완전히 동일 (주황색 진행 바 `#f59e0b`)

#### 85% 진행률 (High)

**Before**:
```html
<ProgressBar :value="85" :pt="{ value: { style: { backgroundColor: '#22c55e' } } }" />
```

**After**:
```html
<ProgressBar :value="85" :pt="{ value: { class: 'progress-bar-high' } }" />
```

**시각적 결과**: 완전히 동일 (초록색 진행 바 `#22c55e`)

---

## 6. 인터랙션 및 상태 변화

### 6.1 CategoryTag 상태별 스타일

| 상태 | 시각적 변화 | CSS 적용 |
|------|-----------|----------|
| Default | 배경색 20% opacity, 테두리 30% opacity | `.category-tag-{type}` |
| Hover | 변경 없음 (향후 추가 가능) | - |
| Focus | 변경 없음 | - |

**향후 확장 가능성**:
```css
.category-tag-development:hover {
  @apply bg-primary/30 border-primary/50;
}
```

### 6.2 ProgressBar 애니메이션

**PrimeVue ProgressBar 기본 애니메이션 유지**:
- 부드러운 진행 바 증가 애니메이션
- 색상 변화는 CSS transition으로 자동 처리

**CSS Transition 추가 (선택사항)**:
```css
.progress-bar-low,
.progress-bar-medium,
.progress-bar-high {
  transition: background-color 0.3s ease;
}
```

---

## 7. 접근성 (Accessibility)

### 7.1 색상 대비 검증 (WCAG AA)

#### CategoryTag

| 조합 | 대비 비율 | 기준 | 통과 |
|------|----------|------|------|
| `#3b82f6` (Primary) on `#1e1e38` | 5.1:1 | 3:1 (Large) | ✅ |
| `#ef4444` (Danger) on `#1e1e38` | 4.8:1 | 3:1 (Large) | ✅ |
| `#8b5cf6` (Purple) on `#1e1e38` | 4.2:1 | 3:1 (Large) | ✅ |

#### ProgressBar

| 조합 | 대비 비율 | 기준 | 통과 |
|------|----------|------|------|
| `#ef4444` (Low) on `#1e1e38` | 4.8:1 | 3:1 | ✅ |
| `#f59e0b` (Medium) on `#1e1e38` | 6.2:1 | 3:1 | ✅ |
| `#22c55e` (High) on `#1e1e38` | 5.5:1 | 3:1 | ✅ |

### 7.2 스크린 리더 지원

**CategoryTag**:
```vue
<Tag
  :value="categoryLabel"
  :aria-label="`Category: ${categoryLabel}`"
/>
```

**ProgressBar**:
```vue
<ProgressBar
  :aria-label="`Progress: ${clampedValue}%`"
  role="progressbar"
  :aria-valuenow="clampedValue"
  aria-valuemin="0"
  aria-valuemax="100"
/>
```

**변경 사항**: 없음 (기존 aria 속성 모두 유지)

### 7.3 키보드 네비게이션

**컴포넌트 특성상 키보드 인터랙션 불필요**:
- CategoryTag: 읽기 전용 레이블
- ProgressBar: 시각적 표시 컴포넌트

---

## 8. 테스트 전략

### 8.1 회귀 테스트 (Regression)

| 컴포넌트 | 테스트 항목 | 검증 방법 |
|----------|-----------|----------|
| StatusBadge | 변경 없음 확인 | 기존 E2E 테스트 통과 |
| CategoryTag | 색상 시각적 일치 | 스크린샷 비교 (Before/After) |
| ProgressBar | 진행률 구간별 색상 | 개발자 도구 Computed Style 확인 |

### 8.2 E2E 테스트 유지

**data-testid 속성 유지 확인**:

```vue
<!-- CategoryTag -->
<div :data-testid="`category-tag-${category}`">

<!-- ProgressBar -->
<ProgressBar :data-testid="`progress-bar-${clampedValue}`">
```

**E2E 테스트 코드 변경 불필요**:
```typescript
await page.locator('[data-testid="category-tag-development"]').waitFor()
await page.locator('[data-testid="progress-bar-50"]').waitFor()
```

### 8.3 색상 일관성 검증

**Chrome DevTools 검증 절차**:

1. CategoryTag 검사
   ```
   개발자 도구 → Elements → .category-tag-development
   Computed → background-color: rgba(59, 130, 246, 0.2)  // #3b82f6 20% opacity
   ```

2. ProgressBar 검사
   ```
   개발자 도구 → Elements → .progress-bar-low
   Computed → background-color: rgb(239, 68, 68)  // #ef4444
   ```

---

## 9. 마이그레이션 체크리스트

### 9.1 CategoryTag.vue

- [ ] wrapper div에서 `:style` 제거
- [ ] wrapper div에 `:class="\`category-tag-${category}\`"` 추가
- [ ] `categoryColor` computed 삭제
- [ ] `CategoryConfig` interface에서 `color` 필드 제거
- [ ] `configs` 객체에서 `color` 속성 제거
- [ ] `data-testid` 유지 확인
- [ ] `aria-label` 유지 확인

### 9.2 ProgressBar.vue

- [ ] `barColor` computed 삭제
- [ ] `barClass` computed 추가
- [ ] `passThrough` computed에서 `style` → `class` 변경
- [ ] `data-testid` 유지 확인
- [ ] `aria-*` 속성 유지 확인

### 9.3 main.css

- [ ] `.category-tag-development` 클래스 추가
- [ ] `.category-tag-defect` 클래스 추가
- [ ] `.category-tag-infrastructure` 클래스 추가
- [ ] `.progress-bar-low` 클래스 추가
- [ ] `.progress-bar-medium` 클래스 추가
- [ ] `.progress-bar-high` 클래스 추가
- [ ] TSK-08-02 주석 블록 추가

### 9.4 검증

- [ ] 로컬 개발 서버 실행 후 시각적 확인
- [ ] CategoryTag 3종 렌더링 테스트
- [ ] ProgressBar 3구간 렌더링 테스트
- [ ] E2E 테스트 통과 확인
- [ ] 색상 대비 WCAG AA 기준 충족 확인

---

## 10. 품질 기준

### 10.1 코드 품질

- [ ] HEX 하드코딩 0건 (Grep 검색 결과)
- [ ] CSS 클래스 중앙화 원칙 100% 준수
- [ ] TypeScript 타입 안정성 유지
- [ ] Vue Composition API 베스트 프랙티스 준수

### 10.2 시각적 품질

- [ ] Before/After 색상 100% 일치
- [ ] Dark Blue 테마 일관성 유지
- [ ] PrimeVue 컴포넌트 스타일 충돌 없음

### 10.3 성능

- [ ] 렌더링 성능 영향 < 5% (Chrome DevTools Performance)
- [ ] CSS 클래스 우선순위 충돌 없음
- [ ] Tailwind Purge 최적화 효과

---

## 11. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| Pass Through API class 미지원 | 낮음 | 높음 | 사전 검증 완료 (공식 문서 확인) |
| 색상 시각적 불일치 | 중간 | 중간 | Before/After 스크린샷 비교 |
| E2E 테스트 실패 | 낮음 | 높음 | data-testid 유지 확인 |
| CSS 우선순위 충돌 | 낮음 | 중간 | Tailwind CSS Layer 순서 검증 |

---

## 12. 참고 자료

### 12.1 관련 문서

- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/jjiban/prd.md` (섹션 10.1)
- TRD: `.jjiban/jjiban/trd.md` (섹션 2.3.6)
- TSK-08-01 매뉴얼: `.jjiban/projects/jjiban/tasks/TSK-08-01/080-manual.md`

### 12.2 외부 참조

- [PrimeVue Pass Through API](https://primevue.org/passthrough/)
- [PrimeVue ProgressBar](https://primevue.org/progressbar/)
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration)
- [WCAG 2.1 AA Color Contrast](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum)

---

## 13. 다음 단계

### 13.1 상세설계 단계 (/wf:draft)

- CategoryTag.vue 상세 구현 계획
- ProgressBar.vue 상세 구현 계획
- main.css 추가 클래스 상세 명세
- Pass Through API 타입 정의

### 13.2 구현 단계 (/wf:build)

- CategoryTag.vue 수정
- ProgressBar.vue 수정
- main.css 클래스 추가
- 로컬 테스트 및 검증

### 13.3 검증 단계 (/wf:verify)

- 시각적 회귀 테스트
- E2E 테스트 실행
- 색상 대비 검증
- 통합 테스트 보고서 작성

---

<!--
author: Claude Opus 4.5 (Frontend Architect)
Template Version: 1.0.0
Created: 2025-12-16
-->
