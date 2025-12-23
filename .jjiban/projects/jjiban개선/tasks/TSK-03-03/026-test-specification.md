# 테스트 명세 (026-test-specification.md)

**Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Task명 | 워크플로우 명령어 훅 |
| 작성일 | 2025-12-17 |

---

## 1. 테스트 범위

### 1.1 포함

| 대상 | 테스트 유형 |
|------|-------------|
| cli/commands/exec.js | Unit |
| bin/jjiban.js 등록 | Integration |
| wf 명령어 훅 | E2E |

### 1.2 제외

| 대상 | 사유 |
|------|------|
| 실행 상태 API | TSK-03-01 범위 (완료) |
| 클라이언트 스피너 | TSK-03-02 범위 (완료) |

---

## 2. 단위 테스트 케이스

### TC-001: exec start 성공

| 항목 | 내용 |
|------|------|
| ID | TC-001 |
| 대상 | exec.js start 서브커맨드 |
| 설명 | 유효한 인자로 start 호출 시 API 호출 성공 |
| 전제조건 | API 서버 기동 (mock) |
| 입력 | `npx jjiban exec start TSK-01-01 build --session term-123 --pid 12345` |
| 예상결과 | POST /api/execution/start 호출, 성공 메시지 출력 |
| 추적 | FR-001, AC-01 |

---

### TC-002: exec stop 성공

| 항목 | 내용 |
|------|------|
| ID | TC-002 |
| 대상 | exec.js stop 서브커맨드 |
| 설명 | 유효한 인자로 stop 호출 시 API 호출 성공 |
| 전제조건 | API 서버 기동 (mock) |
| 입력 | `npx jjiban exec stop TSK-01-01` |
| 예상결과 | POST /api/execution/stop 호출, 성공 메시지 출력 |
| 추적 | FR-002, AC-02 |

---

### TC-003: 환경변수 우선순위

| 항목 | 내용 |
|------|------|
| ID | TC-003 |
| 대상 | exec.js 환경변수 처리 |
| 설명 | CLI 옵션이 환경변수보다 우선 |

**테스트 케이스**

| 환경변수 | CLI 옵션 | 예상 사용값 |
|----------|----------|-------------|
| term-env | --session term-cli | term-cli |
| term-env | (없음) | term-env |
| (없음) | --session term-cli | term-cli |
| (없음) | (없음) | null (경고) |

**추적**: FR-003, AC-03

---

### TC-004: wf 명령어 시작 훅 호출

| 항목 | 내용 |
|------|------|
| ID | TC-004 |
| 대상 | .claude/commands/wf/build.md |
| 설명 | build 명령어 실행 시 시작 훅이 호출됨 |
| 전제조건 | 터미널 환경변수 설정됨 |
| 입력 | `/wf:build TSK-01-01` 실행 |
| 예상결과 | `npx jjiban exec start TSK-01-01 build` 호출됨 |
| 추적 | FR-004, AC-04 |

---

### TC-005: wf 명령어 종료 훅 호출

| 항목 | 내용 |
|------|------|
| ID | TC-005 |
| 대상 | .claude/commands/wf/build.md |
| 설명 | build 명령어 완료 시 종료 훅이 호출됨 |
| 전제조건 | 시작 훅 호출됨 |
| 입력 | `/wf:build TSK-01-01` 완료 |
| 예상결과 | `npx jjiban exec stop TSK-01-01` 호출됨 |
| 추적 | FR-005, AC-05 |

---

### TC-006: CLI 실행 시간

| 항목 | 내용 |
|------|------|
| ID | TC-006 |
| 대상 | exec.js |
| 설명 | CLI 명령어 실행 시간 500ms 이내 |
| 측정방법 | 명령어 시작~종료 시간 측정 |
| 기준 | < 500ms |
| 추적 | NFR-001 |

---

### TC-007: API 실패 시 워크플로우 계속

| 항목 | 내용 |
|------|------|
| ID | TC-007 |
| 대상 | exec.js 에러 처리 |
| 설명 | API 호출 실패 시 경고만 출력하고 계속 진행 |
| 전제조건 | API 서버 미기동 또는 500 응답 |
| 입력 | `npx jjiban exec start TSK-01-01 build` |
| 예상결과 | 경고 메시지 출력, exit code 0 |
| 추적 | NFR-002, AC-06 |

---

### TC-008: bin/jjiban.js exec 등록

| 항목 | 내용 |
|------|------|
| ID | TC-008 |
| 대상 | bin/jjiban.js |
| 설명 | exec 명령어가 CLI에 등록됨 |
| 입력 | `npx jjiban exec --help` |
| 예상결과 | exec 명령어 도움말 출력 (start, stop 서브커맨드 포함) |

---

## 3. 통합 테스트 케이스

### TC-INT-001: 전체 훅 흐름

| 항목 | 내용 |
|------|------|
| ID | TC-INT-001 |
| 대상 | wf 명령어 + exec.js + API |
| 설명 | 워크플로우 명령어 실행 시 전체 훅 흐름 검증 |
| 전제조건 | API 서버 기동, 터미널 환경변수 설정 |

**단계**

| 순서 | 동작 | 검증 |
|------|------|------|
| 1 | /wf:build TSK-01-01 시작 | - |
| 2 | 시작 훅 실행 | exec start 호출됨 |
| 3 | API 호출 | /api/execution/start 응답 200 |
| 4 | 워크플로우 로직 실행 | - |
| 5 | 종료 훅 실행 | exec stop 호출됨 |
| 6 | API 호출 | /api/execution/stop 응답 200 |

---

## 4. 경계값 테스트

### TC-EDGE-001: 잘못된 taskId 형식

| 항목 | 내용 |
|------|------|
| ID | TC-EDGE-001 |
| 입력 | `npx jjiban exec start invalid-id build` |
| 예상결과 | API 호출 (서버에서 검증), 응답에 따라 경고 출력 |

### TC-EDGE-002: 필수 인자 누락

| 항목 | 내용 |
|------|------|
| ID | TC-EDGE-002 |
| 입력 | `npx jjiban exec start TSK-01-01` (command 누락) |
| 예상결과 | Commander 에러 메시지 출력 |

### TC-EDGE-003: 네트워크 타임아웃

| 항목 | 내용 |
|------|------|
| ID | TC-EDGE-003 |
| 전제조건 | API 응답 지연 (>5초) |
| 입력 | `npx jjiban exec start TSK-01-01 build` |
| 예상결과 | 타임아웃 경고 출력, exit code 0 |

---

## 5. 테스트 환경

| 항목 | 값 |
|------|---|
| 프레임워크 | Jest 또는 Vitest |
| Mock | nock (HTTP mock) |
| 환경변수 | process.env 조작 |
| 커버리지 도구 | c8 또는 @vitest/coverage-v8 |
| 목표 커버리지 | >= 80% |

---

## 6. 수동 테스트 체크리스트

| # | 테스트 항목 | 통과 |
|---|-------------|------|
| 1 | `npx jjiban exec --help` 출력 확인 | [ ] |
| 2 | `npx jjiban exec start TSK-01-01 build` 성공 | [ ] |
| 3 | `npx jjiban exec stop TSK-01-01` 성공 | [ ] |
| 4 | 환경변수 없이 CLI 옵션으로 실행 | [ ] |
| 5 | API 미기동 시 경고 출력 확인 | [ ] |
| 6 | /wf:build 실행 시 시작/종료 훅 확인 | [ ] |

---

<!--
author: Claude
Version: 1.0.0
-->
