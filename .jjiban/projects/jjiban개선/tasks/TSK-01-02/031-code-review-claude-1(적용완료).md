# TSK-01-02: 터미널 UI 컴포넌트 - 코드 리뷰

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 리뷰어 | Claude |
| 리뷰일 | 2025-12-17 |
| 리뷰 버전 | 1 |

## 리뷰 요약
- 총 지적 사항: 13건
- Critical: 3건
- Major: 5건
- Minor: 5건

## 상세 리뷰

### [Critical] 타입 안정성 - Date 객체 직렬화 위험
- **파일**: `app/stores/terminal.ts:23-24`, `75-76`
- **문제**:
  ```typescript
  createdAt: Date
  updatedAt: Date
  ```
  Pinia 스토어는 JSON 직렬화를 사용하는데, Date 객체는 문자열로 변환됩니다. 스토어를 persist하거나 devtools에서 볼 때 타입 불일치가 발생합니다.
- **권장**:
  ```typescript
  // types/terminal.ts
  createdAt: string  // ISO 8601 형식
  updatedAt: string

  // stores/terminal.ts
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()

  // getters에서 Date로 변환
  get createdAtDate() {
    return new Date(this.createdAt)
  }
  ```

### [Critical] 메모리 누수 - EventSource 정리 불완전
- **파일**: `app/stores/terminal.ts:201-233`
- **문제**:
  1. `connectSSE()` 메서드가 기존 연결을 재사용하지만, 이벤트 리스너가 중복 등록될 수 있습니다.
  2. `eventSource.readyState` 체크 없이 연결을 재사용합니다.
  3. 브라우저가 SSE 자동 재연결을 시도할 수 있어 좀비 연결이 생길 수 있습니다.
- **권장**:
  ```typescript
  connectSSE(sessionId: string): EventSource {
    // 기존 연결 상태 확인 후 정리
    const existing = this.eventSources[sessionId]
    if (existing) {
      if (existing.readyState === EventSource.OPEN) {
        return existing
      }
      existing.close()
      delete this.eventSources[sessionId]
    }

    const eventSource = new EventSource(
      `/api/terminal/session/${sessionId}/output`
    )

    // 이벤트 리스너 추가...

    this.eventSources[sessionId] = eventSource
    return eventSource
  }
  ```

### [Critical] XSS 방어 - 터미널 출력 미검증
- **파일**: `app/components/terminal/TerminalView.vue:126`, `132`
- **문제**:
  ```typescript
  terminal.write(text)  // 서버에서 받은 텍스트를 그대로 출력
  ```
  악의적인 ANSI 이스케이프 시퀀스나 제어 문자가 포함된 출력이 터미널을 손상시킬 수 있습니다.
- **권장**:
  xterm.js는 기본적으로 ANSI 이스케이프를 처리하지만, 추가 검증이 필요합니다:
  ```typescript
  // 위험한 시퀀스 필터링 옵션 추가
  const terminal = new Terminal({
    // ...
    allowProposedApi: true,
    // 제어 문자 제한
    windowOptions: {
      setWinLines: false,  // 창 크기 변경 방지
    }
  })

  // 또는 서버 측에서 출력 검증
  ```

### [Major] 에러 처리 - 네트워크 오류 메시지 부족
- **파일**: `app/stores/terminal.ts:103-108`
- **문제**:
  ```typescript
  } catch {
    // 서버 오류 무시 (이미 종료된 경우 등)
  }
  ```
  모든 오류를 무시하면 실제 네트워크 문제나 권한 오류를 진단할 수 없습니다.
- **권장**:
  ```typescript
  try {
    await $fetch(`/api/terminal/session/${sessionId}`, {
      method: 'DELETE'
    })
  } catch (err) {
    // 404는 무시 (이미 종료됨)
    if (err.statusCode !== 404) {
      console.error('Failed to close session:', err)
      // 선택적으로 사용자에게 알림
    }
  }
  ```

### [Major] 성능 - 출력 버퍼 중복 렌더링
- **파일**: `app/components/terminal/TerminalView.vue:128-134`
- **문제**:
  ```typescript
  watch(() => session.value?.outputBuffer.length, () => {
    if (session.value && session.value.outputBuffer.length > 0) {
      const lastOutput = session.value.outputBuffer[session.value.outputBuffer.length - 1]
      terminal.write(lastOutput)
    }
  })
  ```
  `outputBuffer.length`가 변경될 때마다 마지막 출력만 렌더링하지만:
  1. 초기 버퍼 복원 후에도 watch가 실행되어 중복 렌더링될 수 있습니다.
  2. 여러 출력이 동시에 추가되면 중간 출력을 놓칠 수 있습니다.
- **권장**:
  ```typescript
  // 렌더링된 인덱스 추적
  let renderedIndex = 0

  // 초기 버퍼 복원
  const existingBuffer = session.value?.outputBuffer || []
  existingBuffer.forEach(text => terminal.write(text))
  renderedIndex = existingBuffer.length

  // 새 출력만 렌더링
  watch(() => session.value?.outputBuffer.length, (newLength) => {
    if (!session.value || newLength <= renderedIndex) return

    const buffer = session.value.outputBuffer
    for (let i = renderedIndex; i < newLength; i++) {
      terminal.write(buffer[i])
    }
    renderedIndex = newLength
  })
  ```

### [Major] 타입 안정성 - EventSource 타입 정의 누락
- **파일**: `app/types/terminal.ts:32`
- **문제**:
  ```typescript
  eventSources: Record<string, EventSource>  // 세션별 SSE 연결 관리
  ```
  `EventSource`는 DOM API이고 Pinia 상태에 저장할 수 없습니다 (직렬화 불가). 이것은 devtools나 persist 플러그인에서 오류를 발생시킵니다.
- **권장**:
  ```typescript
  // types/terminal.ts
  export interface TerminalState {
    sessions: Record<string, TerminalSession>
    // eventSources 제거 - Pinia state에서 분리
    activeSessionId: string | null
    isCreating: boolean
    error: string | null
  }

  // stores/terminal.ts
  export const useTerminalStore = defineStore('terminal', {
    state: (): TerminalState => ({...}),

    // EventSource를 스토어 외부에서 관리
  })

  // 별도 Map으로 관리
  const eventSourcesMap = new Map<string, EventSource>()
  ```

### [Major] 경쟁 조건 - 세션 전환 시 SSE 타이밍
- **파일**: `app/components/terminal/TerminalView.vue:166-170`
- **문제**:
  ```typescript
  watch(() => props.sessionId, () => {
    cleanup()
    nextTick(initTerminal)
  })
  ```
  `cleanup()`이 SSE 연결을 끊지 않지만 (L162 주석 참조), 새 세션 초기화 시 `connectSSE()`를 호출하여 잠재적으로 여러 SSE 연결이 동시에 열릴 수 있습니다.
- **권장**:
  ```typescript
  watch(() => props.sessionId, async (newId, oldId) => {
    if (oldId) {
      cleanup()  // xterm만 정리
      // SSE는 스토어에서 관리하므로 끊지 않음
    }

    if (newId) {
      await nextTick()
      initTerminal()
    }
  })
  ```

### [Major] 재연결 로직 - 무한 재귀 위험
- **파일**: `app/composables/useTerminalReconnect.ts:24-52`
- **문제**:
  ```typescript
  async function attemptReconnect(): Promise<boolean> {
    // ...
    } catch (err) {
      retryCount++
      console.warn(`Reconnect attempt ${retryCount}/${maxRetries} failed:`, err)
      return attemptReconnect()  // 직접 재귀 호출
    }
  }
  ```
  비동기 재귀는 스택 오버플로우를 일으키지 않지만, Promise 체인이 길어져 메모리 문제가 발생할 수 있습니다.
- **권장**:
  ```typescript
  async function attemptReconnect(): Promise<boolean> {
    while (retryCount < maxRetries) {
      const delay = initialDelay * Math.pow(2, retryCount)
      store.updateSessionStatus(sessionId.value, 'reconnecting')

      await new Promise(resolve => setTimeout(resolve, delay))

      try {
        store.disconnectSSE(sessionId.value)
        store.connectSSE(sessionId.value)
        retryCount = 0
        return true
      } catch (err) {
        retryCount++
        console.warn(`Reconnect attempt ${retryCount}/${maxRetries} failed:`, err)
      }
    }

    store.updateSessionStatus(sessionId.value, 'error')
    return false
  }
  ```

### [Minor] 명명 규칙 - 일관성 부족
- **파일**: `app/composables/useTerminal.ts`
- **문제**:
  - `createAndConnect`: 동사 + 동사 조합
  - `getOrCreateTaskSession`: get/create 조합
  - `executeCommand`: 동사 + 명사
- **권장**:
  일관된 패턴 사용:
  ```typescript
  // 패턴 1: 동사 + 명사
  createSession()
  connectSession()
  executeCommand()

  // 패턴 2: 동사 + Or + 동사
  getOrCreateTaskSession()
  findOrCreateSession()
  ```

### [Minor] 접근성 - 키보드 탐색 불완전
- **파일**: `app/components/terminal/TerminalSessionList.vue:73-78`
- **문제**:
  ```vue
  tabindex="0"
  @keydown.enter="handleSelect(session.id)"
  ```
  Enter 키만 지원하고 화살표 키 탐색, Space 키, Escape 키가 없습니다.
- **권장**:
  ```vue
  <div
    v-for="(session, index) in sessions"
    :tabindex="session.id === activeSessionId ? 0 : -1"
    @keydown.enter.space="handleSelect(session.id)"
    @keydown.down="focusNext(index)"
    @keydown.up="focusPrev(index)"
    @keydown.delete="handleClose($event, session.id)"
  >
  ```

### [Minor] CSS - 하드코딩된 색상 값
- **파일**: `app/assets/css/main.css:1062-1126`
- **문제**:
  ```css
  .terminal-bg {
    background-color: #1e1e2e;  /* Catppuccin Mocha */
  }
  ```
  Tailwind 테마와 분리된 하드코딩된 HEX 값이 유지보수를 어렵게 만듭니다.
- **권장**:
  ```css
  /* tailwind.config.ts에 테마 추가 */
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#1e1e2e',
          fg: '#cdd6f4',
          // ...
        }
      }
    }
  }

  /* main.css */
  .terminal-bg {
    background-color: theme('colors.terminal.bg');
  }
  ```

### [Minor] 타입 명시 - 함수 반환 타입 누락
- **파일**: `app/composables/useTerminalResize.ts:22`, `44`, `54`
- **문제**:
  ```typescript
  function handleResize(): void {  // ✓ Good
  function setupResizeObserver(): void {  // ✓ Good
  function cleanup(): void {  // ✓ Good
  ```
  실제로는 잘 작성되었지만, 일부 함수는 타입 추론에 의존합니다.
- **권장**:
  모든 public 함수에 명시적 반환 타입 사용을 유지하세요. (현재 코드는 양호)

### [Minor] 에러 처리 - console.warn 대신 로깅 시스템
- **파일**: `app/composables/useTerminalResize.ts:36`, `app/composables/useTerminalReconnect.ts:49`
- **문제**:
  ```typescript
  console.warn('Terminal resize failed:', e)
  console.warn(`Reconnect attempt ${retryCount}/${maxRetries} failed:`, err)
  ```
  프로덕션 환경에서 console 로그는 적절하지 않습니다.
- **권장**:
  ```typescript
  // composables/useLogger.ts 생성
  export function useLogger() {
    return {
      warn: (msg: string, data?: any) => {
        if (import.meta.env.DEV) {
          console.warn(msg, data)
        }
        // 프로덕션: 원격 로깅 서비스로 전송
      }
    }
  }

  // 사용
  const logger = useLogger()
  logger.warn('Terminal resize failed', e)
  ```

### [Minor] 성능 - 불필요한 computed 사용
- **파일**: `app/composables/useTerminal.ts:62-68`
- **문제**:
  ```typescript
  return {
    sessions: computed(() => store.sessionList),
    activeSession: computed(() => store.activeSession),
    // ...
  }
  ```
  이미 Pinia getter는 computed이므로 이중 래핑이 불필요합니다.
- **권장**:
  ```typescript
  return {
    sessions: storeToRefs(store).sessionList,
    activeSession: storeToRefs(store).activeSession,
    // 또는 직접 반환
    get sessions() { return store.sessionList },
    get activeSession() { return store.activeSession },
  }
  ```

### [Minor] 문서화 - JSDoc 타입 정보 부족
- **파일**: 모든 파일
- **문제**:
  JSDoc 주석이 있지만 `@param`, `@returns`, `@throws` 정보가 부족합니다.
- **권장**:
  ```typescript
  /**
   * 새 세션 생성 및 활성화
   * @param request - 세션 생성 옵션
   * @returns 생성된 세션 ID
   * @throws {Error} 세션 생성 실패 시
   */
  async function createAndConnect(
    request?: CreateSessionRequest
  ): Promise<string> {
    // ...
  }
  ```

## 아키텍처 분석

### 강점
1. **책임 분리**: 스토어(상태), composable(로직), 컴포넌트(UI)가 명확히 분리됨
2. **재사용성**: composable 설계가 좋아 다른 컴포넌트에서도 사용 가능
3. **타입 안정성**: TypeScript를 적극 활용하여 타입 안전성 확보
4. **PrimeVue 통합**: PrimeVue 컴포넌트와 잘 통합됨

### 개선 영역
1. **상태 관리**: EventSource와 같은 직렬화 불가능한 객체는 Pinia 외부로 분리 필요
2. **에러 경계**: 전역 에러 처리 및 사용자 피드백 메커니즘 강화
3. **메모리 관리**: 장시간 실행 시 outputBuffer 관리 전략 필요 (현재 1000줄 제한)
4. **테스트 가능성**: 의존성 주입을 통한 테스트 가능성 향상

## 보안 분석

### 발견된 위험
1. **XSS**: 터미널 출력 검증 부족 (Critical)
2. **리소스 소진**: 무제한 세션 생성 가능
3. **메모리 누수**: EventSource 정리 불완전

### 권장 사항
1. 서버 측에서 세션 수 제한 (사용자당 최대 5개)
2. 터미널 출력 크기 제한 (메시지당 최대 64KB)
3. SSE 연결 타임아웃 설정 (5분 idle 후 자동 종료)

## 성능 분석

### 측정 필요 영역
1. **메모리 사용량**: 10개 세션 × 1000줄 버퍼 = 약 10MB (측정 필요)
2. **렌더링 성능**: xterm.js write() 호출 빈도 모니터링
3. **SSE 처리량**: 초당 메시지 수 제한

### 최적화 기회
1. **Virtual Scrolling**: outputBuffer가 커지면 가상 스크롤 고려
2. **Debouncing**: 빠른 출력 시 렌더링 debounce (현재 resize만 적용됨)
3. **Lazy Loading**: 비활성 세션의 버퍼를 메모리에서 해제

## 테스트 커버리지 권장

### 단위 테스트
- [ ] `useTerminal`: 세션 생성/종료/전환 로직
- [ ] `useTerminalResize`: 리사이즈 debounce 동작
- [ ] `useTerminalReconnect`: 재연결 exponential backoff
- [ ] `useTerminalStore`: 상태 변경 및 getter 로직

### 통합 테스트
- [ ] SSE 연결 라이프사이클
- [ ] 세션 전환 시 메모리 정리
- [ ] 네트워크 오류 시 재연결 시나리오

### E2E 테스트
- [ ] 터미널 열기/닫기 플로우
- [ ] 명령어 실행 및 출력 표시
- [ ] 여러 세션 동시 실행
- [ ] 연결 끊김 후 재연결

## 결론

**조건부 승인**

전반적으로 잘 구조화된 구현이지만, **3개의 Critical 이슈**를 반드시 해결해야 합니다:

1. ✅ Date 객체를 ISO 문자열로 변경하여 직렬화 문제 해결
2. ✅ EventSource 관리를 Pinia 외부로 분리
3. ✅ 터미널 출력 검증 또는 xterm.js 보안 옵션 강화

**Major 이슈** 5건은 우선순위에 따라 순차적으로 개선하되, 특히 에러 처리와 성능 최적화는 조기 개선을 권장합니다.

**Minor 이슈** 5건은 코드 품질 향상을 위한 권장 사항이며, 시간 여유가 있을 때 개선하면 됩니다.

### 승인 조건
- [ ] Critical 3건 모두 해결
- [ ] Major 이슈 중 최소 2건 해결 (에러 처리, 출력 버퍼 중복)
- [ ] 단위 테스트 커버리지 60% 이상

### 긍정적 평가
- TypeScript 활용도 높음
- Composition API 패턴 적절
- 컴포넌트 분리 우수
- 접근성 고려 (일부 개선 필요)
- CSS 중앙화 원칙 준수

---

**다음 액션**: Critical 이슈 수정 후 `032-code-review-response.md` 작성 및 재검토 요청
