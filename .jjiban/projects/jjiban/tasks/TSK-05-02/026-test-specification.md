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
| Task ID | TSK-05-02 |
| Task명 | Detail Sections |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | Vue 컴포넌트 computed 속성, 함수 | 80% 이상 (라인 기준) |
| E2E 테스트 | 워크플로우 표시, 요구사항 편집, 문서 클릭, 이력 표시 | 100% 주요 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 시각적 일관성 | 전체 섹션 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest + Vue Test Utils |
| 테스트 프레임워크 (E2E) | Playwright |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |
| 테스트 데이터 | `.jjiban/jjiban-test/` (TSK-05-02 전용) |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | TaskWorkflow.workflowSteps | development 카테고리 | 6단계 배열 반환 | FR-001, BR-WF-01 |
| UT-002 | TaskWorkflow.workflowSteps | defect, infrastructure 카테고리 | 5단계, 4단계 배열 반환 | FR-001, BR-WF-01 |
| UT-003 | TaskWorkflow.currentStepIndex | 현재 상태 인덱스 계산 | 올바른 인덱스 반환 | FR-002 |
| UT-004 | TaskWorkflow.getNodeStyle | 완료/현재/미완료 스타일 | 상태별 다른 스타일 객체 | FR-003 |
| UT-005 | TaskRequirements.toggleEdit | 편집 모드 토글 | isEditing 상태 변경, localRequirements 복사 | FR-006 |
| UT-006 | TaskDocuments.getDocumentCardStyle | exists true/false | 파란/회색 배경 스타일 | FR-008 |
| UT-007 | TaskDocuments.handleOpenDocument | exists false 문서 클릭 | 이벤트 발행되지 않음 | FR-009, BR-DOC-01 |
| UT-008 | TaskHistory.sortedHistory | 타임스탬프 역순 정렬 | 최신 이력이 첫 번째 | FR-011, BR-HIST-01 |
| UT-009 | TaskHistory.formatHistoryEntry | 이력 엔트리 포맷 | action별 다른 포맷 객체 | FR-012, FR-013, FR-014 |
| UT-010 | TaskWorkflow (독립 렌더링) | 컴포넌트 단독 마운트 | 에러 없이 렌더링 | NFR-004 |
| UT-011 | TaskRequirements.validateRequirement | 500자 초과 입력 | 유효성 오류 반환 | BR-REQ-01 |

### 2.2 테스트 케이스 상세

#### UT-001: TaskWorkflow.workflowSteps (development)

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskWorkflow.spec.ts` |
| **테스트 블록** | `describe('TaskWorkflow') → describe('workflowSteps') → it('development 카테고리일 때 6단계 반환')` |
| **Mock 의존성** | task: { category: 'development', status: '[bd]' } |
| **입력 데이터** | props.task.category = 'development' |
| **검증 포인트** | - workflowSteps.length === 6<br>- steps[0].code === '[ ]'<br>- steps[5].code === '[xx]' |
| **커버리지 대상** | workflowSteps computed 속성 (development 분기) |
| **관련 요구사항** | FR-001, BR-WF-01 |

**테스트 코드 개념**:
```typescript
// workflowSteps가 6개 단계를 반환하는지 확인
expect(wrapper.vm.workflowSteps).toHaveLength(6)
expect(wrapper.vm.workflowSteps[0]).toEqual({
  code: '[ ]',
  name: 'Todo',
  description: '시작 전'
})
```

#### UT-002: TaskWorkflow.workflowSteps (defect, infrastructure)

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskWorkflow.spec.ts` |
| **테스트 블록** | `describe('workflowSteps') → it('defect 카테고리일 때 5단계'), it('infrastructure 카테고리일 때 4단계')` |
| **Mock 의존성** | task: { category: 'defect' or 'infrastructure' } |
| **검증 포인트** | - defect: 5단계, [an] 포함<br>- infrastructure: 4단계, [ds] 포함 |
| **커버리지 대상** | workflowSteps computed (defect, infrastructure 분기) |

#### UT-003: TaskWorkflow.currentStepIndex

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskWorkflow.spec.ts` |
| **테스트 블록** | `describe('currentStepIndex') → it('현재 상태의 인덱스 반환')` |
| **Mock 의존성** | task: { category: 'development', status: '[dd]' } |
| **검증 포인트** | currentStepIndex === 2 ([dd]는 3번째 단계, 인덱스 2) |
| **커버리지 대상** | currentStepIndex computed |
| **관련 요구사항** | FR-002 |

#### UT-004: TaskWorkflow.getNodeStyle

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskWorkflow.spec.ts` |
| **테스트 블록** | `describe('getNodeStyle') → it('완료 상태는 초록'), it('현재 상태는 파란'), it('미완료는 회색')` |
| **Mock 의존성** | task: { category: 'development', status: '[dd]' } (currentStepIndex = 2) |
| **검증 포인트** | - getNodeStyle(0): backgroundColor === '#22c55e'<br>- getNodeStyle(2): backgroundColor === '#3b82f6', fontWeight === 'bold'<br>- getNodeStyle(4): backgroundColor === '#e5e7eb', border 점선 |
| **커버리지 대상** | getNodeStyle 함수 |
| **관련 요구사항** | FR-003 |

#### UT-005: TaskRequirements.toggleEdit

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskRequirements.spec.ts` |
| **테스트 블록** | `describe('TaskRequirements') → describe('toggleEdit') → it('편집 모드 활성화'), it('편집 모드 저장')` |
| **Mock 의존성** | task: { requirements: ['요구사항1', '요구사항2'] } |
| **검증 포인트** | - 편집 버튼 클릭 → isEditing = true, localRequirements 복사<br>- 저장 버튼 클릭 → emit('update:requirements'), isEditing = false |
| **커버리지 대상** | toggleEdit 함수, addRequirement, removeRequirement |
| **관련 요구사항** | FR-006 |

#### UT-006: TaskDocuments.getDocumentCardStyle

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskDocuments.spec.ts` |
| **테스트 블록** | `describe('TaskDocuments') → describe('getDocumentCardStyle') → it('exists=true는 파란 배경'), it('exists=false는 회색 배경')` |
| **Mock 의존성** | documents: [{ exists: true }, { exists: false }] |
| **검증 포인트** | - exists=true: backgroundColor === '#dbeafe', cursor === 'pointer'<br>- exists=false: backgroundColor === '#f9fafb', cursor === 'not-allowed', opacity === 0.6 |
| **커버리지 대상** | getDocumentCardStyle 함수 |
| **관련 요구사항** | FR-008 |

#### UT-007: TaskDocuments.handleOpenDocument (exists=false)

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskDocuments.spec.ts` |
| **테스트 블록** | `describe('handleOpenDocument') → it('예정 문서 클릭 시 이벤트 발행하지 않음')` |
| **Mock 의존성** | document: { exists: false } |
| **검증 포인트** | emit('open-document') 호출되지 않음 |
| **커버리지 대상** | handleOpenDocument 함수 (exists 체크 분기) |
| **관련 요구사항** | FR-009, BR-DOC-01 |

#### UT-008: TaskHistory.sortedHistory

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskHistory.spec.ts` |
| **테스트 블록** | `describe('TaskHistory') → describe('sortedHistory') → it('타임스탬프 역순 정렬')` |
| **Mock 의존성** | history: [{ timestamp: '2025-12-15T09:00' }, { timestamp: '2025-12-15T13:12' }] |
| **검증 포인트** | sortedHistory[0].timestamp === '2025-12-15T13:12' (최신) |
| **커버리지 대상** | sortedHistory computed |
| **관련 요구사항** | FR-011, BR-HIST-01 |

#### UT-009: TaskHistory.formatHistoryEntry

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskHistory.spec.ts` |
| **테스트 블록** | `describe('formatHistoryEntry') → it('transition 액션'), it('update 액션')` |
| **Mock 의존성** | entry: { action: 'transition', previousStatus: '[bd]', newStatus: '[dd]', documentCreated: '020-detail-design.md' } |
| **검증 포인트** | - action === 'transition': icon === 'pi pi-arrow-right', content 포함 상태 전이<br>- documentCreated 필드 포함 |
| **커버리지 대상** | formatHistoryEntry 함수 |
| **관련 요구사항** | FR-012, FR-013, FR-014 |

#### UT-010: TaskWorkflow 독립 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskWorkflow.spec.ts` |
| **테스트 블록** | `describe('TaskWorkflow') → it('Props만으로 독립 렌더링')` |
| **Mock 의존성** | 최소 props: { task: { category: 'development', status: '[bd]' } } |
| **검증 포인트** | 컴포넌트가 에러 없이 마운트됨, workflowSteps 렌더링 확인 |
| **커버리지 대상** | 컴포넌트 독립성 |
| **관련 요구사항** | NFR-004 |

#### UT-011: TaskRequirements 유효성 검증 (500자 초과)

| 항목 | 내용 |
|------|------|
| **파일** | `components/detail/__tests__/TaskRequirements.spec.ts` |
| **테스트 블록** | `describe('validateRequirement') → it('500자 초과 시 오류')` |
| **입력 데이터** | requirement: 'a'.repeat(501) |
| **검증 포인트** | validateRequirement 함수가 false 또는 에러 메시지 반환 |
| **커버리지 대상** | validateRequirement 함수 (클라이언트 유효성) |
| **관련 요구사항** | BR-REQ-01 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 워크플로우 흐름 표시 | Task 선택됨 | 1. Task 선택 | 워크플로우 노드 표시, 현재 상태 강조 | FR-001, FR-002, FR-003 |
| E2E-002 | 요구사항 목록 표시 | Task 선택됨 | 1. 요구사항 섹션 확인 | 요구사항 목록, PRD 참조 표시 | FR-004, FR-005 |
| E2E-003 | 요구사항 편집 | Task 선택됨 | 1. 편집 클릭 2. 수정 3. 저장 | 요구사항 업데이트됨 | FR-006 |
| E2E-004 | 요구사항 추가/삭제 | 편집 모드 | 1. 추가 클릭 2. 입력 3. 삭제 클릭 | 항목 추가/삭제됨 | FR-006 |
| E2E-005 | 문서 목록 표시 | Task 선택됨 | 1. 문서 섹션 확인 | 존재/예정 문서 구분 표시 | FR-007, FR-008, FR-010 |
| E2E-006 | 문서 클릭하여 뷰어 열기 | 존재하는 문서 있음 | 1. 문서 카드 클릭 | DocumentViewer 모달 열림 | FR-009 |
| E2E-007 | 이력 타임라인 표시 | 이력 있는 Task | 1. 이력 섹션 확인 | 타임라인 역순 표시, 상태 전이 정보 | FR-011, FR-012, FR-013 |
| E2E-008 | 요구사항 500자 초과 입력 | 편집 모드 | 1. 500자 초과 입력 | 에러 메시지 또는 입력 차단 | BR-REQ-01 |
| E2E-009 | 예정 문서 클릭 시도 | 예정 문서 있음 | 1. 예정 문서 클릭 | 뷰어 열리지 않음 | BR-DOC-01 |
| E2E-PERF-01 | 섹션 렌더링 성능 | Task 선택됨 | 1. Performance API 측정 | 각 섹션 < 100ms | NFR-001 |
| E2E-A11Y-01 | 접근성 확인 | Task 선택됨 | 1. 키보드 네비게이션 2. ARIA 검증 | 모든 요소 접근 가능 | NFR-003 |

### 3.2 테스트 케이스 상세

#### E2E-001: 워크플로우 흐름 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 워크플로우 흐름을 확인할 수 있다')` |
| **사전조건** | - 프로젝트 jjiban 선택<br>- TSK-05-02 (status: [bd]) 선택 |
| **data-testid 셀렉터** | |
| - 워크플로우 패널 | `[data-testid="task-workflow-panel"]` |
| - 워크플로우 노드 리스트 | `[data-testid="workflow-nodes"]` |
| - 개별 노드 | `[data-testid="workflow-node-{index}"]` |
| - 현재 상태 노드 | `[data-testid="workflow-node-current"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="task-TSK-05-02"]')` |
| 2 | `const workflowPanel = page.locator('[data-testid="task-workflow-panel"]')` |
| 3 | `await expect(workflowPanel).toBeVisible()` |
| **검증 포인트** | - 워크플로우 노드 6개 표시 (development)<br>- 현재 상태([bd]) 노드가 파란 배경<br>- 이전 상태([ ]) 노드가 초록 배경<br>- 이후 상태 노드들이 회색 배경 + 점선 |
| **스크린샷** | `e2e-001-workflow.png` |
| **관련 요구사항** | FR-001, FR-002, FR-003, BR-WF-01, NFR-006 |

**검증 코드 개념**:
```typescript
// 노드 개수 확인
const nodes = page.locator('[data-testid^="workflow-node-"]')
await expect(nodes).toHaveCount(6)

// 현재 상태 노드 스타일 확인
const currentNode = page.locator('[data-testid="workflow-node-current"]')
await expect(currentNode).toHaveCSS('background-color', 'rgb(59, 130, 246)') // #3b82f6
```

#### E2E-002: 요구사항 목록 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 요구사항 목록과 PRD 참조를 확인할 수 있다')` |
| **사전조건** | TSK-05-02 선택 |
| **data-testid 셀렉터** | |
| - 요구사항 패널 | `[data-testid="task-requirements-panel"]` |
| - PRD 참조 | `[data-testid="prd-reference"]` |
| - 요구사항 목록 | `[data-testid="requirements-list"]` |
| - 요구사항 항목 | `[data-testid="requirement-item-{index}"]` |
| **검증 포인트** | - 요구사항 4개 표시<br>- PRD 참조: "ref: PRD 6.3.2, 6.3.3, 6.3.4, 6.3.6"<br>- 각 항목이 불릿 포인트로 표시 |
| **스크린샷** | `e2e-002-requirements.png` |
| **관련 요구사항** | FR-004, FR-005 |

#### E2E-003: 요구사항 편집

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 요구사항을 편집할 수 있다')` |
| **사전조건** | TSK-05-02 선택 |
| **data-testid 셀렉터** | |
| - 편집 버튼 | `[data-testid="edit-requirements-btn"]` |
| - 요구사항 입력 | `[data-testid="requirement-input-{index}"]` |
| - 저장 버튼 | `[data-testid="save-requirements-btn"]` |
| - 취소 버튼 | `[data-testid="cancel-requirements-btn"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="edit-requirements-btn"]')` |
| 2 | `await page.fill('[data-testid="requirement-input-0"]', '워크플로우 흐름 시각화 (수정됨)')` |
| 3 | `await page.click('[data-testid="save-requirements-btn"]')` |
| **API 확인** | `PUT /api/tasks/TSK-05-02` → 200 |
| **검증 포인트** | - 편집 모드 활성화 (InputText 표시)<br>- 저장 후 텍스트 업데이트됨<br>- 성공 토스트 메시지 표시 |
| **스크린샷** | `e2e-003-edit-before.png`, `e2e-003-edit-after.png` |
| **관련 요구사항** | FR-006, NFR-002 |

#### E2E-004: 요구사항 추가/삭제

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 요구사항을 추가하고 삭제할 수 있다')` |
| **data-testid 셀렉터** | |
| - 추가 버튼 | `[data-testid="add-requirement-btn"]` |
| - 삭제 버튼 | `[data-testid="delete-requirement-btn-{index}"]` |
| **실행 단계** | |
| 1 | 편집 모드 활성화 |
| 2 | `await page.click('[data-testid="add-requirement-btn"]')` |
| 3 | `await page.fill('[data-testid="requirement-input-4"]', '새 요구사항')` |
| 4 | `await page.click('[data-testid="delete-requirement-btn-0"]')` |
| 5 | 저장 |
| **검증 포인트** | - 요구사항 개수 변경 (4개 → 5개 → 4개)<br>- 새 항목 추가됨<br>- 첫 번째 항목 삭제됨 |
| **관련 요구사항** | FR-006 |

#### E2E-005: 문서 목록 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 문서 목록과 존재/예정 상태를 확인할 수 있다')` |
| **사전조건** | TSK-05-02 선택 (010-basic-design.md 존재, 020-detail-design.md 예정) |
| **data-testid 셀렉터** | |
| - 문서 패널 | `[data-testid="task-documents-panel"]` |
| - 문서 카드 | `[data-testid="document-card-{index}"]` |
| - 존재하는 문서 | `[data-testid="document-exists-{name}"]` |
| - 예정 문서 | `[data-testid="document-expected-{name}"]` |
| **검증 포인트** | - 문서 카드 2개 표시<br>- 010-basic-design.md: 파란 배경, "열기" 버튼<br>- 020-detail-design.md: 회색 배경, 점선 테두리, "생성 조건: /wf:draft 실행 후 생성" |
| **스크린샷** | `e2e-005-documents.png` |
| **관련 요구사항** | FR-007, FR-008, FR-010, NFR-006 |

#### E2E-006: 문서 클릭하여 뷰어 열기

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 존재하는 문서를 클릭하여 뷰어를 열 수 있다')` |
| **data-testid 셀렉터** | |
| - 문서 열기 버튼 | `[data-testid="open-document-btn-{index}"]` |
| - 문서 뷰어 모달 | `[data-testid="document-viewer-modal"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="open-document-btn-0"]')` |
| 2 | `const modal = page.locator('[data-testid="document-viewer-modal"]')` |
| 3 | `await expect(modal).toBeVisible()` |
| **검증 포인트** | - DocumentViewer 모달 열림<br>- 문서 내용 표시 (마크다운 렌더링)<br>- 문서 제목: "기본설계 (010-basic-design.md)" |
| **스크린샷** | `e2e-006-document-viewer.png` |
| **관련 요구사항** | FR-009 |

#### E2E-007: 이력 타임라인 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('사용자가 상태 변경 이력을 타임라인으로 확인할 수 있다')` |
| **사전조건** | TSK-05-02 선택 (이력 2개: [ ] → [bd], [bd] → [dd]) |
| **data-testid 셀렉터** | |
| - 이력 패널 | `[data-testid="task-history-panel"]` |
| - 타임라인 | `[data-testid="history-timeline"]` |
| - 이력 엔트리 | `[data-testid="history-entry-{index}"]` |
| - 타임스탬프 | `[data-testid="history-timestamp-{index}"]` |
| - 상태 전이 | `[data-testid="history-transition-{index}"]` |
| **검증 포인트** | - 이력 엔트리 2개 표시<br>- 최신 이력이 위에 ([bd] → [dd])<br>- 각 엔트리에 타임스탬프, 상태 전이, 명령어, 문서 생성 정보 표시<br>- PrimeVue Timeline 스타일 적용 |
| **스크린샷** | `e2e-007-history.png` |
| **관련 요구사항** | FR-011, FR-012, FR-013, FR-014, BR-HIST-01 |

#### E2E-008: 요구사항 500자 초과 입력

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('요구사항 500자 초과 입력 시 에러 메시지 표시')` |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="requirement-error-message"]` |
| **실행 단계** | |
| 1 | 편집 모드 활성화 |
| 2 | `await page.fill('[data-testid="requirement-input-0"]', 'a'.repeat(501))` |
| 3 | 저장 시도 |
| **검증 포인트** | - 에러 메시지 표시: "요구사항은 500자 이하여야 합니다"<br>- 저장 실패 (API 호출되지 않음 또는 400 응답) |
| **관련 요구사항** | BR-REQ-01 |

#### E2E-009: 예정 문서 클릭 시도

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections.spec.ts` |
| **테스트명** | `test('예정 문서 클릭 시 뷰어가 열리지 않는다')` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="document-expected-020-detail-design"]')` |
| 2 | `const modal = page.locator('[data-testid="document-viewer-modal"]')` |
| **검증 포인트** | - DocumentViewer 모달이 열리지 않음<br>- cursor: not-allowed 스타일 확인 |
| **관련 요구사항** | BR-DOC-01 |

#### E2E-PERF-01: 섹션 렌더링 성능

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections-perf.spec.ts` |
| **테스트명** | `test('각 섹션이 100ms 이내에 렌더링된다')` |
| **실행 단계** | |
| 1 | `const start = performance.now()` |
| 2 | Task 선택 |
| 3 | 섹션 표시 확인 |
| 4 | `const end = performance.now()` |
| **검증 포인트** | - TaskWorkflow 렌더링 < 100ms<br>- TaskRequirements 렌더링 < 100ms<br>- TaskDocuments 렌더링 < 100ms<br>- TaskHistory 렌더링 < 100ms |
| **관련 요구사항** | NFR-001 |

#### E2E-A11Y-01: 접근성 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/task-detail-sections-a11y.spec.ts` |
| **테스트명** | `test('키보드 네비게이션 및 ARIA 레이블 확인')` |
| **실행 단계** | |
| 1 | Tab 키로 모든 섹션 요소 순회 |
| 2 | Enter/Space로 편집 버튼, 문서 열기 버튼 활성화 |
| 3 | `await page.evaluate(() => { /* axe-core 실행 */ })` |
| **검증 포인트** | - 모든 인터랙티브 요소가 Tab으로 접근 가능<br>- ARIA 레이블 올바르게 설정<br>- axe-core 위반 사항 0개 |
| **관련 요구사항** | NFR-003 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 워크플로우 흐름 시각적 확인 | TSK-05-02 선택 | 1. 워크플로우 섹션 확인 | 노드 스타일 정확, 화살표 표시 | High | FR-001, FR-002, FR-003 |
| TC-002 | 요구사항 목록 확인 | TSK-05-02 선택 | 1. 요구사항 섹션 확인 | 목록 표시, PRD 참조 표시 | High | FR-004, FR-005 |
| TC-003 | 요구사항 인라인 편집 UX | TSK-05-02 선택 | 1. 편집 모드 전환 2. 항목 수정/추가/삭제 | UX 자연스러움, 에러 처리 적절 | High | FR-006 |
| TC-004 | 문서 카드 스타일 확인 | TSK-05-02 선택 | 1. 문서 섹션 확인 | 존재/예정 구분 명확, 아이콘 색상 정확 | Medium | FR-007, FR-008 |
| TC-005 | 문서 열기 UX | 존재하는 문서 클릭 | 1. 문서 카드 클릭 | 뷰어 모달 자연스럽게 열림 | Medium | FR-009 |
| TC-006 | 이력 타임라인 시각적 확인 | 이력 있는 Task | 1. 이력 섹션 확인 | 타임라인 스타일, 정보 표시 정확 | Medium | FR-011~FR-014 |
| TC-007 | 반응형 확인 (1200px+) | - | 1. 브라우저 너비 변경 | 모든 섹션 정상 표시 | Low | NFR 반응형 |
| TC-008 | 색상 일관성 확인 | - | 1. 모든 섹션 확인 | PrimeVue 테마 일관성 | Low | NFR-006 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 워크플로우 흐름 시각적 확인

**테스트 목적**: 워크플로우 노드의 시각적 스타일이 정확하게 표시되는지 확인

**테스트 단계**:
1. WBS 페이지에서 TSK-05-02 선택
2. 우측 상세 패널의 "워크플로우 흐름" 섹션 확인
3. 각 노드의 배경색, 텍스트, 화살표 확인

**예상 결과**:
- 완료 상태 노드([ ]): 초록 배경 (#22c55e), 흰색 텍스트
- 현재 상태 노드([bd]): 파란 배경 (#3b82f6), 흰색 텍스트, 볼드, 약간 큰 크기
- 미완료 상태 노드([dd], [im], [vf], [xx]): 회색 배경 (#e5e7eb), 회색 텍스트, 점선 테두리
- 노드 사이에 → 화살표 표시

**검증 기준**:
- [ ] 노드 개수가 카테고리와 일치 (development: 6개)
- [ ] 현재 상태 노드가 시각적으로 강조됨
- [ ] 화살표가 모든 노드 사이에 표시됨
- [ ] 색상이 디자인 가이드와 일치

#### TC-002: 요구사항 목록 확인

**테스트 목적**: 요구사항 목록과 PRD 참조가 정확하게 표시되는지 확인

**테스트 단계**:
1. TSK-05-02 선택
2. "요구사항" 섹션 확인
3. PRD 참조 링크 클릭 (향후 기능)

**예상 결과**:
- 요구사항 4개가 불릿 포인트로 표시
- PRD 참조: "ref: PRD 6.3.2, 6.3.3, 6.3.4, 6.3.6"
- 편집 버튼이 우측 상단에 표시

**검증 기준**:
- [ ] 요구사항 텍스트가 명확하게 읽힘
- [ ] PRD 참조가 표시됨
- [ ] 편집 버튼이 접근 가능

#### TC-003: 요구사항 인라인 편집 UX

**테스트 목적**: 요구사항 편집 흐름이 직관적이고 자연스러운지 확인

**테스트 단계**:
1. "편집" 버튼 클릭
2. 첫 번째 요구사항 텍스트 수정
3. "추가" 버튼 클릭하여 새 요구사항 입력
4. 두 번째 요구사항 "삭제" 버튼 클릭
5. "저장" 버튼 클릭

**예상 결과**:
- 편집 모드 전환 시 InputText로 변경
- 추가/삭제 버튼이 명확하게 표시
- 저장 후 성공 토스트 메시지
- 변경사항이 즉시 반영됨 (낙관적 업데이트)

**검증 기준**:
- [ ] 편집 모드 UI가 직관적
- [ ] 추가/삭제 동작이 명확
- [ ] 저장 시 피드백이 즉시 제공됨
- [ ] 취소 버튼으로 변경사항 되돌리기 가능

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-TASK-DEV | development 카테고리 Task | `{ id: 'TSK-05-02', category: 'development', status: '[bd]', requirements: ['요구사항1', '요구사항2'] }` |
| MOCK-TASK-DEFECT | defect 카테고리 Task | `{ id: 'TSK-01-01', category: 'defect', status: '[an]' }` |
| MOCK-TASK-INFRA | infrastructure 카테고리 Task | `{ id: 'TSK-02-01', category: 'infrastructure', status: '[im]' }` |
| MOCK-DOC-EXISTS | 존재하는 문서 | `{ name: '010-basic-design.md', exists: true, type: 'design', size: 15500 }` |
| MOCK-DOC-EXPECTED | 예정 문서 | `{ name: '020-detail-design.md', exists: false, type: 'design', expectedAfter: '/wf:draft 실행 후 생성' }` |
| MOCK-HISTORY-TRANSITION | 상태 전이 이력 | `{ timestamp: '2025-12-15T13:12:00Z', action: 'transition', previousStatus: '[bd]', newStatus: '[dd]', command: '/wf:draft', documentCreated: '020-detail-design.md' }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-E2E-TSK-05-02 | TSK-05-02 테스트 환경 | global-setup.ts | - TSK-05-02 (status: [bd])<br>- 요구사항 4개<br>- 문서 2개 (1개 존재, 1개 예정)<br>- 이력 2개 |
| SEED-E2E-HISTORY | 이력 테스트용 | global-setup.ts | - TSK-05-02<br>- 이력 5개 (다양한 action 타입) |

### 5.3 테스트 계정

E2E 테스트는 로그인이 필요 없는 로컬 환경에서 실행됩니다.

---

## 6. data-testid 목록

### 6.1 페이지별 셀렉터

#### WBS 페이지 (Task 선택용)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `wbs-page` | 페이지 컨테이너 | 페이지 로드 확인 |
| `wbs-tree` | WBS 트리 | 트리 렌더링 확인 |
| `task-{id}` | Task 노드 | 특정 Task 선택 (예: `task-TSK-05-02`) |

#### Task 상세 패널 - TaskWorkflow

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-workflow-panel` | 워크플로우 패널 | 섹션 표시 확인 |
| `workflow-nodes` | 노드 리스트 컨테이너 | 노드 렌더링 확인 |
| `workflow-node-{index}` | 개별 노드 | 특정 노드 선택 (0부터 시작) |
| `workflow-node-current` | 현재 상태 노드 | 현재 상태 강조 확인 |

#### Task 상세 패널 - TaskRequirements

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-requirements-panel` | 요구사항 패널 | 섹션 표시 확인 |
| `prd-reference` | PRD 참조 링크 | 참조 표시 확인 |
| `requirements-list` | 요구사항 목록 | 목록 렌더링 확인 |
| `requirement-item-{index}` | 요구사항 항목 (읽기 모드) | 특정 항목 확인 |
| `edit-requirements-btn` | 편집 버튼 | 편집 모드 활성화 |
| `requirement-input-{index}` | 요구사항 입력 (편집 모드) | 항목 수정 |
| `add-requirement-btn` | 추가 버튼 | 항목 추가 |
| `delete-requirement-btn-{index}` | 삭제 버튼 | 항목 삭제 |
| `save-requirements-btn` | 저장 버튼 | 변경사항 저장 |
| `cancel-requirements-btn` | 취소 버튼 | 변경사항 취소 |
| `requirement-error-message` | 에러 메시지 | 유효성 오류 표시 |

#### Task 상세 패널 - TaskDocuments

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-documents-panel` | 문서 패널 | 섹션 표시 확인 |
| `document-card-{index}` | 문서 카드 | 특정 문서 확인 |
| `document-exists-{name}` | 존재하는 문서 카드 | 파일명으로 구분 (예: `document-exists-010-basic-design`) |
| `document-expected-{name}` | 예정 문서 카드 | 파일명으로 구분 |
| `open-document-btn-{index}` | 문서 열기 버튼 | 문서 뷰어 열기 |

#### Task 상세 패널 - TaskHistory

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `task-history-panel` | 이력 패널 | 섹션 표시 확인 |
| `history-timeline` | 타임라인 컨테이너 | 타임라인 렌더링 확인 |
| `history-entry-{index}` | 이력 엔트리 | 특정 이력 확인 (0부터, 최신이 0) |
| `history-timestamp-{index}` | 타임스탬프 | 시간 표시 확인 |
| `history-transition-{index}` | 상태 전이 정보 | 상태 변경 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 80% | 70% |
| Branches | 75% | 65% |
| Functions | 85% | 75% |
| Statements | 80% | 70% |

**주요 커버리지 대상**:
- TaskWorkflow: workflowSteps, currentStepIndex, getNodeStyle computed 및 함수
- TaskRequirements: toggleEdit, addRequirement, removeRequirement, validateRequirement 함수
- TaskDocuments: getDocumentCardStyle, handleOpenDocument 함수
- TaskHistory: sortedHistory, formatHistoryEntry, formatTimestamp computed 및 함수

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 (14개 모두) |
| 비기능 요구사항 (NFR) | 80% 커버 (6개 중 5개) |
| 비즈니스 규칙 (BR) | 100% 커버 (4개 모두) |
| 에러 케이스 | 80% 커버 |

**시나리오 커버리지**:
- 워크플로우 표시: E2E-001 (FR-001, FR-002, FR-003)
- 요구사항 관리: E2E-002, E2E-003, E2E-004 (FR-004, FR-005, FR-006)
- 문서 관리: E2E-005, E2E-006, E2E-009 (FR-007, FR-008, FR-009, FR-010)
- 이력 관리: E2E-007 (FR-011, FR-012, FR-013, FR-014)
- 에러 케이스: E2E-008 (BR-REQ-01), E2E-009 (BR-DOC-01)
- 성능/접근성: E2E-PERF-01 (NFR-001), E2E-A11Y-01 (NFR-003)

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
