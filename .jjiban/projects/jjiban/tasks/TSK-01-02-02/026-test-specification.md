# 테스트 명세서: AppHeader 컴포넌트

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
| Task ID | TSK-01-02-02 |
| Task명 | AppHeader 컴포넌트 구현 |
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
| E2E 테스트 | 로고, 메뉴, 프로젝트명 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 테마 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (E2E) | Playwright |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |
| 화면 해상도 | 1920x1080 (기본) |

---

## 2. 단위 테스트 시나리오

> 이 Task는 순수 UI 컴포넌트로, 비즈니스 로직이 없어 단위 테스트 대상이 아님
>
> E2E 테스트로 컴포넌트 동작 검증

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 로고 클릭 시 WBS 이동 | 앱 접속 | 1. 로고 클릭 | /wbs 페이지로 이동 | FR-001, BR-004 |
| E2E-002 | WBS 메뉴 클릭 | 앱 접속 | 1. WBS 메뉴 클릭 | /wbs 페이지로 이동 | FR-002, BR-001 |
| E2E-003 | 비활성 메뉴 클릭 | 앱 접속 | 1. 대시보드 메뉴 클릭 | Toast "준비 중" 표시 | FR-002, BR-002 |
| E2E-004 | 프로젝트명 표시 | 프로젝트 로드 | 1. 헤더 확인 | 프로젝트명 표시됨 | FR-003 |
| E2E-005 | 현재 페이지 메뉴 강조 | WBS 페이지 | 1. 헤더 메뉴 확인 | WBS 메뉴 강조됨 | FR-002, BR-003 |
| E2E-006 | 프로젝트 미선택 시 | 프로젝트 미선택 | 1. 헤더 확인 | 기본 안내 텍스트 | FR-003 |

### 3.2 테스트 케이스 상세

#### E2E-001: 로고 클릭 시 WBS 이동

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('로고 클릭 시 /wbs 페이지로 이동한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 로고 | `[data-testid="app-logo"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `await page.click('[data-testid="app-logo"]')` |
| 3 | `await expect(page).toHaveURL('/wbs')` |
| **검증 포인트** | URL이 /wbs로 이동 |
| **스크린샷** | `e2e-001-logo-click.png` |
| **관련 요구사항** | FR-001, BR-004 |

#### E2E-002: WBS 메뉴 클릭

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('WBS 메뉴 클릭 시 /wbs 페이지로 이동한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - WBS 메뉴 | `[data-testid="nav-menu-wbs"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `await page.click('[data-testid="nav-menu-wbs"]')` |
| 3 | `await expect(page).toHaveURL('/wbs')` |
| **검증 포인트** | WBS 메뉴 클릭 가능, URL이 /wbs |
| **스크린샷** | `e2e-002-wbs-menu.png` |
| **관련 요구사항** | FR-002, BR-001 |

#### E2E-003: 비활성 메뉴 클릭

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('비활성 메뉴 클릭 시 Toast가 표시된다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 대시보드 메뉴 | `[data-testid="nav-menu-dashboard"]` |
| - Toast 컨테이너 | `.p-toast-message` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `await page.click('[data-testid="nav-menu-dashboard"]')` |
| 3 | `await expect(page.locator('.p-toast-message')).toBeVisible()` |
| 4 | `await expect(page.locator('.p-toast-message')).toContainText('준비 중')` |
| **검증 포인트** | Toast 알림에 "준비 중" 메시지 표시 |
| **스크린샷** | `e2e-003-disabled-menu-toast.png` |
| **관련 요구사항** | FR-002, BR-002 |

#### E2E-004: 프로젝트명 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('프로젝트명이 헤더에 표시된다')` |
| **사전조건** | 프로젝트 로드됨 |
| **data-testid 셀렉터** | |
| - 프로젝트명 | `[data-testid="project-name"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | `await expect(page.locator('[data-testid="project-name"]')).toBeVisible()` |
| **검증 포인트** | 프로젝트명 영역이 표시됨 |
| **스크린샷** | `e2e-004-project-name.png` |
| **관련 요구사항** | FR-003 |

#### E2E-005: 현재 페이지 메뉴 강조

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('현재 페이지에 해당하는 메뉴가 강조 표시된다')` |
| **사전조건** | WBS 페이지 |
| **data-testid 셀렉터** | |
| - WBS 메뉴 | `[data-testid="nav-menu-wbs"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs')` |
| 2 | WBS 메뉴의 스타일 클래스 확인 |
| **검증 포인트** | WBS 메뉴에 활성 스타일 (text-primary) 적용 |
| **스크린샷** | `e2e-005-active-menu.png` |
| **관련 요구사항** | FR-002, BR-003 |

#### E2E-006: 프로젝트 미선택 시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/header.spec.ts` |
| **테스트명** | `test('프로젝트 미선택 시 안내 텍스트가 표시된다')` |
| **사전조건** | 프로젝트 미선택 상태 |
| **data-testid 셀렉터** | |
| - 프로젝트명 | `[data-testid="project-name"]` |
| **실행 단계** | |
| 1 | 프로젝트 미선택 상태로 접속 |
| 2 | `await expect(page.locator('[data-testid="project-name"]')).toContainText('프로젝트를 선택하세요')` |
| **검증 포인트** | 기본 안내 텍스트 표시 |
| **스크린샷** | `e2e-006-no-project.png` |
| **관련 요구사항** | FR-003 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 로고 표시 및 클릭 | 앱 접속 | 1. 로고 확인 2. 로고 클릭 | 로고 표시, /wbs 이동 | High | FR-001 |
| TC-002 | 네비게이션 메뉴 | 앱 접속 | 1. 메뉴 4개 확인 2. 각 메뉴 클릭 | WBS만 활성, 나머지 Toast | High | FR-002 |
| TC-003 | 프로젝트명 표시 | 프로젝트 로드 | 1. 우측 영역 확인 | 프로젝트명 표시 | High | FR-003 |
| TC-004 | 테마 색상 확인 | 앱 접속 | 1. 헤더 색상 확인 | Dark Blue 테마 | Medium | - |
| TC-005 | 키보드 접근성 | 앱 접속 | 1. Tab으로 메뉴 탐색 | 모든 메뉴 접근 가능 | Low | - |
| TC-006 | 프로젝트명 말줄임 | 긴 프로젝트명 | 1. 헤더 확인 | 말줄임 처리됨 | Low | FR-003 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 로고 표시 및 클릭

**테스트 목적**: jjiban 로고가 표시되고 클릭 시 WBS 페이지로 이동하는지 확인

**테스트 단계**:
1. 브라우저에서 `http://localhost:3000/wbs` 접속
2. 헤더 좌측에 "JJIBAN" 로고가 표시되는지 확인
3. 로고를 클릭
4. URL이 /wbs로 유지되는지 확인

**예상 결과**:
- 로고가 Primary 색상으로 표시됨
- 클릭 시 /wbs 페이지로 이동 (또는 유지)

**검증 기준**:
- [ ] 로고가 표시됨
- [ ] 로고가 Primary 색상 (#3b82f6)
- [ ] 클릭 시 /wbs로 이동

#### TC-002: 네비게이션 메뉴

**테스트 목적**: 4개 메뉴가 표시되고 WBS만 활성화되어 있는지 확인

**테스트 단계**:
1. 헤더에 대시보드, 칸반, WBS, Gantt 메뉴가 표시되는지 확인
2. WBS 메뉴가 활성 상태(Primary 색상)인지 확인
3. 대시보드 메뉴 클릭 → Toast 알림 확인
4. 칸반 메뉴 클릭 → Toast 알림 확인
5. Gantt 메뉴 클릭 → Toast 알림 확인
6. WBS 메뉴 클릭 → 페이지 이동 확인

**예상 결과**:
- 4개 메뉴 모두 표시
- WBS만 활성화 (클릭 가능)
- 비활성 메뉴 클릭 시 "준비 중입니다" Toast

**검증 기준**:
- [ ] 4개 메뉴 표시됨
- [ ] WBS 메뉴 활성 상태
- [ ] 비활성 메뉴 opacity-50 적용
- [ ] 비활성 메뉴 클릭 시 Toast 표시

#### TC-004: 테마 색상 확인

**테스트 목적**: Dark Blue 테마가 헤더에 올바르게 적용되었는지 확인

**테스트 단계**:
1. 헤더 배경색 확인 (#16213e)
2. 로고 색상 확인 (#3b82f6 Primary)
3. 활성 메뉴 색상 확인 (#3b82f6 Primary)
4. 비활성 메뉴 색상 확인 (muted, opacity-50)
5. 프로젝트명 색상 확인 (text-secondary)

**예상 결과**:
- 각 요소에 Dark Blue 테마 색상이 적용됨

**검증 기준**:
- [ ] 헤더 배경색이 어두운 네이비 (#16213e)
- [ ] 로고가 Primary 색상
- [ ] 활성 메뉴가 Primary 색상
- [ ] 비활성 메뉴가 muted + opacity-50

---

## 5. 테스트 데이터 (Fixture)

### 5.1 E2E 테스트용 설정

| 설정 ID | 용도 | 값 |
|---------|------|-----|
| PROJECT-LOADED | 프로젝트 로드 상태 | `{ name: 'jjiban', id: 'jjiban' }` |
| PROJECT-NONE | 프로젝트 미선택 | `null` |
| PROJECT-LONG-NAME | 긴 프로젝트명 | `{ name: 'Very Long Project Name That Should Be Truncated' }` |

### 5.2 메뉴 아이템 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MENU-DASHBOARD | 대시보드 메뉴 | `{ id: 'dashboard', label: '대시보드', enabled: false }` |
| MENU-KANBAN | 칸반 메뉴 | `{ id: 'kanban', label: '칸반', enabled: false }` |
| MENU-WBS | WBS 메뉴 | `{ id: 'wbs', label: 'WBS', enabled: true }` |
| MENU-GANTT | Gantt 메뉴 | `{ id: 'gantt', label: 'Gantt', enabled: false }` |

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 AppHeader 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `app-header` | 헤더 컨테이너 | 헤더 존재 확인 |
| `app-logo` | 로고 영역 | 로고 클릭 테스트 |
| `nav-menu` | 네비게이션 메뉴 컨테이너 | 메뉴 영역 확인 |
| `nav-menu-dashboard` | 대시보드 메뉴 | 비활성 메뉴 테스트 |
| `nav-menu-kanban` | 칸반 메뉴 | 비활성 메뉴 테스트 |
| `nav-menu-wbs` | WBS 메뉴 | 활성 메뉴 테스트 |
| `nav-menu-gantt` | Gantt 메뉴 | 비활성 메뉴 테스트 |
| `project-name` | 프로젝트명 영역 | 프로젝트명 표시 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 기능 요구사항 (FR) | 100% (3/3) |
| 비즈니스 규칙 (BR) | 100% (4/4) |
| 헤더 시나리오 | 100% 커버 |

### 7.2 매뉴얼 테스트 커버리지

| 구분 | 목표 |
|------|------|
| UI/UX 검증 | 6개 케이스 |
| 테마 검증 | 5개 요소 색상 |
| 접근성 검증 | 키보드 탐색 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
