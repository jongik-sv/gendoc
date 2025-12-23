# 추적성 매트릭스: WBS 데이터 유효성 검증

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-03 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 문서 유형 | 추적성 매트릭스 |
| 작성일 | 2025-12-13 |

---

## 1. 개요

이 문서는 기본설계 요구사항과 상세설계 구성요소 간의 추적성을 제공합니다. 모든 요구사항이 상세설계에 반영되었고, 모든 설계 요소가 요구사항에서 유래했음을 보장합니다.

---

## 2. 요구사항 → 설계 구성요소 매핑

### 2.1 기능 요구사항 (FR)

| FR ID | 기능 요구사항 | 설계 구성요소 | 상세설계 섹션 | 상태 |
|-------|-------------|-------------|------------|------|
| FR-001 | ID 형식 검증 (WP-XX, ACT-XX-XX, TSK-XX-XX-XX, TSK-XX-XX) | IdValidator | 4.2, 9.2 | 완료 |
| FR-001.1 | WP-XX 패턴 검증 | IdValidator.getPattern (wp) | 3.2, 4.2 | 완료 |
| FR-001.2 | ACT-XX-XX 패턴 검증 | IdValidator.getPattern (act) | 3.2, 4.2 | 완료 |
| FR-001.3 | TSK-XX-XX-XX 패턴 검증 (4단계) | IdValidator.getPattern (task 4단계) | 3.2, 4.2 | 완료 |
| FR-001.4 | TSK-XX-XX 패턴 검증 (3단계) | IdValidator.getPattern (task 3단계) | 3.2, 4.2 | 완료 |
| FR-002 | 필수 속성 검증 (category, status, priority) | AttributeValidator | 4.3, 9.2 | 완료 |
| FR-002.1 | category 검증 | AttributeValidator.validateCategory | 4.3, 3.2 | 완료 |
| FR-002.2 | status 검증 | StatusValidator | 4.4, 9.2 | 완료 |
| FR-002.3 | priority 검증 | AttributeValidator.validatePriority | 4.3, 3.2 | 완료 |
| FR-003 | 상태 기호 검증 ([ ], [bd], [dd] 등) | StatusValidator.validateStatus | 4.4, 3.2 | 완료 |
| FR-004 | 중복 ID 검사 | DuplicateChecker.checkDuplicates | 4.6, 9.2 | 완료 |
| FR-005 | 계층 관계 검증 | HierarchyValidator.validateHierarchy | 4.5, 9.2 | 완료 |
| FR-005.1 | ID 접두사 추출 | HierarchyValidator.extractPrefix | 4.5 | 완료 |
| FR-005.2 | 부모-자식 관계 확인 | HierarchyValidator.getExpectedPrefix | 4.5 | 완료 |

### 2.2 비즈니스 규칙 (BR)

| BR ID | 비즈니스 규칙 | 설계 반영 위치 | 구현 방법 | 상태 |
|-------|-------------|-------------|----------|------|
| BR-001 | ID는 해당 계층의 패턴과 일치해야 함 | IdValidator.validateId | 타입별 정규식 패턴 검증 | 완료 |
| BR-002 | category, status, priority는 Task에서 필수 | AttributeValidator.validateAttributes | Task 타입 체크 후 필수 속성 검증 | 완료 |
| BR-003 | status 값은 허용된 기호 목록에 있어야 함 | StatusValidator.validateStatus | 허용된 코드 배열과 비교 | 완료 |
| BR-004 | 동일 ID는 WBS 내에서 유일해야 함 | DuplicateChecker.checkDuplicates | Map으로 ID 출현 횟수 추적 | 완료 |
| BR-005 | TSK ID의 접두사는 부모 ID와 일치해야 함 | HierarchyValidator.validateHierarchy | 접두사 추출 및 비교 로직 | 완료 |

### 2.3 인터페이스 요구사항 (IF)

| IF ID | 인터페이스 | 설계 구성요소 | 메서드 시그니처 | 섹션 | 상태 |
|-------|----------|-------------|---------------|------|------|
| IF-001 | validateWbs | WbsValidator.validateWbs | (nodes: WbsNode[]) → ValidationResult | 4.1, 9.1 | 완료 |
| IF-002 | validateId | IdValidator.validateId | (id: string, type: WbsNodeType) → ValidationError \| null | 4.2, 9.2 | 완료 |
| IF-003 | validateAttributes | AttributeValidator.validateAttributes | (node: WbsNode) → ValidationError[] | 4.3, 9.2 | 완료 |
| IF-004 | validateStatus | StatusValidator.validateStatus | (status: string) → ValidationError \| null | 4.4, 9.2 | 완료 |
| IF-005 | checkDuplicates | DuplicateChecker.checkDuplicates | (nodes: WbsNode[]) → ValidationError[] | 4.6, 9.2 | 완료 |
| IF-006 | validateHierarchy | HierarchyValidator.validateHierarchy | (node: WbsNode, parent: WbsNode) → ValidationError \| null | 4.5, 9.2 | 완료 |

### 2.4 수용 기준 (AC)

| AC ID | 수용 기준 | 검증 방법 | 상세설계 반영 | 테스트 ID | 상태 |
|-------|----------|----------|-------------|----------|------|
| AC-001 | WP-XX, ACT-XX-XX, TSK-XX-XX-XX 형식 검증 정상 동작 | 단위 테스트 | IdValidator | UT-ID-001~006 | 완료 |
| AC-002 | 3단계 구조 (TSK-XX-XX) 형식도 유효하게 인식 | 통합 테스트 | IdValidator | IT-VAL-002 | 완료 |
| AC-003 | 필수 속성 누락 시 명확한 오류 메시지 반환 | 단위 테스트 | AttributeValidator, 오류 메시지 템플릿 | UT-ATTR-003~005 | 완료 |
| AC-004 | 잘못된 상태 기호 입력 시 오류 반환 | 단위 테스트 | StatusValidator | UT-STATUS-002 | 완료 |
| AC-005 | 중복 ID 발견 시 모든 중복 항목 목록 반환 | 단위 테스트 | DuplicateChecker | UT-DUP-001 | 완료 |
| AC-006 | 계층 불일치 시 어떤 관계가 잘못되었는지 명시 | 단위 테스트 | HierarchyValidator, 오류 메시지 | UT-HIER-002 | 완료 |

---

## 3. 설계 구성요소 → 요구사항 역매핑

### 3.1 클래스 및 모듈

| 모듈 | 클래스/함수 | 구현 요구사항 | 비즈니스 규칙 | 비고 |
|------|-----------|-------------|-------------|------|
| WbsValidator | validateWbs | IF-001 | BR-001~005 | 전체 검증 조율 |
| WbsValidator | validateNode | - | - | 내부 헬퍼 함수 |
| IdValidator | validateId | FR-001, IF-002 | BR-001 | ID 형식 검증 |
| IdValidator | getPattern | FR-001.1~1.4 | BR-001 | 패턴 반환 |
| AttributeValidator | validateAttributes | FR-002, IF-003 | BR-002 | 필수 속성 검증 |
| AttributeValidator | validateCategory | FR-002.1 | BR-002 | category 값 검증 |
| AttributeValidator | validatePriority | FR-002.3 | BR-002 | priority 값 검증 |
| StatusValidator | validateStatus | FR-003, IF-004 | BR-003 | 상태 코드 검증 |
| StatusValidator | isValidStatus | FR-003 | BR-003 | 상태 유효성 체크 |
| HierarchyValidator | validateHierarchy | FR-005, IF-006 | BR-005 | 계층 관계 검증 |
| HierarchyValidator | extractPrefix | FR-005.1 | BR-005 | 접두사 추출 |
| HierarchyValidator | getExpectedPrefix | FR-005.2 | BR-005 | 기대 접두사 계산 |
| DuplicateChecker | checkDuplicates | FR-004, IF-005 | BR-004 | 중복 검사 |
| DuplicateChecker | collectAllIds | FR-004 | BR-004 | ID 수집 헬퍼 |

### 3.2 데이터 구조

| 데이터 타입 | 목적 | 관련 요구사항 | 섹션 |
|-----------|------|-------------|------|
| ValidationResult | 검증 결과 반환 | IF-001 | 3.1 |
| ValidationError | 오류 상세 정보 | FR-001~005 | 3.1 |
| ValidationWarning | 경고 정보 | - | 3.1 |
| ErrorType | 오류 타입 분류 | FR-001~005 | 3.1 |

---

## 4. 테스트 케이스 추적성

### 4.1 단위 테스트 → 요구사항

| 테스트 ID | 테스트 케이스 | 검증 요구사항 | 설계 구성요소 |
|----------|-------------|-------------|-------------|
| UT-ID-001 | 유효한 WP ID 검증 | FR-001.1 | IdValidator |
| UT-ID-002 | 유효한 ACT ID 검증 | FR-001.2 | IdValidator |
| UT-ID-003 | 유효한 TSK ID (4단계) 검증 | FR-001.3 | IdValidator |
| UT-ID-004 | 유효한 TSK ID (3단계) 검증 | FR-001.4 | IdValidator |
| UT-ID-005 | 잘못된 WP ID 형식 오류 | FR-001.1, BR-001 | IdValidator |
| UT-ID-006 | 잘못된 TSK ID 형식 오류 | FR-001.3, BR-001 | IdValidator |
| UT-ATTR-001 | 모든 필수 속성 존재 | FR-002 | AttributeValidator |
| UT-ATTR-002 | WP/ACT는 속성 검증 스킵 | FR-002 | AttributeValidator |
| UT-ATTR-003 | category 누락 오류 | FR-002.1, BR-002 | AttributeValidator |
| UT-ATTR-004 | status 누락 오류 | FR-002.2, BR-002 | AttributeValidator |
| UT-ATTR-005 | priority 누락 오류 | FR-002.3, BR-002 | AttributeValidator |
| UT-ATTR-006 | 잘못된 category 값 | FR-002.1 | AttributeValidator |
| UT-ATTR-007 | 잘못된 priority 값 | FR-002.3 | AttributeValidator |
| UT-STATUS-001 | 유효한 상태 코드 | FR-003 | StatusValidator |
| UT-STATUS-002 | 잘못된 상태 코드 오류 | FR-003, BR-003 | StatusValidator |
| UT-DUP-001 | 중복 ID 검출 | FR-004, BR-004 | DuplicateChecker |
| UT-DUP-002 | 중복 없는 경우 | FR-004 | DuplicateChecker |
| UT-HIER-001 | 유효한 계층 관계 | FR-005 | HierarchyValidator |
| UT-HIER-002 | 계층 불일치 오류 | FR-005, BR-005 | HierarchyValidator |

### 4.2 통합 테스트 → 요구사항

| 테스트 ID | 테스트 케이스 | 검증 요구사항 | 설계 구성요소 |
|----------|-------------|-------------|-------------|
| IT-VAL-001 | 유효한 4단계 WBS 트리 | FR-001~005, IF-001 | WbsValidator |
| IT-VAL-002 | 유효한 3단계 WBS 트리 | FR-001~005, IF-001 | WbsValidator |
| IT-VAL-003 | 복합 오류 검출 | FR-001~005 | WbsValidator |
| IT-VAL-004 | 빈 트리 처리 | IF-001 | WbsValidator |
| IT-VAL-005 | 대량 노드 성능 테스트 | 성능 요구사항 | WbsValidator |

---

## 5. PRD 섹션 추적성

| PRD 섹션 | 요구사항 | 기본설계 | 상세설계 섹션 | 구현 파일 |
|---------|---------|---------|------------|----------|
| 7.3 | WBS 문법 규칙 | 3.1~3.4 | 3.2, 4.2~4.6 | validators/*.ts |
| 7.4 | Task 속성 | 3.2 | 3.1, 4.3 | attribute-validator.ts |
| 7.3.1 | ID 형식 | 3.1 | 3.2, 4.2 | id-validator.ts |
| 7.3.2 | 상태 코드 | 3.3 | 3.2, 4.4 | status-validator.ts |
| 7.4.1 | 필수 속성 | 3.2 | 4.3 | attribute-validator.ts |
| 7.4.2 | 계층 구조 | 3.5 | 4.5 | hierarchy-validator.ts |

---

## 6. 누락 사항 점검

### 6.1 요구사항 커버리지

| 항목 | 총 개수 | 설계 반영 | 미반영 | 커버리지 |
|------|--------|----------|-------|---------|
| 기능 요구사항 | 10 | 10 | 0 | 100% |
| 비즈니스 규칙 | 5 | 5 | 0 | 100% |
| 인터페이스 요구사항 | 6 | 6 | 0 | 100% |
| 수용 기준 | 6 | 6 | 0 | 100% |
| **합계** | **27** | **27** | **0** | **100%** |

### 6.2 설계 요소 출처 검증

모든 설계 요소가 요구사항에서 유래했는지 확인

| 설계 요소 | 출처 요구사항 | 검증 |
|---------|-------------|------|
| WbsValidator | IF-001 | ✓ |
| IdValidator | FR-001, IF-002 | ✓ |
| AttributeValidator | FR-002, IF-003 | ✓ |
| StatusValidator | FR-003, IF-004 | ✓ |
| HierarchyValidator | FR-005, IF-006 | ✓ |
| DuplicateChecker | FR-004, IF-005 | ✓ |
| ValidationResult | IF-001 | ✓ |
| ValidationError | FR-001~005 | ✓ |
| 오류 메시지 템플릿 | AC-003, AC-006 | ✓ |
| 성능 최적화 전략 | 품질 요구사항 | ✓ |

**결과**: 모든 설계 요소가 요구사항 또는 품질 속성에서 유래했음

---

## 7. 변경 이력 추적

| 버전 | 변경일 | 변경 유형 | 변경 내용 | 영향받는 요구사항 |
|------|-------|----------|----------|----------------|
| 1.0 | 2025-12-13 | 최초 작성 | 상세설계 및 추적성 매트릭스 작성 | 전체 |

---

## 8. 검토 체크리스트

| 검토 항목 | 상태 | 비고 |
|---------|------|------|
| 모든 기능 요구사항이 설계에 반영되었는가? | ✓ | 10/10 반영 |
| 모든 비즈니스 규칙이 설계에 반영되었는가? | ✓ | 5/5 반영 |
| 모든 인터페이스가 정의되었는가? | ✓ | 6/6 정의 |
| 모든 수용 기준에 대한 검증 방법이 명시되었는가? | ✓ | 6/6 명시 |
| 설계 요소가 요구사항 없이 추가되지 않았는가? | ✓ | 모두 추적 가능 |
| 테스트 케이스가 요구사항을 커버하는가? | ✓ | 100% 커버리지 |

---

## 관련 문서
- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
- TRD: `.jjiban/projects/jjiban/trd.md`
