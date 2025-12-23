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
| Task ID | TSK-08-03 |
| Task명 | AppLayout PrimeVue Splitter Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 6.1 (레이아웃 구조) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.3 (PrimeVue 최우선), 2.3.6 (CSS 중앙화) |
| 상위 Work Package | WP-08: PrimeVue Component Migration | - |
| 선행 Task | TSK-08-01: WbsTreePanel + NodeIcon Migration | PrimeVue 통합 패턴 참조 |

---

## 1. 요구사항 분석

### 1.1 PRD/TRD 요구사항 추출

| 요구사항 ID | 출처 | 요구사항 내용 | 우선순위 |
|------------|------|-------------|---------|
| REQ-01 | wbs.md | 커스텀 CSS Grid → PrimeVue Splitter + SplitterPanel 교체 | 필수 |
| REQ-02 | wbs.md | 60:40 기본 비율 유지 | 필수 |
| REQ-03 | wbs.md | minSize 제약 유지 (좌측 400px, 우측 300px) | 필수 |
| REQ-04 | wbs.md | 슬롯 기반 콘텐츠 주입 유지 (header, left, right) | 필수 |
| REQ-05 | wbs.md | 다크 테마 CSS 변수 통합 | 필수 |
| REQ-06 | wbs.md | 반응형 동작 유지 (min-width: 1200px) | 필수 |
| REQ-07 | TRD 2.3.3 | PrimeVue 컴포넌트 최우선 사용 원칙 | 필수 |
| REQ-08 | TRD 2.3.6 | CSS 클래스 중앙화 원칙 준수 | 필수 |

### 1.2 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|-------|---------|-------------------------------|
| FR-001 | PrimeVue Splitter 통합 | Splitter 컴포넌트 사용, 드래그 리사이즈 기능 동작 |
| FR-002 | 60:40 기본 비율 유지 | 초기 렌더링 시 좌측 60%, 우측 40% 비율 표시 |
| FR-003 | minSize 제약 적용 | 좌측 최소 400px, 우측 최소 300px 이하로 축소 불가 |
| FR-004 | 슬롯 시스템 유지 | header, left, right 슬롯 정상 작동 |
| FR-005 | 드래그 리사이즈 | Splitter gutter 드래그로 패널 크기 조정 가능 |
| FR-006 | resize 이벤트 발생 | 리사이즈 완료 시 leftWidth 값 emit |
| FR-007 | 기존 기능 유지 | 시각적 모습 및 ARIA 속성 100% 유지 |

### 1.3 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 측정 기준 |
|--------|---------|----------|
| NFR-001 | 사용성 | 드래그 리사이즈 직관적, 부드러운 동작 |
| NFR-002 | 접근성 | ARIA 속성 유지, 키보드 탐색 지원 |
| NFR-003 | 성능 | 리사이즈 시 렌더링 지연 < 100ms |
| NFR-004 | 테스트 호환성 | 기존 E2E 테스트 data-testid 유지 |
| NFR-005 | 테마 일관성 | Dark Blue 테마 색상 팔레트 100% 일치 |

---

## 2. 현황 분석

### 2.1 현재 AppLayout.vue 구조

| 현황 | 내용 |
|------|------|
| 레이아웃 방식 | CSS Grid (`display: flex`) |
| 패널 분할 | `:style` 인라인으로 width 제어 |
| 리사이즈 기능 | ❌ 없음 (정적 비율만 지원) |
| Props | leftWidth, minLeftWidth, minRightWidth |
| 슬롯 시스템 | header, left, right (3개 슬롯) |
| ARIA 속성 | role="banner", role="main", role="complementary" |

**현재 패널 분할 코드 분석**:

```vue
<!-- 좌측 패널: CSS 인라인 스타일 -->
<aside
  :style="{
    width: `${validatedLeftWidth}%`,
    minWidth: `${props.minLeftWidth}px`
  }"
>

<!-- 우측 패널: CSS 인라인 스타일 -->
<section
  :style="{
    width: `${rightWidth}%`,
    minWidth: `${props.minRightWidth}px`
  }"
>
```

**문제점**:
- 드래그 리사이즈 기능 없음 (정적 비율만 가능)
- 인라인 스타일 사용 (CSS 중앙화 원칙 위배)
- 커스텀 구현으로 접근성 기능 제한적

### 2.2 PrimeVue Splitter 기능

| 기능 | 설명 | 해당 Props/Events |
|------|------|------------------|
| 패널 분할 | 드래그 가능한 gutter로 분할 | `layout="horizontal"` |
| 초기 크기 | 패널별 크기 설정 | `SplitterPanel :size` |
| 최소 크기 | 패널 최소 크기 제약 | `SplitterPanel :minSize` |
| 리사이즈 이벤트 | 드래그 완료 시 이벤트 | `@resize` |
| 접근성 | 키보드 탐색, ARIA 자동 지원 | 내장 기능 |

**PrimeVue Splitter 장점**:
- 드래그 리사이즈 기능 내장
- 접근성 기능 자동 제공 (키보드 탐색)
- Pass Through API로 CSS 클래스 중앙화 가능
- PrimeVue 디자인 시스템 일관성

---

## 3. 솔루션 설계

### 3.1 전체 마이그레이션 전략

**원칙**: TSK-08-01, TSK-08-02 패턴 재사용

```
커스텀 CSS Grid (현재)
    ↓ 교체
PrimeVue Splitter + SplitterPanel
    ↓ CSS 클래스 중앙화
main.css (CSS 변수 참조)
    ↓ Pass Through API
다크 테마 스타일 적용
```

### 3.2 AppLayout 구조 변경

#### 3.2.1 현재 구조 (Before)

```vue
<template>
  <div class="h-screen flex flex-col">
    <!-- Header: 고정 56px -->
    <header class="h-[56px]">
      <slot name="header" />
    </header>

    <!-- Content: flex 분할 -->
    <main class="flex-1 flex">
      <!-- 좌측: 인라인 스타일 -->
      <aside :style="{ width: '60%', minWidth: '400px' }">
        <slot name="left" />
      </aside>

      <!-- 우측: 인라인 스타일 -->
      <section :style="{ width: '40%', minWidth: '300px' }">
        <slot name="right" />
      </section>
    </main>
  </div>
</template>
```

#### 3.2.2 변경 후 구조 (After)

```vue
<template>
  <div class="h-screen flex flex-col">
    <!-- Header: 변경 없음 -->
    <header class="h-[56px]">
      <slot name="header" />
    </header>

    <!-- Content: PrimeVue Splitter -->
    <main class="flex-1">
      <Splitter
        layout="horizontal"
        :pt="splitterPassThrough"
        @resize="handleResize"
      >
        <!-- 좌측 패널: SplitterPanel -->
        <SplitterPanel :size="leftWidth" :minSize="minLeftSizePercent">
          <slot name="left" />
        </SplitterPanel>

        <!-- 우측 패널: SplitterPanel -->
        <SplitterPanel :size="rightWidth" :minSize="minRightSizePercent">
          <slot name="right" />
        </SplitterPanel>
      </Splitter>
    </main>
  </div>
</template>
```

### 3.3 핵심 설계 결정

#### 3.3.1 Props 유지 전략

| 현재 Props | 변경 후 | 변환 방식 |
|-----------|---------|----------|
| leftWidth (%) | :size="leftWidth" | 직접 사용 (60) |
| minLeftWidth (px) | :minSize="minLeftSizePercent" | px → % 변환 computed |
| minRightWidth (px) | :minSize="minRightSizePercent" | px → % 변환 computed |

**minSize 변환 로직**:

```typescript
// minSize는 %로 전달해야 함 (PrimeVue Splitter 요구사항)
const minLeftSizePercent = computed(() => {
  const containerWidth = 1200 // min-width 기준
  return (props.minLeftWidth / containerWidth) * 100 // 400px → 33.33%
})

const minRightSizePercent = computed(() => {
  const containerWidth = 1200
  return (props.minRightWidth / containerWidth) * 100 // 300px → 25%
})
```

#### 3.3.2 이벤트 처리

| 이벤트 | 발생 조건 | 페이로드 |
|--------|----------|---------|
| @resize | Splitter gutter 드래그 완료 | `{ originalEvent, sizes: [leftSize, rightSize] }` |

**resize 이벤트 핸들러**:

```typescript
const handleResize = (event: SplitterResizeEvent) => {
  const [leftSize, rightSize] = event.sizes
  emit('resize', { leftWidth: leftSize })
}
```

#### 3.3.3 CSS 클래스 중앙화

**Pass Through API 적용**:

```typescript
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

**main.css 스타일 정의**:

```css
/* ============================================
 * AppLayout Splitter 스타일 (TSK-08-03)
 * CSS 클래스 중앙화 원칙 준수
 * ============================================ */

/* Splitter 루트 */
.app-layout-splitter {
  @apply h-full;
}

/* Gutter (구분선) */
.app-layout-gutter {
  @apply bg-border hover:bg-border-light transition-colors;
  width: 4px;
}

/* Gutter Handle (드래그 핸들) */
.app-layout-gutter-handle {
  @apply bg-primary/30 rounded-full;
  width: 2px;
  height: 24px;
}
```

---

## 4. 데이터 흐름 설계

### 4.1 초기 렌더링

```
Props 전달
  → leftWidth: 60 (%)
  → minLeftWidth: 400 (px)
  → minRightWidth: 300 (px)

Computed 계산
  → validatedLeftWidth: 60
  → rightWidth: 40
  → minLeftSizePercent: 33.33
  → minRightSizePercent: 25

Splitter 렌더링
  → SplitterPanel :size="60"
  → SplitterPanel :size="40"
  → minSize 제약 적용
```

### 4.2 드래그 리사이즈

```
사용자 gutter 드래그
  ↓
Splitter @resize 이벤트 발생
  → sizes: [55, 45] (예시)
  ↓
handleResize() 핸들러
  → emit('resize', { leftWidth: 55 })
  ↓
부모 컴포넌트 처리
  → leftWidth Props 업데이트 (필요 시)
```

---

## 5. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| Splitter layout | (A) horizontal, (B) vertical | A: horizontal | 좌우 분할 요구사항 |
| minSize 단위 | (A) px, (B) % | B: % | PrimeVue Splitter API 요구사항 |
| minSize 변환 시점 | (A) computed, (B) static | A: computed | Props 변경 시 반응성 유지 |
| CSS 적용 방식 | (A) Pass Through, (B) Global CSS | A: Pass Through | CSS 클래스 중앙화 원칙 |
| 기존 Props 유지 | (A) 유지, (B) 변경 | A: 유지 | 호환성, 기존 테스트 유지 |
| 슬롯 시스템 | (A) 유지, (B) 변경 | A: 유지 | 기존 사용처 호환성 |

---

## 6. 제약사항 및 가정

### 6.1 기술적 제약

| 제약사항 | 설명 | 대응 방안 |
|---------|------|----------|
| PrimeVue Splitter minSize | %만 지원 (px 미지원) | px → % 변환 computed 함수 작성 |
| 반응형 최소 너비 | min-width: 1200px 유지 필수 | 기준 너비 1200px로 % 변환 |
| 기존 E2E 테스트 | data-testid 의존성 | 기존 속성 유지 필수 |

### 6.2 가정

- PrimeVue Splitter는 Pass Through API로 class 속성 지원
- main.css의 CSS 변수는 이미 정의되어 있음
- 부모 컴포넌트는 resize 이벤트를 선택적으로 처리 (필수 아님)
- min-width: 1200px 이하에서는 스크롤 발생 (레이아웃 유지)

---

## 7. 마이그레이션 체크리스트

### 7.1 컴포넌트 변경 사항

| 작업 | 변경 전 | 변경 후 |
|------|---------|---------|
| 패널 분할 | `<aside>`, `<section>` + CSS | `<Splitter>` + `<SplitterPanel>` |
| 크기 제어 | `:style="{ width: '%' }"` | `:size="number"` |
| minSize | `:style="{ minWidth: 'px' }"` | `:minSize="percent"` (computed) |
| 이벤트 | emit 정의만 (미사용) | `@resize` + handleResize() |
| CSS 스타일 | 인라인 스타일 | Pass Through API + main.css |

### 7.2 Props 및 Emit

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| leftWidth | Props (기본값: 60) | ✅ 유지 |
| minLeftWidth | Props (기본값: 400) | ✅ 유지 (변환만) |
| minRightWidth | Props (기본값: 300) | ✅ 유지 (변환만) |
| resize 이벤트 | 정의만 (미사용) | ✅ 구현 (handleResize) |

### 7.3 ARIA 속성 유지

| 역할 | 현재 | 변경 후 |
|------|------|---------|
| Header | role="banner" | ✅ 유지 (변경 없음) |
| Main | role="main" | ✅ 유지 (Splitter 래퍼) |
| Left Panel | role="complementary" | ✅ 유지 (SplitterPanel 내부) |
| Right Panel | role="region", aria-label | ✅ 유지 (SplitterPanel 내부) |

---

## 8. 우선순위 및 일정

### 8.1 마이그레이션 순서

| 순서 | 작업 | 소요 시간 (예상) | 이유 |
|------|------|----------------|------|
| 1 | main.css 스타일 클래스 정의 | 30분 | 컴포넌트가 의존 |
| 2 | minSize 변환 computed 함수 작성 | 30분 | Splitter Props 의존 |
| 3 | Splitter + SplitterPanel 교체 | 1시간 | 핵심 마이그레이션 |
| 4 | Pass Through API 적용 | 30분 | CSS 클래스 중앙화 |
| 5 | resize 이벤트 핸들러 구현 | 30분 | 기능 추가 |
| 6 | ARIA 속성 검증 | 30분 | 접근성 유지 확인 |
| 7 | 회귀 테스트 | 1시간 | E2E 통과 검증 |

**총 예상 소요 시간**: 4.5시간

### 8.2 단계별 산출물

| 단계 | 산출물 | 검증 방법 |
|------|--------|----------|
| 상세설계 | `020-detail-design.md` | 설계리뷰 |
| 구현 | 수정된 AppLayout.vue + main.css | 로컬 테스트 |
| 테스트 | 회귀 테스트 통과 | E2E 실행 |
| 완료 | `080-manual.md` | 사용자 매뉴얼 작성 |

---

## 9. 위험 요소 및 완화 방안

| 위험 요소 | 발생 확률 | 영향도 | 완화 방안 |
|----------|----------|--------|----------|
| minSize % 변환 오류 | 낮음 | 높음 | 단위 테스트로 변환 로직 검증 |
| 드래그 리사이즈 성능 | 낮음 | 중간 | PrimeVue 내장 최적화 신뢰 |
| E2E 테스트 실패 | 중간 | 높음 | data-testid 유지, 회귀 테스트 우선 |
| ARIA 속성 손실 | 낮음 | 중간 | 수동 검증 및 접근성 테스트 |
| CSS 스타일 충돌 | 낮음 | 중간 | Pass Through 클래스 명시적 정의 |

---

## 10. 수용 기준 (Acceptance Criteria)

### 10.1 기능 요구사항

| AC ID | 수용 기준 | 검증 방법 |
|-------|----------|----------|
| AC-01 | PrimeVue Splitter 사용 | 컴포넌트 코드 확인 |
| AC-02 | 60:40 초기 비율 표시 | 브라우저 렌더링 확인 |
| AC-03 | 좌측 최소 400px, 우측 최소 300px 제약 | 드래그 테스트 |
| AC-04 | 드래그 리사이즈 동작 | 수동 테스트 |
| AC-05 | resize 이벤트 발생 | 이벤트 핸들러 로그 확인 |
| AC-06 | 슬롯 시스템 정상 작동 | header, left, right 슬롯 표시 확인 |
| AC-07 | 기존 E2E 테스트 통과 | Playwright 실행 |

### 10.2 품질 기준

| QC ID | 품질 기준 | 검증 방법 |
|-------|----------|----------|
| QC-01 | CSS 클래스 중앙화 준수 | 인라인 스타일 Grep 검색 결과 0건 |
| QC-02 | ARIA 속성 유지 | 접근성 도구 검증 |
| QC-03 | 드래그 성능 < 100ms | Chrome DevTools Performance |
| QC-04 | 다크 테마 일관성 | 시각적 검증 (Before/After) |

---

## 11. 다음 단계

- **상세설계**: `/wf:draft` 명령어로 `020-detail-design.md` 작성
  - minSize 변환 로직 상세화
  - Pass Through API 명세
  - resize 이벤트 핸들러 상세 설계
- **설계리뷰**: `/wf:review` 명령어로 LLM 검토

---

## 12. 참고 자료

### 내부 문서
- TSK-08-01 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-01/010-basic-design.md` (PrimeVue 통합 패턴 참조)
- TSK-08-02 기본설계: `.jjiban/projects/jjiban/tasks/TSK-08-02/010-basic-design.md` (CSS 중앙화 패턴 참조)
- PRD 섹션 6.1: 레이아웃 구조
- TRD 섹션 2.3.3: PrimeVue 최우선 사용 원칙
- TRD 섹션 2.3.6: CSS 클래스 중앙화 원칙

### PrimeVue 공식 문서
- Splitter Component: https://primevue.org/splitter/
- Pass Through API: https://primevue.org/passthrough/

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
