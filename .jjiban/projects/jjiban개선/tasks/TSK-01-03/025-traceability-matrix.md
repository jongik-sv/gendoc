# TSK-01-03: 서버 터미널 세션 API - 추적성 매트릭스

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |

---

## 1. 요구사항 → 설계 추적

| 요구사항 ID | 요구사항 | 설계 항목 | 구현 파일 |
|------------|---------|----------|----------|
| PRD-4.1 | Server Routes | API 엔드포인트 설계 | `server/api/terminal/*` |
| PRD-4.3 | 터미널 세션 API | 6개 API 정의 | API 핸들러 파일들 |
| TRD-4.1 | 터미널 서비스 구조 | TerminalService 클래스 | `terminalService.ts` |
| TRD-4.2 | TerminalService 클래스 | 세션 관리 로직 | `terminalService.ts` |

---

## 2. API → 구현 추적

| API 엔드포인트 | 구현 파일 | TerminalService 메서드 |
|---------------|----------|----------------------|
| POST /api/terminal/session | `session.post.ts` | `createSession()` |
| GET /api/terminal/session | `session.get.ts` | `getAllSessions()` |
| DELETE /api/terminal/session/:id | `[id].delete.ts` | `closeSession()` |
| GET /api/terminal/session/:id/output | `output.get.ts` | `registerSSEClient()` |
| POST /api/terminal/session/:id/input | `input.post.ts` | `sendInput()` |
| POST /api/terminal/session/:id/resize | `resize.post.ts` | `resize()` |

---

## 3. TerminalService 메서드 → 기능 추적

| 메서드 | 주요 기능 | 의존성 |
|--------|----------|--------|
| createSession() | PTY spawn, 세션 저장 | node-pty |
| closeSession() | PTY kill, 클라이언트 알림 | - |
| getSession() | 세션 조회 | - |
| getAllSessions() | 전체 목록 | - |
| sendInput() | PTY write | - |
| resize() | PTY resize | - |
| registerSSEClient() | SSE 클라이언트 등록 | - |
| unregisterSSEClient() | SSE 클라이언트 해제 | - |

---

## 4. SSE 이벤트 → 클라이언트 추적

| SSE 이벤트 | 발생 시점 | 클라이언트 처리 |
|-----------|----------|---------------|
| output | PTY stdout | terminal.write() |
| status | 명령어 시작/상태 변경 | store 업데이트 |
| complete | PTY exit | 세션 상태 완료 |
| error | 오류 발생 | 에러 표시 |

---

## 5. 테스트 커버리지 추적

| 구현 항목 | 단위 테스트 | 통합 테스트 |
|----------|------------|------------|
| TerminalService.createSession | TC-UT-01, TC-UT-02 | - |
| TerminalService.closeSession | TC-UT-03 | - |
| TerminalService.sendInput | TC-UT-04, TC-UT-05 | - |
| TerminalService.resize | TC-UT-06, TC-UT-07 | - |
| 전체 세션 흐름 | - | TC-IT-01 |
| SSE 스트리밍 | - | TC-IT-02 |
| 다중 클라이언트 | - | TC-IT-03 |
| 타임아웃 | - | TC-IT-04 |
| 에러 복구 | - | TC-IT-05 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
