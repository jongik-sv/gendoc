# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-07-01 |
| Task명 | Workflow Orchestrator CLI 구현 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 13 (CLI Tools) |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-07-01 |

---

## 1. 목적 및 범위

### 1.1 목적

jjiban 워크플로우를 터미널에서 독립적으로 실행할 수 있는 CLI 도구 개발. 이 CLI는 다음 문제를 해결합니다:

1. **자동화된 워크플로우 실행**: Claude Code의 `/wf:*` 명령어를 외부에서 자동 실행
2. **단계별 Claude 세션 분리**: 각 워크플로우 단계마다 새로운 Claude 세션으로 컨텍스트 격리
3. **상태 지속성**: 워크플로우 진행 상태를 파일로 저장하여 중단/재개 지원
4. **wbs.md 연동**: 기존 WBS 파서를 재사용하여 Task 정보 조회

### 1.2 범위

**포함 범위**:
- Node.js 기반 CLI 진입점 (`bin/jjiban.js`)
- `workflow` 명령어 구현 (`jjiban workflow TSK-XX`)
- 워크플로우 러너 (각 단계마다 새 Claude 세션 호출)
- 상태 관리자 (`workflow-state.json` 저장/로드)
- wbs.md 파서 연동 (기존 `server/utils/wbs/parser` 재사용)
- Claude CLI 실행기 (`spawn`으로 `claude -p` 호출)
- 옵션 지원: `--until`, `--dry-run`, `--resume`, `--verbose`
- `package.json` bin 설정 및 `commander` 의존성 추가

**제외 범위**:
- 웹 UI 연동 → TSK-06-01 (Integration)
- 새로운 워크플로우 규칙 정의 → TSK-03-04 (Workflow Engine)
- Task 생성/삭제 기능 → TSK-03-02 (WBS API)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | CLI 진입점 생성 (`bin/jjiban.js`) | High | 섹션 13 |
| FR-002 | `workflow` 명령어 구현 | High | 섹션 13 |
| FR-003 | wbs.md 파싱하여 Task 정보 조회 | High | 섹션 7.2 |
| FR-004 | 카테고리별 워크플로우 단계 매핑 | High | 섹션 5.2 |
| FR-005 | Claude CLI 실행기 (`claude -p` 호출) | High | 섹션 13 |
| FR-006 | 상태 파일 저장/로드 (`workflow-state.json`) | Medium | 섹션 13 |
| FR-007 | `--until` 옵션으로 특정 단계까지만 실행 | Medium | 섹션 13 |
| FR-008 | `--dry-run` 옵션으로 실행 계획만 출력 | Medium | 섹션 13 |
| FR-009 | `--resume` 옵션으로 중단된 워크플로우 재개 | Medium | 섹션 13 |
| FR-010 | `--verbose` 옵션으로 상세 로그 출력 | Low | 섹션 13 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | Node.js 20.x 호환성 | Node 20 LTS |
| NFR-002 | ESM 모듈 지원 | `"type": "module"` |
| NFR-003 | 단위 테스트 커버리지 | >= 80% |
| NFR-004 | Claude CLI 타임아웃 | 단계당 최대 30분 |
| NFR-005 | 에러 발생 시 상태 자동 저장 | workflow-state.json |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                      jjiban CLI (bin/jjiban.js)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │  Commander.js   │──▶│ WorkflowRunner   │──▶│ ClaudeExecutor│
│  │  (CLI Parser)   │   │ (Orchestrator)   │   │ (spawn)      │ │
│  └─────────────────┘   └────────┬─────────┘   └──────────────┘ │
│                                 │                              │
│                        ┌────────▼─────────┐                    │
│                        │  StateManager    │                    │
│                        │ (JSON 파일 I/O)  │                    │
│                        └────────┬─────────┘                    │
│                                 │                              │
│                        ┌────────▼─────────┐                    │
│                        │  WbsParser       │                    │
│                        │ (기존 재사용)    │                    │
│                        └──────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| `bin/jjiban.js` | CLI 진입점 | 명령어 파싱, 옵션 처리 |
| `WorkflowRunner` | 워크플로우 오케스트레이터 | 단계별 실행 루프, 상태 전이 관리 |
| `ClaudeExecutor` | Claude CLI 실행기 | `spawn`으로 `claude -p` 호출, 출력 캡처 |
| `StateManager` | 상태 관리자 | `workflow-state.json` 저장/로드 |
| `WbsParser` | WBS 파서 | 기존 `server/utils/wbs/parser` 재사용 |
| `WorkflowConfig` | 워크플로우 설정 | 카테고리별 단계 매핑 정보 |

### 3.3 데이터 흐름

```
1. 사용자 입력
   jjiban workflow TSK-07-01 --until build

2. CLI 파싱 (Commander.js)
   → taskId: "TSK-07-01"
   → options: { until: "build", dryRun: false, resume: false, verbose: false }

3. Task 정보 조회 (WbsParser)
   → wbs.md 파싱 → Task 노드 찾기 → category, status 확인

4. 워크플로우 계획 생성 (WorkflowRunner)
   → 현재 상태 → target 단계까지 필요한 명령어 목록 생성

5. 단계별 실행 (ClaudeExecutor)
   → 각 명령어마다: claude -p "/wf:start TSK-07-01" 실행
   → 완료 후 상태 저장

6. 결과 출력
   → 성공/실패 요약, 최종 상태 표시
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| CLI 프레임워크 | commander, yargs, oclif | commander | 가볍고 Nuxt 프로젝트와 호환성 좋음 |
| 프로세스 실행 | exec, spawn, execa | spawn | 스트리밍 출력 지원, 내장 모듈 |
| 상태 저장 형식 | JSON, YAML, SQLite | JSON | 단순성, 기존 유틸리티 재사용 |
| WBS 파서 | 새로 구현, 기존 재사용 | 기존 재사용 | 코드 중복 방지, 일관성 유지 |
| 모듈 시스템 | CommonJS, ESM | ESM | package.json의 `"type": "module"` 유지 |

---

## 5. 인수 기준

- [ ] AC-01: `npx jjiban workflow TSK-07-01` 실행 시 워크플로우가 시작된다
- [ ] AC-02: `--until build` 옵션 사용 시 구현 단계까지만 실행된다
- [ ] AC-03: `--dry-run` 옵션 사용 시 실행 계획만 출력되고 실제 실행되지 않는다
- [ ] AC-04: 중단 후 `--resume` 옵션으로 이어서 실행할 수 있다
- [ ] AC-05: 각 단계 완료 시 `workflow-state.json`에 상태가 저장된다
- [ ] AC-06: development 카테고리 Task는 start → draft → build → verify → done 순서로 실행된다
- [ ] AC-07: 에러 발생 시 현재 상태가 저장되고 에러 메시지가 출력된다
- [ ] AC-08: wbs.md에서 Task 정보를 정확히 파싱한다

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| Claude CLI 설치 필요 | High | 설치 가이드 문서화, 버전 체크 |
| Claude 세션 타임아웃 | Medium | 단계별 타임아웃 설정, 재시도 로직 |
| wbs.md 형식 변경 | Medium | 기존 파서 재사용으로 일관성 유지 |
| Windows/macOS/Linux 호환성 | Medium | Node.js spawn 옵션으로 크로스 플랫폼 지원 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-03-04 | 선행 | Workflow Engine (워크플로우 규칙 정의) |
| TSK-02-02-01 | 선행 | wbs.md 파서 (재사용) |
| TSK-02-01-02 | 선행 | 파일 읽기/쓰기 유틸리티 (재사용) |
| Claude CLI | 외부 | `claude` 명령어 설치 필요 |
| commander | npm | CLI 파싱 라이브러리 |

---

## 7. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행
- 상세설계에서 각 컴포넌트의 인터페이스, 함수 시그니처 정의
- 테스트 명세 작성

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- 기존 파서: `server/utils/wbs/parser/index.ts`
- 기존 파일 유틸: `server/utils/file/index.ts`

---

<!--
author: Claude
Template Version: 1.0.0
-->
