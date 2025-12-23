# 테스트 명세: wbs.md 시리얼라이저 구현

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-02 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-13 |
| 관련 문서 | 020-detail-design.md, 025-traceability-matrix.md |

---

## 1. 개요

### 1.1 목적
TSK-02-02-02 wbs.md 시리얼라이저 구현의 테스트 전략과 상세 테스트 시나리오를 정의합니다. 이 문서를 기반으로 개발자는 Vitest를 사용하여 실제 테스트 코드를 작성합니다.

### 1.2 테스트 범위
- 단위 테스트: 개별 함수 및 메서드
- 통합 테스트: 시리얼라이저 전체 흐름
- 엣지 케이스: 예외 상황 및 경계 조건
- Round-trip 테스트: 파서와의 상호 운용성

### 1.3 테스트 환경
| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 | Vitest |
| Node.js 버전 | 20.x |
| TypeScript 버전 | 5.6.x |
| 커버리지 도구 | Vitest coverage (c8) |
| 커버리지 목표 | 95% 이상 |

---

## 2. 테스트 전략

### 2.1 테스트 레벨

| 레벨 | 목적 | 비율 | 실행 빈도 |
|------|------|------|----------|
| 단위 테스트 | 개별 함수 검증 | 70% | 매 커밋 |
| 통합 테스트 | 컴포넌트 간 상호작용 | 25% | 매 커밋 |
| E2E 테스트 | 전체 시스템 검증 | 5% | 배포 전 |

### 2.2 테스트 우선순위

| 우선순위 | 대상 | 이유 |
|---------|------|------|
| P0 (필수) | serializeWbs, serializeNode, Round-trip | 핵심 기능, 데이터 무결성 |
| P1 (높음) | serializeHeader, serializeAttributes | 주요 변환 로직 |
| P2 (중간) | buildMetadataBlock, calculateMaxDepth | 보조 기능 |
| P3 (낮음) | 에러 메시지, 경고 로그 | 사용성 개선 |

### 2.3 테스트 자동화

| 단계 | 도구 | 트리거 |
|------|------|--------|
| 로컬 테스트 | Vitest | `npm test` |
| Pre-commit | Husky | Git commit 시 |
| CI/CD | GitHub Actions | Push/PR 시 |

---

## 3. 단위 테스트 명세

### 3.1 HeaderSerializer 테스트

#### UT-001: WP 노드 헤더 생성

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-001 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001, BR-001 |
| 우선순위 | P1 |

**테스트 시나리오**:
WP 타입 노드를 입력하면 `## WP-XX: {title}` 형식의 헤더를 반환한다.

**입력**:
- node: { id: "WP-01", type: "wp", title: "Infrastructure" }
- context: { maxDepth: 4, currentDepth: 1, wpCount: 0 }

**예상 출력**:
`## WP-01: Infrastructure`

**검증 항목**:
- 헤더 레벨이 `##`인지 확인
- ID와 제목이 올바르게 포함되었는지 확인
- 콜론(`:`) 뒤에 공백이 있는지 확인

---

#### UT-002: ACT 노드 헤더 생성

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-002 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001, BR-001 |
| 우선순위 | P1 |

**테스트 시나리오**:
ACT 타입 노드를 입력하면 `### ACT-XX-XX: {title}` 형식의 헤더를 반환한다.

**입력**:
- node: { id: "ACT-01-01", type: "act", title: "Project Setup" }
- context: { maxDepth: 4, currentDepth: 2, wpCount: 1 }

**예상 출력**:
`### ACT-01-01: Project Setup`

**검증 항목**:
- 헤더 레벨이 `###`인지 확인
- ACT ID 형식(`ACT-XX-XX`)이 유지되는지 확인

---

#### UT-003: Task 노드 헤더 생성 (4단계)

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-003 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001, BR-001 |
| 우선순위 | P0 |

**테스트 시나리오**:
4단계 구조에서 Task 타입 노드를 입력하면 `#### TSK-XX-XX-XX: {title}` 형식의 헤더를 반환한다.

**입력**:
- node: { id: "TSK-01-01-01", type: "task", title: "Nuxt Setup" }
- context: { maxDepth: 4, currentDepth: 3, wpCount: 1 }

**예상 출력**:
`#### TSK-01-01-01: Nuxt Setup`

**검증 항목**:
- 헤더 레벨이 `####`인지 확인
- maxDepth가 4일 때만 `####`를 사용하는지 확인

---

#### UT-004: Task 노드 헤더 생성 (3단계)

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-004 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001, BR-002 |
| 우선순위 | P0 |

**테스트 시나리오**:
3단계 구조에서 Task 타입 노드를 입력하면 `### TSK-XX-XX: {title}` 형식의 헤더를 반환한다.

**입력**:
- node: { id: "TSK-02-01", type: "task", title: "Kanban Component" }
- context: { maxDepth: 3, currentDepth: 2, wpCount: 1 }

**예상 출력**:
`### TSK-02-01: Kanban Component`

**검증 항목**:
- 헤더 레벨이 `###`인지 확인
- maxDepth가 3일 때 `###`를 사용하는지 확인

---

#### UT-005: Project 노드 헤더 생성

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-005 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001 |
| 우선순위 | P2 |

**테스트 시나리오**:
Project 타입 노드를 입력하면 `# WBS - {title}` 형식의 헤더를 반환한다.

**입력**:
- node: { id: "jjiban", type: "project", title: "jjiban (1차: WBS 트리 뷰)" }
- context: { maxDepth: 4, currentDepth: 0, wpCount: 0 }

**예상 출력**:
`# WBS - jjiban (1차: WBS 트리 뷰)`

**검증 항목**:
- 헤더 레벨이 `#`인지 확인
- "WBS - " 접두사가 있는지 확인

---

#### UT-006: 잘못된 노드 타입 처리

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-006 |
| 테스트 대상 | serializeHeader |
| 관련 요구사항 | FR-001 |
| 우선순위 | P2 |

**테스트 시나리오**:
잘못된 노드 타입을 입력하면 기본 헤더 레벨(`##`)을 반환한다.

**입력**:
- node: { id: "INVALID", type: "unknown", title: "Invalid Node" }
- context: { maxDepth: 4, currentDepth: 1, wpCount: 0 }

**예상 출력**:
`## INVALID: Invalid Node`

**검증 항목**:
- 예외를 던지지 않고 기본값을 반환하는지 확인
- 경고 로그가 출력되는지 확인

---

### 3.2 AttributeSerializer 테스트

#### UT-007: category 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-007 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P1 |

**테스트 시나리오**:
category 속성이 있는 노드를 입력하면 `- category: {value}` 형식을 반환한다.

**입력**:
- node: { category: "development" }

**예상 출력**:
```
["- category: development"]
```

**검증 항목**:
- 라인이 `- category: `로 시작하는지 확인
- 값이 올바르게 포함되었는지 확인

---

#### UT-008: status 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-008 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002, BR-003 |
| 우선순위 | P0 |

**테스트 시나리오**:
status 속성이 있는 노드를 입력하면 `- status: {value}` 형식을 그대로 유지한다.

**입력**:
- node: { status: "todo [ ]" }

**예상 출력**:
```
["- status: todo [ ]"]
```

**검증 항목**:
- 상태 형식이 그대로 유지되는지 확인
- `[` 문자가 이스케이프되지 않는지 확인

---

#### UT-009: priority 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-009 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P1 |

**테스트 시나리오**:
priority 속성이 있는 노드를 입력하면 `- priority: {value}` 형식을 반환한다.

**입력**:
- node: { priority: "high" }

**예상 출력**:
```
["- priority: high"]
```

---

#### UT-010: schedule 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-010 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P1 |

**테스트 시나리오**:
schedule 속성이 있는 노드를 입력하면 `- schedule: {start} ~ {end}` 형식을 반환한다.

**입력**:
- node: { schedule: { start: "2025-12-13", end: "2025-12-20" } }

**예상 출력**:
```
["- schedule: 2025-12-13 ~ 2025-12-20"]
```

**검증 항목**:
- start와 end가 `~`로 연결되는지 확인
- 날짜 형식이 유지되는지 확인

---

#### UT-011: tags 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-011 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P2 |

**테스트 시나리오**:
tags 배열이 있는 노드를 입력하면 `- tags: {tag1}, {tag2}` 형식을 반환한다.

**입력**:
- node: { tags: ["nuxt", "setup", "typescript"] }

**예상 출력**:
```
["- tags: nuxt, setup, typescript"]
```

**검증 항목**:
- 태그들이 쉼표로 구분되는지 확인
- 배열 순서가 유지되는지 확인

---

#### UT-012: depends 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-012 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P2 |

**테스트 시나리오**:
depends 속성이 있는 노드를 입력하면 `- depends: {taskId}` 형식을 반환한다.

**입력**:
- node: { depends: "TSK-01-01-01" }

**예상 출력**:
```
["- depends: TSK-01-01-01"]
```

---

#### UT-013: requirements 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-013 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P1 |

**테스트 시나리오**:
requirements 배열이 있는 노드를 입력하면 하위 목록 형식으로 반환한다.

**입력**:
- node: { requirements: ["Nuxt 3 설치", "TypeScript 설정", "Standalone 모드"] }

**예상 출력**:
```
[
  "- requirements:",
  "  - Nuxt 3 설치",
  "  - TypeScript 설정",
  "  - Standalone 모드"
]
```

**검증 항목**:
- 첫 줄이 `- requirements:`인지 확인
- 하위 항목이 2칸 들여쓰기되는지 확인

---

#### UT-014: ref 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-014 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P2 |

**테스트 시나리오**:
ref 속성이 있는 노드를 입력하면 `- ref: {value}` 형식을 반환한다.

**입력**:
- node: { ref: "PRD 7.2" }

**예상 출력**:
```
["- ref: PRD 7.2"]
```

---

#### UT-015: progress 속성 포맷팅

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-015 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002 |
| 우선순위 | P2 |

**테스트 시나리오**:
WP 또는 ACT 타입이고 progress가 있으면 `- progress: {value}%` 형식을 반환한다.

**입력**:
- node: { type: "wp", progress: 50 }

**예상 출력**:
```
["- progress: 50%"]
```

**검증 항목**:
- `%` 기호가 포함되는지 확인
- Task 타입에서는 출력되지 않는지 확인

---

#### UT-016: 빈 값 속성 처리

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-016 |
| 테스트 대상 | serializeAttributes |
| 관련 요구사항 | FR-002, BR-004 |
| 우선순위 | P1 |

**테스트 시나리오**:
빈 값을 가진 속성들은 출력하지 않는다.

**입력**:
- node: { assignee: "", tags: [], depends: null, requirements: undefined }

**예상 출력**:
```
[]
```

**검증 항목**:
- 빈 문자열, null, undefined, 빈 배열이 출력되지 않는지 확인
- 반환 배열이 비어있는지 확인

---

### 3.3 TreeTraverser 테스트

#### UT-017: 단일 노드 직렬화

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-017 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | FR-003 |
| 우선순위 | P0 |

**테스트 시나리오**:
자식이 없는 단일 노드를 입력하면 헤더와 속성만 출력한다.

**입력**:
- node: { id: "WP-01", type: "wp", title: "Infrastructure", status: "planned", children: [] }
- context: { maxDepth: 4, currentDepth: 1, wpCount: 0 }

**예상 출력**:
```
## WP-01: Infrastructure
- status: planned
```

**검증 항목**:
- 헤더가 첫 줄에 있는지 확인
- 속성 라인들이 이어지는지 확인
- 불필요한 빈 줄이 없는지 확인

---

#### UT-018: 하위 노드 포함 직렬화

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-018 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | FR-003 |
| 우선순위 | P0 |

**테스트 시나리오**:
하위 노드가 있는 노드를 입력하면 재귀적으로 모든 노드를 출력한다.

**입력**:
- node: WP → ACT → TSK 구조

**예상 출력**:
```
## WP-01: Infrastructure
- status: planned

### ACT-01-01: Project Setup
- status: todo

#### TSK-01-01-01: Nuxt Setup
- category: infrastructure
- status: todo [ ]
```

**검증 항목**:
- 계층 구조가 올바른지 확인
- 각 노드가 출력되는지 확인
- 순서가 children 배열 순서와 일치하는지 확인

---

#### UT-019: 깊이 추적

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-019 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | FR-003 |
| 우선순위 | P1 |

**테스트 시나리오**:
노드 처리 시 context.currentDepth가 올바르게 증가/감소한다.

**입력**:
- 3단계 트리 구조

**예상 동작**:
- WP 진입: depth = 1
- ACT 진입: depth = 2
- TSK 진입: depth = 3
- TSK 종료: depth = 2
- ACT 종료: depth = 1

**검증 항목**:
- 각 재귀 호출 시 depth 증가 확인
- 재귀 반환 시 depth 감소 확인

---

#### UT-020: 재귀 깊이 초과

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-020 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | FR-003 |
| 우선순위 | P1 |

**테스트 시나리오**:
재귀 깊이가 10을 초과하면 SerializationError를 던진다.

**입력**:
- 11단계 깊이의 트리 (인위적으로 생성)

**예상 결과**:
SerializationError: "Maximum recursion depth exceeded"

**검증 항목**:
- 예외가 던져지는지 확인
- 에러 메시지가 올바른지 확인

---

#### UT-021: WP 구분선 삽입

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-021 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | FR-004 |
| 우선순위 | P1 |

**테스트 시나리오**:
두 번째 WP부터 `---` 구분선이 삽입된다.

**입력**:
- WP-01, WP-02, WP-03 노드 배열

**예상 출력**:
```
## WP-01: Infrastructure
...

---

## WP-02: Data Storage
...

---

## WP-03: Backend API
...
```

**검증 항목**:
- 첫 번째 WP 앞에는 구분선이 없는지 확인
- 두 번째 WP부터 구분선이 있는지 확인
- 구분선 형식이 `---\n\n`인지 확인

---

#### UT-022: 노드 순서 유지

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-022 |
| 테스트 대상 | serializeNode |
| 관련 요구사항 | BR-005 |
| 우선순위 | P0 |

**테스트 시나리오**:
children 배열의 순서가 출력 순서와 일치한다.

**입력**:
- children: [TSK-01, TSK-02, TSK-03]

**예상 출력**:
TSK-01 → TSK-02 → TSK-03 순서로 출력

**검증 항목**:
- 출력된 노드 ID 순서 확인
- 배열 순서가 변경되지 않았는지 확인

---

### 3.4 MetadataBuilder 테스트

#### UT-023: 메타데이터 블록 생성

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-023 |
| 테스트 대상 | buildMetadataBlock |
| 관련 요구사항 | FR-003 |
| 우선순위 | P2 |

**테스트 시나리오**:
WbsMetadata를 입력하면 올바른 형식의 메타데이터 블록을 반환한다.

**입력**:
- metadata: { version: "1.0", depth: 4, updated: "2025-12-13", start: "2025-12-13" }

**예상 출력**:
```
> version: 1.0
> depth: 4
> updated: 2025-12-13
> start: 2025-12-13
```

**검증 항목**:
- 각 라인이 `> `로 시작하는지 확인
- 모든 필드가 포함되었는지 확인

---

#### UT-024: 최대 깊이 계산

| 항목 | 내용 |
|------|------|
| 테스트 ID | UT-024 |
| 테스트 대상 | calculateMaxDepth |
| 관련 요구사항 | BR-002 |
| 우선순위 | P1 |

**테스트 시나리오**:
트리에 ACT 노드가 있으면 4를 반환하고, 없으면 3을 반환한다.

**입력 케이스 1**:
- nodes: WP → ACT → TSK

**예상 출력 1**: 4

**입력 케이스 2**:
- nodes: WP → TSK

**예상 출력 2**: 3

**검증 항목**:
- ACT 노드 존재 시 4 반환
- ACT 노드 없고 TSK만 있으면 3 반환

---

## 4. 통합 테스트 명세

### 4.1 INT-001: 4단계 구조 직렬화

| 항목 | 내용 |
|------|------|
| 테스트 ID | INT-001 |
| 테스트 시나리오 | 4단계 WBS 구조를 완전히 직렬화 |
| 관련 요구사항 | FR-001, FR-003, BR-001 |
| 우선순위 | P0 |

**입력**:
```
WbsNode[] 트리:
- WP-01: Infrastructure
  - ACT-01-01: Project Setup
    - TSK-01-01-01: Nuxt Setup
    - TSK-01-01-02: PrimeVue Setup
  - ACT-01-02: App Layout
    - TSK-01-02-01: AppLayout Component
```

**예상 출력**:
```markdown
# WBS - jjiban

> version: 1.0
> depth: 4
> updated: 2025-12-13
> start: 2025-12-13

---

## WP-01: Infrastructure
- status: planned
- priority: critical

### ACT-01-01: Project Setup
- status: todo

#### TSK-01-01-01: Nuxt Setup
- category: infrastructure
- status: done [xx]
- priority: critical

#### TSK-01-01-02: PrimeVue Setup
- category: infrastructure
- status: done [xx]
- priority: critical

### ACT-01-02: App Layout
- status: todo

#### TSK-01-02-01: AppLayout Component
- category: development
- status: done [xx]
```

**검증 항목**:
- 헤더 레벨: ##/###/####
- 모든 노드가 출력되었는지 확인
- 계층 구조가 올바른지 확인
- 속성이 정상 출력되었는지 확인

---

### 4.2 INT-002: 3단계 구조 직렬화

| 항목 | 내용 |
|------|------|
| 테스트 ID | INT-002 |
| 테스트 시나리오 | 3단계 WBS 구조를 직렬화 (ACT 없음) |
| 관련 요구사항 | FR-001, BR-002 |
| 우선순위 | P0 |

**입력**:
```
WbsNode[] 트리:
- WP-02: Data Storage Layer
  - TSK-02-01: File System Service
  - TSK-02-02: WBS Parser
```

**예상 출력**:
```markdown
## WP-02: Data Storage Layer
- status: planned

### TSK-02-01: File System Service
- category: infrastructure
- status: todo [ ]

### TSK-02-02: WBS Parser
- category: development
- status: basic-design [bd]
```

**검증 항목**:
- TSK 헤더 레벨이 `###`인지 확인
- ACT 노드 없이 WP → TSK 직접 연결 확인
- depth가 3으로 설정되었는지 확인

---

### 4.3 INT-003: Round-trip 테스트

| 항목 | 내용 |
|------|------|
| 테스트 ID | INT-003 |
| 테스트 시나리오 | 시리얼라이저 → 파서 → 시리얼라이저 데이터 일치 |
| 관련 요구사항 | 전체 |
| 우선순위 | P0 |

**테스트 절차**:
1. 원본 WbsNode[] 트리 준비
2. serializeWbs()로 Markdown 생성
3. parseWbsMarkdown()로 다시 WbsNode[]로 변환
4. 두 번째 serializeWbs() 실행
5. 1단계와 3단계 출력 비교

**예상 결과**:
첫 번째 Markdown과 두 번째 Markdown이 완전히 일치

**검증 항목**:
- 모든 노드 ID 일치
- 모든 속성 값 일치
- 계층 구조 일치
- 노드 순서 일치

---

### 4.4 INT-004: 모든 속성 포함 테스트

| 항목 | 내용 |
|------|------|
| 테스트 ID | INT-004 |
| 테스트 시나리오 | 모든 속성이 채워진 노드 직렬화 |
| 관련 요구사항 | FR-002 |
| 우선순위 | P1 |

**입력**:
```
node: {
  id: "TSK-01-01-01",
  type: "task",
  title: "Complete Task",
  category: "development",
  status: "in-progress [im]",
  priority: "high",
  assignee: "developer-1",
  schedule: { start: "2025-12-13", end: "2025-12-20" },
  tags: ["backend", "api", "test"],
  depends: "TSK-01-01-00",
  requirements: ["Req 1", "Req 2", "Req 3"],
  ref: "PRD 8.1"
}
```

**예상 출력**:
```markdown
#### TSK-01-01-01: Complete Task
- category: development
- status: in-progress [im]
- priority: high
- assignee: developer-1
- schedule: 2025-12-13 ~ 2025-12-20
- tags: backend, api, test
- depends: TSK-01-01-00
- requirements:
  - Req 1
  - Req 2
  - Req 3
- ref: PRD 8.1
```

**검증 항목**:
- 모든 속성이 출력되었는지 확인
- 속성 순서가 정의된 순서와 일치하는지 확인

---

### 4.5 INT-005: 빈 속성 처리 테스트

| 항목 | 내용 |
|------|------|
| 테스트 ID | INT-005 |
| 테스트 시나리오 | 필수 속성만 있는 노드 직렬화 |
| 관련 요구사항 | BR-004 |
| 우선순위 | P1 |

**입력**:
```
node: {
  id: "TSK-02-01-01",
  type: "task",
  title: "Minimal Task",
  category: "infrastructure",
  status: "todo [ ]",
  priority: "medium",
  assignee: undefined,
  tags: [],
  requirements: []
}
```

**예상 출력**:
```markdown
#### TSK-02-01-01: Minimal Task
- category: infrastructure
- status: todo [ ]
- priority: medium
```

**검증 항목**:
- assignee, tags, requirements가 출력되지 않는지 확인
- 필수 속성만 출력되었는지 확인

---

## 5. 엣지 케이스 테스트

### 5.1 EDGE-001: 빈 트리

| 항목 | 내용 |
|------|------|
| 테스트 ID | EDGE-001 |
| 테스트 시나리오 | 빈 WbsNode[] 배열 입력 |
| 우선순위 | P2 |

**입력**:
- nodes: []
- metadata: { version: "1.0", depth: 4, updated: "2025-12-13" }

**예상 출력**:
```markdown
> version: 1.0
> depth: 4
> updated: 2025-12-13
```

**검증 항목**:
- 메타데이터만 출력되는지 확인
- 에러가 발생하지 않는지 확인

---

### 5.2 EDGE-002: 단일 WP 노드

| 항목 | 내용 |
|------|------|
| 테스트 ID | EDGE-002 |
| 테스트 시나리오 | WP 1개만 있는 트리 |
| 우선순위 | P2 |

**입력**:
- nodes: [{ id: "WP-01", type: "wp", title: "Solo", children: [] }]

**예상 출력**:
```markdown
## WP-01: Solo
```

**검증 항목**:
- 구분선이 없는지 확인
- 정상 출력되는지 확인

---

### 5.3 EDGE-003: 매우 깊은 트리 (9단계)

| 항목 | 내용 |
|------|------|
| 테스트 ID | EDGE-003 |
| 테스트 시나리오 | 9단계 깊이 트리 |
| 우선순위 | P2 |

**입력**:
- 9단계 깊이의 트리 (정상 범위)

**예상 결과**:
정상 출력

**검증 항목**:
- 에러 없이 출력되는지 확인
- 모든 노드가 포함되는지 확인

---

### 5.4 EDGE-004: 매우 깊은 트리 (11단계)

| 항목 | 내용 |
|------|------|
| 테스트 ID | EDGE-004 |
| 테스트 시나리오 | 11단계 깊이 트리 (재귀 제한 초과) |
| 우선순위 | P1 |

**입력**:
- 11단계 깊이의 트리

**예상 결과**:
SerializationError: "Maximum recursion depth exceeded"

**검증 항목**:
- 예외가 던져지는지 확인
- 시스템이 크래시하지 않는지 확인

---

### 5.5 EDGE-005: 특수 문자 포함

| 항목 | 내용 |
|------|------|
| 테스트 ID | EDGE-005 |
| 테스트 시나리오 | 제목에 특수 문자(`#`, `-`, `>`) 포함 |
| 우선순위 | P2 |

**입력**:
- node: { id: "TSK-01", type: "task", title: "Fix #123: Update > Settings" }

**예상 출력**:
```markdown
### TSK-01: Fix #123: Update > Settings
```

**검증 항목**:
- 특수 문자가 그대로 유지되는지 확인
- 마크다운 문법 충돌이 없는지 확인

---

## 6. 성능 테스트

### 6.1 PERF-001: 100개 노드 처리 시간

| 항목 | 내용 |
|------|------|
| 테스트 ID | PERF-001 |
| 테스트 목표 | 100개 노드 < 100ms |
| 우선순위 | P2 |

**측정 방법**:
```
start = performance.now()
serializeWbs(nodes, metadata)
end = performance.now()
duration = end - start
ASSERT duration < 100
```

---

### 6.2 PERF-002: 메모리 사용량

| 항목 | 내용 |
|------|------|
| 테스트 ID | PERF-002 |
| 테스트 목표 | 입력 크기의 3배 이하 |
| 우선순위 | P3 |

**측정 방법**:
Node.js의 `process.memoryUsage()` 사용

---

## 7. 테스트 실행 계획

### 7.1 테스트 실행 순서

1. **단계 1**: 단위 테스트 (UT-001 ~ UT-024)
2. **단계 2**: 통합 테스트 (INT-001 ~ INT-005)
3. **단계 3**: 엣지 케이스 (EDGE-001 ~ EDGE-005)
4. **단계 4**: 성능 테스트 (PERF-001 ~ PERF-002)

### 7.2 테스트 명령어

| 명령어 | 설명 |
|--------|------|
| `npm test` | 모든 테스트 실행 |
| `npm test -- --coverage` | 커버리지 측정 |
| `npm test -- --watch` | 감시 모드 |
| `npm test -- serializer` | 시리얼라이저만 테스트 |

### 7.3 성공 기준

| 항목 | 기준 |
|------|------|
| 테스트 통과율 | 100% |
| 코드 커버리지 | 95% 이상 |
| P0 테스트 | 100% 통과 필수 |
| P1 테스트 | 100% 통과 필수 |
| P2 테스트 | 90% 이상 통과 |

---

## 8. 테스트 데이터

### 8.1 테스트 픽스처

테스트에 사용할 고정 데이터는 별도 파일로 관리:

| 파일명 | 내용 |
|--------|------|
| `fixtures/wbs-4level.ts` | 4단계 구조 샘플 데이터 |
| `fixtures/wbs-3level.ts` | 3단계 구조 샘플 데이터 |
| `fixtures/wbs-full-attributes.ts` | 모든 속성 포함 데이터 |
| `fixtures/wbs-minimal.ts` | 최소 속성 데이터 |

---

## 9. 테스트 리포팅

### 9.1 리포트 형식

| 형식 | 용도 |
|------|------|
| HTML | 로컬 개발자 확인 |
| JSON | CI/CD 파싱 |
| JUnit XML | Jenkins 연동 |

### 9.2 실패 시 조치

| 실패 유형 | 조치 |
|----------|------|
| P0 실패 | 즉시 수정, 다른 작업 중단 |
| P1 실패 | 당일 내 수정 |
| P2 실패 | 스프린트 내 수정 |
| 성능 실패 | 최적화 작업 스케줄링 |

---

## 10. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-12-13 | 최초 작성 | Claude |

---

## 관련 문서
- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
