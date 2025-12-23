# 상세설계: Workflow API & Settings

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

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 5.2, 5.3, 8.1 |

---

## 1. API 명세

### 1.1 POST /api/tasks/:id/transition - 상태 전이

**목적**: Task 상태를 전이하고 필요시 문서를 생성합니다.

**요청**:
```http
POST /api/tasks/{taskId}/transition
Content-Type: application/json

{
  "command": "start|draft|build|verify|done|fix|skip",
  "comment": "optional comment"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "taskId": "TSK-01-01-01",
  "previousStatus": "[ ]",
  "newStatus": "[bd]",
  "command": "start",
  "documentCreated": "010-basic-design.md",
  "timestamp": "2025-12-14T10:30:00Z"
}
```

**응답 (409 Conflict - 불가능한 전이)**:
```json
{
  "success": false,
  "error": "INVALID_TRANSITION",
  "message": "Cannot transition from [bd] to [xx] with command 'done'",
  "timestamp": "2025-12-14T10:30:00Z"
}
```

**에러 코드**:
| 코드 | HTTP | 상황 |
|------|------|------|
| TASK_NOT_FOUND | 404 | Task 존재하지 않음 |
| INVALID_COMMAND | 400 | 명령어 미제공 또는 형식 오류 |
| INVALID_TRANSITION | 409 | 불가능한 상태 전이 |
| FILE_WRITE_ERROR | 500 | wbs.md 저장 실패 |

---

### 1.2 GET /api/tasks/:id/documents - 문서 목록 조회

**목적**: Task의 존재/예정 문서 목록을 조회합니다.

**요청**:
```http
GET /api/tasks/{taskId}/documents
```

**응답 (200 OK)**:
```json
{
  "taskId": "TSK-01-01-01",
  "documents": [
    {
      "name": "010-basic-design.md",
      "path": "tasks/TSK-01-01-01/010-basic-design.md",
      "exists": true,
      "type": "design",
      "stage": "current",
      "size": 12345,
      "createdAt": "2025-12-14T10:00:00Z",
      "updatedAt": "2025-12-14T10:30:00Z"
    },
    {
      "name": "020-detail-design.md",
      "path": "tasks/TSK-01-01-01/020-detail-design.md",
      "exists": false,
      "type": "design",
      "stage": "expected",
      "expectedAfter": "[dd] 상태",
      "command": "draft"
    }
  ]
}
```

**에러 코드**:
| 코드 | HTTP | 상황 |
|------|------|------|
| TASK_NOT_FOUND | 404 | Task 존재하지 않음 |
| INVALID_TASK_ID | 400 | Task ID 형식 오류 |

---

### 1.3 GET /api/settings/:type - 설정 조회

**요청**:
```http
GET /api/settings/columns
GET /api/settings/categories
GET /api/settings/workflows
GET /api/settings/actions
```

**응답 (200 OK - columns)**:
```json
{
  "version": "1.0",
  "columns": [
    {
      "id": "todo",
      "name": "Todo",
      "statusCode": "[ ]",
      "order": 1,
      "color": "#6b7280",
      "description": "대기 중인 작업"
    }
  ]
}
```

**에러 코드**:
| 코드 | HTTP | 상황 |
|------|------|------|
| INVALID_SETTINGS_TYPE | 400 | 설정 타입 오류 |
| SETTINGS_LOAD_ERROR | 500 | 파일 로드 실패 |

---

## 2. Service 계층 설계

### 2.1 TransitionService (신규)

**파일**: `server/utils/workflow/transitionService.ts`

**함수**:

```typescript
/**
 * 상태 전이 가능 여부 검증
 * @param taskId - Task ID
 * @param command - 전이 명령어
 * @returns 검증 결과 (가능/불가능, 메시지)
 */
function validateTransition(
  taskId: string,
  command: string
): { valid: boolean; message?: string }

/**
 * 상태 전이 실행
 * @param taskId - Task ID
 * @param command - 전이 명령어
 * @param comment - 변경 사유 (선택)
 * @returns TransitionResult
 */
async function executeTransition(
  taskId: string,
  command: string,
  comment?: string
): Promise<TransitionResult>

/**
 * 가능한 명령어 목록 조회
 * @param taskId - Task ID
 * @returns 가능한 명령어 배열
 */
async function getAvailableCommands(
  taskId: string
): Promise<string[]>
```

**의존성**:
- `taskService.findTaskById()` - Task 검색
- `wbsService.getWbsTree()` - WBS 조회
- `wbsService.saveWbsTree()` - WBS 저장
- SettingsService - 워크플로우 규칙 조회

---

### 2.2 DocumentService (신규)

**파일**: `server/utils/workflow/documentService.ts`

**함수**:

```typescript
/**
 * Task의 존재 문서 목록 조회
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @returns 존재 문서 목록
 */
async function getExistingDocuments(
  projectId: string,
  taskId: string
): Promise<DocumentInfo[]>

/**
 * Task의 예정 문서 목록 조회 (워크플로우 기반)
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @param currentStatus - 현재 상태
 * @returns 예정 문서 목록
 */
async function getExpectedDocuments(
  projectId: string,
  taskId: string,
  currentStatus: string
): Promise<DocumentInfo[]>

/**
 * 존재/예정 문서 병합 조회
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @returns 병합된 문서 목록
 */
async function getTaskDocuments(
  projectId: string,
  taskId: string
): Promise<DocumentInfo[]>
```

**의존성**:
- TaskService - Task 정보 조회
- SettingsService - 워크플로우 규칙 (예정 문서)
- FileService - 파일 시스템 접근

---

### 2.3 HistoryService (신규)

**파일**: `server/utils/workflow/historyService.ts`

**함수**:

```typescript
/**
 * 상태 전이 이력 기록
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @param entry - 이력 엔트리
 */
async function recordTransition(
  projectId: string,
  taskId: string,
  entry: HistoryEntry
): Promise<void>

/**
 * Task의 이력 조회
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @param limit - 조회 건수 (기본 50)
 */
async function getTaskHistory(
  projectId: string,
  taskId: string,
  limit?: number
): Promise<HistoryEntry[]>
```

---

## 3. API 라우터 설계

### 3.1 POST /api/tasks/:id/transition

**파일**: `server/api/tasks/[id]/transition.post.ts`

**핵심 로직**:
```
1. 요청 검증 (taskId, command)
2. Task 존재 확인
3. TransitionService.validateTransition()
4. 유효하면 TransitionService.executeTransition()
5. 성공 시 HistoryService.recordTransition()
6. 응답 반환
```

**에러 처리**:
- createNotFoundError() - Task 없음
- createBadRequestError() - 요청 형식 오류
- createConflictError() - 불가능한 전이
- createInternalError() - 파일 저장 실패

---

### 3.2 GET /api/tasks/:id/documents

**파일**: `server/api/tasks/[id]/documents.get.ts`

**핵심 로직**:
```
1. 요청 검증 (taskId)
2. Task 존재 확인
3. DocumentService.getTaskDocuments()
4. 응답 반환
```

---

### 3.3 GET /api/settings/:type (확인용)

**파일**: `server/api/settings/[type].get.ts` (기존)

**상태**: 이미 구현됨, 확인만 필요

---

## 4. 데이터 모델 확장

### 4.1 TransitionResult (신규)

```typescript
export interface TransitionResult {
  success: boolean;
  taskId: string;
  previousStatus?: string;
  newStatus?: string;
  command?: string;
  documentCreated?: string;
  error?: string;
  message?: string;
  timestamp: string;
}
```

### 4.2 DocumentInfo (확장)

기존 타입 확장:
```typescript
export interface DocumentInfo {
  name: string;
  path: string;
  exists: boolean;
  type: 'design' | 'implementation' | 'test' | 'manual' | 'analysis' | 'review';
  stage: 'current' | 'expected';
  size?: number;                    // exists=true일 때만
  createdAt?: string;               // exists=true일 때만
  updatedAt?: string;               // exists=true일 때만
  expectedAfter?: string;           // exists=false일 때만
  command?: string;                 // exists=false일 때만
}
```

### 4.3 HistoryEntry (확장)

```typescript
export interface HistoryEntry {
  taskId: string;
  timestamp: string;
  userId?: string;
  action: 'transition' | 'action';
  previousStatus: string;
  newStatus: string;
  command: string;
  comment?: string;
  documentCreated?: string;
}
```

---

## 5. 워크플로우 규칙 매핑

### 5.1 명령어 → (상태, 문서) 매핑

기존 workflows.json 기반으로, 각 명령어와 생성 문서를 정의:

| 카테고리 | 현재상태 | 명령어 | 다음상태 | 생성문서 |
|---------|---------|--------|---------|---------|
| development | [ ] | start | [bd] | 010-basic-design.md |
| development | [bd] | draft | [dd] | 020-detail-design.md |
| development | [dd] | build | [im] | 030-implementation.md |
| development | [im] | verify | [vf] | 070-integration-test.md |
| development | [vf] | done | [xx] | - |
| defect | [ ] | start | [an] | 010-analysis.md |
| defect | [an] | fix | [fx] | 020-fix.md |
| defect | [fx] | verify | [vf] | - |
| defect | [vf] | done | [xx] | - |
| infrastructure | [ ] | start | [im] | - |
| infrastructure | [ ] | skip | [xx] | - |
| infrastructure | [im] | done | [xx] | - |

---

## 6. 에러 처리 전략

### 6.1 표준 에러 클래스 활용

```typescript
// server/utils/errors/standardError.ts 기존 함수 사용

createNotFoundError(message)
createBadRequestError(code, message)
createConflictError(code, message)
createInternalError(code, message)
```

### 6.2 에러 응답 포맷

```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_TRANSITION",
  "message": "Cannot transition from [bd] to [xx]",
  "data": {
    "timestamp": "2025-12-14T10:30:00Z"
  }
}
```

---

## 7. 성능 고려사항

### 7.1 캐싱 전략

- **SettingsService**: 이미 캐싱됨 (설정 변경 시에만 갱신)
- **WbsTree**: 요청마다 새로 로드 (일관성 보장)
- **DocumentList**: 캐싱 불필요 (파일 시스템 기반)

### 7.2 응답 시간 목표

| API | 목표 | 근거 |
|-----|------|------|
| POST /transition | < 500ms | wbs.md 저장 포함 |
| GET /documents | < 200ms | 파일 시스템 스캔 |
| GET /settings | < 50ms | 캐시 조회 |

---

## 8. 테스트 설계

### 8.1 TransitionService 단위 테스트

```typescript
describe('TransitionService', () => {
  test('validateTransition: valid transition', () => {})
  test('validateTransition: invalid transition', () => {})
  test('executeTransition: success', () => {})
  test('executeTransition: creates document', () => {})
  test('getAvailableCommands: returns correct commands', () => {})
})
```

### 8.2 DocumentService 단위 테스트

```typescript
describe('DocumentService', () => {
  test('getExistingDocuments: returns .md files', () => {})
  test('getExpectedDocuments: returns workflow-based docs', () => {})
  test('getTaskDocuments: merges and sorts correctly', () => {})
})
```

### 8.3 E2E 테스트

```typescript
describe('Workflow API E2E', () => {
  test('transition flow: start → draft → build', () => {})
  test('document creation on transition', () => {})
  test('error: invalid transition', () => {})
  test('concurrent transitions', () => {})
})
```

---

## 9. 구현 순서

**Phase 1: Service 계층**
1. TransitionService + DocumentService
2. HistoryService
3. 데이터 모델 확장

**Phase 2: API 라우터**
1. POST /api/tasks/:id/transition
2. GET /api/tasks/:id/documents
3. GET /api/settings/:type (확인)

**Phase 3: 테스트**
1. 단위 테스트
2. E2E 테스트
3. 통합 테스트

---

## 10. 의존성 정리

**선행 구현 필수**:
- TSK-02-03-02: SettingsService (완료)
- TSK-03-02: TaskService + WbsService (완료)

**동시 구현 가능**:
- TSK-03-03: 본 Task (상세설계)
- TSK-03-04: WorkflowEngine (기본설계만 참조)

---

**문서 버전**: 1.0.0
