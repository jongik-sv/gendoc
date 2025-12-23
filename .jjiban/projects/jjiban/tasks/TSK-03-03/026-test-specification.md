# 테스트 명세: Workflow API & Settings

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Task명 | Workflow API & Settings |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `010-basic-design.md` (섹션 8) |
| 상세설계 | `020-detail-design.md` (섹션 8) |

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 레벨 | 범위 | 도구 | 목표 |
|------|------|------|------|
| **단위 (Unit)** | Service 함수 | Vitest | 80% 커버리지 |
| **통합 (Integration)** | Service + API 라우터 | Vitest + Nuxt | 70% 커버리지 |
| **E2E** | 전체 워크플로우 | Playwright | 주요 시나리오 |
| **성능** | 응답 시간 | Lighthouse / custom | 목표 시간 충족 |

---

### 1.2 테스트 환경

**fixture 프로젝트 사용**:
```
.jjiban/projects/project/
  ├── wbs.md
  ├── project.json
  ├── team.json
  └── tasks/
```

**IMPORTANT**: `.jjiban/jjiban/` 폴더는 테스트에 사용하지 않음

---

## 2. 단위 테스트

### 2.1 TransitionService

**파일**: `tests/utils/workflow/transitionService.spec.ts`

#### TC-001: validateTransition - 유효한 development 전이

```typescript
test('validateTransition: development [ ] → [bd] (start)', () => {
  // Given: development Task with status [ ]
  // When: validateTransition(taskId, 'start')
  // Then: valid = true
})
```

**조건**:
- taskId 형식 valid
- Task 존재함
- 현재 상태: `[ ]`
- 카테고리: development
- 명령어: start

**검증**:
- valid = true
- message = undefined

---

#### TC-002: validateTransition - 불가능한 전이

```typescript
test('validateTransition: cannot transition [vf] → [dd]', () => {
  // Given: Task with status [vf]
  // When: validateTransition(taskId, 'draft')
  // Then: valid = false, message = "Cannot transition..."
})
```

**조건**:
- 현재 상태: `[vf]` (최종 상태)
- 명령어: draft

**검증**:
- valid = false
- message ≠ undefined

---

#### TC-003: validateTransition - 존재하지 않는 Task

```typescript
test('validateTransition: Task not found', () => {
  // Given: Invalid taskId
  // When: validateTransition(taskId, 'start')
  // Then: throws TASK_NOT_FOUND error
})
```

---

#### TC-004: getAvailableCommands - development

```typescript
test('getAvailableCommands: development [ ]', () => {
  // Given: development Task with status [ ]
  // When: getAvailableCommands(taskId)
  // Then: commands = ['start']
})
```

**TC-004-1**: `[ ]` → ['start']
**TC-004-2**: `[bd]` → ['draft']
**TC-004-3**: `[dd]` → ['build']
**TC-004-4**: `[im]` → ['verify']
**TC-004-5**: `[vf]` → ['done']
**TC-004-6**: `[xx]` → []

---

#### TC-005: getAvailableCommands - defect

```typescript
test('getAvailableCommands: defect workflow', () => {
  // Given: defect Task with status [an]
  // When: getAvailableCommands(taskId)
  // Then: commands = ['fix']
})
```

**TC-005-1**: `[ ]` → ['start']
**TC-005-2**: `[an]` → ['fix']
**TC-005-3**: `[fx]` → ['verify']
**TC-005-4**: `[vf]` → ['done']

---

#### TC-006: getAvailableCommands - infrastructure

```typescript
test('getAvailableCommands: infrastructure workflow', () => {
  // Given: infrastructure Task with status [ ]
  // When: getAvailableCommands(taskId)
  // Then: commands = ['start', 'skip']
})
```

**TC-006-1**: `[ ]` → ['start', 'skip']
**TC-006-2**: `[im]` → ['done']

---

#### TC-007: executeTransition - 성공 (문서 생성 없음)

```typescript
test('executeTransition: success without document', () => {
  // Given: Task status [vf], command 'done'
  // When: executeTransition(taskId, 'done')
  // Then:
  //   - success = true
  //   - newStatus = [xx]
  //   - documentCreated = undefined
  //   - wbs.md updated
})
```

---

#### TC-008: executeTransition - 성공 (문서 생성)

```typescript
test('executeTransition: success with document creation', () => {
  // Given: Task status [ ], command 'start'
  // When: executeTransition(taskId, 'start')
  // Then:
  //   - success = true
  //   - newStatus = [bd]
  //   - documentCreated = '010-basic-design.md'
  //   - file created
  //   - wbs.md updated
})
```

**검증**:
- 파일 시스템에 문서 생성 확인
- wbs.md의 Task 상태 업데이트 확인

---

#### TC-009: executeTransition - 실패 (불가능한 전이)

```typescript
test('executeTransition: fails on invalid transition', () => {
  // Given: Task status [bd], command 'done'
  // When: executeTransition(taskId, 'done')
  // Then: throws INVALID_TRANSITION error, wbs.md unchanged
})
```

---

#### TC-010: executeTransition - 실패 (파일 저장 오류)

```typescript
test('executeTransition: fails on file write error', () => {
  // Given: File system read-only or permission denied
  // When: executeTransition(taskId, 'start')
  // Then: throws FILE_WRITE_ERROR, state unchanged
})
```

---

### 2.2 DocumentService

**파일**: `tests/utils/workflow/documentService.spec.ts`

#### TC-011: getExistingDocuments - 존재 문서 조회

```typescript
test('getExistingDocuments: returns .md files', () => {
  // Given: Task folder with 2 .md files
  // When: getExistingDocuments(projectId, taskId)
  // Then:
  //   - documents.length = 2
  //   - all exists = true
  //   - all have size, createdAt, updatedAt
})
```

---

#### TC-012: getExistingDocuments - 폴더 없음

```typescript
test('getExistingDocuments: empty when folder not found', () => {
  // Given: Task folder does not exist
  // When: getExistingDocuments(projectId, taskId)
  // Then: documents = []
})
```

---

#### TC-013: getExpectedDocuments - 예정 문서 조회

```typescript
test('getExpectedDocuments: returns workflow-based docs', () => {
  // Given: Task status [bd], development category
  // When: getExpectedDocuments(projectId, taskId, '[bd]')
  // Then:
  //   - includes 020-detail-design.md with stage='expected'
  //   - includes command='draft'
  //   - exists = false
})
```

---

#### TC-014: getTaskDocuments - 병합 조회

```typescript
test('getTaskDocuments: merges existing and expected', () => {
  // Given: Task with 1 existing + 2 expected docs
  // When: getTaskDocuments(projectId, taskId)
  // Then:
  //   - documents.length = 3
  //   - sorted by stage (current first)
  //   - no duplicates
})
```

---

#### TC-015: getTaskDocuments - 문서 타입 분류

```typescript
test('getTaskDocuments: classifies document types', () => {
  // Given: files with different naming patterns
  // When: getTaskDocuments(projectId, taskId)
  // Then: type assigned correctly
  //   - 010-*.md → design
  //   - 020-*.md → design
  //   - 030-*.md → implementation
  //   - 070-*.md → test
  //   - 080-*.md → manual
})
```

---

### 2.3 SettingsService (기존 확인)

**파일**: `tests/utils/settings/index.spec.ts` (기존, 확인만)

#### TC-016: getSettingsByType - columns

```typescript
test('getSettingsByType: returns columns config', () => {
  // Given: settings/columns.json exists
  // When: getSettingsByType('columns')
  // Then: returns ColumnsConfig with version, columns[]
})
```

---

#### TC-017: getSettingsByType - workflows

```typescript
test('getSettingsByType: returns workflows config', () => {
  // Given: settings/workflows.json exists
  // When: getSettingsByType('workflows')
  // Then: returns WorkflowsConfig with workflows[]
})
```

---

#### TC-018: isValidSettingsType - 유효한 타입

```typescript
test('isValidSettingsType: returns true for valid types', () => {
  expect(isValidSettingsType('columns')).toBe(true)
  expect(isValidSettingsType('categories')).toBe(true)
  expect(isValidSettingsType('workflows')).toBe(true)
  expect(isValidSettingsType('actions')).toBe(true)
})
```

---

#### TC-019: isValidSettingsType - 무효한 타입

```typescript
test('isValidSettingsType: returns false for invalid types', () => {
  expect(isValidSettingsType('invalid')).toBe(false)
  expect(isValidSettingsType('settings')).toBe(false)
  expect(isValidSettingsType('')).toBe(false)
})
```

---

## 3. 통합 테스트

### 3.1 API 라우터 + Service

**파일**: `tests/api/tasks/transition.spec.ts`

#### TC-020: POST /api/tasks/:id/transition - 정상 요청

```typescript
test('POST /api/tasks/:id/transition - success', async () => {
  // Given: Valid task, valid command
  // When: POST /api/tasks/TSK-01-01-01/transition
  //       { command: 'start' }
  // Then:
  //   - status = 201
  //   - response.success = true
  //   - response.newStatus = '[bd]'
})
```

---

#### TC-021: POST /api/tasks/:id/transition - 명령어 누락

```typescript
test('POST /api/tasks/:id/transition - missing command', async () => {
  // Given: Request without command
  // When: POST /api/tasks/TSK-01-01-01/transition
  //       {}
  // Then:
  //   - status = 400
  //   - error = 'INVALID_COMMAND'
})
```

---

#### TC-022: POST /api/tasks/:id/transition - Task 없음

```typescript
test('POST /api/tasks/:id/transition - Task not found', async () => {
  // Given: Invalid taskId
  // When: POST /api/tasks/INVALID/transition
  //       { command: 'start' }
  // Then:
  //   - status = 404
  //   - error = 'TASK_NOT_FOUND'
})
```

---

#### TC-023: POST /api/tasks/:id/transition - 불가능한 전이

```typescript
test('POST /api/tasks/:id/transition - invalid transition', async () => {
  // Given: Task in [bd] state
  // When: POST /api/tasks/TSK-01-01-01/transition
  //       { command: 'done' }
  // Then:
  //   - status = 409
  //   - error = 'INVALID_TRANSITION'
})
```

---

### 3.2 문서 API 라우터

**파일**: `tests/api/tasks/documents.spec.ts`

#### TC-024: GET /api/tasks/:id/documents - 정상 요청

```typescript
test('GET /api/tasks/:id/documents - success', async () => {
  // Given: Valid task with documents
  // When: GET /api/tasks/TSK-01-01-01/documents
  // Then:
  //   - status = 200
  //   - response.taskId = 'TSK-01-01-01'
  //   - response.documents is array
})
```

---

#### TC-025: GET /api/tasks/:id/documents - Task 없음

```typescript
test('GET /api/tasks/:id/documents - Task not found', async () => {
  // Given: Invalid taskId
  // When: GET /api/tasks/INVALID/documents
  // Then:
  //   - status = 404
  //   - error = 'TASK_NOT_FOUND'
})
```

---

### 3.3 설정 API 라우터 (기존 확인)

**파일**: `tests/api/settings/index.spec.ts` (기존)

#### TC-026: GET /api/settings/:type - 정상 요청

```typescript
test('GET /api/settings/columns - success', async () => {
  // When: GET /api/settings/columns
  // Then:
  //   - status = 200
  //   - response.version exists
  //   - response.columns is array
})
```

---

#### TC-027: GET /api/settings/:type - 무효한 타입

```typescript
test('GET /api/settings/invalid - invalid type', async () => {
  // When: GET /api/settings/invalid
  // Then:
  //   - status = 400
  //   - error = 'INVALID_SETTINGS_TYPE'
})
```

---

## 4. E2E 테스트

### 4.1 전체 워크플로우 (Playwright)

**파일**: `tests/e2e/workflow.spec.ts`

#### TC-028: 전체 워크플로우: development Task 진행

```typescript
test('complete development workflow: start → draft → build → verify → done', async () => {
  // Scenario:
  // 1. Create Task (status: [ ])
  // 2. POST /transition { command: 'start' } → [bd]
  // 3. POST /transition { command: 'draft' } → [dd]
  // 4. POST /transition { command: 'build' } → [im]
  // 5. POST /transition { command: 'verify' } → [vf]
  // 6. POST /transition { command: 'done' } → [xx]

  // Verify:
  // - Each transition succeeds
  // - Documents created at each step
  // - GET /documents returns updated lists
  // - wbs.md shows final state [xx]
})
```

---

#### TC-029: defect Task 워크플로우

```typescript
test('complete defect workflow: start → analyze → fix → verify → done', async () => {
  // Scenario:
  // 1. Create defect Task (status: [ ])
  // 2. POST /transition { command: 'start' } → [an]
  // 3. POST /transition { command: 'fix' } → [fx]
  // 4. POST /transition { command: 'verify' } → [vf]
  // 5. POST /transition { command: 'done' } → [xx]

  // Verify:
  // - Transitions succeed
  // - wbs.md shows final state [xx]
})
```

---

#### TC-030: infrastructure Task 스킵

```typescript
test('infrastructure task skip workflow: [ ] → [xx]', async () => {
  // Scenario:
  // 1. Create infrastructure Task
  // 2. POST /transition { command: 'skip' } → [xx]

  // Verify:
  // - success = true
  // - newStatus = '[xx]'
})
```

---

#### TC-031: 동시 전이 요청 (Race condition)

```typescript
test('concurrent transitions: handle race condition', async () => {
  // Scenario:
  // 1. Create Task (status: [ ])
  // 2. Simultaneously:
  //    - POST /transition { command: 'start' }
  //    - POST /transition { command: 'start' }

  // Verify:
  // - Only one succeeds
  // - Other fails with conflict
  // - wbs.md reflects only successful transition
})
```

---

#### TC-032: 문서 자동 생성 검증

```typescript
test('documents auto-created on transition', async () => {
  // Scenario:
  // 1. Create Task
  // 2. POST /transition { command: 'start' }
  // 3. GET /documents
  // 4. Check file system

  // Verify:
  // - 010-basic-design.md created
  // - Listed in documents response
  // - File readable and valid
})
```

---

## 5. 성능 테스트

### 5.1 응답 시간 측정

**파일**: `tests/performance/workflow.spec.ts`

#### TC-033: POST /transition 응답 시간

```typescript
test('POST /transition response time < 500ms', async () => {
  const start = Date.now()
  const response = await fetch('/api/tasks/TSK-01-01-01/transition', {
    method: 'POST',
    body: JSON.stringify({ command: 'start' })
  })
  const duration = Date.now() - start

  expect(duration).toBeLessThan(500)
})
```

**목표**: < 500ms (wbs.md 저장 포함)

---

#### TC-034: GET /documents 응답 시간

```typescript
test('GET /documents response time < 200ms', async () => {
  const start = Date.now()
  const response = await fetch('/api/tasks/TSK-01-01-01/documents')
  const duration = Date.now() - start

  expect(duration).toBeLessThan(200)
})
```

**목표**: < 200ms (파일 시스템 스캔)

---

#### TC-035: GET /settings 응답 시간

```typescript
test('GET /settings response time < 50ms (cached)', async () => {
  const start = Date.now()
  const response = await fetch('/api/settings/workflows')
  const duration = Date.now() - start

  expect(duration).toBeLessThan(50)
})
```

**목표**: < 50ms (캐시)

---

## 6. 테스트 데이터

### 6.1 fixture 프로젝트 설정

**경로**: `.jjiban/projects/project/`

**필수 파일**:

```
project.json:
{
  "id": "project",
  "name": "Test Project",
  "wbsDepth": 4,
  "createdAt": "2025-12-14"
}

team.json:
{
  "members": [
    { "id": "dev1", "name": "Developer 1" }
  ]
}

wbs.md:
# WBS - Test Project
> version: 1.0
> depth: 4
> updated: 2025-12-14
> start: 2025-12-14

## WP-01: Test Work Package
### ACT-01-01: Test Activity
#### TSK-01-01-01: Development Test Task
- category: development
- status: [ ]
- priority: high
- ...

#### TSK-01-01-02: Defect Test Task
- category: defect
- status: [ ]
- ...

#### TSK-01-01-03: Infrastructure Test Task
- category: infrastructure
- status: [ ]
- ...
```

---

### 6.2 fixture 세팅 (setup)

```typescript
// tests/setup/workflow.fixture.ts
beforeEach(async () => {
  // 1. fixture 프로젝트 복사
  await copyFixtureProject()

  // 2. 설정 파일 검증
  await validateSettingsFiles()

  // 3. WBS 파싱 확인
  const wbs = await getWbsTree('project')
  expect(wbs.tree.length).toBeGreaterThan(0)
})

afterEach(async () => {
  // fixture 정리
  await cleanupFixtureProject()
})
```

---

## 7. 테스트 커버리지 목표

### 7.1 커버리지 기준

| 모듈 | 라인 | 분기 | 함수 | 명시문 |
|------|------|------|------|--------|
| TransitionService | 90% | 85% | 95% | - |
| DocumentService | 85% | 80% | 90% | - |
| HistoryService | 80% | 75% | 90% | - |
| API Routes | 80% | 70% | 85% | - |
| **Total** | **80%** | **75%** | **90%** | - |

---

### 7.2 측정 방법

```bash
# Vitest coverage 리포트 생성
npm run test:coverage

# CI/CD에서 자동 검증
# 기준 미달 시 빌드 실패
```

---

## 8. 테스트 실행 계획

### 8.1 로컬 개발

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# 모든 테스트
npm run test

# 특정 파일
npm run test -- transitionService.spec.ts
```

---

### 8.2 CI/CD 파이프라인

```yaml
# .github/workflows/test.yml
- name: Unit Tests
  run: npm run test:unit -- --coverage

- name: Integration Tests
  run: npm run test:integration

- name: E2E Tests
  run: npm run test:e2e -- --headed

- name: Performance Tests
  run: npm run test:performance

- name: Coverage Report
  run: npm run test:coverage
  if: always()
```

---

## 9. 테스트 체크리스트

### 9.1 구현 전 체크

- [ ] fixture 프로젝트 설정
- [ ] 테스트 데이터 준비
- [ ] Mock/Stub 전략 수립
- [ ] 설정 파일 검증

### 9.2 단위 테스트 완료

- [ ] TransitionService: 10 TC (TC-001~010)
- [ ] DocumentService: 5 TC (TC-011~015)
- [ ] SettingsService: 4 TC (TC-016~019)

### 9.3 통합 테스트 완료

- [ ] Transition API: 4 TC (TC-020~023)
- [ ] Documents API: 2 TC (TC-024~025)
- [ ] Settings API: 2 TC (TC-026~027)

### 9.4 E2E 테스트 완료

- [ ] 전체 워크플로우: 5 TC (TC-028~032)

### 9.5 성능 테스트 완료

- [ ] 응답 시간 측정: 3 TC (TC-033~035)

---

## 10. 테스트 리뷰 기준

| 항목 | 기준 | 평가 |
|------|------|------|
| **커버리지** | >= 80% | - |
| **성공률** | 100% | - |
| **응답시간** | < 목표값 | - |
| **E2E** | 주요 시나리오 통과 | - |

---

**문서 버전**: 1.0.0
