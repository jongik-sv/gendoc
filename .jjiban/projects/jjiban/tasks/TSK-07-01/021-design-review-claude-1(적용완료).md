# 설계 리뷰 (021-design-review-claude-1.md)

**Task ID:** TSK-07-01
**Task명:** Workflow Orchestrator CLI 구현
**리뷰어:** Claude (refactoring-expert)
**리뷰 일자:** 2025-12-15
**리뷰 대상:** 기본설계 (010), 상세설계 (020), 추적성 매트릭스 (025), 테스트 명세 (026)

---

## 0. 리뷰 요약

### 0.1 전체 평가

| 영역 | 평가 | 점수 |
|------|------|------|
| 요구사항 완전성 | 양호 | 85/100 |
| SOLID 원칙 준수 | 양호 | 80/100 |
| 아키텍처 적합성 | 우수 | 90/100 |
| 테스트 커버리지 | 양호 | 85/100 |
| 유지보수성 | 양호 | 82/100 |
| 보안 고려사항 | 보통 | 70/100 |
| **전체 평균** | **양호** | **82/100** |

### 0.2 권장 조치 우선순위

| 우선순위 | 이슈 개수 | 조치 필요 시점 |
|---------|----------|--------------|
| Critical (P0) | 3개 | 구현 전 필수 |
| High (P1) | 5개 | 구현 중 반영 |
| Medium (P2) | 7개 | 검토 권장 |
| Low (P3) | 4개 | 선택적 개선 |

---

## 1. 요구사항 완전성 분석

### 1.1 기능 요구사항 검증

#### 1.1.1 완전성 평가

| 항목 | 상태 | 비고 |
|------|------|------|
| FR-001 ~ FR-010 커버리지 | ✅ 100% | 모든 요구사항 설계에 반영 |
| 추적성 매트릭스 완성도 | ✅ 우수 | 요구사항→설계→테스트 명확 |
| 비기능 요구사항 | ⚠️ 부분적 | 성능, 확장성 명세 부족 |

#### 1.1.2 발견된 갭 (Gaps)

**[P1] GAP-001: 동시 실행 방지 메커니즘 미정의**
- **위치**: 상세설계 4.3 제약조건
- **문제**: "동시 실행 불가" 명시했으나 구현 방식 없음
- **영향**: 여러 터미널에서 동일 Task 실행 시 상태 파일 충돌 가능
- **권장사항**:
  - Lock 파일 메커니즘 추가 (`.jjiban/locks/{taskId}.lock`)
  - StateManager에 락 획득/해제 로직 추가
  - 락 파일에 PID, 시작 시간 기록
  ```javascript
  // 개념적 인터페이스
  LockManager.acquire(taskId) → throws if locked
  LockManager.release(taskId)
  LockManager.isLocked(taskId) → boolean
  ```

**[P2] GAP-002: 부분 재시도 (partial retry) 전략 없음**
- **위치**: 상세설계 11.1 오류 처리
- **문제**: 단계 실패 시 전체 재개만 가능, 특정 단계만 재실행 불가
- **영향**: 긴 워크플로우에서 중간 단계 실패 시 처음부터 재실행 비효율
- **권장사항**: `--retry-from <step>` 옵션 추가 검토

**[P3] GAP-003: 로깅 레벨 세분화 부족**
- **위치**: FR-010 (--verbose)
- **문제**: verbose on/off만 있고 중간 레벨 없음
- **권장사항**: `--log-level <debug|info|warn|error>` 검토

### 1.2 비기능 요구사항 검증

#### 1.2.1 성능 요구사항

**[P1] NFR-GAP-001: 대규모 wbs.md 파싱 성능 미고려**
- **위치**: NFR 섹션
- **문제**: wbs.md 크기가 클 경우 (100+ Tasks) 파싱 시간 고려 없음
- **영향**: CLI 시작 시간 지연
- **권장사항**:
  - 파싱 캐싱 전략 추가
  - 필요한 Task만 파싱하는 최적화
  - 성능 목표 명시 (예: 500 Tasks 기준 < 2초)

**[P2] NFR-GAP-002: 메모리 사용량 제한 없음**
- **문제**: Claude 출력을 메모리에 전체 저장 시 OOM 가능
- **권장사항**: 출력 스트리밍 및 요약만 저장 (전체는 파일로)

#### 1.2.2 확장성 요구사항

**[P2] NFR-GAP-003: 플러그인 확장성 미고려**
- **문제**: 향후 새로운 워크플로우 단계 추가 시 코드 변경 필요
- **권장사항**: 워크플로우 설정을 외부 파일로 분리 (.jjiban/settings/workflows.json 재사용)

---

## 2. SOLID 원칙 준수도 분석

### 2.1 Single Responsibility Principle (SRP)

#### 2.1.1 준수 사항

| 모듈 | 단일 책임 | 평가 |
|------|----------|------|
| ClaudeExecutor | Claude CLI 실행만 담당 | ✅ 우수 |
| StateManager | 상태 파일 I/O만 담당 | ✅ 우수 |
| WbsReader | WBS 파싱만 담당 | ✅ 우수 |

#### 2.1.2 위반 사항

**[P0] SRP-001: WorkflowRunner의 다중 책임**
- **위치**: cli/core/WorkflowRunner.js
- **문제**:
  1. 실행 계획 생성
  2. 단계별 실행 루프
  3. 상태 전이 관리
  4. 에러 처리
  5. 로깅
- **복잡도**: 예상 Cyclomatic Complexity > 15
- **영향**: 테스트 어려움, 변경 시 리스크 높음
- **권장사항**: 책임 분리
  ```
  WorkflowPlanner: 실행 계획 생성
  WorkflowExecutor: 단계별 실행
  WorkflowStateMachine: 상태 전이 관리
  WorkflowRunner: 위 3개 조율만
  ```

**[P1] SRP-002: bin/jjiban.js의 혼합 책임**
- **위치**: bin/jjiban.js
- **문제**: CLI 파싱 + 명령어 라우팅 + 에러 핸들링
- **권장사항**:
  - CLI 파싱: commander 설정만
  - 라우팅: commands/ 위임
  - 에러 핸들링: ErrorHandler 클래스 분리

### 2.2 Open/Closed Principle (OCP)

**[P1] OCP-001: 워크플로우 단계 추가 시 코드 변경 필요**
- **위치**: cli/config/workflowSteps.js
- **문제**: 하드코딩된 단계 정의, 새 카테고리 추가 시 코드 수정
- **권장사항**:
  - 설정 파일 기반으로 변경 (.jjiban/settings/workflows.json)
  - WorkflowStepProvider 인터페이스 도입
  ```javascript
  // 개념적 설계
  interface IWorkflowStepProvider {
    getSteps(category): Step[]
    getCommands(step): string
  }

  class FileBasedStepProvider implements IWorkflowStepProvider
  class HardcodedStepProvider implements IWorkflowStepProvider
  ```

**[P2] OCP-002: Claude 실행 방식 교체 불가**
- **위치**: ClaudeExecutor (spawn 하드코딩)
- **문제**: 향후 Claude API 사용 시 코드 전면 수정
- **권장사항**:
  ```javascript
  interface IClaudeRunner {
    execute(command): Promise<Result>
  }

  class SpawnClaudeRunner implements IClaudeRunner
  class ApiClaudeRunner implements IClaudeRunner (향후)
  ```

### 2.3 Liskov Substitution Principle (LSP)

**[평가]** 현재 설계에 상속 구조 없어 LSP 위반 사항 없음. 양호.

### 2.4 Interface Segregation Principle (ISP)

**[P2] ISP-001: StateManager 인터페이스 비대**
- **문제**: save/load/update/clear/exists 모두 포함
- **권장사항**: 읽기/쓰기 인터페이스 분리
  ```javascript
  IStateReader { load, exists }
  IStateWriter { save, update, clear }
  StateManager implements IStateReader, IStateWriter
  ```

### 2.5 Dependency Inversion Principle (DIP)

**[P0] DIP-001: WorkflowRunner가 구체 클래스에 의존**
- **위치**: WorkflowRunner → ClaudeExecutor, StateManager
- **문제**:
  - new ClaudeExecutor() 직접 생성
  - 테스트 시 모킹 어려움
  - 결합도 높음
- **영향**: 단위 테스트 작성 불가, E2E만 가능
- **권장사항**: 의존성 주입 (Dependency Injection)
  ```javascript
  // Before (예상 구조)
  class WorkflowRunner {
    constructor() {
      this.executor = new ClaudeExecutor()
      this.stateManager = new StateManager()
    }
  }

  // After (권장)
  class WorkflowRunner {
    constructor(executor, stateManager) {
      this.executor = executor
      this.stateManager = stateManager
    }
  }

  // 사용
  const runner = new WorkflowRunner(
    new ClaudeExecutor(),
    new StateManager()
  )
  ```

**[P1] DIP-002: 파일 시스템 직접 의존**
- **위치**: StateManager, WbsReader
- **문제**: fs 모듈 직접 사용, 테스트 시 실제 파일 필요
- **권장사항**: FileSystem 추상화 계층
  ```javascript
  interface IFileSystem {
    readFile(path): Promise<string>
    writeFile(path, content): Promise<void>
  }

  class NodeFileSystem implements IFileSystem
  class InMemoryFileSystem implements IFileSystem (테스트용)
  ```

---

## 3. 아키텍처 적합성 분석

### 3.1 아키텍처 패턴

**[평가]** Command Pattern + Orchestrator Pattern 적절히 사용. 우수.

| 패턴 | 적용 위치 | 적합성 |
|------|----------|--------|
| Command Pattern | workflow 명령어 | ✅ 적절 |
| Orchestrator | WorkflowRunner | ✅ 적절 |
| Repository | StateManager | ✅ 적절 |

### 3.2 계층 분리

```
┌─────────────────────┐
│   bin (진입점)      │ ✅ 명확
├─────────────────────┤
│   commands (CLI)    │ ✅ 명확
├─────────────────────┤
│   core (비즈니스)   │ ⚠️ Runner 비대
├─────────────────────┤
│   config (설정)     │ ✅ 명확
├─────────────────────┤
│   utils (공통)      │ ✅ 명확
└─────────────────────┘
```

**[P1] ARCH-001: 비즈니스 로직 계층 세분화 필요**
- **문제**: core/ 에 모든 로직 혼재
- **권장사항**:
  ```
  core/
  ├── domain/          (도메인 모델)
  │   ├── WorkflowState.js
  │   └── StepResult.js
  ├── services/        (비즈니스 로직)
  │   ├── WorkflowPlanner.js
  │   ├── WorkflowExecutor.js
  │   └── WorkflowStateMachine.js
  └── infrastructure/  (외부 의존성)
      ├── ClaudeExecutor.js
      ├── StateRepository.js
      └── WbsRepository.js
  ```

### 3.3 에러 처리 아키텍처

**[P1] ARCH-002: 에러 계층 구조 없음**
- **위치**: 상세설계 11.1
- **문제**: 문자열 에러 코드만, Error 클래스 계층 없음
- **권장사항**: 커스텀 에러 클래스
  ```javascript
  class JjibanError extends Error {
    constructor(code, message, details)
  }

  class TaskNotFoundError extends JjibanError
  class ClaudeExecutionError extends JjibanError
  class StateCorruptedError extends JjibanError
  ```

### 3.4 모듈 응집도

**[평가]** 대부분 모듈이 높은 응집도 유지. logger.js만 분리 검토 필요.

**[P3] ARCH-003: logger.js 위치 부적절**
- **현재**: cli/utils/logger.js
- **문제**: CLI 전용이 아닌 공통 유틸리티
- **권장사항**: utils/logger.js 또는 shared/logger.js

---

## 4. 테스트 커버리지 분석

### 4.1 테스트 설계 품질

| 항목 | 평가 | 점수 |
|------|------|------|
| 테스트 케이스 완전성 | ✅ 양호 | 85% |
| 경계값 테스트 | ⚠️ 부족 | 60% |
| 에러 시나리오 | ✅ 양호 | 80% |
| E2E 시나리오 | ⚠️ 단순 | 70% |

### 4.2 누락된 테스트 케이스

**[P1] TEST-001: 경계값 테스트 부족**
- **위치**: 026-test-specification.md
- **누락 케이스**:
  - Task ID 형식 에지 케이스 (TSK-0-0, TSK-99-99-99)
  - 빈 wbs.md
  - 손상된 JSON 상태 파일
  - 매우 큰 출력 (> 1MB)
  - 타임아웃 경계값 (29분 59초)

**[P1] TEST-002: 동시성 테스트 없음**
- **누락 케이스**:
  - 동일 Task 2개 터미널 동시 실행
  - 상태 파일 쓰기 중 읽기
  - Lock 파일 경쟁 조건

**[P2] TEST-003: 복구 시나리오 테스트 부족**
- **누락 케이스**:
  - 비정상 종료 후 lock 파일 남음
  - 상태 파일 부분 쓰기 (파일 시스템 에러)
  - wbs.md 변경 후 --resume

**[P2] TEST-004: E2E 시나리오 확장 필요**
- **현재**: 1개 시나리오만
- **추가 필요**:
  - 전체 development 워크플로우 (start → done)
  - defect 워크플로우
  - infrastructure 워크플로우
  - 중단/재개 3회 반복

### 4.3 테스트 가능성 (Testability)

**[P0] TEST-005: 구체 클래스 의존으로 모킹 불가**
- **위치**: WorkflowRunner
- **문제**: DIP-001과 동일 원인
- **영향**: 단위 테스트 시 실제 ClaudeExecutor 호출 필요
- **권장사항**: 의존성 주입으로 해결 (DIP-001 참조)

**[P1] TEST-006: 시간 의존성 테스트 어려움**
- **위치**: StepResult의 duration, timestamp
- **문제**: Date.now() 직접 사용 예상
- **권장사항**: TimeProvider 주입
  ```javascript
  interface ITimeProvider {
    now(): number
  }

  class SystemTimeProvider implements ITimeProvider
  class FixedTimeProvider implements ITimeProvider (테스트용)
  ```

### 4.4 커버리지 목표 검증

| 모듈 | 목표 | 평가 |
|------|------|------|
| 전체 평균 | >= 80% | ✅ 달성 가능 |
| 핵심 로직 | >= 90% | ⚠️ WorkflowRunner 어려움 (DIP 위반) |

---

## 5. 유지보수성 분석

### 5.1 복잡도 예측

**[P0] MAINT-001: WorkflowRunner 복잡도 높음**
- **예상 복잡도**: Cyclomatic Complexity > 20
- **근거**:
  - 3가지 카테고리별 분기
  - 상태 전이 로직
  - 에러 처리 분기
  - 옵션별 분기 (until, dryRun, resume)
- **영향**: 버그 발생 가능성 높음, 변경 시 회귀 테스트 필수
- **권장사항**: SRP-001 개선으로 복잡도 분산

**복잡도 개선 예상:**
```
Before: WorkflowRunner (CC: 20+)
After:
  - WorkflowPlanner (CC: 5)
  - WorkflowExecutor (CC: 8)
  - WorkflowStateMachine (CC: 7)
  - WorkflowRunner (CC: 4)
```

### 5.2 코드 중복 가능성

**[P2] MAINT-002: 카테고리별 로직 중복 예상**
- **위치**: WorkflowRunner의 카테고리별 처리
- **문제**: development/defect/infrastructure 각각 if-else 분기
- **권장사항**: Strategy Pattern
  ```javascript
  interface IWorkflowStrategy {
    getSteps(currentStatus, target): Step[]
  }

  class DevelopmentWorkflowStrategy implements IWorkflowStrategy
  class DefectWorkflowStrategy implements IWorkflowStrategy
  class InfraWorkflowStrategy implements IWorkflowStrategy
  ```

### 5.3 변경 영향도

**[P1] MAINT-003: 워크플로우 변경 시 다중 파일 수정**
- **현재 영향도**:
  - workflowSteps.js (단계 정의)
  - WorkflowRunner (실행 로직)
  - 테스트 코드 (UT-004)
- **권장사항**: 설정 기반으로 변경 (OCP-001 참조)

### 5.4 문서화 수준

**[평가]** 설계 문서 우수, 코드 레벨 문서화 계획 필요

**[P2] MAINT-004: JSDoc 표준 미정의**
- **권장사항**:
  - 모든 public 함수에 JSDoc 필수
  - 파라미터, 반환값, 예외 명시
  - 예시:
    ```javascript
    /**
     * 워크플로우 실행
     * @param {string} taskId - Task ID (TSK-XX-XX-XX)
     * @param {Object} options - 실행 옵션
     * @param {string} [options.until] - 목표 단계
     * @param {boolean} [options.dryRun=false] - dry-run 모드
     * @returns {Promise<WorkflowResult>}
     * @throws {TaskNotFoundError} Task가 없을 때
     */
    async execute(taskId, options) { ... }
    ```

---

## 6. 보안 고려사항 분석

### 6.1 입력 검증

**[P0] SEC-001: Task ID 인젝션 취약점**
- **위치**: CLI 인자 파싱 → Claude 명령어 생성
- **문제**: Task ID 검증 없이 `/wf:start {taskId}` 생성
- **시나리오**:
  ```bash
  jjiban workflow "TSK-01; rm -rf /"
  → claude -p "/wf:start TSK-01; rm -rf /"
  ```
- **영향**: 명령어 인젝션 가능
- **권장사항**:
  - Task ID 정규식 검증 (^TSK-\d{2}(-\d{2}){1,2}$)
  - WbsReader에서 존재 확인 후에만 실행
  - spawn 인자 배열 사용 (문자열 연결 금지)
  ```javascript
  // Bad
  spawn("claude", ["-p", `/wf:start ${taskId}`])

  // Good
  const validTaskId = validateTaskId(taskId) // throw if invalid
  spawn("claude", ["-p", `/wf:start ${validTaskId}`])
  ```

**[P1] SEC-002: 경로 순회 (Path Traversal) 취약점**
- **위치**: StateManager, WbsReader (파일 경로 생성)
- **문제**: taskId 기반 파일 경로 생성 시 검증 없음
- **시나리오**:
  ```bash
  jjiban workflow "../../../etc/passwd"
  → .jjiban/projects/../../../etc/passwd/workflow-state.json
  ```
- **권장사항**:
  - path.join 사용
  - 최종 경로가 .jjiban/ 내부인지 검증
  ```javascript
  const statePath = path.join(baseDir, taskId, "workflow-state.json")
  if (!statePath.startsWith(path.resolve(baseDir))) {
    throw new SecurityError("Invalid path")
  }
  ```

### 6.2 프로세스 보안

**[P1] SEC-003: Claude CLI 권한 미제한**
- **위치**: ClaudeExecutor
- **문제**: Claude 프로세스가 부모 프로세스 권한 상속
- **권장사항**:
  - spawn 옵션에 uid/gid 설정 (Linux)
  - 환경변수 화이트리스트 전달
  ```javascript
  spawn("claude", args, {
    env: { HOME: process.env.HOME, PATH: process.env.PATH }, // 최소한만
    uid: ..., // 가능하면 낮은 권한
  })
  ```

**[P2] SEC-004: 상태 파일 권한 미설정**
- **위치**: StateManager
- **문제**: workflow-state.json에 민감 정보 포함 가능 (에러 메시지 등)
- **권장사항**:
  - 파일 생성 시 600 권한 설정
  ```javascript
  await fs.writeFile(path, data, { mode: 0o600 })
  ```

### 6.3 데이터 보안

**[P2] SEC-005: Claude 출력 로그에 민감 정보 포함 가능**
- **위치**: StepResult.output
- **문제**: API 키, 비밀번호 등이 로그에 기록될 수 있음
- **권장사항**:
  - 출력 필터링 (정규식으로 민감 패턴 제거)
  - 또는 출력 저장 제한 (첫 1000자만)

### 6.4 서비스 거부 (DoS)

**[P3] SEC-006: 타임아웃 없는 무한 대기 가능**
- **위치**: ClaudeExecutor
- **문제**: Claude 프로세스가 응답 없을 때
- **권장사항**: 단계당 30분 타임아웃 (NFR-004) 엄격히 적용

---

## 7. 품질 메트릭 측정

### 7.1 설계 품질 지표

| 메트릭 | 목표 | 예상값 | 평가 |
|--------|------|--------|------|
| 순환 복잡도 (평균) | < 10 | 12 | ⚠️ 개선 필요 |
| 클래스 결합도 (CBO) | < 5 | 6 | ⚠️ 개선 필요 |
| 응집도 (LCOM) | < 0.5 | 0.4 | ✅ 양호 |
| 추상화 레벨 | 중간 | 낮음 | ⚠️ 인터페이스 부족 |

### 7.2 코드 중복도 예측

**[예상]** 카테고리별 로직에서 20-30% 중복 발생 가능 (MAINT-002)

### 7.3 기술 부채 예상

**Technical Debt Ratio (TDR)**:
- 현재 설계: 약 15%
- 권장사항 반영 후: 약 5%

---

## 8. 이슈 요약 및 우선순위

### 8.1 Critical (P0) - 구현 전 필수 해결

| ID | 제목 | 영향 | 조치 |
|----|------|------|------|
| DIP-001 | WorkflowRunner 구체 클래스 의존 | 테스트 불가 | 의존성 주입 도입 |
| SRP-001 | WorkflowRunner 다중 책임 | 복잡도 높음 | 책임 분리 (Planner/Executor/StateMachine) |
| SEC-001 | Task ID 인젝션 취약점 | 보안 위험 | 입력 검증 추가 |

### 8.2 High (P1) - 구현 중 반영

| ID | 제목 | 영향 | 조치 |
|----|------|------|------|
| GAP-001 | 동시 실행 방지 메커니즘 | 데이터 무결성 | Lock 파일 추가 |
| NFR-GAP-001 | wbs.md 파싱 성능 | 사용자 경험 | 캐싱 전략 |
| OCP-001 | 워크플로우 단계 하드코딩 | 확장성 | 설정 파일 기반으로 변경 |
| TEST-001 | 경계값 테스트 부족 | 품질 | 테스트 케이스 추가 |
| SEC-002 | 경로 순회 취약점 | 보안 위험 | 경로 검증 추가 |

### 8.3 Medium (P2) - 검토 권장

| ID | 제목 | 조치 |
|----|------|------|
| GAP-002 | 부분 재시도 전략 없음 | `--retry-from` 옵션 검토 |
| OCP-002 | Claude 실행 방식 교체 불가 | IClaudeRunner 인터페이스 |
| ISP-001 | StateManager 인터페이스 비대 | 읽기/쓰기 분리 |
| MAINT-002 | 카테고리별 로직 중복 | Strategy Pattern 적용 |
| TEST-003 | 복구 시나리오 테스트 부족 | 테스트 케이스 추가 |
| SEC-004 | 상태 파일 권한 미설정 | 파일 권한 600 |
| SEC-005 | 출력 로그 민감 정보 | 필터링 또는 제한 |

### 8.4 Low (P3) - 선택적 개선

| ID | 제목 | 조치 |
|----|------|------|
| GAP-003 | 로깅 레벨 세분화 부족 | `--log-level` 옵션 |
| ARCH-003 | logger.js 위치 부적절 | 공통 utils로 이동 |
| MAINT-004 | JSDoc 표준 미정의 | 문서화 가이드 작성 |
| SEC-006 | DoS 가능성 | 타임아웃 엄격 적용 |

---

## 9. 개선 권장사항 상세

### 9.1 아키텍처 개선안

#### 9.1.1 핵심 변경 사항

**현재 구조:**
```
WorkflowRunner (God Object)
├─ 실행 계획 생성
├─ 단계별 실행
├─ 상태 전이
├─ 에러 처리
└─ 로깅
```

**권장 구조:**
```
WorkflowRunner (Orchestrator만)
├─ WorkflowPlanner (계획 생성)
├─ WorkflowExecutor (실행)
├─ WorkflowStateMachine (상태 전이)
└─ ErrorHandler (에러 처리)
```

#### 9.1.2 의존성 주입 패턴

```javascript
// cli/core/WorkflowRunner.js (개념적 설계)
class WorkflowRunner {
  constructor({
    planner,      // IWorkflowPlanner
    executor,     // IWorkflowExecutor
    stateMachine, // IStateMachine
    stateRepo,    // IStateRepository
    wbsRepo,      // IWbsRepository
    logger        // ILogger
  }) {
    this.planner = planner
    this.executor = executor
    this.stateMachine = stateMachine
    this.stateRepo = stateRepo
    this.wbsRepo = wbsRepo
    this.logger = logger
  }

  async execute(taskId, options) {
    const task = await this.wbsRepo.getTask(taskId)
    const plan = this.planner.createPlan(task, options)

    for (const step of plan.steps) {
      const result = await this.executor.executeStep(step)
      await this.stateMachine.transition(step, result)
      await this.stateRepo.save(this.stateMachine.getState())
    }
  }
}
```

#### 9.1.3 인터페이스 정의

```javascript
// cli/interfaces/IWorkflowPlanner.js
export interface IWorkflowPlanner {
  createPlan(task, options): WorkflowPlan
}

// cli/interfaces/IWorkflowExecutor.js
export interface IWorkflowExecutor {
  executeStep(step): Promise<StepResult>
}

// cli/interfaces/IStateMachine.js
export interface IStateMachine {
  transition(step, result): void
  getState(): WorkflowState
}

// cli/interfaces/IStateRepository.js
export interface IStateRepository {
  save(state): Promise<void>
  load(taskId): Promise<WorkflowState | null>
}

// cli/interfaces/IWbsRepository.js
export interface IWbsRepository {
  getTask(taskId): Promise<Task>
}
```

### 9.2 보안 강화 체크리스트

- [ ] Task ID 정규식 검증 (^TSK-\d{2}(-\d{2}){1,2}$)
- [ ] 경로 순회 방지 (path.resolve + startsWith 검증)
- [ ] spawn 인자 배열 사용 (문자열 연결 금지)
- [ ] 환경변수 화이트리스트
- [ ] 파일 권한 600 (상태 파일)
- [ ] 출력 크기 제한 (1MB)
- [ ] 타임아웃 엄격 적용 (30분)
- [ ] Lock 파일로 동시 실행 방지

### 9.3 테스트 강화 체크리스트

- [ ] 경계값 테스트 추가 (TEST-001)
- [ ] 동시성 테스트 추가 (TEST-002)
- [ ] 복구 시나리오 테스트 추가 (TEST-003)
- [ ] E2E 시나리오 확장 (TEST-004)
- [ ] Mock 주입 구조 (DIP-001 해결 후)
- [ ] 시간 의존성 격리 (TimeProvider 주입)
- [ ] 파일 시스템 Mock (IFileSystem 주입)

---

## 10. 결론 및 최종 권고

### 10.1 전체 평가

**강점:**
- 명확한 요구사항 추적 (요구사항 → 설계 → 테스트)
- 적절한 아키텍처 패턴 선택 (Orchestrator, Repository)
- 우수한 문서화 수준
- 테스트 전략 수립

**약점:**
- SOLID 원칙 일부 위반 (DIP, SRP)
- 보안 고려사항 부족
- 테스트 가능성 낮음 (의존성 주입 부재)
- 복잡도 관리 필요 (WorkflowRunner)

### 10.2 구현 전 필수 조치 (P0)

1. **WorkflowRunner 리팩토링 설계** (SRP-001, DIP-001)
   - Planner/Executor/StateMachine 분리
   - 의존성 주입 패턴 도입
   - 예상 작업량: 상세설계 2-3일 추가

2. **보안 검증 로직 설계** (SEC-001, SEC-002)
   - Task ID 검증 함수
   - 경로 검증 함수
   - 예상 작업량: 1일

3. **테스트 가능성 확보** (DIP-001 해결로 자동 해결)

### 10.3 구현 중 반영 권고 (P1)

1. Lock 파일 메커니즘 추가
2. wbs.md 파싱 캐싱
3. 워크플로우 설정 외부화
4. 경계값/동시성 테스트 추가

### 10.4 다음 단계

**즉시 조치:**
1. 본 리뷰 내용 검토
2. P0 이슈 해결 방안 확정
3. 상세설계 문서 업데이트 (021-design-review-claude-1-applied.md)

**구현 전:**
1. P0, P1 이슈 반영
2. 업데이트된 설계 재검토
3. 구현 착수

**구현 중:**
1. P2 이슈 선별 반영
2. 코드 리뷰 시 SOLID 원칙 재확인
3. 보안 체크리스트 검증

### 10.5 최종 권고

**승인 조건부 통과**

본 설계는 전반적으로 우수하나, **P0 이슈 3건을 구현 전 반드시 해결**해야 합니다. 특히 WorkflowRunner의 책임 분리와 의존성 주입 도입은 테스트 가능성과 유지보수성에 직접적인 영향을 미치므로 필수입니다.

P0 이슈 해결 후 재검토를 권장하며, 해결 확인 시 구현 진행을 승인합니다.

---

## 부록

### A. 참조 표준

- SOLID 원칙: Robert C. Martin, "Clean Architecture"
- 복잡도 메트릭: McCabe's Cyclomatic Complexity
- 보안 가이드: OWASP Top 10 for CLI Applications

### B. 측정 도구 권장

- 복잡도: `eslint-plugin-complexity`
- 커버리지: `vitest --coverage`
- 보안 스캔: `npm audit`, `snyk`

---

<!--
Reviewer: Claude (refactoring-expert)
Review Date: 2025-12-15
Review Duration: Comprehensive analysis
-->
