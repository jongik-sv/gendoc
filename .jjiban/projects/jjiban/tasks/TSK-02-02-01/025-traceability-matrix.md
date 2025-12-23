# 추적성 매트릭스: wbs.md 파서 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-01 |
| 문서 유형 | Traceability Matrix |
| 작성일 | 2025-12-13 |
| 관련 문서 | 010-basic-design.md, 020-detail-design.md |

---

## 1. 추적성 매트릭스 개요

이 문서는 비즈니스 요구사항(FR), 비즈니스 규칙(BR), 설계 요소(함수/모듈), 테스트 케이스 간의 추적성을 제공합니다.

**목적**:
- 모든 요구사항이 설계에 반영되었는지 검증
- 설계 요소가 어떤 요구사항을 구현하는지 명확화
- 테스트 커버리지 확인
- 변경 영향 분석 지원

---

## 2. 요구사항 → 설계 추적

### 2.1 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 설계 함수/모듈 | 상세설계 섹션 | 우선순위 |
|-------|---------|---------------|--------------|---------|
| FR-001 | Markdown 헤더 파싱 (##, ###, ####) | parseNodeHeader | 3.2 | 필수 |
| FR-002 | 속성 파싱 (9개 속성) | parseNodeAttributes | 3.3 | 필수 |
| FR-003 | 계층 구조 빌드 (트리) | buildTree | 3.4 | 필수 |
| FR-004 | 진행률 자동 계산 | calculateProgress, collectAllTasks | 3.5 | 필수 |
| FR-005 | 메인 파싱 흐름 조정 | parseWbsMarkdown | 3.1 | 필수 |

### 2.2 비즈니스 규칙 (Business Rules)

| BR ID | 규칙 설명 | 구현 위치 | 설계 섹션 | 검증 방법 |
|-------|----------|----------|----------|----------|
| BR-001 | 헤더 레벨로 계층 결정 (## = WP, ### = ACT/TSK, #### = TSK) | parseNodeHeader | 3.2 | 단위 테스트 |
| BR-002 | ID 패턴으로 노드 타입 식별 | parseNodeHeader (타입 결정 규칙) | 3.2 | 단위 테스트 |
| BR-003 | 3단계 구조: WP → TSK | determineParentId | 3.4 | 통합 테스트 |
| BR-004 | 4단계 구조: WP → ACT → TSK | determineParentId | 3.4 | 통합 테스트 |
| BR-005 | 상태 코드 [xx] 형식 추출 | parseNodeAttributes (status 파서) | 3.3 | 단위 테스트 |

### 2.3 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 구현 방법 | 설계 섹션 | 측정 방법 |
|--------|---------|----------|----------|----------|
| NFR-001 | 성능: 1000 노드 < 500ms | 1회 순회, Map 기반 조회 | 5 | 벤치마크 테스트 |
| NFR-002 | 견고성: 잘못된 형식 허용 | try-catch, 기본값, 라인 스킵 | 4 | 에러 처리 테스트 |
| NFR-003 | 확장성: 새 속성 추가 용이 | 속성 파서 맵 구조 | 7 | 코드 리뷰 |
| NFR-004 | 타입 안전성 | TypeScript, 엄격한 타입 검사 | 전체 | 컴파일 검증 |

---

## 3. 설계 → 요구사항 추적 (역방향)

### 3.1 함수별 요구사항 매핑

| 함수명 | 담당 FR | 담당 BR | 입력 | 출력 |
|--------|---------|---------|------|------|
| parseWbsMarkdown | FR-005 | - | markdown: string | WbsNode[] |
| parseNodeHeader | FR-001 | BR-001, BR-002 | line: string | NodeHeader \| null |
| parseNodeAttributes | FR-002 | BR-005 | lines: string[] | NodeAttributes |
| buildTree | FR-003 | BR-003, BR-004 | flatNodes: FlatNode[] | WbsNode[] |
| calculateProgress | FR-004 | - | nodes: WbsNode[] | void |
| collectAllTasks | FR-004 | - | node: WbsNode | WbsNode[] |
| determineParentId | FR-003 | BR-003, BR-004 | node: FlatNode | string \| null |

### 3.2 모듈별 요구사항 매핑

| 모듈 파일 | 담당 기능 | 관련 FR | 관련 BR |
|----------|----------|---------|---------|
| wbs-parser.ts | 메인 파싱 로직 | FR-001, FR-003, FR-004, FR-005 | BR-001, BR-002, BR-003, BR-004 |
| wbs-parser-helpers.ts | 헬퍼 함수 | FR-001, FR-002 | BR-005 |
| wbs-parser-patterns.ts | 정규식 패턴 | FR-001, FR-002 | BR-001, BR-002, BR-005 |

---

## 4. 요구사항 → 테스트 추적

### 4.1 기능 요구사항 테스트 커버리지

| FR ID | 요구사항 | 테스트 케이스 ID | 테스트 유형 | 우선순위 |
|-------|---------|-----------------|-----------|---------|
| FR-001 | 헤더 파싱 | TC-001-001 ~ TC-001-010 | 단위 | 필수 |
| FR-002 | 속성 파싱 | TC-002-001 ~ TC-002-015 | 단위 | 필수 |
| FR-003 | 트리 빌드 | TC-003-001 ~ TC-003-006 | 단위, 통합 | 필수 |
| FR-004 | 진행률 계산 | TC-004-001 ~ TC-004-005 | 단위 | 필수 |
| FR-005 | 전체 파싱 | TC-005-001 ~ TC-005-008 | 통합 | 필수 |

### 4.2 비즈니스 규칙 테스트 커버리지

| BR ID | 규칙 설명 | 테스트 케이스 ID | 검증 방법 |
|-------|----------|-----------------|----------|
| BR-001 | 헤더 레벨로 계층 결정 | TC-001-002, TC-001-003, TC-001-004 | 레벨 2/3/4 파싱 검증 |
| BR-002 | ID 패턴으로 타입 식별 | TC-001-005, TC-001-006, TC-001-007 | WP/ACT/TSK 타입 검증 |
| BR-003 | 3단계 구조 | TC-003-002 | WP → TSK 부모-자식 검증 |
| BR-004 | 4단계 구조 | TC-003-001 | WP → ACT → TSK 검증 |
| BR-005 | 상태 코드 형식 | TC-002-002 | [xx] 추출 검증 |

### 4.3 수용 기준 테스트 커버리지

| AC ID | 수용 기준 | 테스트 케이스 ID | 검증 방법 |
|-------|----------|-----------------|----------|
| AC-001 | wbs.md → WbsNode[] 변환 | TC-005-001 | 통합 테스트 |
| AC-002 | 4단계 구조 파싱 | TC-003-001, TC-005-004 | 통합 테스트 |
| AC-003 | 3단계 구조 파싱 | TC-003-002, TC-005-003 | 통합 테스트 |
| AC-004 | 모든 속성 추출 | TC-002-001 ~ TC-002-009 | 속성별 단위 테스트 |
| AC-005 | 진행률 계산 | TC-004-001 ~ TC-004-005 | 단위 테스트 |
| AC-006 | 오류 형식 무시 | TC-005-006 | 에러 처리 테스트 |
| AC-007 | 성능 목표 (500ms) | TC-006-003 | 벤치마크 테스트 |
| AC-008 | 고아 노드 처리 | TC-005-007 | 경계 케이스 테스트 |
| AC-009 | 빈 파일 처리 | TC-005-002 | 경계 케이스 테스트 |
| AC-010 | TypeScript 타입 안전성 | - | 컴파일 검증 |

---

## 5. 테스트 → 요구사항 추적 (역방향)

### 5.1 테스트 케이스 그룹별 요구사항 매핑

| 테스트 그룹 | 테스트 케이스 수 | 커버하는 FR | 커버하는 BR | 커버하는 AC |
|-----------|-----------------|------------|------------|------------|
| parseNodeHeader 테스트 | 10 | FR-001 | BR-001, BR-002 | AC-001 |
| parseNodeAttributes 테스트 | 15 | FR-002 | BR-005 | AC-004 |
| buildTree 테스트 | 6 | FR-003 | BR-003, BR-004 | AC-002, AC-003, AC-008 |
| calculateProgress 테스트 | 5 | FR-004 | - | AC-005 |
| parseWbsMarkdown 통합 테스트 | 8 | FR-001 ~ FR-005 | BR-001 ~ BR-005 | AC-001, AC-006, AC-009 |
| 성능 테스트 | 3 | - | - | AC-007 |

---

## 6. 속성별 상세 추적

### 6.1 9개 속성 파싱 추적

| 속성명 | PRD 참조 | 파서 함수 | 정규식 패턴 | 테스트 케이스 | 기본값 |
|--------|---------|----------|------------|-------------|--------|
| category | 7.4 | parseNodeAttributes | ATTRIBUTE_PATTERN | TC-002-001 | undefined |
| status | 7.4 | parseNodeAttributes | STATUS_PATTERN | TC-002-002 | undefined |
| priority | 7.4 | parseNodeAttributes | ATTRIBUTE_PATTERN | TC-002-003 | undefined |
| assignee | 7.4 | parseNodeAttributes | ATTRIBUTE_PATTERN | TC-002-004 | undefined |
| schedule | 7.4 | parseNodeAttributes | SCHEDULE_PATTERN | TC-002-005 | undefined |
| tags | 7.4 | parseNodeAttributes | TAGS_PATTERN | TC-002-006 | [] |
| depends | 7.4 | parseNodeAttributes | ATTRIBUTE_PATTERN | TC-002-007 | [] |
| requirements | 7.4 | parseNodeAttributes | 특수 처리 | TC-002-008 | [] |
| ref | 7.4 | parseNodeAttributes | ATTRIBUTE_PATTERN | TC-002-009 | undefined |

---

## 7. 정규식 패턴 추적

### 7.1 패턴별 요구사항 매핑

| 정규식 상수 | 목적 | 관련 FR/BR | 사용 함수 | 테스트 케이스 |
|------------|------|-----------|----------|-------------|
| HEADER_PATTERN | 헤더 라인 매칭 | FR-001, BR-001 | parseNodeHeader | TC-001-001 |
| WP_ID_PATTERN | Work Package ID 검증 | BR-002 | parseNodeHeader | TC-001-005 |
| ACT_ID_PATTERN | Activity ID 검증 | BR-002 | parseNodeHeader | TC-001-006 |
| TSK_3LEVEL_PATTERN | Task ID (3단계) 검증 | BR-002, BR-003 | parseNodeHeader | TC-001-007 |
| TSK_4LEVEL_PATTERN | Task ID (4단계) 검증 | BR-002, BR-004 | parseNodeHeader | TC-001-008 |
| STATUS_PATTERN | 상태 코드 추출 | BR-005 | parseNodeAttributes | TC-002-002 |
| SCHEDULE_PATTERN | 일정 범위 파싱 | FR-002 | parseNodeAttributes | TC-002-005 |
| ATTRIBUTE_PATTERN | 속성 라인 매칭 | FR-002 | parseNodeAttributes | TC-002-001 |
| TAGS_PATTERN | 태그 목록 파싱 | FR-002 | parseNodeAttributes | TC-002-006 |

---

## 8. 에러 처리 추적

### 8.1 에러 시나리오별 요구사항 매핑

| 에러 시나리오 | 에러 레벨 | 처리 방법 | 관련 NFR | 테스트 케이스 |
|-------------|----------|----------|---------|-------------|
| 파일 읽기 실패 | Critical | 예외 발생 | NFR-002 | - (파일 시스템 계층) |
| 빈 파일 | Info | 빈 배열 반환 | NFR-002 | TC-005-002 |
| 잘못된 헤더 형식 | Warning | 라인 스킵 | NFR-002 | TC-005-006 |
| 알 수 없는 ID 패턴 | Warning | 라인 스킵 | NFR-002 | TC-001-009 |
| 필수 속성 누락 | Warning | 기본값 사용 | NFR-002 | TC-002-010 |
| 잘못된 속성 값 | Warning | 기본값 사용 | NFR-002 | TC-002-011 |
| 부모 노드 없음 | Warning | 루트에 추가 | NFR-002 | TC-005-007 |
| 잘못된 날짜 형식 | Warning | 속성 무시 | NFR-002 | TC-002-012 |

---

## 9. 성능 요구사항 추적

### 9.1 성능 목표 추적

| 성능 지표 | 목표값 | 측정 방법 | 구현 전략 | 설계 섹션 | 테스트 케이스 |
|----------|--------|----------|----------|----------|-------------|
| 파싱 시간 (1000 노드) | < 500ms | performance.now() | 1회 순회 파싱 | 5.1 | TC-006-003 |
| 메모리 사용량 | < 10MB | process.memoryUsage() | Map 기반 조회 | 5.3 | TC-006-002 |
| 트리 빌드 복잡도 | O(n) | 알고리즘 분석 | Map 사용 | 부록 B | - |
| 초기 로딩 | < 2초 | E2E 측정 | - | - | E2E 테스트 |

---

## 10. 데이터 구조 추적

### 10.1 타입별 요구사항 매핑

| 타입명 | 정의 위치 | 용도 | 관련 FR | 관련 설계 섹션 |
|--------|----------|------|---------|---------------|
| WbsNode | types/index.ts | 트리 노드 | FR-003, FR-004 | 2.1 |
| WbsNodeType | types/index.ts | 노드 타입 | FR-001 | 2.1 |
| TaskCategory | types/index.ts | 카테고리 | FR-002 | 2.1 |
| TaskStatus | types/index.ts | 상태 코드 | FR-002 | 2.1 |
| Priority | types/index.ts | 우선순위 | FR-002 | 2.1 |
| NodeHeader | 파서 내부 | 헤더 정보 | FR-001 | 2.2 |
| NodeAttributes | 파서 내부 | 속성 모음 | FR-002 | 2.2 |
| FlatNode | 파서 내부 | 플랫 노드 | FR-003 | 2.2 |

---

## 11. PRD 참조 추적

### 11.1 PRD 섹션별 설계 매핑

| PRD 섹션 | 내용 | 관련 FR/BR | 설계 함수 | 테스트 케이스 |
|---------|------|-----------|----------|-------------|
| 7.2 | wbs.md 형식 | FR-001, FR-005 | parseWbsMarkdown | TC-005-001 |
| 7.3 | wbs.md 문법 규칙 | BR-001, BR-002, BR-003, BR-004 | parseNodeHeader, determineParentId | TC-001, TC-003 |
| 7.4 | Task 속성 | FR-002, BR-005 | parseNodeAttributes | TC-002 |

---

## 12. 커버리지 요약

### 12.1 요구사항 커버리지

| 요구사항 유형 | 총 개수 | 설계 커버 | 테스트 커버 | 커버리지 |
|-------------|---------|----------|-----------|---------|
| 기능 요구사항 (FR) | 5 | 5 | 5 | 100% |
| 비즈니스 규칙 (BR) | 5 | 5 | 5 | 100% |
| 비기능 요구사항 (NFR) | 4 | 4 | 3 | 75% |
| 수용 기준 (AC) | 10 | 10 | 9 | 90% |

### 12.2 설계 커버리지

| 설계 요소 | 총 개수 | 테스트 커버 | 커버리지 |
|----------|---------|-----------|---------|
| 메인 함수 | 7 | 7 | 100% |
| 정규식 패턴 | 9 | 9 | 100% |
| 에러 시나리오 | 8 | 7 | 87.5% |
| 속성 파서 | 9 | 9 | 100% |

### 12.3 테스트 커버리지

| 테스트 유형 | 계획 개수 | 우선순위 필수 | 우선순위 권장 |
|-----------|----------|-------------|-------------|
| 단위 테스트 | 44 | 36 | 8 |
| 통합 테스트 | 8 | 6 | 2 |
| 성능 테스트 | 3 | 1 | 2 |
| E2E 테스트 | - | - | - |
| **총계** | **55** | **43** | **12** |

---

## 13. 변경 영향 분석

### 13.1 요구사항 변경 시 영향 범위

| 변경 시나리오 | 영향받는 FR | 영향받는 설계 | 영향받는 테스트 | 위험도 |
|-------------|-----------|-------------|---------------|--------|
| 새 속성 추가 | FR-002 | parseNodeAttributes | TC-002-016 (신규) | 낮음 |
| 새 노드 타입 추가 | FR-001, FR-003 | parseNodeHeader, buildTree | TC-001, TC-003 | 중간 |
| 진행률 계산 방식 변경 | FR-004 | calculateProgress | TC-004 | 낮음 |
| 헤더 형식 변경 | FR-001 | parseNodeHeader, 정규식 | TC-001 | 높음 |
| 트리 구조 변경 | FR-003 | buildTree, determineParentId | TC-003, TC-005 | 높음 |

### 13.2 설계 변경 시 영향 범위

| 설계 변경 | 영향받는 함수 | 영향받는 테스트 | 위험도 |
|----------|-------------|---------------|--------|
| 정규식 패턴 변경 | parseNodeHeader, parseNodeAttributes | TC-001, TC-002 | 중간 |
| 에러 처리 방식 변경 | 모든 함수 | TC-005 | 중간 |
| 데이터 구조 변경 | 모든 함수 | 모든 테스트 | 높음 |
| 성능 최적화 | parseWbsMarkdown, buildTree | TC-006 | 낮음 |

---

## 14. 미충족 요구사항

### 14.1 현재 범위 외 요구사항

| 항목 | 설명 | 담당 Task | 비고 |
|------|------|----------|------|
| WbsNode[] → Markdown 변환 | 시리얼라이저 | TSK-02-02-02 | 2차 구현 |
| 유효성 검증 | 중복 ID, 순환 참조 검증 | TSK-02-02-03 | 2차 구현 |
| 스트림 파싱 | 대용량 파일 처리 | - | 필요 시 구현 |

---

## 15. 추적성 검증 체크리스트

| 항목 | 상태 | 확인자 | 확인일 |
|------|------|--------|--------|
| 모든 FR이 설계에 매핑됨 | ✓ | - | 2025-12-13 |
| 모든 BR이 설계에 매핑됨 | ✓ | - | 2025-12-13 |
| 모든 AC가 테스트에 매핑됨 | ✓ (90%) | - | 2025-12-13 |
| 모든 설계 함수가 테스트됨 | ✓ | - | 2025-12-13 |
| 역방향 추적 가능 | ✓ | - | 2025-12-13 |
| PRD 참조 일치 | ✓ | - | 2025-12-13 |

---

## 16. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 기본설계 | 010-basic-design.md | 요구사항 정의 |
| 상세설계 | 020-detail-design.md | 설계 상세 |
| 테스트 명세 | 026-test-specification.md | 테스트 케이스 |
| PRD | ../../prd.md | 제품 요구사항 |

---

**문서 종료**
