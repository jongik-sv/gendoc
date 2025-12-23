# TSK-01-03: 서버 터미널 세션 API - 상세설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
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
| `server/utils/terminalService.ts` | 터미널 세션 관리 서비스 |
| `server/api/terminal/session.post.ts` | 세션 생성 API |
| `server/api/terminal/session.get.ts` | 세션 목록 조회 API |
| `server/api/terminal/session/[id].delete.ts` | 세션 종료 API |
| `server/api/terminal/session/[id]/output.get.ts` | SSE 출력 스트림 |
| `server/api/terminal/session/[id]/input.post.ts` | 터미널 입력 |
| `server/api/terminal/session/[id]/resize.post.ts` | 터미널 크기 조정 |
| `types/terminal.ts` | 터미널 관련 공유 타입 |

---

## 2. 타입 정의

### 2.1 types/terminal.ts (공유 타입)

```typescript
/**
 * 터미널 세션 상태
 */
export type SessionStatus =
  | 'connecting'
  | 'connected'
  | 'running'
  | 'closing'
  | 'completed'
  | 'error'

/**
 * 세션 생성 요청
 */
export interface CreateSessionRequest {
  taskId?: string
  projectId?: string
  cols?: number  // 기본: 80
  rows?: number  // 기본: 24
  cwd?: string   // 작업 디렉토리
}

/**
 * 세션 생성 응답
 */
export interface CreateSessionResponse {
  success: boolean
  sessionId: string
  pid: number
  status: SessionStatus
  createdAt: string
}

/**
 * 세션 정보 응답
 */
export interface SessionInfoResponse {
  sessionId: string
  pid: number
  taskId?: string
  projectId?: string
  status: SessionStatus
  currentCommand?: string
  createdAt: string
  updatedAt: string
}

/**
 * 입력 요청
 */
export interface InputRequest {
  input: string
}

/**
 * 리사이즈 요청
 */
export interface ResizeRequest {
  cols: number  // 1-500
  rows: number  // 1-200
}

/**
 * SSE 이벤트 타입
 */
export interface SSEOutputEvent {
  type: 'output'
  text: string
}

export interface SSEStatusEvent {
  type: 'status'
  status: SessionStatus
  command?: string
}

export interface SSECompleteEvent {
  type: 'complete'
  success: boolean
  exitCode?: number
  signal?: string
}

export interface SSEErrorEvent {
  type: 'error'
  message: string
  code?: string
}

export type SSEEvent = SSEOutputEvent | SSEStatusEvent | SSECompleteEvent | SSEErrorEvent
```

---

## 3. TerminalService 상세 구현

### 3.1 server/utils/terminalService.ts

```typescript
import * as pty from 'node-pty-prebuilt-multiarch'
import type { IPty, IPtyForkOptions } from 'node-pty-prebuilt-multiarch'
import type { SessionStatus } from '~/types/terminal'
import { randomUUID } from 'crypto'

/**
 * SSE Writer 인터페이스
 */
interface SSEWriter {
  write(data: string): void
  close(): void
}

/**
 * 내부 세션 상태
 */
interface InternalSession {
  id: string
  pid: number
  ptyProcess: IPty
  taskId?: string
  projectId?: string
  status: SessionStatus
  currentCommand?: string
  createdAt: Date
  updatedAt: Date
  outputBuffer: string[]
  sseClients: Set<SSEWriter>
  timeoutId?: NodeJS.Timeout
}

/**
 * 세션 생성 옵션
 */
interface CreateSessionOptions {
  taskId?: string
  projectId?: string
  cols?: number
  rows?: number
  cwd?: string
}

/**
 * TerminalService 클래스
 * 터미널 세션 생명주기 관리
 */
class TerminalService {
  // 설정 상수
  private readonly MAX_SESSIONS = 10
  private readonly BUFFER_SIZE = 10000
  private readonly SESSION_TIMEOUT_MS = 5 * 60 * 1000  // 5분
  private readonly DEFAULT_COLS = 80
  private readonly DEFAULT_ROWS = 24

  // 세션 저장소
  private sessions: Map<string, InternalSession> = new Map()

  /**
   * 새 세션 생성
   */
  createSession(options: CreateSessionOptions = {}): string {
    // 최대 세션 수 검사
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error('MAX_SESSIONS_EXCEEDED')
    }

    const sessionId = randomUUID()
    const cols = options.cols ?? this.DEFAULT_COLS
    const rows = options.rows ?? this.DEFAULT_ROWS
    const cwd = options.cwd ?? process.cwd()

    // 플랫폼별 쉘 선택
    const shell = process.platform === 'win32'
      ? 'powershell.exe'
      : process.env.SHELL || 'bash'

    const shellArgs = process.platform === 'win32'
      ? ['-NoLogo']
      : ['--login']

    // PTY 옵션 설정
    const ptyOptions: IPtyForkOptions = {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        JJIBAN_SESSION_ID: sessionId,
        JJIBAN_TERMINAL_PID: '' // spawn 후 설정
      } as Record<string, string>
    }

    // PTY 프로세스 생성
    const ptyProcess = pty.spawn(shell, shellArgs, ptyOptions)

    // 세션 객체 생성
    const session: InternalSession = {
      id: sessionId,
      pid: ptyProcess.pid,
      ptyProcess,
      taskId: options.taskId,
      projectId: options.projectId,
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      outputBuffer: [],
      sseClients: new Set()
    }

    // 플랫폼별 환경변수 PID 설정
    const setPidCommand = process.platform === 'win32'
      ? `$env:JJIBAN_TERMINAL_PID="${ptyProcess.pid}"\n`
      : `export JJIBAN_TERMINAL_PID=${ptyProcess.pid}\n`
    ptyProcess.write(setPidCommand)

    // 이벤트 핸들러 설정
    this.setupEventHandlers(session)

    // 타임아웃 설정
    this.resetTimeout(session)

    // 저장
    this.sessions.set(sessionId, session)

    return sessionId
  }

  /**
   * 세션 종료
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session || session.status === 'closing') return

    // 세션 상태를 'closing'으로 변경하여 경쟁 조건 방지
    session.status = 'closing'

    // 타임아웃 정리
    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
      session.timeoutId = undefined
    }

    // SSE 클라이언트에게 종료 알림
    const closeMessage = this.formatSSE('complete', {
      success: true,
      exitCode: 0
    })
    session.sseClients.forEach(client => {
      try {
        client.write(closeMessage)
        client.close()
      } catch {
        // ignore
      }
    })

    // PTY graceful shutdown (SIGTERM → SIGKILL)
    try {
      if (process.platform === 'win32') {
        // Windows는 SIGTERM 미지원, 즉시 종료
        session.ptyProcess.kill()
      } else {
        // Unix: SIGTERM 후 2초 대기, 타임아웃 시 SIGKILL
        session.ptyProcess.kill('SIGTERM')
        setTimeout(() => {
          try {
            if (!session.ptyProcess.killed) {
              session.ptyProcess.kill('SIGKILL')
            }
          } catch {
            // ignore
          }
        }, 2000)
      }
    } catch {
      // ignore
    }

    // 명시적 메모리 정리
    session.outputBuffer = []
    session.sseClients.clear()

    // 세션 제거
    this.sessions.delete(sessionId)
  }

  /**
   * 세션 조회
   */
  getSession(sessionId: string): InternalSession | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * 모든 세션 목록
   */
  getAllSessions(): SessionInfoResponse[] {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.id,
      pid: session.pid,
      taskId: session.taskId,
      projectId: session.projectId,
      status: session.status,
      currentCommand: session.currentCommand,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    }))
  }

  /**
   * 입력 전송
   */
  sendInput(sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    // 세션이 종료 중이면 무시
    if (session.status === 'closing') {
      return
    }

    // 입력 크기 제한 (10KB)
    if (input.length > 10240) {
      throw new Error('INPUT_TOO_LARGE')
    }

    session.ptyProcess.write(input)
    session.updatedAt = new Date()

    // 타임아웃 리셋
    this.resetTimeout(session)

    // 명령어 감지 (개행으로 끝나면)
    if (input.includes('\n') || input.includes('\r')) {
      const command = input.trim()
      if (command) {
        session.currentCommand = command.slice(0, 100)  // 최대 100자
        session.status = 'running'

        // 상태 이벤트 전송
        const statusMessage = this.formatSSE('status', {
          status: 'running',
          command: session.currentCommand
        })
        session.sseClients.forEach(client => client.write(statusMessage))
      }
    }
  }

  /**
   * 터미널 크기 조정
   */
  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    // 범위 검증
    const validCols = Math.min(Math.max(cols, 1), 500)
    const validRows = Math.min(Math.max(rows, 1), 200)

    session.ptyProcess.resize(validCols, validRows)
    session.updatedAt = new Date()
  }

  /**
   * SSE 클라이언트 등록
   */
  registerSSEClient(sessionId: string, writer: SSEWriter): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    session.sseClients.add(writer)

    // 기존 버퍼 전송 (히스토리)
    if (session.outputBuffer.length > 0) {
      const historyText = session.outputBuffer.join('')
      writer.write(this.formatSSE('output', { text: historyText }))
    }

    // 현재 상태 전송
    writer.write(this.formatSSE('status', { status: session.status }))
  }

  /**
   * SSE 클라이언트 해제
   */
  unregisterSSEClient(sessionId: string, writer: SSEWriter): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.sseClients.delete(writer)
    }
  }

  /**
   * 모든 세션 정리 (서버 종료 시)
   */
  cleanup(): void {
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId)
    }
  }

  // ===== Private Methods =====

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(session: InternalSession): void {
    const { ptyProcess } = session

    // 출력 핸들러
    ptyProcess.onData((data: string) => {
      // 버퍼에 저장 (최대 10,000줄 유지)
      session.outputBuffer.push(data)
      while (session.outputBuffer.length > this.BUFFER_SIZE) {
        session.outputBuffer.shift()
      }

      // SSE 전송 (실패한 클라이언트는 나중에 일괄 제거)
      const message = this.formatSSE('output', { text: data })
      const failedClients: SSEWriter[] = []

      session.sseClients.forEach(client => {
        try {
          client.write(message)
        } catch {
          failedClients.push(client)
        }
      })

      // 실패한 클라이언트 정리
      failedClients.forEach(client => session.sseClients.delete(client))

      session.updatedAt = new Date()
    })

    // 종료 핸들러
    ptyProcess.onExit(({ exitCode, signal }) => {
      session.status = exitCode === 0 ? 'completed' : 'error'
      session.updatedAt = new Date()

      // 종료 이벤트 전송
      const message = this.formatSSE('complete', {
        success: exitCode === 0,
        exitCode,
        signal: signal?.toString()
      })
      session.sseClients.forEach(client => {
        try {
          client.write(message)
        } catch {
          // ignore
        }
      })

      // 세션 정리 (종료 후)
      if (session.timeoutId) {
        clearTimeout(session.timeoutId)
      }
    })
  }

  /**
   * 타임아웃 리셋
   */
  private resetTimeout(session: InternalSession): void {
    // 세션이 종료 중이면 타임아웃 설정 안함
    if (session.status === 'closing') {
      return
    }

    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
    }

    session.timeoutId = setTimeout(() => {
      // 타임아웃으로 세션 종료
      console.log(`[TerminalService] Session ${session.id} timed out`)
      this.closeSession(session.id)
    }, this.SESSION_TIMEOUT_MS)
  }

  /**
   * SSE 메시지 포맷
   */
  private formatSSE(event: string, data: object): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  }
}

// 타입 export (API 핸들러용)
export interface SessionInfoResponse {
  sessionId: string
  pid: number
  taskId?: string
  projectId?: string
  status: SessionStatus
  currentCommand?: string
  createdAt: string
  updatedAt: string
}

// 싱글톤 인스턴스
export const terminalService = new TerminalService()

// 서버 종료 시 정리
process.on('SIGTERM', () => terminalService.cleanup())
process.on('SIGINT', () => terminalService.cleanup())
```

---

## 4. API 핸들러 상세 구현

### 4.1 session.post.ts (세션 생성)

```typescript
// server/api/terminal/session.post.ts
import { terminalService } from '~/server/utils/terminalService'
import type { CreateSessionRequest } from '~/types/terminal'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateSessionRequest>(event)

  // 유효성 검증
  if (body.cols !== undefined && (body.cols < 1 || body.cols > 500)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'cols는 1-500 범위여야 합니다',
      data: { code: 'INVALID_COLS' }
    })
  }

  if (body.rows !== undefined && (body.rows < 1 || body.rows > 200)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'rows는 1-200 범위여야 합니다',
      data: { code: 'INVALID_ROWS' }
    })
  }

  try {
    const sessionId = terminalService.createSession({
      taskId: body.taskId,
      projectId: body.projectId,
      cols: body.cols,
      rows: body.rows,
      cwd: body.cwd
    })

    const session = terminalService.getSession(sessionId)!

    return {
      success: true,
      sessionId,
      pid: session.pid,
      status: session.status,
      createdAt: session.createdAt.toISOString()
    }
  } catch (err: any) {
    if (err.message === 'MAX_SESSIONS_EXCEEDED') {
      throw createError({
        statusCode: 503,
        statusMessage: '최대 세션 수(10개)를 초과했습니다',
        data: { code: 'MAX_SESSIONS_EXCEEDED' }
      })
    }
    throw err
  }
})
```

### 4.2 session.get.ts (세션 목록)

```typescript
// server/api/terminal/session.get.ts
import { terminalService } from '~/server/utils/terminalService'

export default defineEventHandler(() => {
  const sessions = terminalService.getAllSessions()

  return {
    success: true,
    sessions,
    count: sessions.length
  }
})
```

### 4.3 [id].delete.ts (세션 종료)

```typescript
// server/api/terminal/session/[id].delete.ts
import { terminalService } from '~/server/utils/terminalService'

export default defineEventHandler((event) => {
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: '세션 ID가 필요합니다',
      data: { code: 'MISSING_SESSION_ID' }
    })
  }

  const session = terminalService.getSession(sessionId)
  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: '세션을 찾을 수 없습니다',
      data: { code: 'SESSION_NOT_FOUND' }
    })
  }

  terminalService.closeSession(sessionId)

  return {
    success: true,
    sessionId
  }
})
```

### 4.4 output.get.ts (SSE 스트림)

```typescript
// server/api/terminal/session/[id]/output.get.ts
import { terminalService } from '~/server/utils/terminalService'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: '세션 ID가 필요합니다',
      data: { code: 'MISSING_SESSION_ID' }
    })
  }

  const session = terminalService.getSession(sessionId)
  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: '세션을 찾을 수 없습니다',
      data: { code: 'SESSION_NOT_FOUND' }
    })
  }

  // SSE 헤더 설정 (SSE 표준 준수)
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')  // nginx 버퍼링 비활성화
  setHeader(event, 'Content-Encoding', 'identity')

  // ReadableStream 생성
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const writer = {
        write: (data: string) => {
          try {
            controller.enqueue(encoder.encode(data))
          } catch {
            // 스트림 닫힘
          }
        },
        close: () => {
          try {
            controller.close()
          } catch {
            // 이미 닫힘
          }
        }
      }

      // SSE 클라이언트 등록
      terminalService.registerSSEClient(sessionId, writer)

      // 연결 종료 시 정리
      event.node.req.on('close', () => {
        terminalService.unregisterSSEClient(sessionId, writer)
      })

      event.node.req.on('error', () => {
        terminalService.unregisterSSEClient(sessionId, writer)
      })
    }
  })

  return sendStream(event, stream)
})
```

### 4.5 input.post.ts (입력 전송)

```typescript
// server/api/terminal/session/[id]/input.post.ts
import { terminalService } from '~/server/utils/terminalService'
import type { InputRequest } from '~/types/terminal'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const body = await readBody<InputRequest>(event)

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: '세션 ID가 필요합니다',
      data: { code: 'MISSING_SESSION_ID' }
    })
  }

  if (!body.input && body.input !== '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'input 필드가 필요합니다',
      data: { code: 'MISSING_INPUT' }
    })
  }

  try {
    terminalService.sendInput(sessionId, body.input)

    return { success: true }
  } catch (err: any) {
    if (err.message === 'SESSION_NOT_FOUND') {
      throw createError({
        statusCode: 404,
        statusMessage: '세션을 찾을 수 없습니다',
        data: { code: 'SESSION_NOT_FOUND' }
      })
    }
    if (err.message === 'INPUT_TOO_LARGE') {
      throw createError({
        statusCode: 400,
        statusMessage: '입력이 너무 큽니다 (최대 10KB)',
        data: { code: 'INPUT_TOO_LARGE' }
      })
    }
    throw err
  }
})
```

### 4.6 resize.post.ts (크기 조정)

```typescript
// server/api/terminal/session/[id]/resize.post.ts
import { terminalService } from '~/server/utils/terminalService'
import type { ResizeRequest } from '~/types/terminal'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const body = await readBody<ResizeRequest>(event)

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: '세션 ID가 필요합니다',
      data: { code: 'MISSING_SESSION_ID' }
    })
  }

  if (typeof body.cols !== 'number' || typeof body.rows !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'cols와 rows는 숫자여야 합니다',
      data: { code: 'INVALID_SIZE_TYPE' }
    })
  }

  try {
    terminalService.resize(sessionId, body.cols, body.rows)

    return {
      success: true,
      cols: Math.min(Math.max(body.cols, 1), 500),
      rows: Math.min(Math.max(body.rows, 1), 200)
    }
  } catch (err: any) {
    if (err.message === 'SESSION_NOT_FOUND') {
      throw createError({
        statusCode: 404,
        statusMessage: '세션을 찾을 수 없습니다',
        data: { code: 'SESSION_NOT_FOUND' }
      })
    }
    throw err
  }
})
```

---

## 5. 테스트 명세

### 5.1 단위 테스트

| TC ID | 테스트 케이스 | 입력 | 기대 결과 |
|-------|-------------|------|----------|
| TC-UT-01 | 세션 생성 성공 | createSession() | sessionId 반환, sessions에 추가 |
| TC-UT-02 | 최대 세션 초과 | 11번째 createSession() | MAX_SESSIONS_EXCEEDED 에러 |
| TC-UT-03 | 세션 종료 | closeSession(id) | sessions에서 제거, PTY kill |
| TC-UT-04 | 입력 전송 | sendInput(id, 'test') | PTY write 호출 |
| TC-UT-05 | 큰 입력 거부 | sendInput(id, 11KB) | INPUT_TOO_LARGE 에러 |
| TC-UT-06 | 리사이즈 | resize(id, 100, 30) | PTY resize 호출 |
| TC-UT-07 | 범위 초과 리사이즈 | resize(id, 1000, 500) | 클램핑 적용 |

### 5.2 통합 테스트

| TC ID | 테스트 케이스 | 검증 항목 |
|-------|-------------|----------|
| TC-IT-01 | 전체 세션 흐름 | 생성 → 입력 → 출력 → 종료 |
| TC-IT-02 | SSE 스트리밍 | 연결 → 출력 이벤트 수신 |
| TC-IT-03 | 다중 클라이언트 | 동일 세션 다중 SSE 연결 |
| TC-IT-04 | 타임아웃 | 5분 비활성 후 자동 종료 |
| TC-IT-05 | 에러 복구 | PTY 크래시 시 에러 이벤트 |

---

## 6. 구현 순서

1. **타입 정의** (`types/terminal.ts`)
2. **TerminalService** (`server/utils/terminalService.ts`)
3. **세션 생성 API** (`session.post.ts`)
4. **세션 조회 API** (`session.get.ts`)
5. **세션 종료 API** (`[id].delete.ts`)
6. **SSE 출력 API** (`output.get.ts`)
7. **입력 API** (`input.post.ts`)
8. **리사이즈 API** (`resize.post.ts`)
9. **단위 테스트**
10. **통합 테스트**

---

## 7. 주의사항

### 7.1 Windows 환경

- `node-pty`는 Windows에서 `powershell.exe` 사용
- 빌드 시 `node-gyp` 필요 (Visual Studio Build Tools)
- `conpty.node` 네이티브 바인딩 필요

### 7.2 SSE 연결

- Nginx/프록시 사용 시 버퍼링 비활성화 필요
- 클라이언트 재연결 로직 필수
- 연결 끊김 감지 및 정리

### 7.3 보안

- 세션 ID는 UUID로 추측 불가
- 입력 크기 제한 (10KB)
- 동시 세션 제한 (10개)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
| 1.1 | 2025-12-17 | 설계 리뷰 반영 (Critical/Major 이슈 해결)<br>- [Critical-01] node-pty → node-pty-prebuilt-multiarch 수정<br>- [Critical-02] SSE Writer 타입 일관성 확보<br>- [Critical-03] 세션 종료 경쟁 조건 해결 ('closing' 상태 추가)<br>- [Major-01] 플랫폼별 환경변수 설정 (PowerShell vs bash)<br>- [Major-02] 출력 버퍼 크기 명확화 (10,000줄)<br>- [Major-03] SSE 클라이언트 정리 로직 개선<br>- [Major-04] 모든 API 에러 코드 일관성 확보<br>- [Major-05] PTY graceful shutdown 구현 (SIGTERM → SIGKILL) |
