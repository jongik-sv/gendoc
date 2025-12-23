# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 상세설계

## 문서 정보
- Task ID: TSK-09-01
- 작성일: 2025-12-17
- 최종 수정: 2025-12-17 (설계 리뷰 반영)
- 상태: [dd] Detail Design
- 선행 문서: 010-basic-design.md, 011-ui-design.md
- 리뷰 문서: 021-design-review-claude-1.md

---

## 설계 리뷰 반영 사항

### Critical Issues (구현 차단)
- **C-01**: WbsNodeType에 'project' 타입 포함 확인 완료 (types/index.ts:2 이미 존재)
- **C-02**: ProjectWbsNode 타입 계층 명확화 (섹션 2.1 참조)

### High Priority Issues (설계 개선)
- **H-01**: 파일 컨텐츠 API 설계 추가 (섹션 1.2: GET /api/files/content)
- **H-02**: Path Traversal 보안 검증 강화 (섹션 15.1: 다층 방어 메커니즘)
- **H-03**: 캐싱 무효화 전략 추가 (섹션 8.2: TTL 기반 캐싱)
- **H-04**: Progress 계산 최적화 (섹션 1.1.4: 단일 순회로 통합)
- **H-05**: 이미지 뷰어 Blob URL 방식으로 변경 (섹션 4.3: 브라우저 보안 준수)

### 주요 개선 사항
1. **보안 강화**: Path Traversal 다층 방어, 심볼릭 링크 차단, 파일 크기 제한
2. **성능 최적화**: 진행률/Task 개수 단일 순회 (2N → N, 50% 감소)
3. **캐싱 전략**: TTL 기반 캐싱 + 명시적 무효화 함수
4. **타입 안전성**: 타입 가드 함수 추가, 타입 계층 관계도 문서화
5. **브라우저 호환**: file:// 프로토콜 대신 Blob URL 사용

---

## 1. API 상세 설계

### 1.1 GET /api/wbs/all

#### 1.1.1 엔드포인트
```
GET /api/wbs/all
```

#### 1.1.2 요청
- Query Parameters: 없음
- Headers: 없음
- Body: 없음

#### 1.1.3 응답

**성공 (200 OK)**
```typescript
interface AllWbsResponse {
  projects: ProjectWbsNode[]
}

interface ProjectWbsNode extends WbsNode {
  type: 'project'
  id: string              // 프로젝트 ID
  title: string           // 프로젝트 이름
  projectMeta: {
    name: string          // 프로젝트 이름
    status: 'active' | 'archived' | 'completed'
    wbsDepth: 3 | 4
    scheduledStart?: string    // YYYY-MM-DD
    scheduledEnd?: string      // YYYY-MM-DD
    description?: string
    createdAt: string
  }
  progress: number        // 전체 진행률 (0-100)
  taskCount: number       // 전체 Task 개수
  children: WbsNode[]     // WP 배열
}
```

**응답 예시**
```json
{
  "projects": [
    {
      "id": "jjiban",
      "type": "project",
      "title": "jjiban",
      "projectMeta": {
        "name": "jjiban",
        "status": "active",
        "wbsDepth": 4,
        "scheduledStart": "2024-01-01",
        "scheduledEnd": "2024-12-31",
        "description": "AI 기반 프로젝트 관리 도구",
        "createdAt": "2024-12-13"
      },
      "progress": 65,
      "taskCount": 42,
      "children": [
        {
          "id": "WP-01",
          "type": "wp",
          "title": "Platform Infrastructure",
          "progress": 100,
          "children": [...]
        }
      ]
    }
  ]
}
```

**에러 응답**
```typescript
// 500 Internal Server Error
{
  "statusCode": 500,
  "statusMessage": "Internal Server Error",
  "message": "프로젝트 목록 조회 실패: [상세 에러]"
}
```

#### 1.1.4 처리 로직

```typescript
// server/api/wbs/all.get.ts
export default defineEventHandler(async (event): Promise<AllWbsResponse> => {
  try {
    const result = await getAllProjectsWbs()
    return result
  } catch (error) {
    throw createInternalError(
      'WBS_FETCH_ERROR',
      `프로젝트 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
})
```

```typescript
// server/utils/wbs/wbsService.ts
export async function getAllProjectsWbs(): Promise<AllWbsResponse> {
  // 1. 프로젝트 목록 조회
  const projectsList = await scanProjects()

  // 2. 병렬로 각 프로젝트 WBS 로드
  const projectsWbs = await Promise.all(
    projectsList.map(async (project) => {
      try {
        const { metadata, tree } = await getWbsTree(project.id)
        const projectNode = createProjectNode(project, metadata, tree)
        return projectNode
      } catch (error) {
        // 개별 프로젝트 로드 실패 시 경고 로그만 (전체 실패 방지)
        console.warn(`[getAllProjectsWbs] Failed to load ${project.id}:`, error)
        return null
      }
    })
  )

  // 3. null 제거 (로드 실패한 프로젝트)
  const validProjects = projectsWbs.filter(p => p !== null) as ProjectWbsNode[]

  return { projects: validProjects }
}

/**
 * 프로젝트 WBS 노드 생성
 */
function createProjectNode(
  project: ProjectListItem,
  metadata: WbsMetadata,
  tree: WbsNode[]
): ProjectWbsNode {
  // 진행률 + Task 개수 계산 (단일 순회)
  const stats = calculateProjectStats(tree)

  return {
    id: project.id,
    type: 'project',
    title: project.name,
    projectMeta: {
      name: project.name,
      status: project.status,
      wbsDepth: project.wbsDepth,
      scheduledStart: metadata.start,
      scheduledEnd: undefined,  // project.json에 추가 필요
      description: undefined,   // project.json에서 로드
      createdAt: project.createdAt,
    },
    progress: stats.progress,
    taskCount: stats.taskCount,
    children: tree,
  }
}

/**
 * 프로젝트 통계 계산 (진행률 + Task 개수, 단일 순회)
 * 성능 최적화: 2N → N (50% 감소)
 */
function calculateProjectStats(tree: WbsNode[]): { progress: number; taskCount: number } {
  let totalProgress = 0
  let taskCount = 0

  function traverse(nodes: WbsNode[]): void {
    for (const node of nodes) {
      if (node.type === 'task') {
        totalProgress += node.progress || 0
        taskCount++
      }
      if (node.children?.length > 0) {
        traverse(node.children)
      }
    }
  }

  traverse(tree)

  return {
    progress: taskCount > 0 ? Math.round(totalProgress / taskCount) : 0,
    taskCount
  }
}
```

---

### 1.2 GET /api/files/content

#### 1.2.1 엔드포인트
```
GET /api/files/content?path={filePath}
```

#### 1.2.2 요청
- Query Parameters:
  - `path`: 파일 절대 경로 (string, 필수)
- Headers: 없음

#### 1.2.3 응답

**성공 (200 OK)**
```typescript
interface FileContentResponse {
  content: string  // UTF-8 텍스트 또는 Base64 인코딩된 바이너리
}
```

**에러 응답**
```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "message": "파일 경로가 필요합니다"
}

// 403 Forbidden
{
  "statusCode": 403,
  "statusMessage": "Forbidden",
  "message": ".jjiban 폴더 외부 접근 불가"
}

// 404 Not Found
{
  "statusCode": 404,
  "statusMessage": "Not Found",
  "message": "파일을 찾을 수 없습니다"
}
```

#### 1.2.4 처리 로직

```typescript
// server/api/files/content.get.ts
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event): Promise<FileContentResponse> => {
  const query = getQuery(event)
  const filePath = query.path as string

  // 1. 경로 검증 (필수)
  if (!filePath || typeof filePath !== 'string') {
    throw createBadRequestError('FILE_PATH_REQUIRED', '파일 경로가 필요합니다')
  }

  // 2. 보안: Path Traversal 방어
  const normalizedPath = resolve(filePath)
  const jjibanRoot = resolve(process.cwd(), '.jjiban')

  if (!normalizedPath.startsWith(jjibanRoot)) {
    throw createForbiddenError('ACCESS_DENIED', '.jjiban 폴더 외부 접근 불가')
  }

  // 3. 파일 존재 확인
  const exists = await fileExists(normalizedPath)
  if (!exists) {
    throw createNotFoundError('FILE_NOT_FOUND', '파일을 찾을 수 없습니다')
  }

  // 4. 파일 크기 제한 (10MB)
  const stats = await stat(normalizedPath)
  if (stats.size > 10 * 1024 * 1024) {
    throw createBadRequestError('FILE_TOO_LARGE', '파일 크기가 10MB를 초과합니다')
  }

  // 5. 파일 읽기
  try {
    const content = await readFile(normalizedPath, 'utf-8')
    return { content }
  } catch (error) {
    throw createInternalError(
      'FILE_READ_ERROR',
      `파일을 읽을 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
})
```

---

### 1.3 GET /api/projects/:id/files

#### 1.3.1 엔드포인트
```
GET /api/projects/:id/files
```

#### 1.3.2 요청
- Path Parameters:
  - `id`: 프로젝트 ID (string)
- Query Parameters: 없음
- Headers: 없음

#### 1.3.3 응답

**성공 (200 OK)**
```typescript
interface ProjectFilesResponse {
  files: ProjectFile[]
}

interface ProjectFile {
  name: string           // 파일명 (예: 'project.json')
  path: string           // 절대 경로
  relativePath: string   // 프로젝트 폴더 기준 상대 경로 (예: 'project.json')
  type: 'markdown' | 'image' | 'json' | 'other'
  size: number          // 바이트 단위
  createdAt: string     // ISO 8601
  updatedAt: string     // ISO 8601
}
```

**응답 예시**
```json
{
  "files": [
    {
      "name": "project.json",
      "path": "C:/project/jjiban/.jjiban/projects/jjiban/project.json",
      "relativePath": "project.json",
      "type": "json",
      "size": 512,
      "createdAt": "2024-12-13T00:00:00.000Z",
      "updatedAt": "2024-12-16T10:30:00.000Z"
    },
    {
      "name": "wbs.md",
      "path": "C:/project/jjiban/.jjiban/projects/jjiban/wbs.md",
      "relativePath": "wbs.md",
      "type": "markdown",
      "size": 25600,
      "createdAt": "2024-12-13T00:00:00.000Z",
      "updatedAt": "2024-12-16T15:45:00.000Z"
    }
  ]
}
```

**에러 응답**
```typescript
// 404 Not Found
{
  "statusCode": 404,
  "statusMessage": "Not Found",
  "message": "프로젝트를 찾을 수 없습니다: [projectId]"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "statusMessage": "Internal Server Error",
  "message": "파일 목록 조회 실패: [상세 에러]"
}
```

#### 1.3.4 처리 로직

```typescript
// server/api/projects/[id]/files.get.ts
import { getProjectFiles } from '../../../utils/projects/projectFilesService'

export default defineEventHandler(async (event): Promise<ProjectFilesResponse> => {
  const projectId = getRouterParam(event, 'id') as string

  try {
    const files = await getProjectFiles(projectId)
    return { files }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createInternalError(
      'FILE_LIST_ERROR',
      `파일 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
})
```

```typescript
// server/utils/projects/projectFilesService.ts
import { readdir, stat, realpath } from 'fs/promises'
import { join, resolve } from 'path'

/**
 * 프로젝트 폴더 내 파일 목록 조회
 * @param projectId 프로젝트 ID
 * @returns 파일 목록
 * @throws PROJECT_NOT_FOUND - 프로젝트 폴더 없음
 * @throws FILE_ACCESS_ERROR - 파일 시스템 접근 실패
 */
export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const projectPath = getProjectPath(projectId)

  // 프로젝트 폴더 존재 확인
  const exists = await fileExists(projectPath)
  if (!exists) {
    throw createNotFoundError(`프로젝트를 찾을 수 없습니다: ${projectId}`)
  }

  try {
    const entries = await readdir(projectPath, { withFileTypes: true })
    const files: ProjectFile[] = []

    for (const entry of entries) {
      // tasks 폴더는 제외
      if (entry.isDirectory() && entry.name === 'tasks') {
        continue
      }

      // 심볼릭 링크 필터링 (보안)
      if (entry.isSymbolicLink()) {
        continue
      }

      if (entry.isFile()) {
        const filePath = join(projectPath, entry.name)

        // 보안: Path Traversal 검증
        if (!validateFilePath(filePath, projectId)) {
          console.warn(`[getProjectFiles] Invalid file path detected: ${filePath}`)
          continue
        }

        const stats = await stat(filePath)

        files.push({
          name: entry.name,
          path: filePath,
          relativePath: entry.name,
          type: getFileType(entry.name),
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        })
      }
    }

    // 파일명 정렬
    return files.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    throw createInternalError(
      'FILE_ACCESS_ERROR',
      `파일 목록을 읽을 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 파일 경로 보안 검증 (Path Traversal 방어)
 * @param filePath 검증할 파일 경로
 * @param projectId 프로젝트 ID
 * @returns 검증 통과 여부
 */
function validateFilePath(filePath: string, projectId: string): boolean {
  try {
    // 1. 절대 경로 정규화 (../ 제거)
    const normalizedPath = resolve(filePath)
    const projectPath = resolve(getProjectPath(projectId))

    // 2. 프로젝트 폴더 내부인지 확인
    if (!normalizedPath.startsWith(projectPath)) {
      return false
    }

    // 3. 실제 파일 시스템 경로 확인 (심볼릭 링크 추적)
    const realFilePath = realpathSync(normalizedPath)
    const realProjectPath = realpathSync(projectPath)

    return realFilePath.startsWith(realProjectPath)
  } catch (error) {
    // realpath 실패 시 (파일 없음 등) false 반환
    return false
  }
}

/**
 * 파일 확장자로 타입 결정
 */
function getFileType(filename: string): ProjectFile['type'] {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'md') return 'markdown'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image'
  if (ext === 'json') return 'json'
  return 'other'
}
```

---

## 2. 타입 정의 확장

### 2.1 types/index.ts 추가

**중요 노트**: WbsNodeType은 이미 'project' 타입을 포함하고 있음 (types/index.ts:2)
```typescript
export type WbsNodeType = 'project' | 'wp' | 'act' | 'task';
```

#### 2.1.1 타입 계층 구조

```typescript
// 다중 프로젝트 WBS 응답
export interface AllWbsResponse {
  projects: ProjectWbsNode[]
}

// 프로젝트 WBS 노드
// WbsNode를 확장하여 프로젝트 메타데이터와 집계 정보 추가
export interface ProjectWbsNode extends WbsNode {
  type: 'project'  // WbsNodeType에 'project' 포함됨
  projectMeta: {
    name: string
    status: 'active' | 'archived' | 'completed'
    wbsDepth: 3 | 4
    scheduledStart?: string
    scheduledEnd?: string
    description?: string
    createdAt: string
  }
  progress: number        // 전체 Task 진행률 (0-100, 집계값)
  taskCount: number       // 전체 Task 개수 (집계값)
  children: WbsNode[]     // WP 배열
}

// 타입 가드 함수
export function isProjectNode(node: WbsNode): node is ProjectWbsNode {
  return node.type === 'project'
}

// 프로젝트 파일 정보
export interface ProjectFile {
  name: string
  path: string
  relativePath: string
  type: 'markdown' | 'image' | 'json' | 'other'
  size: number
  createdAt: string
  updatedAt: string
}

// 프로젝트 파일 목록 응답
export interface ProjectFilesResponse {
  files: ProjectFile[]
}

// 파일 컨텐츠 응답
export interface FileContentResponse {
  content: string  // UTF-8 텍스트 또는 Base64 인코딩된 바이너리
}
```

#### 2.1.2 타입 계층 관계도

```
WbsNode (기본 인터페이스)
├─ ProjectWbsNode (type: 'project')
│  └─ projectMeta, progress, taskCount 추가
├─ WpWbsNode (type: 'wp')
├─ ActWbsNode (type: 'act')
└─ TaskWbsNode (type: 'task')
```

**설계 원칙**:
- 기존 WbsNode 인터페이스는 유지 (하위 호환성)
- ProjectWbsNode는 WbsNode 확장 (progress, taskCount는 집계값)
- Task의 progress는 개별값, 프로젝트의 progress는 전체 평균값
- 타입 가드 함수로 런타임 타입 검증
```

---

## 3. 스토어 설계

### 3.1 wbs.ts 확장

#### 3.1.1 State 추가
```typescript
const isMultiProjectMode = ref(false)  // 다중 프로젝트 모드 여부
```

#### 3.1.2 Actions 추가

```typescript
/**
 * 모든 프로젝트 WBS 조회
 */
async function fetchAllWbs(): Promise<void> {
  loading.value = true
  error.value = null
  isMultiProjectMode.value = true

  try {
    const response = await $fetch<AllWbsResponse>('/api/wbs/all')
    tree.value = response.projects
    flatNodes.value = flattenTree(response.projects)

    // 프로젝트 노드만 기본 확장
    response.projects.forEach(project => {
      expandedNodes.value.add(project.id)
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch all WBS'
    throw e
  } finally {
    loading.value = false
  }
}

/**
 * 단일 프로젝트 WBS 조회 (기존)
 */
async function fetchWbs(projectId: string): Promise<void> {
  loading.value = true
  error.value = null
  isMultiProjectMode.value = false

  try {
    const response = await $fetch<{ metadata: WbsMetadata; tree: WbsNode[] }>(
      `/api/projects/${projectId}/wbs`
    )
    tree.value = response.tree
    flatNodes.value = flattenTree(response.tree)

    // 최상위 노드 확장
    response.tree.forEach(node => expandedNodes.value.add(node.id))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch WBS'
    throw e
  } finally {
    loading.value = false
  }
}
```

#### 3.1.3 Return 확장
```typescript
return {
  // State
  tree,
  flatNodes,
  loading,
  error,
  expandedNodes,
  searchQuery,
  isMultiProjectMode,  // 추가

  // Getters
  wpCount,
  actCount,
  tskCount,
  overallProgress,
  filteredTree,

  // Actions
  fetchWbs,
  fetchAllWbs,  // 추가
  saveWbs,
  getNode,
  toggleExpand,
  isExpanded,
  expandAll,
  collapseAll,
  clearWbs,
  setSearchQuery
}
```

---

### 3.2 selection.ts 확장

#### 3.2.1 State 추가
```typescript
const selectedProjectFiles = ref<ProjectFile[]>([])
const loadingFiles = ref(false)
```

#### 3.2.2 Actions 추가

```typescript
/**
 * 프로젝트 파일 목록 조회
 */
async function fetchProjectFiles(projectId: string): Promise<void> {
  loadingFiles.value = true

  try {
    const response = await $fetch<ProjectFilesResponse>(
      `/api/projects/${projectId}/files`
    )
    selectedProjectFiles.value = response.files
  } catch (e) {
    console.error('Failed to fetch project files:', e)
    selectedProjectFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

/**
 * 노드 선택 (확장)
 */
async function selectNode(nodeId: string | null): Promise<void> {
  selectedNodeId.value = nodeId

  if (!nodeId) {
    clearSelection()
    return
  }

  const node = wbsStore.getNode(nodeId)
  if (!node) return

  // 프로젝트 노드 선택 시 파일 목록 로드
  if (node.type === 'project') {
    await fetchProjectFiles(nodeId)
  }

  // Task 노드 선택 시 기존 로직 유지
  if (node.type === 'task') {
    await fetchTaskDetail(nodeId)
  }
}

/**
 * 선택 해제
 */
function clearSelection(): void {
  selectedNodeId.value = null
  selectedTask.value = null
  selectedProjectFiles.value = []
}
```

#### 3.2.3 Return 확장
```typescript
return {
  // State
  selectedNodeId,
  selectedTask,
  selectedProjectFiles,  // 추가
  loadingFiles,          // 추가
  loading,
  error,

  // Getters
  selectedNodeType,
  isTaskSelected,
  isWpOrActSelected,

  // Actions
  selectNode,
  fetchTaskDetail,
  fetchProjectFiles,  // 추가
  clearSelection
}
```

---

## 4. 컴포넌트 상세 설계

### 4.1 NodeIcon.vue 확장

#### 4.1.1 Props
```typescript
interface Props {
  type: WbsNodeType  // 'project' | 'wp' | 'act' | 'task'
  status?: string
  category?: TaskCategory
  progress?: number
}
```

#### 4.1.2 아이콘 매핑 확장
```typescript
const iconMap: Record<WbsNodeType, string> = {
  project: 'pi-folder',
  wp: 'pi-box',
  act: 'pi-list',
  task: 'pi-check-circle'
}
```

#### 4.1.3 CSS 클래스
```css
/* app/assets/css/main.css */
.node-icon-project {
  @apply text-violet-500;
}

.wbs-tree-node-title-project {
  @apply font-semibold text-violet-700 dark:text-violet-400;
}
```

---

### 4.2 ProjectDetailPanel.vue (신규)

#### 4.2.1 Props
```typescript
interface Props {
  projectId: string
  files: ProjectFile[]
}
```

#### 4.2.2 Emits
```typescript
const emit = defineEmits<{
  'file-select': [file: ProjectFile]
}>()
```

#### 4.2.3 State
```typescript
const wbsStore = useWbsStore()
const projectNode = computed(() => {
  const node = wbsStore.getNode(props.projectId)
  return node as ProjectWbsNode | undefined
})

const fileTypeIcon = (type: ProjectFile['type']): string => {
  const iconMap = {
    markdown: 'pi-file-edit',
    json: 'pi-code',
    image: 'pi-image',
    other: 'pi-file'
  }
  return iconMap[type]
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

#### 4.2.4 Template 구조
```vue
<template>
  <div class="project-detail-panel">
    <!-- 프로젝트 헤더 -->
    <div class="project-header">
      <div class="flex items-center gap-3">
        <i class="pi pi-folder text-violet-500 text-2xl"></i>
        <div>
          <h3 class="text-xl font-semibold">{{ projectNode?.title }}</h3>
          <p class="text-sm text-gray-600">{{ projectNode?.projectMeta.description }}</p>
        </div>
      </div>
    </div>

    <Divider />

    <!-- 일정 -->
    <div v-if="projectNode?.projectMeta.scheduledStart" class="project-schedule">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-calendar"></i>
        <span class="font-medium">일정</span>
      </div>
      <p class="text-sm">
        {{ projectNode.projectMeta.scheduledStart }}
        <span v-if="projectNode.projectMeta.scheduledEnd">
          ~ {{ projectNode.projectMeta.scheduledEnd }}
        </span>
      </p>
    </div>

    <!-- WBS 깊이 -->
    <div class="project-info">
      <i class="pi pi-sitemap"></i>
      <span>WBS 깊이: {{ projectNode?.projectMeta.wbsDepth }}단계</span>
    </div>

    <!-- 진행률 -->
    <div class="project-progress">
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium">진행률</span>
        <span class="text-sm">{{ projectNode?.progress }}%</span>
      </div>
      <ProgressBar :value="projectNode?.progress" />
      <p class="text-xs text-gray-600 mt-1">
        전체 Task: {{ projectNode?.taskCount }}개
      </p>
    </div>

    <Divider />

    <!-- 파일 목록 -->
    <div class="project-files">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-folder-open"></i>
        <span class="font-medium">파일 목록</span>
      </div>

      <Listbox
        v-if="files.length > 0"
        :options="files"
        optionLabel="name"
        class="project-file-list"
        @change="handleFileSelect"
      >
        <template #option="{ option }">
          <div class="project-file-item">
            <i :class="['pi', fileTypeIcon(option.type), `file-icon-${option.type}`]"></i>
            <div class="flex-1">
              <div class="file-name">{{ option.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(option.size) }} ·
                {{ new Date(option.updatedAt).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </template>
      </Listbox>

      <p v-else class="text-sm text-gray-500 italic">파일이 없습니다</p>
    </div>
  </div>
</template>
```

#### 4.2.5 Methods
```typescript
function handleFileSelect(event: { value: ProjectFile }): void {
  emit('file-select', event.value)
}
```

---

### 4.3 FileViewer.vue (신규)

#### 4.3.1 Props
```typescript
interface Props {
  file: ProjectFile
  visible: boolean
}
```

#### 4.3.2 Emits
```typescript
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()
```

#### 4.3.3 State
```typescript
const content = ref<string>('')
const imageUrl = ref<string | null>(null)  // Blob URL for images
const loading = ref(false)
const error = ref<string | null>(null)

const fileExtension = computed(() => {
  return props.file.name.split('.').pop()?.toLowerCase()
})

const isMarkdown = computed(() => props.file.type === 'markdown')
const isImage = computed(() => props.file.type === 'image')
const isCode = computed(() => ['json', 'other'].includes(props.file.type))

// Cleanup Blob URL on unmount
onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
})
```

#### 4.3.4 Methods
```typescript
/**
 * 파일 내용 로드
 */
async function loadFileContent(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    if (isImage.value) {
      // 이미지: Blob URL 방식 (브라우저 보안 준수)
      const blob = await $fetch<Blob>(
        `/api/files/content?path=${encodeURIComponent(props.file.path)}`,
        { responseType: 'blob' }
      )
      imageUrl.value = URL.createObjectURL(blob)
    } else {
      // 텍스트 파일: 일반 문자열
      const response = await $fetch<{ content: string }>(
        `/api/files/content?path=${encodeURIComponent(props.file.path)}`
      )
      content.value = response.content
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load file'
    console.error('File load error:', e)
  } finally {
    loading.value = false
  }
}

/**
 * 다이얼로그 닫기
 */
function handleClose(): void {
  emit('update:visible', false)
  content.value = ''
  error.value = null

  // Blob URL 메모리 해제
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = null
  }
}
```

#### 4.3.5 Template 구조
```vue
<template>
  <Dialog
    :visible="visible"
    :header="file.name"
    :modal="true"
    :style="{ width: '80vw', height: '80vh' }"
    @update:visible="handleClose"
  >
    <div v-if="loading" class="flex items-center justify-center h-full">
      <ProgressSpinner />
    </div>

    <div v-else-if="error" class="text-red-500">
      <i class="pi pi-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div v-else class="file-viewer-content">
      <!-- 마크다운 렌더링 -->
      <div v-if="isMarkdown" v-html="renderedMarkdown" class="markdown-content"></div>

      <!-- 이미지 표시 (Blob URL 방식) -->
      <div v-else-if="isImage" class="image-viewer">
        <img v-if="imageUrl" :src="imageUrl" :alt="file.name" class="max-w-full h-auto" />
        <p class="text-sm text-gray-600 mt-2">
          크기: {{ formatFileSize(file.size) }}
        </p>
      </div>

      <!-- 코드 뷰어 (Monaco Editor) -->
      <div v-else-if="isCode" class="code-viewer">
        <MonacoEditor
          :value="content"
          :language="getLanguage(fileExtension)"
          :options="{ readOnly: true, minimap: { enabled: false } }"
          height="calc(80vh - 100px)"
        />
      </div>
    </div>
  </Dialog>
</template>
```

#### 4.3.6 Computed Properties
```typescript
const renderedMarkdown = computed(() => {
  if (!isMarkdown.value || !content.value) return ''
  // 마크다운 렌더링 (기존 렌더러 재사용)
  return renderMarkdown(content.value)
})

function getLanguage(ext: string | undefined): string {
  const langMap: Record<string, string> = {
    json: 'json',
    js: 'javascript',
    ts: 'typescript',
    md: 'markdown',
    css: 'css',
    html: 'html'
  }
  return langMap[ext || ''] || 'plaintext'
}
```

---

## 5. 페이지 로직 설계

### 5.1 wbs.vue 수정

#### 5.1.1 조건부 로딩 로직
```typescript
// app/pages/wbs.vue
const route = useRoute()
const wbsStore = useWbsStore()
const selectionStore = useSelectionStore()

onMounted(async () => {
  const projectId = route.query.project as string | undefined

  if (projectId) {
    // 기존: 단일 프로젝트 모드
    await loadProjectAndWbs(projectId)
  } else {
    // 신규: 다중 프로젝트 모드
    await wbsStore.fetchAllWbs()
  }
})

/**
 * 단일 프로젝트 로드 (기존)
 */
async function loadProjectAndWbs(projectId: string): Promise<void> {
  try {
    await projectStore.fetchProject(projectId)
    await wbsStore.fetchWbs(projectId)
  } catch (error) {
    console.error('Failed to load project:', error)
  }
}
```

#### 5.1.2 템플릿 분기
```vue
<template>
  <div class="wbs-page">
    <!-- 좌측: WBS 트리 -->
    <div class="wbs-tree-container">
      <WbsTreePanel />
    </div>

    <!-- 우측: 상세 패널 -->
    <div class="wbs-detail-container">
      <!-- 프로젝트 선택 시 -->
      <ProjectDetailPanel
        v-if="selectionStore.selectedNodeType === 'project'"
        :project-id="selectionStore.selectedNodeId!"
        :files="selectionStore.selectedProjectFiles"
        @file-select="handleFileSelect"
      />

      <!-- WP/ACT 선택 시 -->
      <WpActPanel
        v-else-if="selectionStore.isWpOrActSelected"
      />

      <!-- Task 선택 시 -->
      <TaskDetailPanel
        v-else-if="selectionStore.isTaskSelected"
      />

      <!-- 미선택 -->
      <div v-else class="empty-state">
        <p>노드를 선택하세요</p>
      </div>
    </div>

    <!-- 파일 뷰어 다이얼로그 -->
    <FileViewer
      v-if="selectedFile"
      :file="selectedFile"
      :visible="fileViewerVisible"
      @update:visible="fileViewerVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
const selectedFile = ref<ProjectFile | null>(null)
const fileViewerVisible = ref(false)

function handleFileSelect(file: ProjectFile): void {
  selectedFile.value = file
  fileViewerVisible.value = true
}
</script>
```

---

## 6. 데이터 흐름 다이어그램

### 6.1 다중 프로젝트 모드
```
[사용자] → /wbs 접속
         ↓
[wbs.vue] onMounted (projectId 없음)
         ↓
[wbsStore.fetchAllWbs()]
         ↓
GET /api/wbs/all
         ↓
[wbsService.getAllProjectsWbs()]
         ├─ scanProjects()
         ├─ Promise.all([getWbsTree(p1), getWbsTree(p2), ...])
         └─ createProjectNode() × N
         ↓
{ projects: [ProjectWbsNode, ...] }
         ↓
[wbsStore.tree] = projects
[wbsStore.isMultiProjectMode] = true
         ↓
[WbsTreePanel] 렌더링
```

### 6.2 프로젝트 선택 → 파일 목록 로드
```
[사용자] → 프로젝트 노드 클릭
         ↓
[WbsTreePanel] @node-select
         ↓
[selectionStore.selectNode(projectId)]
         ↓
if (node.type === 'project')
         ↓
[selectionStore.fetchProjectFiles(projectId)]
         ↓
GET /api/projects/:id/files
         ↓
[projectFilesService.getProjectFiles()]
         ├─ readdir(projectPath)
         ├─ stat() × N
         └─ getFileType()
         ↓
{ files: [ProjectFile, ...] }
         ↓
[selectionStore.selectedProjectFiles] = files
         ↓
[ProjectDetailPanel] 파일 목록 표시
```

### 6.3 파일 선택 → 뷰어 열기
```
[사용자] → 파일 클릭
         ↓
[ProjectDetailPanel] @file-select
         ↓
[wbs.vue] handleFileSelect(file)
         ↓
selectedFile = file
fileViewerVisible = true
         ↓
[FileViewer] Dialog 열림
         ↓
if (isImage) → 직접 표시
else → loadFileContent()
         ↓
GET /api/files/content?path=...
         ↓
{ content: "..." }
         ↓
if (markdown) → renderedMarkdown
if (code) → Monaco Editor
```

---

## 7. 에러 처리

### 7.1 API 에러 처리

```typescript
// getAllProjectsWbs() 개별 프로젝트 로드 실패
try {
  const { metadata, tree } = await getWbsTree(project.id)
  return createProjectNode(project, metadata, tree)
} catch (error) {
  console.warn(`[getAllProjectsWbs] Failed to load ${project.id}:`, error)
  return null  // 전체 API 실패 방지
}
```

### 7.2 UI 에러 표시

```vue
<!-- WbsTreePanel: 로드 실패 시 -->
<div v-if="wbsStore.error" class="error-message">
  <i class="pi pi-exclamation-triangle"></i>
  <p>{{ wbsStore.error }}</p>
  <Button label="재시도" @click="retryLoad" />
</div>
```

### 7.3 에러 복구 전략

| 에러 상황 | 복구 방법 |
|----------|----------|
| 개별 프로젝트 로드 실패 | 해당 프로젝트만 제외, 나머지 표시 |
| 전체 프로젝트 목록 실패 | 에러 메시지 + 재시도 버튼 |
| 파일 목록 로드 실패 | 빈 파일 목록 표시 + 로그 |
| 파일 내용 로드 실패 | FileViewer에서 에러 메시지 표시 |

---

## 8. 성능 최적화

### 8.1 병렬 처리
```typescript
// 모든 프로젝트 WBS를 병렬로 로드
const projectsWbs = await Promise.all(
  projectsList.map(project => getWbsTree(project.id))
)
```

### 8.2 파일 목록 캐싱 (TTL 기반)
```typescript
// selectionStore에서 프로젝트별 파일 목록 캐싱 (무효화 전략 포함)
interface CacheEntry {
  data: ProjectFile[]
  timestamp: number
}

const fileCache = ref<Map<string, CacheEntry>>(new Map())
const CACHE_TTL = 60000  // 60초

/**
 * 프로젝트 파일 목록 조회 (캐시 우선, TTL 적용)
 * @param projectId 프로젝트 ID
 * @param force 강제 재조회 (캐시 무시)
 */
async function fetchProjectFiles(projectId: string, force = false): Promise<void> {
  const cached = fileCache.value.get(projectId)

  // force 플래그 또는 캐시 만료 시 재조회
  if (!force && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    selectedProjectFiles.value = cached.data
    return
  }

  loadingFiles.value = true

  try {
    const response = await $fetch<ProjectFilesResponse>(
      `/api/projects/${projectId}/files`
    )

    // 캐시 저장 (타임스탬프 포함)
    fileCache.value.set(projectId, {
      data: response.files,
      timestamp: Date.now()
    })
    selectedProjectFiles.value = response.files
  } catch (e) {
    console.error('Failed to fetch project files:', e)
    selectedProjectFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

/**
 * 명시적 캐시 무효화
 * 워크플로우 전이로 문서 생성 시 호출
 */
function invalidateFileCache(projectId: string): void {
  fileCache.value.delete(projectId)
}
```

### 8.3 가상 스크롤
```vue
<!-- 파일 목록이 많을 경우 VirtualScroller 사용 -->
<VirtualScroller
  :items="files"
  :itemSize="50"
  class="project-file-list"
>
  <template #item="{ item }">
    <div class="project-file-item">
      <!-- 파일 아이템 -->
    </div>
  </template>
</VirtualScroller>
```

---

## 9. 접근성 (A11y)

### 9.1 키보드 네비게이션
- 트리 노드: ↑↓ 키로 이동, Enter로 선택
- 파일 목록: Tab으로 이동, Enter로 열기
- 다이얼로그: Esc로 닫기

### 9.2 ARIA 속성
```vue
<div
  role="treeitem"
  :aria-label="`프로젝트: ${node.title}`"
  :aria-expanded="isExpanded(node.id)"
>
  <!-- 프로젝트 노드 -->
</div>

<button
  role="button"
  :aria-label="`파일 열기: ${file.name}`"
  @click="openFile(file)"
>
  <!-- 파일 버튼 -->
</button>
```

### 9.3 색상 대비
- 프로젝트 아이콘: `text-violet-500` (충분한 대비)
- 파일 아이콘: 타입별 색상 (WCAG AA 준수)
- 다크 모드: `dark:text-violet-400` 변형 제공

---

## 10. 호환성 보장

### 10.1 URL 파라미터 처리
```typescript
// ?project=xxx 파라미터 있으면 기존 동작
if (route.query.project) {
  // 단일 프로젝트 모드
  await wbsStore.fetchWbs(projectId)
} else {
  // 다중 프로젝트 모드
  await wbsStore.fetchAllWbs()
}
```

### 10.2 API 하위 호환성
- 기존 `GET /api/projects/:id/wbs` 유지
- 신규 `GET /api/wbs/all` 추가
- 기존 Task API는 변경 없음

### 10.3 상태 관리 하위 호환성
- `wbsStore.fetchWbs()` 기존 함수 유지
- `wbsStore.fetchAllWbs()` 신규 함수 추가
- `isMultiProjectMode` 플래그로 모드 구분

---

## 11. 테스트 전략

### 11.1 단위 테스트
- `getAllProjectsWbs()` 함수 테스트
- `getProjectFiles()` 함수 테스트
- `createProjectNode()` 계산 로직 테스트

### 11.2 통합 테스트
- API 엔드포인트 E2E 테스트
- 다중 프로젝트 로드 시나리오
- 파일 뷰어 열기/닫기

### 11.3 UI 테스트
- 프로젝트 노드 클릭 → 상세 패널 표시
- 파일 클릭 → 뷰어 다이얼로그 열림
- URL 파라미터 변경 → 모드 전환

---

## 12. 구현 순서

1. **Phase 1: Backend API**
   - `server/api/wbs/all.get.ts`
   - `server/api/projects/[id]/files.get.ts`
   - `server/utils/wbs/wbsService.ts` (getAllProjectsWbs)
   - `server/utils/projects/projectFilesService.ts`

2. **Phase 2: Types & Store**
   - `types/index.ts` (타입 추가)
   - `app/stores/wbs.ts` (fetchAllWbs)
   - `app/stores/selection.ts` (fetchProjectFiles)

3. **Phase 3: Components**
   - `app/components/wbs/NodeIcon.vue` (프로젝트 아이콘)
   - `app/assets/css/main.css` (프로젝트 스타일)
   - `app/components/wbs/detail/ProjectDetailPanel.vue`
   - `app/components/wbs/detail/FileViewer.vue`

4. **Phase 4: Page Integration**
   - `app/pages/wbs.vue` (조건부 로딩)
   - `app/composables/useWbsPage.ts` (다중 프로젝트 로직)

5. **Phase 5: Testing**
   - API 테스트
   - E2E 테스트
   - 접근성 테스트

---

## 13. 파일 수정 목록

| 우선순위 | 파일 | 작업 내용 |
|---------|------|----------|
| 1 | `server/api/wbs/all.get.ts` | 신규 생성 |
| 1 | `server/api/files/content.get.ts` | **신규 생성 (H-01)** |
| 1 | `server/api/projects/[id]/files.get.ts` | 신규 생성 |
| 1 | `server/utils/wbs/wbsService.ts` | getAllProjectsWbs(), calculateProjectStats() 추가 |
| 1 | `server/utils/projects/projectFilesService.ts` | 신규 생성 (validateFilePath 포함) |
| 2 | `types/index.ts` | 타입 추가 (ProjectWbsNode, isProjectNode 등) |
| 2 | `app/stores/wbs.ts` | fetchAllWbs(), isMultiProjectMode 추가 |
| 2 | `app/stores/selection.ts` | fetchProjectFiles() (TTL 캐싱), invalidateFileCache() 추가 |
| 3 | `app/components/wbs/NodeIcon.vue` | 프로젝트 아이콘 추가 |
| 3 | `app/assets/css/main.css` | 프로젝트 스타일 추가 |
| 3 | `app/components/wbs/detail/ProjectDetailPanel.vue` | 신규 생성 |
| 3 | `app/components/wbs/detail/FileViewer.vue` | 신규 생성 (Blob URL 방식) |
| 4 | `app/pages/wbs.vue` | 조건부 로딩 로직 추가 |
| 4 | `app/composables/useWbsPage.ts` | 다중 프로젝트 로직 추가 (선택 사항) |

---

## 14. 의존성

### 14.1 선행 Task
- TSK-04-01: WBS 서비스 및 파서 (완료)
- TSK-03-02: 프로젝트 관리 API (완료)

### 14.2 외부 라이브러리
- PrimeVue: Listbox, Dialog, ProgressBar, Divider
- Monaco Editor: 코드 뷰어 (이미 설치됨)
- Markdown 렌더러: 기존 사용 중

---

## 15. 보안 고려사항

### 15.1 파일 경로 검증 (Path Traversal 방어)

#### 15.1.1 보안 위협
- `../` 경로 조작으로 상위 폴더 접근
- 심볼릭 링크를 통한 우회
- Windows/Linux 경로 차이 악용

#### 15.1.2 방어 메커니즘
```typescript
import { resolve, realpath } from 'path'

/**
 * 파일 경로 보안 검증 (다층 방어)
 */
function validateFilePath(filePath: string, projectId: string): boolean {
  try {
    // 1. 절대 경로 정규화 (../ 제거)
    const normalizedPath = resolve(filePath)
    const projectPath = resolve(getProjectPath(projectId))

    // 2. 프로젝트 폴더 내부인지 확인
    if (!normalizedPath.startsWith(projectPath)) {
      return false
    }

    // 3. 실제 파일 시스템 경로 확인 (심볼릭 링크 추적)
    const realFilePath = realpathSync(normalizedPath)
    const realProjectPath = realpathSync(projectPath)

    return realFilePath.startsWith(realProjectPath)
  } catch (error) {
    // realpath 실패 시 (파일 없음 등) false 반환
    return false
  }
}
```

#### 15.1.3 적용 지점
- `GET /api/files/content`: 파일 읽기 전 검증
- `getProjectFiles()`: 파일 목록 생성 시 필터링
- 심볼릭 링크 차단: `entry.isSymbolicLink()` 검사

### 15.2 파일 크기 제한
```typescript
// 10MB 초과 파일 거부
const MAX_FILE_SIZE = 10 * 1024 * 1024

const stats = await stat(normalizedPath)
if (stats.size > MAX_FILE_SIZE) {
  throw createBadRequestError('FILE_TOO_LARGE', '파일 크기가 10MB를 초과합니다')
}
```

### 15.3 파일 내용 인코딩
```typescript
// XSS 방지: 마크다운 렌더링 시 sanitize
const renderedMarkdown = computed(() => {
  return sanitizeHtml(renderMarkdown(content.value))
})
```

### 15.4 접근 범위 제한
- `.jjiban` 폴더 외부 접근 차단
- 프로젝트 폴더 간 교차 접근 차단
- `tasks` 폴더 내 파일은 별도 API 사용 (프로젝트 루트 목록에서 제외)

---

## 부록

### A. 참조 문서
- 010-basic-design.md: 기본 설계
- 011-ui-design.md: 화면 설계
- PRD 섹션 6.5: 다중 프로젝트 통합 뷰

### B. 용어 정의
- **다중 프로젝트 모드**: `/wbs` URL로 모든 프로젝트를 한 트리에 표시
- **단일 프로젝트 모드**: `/wbs?project=xxx` URL로 특정 프로젝트만 표시
- **ProjectWbsNode**: 프로젝트 수준의 WBS 노드 (children: WP 배열)

### C. 변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-17 | 1.0 | 초안 작성 | System Architect |
