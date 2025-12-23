# 테스트 명세 (Test Specification)

**Task ID:** TSK-03-02 — **Task명:** WBS API
**작성일:** 2025-12-14 — **작성자:** Claude Code

---

## 1. 목적

본 문서는 TSK-03-02 (WBS API)의 테스트 계획, 테스트 시나리오, 테스트 케이스를 정의합니다.

---

## 2. 테스트 전략

### 2.1 테스트 레벨

| 테스트 레벨 | 범위 | 도구 | 목표 커버리지 |
|-----------|------|------|--------------|
| 단위 테스트 | 개별 함수/메서드 | Vitest | >= 80% |
| E2E 테스트 | API 엔드포인트 | Playwright | 100% (주요 경로) |
| 성능 테스트 | WBS 조회/저장 | Playwright | NFR-001 충족 |

### 2.2 테스트 우선순위

| 우선순위 | 설명 | 테스트 영역 |
|---------|------|-----------|
| P0 (Critical) | 핵심 기능, 데이터 무결성 | WBS 조회/저장, Task 수정 |
| P1 (High) | 비즈니스 규칙, 에러 처리 | 유효성 검증, 롤백, 이력 기록 |
| P2 (Medium) | 엣지 케이스, 성능 | 빈 데이터, 대용량, 동시성 |
| P3 (Low) | UI 편의성, 최적화 | 응답 시간, 메시지 품질 |

---

## 3. 단위 테스트 (Unit Tests)

### 3.1 UT-WBS-01: WBS 조회 성공

**목적**: WbsService.getWbsTree()가 wbs.md를 파싱하여 트리를 반환하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-WBS-01 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-001 |
| **테스트 대상** | WbsService.getWbsTree() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-WBS-01-01 | 유효한 wbs.md (4단계) | metadata.depth=4, tree 배열 반환 | 정상 케이스 |
| UT-WBS-01-02 | 유효한 wbs.md (3단계) | metadata.depth=3, tree 배열 반환 | 정상 케이스 |
| UT-WBS-01-03 | 빈 wbs.md (메타데이터만) | tree=[] 반환 | 엣지 케이스 |
| UT-WBS-01-04 | wbs.md 없음 | PROJECT_NOT_FOUND 에러 | 에러 케이스 |
| UT-WBS-01-05 | 잘못된 Markdown 형식 | PARSE_ERROR 에러 | 에러 케이스 |

**테스트 데이터**:
```typescript
// Fixture: tests/fixtures/wbs/valid-4-level.md
// Fixture: tests/fixtures/wbs/valid-3-level.md
// Fixture: tests/fixtures/wbs/empty.md
```

---

### 3.2 UT-WBS-02: WBS 저장 성공 및 백업/롤백

**목적**: WbsService.saveWbsTree()가 WBS를 저장하고 실패 시 롤백하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-WBS-02 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-002, BR-004 |
| **테스트 대상** | WbsService.saveWbsTree() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-WBS-02-01 | 유효한 WbsNode[] | wbs.md 저장 성공, { success: true } | 정상 케이스 |
| UT-WBS-02-02 | 유효한 WbsNode[] | wbs.md.bak 생성 확인 | 백업 검증 |
| UT-WBS-02-03 | 유효한 WbsNode[] | 저장 후 wbs.md.bak 삭제 확인 | 백업 정리 |
| UT-WBS-02-04 | 쓰기 실패 시뮬레이션 | wbs.md.bak으로 복구, FILE_WRITE_ERROR | 롤백 검증 |
| UT-WBS-02-05 | 유효성 검증 실패 | VALIDATION_ERROR, 파일 변경 없음 | 에러 케이스 |

**테스트 데이터**:
```typescript
// Mock: fs.writeFile() 실패 시뮬레이션
// Fixture: tests/fixtures/wbs/valid-tree.json
```

---

### 3.3 UT-WBS-03: updated 필드 자동 갱신

**목적**: WBS 저장 시 updated 필드가 현재 날짜로 갱신되는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-WBS-03 |
| **우선순위** | P1 (High) |
| **요구사항** | BR-006 |
| **테스트 대상** | WbsService.saveWbsTree() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-WBS-03-01 | metadata.updated="2025-12-13" | 저장 후 updated="2025-12-14" (현재 날짜) | 자동 갱신 |
| UT-WBS-03-02 | metadata.updated 누락 | 저장 후 updated=현재 날짜 | 초기화 |

---

### 3.4 UT-TASK-01: Task 상세 조회

**목적**: TaskService.getTaskDetail()이 Task 정보, 문서 목록, 이력을 반환하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-TASK-01 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-003 |
| **테스트 대상** | TaskService.getTaskDetail() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-TASK-01-01 | 존재하는 Task ID | TaskDetail 객체 반환 (id, title, ...) | 정상 케이스 |
| UT-TASK-01-02 | 존재하는 Task ID | documents 배열 포함 (DocumentInfo[]) | 문서 목록 |
| UT-TASK-01-03 | 존재하는 Task ID | history 배열 포함 (HistoryEntry[]) | 이력 포함 |
| UT-TASK-01-04 | 존재하는 Task ID | assignee 정보 포함 (TeamMember) | 팀원 매핑 |
| UT-TASK-01-05 | 존재하지 않는 Task ID | TASK_NOT_FOUND 에러 | 에러 케이스 |

**테스트 데이터**:
```typescript
// Fixture: tests/fixtures/projects/project/wbs.md
// Fixture: tests/fixtures/projects/project/team.json
// Fixture: tests/fixtures/projects/project/tasks/TSK-01-01/history.json
```

---

### 3.5 UT-TASK-02: Task 정보 수정

**목적**: TaskService.updateTask()가 Task 속성을 수정하고 wbs.md를 업데이트하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-TASK-02 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-004 |
| **테스트 대상** | TaskService.updateTask() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-TASK-02-01 | { title: "New Title" } | task.title 변경, wbs.md 저장 | 제목 수정 |
| UT-TASK-02-02 | { priority: "high" } | task.priority 변경, wbs.md 저장 | 우선순위 수정 |
| UT-TASK-02-03 | { assignee: "dev-001" } | task.assignee 변경, wbs.md 저장 | 담당자 수정 |
| UT-TASK-02-04 | 존재하지 않는 Task ID | TASK_NOT_FOUND 에러 | 에러 케이스 |
| UT-TASK-02-05 | 유효하지 않은 priority | VALIDATION_ERROR 에러 | 에러 케이스 |

---

### 3.6 UT-TASK-03: Task 이력 기록

**목적**: Task 수정 시 이력이 기록되는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-TASK-03 |
| **우선순위** | P1 (High) |
| **요구사항** | FR-006, BR-005 |
| **테스트 대상** | TaskService.updateTask() |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-TASK-03-01 | { title: "New Title" } | history.json에 새 엔트리 추가 | 이력 기록 |
| UT-TASK-03-02 | 이력 확인 | { action: "update", from: "Old", to: "New" } | 엔트리 내용 |
| UT-TASK-03-03 | 이력 확인 | timestamp가 ISO 8601 형식 | 날짜 형식 |

---

### 3.7 UT-PROGRESS-01: 진행률 자동 계산

**목적**: calculateProgress()가 하위 Task 기반으로 진행률을 계산하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | UT-PROGRESS-01 |
| **우선순위** | P1 (High) |
| **요구사항** | FR-005, BR-003 |
| **테스트 대상** | calculateProgress() (기존) |

**테스트 케이스**:

| Case ID | 입력 | 기대 결과 | 비고 |
|---------|------|----------|------|
| UT-PROGRESS-01-01 | 모든 Task done | progress=100 | 완료 상태 |
| UT-PROGRESS-01-02 | Task 0개 | progress=0 | 빈 노드 |
| UT-PROGRESS-01-03 | 50% Task done | progress=50 | 진행 중 |
| UT-PROGRESS-01-04 | 중첩 트리 (WP > ACT > Task) | 재귀 계산 올바름 | 계층 검증 |

**테스트 데이터**:
```typescript
// Fixture: tests/fixtures/wbs/progress-test-tree.json
```

---

## 4. E2E 테스트 (End-to-End Tests)

### 4.1 E2E-WBS-01: GET /api/projects/:id/wbs

**목적**: WBS 조회 API가 정상 작동하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-WBS-01 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-001 |
| **엔드포인트** | GET /api/projects/:id/wbs |

**테스트 시나리오**:

1. 프로젝트 생성 (테스트 데이터 준비)
2. GET /api/projects/project/wbs 호출
3. 응답 검증:
   - 상태 코드: 200
   - metadata.version: "1.0"
   - metadata.depth: 4
   - tree: WbsNode[] 배열
   - tree[0].type: "wp"

**테스트 데이터**:
```typescript
// Fixture: tests/fixtures/projects/project/wbs.md
```

**Playwright 코드 스니펫**:
```typescript
test('E2E-WBS-01: WBS 조회 성공', async ({ request }) => {
  const response = await request.get('/api/projects/project/wbs');
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.metadata.version).toBe('1.0');
  expect(data.metadata.depth).toBe(4);
  expect(data.tree).toBeInstanceOf(Array);
});
```

---

### 4.2 E2E-WBS-02: PUT /api/projects/:id/wbs (동시성 제어)

**목적**: WBS 저장 API가 정상 작동하고 동시성 충돌을 감지하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-WBS-02 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-002, NFR-003, BR-006 |
| **엔드포인트** | PUT /api/projects/:id/wbs |

**테스트 시나리오**:

**시나리오 1: 저장 성공**
1. GET /api/projects/project/wbs로 현재 WBS 조회
2. tree[0].title 수정
3. PUT /api/projects/project/wbs로 저장
4. 응답 검증:
   - 상태 코드: 200
   - success: true
   - updated: 현재 날짜
5. GET /api/projects/project/wbs로 재조회하여 변경 확인

**시나리오 2: 동시성 충돌**
1. GET /api/projects/project/wbs로 현재 WBS 조회
2. metadata.updated를 과거 날짜로 변경
3. PUT /api/projects/project/wbs로 저장 시도
4. 응답 검증:
   - 상태 코드: 409
   - statusMessage: CONFLICT_ERROR

**Playwright 코드 스니펫**:
```typescript
test('E2E-WBS-02-01: WBS 저장 성공', async ({ request }) => {
  // 조회
  let response = await request.get('/api/projects/project/wbs');
  const data = await response.json();

  // 수정
  data.tree[0].title = 'Modified Title';

  // 저장
  response = await request.put('/api/projects/project/wbs', { data });
  expect(response.status()).toBe(200);

  const result = await response.json();
  expect(result.success).toBe(true);
  expect(result.updated).toBeTruthy();
});

test('E2E-WBS-02-02: 동시성 충돌', async ({ request }) => {
  let response = await request.get('/api/projects/project/wbs');
  const data = await response.json();

  // 과거 날짜로 변경
  data.metadata.updated = '2025-12-01';

  response = await request.put('/api/projects/project/wbs', { data });
  expect(response.status()).toBe(409);
});
```

---

### 4.3 E2E-WBS-03: 백업/롤백 메커니즘

**목적**: WBS 저장 실패 시 백업으로 롤백되는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-WBS-03 |
| **우선순위** | P1 (High) |
| **요구사항** | BR-004 |
| **엔드포인트** | PUT /api/projects/:id/wbs |

**테스트 시나리오**:

1. 현재 wbs.md 내용 저장 (originalContent)
2. 잘못된 데이터로 PUT 시도 (유효성 검증 실패)
3. 파일 시스템에서 wbs.md 읽기
4. 검증: wbs.md 내용이 originalContent와 동일
5. 검증: wbs.md.bak 파일이 존재하지 않음 (정리됨)

---

### 4.4 E2E-WBS-04: 유효성 검증 (중복 ID)

**목적**: 중복 Task ID 저장 시 에러가 발생하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-WBS-04 |
| **우선순위** | P1 (High) |
| **요구사항** | BR-002 |
| **엔드포인트** | PUT /api/projects/:id/wbs |

**테스트 시나리오**:

1. GET /api/projects/project/wbs로 현재 WBS 조회
2. tree에 중복 ID를 가진 Task 추가
3. PUT /api/projects/project/wbs로 저장 시도
4. 응답 검증:
   - 상태 코드: 400
   - statusMessage: VALIDATION_ERROR
   - message: "중복된 ID가 있습니다"

---

### 4.5 E2E-WBS-05: 데이터 무결성

**목적**: WBS 저장 후 파싱하여 손실 없이 복원되는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-WBS-05 |
| **우선순위** | P0 (Critical) |
| **요구사항** | NFR-002 |
| **엔드포인트** | GET/PUT /api/projects/:id/wbs |

**테스트 시나리오**:

1. 복잡한 WBS 트리 생성 (모든 속성 포함)
2. PUT /api/projects/project/wbs로 저장
3. GET /api/projects/project/wbs로 재조회
4. 검증: 저장 전 tree와 조회 후 tree가 동일 (deep equal)

---

### 4.6 E2E-TASK-01: GET /api/tasks/:id

**목적**: Task 상세 조회 API가 정상 작동하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-TASK-01 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-003 |
| **엔드포인트** | GET /api/tasks/:id |

**테스트 시나리오**:

1. 테스트 프로젝트 준비 (wbs.md, team.json, tasks/{id}/ 폴더)
2. GET /api/tasks/TSK-01-01 호출
3. 응답 검증:
   - 상태 코드: 200
   - id: "TSK-01-01"
   - title: Task 제목
   - documents: DocumentInfo[] (파일 목록)
   - history: HistoryEntry[] (이력)
   - availableActions: String[] (가능한 액션)
   - assignee: TeamMember 또는 null

**Playwright 코드 스니펫**:
```typescript
test('E2E-TASK-01: Task 조회 성공', async ({ request }) => {
  const response = await request.get('/api/tasks/TSK-01-01');
  expect(response.status()).toBe(200);

  const task = await response.json();
  expect(task.id).toBe('TSK-01-01');
  expect(task.documents).toBeInstanceOf(Array);
  expect(task.history).toBeInstanceOf(Array);
  expect(task.availableActions).toBeInstanceOf(Array);
});
```

---

### 4.7 E2E-TASK-02: PUT /api/tasks/:id (이력 기록 포함)

**목적**: Task 수정 API가 정상 작동하고 이력을 기록하는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-TASK-02 |
| **우선순위** | P0 (Critical) |
| **요구사항** | FR-004, BR-005 |
| **엔드포인트** | PUT /api/tasks/:id |

**테스트 시나리오**:

1. GET /api/tasks/TSK-01-01로 현재 상태 조회
2. PUT /api/tasks/TSK-01-01로 title 수정
3. 응답 검증:
   - 상태 코드: 200
   - success: true
   - task.title: 새 제목
4. GET /api/tasks/TSK-01-01로 재조회
5. 이력 검증:
   - history[0].action: "update"
   - history[0].from: 이전 제목
   - history[0].to: 새 제목
   - history[0].timestamp: ISO 8601 형식

**Playwright 코드 스니펫**:
```typescript
test('E2E-TASK-02: Task 수정 및 이력 기록', async ({ request }) => {
  // 조회
  let response = await request.get('/api/tasks/TSK-01-01');
  const task = await response.json();
  const oldTitle = task.title;

  // 수정
  response = await request.put('/api/tasks/TSK-01-01', {
    data: { title: 'New Title' }
  });
  expect(response.status()).toBe(200);

  // 재조회
  response = await request.get('/api/tasks/TSK-01-01');
  const updatedTask = await response.json();

  expect(updatedTask.title).toBe('New Title');
  expect(updatedTask.history[0].action).toBe('update');
  expect(updatedTask.history[0].from).toBe(oldTitle);
  expect(updatedTask.history[0].to).toBe('New Title');
});
```

---

### 4.8 E2E-PERF-01: 성능 테스트 (1000 노드)

**목적**: 1000개 노드 WBS 조회가 500ms 이내에 완료되는지 검증

| 항목 | 내용 |
|------|------|
| **테스트 ID** | E2E-PERF-01 |
| **우선순위** | P2 (Medium) |
| **요구사항** | NFR-001 |
| **엔드포인트** | GET /api/projects/:id/wbs |

**테스트 시나리오**:

1. 1000개 노드를 가진 wbs.md 생성
2. GET /api/projects/project-large/wbs 호출
3. 응답 시간 측정
4. 검증: 응답 시간 < 500ms

**Playwright 코드 스니펫**:
```typescript
test('E2E-PERF-01: 대용량 WBS 조회 성능', async ({ request }) => {
  const startTime = Date.now();
  const response = await request.get('/api/projects/project-large/wbs');
  const endTime = Date.now();

  expect(response.status()).toBe(200);
  expect(endTime - startTime).toBeLessThan(500);
});
```

---

## 5. 테스트 데이터 (Fixtures)

### 5.1 파일 구조

```
tests/
├── fixtures/
│   ├── settings/
│   │   └── projects.json          # 테스트 프로젝트 목록
│   └── projects/
│       ├── project/                # 기본 테스트 프로젝트
│       │   ├── project.json
│       │   ├── team.json
│       │   ├── wbs.md              # 4단계 WBS
│       │   └── tasks/
│       │       └── TSK-01-01/
│       │           ├── 010-basic-design.md
│       │           └── history.json
│       └── project-large/          # 성능 테스트용 (1000 노드)
│           └── wbs.md
```

### 5.2 Fixture: team.json

```json
{
  "version": "1.0",
  "members": [
    {
      "id": "dev-001",
      "name": "Developer 1",
      "role": "Backend Developer",
      "email": "dev1@example.com"
    },
    {
      "id": "dev-002",
      "name": "Developer 2",
      "role": "Frontend Developer",
      "email": "dev2@example.com"
    }
  ]
}
```

### 5.3 Fixture: history.json

```json
[
  {
    "timestamp": "2025-12-14T10:30:00Z",
    "action": "status_change",
    "from": "[ ]",
    "to": "[bd]",
    "user": null
  },
  {
    "timestamp": "2025-12-14T14:00:00Z",
    "action": "update",
    "from": "Basic Design",
    "to": "Detailed Design",
    "user": null
  }
]
```

### 5.4 Fixture: wbs.md (샘플)

```markdown
# WBS - Test Project

> version: 1.0
> depth: 4
> updated: 2025-12-14
> start: 2025-12-13

---

## WP-01: Test Work Package
- status: planned
- priority: high
- schedule: 2025-12-13 ~ 2025-12-20

### ACT-01-01: Test Activity
- status: todo

#### TSK-01-01: Test Task
- category: development
- status: basic-design [bd]
- priority: critical
- assignee: dev-001
- schedule: 2025-12-13 ~ 2025-12-14
- requirements:
  - Requirement 1
  - Requirement 2
- tags: test, unit
```

---

## 6. 테스트 실행 계획

### 6.1 실행 순서

1. **단위 테스트 (Vitest)**:
   ```bash
   npm run test:unit
   ```
   - UT-WBS-01, UT-WBS-02, UT-WBS-03
   - UT-TASK-01, UT-TASK-02, UT-TASK-03
   - UT-PROGRESS-01

2. **E2E 테스트 (Playwright)**:
   ```bash
   npm run test:e2e
   ```
   - E2E-WBS-01, E2E-WBS-02, E2E-WBS-03, E2E-WBS-04, E2E-WBS-05
   - E2E-TASK-01, E2E-TASK-02
   - E2E-PERF-01

3. **커버리지 리포트**:
   ```bash
   npm run test:coverage
   ```
   - 목표: >= 80%

### 6.2 CI/CD 통합

- GitHub Actions 또는 GitLab CI에서 자동 실행
- Pull Request 시 테스트 통과 필수
- 커버리지 리포트 자동 생성

---

## 7. 수용 기준 (Acceptance Criteria)

| AC ID | 기준 | 테스트 ID | 상태 |
|-------|------|-----------|------|
| AC-01 | GET /api/projects/:id/wbs가 올바른 트리 구조와 진행률을 반환한다 | E2E-WBS-01 | 대기 |
| AC-02 | PUT /api/projects/:id/wbs가 wbs.md를 정확하게 업데이트한다 | E2E-WBS-02 | 대기 |
| AC-03 | Task ID 중복 시 유효성 검증 에러가 발생한다 | E2E-WBS-04 | 대기 |
| AC-04 | WBS 저장 실패 시 원본 파일이 유지된다 (백업 복구) | E2E-WBS-03 | 대기 |
| AC-05 | GET /api/tasks/:id가 Task 상세 정보와 문서 목록을 반환한다 | E2E-TASK-01 | 대기 |
| AC-06 | PUT /api/tasks/:id가 Task 정보를 수정하고 이력을 기록한다 | E2E-TASK-02 | 대기 |
| AC-07 | 동시성 충돌 시 409 에러가 발생한다 (updated 필드 불일치) | E2E-WBS-02-02 | 대기 |
| AC-08 | 1000개 노드 WBS 조회가 500ms 이내에 완료된다 | E2E-PERF-01 | 대기 |

---

## 8. 테스트 완료 체크리스트

- [ ] 단위 테스트 작성 완료 (UT-WBS-01~03, UT-TASK-01~03, UT-PROGRESS-01)
- [ ] E2E 테스트 작성 완료 (E2E-WBS-01~05, E2E-TASK-01~02, E2E-PERF-01)
- [ ] 테스트 데이터 (Fixture) 준비 완료
- [ ] 모든 단위 테스트 통과
- [ ] 모든 E2E 테스트 통과
- [ ] 커버리지 >= 80% 달성
- [ ] 수용 기준 (AC-01~08) 모두 충족
- [ ] 성능 목표 (NFR-001) 달성

---

## 9. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-14 | Claude Code | 초기 작성 |

---

<!--
author: Claude Code
Template Version: 1.0.0
-->
