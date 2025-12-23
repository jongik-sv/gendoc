# TSK-01-03: 서버 터미널 세션 API - 기본설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 카테고리 | development |
| 도메인 | backend |
| 상태 | 기본설계 [bd] |

---

## 1. 개요

### 1.1 목적

node-pty 기반 서버 터미널 세션을 관리하고, SSE를 통해 터미널 출력을 실시간 스트리밍하는 API를 구현합니다.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| TerminalService 클래스 | 터미널 UI 컴포넌트 |
| POST /api/terminal/session (세션 생성) | 워크플로우 실행 API |
| DELETE /api/terminal/session/:id (세션 종료) | 터미널 히스토리 저장 |
| GET /api/terminal/session/:id/output (SSE) | 다중 터미널 탭 |
| POST /api/terminal/session/:id/input (입력) | |
| POST /api/terminal/session/:id/resize (크기 조정) | |

### 1.3 참조 문서

- PRD 4.1: Server Routes
- PRD 4.3: 터미널 세션 API
- TRD 4.1: 터미널 서비스 구조
- TRD 4.2: TerminalService 클래스

---

## 2. 시스템 아키텍처

### 2.1 터미널 세션 흐름

```
클라이언트                    서버                        시스템 쉘
    │                          │                            │
    ├─ POST /session ────────>│                            │
    │                          ├─ node-pty.spawn() ──────>│
    │                          │<── PTY 프로세스 생성 ──────┤
    │<── sessionId ────────────┤                            │
    │                          │                            │
    ├─ GET /output (SSE) ────>│                            │
    │<── event: output ────────┤<── stdout ─────────────────┤
    │                          │                            │
    ├─ POST /input ──────────>│                            │
    │                          ├─ pty.write() ────────────>│
    │                          │                            │
    ├─ POST /resize ─────────>│                            │
    │                          ├─ pty.resize() ───────────>│
    │                          │                            │
    ├─ DELETE /session ──────>│                            │
    │                          ├─ pty.kill() ─────────────>│
    │<── success ──────────────┤                            │
```

### 2.2 파일 구조

```
server/
├── api/
│   └── terminal/
│       ├── session.post.ts           # 세션 생성
│       ├── session.get.ts            # 세션 상태 조회
│       └── session/
│           ├── [id].delete.ts        # 세션 종료
│           └── [id]/
│               ├── input.post.ts     # 터미널 입력
│               ├── output.get.ts     # SSE 출력 스트림
│               └── resize.post.ts    # 터미널 크기 조정
└── utils/
    └── terminalService.ts            # 터미널 서비스 코어
```

---

## 3. API 상세

### 3.1 POST /api/terminal/session

**목적:** 새 터미널 세션 생성

**Request:**
```typescript
interface CreateSessionRequest {
  taskId?: string      // 선택 (전역 세션 가능)
  projectId?: string   // 선택
  cols?: number        // 기본값: 80
  rows?: number        // 기본값: 24
}
```

**Response:**
```typescript
interface CreateSessionResponse {
  success: boolean
  sessionId: string
  pid: number
  status: 'connected'
  createdAt: string
}
```

**에러 응답:**
| 코드 | 메시지 | 원인 |
|------|--------|------|
| 400 | 잘못된 요청 | cols/rows 범위 초과 |
| 503 | 최대 세션 수 초과 | 10개 세션 초과 |

### 3.2 GET /api/terminal/session/:id/output

**목적:** SSE 기반 터미널 출력 스트리밍

**SSE 이벤트 타입:**

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| output | `{ text: string }` | 터미널 출력 (stdout/stderr) |
| status | `{ status: string, command?: string }` | 상태 변경 |
| complete | `{ success: boolean, exitCode?: number }` | 프로세스 종료 |
| error | `{ message: string }` | 에러 발생 |

**예시:**
```
event: output
data: {"text":"$ claude\n"}

event: status
data: {"status":"running","command":"claude"}

event: output
data: {"text":"Claude Code started...\n"}

event: complete
data: {"success":true,"exitCode":0}
```

### 3.3 POST /api/terminal/session/:id/input

**목적:** 터미널 입력 전송

**Request:**
```typescript
interface InputRequest {
  input: string   // 입력 문자열 (키 입력 또는 명령어)
}
```

**Response:**
```typescript
interface InputResponse {
  success: boolean
}
```

### 3.4 POST /api/terminal/session/:id/resize

**목적:** 터미널 크기 조정

**Request:**
```typescript
interface ResizeRequest {
  cols: number   // 1-500
  rows: number   // 1-200
}
```

**Response:**
```typescript
interface ResizeResponse {
  success: boolean
  cols: number
  rows: number
}
```

### 3.5 DELETE /api/terminal/session/:id

**목적:** 터미널 세션 종료

**Response:**
```typescript
interface DeleteSessionResponse {
  success: boolean
  sessionId: string
}
```

---

## 4. TerminalService 설계

### 4.1 클래스 구조

```typescript
class TerminalService {
  // 상수
  private readonly MAX_SESSIONS = 10
  private readonly BUFFER_SIZE = 10000
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000  // 5분

  // 상태
  private sessions: Map<string, TerminalSession>

  // 세션 관리
  createSession(options: CreateSessionOptions): string
  closeSession(sessionId: string): void
  getSession(sessionId: string): TerminalSession | null
  getAllSessions(): TerminalSession[]

  // I/O
  sendInput(sessionId: string, input: string): void
  resize(sessionId: string, cols: number, rows: number): void

  // SSE
  registerSSEClient(sessionId: string, writer: WritableStreamDefaultWriter): void
  unregisterSSEClient(sessionId: string, writer: WritableStreamDefaultWriter): void

  // 정리
  cleanupStale(): void
}
```

### 4.2 TerminalSession 인터페이스

```typescript
interface TerminalSession {
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
  sseClients: Set<WritableStreamDefaultWriter>
}

type SessionStatus = 'connecting' | 'connected' | 'running' | 'completed' | 'error'
```

### 4.3 node-pty 설정

```typescript
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

const ptyOptions: IPtyForkOptions = {
  name: 'xterm-256color',
  cols: cols || 80,
  rows: rows || 24,
  cwd: process.cwd(),
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    JJIBAN_SESSION_ID: sessionId,
    JJIBAN_TERMINAL_PID: String(ptyProcess.pid)
  }
}
```

### 4.4 이벤트 핸들링

```typescript
// 출력 핸들러
ptyProcess.onData((data: string) => {
  // 버퍼에 저장
  session.outputBuffer.push(data)
  if (session.outputBuffer.length > BUFFER_SIZE) {
    session.outputBuffer.shift()
  }

  // SSE 클라이언트에 전송
  const message = formatSSE('output', { text: data })
  session.sseClients.forEach(client => client.write(message))
})

// 종료 핸들러
ptyProcess.onExit(({ exitCode, signal }) => {
  session.status = exitCode === 0 ? 'completed' : 'error'

  const message = formatSSE('complete', { success: exitCode === 0, exitCode })
  session.sseClients.forEach(client => client.write(message))
})
```

---

## 5. SSE 구현

### 5.1 Nuxt Server Route (H3)

```typescript
// server/api/terminal/session/[id]/output.get.ts
export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const session = terminalService.getSession(sessionId)

  if (!session) {
    throw createError({ statusCode: 404, message: '세션 없음' })
  }

  // SSE 헤더 설정
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  // 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      const writer = {
        write: (data: string) => controller.enqueue(new TextEncoder().encode(data)),
        close: () => controller.close()
      }

      terminalService.registerSSEClient(sessionId, writer)

      // 연결 종료 시 정리
      event.node.req.on('close', () => {
        terminalService.unregisterSSEClient(sessionId, writer)
      })
    }
  })

  return sendStream(event, stream)
})
```

### 5.2 SSE 메시지 포맷

```typescript
function formatSSE(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}
```

---

## 6. 보안 고려사항

### 6.1 입력 검증

| 항목 | 검증 |
|------|------|
| sessionId | UUID 형식 검증 |
| cols | 1-500 범위 |
| rows | 1-200 범위 |
| input | 최대 길이 제한 (10KB) |

### 6.2 세션 보안

- 세션 ID: crypto.randomUUID() 사용
- 타임아웃: 비활성 5분 후 자동 종료
- 최대 세션: 동시 10개 제한

### 6.3 명령어 제한 (선택)

```typescript
// 허용된 명령어 패턴만 실행 (optional)
const ALLOWED_COMMANDS = [
  /^\/wf:\w+/,          // /wf:* 명령어
  /^npx jjiban/,        // jjiban CLI
  /^claude/,            // Claude CLI
]
```

---

## 7. 비기능 요구사항

### 7.1 성능

| 항목 | 기준 |
|------|------|
| 세션 생성 | < 500ms |
| 입력 응답 | < 50ms |
| 출력 지연 | < 100ms |
| 동시 세션 | 최대 10개 |

### 7.2 안정성

| 시나리오 | 처리 |
|---------|------|
| 서버 재시작 | 기존 세션 자동 정리 |
| PTY 크래시 | 에러 이벤트 전송, 세션 정리 |
| SSE 연결 끊김 | 클라이언트 자동 정리 |

### 7.3 리소스 관리

- 출력 버퍼: 세션당 10,000줄
- 메모리: 세션당 ~10MB
- Stale 세션: 5분 타임아웃으로 자동 정리

---

## 8. 의존성

### 8.1 선행 Task

| Task | 필요 산출물 |
|------|-------------|
| TSK-01-01 | node-pty 패키지 설치, Nuxt 설정 |

### 8.2 패키지 의존성

```json
{
  "dependencies": {
    "node-pty": "^1.0.0"
  }
}
```

---

## 9. 테스트 범위

### 9.1 단위 테스트

- TerminalService: 세션 생성/종료/조회
- 입출력: write/read 동작
- 타임아웃: Stale 세션 정리

### 9.2 통합 테스트

- API 엔드포인트: 정상/에러 케이스
- SSE 스트리밍: 출력 이벤트 전달
- 동시 세션: 다중 세션 관리

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
