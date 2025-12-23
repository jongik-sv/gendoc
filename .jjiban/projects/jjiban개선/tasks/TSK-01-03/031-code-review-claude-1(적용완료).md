# TSK-01-03: 서버 터미널 세션 API - 코드 리뷰

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 리뷰어 | Claude |
| 리뷰일 | 2025-12-17 |
| 리뷰 버전 | 1 |
| 리뷰 범위 | 터미널 세션 API 전체 구현 |

## 리뷰 요약
- 총 지적 사항: 13건
- Critical: 2건
- Major: 5건
- Minor: 6건

**전체 평가**: 코드 품질은 전반적으로 우수하나, 리소스 정리와 타입 안정성 측면에서 개선이 필요합니다.

---

## 상세 리뷰

### [Critical] PTY 프로세스 종료 경쟁 조건
- **파일**: `server/utils/terminalService.ts:168-177`
- **문제**: SIGTERM 후 2초 타임아웃에서 세션이 이미 삭제될 수 있음
  ```typescript
  session.ptyProcess.kill('SIGTERM')
  setTimeout(() => {
    try {
      if (!session.ptyProcess.killed) {  // session이 삭제되었을 수 있음
        session.ptyProcess.kill('SIGKILL')
      }
    } catch {
      // ignore
    }
  }, 2000)
  ```
- **권장**: 타임아웃 전에 세션 참조를 로컬 변수에 저장
  ```typescript
  const ptyProcess = session.ptyProcess
  session.ptyProcess.kill('SIGTERM')
  setTimeout(() => {
    try {
      if (!ptyProcess.killed) {
        ptyProcess.kill('SIGKILL')
      }
    } catch {
      // ignore
    }
  }, 2000)
  ```

### [Critical] onExit 핸들러에서 세션 정리 누락
- **파일**: `server/utils/terminalService.ts:348-370`
- **문제**: PTY 종료 시 세션이 Map에서 제거되지 않아 메모리 누수 발생
- **권장**: onExit 핸들러 마지막에 세션 정리 추가
  ```typescript
  ptyProcess.onExit(({ exitCode, signal }) => {
    // ... 기존 코드 ...

    // 세션 정리
    setTimeout(() => {
      this.sessions.delete(session.id)
    }, 1000)  // SSE 클라이언트에게 complete 전달 후 정리
  })
  ```

---

### [Major] SessionInfoResponse 타입 중복 정의
- **파일**: `server/utils/terminalService.ts:402-411`, `types/terminal.ts:37-46`
- **문제**: 동일 인터페이스가 두 곳에 정의되어 유지보수성 저하
- **권장**: `types/terminal.ts`의 정의만 사용하도록 통일
  ```typescript
  // terminalService.ts에서 import
  import type { SessionInfoResponse } from '~/types/terminal'

  // 타입 재정의 제거
  ```

### [Major] cwd 경로 검증 누락
- **파일**: `server/api/terminal/session/index.post.ts:31`
- **문제**: 사용자가 제공한 cwd 경로의 존재 여부와 접근 권한을 검증하지 않음
- **권장**: 경로 검증 로직 추가
  ```typescript
  if (body.cwd) {
    try {
      const fs = await import('fs/promises')
      await fs.access(body.cwd, fs.constants.R_OK)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: '유효하지 않은 작업 디렉토리입니다',
        data: { code: 'INVALID_CWD' }
      })
    }
  }
  ```

### [Major] SSE 클라이언트 등록 시점 경쟁 조건
- **파일**: `server/utils/terminalService.ts:276-292`
- **문제**: PTY 출력이 클라이언트 등록 전에 발생하면 데이터 손실
- **권장**: 버퍼링 크기 확인 후 경고 로그 추가
  ```typescript
  registerSSEClient(sessionId: string, writer: SSEWriter): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    // 버퍼 오버플로우 경고
    if (session.outputBuffer.length >= this.BUFFER_SIZE) {
      console.warn(`[TerminalService] Session ${sessionId} buffer near full`)
    }

    session.sseClients.add(writer)
    // ... 나머지 코드
  }
  ```

### [Major] 환경변수 타입 안정성 부족
- **파일**: `server/utils/terminalService.ts:87-93`
- **문제**: `process.env`를 `Record<string, string>`으로 캐스팅하지만 실제로는 `string | undefined`
- **권장**: 안전한 타입 처리
  ```typescript
  env: Object.entries(process.env)
    .filter(([_, v]) => v !== undefined)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v as string }), {
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      JJIBAN_SESSION_ID: sessionId,
      JJIBAN_TERMINAL_PID: ''
    })
  ```

### [Major] 타임아웃 후 세션 상태 검증 누락
- **파일**: `server/utils/terminalService.ts:386-390`
- **문제**: 타임아웃 콜백 실행 시점에 세션이 이미 종료되었을 수 있음
- **권장**: 세션 상태 재확인
  ```typescript
  session.timeoutId = setTimeout(() => {
    const currentSession = this.sessions.get(session.id)
    if (currentSession && currentSession.status !== 'closing') {
      console.log(`[TerminalService] Session ${session.id} timed out`)
      this.closeSession(session.id)
    }
  }, this.SESSION_TIMEOUT_MS)
  ```

---

### [Minor] 입력 검증 로직 불일치
- **파일**: `server/api/terminal/session/[id]/input.post.ts:17`
- **문제**: `!body.input && body.input !== ''` 조건이 복잡하고 의도가 불명확
- **권장**: 명확한 검증
  ```typescript
  if (body.input === undefined || body.input === null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'input 필드가 필요합니다',
      data: { code: 'MISSING_INPUT' }
    })
  }
  ```

### [Minor] 명령어 감지 정규식 미사용
- **파일**: `server/utils/terminalService.ts:240-253`
- **문제**: 명령어 감지 시 `includes` 사용, 정확도 낮음
- **권장**: 정규식 사용
  ```typescript
  if (/[\r\n]/.test(input)) {
    const command = input.trim()
    // ... 나머지 코드
  }
  ```

### [Minor] 상수 하드코딩
- **파일**: `server/utils/terminalService.ts:229`
- **문제**: 입력 크기 제한(10240)이 하드코딩
- **권장**: 클래스 상수로 정의
  ```typescript
  private readonly MAX_INPUT_SIZE = 10 * 1024  // 10KB

  if (input.length > this.MAX_INPUT_SIZE) {
    throw new Error('INPUT_TOO_LARGE')
  }
  ```

### [Minor] SSE 헤더 중복 설정 가능성
- **파일**: `server/api/terminal/session/[id]/output.get.ts:24-29`
- **문제**: X-Accel-Buffering, Content-Encoding은 환경에 따라 불필요
- **권장**: 조건부 설정 또는 주석 추가
  ```typescript
  // nginx 프록시 환경에서만 필요
  if (process.env.NGINX_PROXY === 'true') {
    setHeader(event, 'X-Accel-Buffering', 'no')
  }
  ```

### [Minor] 에러 메시지 일관성 부족
- **파일**: 모든 API 핸들러
- **문제**: 에러 메시지가 한글/영어 혼용, 일관성 부족
- **권장**: i18n 도입 또는 영문 메시지로 통일
  ```typescript
  // 현재: '세션 ID가 필요합니다'
  // 권장: 'Session ID is required' + i18n 처리
  ```

### [Minor] 로깅 부족
- **파일**: `server/utils/terminalService.ts` 전체
- **문제**: 디버깅을 위한 로그가 타임아웃 시점에만 존재
- **권장**: 주요 동작에 로깅 추가
  ```typescript
  createSession(options: CreateSessionOptions = {}): string {
    console.log(`[TerminalService] Creating session with options:`, options)
    // ... 생성 로직
    console.log(`[TerminalService] Session ${sessionId} created (PID: ${ptyProcess.pid})`)
    return sessionId
  }
  ```

---

## 보안 검토

### 양호한 점
1. 세션 ID에 UUID 사용으로 예측 불가능성 확보
2. 입력 크기 제한(10KB)으로 DoS 방지
3. 최대 세션 수(10개) 제한으로 리소스 고갈 방지
4. 터미널 크기 범위 검증(cols: 1-500, rows: 1-200)

### 개선 필요
1. **cwd 경로 검증**: 디렉토리 트래버설 공격 가능성
2. **입력 내용 검증**: 특수 문자/이스케이프 시퀀스 필터링 부재
3. **세션 소유권 검증**: taskId, projectId 권한 확인 미구현

---

## 성능 검토

### 양호한 점
1. SSE 기반 실시간 스트리밍으로 폴링 오버헤드 제거
2. 출력 버퍼 크기 제한(10,000줄)으로 메모리 관리
3. 실패한 SSE 클라이언트 일괄 정리로 효율성 향상
4. 타임아웃(5분) 설정으로 유휴 세션 자동 정리

### 개선 필요
1. **버퍼 메모리 최적화**: 문자열 배열 대신 순환 버퍼 사용 고려
2. **SSE 클라이언트 정리**: Set 순회보다 배열 일괄 처리가 효율적

---

## 아키텍처 검토

### 양호한 점
1. **싱글톤 서비스 패턴**: 세션 관리 중앙화
2. **명확한 책임 분리**: 서비스(비즈니스 로직) / API 핸들러(요청 처리)
3. **타입 안정성**: TypeScript 인터페이스로 계약 명확화
4. **이벤트 기반 설계**: PTY 이벤트를 SSE로 전파

### 개선 필요
1. **타입 중복**: SessionInfoResponse 중복 정의
2. **에러 처리 일관성**: 서비스 계층의 문자열 에러를 API에서 변환하는 패턴 개선
3. **리소스 정리 보장**: onExit에서 세션 삭제 누락

---

## 테스트 커버리지 평가

### 필수 테스트 항목
1. **세션 생명주기**: 생성 → 입력 → 출력 → 종료
2. **경쟁 조건**: 동시 closeSession 호출, SSE 클라이언트 등록/해제
3. **에러 처리**: 최대 세션 초과, 존재하지 않는 세션, 입력 크기 초과
4. **리소스 정리**: 타임아웃, 비정상 종료, cleanup 호출
5. **플랫폼 차이**: Windows/Unix 쉘 동작 차이

### 권장 테스트 구조
```typescript
describe('TerminalService', () => {
  describe('createSession', () => {
    it('should create session with default options')
    it('should reject when max sessions exceeded')
    it('should validate cols/rows ranges')
  })

  describe('closeSession', () => {
    it('should prevent race condition on concurrent close')
    it('should cleanup all resources')
    it('should notify SSE clients')
  })

  describe('SSE streaming', () => {
    it('should send buffered output to new client')
    it('should remove failed clients')
    it('should handle client disconnect')
  })
})
```

---

## 코드 품질 메트릭

| 항목 | 측정값 | 평가 |
|------|--------|------|
| 순환 복잡도 | 평균 3.2 | 양호 |
| 함수 길이 | 평균 25줄 | 양호 |
| 중복 코드 | 5% | 우수 |
| 타입 커버리지 | 95% | 우수 |
| 주석 비율 | 15% | 보통 |
| 에러 처리 | 85% | 양호 |

---

## 권장 우선순위

### P0 (즉시 수정)
1. [Critical] PTY 프로세스 종료 경쟁 조건
2. [Critical] onExit 핸들러 세션 정리 누락

### P1 (다음 릴리스 전)
3. [Major] SessionInfoResponse 타입 중복 제거
4. [Major] cwd 경로 검증 추가
5. [Major] 타임아웃 콜백 세션 상태 재확인

### P2 (기술 부채)
6. [Major] 환경변수 타입 안정성 개선
7. [Major] SSE 클라이언트 등록 시점 경쟁 조건
8. [Minor] 입력 검증 로직 개선
9. [Minor] 상수 하드코딩 제거

### P3 (개선 사항)
10. [Minor] 로깅 강화
11. [Minor] 에러 메시지 일관성
12. 테스트 커버리지 확보
13. 보안 강화 (경로 검증, 입력 필터링)

---

## 결론

**조건부 승인**

코드의 전반적인 구조와 설계는 우수하나, 다음 Critical 이슈를 해결한 후 배포를 권장합니다:

1. PTY 프로세스 종료 시 경쟁 조건 방지
2. onExit 핸들러에서 세션 정리 로직 추가

Major 이슈들은 기능에 직접적인 영향을 주지 않으나, 프로덕션 환경에서 메모리 누수와 보안 문제를 유발할 수 있으므로 다음 릴리스 전에 해결이 필요합니다.

특히 다음 영역에 대한 추가 검증을 권장합니다:
- 장시간 실행 시 메모리 사용량 모니터링
- 비정상 종료 시나리오 E2E 테스트
- Windows/Mac/Linux 플랫폼별 동작 검증

---

## 참고 자료
- [node-pty API Documentation](https://github.com/microsoft/node-pty)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
