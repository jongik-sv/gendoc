# 사용자 매뉴얼 - Workflow Engine

**문서 버전:** 1.0.0 — **최종 수정일:** 2025-12-15

---

## 1. 개요

### 1.1 목적

Workflow Engine은 jjiban 프로젝트에서 Task의 워크플로우 상태 관리를 담당하는 핵심 서비스입니다. 이 모듈을 통해:

- Task의 현재 워크플로우 상태 조회
- 가능한 상태 전이 명령어 확인
- 상태 전이 실행 및 이력 관리
- 워크플로우 이력 조회

### 1.2 대상 사용자

- **백엔드 개발자**: API 연동, 서비스 확장
- **프론트엔드 개발자**: UI에서 API 호출
- **시스템 관리자**: 워크플로우 모니터링

---

## 2. API 레퍼런스

### 2.1 가능한 명령어 조회

Task의 현재 상태에서 실행 가능한 워크플로우 명령어를 조회합니다.

**엔드포인트**
```http
GET /api/tasks/{taskId}/available-commands
```

**요청 예시**
```bash
curl http://localhost:3000/api/tasks/TSK-01-01-01/available-commands
```

**응답**
```json
{
  "taskId": "TSK-01-01-01",
  "category": "development",
  "currentStatus": "[bd]",
  "commands": ["draft"]
}
```

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| taskId | string | Task 식별자 |
| category | string | Task 카테고리 (development, defect, infrastructure) |
| currentStatus | string | 현재 상태 코드 (예: "[bd]") |
| commands | string[] | 실행 가능한 명령어 목록 |

**에러 응답**

| 상황 | HTTP 코드 | 에러 메시지 |
|------|----------|------------|
| Task 없음 | 404 | Task를 찾을 수 없습니다: {taskId} |

---

### 2.2 워크플로우 이력 조회

Task의 워크플로우 상태 변경 이력을 조회합니다.

**엔드포인트**
```http
GET /api/tasks/{taskId}/history
```

**쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| action | string | - | 필터: "transition" 또는 "update" |
| limit | number | 50 | 반환할 이력 개수 (1-100) |
| offset | number | 0 | 시작 위치 (페이징) |

**요청 예시**
```bash
# 전체 이력 조회
curl http://localhost:3000/api/tasks/TSK-01-01-01/history

# 상태 전이만 필터링
curl http://localhost:3000/api/tasks/TSK-01-01-01/history?action=transition

# 페이징
curl http://localhost:3000/api/tasks/TSK-01-01-01/history?limit=10&offset=0
```

**응답**
```json
{
  "taskId": "TSK-01-01-01",
  "history": [
    {
      "taskId": "TSK-01-01-01",
      "timestamp": "2025-12-15T10:30:00Z",
      "action": "transition",
      "previousStatus": "[ ]",
      "newStatus": "bd",
      "command": "start",
      "comment": "기본설계 시작",
      "documentCreated": "010-basic-design.md"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| taskId | string | Task 식별자 |
| history | array | 이력 목록 (최신순) |
| total | number | 전체 이력 개수 (필터링 후) |
| limit | number | 요청한 limit 값 |
| offset | number | 요청한 offset 값 |

**이력 항목 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| taskId | string | Task 식별자 |
| timestamp | string | 변경 시각 (ISO 8601) |
| action | string | 액션 유형: "transition" 또는 "update" |
| previousStatus | string | 이전 상태 코드 |
| newStatus | string | 새 상태 코드 |
| command | string | 실행된 명령어 |
| comment | string | 변경 사유 (선택) |
| documentCreated | string | 생성된 문서 파일명 (선택) |

**에러 응답**

| 상황 | HTTP 코드 | 에러 메시지 |
|------|----------|------------|
| Task 없음 | 404 | Task를 찾을 수 없습니다: {taskId} |
| 잘못된 action | 400 | action은 "transition" 또는 "update"여야 합니다 |
| 잘못된 limit | 400 | limit은 1-100 사이여야 합니다 |
| 잘못된 offset | 400 | offset은 0 이상이어야 합니다 |

---

## 3. 서비스 API

### 3.1 WorkflowEngine 서비스

프로그래밍 방식으로 워크플로우 기능을 사용하려면 workflowEngine 모듈을 import합니다.

```typescript
import {
  getWorkflowState,
  getAvailableCommands,
  executeCommand,
  queryHistory,
} from '~/server/utils/workflow/workflowEngine';
```

#### getWorkflowState(taskId)

Task의 전체 워크플로우 상태를 조회합니다.

```typescript
const state = await getWorkflowState('TSK-01-01-01');
console.log(state);
// {
//   taskId: 'TSK-01-01-01',
//   category: 'development',
//   currentState: 'bd',
//   currentStateName: 'basic-design',
//   workflow: {
//     id: 'development',
//     name: 'Development Workflow',
//     states: ['todo', 'basic-design', ...],
//     transitions: [...]
//   },
//   availableCommands: ['draft']
// }
```

#### getAvailableCommands(taskId)

현재 상태에서 실행 가능한 명령어 목록을 조회합니다.

```typescript
const commands = await getAvailableCommands('TSK-01-01-01');
console.log(commands); // ['draft']
```

#### executeCommand(taskId, command, comment?)

워크플로우 명령어를 실행합니다.

```typescript
const result = await executeCommand('TSK-01-01-01', 'draft', '상세설계 진행');
console.log(result);
// {
//   taskId: 'TSK-01-01-01',
//   previousStatus: '[bd]',
//   newStatus: '[dd]',
//   command: 'draft',
//   timestamp: '2025-12-15T10:30:00Z',
//   documentCreated: '020-detail-design.md'
// }
```

#### queryHistory(taskId, filter?)

워크플로우 이력을 조회합니다.

```typescript
const result = await queryHistory('TSK-01-01-01', {
  action: 'transition',
  limit: 10,
  offset: 0,
});
console.log(result);
// {
//   items: [...],
//   totalCount: 5
// }
```

---

### 3.2 State Mapper 유틸리티

상태 코드와 상태명 간 변환을 위한 유틸리티입니다.

```typescript
import {
  statusCodeToName,
  nameToStatusCode,
  getAllStateMappings,
} from '~/server/utils/workflow/stateMapper';
```

#### statusCodeToName(category, statusCode)

상태 코드를 상태명으로 변환합니다.

```typescript
const name = await statusCodeToName('development', 'bd');
console.log(name); // 'basic-design'
```

#### nameToStatusCode(category, stateName)

상태명을 상태 코드로 변환합니다.

```typescript
const code = await nameToStatusCode('development', 'basic-design');
console.log(code); // '[bd]'
```

#### getAllStateMappings(category)

카테고리의 모든 상태 매핑을 조회합니다.

```typescript
const mappings = await getAllStateMappings('development');
console.log(mappings);
// {
//   '[ ]': 'todo',
//   '[bd]': 'basic-design',
//   '[dd]': 'detail-design',
//   ...
// }
```

---

### 3.3 Status Utils

상태 코드 추출 및 포맷팅 유틸리티입니다.

```typescript
import {
  extractStatusCode,
  formatStatusCode,
  isTodoStatus,
} from '~/server/utils/workflow/statusUtils';
```

#### extractStatusCode(status)

상태 문자열에서 상태 코드를 추출합니다.

```typescript
extractStatusCode('detail-design [dd]'); // 'dd'
extractStatusCode('[bd]'); // 'bd'
extractStatusCode('todo'); // ''
```

#### formatStatusCode(code)

상태 코드를 대괄호 포함 형태로 포맷합니다.

```typescript
formatStatusCode('bd'); // '[bd]'
formatStatusCode(''); // '[ ]'
```

#### isTodoStatus(status)

상태가 todo인지 확인합니다.

```typescript
isTodoStatus('[ ]'); // true
isTodoStatus('[bd]'); // false
```

---

## 4. 워크플로우 상태

### 4.1 상태 코드표

| 코드 | 의미 | 카테고리 | 다음 명령어 |
|------|------|----------|------------|
| `[ ]` | Todo (미시작) | 공통 | start |
| `[bd]` | 기본설계 | development | draft |
| `[dd]` | 상세설계 | development | build |
| `[an]` | 분석 | defect | fix |
| `[ds]` | 설계 | infrastructure | build |
| `[im]` | 구현 | 공통 | verify |
| `[fx]` | 수정 | defect | verify |
| `[ts]` | 테스트 | 공통 | done |
| `[xx]` | 완료 | 공통 | - |

### 4.2 카테고리별 워크플로우

**development (개발)**
```
[ ] Todo → [bd] 기본설계 → [dd] 상세설계 → [im] 구현 → [ts] 테스트 → [xx] 완료
```

**defect (결함)**
```
[ ] Todo → [an] 분석 → [fx] 수정 → [ts] 테스트 → [xx] 완료
```

**infrastructure (인프라)**
```
[ ] Todo → [ds] 설계 (선택) → [im] 구현 → [xx] 완료
```

---

## 5. 이력 관리

### 5.1 이력 저장 위치

워크플로우 이력은 각 Task 폴더에 JSON 파일로 저장됩니다:

```
.jjiban/projects/{projectId}/tasks/{taskId}/workflow-history.json
```

### 5.2 이력 보관 정책

- 최신 항목이 배열 앞에 위치
- 최대 100개 항목 보관
- 100개 초과 시 오래된 항목 자동 삭제

### 5.3 동시성 제어

여러 요청이 동시에 이력을 수정할 때 데이터 손실을 방지하기 위해 뮤텍스 패턴이 적용되어 있습니다. 동일 Task에 대한 동시 쓰기는 순차적으로 처리됩니다.

---

## 6. 트러블슈팅

### 6.1 FAQ

**Q: 명령어 목록이 비어있습니다**
- Task의 현재 상태가 완료(`[xx]`)인지 확인하세요
- 카테고리가 올바르게 설정되어 있는지 확인하세요

**Q: 이력이 조회되지 않습니다**
- `workflow-history.json` 파일이 존재하는지 확인하세요
- 처음 생성된 Task는 이력이 없을 수 있습니다

**Q: 상태 전이가 실패합니다**
- 현재 상태에서 해당 명령어가 유효한지 확인하세요
- `getAvailableCommands()`로 가능한 명령어를 먼저 확인하세요

### 6.2 에러 코드

| 에러 코드 | 의미 | 해결 방법 |
|----------|------|----------|
| TASK_NOT_FOUND | Task가 존재하지 않음 | Task ID 확인 |
| WORKFLOW_NOT_FOUND | 워크플로우 정의 없음 | 카테고리 확인, workflows.json 확인 |
| INVALID_TRANSITION | 잘못된 상태 전이 | 현재 상태에서 가능한 명령어 확인 |
| INVALID_PARAMETER | 잘못된 파라미터 | API 요청 파라미터 확인 |

---

## 7. 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 구현 문서: `030-implementation.md`
- 통합 테스트: `070-integration-test.md`
- 코드 리뷰: `031-code-review-claude-1(적용완료).md`

---

<!--
author: Claude Code
Created: 2025-12-15
Task: TSK-03-04 Workflow Engine
Purpose: Workflow Engine 사용자 매뉴얼
-->
