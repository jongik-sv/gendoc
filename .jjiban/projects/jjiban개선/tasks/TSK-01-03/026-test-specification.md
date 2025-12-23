# TSK-01-03: 서버 터미널 세션 API - 테스트 명세

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-03 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |

---

## 1. 단위 테스트

### 1.1 TerminalService

| TC ID | 테스트 케이스 | 입력 | 기대 결과 |
|-------|-------------|------|----------|
| TC-UT-01 | 세션 생성 성공 | `createSession()` | sessionId 반환, sessions Map에 저장 |
| TC-UT-02 | 최대 세션 초과 | 11번째 `createSession()` | `MAX_SESSIONS_EXCEEDED` 에러 |
| TC-UT-03 | 세션 종료 | `closeSession(id)` | sessions에서 제거, PTY kill 호출 |
| TC-UT-04 | 입력 전송 | `sendInput(id, 'ls\n')` | PTY write 호출, status 'running' |
| TC-UT-05 | 큰 입력 거부 | `sendInput(id, 11KB)` | `INPUT_TOO_LARGE` 에러 |
| TC-UT-06 | 리사이즈 정상 | `resize(id, 100, 30)` | PTY resize(100, 30) 호출 |
| TC-UT-07 | 범위 초과 리사이즈 | `resize(id, 1000, 500)` | PTY resize(500, 200) 호출 (클램핑) |

### 1.2 API 핸들러

| TC ID | 테스트 케이스 | 요청 | 기대 응답 |
|-------|-------------|------|----------|
| TC-UT-08 | 세션 생성 API | POST /session {} | 200, sessionId 포함 |
| TC-UT-09 | 잘못된 cols | POST /session {cols: 1000} | 400, INVALID_COLS |
| TC-UT-10 | 세션 목록 조회 | GET /session | 200, sessions 배열 |
| TC-UT-11 | 세션 종료 API | DELETE /session/:id | 200, success: true |
| TC-UT-12 | 없는 세션 종료 | DELETE /session/invalid | 404, SESSION_NOT_FOUND |

---

## 2. 통합 테스트

### 2.1 TC-IT-01: 전체 세션 흐름

**시나리오**: 세션 생성 → 입력 → 출력 → 종료

**테스트 단계**:
1. POST /api/terminal/session 호출
2. sessionId 획득
3. GET /api/terminal/session/:id/output (SSE 연결)
4. POST /api/terminal/session/:id/input `{input: "echo test\n"}`
5. SSE output 이벤트 수신 확인
6. DELETE /api/terminal/session/:id

**기대 결과**:
- 세션 생성 성공
- SSE 연결 성공
- 입력 전송 성공
- output 이벤트에 "test" 포함
- 세션 종료 성공

---

### 2.2 TC-IT-02: SSE 스트리밍

**시나리오**: SSE 연결 및 실시간 출력 수신

**테스트 단계**:
1. 세션 생성
2. SSE 연결
3. 다중 명령어 입력 (ls, pwd, echo)
4. 각 출력 이벤트 수신 확인

**기대 결과**:
- 각 명령어 출력이 별도 output 이벤트로 수신
- 출력 순서 보장
- 연결 유지

---

### 2.3 TC-IT-03: 다중 클라이언트

**시나리오**: 동일 세션에 여러 SSE 클라이언트 연결

**테스트 단계**:
1. 세션 생성
2. SSE 클라이언트 A 연결
3. SSE 클라이언트 B 연결
4. 명령어 입력
5. 두 클라이언트 모두 출력 수신 확인

**기대 결과**:
- 두 클라이언트 동시 연결 성공
- 동일 출력 모두 수신
- 한 클라이언트 종료 후 다른 클라이언트 정상 동작

---

### 2.4 TC-IT-04: 타임아웃

**시나리오**: 비활성 세션 자동 종료

**사전 조건**: SESSION_TIMEOUT = 5분 (테스트용 짧게 설정)

**테스트 단계**:
1. 세션 생성
2. SSE 연결
3. 5분간 비활성
4. 세션 상태 확인

**기대 결과**:
- 5분 후 세션 자동 종료
- SSE complete 이벤트 수신
- getAllSessions()에서 제거

---

### 2.5 TC-IT-05: 에러 복구

**시나리오**: PTY 프로세스 비정상 종료

**테스트 단계**:
1. 세션 생성
2. SSE 연결
3. PTY 프로세스 강제 종료 (kill -9)
4. SSE 이벤트 확인

**기대 결과**:
- complete 이벤트 수신 (success: false)
- 세션 상태 'error'
- 클라이언트에서 에러 처리 가능

---

## 3. 성능 테스트

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 세션 생성 | < 500ms | 10회 평균 |
| 입력 응답 | < 50ms | API 응답 시간 |
| 출력 지연 | < 100ms | PTY → SSE 이벤트 |
| 동시 세션 | 10개 | 10개 세션 동시 생성 |
| SSE 연결 | 5개/세션 | 동시 클라이언트 |

---

## 4. 부하 테스트

| 테스트 | 조건 | 기대 결과 |
|--------|------|----------|
| 대량 출력 | 1MB 출력 연속 전송 | 지연 없이 스트리밍 |
| 빠른 입력 | 100 입력/초 | 모두 처리 |
| 장시간 연결 | 1시간 SSE 연결 | 연결 유지 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
