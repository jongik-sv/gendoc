# 구현 문서: 설정 서비스 구현

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-02 |
| Category | development |
| 상태 | [im] 구현 |
| 상위 Activity | ACT-02-03 (Settings Service) |
| 상위 Work Package | WP-02 (Data Storage Layer) |
| 상세설계 참조 | 020-detail-design.md |
| PRD 참조 | PRD 8.1 |
| 작성일 | 2025-12-14 |

---

## 1. 구현 요약

| 항목 | 내용 |
|------|------|
| 구현 파일 수 | 4개 |
| 테스트 파일 수 | 2개 |
| 테스트 케이스 | 15개 |
| 테스트 통과율 | 100% |
| 핵심 커버리지 | cache.ts 87.5%, index.ts 100% |

---

## 2. 구현된 파일

### 2.1 신규 생성 파일

| 파일 경로 | 용도 | 라인 수 |
|----------|------|---------|
| `server/utils/settings/paths.ts` | 설정 경로 관리 | 37 |
| `server/utils/settings/cache.ts` | 설정 캐시 관리 | 120 |
| `server/api/settings/[type].get.ts` | REST API 핸들러 | 45 |

### 2.2 수정 파일

| 파일 경로 | 수정 내용 |
|----------|----------|
| `server/utils/settings/index.ts` | 서비스 함수 추가, cache.ts 연동 |
| `nuxt.config.ts` | jjibanBasePath runtimeConfig 추가 |

### 2.3 테스트 파일

| 파일 경로 | 테스트 수 | 통과 |
|----------|---------|------|
| `tests/utils/settings/cache.test.ts` | 6 | ✅ |
| `tests/utils/settings/service.test.ts` | 9 | ✅ |

### 2.4 테스트 픽스처

| 파일 경로 | 용도 |
|----------|------|
| `tests/fixtures/settings/valid-columns.json` | 정상 컬럼 설정 |
| `tests/fixtures/settings/valid-categories.json` | 정상 카테고리 설정 |
| `tests/fixtures/settings/valid-workflows.json` | 정상 워크플로우 설정 |
| `tests/fixtures/settings/valid-actions.json` | 정상 액션 설정 |
| `tests/fixtures/settings/invalid.json` | 잘못된 JSON |

---

## 3. 구현 상세

### 3.1 paths.ts - 경로 관리

**ISS-001 반영**: 하드코딩 대신 환경 설정 기반 경로 관리

```typescript
export function getSettingsBasePath(): string {
  return process.env.JJIBAN_BASE_PATH || process.cwd();
}

export function getSettingsDir(): string {
  return join(getSettingsBasePath(), '.jjiban', 'settings');
}

export function getSettingsFilePath(type: SettingsFileType): string {
  return join(getSettingsDir(), SETTINGS_FILE_NAMES[type]);
}
```

### 3.2 cache.ts - 캐시 관리

**BR-001, BR-002, BR-003 구현**:

```typescript
// BR-001: 파일 없으면 기본값 사용
if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
  return defaultValue;
}

// BR-002: JSON 파싱 오류 시 기본값 + 경고
if (error instanceof SyntaxError) {
  console.warn(`[Settings] Failed to parse ${type}.json, using defaults`);
  return defaultValue;
}

// BR-003: 싱글톤 캐시
let cache: CacheState = {
  settings: null,
  isLoaded: false,
  loadedAt: null,
};
```

### 3.3 index.ts - 서비스 함수

```typescript
// 서비스 함수
export async function loadSettings(): Promise<Settings>
export async function getColumns(): Promise<ColumnsConfig>
export async function getCategories(): Promise<CategoriesConfig>
export async function getWorkflows(): Promise<WorkflowsConfig>
export async function getActions(): Promise<ActionsConfig>
export async function getSettingsByType(type: SettingsFileType): Promise<...>

// 타입 가드
export function isValidSettingsType(type: string): type is SettingsFileType
```

### 3.4 API 핸들러

**BR-004 구현**: 설정 타입 4가지 제한

```typescript
export default defineEventHandler(async (event: H3Event) => {
  const type = getRouterParam(event, 'type');

  if (!type || !isValidSettingsType(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_SETTINGS_TYPE',
      message: `Invalid settings type: ${type}`,
    });
  }

  return await getSettingsByType(type as SettingsFileType);
});
```

---

## 4. 테스트 결과

### 4.1 테스트 실행 결과

```
✓ tests/utils/settings/cache.test.ts (6 tests) 8ms
✓ tests/utils/settings/service.test.ts (9 tests) 10ms

Test Files  2 passed (2)
     Tests  15 passed (15)
  Duration  312ms
```

### 4.2 테스트 케이스 매핑

| TC ID | 테스트 | 결과 |
|-------|--------|------|
| UT-001 | 설정 파일 정상 로드 | ✅ |
| UT-002 | 파일 없으면 기본값 | ✅ |
| UT-003 | JSON 오류 시 기본값 | ✅ |
| UT-004 | 캐시 적중 | ✅ |
| UT-005 | 캐시 유효성 확인 | ✅ |
| UT-006 | 캐시 무효화 | ✅ |
| UT-007 | getColumns 조회 | ✅ |
| UT-008 | getCategories 조회 | ✅ |
| UT-009 | getWorkflows/Actions | ✅ |
| UT-010 | 잘못된 타입 검사 | ✅ |

### 4.3 커버리지

| 파일 | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| cache.ts | 87.5% | 87.5% | 83.3% | 87.5% |
| index.ts | 100% | 100% | 100% | 100% |

---

## 5. 비즈니스 규칙 구현 확인

| BR | 설명 | 구현 위치 | 검증 |
|----|------|----------|------|
| BR-001 | 파일 없으면 기본값 | cache.ts:loadFromFile | UT-002 |
| BR-002 | JSON 오류 시 기본값 | cache.ts:loadFromFile | UT-003 |
| BR-003 | 캐싱 동작 | cache.ts:loadSettings | UT-004~006 |
| BR-004 | 타입 4가지 제한 | index.ts:isValidSettingsType | UT-010 |

---

## 6. API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/settings/columns | 칸반 컬럼 설정 조회 |
| GET | /api/settings/categories | 카테고리 설정 조회 |
| GET | /api/settings/workflows | 워크플로우 설정 조회 |
| GET | /api/settings/actions | 액션 설정 조회 |

---

## 7. 관련 문서

| 문서 | 위치 |
|------|------|
| 기본설계 | 010-basic-design.md |
| 상세설계 | 020-detail-design.md |
| 설계리뷰 | 021-design-review-claude-1(적용완료).md |
| 추적성 매트릭스 | 025-traceability-matrix.md |
| 테스트 명세 | 026-test-specification.md |

---

**문서 종료**
