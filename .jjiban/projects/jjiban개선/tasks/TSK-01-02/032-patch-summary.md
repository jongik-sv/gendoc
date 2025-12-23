# TSK-01-02: 코드 리뷰 패치 적용 요약

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 패치 적용일 | 2025-12-17 |
| 기반 리뷰 | 031-code-review-claude-1.md |

## 적용된 수정 사항

### Critical 이슈 (3건 모두 해결)

#### 1. Date 객체 직렬화 문제 해결
**파일**: `app/types/terminal.ts`, `app/stores/terminal.ts`

**변경 내용**:
- `TerminalSession.createdAt`, `updatedAt`을 `Date` → `string` (ISO 8601 형식)으로 변경
- 모든 Date 생성 지점에서 `.toISOString()` 사용
- Getter에서 Date 비교 시 `new Date()` 생성자로 변환

```typescript
// Before
createdAt: Date
updatedAt: Date
session.createdAt = new Date()

// After
createdAt: string  // ISO 8601
updatedAt: string
session.createdAt = new Date().toISOString()

// Getter에서 비교
.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
```

**효과**: Pinia 스토어 직렬화 시 타입 불일치 문제 해결, devtools 호환성 향상

---

#### 2. EventSource 메모리 누수 해결
**파일**: `app/types/terminal.ts`, `app/stores/terminal.ts`

**변경 내용**:
- `TerminalState`에서 `eventSources` 필드 제거
- 스토어 외부에 `eventSourcesMap` (Map<string, EventSource>) 생성
- `connectSSE()` 메서드에서 기존 연결 상태 체크 로직 추가

```typescript
// 스토어 외부에서 관리
const eventSourcesMap = new Map<string, EventSource>()

connectSSE(sessionId: string): EventSource {
  // 기존 연결 상태 확인 후 정리
  const existing = eventSourcesMap.get(sessionId)
  if (existing) {
    if (existing.readyState === EventSource.OPEN) {
      return existing  // 이미 열린 연결 재사용
    }
    existing.close()
    eventSourcesMap.delete(sessionId)
  }

  // 새 연결 생성...
  eventSourcesMap.set(sessionId, eventSource)
  return eventSource
}
```

**효과**:
- EventSource 중복 등록 방지
- Pinia 직렬화 오류 해결
- 메모리 누수 방지

---

#### 3. XSS 방어 강화
**파일**: `app/components/terminal/TerminalView.vue`

**변경 내용**:
- xterm.js 초기화 시 `windowOptions.setWinLines: false` 추가

```typescript
const terminal = new Terminal({
  // ... 기존 옵션
  windowOptions: {
    setWinLines: false  // XSS 방어: 창 크기 변경 방지
  }
})
```

**효과**: 악의적인 ANSI 이스케이프 시퀀스로 인한 터미널 손상 방지

---

### Major 이슈 (5건 모두 해결)

#### 1. 에러 처리 개선
**파일**: `app/stores/terminal.ts`

**변경 내용**:
- `closeSession()` 메서드에서 404 에러만 무시, 나머지 에러는 로그 출력

```typescript
try {
  await $fetch(`/api/terminal/session/${sessionId}`, {
    method: 'DELETE'
  })
} catch (err: any) {
  // 404는 무시 (이미 종료됨)
  if (err.statusCode !== 404) {
    console.error('Failed to close session:', err)
  }
}
```

**효과**: 네트워크 문제나 권한 오류 진단 가능

---

#### 2. 출력 버퍼 렌더링 최적화
**파일**: `app/components/terminal/TerminalView.vue`

**변경 내용**:
- 렌더링된 인덱스 추적 (`renderedIndex` 변수)
- 초기 버퍼 복원 후 인덱스 저장
- watch에서 새 출력만 렌더링

```typescript
let renderedIndex = 0

// 초기 버퍼 복원
const existingBuffer = session.value?.outputBuffer || []
existingBuffer.forEach(text => terminal.write(text))
renderedIndex = existingBuffer.length

// 새 출력만 렌더링
watch(() => session.value?.outputBuffer.length, (newLength) => {
  if (!session.value || !newLength || newLength <= renderedIndex) return

  const buffer = session.value.outputBuffer
  for (let i = renderedIndex; i < newLength; i++) {
    terminal.write(buffer[i])
  }
  renderedIndex = newLength
})
```

**효과**: 중복 렌더링 방지, 중간 출력 누락 방지

---

#### 3. EventSource 관리 개선
**파일**: `app/stores/terminal.ts`

**변경 내용**:
- `eventSources`를 Pinia state에서 제거하고 외부 Map으로 관리
- 모든 EventSource 접근을 Map API로 변경

```typescript
// Before: Pinia state
eventSources: Record<string, EventSource>
this.eventSources[sessionId]

// After: 외부 Map
const eventSourcesMap = new Map<string, EventSource>()
eventSourcesMap.get(sessionId)
eventSourcesMap.set(sessionId, eventSource)
eventSourcesMap.delete(sessionId)
```

**효과**: Pinia devtools 및 persist 플러그인 호환성 확보

---

#### 4. SSE 연결 타이밍 이슈 해결
**파일**: `app/components/terminal/TerminalView.vue`

**변경 내용**:
- 세션 전환 시 watch 핸들러 개선
- oldId 체크 및 명시적 흐름 제어

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

**효과**: 세션 전환 시 SSE 연결 경쟁 조건 방지

---

#### 5. 재연결 로직 재귀 문제 해결
**파일**: `app/composables/useTerminalReconnect.ts`

**변경 내용**:
- 재귀 호출 방식 → while 루프로 변경

```typescript
// Before: 재귀 호출
async function attemptReconnect(): Promise<boolean> {
  // ...
  try {
    // ...
    return true
  } catch (err) {
    retryCount++
    return attemptReconnect()  // 재귀
  }
}

// After: while 루프
async function attemptReconnect(): Promise<boolean> {
  while (retryCount < maxRetries) {
    // Exponential backoff
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

**효과**: Promise 체인 길이 제한, 메모리 문제 방지

---

## 수정된 파일 목록

1. **app/types/terminal.ts**
   - TerminalSession.createdAt, updatedAt 타입 변경 (Date → string)
   - TerminalState.eventSources 필드 제거

2. **app/stores/terminal.ts**
   - eventSourcesMap을 스토어 외부에서 관리
   - 모든 Date 생성을 ISO 문자열로 변경
   - connectSSE() 메서드에서 기존 연결 상태 체크 추가
   - closeSession() 에러 처리 개선
   - 모든 EventSource 접근을 Map API로 변경

3. **app/composables/useTerminalReconnect.ts**
   - attemptReconnect() 메서드를 재귀 → while 루프로 변경

4. **app/components/terminal/TerminalView.vue**
   - renderedIndex 추적 변수 추가
   - 출력 버퍼 렌더링 최적화 (새 출력만 렌더링)
   - xterm.js windowOptions 추가 (XSS 방어)
   - 세션 전환 watch 핸들러 개선
   - cleanup()에서 renderedIndex 초기화

---

## 테스트 검증

### 빌드 검증
- [x] `npm run build` 성공
- [x] TypeScript 컴파일 오류 없음
- [x] Pinia 스토어 직렬화 검증

### 기능 검증 권장 사항
- [ ] 터미널 세션 생성/전환/종료 플로우
- [ ] SSE 연결 끊김 후 자동 재연결
- [ ] 출력 버퍼 복원 및 실시간 렌더링
- [ ] 여러 세션 동시 실행
- [ ] 브라우저 devtools에서 Pinia 상태 확인

---

## 미적용 이슈 (Minor 5건)

Minor 이슈는 코드 품질 향상 사항이므로 별도 작업으로 진행 가능:

1. **명명 규칙 일관성** (useTerminal.ts)
2. **키보드 탐색 개선** (TerminalSessionList.vue)
3. **CSS 색상 중앙화** (main.css)
4. **함수 반환 타입 명시** (이미 양호)
5. **로깅 시스템 구축** (console.warn 대체)

---

## 결론

### 적용 완료
- Critical 3건: 100% 해결
- Major 5건: 100% 해결
- 총 8건의 주요 이슈 해결

### 효과
- Pinia 스토어 직렬화 안정성 확보
- EventSource 메모리 누수 방지
- XSS 방어 강화
- 출력 렌더링 성능 최적화
- 에러 처리 개선
- 재연결 로직 안정화

### 다음 액션
- 기능 테스트 진행
- Minor 이슈 개선 계획 수립 (선택)
- 코드 리뷰 파일 아카이브: `031-code-review-claude-1(적용완료).md`
