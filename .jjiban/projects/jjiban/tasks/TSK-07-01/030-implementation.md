# 구현 문서 (030-implementation.md)

**Task ID:** TSK-07-01
**Task명:** Workflow Orchestrator CLI 구현
**작성일:** 2025-12-15

---

## 1. 구현 요약

### 1.1 구현 범위

jjiban 워크플로우를 터미널에서 독립적으로 실행할 수 있는 Node.js CLI 도구를 구현했습니다.

### 1.2 구현 파일 목록

```
jjiban/
├── bin/
│   └── jjiban.js              # CLI 진입점
├── cli/
│   ├── commands/
│   │   └── workflow.js        # workflow 명령어 핸들러
│   ├── core/
│   │   ├── WorkflowRunner.js  # 오케스트레이터
│   │   ├── WorkflowPlanner.js # 실행 계획 생성
│   │   ├── ClaudeExecutor.js  # Claude CLI 실행기
│   │   ├── StateManager.js    # 상태 파일 관리
│   │   ├── WbsReader.js       # WBS 파서 래퍼
│   │   └── LockManager.js     # 동시 실행 방지
│   ├── validation/
│   │   ├── TaskIdValidator.js # Task ID 검증
│   │   └── PathValidator.js   # 경로 검증
│   ├── errors/
│   │   └── JjibanError.js     # 에러 클래스들
│   └── config/
│       └── workflowSteps.js   # 카테고리별 단계 정의
└── tests/unit/cli/            # 단위 테스트
```

---

## 2. 주요 구현 내용

### 2.1 CLI 진입점 (bin/jjiban.js)

- Commander.js로 CLI 파싱
- `workflow` 명령어 등록
- 옵션: `--until`, `--dry-run`, `--resume`, `--verbose`, `--project`

### 2.2 워크플로우 러너 (WorkflowRunner.js)

- **의존성 주입 패턴** 적용 (DIP-001 해결)
- 조율 역할만 담당 (SRP-001 해결)
- Planner, Executor, StateManager 위임

### 2.3 워크플로우 플래너 (WorkflowPlanner.js)

- 현재 상태 → 목표 단계까지 실행 계획 생성
- 카테고리별 단계 매핑 활용
- 재개(resume) 계획 생성 지원

### 2.4 Claude 실행기 (ClaudeExecutor.js)

- `spawn`으로 `claude -p` 호출 (**SEC-001 보안**)
- 타임아웃 30분 설정
- 출력 캡처 및 크기 제한

### 2.5 상태 관리자 (StateManager.js)

- `workflow-state-{taskId}.json` 파일 저장/로드
- 단계 완료 기록
- 에러 시 자동 저장

### 2.6 락 관리자 (LockManager.js)

- `.jjiban/locks/{taskId}.lock` 파일로 동시 실행 방지
- 프로세스 생존 확인
- 비정상 종료 시 락 자동 해제

### 2.7 보안 검증 (SEC-001, SEC-002)

- **Task ID 검증**: 정규식 `^TSK-\d{2}(-\d{2}){1,2}$`
- **경로 검증**: `.jjiban/` 내부만 허용
- **spawn 인자 배열**: 문자열 연결 금지

---

## 3. 테스트 결과

### 3.1 단위 테스트

```
✓ tests/unit/cli/validation/TaskIdValidator.test.ts (11 tests)
✓ tests/unit/cli/core/WorkflowPlanner.test.ts (11 tests)
✓ tests/unit/cli/config/workflowSteps.test.ts (18 tests)

Test Files: 3 passed (3)
Tests: 40 passed (40)
```

### 3.2 CLI 테스트

```bash
# 도움말
$ node bin/jjiban.js --help
✓ 정상 출력

# dry-run 모드
$ node bin/jjiban.js workflow TSK-07-01 --dry-run
✓ 실행 계획 출력

# Task ID 검증
$ node bin/jjiban.js workflow "invalid; rm -rf /"
✓ ValidationError 발생
```

---

## 4. 설계 리뷰 반영 사항

### 4.1 P0 이슈 해결

| ID | 이슈 | 해결 방법 |
|----|------|----------|
| DIP-001 | WorkflowRunner 구체 클래스 의존 | 의존성 주입 패턴 적용 |
| SRP-001 | WorkflowRunner 다중 책임 | Planner/Executor/StateMachine 분리 |
| SEC-001 | Task ID 인젝션 취약점 | TaskIdValidator 구현 |

### 4.2 P1 이슈 해결

| ID | 이슈 | 해결 방법 |
|----|------|----------|
| GAP-001 | 동시 실행 방지 | LockManager 구현 |
| SEC-002 | 경로 순회 취약점 | PathValidator 구현 |

---

## 5. 의존성

### 5.1 추가된 npm 패키지

```json
{
  "commander": "^14.0.2"
}
```

### 5.2 package.json 변경

```json
{
  "bin": {
    "jjiban": "./bin/jjiban.js"
  }
}
```

---

## 6. 사용 방법

```bash
# 전체 워크플로우 실행
npx jjiban workflow TSK-07-01

# 특정 단계까지만 실행
npx jjiban workflow TSK-07-01 --until build

# 실행 계획 확인
npx jjiban workflow TSK-07-01 --dry-run

# 중단된 워크플로우 재개
npx jjiban workflow TSK-07-01 --resume

# 상세 로그 출력
npx jjiban workflow TSK-07-01 --verbose
```

---

<!--
author: Claude
-->
