# TSK-01-02: 터미널 UI 컴포넌트 - 상세설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 문서 버전 | 1.1 |
| 작성일 | 2025-12-17 |
| 수정일 | 2025-12-17 |
| 카테고리 | development |
| 상태 | 상세설계 [dd] |

---

## 1. 구현 파일 목록

### 1.1 신규 생성 파일

| 파일 경로 | 설명 |
|----------|------|
| `app/components/terminal/TerminalHeaderIcon.vue` | 헤더 터미널 아이콘 + 배지 |
| `app/components/terminal/TerminalDialog.vue` | 터미널 다이얼로그 (메인) |
| `app/components/terminal/TerminalSessionList.vue` | 세션 목록 패널 |
| `app/components/terminal/TerminalView.vue` | xterm.js 래퍼 컴포넌트 |
| `app/stores/terminal.ts` | 터미널 세션 상태 관리 |
| `app/composables/useTerminal.ts` | 터미널 세션 관리 composable |
| `app/composables/useTerminalResize.ts` | 터미널 리사이즈 로직 |
| `app/composables/useTerminalReconnect.ts` | 자동 재연결 로직 |
| `app/types/terminal.ts` | 터미널 관련 타입 정의 |

### 1.2 수정 파일

| 파일 경로 | 변경 내용 |
|----------|----------|
| `app/components/AppHeader.vue` | TerminalHeaderIcon 추가 |
| `app/assets/css/main.css` | 터미널 관련 스타일 클래스 추가 |

---

## 2. 타입 정의

### 2.1 app/types/terminal.ts

```typescript
/**
 * 터미널 세션 상태
 */
export type TerminalSessionStatus =
  | 'connecting'    // SSE 연결 중
  | 'connected'     // 연결 완료, 대기 중
  | 'running'       // 명령어 실행 중
  | 'completed'     // 정상 종료
  | 'error'         // 오류 발생
  | 'reconnecting'  // 자동 재연결 중

/**
 * 터미널 세션 정보
 */
export interface TerminalSession {
  id: string                      // 세션 고유 ID (UUID)
  taskId?: string                 // 연결된 Task ID (선택)
  projectId?: string              // 연결된 프로젝트 ID (선택)
  status: TerminalSessionStatus
  currentCommand?: string         // 현재 실행 중인 명령어
  exitCode?: number               // 종료 코드 (completed/error 시)
  outputBuffer: string[]          // 출력 버퍼 (최근 1000줄)
  createdAt: Date
  updatedAt: Date
}

/**
 * 터미널 스토어 상태
 */
export interface TerminalState {
  sessions: Record<string, TerminalSession>  // Map 대신 Record 사용 (Pinia 직렬화 호환)
  eventSources: Record<string, EventSource>  // 세션별 SSE 연결 관리
  activeSessionId: string | null
  isCreating: boolean            // 세션 생성 중
  error: string | null
}

/**
 * 세션 생성 요청
 */
export interface CreateSessionRequest {
  taskId?: string
  projectId?: string
  cwd?: string                   // 작업 디렉토리
}

/**
 * 세션 생성 응답
 */
export interface CreateSessionResponse {
  sessionId: string
  pid: number
}

/**
 * SSE 이벤트 타입
 */
export interface TerminalOutputEvent {
  type: 'output'
  text: string
}

export interface TerminalStatusEvent {
  type: 'status'
  status: TerminalSessionStatus
  exitCode?: number
}

export type TerminalSSEEvent = TerminalOutputEvent | TerminalStatusEvent

/**
 * xterm.js 테마 설정
 */
export interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
  cursorAccent: string
  selectionBackground: string
  selectionForeground: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}
```

---

## 3. 스토어 상세 설계

### 3.1 app/stores/terminal.ts

```typescript
import { defineStore } from 'pinia'
import type {
  TerminalSession,
  TerminalState,
  CreateSessionRequest,
  CreateSessionResponse
} from '~/types/terminal'

export const useTerminalStore = defineStore('terminal', {
  state: (): TerminalState => ({
    sessions: {},
    eventSources: {},
    activeSessionId: null,
    isCreating: false,
    error: null
  }),

  getters: {
    /**
     * 활성 세션 객체
     */
    activeSession(): TerminalSession | null {
      if (!this.activeSessionId) return null
      return this.sessions[this.activeSessionId] ?? null
    },

    /**
     * 실행 중인 세션 개수 (running 상태)
     */
    activeSessionCount(): number {
      return Object.values(this.sessions).filter(
        session => session.status === 'running' || session.status === 'connected'
      ).length
    },

    /**
     * 세션 목록 (배열 형태)
     */
    sessionList(): TerminalSession[] {
      return Object.values(this.sessions)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },

    /**
     * 세션 존재 여부
     */
    hasSession(): boolean {
      return Object.keys(this.sessions).length > 0
    }
  },

  actions: {
    /**
     * 새 세션 생성
     */
    async createSession(request: CreateSessionRequest = {}): Promise<string> {
      this.isCreating = true
      this.error = null

      try {
        const response = await $fetch<CreateSessionResponse>(
          '/api/terminal/session',
          {
            method: 'POST',
            body: request
          }
        )

        const session: TerminalSession = {
          id: response.sessionId,
          taskId: request.taskId,
          projectId: request.projectId,
          status: 'connecting',
          outputBuffer: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        this.sessions[session.id] = session
        this.setActiveSession(session.id)

        return session.id
      } catch (err) {
        if (err instanceof Error) {
          this.error = err.message
        } else {
          this.error = '세션 생성에 실패했습니다'
        }
        throw err
      } finally {
        this.isCreating = false
      }
    },

    /**
     * 세션 종료
     */
    async closeSession(sessionId: string): Promise<void> {
      const session = this.sessions[sessionId]
      if (!session) return

      try {
        await $fetch(`/api/terminal/session/${sessionId}`, {
          method: 'DELETE'
        })
      } catch {
        // 서버 오류 무시 (이미 종료된 경우 등)
      }

      // SSE 연결 정리
      if (this.eventSources[sessionId]) {
        this.eventSources[sessionId].close()
        delete this.eventSources[sessionId]
      }

      delete this.sessions[sessionId]

      // 활성 세션이 삭제된 경우 다른 세션 선택
      if (this.activeSessionId === sessionId) {
        const remaining = this.sessionList
        this.activeSessionId = remaining.length > 0 ? remaining[0].id : null
      }
    },

    /**
     * 활성 세션 설정
     */
    setActiveSession(sessionId: string): void {
      if (this.sessions[sessionId]) {
        this.activeSessionId = sessionId
      }
    },

    /**
     * 세션 상태 업데이트
     */
    updateSessionStatus(
      sessionId: string,
      status: TerminalSession['status'],
      exitCode?: number
    ): void {
      const session = this.sessions[sessionId]
      if (session) {
        session.status = status
        session.updatedAt = new Date()
        if (exitCode !== undefined) {
          session.exitCode = exitCode
        }
      }
    },

    /**
     * 세션 명령어 업데이트
     */
    updateSessionCommand(sessionId: string, command: string): void {
      const session = this.sessions[sessionId]
      if (session) {
        session.currentCommand = command
        session.status = 'running'
        session.updatedAt = new Date()
      }
    },

    /**
     * 출력 버퍼에 추가
     */
    appendOutput(sessionId: string, text: string): void {
      const session = this.sessions[sessionId]
      if (session) {
        session.outputBuffer.push(text)
        // 최근 1000줄만 유지
        if (session.outputBuffer.length > 1000) {
          session.outputBuffer = session.outputBuffer.slice(-1000)
        }
      }
    },

    /**
     * 입력 전송
     */
    async sendInput(sessionId: string, input: string): Promise<void> {
      await $fetch(`/api/terminal/session/${sessionId}/input`, {
        method: 'POST',
        body: { input }
      })
    },

    /**
     * 터미널 리사이즈
     */
    async resize(sessionId: string, cols: number, rows: number): Promise<void> {
      await $fetch(`/api/terminal/session/${sessionId}/resize`, {
        method: 'POST',
        body: { cols, rows }
      })
    },

    /**
     * SSE 연결 생성 및 관리
     */
    connectSSE(sessionId: string): EventSource {
      // 기존 연결이 있으면 재사용
      if (this.eventSources[sessionId]) {
        return this.eventSources[sessionId]
      }

      const eventSource = new EventSource(
        `/api/terminal/session/${sessionId}/output`
      )

      eventSource.addEventListener('output', (event) => {
        const { text } = JSON.parse(event.data)
        this.appendOutput(sessionId, text)
      })

      eventSource.addEventListener('status', (event) => {
        const { status, exitCode } = JSON.parse(event.data)
        this.updateSessionStatus(sessionId, status, exitCode)
      })

      eventSource.addEventListener('open', () => {
        this.updateSessionStatus(sessionId, 'connected')
      })

      eventSource.addEventListener('error', () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          this.updateSessionStatus(sessionId, 'error')
        }
      })

      this.eventSources[sessionId] = eventSource
      return eventSource
    },

    /**
     * SSE 연결 종료
     */
    disconnectSSE(sessionId: string): void {
      if (this.eventSources[sessionId]) {
        this.eventSources[sessionId].close()
        delete this.eventSources[sessionId]
      }
    },

    /**
     * 모든 세션 정리 (앱 종료 시)
     */
    async cleanup(): Promise<void> {
      const promises = Object.keys(this.sessions).map(id =>
        this.closeSession(id)
      )
      await Promise.allSettled(promises)
    }
  }
})
```

---

## 4. Composables 상세 설계

### 4.1 app/composables/useTerminal.ts

```typescript
import { useTerminalStore } from '~/stores/terminal'
import type { CreateSessionRequest } from '~/types/terminal'

export function useTerminal() {
  const store = useTerminalStore()

  /**
   * 새 세션 생성 및 활성화
   */
  async function createAndConnect(request?: CreateSessionRequest): Promise<string> {
    const sessionId = await store.createSession(request)
    return sessionId
  }

  /**
   * 명령어 실행 (활성 세션에)
   */
  async function executeCommand(command: string): Promise<void> {
    const sessionId = store.activeSessionId
    if (!sessionId) {
      throw new Error('활성 세션이 없습니다')
    }

    // 명령어 상태 업데이트
    store.updateSessionCommand(sessionId, command)

    // 입력 전송 (개행 포함)
    await store.sendInput(sessionId, command + '\n')
  }

  /**
   * Task용 세션 생성 또는 기존 세션 재사용
   */
  async function getOrCreateTaskSession(
    taskId: string,
    projectId?: string
  ): Promise<string> {
    // 기존 Task 세션 찾기
    const existing = store.sessionList.find(
      s => s.taskId === taskId &&
           (s.status === 'connected' || s.status === 'running')
    )

    if (existing) {
      store.setActiveSession(existing.id)
      return existing.id
    }

    // 새 세션 생성
    return await createAndConnect({ taskId, projectId })
  }

  return {
    // Actions
    createAndConnect,
    executeCommand,
    getOrCreateTaskSession,
    closeSession: store.closeSession,
    setActiveSession: store.setActiveSession,

    // State (reactive refs)
    sessions: computed(() => store.sessionList),
    activeSession: computed(() => store.activeSession),
    activeSessionId: computed(() => store.activeSessionId),
    activeSessionCount: computed(() => store.activeSessionCount),
    isCreating: computed(() => store.isCreating),
    hasSession: computed(() => store.hasSession),
    error: computed(() => store.error)
  }
}
```

### 4.2 app/composables/useTerminalReconnect.ts

```typescript
import { useTerminalStore } from '~/stores/terminal'
import type { Ref } from 'vue'

interface UseTerminalReconnectOptions {
  sessionId: Ref<string>
  maxRetries?: number
  initialDelay?: number
}

export function useTerminalReconnect(options: UseTerminalReconnectOptions) {
  const store = useTerminalStore()
  const {
    sessionId,
    maxRetries = 3,
    initialDelay = 1000
  } = options

  let retryCount = 0
  let retryTimeout: NodeJS.Timeout | null = null

  /**
   * Exponential backoff 재연결
   */
  async function attemptReconnect(): Promise<boolean> {
    if (retryCount >= maxRetries) {
      store.updateSessionStatus(sessionId.value, 'error')
      return false
    }

    // Exponential backoff: 1s → 2s → 4s
    const delay = initialDelay * Math.pow(2, retryCount)
    store.updateSessionStatus(sessionId.value, 'reconnecting')

    await new Promise(resolve => {
      retryTimeout = setTimeout(resolve, delay)
    })

    try {
      // 기존 SSE 연결 종료
      store.disconnectSSE(sessionId.value)

      // 새 SSE 연결 생성
      store.connectSSE(sessionId.value)

      retryCount = 0  // 성공 시 카운트 리셋
      return true
    } catch (err) {
      retryCount++
      console.warn(`Reconnect attempt ${retryCount}/${maxRetries} failed:`, err)
      return attemptReconnect()
    }
  }

  /**
   * 수동 재연결
   */
  function reconnect(): void {
    retryCount = 0
    attemptReconnect()
  }

  /**
   * 정리
   */
  function cleanup(): void {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
    retryCount = 0
  }

  onBeforeUnmount(cleanup)

  return {
    attemptReconnect,
    reconnect,
    cleanup
  }
}
```

### 4.3 app/composables/useTerminalResize.ts

```typescript
import { useTerminalStore } from '~/stores/terminal'
import type { Terminal } from 'xterm'
import type { FitAddon } from '@xterm/addon-fit'

interface UseTerminalResizeOptions {
  terminal: Ref<Terminal | null>
  fitAddon: Ref<FitAddon | null>
  containerRef: Ref<HTMLElement | null>
  sessionId: Ref<string>
}

export function useTerminalResize(options: UseTerminalResizeOptions) {
  const store = useTerminalStore()
  const { terminal, fitAddon, containerRef, sessionId } = options

  let resizeObserver: ResizeObserver | null = null
  let resizeTimeout: NodeJS.Timeout | null = null

  /**
   * 터미널 크기 조정 (debounced)
   */
  function handleResize(): void {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    resizeTimeout = setTimeout(() => {
      if (!terminal.value || !fitAddon.value) return

      try {
        fitAddon.value.fit()

        const { cols, rows } = terminal.value
        store.resize(sessionId.value, cols, rows)
      } catch (e) {
        console.warn('Terminal resize failed:', e)
      }
    }, 100) // 100ms debounce
  }

  /**
   * ResizeObserver 설정
   */
  function setupResizeObserver(): void {
    if (!containerRef.value) return

    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)
  }

  /**
   * 정리
   */
  function cleanup(): void {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
      resizeTimeout = null
    }
  }

  // 컨테이너 변경 시 observer 재설정
  watch(containerRef, (newRef, oldRef) => {
    if (oldRef && resizeObserver) {
      resizeObserver.unobserve(oldRef)
    }
    if (newRef && resizeObserver) {
      resizeObserver.observe(newRef)
    }
  })

  onMounted(setupResizeObserver)
  onBeforeUnmount(cleanup)

  return {
    handleResize,
    cleanup
  }
}
```

---

## 5. 컴포넌트 상세 구현

### 5.1 TerminalHeaderIcon.vue

```vue
<script setup lang="ts">
import { useTerminal } from '~/composables/useTerminal'

const { activeSessionCount } = useTerminal()

const dialogVisible = ref(false)

function handleClick(): void {
  dialogVisible.value = true
}
</script>

<template>
  <div class="terminal-header-icon">
    <Button
      class="p-button-text p-button-rounded"
      aria-label="터미널 열기"
      aria-haspopup="dialog"
      @click="handleClick"
    >
      <i class="pi pi-desktop text-lg" />
      <Badge
        v-if="activeSessionCount > 0"
        :value="activeSessionCount"
        severity="primary"
        class="terminal-badge"
      />
    </Button>

    <TerminalDialog v-model:visible="dialogVisible" />
  </div>
</template>

<style scoped>
.terminal-header-icon {
  position: relative;
}

.terminal-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
}
</style>
```

### 5.2 TerminalDialog.vue

```vue
<script setup lang="ts">
import { useTerminal } from '~/composables/useTerminal'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const {
  sessions,
  activeSession,
  activeSessionId,
  createAndConnect,
  setActiveSession,
  closeSession
} = useTerminal()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

async function handleCreateSession(): Promise<void> {
  await createAndConnect()
}

function handleSelectSession(sessionId: string): void {
  setActiveSession(sessionId)
}

async function handleCloseSession(sessionId: string): Promise<void> {
  await closeSession(sessionId)
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="터미널 세션 관리"
    :modal="true"
    :maximizable="true"
    :draggable="true"
    :closable="true"
    :closeOnEscape="true"
    class="terminal-dialog"
    :style="{ width: '90vw', height: '80vh' }"
    :pt="{
      content: { class: 'terminal-dialog-content' }
    }"
  >
    <div class="terminal-dialog-layout">
      <!-- 세션 목록 패널 -->
      <TerminalSessionList
        :sessions="sessions"
        :active-session-id="activeSessionId"
        class="terminal-session-panel"
        @select="handleSelectSession"
        @close="handleCloseSession"
        @create="handleCreateSession"
      />

      <!-- 터미널 뷰 패널 -->
      <div class="terminal-view-panel">
        <TerminalView
          v-if="activeSession"
          :session-id="activeSession.id"
        />
        <div v-else class="terminal-empty-state terminal-bg">
          <i class="pi pi-desktop text-4xl text-surface-400 mb-4" />
          <p class="terminal-empty-text">활성 세션이 없습니다</p>
          <Button
            label="새 세션 시작"
            icon="pi pi-plus"
            class="mt-4"
            @click="handleCreateSession"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.terminal-dialog :deep(.terminal-dialog-content) {
  height: 100%;
  padding: 0;
  overflow: hidden;
}

.terminal-dialog-layout {
  display: flex;
  height: 100%;
}

.terminal-session-panel {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid var(--p-surface-200);
}

.terminal-view-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.terminal-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
```

### 5.3 TerminalSessionList.vue

```vue
<script setup lang="ts">
import type { TerminalSession } from '~/types/terminal'

interface Props {
  sessions: TerminalSession[]
  activeSessionId: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', sessionId: string): void
  (e: 'close', sessionId: string): void
  (e: 'create'): void
}>()

function getStatusIcon(status: TerminalSession['status']): string {
  switch (status) {
    case 'running': return 'pi-circle-fill text-green-500'
    case 'connected': return 'pi-circle-fill text-blue-500'
    case 'connecting': return 'pi-spin pi-spinner text-blue-500'
    case 'completed': return 'pi-circle text-surface-400'
    case 'error': return 'pi-circle text-red-500'
    default: return 'pi-circle text-surface-400'
  }
}

function getSessionLabel(session: TerminalSession): string {
  if (session.taskId) {
    return session.taskId
  }
  return `Session #${session.id.slice(0, 6)}`
}

function getStatusLabel(session: TerminalSession): string {
  if (session.currentCommand) {
    return `[${session.currentCommand.slice(0, 20)}...]`
  }

  switch (session.status) {
    case 'running': return '실행중'
    case 'connected': return '대기 중'
    case 'connecting': return '연결 중...'
    case 'completed': return '완료'
    case 'error': return '오류'
    default: return ''
  }
}

function handleSelect(sessionId: string): void {
  emit('select', sessionId)
}

function handleClose(event: Event, sessionId: string): void {
  event.stopPropagation()
  emit('close', sessionId)
}

function handleCreate(): void {
  emit('create')
}
</script>

<template>
  <div class="terminal-session-list" role="listbox" aria-label="터미널 세션 목록">
    <!-- 세션 목록 -->
    <div class="session-items">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ 'session-item--active': session.id === activeSessionId }"
        role="option"
        :aria-selected="session.id === activeSessionId"
        tabindex="0"
        @click="handleSelect(session.id)"
        @keydown.enter="handleSelect(session.id)"
      >
        <div class="session-item-header">
          <i :class="['pi', getStatusIcon(session.status), 'session-status-icon']" />
          <span class="session-label">{{ getSessionLabel(session) }}</span>
          <Button
            class="session-close-btn p-button-text p-button-rounded p-button-sm"
            icon="pi pi-times"
            aria-label="세션 닫기"
            @click="(e) => handleClose(e, session.id)"
          />
        </div>
        <div class="session-item-status">
          {{ getStatusLabel(session) }}
        </div>
      </div>
    </div>

    <!-- 구분선 -->
    <Divider class="my-2" />

    <!-- 새 세션 버튼 -->
    <Button
      class="new-session-btn"
      icon="pi pi-plus"
      label="새 세션"
      severity="secondary"
      text
      @click="handleCreate"
    />
  </div>
</template>

<style scoped>
.terminal-session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
}

.session-items {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.session-item:hover {
  background-color: var(--p-surface-50);
}

.session-item--active {
  background-color: var(--p-surface-100);
}

.session-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-status-icon {
  font-size: 8px;
}

.session-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--p-surface-900);
}

.session-close-btn {
  opacity: 0;
  transition: opacity 150ms ease;
}

.session-item:hover .session-close-btn,
.session-item--active .session-close-btn {
  opacity: 1;
}

.session-close-btn:hover {
  color: var(--p-red-500) !important;
}

.session-item-status {
  font-size: 0.75rem;
  color: var(--p-surface-500);
  margin-left: 1rem;
  margin-top: 0.25rem;
}

.new-session-btn {
  width: 100%;
  justify-content: center;
}
</style>
```

### 5.4 TerminalView.vue

```vue
<script setup lang="ts">
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { IDisposable } from '@xterm/xterm'
import { useTerminalStore } from '~/stores/terminal'
import { useTerminalResize } from '~/composables/useTerminalResize'
import { useTerminalReconnect } from '~/composables/useTerminalReconnect'
import type { TerminalTheme } from '~/types/terminal'

interface Props {
  sessionId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'data', data: string): void
  (e: 'resize', cols: number, rows: number): void
}>()

const store = useTerminalStore()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const terminalRef = ref<Terminal | null>(null)
const fitAddonRef = ref<FitAddon | null>(null)
let dataDisposable: IDisposable | null = null

const isConnecting = ref(true)
const connectionError = ref<string | null>(null)

// 터미널 테마 (Catppuccin Mocha)
const terminalTheme: TerminalTheme = {
  background: '#1e1e2e',
  foreground: '#cdd6f4',
  cursor: '#f5e0dc',
  cursorAccent: '#1e1e2e',
  selectionBackground: '#585b70',
  selectionForeground: '#cdd6f4',
  black: '#45475a',
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  magenta: '#f5c2e7',
  cyan: '#94e2d5',
  white: '#bac2de',
  brightBlack: '#585b70',
  brightRed: '#f38ba8',
  brightGreen: '#a6e3a1',
  brightYellow: '#f9e2af',
  brightBlue: '#89b4fa',
  brightMagenta: '#f5c2e7',
  brightCyan: '#94e2d5',
  brightWhite: '#a6adc8'
}

// 리사이즈 핸들러 설정
const sessionIdRef = computed(() => props.sessionId)
useTerminalResize({
  terminal: terminalRef,
  fitAddon: fitAddonRef,
  containerRef,
  sessionId: sessionIdRef
})

// 자동 재연결 핸들러
const { reconnect } = useTerminalReconnect({
  sessionId: sessionIdRef
})

// 현재 세션 상태 감시
const session = computed(() => store.sessions[props.sessionId])
watch(() => session.value?.status, (status) => {
  if (status === 'connected') {
    isConnecting.value = false
    connectionError.value = null
  } else if (status === 'error') {
    connectionError.value = '연결이 종료되었습니다'
    isConnecting.value = false
  } else if (status === 'reconnecting') {
    isConnecting.value = true
    connectionError.value = null
  }
})

/**
 * 터미널 초기화
 */
function initTerminal(): void {
  if (!containerRef.value) return

  const terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineHeight: 1.2,
    theme: terminalTheme,
    scrollback: 10000,
    convertEol: true,
    allowProposedApi: true
  })

  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  terminal.open(containerRef.value)
  fitAddon.fit()

  terminalRef.value = terminal
  fitAddonRef.value = fitAddon

  // 키 입력 핸들러 (IDisposable 저장)
  dataDisposable = terminal.onData((data) => {
    emit('data', data)
    store.sendInput(props.sessionId, data)
  })

  // SSE 연결 (스토어 레벨에서 관리)
  const eventSource = store.connectSSE(props.sessionId)

  // 기존 버퍼 복원
  const existingBuffer = session.value?.outputBuffer || []
  existingBuffer.forEach(text => terminal.write(text))

  // SSE 출력을 xterm에 실시간 렌더링
  watch(() => session.value?.outputBuffer.length, () => {
    if (session.value && session.value.outputBuffer.length > 0) {
      const lastOutput = session.value.outputBuffer[session.value.outputBuffer.length - 1]
      terminal.write(lastOutput)
    }
  })

  emit('ready')
}

/**
 * 재연결 시도
 */
function handleReconnect(): void {
  reconnect()
}

/**
 * 정리
 */
function cleanup(): void {
  // IDisposable 정리
  if (dataDisposable) {
    dataDisposable.dispose()
    dataDisposable = null
  }

  // xterm 정리
  if (terminalRef.value) {
    terminalRef.value.dispose()
    terminalRef.value = null
  }

  // SSE는 스토어에서 관리하므로 세션 전환 시 끊지 않음
  // (다이얼로그 닫을 때만 cleanup 호출)
}

// 세션 ID 변경 시 재초기화
watch(() => props.sessionId, () => {
  cleanup()
  nextTick(initTerminal)
})

onMounted(initTerminal)
onBeforeUnmount(cleanup)
</script>

<template>
  <div class="terminal-view">
    <!-- 터미널 컨테이너 -->
    <div ref="containerRef" class="terminal-container" />

    <!-- 연결 중 오버레이 -->
    <div v-if="isConnecting" class="terminal-overlay">
      <i class="pi pi-spin pi-spinner text-2xl text-blue-500 mb-2" />
      <span class="terminal-overlay-text">연결 중...</span>
    </div>

    <!-- 에러 오버레이 -->
    <div v-else-if="connectionError" class="terminal-overlay">
      <i class="pi pi-exclamation-triangle text-2xl text-yellow-500 mb-2" />
      <span class="terminal-overlay-text mb-4">{{ connectionError }}</span>
      <Button
        label="재연결"
        icon="pi pi-refresh"
        size="small"
        @click="handleReconnect"
      />
    </div>
  </div>
</template>

<style scoped>
.terminal-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.terminal-container {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.terminal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
```

---

## 6. CSS 클래스 추가

### 6.1 main.css 추가 내용

```css
/* ===== Terminal Components ===== */

/* Terminal theme colors (Catppuccin Mocha) */
.terminal-bg {
  background-color: #1e1e2e;
}

.terminal-text {
  color: #cdd6f4;
}

.terminal-overlay-bg {
  background-color: rgba(30, 30, 46, 0.9);
}

.terminal-overlay-text {
  color: #cdd6f4;
}

.terminal-empty-text {
  color: #6c7086;
}

/* Dialog overrides */
.terminal-dialog .p-dialog-content {
  padding: 0;
  height: calc(80vh - 60px);
  overflow: hidden;
}

/* Session status colors */
.session-status-running {
  color: theme('colors.green.500');
}

.session-status-connected {
  color: theme('colors.blue.500');
}

.session-status-completed {
  color: theme('colors.surface.400');
}

.session-status-error {
  color: theme('colors.red.500');
}

.session-status-reconnecting {
  color: theme('colors.yellow.500');
}

/* Terminal scrollbar */
.terminal-container ::-webkit-scrollbar {
  width: 10px;
}

.terminal-container ::-webkit-scrollbar-track {
  background: #313244;
}

.terminal-container ::-webkit-scrollbar-thumb {
  background: #585b70;
  border-radius: 5px;
}

.terminal-container ::-webkit-scrollbar-thumb:hover {
  background: #6c7086;
}
```

---

## 7. API 연동 명세

### 7.1 사용하는 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 요청/응답 |
|--------|-----------|------|----------|
| POST | `/api/terminal/session` | 세션 생성 | `CreateSessionRequest` → `CreateSessionResponse` |
| DELETE | `/api/terminal/session/:id` | 세션 종료 | - |
| GET | `/api/terminal/session/:id/output` | 출력 SSE | SSE stream |
| POST | `/api/terminal/session/:id/input` | 입력 전송 | `{ input: string }` |
| POST | `/api/terminal/session/:id/resize` | 리사이즈 | `{ cols: number, rows: number }` |

### 7.2 SSE 이벤트 형식

```typescript
// output 이벤트
event: output
data: {"text": "$ ls -la\n"}

// status 이벤트
event: status
data: {"status": "running"}

event: status
data: {"status": "completed", "exitCode": 0}
```

---

## 8. 테스트 명세

### 8.1 단위 테스트

| 테스트 대상 | 테스트 케이스 |
|------------|--------------|
| useTerminalStore | 세션 생성/삭제/조회 |
| useTerminalStore | 활성 세션 전환 |
| useTerminalStore | 세션 상태 업데이트 |
| useTerminal | createAndConnect 동작 |
| useTerminal | executeCommand 동작 |
| TerminalSessionList | 세션 목록 렌더링 |
| TerminalSessionList | 선택/닫기 이벤트 |

### 8.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| 세션 생성 플로우 | 버튼 클릭 → API 호출 → 목록 추가 |
| 명령어 실행 | 입력 → 서버 전송 → 출력 표시 |
| 세션 전환 | 클릭 → SSE 재연결 → 터미널 렌더링 |
| 에러 복구 | 연결 끊김 → 재연결 버튼 → 복구 |

---

## 9. 구현 순서

1. **타입 정의** (`app/types/terminal.ts`)
2. **스토어** (`app/stores/terminal.ts`)
3. **Composables** (`useTerminal.ts`, `useTerminalResize.ts`)
4. **TerminalView** (xterm.js 핵심)
5. **TerminalSessionList**
6. **TerminalDialog**
7. **TerminalHeaderIcon**
8. **AppHeader 통합**
9. **스타일 추가** (main.css)
10. **테스트 작성**

---

---

## 10. 설계 리뷰 반영 사항

### 10.1 Critical 이슈 해결

**1. SSE 연결 관리 (다중 세션 지원)**
- `TerminalState`에 `eventSources: Record<string, EventSource>` 추가
- `connectSSE()`, `disconnectSSE()` 액션을 스토어에 추가
- 각 세션마다 독립적인 EventSource 유지
- TerminalView는 스토어의 SSE 연결 재사용
- 세션 전환 시 기존 SSE 연결 유지 (백그라운드 출력 수신)

**2. 출력 버퍼 관리**
- `TerminalSession` 인터페이스에 `outputBuffer: string[]` 추가
- `appendOutput()` 액션으로 버퍼 관리 (최근 1000줄 제한)
- SSE 이벤트 수신 시 `appendOutput()` 호출하여 버퍼 저장
- TerminalView 마운트 시 기존 버퍼를 xterm에 복원

### 10.2 Major 이슈 해결

**3. 자동 재연결 로직**
- `reconnecting` 상태 타입 추가
- `useTerminalReconnect.ts` composable 생성
- Exponential backoff 재연결 (1s → 2s → 4s)
- 최대 3회 재시도, 실패 시 `error` 상태로 전환
- TerminalView에서 자동 재연결 통합

**4. TypeScript 타입 안정성**
- `sessions: Map` → `sessions: Record<string, TerminalSession>` 변경
- Pinia 직렬화 호환 및 Vue devtools 지원
- 에러 처리 시 `any` 제거, `instanceof Error` 타입 가드 사용
- 모든 에러 핸들러에 타입 안전한 처리 적용

**5. 메모리 누수 방지**
- `terminal.onData()` 리턴값을 `IDisposable`로 저장
- cleanup 시 `dataDisposable.dispose()` 명시적 호출
- `eventSources` Record로 SSE 연결 추적
- `closeSession()` 시 SSE 연결 정리
- ResizeObserver 정리 로직 강화

**6. CSS 중앙화 원칙 준수**
- main.css에 `.terminal-bg`, `.terminal-text`, `.terminal-overlay-text` 클래스 정의
- 컴포넌트 내 HEX 하드코딩 제거 (`background-color: #1e1e2e` → `class="terminal-bg"`)
- `.terminal-empty-text`, `.session-status-reconnecting` 클래스 추가
- xterm.js 테마는 설정 객체이므로 예외 유지

### 10.3 Minor 이슈 대응

**7. Props 검증**
- 기본설계 단계에서 명시 (구현 시 적용)

**8. 접근성 개선**
- 기본설계 단계에서 명시 (구현 시 적용)

**9. 테스트 명세 구체화**
- 026-test-specification.md에 구체적 측정 방법 추가 예정

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
| 1.1 | 2025-12-17 | 설계 리뷰 반영 (Critical 2건, Major 4건 해결) |
