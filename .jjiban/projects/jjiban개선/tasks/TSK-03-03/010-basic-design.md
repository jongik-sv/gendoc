# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Task명 | 워크플로우 명령어 훅 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 9.6, 9.7 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | - |

---

## 1. 목적 및 범위

### 1.1 목적

워크플로우 명령어(`/wf:*`) 실행 시 자동으로 실행 상태를 서버에 등록/해제하여, 웹 UI에서 현재 실행 중인 Task를 실시간으로 추적할 수 있도록 합니다.

### 1.2 범위

**포함 범위**:
- CLI `exec` 명령어 신규 생성 (`start`/`stop` 서브커맨드)
- `bin/jjiban.js`에 exec 명령어 등록
- 15개 `/wf:*` 슬래시 명령어 파일에 훅 스크립트 추가

**제외 범위**:
- 실행 상태 API 구현 → TSK-03-01 (완료)
- 클라이언트 스피너 표시 → TSK-03-02 (완료)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | `npx jjiban exec start` 명령어 구현 | High | 9.7 |
| FR-002 | `npx jjiban exec stop` 명령어 구현 | High | 9.7 |
| FR-003 | 환경변수에서 세션 정보 읽기 | High | 9.6 |
| FR-004 | 15개 wf 명령어 파일에 시작 훅 추가 | High | 9.7 |
| FR-005 | 15개 wf 명령어 파일에 종료 훅 추가 | High | 9.7 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | CLI 실행 시간 | < 500ms |
| NFR-002 | 훅 실패 시 워크플로우 중단 안함 | 경고만 출력 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│ 터미널 세션 (환경변수 설정됨)                                  │
│   JJIBAN_SESSION_ID=term-uuid-1234                          │
│   JJIBAN_TERMINAL_PID=12345                                 │
├─────────────────────────────────────────────────────────────┤
│ /wf:build TSK-01-01 실행                                     │
│   ↓                                                          │
│ [시작 훅] npx jjiban exec start TSK-01-01 build             │
│   ↓ POST /api/execution/start                               │
│ ... 워크플로우 로직 실행 ...                                   │
│   ↓                                                          │
│ [종료 훅] npx jjiban exec stop TSK-01-01                     │
│   ↓ POST /api/execution/stop                                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| cli/commands/exec.js | CLI exec 명령어 | start/stop 서브커맨드 처리 |
| bin/jjiban.js | CLI 진입점 | exec 명령어 등록 |
| .claude/commands/wf/*.md | 슬래시 명령어 | 시작/종료 훅 호출 |

### 3.3 CLI 명령어 설계

**시작 등록**:
```bash
npx jjiban exec start <taskId> <command> [options]
  --session <sessionId>  터미널 세션 ID (환경변수 폴백)
  --pid <pid>            터미널 프로세스 PID (환경변수 폴백)
```

**종료 등록**:
```bash
npx jjiban exec stop <taskId>
```

### 3.4 환경변수 활용

| 환경변수 | 설명 | 폴백 |
|----------|------|------|
| JJIBAN_SESSION_ID | 터미널 세션 ID | CLI 옵션 `--session` |
| JJIBAN_TERMINAL_PID | 터미널 프로세스 PID | CLI 옵션 `--pid` |

### 3.5 수정 대상 wf 명령어 (15개)

| 명령어 | 파일 경로 |
|--------|----------|
| start | `.claude/commands/wf/start.md` |
| ui | `.claude/commands/wf/ui.md` |
| draft | `.claude/commands/wf/draft.md` |
| review | `.claude/commands/wf/review.md` |
| apply | `.claude/commands/wf/apply.md` |
| build | `.claude/commands/wf/build.md` |
| test | `.claude/commands/wf/test.md` |
| audit | `.claude/commands/wf/audit.md` |
| patch | `.claude/commands/wf/patch.md` |
| verify | `.claude/commands/wf/verify.md` |
| done | `.claude/commands/wf/done.md` |
| fix | `.claude/commands/wf/fix.md` |
| skip | `.claude/commands/wf/skip.md` |
| run | `.claude/commands/wf/run.md` |
| auto | `.claude/commands/wf/auto.md` |

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| API 호출 방식 | fetch, axios, got | fetch (Node 18+) | 의존성 최소화 |
| 환경변수 폴백 | 필수, 선택 | 선택 (CLI 옵션 폴백) | 유연성 확보 |
| 훅 실패 처리 | 중단, 경고 | 경고만 출력 | 워크플로우 안정성 |

---

## 5. 인수 기준

- [ ] AC-01: `npx jjiban exec start TSK-01-01 build`가 API를 호출한다
- [ ] AC-02: `npx jjiban exec stop TSK-01-01`가 API를 호출한다
- [ ] AC-03: 환경변수가 없으면 CLI 옵션에서 값을 읽는다
- [ ] AC-04: 15개 wf 명령어 파일에 시작 훅이 추가된다
- [ ] AC-05: 15개 wf 명령어 파일에 종료 훅이 추가된다
- [ ] AC-06: API 호출 실패 시 경고만 출력하고 계속 진행한다

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 환경변수 미설정 | Medium | CLI 옵션 폴백 제공 |
| API 서버 미기동 | Low | 훅 실패 시 경고만 출력 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-03-01 | 선행 | 실행 상태 API (완료) |
| Node.js 18+ | 환경 | fetch API 사용 |

---

## 7. 다음 단계

- `/wf:ui` 명령어로 화면설계 진행 (선택, CLI이므로 생략 가능)
- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 9.6, 9.7
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude
Template Version: 1.0.0
-->
