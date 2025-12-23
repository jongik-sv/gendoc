# 추적성 매트릭스: wbs.md 시리얼라이저 구현

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-02 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-13 |
| 관련 문서 | 020-detail-design.md |

---

## 1. 개요

### 1.1 목적
이 문서는 TSK-02-02-02의 요구사항, 설계, 구현, 테스트 간의 추적성을 제공합니다. 각 요구사항이 어떻게 설계되고, 구현되고, 테스트되는지 명확히 추적할 수 있습니다.

### 1.2 추적 범위
- 기본설계 요구사항 → 상세설계
- 상세설계 → 구현 컴포넌트
- 구현 컴포넌트 → 테스트 케이스
- PRD 섹션 → 기능 요구사항

---

## 2. PRD → 기능 요구사항 추적

| PRD 섹션 | PRD 내용 | 기능 요구사항 ID | 기본설계 섹션 |
|----------|----------|-----------------|-------------|
| 7.2 | wbs.md 형식 정의 | FR-001, FR-002, FR-004 | 3.1, 3.2, 3.4 |
| 7.3 | wbs.md 문법 규칙 | FR-001, FR-003 | 3.1, 3.3 |
| 7.4 | Task 속성 정의 | FR-002 | 3.2 |
| 8.2 | WbsNode 인터페이스 | (입력 타입) | 5.1 |

---

## 3. 기능 요구사항 추적

### 3.1 FR-001: 헤더 생성

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 3.1 헤더 생성 |
| 상세설계 | 5.1 헤더 생성 알고리즘 |
| 비즈니스 규칙 | BR-001, BR-002 |
| 구현 컴포넌트 | HeaderSerializer.serializeHeader |
| 테스트 케이스 | UT-001 ~ UT-006 |
| 수용 기준 | 4단계/3단계 구조 정상 출력 |

**요구사항 설명**:
노드 타입(wp, act, task)과 트리 깊이에 따라 올바른 마크다운 헤더 레벨(##, ###, ####)을 생성해야 함.

**설계 결정**:
- WP → `## WP-XX: {title}`
- ACT → `### ACT-XX-XX: {title}`
- Task (4단계) → `#### TSK-XX-XX-XX: {title}`
- Task (3단계) → `### TSK-XX-XX: {title}`

**구현 방법**:
serializeHeader 함수에서 node.type과 context.maxDepth를 기반으로 분기 처리

**검증 방법**:
6개의 단위 테스트로 각 노드 타입별 헤더 생성 확인

---

### 3.2 FR-002: 속성 포맷팅

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 3.2 속성 포맷팅 |
| 상세설계 | 5.2 속성 포맷팅 알고리즘 |
| 비즈니스 규칙 | BR-003, BR-004 |
| 구현 컴포넌트 | AttributeSerializer.serializeAttributes |
| 테스트 케이스 | UT-007 ~ UT-016 |
| 수용 기준 | 모든 속성 올바른 형식으로 출력 |

**요구사항 설명**:
노드의 속성들을 `- key: value` 형식의 마크다운 목록으로 포맷팅해야 함. 빈 값은 출력하지 않음.

**설계 결정**:
- 필수 속성: category, status, priority (값이 있을 때만)
- 선택 속성: assignee, schedule, tags, depends, requirements, ref
- requirements는 하위 목록으로 2칸 들여쓰기
- schedule은 `{start} ~ {end}` 형식

**구현 방법**:
serializeAttributes 함수에서 각 속성을 순차적으로 검사하고 조건부로 라인 추가

**검증 방법**:
10개의 단위 테스트로 각 속성별 포맷팅 및 빈 값 처리 확인

---

### 3.3 FR-003: 트리 순회 및 출력

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 3.3 트리 순회 및 출력 |
| 상세설계 | 5.3 트리 순회 알고리즘 |
| 비즈니스 규칙 | BR-005 |
| 구현 컴포넌트 | TreeTraverser.serializeNode |
| 테스트 케이스 | UT-017 ~ UT-024 |
| 수용 기준 | WbsNode[] 트리를 wbs.md로 변환 |

**요구사항 설명**:
WbsNode[] 트리를 깊이 우선 순회하며 각 노드를 마크다운으로 변환하고 전체 문서를 생성해야 함.

**설계 결정**:
- 깊이 우선 순회 (DFS)
- 노드 순서는 children 배열 순서 유지
- WP 사이에 `---` 구분선 삽입
- 재귀 깊이 제한 10단계

**구현 방법**:
serializeNode 함수에서 재귀적으로 children 처리, context로 깊이 추적

**검증 방법**:
8개의 단위 테스트로 순회 순서, 구분선 삽입, 재귀 깊이 확인

---

### 3.4 FR-004: 들여쓰기 및 공백 관리

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 3.4 들여쓰기 및 공백 관리 |
| 상세설계 | 5.3 트리 순회 알고리즘 |
| 비즈니스 규칙 | - |
| 구현 컴포넌트 | TreeTraverser.serializeNode |
| 테스트 케이스 | UT-021 ~ UT-024 |
| 수용 기준 | WP 사이 구분선 정상 삽입 |

**요구사항 설명**:
가독성을 위해 적절한 공백과 구분선을 삽입해야 함.

**설계 결정**:
- WP 사이에 `---\n\n` 구분선
- 헤더와 속성 사이 빈 줄 없음
- 노드 사이에 빈 줄 (`\n`)

**구현 방법**:
serializeNode에서 wpCount 추적하여 두 번째 WP부터 구분선 추가

**검증 방법**:
통합 테스트로 실제 wbs.md 출력 형식 검증

---

## 4. 비즈니스 규칙 추적

### 4.1 BR-001: 노드 타입에 따라 헤더 레벨 결정

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 4. 비즈니스 규칙 BR-001 |
| 상세설계 | 6.1 규칙 매핑 BR-001 |
| 적용 시점 | 헤더 생성 시 |
| 구현 위치 | serializeHeader 함수 |
| 테스트 케이스 | UT-001, UT-002, UT-003, UT-004 |
| 검증 방법 | 각 노드 타입별 헤더 레벨 확인 |

**규칙 내용**: wp → ##, act → ###, task → ####/###

**구현 로직**:
```
IF type = 'wp' THEN return '##'
IF type = 'act' THEN return '###'
IF type = 'task' AND maxDepth = 4 THEN return '####'
IF type = 'task' AND maxDepth = 3 THEN return '###'
```

---

### 4.2 BR-002: 3/4단계 구조에 따라 TSK 헤더 조정

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 4. 비즈니스 규칙 BR-002 |
| 상세설계 | 6.1 규칙 매핑 BR-002 |
| 적용 시점 | Task 헤더 생성 시 |
| 구현 위치 | serializeHeader 함수 |
| 테스트 케이스 | UT-005, UT-006, INT-001, INT-002 |
| 검증 방법 | maxDepth 기반 헤더 레벨 변경 확인 |

**규칙 내용**: 트리 전체의 최대 깊이를 계산하여 Task 헤더 레벨 결정

**구현 로직**:
```
maxDepth = calculateMaxDepth(nodes)
IF type = 'task' AND maxDepth = 4 THEN '####'
IF type = 'task' AND maxDepth = 3 THEN '###'
```

---

### 4.3 BR-003: 상태는 `{text} [{code}]` 형식 유지

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 4. 비즈니스 규칙 BR-003 |
| 상세설계 | 6.1 규칙 매핑 BR-003 |
| 적용 시점 | 상태 포맷팅 시 |
| 구현 위치 | serializeAttributes 함수 |
| 테스트 케이스 | UT-008 |
| 검증 방법 | status 값이 그대로 출력되는지 확인 |

**규칙 내용**: 파서가 생성한 상태 형식을 그대로 보존

**구현 로직**:
```
IF node.status exists
  THEN lines.push(`- status: ${node.status}`)
```

---

### 4.4 BR-004: 빈 값 속성은 출력하지 않음

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 4. 비즈니스 규칙 BR-004 |
| 상세설계 | 6.1 규칙 매핑 BR-004 |
| 적용 시점 | 속성 포맷팅 시 |
| 구현 위치 | serializeAttributes 함수 |
| 테스트 케이스 | UT-016, INT-005 |
| 검증 방법 | 빈 값 속성이 출력에 없는지 확인 |

**규칙 내용**: null, undefined, 빈 문자열, 빈 배열은 출력하지 않음

**구현 로직**:
```
IF node.assignee AND node.assignee !== ''
  THEN lines.push(`- assignee: ${node.assignee}`)
```

---

### 4.5 BR-005: 노드 순서 유지

| 추적 항목 | 내용 |
|----------|------|
| 기본설계 | 4. 비즈니스 규칙 BR-005 |
| 상세설계 | 6.1 규칙 매핑 BR-005 |
| 적용 시점 | 트리 순회 시 |
| 구현 위치 | serializeNode 함수 |
| 테스트 케이스 | UT-017, INT-003 |
| 검증 방법 | children 배열 순서와 출력 순서 일치 확인 |

**규칙 내용**: children 배열의 순서를 그대로 유지하여 출력

**구현 로직**:
```
FOR EACH child IN node.children
  output += serializeNode(child, context)
END FOR
```

---

## 5. 설계 → 구현 추적

### 5.1 컴포넌트 매핑

| 설계 컴포넌트 | 구현 파일 | 주요 메서드 | 테스트 파일 |
|-------------|----------|-----------|------------|
| WbsSerializer | server/utils/wbs/serializer.ts | serializeWbs | serializer.test.ts |
| HeaderSerializer | server/utils/wbs/serializer/header.ts | serializeHeader | header.test.ts |
| AttributeSerializer | server/utils/wbs/serializer/attributes.ts | serializeAttributes | attributes.test.ts |
| TreeTraverser | server/utils/wbs/serializer.ts | serializeNode | traverser.test.ts |
| MetadataBuilder | server/utils/wbs/serializer/metadata.ts | buildMetadataBlock | metadata.test.ts |

### 5.2 메서드 매핑

| 설계 메서드 | 입력 파라미터 | 반환 타입 | 구현 파일 | 라인 범위 (예상) |
|-----------|-------------|----------|----------|----------------|
| serializeWbs | nodes, metadata | string | serializer.ts | 10-50 |
| serializeHeader | node, context | string | header.ts | 5-30 |
| serializeAttributes | node | string[] | attributes.ts | 5-80 |
| serializeNode | node, context | string | serializer.ts | 55-100 |
| buildMetadataBlock | metadata | string | metadata.ts | 5-25 |
| calculateMaxDepth | nodes | number | serializer.ts | 105-130 |

---

## 6. 구현 → 테스트 추적

### 6.1 단위 테스트 추적

| 테스트 ID | 테스트 대상 | 검증 내용 | 관련 요구사항 | 예상 결과 |
|----------|-----------|----------|--------------|----------|
| UT-001 | serializeHeader | WP 노드 헤더 | FR-001, BR-001 | `## WP-01: Title` |
| UT-002 | serializeHeader | ACT 노드 헤더 | FR-001, BR-001 | `### ACT-01-01: Title` |
| UT-003 | serializeHeader | Task 노드 (4단계) | FR-001, BR-001 | `#### TSK-01-01-01: Title` |
| UT-004 | serializeHeader | Task 노드 (3단계) | FR-001, BR-002 | `### TSK-01-01: Title` |
| UT-005 | serializeHeader | Project 노드 | FR-001 | `# WBS - Project Title` |
| UT-006 | serializeHeader | 잘못된 타입 | FR-001 | 기본 헤더 (`##`) |
| UT-007 | serializeAttributes | category 속성 | FR-002 | `- category: development` |
| UT-008 | serializeAttributes | status 속성 | FR-002, BR-003 | `- status: todo [ ]` |
| UT-009 | serializeAttributes | priority 속성 | FR-002 | `- priority: high` |
| UT-010 | serializeAttributes | schedule 속성 | FR-002 | `- schedule: 2025-01-01 ~ 2025-01-31` |
| UT-011 | serializeAttributes | tags 속성 | FR-002 | `- tags: tag1, tag2` |
| UT-012 | serializeAttributes | depends 속성 | FR-002 | `- depends: TSK-01-01` |
| UT-013 | serializeAttributes | requirements 속성 | FR-002 | 하위 목록 형식 |
| UT-014 | serializeAttributes | ref 속성 | FR-002 | `- ref: PRD 7.2` |
| UT-015 | serializeAttributes | progress 속성 | FR-002 | `- progress: 50%` |
| UT-016 | serializeAttributes | 빈 값 속성 | FR-002, BR-004 | 출력 없음 |
| UT-017 | serializeNode | 단일 노드 | FR-003 | 헤더 + 속성 |
| UT-018 | serializeNode | 하위 노드 포함 | FR-003 | 재귀적 출력 |
| UT-019 | serializeNode | 깊이 추적 | FR-003 | context.currentDepth 증가/감소 |
| UT-020 | serializeNode | 재귀 깊이 초과 | FR-003 | SerializationError |
| UT-021 | serializeNode | WP 구분선 | FR-004 | 두 번째 WP부터 `---` |
| UT-022 | serializeNode | 노드 순서 | BR-005 | children 순서 유지 |
| UT-023 | buildMetadataBlock | 메타데이터 생성 | FR-003 | 올바른 형식 |
| UT-024 | calculateMaxDepth | 깊이 계산 | BR-002 | 3 또는 4 |

### 6.2 통합 테스트 추적

| 테스트 ID | 시나리오 | 입력 | 검증 내용 | 관련 요구사항 |
|----------|---------|------|----------|--------------|
| INT-001 | 4단계 구조 직렬화 | WP → ACT → TSK 트리 | 헤더 레벨 ##/###/#### | FR-001, BR-001 |
| INT-002 | 3단계 구조 직렬화 | WP → TSK 트리 | TSK가 ### 레벨 | FR-001, BR-002 |
| INT-003 | Round-trip 테스트 | WbsNode[] | 파서로 재변환 시 동일 | 전체 |
| INT-004 | 모든 속성 포함 | 전체 속성 노드 | 모든 속성 출력 | FR-002 |
| INT-005 | 빈 속성 처리 | 필수만 있는 노드 | 선택 속성 없음 | BR-004 |

---

## 7. 테스트 → 수용 기준 추적

| 수용 기준 | 관련 테스트 | 통과 조건 |
|----------|-----------|----------|
| WbsNode[] 트리를 wbs.md 형식으로 변환 | UT-017~UT-022, INT-001~INT-005 | 모든 테스트 통과 |
| 4단계 구조 정상 출력 | UT-003, INT-001 | 헤더 레벨 ##/###/#### |
| 3단계 구조 정상 출력 | UT-004, INT-002 | TSK가 ### 레벨 |
| 모든 속성 올바른 형식 출력 | UT-007~UT-015, INT-004 | 각 속성 형식 일치 |
| 파서로 Round-trip 보장 | INT-003 | 데이터 손실 없음 |
| WP 사이 구분선 정상 삽입 | UT-021 | `---` 올바른 위치 |

---

## 8. 변경 영향 분석

### 8.1 요구사항 변경 시 영향 범위

| 변경 시나리오 | 영향받는 컴포넌트 | 영향받는 테스트 | 재작업 범위 |
|-------------|----------------|--------------|-----------|
| 새 속성 추가 | AttributeSerializer | UT-007~UT-016 | 속성 포맷팅 로직 수정 |
| 헤더 형식 변경 | HeaderSerializer | UT-001~UT-006 | 헤더 생성 로직 수정 |
| 5단계 구조 지원 | HeaderSerializer, calculateMaxDepth | UT-001~UT-006, UT-024 | 깊이 계산 로직 수정 |
| 구분선 규칙 변경 | TreeTraverser | UT-021 | 순회 로직 수정 |

### 8.2 테스트 실패 시 영향 분석

| 실패 테스트 | 원인 가능성 | 영향 범위 | 수정 우선순위 |
|-----------|-----------|----------|-------------|
| UT-003~UT-004 | 헤더 레벨 로직 오류 | 전체 출력 형식 | 높음 |
| UT-016 | 빈 값 처리 누락 | 불필요한 속성 출력 | 중간 |
| INT-003 | Round-trip 실패 | 데이터 손실 | 매우 높음 |
| UT-020 | 재귀 깊이 초과 | 무한 루프 위험 | 높음 |

---

## 9. 문서 간 참조

| 문서 | 섹션 | 참조 내용 |
|------|------|----------|
| PRD 7.2 | wbs.md 형식 | 마크다운 문법, 헤더 규칙 |
| PRD 7.3 | wbs.md 문법 규칙 | ID 패턴, 헤더 레벨 |
| PRD 7.4 | Task 속성 | 속성 목록, 필수/선택 구분 |
| PRD 8.2 | WbsNode 인터페이스 | 입력 데이터 타입 |
| 기본설계 3.1 | 헤더 생성 | 요구사항 정의 |
| 기본설계 3.2 | 속성 포맷팅 | 요구사항 정의 |
| 상세설계 5.1 | 헤더 생성 알고리즘 | 구현 로직 |
| 상세설계 5.2 | 속성 포맷팅 알고리즘 | 구현 로직 |
| 테스트 명세 3.1 | 단위 테스트 | 테스트 시나리오 |
| 테스트 명세 3.2 | 통합 테스트 | 테스트 시나리오 |

---

## 10. 커버리지 요약

### 10.1 요구사항 커버리지

| 요구사항 유형 | 총 개수 | 설계 커버 | 테스트 커버 | 커버리지 |
|-------------|---------|----------|-----------|---------|
| 기능 요구사항 | 4 | 4 | 4 | 100% |
| 비즈니스 규칙 | 5 | 5 | 5 | 100% |
| 인터페이스 | 6 | 6 | 6 | 100% |

### 10.2 테스트 커버리지

| 컴포넌트 | 단위 테스트 수 | 통합 테스트 수 | 예상 커버리지 |
|---------|--------------|--------------|-------------|
| HeaderSerializer | 6 | 2 | 100% |
| AttributeSerializer | 10 | 2 | 100% |
| TreeTraverser | 8 | 3 | 95% |
| MetadataBuilder | 4 | 1 | 100% |
| 전체 | 24 | 5 | 97% |

---

## 11. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-12-13 | 최초 작성 | Claude |

---

## 관련 문서
- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
