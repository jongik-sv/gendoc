# 사용자 매뉴얼: AppLayout 컴포넌트

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-13

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02-01 |
| Task명 | AppLayout 컴포넌트 구현 |
| Category | development |
| 작성일 | 2025-12-13 |
| 버전 | 1.0 |

---

## 1. 개요

### 1.1 기능 소개

AppLayout 컴포넌트는 jjiban 애플리케이션의 전체 레이아웃 구조를 담당합니다. Header와 Content 영역으로 구성되며, Content 영역은 좌우 패널로 분할되어 WBS 트리와 Task 상세 정보를 동시에 표시합니다.

### 1.2 대상 사용자

- jjiban 애플리케이션 사용자
- 프로젝트 관리자
- WBS 기반 작업 관리자

### 1.3 핵심 가치

- **일관된 레이아웃**: 모든 페이지에서 동일한 구조 제공
- **효율적인 화면 분할**: 좌측 60% (WBS 트리) + 우측 40% (상세 패널)
- **반응형 지원**: 최소 1200px 너비 보장

---

## 2. 시작하기

### 2.1 사전 요구사항

- Node.js 20.x 이상
- 모던 웹 브라우저 (Chrome, Edge, Firefox)
- 최소 화면 해상도: 1200px 이상

### 2.2 접근 방법

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
http://localhost:3333/wbs
```

---

## 3. 화면 구조

### 3.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│                    Header (56px)                        │
│  [jjiban 로고]    [네비게이션 메뉴]                       │
├─────────────────────────────────────────────────────────┤
│                   Content Area                          │
│  ┌────────────────────────┬──────────────────────────┐  │
│  │                        │                          │  │
│  │    Left Panel (60%)    │   Right Panel (40%)      │  │
│  │    WBS Tree 영역        │   Task Detail 영역       │  │
│  │                        │                          │  │
│  │    min-width: 400px    │   min-width: 300px       │  │
│  │                        │                          │  │
│  └────────────────────────┴──────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                     min-width: 1200px
```

### 3.2 영역별 설명

| 영역 | 높이/너비 | 역할 |
|------|----------|------|
| Header | 높이 56px | 로고, 네비게이션 메뉴 표시 |
| Content | 높이 `calc(100vh - 56px)` | 좌우 패널 컨테이너 |
| Left Panel | 너비 60%, 최소 400px | WBS 트리 표시 영역 |
| Right Panel | 너비 40%, 최소 300px | Task 상세 정보 영역 |

---

## 4. 사용 방법

### 4.1 WBS 페이지에서 사용

WBS 페이지(`/wbs`)에서 AppLayout이 자동으로 적용됩니다.

```vue
<!-- pages/wbs.vue -->
<template>
  <AppLayout>
    <template #header>
      <!-- 커스텀 Header 컨텐츠 -->
    </template>
    <template #left>
      <!-- WBS Tree 컴포넌트 -->
    </template>
    <template #right>
      <!-- Task Detail 컴포넌트 -->
    </template>
  </AppLayout>
</template>
```

### 4.2 Slot 사용법

AppLayout은 3개의 Slot을 제공합니다:

| Slot 이름 | 용도 | 기본 컨텐츠 |
|-----------|------|------------|
| `#header` | Header 영역 커스터마이징 | "Header Slot" 텍스트 |
| `#left` | 좌측 패널 컨텐츠 | "Left Panel Slot" 텍스트 |
| `#right` | 우측 패널 컨텐츠 | "Right Panel Slot" 텍스트 |

### 4.3 다른 페이지에서 재사용

```vue
<template>
  <AppLayout>
    <template #header>
      <MyCustomHeader />
    </template>
    <template #left>
      <NavigationPanel />
    </template>
    <template #right>
      <ContentPanel />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '~/components/layout/AppLayout.vue'
</script>
```

---

## 5. 스타일 가이드

### 5.1 컬러 팔레트

AppLayout은 Dark Blue 테마를 사용합니다:

| 용도 | CSS 변수 | 컬러 코드 |
|------|----------|----------|
| 배경 (전체) | `--bg-base` | #0f172a |
| 배경 (Header) | `--bg-header` | #1e293b |
| 배경 (패널) | `--bg-surface` | #1e293b |
| 테두리 | `--border-color` | #334155 |
| 텍스트 (기본) | `--text-primary` | #f1f5f9 |
| 텍스트 (보조) | `--text-secondary` | #94a3b8 |

### 5.2 반응형 동작

| 화면 너비 | 동작 |
|----------|------|
| 1200px 이상 | 정상 레이아웃 |
| 1200px 미만 | 가로 스크롤 발생 (레이아웃 유지) |

---

## 6. 접근성

### 6.1 시맨틱 HTML

AppLayout은 웹 접근성을 위해 시맨틱 태그를 사용합니다:

| HTML 태그 | ARIA role | 영역 |
|-----------|-----------|------|
| `<header>` | banner | Header 영역 |
| `<main>` | main | Content 영역 |
| `<aside>` | complementary | Right Panel |
| `<section>` | region | Left Panel |

### 6.2 키보드 탐색

- Tab 키로 포커스 이동
- 각 영역은 포커스 가능한 영역으로 구분

---

## 7. 자주 묻는 질문 (FAQ)

### Q1: 패널 비율을 변경할 수 있나요?

**A**: 현재 버전에서는 60:40 고정 비율입니다. 향후 드래그로 조절 가능한 분할바(Splitter) 기능이 추가될 예정입니다.

### Q2: 모바일에서도 사용할 수 있나요?

**A**: jjiban은 데스크톱 환경(최소 1200px)을 기준으로 설계되었습니다. 모바일에서는 가로 스크롤이 발생합니다.

### Q3: Header 높이를 변경할 수 있나요?

**A**: Header 높이는 56px로 고정되어 있습니다. 일관된 UI 경험을 위해 변경을 권장하지 않습니다.

---

## 8. 문제 해결

### 8.1 일반적인 문제

#### 문제: 레이아웃이 깨져 보임

**원인**: 브라우저 캐시 또는 CSS 로딩 문제
**해결 방법**:
1. 브라우저 캐시 삭제 (Ctrl+Shift+R)
2. 개발 서버 재시작

#### 문제: Slot 컨텐츠가 표시되지 않음

**원인**: Slot 이름 오타 또는 잘못된 템플릿 구조
**해결 방법**: Slot 이름 확인 (`#header`, `#left`, `#right`)

#### 문제: 1200px 미만에서 스크롤이 없음

**원인**: CSS overflow 설정 문제
**해결 방법**: `min-w-[1200px]` 클래스가 적용되었는지 확인

---

## 9. 기술 사양

### 9.1 컴포넌트 위치

```
app/components/layout/AppLayout.vue
```

### 9.2 의존성

- Vue 3 Composition API
- TailwindCSS
- PrimeVue 4.x

### 9.3 테스트 현황

| 유형 | 통과율 | 테스트 파일 |
|------|--------|-------------|
| E2E | 100% (6/6) | `tests/e2e/layout.spec.ts` |
| 통합 | 100% | `070-integration-test.md` 참조 |

---

## 10. 관련 문서

| 문서 | 경로 |
|------|------|
| 기본설계 | `010-basic-design.md` |
| 화면설계 | `011-ui-design.md` |
| 상세설계 | `020-detail-design.md` |
| 추적성 매트릭스 | `025-traceability-matrix.md` |
| 테스트 명세 | `026-test-specification.md` |
| 구현 문서 | `030-implementation.md` |
| 통합테스트 | `070-integration-test.md` |

---

<!--
jjiban 프로젝트 - 사용자 매뉴얼
Task: TSK-01-02-01
Generated by /wf:done command
Generated at: 2025-12-13
-->
