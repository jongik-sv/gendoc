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
| Task ID | TSK-05-03 |
| Task명 | Detail Actions |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | TaskActions 컴포넌트 로직, API 엔드포인트 | 85% 이상 |
| E2E 테스트 | 인라인 편집, 상태 전이, 문서 열기 시나리오 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | 키보드 네비게이션, 접근성, 에러 상태 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright |
| 테스트 데이터 | .jjiban/jjiban 폴더 (테스트 전용 프로젝트) |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | TaskActions | 편집 버튼 클릭 시 editMode 활성화 | editMode = true | FR-001 |
| UT-002 | TaskActions | 제목 변경 시 API 호출 | PUT /api/tasks/:id 호출됨 | FR-002 |
| UT-003 | TaskActions | 우선순위 변경 시 API 호출 | PUT /api/tasks/:id 호출됨 | FR-003 |
| UT-004 | TaskActions | 담당자 변경 시 API 호출 | PUT /api/tasks/:id 호출됨 | FR-004 |
| UT-005 | TaskActions | 상태 전이 버튼 클릭 시 API 호출 | POST /api/tasks/:id/transition 호출됨 | FR-005 |
| UT-006 | PUT /api/tasks/:id | 정상 수정 | 200 OK, Task 반환 | FR-007 |
| UT-007 | TaskActions | 낙관적 업데이트 적용 | API 호출 전 selectedTask 수정 확인 | FR-008, BR-001 |
| UT-008 | TaskActions | API 실패 시 롤백 | prevValues로 복원 | FR-009, BR-002 |
| UT-009 | TaskActions | 취소 버튼 클릭 시 편집 모드 종료 | editMode = false | FR-010 |
| UT-010 | TaskActions | API 성공 시 refreshTaskDetail 호출 | refreshTaskDetail() 호출 확인 | BR-003 |
| UT-011 | TaskActions | availableActions 기반 버튼 렌더링 | availableButtons computed 필터링 | BR-004 |
| UT-012 | POST /api/tasks/:id/transition | 워크플로우 규칙 위반 시 에러 | 409 WORKFLOW_VIOLATION | BR-005 |

### 2.2 테스트 케이스 상세

#### UT-001: 편집 버튼 클릭 시 editMode 활성화

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('편집 모드') → it('편집 버튼 클릭 시 editMode 활성화')` |
| **Mock 의존성** | - |
| **입력 데이터** | task prop (TaskDetail 객체) |
| **실행 단계** | 1. 컴포넌트 마운트<br>2. "편집" 버튼 클릭<br>3. editMode ref 값 확인 |
| **검증 포인트** | editMode.value === true |
| **커버리지 대상** | enterEditMode() 메서드 |
| **관련 요구사항** | FR-001 |

#### UT-002: 제목 변경 시 API 호출

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('인라인 편집') → it('제목 변경 시 API 호출')` |
| **Mock 의존성** | $fetch (Nuxt API), useSelectionStore |
| **입력 데이터** | task.title = "기존 제목" → editedValues.title = "새 제목" |
| **실행 단계** | 1. 편집 모드 진입<br>2. 제목 변경<br>3. "저장" 버튼 클릭 |
| **검증 포인트** | $fetch 호출됨, 인자: PUT /api/tasks/TSK-05-03, body: { title: "새 제목" } |
| **커버리지 대상** | handleUpdateField() 메서드 |
| **관련 요구사항** | FR-002 |

#### UT-003: 우선순위 변경 시 API 호출

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('인라인 편집') → it('우선순위 변경 시 API 호출')` |
| **Mock 의존성** | $fetch, useSelectionStore |
| **입력 데이터** | task.priority = "medium" → editedValues.priority = "high" |
| **실행 단계** | 1. 편집 모드 진입<br>2. 우선순위 드롭다운 변경<br>3. "저장" 버튼 클릭 |
| **검증 포인트** | $fetch 호출됨, body: { priority: "high" } |
| **커버리지 대상** | handleUpdateField() 메서드 |
| **관련 요구사항** | FR-003 |

#### UT-004: 담당자 변경 시 API 호출

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('인라인 편집') → it('담당자 변경 시 API 호출')` |
| **Mock 의존성** | $fetch, useSelectionStore |
| **입력 데이터** | task.assignee = null → editedValues.assignee = "dev-001" |
| **실행 단계** | 1. 편집 모드 진입<br>2. 담당자 드롭다운 변경<br>3. "저장" 버튼 클릭 |
| **검증 포인트** | $fetch 호출됨, body: { assignee: "dev-001" } |
| **커버리지 대상** | handleUpdateField() 메서드 |
| **관련 요구사항** | FR-004 |

#### UT-005: 상태 전이 버튼 클릭 시 API 호출

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('상태 전이') → it('상태 전이 버튼 클릭 시 API 호출')` |
| **Mock 의존성** | $fetch, useSelectionStore |
| **입력 데이터** | task.availableActions = ["start", "draft"] |
| **실행 단계** | 1. "start" 버튼 클릭 |
| **검증 포인트** | $fetch 호출됨, POST /api/tasks/:id/transition, body: { command: "start" } |
| **커버리지 대상** | handleTransition() 메서드 |
| **관련 요구사항** | FR-005 |

#### UT-006: PUT /api/tasks/:id 정상 수정

| 항목 | 내용 |
|------|------|
| **파일** | `server/api/tasks/__tests__/[id].put.spec.ts` |
| **테스트 블록** | `describe('PUT /api/tasks/:id') → it('정상 수정')` |
| **Mock 의존성** | FileSystem (wbs.md 읽기/쓰기) |
| **입력 데이터** | PUT /api/tasks/TSK-05-03, body: { title: "새 제목", priority: "high" } |
| **실행 단계** | 1. API 호출<br>2. wbs.md 파서로 Task 찾기<br>3. 필드 업데이트<br>4. wbs.md 저장 |
| **검증 포인트** | 200 OK, task.title === "새 제목", task.priority === "high" |
| **커버리지 대상** | PUT /api/tasks/:id 엔드포인트 |
| **관련 요구사항** | FR-007 |

#### UT-007: 낙관적 업데이트 적용

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('낙관적 업데이트') → it('API 호출 전 selectedTask 수정')` |
| **Mock 의존성** | $fetch (지연 모킹), useSelectionStore |
| **입력 데이터** | editedValues.title = "새 제목" |
| **실행 단계** | 1. "저장" 버튼 클릭<br>2. API 응답 전 selectedTask.title 확인 |
| **검증 포인트** | $fetch 호출 전에 selectedTask.title === "새 제목" |
| **커버리지 대상** | handleUpdateField() 낙관적 업데이트 분기 |
| **관련 요구사항** | FR-008, BR-001 |

#### UT-008: API 실패 시 롤백

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('낙관적 업데이트') → it('API 실패 시 롤백')` |
| **Mock 의존성** | $fetch (에러 발생 모킹), useSelectionStore, useToast |
| **입력 데이터** | editedValues.title = "새 제목" |
| **실행 단계** | 1. "저장" 버튼 클릭<br>2. API 400 에러 발생<br>3. selectedTask.title 확인 |
| **검증 포인트** | selectedTask.title === "기존 제목" (롤백됨), toast.add 호출됨 (에러 메시지) |
| **커버리지 대상** | handleUpdateField() catch 블록 |
| **관련 요구사항** | FR-009, BR-002 |

#### UT-009: 취소 버튼 클릭 시 편집 모드 종료

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('편집 모드') → it('취소 버튼 클릭 시 편집 모드 종료')` |
| **Mock 의존성** | - |
| **입력 데이터** | editMode = true |
| **실행 단계** | 1. 편집 모드 진입<br>2. "취소" 버튼 클릭 |
| **검증 포인트** | editMode.value === false |
| **커버리지 대상** | cancelEdit() 메서드 |
| **관련 요구사항** | FR-010 |

#### UT-010: API 성공 시 refreshTaskDetail 호출

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('API 연동') → it('API 성공 시 refreshTaskDetail 호출')` |
| **Mock 의존성** | $fetch (성공 모킹), useSelectionStore |
| **입력 데이터** | editedValues.title = "새 제목" |
| **실행 단계** | 1. "저장" 버튼 클릭<br>2. API 성공 |
| **검증 포인트** | selectionStore.refreshTaskDetail() 호출됨 |
| **커버리지 대상** | handleUpdateField() 성공 분기 |
| **관련 요구사항** | BR-003 |

#### UT-011: availableActions 기반 버튼 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `components/tasks/__tests__/TaskActions.spec.ts` |
| **테스트 블록** | `describe('TaskActions') → describe('상태 전이') → it('availableActions 기반 버튼 렌더링')` |
| **Mock 의존성** | - |
| **입력 데이터** | task.availableActions = ["start", "draft"] |
| **실행 단계** | 1. 컴포넌트 마운트<br>2. 버튼 개수 확인 |
| **검증 포인트** | 렌더링된 버튼 개수 === 2, 버튼 라벨: "시작", "초안 작성" |
| **커버리지 대상** | availableButtons computed |
| **관련 요구사항** | BR-004 |

#### UT-012: 워크플로우 규칙 위반 시 에러

| 항목 | 내용 |
|------|------|
| **파일** | `server/api/tasks/__tests__/[id]/transition.post.spec.ts` |
| **테스트 블록** | `describe('POST /api/tasks/:id/transition') → it('워크플로우 규칙 위반 시 409 에러')` |
| **Mock 의존성** | WorkflowEngine |
| **입력 데이터** | POST /api/tasks/TSK-05-03/transition, body: { command: "done" } (현재 상태: [ ]) |
| **실행 단계** | 1. API 호출<br>2. WorkflowEngine.executeCommand() 호출<br>3. 규칙 검증 실패 |
| **검증 포인트** | 409 WORKFLOW_VIOLATION |
| **커버리지 대상** | POST /api/tasks/:id/transition 엔드포인트, WorkflowEngine |
| **관련 요구사항** | BR-005 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 편집 모드 진입 | Task 선택됨 | 1. "편집" 버튼 클릭 | 인라인 편집 필드 표시됨 | FR-001 |
| E2E-002 | 인라인 편집 성공 | Task 선택됨 | 1. 편집 모드 진입 2. 제목/우선순위/담당자 변경 3. "저장" | Task 정보 업데이트됨, 성공 토스트 | FR-002, FR-003, FR-004, FR-007 |
| E2E-003 | 상태 전이 성공 | Task 선택됨 | 1. "start" 버튼 클릭 | 상태 변경됨, 성공 토스트 | FR-005 |
| E2E-004 | 문서 열기 | Task 선택됨 | 1. "문서 보기" 버튼 클릭 | 문서 뷰어 페이지 이동 | FR-006 |
| E2E-005 | 낙관적 업데이트 확인 | Task 선택됨 | 1. 편집 → 저장 2. API 응답 전 UI 확인 | 즉시 UI 반영됨 | FR-008, BR-001 |
| E2E-006 | API 실패 시 롤백 | Task 선택됨 | 1. 편집 → 잘못된 값 입력 → 저장 | 롤백됨, 에러 토스트 | FR-009, BR-002 |
| E2E-007 | 편집 취소 | Task 선택됨 | 1. 편집 모드 진입 2. "취소" 버튼 또는 Escape 키 | 편집 모드 종료됨 | FR-010 |
| E2E-008 | 워크플로우 규칙 위반 | Task 선택됨 | 1. 잘못된 상태 전이 시도 | 에러 토스트 | BR-005 |

### 3.2 테스트 케이스 상세

#### E2E-001: 편집 모드 진입

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('사용자가 편집 버튼을 클릭하여 편집 모드에 진입할 수 있다')` |
| **사전조건** | .jjiban/jjiban 프로젝트 로드, TSK-05-03 선택 |
| **data-testid 셀렉터** | |
| - 편집 버튼 | `[data-testid="task-actions-edit-btn"]` |
| - 인라인 편집 필드 | `[data-testid="task-title-input"]`, `[data-testid="task-priority-dropdown"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-edit-btn"]')` |
| **검증 포인트** | `expect(page.locator('[data-testid="task-title-input"]')).toBeVisible()` |
| **스크린샷** | `e2e-001-edit-mode.png` |
| **관련 요구사항** | FR-001 |

#### E2E-002: 인라인 편집 성공

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('사용자가 Task 정보를 인라인 편집하여 저장할 수 있다')` |
| **사전조건** | TSK-05-03 선택 |
| **data-testid 셀렉터** | |
| - 제목 입력 | `[data-testid="task-title-input"]` |
| - 우선순위 드롭다운 | `[data-testid="task-priority-dropdown"]` |
| - 담당자 드롭다운 | `[data-testid="task-assignee-dropdown"]` |
| - 저장 버튼 | `[data-testid="task-actions-save-btn"]` |
| - 성공 토스트 | `[data-testid="toast-message"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-edit-btn"]')` |
| 2 | `await page.fill('[data-testid="task-title-input"]', '새로운 제목')` |
| 3 | `await page.selectOption('[data-testid="task-priority-dropdown"]', 'high')` |
| 4 | `await page.selectOption('[data-testid="task-assignee-dropdown"]', 'dev-001')` |
| 5 | `await page.click('[data-testid="task-actions-save-btn"]')` |
| **API 확인** | `PUT /api/tasks/TSK-05-03` → 200 |
| **검증 포인트** | `expect(page.locator('[data-testid="toast-message"]')).toContainText('수정 완료')` |
| **스크린샷** | `e2e-002-edit-before.png`, `e2e-002-edit-after.png` |
| **관련 요구사항** | FR-002, FR-003, FR-004, FR-007 |

#### E2E-003: 상태 전이 성공

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('사용자가 상태 전이 버튼을 클릭하여 Task 상태를 변경할 수 있다')` |
| **사전조건** | TSK-05-03 선택, status: [ ] |
| **data-testid 셀렉터** | |
| - 상태 전이 버튼 | `[data-testid="task-actions-transition-start"]` |
| - 성공 토스트 | `[data-testid="toast-message"]` |
| - Task 상태 표시 | `[data-testid="task-status-badge"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-transition-start"]')` |
| **API 확인** | `POST /api/tasks/TSK-05-03/transition` → 200 |
| **검증 포인트** | `expect(page.locator('[data-testid="task-status-badge"]')).toContainText('[bd]')` |
| **스크린샷** | `e2e-003-transition.png` |
| **관련 요구사항** | FR-005 |

#### E2E-004: 문서 열기

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('사용자가 문서 보기 버튼을 클릭하여 문서 뷰어를 열 수 있다')` |
| **사전조건** | TSK-05-03 선택, documents.length > 0 |
| **data-testid 셀렉터** | |
| - 문서 열기 버튼 | `[data-testid="task-actions-documents-btn"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-documents-btn"]')` |
| **검증 포인트** | `expect(page.url()).toContain('/documents?task=TSK-05-03')` |
| **스크린샷** | `e2e-004-documents.png` |
| **관련 요구사항** | FR-006 |

#### E2E-005: 낙관적 업데이트 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('인라인 편집 시 낙관적 업데이트가 적용된다')` |
| **사전조건** | TSK-05-03 선택 |
| **data-testid 셀렉터** | |
| - 제목 표시 | `[data-testid="task-basic-info-title"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-edit-btn"]')` |
| 2 | `await page.fill('[data-testid="task-title-input"]', '즉시 반영 제목')` |
| 3 | `await page.click('[data-testid="task-actions-save-btn"]')` |
| 4 | API 응답 전 제목 표시 확인 (네트워크 지연 시뮬레이션) |
| **검증 포인트** | `expect(page.locator('[data-testid="task-basic-info-title"]')).toContainText('즉시 반영 제목')` (API 응답 전) |
| **스크린샷** | `e2e-005-optimistic.png` |
| **관련 요구사항** | FR-008, BR-001 |

#### E2E-006: API 실패 시 롤백

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('API 실패 시 이전 값으로 롤백된다')` |
| **사전조건** | TSK-05-03 선택, API 실패 시뮬레이션 (네트워크 차단 또는 모킹) |
| **data-testid 셀렉터** | |
| - 에러 토스트 | `[data-testid="toast-message"]` |
| **실행 단계** | |
| 1 | `await page.route('**/api/tasks/**', route => route.abort())` (API 차단) |
| 2 | `await page.click('[data-testid="task-actions-edit-btn"]')` |
| 3 | `await page.fill('[data-testid="task-title-input"]', '실패할 제목')` |
| 4 | `await page.click('[data-testid="task-actions-save-btn"]')` |
| **검증 포인트** | `expect(page.locator('[data-testid="toast-message"]')).toContainText('수정 실패')` |
| **스크린샷** | `e2e-006-rollback.png` |
| **관련 요구사항** | FR-009, BR-002 |

#### E2E-007: 편집 취소

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('사용자가 취소 버튼 또는 Escape 키로 편집을 취소할 수 있다')` |
| **사전조건** | TSK-05-03 선택 |
| **data-testid 셀렉터** | |
| - 취소 버튼 | `[data-testid="task-actions-cancel-btn"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-actions-edit-btn"]')` |
| 2 | `await page.fill('[data-testid="task-title-input"]', '취소할 제목')` |
| 3 | `await page.click('[data-testid="task-actions-cancel-btn"]')` 또는 `await page.keyboard.press('Escape')` |
| **검증 포인트** | `expect(page.locator('[data-testid="task-title-input"]')).not.toBeVisible()` |
| **스크린샷** | `e2e-007-cancel.png` |
| **관련 요구사항** | FR-010 |

#### E2E-008: 워크플로우 규칙 위반

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/tasks.spec.ts` |
| **테스트명** | `test('워크플로우 규칙 위반 시 에러 메시지가 표시된다')` |
| **사전조건** | 워크플로우 규칙 위반 시나리오 (availableActions에 없는 명령어 시도) |
| **data-testid 셀렉터** | |
| - 에러 토스트 | `[data-testid="toast-message"]` |
| **실행 단계** | |
| 1 | 서버 모킹으로 잘못된 명령어 시도 또는 availableActions 조작 |
| **API 확인** | `POST /api/tasks/:id/transition` → 409 |
| **검증 포인트** | `expect(page.locator('[data-testid="toast-message"]')).toContainText('실행할 수 없는 명령어')` |
| **스크린샷** | `e2e-008-workflow-violation.png` |
| **관련 요구사항** | BR-005 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 편집 모드 UI 확인 | TSK-05-03 선택 | 1. "편집" 버튼 클릭 | 인라인 편집 필드 표시됨 | High | FR-001 |
| TC-002 | 인라인 편집 필드 입력 | 편집 모드 활성 | 1. 제목/우선순위/담당자 입력 | 입력 가능, 드롭다운 옵션 표시 | High | FR-002, FR-003, FR-004 |
| TC-003 | 상태 전이 버튼 UI | TSK-05-03 선택 | 1. 상태 전이 버튼 확인 | availableActions 기반 버튼 표시 | High | FR-005 |
| TC-004 | 문서 버튼 활성화 | documents 있음 | 1. 문서 버튼 확인 | 활성화됨 | Medium | FR-006 |
| TC-005 | 에러 토스트 표시 | API 실패 시뮬레이션 | 1. 편집 → 저장 | 에러 메시지 토스트 표시 | High | FR-009 |
| TC-006 | 키보드 네비게이션 | 편집 모드 활성 | 1. Tab 키로 이동 2. Escape 키 | 필드 간 이동 가능, 편집 모드 종료 | Medium | FR-010 |
| TC-007 | 로딩 상태 확인 | API 지연 시뮬레이션 | 1. 저장 버튼 클릭 | 버튼 로딩 스피너 표시 | Medium | - |
| TC-008 | 반응형 확인 | - | 1. 브라우저 크기 조절 | 버튼 레이아웃 적응 | Low | - |
| TC-009 | 접근성 확인 | - | 1. 스크린 리더 사용 | ARIA 라벨 읽힘 | Medium | - |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 편집 모드 UI 확인

**테스트 목적**: 편집 버튼 클릭 시 인라인 편집 UI가 올바르게 표시되는지 확인

**테스트 단계**:
1. WBS 페이지 접속
2. TSK-05-03 Task 선택
3. TaskActions 컴포넌트에서 "편집" 버튼 클릭
4. 인라인 편집 필드 표시 확인

**예상 결과**:
- 제목 InputText 필드 표시됨
- 우선순위 Dropdown 표시됨
- 담당자 Dropdown 표시됨
- "저장", "취소" 버튼 표시됨

**검증 기준**:
- [ ] 모든 편집 필드가 표시됨
- [ ] 현재 값이 필드에 채워져 있음
- [ ] 버튼이 활성 상태임

#### TC-002: 인라인 편집 필드 입력

**테스트 목적**: 인라인 편집 필드가 정상적으로 동작하는지 확인

**테스트 단계**:
1. 편집 모드 진입
2. 제목 필드에 "새 제목" 입력
3. 우선순위 드롭다운에서 "High" 선택
4. 담당자 드롭다운에서 "개발자1" 선택

**예상 결과**:
- 모든 필드 입력 가능
- 드롭다운 옵션이 올바르게 표시됨

**검증 기준**:
- [ ] InputText 입력 가능
- [ ] Dropdown 옵션 선택 가능
- [ ] 선택된 값이 UI에 반영됨

#### TC-006: 키보드 네비게이션

**테스트 목적**: 키보드만으로 모든 기능에 접근 가능한지 확인

**테스트 단계**:
1. 편집 모드 진입
2. Tab 키로 제목 → 우선순위 → 담당자 → 저장 → 취소 순서로 이동
3. Escape 키 입력

**예상 결과**:
- Tab 키로 모든 필드 이동 가능
- Escape 키로 편집 모드 종료

**검증 기준**:
- [ ] 포커스 순서가 논리적임
- [ ] Escape 키로 취소 가능
- [ ] Enter 키로 저장 가능 (InputText에서)

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-TASK-01 | 기본 Task | `{ id: 'TSK-05-03', title: 'Detail Actions', category: 'development', status: '[bd]', priority: 'high', assignee: null, availableActions: ['start', 'draft'] }` |
| MOCK-TEAM-MEMBER-01 | 담당자 | `{ id: 'dev-001', name: '개발자1', email: 'dev1@test.com', role: 'Developer' }` |
| MOCK-DOCUMENT-01 | 문서 | `{ filename: '010-basic-design.md', title: '기본설계', exists: true }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-E2E-TSK-05-03 | TSK-05-03 Task | .jjiban/jjiban 프로젝트 자동 로드 | TSK-05-03, 팀원 2명, 문서 3개 |
| SEED-E2E-EMPTY-ACTIONS | availableActions 빈 배열 | 수동 조작 | availableActions: [] |

### 5.3 테스트 계정

| 계정 ID | 이메일 | 비밀번호 | 역할 | 용도 |
|---------|--------|----------|------|------|
| (인증 없음) | - | - | - | 로컬 환경, 인증 불필요 |

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 TaskActions 컴포넌트 셀렉터

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-actions-card` | PrimeVue Card | 컴포넌트 컨테이너 |
| `task-actions-edit-btn` | 편집 버튼 | 편집 모드 진입 |
| `task-title-input` | 제목 InputText | 제목 입력 |
| `task-priority-dropdown` | 우선순위 Dropdown | 우선순위 선택 |
| `task-assignee-dropdown` | 담당자 Dropdown | 담당자 선택 |
| `task-actions-save-btn` | 저장 버튼 | 변경사항 저장 |
| `task-actions-cancel-btn` | 취소 버튼 | 편집 취소 |
| `task-actions-transition-{command}` | 상태 전이 버튼 | 상태 전이 실행 (예: `task-actions-transition-start`) |
| `task-actions-documents-btn` | 문서 보기 버튼 | 문서 뷰어 열기 |
| `toast-message` | Toast 메시지 | 성공/에러 알림 확인 |

### 6.2 관련 컴포넌트 셀렉터 (참조용)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-basic-info-title` | Task 제목 표시 | 낙관적 업데이트 확인 |
| `task-status-badge` | Task 상태 배지 | 상태 전이 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 85% | 75% |
| Branches | 80% | 70% |
| Functions | 90% | 80% |
| Statements | 85% | 75% |

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비즈니스 규칙 (BR) | 100% 커버 |
| 에러 케이스 | 90% 커버 |

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
