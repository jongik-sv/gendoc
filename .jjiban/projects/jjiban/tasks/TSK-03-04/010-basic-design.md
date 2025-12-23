# 기본설계: Workflow Engine

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-04 |
| Task명 | Workflow Engine |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 5.2, 5.3, 6.3.6 |
| TSK-03-03 기본설계 | `../TSK-03-03/010-basic-design.md` | 전체 |
| TSK-03-03 설계 | `../TSK-03-03/020-detail-design.md` | API 명세 |

---

## 1. 역할 정의 및 아키텍처 개요

### 1.1 핵심 개념

**TransitionService** (TSK-03-03에서 구현됨)
- **역할**: 저수준 상태 전이 로직
- **책임**:
  - 상태 전이 가능 여부 검증 (validateTransition)
  - 상태 전이 실행 및 wbs.md 저장 (executeTransition)
  - 이력 기록 (HistoryEntry 작성)
- **범위**: 단일 Task의 상태 변경 (원자적 작업)
- **구현 위치**: `server/utils/workflow/transitionService.ts`

**WorkflowEngine** (이 Task에서 구현할 것)
- **역할**: 고수준 워크플로우 오케스트레이션
- **책상**:
  - 카테고리별 워크플로우 규칙 관리
  - 사용 가능한 명령어 조회 (getAvailableCommands)
  - 명령어 실행 및 검증 (executeCommand)
  - 상태 전이 이력 조회 및 관리 (queryHistory)
  - 상태 액션 정의 및 실행 (handleAction)
- **범위**: Task 워크플로우 전체 생명주기 관리
- **구현 위치**: `server/utils/workflow/workflowEngine.ts`

### 1.2 계층 구조

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (pages/wbs.vue, components/TaskDetailPanel)   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  API Layer                                              │
│  - POST /api/tasks/:id/transition (TSK-03-03)          │
│  - GET /api/tasks/:id/documents (TSK-03-03)            │
│  - GET /api/tasks/:id/history (새로운 엔드포인트)       │
│  - GET /api/tasks/:id/available-commands (새로운)      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  WorkflowEngine (이 Task)                               │
│  - getAvailableCommands(taskId, category, status)      │
│  - executeCommand(taskId, command, comment, actionId)  │
│  - queryHistory(taskId, filter?)                        │
│  - handleAction(taskId, actionId, parameters)          │
│  - getWorkflowState(taskId)                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  TransitionService (TSK-03-03)                          │
│  - validateTransition(taskId, command)                  │
│  - executeTransition(taskId, command, comment)         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Data Layer (WBS, File System)                          │
└─────────────────────────────────────────────────────────┘
```

### 1.3 책임 분리 (Separation of Concerns)

| 기능 | TransitionService | WorkflowEngine |
|-----|-------------------|-----------------|
| 상태 전이 검증 | ✓ (validateTransition) | 신규 (getAvailableCommands) |
| 상태 전이 실행 | ✓ (executeTransition) | 호출 (위임) |
| 워크플로우 규칙 관리 | X | ✓ (workflows.json 로드) |
| 상태 액션 관리 | X | ✓ (actions.json 기반) |
| 이력 기록 | ✓ (HistoryEntry 작성) | X (저수준) |
| 이력 조회 | X | ✓ (queryHistory) |
| 명령어 조회 | X | ✓ (getAvailableCommands) |
| 액션 실행 | X | ✓ (handleAction) |

---

## 2. 데이터 모델

### 2.1 WorkflowState 인터페이스

```typescript
/**
 * Task의 현재 워크플로우 상태
 */
interface WorkflowState {
  taskId: string;
  category: 'development' | 'defect' | 'infrastructure';
  currentState: string;           // 현재 상태 코드 (예: "[bd]")
  currentStateName: string;       // 현재 상태명 (예: "basic-design")
  workflow: {
    name: string;
    states: string[];
    transitions: WorkflowTransition[];
  };
  availableCommands: string[];    // 현재 상태에서 가능한 명령어
  availableActions: WorkflowAction[];  // 현재 상태의 추가 액션
}
```

### 2.2 WorkflowTransition 인터페이스

```typescript
/**
 * 워크플로우 전이 규칙
 */
interface WorkflowTransition {
  from: string;                   // 출발 상태 (예: "todo")
  to: string;                     // 도착 상태 (예: "basic-design")
  command: string;                // 전이 명령어 (예: "start")
  document?: string;              // 생성할 문서 (예: "010-basic-design.md")
}
```

### 2.3 WorkflowAction 인터페이스

```typescript
/**
 * 상태 내 액션 (상태 전이 없이 수행)
 */
interface WorkflowAction {
  id: string;                     // 액션 ID (예: "ui", "review")
  name: string;                   // 액션명 (예: "UI Design")
  command: string;                // CLI 명령어 (예: "/wf:ui")
  document?: string;              // 생성 문서 템플릿
  repeatable: boolean;            // 반복 가능 여부
  description?: string;           // 설명
}
```

### 2.4 WorkflowHistory 인터페이스 (확장)

```typescript
/**
 * 워크플로우 이력 엔트리
 * (기존 HistoryEntry를 확장)
 */
interface WorkflowHistory {
  taskId: string;
  timestamp: string;              // ISO 8601 형식
  userId?: string;                // 사용자 ID (향후 추가)
  action: 'transition' | 'action' | 'update';

  // transition인 경우
  previousStatus?: string;        // 이전 상태 코드 (예: "[ ]")
  newStatus?: string;             // 새 상태 코드 (예: "[bd]")
  command?: string;               // 실행한 명령어

  // action인 경우
  actionId?: string;              // 액션 ID

  // 공통
  comment?: string;               // 변경 사유
  documentCreated?: string;       // 생성된 문서
}
```

---

## 3. WorkflowEngine 서비스 설계

### 3.1 핵심 함수 명세

#### 3.1.1 getAvailableCommands()

```typescript
/**
 * 현재 Task 상태에서 가능한 명령어 조회
 *
 * @param taskId - Task ID
 * @returns 가능한 명령어 배열 (예: ["draft", "skip"])
 * @throws TASK_NOT_FOUND - Task 없음
 *
 * FR-001: 가능한 명령어 조회
 */
export async function getAvailableCommands(
  taskId: string
): Promise<string[]>
```

**로직**:
1. findTaskById()로 Task 검색
2. category, status 추출
3. workflows.json에서 해당 카테고리 워크플로우 로드
4. transitions 배열에서 (from=현재상태, command) 조건 매칭
5. 가능한 command 배열 반환

**예시**:
```
입력: TSK-01-01-01 (development, status="[ ]")
출력: ["start"]

입력: TSK-01-01-01 (development, status="[bd]")
출력: ["draft"]
```

#### 3.1.2 executeCommand()

```typescript
/**
 * 명령어 실행 및 상태 전이
 *
 * @param taskId - Task ID
 * @param command - 실행할 명령어
 * @param comment - 변경 사유 (선택)
 * @param actionId - 액션 ID (선택, 액션 기반 전이인 경우)
 * @returns WorkflowState (전이 후 상태)
 * @throws INVALID_COMMAND - 사용 불가능한 명령어
 * @throws FILE_WRITE_ERROR - wbs.md 저장 실패
 *
 * FR-002: 상태 전이 실행
 */
export async function executeCommand(
  taskId: string,
  command: string,
  comment?: string,
  actionId?: string
): Promise<WorkflowState>
```

**로직**:
1. getAvailableCommands(taskId)로 가능 여부 검증
2. command가 없으면 INVALID_COMMAND 에러 throw
3. TransitionService.executeTransition() 호출 (위임)
4. 성공 시 getWorkflowState(taskId) 호출하여 현재 상태 반환
5. 실패 시 에러 throw

**예시**:
```
입력: (TSK-01-01-01, "start")
→ TransitionService.executeTransition() 호출
→ wbs.md 저장
← 응답: { taskId, category, currentState: "[bd]", ... }

입력: (TSK-01-01-01, "skip")  [infrastructure에서만 가능]
← 에러: INVALID_COMMAND
```

#### 3.1.3 getWorkflowState()

```typescript
/**
 * Task의 현재 워크플로우 상태 조회
 *
 * @param taskId - Task ID
 * @returns WorkflowState
 * @throws TASK_NOT_FOUND - Task 없음
 *
 * FR-003: 워크플로우 상태 조회
 */
export async function getWorkflowState(
  taskId: string
): Promise<WorkflowState>
```

**로직**:
1. findTaskById()로 Task 검색
2. status 추출
3. workflows.json에서 카테고리별 정의 로드
4. 현재 상태에 해당하는 StateName 찾기 (status code → state name 매핑)
5. getAvailableCommands() 호출하여 가능한 명령어 조회
6. 현재 상태의 액션 조회 (actions.json)
7. WorkflowState 객체 반환

**매핑 규칙** (status code ↔ state name):
- development: "[ ]"="todo", "[bd]"="basic-design", "[dd]"="detail-design", "[im]"="implement", "[vf]"="verify", "[xx]"="done"
- defect: "[ ]"="todo", "[an]"="analysis", "[fx]"="fix", "[vf]"="verify", "[xx]"="done"
- infrastructure: "[ ]"="todo", "[ds]"="design", "[im]"="implement", "[xx]"="done"

#### 3.1.4 queryHistory()

```typescript
/**
 * Task의 워크플로우 이력 조회
 *
 * @param taskId - Task ID
 * @param filter - 필터링 옵션 (선택)
 * @returns WorkflowHistory 배열
 * @throws TASK_NOT_FOUND - Task 없음
 *
 * FR-004: 워크플로우 이력 조회
 */
export async function queryHistory(
  taskId: string,
  filter?: {
    action?: 'transition' | 'action';
    limit?: number;
    offset?: number;
  }
): Promise<WorkflowHistory[]>
```

**로직**:
1. Task 검색
2. task.json 또는 별도 history.json 읽기
3. filter 조건 적용 (action 필터, limit/offset 페이징)
4. WorkflowHistory[] 반환

#### 3.1.5 handleAction()

```typescript
/**
 * 상태 액션 실행 (상태 전이 없음)
 *
 * @param taskId - Task ID
 * @param actionId - 액션 ID (예: "ui", "review")
 * @param parameters - 액션 파라미터
 * @returns { success: true, documentCreated?: string }
 * @throws INVALID_ACTION - 해당 상태에서 불가능한 액션
 * @throws ACTION_ERROR - 액션 실행 오류
 *
 * FR-005: 상태 액션 실행
 */
export async function handleAction(
  taskId: string,
  actionId: string,
  parameters?: Record<string, any>
): Promise<{
  success: boolean;
  documentCreated?: string;
  message?: string;
}>
```

**로직**:
1. Task 검색 및 현재 상태 확인
2. actions.json에서 (currentState, actionId) 조건 매칭
3. actionId가 유효하지 않으면 INVALID_ACTION 에러
4. 액션 타입별 처리:
   - "ui": UI 설계 문서 생성 (011-ui-design.md)
   - "review": 설계 리뷰 문서 생성 (021-design-review-{llm}-{n}.md)
   - "apply": 리뷰 반영 (기존 문서 업데이트)
   - "audit": 코드 리뷰 문서 생성 (031-code-review-{llm}-{n}.md)
   - "patch": 패치 적용 (기존 문서 업데이트)
   - "test": 테스트 실행 (반복 가능)
5. 성공 시 { success: true, documentCreated } 반환

---

## 4. 워크플로우 상태 맵핑

### 4.1 Development 워크플로우

```
[  ] (todo)
   ↓ start
[bd] (basic-design) ─── 액션: ui (선택)
   ↓ draft
[dd] (detail-design) ─── 액션: review (반복), apply (반복)
   ↓ build
[im] (implement) ────── 액션: audit (반복), patch (반복), test (반복)
   ↓ verify
[vf] (verify)
   ↓ done
[xx] (done)
```

### 4.2 Defect 워크플로우

```
[  ] (todo)
   ↓ start
[an] (analysis)
   ↓ fix
[fx] (fix) ───────── 액션: audit (반복), test (반복)
   ↓ verify
[vf] (verify)
   ↓ done
[xx] (done)
```

### 4.3 Infrastructure 워크플로우

```
[  ] (todo)
   ├─ start → [ds] (design) ─ build → [im] (implement) ─ done → [xx]
   └─ skip ───────────────────────────────────────────── (바로 완료)
```

---

## 5. 파일 구조 및 설정

### 5.1 설정 파일 (`.jjiban/settings/`)

#### workflows.json
- 워크플로우 정의 (카테고리별)
- states: 상태 배열
- transitions: 전이 규칙 배열
- 현재 파일 위치: `./.claude/skills/jjiban-init/assets/settings/workflows.json`
- **Action**: 프로젝트 초기화 시 `.jjiban/settings/workflows.json`로 복사

#### actions.json
- 상태별 액션 정의
- {state: [{ id, name, command, document, repeatable }]}
- 현재 파일 위치: `./.claude/skills/jjiban-init/assets/settings/actions.json`
- **Action**: 프로젝트 초기화 시 `.jjiban/settings/actions.json`로 복사

### 5.2 구현 파일 (신규)

```
server/
├── utils/
│   └── workflow/
│       ├── workflowEngine.ts        (NEW - 고수준 오케스트레이션)
│       ├── stateMapper.ts           (NEW - status code ↔ state name 매핑)
│       └── transitionService.ts     (기존 - TSK-03-03)
└── api/
    └── tasks/
        ├── [id]/
        │   ├── transition.post.ts    (기존 - TSK-03-03)
        │   ├── documents.get.ts      (기존 - TSK-03-03)
        │   ├── history.get.ts        (NEW)
        │   └── available-commands.get.ts  (NEW)
        └── [id].get.ts              (기존)
```

---

## 6. 에러 처리

### 6.1 에러 코드

| 에러 코드 | HTTP | 상황 | 처리 방법 |
|---------|------|------|---------|
| TASK_NOT_FOUND | 404 | Task 존재하지 않음 | getTaskDetail() 검사 |
| INVALID_COMMAND | 400 | 사용 불가능한 명령어 | getAvailableCommands() 검증 |
| INVALID_ACTION | 400 | 해당 상태에서 불가능한 액션 | actions.json 검사 |
| INVALID_TRANSITION | 409 | 상태 전이 불가 | workflows.json 규칙 검사 |
| FILE_WRITE_ERROR | 500 | wbs.md 저장 실패 | 트랜잭션 롤백 |

### 6.2 표준 에러 응답

```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_COMMAND",
  "message": "이 상태에서 '{command}' 명령어를 사용할 수 없습니다",
  "data": {
    "timestamp": "2025-12-14T10:30:00Z",
    "availableCommands": ["draft", "skip"],
    "currentStatus": "[bd]"
  }
}
```

---

## 7. API 엔드포인트 (신규)

### 7.1 GET /api/tasks/:id/available-commands

```http
GET /api/tasks/TSK-01-01-01/available-commands
```

응답:
```json
{
  "taskId": "TSK-01-01-01",
  "category": "development",
  "currentStatus": "[bd]",
  "commands": ["draft"]
}
```

### 7.2 GET /api/tasks/:id/history

```http
GET /api/tasks/TSK-01-01-01/history?action=transition&limit=10
```

응답:
```json
{
  "taskId": "TSK-01-01-01",
  "history": [
    {
      "timestamp": "2025-12-14T10:30:00Z",
      "action": "transition",
      "previousStatus": "[ ]",
      "newStatus": "[bd]",
      "command": "start",
      "comment": "작업 시작"
    }
  ],
  "total": 5
}
```

---

## 8. 구현 체크리스트

### 8.1 Data Layer

- [ ] stateMapper.ts 구현 (status code ↔ state name 매핑)
- [ ] workflowEngine.ts 구현
  - [ ] getAvailableCommands()
  - [ ] executeCommand()
  - [ ] getWorkflowState()
  - [ ] queryHistory()
  - [ ] handleAction()

### 8.2 API Layer

- [ ] GET /api/tasks/:id/available-commands 엔드포인트
- [ ] GET /api/tasks/:id/history 엔드포인트

### 8.3 Testing

- [ ] workflowEngine 단위 테스트
- [ ] API 통합 테스트
- [ ] E2E 테스트

### 8.4 Settings

- [ ] workflows.json 프로젝트에 복사 (프로젝트 초기화 시)
- [ ] actions.json 프로젝트에 복사 (프로젝트 초기화 시)

---

## 9. 설계 결정 및 근거

### 9.1 TransitionService와의 역할 분리

**결정**: WorkflowEngine은 TransitionService를 감싸는 고수준 오케스트레이션 계층

**근거**:
1. **단일 책임 원칙**: TransitionService는 "상태 전이"에만 집중, WorkflowEngine은 "워크플로우 관리"에 집중
2. **재사용성**: TransitionService는 다른 컨텍스트에서도 활용 가능
3. **테스트 용이성**: 각 계층을 독립적으로 테스트 가능
4. **규칙 관리**: WorkflowEngine이 워크플로우 규칙(workflows.json, actions.json)을 중앙에서 관리

### 9.2 상태 매핑 전략

**결정**: status code ([bd]) ↔ state name (basic-design) 양방향 매핑

**근거**:
1. **이중 표현**:
   - wbs.md에는 status code만 저장 (간결성)
   - API/UI에서는 state name 사용 (가독성)
2. **구현 방법**: stateMapper.ts에서 설정 기반 매핑
3. **확장성**: 새로운 워크플로우 추가 시 workflows.json만 수정하면 자동 지원

### 9.3 액션 관리 구조

**결정**: actions.json을 통한 선언적 액션 정의

**근거**:
1. **유연성**: 코드 변경 없이 설정만으로 액션 추가/제거 가능
2. **재사용성**: 반복 가능한 액션 지원 (review, patch 등)
3. **문서 생성**: 각 액션이 생성할 문서 템플릿을 명시
4. **타입 안전성**: 유효한 액션만 실행 가능 (검증)

---

## 10. 다음 단계

1. ✓ 기본설계 작성 (현재)
2. ⏳ 상세설계 (020-detail-design.md)
3. ⏳ 구현 (030-implementation.md)
4. ⏳ 테스트 (070-integration-test.md)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 5.2, 5.3, 6.3.6)
- TSK-03-03 Workflow API: `../TSK-03-03/010-basic-design.md`
- Workflow Settings: `./.claude/skills/jjiban-init/assets/settings/workflows.json`
- Action Settings: `./.claude/skills/jjiban-init/assets/settings/actions.json`

---

<!--
author: Claude Code (requirements-analyst)
Created: 2025-12-14
Task: TSK-03-04 Workflow Engine 기본설계
Purpose: WorkflowEngine 서비스 아키텍처, 인터페이스, 상태 맵핑 정의
Status: 작성 완료
-->
