# 코드 리뷰 - TSK-03-04

> 리뷰어: Claude
> 리뷰 일시: 2025-12-15
> 리뷰 대상: Workflow Engine 구현

## 1. 리뷰 요약

- **전체 평가**: 7.5/10
- **주요 발견 사항**: 9건
- **개선 권고**: 12건
- **승인 여부**: 조건부 승인 (Medium 이상 2건 필수 수정)

### 종합 의견

구현은 전반적으로 설계 문서를 잘 따르고 있으며, 코드 구조가 명확합니다. TransitionService 재사용 전략이 적절하고, 관심사 분리(State Mapper 분리)가 잘 되어 있습니다. 다만 다음 영역에서 개선이 필요합니다:

1. **에러 처리 일관성**: 일부 함수에서 에러 처리가 누락되거나 불완전
2. **중복 코드**: 상태 코드 추출 로직의 중복
3. **타입 안정성**: `any` 타입 사용 및 타입 정의 불완전
4. **성능**: 반복적인 workflows 로드 (캐싱 부재)

---

## 2. 세부 리뷰

### 2.1 stateMapper.ts

**위치**: `server/utils/workflow/stateMapper.ts` (105 lines)

#### 잘된 점

- **단일 책임 원칙 준수**: 상태 매핑 로직만 담당
- **명확한 함수명**: statusCodeToName, nameToStatusCode 등 직관적
- **JSDoc 문서화**: 모든 export 함수에 문서 작성
- **workflows.json 기반 동적 매핑**: 설정 변경 시 코드 수정 불필요

#### 개선 필요

| 항목 | 위치 | 심각도 | 설명 | 권고 |
|------|------|--------|------|------|
| 중복 코드 | 22-27, 58-63, 87-92 | Medium | workflows 조회 로직 3번 반복 | 공통 함수로 추출 |
| 매직 넘버 | 33, 150 | Low | '[ ]' 문자열 하드코딩 | 상수로 정의 |
| 불완전한 매핑 로직 | 37-41 | Medium | transitions.to 필드로만 매핑하면 실제 status code와 불일치 가능 | workflows.json 구조 검증 필요 |
| 에러 처리 | 26, 62, 91 | High | workflow 없을 때 null/빈값 반환, 명시적 에러 없음 | 표준 에러 반환 |

**상세 분석**:

1. **중복된 workflows 조회** (라인 22-27):
   ```typescript
   const workflows = await getWorkflows();
   const workflow = workflows.workflows.find((wf) => wf.id === category);
   if (!workflow) {
     return null; // or '[ ]' or {}
   }
   ```
   이 패턴이 3개 함수에서 반복됩니다.

2. **매핑 로직 불일치** (라인 37-41):
   ```typescript
   const transition = workflow.transitions.find((t) => t.to === cleanCode);
   if (transition) {
     return transition.to; // 'to' 필드를 그대로 반환
   }
   ```
   workflows.json에서 `to: "bd"` 형태인지 `to: "basic-design"` 형태인지 명확하지 않음.

3. **에러 처리 부재**:
   workflow를 찾지 못할 때 null 반환은 호출자가 null 체크를 해야 하는 부담 발생. 표준 에러로 처리하는 것이 일관성 있음.

---

### 2.2 workflowEngine.ts

**위치**: `server/utils/workflow/workflowEngine.ts` (206 lines)

#### 잘된 점

- **TransitionService 재사용**: 중복 구현 방지, 래퍼 패턴 적용
- **이력 관리**: workflow-history.json 별도 관리, 100개 제한
- **에러 처리**: 표준 에러 (createNotFoundError, createBadRequestError) 사용
- **명확한 함수 역할**: 각 함수가 하나의 책임만 수행

#### 개선 필요

| 항목 | 위치 | 심각도 | 설명 | 권고 |
|------|------|--------|------|------|
| 중복 상태 코드 추출 | 50-51 | Medium | transitionService.ts의 extractStatusCode()와 동일 로직 | 공통 유틸로 분리 |
| 불필요한 래퍼 함수 | 92-96 | Low | getAvailableCommands()가 단순 위임만 수행 | 직접 import 고려 또는 추가 로직 명시 |
| 페이징 로직 오류 | 166-169 | High | total을 filtered.length로 계산하면 전체 개수가 아님 | 전체 이력 길이 반환 |
| 이력 기록 실패 무시 | 177-184 | Medium | recordHistory에서 task 없으면 조용히 return | 로그 또는 경고 필요 |
| 동시성 문제 | 192-204 | Critical | 여러 요청이 동시에 history 수정 시 데이터 손실 가능 | 파일 잠금 또는 트랜잭션 필요 |

**상세 분석**:

1. **중복 상태 코드 추출** (라인 50-51):
   ```typescript
   const statusCodeMatch = task.status?.match(/\[([^\]]+)\]/);
   const currentState = statusCodeMatch ? statusCodeMatch[1] : '[ ]';
   ```
   이 로직은 transitionService.ts의 `extractStatusCode()`와 동일합니다. 공통 유틸리티로 분리해야 합니다.

2. **페이징 total 계산 오류** (라인 166-169):
   ```typescript
   const offset = filter?.offset || 0;
   const limit = filter?.limit || filtered.length;
   return filtered.slice(offset, offset + limit);
   ```
   API 응답의 `total: history.length`는 필터링 후 길이를 반환하므로 클라이언트가 전체 데이터 개수를 알 수 없습니다.

3. **동시성 문제** (라인 192-204):
   ```typescript
   const history = (await readJsonFile<WorkflowHistory[]>(historyPath)) || [];
   history.unshift(entry);
   // ... 사이에 다른 요청이 같은 파일을 수정하면?
   await writeJsonFile(historyPath, history);
   ```
   파일 기반 저장소에서 동시 쓰기 시 데이터 손실 위험이 있습니다.

---

### 2.3 available-commands.get.ts

**위치**: `server/api/tasks/[id]/available-commands.get.ts` (40 lines)

#### 잘된 점

- **명확한 엔드포인트**: RESTful 패턴 준수
- **에러 처리**: 적절한 에러 반환
- **간결한 구현**: 불필요한 복잡성 없음

#### 개선 필요

| 항목 | 위치 | 심각도 | 설명 | 권고 |
|------|------|--------|------|------|
| 중복 상태 코드 추출 | 30-31 | Medium | 동일 로직 3번째 반복 | 공통 유틸 사용 |
| Task 존재 확인 중복 | 18-22 | Low | getAvailableCommands 내부에서도 확인 | 중복 호출 제거 고려 |
| 응답 타입 미정의 | 33-38 | Low | 응답 구조가 인라인 객체 | 타입 정의 권장 |

**상세 분석**:

1. **중복 검증** (라인 18-22):
   ```typescript
   const taskResult = await findTaskById(taskId);
   if (!taskResult) {
     throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
   }
   ```
   `getAvailableCommands(taskId)` 함수 내부에서도 동일한 검증을 수행하므로 중복입니다. 하지만 명시적인 에러 메시지를 위해서는 유지하는 것도 합리적입니다.

---

### 2.4 history.get.ts

**위치**: `server/api/tasks/[id]/history.get.ts` (53 lines)

#### 잘된 점

- **파라미터 검증**: query parameter 유효성 철저히 검증
- **적절한 기본값**: limit=50, offset=0
- **명확한 에러 메시지**: 사용자 친화적

#### 개선 필요

| 항목 | 위치 | 심각도 | 설명 | 권고 |
|------|------|--------|------|------|
| total 계산 오류 | 48 | High | workflowEngine.queryHistory()가 이미 필터링된 결과 반환, total은 잘못된 값 | 전체 이력 개수 별도 반환 |
| 응답 타입 미정의 | 45-51 | Low | 응답 구조 타입 정의 없음 | HistoryResponse 타입 정의 |
| offset 검증 누락 | 21 | Medium | offset < 0 검증 없음 | offset >= 0 검증 추가 |

**상세 분석**:

1. **total 값 부정확** (라인 48):
   ```typescript
   return {
     taskId,
     history,
     total: history.length, // 필터링된 결과의 길이만 반환
     limit,
     offset,
   };
   ```
   클라이언트는 전체 이력이 몇 개인지 알 수 없어 페이징 UI를 구현하기 어렵습니다.

2. **offset 검증 누락** (라인 21):
   ```typescript
   const offset = query.offset ? parseInt(query.offset as string, 10) : 0;
   ```
   음수 offset 허용 시 slice() 동작이 예상과 다를 수 있습니다.

---

### 2.5 types/index.ts

**위치**: `types/index.ts` (라인 195-220)

#### 잘된 점

- **인터페이스 추가**: WorkflowState, WorkflowHistory 명확히 정의
- **기존 타입 재사용**: HistoryEntry와 WorkflowHistory 분리

#### 개선 필요

| 항목 | 위치 | 심각도 | 설명 | 권고 |
|------|------|--------|------|------|
| any 타입 사용 | 205 | Medium | transitions: any[] → 타입 안정성 저하 | WorkflowTransition 타입 사용 |
| 타입 중복 | 113-128, 211-220 | Low | HistoryEntry와 WorkflowHistory 유사 | 통합 고려 |

**상세 분석**:

1. **any 타입** (라인 205):
   ```typescript
   export interface WorkflowState {
     workflow: {
       transitions: any[]; // 타입 안정성 손실
     };
   }
   ```
   `WorkflowTransition` 타입이 이미 존재하므로 사용해야 합니다.

---

## 3. 개선 권고 사항 (우선순위순)

### [Critical] 동시성 문제 해결

- **위치**: workflowEngine.ts:192-204
- **문제**: 여러 요청이 동시에 workflow-history.json 수정 시 데이터 손실 위험
- **권고**: 파일 잠금 메커니즘 또는 큐 기반 쓰기 구현
- **수정 예시**:
  ```typescript
  // 옵션 1: 간단한 뮤텍스 패턴
  const historyLocks = new Map<string, Promise<void>>();

  async function recordHistory(taskId: string, entry: WorkflowHistory): Promise<void> {
    const lockKey = `${taskId}-history`;

    // 이전 작업 완료 대기
    if (historyLocks.has(lockKey)) {
      await historyLocks.get(lockKey);
    }

    // 새 작업 시작
    const operation = (async () => {
      const history = (await readJsonFile<WorkflowHistory[]>(historyPath)) || [];
      history.unshift(entry);
      if (history.length > 100) {
        history.splice(100);
      }
      await writeJsonFile(historyPath, history);
    })();

    historyLocks.set(lockKey, operation);
    await operation;
    historyLocks.delete(lockKey);
  }

  // 옵션 2: 파일 시스템 잠금 라이브러리 사용
  import { lock } from 'proper-lockfile';

  async function recordHistory(taskId: string, entry: WorkflowHistory): Promise<void> {
    const release = await lock(historyPath, { retries: 3 });
    try {
      const history = (await readJsonFile<WorkflowHistory[]>(historyPath)) || [];
      history.unshift(entry);
      if (history.length > 100) {
        history.splice(100);
      }
      await writeJsonFile(historyPath, history);
    } finally {
      await release();
    }
  }
  ```

### [High] 페이징 total 계산 오류 수정

- **위치**:
  - workflowEngine.ts:166-169
  - history.get.ts:45-51
- **문제**: 필터링 후 결과 길이를 total로 반환하여 전체 이력 개수를 알 수 없음
- **권고**: queryHistory() 반환값에 totalCount 필드 추가
- **수정 예시**:
  ```typescript
  // workflowEngine.ts
  export async function queryHistory(
    taskId: string,
    filter?: { action?: 'transition' | 'update'; limit?: number; offset?: number; }
  ): Promise<{ items: WorkflowHistory[]; totalCount: number }> {
    const taskResult = await findTaskById(taskId);
    if (!taskResult) {
      throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
    }

    const { projectId } = taskResult;
    const historyPath = join(getTaskFolderPath(projectId, taskId), 'workflow-history.json');
    const history = (await readJsonFile<WorkflowHistory[]>(historyPath)) || [];

    // 필터링
    let filtered = history;
    if (filter?.action) {
      filtered = filtered.filter((h) => h.action === filter.action);
    }

    const totalCount = filtered.length; // 전체 개수 (필터링 후)
    const offset = filter?.offset || 0;
    const limit = filter?.limit || filtered.length;

    return {
      items: filtered.slice(offset, offset + limit),
      totalCount,
    };
  }

  // history.get.ts
  const result = await queryHistory(taskId, { action, limit, offset });

  return {
    taskId,
    history: result.items,
    total: result.totalCount,
    limit,
    offset,
  };
  ```

### [High] Workflow 조회 실패 시 명시적 에러 처리

- **위치**: stateMapper.ts:22-27, 58-63, 87-92
- **문제**: workflow를 찾지 못하면 null/빈값 반환, 호출자가 null 체크 필요
- **권고**: 표준 에러로 일관성 있게 처리
- **수정 예시**:
  ```typescript
  import { createNotFoundError } from '../errors/standardError';

  async function getWorkflowByCategory(category: TaskCategory) {
    const workflows = await getWorkflows();
    const workflow = workflows.workflows.find((wf) => wf.id === category);

    if (!workflow) {
      throw createNotFoundError(
        `카테고리 '${category}'에 해당하는 워크플로우를 찾을 수 없습니다`
      );
    }

    return workflow;
  }

  export async function statusCodeToName(
    category: TaskCategory,
    statusCode: string
  ): Promise<string> {
    const workflow = await getWorkflowByCategory(category);

    const cleanCode = statusCode.replace(/[\[\]]/g, '').trim();
    if (!cleanCode) {
      return 'todo';
    }

    const transition = workflow.transitions.find((t) => t.to === cleanCode);
    if (transition) {
      return transition.to;
    }

    const stateName = workflow.states.find((s) => s === cleanCode);
    if (!stateName) {
      throw createNotFoundError(
        `카테고리 '${category}'에서 상태 코드 '${statusCode}'를 찾을 수 없습니다`
      );
    }

    return stateName;
  }
  ```

### [Medium] 상태 코드 추출 로직 공통화

- **위치**:
  - workflowEngine.ts:50-51
  - available-commands.get.ts:30-31
  - transitionService.ts:35-39
- **문제**: 동일한 정규식 매칭 로직 3곳에서 반복
- **권고**: 공통 유틸리티 함수로 분리
- **수정 예시**:
  ```typescript
  // server/utils/workflow/statusUtils.ts (NEW)
  /**
   * 상태 문자열에서 상태 코드 추출
   * @param status - 상태 문자열 (예: "detail-design [dd]" 또는 "[dd]")
   * @returns 상태 코드 (예: "dd"), 없으면 빈 문자열
   */
  export function extractStatusCode(status?: string): string {
    if (!status) return '';
    const match = status.match(/\[([^\]]+)\]/);
    return match ? match[1].trim() : '';
  }

  /**
   * 상태 코드를 대괄호 포함 형태로 포맷
   * @param code - 상태 코드 (예: "bd")
   * @returns 포맷된 상태 (예: "[bd]")
   */
  export function formatStatusCode(code: string): string {
    return code ? `[${code}]` : '[ ]';
  }

  // 사용
  import { extractStatusCode } from '../workflow/statusUtils';

  const currentState = extractStatusCode(task.status) || ' '; // "dd"
  const currentStatus = formatStatusCode(currentState); // "[dd]"
  ```

### [Medium] Workflow 조회 로직 중복 제거

- **위치**: stateMapper.ts (전체)
- **문제**: getWorkflows() 호출 및 find() 로직이 3번 반복
- **권고**: 공통 헬퍼 함수 추출
- **수정 예시**:
  ```typescript
  // stateMapper.ts 상단에 추가
  async function getWorkflowByCategory(
    category: TaskCategory
  ): Promise<WorkflowConfig> {
    const workflows = await getWorkflows();
    const workflow = workflows.workflows.find((wf) => wf.id === category);

    if (!workflow) {
      throw createNotFoundError(
        `카테고리 '${category}'에 해당하는 워크플로우를 찾을 수 없습니다`
      );
    }

    return workflow;
  }

  // 각 함수에서 사용
  export async function statusCodeToName(
    category: TaskCategory,
    statusCode: string
  ): Promise<string> {
    const workflow = await getWorkflowByCategory(category);
    // ... 나머지 로직
  }
  ```

### [Medium] 이력 기록 실패 시 로그 추가

- **위치**: workflowEngine.ts:177-184
- **문제**: recordHistory()에서 task가 없으면 조용히 return, 디버깅 어려움
- **권고**: 로그 또는 경고 추가
- **수정 예시**:
  ```typescript
  async function recordHistory(
    taskId: string,
    entry: WorkflowHistory
  ): Promise<void> {
    const taskResult = await findTaskById(taskId);
    if (!taskResult) {
      console.warn(`[WorkflowEngine] Task not found for history recording: ${taskId}`);
      return;
    }

    // ... 나머지 로직
  }
  ```

### [Medium] offset 파라미터 검증 추가

- **위치**: history.get.ts:21
- **문제**: 음수 offset 허용 시 slice() 동작 예상과 다를 수 있음
- **권고**: offset >= 0 검증 추가
- **수정 예시**:
  ```typescript
  const offset = query.offset ? parseInt(query.offset as string, 10) : 0;

  if (offset < 0) {
    throw createBadRequestError(
      'INVALID_PARAMETER',
      'offset은 0 이상이어야 합니다'
    );
  }
  ```

### [Medium] any 타입 제거

- **위치**: types/index.ts:205
- **문제**: transitions: any[] → 타입 안정성 저하
- **권고**: WorkflowTransition 타입 사용
- **수정 예시**:
  ```typescript
  import type { WorkflowTransition } from './settings';

  export interface WorkflowState {
    taskId: string;
    category: TaskCategory;
    currentState: string;
    currentStateName: string;
    workflow: {
      id: string;
      name: string;
      states: string[];
      transitions: WorkflowTransition[]; // any[] → WorkflowTransition[]
    };
    availableCommands: string[];
  }
  ```

### [Low] 매직 스트링 상수화

- **위치**: stateMapper.ts:33, 150 등 전체
- **문제**: '[ ]' 문자열 하드코딩
- **권고**: 상수로 정의
- **수정 예시**:
  ```typescript
  // server/utils/workflow/constants.ts (NEW)
  export const STATUS_CODES = {
    TODO: '[ ]',
    BASIC_DESIGN: '[bd]',
    DETAIL_DESIGN: '[dd]',
    // ... 기타
  } as const;

  export const STATE_NAMES = {
    TODO: 'todo',
    BASIC_DESIGN: 'basic-design',
    // ... 기타
  } as const;

  // 사용
  import { STATUS_CODES, STATE_NAMES } from './constants';

  if (!cleanCode) {
    return STATE_NAMES.TODO;
  }
  ```

### [Low] 불필요한 래퍼 함수 정리

- **위치**: workflowEngine.ts:92-96
- **문제**: getAvailableCommands()가 단순 위임만 수행
- **권고**: 추가 로직이 필요 없다면 직접 import하거나, 미래 확장 가능성 주석 추가
- **수정 예시**:
  ```typescript
  /**
   * 가능한 명령어 조회 (TransitionService 래핑)
   *
   * Note: 현재는 단순 위임이지만, 향후 다음 기능 추가 예정:
   * - 권한 기반 명령어 필터링
   * - 사용자별 커스텀 명령어
   * - 명령어 실행 조건 검증
   *
   * @param taskId - Task ID
   * @returns 가능한 명령어 배열
   */
  export async function getAvailableCommands(
    taskId: string
  ): Promise<string[]> {
    // TODO: 권한 검증 로직 추가
    // TODO: 사용자별 필터링 추가
    return getCommandsFromTransitionService(taskId);
  }
  ```

### [Low] API 응답 타입 정의

- **위치**:
  - available-commands.get.ts:33-38
  - history.get.ts:45-51
- **문제**: 응답 구조가 인라인 객체로 정의됨
- **권고**: types/index.ts에 응답 타입 추가
- **수정 예시**:
  ```typescript
  // types/index.ts
  export interface AvailableCommandsResponse {
    taskId: string;
    category: TaskCategory;
    currentStatus: string;
    commands: string[];
  }

  export interface HistoryResponse {
    taskId: string;
    history: WorkflowHistory[];
    total: number;
    limit: number;
    offset: number;
  }

  // available-commands.get.ts
  import type { AvailableCommandsResponse } from '../../../types';

  export default defineEventHandler(async (event): Promise<AvailableCommandsResponse> => {
    // ... 로직
    return {
      taskId,
      category: task.category,
      currentStatus,
      commands,
    };
  });
  ```

### [Low] 테스트 커버리지 추가

- **위치**: 전체
- **문제**: 구현 문서에 "미구현 - 기존 테스트 활용" 명시
- **권고**: 핵심 로직에 대한 단위 테스트 추가
- **테스트 시나리오**:
  ```typescript
  // tests/utils/workflow/stateMapper.test.ts
  describe('stateMapper', () => {
    describe('statusCodeToName', () => {
      it('should convert valid status code to name', async () => {
        const result = await statusCodeToName('development', 'bd');
        expect(result).toBe('basic-design');
      });

      it('should handle empty status code as todo', async () => {
        const result = await statusCodeToName('development', '[ ]');
        expect(result).toBe('todo');
      });

      it('should throw error for invalid category', async () => {
        await expect(
          statusCodeToName('invalid' as TaskCategory, 'bd')
        ).rejects.toThrow('워크플로우를 찾을 수 없습니다');
      });
    });
  });

  // tests/utils/workflow/workflowEngine.test.ts
  describe('workflowEngine', () => {
    describe('queryHistory', () => {
      it('should return filtered history', async () => {
        const result = await queryHistory('TSK-01-01-01', {
          action: 'transition',
          limit: 10,
        });
        expect(result.items).toBeInstanceOf(Array);
        expect(result.totalCount).toBeGreaterThanOrEqual(0);
      });

      it('should handle concurrent history writes', async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          executeCommand('TSK-01-01-01', 'start', `Test ${i}`)
        );
        await Promise.all(promises);

        const result = await queryHistory('TSK-01-01-01');
        expect(result.totalCount).toBe(5);
      });
    });
  });
  ```

---

## 4. 보안 분석

### 4.1 발견된 보안 이슈

**없음** - 현재 구현에서 명백한 보안 취약점은 발견되지 않았습니다.

### 4.2 잠재적 보안 고려사항

1. **파일 경로 조작**: taskId가 외부 입력이므로 경로 탐색 공격 가능성
   - **현재**: findTaskById()에서 검증 수행 중
   - **권고**: getTaskFolderPath()에서 추가 검증 (../../ 등)

2. **DoS 가능성**: history.json 파일 크기 제한 (100개) 있음 - 양호

3. **인증/권한**: 현재 API 엔드포인트에 인증 로직 없음
   - **권고**: Task 접근 권한 검증 미들웨어 추가 고려 (향후)

---

## 5. 성능 분석

### 5.1 발견된 성능 이슈

1. **반복적인 workflows 로드**: 매 요청마다 getWorkflows() 호출
   - **영향**: 파일 I/O 반복
   - **권고**: settings 모듈에 캐싱 이미 구현되어 있는지 확인 필요 (cache.ts)

2. **이력 전체 읽기**: queryHistory()에서 항상 전체 이력 파일 로드
   - **영향**: 이력이 많을수록 메모리 사용 증가
   - **권고**: 현재 100개 제한으로 영향 미미, 향후 DB 전환 시 고려

### 5.2 성능 개선 제안

```typescript
// settings 캐싱 확인 (이미 구현되어 있다면 OK)
// server/utils/settings/cache.ts 확인 필요

// 만약 캐싱이 없다면:
let workflowsCache: WorkflowsConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1분

async function getWorkflowsCached(): Promise<WorkflowsConfig> {
  const now = Date.now();
  if (workflowsCache && now - cacheTimestamp < CACHE_TTL) {
    return workflowsCache;
  }

  workflowsCache = await getWorkflows();
  cacheTimestamp = now;
  return workflowsCache;
}
```

---

## 6. 코드 품질 메트릭

| 항목 | 평가 | 점수 |
|------|------|------|
| **SOLID 원칙 준수** | 양호 | 8/10 |
| - SRP (단일 책임) | stateMapper, workflowEngine 각각 명확한 역할 | 9/10 |
| - OCP (개방-폐쇄) | workflows.json 기반 확장 가능 | 8/10 |
| - LSP (리스코프 치환) | N/A (상속 미사용) | - |
| - ISP (인터페이스 분리) | 인터페이스 적절히 분리 | 8/10 |
| - DIP (의존성 역전) | 구체 구현 의존 (개선 가능) | 6/10 |
| **코드 중복** | 일부 중복 존재 | 6/10 |
| **에러 처리** | 대부분 적절, 일부 누락 | 7/10 |
| **타입 안정성** | any 타입 1건, 전반적으로 양호 | 7/10 |
| **테스트 가능성** | 함수 분리 양호, Mock 가능 | 8/10 |
| **문서화** | JSDoc 충실, 주석 적절 | 9/10 |
| **가독성** | 명확한 함수명, 구조 | 9/10 |

---

## 7. 기술 부채 평가

| 부채 유형 | 심각도 | 추정 해결 시간 | 우선순위 |
|----------|--------|----------------|----------|
| 동시성 문제 (파일 쓰기) | Critical | 4시간 | P0 |
| 페이징 total 계산 오류 | High | 2시간 | P1 |
| 에러 처리 불일치 | High | 3시간 | P1 |
| 코드 중복 (상태 추출) | Medium | 1시간 | P2 |
| 코드 중복 (workflows 조회) | Medium | 1시간 | P2 |
| any 타입 사용 | Medium | 30분 | P2 |
| 매직 스트링 | Low | 1시간 | P3 |
| 테스트 부재 | Low | 8시간 | P3 |

**총 추정 해결 시간**: 20.5시간

---

## 8. 결론

### 8.1 승인 여부: **조건부 승인**

**필수 수정 항목 (배포 전 완료)**:
1. [Critical] 동시성 문제 해결 (workflowEngine.ts recordHistory)
2. [High] 페이징 total 계산 오류 수정 (queryHistory, history.get.ts)

**권장 수정 항목 (다음 스프린트)**:
1. [High] Workflow 조회 실패 시 명시적 에러 처리
2. [Medium] 상태 코드 추출 로직 공통화
3. [Medium] Workflow 조회 로직 중복 제거
4. [Medium] any 타입 제거

**장기 개선 항목**:
1. [Low] 테스트 커버리지 추가
2. [Low] 매직 스트링 상수화
3. [Low] API 응답 타입 정의

### 8.2 종합 평가

이번 구현은 설계 문서를 충실히 따랐으며, 코드 구조와 관심사 분리가 잘 되어 있습니다. TransitionService 재사용 전략이 효과적이고, 이력 관리 로직도 합리적입니다. 다만 파일 기반 저장소의 동시성 문제와 일부 에러 처리 불일치는 반드시 해결해야 할 사항입니다.

**강점**:
- 명확한 코드 구조 및 함수 분리
- 적절한 추상화 레벨
- 충실한 문서화
- 표준 에러 처리 사용

**개선 필요**:
- 동시성 제어
- 코드 중복 제거
- 타입 안정성 강화
- 테스트 커버리지

**다음 단계**:
1. 필수 수정 항목 2건 완료
2. 통합 테스트 수행 (070-integration-test.md)
3. 권장 수정 항목 백로그 등록
4. WBS 상태 업데이트: [im] → [vf]

---

<!--
리뷰어: Claude Code (Refactoring Expert)
리뷰 일시: 2025-12-15
리뷰 대상: TSK-03-04 Workflow Engine 구현
리뷰 기준: SOLID 원칙, 기술 부채, 보안, 성능, 유지보수성
-->
