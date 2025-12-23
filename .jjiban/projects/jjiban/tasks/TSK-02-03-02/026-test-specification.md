# 테스트 명세: 설정 서비스 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-02 |
| 문서 유형 | Test Specification |
| 작성일 | 2025-12-14 |
| 관련 문서 | 020-detail-design.md, 025-traceability-matrix.md |

---

## 1. 테스트 개요

### 1.1 테스트 범위

| 범위 | 내용 |
|------|------|
| 포함 | 설정 로드, 캐싱 동작, REST API 응답 |
| 제외 | 설정 수정 API, 스키마 검증 (TSK-02-03-01) |

### 1.2 테스트 유형

| 유형 | 도구 | 대상 |
|------|------|------|
| 단위 테스트 | Vitest | 서비스 함수, 캐시 모듈 |
| API 테스트 | Vitest + $fetch | REST API 핸들러 |

### 1.3 커버리지 목표

| 항목 | 목표 |
|------|------|
| 라인 커버리지 | 80% 이상 |
| 분기 커버리지 | 75% 이상 |
| 함수 커버리지 | 100% |

---

## 2. 테스트 환경

### 2.1 테스트 파일 구조

```
tests/
└── utils/
    └── settings/
        ├── cache.test.ts       # 캐시 모듈 테스트
        ├── service.test.ts     # 서비스 함수 테스트
        └── api.test.ts         # API 핸들러 테스트
```

### 2.2 테스트 픽스처

| 파일 | 용도 | 위치 |
|------|------|------|
| valid-columns.json | 정상 칸반 컬럼 설정 | tests/fixtures/settings/ |
| valid-categories.json | 정상 카테고리 설정 | tests/fixtures/settings/ |
| valid-workflows.json | 정상 워크플로우 설정 | tests/fixtures/settings/ |
| valid-actions.json | 정상 액션 설정 | tests/fixtures/settings/ |
| invalid.json | 잘못된 JSON 형식 | tests/fixtures/settings/ |

### 2.3 Mock 전략

| 대상 | Mock 방법 | 이유 |
|------|----------|------|
| 파일 시스템 | vi.mock('fs/promises') | 파일 존재/부재 시뮬레이션 |
| 콘솔 | vi.spyOn(console, 'warn') | 경고 로그 검증 |

---

## 3. 단위 테스트 케이스

### 3.1 loadSettings 테스트 그룹

#### UT-001: 설정 파일 정상 로드

| 항목 | 내용 |
|------|------|
| ID | UT-001 |
| 이름 | should load settings from files when all files exist |
| 관련 FR | FR-001 |
| 관련 AC | AC-001 |
| 사전 조건 | 모든 설정 파일 (columns, categories, workflows, actions) 존재 |
| 입력 | 없음 |
| 기대 결과 | 파일에서 로드된 Settings 객체 반환 |
| 검증 포인트 | 1. 반환 타입이 Settings<br>2. 각 설정이 파일 내용과 일치<br>3. 캐시에 저장됨 |

```typescript
it('UT-001: should load settings from files when all files exist', async () => {
  // Given: 모든 설정 파일이 존재
  vi.mocked(readFile).mockImplementation((path: string) => {
    if (path.includes('columns')) return Promise.resolve(JSON.stringify(mockColumns));
    if (path.includes('categories')) return Promise.resolve(JSON.stringify(mockCategories));
    if (path.includes('workflows')) return Promise.resolve(JSON.stringify(mockWorkflows));
    if (path.includes('actions')) return Promise.resolve(JSON.stringify(mockActions));
    return Promise.reject(new Error('Unknown file'));
  });

  // When: loadSettings 호출
  const settings = await loadSettings();

  // Then: 파일에서 로드된 설정 반환
  expect(settings.columns).toEqual(mockColumns);
  expect(settings.categories).toEqual(mockCategories);
  expect(settings.workflows).toEqual(mockWorkflows);
  expect(settings.actions).toEqual(mockActions);
});
```

---

#### UT-002: 설정 파일 없으면 기본값 사용

| 항목 | 내용 |
|------|------|
| ID | UT-002 |
| 이름 | should use default settings when files do not exist |
| 관련 FR | FR-001 |
| 관련 BR | BR-001 |
| 관련 AC | AC-002 |
| 사전 조건 | 설정 파일 없음 (ENOENT 에러) |
| 입력 | 없음 |
| 기대 결과 | DEFAULT_SETTINGS 반환 |
| 검증 포인트 | 1. 기본값과 일치<br>2. 에러 발생 없음 |

```typescript
it('UT-002: should use default settings when files do not exist', async () => {
  // Given: 파일이 존재하지 않음 (ENOENT)
  const error = new Error('ENOENT: no such file or directory');
  (error as any).code = 'ENOENT';
  vi.mocked(readFile).mockRejectedValue(error);

  // When: loadSettings 호출
  const settings = await loadSettings();

  // Then: 기본값 반환
  expect(settings).toEqual(DEFAULT_SETTINGS);
});
```

---

#### UT-003: JSON 파싱 오류 시 기본값 폴백

| 항목 | 내용 |
|------|------|
| ID | UT-003 |
| 이름 | should fallback to defaults and log warning on JSON parse error |
| 관련 FR | FR-001 |
| 관련 BR | BR-002 |
| 관련 AC | AC-002 |
| 사전 조건 | 설정 파일에 잘못된 JSON 포함 |
| 입력 | 없음 |
| 기대 결과 | 기본값 반환, 경고 로그 출력 |
| 검증 포인트 | 1. 기본값 반환<br>2. console.warn 호출됨 |

```typescript
it('UT-003: should fallback to defaults and log warning on JSON parse error', async () => {
  // Given: 잘못된 JSON 파일
  vi.mocked(readFile).mockResolvedValue('{ invalid json }');
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  // When: loadSettings 호출
  const settings = await loadSettings();

  // Then: 기본값 반환 및 경고 로그
  expect(settings).toEqual(DEFAULT_SETTINGS);
  expect(warnSpy).toHaveBeenCalled();

  warnSpy.mockRestore();
});
```

---

### 3.2 캐싱 테스트 그룹

#### UT-004: 캐시 적중 시 파일 재로드 없음

| 항목 | 내용 |
|------|------|
| ID | UT-004 |
| 이름 | should return cached settings without file read on subsequent calls |
| 관련 FR | FR-002 |
| 관련 BR | BR-003 |
| 관련 AC | AC-003 |
| 사전 조건 | 이전에 loadSettings 호출됨 |
| 입력 | 없음 |
| 기대 결과 | 캐시된 설정 반환, readFile 재호출 없음 |
| 검증 포인트 | 1. 두 번째 호출에서 readFile 호출 없음<br>2. 동일한 객체 참조 반환 |

```typescript
it('UT-004: should return cached settings without file read on subsequent calls', async () => {
  // Given: 첫 번째 호출 완료
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));
  await loadSettings();
  vi.mocked(readFile).mockClear();

  // When: 두 번째 호출
  const settings = await loadSettings();

  // Then: 파일 읽기 없이 캐시 반환
  expect(readFile).not.toHaveBeenCalled();
  expect(settings).toBeDefined();
});
```

---

#### UT-005: isCacheValid 캐시 유효성 확인

| 항목 | 내용 |
|------|------|
| ID | UT-005 |
| 이름 | should return true when cache is valid |
| 관련 FR | FR-002 |
| 관련 BR | BR-003 |
| 사전 조건 | 설정이 로드되어 캐시됨 |
| 입력 | 없음 |
| 기대 결과 | isCacheValid() === true |
| 검증 포인트 | isLoaded 플래그 확인 |

```typescript
it('UT-005: should return true when cache is valid', async () => {
  // Given: 설정 로드 완료
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));
  await loadSettings();

  // When: 캐시 유효성 확인
  const isValid = isCacheValid();

  // Then: true 반환
  expect(isValid).toBe(true);
});
```

---

#### UT-006: refreshCache 캐시 무효화

| 항목 | 내용 |
|------|------|
| ID | UT-006 |
| 이름 | should invalidate cache and reload on refreshCache |
| 관련 FR | FR-002 |
| 관련 BR | BR-003 |
| 사전 조건 | 설정이 캐시된 상태 |
| 입력 | 없음 |
| 기대 결과 | 캐시 무효화 후 다음 호출 시 재로드 |
| 검증 포인트 | 1. refreshCache 후 isCacheValid() === false<br>2. 다음 loadSettings에서 readFile 호출됨 |

```typescript
it('UT-006: should invalidate cache and reload on refreshCache', async () => {
  // Given: 캐시된 상태
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));
  await loadSettings();
  vi.mocked(readFile).mockClear();

  // When: 캐시 무효화
  refreshCache();

  // Then: 다음 호출에서 재로드
  expect(isCacheValid()).toBe(false);
  await loadSettings();
  expect(readFile).toHaveBeenCalled();
});
```

---

### 3.3 타입별 조회 테스트 그룹

#### UT-007: getColumns 정상 조회

| 항목 | 내용 |
|------|------|
| ID | UT-007 |
| 이름 | should return columns config |
| 관련 FR | FR-003 |
| 관련 AC | AC-004 |
| 사전 조건 | 설정 로드됨 |
| 입력 | 없음 |
| 기대 결과 | ColumnsConfig 반환 |
| 검증 포인트 | version 필드, columns 배열 존재 |

```typescript
it('UT-007: should return columns config', async () => {
  // Given: 설정 로드됨
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));

  // When: getColumns 호출
  const columns = await getColumns();

  // Then: ColumnsConfig 반환
  expect(columns).toHaveProperty('version');
  expect(columns).toHaveProperty('columns');
  expect(Array.isArray(columns.columns)).toBe(true);
});
```

---

#### UT-008: getCategories 정상 조회

| 항목 | 내용 |
|------|------|
| ID | UT-008 |
| 이름 | should return categories config |
| 관련 FR | FR-003 |
| 관련 AC | AC-004 |
| 사전 조건 | 설정 로드됨 |
| 입력 | 없음 |
| 기대 결과 | CategoriesConfig 반환 |
| 검증 포인트 | version 필드, categories 배열 존재 |

```typescript
it('UT-008: should return categories config', async () => {
  // Given: 설정 로드됨
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));

  // When: getCategories 호출
  const categories = await getCategories();

  // Then: CategoriesConfig 반환
  expect(categories).toHaveProperty('version');
  expect(categories).toHaveProperty('categories');
  expect(Array.isArray(categories.categories)).toBe(true);
});
```

---

#### UT-009: getWorkflows, getActions 정상 조회

| 항목 | 내용 |
|------|------|
| ID | UT-009 |
| 이름 | should return workflows and actions config |
| 관련 FR | FR-003 |
| 관련 AC | AC-004 |
| 사전 조건 | 설정 로드됨 |
| 입력 | 없음 |
| 기대 결과 | WorkflowsConfig, ActionsConfig 반환 |
| 검증 포인트 | 각 config의 version 필드 존재 |

```typescript
it('UT-009: should return workflows and actions config', async () => {
  // Given: 설정 로드됨
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSettings));

  // When: getWorkflows, getActions 호출
  const workflows = await getWorkflows();
  const actions = await getActions();

  // Then: 각 config 반환
  expect(workflows).toHaveProperty('version');
  expect(workflows).toHaveProperty('workflows');
  expect(actions).toHaveProperty('version');
  expect(actions).toHaveProperty('actions');
});
```

---

### 3.4 API 에러 테스트 그룹

#### UT-010: 잘못된 타입 요청 시 400 에러

| 항목 | 내용 |
|------|------|
| ID | UT-010 |
| 이름 | should return 400 for invalid settings type |
| 관련 FR | FR-003 |
| 관련 BR | BR-004 |
| 관련 AC | AC-005 |
| 사전 조건 | 없음 |
| 입력 | type = 'invalid' |
| 기대 결과 | 400 Bad Request 에러 |
| 검증 포인트 | 1. HTTP 상태 코드 400<br>2. 에러 메시지 포함 |

```typescript
it('UT-010: should return 400 for invalid settings type', async () => {
  // Given: 잘못된 타입
  const invalidType = 'invalid';

  // When: API 호출
  const response = await $fetch(`/api/settings/${invalidType}`, {
    ignoreResponseError: true,
  });

  // Then: 400 에러 반환
  expect(response.statusCode).toBe(400);
  expect(response.message).toContain('Invalid settings type');
});
```

---

## 4. API 통합 테스트 케이스

### 4.1 API 엔드포인트 테스트

#### AT-001: GET /api/settings/columns 정상 응답

| 항목 | 내용 |
|------|------|
| ID | AT-001 |
| 이름 | should return columns config via API |
| Method | GET |
| Endpoint | /api/settings/columns |
| 기대 응답 | 200, ColumnsConfig JSON |

```typescript
it('AT-001: should return columns config via API', async () => {
  const response = await $fetch('/api/settings/columns');

  expect(response).toHaveProperty('version');
  expect(response).toHaveProperty('columns');
});
```

---

#### AT-002: GET /api/settings/categories 정상 응답

| 항목 | 내용 |
|------|------|
| ID | AT-002 |
| 이름 | should return categories config via API |
| Method | GET |
| Endpoint | /api/settings/categories |
| 기대 응답 | 200, CategoriesConfig JSON |

```typescript
it('AT-002: should return categories config via API', async () => {
  const response = await $fetch('/api/settings/categories');

  expect(response).toHaveProperty('version');
  expect(response).toHaveProperty('categories');
});
```

---

#### AT-003: GET /api/settings/workflows 정상 응답

| 항목 | 내용 |
|------|------|
| ID | AT-003 |
| 이름 | should return workflows config via API |
| Method | GET |
| Endpoint | /api/settings/workflows |
| 기대 응답 | 200, WorkflowsConfig JSON |

```typescript
it('AT-003: should return workflows config via API', async () => {
  const response = await $fetch('/api/settings/workflows');

  expect(response).toHaveProperty('version');
  expect(response).toHaveProperty('workflows');
});
```

---

#### AT-004: GET /api/settings/actions 정상 응답

| 항목 | 내용 |
|------|------|
| ID | AT-004 |
| 이름 | should return actions config via API |
| Method | GET |
| Endpoint | /api/settings/actions |
| 기대 응답 | 200, ActionsConfig JSON |

```typescript
it('AT-004: should return actions config via API', async () => {
  const response = await $fetch('/api/settings/actions');

  expect(response).toHaveProperty('version');
  expect(response).toHaveProperty('actions');
});
```

---

## 5. 테스트 실행 명령어

### 5.1 전체 테스트 실행

```bash
npm run test -- tests/utils/settings/ --coverage
```

### 5.2 개별 파일 테스트

```bash
# 캐시 모듈 테스트
npm run test -- tests/utils/settings/cache.test.ts

# 서비스 함수 테스트
npm run test -- tests/utils/settings/service.test.ts

# API 테스트
npm run test -- tests/utils/settings/api.test.ts
```

### 5.3 Watch 모드

```bash
npm run test -- tests/utils/settings/ --watch
```

---

## 6. 테스트 케이스 요약

### 6.1 테스트 케이스 목록

| ID | 이름 | 유형 | 관련 요구사항 | 우선순위 |
|----|------|------|--------------|---------|
| UT-001 | 설정 파일 정상 로드 | 단위 | FR-001, AC-001 | 필수 |
| UT-002 | 파일 없으면 기본값 | 단위 | FR-001, BR-001, AC-002 | 필수 |
| UT-003 | JSON 오류 시 기본값 | 단위 | FR-001, BR-002, AC-002 | 필수 |
| UT-004 | 캐시 적중 | 단위 | FR-002, BR-003, AC-003 | 필수 |
| UT-005 | 캐시 유효성 확인 | 단위 | FR-002, BR-003 | 필수 |
| UT-006 | 캐시 무효화 | 단위 | FR-002, BR-003 | 필수 |
| UT-007 | getColumns 조회 | 단위 | FR-003, AC-004 | 필수 |
| UT-008 | getCategories 조회 | 단위 | FR-003, AC-004 | 필수 |
| UT-009 | getWorkflows/Actions | 단위 | FR-003, AC-004 | 필수 |
| UT-010 | 잘못된 타입 400 에러 | 단위 | FR-003, BR-004, AC-005 | 필수 |
| AT-001 | API columns 응답 | API | FR-003, AC-004 | 필수 |
| AT-002 | API categories 응답 | API | FR-003, AC-004 | 필수 |
| AT-003 | API workflows 응답 | API | FR-003, AC-004 | 필수 |
| AT-004 | API actions 응답 | API | FR-003, AC-004 | 필수 |

### 6.2 커버리지 매핑

| 요구사항 | 테스트 케이스 | 커버리지 |
|---------|-------------|---------|
| FR-001 | UT-001, UT-002, UT-003 | 100% |
| FR-002 | UT-004, UT-005, UT-006 | 100% |
| FR-003 | UT-007~UT-010, AT-001~AT-004 | 100% |
| BR-001 | UT-002 | 100% |
| BR-002 | UT-003 | 100% |
| BR-003 | UT-004, UT-005, UT-006 | 100% |
| BR-004 | UT-010 | 100% |

---

## 7. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 상세설계 | 020-detail-design.md | 함수 시그니처 참조 |
| 추적성 매트릭스 | 025-traceability-matrix.md | 요구사항 추적 |
| 선행 Task 테스트 | TSK-02-03-01/026-test-specification.md | 타입 테스트 참조 |

---

**문서 종료**
