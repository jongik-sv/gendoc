# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | 전역 터미널 및 워크플로우 통합 |
| Category | development |
| 작성일 | 2025-12-17 |

---

## 1. 테스트 범위

### 1.1 포함 범위

- AppHeader에 TerminalHeaderIcon 렌더링
- TerminalHeaderIcon 클릭 이벤트
- 세션 배지 표시
- TaskDetailPanel에 WorkflowActions 렌더링
- WorkflowActions 버튼 클릭 → 세션 생성 연동
- 프롬프트 전송 및 다이얼로그 자동 열기

### 1.2 제외 범위

- TerminalHeaderIcon 내부 구현 (TSK-01-02)
- WorkflowActions 내부 구현 (TSK-02-01)
- terminalStore 내부 구현 (TSK-02-03)
- 터미널 API 서버 로직 (TSK-01-03)

---

## 2. 단위 테스트 (Unit Tests)

### UT-01: AppHeader 터미널 아이콘 렌더링

| 항목 | 내용 |
|------|------|
| 대상 | AppHeader.vue |
| 사전 조건 | 컴포넌트 마운트 |
| 입력 | - |
| 예상 결과 | TerminalHeaderIcon 컴포넌트가 렌더링됨 |
| AC 연결 | AC-01 |

### UT-02: 세션 배지 표시

| 항목 | 내용 |
|------|------|
| 대상 | AppHeader 내 TerminalHeaderIcon |
| 사전 조건 | terminalStore.sessions에 2개 세션 존재 |
| 입력 | - |
| 예상 결과 | 배지에 "2" 표시 |
| AC 연결 | AC-03 |

### UT-03: TaskDetailPanel WorkflowActions 렌더링

| 항목 | 내용 |
|------|------|
| 대상 | TaskDetailPanel.vue |
| 사전 조건 | Task 노드 선택됨 (type='task') |
| 입력 | selectedItem = { type: 'task', id: 'TSK-04-01', ... } |
| 예상 결과 | WorkflowActions 컴포넌트가 렌더링됨 |
| AC 연결 | AC-04 |

### UT-04: TaskDetailPanel WP/ACT 선택 시 WorkflowActions 숨김

| 항목 | 내용 |
|------|------|
| 대상 | TaskDetailPanel.vue |
| 사전 조건 | WP 노드 선택됨 (type='wp') |
| 입력 | selectedItem = { type: 'wp', id: 'WP-01', ... } |
| 예상 결과 | WorkflowActions 컴포넌트가 렌더링되지 않음 |
| AC 연결 | AC-04 |

### UT-05: 버튼 활성화 필터링 (development)

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions (연동 테스트) |
| 사전 조건 | Task status='[ ]', category='development' |
| 입력 | task = { status: '[ ]', category: 'development' } |
| 예상 결과 | 'start' 버튼만 활성화 |
| AC 연결 | AC-04 |

### UT-06: 버튼 활성화 필터링 (infrastructure)

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions (연동 테스트) |
| 사전 조건 | Task status='[ ]', category='infrastructure' |
| 입력 | task = { status: '[ ]', category: 'infrastructure' } |
| 예상 결과 | 'start', 'skip' 버튼 활성화 |
| AC 연결 | AC-04 |

---

## 3. 통합 테스트 (Integration Tests)

### IT-01: 터미널 아이콘 클릭 → 다이얼로그 열기

| 항목 | 내용 |
|------|------|
| 대상 | AppHeader + TerminalDialog |
| 사전 조건 | 페이지 로드 완료 |
| 입력 | TerminalHeaderIcon 클릭 |
| 예상 결과 | TerminalDialog visible=true |
| AC 연결 | AC-02 |

### IT-02: 워크플로우 버튼 클릭 → 세션 생성

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions + terminalStore |
| 사전 조건 | Task 선택됨, 버튼 활성화 |
| 입력 | 'build' 버튼 클릭 |
| 예상 결과 | terminalStore.createSession 호출됨 |
| AC 연결 | AC-05 |

### IT-03: 워크플로우 버튼 클릭 → 프롬프트 전송

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions + terminalStore |
| 사전 조건 | 세션 생성 완료 |
| 입력 | 'build' 버튼 클릭 |
| 예상 결과 | terminalStore.sendInput("/wf:build jjiban개선/TSK-04-01\n") 호출됨 |
| AC 연결 | AC-06 |

### IT-04: 워크플로우 실행 → 다이얼로그 자동 열기

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions + TerminalDialog |
| 사전 조건 | 프롬프트 전송 완료 |
| 입력 | 'build' 버튼 클릭 |
| 예상 결과 | TerminalDialog visible=true |
| AC 연결 | AC-07 |

### IT-05: 세션 생성 실패 → 에러 처리

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions + terminalStore |
| 사전 조건 | API 에러 발생 |
| 입력 | 'build' 버튼 클릭 |
| 예상 결과 | Toast 에러 메시지 표시, 버튼 normal 복원 |
| AC 연결 | - (에러 처리) |

### IT-06: 최대 세션 초과 → 에러 처리

| 항목 | 내용 |
|------|------|
| 대상 | WorkflowActions + terminalStore |
| 사전 조건 | 10개 세션 존재 |
| 입력 | 새 세션 생성 시도 |
| 예상 결과 | "최대 세션 수 초과" 메시지 표시 |
| AC 연결 | - (에러 처리) |

---

## 4. E2E 테스트 (End-to-End)

### E2E-01: 전체 워크플로우 실행 흐름

| 항목 | 내용 |
|------|------|
| 시나리오 | 사용자가 Task를 선택하고 워크플로우를 실행함 |
| 단계 | 1. WBS 페이지 접속<br>2. Task 노드 클릭<br>3. WorkflowActions에서 'start' 버튼 클릭<br>4. TerminalDialog 자동 열림 확인<br>5. 터미널 출력 확인 |
| 예상 결과 | 터미널에 "/wf:start ..." 명령어 표시 |
| AC 연결 | AC-01 ~ AC-07 |

### E2E-02: 터미널 아이콘 → 다이얼로그 → 세션 전환

| 항목 | 내용 |
|------|------|
| 시나리오 | 여러 세션 간 전환 |
| 단계 | 1. 워크플로우 실행으로 세션 2개 생성<br>2. 터미널 아이콘 클릭<br>3. 세션 목록에서 다른 세션 선택<br>4. 터미널 뷰 전환 확인 |
| 예상 결과 | 선택된 세션의 터미널 출력 표시 |
| AC 연결 | AC-02, AC-03 |

---

## 5. 테스트 데이터

### 5.1 Mock Task 데이터

| 필드 | 값 (development) | 값 (infrastructure) |
|------|-----------------|---------------------|
| id | TSK-04-01 | TSK-05-01 |
| type | task | task |
| title | 전역 터미널 통합 | CLI 설정 로더 |
| status | [ ] | [ ] |
| category | development | infrastructure |

### 5.2 Mock Session 데이터

| 필드 | 값 |
|------|-----|
| id | term-abc123 |
| taskId | TSK-04-01 |
| projectId | jjiban개선 |
| status | running |
| currentCommand | build |

---

## 6. 테스트 환경

| 항목 | 값 |
|------|-----|
| 테스트 프레임워크 | Vitest |
| 컴포넌트 테스트 | @vue/test-utils |
| E2E 테스트 | Playwright |
| Mock | vi.mock (Vitest) |

---

## 7. 테스트 커버리지 목표

| 유형 | 목표 |
|------|------|
| 단위 테스트 | >= 80% |
| 통합 테스트 | 주요 흐름 100% |
| E2E 테스트 | Happy path 100% |

---

<!--
author: Claude
Template Version: 1.0.0
-->
