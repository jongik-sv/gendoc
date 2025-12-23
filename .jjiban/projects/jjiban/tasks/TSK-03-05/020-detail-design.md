# TSK-03-05: WBS 테스트 결과 업데이트 API - 상세설계

## 문서 정보
- **Task ID**: TSK-03-05
- **작성일**: 2025-12-15
- **문서 버전**: 1.0
- **선행 문서**: 010-basic-design.md

---

## 1. 구현 개요

### 1.1 파일 구조

```
server/
├── api/
│   └── projects/
│       └── [id]/
│           └── wbs/
│               └── tasks/
│                   └── [taskId]/
│                       └── test-result.put.ts    # 새로 생성
└── utils/
    └── wbs/
        ├── taskService.ts                         # 기존 (필요시 확장)
        └── parser/
            └── _tree.ts                           # 기존 (findTaskInTree 함수 활용)
```

### 1.2 핵심 기능

| 기능 | 파일 | 역할 |
|------|------|------|
| API 엔드포인트 | test-result.put.ts | 요청 처리, 검증, 응답 |
| Task 탐색 | taskService.ts | WBS 트리에서 Task 노드 찾기 |
| 파싱/직렬화 | parser/index.ts, serializer.ts | wbs.md ↔ WbsNode[] 변환 |

---

## 2. API 구현 상세

### 2.1 파일: `server/api/projects/[id]/wbs/tasks/[taskId]/test-result.put.ts`

#### 2.1.1 함수 시그니처

```typescript
import { defineEventHandler, readBody, getRouterParams } from 'h3';
import type { WbsNode, WbsMetadata } from '../../../../../../types';
import {
  createBadRequestError,
  createNotFoundError,
  createInternalError
} from '../../../../../utils/errors/standardError';
import { validateProjectId } from '../../../../../utils/projects/paths';
import {
  getWbsPath,
  fileExists,
  readMarkdownFile,
  writeMarkdownFile
} from '../../../../../utils/file';
import { parseWbsMarkdown } from '../../../../../utils/wbs/parser';
import { serializeWbs } from '../../../../../utils/wbs/serializer';
import { findTaskInTree } from '../../../../../utils/wbs/taskService';
import { promises as fs } from 'fs';

/**
 * PUT /api/projects/:id/wbs/tasks/:taskId/test-result
 * WBS Task의 test-result 속성 업데이트
 */
export default defineEventHandler(async (event) => {
  // 구현 내용은 아래 섹션 참고
});
```

#### 2.1.2 입력 검증

```typescript
// 1. 파라미터 추출
const params = getRouterParams(event);
const projectId = params.id;
const taskId = params.taskId;

// 2. 요청 본문 파싱
const body = await readBody(event);

// 3. 필수 파라미터 검증
if (!projectId || !taskId) {
  throw createBadRequestError(
    'INVALID_REQUEST',
    'projectId와 taskId는 필수입니다'
  );
}

// 4. 프로젝트 ID 형식 검증
try {
  validateProjectId(projectId);
} catch (error) {
  throw createBadRequestError(
    'INVALID_PROJECT_ID',
    '프로젝트 ID 형식이 올바르지 않습니다'
  );
}

// 5. Task ID 형식 검증
if (!validateTaskId(taskId)) {
  throw createBadRequestError(
    'INVALID_TASK_ID',
    'Task ID 형식이 올바르지 않습니다. 형식: TSK-XX-XX 또는 TSK-XX-XX-XX'
  );
}

// 6. 요청 본문 검증
if (!body || typeof body !== 'object' || !body.testResult) {
  throw createBadRequestError(
    'INVALID_REQUEST_BODY',
    'testResult 필드는 필수입니다'
  );
}

// 7. test-result 값 검증
const testResult = body.testResult;
if (!validateTestResult(testResult)) {
  throw createBadRequestError(
    'INVALID_TEST_RESULT',
    'test-result 값은 none, pass, fail 중 하나여야 합니다'
  );
}
```

#### 2.1.3 검증 헬퍼 함수

```typescript
/**
 * Task ID 형식 검증
 * @param taskId - Task ID (예: TSK-03-05, TSK-02-01-03)
 * @returns 유효성 여부
 */
function validateTaskId(taskId: string): boolean {
  // TSK-XX-XX (3단계) 또는 TSK-XX-XX-XX (4단계)
  const pattern = /^TSK-\d{2}-\d{2}(-\d{2})?$/;
  return pattern.test(taskId);
}

/**
 * test-result 값 검증
 * @param value - test-result 값
 * @returns 유효성 여부
 */
function validateTestResult(value: string): boolean {
  const validValues = ['none', 'pass', 'fail'];
  return validValues.includes(value);
}
```

#### 2.1.4 메인 처리 흐름

```typescript
// 1. 프로젝트 존재 확인
const wbsPath = getWbsPath(projectId);
const exists = await fileExists(wbsPath);

if (!exists) {
  throw createNotFoundError(`프로젝트를 찾을 수 없습니다: ${projectId}`);
}

// 2. WBS 파일 읽기
const markdown = await readMarkdownFile(wbsPath);

if (!markdown) {
  throw createInternalError(
    'FILE_ACCESS_ERROR',
    'WBS 파일을 읽을 수 없습니다'
  );
}

// 3. WBS 파싱 (메타데이터 + 트리)
let metadata: WbsMetadata;
let tree: WbsNode[];

try {
  metadata = parseMetadata(markdown);
  tree = parseWbsMarkdown(markdown);
} catch (error) {
  throw createInternalError(
    'PARSE_ERROR',
    `WBS 파일 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  );
}

// 4. Task 노드 탐색
const taskNode = findTaskInTree(tree, taskId);

if (!taskNode) {
  throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
}

// 5. test-result 속성 업데이트
if (!taskNode.attributes) {
  taskNode.attributes = {};
}
taskNode.attributes['test-result'] = testResult;

// 6. 백업 생성
const backupPath = `${wbsPath}.bak`;

try {
  await fs.copyFile(wbsPath, backupPath);
} catch (error) {
  throw createInternalError(
    'BACKUP_FAILED',
    `백업 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  );
}

// 7. WBS 직렬화
let updatedMarkdown: string;

try {
  updatedMarkdown = serializeWbs(tree, metadata, { updateDate: true });
} catch (error) {
  // 백업 파일 삭제 (정리)
  await fs.unlink(backupPath).catch(() => {});

  throw createInternalError(
    'SERIALIZATION_ERROR',
    `WBS 직렬화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  );
}

// 8. 파일 쓰기
const writeSuccess = await writeMarkdownFile(wbsPath, updatedMarkdown);

if (!writeSuccess) {
  // 롤백 시도
  try {
    await fs.copyFile(backupPath, wbsPath);
    await fs.unlink(backupPath);

    throw createInternalError(
      'FILE_WRITE_ERROR',
      'WBS 파일 쓰기 실패 (백업에서 복원됨)'
    );
  } catch (rollbackError) {
    throw createInternalError(
      'ROLLBACK_FAILED',
      `치명적 오류: 파일 쓰기 및 롤백 실패 (백업 파일: ${backupPath})`
    );
  }
}

// 9. 백업 파일 삭제
await fs.unlink(backupPath).catch(() => {
  console.warn(`백업 파일 삭제 실패 (무시됨): ${backupPath}`);
});

// 10. 성공 응답
const updatedDate = metadata.updated;

return {
  success: true,
  testResult,
  updated: updatedDate
};
```

### 2.2 메타데이터 파싱 함수

```typescript
/**
 * wbs.md 파일에서 메타데이터 추출
 * @param markdown - wbs.md 파일 내용
 * @returns WbsMetadata
 */
function parseMetadata(markdown: string): WbsMetadata {
  const lines = markdown.split('\n');
  const metadata: Partial<WbsMetadata> = {};

  let inMetadata = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      if (inMetadata) break; // 메타데이터 섹션 종료
      inMetadata = true;
      continue;
    }

    if (!inMetadata) continue;

    const match = line.match(/^>\s*(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;

      if (key === 'version') metadata.version = value.trim();
      if (key === 'depth') metadata.depth = parseInt(value.trim()) as 3 | 4;
      if (key === 'updated') metadata.updated = value.trim();
      if (key === 'start') metadata.start = value.trim();
    }
  }

  // 기본값 설정
  return {
    version: metadata.version || '1.0',
    depth: metadata.depth || 3,
    updated: metadata.updated || new Date().toISOString().split('T')[0],
    start: metadata.start || new Date().toISOString().split('T')[0]
  };
}
```

---

## 3. 유틸리티 함수 확장

### 3.1 파일: `server/utils/wbs/taskService.ts` (기존 함수 재사용)

#### 3.1.1 findTaskInTree 함수 (기존 함수 export 추가)

> **P0 리뷰 반영**: 기존 `findTaskInTree` 함수가 이미 `taskService.ts:70`에 존재합니다.
> 새로 만들지 않고, 기존 함수에 `export` 키워드를 추가하여 재사용합니다.

**기존 함수 위치**: `server/utils/wbs/taskService.ts:70`

**변경 사항**:
```typescript
// 변경 전 (내부 함수)
function findTaskInTree(
  nodes: WbsNode[],
  taskId: string,
  parentWp?: string,
  parentAct?: string
): { task: WbsNode; parentWp: string; parentAct?: string } | null

// 변경 후 (export 추가)
export function findTaskInTree(
  nodes: WbsNode[],
  taskId: string,
  parentWp?: string,
  parentAct?: string
): { task: WbsNode; parentWp: string; parentAct?: string } | null
```

**API에서 사용 방법**:
```typescript
import { findTaskInTree } from '../../../../../utils/wbs/taskService';

// 사용
const result = findTaskInTree(tree, taskId);
if (!result) {
  throw createError({ statusCode: 404, statusMessage: 'TASK_NOT_FOUND' });
}
const taskNode = result.task;  // WbsNode 타입
```

**참고**: 기존 함수는 `{ task, parentWp, parentAct }` 객체를 반환하므로, `result.task`로 노드에 접근합니다.

---

## 4. 데이터 흐름

### 4.1 정상 시나리오

```
[Client]
   |
   | PUT /api/projects/jjiban/wbs/tasks/TSK-03-05/test-result
   | { testResult: "pass" }
   |
   v
[API Handler: test-result.put.ts]
   |
   |-- 1. 입력 검증
   |   - projectId: "jjiban" ✓
   |   - taskId: "TSK-03-05" ✓
   |   - testResult: "pass" ✓
   |
   |-- 2. 프로젝트 존재 확인
   |   - wbsPath: ".jjiban/projects/jjiban/wbs.md" ✓
   |
   |-- 3. WBS 파일 읽기
   |   - markdown: "# WBS - jjiban\n..." ✓
   |
   |-- 4. WBS 파싱
   |   - metadata: { version: "1.0", depth: 4, ... }
   |   - tree: [WbsNode { id: "WP-01", ... }]
   |
   |-- 5. Task 탐색
   |   - taskNode: WbsNode { id: "TSK-03-05", type: "task", ... } ✓
   |
   |-- 6. test-result 업데이트
   |   - taskNode.attributes['test-result'] = "pass"
   |
   |-- 7. 백업 생성
   |   - wbs.md → wbs.md.bak ✓
   |
   |-- 8. WBS 직렬화
   |   - serializeWbs(tree, metadata, { updateDate: true })
   |   - updatedMarkdown: "# WBS - jjiban\n> updated: 2025-12-15\n..."
   |
   |-- 9. 파일 쓰기
   |   - writeMarkdownFile(wbsPath, updatedMarkdown) ✓
   |
   |-- 10. 백업 삭제
   |   - fs.unlink(backupPath) ✓
   |
   v
[Response]
{
  success: true,
  testResult: "pass",
  updated: "2025-12-15"
}
```

### 4.2 에러 시나리오 1: Task 미존재

```
[Client]
   |
   | PUT /api/projects/jjiban/wbs/tasks/TSK-99-99/test-result
   |
   v
[API Handler]
   |
   |-- 1~4. 검증, 파일 읽기, 파싱 ✓
   |
   |-- 5. Task 탐색
   |   - findTaskInTree(tree, "TSK-99-99") → null ✗
   |
   v
[Error Response: 404]
{
  statusCode: 404,
  statusMessage: "TASK_NOT_FOUND",
  message: "Task를 찾을 수 없습니다: TSK-99-99",
  data: { timestamp: "2025-12-15T10:30:00.000Z" }
}
```

### 4.3 에러 시나리오 2: 백업 실패

```
[Client]
   |
   | PUT /api/projects/jjiban/wbs/tasks/TSK-03-05/test-result
   |
   v
[API Handler]
   |
   |-- 1~6. 검증, 파싱, 업데이트 ✓
   |
   |-- 7. 백업 생성
   |   - fs.copyFile(wbsPath, backupPath) ✗
   |   - 원인: 디스크 용량 부족
   |
   v
[Error Response: 500]
{
  statusCode: 500,
  statusMessage: "BACKUP_FAILED",
  message: "백업 생성 실패: ENOSPC: no space left on device",
  data: { timestamp: "2025-12-15T10:30:00.000Z" }
}

※ 원본 파일(wbs.md)은 보호됨 (업데이트 중단)
```

### 4.4 에러 시나리오 3: 파일 쓰기 실패 + 롤백 성공

```
[Client]
   |
   | PUT /api/projects/jjiban/wbs/tasks/TSK-03-05/test-result
   |
   v
[API Handler]
   |
   |-- 1~8. 검증, 파싱, 백업, 직렬화 ✓
   |
   |-- 9. 파일 쓰기
   |   - writeMarkdownFile(wbsPath, updatedMarkdown) ✗
   |   - 원인: 권한 오류
   |
   |-- 롤백 시도
   |   - fs.copyFile(backupPath, wbsPath) ✓
   |   - fs.unlink(backupPath) ✓
   |
   v
[Error Response: 500]
{
  statusCode: 500,
  statusMessage: "FILE_WRITE_ERROR",
  message: "WBS 파일 쓰기 실패 (백업에서 복원됨)",
  data: { timestamp: "2025-12-15T10:30:00.000Z" }
}

※ 원본 파일(wbs.md)은 백업에서 복원됨 ✓
```

### 4.5 에러 시나리오 4: 롤백 실패 (치명적)

```
[Client]
   |
   | PUT /api/projects/jjiban/wbs/tasks/TSK-03-05/test-result
   |
   v
[API Handler]
   |
   |-- 1~9. 검증, 파싱, 백업, 파일 쓰기 실패 ✗
   |
   |-- 롤백 시도
   |   - fs.copyFile(backupPath, wbsPath) ✗
   |   - 원인: 파일 시스템 오류
   |
   v
[Error Response: 500]
{
  statusCode: 500,
  statusMessage: "ROLLBACK_FAILED",
  message: "치명적 오류: 파일 쓰기 및 롤백 실패 (백업 파일: .jjiban/projects/jjiban/wbs.md.bak)",
  data: { timestamp: "2025-12-15T10:30:00.000Z" }
}

※ 수동 복구 필요: wbs.md.bak → wbs.md
```

---

## 5. 성능 분석

### 5.1 시간 복잡도

| 단계 | 복잡도 | 설명 |
|------|--------|------|
| 파일 읽기 | O(1) | 파일 크기에 비례 (I/O) |
| 파싱 | O(n) | n = WBS 노드 수 |
| Task 탐색 | O(n) | 최악의 경우 전체 순회 |
| 속성 업데이트 | O(1) | 단순 할당 |
| 직렬화 | O(n) | 전체 트리 순회 |
| 파일 쓰기 | O(1) | 파일 크기에 비례 (I/O) |
| **전체** | **O(n)** | n = WBS 노드 수 |

### 5.2 예상 소요 시간

| 프로젝트 규모 | 노드 수 | 예상 시간 |
|--------------|---------|----------|
| 소규모 | ~50 | 100-200ms |
| 중규모 | ~200 | 200-400ms |
| 대규모 | ~500 | 400-800ms |
| 초대규모 | 1000+ | 1000ms+ |

**NFR-001 충족**: 일반적인 규모(~200 노드)에서 500ms 이내 ✓

### 5.3 병목 지점

1. **WBS 파싱**: 노드 수에 비례하여 증가
2. **트리 탐색**: 깊이 우선 탐색으로 최악의 경우 전체 순회
3. **직렬화**: 전체 트리를 문자열로 변환

### 5.4 최적화 가능성 (향후)

- **부분 업데이트**: 특정 Task 라인만 찾아서 수정 (복잡도 증가)
- **인덱싱**: Task ID → 라인 번호 매핑 (별도 유지보수 필요)
- **캐싱**: WBS 트리 메모리 캐시 (동시성 문제)

**결론**: 현재는 단순성과 안정성 우선, 성능 이슈 발생 시 최적화 검토

---

## 6. 보안 고려사항

### 6.1 경로 순회 공격 방지

**위협**: 악의적인 projectId로 시스템 파일 접근

```typescript
// 예: projectId = "../../etc/passwd"
// 실제 경로: .jjiban/projects/../../etc/passwd → /etc/passwd
```

**대책**:
1. `validateProjectId()` 함수에서 검증 (기존)
   - 정규식: `^[a-z][a-z0-9-]{0,49}$`
   - `..`, `/`, `\` 포함 여부 검사
2. `getWbsPath()` 함수에서 경로 정규화 (기존)

**검증 시점**: API 엔드포인트 진입 직후

### 6.2 입력 검증

**위협**: 악의적인 testResult 값으로 wbs.md 파일 손상

```typescript
// 예: testResult = "pass\n- malicious: true"
// 결과: wbs.md 파일에 의도하지 않은 속성 추가
```

**대책**:
1. 화이트리스트 검증: `['none', 'pass', 'fail']`
2. 대소문자 엄격 검사 (소문자만 허용)
3. 정확한 문자열 일치 검사

**검증 시점**: 요청 본문 파싱 직후

### 6.3 백업 및 롤백

**위협**: 파일 업데이트 중 오류 발생 시 데이터 손실

**대책**:
1. 업데이트 전 백업 생성 필수
2. 백업 생성 실패 시 업데이트 중단
3. 파일 쓰기 실패 시 백업에서 자동 복원
4. 롤백 실패 시 치명적 에러 로깅

**복구 절차** (롤백 실패 시):
```bash
# 수동 복구
cp .jjiban/projects/jjiban/wbs.md.bak .jjiban/projects/jjiban/wbs.md
```

---

## 7. 에러 처리 상세

### 7.1 에러 코드 매핑

| HTTP | 에러 코드 | 트리거 조건 | 복구 가능 | 클라이언트 액션 |
|------|----------|------------|----------|----------------|
| 400 | INVALID_REQUEST | projectId/taskId 누락 | X | 요청 수정 |
| 400 | INVALID_PROJECT_ID | projectId 형식 오류 | X | 올바른 ID 입력 |
| 400 | INVALID_TASK_ID | taskId 형식 오류 | X | 올바른 ID 입력 |
| 400 | INVALID_REQUEST_BODY | body 누락/형식 오류 | X | 요청 본문 수정 |
| 400 | INVALID_TEST_RESULT | testResult 값 오류 | X | 유효한 값 입력 |
| 404 | PROJECT_NOT_FOUND | 프로젝트 미존재 | X | 프로젝트 생성 |
| 404 | TASK_NOT_FOUND | Task 미존재 | X | 올바른 Task ID 확인 |
| 500 | FILE_ACCESS_ERROR | WBS 파일 읽기 실패 | O | 재시도 |
| 500 | PARSE_ERROR | WBS 파일 파싱 실패 | X | 파일 수동 복구 |
| 500 | BACKUP_FAILED | 백업 생성 실패 | O | 디스크 용량 확인 후 재시도 |
| 500 | SERIALIZATION_ERROR | WBS 직렬화 실패 | X | 시스템 관리자 문의 |
| 500 | FILE_WRITE_ERROR | 파일 쓰기 실패 (롤백 성공) | O | 권한 확인 후 재시도 |
| 500 | ROLLBACK_FAILED | 롤백 실패 (치명적) | X | 백업 파일에서 수동 복구 |

### 7.2 에러 응답 예시

#### 7.2.1 INVALID_TEST_RESULT

```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_TEST_RESULT",
  "message": "test-result 값은 none, pass, fail 중 하나여야 합니다",
  "data": {
    "timestamp": "2025-12-15T10:30:00.000Z"
  }
}
```

#### 7.2.2 TASK_NOT_FOUND

```json
{
  "statusCode": 404,
  "statusMessage": "TASK_NOT_FOUND",
  "message": "Task를 찾을 수 없습니다: TSK-03-05",
  "data": {
    "timestamp": "2025-12-15T10:30:00.000Z"
  }
}
```

#### 7.2.3 BACKUP_FAILED

```json
{
  "statusCode": 500,
  "statusMessage": "BACKUP_FAILED",
  "message": "백업 생성 실패: ENOSPC: no space left on device",
  "data": {
    "timestamp": "2025-12-15T10:30:00.000Z"
  }
}
```

#### 7.2.4 ROLLBACK_FAILED

```json
{
  "statusCode": 500,
  "statusMessage": "ROLLBACK_FAILED",
  "message": "치명적 오류: 파일 쓰기 및 롤백 실패 (백업 파일: .jjiban/projects/jjiban/wbs.md.bak)",
  "data": {
    "timestamp": "2025-12-15T10:30:00.000Z"
  }
}
```

---

## 8. 단위 테스트 케이스

### 8.1 검증 함수 테스트

#### TC-U-001: validateTaskId - 정상 케이스

```typescript
describe('validateTaskId', () => {
  it('TC-U-001-001: should validate 3-level task ID', () => {
    expect(validateTaskId('TSK-03-05')).toBe(true);
  });

  it('TC-U-001-002: should validate 4-level task ID', () => {
    expect(validateTaskId('TSK-02-01-03')).toBe(true);
  });

  it('TC-U-001-003: should reject 1-digit segment', () => {
    expect(validateTaskId('TSK-3-5')).toBe(false);
  });

  it('TC-U-001-004: should reject wrong prefix', () => {
    expect(validateTaskId('TASK-03-05')).toBe(false);
  });

  it('TC-U-001-005: should reject invalid format', () => {
    expect(validateTaskId('TSK-03')).toBe(false);
  });
});
```

#### TC-U-002: validateTestResult - 정상 케이스

```typescript
describe('validateTestResult', () => {
  it('TC-U-002-001: should validate "none"', () => {
    expect(validateTestResult('none')).toBe(true);
  });

  it('TC-U-002-002: should validate "pass"', () => {
    expect(validateTestResult('pass')).toBe(true);
  });

  it('TC-U-002-003: should validate "fail"', () => {
    expect(validateTestResult('fail')).toBe(true);
  });

  it('TC-U-002-004: should reject uppercase', () => {
    expect(validateTestResult('PASS')).toBe(false);
  });

  it('TC-U-002-005: should reject invalid value', () => {
    expect(validateTestResult('error')).toBe(false);
  });

  it('TC-U-002-006: should reject empty string', () => {
    expect(validateTestResult('')).toBe(false);
  });
});
```

### 8.2 findTaskInTree 테스트

#### TC-U-003: findTaskInTree - 정상 케이스

```typescript
describe('findTaskInTree', () => {
  const mockTree: WbsNode[] = [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Work Package 1',
      children: [
        {
          id: 'TSK-01-01',
          type: 'task',
          title: 'Task 1-1',
          children: []
        },
        {
          id: 'ACT-01-02',
          type: 'act',
          title: 'Activity 1-2',
          children: [
            {
              id: 'TSK-01-02-01',
              type: 'task',
              title: 'Task 1-2-1',
              children: []
            }
          ]
        }
      ]
    }
  ];

  it('TC-U-003-001: should find task at depth 2', () => {
    const task = findTaskInTree(mockTree, 'TSK-01-01');
    expect(task).not.toBeNull();
    expect(task!.id).toBe('TSK-01-01');
    expect(task!.type).toBe('task');
  });

  it('TC-U-003-002: should find task at depth 3', () => {
    const task = findTaskInTree(mockTree, 'TSK-01-02-01');
    expect(task).not.toBeNull();
    expect(task!.id).toBe('TSK-01-02-01');
    expect(task!.type).toBe('task');
  });

  it('TC-U-003-003: should return null for non-existent task', () => {
    const task = findTaskInTree(mockTree, 'TSK-99-99');
    expect(task).toBeNull();
  });

  it('TC-U-003-004: should return null for non-task node', () => {
    const task = findTaskInTree(mockTree, 'WP-01');
    expect(task).toBeNull();
  });

  it('TC-U-003-005: should handle empty tree', () => {
    const task = findTaskInTree([], 'TSK-01-01');
    expect(task).toBeNull();
  });
});
```

### 8.3 parseMetadata 테스트

#### TC-U-004: parseMetadata - 정상 케이스

```typescript
describe('parseMetadata', () => {
  it('TC-U-004-001: should parse valid metadata', () => {
    const markdown = `
# WBS - jjiban

> version: 1.0
> depth: 4
> updated: 2025-12-15
> start: 2025-12-13

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0');
    expect(metadata.depth).toBe(4);
    expect(metadata.updated).toBe('2025-12-15');
    expect(metadata.start).toBe('2025-12-13');
  });

  it('TC-U-004-002: should use defaults for missing fields', () => {
    const markdown = `
# WBS - jjiban

> version: 1.0

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0');
    expect(metadata.depth).toBe(3); // 기본값
    expect(metadata.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/); // 오늘 날짜
  });

  it('TC-U-004-003: should handle empty metadata', () => {
    const markdown = `
# WBS - jjiban

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0'); // 기본값
    expect(metadata.depth).toBe(3);
  });
});
```

---

## 9. 통합 테스트 시나리오

### 9.1 정상 시나리오

#### TC-I-001: test-result 업데이트 성공 (none → pass)

**준비**:
```typescript
// 테스트용 wbs.md 파일 생성
const wbsContent = `
# WBS - test-project

> version: 1.0
> depth: 3
> updated: 2025-12-15
> start: 2025-12-13

---

## WP-01: Test Work Package

### TSK-01-01: Test Task
- category: development
- status: [im]
- priority: medium
- assignee: -
- test-result: none
- schedule: 2025-12-15 ~ 2025-12-16
`.trim();

// 파일 저장
await writeMarkdownFile(getWbsPath('test-project'), wbsContent);
```

**실행**:
```typescript
const response = await $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
  method: 'PUT',
  body: { testResult: 'pass' }
});
```

**검증**:
```typescript
// 1. 응답 확인
expect(response.success).toBe(true);
expect(response.testResult).toBe('pass');
expect(response.updated).toBe('2025-12-15');

// 2. 파일 확인
const updatedContent = await readMarkdownFile(getWbsPath('test-project'));
expect(updatedContent).toContain('- test-result: pass');

// 3. 백업 파일 삭제 확인
const backupExists = await fileExists(getWbsPath('test-project') + '.bak');
expect(backupExists).toBe(false);
```

### 9.2 에러 시나리오

#### TC-I-002: Task 미존재 (404)

**실행**:
```typescript
await expect(
  $fetch('/api/projects/test-project/wbs/tasks/TSK-99-99/test-result', {
    method: 'PUT',
    body: { testResult: 'pass' }
  })
).rejects.toThrow(/TASK_NOT_FOUND/);
```

#### TC-I-003: 잘못된 test-result 값 (400)

**실행**:
```typescript
await expect(
  $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
    method: 'PUT',
    body: { testResult: 'error' }
  })
).rejects.toThrow(/INVALID_TEST_RESULT/);
```

#### TC-I-004: 백업 실패 시 업데이트 중단 (500)

**준비**:
```typescript
// fs.copyFile 모킹하여 에러 발생
vi.spyOn(fs, 'copyFile').mockRejectedValueOnce(new Error('ENOSPC'));
```

**실행**:
```typescript
await expect(
  $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
    method: 'PUT',
    body: { testResult: 'pass' }
  })
).rejects.toThrow(/BACKUP_FAILED/);
```

**검증**:
```typescript
// 원본 파일이 변경되지 않았는지 확인
const content = await readMarkdownFile(getWbsPath('test-project'));
expect(content).toContain('- test-result: none'); // 원래 값 유지
```

#### TC-I-005: 파일 쓰기 실패 + 롤백 성공 (500)

**준비**:
```typescript
// writeMarkdownFile 모킹하여 실패
vi.spyOn(file, 'writeMarkdownFile').mockResolvedValueOnce(false);
```

**실행**:
```typescript
await expect(
  $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
    method: 'PUT',
    body: { testResult: 'pass' }
  })
).rejects.toThrow(/FILE_WRITE_ERROR/);
```

**검증**:
```typescript
// 원본 파일이 백업에서 복원되었는지 확인
const content = await readMarkdownFile(getWbsPath('test-project'));
expect(content).toContain('- test-result: none'); // 원래 값 유지

// 백업 파일 삭제 확인
const backupExists = await fileExists(getWbsPath('test-project') + '.bak');
expect(backupExists).toBe(false);
```

---

## 10. E2E 테스트 시나리오

### 10.1 워크플로우 통합 테스트

#### TC-E2E-001: `/wf:test` 명령 실행 후 test-result 자동 업데이트

**사전 조건**: TSK-03-04 (워크플로우 엔진) 구현 완료

**시나리오**:
1. Task 상태: `[im]` (구현 완료)
2. test-result: `none` (초기 상태)
3. `/wf:test` 명령 실행
4. 테스트 스크립트 실행 → 성공
5. test-result 자동 업데이트 → `pass`

**검증**:
- wbs.md 파일에 `- test-result: pass` 반영
- Task 상태 변경 없음 (`[im]` 유지)
- WBS 메타데이터 `updated` 필드 갱신

### 10.2 UI 통합 테스트

#### TC-E2E-002: WBS Tree View에서 test-result 아이콘 표시

**사전 조건**: UI 컴포넌트 구현 완료

**시나리오**:
1. WBS Tree View 페이지 접속
2. TSK-03-05 노드 확인
3. test-result가 `pass`인 경우 체크 아이콘 표시
4. test-result가 `fail`인 경우 X 아이콘 표시
5. test-result가 `none`인 경우 아이콘 없음

---

## 11. 배포 체크리스트

### 11.1 코드 배포

- [ ] `server/api/projects/[id]/wbs/tasks/[taskId]/test-result.put.ts` 생성
- [ ] `server/utils/wbs/taskService.ts`에 `findTaskInTree` 함수 추가
- [ ] 검증 함수 추가 (`validateTaskId`, `validateTestResult`)
- [ ] 메타데이터 파싱 함수 추가 (`parseMetadata`)

### 11.2 테스트

- [ ] 단위 테스트 작성 및 실행 (커버리지 80% 이상)
- [ ] 통합 테스트 작성 및 실행
- [ ] E2E 테스트 시나리오 확인 (워크플로우 연동 후)

### 11.3 환경 확인

- [ ] `.jjiban/projects/{projectId}/wbs.md` 파일 읽기/쓰기 권한
- [ ] 백업 파일 생성 권한
- [ ] 디스크 용량 충분 (wbs.md 크기의 2배 이상)

### 11.4 문서화

- [ ] API 문서 업데이트 (Swagger/OpenAPI)
- [ ] README 업데이트 (API 엔드포인트 추가)
- [ ] 에러 코드 문서 업데이트

---

## 12. 참고 자료

- **기본설계**: 010-basic-design.md
- **PRD**: .jjiban/docs/PRD.md
- **기존 API**: server/api/projects/[id]/wbs.put.ts
- **파서**: server/utils/wbs/parser/index.ts
- **시리얼라이저**: server/utils/wbs/serializer.ts
- **에러 헬퍼**: server/utils/errors/standardError.ts

---

## 13. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-15 | Claude (Opus 4.5) | 초안 작성 |
