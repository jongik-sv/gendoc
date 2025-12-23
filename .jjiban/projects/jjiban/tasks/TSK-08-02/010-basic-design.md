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
| Task ID | TSK-08-02 |
| Task명 | WBS UI Components Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 10.1 (UI 디자인 시스템) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 클래스 중앙화) |
| 상위 Work Package | WP-08: PrimeVue Component Migration | - |
| 선행 Task | TSK-08-01: WbsTreePanel + NodeIcon Migration | NodeIcon 패턴 참조 |

---

## 1. 요구사항 분석

### 1.1 PRD/TRD 요구사항 추출

| 요구사항 ID | 출처 | 요구사항 내용 | 우선순위 |
|------------|------|-------------|---------|
| REQ-01 | wbs.md | StatusBadge: HEX 하드코딩 제거 → CSS 클래스 (.status-*) 적용 | 필수 |
| REQ-02 | wbs.md | CategoryTag: HEX 하드코딩 제거 → CSS 클래스 (.category-*) 적용 | 필수 |
| REQ-03 | wbs.md | ProgressBar: PrimeVue ProgressBar 컴포넌트로 교체 | 필수 |
| REQ-04 | wbs.md | main.css에 통합 스타일 클래스 정의 | 필수 |
| REQ-05 | TRD 2.3.6 | CSS 클래스 중앙화 원칙 준수 (인라인 스타일 금지) | 필수 |
| REQ-06 | TRD 2.3.4 | Dark Blue 테마 색상 팔레트 일관성 유지 | 필수 |
| REQ-07 | TRD 2.3.3 | PrimeVue 컴포넌트 최우선 사용 원칙 | 필수 |

### 1.2 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|-------|---------|-------------------------------|
| FR-001 | StatusBadge HEX 제거 | 컴포넌트 내 색상 하드코딩 전무, CSS 클래스만 사용 |
| FR-002 | CategoryTag HEX 제거 | 컴포넌트 내 색상 하드코딩 전무, CSS 클래스만 사용 |
| FR-003 | ProgressBar PrimeVue 교체 | PrimeVue ProgressBar 컴포넌트 사용, Pass Through API로 색상 제어 |
| FR-004 | CSS 클래스 정의 | main.css에 .status-*, .category-*, 진행률 색상 클래스 정의 |
| FR-005 | 기존 기능 유지 | 시각적 모습 및 동작 100% 유지 (회귀 방지) |

### 1.3 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 측정 기준 |
|--------|---------|----------|
| NFR-001 | 유지보수성 | CSS 클래스 중앙화로 색상 변경 용이성 |
| NFR-002 | 일관성 | PRD 10.1 Dark Blue 테마와 100% 일치 |
| NFR-003 | 테스트 호환성 | 기존 E2E 테스트 data-testid 유지 |
| NFR-004 | 성능 | 렌더링 성능 영향 없음 (< 5% 차이) |

---

## 2. 현황 분석

### 2.1 현재 컴포넌트 상태

#### StatusBadge.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | PrimeVue Tag 컴포넌트 사용 |
| 색상 제어 | `:severity` prop (secondary, info, warning, success) |
| 문제점 | **없음** - 이미 PrimeVue 기반, HEX 하드코딩 없음 |

**현재 코드 분석**:
```
statusSeverity (computed):
  - [ ] → 'secondary'
  - [bd/dd/an/ds] → 'info'
  - [im/fx] → 'warning'
  - [vf/xx] → 'success'
```

**결론**: StatusBadge는 **마이그레이션 불필요**. PrimeVue Tag의 severity만 사용하여 이미 CSS 클래스 중앙화 원칙 준수.

#### CategoryTag.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | PrimeVue Tag + wrapper div |
| 색상 제어 | **:style="{ backgroundColor: categoryColor }"** ← HEX 하드코딩 |
| 문제점 | categoryColor: '#3b82f6', '#ef4444', '#8b5cf6' 직접 정의 |

**HEX 하드코딩 위치**:
```typescript
const configs: Record<TaskCategory, CategoryConfig> = {
  development: { icon: 'pi-code', color: '#3b82f6', label: 'Dev' },
  defect: { icon: 'pi-exclamation-triangle', color: '#ef4444', label: 'Defect' },
  infrastructure: { icon: 'pi-cog', color: '#8b5cf6', label: 'Infra' }
}
```

**결론**: CategoryTag는 **마이그레이션 필수**. HEX 제거 후 CSS 클래스 바인딩 필요.

#### ProgressBar.vue

| 현황 | 내용 |
|------|------|
| 현재 방식 | PrimeVue ProgressBar 컴포넌트 사용 |
| 색상 제어 | **Pass Through API + barColor (computed)** ← HEX 하드코딩 |
| 문제점 | barColor: '#ef4444', '#f59e0b', '#22c55e' 직접 정의 |

**HEX 하드코딩 위치**:
```typescript
const barColor = computed(() => {
  if (clampedValue.value < 30) return '#ef4444'
  if (clampedValue.value < 70) return '#f59e0b'
  return '#22c55e'
})
```

**결론**: ProgressBar는 **마이그레이션 필수**. barColor 제거 후 CSS 클래스 활용 필요.

### 2.2 HEX 하드코딩 현황 정리

| 컴포넌트 | HEX 하드코딩 | 영향 범위 | 마이그레이션 필요성 |
|----------|------------|----------|-------------------|
| StatusBadge | ❌ 없음 | - | ❌ 불필요 |
| CategoryTag | ✅ 3개 | development, defect, infrastructure | ✅ 필수 |
| ProgressBar | ✅ 3개 | 0-30%, 30-70%, 70-100% | ✅ 필수 |

---

## 3. 솔루션 설계

### 3.1 전체 마이그레이션 전략

**원칙**: TSK-08-01 NodeIcon 패턴 재사용

```
HEX 하드코딩 (컴포넌트)
    ↓ 제거
CSS 변수 (main.css)
    ↓ 참조
Tailwind 클래스 (tailwind.config.ts)
    ↓ 사용
컴포넌트 (:class 바인딩)
```

### 3.2 CategoryTag 솔루션

#### 3.2.1 문제

```vue
<!-- 현재: HEX 하드코딩 -->
<div :style="{ backgroundColor: categoryColor }">
  <Tag :value="categoryLabel" :icon="categoryIcon" />
</div>
```

```typescript
const categoryColor = computed(() => {
  return configs[props.category].color // '#3b82f6', '#ef4444', '#8b5cf6'
})
```

#### 3.2.2 해결책

**Step 1**: main.css에 CSS 클래스 정의

```css
/* 카테고리별 배경색 클래스 */
.category-tag-development {
  @apply bg-primary/20;
}

.category-tag-defect {
  @apply bg-danger/20;
}

.category-tag-infrastructure {
  @apply bg-level-project/20;
}
```

**Step 2**: 컴포넌트에서 :class 바인딩

```vue
<!-- 변경 후: CSS 클래스 바인딩 -->
<div :class="`category-tag-${category}`">
  <Tag :value="categoryLabel" :icon="categoryIcon" />
</div>
```

**Step 3**: HEX 하드코딩 제거

```typescript
// categoryColor computed 삭제
// configs에서 color 필드 제거

const configs: Record<TaskCategory, Omit<CategoryConfig, 'color'>> = {
  development: { icon: 'pi-code', label: 'Dev' },
  defect: { icon: 'pi-exclamation-triangle', label: 'Defect' },
  infrastructure: { icon: 'pi-cog', label: 'Infra' }
}
```

### 3.3 ProgressBar 솔루션

#### 3.3.1 문제

```typescript
const barColor = computed(() => {
  if (clampedValue.value < 30) return '#ef4444'  // 빨강
  if (clampedValue.value < 70) return '#f59e0b'  // 황색
  return '#22c55e'  // 초록
})

const passThrough = computed((): ProgressBarPassThroughOptions => ({
  value: {
    style: {
      backgroundColor: barColor.value  // HEX 직접 주입
    }
  }
}))
```

#### 3.3.2 해결책

**Step 1**: main.css에 진행률 구간별 CSS 클래스 정의

```css
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

**Step 2**: PrimeVue Pass Through API에서 class 사용

```typescript
const barClass = computed(() => {
  if (clampedValue.value < 30) return 'progress-bar-low'
  if (clampedValue.value < 70) return 'progress-bar-medium'
  return 'progress-bar-high'
})

const passThrough = computed((): ProgressBarPassThroughOptions => ({
  value: {
    class: barClass.value  // CSS 클래스 주입
  }
}))
```

**Step 3**: barColor computed 제거

```typescript
// barColor computed 삭제 (불필요)
```

### 3.4 main.css 통합 스타일 정의

#### 3.4.1 추가할 CSS 클래스

```css
/* ============================================
 * WBS UI Components 스타일 (TSK-08-02)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* CategoryTag 컴포넌트 배경색 */
.category-tag-development {
  @apply bg-primary/20 border border-primary/30;
}

.category-tag-defect {
  @apply bg-danger/20 border border-danger/30;
}

.category-tag-infrastructure {
  @apply bg-level-project/20 border border-level-project/30;
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

#### 3.4.2 기존 CSS 변수 매핑

| 용도 | CSS 변수 | HEX 값 | Tailwind 클래스 |
|------|----------|--------|-----------------|
| Primary (Dev) | `--color-primary` | `#3b82f6` | `bg-primary` |
| Danger (Defect) | `--color-danger` | `#ef4444` | `bg-danger` |
| Project (Infra) | `--color-level-project` | `#8b5cf6` | `bg-level-project` |
| Success (High) | `--color-success` | `#22c55e` | `bg-success` |
| Warning (Medium) | `--color-warning` | `#f59e0b` | `bg-warning` |

---

## 4. 컴포넌트별 마이그레이션 상세

### 4.1 StatusBadge.vue

**상태**: ✅ 마이그레이션 불필요

**이유**:
- PrimeVue Tag의 severity prop만 사용 (이미 CSS 클래스 기반)
- HEX 하드코딩 없음
- CSS 클래스 중앙화 원칙 이미 준수

**변경 사항**: 없음

### 4.2 CategoryTag.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| wrapper div | `:style="{ backgroundColor }"` | `:class="\`category-tag-${category}\`"` |
| categoryColor | `computed(() => configs[].color)` | ❌ 삭제 |
| CategoryConfig | `{ icon, color, label }` | `{ icon, label }` (color 제거) |
| main.css | - | `.category-tag-*` 클래스 추가 |

**마이그레이션 전 코드 구조**:
```
<template>
  <div :style="{ backgroundColor: categoryColor }">
    <Tag :value="categoryLabel" :icon="categoryIcon" />
  </div>
</template>

<script>
const categoryColor = computed(() => configs[category].color)
</script>
```

**마이그레이션 후 코드 구조**:
```
<template>
  <div :class="`category-tag-${category}`">
    <Tag :value="categoryLabel" :icon="categoryIcon" />
  </div>
</template>

<script>
// categoryColor 제거
// configs에서 color 필드 제거
</script>
```

### 4.3 ProgressBar.vue

**마이그레이션 체크리스트**:

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| barColor | `computed(() => '#hex')` | ❌ 삭제 |
| barClass | - | `computed(() => 'progress-bar-*')` 추가 |
| passThrough | `value: { style: { backgroundColor } }` | `value: { class: barClass }` |
| main.css | - | `.progress-bar-*` 클래스 추가 |

**마이그레이션 전 코드 구조**:
```
<template>
  <ProgressBar :pt="passThrough" />
</template>

<script>
const barColor = computed(() => {
  if (value < 30) return '#ef4444'
  if (value < 70) return '#f59e0b'
  return '#22c55e'
})

const passThrough = computed(() => ({
  value: { style: { backgroundColor: barColor.value } }
}))
</script>
```

**마이그레이션 후 코드 구조**:
```
<template>
  <ProgressBar :pt="passThrough" />
</template>

<script>
const barClass = computed(() => {
  if (value < 30) return 'progress-bar-low'
  if (value < 70) return 'progress-bar-medium'
  return 'progress-bar-high'
})

const passThrough = computed(() => ({
  value: { class: barClass.value }
}))
</script>
```

---

## 5. 테스트 전략

### 5.1 회귀 테스트 (Regression)

| 컴포넌트 | 테스트 항목 | 검증 방법 |
|----------|-----------|----------|
| CategoryTag | 색상 시각적 일치 | 스크린샷 비교 (Before/After) |
| ProgressBar | 진행률 구간별 색상 | E2E: data-testid="progress-bar-{value}" |
| StatusBadge | 변경 없음 확인 | 기존 테스트 통과 확인 |

### 5.2 E2E 테스트 유지

**data-testid 속성 유지**:

```vue
<!-- CategoryTag -->
<div :data-testid="`category-tag-${category}`">

<!-- ProgressBar -->
<ProgressBar :data-testid="`progress-bar-${clampedValue}`">
```

### 5.3 색상 일관성 검증

| CSS 클래스 | 예상 색상 | 검증 방법 |
|-----------|----------|----------|
| `.category-tag-development` | `#3b82f6` (20% opacity) | 개발자 도구 Computed Style |
| `.category-tag-defect` | `#ef4444` (20% opacity) | 개발자 도구 Computed Style |
| `.progress-bar-low` | `#ef4444` | 개발자 도구 Computed Style |
| `.progress-bar-medium` | `#f59e0b` | 개발자 도구 Computed Style |
| `.progress-bar-high` | `#22c55e` | 개발자 도구 Computed Style |

---

## 6. 제약사항 및 가정

### 6.1 기술적 제약

| 제약사항 | 설명 | 대응 방안 |
|---------|------|----------|
| PrimeVue Pass Through API | class 속성 지원 여부 | 사전 검증 필요 (공식 문서 확인) |
| CSS 변수 스코프 | Tailwind 클래스 우선순위 | tailwind.config.ts에서 CSS 변수 참조 확인 |
| 기존 E2E 테스트 | data-testid 의존성 | 속성 유지 필수 |

### 6.2 가정

- main.css의 CSS 변수 (`--color-primary`, `--color-danger` 등)는 이미 정의되어 있음
- tailwind.config.ts에서 CSS 변수를 참조하는 구조 유지
- PrimeVue ProgressBar의 Pass Through API는 class 속성 지원

---

## 7. 우선순위 및 일정

### 7.1 마이그레이션 순서

| 순서 | 작업 | 소요 시간 (예상) | 이유 |
|------|------|----------------|------|
| 1 | main.css 클래스 정의 | 30분 | 모든 컴포넌트가 의존 |
| 2 | CategoryTag 마이그레이션 | 1시간 | 단순 (wrapper div만 변경) |
| 3 | ProgressBar 마이그레이션 | 1시간 | Pass Through API 검증 필요 |
| 4 | 회귀 테스트 | 1시간 | 색상 일치 검증 |

**총 예상 소요 시간**: 3.5시간

### 7.2 단계별 산출물

| 단계 | 산출물 | 검증 방법 |
|------|--------|----------|
| 상세설계 | `020-detail-design.md` | 설계리뷰 |
| 구현 | 수정된 컴포넌트 + main.css | 로컬 테스트 |
| 테스트 | 회귀 테스트 통과 | E2E 실행 |
| 완료 | `080-manual.md` | 사용자 매뉴얼 작성 |

---

## 8. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| Pass Through API class 미지원 | 낮음 | 높음 | 사전 검증 (PrimeVue 공식 문서) |
| 색상 시각적 불일치 | 중간 | 중간 | Before/After 스크린샷 비교 |
| E2E 테스트 실패 | 낮음 | 높음 | data-testid 유지 확인 |
| CSS 변수 참조 오류 | 낮음 | 중간 | tailwind.config.ts 검증 |

---

## 9. 수용 기준 (Acceptance Criteria)

### 9.1 기능 요구사항

| AC ID | 수용 기준 | 검증 방법 |
|-------|----------|----------|
| AC-01 | CategoryTag: HEX 하드코딩 전무 | Grep 검색 결과 0건 |
| AC-02 | ProgressBar: HEX 하드코딩 전무 | Grep 검색 결과 0건 |
| AC-03 | main.css에 .category-tag-*, .progress-bar-* 클래스 존재 | 파일 확인 |
| AC-04 | 기존 기능 100% 유지 | E2E 테스트 통과 |
| AC-05 | 색상 시각적 일치 | 스크린샷 비교 |

### 9.2 품질 기준

| QC ID | 품질 기준 | 검증 방법 |
|-------|----------|----------|
| QC-01 | CSS 클래스 중앙화 원칙 준수 | 코드 리뷰 |
| QC-02 | PRD 10.1 테마 일관성 | 색상 매핑 검증 |
| QC-03 | 기존 E2E 테스트 통과 | Playwright 실행 |
| QC-04 | 렌더링 성능 영향 < 5% | Chrome DevTools Performance |

---

## 10. 다음 단계

- **상세설계**: `/wf:draft` 명령어로 `020-detail-design.md` 작성
- **화면설계**: CategoryTag, ProgressBar 시각적 명세 (필요 시)
- **설계리뷰**: `/wf:review` 명령어로 LLM 검토

---

## 참고 자료

### 내부 문서
- TSK-08-01 상세설계: `.jjiban/projects/jjiban/tasks/TSK-08-01/020-detail-design.md` (NodeIcon 패턴 참조)
- TSK-08-01 매뉴얼: `.jjiban/projects/jjiban/tasks/TSK-08-01/080-manual.md`
- PRD 섹션 10.1: UI 디자인 시스템
- TRD 섹션 2.3.6: CSS 클래스 중앙화 원칙

### PrimeVue 공식 문서
- Pass Through API: https://primevue.org/passthrough/
- ProgressBar Component: https://primevue.org/progressbar/

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
