# 상세설계: Workflow Engine

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-04 |
| Task명 | Workflow Engine |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| TransitionService | `../TSK-03-03/020-detail-design.md` | API 명세 |

---

## 1. 설계 개요

### 1.1 목적

TransitionService를 감싸는 고수준 워크플로우 오케스트레이션 계층 제공:
- 워크플로우 상태 조회 (status code ↔ state name 매핑)
- 가능한 명령어 조회 (workflows.json 기반)
- 상태 전이 실행 (TransitionService 위임)
- 워크플로우 이력 조회

### 1.2 핵심 결정

**결정 1**: TransitionService 재사용
- TransitionService.getAvailableCommands() 이미 구현됨
- WorkflowEngine은 이를 래핑하여 추가 기능 제공

**결정 2**: State Mapper 분리
- status code ([bd]) ↔ state name (basic-design) 매핑 로직 분리
- workflows.json 기반 동적 매핑

**결정 3**: API 엔드포인트는 최소화
- GET /api/tasks/:id/available-commands (TransitionService 직접 호출)
- GET /api/tasks/:id/history (신규, WorkflowEngine 사용)

---

## 2. 파일 구조

### 2.1 신규 파일

```
server/
├── utils/
│   └── workflow/
│       ├── workflowEngine.ts       (NEW - 고수준 오케스트레이션)
│       ├── stateMapper.ts          (NEW - 상태 매핑)
│       └── transitionService.ts    (기존)
└── api/
    └── tasks/
        ├── [id]/
        │   ├── available-commands.get.ts  (NEW)
        │   └── history.get.ts             (NEW)
        └── [id].get.ts
```

---

## 3. 데이터 모델

### 3.1 WorkflowState 인터페이스

```typescript
/**
 * Task의 현재 워크플로우 상태
 */
export interface WorkflowState {
  taskId: string;
  category: TaskCategory;
  currentState: string;           // 상태 코드 (예: "bd")
  currentStateName: string;       // 상태명 (예: "basic-design")
  workflow: {
    id: string;
    name: string;
    states: string[];
    transitions: WorkflowTransition[];
  };
  availableCommands: string[];
}
```

### 3.2 WorkflowHistory 인터페이스

```typescript
/**
 * 워크플로우 이력 엔트리
 */
export interface WorkflowHistory {
  taskId: string;
  timestamp: string;              // ISO 8601 형식
  action: 'transition' | 'update';
  previousStatus?: string;        // 이전 상태 코드
  newStatus?: string;             // 새 상태 코드
  command?: string;               // 실행한 명령어
  comment?: string;               // 변경 사유
  documentCreated?: string;       // 생성된 문서
}
```

---

## 4. State Mapper 상세설계

### 4.1 파일: server/utils/workflow/stateMapper.ts

```typescript
/**
 * 상태 코드 ↔ 상태명 매핑 유틸리티
 */

import type { TaskCategory } from '../../../types';
import { getWorkflows } from '../settings';

/**
 * 상태 코드를 상태명으로 변환
 * @param category - Task 카테고리
 * @param statusCode - 상태 코드 (예: "bd", "[ ]")
 * @returns 상태명 (예: "basic-design", "todo")
 */
export async function statusCodeToName(
  category: TaskCategory,
  statusCode: string
): Promise<string | null> {
  const workflows = await getWorkflows();
  const workflow = workflows.workflows.find(wf => wf.id === category);

  if (!workflow) {
    return null;
  }

  // statusCode가 "[ ]" 형태면 중괄호 제거
  const cleanCode = statusCode.replace(/[\[\]]/g, '').trim();

  // todo 상태는 빈 문자열 또는 공백
  if (!cleanCode || cleanCode === '[ ]') {
    return 'todo';
  }

  // transitions에서 to 필드가 일치하는 상태명 찾기
  const transition = workflow.transitions.find(t => t.to === cleanCode);
  if (transition) {
    return transition.to;
  }

  // states 배열에서 직접 찾기
  const stateName = workflow.states.find(s => s === cleanCode);
  return stateName || null;
}

/**
 * 상태명을 상태 코드로 변환
 * @param category - Task 카테고리
 * @param stateName - 상태명 (예: "basic-design")
 * @returns 상태 코드 (예: "[bd]")
 */
export async function nameToStatusCode(
  category: TaskCategory,
  stateName: string
): Promise<string> {
  const workflows = await getWorkflows();
  const workflow = workflows.workflows.find(wf => wf.id === category);

  if (!workflow) {
    return '[ ]';
  }

  // todo는 "[ ]"
  if (stateName === 'todo') {
    return '[ ]';
  }

  // transitions에서 to 필드가 stateName인 전이 찾기
  const transition = workflow.transitions.find(t => t.to === stateName);
  if (transition) {
    return `[${transition.to}]`;
  }

  return '[ ]';
}

/**
 * 워크플로우의 모든 상태 코드 매핑 조회
 * @param category - Task 카테고리
 * @returns Record<상태코드, 상태명>
 */
export async function getAllStateMappings(
  category: TaskCategory
): Promise<Record<string, string>> {
  const workflows = await getWorkflows();
  const workflow = workflows.workflows.find(wf => wf.id === category);

  if (!workflow) {
    return {};
  }

  const mappings: Record<string, string> = {
    '[ ]': 'todo',
  };

  // transitions에서 모든 상태 추출
  for (const transition of workflow.transitions) {
    mappings[`[${transition.to}]`] = transition.to;
  }

  return mappings;
}
```

---

## 5. Workflow Engine 상세설계

### 5.1 파일: server/utils/workflow/workflowEngine.ts

```typescript
/**
 * 워크플로우 엔진
 * Task: TSK-03-04
 *
 * 고수준 워크플로우 오케스트레이션
 */

import type {
  WorkflowState,
  WorkflowHistory,
  TaskCategory,
  TransitionResult,
} from '../../../types';
import { findTaskById } from '../wbs/taskService';
import {
  validateTransition,
  executeTransition,
  getAvailableCommands as getCommandsFromTransitionService,
} from './transitionService';
import { statusCodeToName, getAllStateMappings } from './stateMapper';
import { getWorkflows, getActions } from '../settings';
import { readJsonFile, writeJsonFile, getTaskFolderPath, ensureDir } from '../file';
import { join } from 'path';
import {
  createNotFoundError,
  createBadRequestError,
} from '../errors/standardError';

/**
 * Task의 현재 워크플로우 상태 조회
 * @param taskId - Task ID
 * @returns WorkflowState
 * @throws TASK_NOT_FOUND - Task 없음
 *
 * FR-003: 워크플로우 상태 조회
 */
export async function getWorkflowState(
  taskId: string
): Promise<WorkflowState> {
  // Task 검색
  const taskResult = await findTaskById(taskId);
  if (!taskResult) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  const { task } = taskResult;
  const category = task.category as TaskCategory;

  // 상태 코드 추출
  const statusCodeMatch = task.status?.match(/\[([^\]]+)\]/);
  const currentState = statusCodeMatch ? statusCodeMatch[1] : '[ ]';

  // 상태명 조회
  const currentStateName = await statusCodeToName(category, currentState) || 'todo';

  // 워크플로우 정의 조회
  const workflows = await getWorkflows();
  const workflow = workflows.workflows.find(wf => wf.id === category);

  if (!workflow) {
    throw createBadRequestError(
      'WORKFLOW_NOT_FOUND',
      `카테고리 '${category}'에 해당하는 워크플로우를 찾을 수 없습니다`
    );
  }

  // 가능한 명령어 조회 (TransitionService에 위임)
  const availableCommands = await getCommandsFromTransitionService(taskId);

  return {
    taskId,
    category,
    currentState,
    currentStateName,
    workflow: {
      id: workflow.id,
      name: workflow.name,
      states: workflow.states,
      transitions: workflow.transitions,
    },
    availableCommands,
  };
}

/**
 * 가능한 명령어 조회 (TransitionService 래핑)
 * @param taskId - Task ID
 * @returns 가능한 명령어 배열
 *
 * FR-001: 가능한 명령어 조회
 */
export async function getAvailableCommands(
  taskId: string
): Promise<string[]> {
  return getCommandsFromTransitionService(taskId);
}

/**
 * 명령어 실행 및 상태 전이 (TransitionService 래핑)
 * @param taskId - Task ID
 * @param command - 실행할 명령어
 * @param comment - 변경 사유 (선택)
 * @returns TransitionResult
 *
 * FR-002: 상태 전이 실행
 */
export async function executeCommand(
  taskId: string,
  command: string,
  comment?: string
): Promise<TransitionResult> {
  // TransitionService에 위임
  const result = await executeTransition(taskId, command, comment);

  // 이력 기록
  await recordHistory(taskId, {
    taskId,
    timestamp: result.timestamp,
    action: 'transition',
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    command: result.command,
    comment,
    documentCreated: result.documentCreated,
  });

  return result;
}

/**
 * Task의 워크플로우 이력 조회
 * @param taskId - Task ID
 * @param filter - 필터링 옵션
 * @returns WorkflowHistory 배열
 *
 * FR-004: 워크플로우 이력 조회
 */
export async function queryHistory(
  taskId: string,
  filter?: {
    action?: 'transition' | 'update';
    limit?: number;
    offset?: number;
  }
): Promise<WorkflowHistory[]> {
  // Task 존재 확인
  const taskResult = await findTaskById(taskId);
  if (!taskResult) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  const { projectId } = taskResult;
  const historyPath = join(getTaskFolderPath(projectId, taskId), 'workflow-history.json');

  // 이력 파일 읽기
  const history = await readJsonFile<WorkflowHistory[]>(historyPath) || [];

  // 필터링
  let filtered = history;

  if (filter?.action) {
    filtered = filtered.filter(h => h.action === filter.action);
  }

  // 페이징
  const offset = filter?.offset || 0;
  const limit = filter?.limit || filtered.length;

  return filtered.slice(offset, offset + limit);
}

/**
 * 이력 기록 (내부 함수)
 * @param taskId - Task ID
 * @param entry - 이력 엔트리
 */
async function recordHistory(
  taskId: string,
  entry: WorkflowHistory
): Promise<void> {
  const taskResult = await findTaskById(taskId);
  if (!taskResult) {
    return;
  }

  const { projectId } = taskResult;
  const taskFolderPath = getTaskFolderPath(projectId, taskId);
  await ensureDir(taskFolderPath);

  const historyPath = join(taskFolderPath, 'workflow-history.json');

  // 기존 이력 읽기
  const history = await readJsonFile<WorkflowHistory[]>(historyPath) || [];

  // 최신 항목을 앞에 추가
  history.unshift(entry);

  // 최대 100개 유지
  if (history.length > 100) {
    history.splice(100);
  }

  // 저장
  await writeJsonFile(historyPath, history);
}
```

---

## 6. API 엔드포인트 설계

### 6.1 GET /api/tasks/:id/available-commands

**파일**: `server/api/tasks/[id]/available-commands.get.ts`

```typescript
/**
 * Task 가능한 명령어 조회 API
 * Task: TSK-03-04
 */

import { getAvailableCommands } from '../../../utils/workflow/transitionService';
import { findTaskById } from '../../../utils/wbs/taskService';
import { createNotFoundError } from '../../../utils/errors/standardError';

export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'id');

  if (!taskId) {
    throw createNotFoundError('Task ID가 필요합니다');
  }

  // Task 존재 확인
  const taskResult = await findTaskById(taskId);
  if (!taskResult) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  const { task } = taskResult;

  // 가능한 명령어 조회
  const commands = await getAvailableCommands(taskId);

  // 현재 상태 코드 추출
  const statusCodeMatch = task.status?.match(/\[([^\]]+)\]/);
  const currentStatus = statusCodeMatch ? `[${statusCodeMatch[1]}]` : '[ ]';

  return {
    taskId,
    category: task.category,
    currentStatus,
    commands,
  };
});
```

**요청 예시**:
```http
GET /api/tasks/TSK-01-01-01/available-commands
```

**응답 예시**:
```json
{
  "taskId": "TSK-01-01-01",
  "category": "development",
  "currentStatus": "[bd]",
  "commands": ["draft"]
}
```

### 6.2 GET /api/tasks/:id/history

**파일**: `server/api/tasks/[id]/history.get.ts`

```typescript
/**
 * Task 워크플로우 이력 조회 API
 * Task: TSK-03-04
 */

import { queryHistory } from '../../../utils/workflow/workflowEngine';
import { createNotFoundError, createBadRequestError } from '../../../utils/errors/standardError';

export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'id');

  if (!taskId) {
    throw createNotFoundError('Task ID가 필요합니다');
  }

  // 쿼리 파라미터 파싱
  const query = getQuery(event);
  const action = query.action as 'transition' | 'update' | undefined;
  const limit = query.limit ? parseInt(query.limit as string, 10) : 50;
  const offset = query.offset ? parseInt(query.offset as string, 10) : 0;

  // 유효성 검증
  if (action && !['transition', 'update'].includes(action)) {
    throw createBadRequestError(
      'INVALID_PARAMETER',
      'action은 "transition" 또는 "update"여야 합니다'
    );
  }

  if (limit < 1 || limit > 100) {
    throw createBadRequestError(
      'INVALID_PARAMETER',
      'limit은 1-100 사이여야 합니다'
    );
  }

  // 이력 조회
  const history = await queryHistory(taskId, {
    action,
    limit,
    offset,
  });

  return {
    taskId,
    history,
    total: history.length,
    limit,
    offset,
  };
});
```

**요청 예시**:
```http
GET /api/tasks/TSK-01-01-01/history?action=transition&limit=10
```

**응답 예시**:
```json
{
  "taskId": "TSK-01-01-01",
  "history": [
    {
      "taskId": "TSK-01-01-01",
      "timestamp": "2025-12-14T10:30:00Z",
      "action": "transition",
      "previousStatus": "[ ]",
      "newStatus": "bd",
      "command": "start",
      "documentCreated": "010-basic-design.md"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## 7. 타입 정의 (types/index.ts 추가)

```typescript
/**
 * 워크플로우 상태 인터페이스
 */
export interface WorkflowState {
  taskId: string;
  category: TaskCategory;
  currentState: string;
  currentStateName: string;
  workflow: {
    id: string;
    name: string;
    states: string[];
    transitions: WorkflowTransition[];
  };
  availableCommands: string[];
}

/**
 * 워크플로우 이력 인터페이스
 */
export interface WorkflowHistory {
  taskId: string;
  timestamp: string;
  action: 'transition' | 'update';
  previousStatus?: string;
  newStatus?: string;
  command?: string;
  comment?: string;
  documentCreated?: string;
}
```

---

## 8. 에러 처리

| 에러 코드 | HTTP | 상황 | 메시지 |
|---------|------|------|--------|
| TASK_NOT_FOUND | 404 | Task 존재하지 않음 | Task를 찾을 수 없습니다: {taskId} |
| WORKFLOW_NOT_FOUND | 400 | 워크플로우 정의 없음 | 카테고리에 해당하는 워크플로우를 찾을 수 없습니다 |
| INVALID_PARAMETER | 400 | 잘못된 쿼리 파라미터 | {parameter}는 {조건}이어야 합니다 |

---

## 9. 구현 체크리스트

### 9.1 Core Services
- [ ] stateMapper.ts 구현
  - [ ] statusCodeToName()
  - [ ] nameToStatusCode()
  - [ ] getAllStateMappings()
- [ ] workflowEngine.ts 구현
  - [ ] getWorkflowState()
  - [ ] getAvailableCommands() (래퍼)
  - [ ] executeCommand() (래퍼 + 이력 기록)
  - [ ] queryHistory()

### 9.2 API Layer
- [ ] GET /api/tasks/:id/available-commands
- [ ] GET /api/tasks/:id/history

### 9.3 Types
- [ ] types/index.ts에 WorkflowState, WorkflowHistory 추가

---

## 10. 테스트 시나리오

### 10.1 단위 테스트 (stateMapper)

```typescript
// tests/utils/workflow/stateMapper.test.ts
describe('State Mapper', () => {
  it('should convert status code to name', async () => {
    const name = await statusCodeToName('development', 'bd');
    expect(name).toBe('basic-design');
  });

  it('should convert todo status', async () => {
    const name = await statusCodeToName('development', '[ ]');
    expect(name).toBe('todo');
  });

  it('should convert state name to code', async () => {
    const code = await nameToStatusCode('development', 'basic-design');
    expect(code).toBe('[bd]');
  });
});
```

### 10.2 통합 테스트 (API)

```typescript
// tests/e2e/workflow-engine.spec.ts
describe('Workflow Engine API', () => {
  it('GET /api/tasks/:id/available-commands', async () => {
    const response = await $fetch('/api/tasks/TSK-01-01-01/available-commands');
    expect(response.commands).toContain('start');
  });

  it('GET /api/tasks/:id/history', async () => {
    const response = await $fetch('/api/tasks/TSK-01-01-01/history');
    expect(response.history).toBeInstanceOf(Array);
  });
});
```

---

## 11. 설계 결정 및 근거

### 11.1 TransitionService 재사용

**결정**: getAvailableCommands()는 TransitionService 직접 사용

**근거**:
- TransitionService에 이미 구현되어 있음
- 불필요한 중복 코드 방지
- WorkflowEngine은 추가 기능(상태 조회, 이력)만 담당

### 11.2 State Mapper 분리

**결정**: 상태 매핑 로직을 별도 모듈로 분리

**근거**:
- 단일 책임 원칙 (SRP)
- 재사용성 향상 (다른 모듈에서도 사용 가능)
- 테스트 용이성

### 11.3 Workflow History 저장

**결정**: workflow-history.json 파일로 별도 관리

**근거**:
- 기존 history.json과 분리 (관심사 분리)
- 워크플로우 전이 이력만 별도 추적
- 최대 100개 제한으로 파일 크기 관리

---

## 12. 관련 문서

- 기본설계: `010-basic-design.md`
- TransitionService: `../TSK-03-03/020-detail-design.md`
- workflows.json: `.claude/skills/jjiban-init/assets/settings/workflows.json`
- actions.json: `.claude/skills/jjiban-init/assets/settings/actions.json`

---

<!--
author: Claude Code (backend-architect)
Created: 2025-12-14
Task: TSK-03-04 Workflow Engine 상세설계
Purpose: WorkflowEngine 서비스 상세설계, API 엔드포인트, State Mapper 정의
Status: 작성 완료
-->
