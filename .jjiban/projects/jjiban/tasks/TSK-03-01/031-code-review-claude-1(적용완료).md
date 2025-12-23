# 코드 리뷰: Project API

## 리뷰 메타데이터
| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-01 |
| 리뷰어 | Claude (Refactoring Expert) |
| 리뷰 날짜 | 2025-12-14 |
| 리뷰 대상 | 구현 코드 (Backend API, Service Layer, Validators, Tests) |
| 검토 파일 수 | 11개 |
| 코드 라인 수 | ~1,400 LOC |

---

## 1. 리뷰 요약

### 1.1 전체 품질 점수: 8.5/10

**강점**:
- Facade 패턴을 활용한 우수한 서비스 계층 분리
- Zod를 활용한 체계적인 입력 검증
- 표준화된 에러 핸들링
- 높은 테스트 커버리지 (단위 테스트 + E2E 테스트)
- 경로 탐색 공격 방지 등 보안 고려

**개선 영역**:
- 중복 코드 및 일관성 문제
- 타입 안전성 일부 누락
- 트랜잭션 일관성 부재
- 성능 최적화 기회

### 1.2 이슈 요약

| 심각도 | 개수 | 설명 |
|--------|------|------|
| **Critical** | 2건 | 반드시 수정 필요 (데이터 일관성, 보안) |
| **Major** | 8건 | 권장 수정 (품질, 유지보수성) |
| **Minor** | 6건 | 선택적 개선 (코드 스타일, 최적화) |
| **총계** | 16건 | - |

---

## 2. Critical 이슈 (반드시 수정)

### CRIT-001: 트랜잭션 일관성 부재 - Facade 패턴 롤백 미구현

**파일**: `server/utils/projects/projectFacade.ts`
**위치**: `createProjectWithRegistration()` 함수 (25-47줄)

**문제**:
프로젝트 생성 플로우가 3단계로 나뉘어 있으나, 중간 단계 실패 시 롤백 메커니즘이 없습니다:

1. `createProject()` → 폴더 생성 + project.json + team.json 생성
2. `addProjectToList()` → projects.json 업데이트
3. `getTeam()` → 팀 조회

2단계에서 `addProjectToList()`가 실패하면 1단계에서 생성된 파일들이 orphan 상태로 남습니다.

```typescript
// 현재 코드 (라인 28-41)
const project = await createProject(dto);  // 1단계
await addProjectToList(listItem);          // 2단계 실패 시 롤백 없음
const team = await getTeam(project.id);    // 3단계
```

**영향도**:
- 데이터 불일치: projects.json에 없는 프로젝트 폴더가 존재
- 사용자 혼란: 파일 시스템에는 있으나 목록에 표시되지 않음
- 수동 정리 필요

**해결 방안**:
1. **Option A (권장)**: Try-catch로 롤백 구현
```typescript
async function createProjectWithRegistration(dto: CreateProjectDto) {
  let projectCreated = false;

  try {
    const project = await createProject(dto);
    projectCreated = true;

    const listItem: ProjectListItem = { /* ... */ };
    await addProjectToList(listItem);

    const team = await getTeam(project.id);
    return { project, team };
  } catch (error) {
    if (projectCreated) {
      // 롤백: 생성된 프로젝트 폴더 삭제
      await rollbackProjectCreation(dto.id);
    }
    throw error;
  }
}
```

2. **Option B**: 순서 변경 (projects.json 먼저 업데이트)
   - 단점: ID 중복 체크가 `addProjectToList` 내부에서만 수행되어 경쟁 조건 발생 가능

**SOLID 위반**: Open/Closed Principle - Facade가 예외 처리 확장에 닫혀 있음

---

### CRIT-002: 경로 탐색 공격 방어 불완전

**파일**: `server/utils/projects/paths.ts`
**위치**: `getBasePath()` 함수 (19-37줄)

**문제**:
환경 변수 `JJIBAN_BASE_PATH`의 경로 순회 공격 방어가 불완전합니다:

```typescript
// 현재 코드 (라인 31-34)
if (basePath.includes('..')) {
  console.warn(`[Security] Path traversal detected...`);
  return cwd;  // 경고만 출력하고 cwd 사용
}
```

**보안 취약점**:
1. URL 인코딩 우회: `%2e%2e` (.. 의 URL 인코딩)
2. 대소문자 혼용: Windows에서 `..` vs `..` (일부 파일시스템)
3. 다중 슬래시: `...///`, `./../`
4. 절대 경로 삽입: `/etc/passwd` (Unix), `C:\Windows` (Windows)

**영향도**:
- 환경 변수 조작 시 시스템 파일 접근 가능
- 임의 디렉토리에 프로젝트 파일 생성 가능

**해결 방안**:
```typescript
export function getBasePath(): string {
  const basePath = process.env.JJIBAN_BASE_PATH;
  const cwd = process.cwd();

  if (!basePath) {
    return cwd;
  }

  // 경로 정규화 (URL 디코딩 + normalize)
  const decoded = decodeURIComponent(basePath);
  const normalized = normalize(decoded);

  // 보안 검증 강화
  if (
    decoded.includes('..') ||           // 기본 체크
    normalized.includes('..') ||        // 정규화 후 체크
    !isAbsolute(normalized) ||          // 상대 경로 거부
    normalized !== resolve(normalized)  // 심볼릭 링크 체크
  ) {
    throw createBadRequestError(
      'INVALID_BASE_PATH',
      '잘못된 기본 경로입니다'
    );
  }

  return normalized;
}
```

**추가 권고**:
- 허용 경로 화이트리스트 검증 추가
- 환경 변수 설정 시 검증 로직 별도 제공

---

## 3. Major 이슈 (권장 수정)

### MAJ-001: 타입 단언 남용 - 타입 가드 미사용

**파일**: `server/utils/projects/teamService.ts`
**위치**: 25줄

**문제**:
에러 객체 타입 체크 시 타입 캐스팅 사용:

```typescript
// 현재 코드 (라인 25)
if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
```

다른 파일에서는 타입 가드 사용:
```typescript
// projectService.ts (라인 28) - 올바른 방식
if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
```

**영향도**:
- 타입 안전성 저하
- 런타임 에러 가능성
- 일관성 부족

**해결 방안**:
공통 타입 가드 유틸리티 생성:

```typescript
// server/utils/errors/typeGuards.ts (신규 파일)
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

// 사용
if (isNodeError(error) && error.code === 'ENOENT') {
  // 타입 안전하게 사용
}
```

**SOLID 위반**: Interface Segregation - 타입 체크 로직이 분산되어 있음

---

### MAJ-002: 중복 코드 - 에러 핸들링 패턴

**파일**:
- `server/utils/projects/projectService.ts` (26-32줄)
- `server/utils/projects/projectsListService.ts` (33-51줄)
- `server/utils/projects/teamService.ts` (23-29줄)

**문제**:
파일 읽기 에러 핸들링 로직이 3개 파일에 중복:

```typescript
// 패턴 1: projectService.ts
try {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
} catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    throw createNotFoundError('...');
  }
  throw createInternalError('FILE_READ_ERROR', '...');
}

// 패턴 2: projectsListService.ts - ENOENT 시 기본값 반환
// 패턴 3: teamService.ts - ENOENT 시 빈 배열 반환
```

**순환 복잡도**: 각 함수 4-5 (중간 수준)

**해결 방안**:
공통 파일 읽기 유틸리티 추출:

```typescript
// server/utils/files/jsonReader.ts (신규 파일)
export async function readJsonFile<T>(
  filePath: string,
  options: {
    notFoundHandler?: () => T;           // ENOENT 시 기본값
    errorMessage?: string;                // 사용자 메시지
  } = {}
): Promise<T> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      if (options.notFoundHandler) {
        return options.notFoundHandler();
      }
      throw createNotFoundError(
        options.errorMessage || '요청한 리소스를 찾을 수 없습니다'
      );
    }

    if (error instanceof SyntaxError) {
      throw createInternalError('JSON_PARSE_ERROR', 'JSON 파싱 실패');
    }

    throw createInternalError(
      'FILE_READ_ERROR',
      options.errorMessage || '파일을 읽는 중 오류가 발생했습니다'
    );
  }
}

// 사용 예시
// projectService.ts
const project = await readJsonFile<ProjectConfig>(filePath, {
  errorMessage: '프로젝트 정보를 읽는 중 오류가 발생했습니다'
});

// projectsListService.ts
const config = await readJsonFile<ProjectsConfig>(filePath, {
  notFoundHandler: () => DEFAULT_PROJECTS_CONFIG
});

// teamService.ts
const config = await readJsonFile<TeamConfig>(filePath, {
  notFoundHandler: () => ({ version: '1.0', members: [] })
});
```

**기대 효과**:
- 코드 라인 수 30% 감소
- 순환 복잡도 감소 (4 → 2)
- 테스트 집중화 (1개 함수만 테스트)

**SOLID 위반**: DRY (Don't Repeat Yourself) 원칙 위반

---

### MAJ-003: 매직 넘버 하드코딩 - 설정 집중화 필요

**파일**: 여러 파일
- `server/utils/validators/projectValidators.ts` (18, 25, 26, 56, 57줄)
- `server/utils/projects/projectService.ts` (46줄)

**문제**:
문자열 길이, 버전 등 매직 넘버/문자열 하드코딩:

```typescript
// projectValidators.ts
.max(100, '프로젝트 ID는 100자 이하여야 합니다')
.max(1000, '설명은 1000자 이하여야 합니다')
.max(50, '팀원 ID는 50자 이하여야 합니다')

// projectService.ts
version: '0.1.0',  // 하드코딩
```

**영향도**:
- 유지보수성 저하 (값 변경 시 여러 곳 수정)
- 일관성 보장 어려움
- 비즈니스 규칙 파악 어려움

**해결 방안**:
상수 파일 생성:

```typescript
// server/utils/projects/constants.ts (신규 파일)
export const PROJECT_CONSTRAINTS = {
  ID_MAX_LENGTH: 100,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  MEMBER_ID_MAX_LENGTH: 50,
  MEMBER_NAME_MAX_LENGTH: 50,
  DEFAULT_VERSION: '0.1.0',
  DEFAULT_STATUS: 'active' as const,
  DEFAULT_WBS_DEPTH: 4 as const,
  ALLOWED_WBS_DEPTHS: [3, 4] as const,
} as const;

export const FILE_VERSIONS = {
  PROJECT: '1.0',
  TEAM: '1.0',
  PROJECTS_LIST: '1.0',
} as const;

// 사용 예시
import { PROJECT_CONSTRAINTS } from './constants';

.max(PROJECT_CONSTRAINTS.ID_MAX_LENGTH,
     `프로젝트 ID는 ${PROJECT_CONSTRAINTS.ID_MAX_LENGTH}자 이하여야 합니다`)
```

**기대 효과**:
- 단일 진실 공급원 (Single Source of Truth)
- 비즈니스 규칙 중앙 관리
- 테스트 용이성 향상

---

### MAJ-004: 불완전한 입력 검증 - ID 변경 방지 로직

**파일**: `server/utils/projects/projectService.ts`
**위치**: 87-90줄

**문제**:
ID 변경 방지 검증이 서비스 계층에 있으나, Zod 스키마에도 중복 정의:

```typescript
// projectService.ts (라인 87-90)
if ('id' in dto && dto.id !== undefined) {
  throw createBadRequestError('ID_IMMUTABLE', '프로젝트 ID는 변경할 수 없습니다');
}

// projectValidators.ts (라인 39-41)
id: z.undefined({
  errorMap: () => ({ message: '프로젝트 ID는 변경할 수 없습니다' })
}).optional(),
```

**문제점**:
1. **중복 검증**: Zod와 서비스 계층 양쪽에서 검증
2. **타입 불일치**: `UpdateProjectDto`에 `id` 필드가 타입에 없으나 런타임 체크
3. **우회 가능**: TypeScript 타입 단언으로 우회 가능

**영향도**:
- 불필요한 코드 중복
- 타입 안전성 혼란

**해결 방안**:
Zod 스키마만 사용하고 서비스 계층 검증 제거:

```typescript
// projectValidators.ts - 현행 유지 (충분함)
export const updateProjectSchema = z.object({
  id: z.undefined({
    errorMap: () => ({ message: '프로젝트 ID는 변경할 수 없습니다' })
  }).optional(),
  // ... 기타 필드
});

// projectService.ts - 중복 검증 제거
export async function updateProject(
  projectId: string,
  dto: UpdateProjectDto  // id 필드 없음이 타입으로 보장됨
): Promise<ProjectConfig> {
  // 87-90줄 삭제 (Zod가 이미 검증)
  const project = await getProject(projectId);
  // ...
}
```

**참고**: API 계층에서 Zod 검증이 먼저 실행되므로 서비스 계층 검증은 불필요

---

### MAJ-005: 에러 메시지 일관성 부족

**파일**: `server/utils/errors/standardError.ts`, 각 서비스 파일

**문제**:
에러 메시지 형식과 상태 코드가 불일관적:

```typescript
// projectsListService.ts (라인 158)
throw createInternalError('INVALID_PROJECT_ID', '존재하지 않는 프로젝트 ID입니다');
// → 500 에러이나 실제로는 404 또는 400이 적절

// standardError.ts (라인 44)
export function createNotFoundError(message: string) {
  return createStandardError(404, 'PROJECT_NOT_FOUND', message);
  // → statusMessage가 고정되어 있어 세밀한 에러 구분 불가
}
```

**영향도**:
- 클라이언트가 에러 유형 파악 어려움
- HTTP 상태 코드 오용
- API 문서화 혼란

**해결 방안**:

```typescript
// server/utils/errors/errorCodes.ts (신규 파일)
export const ErrorCodes = {
  // 400 Bad Request
  VALIDATION_ERROR: { status: 400, message: '입력 검증 실패' },
  INVALID_PROJECT_ID: { status: 400, message: '잘못된 프로젝트 ID 형식' },
  INVALID_WBS_DEPTH: { status: 400, message: 'WBS 깊이는 3 또는 4여야 함' },
  ID_IMMUTABLE: { status: 400, message: '프로젝트 ID는 변경 불가' },
  DUPLICATE_MEMBER_ID: { status: 400, message: '팀원 ID 중복' },

  // 404 Not Found
  PROJECT_NOT_FOUND: { status: 404, message: '프로젝트를 찾을 수 없음' },

  // 409 Conflict
  DUPLICATE_PROJECT_ID: { status: 409, message: '이미 존재하는 프로젝트 ID' },

  // 500 Internal Server Error
  FILE_READ_ERROR: { status: 500, message: '파일 읽기 실패' },
  FILE_WRITE_ERROR: { status: 500, message: '파일 쓰기 실패' },
} as const;

// standardError.ts 개선
export function createApiError(
  code: keyof typeof ErrorCodes,
  customMessage?: string
) {
  const errorDef = ErrorCodes[code];
  return createStandardError(
    errorDef.status,
    code,
    customMessage || errorDef.message
  );
}

// 사용
throw createApiError('PROJECT_NOT_FOUND', '요청한 프로젝트를 찾을 수 없습니다');
```

**기대 효과**:
- 에러 코드 중앙 관리
- 상태 코드 일관성 보장
- API 문서 자동 생성 가능

---

### MAJ-006: 성능 최적화 기회 - 병렬 처리 미활용

**파일**: `server/api/projects/[id].get.ts`
**위치**: 14-17줄

**긍정적 발견**: 이미 `Promise.all` 사용 중!

```typescript
const [project, team] = await Promise.all([
  getProject(projectId),
  getTeam(projectId),
]);
```

하지만 **일부 개선 여지**:

**문제**: `getTeam()` 내부에서 파일 없을 시 빈 배열 반환하나, `getProject()`는 예외 발생
→ `Promise.all`이 한쪽 실패 시 전체 실패

**개선 방안**:
```typescript
const [project, team] = await Promise.all([
  getProject(projectId),
  getTeam(projectId).catch(() => [])  // team은 선택적 데이터로 처리
]);
```

또는 팀 조회 실패를 명시적으로 처리:
```typescript
const [project, teamResult] = await Promise.allSettled([
  getProject(projectId),
  getTeam(projectId),
]);

if (project.status === 'rejected') {
  throw project.reason;
}

const team = teamResult.status === 'fulfilled' ? teamResult.value : [];
```

---

### MAJ-007: 누락된 projects.json 업데이트 - 프로젝트 수정 시

**파일**: `server/api/projects/[id].put.ts`

**문제**:
프로젝트 수정 API가 `project.json`만 업데이트하고 `projects.json`의 목록 항목은 업데이트하지 않음:

```typescript
// [id].put.ts (현재 구현)
const project = await updateProject(projectId, dto);
return { project };  // projects.json 업데이트 없음
```

**영향도**:
- 프로젝트 이름 변경 시 목록에 반영 안 됨
- 상태 변경 시 필터링 오류
- 데이터 불일치

**해결 방안**:
Facade에 업데이트 메서드 추가:

```typescript
// projectFacade.ts
export async function updateProjectWithList(
  projectId: string,
  dto: UpdateProjectDto
): Promise<ProjectDetail> {
  // 1. 프로젝트 수정
  const project = await updateProject(projectId, dto);

  // 2. 목록 동기화 (name, status 변경 시)
  if (dto.name || dto.status) {
    await updateProjectInList(projectId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.status && { status: dto.status }),
    });
  }

  // 3. 팀 조회
  const team = await getTeam(projectId);

  return { project, team };
}

// [id].put.ts
const result = await updateProjectWithList(projectId, dto);
return result;
```

---

### MAJ-008: 테스트 데이터 정리 누락

**파일**: `tests/utils/projects/api-integration.test.ts`
**위치**: 381-416줄

**문제**:
통합 테스트에서 여러 프로젝트를 생성하나 테스트 간 격리가 불완전:

```typescript
// 테스트마다 새 프로젝트 생성
await createProjectWithRegistration({ id: 'lifecycle-test', ... });
await createProjectWithRegistration({ id: 'valid-project', ... });
await createProjectWithRegistration({ id: 'project123', ... });
```

**영향도**:
- 테스트 순서 의존성 발생 가능
- 디스크 공간 낭비 (cleanup 없음)
- 테스트 실패 시 디버깅 어려움

**해결 방안**:
각 테스트 후 정리:

```typescript
describe('Project Lifecycle', () => {
  const createdProjects: string[] = [];

  afterEach(async () => {
    // 생성된 프로젝트 정리
    for (const id of createdProjects) {
      try {
        await rm(join(TEST_BASE, '.jjiban', 'projects', id),
                 { recursive: true, force: true });
      } catch {}
    }
    createdProjects.length = 0;
  });

  it('should create project', async () => {
    const result = await createProjectWithRegistration({ id: 'test-1', ... });
    createdProjects.push('test-1');
    // ...
  });
});
```

---

## 4. Minor 이슈 (선택적 개선)

### MIN-001: 불필요한 주석 - 섹션 참조

**파일**: 여러 파일 (헤더 주석)

**문제**:
파일 헤더에 상세설계 섹션 참조가 있으나 실제 활용도 낮음:

```typescript
/**
 * 프로젝트 서비스
 * Task: TSK-02-03-03
 * 상세설계: 020-detail-design.md 섹션 5.1  // ← 유지보수 부담
 */
```

**개선 방안**:
Task ID만 남기고 섹션 참조 제거 (섹션 번호는 변경 가능):

```typescript
/**
 * 프로젝트 서비스
 * @task TSK-02-03-03
 * @see {@link 020-detail-design.md}
 */
```

---

### MIN-002: 네이밍 일관성 - 서비스 vs 리스트

**파일**:
- `projectService.ts` (단수)
- `projectsListService.ts` (복수 + List)

**문제**:
파일명 규칙이 불일관적

**제안**:
- `projectService.ts` → `projectService.ts` (단일 프로젝트 관리)
- `projectsListService.ts` → `projectListService.ts` (단수 통일)

또는 폴더 구조로 명확화:
```
server/utils/projects/
├── project/
│   └── service.ts
├── list/
│   └── service.ts
└── team/
    └── service.ts
```

---

### MIN-003: 로깅 부재 - 운영 모니터링 어려움

**파일**: 모든 서비스 파일

**문제**:
에러 로그는 있으나 정상 동작 로그 부재:
- 프로젝트 생성/수정 이벤트 로그 없음
- 성능 측정 메트릭 없음

**개선 제안**:
```typescript
import { logger } from '../logger';

export async function createProject(dto: CreateProjectDto) {
  const startTime = Date.now();
  logger.info('Creating project', { projectId: dto.id });

  try {
    // ... 생성 로직
    logger.info('Project created successfully', {
      projectId: dto.id,
      duration: Date.now() - startTime
    });
    return project;
  } catch (error) {
    logger.error('Failed to create project', {
      projectId: dto.id,
      error: error.message,
      duration: Date.now() - startTime
    });
    throw error;
  }
}
```

---

### MIN-004: 타입 추론 개선 기회

**파일**: `server/api/projects/index.post.ts`
**위치**: 11줄

**문제**:
반환 타입 명시 없음:

```typescript
export default defineEventHandler(async (event) => {
  // 반환 타입 추론에 의존
  return result;
});
```

**개선 제안**:
```typescript
export default defineEventHandler(async (event): Promise<ProjectDetail> => {
  // 명시적 반환 타입
  return result;
});
```

---

### MIN-005: Zod 스키마 재사용 부족

**파일**: `server/utils/validators/projectValidators.ts`

**문제**:
이메일, ID 패턴 등이 중복 정의 가능성:

```typescript
// 프로젝트 ID 패턴
const projectIdSchema = z.string()
  .regex(/^[a-z0-9-]+$/, '...')
  .min(1)
  .max(100);

// 팀원 ID - 다른 패턴 사용
id: z.string().min(1).max(50)
```

**개선 제안**:
공통 스키마 추출:

```typescript
// 재사용 가능한 기본 스키마
const idSchema = z.string().min(1, 'ID는 필수입니다');

const projectIdSchema = idSchema
  .regex(/^[a-z0-9-]+$/, '영소문자, 숫자, 하이픈만 허용')
  .max(100, '100자 이하');

const memberIdSchema = idSchema.max(50, '50자 이하');

const emailSchema = z.string().email('올바른 이메일 형식이 아닙니다').optional();
```

---

### MIN-006: E2E 테스트 HTTP 상태 코드 201 누락

**파일**: `tests/e2e/projects.spec.ts`
**위치**: 180줄

**문제**:
프로젝트 생성 성공 시 201 Created가 아닌 200 OK 반환:

```typescript
// [id].post.ts - 실제 응답 코드
expect(response.status()).toBe(201);  // E2E 테스트 예상

// 하지만 구현에서 status code 명시 없음
return result;  // 기본 200 반환
```

**개선 방안**:
```typescript
// server/api/projects/index.post.ts
export default defineEventHandler(async (event) => {
  // ... 생성 로직
  setResponseStatus(event, 201);  // 명시적 201 설정
  return result;
});
```

---

## 5. 개선 제안

### 5.1 아키텍처 개선

#### 제안 A: Repository 패턴 도입

**현재 문제**:
서비스 계층이 파일 I/O를 직접 수행하여 테스트 어려움

**개선안**:
```typescript
// server/utils/projects/repository.ts
export interface ProjectRepository {
  findById(id: string): Promise<ProjectConfig | null>;
  findAll(): Promise<ProjectsConfig>;
  save(project: ProjectConfig): Promise<void>;
  delete(id: string): Promise<void>;
}

export class FileSystemProjectRepository implements ProjectRepository {
  async findById(id: string): Promise<ProjectConfig | null> {
    try {
      return await readJsonFile<ProjectConfig>(
        getProjectFilePath(id, 'project.json')
      );
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }
  // ... 기타 메서드
}

// 테스트용 메모리 구현
export class InMemoryProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectConfig>();
  // ... 구현
}
```

**장점**:
- 테스트 용이성 (Mock 불필요)
- 향후 데이터베이스 전환 용이
- SOLID: Dependency Inversion Principle 준수

---

#### 제안 B: 도메인 이벤트 발행

**목적**: 프로젝트 생성/수정 시 다른 모듈 통지

```typescript
// server/utils/events/projectEvents.ts
export enum ProjectEventType {
  CREATED = 'project.created',
  UPDATED = 'project.updated',
  DELETED = 'project.deleted',
}

export interface ProjectEvent {
  type: ProjectEventType;
  projectId: string;
  timestamp: string;
  data: any;
}

// 이벤트 발행
export class EventBus {
  private handlers = new Map<ProjectEventType, Array<(event: ProjectEvent) => void>>();

  on(type: ProjectEventType, handler: (event: ProjectEvent) => void) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  emit(event: ProjectEvent) {
    const handlers = this.handlers.get(event.type) || [];
    handlers.forEach(h => h(event));
  }
}

// 사용
export async function createProject(dto: CreateProjectDto) {
  const project = await createProjectFiles(dto);

  eventBus.emit({
    type: ProjectEventType.CREATED,
    projectId: project.id,
    timestamp: new Date().toISOString(),
    data: project,
  });

  return project;
}
```

**활용 예시**:
- 프로젝트 생성 시 WBS 초기화 트리거
- 감사 로그 자동 기록
- 캐시 무효화

---

### 5.2 성능 개선

#### 제안 C: 프로젝트 목록 캐싱

**현재 문제**:
매 요청마다 `projects.json` 파일 읽기

**개선안**:
```typescript
// server/utils/projects/cache.ts
class ProjectListCache {
  private cache: ProjectsConfig | null = null;
  private lastModified: number = 0;

  async get(): Promise<ProjectsConfig> {
    const filePath = getProjectsListFilePath();
    const stats = await stat(filePath);

    // 파일 변경되지 않았으면 캐시 반환
    if (this.cache && stats.mtimeMs === this.lastModified) {
      return this.cache;
    }

    // 캐시 갱신
    this.cache = await loadProjectsList();
    this.lastModified = stats.mtimeMs;
    return this.cache;
  }

  invalidate() {
    this.cache = null;
  }
}

export const projectListCache = new ProjectListCache();
```

**주의사항**:
- 다중 프로세스 환경에서는 파일 감시(File Watcher) 필요
- 캐시 무효화 타이밍 주의

---

### 5.3 보안 강화

#### 제안 D: 입력 Sanitization

**목적**: XSS 공격 방어

```typescript
// server/utils/validators/sanitizers.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeProjectInput(dto: CreateProjectDto): CreateProjectDto {
  return {
    ...dto,
    name: DOMPurify.sanitize(dto.name),
    description: dto.description ? DOMPurify.sanitize(dto.description) : undefined,
  };
}

// 사용
const sanitized = sanitizeProjectInput(dto);
const project = await createProject(sanitized);
```

---

## 6. 긍정적 측면

### 6.1 우수한 설계 패턴 적용

1. **Facade 패턴** (`projectFacade.ts`):
   - 복잡한 프로젝트 생성 플로우를 단순한 인터페이스로 제공
   - 서비스 간 결합도 감소

2. **Zod 입력 검증**:
   - 타입 안전성과 런타임 검증 통합
   - 일관된 에러 메시지
   - TypeScript 타입 자동 추론

3. **경로 관리 중앙화** (`paths.ts`):
   - 하드코딩 방지 (DR-001)
   - 경로 탐색 공격 방어 (DR-009)
   - 테스트 환경 분리 (JJIBAN_BASE_PATH)

4. **표준화된 에러 응답**:
   - 일관된 에러 구조 (`statusCode`, `statusMessage`, `message`, `timestamp`)
   - 에러 헬퍼 함수로 재사용성 향상

### 6.2 높은 테스트 커버리지

- **단위 테스트**: 핵심 비즈니스 로직 테스트
- **E2E 테스트**: 실제 API 흐름 검증
- **Edge Case 테스트**: 경계 조건, 에러 케이스 포함

### 6.3 명확한 책임 분리

| 계층 | 책임 | 예시 |
|------|------|------|
| API 계층 | HTTP 요청/응답, 라우팅 | `server/api/projects/*.ts` |
| Facade 계층 | 서비스 조율, 복합 작업 | `projectFacade.ts` |
| Service 계층 | 비즈니스 로직, CRUD | `projectService.ts` |
| Validator 계층 | 입력 검증 | `projectValidators.ts` |
| Util 계층 | 공통 유틸리티 | `paths.ts`, `standardError.ts` |

---

## 7. 수정 체크리스트

### 7.1 Critical (필수 수정)

- [ ] **CRIT-001**: Facade 패턴에 트랜잭션 롤백 메커니즘 추가
  - 파일: `projectFacade.ts`
  - 예상 작업: 2-3시간
  - 우선순위: P0

- [ ] **CRIT-002**: 경로 탐색 공격 방어 강화
  - 파일: `paths.ts`
  - 예상 작업: 1-2시간
  - 우선순위: P0

### 7.2 Major (권장 수정)

- [ ] **MAJ-001**: 타입 가드 유틸리티 생성 및 일관성 적용
  - 파일: `typeGuards.ts` (신규), `teamService.ts`, `projectService.ts`
  - 예상 작업: 2시간

- [ ] **MAJ-002**: 공통 JSON 읽기 유틸리티 추출
  - 파일: `jsonReader.ts` (신규), 모든 서비스 파일
  - 예상 작업: 3-4시간
  - 기대 효과: 코드 30% 감소

- [ ] **MAJ-003**: 상수 파일 생성 및 매직 넘버 제거
  - 파일: `constants.ts` (신규)
  - 예상 작업: 1-2시간

- [ ] **MAJ-004**: ID 변경 방지 중복 검증 제거
  - 파일: `projectService.ts`
  - 예상 작업: 30분

- [ ] **MAJ-005**: 에러 코드 표준화
  - 파일: `errorCodes.ts` (신규), `standardError.ts`
  - 예상 작업: 2-3시간

- [ ] **MAJ-007**: 프로젝트 수정 시 목록 동기화
  - 파일: `projectFacade.ts`, `[id].put.ts`
  - 예상 작업: 1-2시간

- [ ] **MAJ-008**: 테스트 데이터 정리 로직 추가
  - 파일: `api-integration.test.ts`
  - 예상 작업: 1시간

### 7.3 Minor (선택적 개선)

- [ ] **MIN-001**: 주석 간소화
- [ ] **MIN-002**: 파일명 일관성 개선
- [ ] **MIN-003**: 로깅 인프라 추가
- [ ] **MIN-004**: 타입 명시적 선언
- [ ] **MIN-005**: Zod 스키마 재사용
- [ ] **MIN-006**: HTTP 201 상태 코드 명시

### 7.4 개선 제안 (장기 과제)

- [ ] **제안 A**: Repository 패턴 도입 (Phase 2)
- [ ] **제안 B**: 도메인 이벤트 발행 (Phase 2)
- [ ] **제안 C**: 프로젝트 목록 캐싱 (성능 필요 시)
- [ ] **제안 D**: 입력 Sanitization (보안 강화)

---

## 8. 우선순위 로드맵

### Phase 1: 즉시 수정 (1주일)
1. **CRIT-001, CRIT-002**: 데이터 일관성 및 보안 (P0)
2. **MAJ-002**: 중복 코드 제거 (가장 큰 효과)
3. **MAJ-003**: 상수 집중화
4. **MAJ-007**: 프로젝트 수정 버그

### Phase 2: 품질 개선 (2주일)
5. **MAJ-001, MAJ-004, MAJ-005**: 타입 안전성 및 일관성
6. **MAJ-008**: 테스트 안정성
7. **MIN-003**: 로깅 인프라

### Phase 3: 아키텍처 리팩토링 (1개월)
8. **제안 A**: Repository 패턴
9. **제안 B**: 이벤트 기반 아키텍처
10. **제안 C**: 캐싱 전략

---

## 9. 결론

### 9.1 종합 평가

현재 구현은 **전반적으로 우수한 품질**을 보이며, 특히 다음 부분에서 뛰어납니다:
- ✅ SOLID 원칙 준수 (Facade, 계층 분리)
- ✅ 입력 검증 체계 (Zod)
- ✅ 테스트 커버리지
- ✅ 보안 고려 (경로 탐색 방지)

**개선이 필요한 핵심 영역**:
- ⚠️ 트랜잭션 일관성 (CRIT-001)
- ⚠️ 보안 강화 (CRIT-002)
- ⚠️ 중복 코드 제거 (MAJ-002)
- ⚠️ 데이터 동기화 (MAJ-007)

### 9.2 권고사항

**즉시 조치**:
1. Critical 이슈 2건을 우선 해결하여 데이터 무결성 및 보안 확보
2. MAJ-002(중복 코드)를 제거하여 유지보수성 향상

**단기 조치** (2주 내):
3. 에러 처리 표준화 (MAJ-005)
4. 프로젝트 수정 동기화 (MAJ-007)

**장기 조치** (1개월 내):
5. Repository 패턴 도입 검토 (테스트 용이성)
6. 캐싱 전략 구현 (성능 개선)

### 9.3 최종 의견

**이 구현은 production-ready 수준**에 가까우나, Critical 이슈 2건은 배포 전 반드시 수정이 필요합니다. Major 이슈는 점진적으로 개선하되, MAJ-002(중복 코드)와 MAJ-007(데이터 동기화)는 우선 순위가 높습니다.

전체적으로 **잘 설계된 코드베이스**이며, 제안된 개선사항을 적용하면 **엔터프라이즈급 품질**에 도달할 수 있습니다.

---

## 참고 문서

- 상세설계: `.jjiban/projects/jjiban/tasks/TSK-03-01/020-detail-design.md`
- 테스트 명세: `.jjiban/projects/jjiban/tasks/TSK-03-01/026-test-specification.md`
- 구현 문서: `.jjiban/projects/jjiban/tasks/TSK-03-01/030-implementation.md`
