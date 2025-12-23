# UI/UX 설계 (011-ui-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 시각적 명세 중심: 레이아웃, 색상, 타이포그래피, 상호작용
> * 사용자 경험 흐름 정의
> * 접근성 및 반응형 디자인 고려
> * 기본설계 및 TRD 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-03 |
| Task명 | AppLayout PrimeVue Splitter Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Sonnet 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 (솔루션 설계) |
| TRD | `.jjiban/jjiban/trd.md` | 섹션 2.3.6 (CSS 중앙화), 섹션 5 (다크 테마) |
| PRD | `.jjiban/jjiban/prd.md` | 섹션 6.1 (레이아웃 구조) |
| 선행 Task | TSK-08-02: NodeIcon Migration | 다크 테마 CSS 변수 참조 |

---

## 1. UI/UX 설계 개요

### 1.1 설계 목표

| 목표 | 설명 | 측정 기준 |
|------|------|----------|
| 일관성 | PrimeVue 디자인 시스템 통합 | PrimeVue 컴포넌트 사용 100% |
| 사용성 | 직관적인 드래그 리사이즈 | 사용자 태스크 완료 시간 < 3초 |
| 접근성 | WCAG 2.1 AA 준수 | 키보드 탐색 100% 가능 |
| 성능 | 부드러운 리사이즈 동작 | 프레임 드롭 < 5% |
| 테마 일관성 | Dark Blue 테마 100% 일치 | 시각적 검증 통과 |

### 1.2 설계 범위

**In Scope**:
- PrimeVue Splitter 컴포넌트 레이아웃 명세
- Gutter (드래그 핸들) 시각적 디자인
- 다크 테마 스타일 정의 (CSS 클래스 중앙화)
- 반응형 브레이크포인트 및 동작 명세
- 접근성 요구사항 (ARIA, 키보드 탐색)

**Out of Scope**:
- Header, Left Panel, Right Panel 내부 컨텐츠 디자인 (슬롯 기반 주입)
- 로딩 상태, 에러 처리 UI (기본설계에 없음)
- 다크 테마 외 추가 테마 (현재 지원 범위)

---

## 2. 레이아웃 명세

### 2.1 전체 레이아웃 구조

```
┌────────────────────────────────────────────────────────┐
│                      HEADER                            │  56px 고정
│                    (role="banner")                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│   LEFT PANEL (60%)    │   RIGHT PANEL (40%)           │  flex-1
│   (role="complementary") │ (role="region")             │  (화면 높이 - 56px)
│                       │                                │
│   [슬롯: left]         │   [슬롯: right]                │
│                       │                                │
│                       │                                │
│                       │                                │
│   min: 400px         │   min: 300px                   │
│                       │                                │
│                    [GUTTER]                            │
│                   (드래그 핸들)                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**치수 명세**:

| 요소 | 크기 | 설명 |
|------|------|------|
| 전체 높이 | 100vh | 뷰포트 전체 높이 |
| Header 높이 | 56px | 고정, 변경 없음 |
| Content 높이 | calc(100vh - 56px) | 남은 공간 전체 |
| Left Panel 초기 너비 | 60% | 기본 비율 |
| Right Panel 초기 너비 | 40% | 기본 비율 |
| Left Panel 최소 너비 | 400px (≈ 33.33%) | 드래그 제약 |
| Right Panel 최소 너비 | 300px (≈ 25%) | 드래그 제약 |
| Gutter 너비 | 4px | 드래그 가능 영역 |

### 2.2 PrimeVue Splitter 레이아웃

**Splitter 컴포넌트 Props**:

```typescript
<Splitter
  layout="horizontal"           // 좌우 분할
  :pt="splitterPassThrough"     // CSS 클래스 중앙화
  @resize="handleResize"        // 리사이즈 이벤트
>
```

**SplitterPanel Props (Left Panel)**:

```typescript
<SplitterPanel
  :size="60"                    // 초기 60%
  :minSize="33.33"              // 최소 400px (1200px 기준 33.33%)
>
```

**SplitterPanel Props (Right Panel)**:

```typescript
<SplitterPanel
  :size="40"                    // 초기 40%
  :minSize="25"                 // 최소 300px (1200px 기준 25%)
>
```

### 2.3 반응형 레이아웃

| 브레이크포인트 | 동작 | 이유 |
|--------------|------|------|
| ≥ 1200px | 정상 드래그 리사이즈 | 기본 사용 시나리오 |
| < 1200px | 가로 스크롤 발생 | minSize 제약 유지 (UX 일관성) |

**min-width: 1200px 적용**:

```css
.app-layout-splitter {
  @apply h-full;
  min-width: 1200px; /* 가로 스크롤 트리거 */
}
```

**근거**: minSize 400px + 300px = 700px이지만, 실제 콘텐츠 최소 표시 너비가 1200px (TRD 요구사항)

---

## 3. Gutter (드래그 핸들) 디자인

### 3.1 Gutter 시각적 명세

**기본 상태**:

| 속성 | 값 | 설명 |
|------|---|------|
| 너비 | 4px | 드래그 가능 영역 |
| 배경색 | `var(--color-border)` | Dark Blue 테마 border 색상 |
| 커서 | `col-resize` | 수평 리사이즈 힌트 |
| 전환 효과 | `transition-colors` | 부드러운 색상 변화 |

**Hover 상태**:

| 속성 | 값 | 변화 |
|------|---|------|
| 배경색 | `var(--color-border-light)` | 밝은 테두리 색상 |
| 커서 | `col-resize` | 유지 |
| 시각 피드백 | 색상 변화 (200ms) | 호버 강조 |

**Active (드래그 중) 상태**:

| 속성 | 값 | 변화 |
|------|---|------|
| 배경색 | `var(--color-primary)` | Primary 색상 (강조) |
| 커서 | `col-resize` | 유지 |
| 시각 피드백 | 색상 변화 즉시 | 드래그 상태 명확화 |

### 3.2 Gutter Handle 디자인

**GutterHandle 명세** (Gutter 중앙 시각적 표시):

| 속성 | 값 | 설명 |
|------|---|------|
| 너비 | 2px | Gutter 내부 표시선 |
| 높이 | 24px | 중앙 세로 라인 |
| 배경색 | `var(--color-primary)` (30% 투명도) | Primary 색상 힌트 |
| 형태 | 둥근 모서리 (rounded-full) | 부드러운 디자인 |
| 위치 | Gutter 중앙 (수평, 수직 중앙) | 정렬 |

**시각적 표현**:

```
Gutter (4px)
┌──────┐
│      │  ← 투명 영역 (1px)
│  ██  │  ← Handle (2px, 24px)
│  ██  │     배경: primary/30
│  ██  │
│      │  ← 투명 영역 (1px)
└──────┘
```

### 3.3 접근성 고려사항

**키보드 탐색**:

| 키 | 동작 | 단계 |
|----|------|------|
| `←` (Left Arrow) | 좌측 패널 확대 (우측 축소) | 5% 단위 |
| `→` (Right Arrow) | 우측 패널 확대 (좌측 축소) | 5% 단위 |
| `Home` | 좌측 패널 최소 크기 (minSize) | 즉시 |
| `End` | 우측 패널 최소 크기 (minSize) | 즉시 |

**ARIA 속성** (PrimeVue 내장):

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

**포커스 스타일**:

| 상태 | 스타일 | 설명 |
|------|--------|------|
| 포커스 | `outline: 2px solid var(--color-primary)` | 키보드 탐색 시 명확화 |
| 오프셋 | `outline-offset: 2px` | 콘텐츠와 구분 |

---

## 4. 다크 테마 스타일 명세

### 4.1 CSS 클래스 중앙화 구조

**main.css 스타일 정의 위치**:

```
assets/css/main.css
  → Section: AppLayout Splitter 스타일 (TSK-08-03)
  → 위치: Node Icon 스타일 섹션 이후
```

### 4.2 CSS 변수 참조

**사용 CSS 변수** (TRD 섹션 5 정의):

| 변수명 | 용도 | 예시 값 (Dark Blue) |
|--------|------|-------------------|
| `--color-border` | Gutter 기본 배경 | `#2d3748` |
| `--color-border-light` | Gutter hover 배경 | `#4a5568` |
| `--color-primary` | Gutter active, Handle | `#3b82f6` |
| `--color-bg-panel` | Panel 배경 (필요 시) | `#1a202c` |

### 4.3 Pass Through API 클래스 정의

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

### 4.4 테마 일관성 검증

**시각적 검증 체크리스트**:

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| Gutter 색상 | Dark Blue 테마 border 색상 | 브라우저 DevTools color picker |
| Gutter hover | border-light 색상 | 수동 호버 테스트 |
| Gutter active | Primary 색상 | 드래그 중 색상 확인 |
| Handle 투명도 | primary/30, /50, /80 | 시각적 대비 검증 |
| 포커스 outline | Primary 색상 2px | Tab 키 탐색 테스트 |

---

## 5. 사용자 상호작용 흐름

### 5.1 드래그 리사이즈 흐름

**시나리오 1: 마우스 드래그**

```
1. 사용자: Gutter 위에 마우스 호버
   → Gutter 배경색: border → border-light
   → Handle 투명도: 30% → 50%
   → 커서: col-resize 표시

2. 사용자: Gutter 좌클릭 + 드래그
   → Gutter 배경색: border-light → primary
   → Handle 투명도: 50% → 80%
   → 커서: col-resize 유지

3. 시스템: 실시간 패널 크기 조정
   → 좌측 패널: 너비 동적 변경 (minSize 제약 적용)
   → 우측 패널: 너비 동적 변경 (minSize 제약 적용)
   → 부드러운 애니메이션 (PrimeVue 내장)

4. 사용자: 마우스 버튼 놓기 (드래그 완료)
   → @resize 이벤트 발생
   → Gutter 배경색: primary → border-light (호버 유지)
   → Handle 투명도: 80% → 50% (호버 유지)

5. 사용자: 마우스 Gutter에서 벗어남
   → Gutter 배경색: border-light → border
   → Handle 투명도: 50% → 30%
```

**시나리오 2: 키보드 탐색**

```
1. 사용자: Tab 키로 Gutter 포커스
   → Gutter outline: primary 2px 표시
   → ARIA aria-valuenow: 현재 좌측 패널 % 표시

2. 사용자: → (Right Arrow) 키 입력
   → 좌측 패널: -5% 축소
   → 우측 패널: +5% 확대
   → @resize 이벤트 발생
   → ARIA aria-valuenow 업데이트

3. 사용자: Home 키 입력
   → 좌측 패널: minSize (33.33%)로 즉시 변경
   → 우측 패널: 66.67%로 확대
   → @resize 이벤트 발생

4. 사용자: Tab 키로 포커스 이동
   → Gutter outline 사라짐
```

### 5.2 제약 조건 동작

**minSize 제약 시나리오**:

```
1. 사용자: 좌측 패널을 최소 크기(400px)까지 드래그
   → 시스템: 좌측 패널 33.33% 고정
   → 시스템: 더 이상 축소 불가 (드래그 저항)
   → 시각 피드백: 커서 변화 없음 (col-resize 유지)

2. 사용자: 우측 패널을 최소 크기(300px)까지 드래그
   → 시스템: 우측 패널 25% 고정
   → 시스템: 더 이상 축소 불가 (드래그 저항)
```

### 5.3 resize 이벤트 페이로드

**이벤트 발생 시점**:
- 마우스 드래그 완료 (mouseup)
- 키보드 화살표 키 입력
- 프로그래밍 방식 크기 변경

**이벤트 페이로드 명세**:

```typescript
interface SplitterResizeEvent {
  originalEvent: Event;        // 원본 DOM 이벤트
  sizes: [number, number];      // [leftSize%, rightSize%]
}

// 예시
{
  originalEvent: MouseEvent { ... },
  sizes: [55, 45]  // 좌측 55%, 우측 45%
}
```

**부모 컴포넌트 처리 예시**:

```typescript
const handleResize = (event: SplitterResizeEvent) => {
  const [leftSize, rightSize] = event.sizes;
  console.log(`Left: ${leftSize}%, Right: ${rightSize}%`);

  // 선택적 처리 (예: localStorage 저장)
  localStorage.setItem('app-layout-split', JSON.stringify(event.sizes));
};
```

---

## 6. 접근성 (WCAG 2.1 AA 준수)

### 6.1 접근성 요구사항

| 요구사항 | WCAG 지침 | 구현 |
|---------|----------|------|
| 키보드 탐색 가능 | 2.1.1 (Keyboard) | Tab 키로 Gutter 포커스, 화살표 키로 리사이즈 |
| 포커스 표시 | 2.4.7 (Focus Visible) | outline: 2px solid primary |
| ARIA 레이블 | 4.1.2 (Name, Role, Value) | role="separator", aria-label="Resize panels" |
| 색상 대비 | 1.4.3 (Contrast) | Gutter 색상 대비 3:1 이상 |
| 터치 타겟 크기 | 2.5.5 (Target Size) | Gutter 4px (최소 44px 권장이나, 드래그 영역 특성상 예외) |

### 6.2 ARIA 속성 명세

**Splitter (Gutter) ARIA 속성**:

```html
<div
  role="separator"
  aria-orientation="horizontal"
  aria-valuemin="33.33"       <!-- 좌측 패널 최소 % -->
  aria-valuemax="75"          <!-- 좌측 패널 최대 % (우측 minSize 고려) -->
  aria-valuenow="60"          <!-- 현재 좌측 패널 % -->
  aria-label="Resize panels"
  tabindex="0"
>
```

**Left Panel ARIA 속성** (기존 유지):

```html
<aside
  role="complementary"
  aria-label="WBS Tree Panel"
>
```

**Right Panel ARIA 속성** (기존 유지):

```html
<section
  role="region"
  aria-label="Task Detail Panel"
>
```

### 6.3 스크린 리더 지원

**포커스 시 스크린 리더 출력 예시**:

```
"Resize panels, separator, horizontal, 60 percent"
```

**키보드 조작 시 출력 예시**:

```
"Resize panels, separator, horizontal, 55 percent"  (→ 키 입력 후)
"Resize panels, separator, horizontal, 33 percent"  (Home 키 입력 후)
```

---

## 7. 성능 및 애니메이션

### 7.1 드래그 리사이즈 성능

**목표 지표**:

| 항목 | 목표 | 측정 도구 |
|------|------|----------|
| 프레임 속도 | 60 FPS | Chrome DevTools Performance |
| 리사이즈 지연 | < 16ms | requestAnimationFrame 기준 |
| 렌더링 지연 | < 100ms | 사용자 체감 기준 |

**최적화 전략**:

| 전략 | 설명 | 구현 |
|------|------|------|
| GPU 가속 | CSS transform 사용 | PrimeVue 내장 최적화 |
| 불필요한 재렌더링 방지 | 슬롯 컨텐츠 격리 | SplitterPanel 래퍼 |
| 이벤트 쓰로틀링 | 드래그 중 이벤트 제한 | PrimeVue 내장 |

### 7.2 전환 효과

**Gutter 색상 전환**:

```css
.app-layout-gutter {
  transition: background-color 200ms ease-in-out;
}
```

**Handle 투명도 전환**:

```css
.app-layout-gutter-handle {
  transition: background-color 200ms ease-in-out;
}
```

**포커스 outline 전환**: 즉시 표시 (transition 없음)

---

## 8. 테스트 시나리오

### 8.1 시각적 회귀 테스트

| 테스트 케이스 | 검증 항목 | 도구 |
|------------|----------|------|
| 초기 렌더링 | 60:40 비율 표시 | Playwright 스크린샷 |
| Gutter hover | border-light 색상 | 수동 시각 검증 |
| Gutter active | primary 색상 | 수동 시각 검증 |
| 드래그 리사이즈 | 부드러운 동작 | 수동 테스트 |
| minSize 제약 | 400px / 300px 고정 | Playwright 측정 |

### 8.2 접근성 테스트

| 테스트 케이스 | 검증 항목 | 도구 |
|------------|----------|------|
| 키보드 탐색 | Tab 키로 포커스 | 수동 테스트 |
| 화살표 키 리사이즈 | ←, → 키 동작 | 수동 테스트 |
| 포커스 표시 | outline 2px 표시 | 수동 시각 검증 |
| ARIA 속성 | role, aria-* 존재 | axe DevTools |
| 스크린 리더 | 음성 출력 확인 | NVDA / JAWS |

### 8.3 성능 테스트

| 테스트 케이스 | 측정 항목 | 도구 |
|------------|----------|------|
| 드래그 리사이즈 | 60 FPS 유지 | Chrome DevTools Performance |
| 리사이즈 지연 | < 100ms | Performance API |
| 메모리 누수 | 드래그 반복 후 메모리 증가 | Chrome DevTools Memory |

---

## 9. 브라우저 호환성

| 브라우저 | 최소 버전 | 테스트 우선순위 |
|---------|----------|---------------|
| Chrome | 최신 버전 | 필수 |
| Firefox | 최신 버전 | 필수 |
| Edge | 최신 버전 | 권장 |
| Safari | 최신 버전 | 권장 |

**호환성 고려사항**:
- PrimeVue Splitter는 모든 최신 브라우저 지원
- CSS 변수 (`var(--color-*)`) 지원 확인 필요
- `col-resize` 커서는 모든 브라우저 표준 지원

---

## 10. 다음 단계

**상세설계 단계 (`020-detail-design.md`)**:
- minSize px → % 변환 로직 구현 상세화
- Pass Through API TypeScript 타입 정의
- resize 이벤트 핸들러 상세 설계
- 단위 테스트 케이스 명세

**구현 단계 (`030-implementation.md`)**:
- AppLayout.vue 컴포넌트 수정
- main.css 스타일 추가
- 회귀 테스트 실행 및 검증

---

## 11. 참고 자료

### 내부 문서
- `010-basic-design.md`: 솔루션 설계 전체 컨텍스트
- TSK-08-02 `011-ui-design.md`: NodeIcon 다크 테마 CSS 변수 참조

### PrimeVue 공식 문서
- Splitter Component: https://primevue.org/splitter/
- Pass Through API: https://primevue.org/passthrough/
- Accessibility: https://primevue.org/guides/accessibility/

### WCAG 2.1 지침
- 2.1.1 Keyboard: https://www.w3.org/WAI/WCAG21/Understanding/keyboard
- 2.4.7 Focus Visible: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible
- 4.1.2 Name, Role, Value: https://www.w3.org/WAI/WCAG21/Understanding/name-role-value

---

<!--
author: Claude Sonnet 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
