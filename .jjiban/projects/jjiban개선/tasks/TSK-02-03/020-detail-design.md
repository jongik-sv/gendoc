# 상세설계: 워크플로우 타입 및 스토어

**Task ID**: TSK-02-03
**문서 버전**: 1.0
**작성일**: 2025-12-17
**참조**: PRD 4.5, 5.4, 5.5, 010-basic-design.md

---

## 1. 개요

### 1.1 목적

워크플로우 타입 시스템과 상태 관리의 기술 구현 명세를 제공합니다. TypeScript 인터페이스, Pinia Store 구조, Composable 함수의 상세한 설계를 포함합니다.

### 1.2 구현 범위

| 파일 | 역할 | LOC |
|------|------|-----|
| `app/types/terminal.ts` | 터미널/워크플로우 타입 정의 | ~150 |
| `app/stores/terminal.ts` | 터미널 세션 상태 관리 | ~250 |
| `app/stores/workflow.ts` | 워크플로우 실행 상태 관리 | ~200 |
| `app/composables/useTerminal.ts` | 터미널 로직 Composable | ~150 |
| `app/composables/useWorkflow.ts` | 워크플로우 로직 Composable | ~120 |

---

## 2. 타입 정의: types/terminal.ts

### 2.1 터미널 세션 타입

```typescript
/**
 * 터미널 세션 상태
 */
export type TerminalSessionStatus =
  | 'connecting'  // 연결 시도 중
  | 'connected'   // 연결됨 (대기)
  | 'running'     // 명령어 실행 중
  | 'completed'   // 명령어 완료
  | 'error'       // 에러 발생

/**
 * 터미널 세션 정보
 * node-pty로 생성된 터미널 프로세스를 나타냄
 */
export interface TerminalSession {
  id: string                          // 세션 ID (UUID)
  pid: number                         // 터미널 프로세스 PID (node-pty)
  taskId?: string                     // 연결된 Task ID (옵션)
  projectId?: string                  // 연결된 프로젝트 ID (옵션)
  status: TerminalSessionStatus       // 현재 상태
  currentCommand?: string             // 실행 중인 명령어 (예: "/wf:build")
  createdAt: string                   // 생성 시각 (ISO 8601)
  updatedAt: string                   // 최종 업데이트 시각 (ISO 8601)
}

/**
 * 터미널 세션 생성 요청
 */
export interface CreateTerminalSessionRequest {
  taskId?: string       // Task ID (옵션)
  projectId?: string    // 프로젝트 ID (옵션)
  cols: number          // 터미널 너비 (기본: 80)
  rows: number          // 터미널 높이 (기본: 24)
}

/**
 * 터미널 세션 생성 응답
 */
export interface CreateTerminalSessionResponse {
  success: boolean
  sessionId: string
  status: TerminalSessionStatus
  createdAt: string
  error?: string
}

/**
 * 터미널 세션 목록 조회 응답
 */
export interface TerminalSessionListResponse {
  sessions: TerminalSession[]
  total: number
}
```

### 2.2 터미널 입출력 타입

```typescript
/**
 * 터미널 출력 타입
 */
export type TerminalOutputType =
  | 'stdout'   // 표준 출력
  | 'stderr'   // 표준 에러
  | 'system'   // 시스템 메시지 (세션 생성/종료 등)

/**
 * 터미널 출력 데이터
 * SSE로 전송되는 출력 단위
 */
export interface TerminalOutput {
  type: TerminalOutputType
  text: string                        // 출력 텍스트 (ANSI 이스케이프 포함 가능)
  timestamp: string                   // 출력 시각 (ISO 8601)
}

/**
 * 터미널 입력 요청
 */
export interface TerminalInputRequest {
  input: string                       // 입력 텍스트 (개행 포함 가능)
}

/**
 * 터미널 리사이즈 요청
 */
export interface TerminalResizeRequest {
  cols: number                        // 새 너비
  rows: number                        // 새 높이
}
```

### 2.3 워크플로우 타입

```typescript
/**
 * 워크플로우 명령어 메타데이터
 * 버튼 UI 및 가용성 판단에 사용
 */
export interface WorkflowCommand {
  name: string                        // 명령어 이름 (예: "start", "build")
  label: string                       // 버튼 레이블 (예: "시작", "구현")
  icon: string                        // PrimeIcon 클래스 (예: "pi-play")
  severity: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger'
  availableStatuses: string[]         // 사용 가능한 상태 목록 (예: ["[ ]"])
  categories: ('development' | 'defect' | 'infrastructure')[]
  description?: string                // 설명 (툴팁)
}

/**
 * 워크플로우 실행 요청
 */
export interface WorkflowExecuteRequest {
  taskId: string                      // 대상 Task ID
  projectId: string                   // 프로젝트 ID
  command: string                     // 명령어 이름 (예: "build")
  options?: {
    until?: string                    // 중간 단계까지만 실행 (auto 명령어용)
    skipReview?: boolean              // 설계 리뷰 생략
    skipAudit?: boolean               // 코드 리뷰 생략
    dryRun?: boolean                  // 시뮬레이션 모드
    maxTasks?: number                 // 최대 Task 수 (run 명령어용)
  }
}

/**
 * 워크플로우 실행 응답
 */
export interface WorkflowExecuteResponse {
  success: boolean
  sessionId?: string                  // 터미널 세션 ID
  taskId?: string
  command?: string
  prompt?: string                     // 생성된 프롬프트 문자열
  error?: string
  message?: string
}

/**
 * Task별 사용 가능 명령어 조회 응답
 */
export interface AvailableCommandsResponse {
  taskId: string
  category: string                    // Task 카테고리
  status: string                      // 현재 상태
  commands: WorkflowCommand[]         // 사용 가능한 명령어 목록
}
```

### 2.4 실행 정보 타입 (Execution Store 연동)

```typescript
/**
 * 워크플로우 실행 정보
 * ExecutionManager에서 관리하는 실행 상태
 */
export interface ExecutionInfo {
  taskId: string                      // Task ID
  command: string                     // 실행 중인 명령어
  sessionId: string                   // 터미널 세션 ID
  pid: number                         // 터미널 프로세스 PID
  startedAt: Date                     // 시작 시각
}

/**
 * 실행 상태 조회 응답
 */
export interface ExecutionStatusResponse {
  executingTaskIds: string[]          // 실행 중인 Task ID 목록
  executions: ExecutionInfo[]         // 실행 정보 목록
  count: number                       // 실행 중인 Task 수
  cleanedStale: number                // 정리된 Stale Execution 수
}
```

### 2.5 워크플로우 명령어 상수

```typescript
/**
 * 워크플로우 명령어 메타데이터 (15개)
 * 클라이언트 측 기본값 (서버 API가 실패하면 사용)
 */
export const WORKFLOW_COMMANDS: WorkflowCommand[] = [
  {
    name: 'start',
    label: '시작',
    icon: 'pi-play',
    severity: 'primary',
    availableStatuses: ['[ ]'],
    categories: ['development', 'defect', 'infrastructure'],
    description: '워크플로우 시작'
  },
  {
    name: 'ui',
    label: '화면설계',
    icon: 'pi-palette',
    severity: 'info',
    availableStatuses: ['[bd]'],
    categories: ['development'],
    description: '화면설계 작성'
  },
  {
    name: 'draft',
    label: '상세설계',
    icon: 'pi-file-edit',
    severity: 'info',
    availableStatuses: ['[bd]'],
    categories: ['development'],
    description: '상세설계로 전환'
  },
  {
    name: 'review',
    label: '설계리뷰',
    icon: 'pi-eye',
    severity: 'secondary',
    availableStatuses: ['[dd]'],
    categories: ['development'],
    description: '설계 리뷰 요청'
  },
  {
    name: 'apply',
    label: '리뷰반영',
    icon: 'pi-check-circle',
    severity: 'secondary',
    availableStatuses: ['[dd]'],
    categories: ['development'],
    description: '설계 리뷰 반영'
  },
  {
    name: 'build',
    label: '구현',
    icon: 'pi-code',
    severity: 'primary',
    availableStatuses: ['[dd]'],
    categories: ['development', 'infrastructure'],
    description: 'TDD 기반 구현'
  },
  {
    name: 'test',
    label: '테스트',
    icon: 'pi-cog',
    severity: 'secondary',
    availableStatuses: ['[im]'],
    categories: ['development'],
    description: '테스트 실행'
  },
  {
    name: 'audit',
    label: '코드리뷰',
    icon: 'pi-search',
    severity: 'secondary',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development'],
    description: '코드 리뷰 요청'
  },
  {
    name: 'patch',
    label: '리뷰반영',
    icon: 'pi-check',
    severity: 'secondary',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development'],
    description: '코드 리뷰 반영'
  },
  {
    name: 'verify',
    label: '검증',
    icon: 'pi-verified',
    severity: 'success',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development', 'defect'],
    description: '통합테스트'
  },
  {
    name: 'done',
    label: '완료',
    icon: 'pi-check-circle',
    severity: 'success',
    availableStatuses: ['[vf]'],
    categories: ['development', 'defect', 'infrastructure'],
    description: '완료 처리'
  },
  {
    name: 'fix',
    label: '수정',
    icon: 'pi-wrench',
    severity: 'danger',
    availableStatuses: ['[an]'],
    categories: ['defect'],
    description: '결함 수정'
  },
  {
    name: 'skip',
    label: '설계생략',
    icon: 'pi-forward',
    severity: 'secondary',
    availableStatuses: ['[ ]'],
    categories: ['infrastructure'],
    description: '설계 생략하고 구현'
  },
  {
    name: 'run',
    label: '병렬실행',
    icon: 'pi-play-circle',
    severity: 'primary',
    availableStatuses: ['[ ]', '[bd]', '[dd]', '[im]', '[vf]'],
    categories: ['development', 'defect', 'infrastructure'],
    description: '병렬 자동 실행'
  },
  {
    name: 'auto',
    label: '순차실행',
    icon: 'pi-fast-forward',
    severity: 'primary',
    availableStatuses: ['[ ]', '[bd]', '[dd]', '[im]', '[vf]'],
    categories: ['development', 'defect', 'infrastructure'],
    description: '순차 자동 실행'
  }
]
```

---

## 3. Terminal Store: stores/terminal.ts

### 3.1 State 정의

```typescript
import type {
  TerminalSession,
  CreateTerminalSessionRequest,
  CreateTerminalSessionResponse,
  TerminalInputRequest,
  TerminalResizeRequest
} from '~/types/terminal'

export const useTerminalStore = defineStore('terminal', () => {
  // ============================================================
  // State
  // ============================================================

  /**
   * 터미널 세션 Map
   * Key: sessionId, Value: TerminalSession
   */
  const sessions = ref<Map<string, TerminalSession>>(new Map())

  /**
   * 현재 활성화된 세션 ID (전역 다이얼로그용)
   */
  const activeSessionId = ref<string | null>(null)

  /**
   * 연결 중 여부
   */
  const isConnecting = ref(false)

  /**
   * 에러 메시지
   */
  const error = ref<string | null>(null)

  /**
   * 마지막 동기화 시각
   */
  const lastSyncedAt = ref<Date | null>(null)
```

### 3.2 Getters

```typescript
  // ============================================================
  // Getters
  // ============================================================

  /**
   * 세션 수
   */
  const sessionCount = computed(() => sessions.value.size)

  /**
   * 실행 중인 세션 수 (배지 표시용)
   */
  const runningSessionCount = computed(() => {
    return Array.from(sessions.value.values()).filter(
      s => s.status === 'running'
    ).length
  })

  /**
   * 현재 활성 세션
   */
  const activeSession = computed((): TerminalSession | null => {
    if (!activeSessionId.value) return null
    return sessions.value.get(activeSessionId.value) || null
  })

  /**
   * 세션 목록 (배열)
   */
  const sessionList = computed((): TerminalSession[] => {
    return Array.from(sessions.value.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  /**
   * 특정 Task의 세션 조회
   */
  function getSessionByTaskId(taskId: string): TerminalSession | null {
    for (const session of sessions.value.values()) {
      if (session.taskId === taskId) {
        return session
      }
    }
    return null
  }

  /**
   * 세션 ID로 세션 조회
   */
  function getSession(sessionId: string): TerminalSession | null {
    return sessions.value.get(sessionId) || null
  }
```

### 3.3 Actions

```typescript
  // ============================================================
  // Actions
  // ============================================================

  /**
   * 터미널 세션 생성
   */
  async function createSession(
    request: CreateTerminalSessionRequest
  ): Promise<string> {
    try {
      isConnecting.value = true
      error.value = null

      const response = await $fetch<CreateTerminalSessionResponse>(
        '/api/terminal/session',
        {
          method: 'POST',
          body: request
        }
      )

      if (!response.success || !response.sessionId) {
        throw new Error(response.error || '세션 생성 실패')
      }

      // 로컬 상태 업데이트
      const newSession: TerminalSession = {
        id: response.sessionId,
        pid: 0, // 서버에서 할당, 다음 sync에서 업데이트
        taskId: request.taskId,
        projectId: request.projectId,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.createdAt
      }

      sessions.value.set(response.sessionId, newSession)
      activeSessionId.value = response.sessionId

      return response.sessionId
    } catch (e) {
      error.value = e instanceof Error ? e.message : '세션 생성 실패'
      console.error('[terminalStore] createSession error:', e)
      throw e
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * 터미널 세션 종료
   */
  async function closeSession(sessionId: string): Promise<void> {
    try {
      await $fetch(`/api/terminal/session/${sessionId}`, {
        method: 'DELETE'
      })

      // 로컬 상태 업데이트
      sessions.value.delete(sessionId)

      // 활성 세션이 종료되면 null로 설정
      if (activeSessionId.value === sessionId) {
        activeSessionId.value = null
      }
    } catch (e) {
      console.error('[terminalStore] closeSession error:', e)
      // 서버 에러여도 로컬에서 제거
      sessions.value.delete(sessionId)
      if (activeSessionId.value === sessionId) {
        activeSessionId.value = null
      }
    }
  }

  /**
   * 터미널 입력 전송
   */
  async function sendInput(
    sessionId: string,
    input: string
  ): Promise<void> {
    try {
      const body: TerminalInputRequest = { input }
      await $fetch(`/api/terminal/session/${sessionId}/input`, {
        method: 'POST',
        body
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '입력 전송 실패'
      console.error('[terminalStore] sendInput error:', e)
      throw e
    }
  }

  /**
   * 터미널 리사이즈
   */
  async function resize(
    sessionId: string,
    cols: number,
    rows: number
  ): Promise<void> {
    try {
      const body: TerminalResizeRequest = { cols, rows }
      await $fetch(`/api/terminal/session/${sessionId}/resize`, {
        method: 'POST',
        body
      })
    } catch (e) {
      console.error('[terminalStore] resize error:', e)
      // 리사이즈 실패는 치명적이지 않으므로 조용히 실패
    }
  }

  /**
   * 세션 상태 동기화 (서버에서 조회)
   */
  async function syncSessions(): Promise<void> {
    try {
      const response = await $fetch<{ sessions: TerminalSession[]; total: number }>(
        '/api/terminal/session'
      )

      // 기존 Map 업데이트
      const newMap = new Map<string, TerminalSession>()
      response.sessions.forEach(session => {
        newMap.set(session.id, session)
      })
      sessions.value = newMap

      lastSyncedAt.value = new Date()
    } catch (e) {
      console.error('[terminalStore] syncSessions error:', e)
      // 동기화 실패는 조용히 실패 (기존 상태 유지)
    }
  }

  /**
   * 세션 상태 업데이트 (로컬)
   */
  function updateSessionStatus(
    sessionId: string,
    status: TerminalSession['status'],
    currentCommand?: string
  ): void {
    const session = sessions.value.get(sessionId)
    if (session) {
      session.status = status
      session.currentCommand = currentCommand
      session.updatedAt = new Date().toISOString()
    }
  }

  /**
   * 활성 세션 변경
   */
  function setActiveSession(sessionId: string | null): void {
    activeSessionId.value = sessionId
  }

  /**
   * 스토어 초기화
   */
  function $reset(): void {
    sessions.value = new Map()
    activeSessionId.value = null
    isConnecting.value = false
    error.value = null
    lastSyncedAt.value = null
  }

  return {
    // State
    sessions,
    activeSessionId,
    isConnecting,
    error,
    lastSyncedAt,
    // Getters
    sessionCount,
    runningSessionCount,
    activeSession,
    sessionList,
    getSessionByTaskId,
    getSession,
    // Actions
    createSession,
    closeSession,
    sendInput,
    resize,
    syncSessions,
    updateSessionStatus,
    setActiveSession,
    $reset
  }
})

// HMR 지원
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTerminalStore, import.meta.hot))
}
```

---

## 4. Workflow Store: stores/workflow.ts

### 4.1 State 정의

```typescript
import type {
  WorkflowCommand,
  WorkflowExecuteRequest,
  WorkflowExecuteResponse,
  AvailableCommandsResponse
} from '~/types/terminal'
import { WORKFLOW_COMMANDS } from '~/types/terminal'

export const useWorkflowStore = defineStore('workflow', () => {
  // ============================================================
  // State
  // ============================================================

  /**
   * 현재 실행 중인 명령어
   */
  const executingCommand = ref<string | null>(null)

  /**
   * 현재 실행 중인 Task ID
   */
  const executingTaskId = ref<string | null>(null)

  /**
   * Task별 사용 가능한 명령어 캐시
   * Key: taskId, Value: WorkflowCommand[]
   */
  const availableCommands = ref<Record<string, WorkflowCommand[]>>({})

  /**
   * 마지막 실행 결과
   */
  const lastExecutionResult = ref<WorkflowExecuteResponse | null>(null)

  /**
   * 로딩 상태
   */
  const loading = ref(false)

  /**
   * 에러 메시지
   */
  const error = ref<string | null>(null)
```

### 4.2 Getters

```typescript
  // ============================================================
  // Getters
  // ============================================================

  /**
   * 특정 Task가 실행 중인지 확인
   */
  function isExecuting(taskId: string): boolean {
    return executingTaskId.value === taskId
  }

  /**
   * 현재 실행 정보
   */
  const currentExecution = computed(() => {
    if (!executingTaskId.value || !executingCommand.value) return null
    return {
      taskId: executingTaskId.value,
      command: executingCommand.value
    }
  })

  /**
   * 특정 Task의 사용 가능한 명령어 조회 (캐시)
   */
  function getAvailableCommands(taskId: string): WorkflowCommand[] {
    return availableCommands.value[taskId] || []
  }
```

### 4.3 Actions

```typescript
  // ============================================================
  // Actions
  // ============================================================

  /**
   * 워크플로우 명령어 실행
   * 프롬프트 생성 → 터미널 입력
   */
  async function executeCommand(
    request: WorkflowExecuteRequest
  ): Promise<WorkflowExecuteResponse> {
    try {
      loading.value = true
      error.value = null

      // 중복 실행 방지
      if (executingTaskId.value === request.taskId) {
        throw new Error('이미 실행 중인 명령어가 있습니다')
      }

      const response = await $fetch<WorkflowExecuteResponse>(
        '/api/workflow/execute',
        {
          method: 'POST',
          body: request
        }
      )

      if (!response.success) {
        throw new Error(response.error || '명령어 실행 실패')
      }

      // 로컬 상태 업데이트
      executingTaskId.value = request.taskId
      executingCommand.value = request.command
      lastExecutionResult.value = response

      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : '명령어 실행 실패'
      console.error('[workflowStore] executeCommand error:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Task별 사용 가능한 명령어 조회
   * 서버 API 호출 → 캐시 저장
   */
  async function fetchAvailableCommands(
    taskId: string,
    projectId: string
  ): Promise<WorkflowCommand[]> {
    try {
      const response = await $fetch<AvailableCommandsResponse>(
        `/api/workflow/available-commands/${taskId}`,
        {
          query: { projectId }
        }
      )

      // 캐시 저장
      availableCommands.value[taskId] = response.commands

      return response.commands
    } catch (e) {
      console.error('[workflowStore] fetchAvailableCommands error:', e)
      // 서버 실패 시 기본 명령어 목록 반환 (폴백)
      return filterCommandsByCategory(
        WORKFLOW_COMMANDS,
        'development', // 기본값
        '[ ]'          // 기본값
      )
    }
  }

  /**
   * 실행 종료 (로컬 상태 정리)
   * ExecutionManager에서 stop API 호출 후 호출됨
   */
  function clearExecution(taskId: string): void {
    if (executingTaskId.value === taskId) {
      executingTaskId.value = null
      executingCommand.value = null
    }
  }

  /**
   * 실행 취소 (강제 종료)
   * 서버에 stop 요청 + 로컬 상태 정리
   */
  async function cancelExecution(taskId: string): Promise<void> {
    try {
      await $fetch('/api/execution/stop', {
        method: 'POST',
        body: { taskId, success: false, error: '사용자 취소' }
      })

      clearExecution(taskId)
    } catch (e) {
      console.error('[workflowStore] cancelExecution error:', e)
      // 에러여도 로컬 상태 정리
      clearExecution(taskId)
    }
  }

  /**
   * 스토어 초기화
   */
  function $reset(): void {
    executingCommand.value = null
    executingTaskId.value = null
    availableCommands.value = {}
    lastExecutionResult.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    executingCommand,
    executingTaskId,
    availableCommands,
    lastExecutionResult,
    loading,
    error,
    // Getters
    isExecuting,
    currentExecution,
    getAvailableCommands,
    // Actions
    executeCommand,
    fetchAvailableCommands,
    clearExecution,
    cancelExecution,
    $reset
  }
})

// HMR 지원
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkflowStore, import.meta.hot))
}

/**
 * 카테고리와 상태로 명령어 필터링 (헬퍼 함수)
 */
function filterCommandsByCategory(
  commands: WorkflowCommand[],
  category: string,
  status: string
): WorkflowCommand[] {
  return commands.filter(cmd => {
    const categoryMatch = cmd.categories.includes(category as any)
    const statusMatch = cmd.availableStatuses.includes(status)
    return categoryMatch && statusMatch
  })
}
```

---

## 5. Composable: useTerminal.ts

### 5.1 기본 구조

```typescript
import { useTerminalStore } from '~/stores/terminal'
import { useNotification } from '~/composables/useNotification'
import type { CreateTerminalSessionRequest } from '~/types/terminal'

export function useTerminal() {
  const terminalStore = useTerminalStore()
  const notification = useNotification()

  /**
   * 터미널 세션 생성 (편의 함수)
   */
  async function createTerminalSession(
    taskId?: string,
    projectId?: string,
    cols: number = 80,
    rows: number = 24
  ): Promise<string | null> {
    try {
      const request: CreateTerminalSessionRequest = {
        taskId,
        projectId,
        cols,
        rows
      }

      const sessionId = await terminalStore.createSession(request)
      notification.success('터미널 세션이 생성되었습니다')
      return sessionId
    } catch (e) {
      notification.error(e instanceof Error ? e.message : '세션 생성 실패')
      return null
    }
  }

  /**
   * 터미널 세션 종료 (편의 함수)
   */
  async function closeTerminalSession(sessionId: string): Promise<void> {
    try {
      await terminalStore.closeSession(sessionId)
      notification.info('터미널 세션이 종료되었습니다')
    } catch (e) {
      notification.error(e instanceof Error ? e.message : '세션 종료 실패')
    }
  }

  /**
   * Task에 연결된 세션 가져오기 또는 생성
   */
  async function getOrCreateSession(
    taskId: string,
    projectId: string
  ): Promise<string | null> {
    // 기존 세션 확인
    const existingSession = terminalStore.getSessionByTaskId(taskId)
    if (existingSession) {
      return existingSession.id
    }

    // 새 세션 생성
    return await createTerminalSession(taskId, projectId)
  }

  /**
   * 터미널 입력 전송 (편의 함수)
   */
  async function sendTerminalInput(
    sessionId: string,
    input: string
  ): Promise<boolean> {
    try {
      await terminalStore.sendInput(sessionId, input)
      return true
    } catch (e) {
      notification.error(e instanceof Error ? e.message : '입력 전송 실패')
      return false
    }
  }

  /**
   * 터미널 리사이즈 (편의 함수)
   */
  async function resizeTerminal(
    sessionId: string,
    cols: number,
    rows: number
  ): Promise<void> {
    await terminalStore.resize(sessionId, cols, rows)
  }

  return {
    // 편의 함수
    createTerminalSession,
    closeTerminalSession,
    getOrCreateSession,
    sendTerminalInput,
    resizeTerminal,
    // Store 직접 노출 (필요시)
    terminalStore
  }
}
```

---

## 6. Composable: useWorkflow.ts

### 6.1 기본 구조

```typescript
import { useWorkflowStore } from '~/stores/workflow'
import { useTerminalStore } from '~/stores/terminal'
import { useExecutionStore } from '~/stores/execution'
import { useNotification } from '~/composables/useNotification'
import type { WorkflowExecuteRequest } from '~/types/terminal'

export function useWorkflow() {
  const workflowStore = useWorkflowStore()
  const terminalStore = useTerminalStore()
  const executionStore = useExecutionStore()
  const notification = useNotification()

  /**
   * 워크플로우 명령어 실행
   * 1. 세션 확인/생성
   * 2. 명령어 실행 요청
   * 3. 프롬프트를 터미널에 입력
   * 4. 실행 상태 등록
   */
  async function executeWorkflowCommand(
    taskId: string,
    projectId: string,
    command: string,
    options?: WorkflowExecuteRequest['options']
  ): Promise<boolean> {
    try {
      // 1. 중복 실행 확인
      if (executionStore.isExecuting(taskId)) {
        notification.warning('이미 실행 중인 명령어가 있습니다')
        return false
      }

      // 2. 터미널 세션 확인/생성
      let sessionId = terminalStore.getSessionByTaskId(taskId)?.id
      if (!sessionId) {
        sessionId = await terminalStore.createSession({
          taskId,
          projectId,
          cols: 80,
          rows: 24
        })
      }

      // 3. 워크플로우 실행 요청 (프롬프트 생성)
      const request: WorkflowExecuteRequest = {
        taskId,
        projectId,
        command,
        options
      }

      const response = await workflowStore.executeCommand(request)

      if (!response.success || !response.prompt) {
        throw new Error(response.error || '명령어 실행 실패')
      }

      // 4. 프롬프트를 터미널에 입력
      await terminalStore.sendInput(sessionId, response.prompt + '\n')

      // 5. 실행 상태 등록
      await executionStore.startExecution(taskId, command, sessionId)

      notification.info(`워크플로우 명령어 '${command}' 실행 시작`)
      return true
    } catch (e) {
      notification.error(e instanceof Error ? e.message : '명령어 실행 실패')
      return false
    }
  }

  /**
   * Task의 사용 가능한 명령어 조회
   */
  async function getAvailableCommands(
    taskId: string,
    projectId: string
  ): Promise<WorkflowCommand[]> {
    try {
      return await workflowStore.fetchAvailableCommands(taskId, projectId)
    } catch (e) {
      console.error('[useWorkflow] getAvailableCommands error:', e)
      return []
    }
  }

  /**
   * 명령어 실행 취소
   */
  async function cancelWorkflowCommand(taskId: string): Promise<void> {
    try {
      await workflowStore.cancelExecution(taskId)
      notification.info('명령어 실행이 취소되었습니다')
    } catch (e) {
      notification.error(e instanceof Error ? e.message : '취소 실패')
    }
  }

  /**
   * 명령어가 현재 Task에서 사용 가능한지 확인
   */
  function isCommandAvailable(
    command: WorkflowCommand,
    taskCategory: string,
    taskStatus: string
  ): boolean {
    const categoryMatch = command.categories.includes(taskCategory as any)
    const statusMatch = command.availableStatuses.includes(taskStatus)
    return categoryMatch && statusMatch
  }

  return {
    // 워크플로우 함수
    executeWorkflowCommand,
    getAvailableCommands,
    cancelWorkflowCommand,
    isCommandAvailable,
    // Store 직접 노출 (필요시)
    workflowStore,
    executionStore
  }
}
```

---

## 7. API 호출 흐름

### 7.1 워크플로우 명령어 실행 시퀀스

```
사용자              컴포넌트                     Composable                Store                   API
  │                    │                            │                        │                      │
  ├─[버튼 클릭]────────>│                            │                        │                      │
  │                    ├─executeWorkflowCommand()──>│                        │                      │
  │                    │                            ├─executionStore──────────>isExecuting(taskId)  │
  │                    │                            │                        ├─확인: false          │
  │                    │                            ├─terminalStore───────────>getSessionByTaskId()│
  │                    │                            │                        ├─없음: 세션 생성      │
  │                    │                            │                        ├─createSession()──────>POST /api/terminal/session
  │                    │                            │                        │<─────────────────────sessionId
  │                    │                            ├─workflowStore──────────>executeCommand()──────>POST /api/workflow/execute
  │                    │                            │                        │<─────────────────────{ prompt: "/wf:build TSK-01" }
  │                    │                            ├─terminalStore──────────>sendInput(prompt)─────>POST /api/terminal/session/:id/input
  │                    │                            ├─executionStore─────────>startExecution()──────>POST /api/execution/start
  │                    │<─notification──────────────┤                        │                      │
  │<─알림: 실행 시작─────┤                            │                        │                      │
  │                    │                            │                        │                      │
  │                    │     [SSE 스트림]           │                        │                      │
  │                    │<─────────────────────────────────────────────────────────────────────────GET /api/terminal/session/:id/output
  │<─터미널 출력 렌더링──┤                            │                        │                      │
  │                    │                            │                        │                      │
  │                    │     [명령어 완료]           │                        │                      │
  │                    ├─onCommandComplete()────────>workflowStore──────────>clearExecution()      │
  │                    │                            ├─executionStore─────────>stopExecution()───────>POST /api/execution/stop
  │                    │<─notification──────────────┤                        │                      │
  │<─알림: 완료──────────┤                            │                        │                      │
```

### 7.2 명령어 가용성 조회 시퀀스

```
컴포넌트 Mount          Composable                Store                   API
  │                       │                        │                      │
  ├─getAvailableCommands()>│                        │                      │
  │                       ├─workflowStore──────────>fetchAvailableCommands()>GET /api/workflow/available-commands/:taskId
  │                       │                        │<─────────────────────{ commands: [...] }
  │                       │                        ├─캐시 저장             │
  │                       │<────────────────────────┤                      │
  │<─commands────────────┤                        │                      │
  ├─버튼 렌더링           │                        │                      │
```

---

## 8. 테스트 시나리오

### 8.1 Terminal Store 단위 테스트

```typescript
describe('useTerminalStore', () => {
  let store: ReturnType<typeof useTerminalStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTerminalStore()
  })

  it('세션 생성 성공', async () => {
    // Mock API 응답
    mockFetch('/api/terminal/session', {
      success: true,
      sessionId: 'test-session-1',
      status: 'connected',
      createdAt: '2025-12-17T10:00:00Z'
    })

    const sessionId = await store.createSession({
      taskId: 'TSK-01-01',
      projectId: 'jjiban',
      cols: 80,
      rows: 24
    })

    expect(sessionId).toBe('test-session-1')
    expect(store.sessions.size).toBe(1)
    expect(store.activeSessionId).toBe('test-session-1')
  })

  it('세션 종료 성공', async () => {
    // 세션 생성
    store.sessions.set('test-session-1', {
      id: 'test-session-1',
      pid: 1234,
      status: 'connected',
      createdAt: '2025-12-17T10:00:00Z',
      updatedAt: '2025-12-17T10:00:00Z'
    })

    await store.closeSession('test-session-1')

    expect(store.sessions.size).toBe(0)
    expect(store.activeSessionId).toBeNull()
  })
})
```

### 8.2 Workflow Store 단위 테스트

```typescript
describe('useWorkflowStore', () => {
  let store: ReturnType<typeof useWorkflowStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWorkflowStore()
  })

  it('명령어 실행 성공', async () => {
    mockFetch('/api/workflow/execute', {
      success: true,
      sessionId: 'test-session-1',
      prompt: '/wf:build TSK-01-01'
    })

    const response = await store.executeCommand({
      taskId: 'TSK-01-01',
      projectId: 'jjiban',
      command: 'build'
    })

    expect(response.success).toBe(true)
    expect(store.executingTaskId).toBe('TSK-01-01')
    expect(store.executingCommand).toBe('build')
  })

  it('중복 실행 방지', async () => {
    store.executingTaskId = 'TSK-01-01'
    store.executingCommand = 'build'

    await expect(
      store.executeCommand({
        taskId: 'TSK-01-01',
        projectId: 'jjiban',
        command: 'verify'
      })
    ).rejects.toThrow('이미 실행 중인 명령어가 있습니다')
  })
})
```

### 8.3 Composable 통합 테스트

```typescript
describe('useWorkflow', () => {
  it('워크플로우 명령어 실행 전체 흐름', async () => {
    const { executeWorkflowCommand } = useWorkflow()

    // Mock API 응답들
    mockFetch('/api/terminal/session', { success: true, sessionId: 'sess-1' })
    mockFetch('/api/workflow/execute', { success: true, prompt: '/wf:build TSK-01-01' })
    mockFetch('/api/terminal/session/sess-1/input', { success: true })
    mockFetch('/api/execution/start', { success: true })

    const result = await executeWorkflowCommand(
      'TSK-01-01',
      'jjiban',
      'build'
    )

    expect(result).toBe(true)
    // 세션 생성, 명령어 실행, 입력 전송, 실행 등록 확인
  })
})
```

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
