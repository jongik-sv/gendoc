# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 설계 리뷰

## 문서 정보
- Task ID: TSK-09-01
- 리뷰어: Claude (Sonnet 4.5)
- 리뷰 날짜: 2025-12-17
- 대상 문서:
  - 010-basic-design.md
  - 011-ui-design.md
  - 020-detail-design.md

---

## 1. 종합 평가

### 1.1 설계 품질 점수

| 항목 | 점수 | 비고 |
|------|------|------|
| API 설계 일관성 | 85/100 | 기존 패턴 준수, 타입 정의 개선 필요 |
| 타입 정의 완전성 | 70/100 | WbsNode 확장 누락, 타입 가드 부재 |
| 에러 처리 적절성 | 90/100 | 전략 명확, 복구 메커니즘 우수 |
| 성능 고려사항 | 75/100 | 병렬 처리 우수, 캐싱 전략 미흡 |
| 보안 고려사항 | 80/100 | 경로 검증 있음, sanitization 추가 필요 |
| 기존 코드 일관성 | 85/100 | 전반적 일관성, 일부 패턴 불일치 |
| **총점** | **81/100** | **승인 조건부 (지적사항 수정 후)** |

### 1.2 승인 여부

**조건부 승인 (Approved with Conditions)**

다음 Critical 및 High 심각도 이슈를 구현 전 수정해야 합니다:
- C-01: WbsNode 타입 확장 누락
- H-01: 파일 API 누락
- H-02: 파일 경로 보안 검증 강화
- H-03: 캐싱 무효화 전략 부재

---

## 2. Critical 지적사항 (구현 차단)

### C-01: WbsNode 타입 확장 누락

**심각도**: Critical
**위치**: types/index.ts, 020-detail-design.md 섹션 2.1

**문제점**:
```typescript
// 설계서에서 정의한 ProjectWbsNode
export interface ProjectWbsNode extends WbsNode {
  type: 'project'  // 🚨 WbsNodeType에 'project' 타입이 없음
  projectMeta: { ... }
}

// 현재 types/index.ts의 WbsNodeType 정의
export type WbsNodeType = 'wp' | 'act' | 'task';  // ❌ 'project' 누락
```

**영향**:
- TypeScript 컴파일 에러 발생
- NodeIcon.vue에서 타입 안전성 상실
- 모든 타입 가드 함수 실패

**권고사항**:
```typescript
// types/index.ts 수정
export type WbsNodeType = 'project' | 'wp' | 'act' | 'task';

// 타입 가드 함수 추가
export function isProjectNode(node: WbsNode): node is ProjectWbsNode {
  return node.type === 'project';
}
```

**참조**: 기존 wbsService.ts는 3단계/4단계(WP→ACT→TSK)만 처리하므로, 프로젝트 계층 추가 시 파서/시리얼라이저 영향도 검토 필요

---

### C-02: API 응답 타입 불일치

**심각도**: Critical
**위치**: 020-detail-design.md 섹션 1.1.3

**문제점**:
```typescript
// 설계: ProjectWbsNode가 progress, taskCount 포함
interface ProjectWbsNode {
  progress: number        // ✅ 계산된 값
  taskCount: number       // ✅ 계산된 값
  children: WbsNode[]
}

// 하지만 WbsNode 기본 인터페이스와 충돌
export interface WbsNode {
  progress?: number  // Task만 가짐
  taskCount?: number // WP/ACT에서 사용
}
```

**영향**:
- 타입 시스템에서 프로젝트 노드와 하위 노드 구분 불가
- flattenTree 헬퍼에서 타입 혼란
- 진행률 계산 로직 중복

**권고사항**:
```typescript
// 명확한 타입 계층 구조
export interface BaseWbsNode {
  id: string;
  type: WbsNodeType;
  title: string;
  children: WbsNode[];
}

export interface ProjectWbsNode extends BaseWbsNode {
  type: 'project';
  projectMeta: ProjectMetadata;
  progress: number;      // 전체 Task 진행률
  taskCount: number;     // 전체 Task 개수
}

export interface TaskWbsNode extends BaseWbsNode {
  type: 'task';
  progress: number;      // 개별 Task 진행률
  category: TaskCategory;
  status: TaskStatus;
}

export type WbsNode = ProjectWbsNode | WpWbsNode | ActWbsNode | TaskWbsNode;
```

---

## 3. High 지적사항 (설계 개선 필요)

### H-01: 파일 컨텐츠 조회 API 누락

**심각도**: High
**위치**: 020-detail-design.md 섹션 4.3.4

**문제점**:
설계서에서 FileViewer 컴포넌트가 `GET /api/files/content?path=...` 엔드포인트를 호출하는데, 해당 API 설계가 누락됨

```typescript
// 4.3.4에서 사용하는 API (설계 누락)
const response = await $fetch<{ content: string }>(
  `/api/files/content?path=${encodeURIComponent(props.file.path)}`
)
```

**권고사항**:
API 설계 추가 필요:

```typescript
// server/api/files/content.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filePath = query.path as string;

  // 1. 경로 검증 (필수)
  if (!filePath || typeof filePath !== 'string') {
    throw createBadRequestError('FILE_PATH_REQUIRED', '파일 경로가 필요합니다');
  }

  // 2. 보안: .jjiban 외부 접근 차단
  const normalizedPath = path.resolve(filePath);
  const jjibanRoot = path.resolve(process.cwd(), '.jjiban');
  if (!normalizedPath.startsWith(jjibanRoot)) {
    throw createForbiddenError('ACCESS_DENIED', '.jjiban 폴더 외부 접근 불가');
  }

  // 3. 파일 존재 확인
  const exists = await fileExists(normalizedPath);
  if (!exists) {
    throw createNotFoundError('FILE_NOT_FOUND', '파일을 찾을 수 없습니다');
  }

  // 4. 파일 읽기 (인코딩 명시)
  const content = await fs.readFile(normalizedPath, 'utf-8');

  return { content };
});
```

**추가 고려사항**:
- 파일 크기 제한 (예: 10MB 초과 시 거부)
- 바이너리 파일 처리 (이미지는 base64 인코딩)
- 캐싱 헤더 설정 (ETag, Last-Modified)

---

### H-02: 파일 경로 보안 검증 강화 필요

**심각도**: High
**위치**: 020-detail-design.md 섹션 15.1

**문제점**:
```typescript
// 현재 설계의 검증 로직 (불충분)
function validateFilePath(filePath: string, projectId: string): boolean {
  const projectPath = getProjectPath(projectId);
  return filePath.startsWith(projectPath);  // ❌ Path Traversal 취약
}
```

**보안 위험**:
- `../` 경로 조작으로 상위 폴더 접근 가능
- 심볼릭 링크를 통한 우회 가능
- Windows/Linux 경로 차이 미고려

**권고사항**:
```typescript
import path from 'path';

/**
 * 파일 경로 보안 검증 (Path Traversal 방어)
 */
function validateFilePath(filePath: string, projectId: string): boolean {
  // 1. 절대 경로 정규화 (../ 제거)
  const normalizedPath = path.resolve(filePath);
  const projectPath = path.resolve(getProjectPath(projectId));

  // 2. 프로젝트 폴더 내부인지 확인
  if (!normalizedPath.startsWith(projectPath)) {
    return false;
  }

  // 3. 경로가 실제 파일 시스템 내부인지 확인 (심볼릭 링크 추적)
  const realPath = fs.realpathSync(normalizedPath);
  const realProjectPath = fs.realpathSync(projectPath);

  return realPath.startsWith(realProjectPath);
}
```

**추가 조치**:
- `getProjectFiles()`에서 심볼릭 링크 필터링
- 허용된 파일 확장자 화이트리스트 적용

---

### H-03: 캐싱 무효화 전략 부재

**심각도**: High
**위치**: 020-detail-design.md 섹션 8.2

**문제점**:
```typescript
// 설계된 캐싱 로직 (무효화 전략 없음)
const fileCache = ref<Map<string, ProjectFile[]>>(new Map());

async function fetchProjectFiles(projectId: string): Promise<void> {
  if (fileCache.value.has(projectId)) {
    selectedProjectFiles.value = fileCache.value.get(projectId)!;
    return;  // ❌ 파일 변경 시 stale 데이터 반환
  }
  // ...
}
```

**문제 시나리오**:
1. 사용자가 프로젝트 A 파일 목록 조회
2. 터미널에서 새 문서 생성 (예: `jji doc TSK-XX-01 design`)
3. 사용자가 다시 프로젝트 A 선택
4. 캐시된 오래된 목록 표시 (새 문서 누락)

**권고사항**:
```typescript
// 1. TTL 기반 캐싱
interface CacheEntry {
  data: ProjectFile[];
  timestamp: number;
}

const fileCache = ref<Map<string, CacheEntry>>(new Map());
const CACHE_TTL = 60000; // 60초

async function fetchProjectFiles(projectId: string, force = false): Promise<void> {
  const cached = fileCache.value.get(projectId);

  // force 또는 캐시 만료 시 재조회
  if (!force && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    selectedProjectFiles.value = cached.data;
    return;
  }

  const response = await $fetch<ProjectFilesResponse>(...);

  fileCache.value.set(projectId, {
    data: response.files,
    timestamp: Date.now()
  });
  selectedProjectFiles.value = response.files;
}

// 2. 명시적 캐시 무효화
function invalidateFileCache(projectId: string) {
  fileCache.value.delete(projectId);
}
```

**이벤트 기반 무효화 고려**:
- 워크플로우 전이 성공 시 → 문서 생성됨 → 캐시 무효화
- WebSocket/Server-Sent Events로 파일 변경 감지

---

### H-04: 프로젝트 노드 진행률 계산 로직 성능 이슈

**심각도**: High
**위치**: 020-detail-design.md 섹션 1.1.4

**문제점**:
```typescript
// getAllProjectsWbs() 내부 (N개 프로젝트 × M개 Task)
function calculateProjectProgress(tree: WbsNode[]): number {
  const tasks = collectAllTasks(tree);  // 재귀 순회 O(N)
  if (tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / tasks.length);
}

function countAllTasks(tree: WbsNode[]): number {
  return collectAllTasks(tree).length;  // 재귀 순회 O(N) 중복
}
```

**성능 문제**:
- `calculateProjectProgress()`와 `countAllTasks()`가 각각 트리 전체 순회
- 프로젝트 10개 × Task 평균 50개 = 1000회 노드 순회 (불필요한 중복)

**권고사항**:
```typescript
// 1회 순회로 통합
function calculateProjectStats(tree: WbsNode[]): { progress: number; taskCount: number } {
  let totalProgress = 0;
  let taskCount = 0;

  function traverse(nodes: WbsNode[]): void {
    for (const node of nodes) {
      if (node.type === 'task') {
        totalProgress += node.progress || 0;
        taskCount++;
      }
      if (node.children?.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);

  return {
    progress: taskCount > 0 ? Math.round(totalProgress / taskCount) : 0,
    taskCount
  };
}

// 사용
const stats = calculateProjectStats(tree);
return {
  ...projectNode,
  progress: stats.progress,
  taskCount: stats.taskCount
};
```

**예상 개선**:
- 순회 횟수: 2N → N (50% 감소)
- 프로젝트 10개 기준: ~1000ms → ~500ms

---

### H-05: FileViewer 이미지 경로 처리 오류

**심각도**: High
**위치**: 011-ui-design.md 섹션 4.2, 020-detail-design.md 섹션 4.3.5

**문제점**:
```vue
<!-- 설계된 이미지 표시 방식 (브라우저에서 작동 안 함) -->
<img :src="`file://${file.path}`" :alt="file.name" />
```

**왜 안 되는가**:
- Nuxt는 브라우저 환경에서 실행됨
- `file://` 프로토콜은 보안상 브라우저에서 차단됨 (CORS)
- Windows 절대 경로 (`C:\project\...`)는 웹 URL이 아님

**권고사항**:

**방법 1: Blob URL 사용 (권장)**
```vue
<script setup>
const imageUrl = ref<string | null>(null);

async function loadImage() {
  if (!isImage.value) return;

  try {
    const response = await $fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`, {
      responseType: 'blob'  // 바이너리 데이터
    });
    imageUrl.value = URL.createObjectURL(response);
  } catch (e) {
    error.value = e;
  }
}

onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);  // 메모리 해제
  }
});
</script>

<template>
  <img v-if="imageUrl" :src="imageUrl" :alt="file.name" />
</template>
```

**방법 2: Base64 인코딩**
```typescript
// server/api/files/content.get.ts
if (isImageFile(filePath)) {
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString('base64');
  const mimeType = getMimeType(filePath);
  return { content: `data:${mimeType};base64,${base64}` };
}
```

**비교**:
| 방법 | 장점 | 단점 |
|------|------|------|
| Blob URL | 메모리 효율적, 큰 파일 가능 | 추가 API 요청 필요 |
| Base64 | 1회 요청으로 완결 | 파일 크기 33% 증가, 메모리 부담 |

**권고**: Blob URL 방식 (Base64는 10MB 이하 파일만)

---

## 4. Medium 지적사항 (개선 권장)

### M-01: API 응답 표준화 불일치

**심각도**: Medium
**위치**: 020-detail-design.md 섹션 1.1.3, 1.2.3

**문제점**:
```typescript
// /api/wbs/all 응답 (래퍼 없음)
interface AllWbsResponse {
  projects: ProjectWbsNode[]
}

// /api/projects/:id/files 응답 (래퍼 있음)
interface ProjectFilesResponse {
  files: ProjectFile[]
}

// 기존 Task API 응답 (다른 패턴)
interface TaskResponse {
  success: boolean;
  task: TaskDetail;
}
```

**권고사항**:
전 프로젝트 일관된 응답 형식 적용

```typescript
// 표준 응답 래퍼 (types/index.ts에 추가)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
}

// 적용 예시
export interface AllWbsResponse extends ApiResponse<ProjectWbsNode[]> {
  data: ProjectWbsNode[];  // projects → data로 통일
}
```

---

### M-02: 파일 타입 판단 로직 확장성 부족

**심각도**: Medium
**위치**: 020-detail-design.md 섹션 1.2.4

**문제점**:
```typescript
// 하드코딩된 파일 타입 매핑 (확장 어려움)
function getFileType(filename: string): ProjectFile['type'] {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'md') return 'markdown';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (ext === 'json') return 'json';
  return 'other';
}
```

**권고사항**:
설정 기반 접근 (확장 가능)

```typescript
// server/utils/files/fileTypes.ts
export const FILE_TYPE_REGISTRY = {
  markdown: {
    extensions: ['md', 'markdown', 'mdown'],
    mimeType: 'text/markdown',
    icon: 'pi-file-edit'
  },
  image: {
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'],
    mimeType: 'image/*',
    icon: 'pi-image'
  },
  json: {
    extensions: ['json', 'jsonc'],
    mimeType: 'application/json',
    icon: 'pi-code'
  },
  code: {
    extensions: ['js', 'ts', 'vue', 'css', 'html'],
    mimeType: 'text/plain',
    icon: 'pi-code'
  },
  document: {
    extensions: ['pdf', 'doc', 'docx'],
    mimeType: 'application/octet-stream',
    icon: 'pi-file'
  }
} as const;

export function getFileType(filename: string): keyof typeof FILE_TYPE_REGISTRY | 'other' {
  const ext = filename.toLowerCase().split('.').pop();
  for (const [type, config] of Object.entries(FILE_TYPE_REGISTRY)) {
    if (config.extensions.includes(ext || '')) {
      return type as keyof typeof FILE_TYPE_REGISTRY;
    }
  }
  return 'other';
}
```

---

### M-03: 프로젝트 메타데이터 불완전

**심각도**: Medium
**위치**: 020-detail-design.md 섹션 1.1.4

**문제점**:
```typescript
projectMeta: {
  scheduledEnd: undefined,   // ❌ project.json에 없는 필드
  description: undefined,    // ❌ project.json에서 로드되지 않음
}
```

**권고사항**:
1. `project.json` 스키마 확장 필요
```json
{
  "id": "jjiban",
  "name": "jjiban",
  "status": "active",
  "wbsDepth": 4,
  "createdAt": "2024-12-13",
  "scheduledStart": "2024-01-01",
  "scheduledEnd": "2024-12-31",  // ← 추가
  "description": "AI 기반 프로젝트 관리 도구"  // ← 추가
}
```

2. 기존 프로젝트 마이그레이션 스크립트 작성
3. 선택적 필드 타입 정의 명확화

---

### M-04: 검색 기능과 다중 프로젝트 모드 충돌

**심각도**: Medium
**위치**: app/stores/wbs.ts, 020-detail-design.md

**문제점**:
현재 wbs.ts의 `filteredTree` computed는 단일 프로젝트 기준으로 설계됨
```typescript
const filteredTree = computed(() => {
  if (!searchQuery.value.trim()) return tree.value;
  return filterTreeNodes(tree.value, query);  // 프로젝트 노드 필터링 고려 안 됨
});
```

**다중 프로젝트 모드에서 예상 동작**:
- "TSK-03"으로 검색 → 모든 프로젝트의 TSK-03-XX 노드 표시
- "jjiban"으로 검색 → 해당 프로젝트만 표시
- 검색 결과 없는 프로젝트는 숨김 처리

**권고사항**:
```typescript
// wbs.ts 수정
const filteredTree = computed(() => {
  if (!searchQuery.value.trim()) return tree.value;

  const query = searchQuery.value.toLowerCase().trim();

  // 다중 프로젝트 모드: 프로젝트별 필터링 후 빈 프로젝트 제거
  if (isMultiProjectMode.value) {
    return tree.value
      .map(projectNode => {
        if (projectNode.type !== 'project') return projectNode;

        // 프로젝트 이름 매칭
        if (projectNode.title.toLowerCase().includes(query)) {
          return projectNode;  // 전체 프로젝트 표시
        }

        // 자식 노드 필터링
        const filteredChildren = filterTreeNodes(projectNode.children || [], query);
        if (filteredChildren.length > 0) {
          return { ...projectNode, children: filteredChildren };
        }

        return null;  // 매칭 없음
      })
      .filter(node => node !== null) as WbsNode[];
  }

  // 단일 프로젝트 모드: 기존 로직
  return filterTreeNodes(tree.value, query);
});
```

---

### M-05: 에러 경계 누락

**심각도**: Medium
**위치**: 020-detail-design.md 섹션 4.2, 4.3

**문제점**:
ProjectDetailPanel, FileViewer 컴포넌트에 에러 경계 처리 없음

**권고사항**:
```vue
<!-- ProjectDetailPanel.vue -->
<template>
  <div v-if="error" class="error-state">
    <Message severity="error">
      {{ error.message }}
    </Message>
    <Button label="다시 시도" @click="handleRetry" />
  </div>
  <div v-else-if="loading" class="loading-state">
    <Skeleton ... />
  </div>
  <div v-else>
    <!-- 정상 컨텐츠 -->
  </div>
</template>

<script setup>
const error = ref<Error | null>(null);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    // 데이터 로드
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Unknown error');
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## 5. Low 지적사항 (선택적 개선)

### L-01: CSS 클래스 네이밍 일관성

**심각도**: Low
**위치**: 011-ui-design.md 섹션 6.1

**문제점**:
```css
/* 혼재된 네이밍 패턴 */
.node-icon-project { }          /* kebab-case */
.wbs-tree-node-title-project { } /* kebab-case + 접두사 */
.project-file-list { }          /* kebab-case */
.file-icon-md { }              /* kebab-case + 축약 */
```

**권고사항**:
BEM 방식 또는 접두사 통일
```css
/* Option 1: BEM 방식 */
.node-icon--project { }
.node-icon--wp { }

/* Option 2: 도메인 접두사 통일 */
.wbs-node-icon-project { }
.wbs-node-title-project { }
.wbs-file-list { }
.wbs-file-icon-md { }
```

---

### L-02: 프로젝트 노드 기본 확장 상태 일관성

**심각도**: Low
**위치**: 020-detail-design.md 섹션 3.1.2, 011-ui-design.md 섹션 2.3

**문제점**:
설계서 간 불일치
- 011-ui-design.md: "프로젝트 노드는 기본 펼침"
- 020-detail-design.md: "프로젝트 노드만 기본 확장"

**권고사항**:
명확한 UX 정책 수립
```typescript
// fetchAllWbs() 내부
response.projects.forEach(project => {
  expandedNodes.value.add(project.id);  // 프로젝트 펼침

  // 옵션: 첫 번째 WP도 펼침 (깊이 1단계까지)
  if (project.children?.[0]) {
    expandedNodes.value.add(project.children[0].id);
  }
});
```

---

### L-03: 접근성 개선 여지

**심각도**: Low
**위치**: 020-detail-design.md 섹션 9.2

**문제점**:
ARIA 속성이 정적 문자열로 하드코딩됨
```vue
<div :aria-label="`프로젝트: ${node.title}`">
  <!-- 한국어만 지원, 다국어 미고려 -->
</div>
```

**권고사항**:
다국어 지원 준비 (i18n)
```vue
<div :aria-label="$t('wbs.aria.project', { name: node.title })">
  <!-- $t()는 향후 vue-i18n 도입 시 -->
</div>
```

---

### L-04: 파일 목록 정렬 옵션 부재

**심각도**: Low
**위치**: 020-detail-design.md 섹션 1.2.4

**현재 설계**:
```typescript
// 파일명 정렬만 지원
return files.sort((a, b) => a.name.localeCompare(b.name));
```

**개선 제안**:
사용자 선택 가능한 정렬
```typescript
export type FileSortOption = 'name' | 'size' | 'updatedAt' | 'type';

function sortFiles(files: ProjectFile[], sortBy: FileSortOption): ProjectFile[] {
  const comparators = {
    name: (a, b) => a.name.localeCompare(b.name),
    size: (a, b) => b.size - a.size,  // 큰 파일 우선
    updatedAt: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    type: (a, b) => a.type.localeCompare(b.type)
  };
  return [...files].sort(comparators[sortBy]);
}
```

---

### L-05: 테스트 커버리지 목표 미명시

**심각도**: Low
**위치**: 020-detail-design.md 섹션 11

**권고사항**:
```markdown
### 11.4 테스트 커버리지 목표

| 계층 | 목표 커버리지 | 측정 방법 |
|------|-------------|----------|
| 유틸리티 함수 | 90% | Vitest |
| API 엔드포인트 | 80% | Supertest |
| 컴포넌트 | 70% | @vue/test-utils |
| E2E 시나리오 | 주요 플로우 100% | Playwright |
```

---

## 6. 개선 권고사항 요약

### 6.1 우선순위별 조치 사항

| 우선순위 | 조치 항목 | 예상 공수 | 담당 |
|---------|----------|---------|------|
| P0 (구현 전 필수) | C-01: WbsNodeType 확장 | 0.5일 | Backend |
| P0 | C-02: 타입 계층 재설계 | 1일 | Backend |
| P0 | H-01: 파일 컨텐츠 API 추가 | 1일 | Backend |
| P1 (구현 중 반영) | H-02: 경로 보안 강화 | 0.5일 | Backend |
| P1 | H-03: 캐싱 전략 구현 | 1일 | Frontend |
| P1 | H-04: 진행률 계산 최적화 | 0.5일 | Backend |
| P1 | H-05: 이미지 뷰어 수정 | 1일 | Frontend |
| P2 (릴리스 전) | M-01 ~ M-05 | 2일 | 팀 |
| P3 (추후 개선) | L-01 ~ L-05 | 1일 | 팀 |

**총 예상 공수**: 8.5일

---

### 6.2 기존 코드와의 통합 체크리스트

#### 6.2.1 wbsService.ts 연동
- [ ] `getAllProjectsWbs()` 함수가 기존 `getWbsTree()` 재사용 확인
- [ ] 파서/시리얼라이저에 프로젝트 노드 타입 추가 불필요 (래퍼만 추가)
- [ ] `parseMetadata()` 함수 재사용 가능성 검토

#### 6.2.2 wbs.ts 스토어 연동
- [ ] `fetchAllWbs()`와 `fetchWbs()` 공존 시 상태 충돌 없음 확인
- [ ] `flattenTree()` 함수가 프로젝트 노드 처리 가능한지 검증
- [ ] `filteredTree` computed가 다중 프로젝트 모드 지원 확인

#### 6.2.3 selection.ts 스토어 연동
- [ ] `selectNode()` 함수에 프로젝트 타입 분기 추가
- [ ] `selectedNodeType` getter에 'project' 케이스 추가
- [ ] 프로젝트 선택 시 Task 선택 해제 로직 확인

#### 6.2.4 CSS 스타일 통합
- [ ] `main.css`에 `.node-icon-project` 클래스 추가
- [ ] Dark 모드 지원 확인 (`dark:text-violet-400`)
- [ ] 기존 `.node-icon-*` 클래스와 일관성 유지

---

## 7. 보안 체크리스트

- [x] Path Traversal 방어 (H-02 권고사항 반영 필요)
- [x] 파일 접근 권한 제한 (.jjiban 폴더만)
- [ ] 파일 크기 제한 미구현 (10MB 권장)
- [ ] XSS 방어 (마크다운 sanitization)
- [ ] CSRF 토큰 (Nuxt 기본 제공)
- [ ] Rate Limiting (미구현, 추후 고려)

---

## 8. 성능 체크리스트

- [x] API 병렬 호출 (Promise.all)
- [ ] 캐싱 전략 개선 필요 (H-03)
- [ ] 진행률 계산 최적화 필요 (H-04)
- [ ] 가상 스크롤 (파일 목록 100개+ 시)
- [x] 백업 파일 비동기 삭제

---

## 9. 추가 제안 사항

### 9.1 프로젝트 노드 컨텍스트 메뉴

**제안 배경**: 프로젝트 노드를 우클릭 시 유용한 액션 제공

**기능**:
- "새 창에서 열기" (`/wbs?project=xxx`)
- "프로젝트 설정"
- "Gantt 차트 보기"
- "Export WBS"

**구현 복잡도**: Low (PrimeVue ContextMenu 활용)

---

### 9.2 프로젝트 간 Task 이동 기능

**제안 배경**: 다중 프로젝트 뷰에서 Task를 드래그하여 다른 프로젝트로 이동

**기능**:
- Task 노드를 다른 프로젝트의 WP로 드래그
- wbs.md 파일 양쪽 수정
- 문서 폴더도 함께 이동

**구현 복잡도**: High (트랜잭션 처리 필요)

---

### 9.3 프로젝트 필터링 UI

**제안 배경**: 프로젝트가 많을 경우 특정 프로젝트만 표시

**기능**:
- 헤더에 프로젝트 필터 드롭다운
- 다중 선택 가능 (Checkbox)
- 상태별 필터 (active, archived, completed)

**구현 복잡도**: Medium

---

## 10. 최종 의견

### 10.1 긍정적 측면

1. **아키텍처 설계 우수**
   - 기존 코드와의 호환성 고려 (단일/다중 프로젝트 모드 분리)
   - API 설계가 RESTful 원칙 준수
   - 에러 처리 전략 명확함

2. **사용자 경험 고려**
   - 파일 타입별 뷰어 제공 (마크다운, 이미지, 코드)
   - 로딩/에러 상태 처리 명시
   - 접근성 (ARIA) 고려

3. **성능 최적화 시도**
   - 병렬 API 호출 (Promise.all)
   - 캐싱 전략 제시
   - 가상 스크롤 언급

### 10.2 개선 필요 측면

1. **타입 시스템 보완 필요**
   - WbsNodeType에 'project' 추가 필수
   - 타입 가드 함수 누락
   - 타입 계층 구조 재설계 필요

2. **보안 강화 필요**
   - 파일 경로 검증 강화 (Path Traversal)
   - XSS 방어 (마크다운 sanitization)
   - 파일 크기 제한

3. **API 설계 완성도**
   - 파일 컨텐츠 조회 API 누락
   - 응답 형식 표준화 불일치
   - 에러 코드 체계 정립

### 10.3 승인 조건

다음 항목 수정 후 재검토:
1. **C-01**: WbsNodeType 확장 (types/index.ts)
2. **C-02**: 타입 계층 재설계 (ProjectWbsNode 인터페이스)
3. **H-01**: 파일 컨텐츠 API 설계 추가 (GET /api/files/content)
4. **H-02**: 파일 경로 보안 검증 강화 (validateFilePath 함수)

**예상 수정 시간**: 2~3일

---

## 11. 리뷰 서명

- **리뷰어**: Claude (Sonnet 4.5)
- **리뷰 날짜**: 2025-12-17
- **다음 리뷰 일정**: 수정 완료 후 재검토
- **승인 여부**: **조건부 승인 (Approved with Conditions)**

---

## 부록 A: 참조 문서

- PRD 섹션 6.5: 다중 프로젝트 통합 뷰
- TSK-04-01: WBS 서비스 및 파서
- TSK-03-02: 프로젝트 관리 API
- CLAUDE.md: CSS 클래스 중앙화 원칙

---

## 부록 B: 용어 정의

- **다중 프로젝트 모드**: `/wbs` URL로 모든 프로젝트를 한 트리에 표시하는 모드
- **단일 프로젝트 모드**: `/wbs?project=xxx` URL로 특정 프로젝트만 표시하는 모드
- **ProjectWbsNode**: 프로젝트 수준의 WBS 노드 (type: 'project')
- **Path Traversal**: `../`를 이용한 상위 디렉토리 접근 공격

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-17 | 1.0 | 초안 작성 | Claude (Sonnet 4.5) |
