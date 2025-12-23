# jjiban CLI 사용자 매뉴얼

**버전:** 0.1.0
**Task ID:** TSK-07-01
**작성일:** 2025-12-15

---

## 목차

1. [소개](#1-소개)
2. [설치](#2-설치)
3. [빠른 시작](#3-빠른-시작)
4. [명령어 상세](#4-명령어-상세)
5. [워크플로우 이해하기](#5-워크플로우-이해하기)
6. [실전 예제](#6-실전-예제)
7. [고급 사용법](#7-고급-사용법)
8. [문제 해결](#8-문제-해결)
9. [참고 사항](#9-참고-사항)

---

## 1. 소개

### 1.1 jjiban CLI란?

jjiban CLI는 터미널에서 jjiban 워크플로우를 자동으로 실행하는 도구입니다.
Claude CLI와 연동하여 Task의 전체 개발 사이클을 자동화합니다.

### 1.2 주요 기능

- **워크플로우 자동화**: Task 상태에 따라 다음 단계를 자동 실행
- **중단 후 재개**: 작업이 중단되면 이어서 실행 가능
- **Dry-run 지원**: 실제 실행 전 계획 미리 확인
- **동시 실행 방지**: 같은 Task의 중복 실행 차단
- **보안 검증**: 명령어 인젝션 및 경로 순회 공격 방어

### 1.3 지원 카테고리

| 카테고리 | 설명 | 단계 수 |
|---------|------|--------|
| development | 새 기능 개발 | 10단계 |
| defect | 버그 수정 | 7단계 |
| infrastructure | 인프라/설정 작업 | 5단계 |

---

## 2. 설치

### 2.1 필수 요구사항

- Node.js 20.x 이상
- npm 10.x 이상
- Claude CLI (Anthropic)

### 2.2 설치 방법

```bash
# 프로젝트 디렉토리에서 의존성 설치
cd jjiban
npm install

# 전역 링크 (선택사항)
npm link
```

### 2.3 설치 확인

```bash
# 버전 확인
node bin/jjiban.js --version

# 도움말 확인
node bin/jjiban.js --help
```

### 2.4 Claude CLI 연동

jjiban CLI는 내부적으로 `claude -p` 명령을 호출합니다.
Claude CLI가 설치되어 있고 인증이 완료되어 있어야 합니다.

```bash
# Claude CLI 설치 확인
claude --version

# Claude CLI 인증 확인
claude "hello"
```

---

## 3. 빠른 시작

### 3.1 기본 사용법

```bash
# 전체 워크플로우 실행 (Todo → Done)
node bin/jjiban.js workflow TSK-07-01

# 또는 npx 사용
npx jjiban workflow TSK-07-01
```

### 3.2 실행 계획 미리 보기

```bash
# --dry-run: 실제 실행 없이 계획만 확인
node bin/jjiban.js workflow TSK-07-01 --dry-run
```

**출력 예시:**
```
[jjiban] Workflow Plan (dry-run)

Task: TSK-07-01
Category: development
Current Status: [ ]
Target: done

Execution Plan:
  1. start    → /wf:start TSK-07-01
  2. draft    → /wf:draft TSK-07-01
  3. review   → /wf:review TSK-07-01
  4. apply    → /wf:apply TSK-07-01
  5. build    → /wf:build TSK-07-01
  6. test     → /wf:test TSK-07-01
  7. audit    → /wf:audit TSK-07-01
  8. patch    → /wf:patch TSK-07-01
  9. verify   → /wf:verify TSK-07-01
  10. done    → /wf:done TSK-07-01

No changes were made.
```

### 3.3 부분 실행

```bash
# 기본설계까지만 실행
node bin/jjiban.js workflow TSK-07-01 --until basic-design

# 구현까지만 실행
node bin/jjiban.js workflow TSK-07-01 --until build
```

---

## 4. 명령어 상세

### 4.1 workflow 명령어

```bash
jjiban workflow [options] <taskId>
```

#### 인수

| 인수 | 설명 | 예시 |
|------|------|------|
| `taskId` | 실행할 Task ID | TSK-07-01, TSK-01-01-01 |

#### 옵션

| 옵션 | 약어 | 설명 | 기본값 |
|------|------|------|--------|
| `--until <step>` | `-u` | 목표 단계 | done |
| `--dry-run` | `-d` | 계획만 출력 | false |
| `--resume` | `-r` | 중단된 작업 재개 | false |
| `--verbose` | `-v` | 상세 로그 출력 | false |
| `--project <id>` | `-p` | 프로젝트 ID | 자동 탐지 |

### 4.2 --until 옵션 상세

| 값 | 설명 | 실행 단계 (development) |
|----|------|------------------------|
| `basic-design` | 기본설계까지 | start |
| `detail-design` | 상세설계까지 | start → draft |
| `review` | 설계리뷰까지 | start → draft → review |
| `apply` | 리뷰반영까지 | start → ... → apply |
| `build` | 구현까지 | start → ... → build → test |
| `audit` | 코드리뷰까지 | start → ... → audit |
| `patch` | 리뷰반영까지 | start → ... → patch |
| `verify` | 통합테스트까지 | start → ... → verify |
| `done` | 완료까지 | 전체 (기본값) |

### 4.3 종료 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 0 | 성공 | 워크플로우 정상 완료 |
| 1 | 일반 오류 | 검증 실패, 락 오류 등 |
| 2 | Task/WBS 없음 | 파일을 찾을 수 없음 |
| 3 | Claude 실행 오류 | Claude CLI 실패 또는 타임아웃 |
| 4 | 중단됨 | Ctrl+C로 중단됨 |

---

## 5. 워크플로우 이해하기

### 5.1 development 카테고리 (10단계)

```
┌─────────────────────────────────────────────────────────────────┐
│  [ ] Todo                                                        │
│    ↓                                                            │
│  start (/wf:start) → 기본설계                                    │
│    ↓                                                            │
│  [bd] Basic Design                                               │
│    ↓                                                            │
│  draft (/wf:draft) → 상세설계                                    │
│    ↓                                                            │
│  [dd] Detail Design                                              │
│    ↓                                                            │
│  review (/wf:review) → 설계 리뷰                                 │
│    ↓                                                            │
│  apply (/wf:apply) → 리뷰 반영                                   │
│    ↓                                                            │
│  build (/wf:build) → TDD 구현                                    │
│    ↓                                                            │
│  [im] Implement                                                  │
│    ↓                                                            │
│  test (/wf:test) → 단위 테스트                                   │
│    ↓                                                            │
│  audit (/wf:audit) → 코드 리뷰                                   │
│    ↓                                                            │
│  patch (/wf:patch) → 리뷰 반영                                   │
│    ↓                                                            │
│  verify (/wf:verify) → 통합 테스트                               │
│    ↓                                                            │
│  [vf] Verify                                                     │
│    ↓                                                            │
│  done (/wf:done) → 매뉴얼 작성 및 완료                           │
│    ↓                                                            │
│  [xx] Done                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 defect 카테고리 (7단계)

```
[ ] → start → [an] → fix → test → audit → patch → verify → [vf] → done → [xx]
```

| 단계 | 명령어 | 설명 |
|------|--------|------|
| start | /wf:start | 결함 분석 |
| fix | /wf:fix | 수정 구현 |
| test | /wf:test | 회귀 테스트 |
| audit | /wf:audit | 코드 리뷰 |
| patch | /wf:patch | 리뷰 반영 |
| verify | /wf:verify | 통합 테스트 |
| done | /wf:done | 완료 |

### 5.3 infrastructure 카테고리 (5단계)

```
[ ] → start/skip → build → audit → patch → done → [xx]
```

| 단계 | 명령어 | 설명 |
|------|--------|------|
| start | /wf:start | 설계 (선택) |
| skip | /wf:skip | 설계 생략 |
| build | /wf:build | 구현 |
| audit | /wf:audit | 리뷰 |
| patch | /wf:patch | 리뷰 반영 |
| done | /wf:done | 완료 |

---

## 6. 실전 예제

### 6.1 새 기능 개발 (처음부터 끝까지)

```bash
# 1. 실행 계획 확인
node bin/jjiban.js workflow TSK-08-01 --dry-run

# 2. 전체 워크플로우 실행
node bin/jjiban.js workflow TSK-08-01

# 3. 진행 상황 확인 (verbose)
node bin/jjiban.js workflow TSK-08-01 --verbose
```

### 6.2 설계까지만 진행

```bash
# 기본설계까지
node bin/jjiban.js workflow TSK-08-01 --until basic-design

# 다음 날 이어서 상세설계까지
node bin/jjiban.js workflow TSK-08-01 --until detail-design

# 구현 준비가 되면 전체 완료
node bin/jjiban.js workflow TSK-08-01
```

### 6.3 중단된 작업 재개

```bash
# Ctrl+C로 중단된 경우
# → 자동으로 상태가 저장됨

# 다시 시작할 때 --resume 옵션 사용
node bin/jjiban.js workflow TSK-08-01 --resume
```

### 6.4 버그 수정 (defect)

```bash
# 버그 수정 Task 실행
node bin/jjiban.js workflow TSK-02-05

# defect 카테고리는 자동으로 7단계 흐름 적용
# start → fix → test → audit → patch → verify → done
```

### 6.5 여러 프로젝트 사용

```bash
# 기본 프로젝트 (자동 탐지)
node bin/jjiban.js workflow TSK-07-01

# 특정 프로젝트 지정
node bin/jjiban.js workflow TSK-07-01 --project my-project
```

---

## 7. 고급 사용법

### 7.1 상태 파일 이해하기

워크플로우 실행 중 상태는 다음 위치에 저장됩니다:

```
.jjiban/workflow-state/workflow-state-{taskId}.json
```

**파일 구조:**
```json
{
  "taskId": "TSK-07-01",
  "projectId": "jjiban",
  "category": "development",
  "status": "running",
  "currentStep": 3,
  "targetStep": "done",
  "steps": ["start", "draft", "review", ...],
  "completedSteps": [
    { "step": "start", "status": "success", "duration": 45000 },
    { "step": "draft", "status": "success", "duration": 120000 }
  ],
  "startedAt": "2025-12-15T10:00:00.000Z"
}
```

### 7.2 락 파일 이해하기

동시 실행 방지를 위한 락 파일:

```
.jjiban/locks/{taskId}.lock
```

**파일 구조:**
```json
{
  "taskId": "TSK-07-01",
  "pid": 12345,
  "hostname": "my-computer",
  "acquiredAt": "2025-12-15T10:00:00.000Z"
}
```

### 7.3 수동 락 해제

프로세스가 비정상 종료된 경우 락 파일을 수동으로 삭제할 수 있습니다:

```bash
# 락 파일 확인
ls .jjiban/locks/

# 락 파일 삭제
rm .jjiban/locks/TSK-07-01.lock
```

**참고:** 정상적인 경우 jjiban CLI는 죽은 프로세스의 락을 자동으로 해제합니다.

### 7.4 디버그 모드

```bash
# 상세 오류 스택 출력
DEBUG=1 node bin/jjiban.js workflow TSK-07-01
```

### 7.5 CI/CD 통합

```yaml
# GitHub Actions 예시
jobs:
  workflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: |
          # dry-run으로 계획 확인
          node bin/jjiban.js workflow ${{ github.event.inputs.task_id }} --dry-run
```

---

## 8. 문제 해결

### 8.1 일반적인 오류

#### "유효하지 않은 Task ID 형식입니다"

**원인:** Task ID가 올바른 형식이 아님

**해결:**
```bash
# 올바른 형식
TSK-01-01      # 3단계 구조
TSK-01-01-01   # 4단계 구조

# 잘못된 형식
TSK-1-1        # 숫자가 2자리여야 함
task-01-01     # TSK로 시작해야 함
TSK-01-01-01-01  # 최대 4단계까지
```

#### "Task를 찾을 수 없습니다"

**원인:** wbs.md에 해당 Task가 없음

**해결:**
1. Task ID가 정확한지 확인
2. wbs.md 파일에 Task가 정의되어 있는지 확인
3. 프로젝트 ID가 맞는지 확인 (`--project` 옵션)

#### "WBS 파일을 찾을 수 없습니다"

**원인:** .jjiban/projects/{project}/wbs.md 파일 없음

**해결:**
1. .jjiban 폴더가 있는 디렉토리에서 실행
2. 프로젝트가 초기화되어 있는지 확인
3. `--project` 옵션으로 올바른 프로젝트 지정

#### "이미 실행 중인 워크플로우입니다"

**원인:** 같은 Task에 대해 다른 프로세스가 실행 중

**해결:**
1. 기존 프로세스가 완료될 때까지 대기
2. 기존 프로세스가 비정상 종료된 경우:
   ```bash
   rm .jjiban/locks/TSK-xx-xx.lock
   ```

#### "Claude CLI 실행 실패"

**원인:** Claude CLI 문제

**해결:**
1. Claude CLI 설치 확인: `claude --version`
2. Claude CLI 인증 확인: `claude "test"`
3. 네트워크 연결 확인

### 8.2 중단 후 복구

```bash
# 1. 상태 확인
cat .jjiban/workflow-state/workflow-state-TSK-07-01.json

# 2. 재개 시도
node bin/jjiban.js workflow TSK-07-01 --resume

# 3. 재개 실패 시 상태 초기화
rm .jjiban/workflow-state/workflow-state-TSK-07-01.json
rm .jjiban/locks/TSK-07-01.lock

# 4. 처음부터 다시 시작
node bin/jjiban.js workflow TSK-07-01
```

### 8.3 타임아웃 처리

기본 타임아웃은 30분입니다. 복잡한 작업의 경우 타임아웃이 발생할 수 있습니다.

**대응:**
1. `--resume` 옵션으로 이어서 실행
2. 타임아웃 발생 단계만 수동 실행 후 다음 단계부터 재개

---

## 9. 참고 사항

### 9.1 파일 구조

```
jjiban/
├── bin/
│   └── jjiban.js           # CLI 진입점
├── cli/
│   ├── commands/
│   │   └── workflow.js     # workflow 명령어
│   ├── core/
│   │   ├── WorkflowRunner.js   # 오케스트레이터
│   │   ├── WorkflowPlanner.js  # 계획 생성
│   │   ├── ClaudeExecutor.js   # Claude 실행
│   │   ├── StateManager.js     # 상태 관리
│   │   ├── LockManager.js      # 락 관리
│   │   └── WbsReader.js        # WBS 파서
│   ├── validation/
│   │   ├── TaskIdValidator.js  # Task ID 검증
│   │   └── PathValidator.js    # 경로 검증
│   ├── errors/
│   │   └── JjibanError.js      # 에러 클래스
│   └── config/
│       └── workflowSteps.js    # 워크플로우 설정
└── .jjiban/
    ├── workflow-state/     # 실행 상태 저장
    └── locks/              # 락 파일
```

### 9.2 관련 문서

| 문서 | 설명 |
|------|------|
| 010-basic-design.md | 기본설계 문서 |
| 020-detail-design.md | 상세설계 문서 |
| 030-implementation.md | 구현 문서 |
| 070-integration-test.md | 통합테스트 보고서 |

### 9.3 버전 이력

| 버전 | 날짜 | 변경 사항 |
|------|------|----------|
| 0.1.0 | 2025-12-15 | 최초 릴리스 |

### 9.4 알려진 제한 사항

1. **병렬 실행 미지원**: 워크플로우는 순차 실행만 지원
2. **조건부 분기 미지원**: 모든 단계가 선형으로 실행
3. **커스텀 단계 미지원**: 사전 정의된 단계만 사용 가능

### 9.5 향후 계획

- [ ] 커스텀 워크플로우 정의 지원
- [ ] 병렬 단계 실행 지원
- [ ] 웹 UI 연동
- [ ] 실행 히스토리 조회 명령어

---

## 부록: 명령어 치트시트

```bash
# 기본 실행
jjiban workflow TSK-XX-XX

# 계획 확인
jjiban workflow TSK-XX-XX --dry-run

# 부분 실행
jjiban workflow TSK-XX-XX --until build

# 재개
jjiban workflow TSK-XX-XX --resume

# 상세 로그
jjiban workflow TSK-XX-XX --verbose

# 프로젝트 지정
jjiban workflow TSK-XX-XX --project my-project

# 조합
jjiban workflow TSK-XX-XX --until build --verbose --project my-project
```

---

<!--
author: Claude
-->
