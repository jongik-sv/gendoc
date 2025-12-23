# TSK-03-02: WBS API 코드 리뷰

**리뷰 대상:**
- `server/api/projects/[id]/wbs.get.ts`
- `server/api/projects/[id]/wbs.put.ts`
- `server/api/tasks/[id].get.ts`
- `server/api/tasks/[id].put.ts`
- `server/utils/wbs/wbsService.ts`
- `server/utils/wbs/taskService.ts`

**리뷰 일시:** 2025-12-14
**리뷰어:** Claude Refactoring Expert
**평가 기준:** SOLID 원칙, 에러 처리, 보안, 성능

---

## 1. 종합 평가

**전체 점수:** 7.5/10 ✓ 양호

### 강점
- 체계적인 에러 처리 전략 (표준 에러 객체 활용)
- 낙관적 잠금(Optimistic Locking)을 통한 동시성 제어
- 백업/롤백 메커니즘으로 데이터 무결성 보장
- 명확한 계층 분리 (API → Service)

### 약점
- 높은 순환 복잡도와 중복 코드
- 다중 책임(SRP 위반) - Task 검색, 조회, 수정을 하나의 함수에서 처리
- 불완전한 입력 검증
- 에러 처리 전략의 불일관성

---

## 2. SOLID 원칙 준수 분석

### 2.1 단일 책임 원칙 (SRP) - **위반 (HIGH 우선순위)**

**문제 사례 1: `taskService.ts`의 `updateTask` 함수**

```typescript
// Line 331-424: 한 함수가 너무 많은 책임을 담당
export async function updateTask(
  taskId: string,
  updates: Partial<TaskUpdateRequest>
): Promise<TaskDetail> {
  // 책임 1: Task 검색
  const searchResult = await findTaskById(taskId);

  // 책임 2: 유효성 검증 (title, priority, schedule)
  if (updates.title && (updates.title.length < 1 || updates.title.length > 200)) {
    throw createBadRequestError(...)
  }

  // 책임 3: WBS 전체 조회 및 트리 재구성
  const { metadata, tree } = await getWbsTree(projectId);

  // 책임 4: WBS 저장 (동시성 제어 포함)
  await saveWbsTree(projectId, metadata, tree);

  // 책임 5: 이력 기록
  const historyEntry = buildHistoryEntry(oldValues, task);
  await writeJsonFile(historyPath, existingHistory);

  // 책임 6: 최종 정보 반환
  return getTaskDetail(taskId);
}
```

**영향도:** 순환 복잡도 약 12, 함수 길이 90+ 라인

**개선 방안:**
```typescript
// 책임 분리 제안
- validateTaskUpdates(updates): void
- findAndLockTask(taskId): Task
- applyTaskUpdates(task, updates): Task
- recordTaskHistory(projectId, taskId, changes): void
- updateTask(): Promise<TaskDetail> // 이들을 조율하는 오케스트레이터
```

### 2.2 개방-폐쇄 원칙 (OCP) - **부분 위반**

**문제:** Task 검색 로직이 프로젝트 목록에 하드코딩됨

```typescript
// taskService.ts Line 106-136: findTaskById()
// projects.json 경로가 하드코딩되어 있음
const projectsJsonPath = join('.jjiban', 'settings', 'projects.json');
const projectsData = await readJsonFile<{ projects: { id: string }[] }>(projectsJsonPath);

// 프로젝트 목록을 가져오는 전략을 변경하려면 함수 수정 필요
```

**개선 방안:** 프로젝트 조회 전략을 주입 가능하도록 리팩토링

### 2.3 리스코프 치환 원칙 (LSP) - **준수 (7/10)**

**부분적 위반:** 에러 처리 일관성 부족

```typescript
// wbsService.ts Line 235-243: 에러 처리 불일관성
if (error && typeof error === 'object' && 'statusCode' in error) {
  throw error;  // 표준 에러 그대로 전파
} else {
  throw createInternalError(...);  // 새로운 에러로 래핑
}

// taskService.ts Line 129-132에서는 모두 무시함
catch {
  continue;  // 로그도 없이 무시
}
```

### 2.4 인터페이스 분리 원칙 (ISP) - **준수 (8/10)**

**긍정적:** 명확한 인터페이스 정의
- `TaskUpdateRequest`: 필요한 속성만 포함
- `TaskDetail`: 응답 데이터 명확

**개선 여지:** `WbsNode` 타입이 너무 큼
```typescript
// types 파일에서 WbsNode가 100+ 필드를 가지고 있을 가능성
// 상황별로 작은 인터페이스로 분할 필요
```

### 2.5 의존성 역전 원칙 (DIP) - **위반 (MEDIUM 우선순위)**

**문제:** 고수준 모듈이 저수준 모듈에 직접 의존

```typescript
// taskService.ts Line 18: 구체적 구현에 의존
import { getWbsTree, saveWbsTree } from './wbsService';

// 더 좋은 방식: 추상화된 인터페이스에 의존
interface IWbsRepository {
  getTree(projectId: string): Promise<{metadata, tree}>;
  saveTree(projectId: string, ...): Promise<Result>;
}
```

---

## 3. 에러 처리 분석

### 3.1 에러 처리 전략 - **MEDIUM 우선순위**

**긍정적 측면:**
- 표준 에러 객체 일관적 사용 (HTTP 상태 코드 명확)
- Try-catch에서 에러 타입 확인 및 적절한 처리

**문제점:**

**문제 1: 조용한 실패 (Silent Failures)**

```typescript
// taskService.ts Line 129-132
for (const project of projectsData.projects) {
  try {
    const { tree } = await getWbsTree(project.id);
    const result = findTaskInTree(tree, taskId);
    if (result) {
      return {...};
    }
  } catch {
    continue;  // 에러를 완전히 무시 - 로그 없음!
  }
}

// 결과: 모든 프로젝트 조회 실패 시 빈 결과 반환
// 클라이언트는 "찾을 수 없음"과 "시스템 오류"를 구분할 수 없음
```

**개선 방안:**
```typescript
const errors: Error[] = [];
for (const project of projectsData.projects) {
  try {
    // ...
  } catch (error) {
    // 로그 기록
    console.warn(`Failed to search project ${project.id}:`, error);
    errors.push(error as Error);
    // 경고 심각도에 따라 처리
  }
}
// 모든 프로젝트 조회 실패 시 다른 에러 반환
if (projectsData.projects.length > 0 && errors.length === projectsData.projects.length) {
  throw createInternalError('SEARCH_FAILED', '모든 프로젝트 검색 실패');
}
```

**문제 2: 불완전한 검증 에러 메시지**

```typescript
// wbsService.ts Line 171-177
const validationResult = validateWbs(tree);
if (!validationResult.isValid) {
  const errorMessages = validationResult.errors
    .map((e) => e.message)
    .join(', ');
  throw createBadRequestError(
    'VALIDATION_ERROR',
    `WBS 데이터가 유효하지 않습니다: ${errorMessages}`
  );
}
// 문제: 많은 에러가 있으면 메시지가 너무 길어짐
// 첫 3개만 표시하고 나머지는 로그에만 기록해야 함
```

**개선 방안:**
```typescript
if (!validationResult.isValid) {
  const displayErrors = validationResult.errors.slice(0, 3);
  const displayMsg = displayErrors.map((e) => e.message).join(', ');
  const fullMsg = validationResult.errors.length > 3
    ? `${displayMsg} 외 ${validationResult.errors.length - 3}개 오류`
    : displayMsg;

  // 로그에는 전체 에러 기록
  console.error('WBS validation failed:', {
    total: validationResult.errors.length,
    errors: validationResult.errors
  });

  throw createBadRequestError(
    'VALIDATION_ERROR',
    `WBS 데이터가 유효하지 않습니다: ${fullMsg}`
  );
}
```

---

## 4. 보안 분석

### 4.1 입력 검증 - **MEDIUM 우선순위**

**문제 1: 불완전한 검증**

```typescript
// api/projects/[id]/wbs.put.ts Line 14-18
const body = await readBody<{
  metadata: WbsMetadata;
  tree: WbsNode[];
}>(event);

const result = await saveWbsTree(projectId, body.metadata, body.tree);
```

**문제:** 타입 캐스트만 있고 검증이 없음
- `body` 객체가 null/undefined일 수 있음
- `body.metadata` 또는 `body.tree`가 누락될 수 있음

**개선 방안:**
```typescript
// API 핸들러에 검증 추가
const body = await readBody<{
  metadata: WbsMetadata;
  tree: WbsNode[];
}>(event);

if (!body || typeof body !== 'object') {
  throw createBadRequestError('INVALID_REQUEST', '요청 본문이 비어있습니다');
}

if (!body.metadata || typeof body.metadata !== 'object') {
  throw createBadRequestError('INVALID_REQUEST', 'metadata 필드가 필요합니다');
}

if (!Array.isArray(body.tree)) {
  throw createBadRequestError('INVALID_REQUEST', 'tree 필드는 배열이어야 합니다');
}

const result = await saveWbsTree(projectId, body.metadata, body.tree);
```

**문제 2: 경로 인젝션 위험**

```typescript
// taskService.ts Line 150
const taskFolderPath = getTaskFolderPath(projectId, taskId);
// projectId와 taskId가 검증되지 않은 경우 경로 조작 가능
// "../../../etc/passwd" 같은 경로 가능
```

**개선 방안:** 경로 검증 추가
```typescript
function validateProjectId(projectId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw createBadRequestError('INVALID_PROJECT_ID', '유효하지 않은 프로젝트 ID');
  }
}

function validateTaskId(taskId: string): void {
  if (!/^TSK-[0-9]+-[0-9]+(-[0-9]+)?$/.test(taskId)) {
    throw createBadRequestError('INVALID_TASK_ID', '유효하지 않은 Task ID');
  }
}
```

### 4.2 파일 접근 제어 - **LOW 위전도 (로컬 앱이므로)**

긍정적: 모든 파일 접근이 `.jjiban/` 디렉토리 내로 제한됨

### 4.3 마크다운 인젝션 - **준수 (8/10)**

**긍정적:** serializer.ts에서 `sanitizeTitle()` 함수로 보호

```typescript
// serializer.ts Line 75-87
function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';
  let sanitized = title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH) : title;
  if (sanitized.startsWith('#')) {
    sanitized = sanitized.replace(/^#+\s*/, '');
  }
  return sanitized;
}
```

---

## 5. 성능 분석

### 5.1 N+1 쿼리 문제 - **MEDIUM 우선도**

**문제:** `getTaskDetail()` 함수의 비효율성

```typescript
// taskService.ts Line 271-317: getTaskDetail()
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  // 1차 조회: 모든 프로젝트에서 Task 검색 (O(p*n) - p: 프로젝트 수, n: Task 수)
  const searchResult = await findTaskById(taskId);

  // 2차 조회: 팀원 정보 (별도 파일)
  const teamData = await readJsonFile<{ members: TeamMember[] }>(teamJsonPath);

  // 3차 조회: 문서 목록 (파일 시스템)
  const documents = await buildDocumentInfoList(projectId, taskId);

  // 4차 조회: 이력 (별도 파일)
  const historyData = await readJsonFile<HistoryEntry[]>(historyPath);

  return {...};
}
```

**영향:** 단일 Task 조회에 4개의 I/O 작업
- 동시에 여러 Task 조회 시 성능 급격히 저하

**개선 방안:**
```typescript
// 병렬 I/O 처리
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const searchResult = await findTaskById(taskId);
  const { task, projectId, parentWp, parentAct } = searchResult;

  // 팀원, 문서, 이력을 병렬로 조회
  const [teamData, documents, historyData] = await Promise.all([
    readJsonFile<{ members: TeamMember[] }>(teamJsonPath),
    buildDocumentInfoList(projectId, taskId),
    readJsonFile<HistoryEntry[]>(historyPath),
  ]);

  return {...};
}
```

### 5.2 WBS 전체 로드 오버헤드 - **MEDIUM 우선도**

**문제:** Task 수정 시 전체 WBS를 로드, 수정, 저장

```typescript
// taskService.ts Line 380-402: updateTask()
// WBS 전체 조회 (1000개 노드면 모두 메모리에 로드)
const { metadata, tree } = await getWbsTree(projectId);

// 트리에서 Task 찾기 (재귀 탐색 O(n))
const foundTask = findTaskInTree(tree, taskId);

// WBS 전체 저장 (모든 노드를 마크다운으로 변환)
await saveWbsTree(projectId, metadata, tree);
```

**영향:**
- 프로젝트에 100개 이상 Task가 있으면 성능 저하
- 메모리 사용량 증가

**개선 방안:**
```typescript
// 전략 1: Task 인덱싱 시스템 도입
// Task ID → (projectId, parentWp, parentAct) 매핑 저장
// tasks-index.json에 캐싱

// 전략 2: 부분 WBS 로드/저장
// WP 단위로 분리 저장, 변경된 WP만 업데이트

// 전략 3: 지연 로드 (Lazy Loading)
// Task 기본 정보만 먼저 로드
// 히스토리, 문서 목록은 필요할 때만 로드
```

### 5.3 순환 참조 감지 성능

**현재 구현:**
```typescript
// serializer.ts Line 55-69: countNodes()
function countNodes(nodes: WbsNode[], visited: Set<string> = new Set()): number {
  let count = 0;
  for (const node of nodes) {
    if (visited.has(node.id)) {
      throw new SerializationError(`Circular reference detected: ${node.id}`);
    }
    visited.add(node.id);
    count++;
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children, visited);  // 재귀
    }
  }
  return count;
}
```

**평가:** O(n) 성능은 합리적이지만, 매 저장마다 전체 트리 순회 필요

---

## 6. 코드 품질 지표

### 6.1 순환 복잡도 분석

| 함수 | 복잡도 | 평가 |
|------|--------|------|
| `updateTask()` | ~12 | ⚠️ 높음 |
| `getTaskDetail()` | ~8 | ⚠️ 높음 |
| `findTaskById()` | ~7 | ⚠️ 높음 |
| `saveWbsTree()` | ~10 | ⚠️ 높음 |
| `parseWbsMarkdown()` | ~6 | 보통 |
| `serializeWbs()` | ~8 | ⚠️ 높음 |

**개선 목표:** 모든 함수를 복잡도 5 이하로 감소

### 6.2 코드 중복도 분석

**중복 패턴 1: 에러 처리**
```typescript
// wbsService.ts, taskService.ts에서 반복됨
try {
  // 작업
} catch (error) {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error;
  }
  throw createInternalError(...);
}
```

→ 해결: 유틸리티 함수 추출
```typescript
function rethrowIfStandardError(error: unknown): never {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error;
  }
  throw error;
}
```

**중복 패턴 2: Task 검색**
```typescript
// taskService.ts의 여러 함수에서 반복
const searchResult = await findTaskById(taskId);
if (!searchResult) {
  throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
}
```

→ 해결: 메서드 래핑
```typescript
async function getTaskOrThrow(taskId: string): Promise<TaskSearchResult> {
  const result = await findTaskById(taskId);
  if (!result) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }
  return result;
}
```

---

## 7. 주요 이슈 정리

### Critical Issues (긴급)

| ID | 이슈 | 파일 | 영향도 | 해결 난도 |
|----|----|------|--------|----------|
| C-001 | 입력 검증 누락 (경로 인젝션 위험) | api/projects/[id]/wbs.put.ts, api/tasks/[id].put.ts | 높음 | 낮음 |
| C-002 | 조용한 실패 (로그 없음) | taskService.ts:129-132 | 중간 | 낮음 |

### Major Issues (중요)

| ID | 이슈 | 파일 | 영향도 | 해결 난도 |
|----|----|------|--------|----------|
| M-001 | SRP 위반 (updateTask) | taskService.ts | 높음 | 중간 |
| M-002 | N+1 쿼리 문제 | taskService.ts:271-317 | 중간 | 중간 |
| M-003 | 높은 순환 복잡도 | 여러 파일 | 중간 | 중간 |
| M-004 | 전체 WBS 로드 오버헤드 | taskService.ts:380-402 | 중간 | 높음 |
| M-005 | 에러 메시지 길이 제한 없음 | wbsService.ts:171-177 | 낮음 | 낮음 |

### Minor Issues (낮음)

| ID | 이슈 | 파일 | 영향도 | 해결 난도 |
|----|----|------|--------|----------|
| m-001 | 하드코딩된 경로 | taskService.ts:108 | 낮음 | 낮음 |
| m-002 | 불완전한 문서화 | 전반 | 낮음 | 낮음 |
| m-003 | 타입 캐스팅 (as any) | taskService.ts:303 | 낮음 | 낮음 |

---

## 8. 개선 권장사항

### 우선순위 1: 보안 및 기본 안정성 (1-2주)

#### 1.1 입력 검증 강화
```typescript
// Request Validator 미들웨어 추가
export async function validateWbsUpdateRequest(body: unknown): {
  metadata: WbsMetadata;
  tree: WbsNode[];
} {
  if (!body || typeof body !== 'object') {
    throw createBadRequestError('INVALID_REQUEST', '요청 본문이 비어있습니다');
  }

  const { metadata, tree } = body as any;

  if (!metadata || typeof metadata !== 'object') {
    throw createBadRequestError('INVALID_REQUEST', 'metadata는 필수입니다');
  }

  if (!Array.isArray(tree)) {
    throw createBadRequestError('INVALID_REQUEST', 'tree는 배열이어야 합니다');
  }

  return { metadata, tree };
}
```

#### 1.2 에러 로깅 추가
```typescript
// 모든 catch 블록에 로깅 추가
catch (error) {
  console.error('Task search failed for project:', project.id, error);
  errors.push(error as Error);
}
```

### 우선순위 2: 코드 복잡도 감소 (2-3주)

#### 2.1 Task 검색 로직 분리
```typescript
// validateTaskId, findTaskByIdOrThrow 등으로 분리
```

#### 2.2 updateTask 함수 분해
```typescript
// 검증, 수정, 이력 기록을 별도 함수로 분리
// 각 함수는 단일 책임만 수행
```

### 우선순위 3: 성능 최적화 (3-4주)

#### 3.1 병렬 I/O 처리
```typescript
// Promise.all()로 독립적인 I/O 병렬화
```

#### 3.2 Task 인덱싱 시스템
```typescript
// Task ID → 위치 정보 매핑 캐싱
// 전체 WBS 로드 회피
```

---

## 9. 코드 검토 결론

### 긍정적 평가
1. ✅ 체계적인 에러 처리 아키텍처
2. ✅ 데이터 무결성 보장 (백업/롤백)
3. ✅ 동시성 제어 (낙관적 잠금)
4. ✅ 명확한 계층 분리

### 개선 필요 영역
1. ⚠️ 입력 검증 강화 필요
2. ⚠️ 함수 복잡도 감소 필요
3. ⚠️ SRP 원칙 준수 필요
4. ⚠️ 성능 최적화 (병렬 I/O, 인덱싱)
5. ⚠️ 에러 로깅 일관성 개선

### 다음 단계
- [ ] Critical 이슈 해결 (C-001, C-002)
- [ ] Major 이슈 중 M-001, M-002, M-003 해결
- [ ] 성능 테스트 및 프로파일링
- [ ] 리팩토링 후 통합 테스트

---

## 부록: 메트릭 요약

| 항목 | 현재 | 목표 | 진행도 |
|-----|------|-----|--------|
| 평균 순환 복잡도 | 8.3 | ≤5 | 0% |
| 코드 중복도 | 중간 | 낮음 | 0% |
| 입력 검증 커버리지 | 40% | 95% | 0% |
| 에러 로깅 커버리지 | 60% | 95% | 0% |
| SOLID 준수도 | 6.5/10 | 8/10 | 0% |

---

**문서 관리**
- 작성일: 2025-12-14
- 버전: 1.0
- 상태: 리뷰 완료
- 다음 리뷰 예정: 개선 후 2주
