# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: CategoryTag, ProgressBar 컴포넌트 마이그레이션 완료 후 사용 가이드

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-02 |
| Task명 | WBS UI Components Migration |
| Category | development |
| 상태 | [xx] 완료 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 개요

### 1.1 매뉴얼 목적

TSK-08-02에서 완료한 CategoryTag, ProgressBar 컴포넌트 마이그레이션 내용을 설명합니다. 주요 변경사항은 HEX 하드코딩 제거 및 CSS 클래스 중앙화입니다.

### 1.2 주요 변경사항

| 컴포넌트 | 변경 내용 | 효과 |
|---------|---------|------|
| CategoryTag | HEX 하드코딩 → CSS 클래스 (`category-tag-*`) | 색상 중앙 관리, 테마 변경 용이 |
| ProgressBar | HEX 하드코딩 → CSS 클래스 (`progress-bar-*`) | 색상 중앙 관리, 유지보수성 향상 |
| main.css | 통합 스타일 클래스 추가 | 단일 진실 공급원(Single Source of Truth) |

### 1.3 마이그레이션 결과

- ✅ HEX 하드코딩 완전 제거
- ✅ CSS 클래스 중앙화 원칙 준수
- ✅ 기존 기능 100% 유지
- ✅ 성능 영향 없음 (< 5% 차이)
- ✅ 접근성 속성 유지 (ARIA, data-testid)

---

## 2. CategoryTag 컴포넌트

### 2.1 개요

Task 카테고리를 표시하는 태그 컴포넌트. PrimeVue Tag를 wrapper div로 감싸 배경색 및 테두리를 적용합니다.

### 2.2 사용법

#### 기본 사용

```vue
<template>
  <CategoryTag :category="task.category" />
</template>

<script setup lang="ts">
import CategoryTag from '~/components/wbs/CategoryTag.vue'

const task = {
  category: 'development' // 'development' | 'defect' | 'infrastructure'
}
</script>
```

#### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| category | 'development' \| 'defect' \| 'infrastructure' | Y | - | Task 카테고리 |

### 2.3 시각적 결과

**development**:
```
┌─────────────┐
│ 📝 Dev      │ ← 파란색 배경 (bg-primary/20)
└─────────────┘
```

**defect**:
```
┌─────────────┐
│ ⚠️ Defect   │ ← 빨간색 배경 (bg-danger/20)
└─────────────┘
```

**infrastructure**:
```
┌─────────────┐
│ ⚙️ Infra    │ ← 보라색 배경 (bg-level-project/20)
└─────────────┘
```

### 2.4 CSS 클래스 커스터마이징

main.css에서 다음 클래스를 수정하여 스타일 변경 가능:

```css
/* CategoryTag 컴포넌트 스타일 (TSK-08-02) */

.category-tag-development {
  @apply bg-primary/20 border border-primary/30 rounded-xl px-2 py-1;
}

.category-tag-defect {
  @apply bg-danger/20 border border-danger/30 rounded-xl px-2 py-1;
}

.category-tag-infrastructure {
  @apply bg-level-project/20 border border-level-project/30 rounded-xl px-2 py-1;
}
```

**커스터마이징 예시**:

```css
/* 테두리 두께 변경 */
.category-tag-development {
  @apply bg-primary/20 border-2 border-primary/30 rounded-xl px-2 py-1;
}

/* 패딩 증가 */
.category-tag-defect {
  @apply bg-danger/20 border border-danger/30 rounded-xl px-3 py-2;
}

/* 모서리 둥글기 제거 */
.category-tag-infrastructure {
  @apply bg-level-project/20 border border-level-project/30 px-2 py-1;
}
```

### 2.5 색상 변경

색상을 변경하려면 tailwind.config.ts에서 CSS 변수를 수정:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',      // Development
        danger: 'var(--color-danger)',        // Defect
        'level-project': 'var(--color-level-project)' // Infrastructure
      }
    }
  }
}
```

그 후 main.css에서 CSS 변수 값 변경:

```css
/* main.css */
:root {
  --color-primary: #3b82f6;        /* Development (파란색) */
  --color-danger: #ef4444;         /* Defect (빨간색) */
  --color-level-project: #8b5cf6;  /* Infrastructure (보라색) */
}
```

### 2.6 Invalid Category 처리

유효하지 않은 category가 전달되면 기본값 반환:

```typescript
// CategoryTag.vue
const categoryConfig = computed(() => {
  const configs = {
    development: { icon: 'pi-code', label: 'Dev' },
    defect: { icon: 'pi-exclamation-triangle', label: 'Defect' },
    infrastructure: { icon: 'pi-cog', label: 'Infra' }
  }

  const config = configs[props.category]
  if (!config) {
    console.warn(`Invalid category: ${props.category}`)
    return { icon: 'pi-code', label: 'Unknown' }
  }
  return config
})
```

**결과**:
- Console에 경고 메시지 출력
- 기본 아이콘(pi-code), 라벨(Unknown) 표시

---

## 3. ProgressBar 컴포넌트

### 3.1 개요

Task 진행률을 표시하는 바 컴포넌트. PrimeVue ProgressBar를 사용하며, 진행률 구간에 따라 색상이 자동 변경됩니다.

### 3.2 사용법

#### 기본 사용

```vue
<template>
  <ProgressBar :value="task.progress" />
</template>

<script setup lang="ts">
import ProgressBar from '~/components/wbs/ProgressBar.vue'

const task = {
  progress: 45 // 0-100 사이 숫자
}
</script>
```

#### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| value | number | Y | - | 진행률 (0-100) |

### 3.3 진행률 구간별 색상

| 진행률 | CSS 클래스 | 색상 | 의미 |
|--------|-----------|------|------|
| 0-29% | `progress-bar-low` | 빨간색 (danger) | 낮은 진행률 |
| 30-69% | `progress-bar-medium` | 황색 (warning) | 중간 진행률 |
| 70-100% | `progress-bar-high` | 초록색 (success) | 높은 진행률 |

**시각적 예시**:

```
0-29% (Low):
██░░░░░░░░░░░░░░░░  15%  ← 빨간색

30-69% (Medium):
████████░░░░░░░░░░  45%  ← 황색

70-100% (High):
████████████████░░  85%  ← 초록색
```

### 3.4 경계값 처리

| 값 | 클래스 | 설명 |
|-----|--------|------|
| 29 | `progress-bar-low` | 30 미만은 Low |
| 30 | `progress-bar-medium` | 30 이상 70 미만은 Medium |
| 69 | `progress-bar-medium` | 70 미만은 Medium |
| 70 | `progress-bar-high` | 70 이상은 High |

### 3.5 값 클램핑 (Clamping)

유효 범위를 벗어난 값은 자동으로 0-100으로 제한:

```typescript
// ProgressBar.vue
const clampedValue = computed(() => {
  return Math.min(100, Math.max(0, props.value))
})
```

**예시**:

| 입력 | 출력 | 설명 |
|------|------|------|
| -10 | 0 | 음수는 0으로 클램핑 |
| 50 | 50 | 정상 범위는 그대로 유지 |
| 150 | 100 | 100 초과는 100으로 클램핑 |

### 3.6 CSS 클래스 커스터마이징

main.css에서 다음 클래스를 수정하여 색상 변경 가능:

```css
/* ProgressBar 컴포넌트 스타일 (TSK-08-02) */

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

**커스터마이징 예시**:

```css
/* 색상 변경 */
.progress-bar-low {
  @apply bg-red-500;      /* Tailwind 색상 직접 사용 */
}

.progress-bar-medium {
  @apply bg-yellow-400;
}

.progress-bar-high {
  @apply bg-green-500;
}
```

### 3.7 임계값 변경

진행률 구간 임계값을 변경하려면 컴포넌트 내 상수 수정:

```typescript
// ProgressBar.vue
const PROGRESS_THRESHOLDS = {
  LOW: 30,    // 30% 미만은 Low
  MEDIUM: 70  // 70% 미만은 Medium
} as const

const barClass = computed(() => {
  if (clampedValue.value < PROGRESS_THRESHOLDS.LOW) return 'progress-bar-low'
  if (clampedValue.value < PROGRESS_THRESHOLDS.MEDIUM) return 'progress-bar-medium'
  return 'progress-bar-high'
})
```

**예시**: 임계값을 20%, 80%로 변경

```typescript
const PROGRESS_THRESHOLDS = {
  LOW: 20,    // 20% 미만은 Low
  MEDIUM: 80  // 80% 미만은 Medium
} as const
```

---

## 4. CSS 클래스 중앙화 원칙

### 4.1 원칙 개요

**핵심**: 컴포넌트 내 인라인 스타일(`:style`) 및 HEX 하드코딩 금지. 모든 스타일은 main.css의 Tailwind 클래스로 중앙 관리.

### 4.2 스타일 관리 흐름

```
main.css (CSS 변수 + Tailwind 클래스)
    ↓
tailwind.config.ts (CSS 변수 참조)
    ↓
컴포넌트 (:class 바인딩만 사용)
```

### 4.3 금지 패턴

**❌ 인라인 스타일**:

```vue
<!-- 금지 -->
:style="{ backgroundColor: '#3b82f6' }"
:style="{ backgroundColor: categoryColor }"
```

**❌ 컴포넌트 내 HEX 하드코딩**:

```typescript
// 금지
const categoryColor = computed(() => {
  return configs[props.category].color // '#3b82f6'
})
```

### 4.4 권장 패턴

**✅ CSS 클래스 바인딩**:

```vue
<!-- 권장 -->
:class="`category-tag-${category}`"
:class="{ 'progress-bar-low': value < 30 }"
```

**✅ main.css에서 스타일 정의**:

```css
/* 권장 */
.category-tag-development {
  @apply bg-primary/20 border border-primary/30;
}
```

### 4.5 예외 사항

다음 경우에만 인라인 스타일 허용:

- 동적 계산 필수 (paddingLeft, transform, 드래그 리사이즈)
- Props로 전달된 동적 값 (사용자 입력 색상)

**예시**:

```vue
<!-- 허용: 동적 들여쓰기 계산 -->
:style="{ paddingLeft: `${level * 20}px` }"

<!-- 허용: Props 동적 색상 -->
:style="{ backgroundColor: props.customColor }"
```

---

## 5. 테스트

### 5.1 단위 테스트

CategoryTag, ProgressBar 컴포넌트는 각각 단위 테스트가 작성되어 있습니다.

**테스트 실행**:

```bash
# CategoryTag 테스트
npm run test:unit tests/unit/components/wbs/CategoryTag.test.ts

# ProgressBar 테스트
npm run test:unit tests/unit/components/wbs/ProgressBar.test.ts

# 전체 실행
npm run test:unit tests/unit/components/wbs/CategoryTag.test.ts tests/unit/components/wbs/ProgressBar.test.ts
```

**테스트 커버리지**:

| 컴포넌트 | 테스트 수 | 커버리지 |
|---------|----------|---------|
| CategoryTag | 5 | 100% |
| ProgressBar | 9 | 100% |

### 5.2 E2E 테스트

E2E 테스트는 WBS 트리 패널에서 통합적으로 검증됩니다.

**테스트 실행**:

```bash
npm run test:e2e
```

**테스트 시나리오**:

- WBS 트리에서 CategoryTag 렌더링 확인
- Task 진행률에 따른 ProgressBar 색상 확인
- 다양한 진행률 값에 대한 시각적 검증

---

## 6. 트러블슈팅

### 6.1 CategoryTag 색상이 표시되지 않음

**증상**: CategoryTag 배경색이 투명하게 표시됨

**원인**: main.css 클래스가 로드되지 않음

**해결책**:

1. main.css가 nuxt.config.ts에 등록되었는지 확인:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/css/main.css']
})
```

2. 브라우저 개발자 도구에서 CSS 클래스 적용 확인:

```html
<div class="category-tag-development">...</div>
```

3. Computed Style에서 배경색 확인:

```
background-color: rgba(59, 130, 246, 0.2)
```

### 6.2 ProgressBar 색상이 변경되지 않음

**증상**: 진행률이 변경되어도 색상이 그대로 유지됨

**원인**: Pass Through API가 class를 올바르게 주입하지 못함

**해결책**:

1. passThrough computed가 올바르게 정의되었는지 확인:

```typescript
const passThrough = computed(() => ({
  value: { class: barClass.value }
}))
```

2. 브라우저 개발자 도구에서 PrimeVue ProgressBar의 value 요소에 class가 적용되었는지 확인:

```html
<div class="p-progressbar-value progress-bar-medium" ...></div>
```

### 6.3 유효하지 않은 Category 경고

**증상**: Console에 "Invalid category: xxx" 경고 표시

**원인**: 존재하지 않는 category 값이 전달됨

**해결책**:

1. category prop 값 확인:

```vue
<CategoryTag :category="task.category" />
```

2. task.category가 다음 중 하나인지 확인:
   - `'development'`
   - `'defect'`
   - `'infrastructure'`

3. 타입 체크 활성화:

```typescript
interface Task {
  category: 'development' | 'defect' | 'infrastructure'
}
```

### 6.4 진행률 값이 클램핑되지 않음

**증상**: 음수 또는 100 초과 값이 그대로 표시됨

**원인**: clampedValue computed가 사용되지 않음

**해결책**:

1. PrimeVue ProgressBar에 clampedValue를 전달하는지 확인:

```vue
<ProgressBar :value="clampedValue" :pt="passThrough" />
```

2. clampedValue computed 로직 확인:

```typescript
const clampedValue = computed(() => {
  return Math.min(100, Math.max(0, props.value))
})
```

---

## 7. 참고 자료

### 7.1 관련 문서

| 문서 유형 | 경로 | 설명 |
|----------|------|------|
| 기본설계 | `010-basic-design.md` | 마이그레이션 전략 및 요구사항 |
| 상세설계 | `020-detail-design.md` | 컴포넌트 구조 및 데이터 모델 |
| 테스트 명세 | `026-test-specification.md` | 테스트 시나리오 및 데이터 |
| 통합테스트 | `070-integration-test.md` | 테스트 결과 및 검증 |
| PRD | `.jjiban/jjiban/prd.md` | 섹션 10.1 (UI 디자인 시스템) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화) |

### 7.2 컴포넌트 경로

| 컴포넌트 | 경로 |
|---------|------|
| CategoryTag | `app/components/wbs/CategoryTag.vue` |
| ProgressBar | `app/components/wbs/ProgressBar.vue` |
| main.css | `assets/css/main.css` |

### 7.3 단위 테스트 경로

| 테스트 | 경로 |
|--------|------|
| CategoryTag Test | `tests/unit/components/wbs/CategoryTag.test.ts` |
| ProgressBar Test | `tests/unit/components/wbs/ProgressBar.test.ts` |

### 7.4 외부 문서

- PrimeVue Tag: https://primevue.org/tag/
- PrimeVue ProgressBar: https://primevue.org/progressbar/
- PrimeVue Pass Through: https://primevue.org/passthrough/
- TailwindCSS Opacity: https://tailwindcss.com/docs/opacity
- TailwindCSS Colors: https://tailwindcss.com/docs/customizing-colors

---

## 8. FAQ

### Q1. CSS 변수를 직접 수정해도 되나요?

**A**: 네, `main.css`에서 CSS 변수를 직접 수정할 수 있습니다. 단, tailwind.config.ts에서 해당 변수를 참조하고 있는지 확인하세요.

```css
/* main.css */
:root {
  --color-primary: #1e40af;  /* 파란색 어둡게 변경 */
}
```

### Q2. 새로운 카테고리를 추가하려면?

**A**: 다음 단계를 따르세요:

1. `CategoryTag.vue`의 configs 객체에 새 카테고리 추가:

```typescript
const configs = {
  development: { icon: 'pi-code', label: 'Dev' },
  defect: { icon: 'pi-exclamation-triangle', label: 'Defect' },
  infrastructure: { icon: 'pi-cog', label: 'Infra' },
  research: { icon: 'pi-book', label: 'Research' } // 추가
}
```

2. `main.css`에 새 카테고리 클래스 추가:

```css
.category-tag-research {
  @apply bg-info/20 border border-info/30 rounded-xl px-2 py-1;
}
```

3. 타입 정의 업데이트:

```typescript
type TaskCategory = 'development' | 'defect' | 'infrastructure' | 'research'
```

### Q3. 진행률 구간을 4개로 나누려면?

**A**: `ProgressBar.vue`의 barClass computed를 수정하세요:

```typescript
const PROGRESS_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75
} as const

const barClass = computed(() => {
  if (clampedValue.value < PROGRESS_THRESHOLDS.LOW) return 'progress-bar-very-low'
  if (clampedValue.value < PROGRESS_THRESHOLDS.MEDIUM) return 'progress-bar-low'
  if (clampedValue.value < PROGRESS_THRESHOLDS.HIGH) return 'progress-bar-medium'
  return 'progress-bar-high'
})
```

그리고 `main.css`에 새 클래스 추가:

```css
.progress-bar-very-low { @apply bg-red-700; }
.progress-bar-low { @apply bg-danger; }
.progress-bar-medium { @apply bg-warning; }
.progress-bar-high { @apply bg-success; }
```

### Q4. 다크 테마에서 색상이 이상하게 보여요

**A**: `main.css`에서 다크 모드 CSS 변수를 정의하세요:

```css
:root {
  --color-primary: #3b82f6;
  --color-danger: #ef4444;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;  /* 밝은 파란색 */
    --color-danger: #f87171;   /* 밝은 빨간색 */
  }
}
```

### Q5. ProgressBar 높이를 변경하려면?

**A**: PrimeVue ProgressBar의 Pass Through API를 사용하여 높이를 조정할 수 있습니다:

```typescript
const passThrough = computed(() => ({
  root: {
    style: { height: '1rem' }  // 높이 변경
  },
  value: {
    class: barClass.value
  }
}))
```

또는 `main.css`에서 전역 스타일 정의:

```css
.p-progressbar {
  height: 1rem;  /* 기본 높이 변경 */
}
```

---

## 9. 버전 히스토리

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0.0 | 2025-12-16 | 초판 작성 (TSK-08-02 완료) | Claude Opus 4.5 |

---

## 10. 라이선스 및 저작권

이 문서는 jjiban 프로젝트의 일부이며, 프로젝트 라이선스를 따릅니다.

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
Task: TSK-08-02
-->
