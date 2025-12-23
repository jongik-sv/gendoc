# 테스트 명세 (026-test-specification.md)

**Task ID:** TSK-07-01
**Task명:** Workflow Orchestrator CLI 구현
**작성일:** 2025-12-15

---

## 1. 테스트 전략

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 도구 |
|------------|------|------|
| Unit Test | 개별 모듈 | Vitest |
| Integration Test | 모듈 간 연동 | Vitest |
| E2E Test | 전체 CLI 실행 | Playwright (CLI) |

### 1.2 테스트 환경

- Node.js 20.x
- 테스트용 .jjiban/projects/test-project/ 디렉토리
- Mock Claude CLI (실제 Claude 호출 없이 테스트)

---

## 2. 단위 테스트 명세

### UT-001: CLI 진입점 테스트

**파일:** `tests/unit/cli/bin.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 버전 출력 | --version | 버전 번호 출력 |
| 도움말 출력 | --help | 도움말 메시지 출력 |
| 알 수 없는 명령어 | jjiban unknown | 에러 메시지 + 도움말 |

### UT-002: workflow 명령어 파싱 테스트

**파일:** `tests/unit/cli/commands/workflow.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 기본 실행 | workflow TSK-07-01 | taskId 파싱 성공 |
| --until 옵션 | workflow TSK-07-01 --until build | until: "build" |
| --dry-run 옵션 | workflow TSK-07-01 --dry-run | dryRun: true |
| --resume 옵션 | workflow TSK-07-01 --resume | resume: true |
| --verbose 옵션 | workflow TSK-07-01 --verbose | verbose: true |
| 복합 옵션 | workflow TSK-07-01 -u build -d -v | 모든 옵션 파싱 |
| taskId 누락 | workflow | 에러: taskId 필수 |

### UT-003: WbsReader 테스트

**파일:** `tests/unit/cli/core/WbsReader.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| Task 조회 성공 | getTask("TSK-07-01") | { category, status, ... } |
| Task 없음 | getTask("TSK-99-99") | null 반환 |
| wbs.md 없음 | getTask() on missing file | 에러 throw |
| 다양한 Task ID 형식 | TSK-01-01, TSK-01-01-01 | 모두 파싱 성공 |

### UT-004: workflowSteps 테스트

**파일:** `tests/unit/cli/config/workflowSteps.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| development 단계 | getSteps("development") | [start, draft, ...] |
| defect 단계 | getSteps("defect") | [start, fix, ...] |
| infrastructure 단계 | getSteps("infrastructure") | [start, build, ...] |
| 현재 상태→단계 | getStepsFrom("[bd]", "development") | [draft, ...] |
| 목표까지 단계 | getStepsUntil("build", "development") | [start, draft, ..., build] |

### UT-005: ClaudeExecutor 테스트

**파일:** `tests/unit/cli/core/ClaudeExecutor.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 명령어 실행 | run("/wf:start TSK-07-01") | { exitCode: 0, output } |
| 실행 실패 | run() with failing claude | { exitCode: 1, error } |
| 타임아웃 | run() with timeout | 타임아웃 에러 |
| spawn 인자 | run() | spawn("claude", ["-p", command]) 호출 확인 |

### UT-006: StateManager 테스트

**파일:** `tests/unit/cli/core/StateManager.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 상태 저장 | save(state) | workflow-state.json 생성 |
| 상태 로드 | load(taskId) | 저장된 상태 반환 |
| 상태 없음 | load() on missing file | null 반환 |
| 상태 업데이트 | update({ currentStep: 2 }) | 부분 업데이트 |
| 상태 삭제 | clear(taskId) | 파일 삭제 |

### UT-007: WorkflowRunner 테스트

**파일:** `tests/unit/cli/core/WorkflowRunner.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 전체 실행 | execute(task) | 모든 단계 순차 실행 |
| 중간 단계부터 | execute() from [bd] | draft부터 시작 |
| 단계 완료 콜백 | execute() | onStepComplete 호출 |
| 실패 시 중단 | execute() with failing step | 실패 단계에서 중단 |

### UT-008: --until 옵션 테스트

**파일:** `tests/unit/cli/options/until.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| build까지 | --until build | build 완료 후 중단 |
| draft까지 | --until detail-design | draft 완료 후 중단 |
| 잘못된 target | --until invalid | 에러 메시지 |

### UT-009: --dry-run 옵션 테스트

**파일:** `tests/unit/cli/options/dryRun.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| dry-run 모드 | --dry-run | 계획만 출력, 실행 안함 |
| ClaudeExecutor 호출 없음 | --dry-run | run() 호출 0회 |

### UT-010: --resume 옵션 테스트

**파일:** `tests/unit/cli/options/resume.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 재개 성공 | --resume with saved state | 마지막 완료 단계 다음부터 |
| 상태 없이 재개 | --resume without state | 에러: 저장된 상태 없음 |

### UT-011: SIGINT 핸들러 테스트

**파일:** `tests/unit/cli/handlers/sigint.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| Ctrl+C 시 상태 저장 | process.kill(SIGINT) | 상태 파일 저장 |
| graceful shutdown | SIGINT | 진행 중인 단계 완료 후 종료 |

### UT-012: 타임아웃 테스트

**파일:** `tests/unit/cli/core/timeout.test.ts`

| 테스트 케이스 | 입력 | 기대 결과 |
|--------------|------|----------|
| 30분 타임아웃 | slow command | STEP_TIMEOUT 에러 |
| 타임아웃 후 상태 저장 | timeout | 현재 상태 저장 |

---

## 3. E2E 테스트 명세

### E2E-001: 전체 워크플로우 실행

**파일:** `tests/e2e/cli-workflow.spec.ts`

**전제조건:**
- 테스트용 프로젝트 생성 (.jjiban/projects/test-project/)
- 테스트용 wbs.md 생성
- Mock Claude CLI 설정

| 테스트 케이스 | 설명 | 기대 결과 |
|--------------|------|----------|
| 기본 실행 | npx jjiban workflow TSK-TEST-01 | 성공 메시지 |
| 상태 파일 생성 | 실행 후 | workflow-state.json 존재 |
| 중단 후 재개 | Ctrl+C → --resume | 마지막 단계부터 재개 |

---

## 4. 테스트 데이터

### 4.1 테스트용 wbs.md

```markdown
# WBS - test-project

> version: 1.0
> depth: 3
> updated: 2025-12-15

---

## WP-01: Test
- status: in_progress
- priority: high

### TSK-TEST-01: Test Task (development)
- category: development
- status: [ ]
- priority: high

### TSK-TEST-02: Test Task (defect)
- category: defect
- status: [ ]
- priority: medium

### TSK-TEST-03: Test Task (infrastructure)
- category: infrastructure
- status: [ ]
- priority: low
```

### 4.2 Mock Claude CLI

테스트 시 실제 Claude 호출 대신 Mock 스크립트 사용:

```javascript
// tests/mocks/claude-mock.js
// 0번 종료 코드와 성공 메시지 출력
console.log("[wf:start] 기본설계 완료");
process.exit(0);
```

---

## 5. 커버리지 목표

| 모듈 | 목표 | 비고 |
|------|------|------|
| bin/jjiban.js | 80% | 진입점 |
| commands/workflow.js | 90% | 핵심 명령어 |
| core/WorkflowRunner.js | 90% | 핵심 로직 |
| core/ClaudeExecutor.js | 85% | spawn 제외 |
| core/StateManager.js | 95% | 상태 관리 |
| core/WbsReader.js | 90% | 파서 래퍼 |
| config/workflowSteps.js | 100% | 설정 |
| **전체** | **>= 80%** | - |

---

<!--
author: Claude
-->
