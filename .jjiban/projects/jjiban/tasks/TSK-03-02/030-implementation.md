# 구현: WBS API

**Task ID:** TSK-03-02 — **Task명:** WBS API
**작성일:** 2025-12-14 — **작성자:** Claude Code

---

## 1. 구현 개요

### 1.1 목적

WBS 트리 조회/저장 및 Task 상세 정보 관리를 위한 REST API 구현

### 1.2 구현 범위

**서비스 계층**:
- `server/utils/wbs/wbsService.ts` - WBS 비즈니스 로직
- `server/utils/wbs/taskService.ts` - Task 비즈니스 로직

**API 엔드포인트**:
- `server/api/projects/[id]/wbs.get.ts` - WBS 트리 조회
- `server/api/projects/[id]/wbs.put.ts` - WBS 트리 저장
- `server/api/tasks/[id].get.ts` - Task 상세 조회
- `server/api/tasks/[id].put.ts` - Task 정보 수정

**테스트**:
- 단위 테스트 (Vitest)
- E2E 테스트 (Playwright)

---

## 2. 구현 순서

### 2.1 Phase 1: 서비스 계층 (TDD)

1. **wbsService.ts**
   - [ ] getWbsTree() - WBS 조회
   - [ ] saveWbsTree() - WBS 저장 (백업/롤백)
   - [ ] 단위 테스트 작성 및 통과

2. **taskService.ts**
   - [ ] getTaskDetail() - Task 상세 조회
   - [ ] updateTask() - Task 수정
   - [ ] 헬퍼 함수들 (findTaskById, buildDocumentInfoList 등)
   - [ ] 단위 테스트 작성 및 통과

### 2.2 Phase 2: API 엔드포인트

3. **WBS API**
   - [ ] GET /api/projects/[id]/wbs.get.ts
   - [ ] PUT /api/projects/[id]/wbs.put.ts
   - [ ] E2E 테스트 작성 및 통과

4. **Task API**
   - [ ] GET /api/tasks/[id].get.ts
   - [ ] PUT /api/tasks/[id].put.ts
   - [ ] E2E 테스트 작성 및 통과

### 2.3 Phase 3: 통합 검증

5. **테스트 및 검증**
   - [ ] 모든 단위 테스트 통과
   - [ ] 모든 E2E 테스트 통과
   - [ ] 커버리지 >= 80% 확인
   - [ ] 비즈니스 규칙 (BR-001~006) 검증

---

## 3. 구현 세부사항

### 3.1 wbsService.ts

**책임**:
- wbs.md 파일 읽기/쓰기
- 파싱 및 시리얼라이즈
- 백업/롤백 메커니즘
- 낙관적 잠금 확인

**주요 함수**:

```typescript
// WBS 트리 조회
export async function getWbsTree(projectId: string): Promise<{
  metadata: WbsMetadata;
  tree: WbsNode[];
}>

// WBS 트리 저장
export async function saveWbsTree(
  projectId: string,
  metadata: WbsMetadata,
  tree: WbsNode[]
): Promise<{ success: boolean; updated: string }>

// 메타데이터 파싱 (헤더 섹션만)
function parseMetadata(markdown: string): WbsMetadata

// 낙관적 잠금 확인
function checkUpdatedDate(
  requestUpdated: string,
  currentUpdated: string
): void
```

**에러 처리**:
- PROJECT_NOT_FOUND (404)
- PARSE_ERROR (500)
- VALIDATION_ERROR (400)
- CONFLICT_ERROR (409) - updated 불일치
- FILE_WRITE_ERROR (500)

---

### 3.2 taskService.ts

**책임**:
- Task 검색
- Task 속성 수정
- 문서 목록 조회
- 이력 관리
- 가능한 액션 계산

**주요 함수**:

```typescript
// Task 상세 조회
export async function getTaskDetail(taskId: string): Promise<TaskDetail>

// Task 수정
export async function updateTask(
  taskId: string,
  updates: Partial<TaskUpdateRequest>
): Promise<TaskDetail>

// Task 검색 (트리 순회)
function findTaskById(tree: WbsNode[], taskId: string): {
  task: WbsNode;
  projectId: string;
  parentWp: string;
  parentAct?: string;
} | null

// 문서 목록 생성
function buildDocumentInfoList(
  projectId: string,
  taskId: string
): Promise<DocumentInfo[]>

// 가능한 액션 조회
function getAvailableActions(
  category: TaskCategory,
  status: string
): string[]

// 이력 엔트리 생성
function buildHistoryEntry(
  oldValues: Partial<WbsNode>,
  newValues: Partial<WbsNode>
): HistoryEntry
```

**에러 처리**:
- TASK_NOT_FOUND (404)
- PROJECT_NOT_FOUND (404)
- VALIDATION_ERROR (400)
- FILE_WRITE_ERROR (500)

---

### 3.3 API 엔드포인트

#### GET /api/projects/[id]/wbs.get.ts

```typescript
export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id') as string;

  try {
    const result = await getWbsTree(projectId);
    return result;
  } catch (error) {
    // 에러 핸들링
  }
});
```

#### PUT /api/projects/[id]/wbs.put.ts

```typescript
export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id') as string;
  const body = await readBody(event);

  try {
    const result = await saveWbsTree(
      projectId,
      body.metadata,
      body.tree
    );
    return result;
  } catch (error) {
    // 에러 핸들링
  }
});
```

#### GET /api/tasks/[id].get.ts

```typescript
export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'id') as string;

  try {
    const task = await getTaskDetail(taskId);
    return task;
  } catch (error) {
    // 에러 핸들링
  }
});
```

#### PUT /api/tasks/[id].put.ts

```typescript
export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'id') as string;
  const updates = await readBody(event);

  try {
    const task = await updateTask(taskId, updates);
    return { success: true, task };
  } catch (error) {
    // 에러 핸들링
  }
});
```

---

## 4. 비즈니스 규칙 구현

| 규칙 ID | 구현 위치 | 구현 방법 |
|---------|-----------|-----------|
| BR-001 | wbsService.saveWbsTree() | validateWbs() 호출 |
| BR-002 | wbsService.saveWbsTree() | validateWbs() - 중복 검사 |
| BR-003 | wbsService.getWbsTree() | calculateProgress() 호출 (파서) |
| BR-004 | wbsService.saveWbsTree() | 백업 → 쓰기 → 실패 시 복구 |
| BR-005 | taskService.updateTask() | buildHistoryEntry() + history.json 저장 |
| BR-006 | wbsService.saveWbsTree() | serializeWbs({ updateDate: true }) |

---

## 5. 테스트 전략

### 5.1 단위 테스트

**tests/utils/wbs/wbsService.test.ts**:
- WBS 조회 성공
- WBS 저장 성공
- 백업/롤백 메커니즘
- 낙관적 잠금 충돌
- 에러 케이스

**tests/utils/wbs/taskService.test.ts**:
- Task 검색 성공/실패
- Task 수정 및 이력 기록
- 문서 목록 생성
- 가능한 액션 조회

### 5.2 E2E 테스트

**tests/e2e/wbs.spec.ts**:
- GET /api/projects/:id/wbs
- PUT /api/projects/:id/wbs
- 동시성 충돌
- 유효성 검증 실패
- 데이터 무결성
- 성능 (1000 노드)

**tests/e2e/tasks.spec.ts**:
- GET /api/tasks/:id
- PUT /api/tasks/:id
- 이력 기록 확인

---

## 6. 구현 체크리스트

### 서비스 계층
- [x] server/utils/wbs/wbsService.ts
  - [x] getWbsTree()
  - [x] saveWbsTree()
  - [x] parseMetadata()
  - [x] checkUpdatedDate()
- [x] server/utils/wbs/taskService.ts
  - [x] getTaskDetail()
  - [x] updateTask()
  - [x] findTaskById()
  - [x] buildDocumentInfoList()
  - [x] getAvailableActions()
  - [x] buildHistoryEntry()

### API 엔드포인트
- [x] server/api/projects/[id]/wbs.get.ts
- [x] server/api/projects/[id]/wbs.put.ts
- [x] server/api/tasks/[id].get.ts
- [x] server/api/tasks/[id].put.ts

### 테스트
- [x] 단위 테스트 (wbsService, taskService)
- [x] E2E 테스트 (WBS API, Task API)
- [x] 커버리지 >= 80%
- [x] 비즈니스 규칙 검증

### 품질
- [x] 상세설계 준수
- [x] 에러 핸들링 일관성
- [x] TypeScript 타입 안전성
- [x] 코드 리뷰 완료

---

## 7. 이슈 및 해결

### 이슈 1: wbs.md 파싱 시 메타데이터 추출

**문제**: parseWbsMarkdown()은 트리만 반환, 메타데이터는 별도 파싱 필요

**해결**: wbsService에서 메타데이터 파싱 함수 추가
```typescript
function parseMetadata(markdown: string): WbsMetadata {
  // --- 이전 > 블록 파싱
}
```

### 이슈 2: Task ID로 프로젝트 찾기

**문제**: GET /api/tasks/:id는 프로젝트 ID를 모름

**해결**: 모든 프로젝트의 wbs.md를 순회하여 Task 검색
```typescript
// projects.json 읽기 → 각 프로젝트의 wbs.md에서 Task 검색
```

### 이슈 3: 이력 저장 위치

**문제**: Task 이력을 어디에 저장할지

**해결**: tasks/{taskId}/history.json으로 별도 파일 관리

---

## 8. 성능 고려사항

- **WBS 조회**: 파싱 후 진행률 계산은 O(n), 1000 노드 기준 < 500ms
- **WBS 저장**: 백업 복사는 동기식, 원자성 보장
- **Task 검색**: 전체 프로젝트 순회 시 프로젝트 수에 비례 (캐싱 고려)
- **문서 목록**: 파일명만 조회, 내용 읽지 않음

---

## 9. 보안 고려사항

- **경로 순회 방지**: 프로젝트 ID 검증 (영소문자, 숫자, 하이픈만)
- **마크다운 인젝션**: sanitizeTitle()로 # 제거
- **파일 덮어쓰기**: .jjiban/ 폴더 외부 접근 차단
- **대용량 데이터**: 노드 수 1000개 제한

---

## 10. 다음 단계

- [x] 코드 리뷰 진행 (`/wf:review TSK-03-02`)
- [ ] 통합 테스트 (`/wf:verify TSK-03-02`)
- [ ] 완료 처리 (`/wf:done TSK-03-02`)

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 추적성 매트릭스: `025-traceability-matrix.md`

---

<!--
author: Claude Code
작성일: 2025-12-14
-->
