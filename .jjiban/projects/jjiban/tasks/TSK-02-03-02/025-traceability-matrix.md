# 추적성 매트릭스: 설정 서비스 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-02 |
| 문서 유형 | Traceability Matrix |
| 작성일 | 2025-12-14 |
| 관련 문서 | 010-basic-design.md, 020-detail-design.md |

---

## 1. 추적성 매트릭스 개요

이 문서는 기능 요구사항(FR), 비즈니스 규칙(BR), 설계 요소, 테스트 케이스 간의 추적성을 제공합니다.

---

## 2. 요구사항 → 설계 추적

### 2.1 기능 요구사항 (Functional Requirements)

| FR ID | 요구사항 | 설계 함수/모듈 | 상세설계 섹션 | 우선순위 |
|-------|---------|---------------|--------------|---------|
| FR-001 | 설정 파일 로드 (없으면 기본값) | loadSettings(), loadFromFile() | 7.1, 8.1 | 필수 |
| FR-002 | 설정 캐싱 | SettingsCache, isCacheValid() | 6.2, 7.1 | 필수 |
| FR-003 | 설정 조회 API | /api/settings/[type].get.ts | 7.2 | 필수 |

### 2.2 비즈니스 규칙 (Business Rules)

| BR ID | 규칙 설명 | 구현 위치 | 상세설계 섹션 | 검증 방법 |
|-------|----------|----------|--------------|----------|
| BR-001 | 설정 파일 없으면 기본값 사용 | cache.ts - loadFromFile() | 9.1 | 단위 테스트 |
| BR-002 | JSON 파싱 오류 시 기본값 폴백 | cache.ts - loadFromFile() | 9.2 | 단위 테스트 |
| BR-003 | 서버 시작 시 1회 로드 후 캐싱 | cache.ts - 모듈 레벨 캐시 | 9.3 | 단위 테스트 |
| BR-004 | 설정 타입 4가지 제한 | [type].get.ts - 타입 체크 | 9.4 | API 테스트 |

---

## 3. 설계 → 요구사항 추적 (역방향)

### 3.1 함수별 요구사항 매핑

| 함수명 | 담당 FR | 담당 BR | 입력 | 출력 |
|--------|---------|---------|------|------|
| loadSettings() | FR-001, FR-002 | BR-001, BR-002, BR-003 | 없음 | Settings |
| loadFromFile() | FR-001 | BR-001, BR-002 | type, path | Config |
| isCacheValid() | FR-002 | BR-003 | 없음 | boolean |
| getSettingsByType() | FR-003 | BR-004 | type | Config |
| refreshCache() | FR-002 | BR-003 | 없음 | void |
| getColumns() | FR-003 | - | 없음 | ColumnsConfig |
| getCategories() | FR-003 | - | 없음 | CategoriesConfig |
| getWorkflows() | FR-003 | - | 없음 | WorkflowsConfig |
| getActions() | FR-003 | - | 없음 | ActionsConfig |

### 3.2 모듈별 요구사항 매핑

| 모듈 파일 | 담당 기능 | 관련 FR | 관련 BR |
|----------|----------|---------|---------|
| settings/cache.ts | 캐시 관리, 파일 로드 | FR-001, FR-002 | BR-001, BR-002, BR-003 |
| settings/index.ts | 서비스 함수 | FR-001, FR-002, FR-003 | - |
| api/settings/[type].get.ts | REST API | FR-003 | BR-004 |

---

## 4. 요구사항 → 테스트 추적

### 4.1 기능 요구사항 테스트 커버리지

| FR ID | 요구사항 | 테스트 케이스 ID | 테스트 유형 | 우선순위 |
|-------|---------|-----------------|-----------|---------|
| FR-001 | 설정 파일 로드 | UT-001, UT-002, UT-003 | 단위 | 필수 |
| FR-002 | 설정 캐싱 | UT-004, UT-005, UT-006 | 단위 | 필수 |
| FR-003 | 설정 조회 API | UT-007, UT-008, UT-009, UT-010 | 단위/API | 필수 |

### 4.2 비즈니스 규칙 테스트 커버리지

| BR ID | 규칙 설명 | 테스트 케이스 ID | 검증 방법 |
|-------|----------|-----------------|----------|
| BR-001 | 파일 없으면 기본값 | UT-002 | 기본값 반환 확인 |
| BR-002 | JSON 오류 시 기본값 | UT-003 | 기본값 반환, 경고 로그 확인 |
| BR-003 | 캐싱 동작 | UT-004, UT-005, UT-006 | 캐시 적중률 확인 |
| BR-004 | 타입 제한 | UT-010 | 400 에러 반환 확인 |

### 4.3 수용 기준 테스트 커버리지

| AC ID | 수용 기준 | 테스트 케이스 ID | 검증 방법 |
|-------|----------|-----------------|----------|
| AC-001 | 설정 파일 로드 정상 | UT-001 | 로드 결과 검증 |
| AC-002 | 기본값 사용 | UT-002, UT-003 | 기본값 비교 |
| AC-003 | 캐싱 동작 | UT-004, UT-005 | 캐시 상태 확인 |
| AC-004 | API 응답 | UT-007, UT-008, UT-009 | 응답 스키마 검증 |
| AC-005 | 400 에러 | UT-010 | 에러 응답 확인 |

---

## 5. 테스트 → 요구사항 추적 (역방향)

### 5.1 테스트 케이스 그룹별 요구사항 매핑

| 테스트 그룹 | 케이스 수 | 커버하는 FR | 커버하는 BR | 커버하는 AC |
|-----------|----------|------------|------------|------------|
| loadSettings 테스트 | 3 | FR-001 | BR-001, BR-002 | AC-001, AC-002 |
| 캐싱 테스트 | 3 | FR-002 | BR-003 | AC-003 |
| API 테스트 | 4 | FR-003 | BR-004 | AC-004, AC-005 |

---

## 6. 데이터/인터페이스 추적

### 6.1 데이터 모델 추적

| 데이터 타입 | 출처 | 사용 위치 | 용도 |
|-----------|------|----------|------|
| Settings | types/settings.ts | cache.ts, index.ts | 전체 설정 |
| ColumnsConfig | types/settings.ts | API, 캐시 | 칸반 컬럼 |
| CategoriesConfig | types/settings.ts | API, 캐시 | 카테고리 |
| WorkflowsConfig | types/settings.ts | API, 캐시 | 워크플로우 |
| ActionsConfig | types/settings.ts | API, 캐시 | 액션 |
| SettingsFileType | types/settings.ts | API 핸들러 | 타입 검증 |

### 6.2 인터페이스 추적

| API 엔드포인트 | 담당 FR | 요청 | 응답 |
|---------------|---------|------|------|
| GET /api/settings/columns | FR-003 | - | ColumnsConfig |
| GET /api/settings/categories | FR-003 | - | CategoriesConfig |
| GET /api/settings/workflows | FR-003 | - | WorkflowsConfig |
| GET /api/settings/actions | FR-003 | - | ActionsConfig |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 요약

| 요구사항 유형 | 총 개수 | 설계 커버 | 테스트 커버 | 커버리지 |
|-------------|---------|----------|-----------|---------|
| 기능 요구사항 (FR) | 3 | 3 | 3 | 100% |
| 비즈니스 규칙 (BR) | 4 | 4 | 4 | 100% |
| 수용 기준 (AC) | 5 | 5 | 5 | 100% |

### 7.2 설계 커버리지

| 설계 요소 | 총 개수 | 테스트 커버 | 커버리지 |
|----------|---------|-----------|---------|
| 서비스 함수 | 9 | 9 | 100% |
| API 엔드포인트 | 4 | 4 | 100% |
| 에러 시나리오 | 4 | 4 | 100% |

### 7.3 미매핑 항목

없음 - 모든 요구사항이 설계 및 테스트에 매핑됨.

---

## 8. 의존성 추적

### 8.1 선행 Task 의존성

| 선행 Task | 제공 항목 | 사용 위치 |
|----------|----------|----------|
| TSK-02-03-01 | Settings 타입 정의 | types/settings.ts |
| TSK-02-03-01 | DEFAULT_SETTINGS 상수 | settings/defaults.ts |
| TSK-02-03-01 | 헬퍼 함수 | settings/defaults.ts |

### 8.2 후행 Task 영향

| 후행 Task | 필요 항목 | 제공 방법 |
|----------|----------|----------|
| TSK-02-03-03 | 설정 조회 함수 | getWorkflows() 등 |
| TSK-03-03 | 워크플로우 설정 | getWorkflows() API |
| TSK-03-04 | 전체 설정 | loadSettings() |

---

## 9. 변경 영향 분석

### 9.1 요구사항 변경 시 영향

| 변경 시나리오 | 영향받는 FR | 영향받는 설계 | 영향받는 테스트 | 위험도 |
|-------------|-----------|-------------|---------------|--------|
| 새 설정 타입 추가 | FR-003 | SettingsFileType, API | UT-007~010 | 낮음 |
| 캐시 전략 변경 | FR-002 | cache.ts | UT-004~006 | 중간 |
| 기본값 변경 | FR-001 | defaults.ts | UT-002, UT-003 | 낮음 |

### 9.2 설계 변경 시 영향

| 설계 변경 | 영향받는 함수 | 영향받는 테스트 | 위험도 |
|----------|-------------|---------------|--------|
| 캐시 구조 변경 | loadSettings, refreshCache | UT-004~006 | 중간 |
| API 응답 형식 변경 | getSettingsByType | UT-007~010 | 낮음 |
| 에러 처리 방식 변경 | loadFromFile | UT-002, UT-003, UT-010 | 낮음 |

---

## 10. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 기본설계 | 010-basic-design.md | 요구사항 정의 |
| 상세설계 | 020-detail-design.md | 설계 상세 |
| 테스트 명세 | 026-test-specification.md | 테스트 케이스 |
| 선행 Task 설계 | TSK-02-03-01/010-tech-design.md | 스키마 참조 |

---

**문서 종료**
