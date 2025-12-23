# 매뉴얼 (080-manual.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

---

## 0. 문서 개요

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-03 |
| Task명 | AppLayout PrimeVue Splitter Migration |
| 버전 | 1.0.0 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 개요

### 1.1 변경 요약

AppLayout 컴포넌트를 **커스텀 CSS Grid** 기반에서 **PrimeVue Splitter** 기반으로 마이그레이션했습니다.

**주요 변경 사항**:
- 드래그 리사이즈 기능 추가
- PrimeVue Pass Through API를 통한 CSS 클래스 중앙화
- 키보드 탐색 지원 (PrimeVue 내장)
- 접근성 자동 지원 (ARIA 속성)

### 1.2 영향 범위

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 패널 분할 방식 | CSS flex + :style | PrimeVue Splitter |
| 리사이즈 | 미지원 (정적) | 드래그 리사이즈 지원 |
| 키보드 탐색 | 미지원 | Tab, 화살표 키 지원 |
| 스타일 관리 | 인라인 스타일 | CSS 클래스 (main.css) |

---

## 2. 사용 방법

### 2.1 기본 사용

```vue
<template>
  <AppLayout>
    <template #header>
      <AppHeader />
    </template>
    <template #left>
      <WbsTreePanel />
    </template>
    <template #right>
      <TaskDetailPanel />
    </template>
  </AppLayout>
</template>
```

### 2.2 Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| leftWidth | number | 60 | 좌측 패널 초기 비율 (%) |
| minLeftWidth | number | 400 | 좌측 패널 최소 너비 (px) |
| minRightWidth | number | 300 | 우측 패널 최소 너비 (px) |

**예시**:
```vue
<AppLayout :left-width="55" :min-left-width="450" :min-right-width="350">
  <!-- slots -->
</AppLayout>
```

### 2.3 Events

| Event | 페이로드 | 발생 시점 |
|-------|---------|----------|
| resize | `{ leftWidth: number }` | 드래그 리사이즈 완료 시 |

**예시**:
```vue
<script setup>
const handleResize = (payload) => {
  console.log(`새로운 좌측 패널 비율: ${payload.leftWidth}%`)
  // 선택적: localStorage 저장
  localStorage.setItem('layout-width', payload.leftWidth)
}
</script>

<template>
  <AppLayout @resize="handleResize">
    <!-- slots -->
  </AppLayout>
</template>
```

### 2.4 Slots

| Slot | 설명 | 기본 콘텐츠 |
|------|------|-----------|
| header | 헤더 영역 | "jjiban" 텍스트 |
| left | 좌측 패널 (WBS Tree) | 플레이스홀더 텍스트 |
| right | 우측 패널 (Task Detail) | 플레이스홀더 텍스트 |

---

## 3. 드래그 리사이즈 기능

### 3.1 사용 방법

1. 좌측 패널과 우측 패널 사이의 **Gutter (구분선)** 위에 마우스를 올립니다
2. 커서가 `col-resize` (좌우 화살표)로 변경됩니다
3. 드래그하여 패널 크기를 조절합니다
4. 드래그를 놓으면 새로운 비율이 적용됩니다

### 3.2 제약 조건

- **좌측 패널 최소**: 400px (기본값, Props로 변경 가능)
- **우측 패널 최소**: 300px (기본값, Props로 변경 가능)
- **leftWidth 범위**: 30% ~ 80%

---

## 4. 키보드 접근성

### 4.1 지원 키

| 키 | 동작 |
|----|------|
| Tab | Gutter에 포커스 |
| ← (Left Arrow) | 좌측 패널 확대 (5% 단위) |
| → (Right Arrow) | 우측 패널 확대 (5% 단위) |
| Home | 좌측 패널 최소 크기로 이동 |
| End | 우측 패널 최소 크기로 이동 |

### 4.2 포커스 표시

- Gutter에 포커스 시 **파란색 outline** 표시
- `focus-visible` 스타일 적용

---

## 5. CSS 커스터마이징

### 5.1 사용 가능한 CSS 클래스

| 클래스 | 용도 |
|--------|------|
| `.app-layout-splitter` | Splitter 루트 컨테이너 |
| `.app-layout-gutter` | 드래그 구분선 |
| `.app-layout-gutter-handle` | 구분선 중앙 핸들 표시 |

### 5.2 상태별 스타일

```css
/* 기본 상태 */
.app-layout-gutter {
  background-color: var(--color-border);
}

/* Hover 상태 */
.app-layout-gutter:hover {
  background-color: var(--color-border-light);
}

/* 드래그 중 */
.app-layout-gutter:active {
  background-color: var(--color-primary);
}

/* 키보드 포커스 */
.app-layout-gutter:focus-visible {
  outline: 2px solid var(--color-primary);
}
```

### 5.3 커스터마이징 예시

```css
/* main.css에 추가하여 Gutter 너비 변경 */
.app-layout-gutter {
  width: 6px; /* 기본 4px에서 6px로 변경 */
}

/* Handle 크기 변경 */
.app-layout-gutter-handle {
  height: 32px; /* 기본 24px에서 32px로 변경 */
}
```

---

## 6. 하위 호환성

### 6.1 기존 코드 호환

**변경 불필요**:
- 기존 Props 모두 동일하게 작동
- 기존 Slots 모두 동일하게 작동
- 기존 스타일 영향 없음

### 6.2 Breaking Changes

**없음** - 100% 하위 호환

---

## 7. 트러블슈팅

### 7.1 드래그가 작동하지 않는 경우

**확인 사항**:
1. PrimeVue 버전이 4.x 이상인지 확인
2. `primevue/splitter`와 `primevue/splitterpanel` import 확인
3. CSS 파일 (main.css)이 로드되었는지 확인

### 7.2 minSize가 작동하지 않는 경우

**원인**: minSize는 %로 계산됩니다 (px 아님)
- 400px → 33.33% (1200px 기준)
- 300px → 25% (1200px 기준)

**해결**: minLeftWidth + minRightWidth가 100%를 초과하지 않도록 설정

### 7.3 개발 모드 경고

```
[AppLayout] minSize 합계가 100%를 초과합니다 (58.33%).
minLeftWidth 또는 minRightWidth를 조정하세요.
```

**해결**: Props 값을 조정하여 합계가 100% 이하가 되도록 설정

---

## 8. 참고 자료

### 8.1 관련 문서

| 문서 | 경로 |
|------|------|
| 기본설계 | `010-basic-design.md` |
| UI 설계 | `011-ui-design.md` |
| 상세설계 | `020-detail-design.md` |
| 테스트 명세 | `026-test-specification.md` |
| 구현 문서 | `030-implementation.md` |
| 통합테스트 | `070-integration-test.md` |

### 8.2 외부 참고

- [PrimeVue Splitter 문서](https://primevue.org/splitter/)
- [PrimeVue Pass Through API](https://primevue.org/passthrough/)

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-12-16 | 초기 버전 (PrimeVue Splitter 마이그레이션) |

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
