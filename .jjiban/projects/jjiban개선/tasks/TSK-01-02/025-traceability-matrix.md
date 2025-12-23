# TSK-01-02: 터미널 UI 컴포넌트 - 추적성 매트릭스

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-02 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |

---

## 1. 요구사항 → 설계 추적

| 요구사항 ID | 요구사항 | 설계 항목 | 구현 파일 |
|------------|---------|----------|----------|
| PRD-3.2 | 터미널 다이얼로그 | Dialog 레이아웃 설계 | `TerminalDialog.vue` |
| PRD-5.1 | 신규 컴포넌트 | 4개 컴포넌트 구조 | `components/terminal/*` |
| PRD-5.2 | 컴포넌트 책임 | Props/Emits 정의 | 각 컴포넌트 스펙 |
| PRD-5.4 | 상태 관리 (Pinia) | TerminalStore 설계 | `stores/terminal.ts` |

---

## 2. 컴포넌트 → 기능 추적

| 컴포넌트 | 주요 기능 | 의존 컴포넌트 |
|---------|----------|--------------|
| TerminalHeaderIcon | 아이콘, 배지, 다이얼로그 열기 | TerminalDialog |
| TerminalDialog | 레이아웃, 세션 관리 | TerminalSessionList, TerminalView |
| TerminalSessionList | 목록, 선택, 닫기, 생성 | - |
| TerminalView | xterm.js, SSE, 입력 | - |

---

## 3. 스토어 → 컴포넌트 추적

| 스토어 속성/액션 | 사용 컴포넌트 |
|-----------------|--------------|
| sessions | TerminalDialog, TerminalSessionList |
| activeSessionId | TerminalDialog, TerminalSessionList |
| activeSessionCount | TerminalHeaderIcon |
| createSession() | TerminalDialog, TerminalSessionList |
| closeSession() | TerminalDialog, TerminalSessionList |
| setActiveSession() | TerminalSessionList |
| sendInput() | TerminalView |
| resize() | TerminalView (via composable) |

---

## 4. API → 컴포넌트 추적

| API 엔드포인트 | 호출 위치 |
|---------------|----------|
| POST /api/terminal/session | `store.createSession()` |
| DELETE /api/terminal/session/:id | `store.closeSession()` |
| GET /api/terminal/session/:id/output | `TerminalView.connectSSE()` |
| POST /api/terminal/session/:id/input | `store.sendInput()` |
| POST /api/terminal/session/:id/resize | `store.resize()` |

---

## 5. 테스트 커버리지 추적

| 구현 항목 | 단위 테스트 | 통합 테스트 |
|----------|------------|------------|
| useTerminalStore | TC-UT-01~05 | - |
| useTerminal | TC-UT-06~08 | - |
| TerminalSessionList | TC-UT-09~11 | - |
| 세션 생성 플로우 | - | TC-IT-01 |
| 명령어 실행 플로우 | - | TC-IT-02 |
| 세션 전환 플로우 | - | TC-IT-03 |
| 에러 복구 플로우 | - | TC-IT-04 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
