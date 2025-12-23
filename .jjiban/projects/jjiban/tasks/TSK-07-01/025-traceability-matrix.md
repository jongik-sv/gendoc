# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Task ID:** TSK-07-01
**Task명:** Workflow Orchestrator CLI 구현
**작성일:** 2025-12-15

---

## 1. 요구사항 → 설계 추적

| 요구사항 ID | 요구사항 설명 | 설계 섹션 | 구현 모듈 |
|-------------|--------------|----------|----------|
| FR-001 | CLI 진입점 생성 | 5.1, 5.2 | bin/jjiban.js |
| FR-002 | workflow 명령어 구현 | 7.1, 7.2 | cli/commands/workflow.js |
| FR-003 | wbs.md 파싱하여 Task 조회 | 5.1 | cli/core/WbsReader.js |
| FR-004 | 카테고리별 단계 매핑 | 9.1, 9.2, 9.3 | cli/config/workflowSteps.js |
| FR-005 | Claude CLI 실행기 | 5.1, 8.2 | cli/core/ClaudeExecutor.js |
| FR-006 | 상태 파일 저장/로드 | 6.1, 6.2 | cli/core/StateManager.js |
| FR-007 | --until 옵션 | 7.2, 9.3 | WorkflowRunner |
| FR-008 | --dry-run 옵션 | 7.2 | WorkflowRunner |
| FR-009 | --resume 옵션 | 7.2, 8.1 | WorkflowRunner |
| FR-010 | --verbose 옵션 | 7.2 | logger.js |

---

## 2. 설계 → 테스트 추적

| 설계 항목 | 테스트 ID | 테스트 유형 | 테스트 설명 |
|----------|----------|------------|------------|
| bin/jjiban.js | UT-001 | Unit | CLI 진입점 실행 확인 |
| workflow 명령어 | UT-002 | Unit | 명령어 파싱 정확성 |
| WbsReader | UT-003 | Unit | Task 정보 조회 |
| workflowSteps | UT-004 | Unit | 카테고리별 단계 매핑 |
| ClaudeExecutor | UT-005 | Unit | spawn 호출 및 출력 캡처 |
| StateManager | UT-006 | Unit | 상태 저장/로드 |
| WorkflowRunner | UT-007 | Unit | 단계별 실행 루프 |
| --until 옵션 | UT-008 | Unit | 목표 단계까지만 실행 |
| --dry-run 옵션 | UT-009 | Unit | 실행 계획만 출력 |
| --resume 옵션 | UT-010 | Unit | 중단된 워크플로우 재개 |
| 전체 워크플로우 | E2E-001 | E2E | 전체 실행 시나리오 |

---

## 3. 비즈니스 규칙 → 구현 추적

| 규칙 ID | 규칙 설명 | 구현 위치 | 테스트 ID |
|---------|----------|----------|----------|
| BR-001 | 유효한 Task ID만 허용 | WbsReader.getTask() | UT-003 |
| BR-002 | 카테고리별 단계 순서 보장 | workflowSteps.js | UT-004 |
| BR-003 | 중단 시 상태 자동 저장 | StateManager + SIGINT | UT-011 |
| BR-004 | --resume 시 마지막 완료 단계부터 재개 | WorkflowRunner.resume() | UT-010 |
| BR-005 | Claude CLI 타임아웃 | ClaudeExecutor.run() | UT-012 |

---

## 4. 비기능 요구사항 추적

| NFR ID | 요구사항 | 검증 방법 | 합격 기준 |
|--------|---------|----------|----------|
| NFR-001 | Node.js 20.x 호환 | package.json engines | engines: ">=20.0.0" |
| NFR-002 | ESM 모듈 지원 | 실행 테스트 | type: "module" |
| NFR-003 | 테스트 커버리지 | vitest coverage | >= 80% |
| NFR-004 | 타임아웃 | ClaudeExecutor | 30분 |
| NFR-005 | 에러 시 상태 저장 | E2E 테스트 | 자동 저장 확인 |

---

## 5. 인수 기준 추적

| AC ID | 인수 기준 | 테스트 ID | 검증 방법 |
|-------|----------|----------|----------|
| AC-01 | npx jjiban workflow 실행 | E2E-001 | 명령어 실행 확인 |
| AC-02 | --until build 옵션 동작 | UT-008 | 빌드 단계까지만 실행 |
| AC-03 | --dry-run 옵션 동작 | UT-009 | 계획만 출력 |
| AC-04 | --resume 옵션 동작 | UT-010 | 재개 확인 |
| AC-05 | 상태 저장 | UT-006 | workflow-state.json 생성 |
| AC-06 | development 순서 | UT-004 | 순서 검증 |
| AC-07 | 에러 시 상태 저장 | UT-011 | 에러 후 상태 파일 확인 |
| AC-08 | wbs.md 파싱 | UT-003 | Task 정보 정확성 |

---

<!--
author: Claude
-->
