# TSK-01-03: 서버 터미널 세션 API - 설계 리뷰

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 리뷰어 | Claude Sonnet 4.5 |
| 리뷰일 | 2025-12-17 |
| 리뷰 버전 | 1 |
| 리뷰 대상 | 기본설계 1.0, 상세설계 1.0 |

## 리뷰 요약

- 총 지적 사항: 12건
- Critical: 3건
- Major: 5건
- Minor: 4건
- 종합 판정: **조건부 승인** (Critical 이슈 해결 필수)

---

## 상세 리뷰

### [Critical-01] node-pty 패키지 불일치

**위치**: `020-detail-design.md` Line 135, `package.json` Line 58

**문제**:
설계 문서에서 `node-pty` 패키지를 import하도록 명시했으나, 실제 package.json에는 `node-pty-prebuilt-multiarch` 패키지가 설치되어 있습니다. 이는 다른 패키지로 import 경로와 타입 정의가 상이할 수 있습니다.

```typescript
// 설계 문서 (Line 135)
import * as pty from 'node-pty'
import type { IPty, IPtyForkOptions } from 'node-pty'

// 실제 package.json (Line 58)
"node-pty-prebuilt-multiarch": "^0.10.1-pre.5"
```

**권장**:
1. import 경로를 `node-pty-prebuilt-multiarch`로 수정
2. 타입 정의 경로 확인 및 수정
3. API 호환성 검증 (특히 `spawn`, `resize`, `write`, `kill` 메서드)

**근거**:
잘못된 패키지 import는 런타임 에러를 발생시키며, 타입 정의 불일치로 TypeScript 컴파일 오류가 발생합니다. node-pty-prebuilt-multiarch는 node-pty의 포크로 일부 API가 다를 수 있습니다.

---

### [Critical-02] SSE Writer 인터페이스 타입 불일치

**위치**: `020-detail-design.md` Line 143-146, Line 664-678

**문제**:
SSEWriter 인터페이스와 실제 구현 간 타입 불일치가 있습니다. `registerSSEClient` 메서드는 `SSEWriter` 타입을 받지만, 실제 구현에서는 `WritableStreamDefaultWriter`를 사용하는 것처럼 기본 설계에서 명시되어 있습니다.

```typescript
// 상세설계의 SSEWriter 인터페이스
interface SSEWriter {
  write(data: string): void
  close(): void
}

// 기본설계 Line 228에서 언급된 타입
registerSSEClient(sessionId: string, writer: WritableStreamDefaultWriter): void
```

**권장**:
1. SSEWriter 인터페이스를 일관성 있게 사용
2. 기본 설계 문서의 `WritableStreamDefaultWriter` 언급 제거 또는 SSEWriter로 수정
3. API 핸들러에서 생성하는 writer 객체가 SSEWriter 인터페이스를 충족하는지 명시적으로 검증

**근거**:
타입 불일치는 TypeScript 컴파일 오류를 발생시키며, 런타임에서 메서드 호출 실패로 이어질 수 있습니다.

---

### [Critical-03] 세션 타임아웃 후 자동 정리 시 경쟁 조건

**위치**: `020-detail-design.md` Line 475-485

**문제**:
`resetTimeout` 메서드와 `closeSession` 메서드 간 경쟁 조건이 발생할 수 있습니다. 타임아웃 콜백이 실행되는 동안 사용자가 세션에 입력을 보내면 세션이 닫히는 중에 `resetTimeout`이 호출될 수 있습니다.

```typescript
// Line 480-484
session.timeoutId = setTimeout(() => {
  console.log(`[TerminalService] Session ${session.id} timed out`)
  this.closeSession(session.id)  // 비동기적으로 실행
}, this.SESSION_TIMEOUT_MS)
```

**권장**:
1. `closeSession` 메서드에서 세션 상태를 'closing'으로 변경
2. `resetTimeout`, `sendInput` 등에서 세션 상태가 'closing'이면 조기 반환
3. 또는 세션 삭제 직전에 timeout을 한 번 더 clear하여 중복 정리 방지

```typescript
closeSession(sessionId: string): void {
  const session = this.sessions.get(sessionId)
  if (!session || session.status === 'closing') return

  session.status = 'closing'  // 추가

  if (session.timeoutId) {
    clearTimeout(session.timeoutId)
    session.timeoutId = undefined  // 명시적으로 제거
  }
  // ... 나머지 로직
}
```

**근거**:
경쟁 조건은 세션이 중복으로 정리되거나, 이미 닫힌 세션에 대한 작업이 시도될 수 있어 예측 불가능한 동작을 유발합니다.

---

### [Major-01] PTY 환경변수 설정 타이밍 문제

**위치**: `020-detail-design.md` Line 248

**문제**:
PTY 프로세스 생성 시 환경변수에 `JJIBAN_TERMINAL_PID`를 빈 문자열로 설정한 후, spawn 이후에 `ptyProcess.write()`로 export 명령을 실행하는 방식은 비효율적이며, Windows PowerShell에서는 다른 구문이 필요합니다.

```typescript
// Line 226
JJIBAN_TERMINAL_PID: '' // spawn 후 설정

// Line 248
ptyProcess.write(`export JJIBAN_TERMINAL_PID=${ptyProcess.pid}\n`)
```

**권장**:
1. spawn 후 즉시 env에 PID를 설정하는 것은 불가능하므로, 이를 문서에서 제거
2. 플랫폼별 환경변수 설정 명령어 구분
```typescript
const setPidCommand = process.platform === 'win32'
  ? `$env:JJIBAN_TERMINAL_PID="${ptyProcess.pid}"\n`
  : `export JJIBAN_TERMINAL_PID=${ptyProcess.pid}\n`

ptyProcess.write(setPidCommand)
```
3. 또는 PID 환경변수를 완전히 제거하고 다른 방식으로 세션 식별

**근거**:
export는 Unix 쉘 명령어로 PowerShell에서 작동하지 않습니다. 플랫폼 호환성을 보장해야 합니다.

---

### [Major-02] 출력 버퍼 메모리 누수 위험

**위치**: `020-detail-design.md` Line 427-430

**문제**:
출력 버퍼에 문자열을 계속 push하고 크기만 제한하는 방식은 장시간 실행 시 메모리 단편화를 유발할 수 있습니다. 또한 BUFFER_SIZE가 "줄 수"인지 "문자 수"인지 명확하지 않습니다.

```typescript
session.outputBuffer.push(data)
while (session.outputBuffer.length > this.BUFFER_SIZE) {
  session.outputBuffer.shift()
}
```

**권장**:
1. 버퍼 크기 단위를 명확히 정의 (예: "최근 10,000줄" 또는 "최대 1MB")
2. 메모리 효율을 위해 순환 버퍼 구조 사용 고려
3. 또는 버퍼를 단일 문자열로 관리하고 크기 제한 적용
```typescript
// 문자열 기반 버퍼 예시
const newBuffer = session.outputBuffer + data
if (newBuffer.length > MAX_BUFFER_BYTES) {
  session.outputBuffer = newBuffer.slice(-MAX_BUFFER_BYTES)
} else {
  session.outputBuffer = newBuffer
}
```

**근거**:
대량 출력 시나리오(예: 로그 파일 출력, 빌드 로그)에서 메모리 사용량이 급증할 수 있으며, shift() 연산은 O(n) 복잡도로 성능 저하를 유발합니다.

---

### [Major-03] SSE 클라이언트 전송 실패 처리 불완전

**위치**: `020-detail-design.md` Line 433-441

**문제**:
SSE 클라이언트에게 데이터 전송 시 try-catch로 실패한 클라이언트를 제거하지만, Set을 순회하면서 삭제하는 것은 순회 중 컬렉션 수정 문제를 일으킬 수 있습니다.

```typescript
session.sseClients.forEach(client => {
  try {
    client.write(message)
  } catch {
    session.sseClients.delete(client)  // 순회 중 삭제
  }
})
```

**권장**:
1. 실패한 클라이언트를 임시 배열에 수집 후 순회 완료 후 삭제
```typescript
const failedClients: SSEWriter[] = []
session.sseClients.forEach(client => {
  try {
    client.write(message)
  } catch {
    failedClients.push(client)
  }
})
failedClients.forEach(client => session.sseClients.delete(client))
```

**근거**:
JavaScript Set의 forEach는 순회 중 삭제를 지원하지만, 명시적으로 분리하는 것이 더 안전하고 가독성이 높습니다.

---

### [Major-04] API 핸들러에서 에러 코드 불일치

**위치**: `020-detail-design.md` Line 534, 569

**문제**:
에러 응답의 `data.code` 필드가 일부 에러에만 제공되고, 일부는 누락되어 있습니다. 클라이언트가 에러를 프로그래밍 방식으로 처리하기 어렵습니다.

```typescript
// Line 534: code 있음
data: { code: 'INVALID_COLS' }

// Line 649: code 없음
statusMessage: '세션을 찾을 수 없습니다'
```

**권장**:
모든 createError 호출에 일관된 code 필드 제공
```typescript
// 통일된 에러 응답 구조
interface ApiError {
  statusCode: number
  statusMessage: string
  data: {
    code: string  // 항상 제공
    details?: any
  }
}
```

**근거**:
일관된 에러 코드는 클라이언트 측 에러 처리 로직을 단순화하고, 국제화(i18n) 대응을 용이하게 합니다.

---

### [Major-05] 세션 종료 시 PTY 프로세스 강제 종료 위험

**위치**: `020-detail-design.md` Line 289-293

**문제**:
`closeSession`에서 `ptyProcess.kill()`을 호출하지만, SIGTERM을 먼저 보내고 타임아웃 후 SIGKILL을 보내는 graceful shutdown 로직이 없습니다. 실행 중인 작업이 중단될 수 있습니다.

```typescript
try {
  session.ptyProcess.kill()  // 즉시 종료
} catch {
  // ignore
}
```

**권장**:
1. 우아한 종료 절차 구현
```typescript
try {
  session.ptyProcess.kill('SIGTERM')  // 먼저 정상 종료 시도
  setTimeout(() => {
    if (!session.ptyProcess.killed) {
      session.ptyProcess.kill('SIGKILL')  // 타임아웃 후 강제 종료
    }
  }, 2000)
} catch {
  // ignore
}
```
2. Windows 호환성 고려 (Windows는 SIGTERM 미지원)

**근거**:
실행 중인 명령어(예: 파일 저장, 데이터베이스 트랜잭션)가 중단되면 데이터 손실이나 불완전한 상태가 발생할 수 있습니다.

---

### [Minor-01] 타입 정의 파일 위치 불명확

**위치**: `020-detail-design.md` Line 18

**문제**:
`types/terminal.ts` 파일을 생성하도록 명시했으나, 프로젝트 루트의 `types/` 디렉토리인지 다른 위치인지 명확하지 않습니다. 기존 types 디렉토리에는 `index.ts`, `settings.ts`, `validation.ts`만 존재합니다.

**권장**:
1. 절대 경로 명시: `C:\project\jjiban\types\terminal.ts`
2. 기존 types 구조와의 통합 방안 제시 (예: types/index.ts에서 re-export)

**근거**:
타입 정의 파일 위치가 불명확하면 import 경로 오류와 중복 정의 문제가 발생할 수 있습니다.

---

### [Minor-02] 명령어 감지 로직 개선 필요

**위치**: `020-detail-design.md` Line 342-356

**문제**:
명령어 감지가 단순히 개행 문자 포함 여부로만 판단하여, 여러 줄 입력이나 Ctrl+C 등의 특수 입력을 구분하지 못합니다.

```typescript
if (input.includes('\n') || input.includes('\r')) {
  const command = input.trim()
  if (command) {
    session.currentCommand = command.slice(0, 100)
```

**권장**:
1. 프롬프트 복귀 감지를 통한 명령어 완료 확인
2. 또는 명령어 감지를 선택적 기능으로 변경
3. 복잡한 입력(paste, multiline)에 대한 처리 방안 추가

**근거**:
부정확한 명령어 감지는 세션 상태를 잘못 업데이트하여 사용자에게 혼란을 줄 수 있습니다.

---

### [Minor-03] SSE 헤더 설정 누락

**위치**: `020-detail-design.md` Line 654-657

**문제**:
SSE 표준 헤더인 `Content-Encoding: identity`가 누락되어 있으며, CORS 헤더가 없어 다른 도메인에서 접근 시 문제가 발생할 수 있습니다.

**권장**:
SSE 표준 헤더 추가
```typescript
setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
setHeader(event, 'Cache-Control', 'no-cache, no-transform')
setHeader(event, 'Connection', 'keep-alive')
setHeader(event, 'X-Accel-Buffering', 'no')
setHeader(event, 'Content-Encoding', 'identity')  // 추가
// 필요시 CORS 헤더
setHeader(event, 'Access-Control-Allow-Origin', '*')
```

**근거**:
표준 준수는 브라우저 호환성과 프록시/CDN 환경에서의 안정성을 향상시킵니다.

---

### [Minor-04] 테스트 명세에 보안 테스트 누락

**위치**: `026-test-specification.md`

**문제**:
세션 ID 추측 공격, 세션 하이재킹, 입력 인젝션 등 보안 관련 테스트 케이스가 없습니다.

**권장**:
보안 테스트 섹션 추가
```markdown
## 보안 테스트

| TC ID | 테스트 케이스 | 검증 항목 |
|-------|-------------|----------|
| TC-SEC-01 | 무효한 세션 ID 접근 | 404 에러 반환 |
| TC-SEC-02 | 세션 ID 추측 공격 | UUID 무작위성 검증 |
| TC-SEC-03 | 대용량 입력 공격 | 10KB 제한 검증 |
| TC-SEC-04 | 동시 세션 제한 | 11번째 세션 거부 |
| TC-SEC-05 | 명령어 인젝션 | 입력 이스케이프 검증 |
```

**근거**:
터미널은 시스템 명령어를 실행하는 민감한 기능이므로 보안 테스트가 필수입니다.

---

## 아키텍처 검토

### API 설계 평가

**RESTful 준수도: 양호**
- 리소스 기반 URL 구조 (`/terminal/session/:id`)
- 적절한 HTTP 메서드 사용 (POST, GET, DELETE)
- 상태 코드 활용 (200, 404, 400, 503)

**개선 권장사항:**
- PATCH 메서드로 resize 통합 고려 (`PATCH /session/:id { cols, rows }`)
- 세션 목록 API에 필터링/페이징 추가 고려

### 세션 관리 평가

**장점:**
- 싱글톤 패턴으로 전역 세션 관리
- Map 자료구조로 효율적인 세션 조회 O(1)
- 타임아웃 기반 자동 정리

**단점:**
- 서버 재시작 시 모든 세션 손실 (영속성 없음)
- 멀티 프로세스 환경(클러스터 모드) 미지원

**권장:**
- 세션 복구 불가능을 문서에 명시
- 향후 Redis 등 외부 저장소 마이그레이션 경로 고려

### SSE 연결 관리 평가

**장점:**
- ReadableStream 기반 표준 구현
- 클라이언트별 독립적인 writer 관리
- 연결 종료 시 자동 정리

**단점:**
- 재연결 로직이 클라이언트에 전적으로 의존
- 연결 끊김 감지가 이벤트 기반으로만 처리 (heartbeat 없음)

**권장:**
- SSE 연결 유지를 위한 주기적 comment 전송 고려
```typescript
setInterval(() => {
  session.sseClients.forEach(client => {
    try {
      client.write(': keepalive\n\n')  // SSE comment
    } catch {
      session.sseClients.delete(client)
    }
  })
}, 30000)  // 30초마다
```

---

## 구현 가능성 검토

### node-pty-prebuilt-multiarch 호환성

**확인 필요 사항:**
1. `IPty`, `IPtyForkOptions` 타입 export 여부
2. `spawn`, `onData`, `onExit`, `resize`, `write`, `kill` 메서드 호환성
3. Windows conpty 지원 여부

**권장:**
- TSK-01-01에서 호환성 검증 테스트 수행
- 공식 문서와 타입 정의 확인 후 설계 문서 업데이트

### Nuxt 3 Nitro 서버 호환성

**검증 완료:**
- H3 프레임워크 기반 API 라우팅 지원 확인
- `defineEventHandler`, `setHeader`, `sendStream` 사용 적절
- ReadableStream SSE 구현 가능

**주의사항:**
- Nuxt dev 모드와 production 빌드 간 동작 차이 테스트 필요
- node-pty 네이티브 모듈이 Nuxt standalone 빌드에서 정상 작동하는지 검증

---

## 품질 검토

### 에러 처리

**우수한 점:**
- try-catch를 통한 예외 처리
- 사용자 친화적인 에러 메시지
- HTTP 상태 코드 적절히 사용

**개선 필요:**
- 에러 로깅 추가 (console.error 또는 로깅 프레임워크)
- 에러 코드 일관성 확보 (Major-04 참조)
- 치명적 에러와 복구 가능 에러 구분

### 리소스 정리

**우수한 점:**
- SIGTERM/SIGINT 핸들러로 전체 정리
- SSE 연결 종료 시 클라이언트 정리
- 타임아웃 기반 stale 세션 정리

**개선 필요:**
- PTY 프로세스 좀비 방지 로직 추가
- 메모리 누수 방지를 위한 명시적 null 할당
```typescript
closeSession(sessionId: string): void {
  // ... 기존 로직

  // 명시적 정리
  session.outputBuffer = []
  session.sseClients.clear()
  this.sessions.delete(sessionId)
}
```

### 보안

**우수한 점:**
- UUID 기반 세션 ID (추측 불가)
- 입력 크기 제한 (10KB)
- 최대 세션 수 제한 (10개)

**개선 필요:**
- 세션 소유자 검증 (taskId/projectId 기반 권한 확인)
- 명령어 허용 목록 (기본 설계 Line 370-377)을 실제 구현에 반영 고려
- 출력 데이터 sanitization (민감 정보 마스킹)

---

## 누락된 요구사항

### 1. 에러 복구 시나리오

**누락 사항:**
- PTY 프로세스 크래시 시 재시작 정책 없음
- SSE 연결 끊김 시 클라이언트 재연결 가이드 없음

**권장:**
- 자동 재시작 정책 문서화 또는 "재시작 불가" 명시
- 클라이언트 재연결 로직 가이드 추가 (UI 컴포넌트 설계 시)

### 2. 로깅 및 모니터링

**누락 사항:**
- 세션 생성/종료 로그
- 에러 발생 로그
- 성능 메트릭 수집

**권장:**
- 로깅 전략 추가 (로그 레벨, 포맷, 저장 위치)
- 선택적 디버그 모드 지원

### 3. 세션 메타데이터 확장

**누락 사항:**
- 세션 생성자 정보 (사용자 ID)
- 세션 목적 메타데이터
- 세션 태그/라벨

**권장:**
- 향후 확장을 위한 메타데이터 필드 예약
```typescript
interface InternalSession {
  // ... 기존 필드
  metadata?: Record<string, any>  // 확장성 확보
}
```

---

## 긍정적인 설계 요소

### 1. 명확한 관심사 분리
- TerminalService: 비즈니스 로직
- API 핸들러: HTTP 계층
- 타입 정의: 공유 계약

### 2. 확장 가능한 구조
- SSE 이벤트 타입 확장 용이
- 세션 옵션 추가 가능
- 플랫폼별 로직 분리

### 3. 상세한 문서화
- API 명세 완전함
- 테스트 케이스 명확함
- 추적성 매트릭스 우수함

---

## 최종 권장사항

### 즉시 수정 필요 (Critical)

1. **node-pty 패키지명 수정** (Critical-01)
   - 모든 import를 `node-pty-prebuilt-multiarch`로 변경
   - 타입 호환성 검증

2. **SSE Writer 타입 통일** (Critical-02)
   - 기본 설계와 상세 설계 간 타입 일치
   - 인터페이스 명시적 정의

3. **세션 종료 경쟁 조건 해결** (Critical-03)
   - 세션 상태에 'closing' 추가
   - 타임아웃 정리 로직 강화

### 구현 전 수정 권장 (Major)

4. **플랫폼별 환경변수 설정** (Major-01)
5. **출력 버퍼 메모리 관리 개선** (Major-02)
6. **SSE 클라이언트 정리 로직 보완** (Major-03)
7. **에러 코드 일관성 확보** (Major-04)
8. **PTY graceful shutdown** (Major-05)

### 선택적 개선 (Minor)

9. 타입 정의 파일 경로 명확화
10. 명령어 감지 로직 고도화
11. SSE 표준 헤더 완성
12. 보안 테스트 케이스 추가

---

## 결론

**판정: 조건부 승인**

본 설계는 전반적으로 잘 구조화되어 있으며, RESTful API 원칙과 Nuxt 3 프레임워크 표준을 준수하고 있습니다. 특히 관심사 분리, 타입 안정성, 문서화 측면에서 우수합니다.

다만, **3건의 Critical 이슈**는 구현 전 반드시 해결되어야 합니다. 특히 node-pty 패키지 불일치는 전체 구현의 기반이므로 최우선으로 수정이 필요합니다.

**승인 조건:**
1. Critical-01, 02, 03 이슈 해결
2. 상세 설계 문서 업데이트
3. Major 이슈 중 최소 Major-01, 04 해결

위 조건 충족 시 구현 단계로 진행 가능합니다.

---

## 리뷰어 서명

리뷰어: Claude Sonnet 4.5
리뷰 완료일: 2025-12-17
다음 단계: 설계 수정 후 재검토 또는 조건부 구현 시작
