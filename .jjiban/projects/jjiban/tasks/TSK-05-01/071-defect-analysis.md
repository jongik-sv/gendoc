# 결함 분석 보고서 (071-defect-analysis.md)

**Defect ID:** DEF-TSK-05-01-001
**Task ID:** TSK-05-01
**Task명:** Detail Panel Structure
**발견일:** 2025-12-15
**보고자:** AI Agent (quality-engineer)
**심각도:** Critical (P0)
**상태:** Open

---

## 1. 결함 요약

### 1.1 증상

Task 선택 후 TaskBasicInfo 컴포넌트가 렌더링되지 않아 Detail Panel이 빈 화면으로 표시됨

### 1.2 재현율

**100% (항상 재현)**

### 1.3 영향 범위

- **기능:** 모든 Detail Panel 기능 (FR-003, FR-004, FR-005, FR-006, FR-007, FR-008)
- **사용자 영향:** 치명적 - Task 상세 정보를 전혀 볼 수 없음
- **블로커:** 예 - TSK-05-02, TSK-05-03, TSK-05-04의 모든 기능 차단

### 1.4 환경

- **발견 환경:** E2E 테스트 (Playwright)
- **재현 환경:** 개발 서버 (http://localhost:3333)
- **브라우저:** Chromium
- **OS:** Windows 10

---

## 2. 재현 단계

### 2.1 전제 조건

```bash
# 1. 개발 서버 시작
npm run dev -- --port 3333

# 2. 테스트 프로젝트 준비
# E2E 테스트가 자동으로 .jjiban/projects/jjiban-test-detail-panel 생성
```

### 2.2 재현 단계

1. 브라우저에서 `http://localhost:3333/wbs?project=jjiban-test-detail-panel` 접속
2. 좌측 WBS 트리가 로드될 때까지 대기
3. 트리에서 `TSK-05-01: Detail Panel Structure` 노드 클릭
4. 우측 Detail Panel 확인

### 2.3 예상 결과

- TaskBasicInfo 컴포넌트 렌더링
- Task ID, 제목, 카테고리, 우선순위, 담당자 표시
- 인라인 편집 가능

### 2.4 실제 결과

- Detail Panel이 **완전히 비어있음**
- 빈 상태 메시지도 표시되지 않음
- TaskBasicInfo 컴포넌트가 DOM에 존재하지 않음

### 2.5 스크린샷

**파일 위치:** `test-results/artifacts/detail-panel-TSK-05-01-Det-7fdde--사용자가-Task-제목을-인라인-편집할-수-있다-chromium/test-failed-1.png`

**화면 상태:**
- 좌측: WBS 트리 정상 렌더링 (TSK-05-01 선택됨)
- 우측: Detail Panel 빈 화면 (흰색 배경만 표시)

---

## 3. 근본 원인 분석

### 3.1 조사 과정

#### 3.1.1 프론트엔드 검증

**TaskDetailPanel.vue 조건부 렌더링 로직:**

```vue
<!-- 로딩 상태 -->
<template v-if="loadingTask" #content>
  <div data-testid="task-detail-skeleton">...</div>
</template>

<!-- 에러 상태 -->
<template v-else-if="error" #content>
  <Message severity="error">...</Message>
</template>

<!-- 빈 상태 -->
<template v-else-if="!selectedTask" #content>
  <Message severity="info">왼쪽에서 Task를 선택하세요</Message>
</template>

<!-- 정상 상태 -->
<template v-else #content>
  <TaskBasicInfo :task="selectedTask" ... />
  ...
</template>
```

**문제 지점:**
- `!selectedTask` 조건이 참으로 평가되고 있음
- 즉, `selectedTask`가 `null`로 유지되고 있음

#### 3.1.2 선택 스토어 검증

**useSelectionStore (`app/stores/selection.ts`):**

```typescript
async function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId
  error.value = null

  // Task인 경우 상세 정보 로드
  if (nodeId.toUpperCase().startsWith('TSK-')) {
    await loadTaskDetail(nodeId)
  } else {
    selectedTask.value = null
  }
}

async function loadTaskDetail(taskId: string) {
  loadingTask.value = true
  error.value = null
  try {
    const data = await $fetch<TaskDetail>(`/api/tasks/${taskId}`)
    selectedTask.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load task detail'
    selectedTask.value = null
  } finally {
    loadingTask.value = false
  }
}
```

**문제 지점:**
- `/api/tasks/${taskId}` API 호출이 실패하고 있을 가능성
- `catch` 블록에서 `selectedTask.value = null` 설정
- 하지만 E2E 테스트에서는 에러 메시지가 표시되지 않음 (🚩 이상)

#### 3.1.3 API 엔드포인트 검증

**`server/api/tasks/[id].get.ts`:**

```typescript
export default defineEventHandler(async (event): Promise<TaskDetail> => {
  const taskId = getRouterParam(event, 'id') as string;
  const task = await getTaskDetail(taskId);
  return task;
});
```

**`server/utils/wbs/taskService.ts` → `getTaskDetail`:**

```typescript
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  // Task 검색
  const searchResult = await findTaskById(taskId);
  if (!searchResult) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  const { task, projectId, parentWp, parentAct } = searchResult;

  // 팀원 정보 조회
  const teamJsonPath = getTeamJsonPath(projectId);
  const teamData = await readJsonFile<{ members: TeamMember[] }>(teamJsonPath);
  const assignee = teamData?.members?.find((m) => m.id === task.assignee) || null;

  // ... (문서, 이력 조회)

  return {
    id: task.id,
    title: task.title,
    category: task.category as TaskCategory,
    status: (task.status?.match(/\[([^\]]+)\]/)?.[1] || '[ ]') as any,
    priority: (task.priority || 'medium') as any,
    assignee: assignee || undefined,  // 🚩 null → undefined 변환
    parentWp,
    parentAct,
    schedule: task.schedule,
    requirements: task.requirements || [],
    tags: task.tags || [],
    depends: task.depends ? [task.depends] : [],
    ref: task.ref,
    documents,
    history,
    availableActions,
  };
}
```

**`findTaskById` 함수:**

```typescript
export async function findTaskById(taskId: string): Promise<TaskSearchResult | null> {
  // projects.json에서 프로젝트 목록 조회
  const projectsJsonPath = getProjectsListFilePath();
  const projectsData = await readJsonFile<{ projects: { id: string }[] }>(projectsJsonPath);

  if (!projectsData || !projectsData.projects) {
    return null;  // 🚩 projects.json 없으면 null 반환
  }

  // 각 프로젝트의 WBS에서 Task 검색
  for (const project of projectsData.projects) {
    try {
      const { tree } = await getWbsTree(project.id);
      const result = findTaskInTree(tree, taskId);

      if (result) {
        return {
          task: result.task,
          projectId: project.id,
          parentWp: result.parentWp,
          parentAct: result.parentAct,
        };
      }
    } catch (error) {
      console.warn(`[TaskService] Failed to search task in project '${project.id}':`, error);
      continue;
    }
  }

  return null;  // 🚩 Task 못 찾으면 null 반환
}
```

### 3.2 근본 원인 (Root Cause)

**Primary Cause:** E2E 테스트에서 생성한 프로젝트 ID가 `jjiban-test-detail-panel`인데, 테스트 중 실제 프로젝트 목록 (`projects.json`)에 등록되지 않았을 가능성

**Secondary Causes:**

1. **프로젝트 ID 불일치:**
   - E2E 테스트가 `.jjiban/projects/jjiban-test-detail-panel/` 폴더를 생성
   - 하지만 `.jjiban/settings/projects.json`에 프로젝트 메타데이터가 누락되거나 다른 ID로 등록됨
   - `findTaskById`가 `projects.json`의 프로젝트 목록만 순회하므로, 등록되지 않은 프로젝트는 검색 안 됨

2. **WBS 파일 경로 문제:**
   - E2E 테스트의 `beforeEach`에서 WBS 파일을 생성했지만, `getWbsTree` 함수가 해당 경로를 찾지 못함

3. **타입 불일치:**
   - API 응답의 `assignee` 필드가 `null → undefined` 변환
   - 프론트엔드 타입(`TaskDetail`)과 불일치 가능성

### 3.3 증거

#### 증거 1: E2E 테스트 로그

```
[Global Setup] Preparing E2E test data...
[Global Setup] E2E test data prepared at: C:\project\jjiban\.jjiban\projects\project
```

🚩 **이상 징후:** 프로젝트 경로가 `jjiban-test-detail-panel`이 아닌 `project`로 표시됨

#### 증거 2: API 응답 미확인

E2E 테스트 실행 중 실제 API 응답을 확인하지 못함. 다음 명령으로 확인 필요:

```bash
curl http://localhost:3333/api/tasks/TSK-05-01
```

#### 증거 3: 선택 스토어 에러 상태

- `error` 상태가 `null`이 아닐 가능성
- 하지만 TaskDetailPanel의 에러 템플릿이 렌더링되지 않음 (이상)

---

## 4. 해결 방안

### 4.1 우선순위 높음 (P0) - 즉시 수정 필요

#### 4.1.1 E2E 테스트 프로젝트 ID 수정

**파일:** `tests/e2e/detail-panel.spec.ts`

**문제:** `beforeEach`에서 `projects.json`에 프로젝트를 등록하지만, `getWbsTree` 함수가 올바른 경로를 찾지 못함

**수정 방안:**

```typescript
// tests/e2e/detail-panel.spec.ts
const TEST_PROJECT_ID = 'jjiban-test-detail-panel'

test.beforeEach(async ({ page }) => {
  // 1. projects.json 생성
  const projectsJsonPath = join(JJIBAN_ROOT, 'settings', 'projects.json')
  await fs.writeFile(
    projectsJsonPath,
    JSON.stringify({
      version: '1.0',
      projects: [
        {
          id: TEST_PROJECT_ID,  // ✅ 이 ID가 중요
          name: 'Test Detail Panel',
          path: TEST_PROJECT_ID,  // ✅ 실제 폴더명과 일치해야 함
          status: 'active',
          wbsDepth: 3,
          createdAt: '2025-12-15T00:00:00.000Z'
        }
      ],
      defaultProject: TEST_PROJECT_ID
    }, null, 2),
    'utf-8'
  )

  // 2. 프로젝트 폴더 생성 (경로 확인)
  const projectPath = join(JJIBAN_ROOT, 'projects', TEST_PROJECT_ID)
  await fs.mkdir(projectPath, { recursive: true })

  // 3. WBS 파일 생성 (경로 확인)
  const wbsPath = join(projectPath, 'wbs.md')
  await fs.writeFile(wbsPath, wbsContent, 'utf-8')

  // 4. Page setup (쿼리 파라미터 확인)
  await page.goto(`/wbs?project=${TEST_PROJECT_ID}`)  // ✅ 쿼리와 ID 일치
})
```

**검증 방법:**

```bash
# E2E 테스트 실행 후 폴더 확인
ls -la .jjiban/projects/
# jjiban-test-detail-panel 폴더 존재 확인

cat .jjiban/settings/projects.json
# id: "jjiban-test-detail-panel" 확인
```

#### 4.1.2 API 응답 디버깅

**파일:** `server/utils/wbs/taskService.ts`

**수정 방안:** 에러 로깅 강화

```typescript
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  console.log('[TaskService] getTaskDetail called:', taskId);

  // Task 검색
  const searchResult = await findTaskById(taskId);
  console.log('[TaskService] findTaskById result:', searchResult);

  if (!searchResult) {
    console.error('[TaskService] Task not found:', taskId);
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  const { task, projectId, parentWp, parentAct } = searchResult;
  console.log('[TaskService] Task found in project:', projectId);

  // ... (나머지 코드)
}
```

#### 4.1.3 선택 스토어 에러 핸들링 개선

**파일:** `app/stores/selection.ts`

**수정 방안:**

```typescript
async function loadTaskDetail(taskId: string) {
  loadingTask.value = true
  error.value = null
  try {
    console.log('[SelectionStore] Loading task:', taskId);
    const data = await $fetch<TaskDetail>(`/api/tasks/${taskId}`)
    console.log('[SelectionStore] Task loaded:', data);
    selectedTask.value = data
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to load task detail'
    console.error('[SelectionStore] Failed to load task:', errorMessage, e);
    error.value = errorMessage
    selectedTask.value = null
  } finally {
    loadingTask.value = false
  }
}
```

#### 4.1.4 TaskDetailPanel 조건부 렌더링 디버깅

**파일:** `app/components/wbs/detail/TaskDetailPanel.vue`

**수정 방안:** 디버깅 로깅 추가

```vue
<script setup lang="ts">
// ... (기존 코드)

// 디버깅: selectedTask 상태 감시
watch(selectedTask, (newValue, oldValue) => {
  console.log('[TaskDetailPanel] selectedTask changed:', {
    old: oldValue,
    new: newValue,
    loadingTask: loadingTask.value,
    error: error.value
  });
});
</script>
```

### 4.2 우선순위 중간 (P1) - 구조적 개선

#### 4.2.1 타입 안전성 향상

**파일:** `server/utils/wbs/taskService.ts`

**문제:** `assignee` 필드가 `null → undefined` 변환으로 타입 불일치

**수정 방안:**

```typescript
return {
  id: task.id,
  title: task.title,
  category: task.category as TaskCategory,
  status: (task.status?.match(/\[([^\]]+)\]/)?.[1] || '[ ]') as any,
  priority: (task.priority || 'medium') as any,
  assignee: assignee || null,  // ✅ undefined 대신 null 사용
  parentWp,
  parentAct,
  schedule: task.schedule,
  requirements: task.requirements || [],
  tags: task.tags || [],
  depends: task.depends ? [task.depends] : [],
  ref: task.ref,
  documents,
  history,
  availableActions,
};
```

**타입 정의 수정:**

```typescript
// types/index.ts
export interface TaskDetail {
  // ...
  assignee: TeamMember | null;  // ✅ undefined가 아닌 null
}
```

#### 4.2.2 findTaskById 함수 개선

**파일:** `server/utils/wbs/taskService.ts`

**문제:** 프로젝트가 없거나 WBS 로드 실패 시 자동으로 건너뜀

**수정 방안:**

```typescript
export async function findTaskById(taskId: string): Promise<TaskSearchResult | null> {
  const projectsJsonPath = getProjectsListFilePath();
  console.log('[TaskService] Loading projects from:', projectsJsonPath);

  const projectsData = await readJsonFile<{ projects: { id: string }[] }>(projectsJsonPath);

  if (!projectsData || !projectsData.projects) {
    console.error('[TaskService] projects.json not found or empty');
    return null;
  }

  console.log('[TaskService] Searching task in projects:', projectsData.projects.map(p => p.id));

  for (const project of projectsData.projects) {
    try {
      const { tree } = await getWbsTree(project.id);
      const result = findTaskInTree(tree, taskId);

      if (result) {
        console.log('[TaskService] Task found in project:', project.id);
        return {
          task: result.task,
          projectId: project.id,
          parentWp: result.parentWp,
          parentAct: result.parentAct,
        };
      }
    } catch (error) {
      console.error(`[TaskService] Failed to search task in project '${project.id}':`, error);
      continue;
    }
  }

  console.warn('[TaskService] Task not found in any project:', taskId);
  return null;
}
```

### 4.3 우선순위 낮음 (P2) - 장기적 개선

#### 4.3.1 E2E 테스트 Global Setup 개선

**파일:** `tests/e2e/global-setup.ts`

**개선 방향:** 테스트 프로젝트 자동 생성 및 검증

```typescript
export default async function globalSetup() {
  console.log('[Global Setup] Preparing E2E test data...');

  const TEST_PROJECT_ID = 'jjiban-test-detail-panel';
  const JJIBAN_ROOT = '.jjiban';

  // 1. projects.json 생성
  // 2. 프로젝트 폴더 생성
  // 3. WBS 파일 생성
  // 4. 검증 (파일 존재 확인, API 호출 테스트)

  console.log('[Global Setup] E2E test data prepared at:', path);
}
```

#### 4.3.2 Zod 스키마로 런타임 검증

**새 파일:** `server/schemas/taskDetail.schema.ts`

```typescript
import { z } from 'zod';

export const TaskDetailSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  category: z.enum(['development', 'defect', 'infrastructure']),
  status: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  assignee: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    role: z.string().optional(),
  }).nullable(),
  // ...
});
```

**사용:**

```typescript
// server/api/tasks/[id].get.ts
export default defineEventHandler(async (event): Promise<TaskDetail> => {
  const taskId = getRouterParam(event, 'id') as string;
  const task = await getTaskDetail(taskId);

  // 런타임 검증
  const validatedTask = TaskDetailSchema.parse(task);
  return validatedTask;
});
```

---

## 5. 검증 계획

### 5.1 수정 후 검증 단계

1. **API 응답 확인:**
   ```bash
   npm run dev -- --port 3333
   curl http://localhost:3333/api/tasks/TSK-05-01 | jq
   ```

2. **수동 브라우저 테스트:**
   - `http://localhost:3333/wbs?project=jjiban-test-detail-panel` 접속
   - Task 선택 후 Detail Panel 렌더링 확인

3. **E2E 테스트 재실행:**
   ```bash
   npx playwright test tests/e2e/detail-panel.spec.ts --reporter=list
   ```

4. **통과율 확인:**
   - 목표: 80% 이상 (11/13 통과)
   - 최소: 100% (13/13 통과)

### 5.2 성공 기준

- [ ] `/api/tasks/TSK-05-01` API가 올바른 JSON 반환
- [ ] `selectedTask` 상태가 `null`이 아닌 TaskDetail 객체로 설정
- [ ] TaskBasicInfo 컴포넌트가 DOM에 렌더링
- [ ] E2E 테스트 통과율 ≥ 80%

---

## 6. 타임라인

| 단계 | 예상 소요 시간 | 담당자 |
|------|--------------|--------|
| API 디버깅 로깅 추가 | 15분 | 개발자 |
| E2E 테스트 프로젝트 ID 수정 | 30분 | 개발자 |
| 수동 테스트 (API 응답 확인) | 15분 | QA |
| E2E 테스트 재실행 | 5분 | QA |
| 결과 분석 및 리포트 | 15분 | QA |
| **전체** | **1.5시간** | - |

---

## 7. 관련 이슈

- **TSK-05-01:** Detail Panel Structure (구현 완료, 검증 실패)
- **TSK-05-02:** Detail Sections (블로커 - TSK-05-01 미완)
- **TSK-05-03:** Detail Actions (블로커 - TSK-05-01 미완)
- **TSK-05-04:** Document Viewer (블로커 - TSK-05-01 미완)

---

## 8. 참고 문서

- 통합 테스트 보고서: `.jjiban/projects/jjiban/tasks/TSK-05-01/070-integration-test.md`
- 테스트 명세: `.jjiban/projects/jjiban/tasks/TSK-05-01/026-test-specification.md`
- 상세설계: `.jjiban/projects/jjiban/tasks/TSK-05-01/020-detail-design.md`

---

**담당자 액션 아이템:**

1. **개발자:** 4.1.1 ~ 4.1.3 수정 적용
2. **QA:** 5.1 검증 계획 실행
3. **PM:** 타임라인 모니터링 및 블로커 해소

---

<!--
author: AI Agent (quality-engineer)
created: 2025-12-15
severity: P0
status: Open
-->
