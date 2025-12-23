# TSK-01-02: 터미널 UI 컴포넌트 - 구현 문서

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 카테고리 | development |
| 상태 | 구현 완료 [im] |

---

## 1. 구현 개요

### 1.1 구현 범위
- 터미널 세션 관리 시스템 (Pinia Store)
- xterm.js 기반 터미널 UI 컴포넌트
- SSE 기반 실시간 출력 렌더링
- 다중 세션 관리 및 전환
- 자동 재연결 및 리사이즈 처리

### 1.2 기술 스택
- **프레임워크**: Vue 3 Composition API, Nuxt 3
- **터미널**: @xterm/xterm 5.5.0, @xterm/addon-fit 0.10.0
- **상태 관리**: Pinia
- **UI 컴포넌트**: PrimeVue 4.x
- **스타일**: TailwindCSS, CSS 변수

---

## 2. 구현 파일 목록

### 2.1 신규 생성 파일

| 파일 경로 | 설명 | 상태 |
|----------|------|------|
| `app/types/terminal.ts` | 터미널 타입 정의 | ✅ 완료 |
| `app/stores/terminal.ts` | Pinia 터미널 스토어 | ✅ 완료 |
| `app/composables/useTerminal.ts` | 터미널 세션 관리 | ✅ 완료 |
| `app/composables/useTerminalResize.ts` | 리사이즈 핸들러 | ✅ 완료 |
| `app/composables/useTerminalReconnect.ts` | 자동 재연결 | ✅ 완료 |
| `app/components/terminal/TerminalView.vue` | xterm.js 래퍼 | ✅ 완료 |
| `app/components/terminal/TerminalSessionList.vue` | 세션 목록 | ✅ 완료 |
| `app/components/terminal/TerminalDialog.vue` | 다이얼로그 | ✅ 완료 |
| `app/components/terminal/TerminalHeaderIcon.vue` | 헤더 아이콘 | ✅ 완료 |

### 2.2 수정 파일

| 파일 경로 | 변경 내용 | 상태 |
|----------|----------|------|
| `app/components/layout/AppHeader.vue` | TerminalHeaderIcon 추가 | ✅ 완료 |
| `app/assets/css/main.css` | 터미널 스타일 클래스 추가 | ✅ 완료 |

---

## 3. 핵심 구현 내용

### 3.1 타입 시스템 (terminal.ts)

#### 세션 상태 타입
```typescript
export type TerminalSessionStatus =
  | 'connecting'    // SSE 연결 중
  | 'connected'     // 연결 완료, 대기 중
  | 'running'       // 명령어 실행 중
  | 'completed'     // 정상 종료
  | 'error'         // 오류 발생
  | 'reconnecting'  // 자동 재연결 중
```

#### 핵심 인터페이스
- `TerminalSession`: 세션 정보 (id, status, outputBuffer 등)
- `TerminalState`: Pinia 스토어 상태 (Record 기반)
- `CreateSessionRequest/Response`: API 요청/응답
- `TerminalTheme`: xterm.js 테마 설정

**설계 리뷰 반영**:
- `sessions: Map` → `sessions: Record<string, TerminalSession>` (Pinia 직렬화 호환)
- `eventSources: Record<string, EventSource>` 추가 (다중 세션 SSE 관리)

### 3.2 스토어 구현 (terminal.ts)

#### 주요 Getters
- `activeSession`: 현재 활성 세션 객체
- `activeSessionCount`: 실행 중인 세션 개수 (배지 표시용)
- `sessionList`: 세션 배열 (최신순 정렬)

#### 주요 Actions
```typescript
// 세션 생성 및 SSE 연결
async createSession(request: CreateSessionRequest): Promise<string>

// 세션 종료 및 정리
async closeSession(sessionId: string): Promise<void>

// SSE 연결 생성 및 이벤트 리스닝
connectSSE(sessionId: string): EventSource

// 출력 버퍼 관리 (최근 1000줄 유지)
appendOutput(sessionId: string, text: string): void

// 입력 전송 및 리사이즈
async sendInput(sessionId: string, input: string): Promise<void>
async resize(sessionId: string, cols: number, rows: number): Promise<void>
```

**설계 리뷰 반영**:
- SSE 연결을 스토어 레벨에서 관리 (세션 전환 시 연결 유지)
- `outputBuffer` 배열로 출력 버퍼 관리 (1000줄 제한)
- 에러 처리 시 `instanceof Error` 타입 가드 사용

### 3.3 Composables

#### useTerminal.ts
- 스토어 액션 래퍼 제공
- `createAndConnect`: 세션 생성 및 활성화
- `executeCommand`: 명령어 실행 (개행 자동 추가)
- `getOrCreateTaskSession`: Task별 세션 재사용

#### useTerminalResize.ts
- ResizeObserver로 컨테이너 크기 감지
- 100ms debounce로 리사이즈 최적화
- FitAddon으로 터미널 크기 자동 조정
- cleanup 시 observer 정리

#### useTerminalReconnect.ts
- Exponential backoff 재연결 (1s → 2s → 4s)
- 최대 3회 재시도
- 수동 재연결 버튼 지원
- cleanup 시 timeout 정리

### 3.4 컴포넌트 구조

#### TerminalView.vue
- xterm.js Terminal 인스턴스 관리
- FitAddon으로 자동 크기 조정
- SSE 출력을 실시간 렌더링
- IDisposable 명시적 dispose (메모리 누수 방지)
- 세션 전환 시 버퍼 복원
- 연결/에러 오버레이 표시

**테마**: Catppuccin Mocha 색상 적용

#### TerminalSessionList.vue
- 세션 목록 표시 (상태 아이콘, 라벨)
- 선택/닫기 이벤트 처리
- 새 세션 생성 버튼
- 접근성: role="listbox", aria-selected

#### TerminalDialog.vue
- PrimeVue Dialog 래퍼
- 좌측: TerminalSessionList (250px)
- 우측: TerminalView 또는 빈 상태
- 90vw x 80vh 크기, maximizable/draggable

#### TerminalHeaderIcon.vue
- 헤더 터미널 아이콘 버튼
- 활성 세션 개수 배지 표시
- 클릭 시 TerminalDialog 표시

### 3.5 CSS 중앙화

#### main.css 추가 클래스
```css
/* 터미널 배경 및 텍스트 */
.terminal-bg { background-color: #1e1e2e; }
.terminal-text { color: #cdd6f4; }
.terminal-overlay-bg { background-color: rgba(30, 30, 46, 0.9); }
.terminal-overlay-text { color: #cdd6f4; }
.terminal-empty-text { color: #6c7086; }

/* 세션 상태 색상 */
.session-status-running { color: theme('colors.green.500'); }
.session-status-connected { color: theme('colors.blue.500'); }
.session-status-error { color: theme('colors.red.500'); }
.session-status-reconnecting { color: theme('colors.yellow.500'); }

/* 스크롤바 커스텀 */
.terminal-container ::-webkit-scrollbar { width: 10px; }
.terminal-container ::-webkit-scrollbar-track { background: #313244; }
.terminal-container ::-webkit-scrollbar-thumb { background: #585b70; }
```

**설계 원칙 준수**:
- HEX 하드코딩 금지 → CSS 클래스 사용
- xterm.js 테마는 설정 객체이므로 예외 허용

---

## 4. 설계 리뷰 반영 사항

### 4.1 Critical 이슈 해결

#### 1. SSE 연결 관리 (다중 세션 지원)
**문제**: 세션 전환 시 SSE 연결 재생성으로 백그라운드 출력 손실

**해결**:
- `TerminalState`에 `eventSources: Record<string, EventSource>` 추가
- `connectSSE()`, `disconnectSSE()` 액션 추가
- 각 세션마다 독립적인 EventSource 유지
- 세션 전환 시 기존 SSE 연결 유지 (백그라운드 출력 수신)

#### 2. 출력 버퍼 관리
**문제**: 세션 전환 시 기존 출력 손실

**해결**:
- `TerminalSession.outputBuffer: string[]` 추가 (최근 1000줄)
- `appendOutput()` 액션으로 버퍼 관리
- TerminalView 마운트 시 기존 버퍼를 xterm에 복원
- SSE 이벤트 수신 시 버퍼에 저장 후 xterm 렌더링

### 4.2 Major 이슈 해결

#### 3. 자동 재연결 로직
**구현**:
- `useTerminalReconnect.ts` composable 생성
- Exponential backoff 재연결 (1s → 2s → 4s)
- 최대 3회 재시도, 실패 시 `error` 상태 전환
- TerminalView에서 자동 재연결 통합

#### 4. TypeScript 타입 안정성
**개선**:
- `sessions: Map` → `sessions: Record` (Pinia 직렬화 호환)
- 에러 처리 시 `instanceof Error` 타입 가드 사용
- 모든 함수에 명시적 반환 타입 지정

#### 5. 메모리 누수 방지
**구현**:
- `terminal.onData()` 리턴값을 `IDisposable`로 저장
- cleanup 시 `dataDisposable.dispose()` 명시적 호출
- ResizeObserver 정리 로직 강화
- `eventSources` Record로 SSE 연결 추적 및 정리

#### 6. CSS 중앙화 원칙 준수
**적용**:
- main.css에 `.terminal-*` 클래스 정의
- 컴포넌트 내 HEX 하드코딩 제거
- xterm.js 테마는 설정 객체이므로 예외 유지

---

## 5. API 연동

### 5.1 사용하는 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 상태 |
|--------|-----------|------|------|
| POST | `/api/terminal/session` | 세션 생성 | 백엔드 구현 필요 |
| DELETE | `/api/terminal/session/:id` | 세션 종료 | 백엔드 구현 필요 |
| GET | `/api/terminal/session/:id/output` | 출력 SSE | 백엔드 구현 필요 |
| POST | `/api/terminal/session/:id/input` | 입력 전송 | 백엔드 구현 필요 |
| POST | `/api/terminal/session/:id/resize` | 리사이즈 | 백엔드 구현 필요 |

### 5.2 SSE 이벤트 형식
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

## 6. 테스트 시나리오

### 6.1 단위 테스트 (예정)
- [ ] useTerminalStore: 세션 생성/삭제/조회
- [ ] useTerminalStore: 활성 세션 전환
- [ ] useTerminalStore: 세션 상태 업데이트
- [ ] useTerminal: createAndConnect 동작
- [ ] useTerminal: executeCommand 동작

### 6.2 통합 테스트 (예정)
- [ ] 세션 생성 플로우: 버튼 클릭 → API 호출 → 목록 추가
- [ ] 명령어 실행: 입력 → 서버 전송 → 출력 표시
- [ ] 세션 전환: 클릭 → SSE 유지 → 버퍼 복원
- [ ] 에러 복구: 연결 끊김 → 재연결 버튼 → 복구

### 6.3 E2E 테스트 (예정)
- [ ] 헤더 아이콘 배지 표시 확인
- [ ] 다이얼로그 열기/닫기
- [ ] 다중 세션 생성 및 전환
- [ ] 명령어 실행 및 출력 확인
- [ ] 자동 재연결 동작 확인

---

## 7. 향후 개선 사항

### 7.1 기능 확장
- [ ] Task 상세 패널 통합 (Task별 전용 터미널)
- [ ] 세션 히스토리 저장 및 복원
- [ ] 터미널 테마 커스터마이징
- [ ] 명령어 자동완성 (TAB)
- [ ] 세션별 환경 변수 설정

### 7.2 최적화
- [ ] 출력 버퍼 가상 스크롤 (대용량 출력 처리)
- [ ] SSE 재연결 시 누락 출력 복구
- [ ] 세션 유휴 시간 기반 자동 종료
- [ ] 터미널 렌더링 성능 프로파일링

### 7.3 접근성
- [ ] 키보드 네비게이션 개선
- [ ] 스크린 리더 지원 강화
- [ ] ARIA 라벨 보완

---

## 8. 참고 문서

- [010-basic-design.md](./010-basic-design.md) - 기본 설계
- [020-detail-design.md](./020-detail-design.md) - 상세 설계 v1.1
- [021-design-review-opus-1.md](./021-design-review-opus-1.md) - 설계 리뷰
- [xterm.js 공식 문서](https://xtermjs.org/)
- [Pinia 공식 문서](https://pinia.vuejs.org/)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성, 구현 완료 |
