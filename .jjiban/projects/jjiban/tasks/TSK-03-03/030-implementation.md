# 구현: Workflow API & Settings

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Task명 | Workflow API & Settings |
| Category | development |
| 상태 | [im] 구현 중 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| 상세설계 | `020-detail-design.md` | 전체 |
| 테스트 명세 | `026-test-specification.md` | 전체 |

---

## 1. 구현 개요

### 1.1 구현 범위

| 레이어 | 구현 항목 | 상태 |
|--------|---------|------|
| **Types** | TransitionResult, DocumentInfo 확장, HistoryEntry 확장 | 진행 중 |
| **Services** | TransitionService, DocumentService | 진행 중 |
| **APIs** | POST /api/tasks/:id/transition, GET /api/tasks/:id/documents | 진행 중 |
| **Tests** | 단위 테스트, 통합 테스트, E2E 테스트 | 진행 중 |

### 1.2 구현 순서

**Phase 1: 타입 정의 및 확장**
1. types/index.ts에 TransitionResult 추가
2. DocumentInfo 타입 확장 (stage, expectedAfter, command)
3. HistoryEntry 타입 확장 (action, command, documentCreated)

**Phase 2: Service 계층 (TDD)**
1. TransitionService 단위 테스트 작성
2. TransitionService 구현
3. DocumentService 단위 테스트 작성
4. DocumentService 구현

**Phase 3: API 라우터 (TDD)**
1. POST /api/tasks/:id/transition 통합 테스트 작성
2. POST /api/tasks/:id/transition 구현
3. GET /api/tasks/:id/documents 통합 테스트 작성
4. GET /api/tasks/:id/documents 구현

**Phase 4: E2E 테스트**
1. 전체 워크플로우 시나리오 테스트
2. 동시성 테스트
3. 성능 테스트

---

## 2. 타입 정의 및 확장

### 2.1 TransitionResult 타입

**파일**: `types/index.ts`

```typescript
/**
 * 상태 전이 결과
 */
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

### 2.2 DocumentInfo 타입 확장

**변경 전**:
```typescript
export interface DocumentInfo {
  name: string;
  path: string;
  exists: boolean;
  type: 'design' | 'implementation' | 'test' | 'manual';
}
```

**변경 후**:
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

### 2.3 HistoryEntry 타입 확장

**변경 전**:
```typescript
export interface HistoryEntry {
  timestamp: string;
  action: string;
  from?: string;
  to?: string;
  user?: string;
}
```

**변경 후**:
```typescript
export interface HistoryEntry {
  taskId: string;
  timestamp: string;
  userId?: string;
  action: 'transition' | 'action' | 'update';
  previousStatus?: string;
  newStatus?: string;
  command?: string;
  comment?: string;
  documentCreated?: string;
  // 기존 호환성 유지
  from?: string;
  to?: string;
  user?: string | null;
}
```

---

## 3. Service 계층 구현

### 3.1 TransitionService

**파일**: `server/utils/workflow/transitionService.ts`

**핵심 함수**:

#### validateTransition()
```typescript
/**
 * 상태 전이 가능 여부 검증
 * @param taskId - Task ID
 * @param command - 전이 명령어
 * @returns 검증 결과 (가능/불가능, 메시지)
 */
export async function validateTransition(
  taskId: string,
  command: string
): Promise<{ valid: boolean; message?: string }>
```

**로직**:
1. Task 검색 (findTaskById)
2. 현재 상태 추출
3. workflows.json에서 카테고리별 워크플로우 조회
4. transitions 배열에서 (from=현재상태, command=명령어) 조건 검색
5. 존재하면 valid=true, 없으면 valid=false 반환

#### executeTransition()
```typescript
/**
 * 상태 전이 실행
 * @param taskId - Task ID
 * @param command - 전이 명령어
 * @param comment - 변경 사유 (선택)
 * @returns TransitionResult
 */
export async function executeTransition(
  taskId: string,
  command: string,
  comment?: string
): Promise<TransitionResult>
```

**로직**:
1. validateTransition() 호출
2. valid=false이면 에러 throw
3. workflows.json에서 transition 정보 조회
4. WBS 트리에서 Task 노드 status 업데이트
5. saveWbsTree() 호출
6. document 필드가 있으면 템플릿 파일 복사 (createDocument)
7. TransitionResult 반환

#### getAvailableCommands()
```typescript
/**
 * 가능한 명령어 목록 조회
 * @param taskId - Task ID
 * @returns 가능한 명령어 배열
 */
export async function getAvailableCommands(
  taskId: string
): Promise<string[]>
```

**로직**:
1. Task 검색
2. 현재 상태, 카테고리 추출
3. workflows.json에서 transitions 필터링 (from=현재상태)
4. command 배열 반환

#### createDocument()
```typescript
/**
 * 문서 생성 (템플릿 기반)
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @param documentName - 문서 파일명
 * @returns 성공 여부
 */
async function createDocument(
  projectId: string,
  taskId: string,
  documentName: string
): Promise<boolean>
```

**로직**:
1. templates/ 폴더에서 템플릿 파일 조회
2. tasks/{taskId}/ 폴더 생성 (ensureDir)
3. 템플릿 복사 또는 기본 내용 생성
4. 성공 여부 반환

---

### 3.2 DocumentService

**파일**: `server/utils/workflow/documentService.ts`

**핵심 함수**:

#### getExistingDocuments()
```typescript
/**
 * Task의 존재 문서 목록 조회
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @returns 존재 문서 목록
 */
export async function getExistingDocuments(
  projectId: string,
  taskId: string
): Promise<DocumentInfo[]>
```

**로직**:
1. getTaskFolderPath(projectId, taskId)
2. listFiles(taskFolderPath, '.md')
3. 각 파일에 대해:
   - fs.stat()로 size, createdAt, updatedAt 조회
   - 문서 타입 결정 (파일명 기반)
   - DocumentInfo 생성 (exists=true, stage='current')
4. 배열 반환

#### getExpectedDocuments()
```typescript
/**
 * Task의 예정 문서 목록 조회 (워크플로우 기반)
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @param currentStatus - 현재 상태
 * @returns 예정 문서 목록
 */
export async function getExpectedDocuments(
  projectId: string,
  taskId: string,
  currentStatus: string
): Promise<DocumentInfo[]>
```

**로직**:
1. Task 검색 (카테고리 조회)
2. workflows.json에서 카테고리의 워크플로우 조회
3. transitions 필터링 (from=현재상태, document≠null)
4. 각 transition에 대해:
   - DocumentInfo 생성 (exists=false, stage='expected')
   - expectedAfter, command 필드 설정
5. 배열 반환

#### getTaskDocuments()
```typescript
/**
 * 존재/예정 문서 병합 조회
 * @param projectId - 프로젝트 ID
 * @param taskId - Task ID
 * @returns 병합된 문서 목록
 */
export async function getTaskDocuments(
  projectId: string,
  taskId: string
): Promise<DocumentInfo[]>
```

**로직**:
1. Task 검색 (currentStatus 조회)
2. getExistingDocuments() 호출
3. getExpectedDocuments() 호출
4. 중복 제거 (existingDocs의 name이 expectedDocs에 있으면 제외)
5. 병합 및 정렬 (stage='current' 먼저, 그 다음 'expected')
6. 배열 반환

---

## 4. API 라우터 구현

### 4.1 POST /api/tasks/:id/transition

**파일**: `server/api/tasks/[id]/transition.post.ts`

```typescript
import { defineEventHandler, getRouterParam, readBody, createError, H3Event } from 'h3';
import { executeTransition } from '../../../utils/workflow/transitionService';

export default defineEventHandler(async (event: H3Event) => {
  const taskId = getRouterParam(event, 'id');

  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_TASK_ID',
      message: 'Task ID가 제공되지 않았습니다',
      data: { timestamp: new Date().toISOString() },
    });
  }

  const body = await readBody(event);
  const { command, comment } = body;

  if (!command) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_COMMAND',
      message: '명령어가 제공되지 않았습니다',
      data: { timestamp: new Date().toISOString() },
    });
  }

  try {
    const result = await executeTransition(taskId, command, comment);

    // 201 Created 응답
    event.node.res.statusCode = 201;
    return result;
  } catch (error: unknown) {
    // 표준 에러는 그대로 throw
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      message: `상태 전이 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { timestamp: new Date().toISOString() },
    });
  }
});
```

---

### 4.2 GET /api/tasks/:id/documents

**파일**: `server/api/tasks/[id]/documents.get.ts`

```typescript
import { defineEventHandler, getRouterParam, createError, H3Event } from 'h3';
import { getTaskDocuments } from '../../../utils/workflow/documentService';
import { findTaskById } from '../../../utils/wbs/taskService';

export default defineEventHandler(async (event: H3Event) => {
  const taskId = getRouterParam(event, 'id');

  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_TASK_ID',
      message: 'Task ID가 제공되지 않았습니다',
      data: { timestamp: new Date().toISOString() },
    });
  }

  try {
    // Task 존재 확인
    const taskResult = await findTaskById(taskId);
    if (!taskResult) {
      throw createError({
        statusCode: 404,
        statusMessage: 'TASK_NOT_FOUND',
        message: `Task를 찾을 수 없습니다: ${taskId}`,
        data: { timestamp: new Date().toISOString() },
      });
    }

    const documents = await getTaskDocuments(taskResult.projectId, taskId);

    return {
      taskId,
      documents,
    };
  } catch (error: unknown) {
    // 표준 에러는 그대로 throw
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      message: `문서 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { timestamp: new Date().toISOString() },
    });
  }
});
```

---

## 5. 테스트 구현

### 5.1 단위 테스트 파일 목록

- `tests/utils/workflow/transitionService.spec.ts` (TC-001~010)
- `tests/utils/workflow/documentService.spec.ts` (TC-011~015)

### 5.2 통합 테스트 파일 목록

- `tests/api/tasks/transition.spec.ts` (TC-020~023)
- `tests/api/tasks/documents.spec.ts` (TC-024~025)

### 5.3 E2E 테스트 파일 목록

- `tests/e2e/workflow.spec.ts` (TC-028~032)

---

## 6. 구현 체크리스트

### 6.1 타입 정의
- [ ] TransitionResult 타입 추가
- [ ] DocumentInfo 타입 확장
- [ ] HistoryEntry 타입 확장

### 6.2 TransitionService
- [ ] validateTransition() 구현
- [ ] executeTransition() 구현
- [ ] getAvailableCommands() 구현
- [ ] createDocument() 구현
- [ ] 단위 테스트 10개 통과

### 6.3 DocumentService
- [ ] getExistingDocuments() 구현
- [ ] getExpectedDocuments() 구현
- [ ] getTaskDocuments() 구현
- [ ] 단위 테스트 5개 통과

### 6.4 API 라우터
- [ ] POST /api/tasks/:id/transition 구현
- [ ] GET /api/tasks/:id/documents 구현
- [ ] 통합 테스트 6개 통과

### 6.5 E2E 테스트
- [ ] 전체 워크플로우 테스트 5개 통과
- [ ] 성능 테스트 통과 (< 목표 시간)

---

## 7. 변경 사항 추적

### 7.1 파일 생성

| 파일 경로 | 목적 |
|---------|------|
| `server/utils/workflow/transitionService.ts` | 상태 전이 서비스 |
| `server/utils/workflow/documentService.ts` | 문서 목록 서비스 |
| `server/utils/workflow/index.ts` | 서비스 진입점 |
| `server/api/tasks/[id]/transition.post.ts` | 전이 API |
| `server/api/tasks/[id]/documents.get.ts` | 문서 API |
| `tests/utils/workflow/transitionService.spec.ts` | 전이 서비스 테스트 |
| `tests/utils/workflow/documentService.spec.ts` | 문서 서비스 테스트 |
| `tests/api/tasks/transition.spec.ts` | 전이 API 테스트 |
| `tests/api/tasks/documents.spec.ts` | 문서 API 테스트 |
| `tests/e2e/workflow.spec.ts` | E2E 테스트 |

### 7.2 파일 수정

| 파일 경로 | 수정 내용 |
|---------|---------|
| `types/index.ts` | TransitionResult, DocumentInfo, HistoryEntry 타입 추가/확장 |
| `server/utils/wbs/taskService.ts` | findTaskById를 export하여 재사용 가능하도록 수정 |

---

## 8. 구현 진행 상황

**현재 단계**: Phase 1 - 타입 정의 및 확장

**다음 단계**: Phase 2 - TransitionService 단위 테스트 작성

**예상 완료일**: 2025-12-14

---

## 9. 이슈 및 해결 방안

### 9.1 findTaskById 함수 재사용
**이슈**: taskService.ts의 findTaskById가 내부 함수로 선언되어 있음
**해결**: export하여 documentService와 transition API에서 재사용

### 9.2 템플릿 파일 경로
**이슈**: .jjiban/templates/ 폴더에 템플릿이 없을 수 있음
**해결**: 템플릿 파일이 없으면 기본 Markdown 헤더만 생성

### 9.3 동시성 제어
**이슈**: 동시에 여러 전이 요청 시 상태 충돌 가능
**해결**: wbsService의 checkUpdatedDate()로 낙관적 잠금 활용

---

## 10. 코드 리뷰 반영 이력

### 10.1 반영 일시: 2025-12-15
### 10.2 기준 리뷰: 031-code-review-claude-1.md

| # | 항목 | 우선순위 | 파일 | 상태 |
|---|------|---------|------|------|
| 1 | extractStatusCode() 중복 제거 | P3 | transitionService.ts | ✅ 반영 |
| 2 | extractStatusCode() 중복 제거 | P3 | documentService.ts | ✅ 반영 |
| 3 | transition/documents API E2E 테스트 | P3 | tests/e2e/tasks.spec.ts | ✅ 반영 |
| 4 | findTaskById() 중복 호출 최적화 | P4 | transitionService.ts | ✅ 반영 |
| 5 | determineDocumentType() 매직 스트링 상수화 | P4 | documentService.ts | ✅ 반영 |

### 10.3 미반영 사항 (사유 포함)

| # | 항목 | 우선순위 | 사유 |
|---|------|---------|------|
| 1 | updateTaskStatus() 별도 유틸 분리 | P4 | 현재 범위 내 충분한 캡슐화 |
| 2 | 201 응답 setResponseStatus() 사용 | P4 | 현재 방식으로 동작 정상 |

### 10.4 변경 상세

#### 10.4.1 extractStatusCode() 중복 제거
- **Before**: transitionService.ts:35, documentService.ts:29에 동일 함수 중복 정의
- **After**: statusUtils.ts의 공통 함수 import하여 사용
- **추가 개선**: formatStatusCode 함수 추가 활용하여 워크플로우 상태 비교 정확성 향상

#### 10.4.2 findTaskById() 중복 호출 최적화
- **Before**: executeTransition() 내부에서 validateTransition() 호출 후 다시 findTaskById() 호출 (2회)
- **After**: validateTransitionInternal() 함수를 통해 검증 결과와 Task 정보를 함께 반환하여 재사용 (1회)
- **효과**: I/O 감소, 응답 시간 개선

#### 10.4.3 determineDocumentType() 매직 스트링 상수화
- **Before**: 함수 내부에 하드코딩된 파일명-타입 매핑
- **After**: DOCUMENT_TYPE_MAPPING, PREFIX_TYPE_MAPPING, DEFAULT_DOCUMENT_TYPE 상수로 분리
- **효과**: 유지보수성 향상, 새 문서 타입 추가 용이

#### 10.4.4 E2E 테스트 추가
- 추가된 테스트:
  - E2E-TASK-05: GET /api/tasks/:id/documents - 문서 목록 조회
  - E2E-TASK-06: POST /api/tasks/:id/transition - 상태 전이 성공
  - E2E-TASK-07: POST /api/tasks/:id/transition - 유효하지 않은 전이
  - E2E-TASK-08: GET /api/tasks/:id/available-commands - 가능한 명령어 조회

---

**문서 버전**: 1.1.0
