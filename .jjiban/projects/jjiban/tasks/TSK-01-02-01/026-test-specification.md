# 테스트 명세서: AppLayout 컴포넌트

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-13

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02-01 |
| Task명 | AppLayout 컴포넌트 구현 |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-13 |
| 작성자 | Claude |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | - | N/A (순수 UI 컴포넌트) |
| E2E 테스트 | 레이아웃 구조, 비율, 반응형 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 반응형 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (E2E) | Playwright |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |
| 화면 해상도 | 1920x1080 (기본), 1200x800 (경계) |

---

## 2. 단위 테스트 시나리오

> 이 Task는 순수 레이아웃 UI 컴포넌트로, 비즈니스 로직이 없어 단위 테스트 대상이 아님
>
> E2E 테스트로 레이아웃 동작 검증

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 레이아웃 구조 표시 | 앱 접속 | 1. WBS 페이지 접속 | Header + Content 영역 표시 | FR-001 |
| E2E-002 | 패널 비율 확인 | 앱 접속 | 1. WBS 페이지 접속 | 좌우 패널 60:40 비율 | FR-002, BR-004 |
| E2E-003 | 반응형 동작 확인 | 앱 접속 | 1. 화면 1200px 미만 축소 | 가로 스크롤 발생 | FR-003 |
| E2E-004 | Header/Content 높이 | 앱 접속 | 1. WBS 페이지 접속 | Header 56px, Content 나머지 | BR-001, BR-002 |
| E2E-005 | 패널 최소 너비 | 앱 접속 | 1. 화면 크기 축소 | 최소 너비 유지 | BR-003 |

### 3.2 테스트 케이스 상세

#### E2E-001: 레이아웃 구조 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/layout.spec.ts` |
| **테스트명** | `test('AppLayout이 Header + Content 구조로 표시된다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 레이아웃 컨테이너 | `[data-testid="app-layout"]` |
| - Header 영역 | `[data-testid="app-header"]` |
| - Content 영역 | `[data-testid="app-content"]` |
| - 좌측 패널 | `[data-testid="left-panel"]` |
| - 우측 패널 | `[data-testid="right-panel"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `await expect(page.locator('[data-testid="app-layout"]')).toBeVisible()` |
| 3 | `await expect(page.locator('[data-testid="app-header"]')).toBeVisible()` |
| 4 | `await expect(page.locator('[data-testid="app-content"]')).toBeVisible()` |
| **검증 포인트** | Header, Content, Left/Right Panel 모두 표시됨 |
| **스크린샷** | `e2e-001-layout-structure.png` |
| **관련 요구사항** | FR-001 |

#### E2E-002: 패널 비율 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/layout.spec.ts` |
| **테스트명** | `test('좌우 패널이 60:40 비율로 분할된다')` |
| **사전조건** | 화면 너비 1920px |
| **data-testid 셀렉터** | |
| - 좌측 패널 | `[data-testid="left-panel"]` |
| - 우측 패널 | `[data-testid="right-panel"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `const leftPanel = page.locator('[data-testid="left-panel"]')` |
| 3 | `const rightPanel = page.locator('[data-testid="right-panel"]')` |
| 4 | `const leftWidth = await leftPanel.boundingBox()` |
| 5 | `const rightWidth = await rightPanel.boundingBox()` |
| **검증 포인트** | 좌측 패널 너비가 전체의 약 60%, 우측이 약 40% |
| **스크린샷** | `e2e-002-panel-ratio.png` |
| **관련 요구사항** | FR-002, BR-004 |

#### E2E-003: 반응형 동작 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/layout.spec.ts` |
| **테스트명** | `test('1200px 미만에서 가로 스크롤이 발생한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 레이아웃 컨테이너 | `[data-testid="app-layout"]` |
| **실행 단계** | |
| 1 | `await page.setViewportSize({ width: 1100, height: 800 })` |
| 2 | `await page.goto('/wbs')` |
| 3 | 가로 스크롤 존재 확인 |
| **검증 포인트** | document.documentElement.scrollWidth > window.innerWidth |
| **스크린샷** | `e2e-003-responsive.png` |
| **관련 요구사항** | FR-003 |

#### E2E-004: Header/Content 높이 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/layout.spec.ts` |
| **테스트명** | `test('Header는 56px, Content는 나머지 높이를 차지한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - Header 영역 | `[data-testid="app-header"]` |
| - Content 영역 | `[data-testid="app-content"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `const headerBox = await page.locator('[data-testid="app-header"]').boundingBox()` |
| 3 | `const contentBox = await page.locator('[data-testid="app-content"]').boundingBox()` |
| **검증 포인트** | headerBox.height === 60, contentBox.height === viewportHeight - 60 |
| **스크린샷** | `e2e-004-heights.png` |
| **관련 요구사항** | BR-001, BR-002 |

#### E2E-005: 패널 최소 너비 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/layout.spec.ts` |
| **테스트명** | `test('패널은 최소 너비를 유지한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 좌측 패널 | `[data-testid="left-panel"]` |
| - 우측 패널 | `[data-testid="right-panel"]` |
| **실행 단계** | |
| 1 | `await page.setViewportSize({ width: 1200, height: 800 })` |
| 2 | `await page.goto('/wbs')` |
| 3 | 패널 너비 측정 |
| **검증 포인트** | leftPanel.width >= 400, rightPanel.width >= 300 |
| **스크린샷** | `e2e-005-min-width.png` |
| **관련 요구사항** | BR-003 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 레이아웃 구조 | 앱 접속 | 1. WBS 페이지 접속 | Header + Content 표시 | High | FR-001 |
| TC-002 | 패널 분할 | 앱 접속 | 1. WBS 페이지에서 패널 확인 | 좌우 분할 표시 | High | FR-002 |
| TC-003 | 반응형 확인 | 앱 접속 | 1. 브라우저 크기 1200px 미만 축소 | 가로 스크롤 발생 | Medium | FR-003 |
| TC-004 | 테마 색상 확인 | 앱 접속 | 1. 각 영역 색상 확인 | Dark Blue 테마 적용 | Medium | - |
| TC-005 | 접근성 확인 | 앱 접속 | 1. 키보드 탐색 | 시맨틱 구조 확인 | Low | - |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 레이아웃 구조 확인

**테스트 목적**: AppLayout이 Header + Content 구조로 올바르게 표시되는지 확인

**테스트 단계**:
1. 브라우저에서 `http://localhost:3000/wbs` 접속
2. 상단에 Header 영역이 표시되는지 확인
3. Header 아래에 Content 영역이 표시되는지 확인
4. Content 영역이 좌우로 분할되어 있는지 확인

**예상 결과**:
- Header 영역이 상단에 고정 (높이 56px)
- Content 영역이 Header 아래 전체 차지
- 좌측 패널과 우측 패널이 분할되어 표시

**검증 기준**:
- [ ] Header 영역 표시됨
- [ ] Content 영역 표시됨
- [ ] 좌측 패널 표시됨
- [ ] 우측 패널 표시됨

#### TC-004: 테마 색상 확인

**테스트 목적**: Dark Blue 테마가 올바르게 적용되었는지 확인

**테스트 단계**:
1. 브라우저에서 `http://localhost:3000/wbs` 접속
2. Header 영역 배경색 확인 (#16213e)
3. 좌측 패널 배경색 확인 (#0f0f23)
4. 우측 패널 배경색 확인 (#1a1a2e)

**예상 결과**:
- 각 영역에 Dark Blue 테마 색상이 적용됨

**검증 기준**:
- [ ] Header 배경색이 어두운 네이비 (#16213e)
- [ ] 좌측 패널 배경색이 더 어두운 색 (#0f0f23)
- [ ] 우측 패널 배경색이 기본 배경색 (#1a1a2e)

---

## 5. 테스트 데이터 (Fixture)

> 이 Task는 순수 레이아웃 컴포넌트로 별도의 테스트 데이터가 필요하지 않음

### 5.1 E2E 테스트용 설정

| 설정 ID | 용도 | 값 |
|---------|------|-----|
| VIEWPORT-DEFAULT | 기본 화면 크기 | 1920x1080 |
| VIEWPORT-MIN | 최소 지원 화면 | 1200x800 |
| VIEWPORT-BELOW-MIN | 최소 이하 화면 | 1100x800 |

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 AppLayout 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `app-layout` | 레이아웃 최상위 컨테이너 | 레이아웃 존재 확인 |
| `app-header` | Header 영역 | Header 높이/스타일 확인 |
| `app-content` | Content 영역 | Content 높이 확인 |
| `left-panel` | 좌측 패널 | 패널 너비/비율 확인 |
| `right-panel` | 우측 패널 | 패널 너비/비율 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 기능 요구사항 (FR) | 100% (3/3) |
| 비즈니스 규칙 (BR) | 100% (4/4) |
| 레이아웃 시나리오 | 100% 커버 |

### 7.2 매뉴얼 테스트 커버리지

| 구분 | 목표 |
|------|------|
| UI/UX 검증 | 5개 케이스 |
| 반응형 검증 | 3개 해상도 |
| 테마 검증 | 4개 영역 색상 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
