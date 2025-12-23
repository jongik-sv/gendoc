# 테스트 명세: wbs.md 파서 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-01 |
| 문서 유형 | Test Specification |
| 작성일 | 2025-12-13 |
| 관련 문서 | 010-basic-design.md, 020-detail-design.md |

---

## 1. 테스트 개요

### 1.1 테스트 목적

wbs.md 파서 구현의 정확성, 견고성, 성능을 검증하기 위한 테스트 명세를 정의합니다.

### 1.2 테스트 범위

| 테스트 유형 | 범위 | 우선순위 |
|-----------|------|---------|
| 단위 테스트 | 개별 함수 (parseNodeHeader, parseNodeAttributes 등) | 필수 |
| 통합 테스트 | 전체 파싱 흐름 (parseWbsMarkdown) | 필수 |
| 성능 테스트 | 파싱 시간, 메모리 사용량 | 권장 |
| 에러 처리 테스트 | 예외 상황, 경계 케이스 | 필수 |

### 1.3 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 | Vitest |
| TypeScript 버전 | 5.6.x |
| Node.js 버전 | 20.x |
| 테스트 데이터 위치 | `tests/fixtures/wbs/` |
| 테스트 파일 위치 | `tests/unit/wbs-parser.test.ts` |

---

## 2. 단위 테스트: parseNodeHeader

### 2.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 함수명 | parseNodeHeader |
| 테스트 케이스 수 | 10 |
| 커버하는 FR | FR-001 |
| 커버하는 BR | BR-001, BR-002 |

### 2.2 테스트 케이스

| TC ID | 시나리오 | 입력 | 예상 출력 | 우선순위 |
|-------|---------|------|----------|---------|
| TC-001-001 | 정상 WP 헤더 | `"## WP-01: Platform Infrastructure"` | `{ id: "WP-01", type: "wp", title: "Platform Infrastructure", level: 2 }` | 필수 |
| TC-001-002 | 정상 ACT 헤더 (4단계) | `"### ACT-01-02: Project Setup"` | `{ id: "ACT-01-02", type: "act", title: "Project Setup", level: 3 }` | 필수 |
| TC-001-003 | 정상 TSK 헤더 (4단계) | `"#### TSK-01-02-03: 초기화"` | `{ id: "TSK-01-02-03", type: "task", title: "초기화", level: 4 }` | 필수 |
| TC-001-004 | 정상 TSK 헤더 (3단계) | `"### TSK-01-02: 설정"` | `{ id: "TSK-01-02", type: "task", title: "설정", level: 3 }` | 필수 |
| TC-001-005 | 제목에 특수문자 포함 | `"## WP-02: Data & Storage"` | `{ id: "WP-02", type: "wp", title: "Data & Storage", level: 2 }` | 필수 |
| TC-001-006 | 제목에 한글 포함 | `"## WP-03: 데이터 레이어"` | `{ id: "WP-03", type: "wp", title: "데이터 레이어", level: 2 }` | 필수 |
| TC-001-007 | 잘못된 헤더 형식 (: 없음) | `"## WP-01 Platform"` | `null` | 필수 |
| TC-001-008 | 잘못된 ID 형식 | `"## WRONG-01: Test"` | `null` | 필수 |
| TC-001-009 | 빈 제목 | `"## WP-01: "` | `null` | 권장 |
| TC-001-010 | 공백만 있는 제목 | `"## WP-01:    "` | `null` | 권장 |

### 2.3 테스트 시나리오 (표 형식)

| 시나리오 그룹 | 테스트 항목 | 검증 내용 |
|-------------|-----------|----------|
| 정상 케이스 | WP/ACT/TSK 헤더 | ID, type, title, level 정확성 |
| 특수문자 처리 | &, -, 한글 등 | 제목 정확히 추출 |
| 에러 케이스 | 형식 오류 | null 반환, 로그 기록 |

---

## 3. 단위 테스트: parseNodeAttributes

### 3.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 함수명 | parseNodeAttributes |
| 테스트 케이스 수 | 15 |
| 커버하는 FR | FR-002 |
| 커버하는 BR | BR-005 |

### 3.2 테스트 케이스: 개별 속성 파싱

| TC ID | 속성명 | 입력 라인 | 예상 결과 | 우선순위 |
|-------|--------|----------|----------|---------|
| TC-002-001 | category | `["- category: development"]` | `{ category: "development" }` | 필수 |
| TC-002-002 | status | `["- status: done [xx]"]` | `{ status: "[xx]" }` | 필수 |
| TC-002-003 | priority | `["- priority: high"]` | `{ priority: "high" }` | 필수 |
| TC-002-004 | assignee | `["- assignee: hong"]` | `{ assignee: "hong" }` | 필수 |
| TC-002-005 | schedule | `["- schedule: 2025-12-01 ~ 2025-12-31"]` | `{ schedule: { start: "2025-12-01", end: "2025-12-31" } }` | 필수 |
| TC-002-006 | tags | `["- tags: parser, markdown, wbs"]` | `{ tags: ["parser", "markdown", "wbs"] }` | 필수 |
| TC-002-007 | depends | `["- depends: TSK-01-02"]` | `{ depends: ["TSK-01-02"] }` | 필수 |
| TC-002-008 | requirements | `["- requirements:", "  - Nuxt 3 설치", "  - TypeScript 설정"]` | `{ requirements: ["Nuxt 3 설치", "TypeScript 설정"] }` | 필수 |
| TC-002-009 | ref | `["- ref: PRD 7.2"]` | `{ ref: "PRD 7.2" }` | 필수 |

### 3.3 테스트 케이스: 에러 처리

| TC ID | 시나리오 | 입력 | 예상 결과 | 우선순위 |
|-------|---------|------|----------|---------|
| TC-002-010 | 잘못된 category 값 | `["- category: invalid"]` | `{ category: undefined }` (기본값) | 필수 |
| TC-002-011 | 잘못된 status 형식 | `["- status: done"]` (코드 없음) | `{ status: undefined }` | 권장 |
| TC-002-012 | 잘못된 날짜 형식 | `["- schedule: 2025/12/01 ~ 2025/12/31"]` | `{ schedule: undefined }` | 권장 |
| TC-002-013 | 빈 requirements | `["- requirements:"]` | `{ requirements: [] }` | 권장 |
| TC-002-014 | 복수 depends | `["- depends: TSK-01-01, TSK-01-02"]` | `{ depends: ["TSK-01-01", "TSK-01-02"] }` | 권장 |
| TC-002-015 | 모든 속성 동시 파싱 | 9개 속성 라인 | 모든 속성 정확히 파싱 | 필수 |

### 3.4 테스트 시나리오 (표 형식)

| 시나리오 그룹 | 테스트 항목 | 검증 내용 |
|-------------|-----------|----------|
| 정상 케이스 | 각 속성별 파싱 | 값 정확성, 타입 일치 |
| 복합 속성 | requirements, tags, depends | 배열 파싱, 여러 줄 처리 |
| 에러 케이스 | 잘못된 값, 형식 오류 | 기본값 사용, 로그 기록 |

---

## 4. 단위 테스트: buildTree

### 4.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 함수명 | buildTree |
| 테스트 케이스 수 | 6 |
| 커버하는 FR | FR-003 |
| 커버하는 BR | BR-003, BR-004 |

### 4.2 테스트 케이스

| TC ID | 시나리오 | 입력 플랫 노드 | 예상 트리 구조 | 우선순위 |
|-------|---------|---------------|---------------|---------|
| TC-003-001 | 4단계 구조 (WP → ACT → TSK) | WP-01, ACT-01-01, TSK-01-01-01 | WP-01 → ACT-01-01 → TSK-01-01-01 | 필수 |
| TC-003-002 | 3단계 구조 (WP → TSK) | WP-02, TSK-02-01 | WP-02 → TSK-02-01 | 필수 |
| TC-003-003 | 혼합 구조 (3단계 + 4단계) | WP-01 + 4단계, WP-02 + 3단계 | 정상 트리 | 필수 |
| TC-003-004 | 복수 WP | WP-01, WP-02, WP-03 | 3개 루트 노드 | 필수 |
| TC-003-005 | 복수 자식 | WP-01 → ACT-01-01, ACT-01-02 | 1개 부모, 2개 자식 | 필수 |
| TC-003-006 | 고아 노드 (부모 없음) | TSK-99-99-99 (부모 ACT-99-99 없음) | 루트에 추가, 경고 로그 | 권장 |

### 4.3 테스트 시나리오 (표 형식)

| 시나리오 그룹 | 테스트 항목 | 검증 내용 |
|-------------|-----------|----------|
| 계층 구조 | 4단계, 3단계, 혼합 | 부모-자식 관계 정확성 |
| 복수 노드 | 여러 WP, 여러 자식 | 트리 완전성 |
| 경계 케이스 | 고아 노드 | 에러 처리, 복구 전략 |

---

## 5. 단위 테스트: calculateProgress

### 5.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 함수명 | calculateProgress |
| 테스트 케이스 수 | 5 |
| 커버하는 FR | FR-004 |

### 5.2 테스트 케이스

| TC ID | 시나리오 | 트리 구조 | 예상 진행률 | 우선순위 |
|-------|---------|----------|-----------|---------|
| TC-004-001 | 모든 Task 완료 | WP → 3개 TSK (모두 [xx]) | 100% | 필수 |
| TC-004-002 | 일부 Task 완료 | WP → 4개 TSK (2개 [xx], 2개 [ ]) | 50% | 필수 |
| TC-004-003 | 진행 중 Task 포함 | WP → 3개 TSK ([ ], [bd], [im]) | 27% | 필수 |
| TC-004-004 | 중첩 구조 진행률 | WP → ACT → 2개 TSK (1개 [xx]) | WP: 50%, ACT: 50% | 필수 |
| TC-004-005 | Task 없는 노드 | WP (자식 없음) | 0%, taskCount: 0 | 권장 |

### 5.3 상태별 가중치

| 상태 코드 | 가중치 | 설명 |
|----------|--------|------|
| `[ ]` | 0% | Todo (미시작) |
| `[bd]` | 20% | 기본설계 |
| `[dd]` | 40% | 상세설계 |
| `[im]` | 60% | 구현 |
| `[vf]` | 80% | 검증 |
| `[xx]` | 100% | 완료 |

### 5.4 계산 규칙 검증

| 검증 항목 | 계산 방법 | 예시 |
|----------|----------|------|
| Task 진행률 | 상태별 가중치 | [im] = 60% |
| WP/ACT 진행률 | Σ(Task 가중치) / Task 수 | (0+20+60)/3 = 27% |
| taskCount | 하위 Task 총 개수 | WP: 10, ACT: 5, TSK: 1 |

---

## 6. 통합 테스트: parseWbsMarkdown

### 6.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 함수명 | parseWbsMarkdown |
| 테스트 케이스 수 | 8 |
| 커버하는 FR | FR-001 ~ FR-005 |

### 6.2 테스트 케이스

| TC ID | 시나리오 | 입력 파일 | 예상 결과 | 우선순위 |
|-------|---------|----------|----------|---------|
| TC-005-001 | 실제 wbs.md 파싱 | `fixtures/wbs/jjiban-wbs.md` | 56개 노드, 계층 구조 정확 | 필수 |
| TC-005-002 | 빈 파일 | `""` | `[]` (빈 배열) | 필수 |
| TC-005-003 | 3단계 구조만 | `fixtures/wbs/3level.md` | WP → TSK 트리 | 필수 |
| TC-005-004 | 4단계 구조만 | `fixtures/wbs/4level.md` | WP → ACT → TSK 트리 | 필수 |
| TC-005-005 | 메타데이터만 있음 | `"# WBS\n> version: 1.0\n---"` | `[]` | 권장 |
| TC-005-006 | 일부 오류 포함 | 정상 노드 + 잘못된 헤더 | 정상 노드만 파싱, 오류 스킵 | 필수 |
| TC-005-007 | 고아 노드 포함 | 부모 없는 노드 포함 | 루트에 추가, 경고 로그 | 권장 |
| TC-005-008 | 모든 속성 포함 | 9개 속성 모두 사용 | 모든 속성 정확히 파싱 | 필수 |

### 6.3 테스트 데이터 파일

| 파일명 | 내용 | 용도 |
|--------|------|------|
| `jjiban-wbs.md` | 실제 프로젝트 wbs.md | 실전 테스트 |
| `3level.md` | 3단계 구조 샘플 | 계층 테스트 |
| `4level.md` | 4단계 구조 샘플 | 계층 테스트 |
| `minimal.md` | 최소 wbs.md (1개 WP, 1개 TSK) | 기본 테스트 |
| `complex.md` | 복잡한 구조 (여러 WP, ACT, TSK) | 복잡도 테스트 |
| `error.md` | 오류 포함 wbs.md | 에러 처리 테스트 |

---

## 7. 성능 테스트

### 7.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 테스트 유형 | 벤치마크 테스트 |
| 테스트 케이스 수 | 3 |
| 목표 | 1000 노드 < 500ms |

### 7.2 테스트 케이스

| TC ID | 시나리오 | 노드 수 | 목표 시간 | 우선순위 |
|-------|---------|---------|----------|---------|
| TC-006-001 | 소규모 wbs.md | 50 노드 | < 50ms | 권장 |
| TC-006-002 | 중규모 wbs.md | 300 노드 | < 200ms | 권장 |
| TC-006-003 | 대규모 wbs.md | 1000 노드 | < 500ms | 필수 |

### 7.3 측정 방법

| 측정 항목 | 방법 | 도구 |
|----------|------|------|
| 파싱 시간 | performance.now() | Node.js 내장 |
| 메모리 사용량 | process.memoryUsage() | Node.js 내장 |
| 노드당 평균 시간 | 전체 시간 / 노드 수 | 계산 |

### 7.4 성능 벤치마크 시나리오

```
시나리오:
1. 성능 측정 시작 (performance.now())
2. 메모리 사용량 측정 (초기)
3. parseWbsMarkdown 실행
4. 성능 측정 종료
5. 메모리 사용량 측정 (종료)
6. 결과 기록 (시간, 메모리 증가량)
7. 목표 대비 검증
```

---

## 8. 에러 처리 테스트

### 8.1 테스트 그룹 개요

| 항목 | 내용 |
|------|------|
| 테스트 목적 | 예외 상황 견고성 검증 |
| 테스트 케이스 수 | 7 |

### 8.2 테스트 케이스

| TC ID | 에러 시나리오 | 입력 | 예상 동작 | 로그 레벨 | 우선순위 |
|-------|-------------|------|----------|----------|---------|
| TC-007-001 | 잘못된 헤더 형식 | `"## WP-01 Test"` (: 없음) | 라인 스킵, 계속 파싱 | WARN | 필수 |
| TC-007-002 | 알 수 없는 ID 패턴 | `"## INVALID-01: Test"` | 라인 스킵 | WARN | 필수 |
| TC-007-003 | 필수 속성 누락 | Task에 category 없음 | 기본값 undefined | WARN | 필수 |
| TC-007-004 | 잘못된 속성 값 | `category: invalid` | 기본값 사용 | WARN | 권장 |
| TC-007-005 | 부모 노드 없음 | TSK-99-99-99 | 루트에 추가 | WARN | 권장 |
| TC-007-006 | 잘못된 날짜 형식 | `schedule: 2025/12/01` | 속성 무시 | WARN | 권장 |
| TC-007-007 | 빈 라인, 주석 | 빈 라인 여러 개 | 무시하고 계속 | - | 권장 |

### 8.3 로그 검증

각 에러 케이스에서 적절한 로그가 기록되는지 검증:

| 검증 항목 | 검증 방법 |
|----------|----------|
| 로그 레벨 | ERROR, WARN, INFO 적절성 |
| 로그 메시지 | 에러 원인 명확성 |
| 로그 컨텍스트 | 라인 번호, 노드 ID 포함 |

---

## 9. 테스트 데이터

### 9.1 픽스처 파일 구조

```
tests/fixtures/wbs/
├── jjiban-wbs.md         # 실제 프로젝트 wbs.md
├── 3level.md             # 3단계 구조
├── 4level.md             # 4단계 구조
├── minimal.md            # 최소 구조
├── complex.md            # 복잡한 구조
├── error.md              # 오류 포함
├── large-50.md           # 50 노드
├── large-300.md          # 300 노드
└── large-1000.md         # 1000 노드
```

### 9.2 샘플 테스트 데이터: minimal.md

```markdown
# WBS - Test Project

> version: 1.0
> depth: 3

---

## WP-01: Test Package
- status: planned
- priority: high

### TSK-01-01: Test Task
- category: development
- status: todo [ ]
- priority: medium
- assignee: test-user
- schedule: 2025-12-01 ~ 2025-12-31
- tags: test
- requirements:
  - Test requirement 1
- ref: TEST-001
```

### 9.3 샘플 테스트 데이터: 4level.md

```markdown
# WBS - 4-Level Project

> version: 1.0
> depth: 4

---

## WP-01: Platform
- status: planned
- priority: critical

### ACT-01-01: Setup
- status: todo

#### TSK-01-01-01: Initialize
- category: infrastructure
- status: done [xx]
- priority: high
- assignee: dev-1
```

---

## 10. 테스트 실행 계획

### 10.1 실행 순서

| 순서 | 테스트 그룹 | 이유 |
|------|-----------|------|
| 1 | parseNodeHeader | 기본 빌딩 블록 |
| 2 | parseNodeAttributes | 속성 파싱 독립 검증 |
| 3 | buildTree | 트리 구조 검증 |
| 4 | calculateProgress | 계산 로직 검증 |
| 5 | parseWbsMarkdown (통합) | 전체 흐름 검증 |
| 6 | 에러 처리 | 견고성 검증 |
| 7 | 성능 테스트 | 최종 성능 확인 |

### 10.2 CI/CD 통합

| 단계 | 실행 테스트 | 통과 조건 |
|------|-----------|----------|
| PR 생성 | 단위 테스트 (필수) | 100% 통과 |
| PR 머지 전 | 단위 + 통합 테스트 | 100% 통과 |
| 머지 후 | 모든 테스트 | 100% 통과 |
| 릴리즈 전 | 모든 테스트 + 성능 | 100% 통과, 성능 목표 달성 |

---

## 11. 테스트 커버리지 목표

### 11.1 코드 커버리지

| 커버리지 유형 | 목표 | 최소 |
|-------------|------|------|
| 라인 커버리지 | 95% | 90% |
| 브랜치 커버리지 | 90% | 85% |
| 함수 커버리지 | 100% | 95% |
| 구문 커버리지 | 95% | 90% |

### 11.2 요구사항 커버리지

| 요구사항 유형 | 커버리지 목표 |
|-------------|-------------|
| 기능 요구사항 (FR) | 100% |
| 비즈니스 규칙 (BR) | 100% |
| 수용 기준 (AC) | 90% |

---

## 12. 테스트 케이스 작성 가이드

### 12.1 테스트 케이스 명명 규칙

```
describe('parseNodeHeader', () => {
  it('should parse valid WP header', () => { ... })
  it('should return null for invalid header format', () => { ... })
})
```

| 패턴 | 설명 | 예시 |
|------|------|------|
| should {동작} | 정상 케이스 | "should parse valid WP header" |
| should return {값} for {조건} | 에러 케이스 | "should return null for invalid format" |
| should handle {상황} | 경계 케이스 | "should handle empty title" |

### 12.2 테스트 데이터 관리

| 방법 | 용도 | 예시 |
|------|------|------|
| 인라인 데이터 | 간단한 테스트 | `const input = "## WP-01: Test"` |
| 픽스처 파일 | 복잡한 데이터 | `readFileSync('fixtures/wbs/minimal.md')` |
| 테스트 빌더 | 동적 생성 | `createWbsNode({ id: 'WP-01' })` |

### 12.3 Assertion 가이드

| 검증 항목 | Assertion 방법 | 예시 |
|----------|--------------|------|
| 값 일치 | toEqual | `expect(result).toEqual({ id: 'WP-01' })` |
| 타입 검증 | toBeTypeOf | `expect(result).toBeTypeOf('object')` |
| null 검증 | toBeNull | `expect(result).toBeNull()` |
| 배열 검증 | toHaveLength | `expect(nodes).toHaveLength(3)` |
| 객체 필드 | toHaveProperty | `expect(node).toHaveProperty('id', 'WP-01')` |

---

## 13. 테스트 시나리오 상세 (샘플)

### 13.1 TC-005-001: 실제 wbs.md 파싱

**전제조건**:
- jjiban 프로젝트의 실제 wbs.md 파일 사용
- 56개 노드 (8개 WP, 여러 ACT, TSK)

**테스트 단계**:

| 단계 | 작업 | 예상 결과 |
|------|------|----------|
| 1 | wbs.md 파일 읽기 | 파일 내용 문자열 |
| 2 | parseWbsMarkdown 호출 | WbsNode[] 반환 |
| 3 | 루트 노드 개수 검증 | 8개 (WP-01 ~ WP-08) |
| 4 | WP-01 구조 검증 | 2개 ACT, 각 ACT에 TSK 있음 |
| 5 | TSK-01-01-01 속성 검증 | category: infrastructure, status: [xx] |
| 6 | 전체 노드 수 검증 | 56개 |
| 7 | 진행률 계산 검증 | WP-01: 일부 완료, 진행률 > 0% |

**예상 출력 구조**:

```
WbsNode[] (length: 8)
├─ WP-01: Platform Infrastructure
│  ├─ ACT-01-01: Project Setup
│  │  ├─ TSK-01-01-01: Nuxt 3 초기화 [xx]
│  │  ├─ TSK-01-01-02: PrimeVue 설정 [xx]
│  │  └─ ...
│  └─ ACT-01-02: App Layout
│     └─ ...
├─ WP-02: Data Storage Layer
│  └─ ...
└─ ...
```

**검증 항목**:

| 항목 | 검증 방법 |
|------|----------|
| 노드 수 | `expect(result).toHaveLength(8)` |
| 첫 번째 WP ID | `expect(result[0].id).toBe('WP-01')` |
| 계층 구조 | `expect(result[0].children).toBeDefined()` |
| 진행률 | `expect(result[0].progress).toBeGreaterThan(0)` |
| Task 수 | `expect(result[0].taskCount).toBeGreaterThan(0)` |

---

## 14. 모킹 전략

### 14.1 모킹 대상

| 대상 | 이유 | 모킹 방법 |
|------|------|----------|
| 파일 시스템 (fs) | 파서는 문자열 입력만 받음 | 모킹 불필요 (상위 계층에서 처리) |
| 로거 | 테스트 출력 방지 | vi.spyOn(console, 'warn').mockImplementation() |
| 성능 측정 | 일관된 테스트 | - (실제 측정) |

### 14.2 모킹 예시

```
시나리오: 경고 로그 검증

설정:
- const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

테스트:
- parseNodeHeader("invalid header")

검증:
- expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid header'))

정리:
- warnSpy.mockRestore()
```

---

## 15. 회귀 테스트

### 15.1 회귀 테스트 시나리오

| 시나리오 | 목적 | 실행 주기 |
|---------|------|----------|
| 전체 테스트 스위트 실행 | 기존 기능 유지 검증 | 모든 PR |
| 성능 벤치마크 | 성능 저하 방지 | 주 1회 |
| 실제 wbs.md 파싱 | 실전 데이터 호환성 | 매 릴리즈 |

### 15.2 회귀 테스트 데이터 관리

| 방법 | 설명 |
|------|------|
| 스냅샷 테스트 | 출력 결과를 스냅샷으로 저장, 비교 |
| 골든 파일 | 예상 출력 JSON 파일과 비교 |
| 버전별 테스트 데이터 | 각 wbs.md 버전별 테스트 데이터 유지 |

---

## 16. 테스트 리포트

### 16.1 리포트 항목

| 항목 | 내용 |
|------|------|
| 전체 테스트 수 | 55 (단위 44 + 통합 8 + 성능 3) |
| 통과 테스트 수 | - |
| 실패 테스트 수 | - |
| 코드 커버리지 | 라인, 브랜치, 함수, 구문 |
| 실행 시간 | 전체 테스트 스위트 실행 시간 |
| 성능 벤치마크 | 각 규모별 파싱 시간 |

### 16.2 리포트 형식

| 형식 | 용도 |
|------|------|
| Console 출력 | 로컬 개발 |
| HTML 리포트 | 상세 분석 |
| JSON 리포트 | CI/CD 통합 |

---

## 17. 테스트 유지보수

### 17.1 테스트 업데이트 가이드

| 변경 사항 | 테스트 업데이트 |
|----------|---------------|
| 새 속성 추가 | parseNodeAttributes 테스트에 케이스 추가 |
| 헤더 형식 변경 | parseNodeHeader 테스트 수정 |
| 진행률 계산 방식 변경 | calculateProgress 테스트 수정 |
| 성능 목표 변경 | 성능 테스트 목표값 수정 |

### 17.2 테스트 리팩토링

| 대상 | 리팩토링 방법 |
|------|-------------|
| 중복 테스트 데이터 | 테스트 빌더 함수로 추출 |
| 반복되는 Assertion | 커스텀 Matcher 작성 |
| 긴 테스트 케이스 | 헬퍼 함수로 분리 |

---

## 18. 수용 기준 검증 매핑

| AC ID | 수용 기준 | 검증 테스트 | 통과 조건 |
|-------|----------|-----------|----------|
| AC-001 | wbs.md → WbsNode[] 변환 | TC-005-001 | 실제 wbs.md 정상 파싱 |
| AC-002 | 4단계 구조 파싱 | TC-003-001, TC-005-004 | 트리 구조 정확 |
| AC-003 | 3단계 구조 파싱 | TC-003-002, TC-005-003 | 트리 구조 정확 |
| AC-004 | 모든 속성 추출 | TC-002-001 ~ TC-002-009 | 9개 속성 모두 정상 |
| AC-005 | 진행률 계산 | TC-004-001 ~ TC-004-005 | 계산 정확 |
| AC-006 | 오류 형식 무시 | TC-005-006, TC-007 | 계속 파싱, 로그 기록 |
| AC-007 | 성능 목표 | TC-006-003 | 1000 노드 < 500ms |
| AC-008 | 고아 노드 처리 | TC-003-006, TC-005-007 | 루트 추가, 경고 |
| AC-009 | 빈 파일 처리 | TC-005-002 | 빈 배열 반환 |
| AC-010 | TypeScript 타입 안전성 | - | 컴파일 에러 없음 |

---

## 19. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 기본설계 | 010-basic-design.md | 요구사항 참조 |
| 상세설계 | 020-detail-design.md | 설계 상세 참조 |
| 추적성 매트릭스 | 025-traceability-matrix.md | 요구사항 추적 |

---

## 20. 테스트 체크리스트

### 20.1 테스트 작성 완료 체크리스트

| 항목 | 상태 | 담당자 | 완료일 |
|------|------|--------|--------|
| parseNodeHeader 테스트 (10개) | ☐ | - | - |
| parseNodeAttributes 테스트 (15개) | ☐ | - | - |
| buildTree 테스트 (6개) | ☐ | - | - |
| calculateProgress 테스트 (5개) | ☐ | - | - |
| parseWbsMarkdown 통합 테스트 (8개) | ☐ | - | - |
| 성능 테스트 (3개) | ☐ | - | - |
| 에러 처리 테스트 (7개) | ☐ | - | - |
| 테스트 픽스처 파일 생성 | ☐ | - | - |

### 20.2 테스트 실행 완료 체크리스트

| 항목 | 상태 | 결과 | 실행일 |
|------|------|------|--------|
| 로컬 테스트 실행 | ☐ | - | - |
| CI/CD 테스트 통과 | ☐ | - | - |
| 코드 커버리지 확인 | ☐ | - | - |
| 성능 벤치마크 검증 | ☐ | - | - |
| 수용 기준 검증 완료 | ☐ | - | - |

---

**문서 종료**
