# TSK-01-03: 서버 터미널 세션 API - 구현 문서

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 카테고리 | development |
| 상태 | 구현 완료 [im] |

---

## 1. 구현 개요

### 1.1 구현 목표
node-pty 기반 터미널 세션 관리 백엔드 서비스 구현

### 1.2 구현 범위
- 터미널 세션 생명주기 관리 (생성/종료/타임아웃)
- SSE 기반 실시간 출력 스트리밍
- 입력 전송 및 크기 조정 API
- 플랫폼별 쉘 지원 (PowerShell/bash)

---

## 2. 구현 파일 목록

### 2.1 타입 정의
**파일**: `types/terminal.ts`
- SessionStatus: 세션 상태 타입 (connecting/connected/running/closing/completed/error)
- CreateSessionRequest/Response: 세션 생성 요청/응답
- SessionInfoResponse: 세션 정보
- InputRequest/ResizeRequest: 입력/크기조정 요청
- SSEEvent: SSE 이벤트 타입 (output/status/complete/error)

### 2.2 서비스 레이어
**파일**: `server/utils/terminalService.ts`
- TerminalService 클래스 (싱글톤)
- 주요 메서드:
  - createSession(): 세션 생성
  - closeSession(): 세션 종료
  - getSession(): 세션 조회
  - getAllSessions(): 전체 세션 목록
  - sendInput(): 입력 전송
  - resize(): 크기 조정
  - registerSSEClient(): SSE 클라이언트 등록
  - unregisterSSEClient(): SSE 클라이언트 해제
  - cleanup(): 전체 세션 정리

### 2.3 API 핸들러

| 파일 | 메서드 | 경로 | 기능 |
|------|--------|------|------|
| session/index.post.ts | POST | /api/terminal/session | 세션 생성 |
| session/index.get.ts | GET | /api/terminal/session | 세션 목록 조회 |
| session/[id].delete.ts | DELETE | /api/terminal/session/:id | 세션 종료 |
| session/[id]/output.get.ts | GET | /api/terminal/session/:id/output | SSE 출력 스트림 |
| session/[id]/input.post.ts | POST | /api/terminal/session/:id/input | 입력 전송 |
| session/[id]/resize.post.ts | POST | /api/terminal/session/:id/resize | 크기 조정 |

---

## 3. 핵심 구현 사항

### 3.1 패키지 선택
**node-pty-prebuilt-multiarch** 사용
- 사전 빌드된 바이너리 제공
- Windows/Linux/macOS 멀티플랫폼 지원
- node-gyp 빌드 이슈 없음

### 3.2 세션 상태 관리
'closing' 상태 추가로 경쟁 조건 방지
```typescript
closeSession(sessionId: string): void {
  const session = this.sessions.get(sessionId)
  if (!session || session.status === 'closing') return

  session.status = 'closing'  // 경쟁 조건 방지
  // ... 종료 로직
}
```

### 3.3 플랫폼별 지원
```typescript
// 쉘 선택
const shell = process.platform === 'win32'
  ? 'powershell.exe'
  : process.env.SHELL || 'bash'

// 환경변수 PID 설정
const setPidCommand = process.platform === 'win32'
  ? `$env:JJIBAN_TERMINAL_PID="${ptyProcess.pid}"\n`
  : `export JJIBAN_TERMINAL_PID=${ptyProcess.pid}\n`
```

### 3.4 SSE 클라이언트 관리
출력 전송 시 실패한 클라이언트 일괄 정리
```typescript
const failedClients: SSEWriter[] = []

session.sseClients.forEach(client => {
  try {
    client.write(message)
  } catch {
    failedClients.push(client)
  }
})

// 순회 후 일괄 삭제
failedClients.forEach(client => session.sseClients.delete(client))
```

### 3.5 에러 코드 일관성
모든 에러에 data.code 필드 제공
```typescript
throw createError({
  statusCode: 404,
  statusMessage: '세션을 찾을 수 없습니다',
  data: { code: 'SESSION_NOT_FOUND' }
})
```

### 3.6 PTY Graceful Shutdown
```typescript
if (process.platform === 'win32') {
  session.ptyProcess.kill()
} else {
  // Unix: SIGTERM → 2초 대기 → SIGKILL
  session.ptyProcess.kill('SIGTERM')
  setTimeout(() => {
    if (!session.ptyProcess.killed) {
      session.ptyProcess.kill('SIGKILL')
    }
  }, 2000)
}
```

---

## 4. 보안 및 제약사항

### 4.1 리소스 제한
| 항목 | 제한값 | 목적 |
|------|--------|------|
| 최대 세션 수 | 10개 | DoS 방지 |
| 출력 버퍼 크기 | 10,000줄 | 메모리 보호 |
| 입력 크기 | 10KB | 대량 입력 방지 |
| 세션 타임아웃 | 5분 | 유휴 세션 정리 |
| 터미널 크기 | cols 1-500, rows 1-200 | 범위 제한 |

### 4.2 보안 조치
- 세션 ID: UUID v4 (추측 불가)
- 입력 크기 검증
- 동시 세션 제한
- 자동 타임아웃
- Graceful shutdown

---

## 5. SSE 스트리밍 구현

### 5.1 SSE 표준 헤더
```typescript
setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
setHeader(event, 'Cache-Control', 'no-cache, no-transform')
setHeader(event, 'Connection', 'keep-alive')
setHeader(event, 'X-Accel-Buffering', 'no')
setHeader(event, 'Content-Encoding', 'identity')
```

### 5.2 이벤트 포맷
```typescript
event: output
data: {"type":"output","text":"..."}

event: status
data: {"type":"status","status":"running","command":"npm test"}

event: complete
data: {"type":"complete","success":true,"exitCode":0}

event: error
data: {"type":"error","message":"...","code":"SESSION_NOT_FOUND"}
```

### 5.3 ReadableStream 패턴
```typescript
const stream = new ReadableStream({
  start(controller) {
    const encoder = new TextEncoder()

    const writer = {
      write: (data: string) => {
        controller.enqueue(encoder.encode(data))
      },
      close: () => {
        controller.close()
      }
    }

    terminalService.registerSSEClient(sessionId, writer)

    // 연결 종료 시 정리
    event.node.req.on('close', () => {
      terminalService.unregisterSSEClient(sessionId, writer)
    })
  }
})

return sendStream(event, stream)
```

---

## 6. 에러 코드 체계

| 에러 코드 | HTTP 상태 | 설명 |
|----------|-----------|------|
| INVALID_COLS | 400 | cols 범위 초과 (1-500) |
| INVALID_ROWS | 400 | rows 범위 초과 (1-200) |
| MISSING_SESSION_ID | 400 | 세션 ID 누락 |
| MISSING_INPUT | 400 | input 필드 누락 |
| INVALID_SIZE_TYPE | 400 | cols/rows 타입 오류 |
| INPUT_TOO_LARGE | 400 | 입력 크기 초과 (10KB) |
| SESSION_NOT_FOUND | 404 | 세션 없음 |
| MAX_SESSIONS_EXCEEDED | 503 | 최대 세션 수 초과 |

---

## 7. 테스트 전략

### 7.1 단위 테스트 항목
1. 세션 생성 성공
2. 최대 세션 수 초과
3. 세션 종료 (경쟁 조건 포함)
4. 입력 전송
5. 큰 입력 거부
6. 크기 조정
7. 범위 초과 크기 조정 (클램핑)

### 7.2 통합 테스트 항목
1. 전체 세션 흐름 (생성→입력→출력→종료)
2. SSE 스트리밍 (연결→출력 이벤트 수신)
3. 다중 클라이언트 (동일 세션 다중 SSE 연결)
4. 타임아웃 (5분 비활성 후 자동 종료)
5. 에러 복구 (PTY 크래시 시 에러 이벤트)

---

## 8. 운영 고려사항

### 8.1 Windows 환경
- PowerShell 사용
- SIGTERM 미지원 (즉시 종료)
- node-pty-prebuilt-multiarch의 conpty.node 바인딩 필요

### 8.2 프록시 환경
- Nginx 사용 시 `X-Accel-Buffering: no` 필요
- 클라이언트 재연결 로직 필수
- SSE 연결 끊김 감지 및 정리

### 8.3 메모리 관리
- 출력 버퍼 크기 제한 (10,000줄)
- 타임아웃으로 유휴 세션 정리
- 세션 종료 시 명시적 메모리 정리
- 서버 종료 시 cleanup() 호출

---

## 9. 구현 완료 확인

### 9.1 구현 완료 파일
- [x] types/terminal.ts
- [x] server/utils/terminalService.ts
- [x] server/api/terminal/session/index.post.ts
- [x] server/api/terminal/session/index.get.ts
- [x] server/api/terminal/session/[id].delete.ts
- [x] server/api/terminal/session/[id]/output.get.ts
- [x] server/api/terminal/session/[id]/input.post.ts
- [x] server/api/terminal/session/[id]/resize.post.ts

### 9.2 설계 반영 사항
- [x] Critical-01: node-pty-prebuilt-multiarch 사용
- [x] Critical-02: SSE Writer 타입 일관성
- [x] Critical-03: 'closing' 상태로 경쟁 조건 방지
- [x] Major-01: 플랫폼별 환경변수 설정
- [x] Major-02: 출력 버퍼 크기 10,000줄
- [x] Major-03: SSE 클라이언트 정리 로직
- [x] Major-04: 모든 API 에러 코드 일관성
- [x] Major-05: PTY Graceful Shutdown

---

## 10. 다음 단계

1. **패키지 설치**
   ```bash
   npm install node-pty-prebuilt-multiarch
   ```

2. **E2E 테스트 작성**
   - 세션 생성/종료 플로우
   - SSE 스트리밍 테스트
   - 에러 시나리오 검증

3. **프론트엔드 통합**
   - xterm.js 클라이언트 구현
   - SSE EventSource 연결
   - Task 상세 페이지 통합

4. **문서화**
   - API 명세 문서
   - 코드 리뷰 준비
   - 운영 가이드

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 및 구현 완료 |
