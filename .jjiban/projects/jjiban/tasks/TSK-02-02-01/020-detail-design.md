# 상세설계: wbs.md 파서 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-01 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 상위 Activity | ACT-02-02 (WBS Parser) |
| 상위 Work Package | WP-02 (Data Storage Layer) |
| 기본설계 참조 | 010-basic-design.md |
| PRD 참조 | PRD 7.2, 7.3, 7.4 |
| 작성일 | 2025-12-13 |

---

## 1. 상세설계 개요

### 1.1 목적

wbs.md 마크다운 파일의 텍스트 구조를 파싱하여 WbsNode[] 계층 트리로 변환하는 파서의 상세 설계를 정의합니다. 이 문서는 구현에 필요한 모든 기술적 세부사항, 알고리즘, 데이터 구조, 에러 처리 방법을 포함합니다.

### 1.2 설계 원칙

| 원칙 | 설명 | 적용 방법 |
|------|------|----------|
| 견고성 | 잘못된 형식에도 가능한 파싱 | try-catch, 기본값 제공, 무시 후 계속 |
| 확장성 | 새로운 속성 추가 용이 | 속성 파서 맵, 플러그인 구조 |
| 테스트 가능성 | 단위 테스트 작성 용이 | 순수 함수, 작은 단위 분리 |
| 성능 | 1000개 노드 기준 500ms 이하 | 1회 순회 파싱, 캐싱 |
| 유지보수성 | 읽기 쉬운 코드 | 명확한 함수명, 주석, 타입 안전성 |

### 1.3 아키텍처 개요

```
[wbs.md 파일]
      ↓
[텍스트 읽기]
      ↓
[라인별 스캔 파싱] ← parseWbsMarkdown (메인 함수)
      ├─→ [헤더 파싱] ← parseNodeHeader
      ├─→ [속성 파싱] ← parseNodeAttributes
      └─→ [플랫 노드 리스트]
             ↓
      [트리 구조 빌드] ← buildTree
             ↓
      [진행률 계산] ← calculateProgress
             ↓
      [WbsNode[] 트리]
```

---

## 2. 데이터 구조 설계

### 2.1 타입 정의 (참조)

기존 `types/index.ts`에 정의된 타입 사용:

| 타입 | 용도 | 파일 위치 |
|------|------|----------|
| WbsNode | 트리 노드 구조체 | types/index.ts |
| WbsNodeType | 노드 타입 열거형 | types/index.ts |
| TaskCategory | 카테고리 열거형 | types/index.ts |
| TaskStatus | 상태 코드 열거형 | types/index.ts |
| Priority | 우선순위 열거형 | types/index.ts |

### 2.2 내부 중간 데이터 구조

파싱 과정에서 사용하는 내부 데이터 구조:

| 구조체명 | 목적 | 필드 |
|---------|------|------|
| ParsedLine | 파싱된 라인 정보 | type (header/attribute/content), level (1-4), content (string) |
| NodeHeader | 파싱된 헤더 정보 | id (string), type (WbsNodeType), title (string), level (number) |
| NodeAttributes | 파싱된 속성 모음 | category, status, priority, assignee, schedule, tags, depends, requirements, ref |
| FlatNode | 플랫 노드 (트리 빌드 전) | id, type, title, level, attributes, parentId (임시) |

### 2.3 정규식 패턴

| 패턴명 | 정규식 | 용도 | 예시 매칭 |
|--------|--------|------|----------|
| HEADER_PATTERN | `/^(#{2,4})\s+(WP\|ACT\|TSK)-[\d-]+:\s*(.+)$/` | 헤더 라인 | `## WP-01: Platform` |
| WP_ID_PATTERN | `/^WP-\d{2}$/` | Work Package ID | `WP-01` |
| ACT_ID_PATTERN | `/^ACT-\d{2}-\d{2}$/` | Activity ID | `ACT-01-02` |
| TSK_3LEVEL_PATTERN | `/^TSK-\d{2}-\d{2}$/` | Task ID (3단계) | `TSK-01-02` |
| TSK_4LEVEL_PATTERN | `/^TSK-\d{2}-\d{2}-\d{2}$/` | Task ID (4단계) | `TSK-01-02-03` |
| STATUS_PATTERN | `/\[([^\]]+)\]$/` | 상태 코드 추출 | `done [xx]` → `[xx]` |
| SCHEDULE_PATTERN | `/^(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})$/` | 일정 범위 | `2025-12-01 ~ 2025-12-31` |
| ATTRIBUTE_PATTERN | `/^-\s+(\w+):\s*(.+)$/` | 속성 라인 | `- priority: high` |
| TAGS_PATTERN | `/^([^,]+(?:,\s*[^,]+)*)$/` | 태그 목록 | `parser, markdown, wbs` |

---

## 3. 함수 설계

### 3.1 메인 파서 함수

| 함수명 | parseWbsMarkdown |
|--------|------------------|
| **목적** | wbs.md 전체 텍스트를 WbsNode[] 트리로 변환 |
| **입력** | markdown: string (wbs.md 파일 내용) |
| **출력** | WbsNode[] (루트 노드 배열) |
| **시그니처** | `parseWbsMarkdown(markdown: string): WbsNode[]` |

**처리 흐름**:

| 단계 | 작업 | 호출 함수 | 에러 처리 |
|------|------|----------|----------|
| 1 | 텍스트를 라인 배열로 분할 | `markdown.split('\n')` | 빈 문자열 → 빈 배열 반환 |
| 2 | 메타데이터 섹션 스킵 | 라인 순회 | `---` 이전 라인 무시 |
| 3 | 각 라인을 순회하며 노드 파싱 | `parseNodeHeader`, `parseNodeAttributes` | 파싱 실패 시 해당 라인 스킵 |
| 4 | 플랫 노드 리스트 생성 | FlatNode[] 누적 | - |
| 5 | 트리 구조 빌드 | `buildTree` | 고아 노드는 루트에 추가 |
| 6 | 진행률 계산 | `calculateProgress` (재귀) | 0으로 기본값 |
| 7 | 결과 반환 | WbsNode[] | - |

**알고리즘**:

```
함수 parseWbsMarkdown(markdown):
    lines = markdown을 줄바꿈으로 분할
    flatNodes = []
    currentNode = null
    currentAttributes = []
    inMetadata = true

    각 line에 대해:
        if line == "---":
            inMetadata = false
            continue

        if inMetadata:
            continue

        if line이 헤더 패턴과 매칭:
            // 이전 노드가 있으면 저장
            if currentNode != null:
                currentNode.attributes = parseNodeAttributes(currentAttributes)
                flatNodes.push(currentNode)

            // 새 노드 시작
            header = parseNodeHeader(line)
            currentNode = FlatNode 생성 (header 기반)
            currentAttributes = []

        else if line이 속성 패턴과 매칭:
            currentAttributes.push(line)

        else if line이 요구사항 하위 항목 (들여쓰기 포함):
            currentAttributes의 마지막에 추가

    // 마지막 노드 저장
    if currentNode != null:
        currentNode.attributes = parseNodeAttributes(currentAttributes)
        flatNodes.push(currentNode)

    tree = buildTree(flatNodes)
    calculateProgress(tree) // 재귀적으로 진행률 계산

    return tree
```

**예외 상황**:

| 상황 | 처리 방법 |
|------|----------|
| 빈 파일 | 빈 배열 `[]` 반환 |
| 메타데이터만 있음 | 빈 배열 `[]` 반환 |
| 잘못된 헤더 형식 | 해당 라인 무시, 경고 로그 |
| 속성 없는 노드 | 기본값으로 속성 채움 |
| 불완전한 노드 | 수집된 정보만으로 노드 생성 |

---

### 3.2 헤더 파싱 함수

| 함수명 | parseNodeHeader |
|--------|-----------------|
| **목적** | 마크다운 헤더 라인에서 ID, 타입, 제목, 레벨 추출 |
| **입력** | line: string (헤더 라인) |
| **출력** | NodeHeader \| null |
| **시그니처** | `parseNodeHeader(line: string): NodeHeader \| null` |

**처리 흐름**:

| 단계 | 작업 | 예시 입력 | 예시 출력 |
|------|------|----------|----------|
| 1 | HEADER_PATTERN 매칭 | `## WP-01: Platform Infrastructure` | matches 배열 |
| 2 | 레벨 계산 (# 개수) | `##` | level = 2 |
| 3 | ID 추출 | `WP-01` | id = "WP-01" |
| 4 | 타입 결정 (ID 패턴 기반) | `WP-01` | type = "wp" |
| 5 | 제목 추출 | `Platform Infrastructure` | title = "Platform Infrastructure" |
| 6 | NodeHeader 객체 반환 | - | { id, type, title, level } |

**타입 결정 규칙**:

| ID 패턴 | 정규식 매칭 | WbsNodeType |
|---------|-------------|-------------|
| WP-XX | WP_ID_PATTERN | 'wp' |
| ACT-XX-XX | ACT_ID_PATTERN | 'act' |
| TSK-XX-XX | TSK_3LEVEL_PATTERN | 'task' |
| TSK-XX-XX-XX | TSK_4LEVEL_PATTERN | 'task' |
| 기타 | - | null (에러) |

**에러 처리**:

| 에러 상황 | 반환값 | 로그 |
|-----------|--------|------|
| 패턴 불일치 | null | "Invalid header format: {line}" |
| 알 수 없는 ID 형식 | null | "Unknown ID pattern: {id}" |
| 제목 없음 | null | "Missing title in header: {line}" |

---

### 3.3 속성 파싱 함수

| 함수명 | parseNodeAttributes |
|--------|---------------------|
| **목적** | 속성 라인 배열을 파싱하여 NodeAttributes 객체 생성 |
| **입력** | lines: string[] (속성 라인 배열) |
| **출력** | NodeAttributes |
| **시그니처** | `parseNodeAttributes(lines: string[]): NodeAttributes` |

**처리 흐름**:

| 단계 | 작업 | 처리 내용 |
|------|------|----------|
| 1 | 빈 NodeAttributes 객체 초기화 | 모든 필드 undefined |
| 2 | 각 라인을 순회 | ATTRIBUTE_PATTERN 매칭 |
| 3 | 속성 키-값 추출 | key, value 분리 |
| 4 | 속성별 전용 파서 호출 | parseCategory, parseStatus, parseSchedule 등 |
| 5 | 결과 객체에 값 할당 | attributes[key] = parsedValue |
| 6 | 완성된 객체 반환 | NodeAttributes |

**속성별 파싱 규칙**:

| 속성명 | 입력 형식 | 파싱 로직 | 출력 타입 | 기본값 |
|--------|----------|----------|----------|--------|
| category | `- category: development` | 값 추출 후 열거형 검증 | TaskCategory | undefined |
| status | `- status: todo [ ]` | STATUS_PATTERN으로 코드 추출 | TaskStatus | undefined |
| priority | `- priority: high` | 값 추출 후 열거형 검증 | Priority | undefined |
| assignee | `- assignee: hong` | 값 그대로 | string | undefined |
| schedule | `- schedule: 2025-12-01 ~ 2025-12-31` | SCHEDULE_PATTERN으로 start, end 추출 | { start, end } | undefined |
| tags | `- tags: parser, markdown` | 쉼표 분리 후 trim | string[] | [] |
| depends | `- depends: TSK-01-02` | 쉼표 분리 (복수 의존 지원) | string[] | [] |
| requirements | `- requirements:` + 하위 목록 | 다음 라인부터 들여쓰기 있는 라인 수집 | string[] | [] |
| ref | `- ref: PRD 7.2` | 값 그대로 | string | undefined |

**requirements 속성 특수 처리**:

```
알고리즘:
1. "- requirements:" 라인 발견
2. 다음 라인부터 시작
3. 들여쓰기(공백 또는 탭)로 시작하는 라인을 수집
   - 들여쓰기 패턴 정규식: /^(\s{2,}|\t+)-\s*(.+)$/
4. "-"로 시작하는 리스트 아이템의 경우 "-" 제거
5. 들여쓰기 없는 라인 또는 다른 속성 라인 발견 시 중단
6. 수집된 라인 배열을 requirements로 저장
```

**들여쓰기 파싱 정규식**:
| 패턴명 | 정규식 | 용도 | 예시 매칭 |
|--------|--------|------|----------|
| INDENT_LIST_PATTERN | `/^(\s{2,}|\t+)-\s*(.+)$/` | 들여쓰기 리스트 아이템 | `  - Nuxt 3 프로젝트 생성` |

**예시**:

```markdown
- requirements:
  - Nuxt 3 프로젝트 생성
  - TypeScript 설정
  - Standalone 모드 설정
```

→ `requirements: ["Nuxt 3 프로젝트 생성", "TypeScript 설정", "Standalone 모드 설정"]`

---

### 3.4 트리 빌드 함수

| 함수명 | buildTree |
|--------|-----------|
| **목적** | 플랫 노드 배열을 부모-자식 관계의 트리로 변환 |
| **입력** | flatNodes: FlatNode[] |
| **출력** | WbsNode[] (루트 노드 배열) |
| **시그니처** | `buildTree(flatNodes: FlatNode[]): WbsNode[]` |

**알고리즘**:

```
함수 buildTree(flatNodes):
    nodeMap = {} // id -> WbsNode 매핑
    rootNodes = []

    // 1단계: 모든 노드를 WbsNode로 변환하고 맵에 저장
    for node in flatNodes:
        wbsNode = WbsNode 생성 (node 기반)
        wbsNode.children = []
        wbsNode.progress = 0
        wbsNode.taskCount = 0
        nodeMap[node.id] = wbsNode

    // 2단계: 부모-자식 관계 설정
    for node in flatNodes:
        parentId = determineParentId(node)

        if parentId == null:
            // 루트 노드 (WP)
            rootNodes.push(nodeMap[node.id])
        else:
            // 자식 노드
            parent = nodeMap[parentId]
            if parent:
                parent.children.push(nodeMap[node.id])
            else:
                // 부모를 찾을 수 없음 (고아 노드)
                console.warn("Orphan node: {node.id}, missing parent: {parentId}")
                rootNodes.push(nodeMap[node.id]) // 루트에 추가

    return rootNodes
```

**부모 ID 결정 규칙**:

| 노드 타입 | 레벨 | 부모 결정 로직 | 예시 |
|----------|------|---------------|------|
| wp | 2 | null (루트) | WP-01 → parent: null |
| act | 3 | ID에서 WP 부분 추출 | ACT-01-02 → parent: WP-01 |
| task (4단계) | 4 | ID에서 ACT 부분 추출 | TSK-01-02-03 → parent: ACT-01-02 |
| task (3단계) | 3 | ID에서 WP 부분 추출 | TSK-01-02 → parent: WP-01 |

**부모 ID 추출 함수**:

| 함수명 | determineParentId |
|--------|-------------------|
| **입력** | node: FlatNode |
| **출력** | string \| null |
| **로직** | ID 패턴을 분석하여 부모 ID 생성 |

```
함수 determineParentId(node):
    idParts = node.id를 "-"로 분할

    if node.type == "wp":
        return null // WP는 루트

    if node.type == "act":
        // ACT-01-02 → WP-01
        return "WP-" + idParts[1]

    if node.type == "task":
        if idParts.length == 3:
            // TSK-01-02 → WP-01 (3단계)
            return "WP-" + idParts[1]
        else if idParts.length == 4:
            // TSK-01-02-03 → ACT-01-02 (4단계)
            return "ACT-" + idParts[1] + "-" + idParts[2]

    return null // 알 수 없는 형식
```

---

### 3.5 진행률 계산 함수

| 함수명 | calculateProgress |
|--------|-------------------|
| **목적** | 하위 Task 상태 기반으로 진행률 자동 계산 (재귀, 상태별 가중치 적용) |
| **입력** | nodes: WbsNode[] (in-place 수정) |
| **출력** | void (노드 객체 직접 수정) |
| **시그니처** | `calculateProgress(nodes: WbsNode[]): void` |

**상태별 가중치 정의**:

| 상태 코드 | 가중치 | 설명 |
|----------|--------|------|
| `[ ]` | 0% | Todo (미시작) |
| `[bd]` | 20% | 기본설계 진행 중 |
| `[dd]` | 40% | 상세설계 진행 중 |
| `[im]` | 60% | 구현 진행 중 |
| `[vf]` | 80% | 검증 진행 중 |
| `[xx]` | 100% | 완료 |

**알고리즘**:

```
함수 calculateProgress(nodes):
    for node in nodes:
        updateNodeMetrics(node)

함수 updateNodeMetrics(node):
    if node.type == "task":
        // Task 노드: 상태별 가중치로 progress 계산
        progress = 상태별_가중치(node.status)  // 위 표 참조
        node.progress = progress
        node.taskCount = 1
        return { progress, taskCount: 1 }

    // WP 또는 ACT: 자식 노드의 가중 평균 progress 계산
    totalProgress = 0
    totalTasks = 0

    for child in node.children:
        childMetrics = updateNodeMetrics(child)
        totalProgress += childMetrics.progress * childMetrics.taskCount
        totalTasks += childMetrics.taskCount

    // 0으로 나누기 방지
    avgProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0

    node.progress = avgProgress
    node.taskCount = totalTasks

    return { progress: avgProgress, taskCount: totalTasks }
```

**진행률 계산 규칙**:

| 조건 | 진행률 계산 | taskCount |
|------|-----------|-----------|
| Task 노드 | 상태별 가중치 (0%, 20%, 40%, 60%, 80%, 100%) | 1 |
| WP/ACT (자식 있음) | Σ(자식 progress × 자식 taskCount) / Σ(자식 taskCount) | 하위 전체 Task 수 |
| WP/ACT (자식 없음) | 0 | 0 |

**계산 예시**:
- 3개 Task: `[ ]`=0%, `[bd]`=20%, `[im]`=60% → (0+20+60)/3 = 26.67% → **27%** (반올림)

---

## 4. 에러 처리 및 예외 상황

### 4.1 에러 분류

| 에러 레벨 | 설명 | 처리 방법 |
|----------|------|----------|
| Critical | 파싱 불가능 (전체 실패) | 예외 발생, 빈 배열 반환 |
| Warning | 일부 노드/속성 파싱 실패 | 로그 기록, 해당 부분 스킵 |
| Info | 선택 속성 누락 | 기본값 사용, 계속 진행 |

### 4.2 에러 처리 전략

| 상황 | 에러 레벨 | 처리 방법 | 로그 메시지 |
|------|----------|----------|------------|
| 파일 읽기 실패 | Critical | 예외 발생 | "Failed to read wbs.md: {error}" |
| 빈 파일 | Info | 빈 배열 반환 | "Empty wbs.md file" |
| 잘못된 헤더 형식 | Warning | 라인 스킵 | "Invalid header format, line {n}: {line}" |
| 알 수 없는 ID 패턴 | Warning | 라인 스킵 | "Unknown ID pattern: {id}" |
| 필수 속성 누락 | Warning | 기본값 사용 | "Missing required attribute '{attr}' for {id}, using default" |
| 잘못된 속성 값 | Warning | 기본값 사용 | "Invalid value for '{attr}': {value}, using default" |
| 부모 노드 없음 | Warning | 루트에 추가 | "Orphan node {id}, parent {parentId} not found" |
| 순환 참조 | Warning | 참조 무시 | "Circular dependency detected: {id}" |
| 잘못된 날짜 형식 | Warning | 속성 무시 | "Invalid schedule format for {id}: {value}" |

### 4.3 기본값 정의

| 필드 | 기본값 | 사유 |
|------|--------|------|
| category | undefined | Task에만 필수, WP/ACT는 선택 |
| status | undefined | 명시되지 않으면 표시 안 함 |
| priority | undefined | 명시되지 않으면 표시 안 함 |
| assignee | undefined | 담당자 미정 |
| schedule | undefined | 일정 미정 |
| tags | [] | 빈 배열 |
| depends | [] | 의존성 없음 |
| requirements | [] | 요구사항 없음 |
| ref | undefined | 참조 없음 |
| progress | 0 | 진행 없음 |
| taskCount | 0 | Task 없음 |
| children | [] | 자식 없음 |
| expanded | false | 기본 접힘 |

---

## 5. 성능 최적화

### 5.1 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 파싱 시간 | 1000 노드 기준 < 500ms | performance.now() 측정 |
| 메모리 사용량 | < 10MB (1000 노드) | process.memoryUsage() |
| 트리 빌드 복잡도 | O(n) | 노드 수에 선형 비례 |

### 5.2 최적화 전략

| 전략 | 설명 | 적용 위치 |
|------|------|----------|
| 1회 순회 파싱 | 파일을 한 번만 읽고 파싱 | parseWbsMarkdown |
| Map 기반 조회 | O(1) 노드 조회 | buildTree (nodeMap) |
| 재귀 깊이 제한 | 최대 깊이 제한 (depth 4) | calculateProgress |
| 정규식 캐싱 | 정규식 객체 재사용 | 모듈 레벨 상수 |
| 지연 평가 | 필요 시에만 계산 | expanded는 렌더링 시 |

### 5.3 메모리 관리

| 항목 | 처리 방법 |
|------|----------|
| 임시 데이터 정리 | FlatNode 배열은 트리 빌드 후 GC 대상 |
| 대용량 텍스트 | 스트림 파싱 (필요 시 구현) |
| 순환 참조 방지 | WeakMap 사용 (필요 시) |

---

## 6. 유효성 검증

### 6.1 검증 규칙

파서 자체는 검증을 최소화하고, 별도 검증 함수(TSK-02-02-03)에서 수행. 파서 단계에서는 기본적인 형식 검증만 수행:

| 검증 항목 | 검증 내용 | 실패 시 처리 |
|----------|----------|-------------|
| 헤더 형식 | 정규식 매칭 | 라인 스킵 |
| ID 패턴 | WP/ACT/TSK 패턴 매칭 | 라인 스킵 |
| 열거형 값 | category, status, priority | 기본값 사용 |
| 날짜 형식 | YYYY-MM-DD | 속성 무시 |

### 6.2 검증 레벨

| 레벨 | 설명 | 파서 단계 적용 |
|------|------|---------------|
| Syntax | 문법 오류 (헤더 형식) | ✓ |
| Semantic | 의미 오류 (중복 ID, 순환 참조) | ✗ (별도 검증 단계) |
| Business | 비즈니스 규칙 (필수 속성) | ✗ (별도 검증 단계) |

---

## 7. 확장성 고려사항

### 7.1 새로운 속성 추가

| 단계 | 작업 |
|------|------|
| 1 | NodeAttributes 인터페이스에 필드 추가 |
| 2 | parseNodeAttributes에 파서 로직 추가 |
| 3 | 기본값 정의 |
| 4 | 테스트 케이스 추가 |

### 7.2 플러그인 구조 (향후)

속성 파서를 맵 구조로 관리하여 확장 용이:

```
attributeParsers = {
  category: parseCategoryAttribute,
  status: parseStatusAttribute,
  priority: parsePriorityAttribute,
  // 새 속성 추가 시 여기에 등록
  newAttribute: parseNewAttribute
}
```

---

## 8. 테스트 전략

### 8.1 단위 테스트 범위

| 함수 | 테스트 케이스 수 | 주요 시나리오 |
|------|-----------------|---------------|
| parseNodeHeader | 10 | 정상 헤더, 잘못된 형식, 경계값 |
| parseNodeAttributes | 15 | 각 속성별, 복합 속성, 누락 |
| parseWbsMarkdown | 8 | 전체 파싱, 빈 파일, 오류 포함 |
| buildTree | 6 | 3단계, 4단계, 고아 노드 |
| calculateProgress | 5 | 완료율, 중첩 구조 |

### 8.2 통합 테스트

| 시나리오 | 입력 | 예상 출력 |
|---------|------|----------|
| 실제 wbs.md 파싱 | 현재 프로젝트 wbs.md | 28개 노드, 계층 구조 |
| 3단계 구조 | WP → TSK | 정상 트리 |
| 4단계 구조 | WP → ACT → TSK | 정상 트리 |
| 혼합 구조 | 3단계 + 4단계 혼재 | 정상 트리 |

자세한 테스트 명세는 `026-test-specification.md` 참조.

---

## 9. 파일 구조 및 위치

### 9.1 구현 파일

| 파일 경로 | 목적 | 내용 |
|----------|------|------|
| `server/utils/wbs-parser.ts` | 파서 메인 로직 | parseWbsMarkdown, buildTree 등 |
| `server/utils/wbs-parser-helpers.ts` | 헬퍼 함수 | parseNodeHeader, parseNodeAttributes 등 |
| `server/utils/wbs-parser-patterns.ts` | 정규식 패턴 | 모든 정규식 상수 정의 |
| `types/index.ts` | 타입 정의 (기존) | WbsNode, TaskStatus 등 |

### 9.2 의존성

| 모듈 | 용도 | 설치 필요 여부 |
|------|------|---------------|
| Node.js 기본 모듈 | fs, path | ✗ (내장) |
| TypeScript | 타입 시스템 | ✓ (이미 설치됨) |

---

## 10. 마이그레이션 및 호환성

### 10.1 버전 관리

wbs.md 파일의 메타데이터 섹션에서 버전 정보 읽기:

```markdown
> version: 1.0
> depth: 4
```

| 메타데이터 | 용도 | 파서 동작 |
|-----------|------|----------|
| version | wbs.md 형식 버전 | 향후 형식 변경 시 버전별 파싱 |
| depth | 프로젝트 계층 깊이 | 3 또는 4 (검증용) |
| updated | 마지막 수정 시각 | 캐싱 무효화 판단 |

### 10.2 하위 호환성

| 변경 사항 | 호환성 전략 |
|----------|------------|
| 새 속성 추가 | 선택 속성으로 추가, 기본값 제공 |
| 속성 제거 | Deprecated 경고 후 무시 |
| 형식 변경 | 버전 기반 파서 분기 |

---

## 11. 보안 고려사항

### 11.1 입력 검증

| 위험 | 대응 방법 |
|------|----------|
| 임의 코드 실행 | 정규식만 사용, eval 금지 |
| DoS (대용량 파일) | 파일 크기 제한 (향후), 타임아웃 |
| 경로 탐색 (Path Traversal) | 파일 읽기는 Server Routes에서 처리 |

### 11.2 안전한 파싱

| 항목 | 조치 |
|------|------|
| 정규식 ReDoS | 안전한 패턴 사용, 타임아웃 설정 |
| 무한 루프 | 재귀 깊이 제한 |
| 메모리 폭증 | 노드 수 제한 (향후) |

---

## 12. 로깅 및 디버깅

### 12.1 로그 레벨

| 레벨 | 상황 | 예시 |
|------|------|------|
| ERROR | 파싱 완전 실패 | "Failed to parse wbs.md" |
| WARN | 일부 노드 스킵 | "Invalid header at line 42" |
| INFO | 파싱 완료 | "Parsed 56 nodes in 120ms" |
| DEBUG | 상세 파싱 정보 | "Processing node: WP-01" |

### 12.2 디버깅 정보

개발 모드에서 추가 정보 제공:

| 정보 | 내용 |
|------|------|
| 파싱 시간 | 각 단계별 소요 시간 |
| 스킵된 라인 | 라인 번호 및 내용 |
| 노드 통계 | WP/ACT/TSK 개수 |
| 경고 목록 | 모든 경고 메시지 수집 |

---

## 13. 성능 벤치마크

### 13.1 벤치마크 시나리오

| 시나리오 | 노드 수 | 예상 시간 |
|---------|---------|----------|
| 소규모 | 10 WP, 50 Task | < 50ms |
| 중규모 | 50 WP, 300 Task | < 200ms |
| 대규모 | 100 WP, 1000 Task | < 500ms |

### 13.2 측정 방법

```
시작 시각 기록
parseWbsMarkdown 실행
종료 시각 기록
소요 시간 계산
노드당 평균 시간 계산
```

---

## 14. 구현 우선순위

| 순위 | 기능 | 이유 |
|------|------|------|
| 1 | parseNodeHeader | 핵심 헤더 파싱 |
| 2 | parseNodeAttributes (기본) | category, status, priority만 |
| 3 | parseWbsMarkdown (기본) | 전체 흐름 구현 |
| 4 | buildTree | 트리 구조 생성 |
| 5 | calculateProgress | 진행률 계산 |
| 6 | parseNodeAttributes (전체) | 모든 속성 지원 |
| 7 | 에러 처리 강화 | 견고성 향상 |
| 8 | 성능 최적화 | 필요 시 |

---

## 15. 수용 기준 (상세)

| 번호 | 기준 | 검증 방법 | 우선순위 |
|------|------|----------|---------|
| AC-001 | wbs.md 파일을 읽어 WbsNode[] 트리로 변환 | 통합 테스트 | 필수 |
| AC-002 | 4단계 구조 (WP → ACT → TSK) 정상 파싱 | 단위 테스트 | 필수 |
| AC-003 | 3단계 구조 (WP → TSK) 정상 파싱 | 단위 테스트 | 필수 |
| AC-004 | 모든 속성 정상 추출 (9개 속성) | 속성별 테스트 | 필수 |
| AC-005 | 진행률 자동 계산 | 계산 로직 테스트 | 필수 |
| AC-006 | 잘못된 형식 라인 무시하고 계속 파싱 | 에러 처리 테스트 | 필수 |
| AC-007 | 1000 노드 기준 500ms 이하 파싱 | 성능 벤치마크 | 권장 |
| AC-008 | 고아 노드 처리 (부모 없음) | 경계 케이스 테스트 | 권장 |
| AC-009 | 빈 파일 처리 (빈 배열 반환) | 경계 케이스 테스트 | 필수 |
| AC-010 | TypeScript 타입 안전성 | 컴파일 에러 없음 | 필수 |

---

## 16. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 기본설계 | 010-basic-design.md | 비즈니스 요구사항 |
| 추적성 매트릭스 | 025-traceability-matrix.md | 요구사항-설계 추적 |
| 테스트 명세 | 026-test-specification.md | 테스트 케이스 상세 |
| PRD | ../../prd.md | 제품 요구사항 |
| TRD | ../../trd.md | 기술 요구사항 |
| 타입 정의 | ../../../../types/index.ts | TypeScript 타입 |

---

## 17. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-13 | 1.0 | 초기 작성 | - |

---

## 18. 승인

| 역할 | 이름 | 승인 일자 | 서명 |
|------|------|----------|------|
| 설계자 | - | 2025-12-13 | - |
| 검토자 | - | - | - |

---

## 부록 A: 샘플 입력/출력

### A.1 샘플 wbs.md (일부)

```markdown
# WBS - jjiban

> version: 1.0
> depth: 4

---

## WP-01: Platform Infrastructure
- status: planned
- priority: critical
- schedule: 2025-12-13 ~ 2025-12-20
- progress: 0%

### ACT-01-01: Project Setup
- status: todo
- schedule: 2025-12-13 ~ 2025-12-16

#### TSK-01-01-01: Nuxt 3 프로젝트 초기화
- category: infrastructure
- status: done [xx]
- priority: critical
- assignee: -
- schedule: 2025-12-13 ~ 2025-12-13
- tags: nuxt, setup
- depends: -
- requirements:
  - Nuxt 3 프로젝트 생성
  - TypeScript 설정
- ref: PRD 3
```

### A.2 예상 출력 (JSON 표현)

```json
[
  {
    "id": "WP-01",
    "type": "wp",
    "title": "Platform Infrastructure",
    "status": undefined,
    "category": undefined,
    "priority": "critical",
    "progress": 100,
    "taskCount": 1,
    "children": [
      {
        "id": "ACT-01-01",
        "type": "act",
        "title": "Project Setup",
        "status": undefined,
        "category": undefined,
        "priority": undefined,
        "progress": 100,
        "taskCount": 1,
        "children": [
          {
            "id": "TSK-01-01-01",
            "type": "task",
            "title": "Nuxt 3 프로젝트 초기화",
            "status": "[xx]",
            "category": "infrastructure",
            "priority": "critical",
            "progress": 100,
            "taskCount": 1,
            "children": []
          }
        ]
      }
    ]
  }
]
```

---

## 부록 B: 알고리즘 복잡도 분석

| 함수 | 시간 복잡도 | 공간 복잡도 | 설명 |
|------|-----------|-----------|------|
| parseWbsMarkdown | O(n) | O(n) | n = 라인 수, 1회 순회 |
| parseNodeHeader | O(1) | O(1) | 정규식 매칭 상수 시간 |
| parseNodeAttributes | O(m) | O(m) | m = 속성 라인 수 |
| buildTree | O(n) | O(n) | n = 노드 수, Map 사용 |
| calculateProgress | O(n) | O(h) | n = 노드 수, h = 트리 높이 (재귀 스택) |
| collectAllTasks | O(n) | O(n) | DFS 순회 |

**전체 복잡도**: O(n) - 선형 시간

---

**문서 종료**
