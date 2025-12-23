# TSK-01-02: 터미널 UI 컴포넌트 - 기본설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 카테고리 | development |
| 도메인 | frontend |
| 상태 | 기본설계 [bd] |

---

## 1. 개요

### 1.1 목적

xterm.js 기반 웹 터미널 UI 컴포넌트를 구현하여 브라우저에서 LLM CLI 워크플로우를 실행하고 결과를 실시간으로 확인할 수 있도록 합니다.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| TerminalHeaderIcon 컴포넌트 | 서버 터미널 세션 API |
| TerminalDialog 컴포넌트 | 워크플로우 버튼 UI |
| TerminalSessionList 컴포넌트 | 터미널 테마 커스터마이징 |
| TerminalView 컴포넌트 | 세션 히스토리 저장 |
| stores/terminal.ts | |
| useTerminal composable | |

### 1.3 참조 문서

- PRD 3.2: 터미널 다이얼로그
- PRD 5.1: 신규 컴포넌트
- PRD 5.2: 컴포넌트 책임
- PRD 5.4: 상태 관리 (Pinia)
- TRD 3.1: 터미널 통합 구성도

---

## 2. 컴포넌트 구조

### 2.1 파일 구조

```
app/components/terminal/
├── TerminalHeaderIcon.vue    # 헤더 아이콘 + 세션 배지
├── TerminalDialog.vue        # 전역 다이얼로그 (좌우 분할)
├── TerminalSessionList.vue   # 왼쪽: 세션 목록
└── TerminalView.vue          # 오른쪽: xterm.js 래퍼

app/stores/
└── terminal.ts               # 터미널 세션 상태 관리

app/composables/
├── useTerminal.ts            # 터미널 세션 관리
└── useTerminalResize.ts      # 터미널 리사이즈 로직
```

### 2.2 컴포넌트 계층

```
AppHeader.vue
└── TerminalHeaderIcon.vue ─────┐
                                │ 클릭
                                ▼
TerminalDialog.vue ─────────────────────────────────────┐
├── TerminalSessionList.vue                             │
│   ├── 세션 항목 (● TSK-01-01 [build] 실행중)          │
│   ├── 세션 항목 (○ TSK-02-01 [done] 완료)             │
│   └── + 새 세션 버튼                                  │
└── TerminalView.vue                                    │
    └── xterm.js 인스턴스                               │
────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 상세

### 3.1 TerminalHeaderIcon.vue

**책임:**
- 헤더에 터미널 아이콘 표시
- 실행 중 세션 개수 배지 표시
- 클릭 시 TerminalDialog 열기

**Props/Emits:**
```typescript
// Props: 없음 (store에서 상태 조회)

// Emits
defineEmits<{
  (e: 'click'): void
}>()
```

**상태:**
```typescript
const terminalStore = useTerminalStore()
const activeCount = computed(() => terminalStore.activeSessionCount)
const dialogVisible = ref(false)
```

**UI 스펙:**
| 요소 | 스펙 |
|------|------|
| 아이콘 | `pi-desktop` (PrimeIcons) |
| 배지 위치 | 아이콘 우상단 |
| 배지 색상 | 실행 중: primary, 없음: 숨김 |
| 클릭 영역 | 32x32px |

### 3.2 TerminalDialog.vue

**책임:**
- PrimeVue Dialog 기반 전역 터미널 관리
- 좌우 분할 레이아웃 (세션 목록 250px + 터미널 flex-1)
- Task 독립적인 세션 관리

**Props:**
```typescript
interface Props {
  visible: boolean
}

defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()
```

**레이아웃:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 터미널 세션 관리                                          [X]   │
├──────────────────────┬──────────────────────────────────────────┤
│ 세션 목록 (250px)    │ 터미널 (flex-1)                          │
│ ┌──────────────────┐ │ ┌────────────────────────────────────────┐│
│ │ ● TSK-01-01      │ │ │ $ /wf:build TSK-01-01                 ││
│ │   [build] 실행중 │ │ │ [wf:build] 시작...                    ││
│ │ ○ TSK-02-01      │ │ │ ...                                   ││
│ │   [done] 완료    │ │ │                                       ││
│ │ + 새 세션        │ │ │                                       ││
│ └──────────────────┘ │ └────────────────────────────────────────┘│
└──────────────────────┴──────────────────────────────────────────┘
```

**Dialog 옵션:**
| 옵션 | 값 |
|------|-----|
| modal | true |
| maximizable | true |
| style.width | 90vw |
| style.height | 80vh |
| position | center |

### 3.3 TerminalSessionList.vue

**책임:**
- 전체 터미널 세션 목록 표시
- 세션 선택/종료 기능
- 실행 중/완료/에러 상태 표시

**Props/Emits:**
```typescript
interface Props {
  sessions: TerminalSession[]
  activeSessionId: string | null
}

defineEmits<{
  (e: 'select', sessionId: string): void
  (e: 'close', sessionId: string): void
  (e: 'create'): void
}>()
```

**세션 상태 표시:**
| 상태 | 아이콘 | 색상 |
|------|--------|------|
| running | ● | 녹색 (#22c55e) |
| completed | ○ | 회색 (#6b7280) |
| error | ○ | 빨간 (#ef4444) |
| connecting | 🔄 | 파란 (#3b82f6) |

### 3.4 TerminalView.vue

**책임:**
- xterm.js 인스턴스 관리
- SSE 연결 및 출력 렌더링
- 키 입력 처리 및 API 전송

**Props:**
```typescript
interface Props {
  sessionId: string
}

defineEmits<{
  (e: 'ready'): void
  (e: 'data', data: string): void
  (e: 'resize', cols: number, rows: number): void
}>()
```

**xterm.js 설정:**
```typescript
const terminalOptions: ITerminalOptions = {
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  theme: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: '#585b70'
  },
  scrollback: 10000,
  convertEol: true
}
```

**SSE 연결:**
```typescript
// GET /api/terminal/session/:id/output
const eventSource = new EventSource(`/api/terminal/session/${sessionId}/output`)

eventSource.addEventListener('output', (event) => {
  const { text } = JSON.parse(event.data)
  terminal.write(text)
})

eventSource.addEventListener('status', (event) => {
  const { status } = JSON.parse(event.data)
  // 상태 업데이트
})
```

**키 입력 처리:**
```typescript
terminal.onData((data) => {
  // POST /api/terminal/session/:id/input
  $fetch(`/api/terminal/session/${sessionId}/input`, {
    method: 'POST',
    body: { input: data }
  })
})
```

---

## 4. 상태 관리

### 4.1 stores/terminal.ts

```typescript
interface TerminalSession {
  id: string
  taskId?: string
  projectId?: string
  status: 'connecting' | 'connected' | 'running' | 'completed' | 'error'
  currentCommand?: string
  createdAt: Date
  updatedAt: Date
}

interface TerminalState {
  sessions: Map<string, TerminalSession>
  activeSessionId: string | null
  isConnecting: boolean
  error: string | null
}

// Actions
createSession(taskId?: string, projectId?: string): Promise<string>
closeSession(sessionId: string): Promise<void>
sendInput(sessionId: string, input: string): Promise<void>
resize(sessionId: string, cols: number, rows: number): Promise<void>
setActiveSession(sessionId: string): void

// Getters
activeSession: TerminalSession | null
activeSessionCount: number
sessionList: TerminalSession[]
```

### 4.2 useTerminal.ts

```typescript
export function useTerminal() {
  const store = useTerminalStore()

  // 세션 생성 및 터미널 초기화
  async function createAndConnect(taskId?: string, projectId?: string) {
    const sessionId = await store.createSession(taskId, projectId)
    store.setActiveSession(sessionId)
    return sessionId
  }

  // 명령어 실행
  async function executeCommand(command: string) {
    const sessionId = store.activeSessionId
    if (!sessionId) throw new Error('활성 세션 없음')
    await store.sendInput(sessionId, command + '\n')
  }

  return {
    createAndConnect,
    executeCommand,
    ...toRefs(store)
  }
}
```

---

## 5. 데이터 흐름

### 5.1 세션 생성 흐름

```
1. TerminalSessionList [+ 새 세션] 클릭
   │
2. terminalStore.createSession()
   │
3. POST /api/terminal/session
   │
4. 서버: node-pty spawn, sessionId 반환
   │
5. store.sessions.set(sessionId, session)
   │
6. store.setActiveSession(sessionId)
   │
7. TerminalView 렌더링
   │
8. xterm.js 초기화 + SSE 연결
```

### 5.2 입출력 흐름

```
[키 입력]
User → xterm.onData → POST /api/terminal/session/:id/input → node-pty.write

[출력]
node-pty.onData → SSE event: output → eventSource.onmessage → xterm.write
```

---

## 6. 비기능 요구사항

### 6.1 성능

| 항목 | 기준 |
|------|------|
| 터미널 연결 | < 500ms |
| 출력 렌더링 지연 | < 50ms |
| 터미널 스크롤 | 60fps |

### 6.2 접근성

- 키보드 네비게이션: Tab으로 세션 이동
- 터미널 폰트 크기: Ctrl+/- 조정
- 스크린 리더: 상태 변경 알림

### 6.3 에러 처리

| 에러 | 처리 |
|------|------|
| SSE 연결 끊김 | 자동 재연결 (3회 시도) |
| 세션 없음 | "세션이 종료되었습니다" 메시지 |
| 입력 실패 | 재시도 버튼 표시 |

---

## 7. 의존성

### 7.1 선행 Task

| Task | 필요 산출물 |
|------|-------------|
| TSK-01-01 | xterm, @xterm/addon-fit 패키지 설치 |
| TSK-01-03 | 터미널 세션 API |

### 7.2 패키지 의존성

```json
{
  "dependencies": {
    "xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0"
  }
}
```

---

## 8. 테스트 범위

### 8.1 단위 테스트

- TerminalHeaderIcon: 배지 표시, 클릭 이벤트
- TerminalSessionList: 세션 목록 렌더링, 선택/종료
- TerminalView: xterm 초기화, SSE 연결

### 8.2 통합 테스트

- 다이얼로그 열기 → 세션 생성 → 명령어 입력 → 출력 확인
- 세션 전환 시 터미널 상태 유지
- 다이얼로그 닫기 시 SSE 연결 유지

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
