# 화면설계 (011-ui-design.md)

**Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02 |
| Task명 | 워크플로우 프롬프트 생성 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

**참고**: 이 Task는 GUI 화면보다 API 인터페이스와 데이터 플로우가 주요 범위입니다.

---

## 1. 인터페이스 개요

| 인터페이스 ID | 유형 | 설명 |
|--------------|------|------|
| IF-01 | Component Event | WorkflowActions → TaskDetailPanel execute 이벤트 |
| IF-02 | Composable | useWorkflowExecution - 프롬프트 생성 및 전송 |
| IF-03 | REST API | GET /api/workflow/available-commands/:taskId |
| IF-04 | REST API | POST /api/terminal/session/:id/input |

---

## 2. 데이터 플로우 다이어그램

### 2.1 전체 플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 사용자 인터랙션 흐름                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [1] 버튼 클릭                                                            │
│       ↓                                                                  │
│  WorkflowActions                                                         │
│       ↓ emit('execute', 'build')                                        │
│                                                                          │
│  [2] 이벤트 처리                                                          │
│       ↓                                                                  │
│  TaskDetailPanel.handleWorkflowExecute('build')                         │
│       ↓                                                                  │
│                                                                          │
│  [3] Composable 호출                                                      │
│       ↓                                                                  │
│  useWorkflowExecution.executeCommand('build')                           │
│       │                                                                  │
│       ├──→ [3.1] generatePrompt('build', 'TSK-02-02')                   │
│       │          → '/wf:build TSK-02-02\n'                               │
│       │                                                                  │
│       ├──→ [3.2] ensureSession()                                        │
│       │          → terminalStore.createSession() if needed              │
│       │          → sessionId                                             │
│       │                                                                  │
│       └──→ [3.3] terminalStore.sendInput(sessionId, prompt)             │
│                  → POST /api/terminal/session/:id/input                  │
│                                                                          │
│  [4] 결과 처리                                                            │
│       ↓                                                                  │
│  Toast 표시 → "명령어 실행 중..."                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 available-commands API 플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 명령어 가용성 조회 플로우                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Client                          Server                                  │
│    │                                │                                    │
│    ├─ GET /api/workflow/available-commands/TSK-02-02 ─────────────────→│
│    │                                │                                    │
│    │                                ├─→ WbsReader.getTaskById()         │
│    │                                │   → { status: '[dd]',              │
│    │                                │       category: 'development' }   │
│    │                                │                                    │
│    │                                ├─→ workflowFilter.getFilteredCmds()│
│    │                                │   → FilteredCommand[]              │
│    │                                │                                    │
│    │←─ { success: true, commands: [...], task: {...} } ────────────────┤
│    │                                │                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. API 인터페이스 설계

### 3.1 GET /api/workflow/available-commands/:taskId

**목적**: Task 상태/카테고리 기반으로 사용 가능한 워크플로우 명령어 목록 반환

**엔드포인트 정보**:

| 항목 | 값 |
|------|-----|
| Method | GET |
| Path | /api/workflow/available-commands/:taskId |
| Auth | 불필요 (로컬 환경) |

**Path Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| taskId | string | Yes | Task ID (예: TSK-02-02) |

**Response Body**:

```typescript
interface AvailableCommandsResponse {
  success: boolean
  commands: FilteredCommand[]
  task?: {
    status: string      // '[dd]'
    category: TaskCategory
  }
  error?: string
}

interface FilteredCommand {
  name: string           // 'build'
  label: string          // '구현'
  icon: string           // 'pi-wrench'
  severity: ButtonSeverity
  availableStatuses: string[]
  categories: TaskCategory[]
  available: boolean     // 현재 상태에서 사용 가능 여부
}
```

**응답 예시**:

```json
{
  "success": true,
  "commands": [
    { "name": "start", "label": "시작", "available": false },
    { "name": "review", "label": "리뷰", "available": true },
    { "name": "apply", "label": "적용", "available": true },
    { "name": "build", "label": "구현", "available": true }
  ],
  "task": {
    "status": "[dd]",
    "category": "development"
  }
}
```

**에러 응답**:

| 상황 | HTTP Status | error 값 |
|------|-------------|----------|
| taskId 누락 | 200 | "taskId is required" |
| Task 없음 | 200 | "Task not found: TSK-99-99" |
| 서버 에러 | 200 | "Internal server error" |

### 3.2 POST /api/terminal/session/:id/input

**목적**: 터미널 세션에 프롬프트 문자열 입력 전송

**엔드포인트 정보**:

| 항목 | 값 |
|------|-----|
| Method | POST |
| Path | /api/terminal/session/:id/input |
| Content-Type | application/json |

**Path Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id | string | Yes | 터미널 세션 ID |

**Request Body**:

```typescript
interface TerminalInputRequest {
  input: string  // '/wf:build TSK-02-02\n'
}
```

**Response Body**:

```typescript
interface TerminalInputResponse {
  success: boolean
  error?: string
}
```

---

## 4. Composable 인터페이스 설계

### 4.1 useWorkflowExecution

**파일 경로**: `app/composables/useWorkflowExecution.ts`

**인터페이스**:

```typescript
interface WorkflowExecutionOptions {
  taskId: string
  projectId: string
  useToast?: boolean  // default: true
}

interface WorkflowExecutionResult {
  executeCommand: (commandName: string) => Promise<void>
  isExecuting: Ref<boolean>
  executingCommand: Ref<string | null>
  error: Ref<string | null>
}

function useWorkflowExecution(
  options: WorkflowExecutionOptions
): WorkflowExecutionResult
```

**내부 함수 시그니처**:

```typescript
/**
 * 프롬프트 문자열 생성
 */
function generatePrompt(commandName: string, taskId: string): string

/**
 * 터미널 세션 확보 (없으면 생성)
 */
async function ensureSession(): Promise<string | null>
```

### 4.2 프롬프트 생성 규칙

| 명령어 타입 | 형식 | 예시 |
|------------|------|------|
| 일반 명령어 | `/wf:<command> <taskId>\n` | `/wf:build TSK-02-02\n` |
| run 명령어 | `/wf:run\n` | `/wf:run\n` |
| auto 명령어 | `/wf:auto <taskId>\n` | `/wf:auto TSK-02-02\n` |

---

## 5. 컴포넌트 이벤트 인터페이스

### 5.1 WorkflowActions 컴포넌트

**이벤트 정의** (TSK-02-01에서 구현됨):

```typescript
const emit = defineEmits<{
  (e: 'execute', commandName: string): void
  (e: 'run'): void
  (e: 'auto'): void
  (e: 'stop'): void
}>()
```

### 5.2 TaskDetailPanel 이벤트 핸들러 (추가 필요)

```vue
<WorkflowActions
  v-if="selectedTask"
  :task="selectedTask"
  :is-executing="workflowExecution?.isExecuting.value || false"
  :executing-command="workflowExecution?.executingCommand.value || null"
  @execute="handleWorkflowExecute"
  @run="handleWorkflowRun"
  @auto="handleWorkflowAuto"
  @stop="handleWorkflowStop"
/>
```

**핸들러 구현**:

```typescript
const workflowExecution = computed(() => {
  if (!selectedTask.value) return null
  return useWorkflowExecution({
    taskId: selectedTask.value.id,
    projectId: selectedProjectId.value || 'jjiban',
    useToast: true
  })
})

async function handleWorkflowExecute(commandName: string) {
  await workflowExecution.value?.executeCommand(commandName)
}
```

---

## 6. UI 상태 변화

### 6.1 버튼 클릭 시 상태 흐름

```
[1] 버튼 클릭 (idle)
      │
      ↓ isExecuting = true
      │
[2] 실행 중 (executing)
      │
      ├── 버튼: disabled + loading spinner
      ├── Toast: "명령어 실행 중..."
      │
      ↓ 완료/에러
      │
[3] 완료 (idle)
      │
      ├── isExecuting = false
      ├── executingCommand = null
      └── Toast: 성공/에러 메시지
```

### 6.2 Toast 메시지

| 상황 | severity | summary | detail |
|------|----------|---------|--------|
| 실행 시작 | info | 명령어 실행 중 | 워크플로우 {command} 실행 중... |
| 세션 생성 실패 | error | 실행 실패 | 터미널 세션 생성 실패 |
| 입력 전송 실패 | error | 실행 실패 | 명령어 전송 실패 |

---

## 7. 에러 처리 UI

### 7.1 에러 메시지 매핑

| 에러 코드 | 사용자 메시지 |
|----------|--------------|
| SESSION_CREATE_FAILED | 터미널 세션 생성에 실패했습니다. |
| INPUT_SEND_FAILED | 명령어 전송에 실패했습니다. |
| TASK_NOT_FOUND | Task를 찾을 수 없습니다. |
| ALREADY_EXECUTING | 이미 실행 중인 명령어가 있습니다. |

### 7.2 에러 상태 표시

- Toast 메시지: severity="error", life=5000ms
- 버튼 상태: 실행 실패 후 재활성화 (다시 시도 가능)

---

## 8. 접근성 고려사항

### 8.1 ARIA 속성

| 컴포넌트 | 속성 | 값 |
|----------|------|-----|
| WorkflowActions | aria-label | 워크플로우 명령어 |
| WorkflowButton (실행 중) | aria-busy | true |
| WorkflowButton (비활성) | aria-disabled | true |

### 8.2 키보드 네비게이션

- Tab: 버튼 간 이동
- Enter/Space: 버튼 클릭
- Escape: 현재 포커스 해제

---

## 9. 관련 문서

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `010-basic-design.md` |
| 상세설계 | `020-detail-design.md` |
| PRD | `.jjiban/projects/jjiban개선/prd.md` 섹션 1.4, 4.3, 4.4 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` 섹션 4, 5 |
| 선행 Task | TSK-02-01 (WorkflowActions 컴포넌트) |
| 후속 Task | TSK-02-03 (타입 및 스토어) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-12-17 | 초안 작성 |

---

<!--
author: Claude
Version: 1.0.0
-->
