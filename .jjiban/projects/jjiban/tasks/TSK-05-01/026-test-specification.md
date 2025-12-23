# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-01 |
| Task명 | Detail Panel Structure |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | - (이 Task는 주로 UI 컴포넌트로 E2E 테스트 중심) | - |
| E2E 테스트 | Task 선택, 기본 정보 표시, 인라인 편집, 상태 표시, 에러 처리 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 반응형, 색상, 로딩 상태 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest (해당 없음) |
| 테스트 프레임워크 (E2E) | Playwright |
| 테스트 데이터베이스 | .jjiban/jjiban (테스트용 wbs.md) |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |
| 테스트 프로젝트 ID | `jjiban` |

---

## 2. 단위 테스트 시나리오

> 이 Task는 주로 Vue 컴포넌트 및 UI 인터랙션이므로 E2E 테스트 중심으로 진행

**단위 테스트 대상 없음** - TaskDetailPanel, TaskBasicInfo, TaskProgress는 모두 E2E 테스트로 검증

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | Task 미선택 시 빈 상태 표시 | - | 1. WBS 페이지 접속 | 빈 상태 메시지 표시 | FR-001, FR-002 |
| E2E-002 | 제목 인라인 편집 성공 | Task 선택됨 | 1. 제목 클릭 2. 수정 3. Enter | 제목 변경됨, API 호출 | FR-003 |
| E2E-003 | 우선순위 Dropdown 변경 | Task 선택됨 | 1. 우선순위 클릭 2. 새 값 선택 | 우선순위 변경됨 | FR-004 |
| E2E-004 | 담당자 Dropdown 변경 | Task 선택됨 | 1. 담당자 클릭 2. 팀원 선택 | 담당자 변경됨 | FR-005 |
| E2E-005 | 카테고리 색상 확인 | Task 선택됨 (development) | 1. 카테고리 Tag 확인 | 블루 색상 적용 | FR-006 |
| E2E-006 | 우선순위 색상 확인 | Task 선택됨 (high) | 1. 우선순위 확인 | 앰버 색상 적용 | FR-007 |
| E2E-007 | 낙관적 업데이트 확인 | Task 선택됨 | 1. 제목 수정 2. 즉시 확인 | UI 즉시 반영 | FR-008 |
| E2E-008 | 스크롤 영역 확인 | Task 선택됨 | 1. 패널 높이 초과 시 | 스크롤 가능 | FR-009 |
| E2E-009 | 로딩 상태 확인 | Task 선택 중 | 1. Task 선택 | Skeleton 표시 | FR-010 |
| E2E-010 | 제목 길이 검증 (201자) | Task 선택됨 | 1. 201자 입력 2. 저장 | 에러 메시지 | BR-001 |
| E2E-011 | 우선순위 옵션 개수 확인 | Task 선택됨 | 1. Dropdown 열기 | 4개 옵션만 | BR-002 |
| E2E-012 | 잘못된 담당자 ID | Task 선택됨 | 1. 존재하지 않는 팀원 ID | 에러 메시지 | BR-003 |
| E2E-013 | API 실패 시 롤백 | Task 선택됨 | 1. API 실패 강제 2. 수정 | 이전 값 복원 | BR-004 |
| E2E-014 | 카테고리 편집 불가 | Task 선택됨 | 1. 카테고리 Tag 확인 | 편집 UI 없음 | BR-005 |

### 3.2 테스트 케이스 상세

#### E2E-001: Task 미선택 시 빈 상태 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('Task가 선택되지 않으면 빈 상태 메시지를 표시한다')` |
| **사전조건** | WBS 페이지 접속, Task 미선택 |
| **data-testid 셀렉터** | |
| - Detail Panel 컨테이너 | `[data-testid="task-detail-panel"]` |
| - 빈 상태 메시지 | `[data-testid="empty-state-message"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs?project=jjiban')` |
| 2 | `const emptyMessage = page.locator('[data-testid="empty-state-message"]')` |
| 3 | `await expect(emptyMessage).toBeVisible()` |
| **예상 결과** | "왼쪽에서 Task를 선택하세요" 메시지 표시 |
| **스크린샷** | `e2e-001-empty-state.png` |
| **관련 요구사항** | FR-001, FR-002 |

#### E2E-002: 제목 인라인 편집 성공

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('사용자가 Task 제목을 인라인 편집할 수 있다')` |
| **사전조건** | Task TSK-05-01 선택됨 |
| **data-testid 셀렉터** | |
| - 제목 표시 영역 | `[data-testid="task-title-display"]` |
| - 제목 편집 InputText | `[data-testid="task-title-input"]` |
| **실행 단계** | |
| 1 | WBS 트리에서 TSK-05-01 클릭 |
| 2 | `await page.click('[data-testid="task-title-display"]')` (편집 모드) |
| 3 | `await page.fill('[data-testid="task-title-input"]', '수정된 제목')` |
| 4 | `await page.keyboard.press('Enter')` |
| **API 확인** | `PUT /api/tasks/TSK-05-01` → 200 |
| **검증 포인트** | |
| - UI 즉시 반영 | `await expect(page.locator('[data-testid="task-title-display"]')).toContainText('수정된 제목')` |
| - wbs.md 업데이트 | API 응답 검증 |
| **스크린샷** | `e2e-002-edit-before.png`, `e2e-002-edit-after.png` |
| **관련 요구사항** | FR-003 |

#### E2E-003: 우선순위 Dropdown 변경

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('사용자가 우선순위를 Dropdown으로 변경할 수 있다')` |
| **사전조건** | Task 선택됨 (현재 우선순위: high) |
| **data-testid 셀렉터** | |
| - 우선순위 Dropdown | `[data-testid="task-priority-dropdown"]` |
| - Dropdown 옵션 (critical) | `[data-testid="priority-option-critical"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-priority-dropdown"]')` |
| 2 | `await page.click('[data-testid="priority-option-critical"]')` |
| **API 확인** | `PUT /api/tasks/:id` → 200 |
| **검증 포인트** | |
| - 우선순위 변경 확인 | `await expect(page.locator('[data-testid="task-priority-dropdown"]')).toContainText('critical')` |
| - 색상 변경 확인 | 레드 색상 적용 (#ef4444) |
| **스크린샷** | `e2e-003-priority-change.png` |
| **관련 요구사항** | FR-004 |

#### E2E-004: 담당자 Dropdown 변경

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('사용자가 담당자를 Dropdown으로 변경할 수 있다')` |
| **사전조건** | Task 선택됨, 팀원 목록 존재 |
| **data-testid 셀렉터** | |
| - 담당자 Dropdown | `[data-testid="task-assignee-dropdown"]` |
| - Dropdown 옵션 (팀원) | `[data-testid="assignee-option-{팀원ID}"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-assignee-dropdown"]')` |
| 2 | `await page.click('[data-testid="assignee-option-member1"]')` |
| **API 확인** | `PUT /api/tasks/:id` → 200 |
| **검증 포인트** | |
| - 담당자 변경 확인 | `await expect(page.locator('[data-testid="task-assignee-dropdown"]')).toContainText('팀원1')` |
| - Avatar 표시 확인 | Avatar 이미지 렌더링 |
| **스크린샷** | `e2e-004-assignee-change.png` |
| **관련 요구사항** | FR-005 |

#### E2E-005: 카테고리 색상 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('카테고리별 색상이 올바르게 적용된다')` |
| **사전조건** | 3개 카테고리 Task 각각 선택 |
| **data-testid 셀렉터** | |
| - 카테고리 Tag | `[data-testid="task-category-tag"]` |
| **실행 단계** | |
| 1 | development Task 선택 → 블루(#3b82f6) 확인 |
| 2 | defect Task 선택 → 레드(#ef4444) 확인 |
| 3 | infrastructure Task 선택 → 그린(#22c55e) 확인 |
| **검증 포인트** | |
| - 색상 검증 | `await expect(page.locator('[data-testid="task-category-tag"]')).toHaveCSS('background-color', 'rgb(59, 130, 246)')` |
| **스크린샷** | `e2e-005-category-colors.png` |
| **관련 요구사항** | FR-006 |

#### E2E-006: 우선순위 색상 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('우선순위별 색상이 올바르게 적용된다')` |
| **사전조건** | 4개 우선순위 Task 각각 선택 |
| **data-testid 셀렉터** | |
| - 우선순위 Dropdown | `[data-testid="task-priority-dropdown"]` |
| **실행 단계** | |
| 1 | critical → 레드(#ef4444) |
| 2 | high → 앰버(#f59e0b) |
| 3 | medium → 블루(#3b82f6) |
| 4 | low → 그레이(#888888) |
| **검증 포인트** | |
| - 색상 검증 | Dropdown 배경/텍스트 색상 확인 |
| **스크린샷** | `e2e-006-priority-colors.png` |
| **관련 요구사항** | FR-007 |

#### E2E-007: 낙관적 업데이트 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('인라인 편집 시 낙관적 업데이트가 즉시 반영된다')` |
| **사전조건** | Task 선택됨 |
| **data-testid 셀렉터** | |
| - 제목 표시 | `[data-testid="task-title-display"]` |
| **실행 단계** | |
| 1 | 제목 수정 시작 |
| 2 | API 응답 전 UI 변경 확인 (타이밍 체크) |
| 3 | API 응답 후 최종 상태 확인 |
| **API 확인** | `PUT /api/tasks/:id` → 200 (지연 시뮬레이션) |
| **검증 포인트** | |
| - 즉시 반영 확인 | API 응답 전 UI 업데이트 확인 |
| - 동기화 확인 | API 응답 후 refreshTaskDetail() 호출 확인 |
| **스크린샷** | `e2e-007-optimistic-update.png` |
| **관련 요구사항** | FR-008 |

#### E2E-008: 스크롤 영역 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('Detail Panel이 스크롤 가능하다')` |
| **사전조건** | Task 선택됨 (콘텐츠 많음) |
| **data-testid 셀렉터** | |
| - Detail Panel 컨테이너 | `[data-testid="task-detail-panel"]` |
| **실행 단계** | |
| 1 | 패널 높이 측정 |
| 2 | 스크롤 가능 여부 확인 (scrollHeight > clientHeight) |
| 3 | 스크롤 동작 확인 |
| **검증 포인트** | |
| - 스크롤 영역 존재 | `overflow-y: auto` 스타일 적용 확인 |
| - 스크롤 동작 | 하단 콘텐츠까지 스크롤 가능 |
| **스크린샷** | `e2e-008-scroll.png` |
| **관련 요구사항** | FR-009 |

#### E2E-009: 로딩 상태 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('Task 로드 중 Skeleton을 표시한다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - Skeleton | `[data-testid="task-detail-skeleton"]` |
| **실행 단계** | |
| 1 | API 지연 시뮬레이션 (1초) |
| 2 | Task 선택 |
| 3 | Skeleton 표시 확인 |
| 4 | 로딩 완료 후 실제 콘텐츠 확인 |
| **API 확인** | `GET /api/tasks/:id` → 200 (지연) |
| **검증 포인트** | |
| - Skeleton 표시 | `await expect(page.locator('[data-testid="task-detail-skeleton"]')).toBeVisible()` |
| - 콘텐츠 전환 | Skeleton 사라지고 실제 콘텐츠 표시 |
| **스크린샷** | `e2e-009-loading.png` |
| **관련 요구사항** | FR-010 |

#### E2E-010: 제목 길이 검증 (201자)

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('제목이 200자를 초과하면 에러 메시지를 표시한다')` |
| **사전조건** | Task 선택됨 |
| **data-testid 셀렉터** | |
| - 제목 입력 | `[data-testid="task-title-input"]` |
| - 에러 메시지 | `[data-testid="error-toast"]` |
| **실행 단계** | |
| 1 | 제목 편집 모드 시작 |
| 2 | 201자 입력 |
| 3 | Enter 또는 Blur |
| **API 확인** | `PUT /api/tasks/:id` → 400 VALIDATION_ERROR |
| **검증 포인트** | |
| - 에러 메시지 표시 | `await expect(page.locator('[data-testid="error-toast"]')).toContainText('1-200자')` |
| - 이전 값 복원 | 롤백 확인 |
| **스크린샷** | `e2e-010-title-validation.png` |
| **관련 요구사항** | BR-001 |

#### E2E-011: 우선순위 옵션 개수 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('우선순위 Dropdown은 4개 옵션만 표시한다')` |
| **사전조건** | Task 선택됨 |
| **data-testid 셀렉터** | |
| - 우선순위 Dropdown | `[data-testid="task-priority-dropdown"]` |
| - Dropdown 옵션 | `[data-testid^="priority-option-"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-priority-dropdown"]')` |
| 2 | 옵션 개수 카운트 |
| **검증 포인트** | |
| - 옵션 개수 | `await expect(page.locator('[data-testid^="priority-option-"]')).toHaveCount(4)` |
| - 옵션 값 | critical, high, medium, low 확인 |
| **스크린샷** | `e2e-011-priority-options.png` |
| **관련 요구사항** | BR-002 |

#### E2E-012: 잘못된 담당자 ID

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('존재하지 않는 담당자 ID 입력 시 에러를 표시한다')` |
| **사전조건** | Task 선택됨, API Mock으로 잘못된 ID 전송 |
| **data-testid 셀렉터** | |
| - 담당자 Dropdown | `[data-testid="task-assignee-dropdown"]` |
| - 에러 메시지 | `[data-testid="error-toast"]` |
| **실행 단계** | |
| 1 | API Mock 설정 (잘못된 ID) |
| 2 | 담당자 변경 시도 |
| **API 확인** | `PUT /api/tasks/:id` → 404 ASSIGNEE_NOT_FOUND |
| **검증 포인트** | |
| - 에러 메시지 | `await expect(page.locator('[data-testid="error-toast"]')).toContainText('팀원을 찾을 수 없습니다')` |
| - 롤백 | 이전 담당자로 복원 |
| **스크린샷** | `e2e-012-assignee-error.png` |
| **관련 요구사항** | BR-003 |

#### E2E-013: API 실패 시 롤백

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('API 실패 시 이전 값으로 롤백한다')` |
| **사전조건** | Task 선택됨, API Mock으로 500 에러 시뮬레이션 |
| **data-testid 셀렉터** | |
| - 제목 표시 | `[data-testid="task-title-display"]` |
| - 에러 메시지 | `[data-testid="error-toast"]` |
| **실행 단계** | |
| 1 | 이전 제목 백업 ("Detail Panel Structure") |
| 2 | 제목 수정 ("실패할 제목") |
| 3 | API 500 에러 발생 |
| **API 확인** | `PUT /api/tasks/:id` → 500 FILE_WRITE_ERROR |
| **검증 포인트** | |
| - 롤백 확인 | `await expect(page.locator('[data-testid="task-title-display"]')).toContainText('Detail Panel Structure')` |
| - 에러 토스트 | "변경 사항을 저장하는 데 실패했습니다" |
| **스크린샷** | `e2e-013-rollback.png` |
| **관련 요구사항** | BR-004 |

#### E2E-014: 카테고리 편집 불가

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/detail-panel.spec.ts` |
| **테스트명** | `test('카테고리는 편집할 수 없다')` |
| **사전조건** | Task 선택됨 |
| **data-testid 셀렉터** | |
| - 카테고리 Tag | `[data-testid="task-category-tag"]` |
| **실행 단계** | |
| 1 | 카테고리 Tag 확인 |
| 2 | 편집 UI 요소 부재 확인 (Dropdown, InputText 없음) |
| **검증 포인트** | |
| - Tag만 존재 | `await expect(page.locator('[data-testid="task-category-tag"]')).toBeVisible()` |
| - 편집 UI 없음 | Dropdown, InputText 요소 없음 |
| **스크린샷** | `e2e-014-category-readonly.png` |
| **관련 요구사항** | BR-005 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 빈 상태 메시지 표시 | Task 미선택 | 1. WBS 페이지 접속 | 빈 상태 메시지 표시 | High | FR-001 |
| TC-002 | 제목 인라인 편집 | Task 선택됨 | 1. 제목 클릭 2. 수정 3. Enter | 제목 변경 | High | FR-003 |
| TC-003 | 우선순위 변경 | Task 선택됨 | 1. Dropdown 열기 2. 선택 | 우선순위 변경 | High | FR-004 |
| TC-004 | 담당자 변경 | Task 선택됨 | 1. Dropdown 열기 2. 팀원 선택 | 담당자 변경 | High | FR-005 |
| TC-005 | 카테고리 색상 확인 | 3개 카테고리 Task | 각 카테고리 확인 | 색상 올바름 | Medium | FR-006 |
| TC-006 | 우선순위 색상 확인 | 4개 우선순위 Task | 각 우선순위 확인 | 색상 올바름 | Medium | FR-007 |
| TC-007 | 낙관적 업데이트 | Task 선택됨 | 수정 후 즉시 확인 | UI 즉시 반영 | High | FR-008 |
| TC-008 | 스크롤 동작 | Task 선택됨 | 스크롤 시도 | 스크롤 가능 | Medium | FR-009 |
| TC-009 | 로딩 Skeleton | Task 선택 중 | 로딩 확인 | Skeleton 표시 | Medium | FR-010 |
| TC-010 | 키보드 네비게이션 | Task 선택됨 | Tab 키 탐색 | 모든 편집 필드 포커스 | High | 접근성 |
| TC-011 | ARIA 레이블 확인 | Task 선택됨 | 스크린 리더 테스트 | 레이블 읽힘 | Medium | 접근성 |
| TC-012 | 반응형 확인 (Desktop) | Desktop 화면 | 크기 조절 | 레이아웃 유지 | Medium | 반응형 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 빈 상태 메시지 표시

**테스트 목적**: Task 미선택 시 빈 상태 메시지가 올바르게 표시되는지 확인

**테스트 단계**:
1. WBS 페이지 접속 (`/wbs?project=jjiban`)
2. Task 선택하지 않음
3. 우측 Detail Panel 확인

**예상 결과**:
- PrimeVue Message (info) 컴포넌트 표시
- "왼쪽에서 Task를 선택하세요" 메시지 표시
- 기본 정보, 진행 상태 섹션은 표시 안 됨

**검증 기준**:
- [x] 빈 상태 메시지 표시
- [x] 다른 콘텐츠 표시 안 됨
- [x] 메시지 스타일 (info 색상, 아이콘)

#### TC-002: 제목 인라인 편집

**테스트 목적**: 제목 필드를 클릭하여 인라인 편집할 수 있는지 확인

**테스트 단계**:
1. WBS 트리에서 TSK-05-01 선택
2. Detail Panel에서 제목 영역 클릭
3. InputText로 전환 확인
4. 새 제목 입력 ("테스트 제목")
5. Enter 키 입력
6. API 호출 및 UI 업데이트 확인

**예상 결과**:
- 클릭 시 InputText로 전환
- Enter 시 저장, Blur 시 저장
- Escape 시 취소
- API 성공 시 제목 변경됨
- wbs.md 파일 업데이트 확인

**검증 기준**:
- [x] 편집 모드 전환
- [x] Enter/Blur/Escape 동작
- [x] API 호출 확인 (DevTools Network)
- [x] UI 즉시 반영

#### TC-010: 키보드 네비게이션

**테스트 목적**: 키보드만으로 모든 편집 필드에 접근 가능한지 확인

**테스트 단계**:
1. Task 선택
2. Tab 키로 순회 시작
3. 제목 → 우선순위 → 담당자 순서 확인
4. Enter 키로 Dropdown 열기
5. 화살표 키로 옵션 선택
6. Escape 키로 Dropdown 닫기

**예상 결과**:
- Tab 키로 모든 편집 필드 포커스 가능
- Enter/Space/화살표 키 동작 정상
- 포커스 표시 명확 (outline, border)

**검증 기준**:
- [x] Tab 순서 올바름
- [x] 키보드 단축키 동작
- [x] 포커스 시각적 표시

---

## 5. 테스트 데이터 (Fixture)

### 5.1 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-DETAIL-BASE | 기본 Detail Panel 테스트 | .jjiban/jjiban/wbs.md | TSK-05-01 (development, high, 담당자 있음) |
| SEED-DETAIL-CATEGORIES | 카테고리별 색상 테스트 | 3개 카테고리 Task | development, defect, infrastructure |
| SEED-DETAIL-PRIORITIES | 우선순위별 색상 테스트 | 4개 우선순위 Task | critical, high, medium, low |
| SEED-DETAIL-EMPTY | 빈 상태 테스트 | Task 미선택 | - |

### 5.2 테스트 Task 데이터

#### TSK-05-01 (기본 테스트)

```yaml
id: TSK-05-01
title: Detail Panel Structure
category: development
status: [bd]
priority: high
assignee: member1
parentWp: WP-05
parentAct: ACT-05-01
schedule:
  start: 2026-01-13
  end: 2026-01-15
requirements:
  - TaskDetailPanel 컴포넌트
  - TaskBasicInfo 컴포넌트
  - TaskProgress 컴포넌트
tags: [component, detail]
```

#### TSK-TEST-DEV (development 카테고리)

```yaml
id: TSK-TEST-DEV
title: Development Test Task
category: development
status: [im]
priority: medium
```

#### TSK-TEST-DEFECT (defect 카테고리)

```yaml
id: TSK-TEST-DEFECT
title: Defect Test Task
category: defect
status: [an]
priority: critical
```

#### TSK-TEST-INFRA (infrastructure 카테고리)

```yaml
id: TSK-TEST-INFRA
title: Infrastructure Test Task
category: infrastructure
status: [im]
priority: low
```

### 5.3 팀원 테스트 데이터

```json
[
  {
    "id": "member1",
    "name": "팀원1",
    "avatar": "/avatars/member1.png",
    "role": "Developer"
  },
  {
    "id": "member2",
    "name": "팀원2",
    "avatar": "/avatars/member2.png",
    "role": "Designer"
  }
]
```

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 TaskDetailPanel 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-detail-panel` | Panel 컨테이너 | 패널 렌더링 확인 |
| `task-detail-skeleton` | Skeleton | 로딩 상태 확인 |
| `error-message` | Message (error) | 에러 메시지 표시 확인 |
| `error-retry-btn` | Retry 버튼 | 재시도 버튼 |
| `empty-state-message` | Message (info) | 빈 상태 메시지 |

### 6.2 TaskBasicInfo 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-basic-info-panel` | Panel 컨테이너 | 기본 정보 섹션 확인 |
| `task-id-badge` | Badge (ID) | Task ID 표시 확인 |
| `task-title-display` | 제목 표시 영역 | 제목 클릭 (편집 모드) |
| `task-title-input` | InputText (제목 편집) | 제목 입력 |
| `task-category-tag` | Tag (카테고리) | 카테고리 표시 및 색상 확인 |
| `task-priority-dropdown` | Dropdown (우선순위) | 우선순위 선택 |
| `priority-option-{priority}` | Dropdown 옵션 | 우선순위 옵션 (예: `priority-option-critical`) |
| `task-assignee-dropdown` | Dropdown (담당자) | 담당자 선택 |
| `assignee-option-{id}` | Dropdown 옵션 | 담당자 옵션 (예: `assignee-option-member1`) |

### 6.3 TaskProgress 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-progress-panel` | Panel 컨테이너 | 진행 상태 섹션 확인 |
| `task-status-badge` | Badge (현재 상태) | 상태 표시 확인 |
| `workflow-steps-container` | 워크플로우 단계 컨테이너 | 단계 인디케이터 |
| `workflow-step-{index}` | 개별 단계 | 단계별 확인 (예: `workflow-step-0`) |
| `workflow-step-current` | 현재 단계 (강조) | 현재 위치 확인 |

### 6.4 공통 요소

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `error-toast` | Toast (에러) | 에러 메시지 토스트 |
| `success-toast` | Toast (성공) | 성공 메시지 토스트 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

**해당 없음** - 이 Task는 E2E 테스트 중심

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 (FR-001 ~ FR-010) |
| 비즈니스 규칙 (BR) | 100% 커버 (BR-001 ~ BR-005) |
| 에러 케이스 | 100% 커버 (롤백, 에러 메시지) |
| 접근성 | 80% 커버 (키보드, ARIA) |

### 7.3 매뉴얼 테스트 커버리지

| 구분 | 목표 |
|------|------|
| UI/UX 검증 | 100% (모든 화면 요소) |
| 접근성 검증 | 100% (키보드, ARIA) |
| 반응형 검증 | Desktop만 (이 Task 범위) |
| 색상 팔레트 | 100% (카테고리, 우선순위) |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
