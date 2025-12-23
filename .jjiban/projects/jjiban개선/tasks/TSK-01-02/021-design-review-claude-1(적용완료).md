# TSK-01-02: 터미널 UI 컴포넌트 - 설계 리뷰

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 리뷰어 | Claude |
| 리뷰일 | 2025-12-17 |
| 리뷰 버전 | 1 |

## 리뷰 요약
- 총 지적 사항: 9건
- Critical: 2건
- Major: 4건
- Minor: 3건

---

## 상세 리뷰

### [Critical] SSE 연결 관리 누락

**위치**: `020-detail-design.md` 섹션 5.4 TerminalView.vue

**문제**:
세션 전환 시 기존 SSE 연결이 닫히지 않고 새 연결만 생성되는 로직입니다. `watch(() => props.sessionId)` 핸들러에서 `cleanup()` 후 재초기화하면, 이전 세션의 SSE 연결도 끊어지게 됩니다. 다이얼로그가 열려 있는 동안 백그라운드 세션들의 출력도 실시간으로 받아야 하는데, 현재 설계는 활성 세션만 SSE 연결을 유지합니다.

**권장**:
1. **다중 SSE 연결 관리**: 각 세션마다 독립적인 EventSource를 유지하고, 다이얼로그가 열려있을 때만 연결 유지
2. **스토어 레벨에서 관리**: `terminal.ts` 스토어에 `eventSources: Map<string, EventSource>` 추가하여 세션별 SSE 연결 관리
3. **TerminalView는 수동 모드**: props.sessionId의 세션이 이미 연결되어 있으면 기존 버퍼를 렌더링만 하고, 없으면 새로 연결

**근거**:
실무 터미널 도구(VS Code Terminal, iTerm2 등)는 모든 탭의 출력을 백그라운드에서도 계속 수신합니다. 사용자가 다른 탭으로 돌아왔을 때 누락된 출력이 있으면 신뢰도가 떨어집니다.

---

### [Critical] 출력 버퍼 관리 누락

**위치**: `020-detail-design.md` 섹션 3.1 stores/terminal.ts

**문제**:
`TerminalSession` 인터페이스에 출력 버퍼가 없습니다. SSE로 받은 출력 데이터를 어디에 저장하는지 명시되지 않았습니다. 세션 전환 시 "기존 출력 버퍼 표시" (020-detail-design.md:303)라고 되어 있지만, 실제로 버퍼를 저장하는 구조가 없습니다.

**권장**:
1. `TerminalSession` 인터페이스에 `outputBuffer: string[]` 추가
2. SSE 이벤트 수신 시 스토어에 버퍼 저장: `session.outputBuffer.push(text)`
3. TerminalView 마운트 시 기존 버퍼를 xterm에 `write()` 로 복원
4. 버퍼 크기 제한 설정 (예: 최근 1000줄)

**근거**:
세션 전환은 자주 발생하는 작업이며, 사용자는 이전 출력을 다시 확인할 수 있어야 합니다. 메모리 관리 측면에서도 무제한 버퍼는 위험하므로 크기 제한이 필요합니다.

---

### [Major] 에러 처리 구체성 부족

**위치**: `010-basic-design.md` 섹션 6.3 에러 처리

**문제**:
에러 처리 표에 "자동 재연결 (3회 시도)"라고만 되어 있고, 실제 구현 로직이 없습니다. 020-detail-design.md의 TerminalView.vue에는 재연결 버튼만 있고, 자동 재연결 로직이 구현되어 있지 않습니다.

**권장**:
1. **Exponential Backoff 재연결**: 1초 → 2초 → 4초 간격으로 재시도
2. **재연결 상태 추가**: `reconnecting`, `reconnect-failed` 상태 타입 추가
3. **useTerminalReconnect composable 분리**: 재연결 로직을 전담하는 composable 생성
```typescript
export function useTerminalReconnect(sessionId: Ref<string>) {
  let retryCount = 0
  const maxRetries = 3

  async function attemptReconnect() {
    if (retryCount >= maxRetries) {
      store.updateSessionStatus(sessionId.value, 'error')
      return false
    }

    const delay = Math.pow(2, retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      // SSE 재연결 시도
      retryCount++
      return true
    } catch {
      return attemptReconnect()
    }
  }

  return { attemptReconnect }
}
```

**근거**:
네트워크 불안정은 흔한 상황이며, 사용자가 매번 수동으로 재연결하는 것은 UX 저하입니다. 자동 재연결은 표준 패턴입니다.

---

### [Major] TypeScript 타입 안정성 문제

**위치**: `020-detail-design.md` 섹션 3.1 stores/terminal.ts

**문제**:
1. `sessions: Map<string, TerminalSession>` 은 Pinia state에서 직렬화 불가능합니다. Vue 3 devtools에서 제대로 표시되지 않고, HMR 시 문제가 발생합니다.
2. `$fetch` 호출 시 에러 타입이 `any`로 되어 있습니다 (line 231).

**권장**:
1. **Record 객체 사용**:
```typescript
state: (): TerminalState => ({
  sessions: {} as Record<string, TerminalSession>,
  // ...
})
```
2. **타입 안전한 에러 처리**:
```typescript
} catch (err) {
  if (err instanceof Error) {
    this.error = err.message
  } else {
    this.error = '알 수 없는 오류가 발생했습니다'
  }
  throw err
}
```

**근거**:
Map은 Pinia에서 공식적으로 권장하지 않는 구조이며, Vue devtools 호환성 문제가 있습니다. TypeScript strict mode에서 any 사용은 타입 안정성을 해칩니다.

---

### [Major] 메모리 누수 가능성

**위치**: `020-detail-design.md` 섹션 5.4 TerminalView.vue, line 1035-1038

**문제**:
`watch(() => props.sessionId)` 핸들러가 세션 전환 시 cleanup → initTerminal을 하지만, 다음 문제들이 있습니다:
1. ResizeObserver는 cleanup되지만, EventSource는 cleanup()에서만 정리됩니다
2. Terminal.onData 리스너가 제거되지 않습니다
3. 이전 xterm 인스턴스가 dispose되지만, DOM 참조가 남을 수 있습니다

**권장**:
1. **명시적 리스너 정리**:
```typescript
let dataDisposable: IDisposable | null = null

function initTerminal() {
  // ...
  dataDisposable = terminal.onData((data) => {
    emit('data', data)
    store.sendInput(props.sessionId, data)
  })
}

function cleanup() {
  dataDisposable?.dispose()
  dataDisposable = null

  if (eventSourceRef.value) {
    eventSourceRef.value.close()
    eventSourceRef.value = null
  }

  if (terminalRef.value) {
    terminalRef.value.dispose()
    terminalRef.value = null
  }
}
```

**근거**:
xterm.js의 `onData()`는 Disposable을 반환하며, 명시적으로 dispose해야 합니다. 그렇지 않으면 이벤트 리스너가 누적되어 메모리 누수가 발생합니다.

---

### [Major] CSS 중앙화 원칙 위반

**위치**: `020-detail-design.md` 섹션 5.2 TerminalDialog.vue, line 677

**문제**:
`background-color: #1e1e2e` 같은 HEX 값이 컴포넌트에 하드코딩되어 있습니다. CLAUDE.md의 "CSS 클래스 중앙화 원칙"에 따르면 HEX 하드코딩은 금지됩니다.

**권장**:
1. **main.css에 테마 클래스 정의**:
```css
.terminal-bg {
  background-color: #1e1e2e;
}

.terminal-text {
  color: #cdd6f4;
}
```

2. **컴포넌트에서 클래스 사용**:
```vue
<div class="terminal-empty-state terminal-bg">
```

**근거**:
프로젝트 코딩 규칙 명시: "컴포넌트 내 :style 및 HEX 하드코딩 금지". 테마 변경 시 중앙에서 관리하기 위한 원칙입니다.

---

### [Minor] Props 검증 누락

**위치**: `020-detail-design.md` 섹션 5.4 TerminalView.vue

**문제**:
`sessionId` prop에 대한 검증이 없습니다. 빈 문자열이나 유효하지 않은 ID가 전달될 수 있습니다.

**권장**:
```typescript
const props = defineProps<Props>()

// Props 검증
watchEffect(() => {
  if (!props.sessionId || props.sessionId.trim() === '') {
    console.error('TerminalView: Invalid sessionId prop')
  }
})
```

또는 Vue 3 props validator 사용:
```typescript
const props = defineProps({
  sessionId: {
    type: String,
    required: true,
    validator: (value: string) => value.length > 0
  }
})
```

**근거**:
방어적 프로그래밍 관점에서 props 검증은 런타임 에러를 조기에 발견하는 데 도움이 됩니다.

---

### [Minor] 접근성 개선 필요

**위치**: `011-ui-design.md` 섹션 7. 접근성

**문제**:
ARIA 레이블은 잘 정의되어 있지만, 실제 구현 코드(020-detail-design.md)에는 일부만 적용되어 있습니다.
- TerminalSessionList에 `role="listbox"` 있지만 `aria-multiselectable="false"` 누락
- 세션 항목에 `aria-posinset`, `aria-setsize` 누락 (목록 위치 정보)

**권장**:
```vue
<div
  v-for="(session, index) in sessions"
  :key="session.id"
  class="session-item"
  role="option"
  :aria-selected="session.id === activeSessionId"
  :aria-posinset="index + 1"
  :aria-setsize="sessions.length"
  tabindex="0"
>
```

**근거**:
WCAG 2.1 AA 준수를 위해 리스트박스 패턴의 완전한 구현이 필요합니다.

---

### [Minor] 테스트 명세 불완전

**위치**: `026-test-specification.md` 섹션 4. 성능 테스트

**문제**:
성능 기준은 있지만 실제 측정 방법이 추상적입니다. "대량 출력 시 스크롤 성능" 같은 표현은 정량화되지 않았습니다.

**권장**:
구체적인 테스트 시나리오 추가:
```markdown
| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 초기 연결 | < 500ms | Performance.now() 측정: createSession 호출 ~ SSE open 이벤트 |
| 대량 출력 (1000줄/초) | 60fps 유지 | Chrome DevTools Performance 프로파일링, FPS 그래프 확인 |
| 메모리 사용 | 세션당 < 50MB | Chrome DevTools Memory 프로파일링, Heap Snapshot |
```

**근거**:
성능 테스트는 재현 가능하고 측정 가능해야 하며, CI/CD 파이프라인에 통합할 수 있어야 합니다.

---

## 아키텍처 검토

### 강점
1. **컴포넌트 분리가 명확함**: 각 컴포넌트의 책임이 단일하고 재사용 가능합니다
2. **Pinia 상태 관리 적절함**: 중앙화된 세션 관리로 컴포넌트 간 통신이 명확합니다
3. **SSE 사용 적절함**: 실시간 출력 스트리밍에 적합한 기술 선택입니다
4. **문서화 수준 우수함**: 기본설계, 화면설계, 상세설계가 체계적입니다

### 개선 필요
1. **세션 생명주기 관리**: 다중 세션 SSE 연결 및 버퍼 관리 전략 필요
2. **에러 복구 로직**: 자동 재연결, Circuit Breaker 패턴 고려
3. **메모리 관리**: 버퍼 크기 제한, 오래된 세션 자동 정리 정책
4. **프로젝트 규칙 준수**: CSS 중앙화 원칙 철저히 적용

---

## 구현 가능성 검토

### 기술적 실현 가능성
- **xterm.js 통합**: 구현 가능, 단 리사이즈와 이벤트 리스너 관리 주의 필요
- **SSE 연결**: 구현 가능, 단 다중 세션 연결 관리 복잡도 증가
- **PrimeVue Dialog**: 구현 가능, 레이아웃은 표준 Flex 구조

### 누락된 요구사항
1. **세션 영속성**: 새로고침 시 세션 복원 전략 없음
2. **명령어 히스토리**: 터미널 명령어 히스토리(↑/↓ 키) 기능 누락
3. **복사/붙여넣기**: Ctrl+C/V 동작 명세 없음
4. **검색 기능**: 출력 내용 검색 기능 없음 (향후 확장 고려 필요)

---

## 품질 검토

### 코드 품질 기준
- **TypeScript 사용**: 적절함
- **타입 안정성**: Map → Record 변경 필요, any 타입 제거 필요
- **에러 처리**: 구체화 필요
- **메모리 관리**: 명시적 cleanup 강화 필요

### 테스트 전략
- **단위 테스트**: 스토어, composable 커버리지 적절
- **통합 테스트**: 4개 시나리오 충분
- **성능 테스트**: 측정 방법 구체화 필요
- **E2E 테스트**: 언급 없음 (Playwright MCP 활용 권장)

---

## 위험 요소

| 위험 | 영향도 | 완화 방안 |
|------|--------|----------|
| SSE 연결 불안정 | High | 자동 재연결, 상태 복원 로직 |
| 메모리 누수 | High | 명시적 cleanup, 버퍼 크기 제한 |
| 성능 저하 (대량 출력) | Medium | Virtual scrolling, 출력 throttling |
| 브라우저 호환성 | Low | xterm.js가 대부분 브라우저 지원 |

---

## 권장 사항

### 즉시 조치 (구현 전 필수)
1. Critical 이슈 2건 해결 (SSE 연결 관리, 출력 버퍼)
2. Major 이슈 중 TypeScript 타입 안정성, 메모리 누수 해결
3. CSS 중앙화 원칙 준수를 위한 main.css 클래스 정의

### 구현 중 고려
1. 자동 재연결 로직 구현
2. Props 검증 추가
3. 접근성 ARIA 속성 완전 구현

### 향후 개선
1. 명령어 히스토리 기능 (TSK-01-04 등에서)
2. 출력 검색 기능
3. 세션 영속성 (localStorage 또는 IndexedDB)
4. E2E 테스트 시나리오 작성

---

## 결론

**조건부 승인**

설계는 전체적으로 견고하나, 다음 조건 충족 후 구현 진행을 권장합니다:

1. SSE 다중 연결 관리 전략 수립 및 설계 문서 업데이트
2. 출력 버퍼 관리 구조를 TerminalSession에 추가
3. TypeScript Map → Record 변경 및 타입 안정성 개선
4. 메모리 누수 방지를 위한 명시적 cleanup 로직 강화
5. CSS 하드코딩 제거 및 main.css 클래스로 이관

위 5가지 항목 반영 후 상세설계 문서 v1.1 업데이트 시 **승인** 가능합니다.

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1 | 2025-12-17 | 초안 작성 (Claude 설계 리뷰) |
