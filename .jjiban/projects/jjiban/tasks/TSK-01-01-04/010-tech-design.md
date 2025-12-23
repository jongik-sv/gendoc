# 기술 설계: 프로젝트 디렉토리 구조 설정

## Task 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-04 |
| Category | infrastructure |
| 상태 | [ds] 설계 |
| 상위 Activity | ACT-01-01 (Project Setup) |
| 상위 Work Package | WP-01 (Platform Infrastructure) |
| PRD 참조 | PRD 9 |
| 작성일 | 2025-12-13 |

---

## 1. 목적

Nuxt 3 프로젝트의 표준 디렉토리 구조를 설정하여 일관된 코드 구성 및 유지보수성을 확보합니다.

### 1.1 구현 범위
> WBS Task 설명에서 추출

- `components/`, `composables/`, `stores/`, `server/api/` 디렉토리 구조 생성
- 공통 타입 정의 (`types/`) 디렉토리 및 기본 타입 파일
- 유틸리티 함수 디렉토리 (`utils/`) 및 기본 유틸리티 파일

### 1.2 제외 범위

- `.jjiban/` 폴더 구조 → TSK-02-01-01
- 실제 컴포넌트 구현 → WP-04, WP-05
- API 엔드포인트 구현 → WP-03

---

## 2. 현재 상태

### 2.1 현재 구조

```
jjiban/
├── .jjiban/             # 데이터 폴더 (별도 관리)
├── app/
│   └── (기본 Nuxt 구조)
├── nuxt.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 2.2 문제점

- 컴포넌트, 유틸리티, 타입 정의 디렉토리가 없음
- Nuxt 3 표준 디렉토리 구조 미적용
- 공통 타입 정의 부재로 타입 안전성 저하

---

## 3. 목표 상태

### 3.1 목표 구조

```
jjiban/
├── .jjiban/                    # 데이터 폴더 (기존)
├── app/
│   ├── components/             # Vue 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   ├── wbs/                # WBS 관련 컴포넌트
│   │   ├── detail/             # 상세 패널 컴포넌트
│   │   └── common/             # 공통 컴포넌트
│   ├── composables/            # Vue Composables
│   ├── pages/                  # 페이지 컴포넌트
│   ├── layouts/                # 레이아웃 템플릿
│   └── assets/                 # 정적 에셋
├── server/
│   ├── api/                    # API 엔드포인트
│   │   ├── projects/           # 프로젝트 API
│   │   ├── tasks/              # Task API
│   │   └── settings/           # 설정 API
│   └── utils/                  # 서버 유틸리티
├── stores/                     # Pinia 스토어
├── types/                      # TypeScript 타입 정의
├── utils/                      # 클라이언트 유틸리티
├── nuxt.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 3.2 개선 효과

- **코드 구조화**: 기능별 디렉토리 분리로 유지보수성 향상
- **타입 안전성**: 공통 타입 정의로 TypeScript 활용 극대화
- **확장성**: 향후 기능 추가 시 일관된 구조 유지

---

## 4. 구현 계획

### 4.1 디렉토리 생성

| 경로 | 용도 |
|------|------|
| `app/components/layout/` | AppHeader, AppLayout 등 레이아웃 |
| `app/components/wbs/` | WbsTreePanel, WbsTreeNode 등 |
| `app/components/detail/` | TaskDetailPanel, TaskBasicInfo 등 |
| `app/components/common/` | StatusBadge, CategoryTag, ProgressBar 등 |
| `app/composables/` | useWbs, useSelection 등 Vue Composables |
| `app/pages/` | index.vue, wbs.vue |
| `app/layouts/` | default.vue |
| `server/api/projects/` | 프로젝트 CRUD API |
| `server/api/tasks/` | Task CRUD, 상태 전이 API |
| `server/api/settings/` | 설정 조회 API |
| `server/utils/` | 서버측 유틸리티 (파일 I/O 등) |
| `stores/` | Pinia 스토어 (project, wbs, selection, settings) |
| `types/` | TypeScript 인터페이스 및 타입 정의 |
| `utils/` | 클라이언트측 유틸리티 |

### 4.2 초기 파일 생성

#### types/index.ts - 공통 타입 정의
```typescript
// WBS 노드 타입
export type WbsNodeType = 'project' | 'wp' | 'act' | 'task';

// Task 카테고리
export type TaskCategory = 'development' | 'defect' | 'infrastructure';

// Task 상태 코드
export type TaskStatus = '[ ]' | '[bd]' | '[dd]' | '[an]' | '[ds]' | '[im]' | '[fx]' | '[vf]' | '[xx]';

// 우선순위
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// WBS 노드 인터페이스
export interface WbsNode {
  id: string;
  type: WbsNodeType;
  title: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: Priority;
  progress: number;
  taskCount: number;
  children: WbsNode[];
  expanded?: boolean;
}

// Task 상세 정보
export interface TaskDetail {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: Priority;
  assignee?: TeamMember;
  parentWp: string;
  parentAct?: string;
  schedule?: {
    start: string;
    end: string;
  };
  requirements: string[];
  tags: string[];
  depends?: string[];
  ref?: string;
  documents: DocumentInfo[];
  history: HistoryEntry[];
  availableActions: string[];
}

// 팀 멤버
export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

// 문서 정보
export interface DocumentInfo {
  name: string;
  path: string;
  exists: boolean;
  type: 'design' | 'implementation' | 'test' | 'manual';
}

// 이력 엔트리
export interface HistoryEntry {
  timestamp: string;
  action: string;
  from?: string;
  to?: string;
  user?: string;
}

// 프로젝트 정보
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  wbsDepth: 3 | 4;
  createdAt: string;
  updatedAt?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}
```

#### stores/project.ts - 프로젝트 스토어
```typescript
import { defineStore } from 'pinia';
import type { Project } from '~/types';

export const useProjectStore = defineStore('project', {
  state: () => ({
    current: null as Project | null,
    projects: [] as Project[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    currentProjectId: (state) => state.current?.id,
    hasProject: (state) => state.current !== null,
  },

  actions: {
    async loadProjects() {
      // TODO: API 연동
    },

    async selectProject(projectId: string) {
      // TODO: 프로젝트 선택 로직
    },
  },
});
```

#### stores/wbs.ts - WBS 스토어
```typescript
import { defineStore } from 'pinia';
import type { WbsNode } from '~/types';

export const useWbsStore = defineStore('wbs', {
  state: () => ({
    root: null as WbsNode | null,
    expandedNodes: new Set<string>(),
    loading: false,
    error: null as string | null,
  }),

  getters: {
    wpCount: (state) => {
      if (!state.root) return 0;
      return state.root.children.filter(n => n.type === 'wp').length;
    },

    taskCount: (state) => {
      // TODO: 전체 Task 수 계산
      return 0;
    },

    totalProgress: (state) => {
      return state.root?.progress ?? 0;
    },
  },

  actions: {
    async loadWbs(projectId: string) {
      // TODO: API 연동
    },

    toggleExpand(nodeId: string) {
      if (this.expandedNodes.has(nodeId)) {
        this.expandedNodes.delete(nodeId);
      } else {
        this.expandedNodes.add(nodeId);
      }
    },

    expandAll() {
      // TODO: 모든 노드 펼치기
    },

    collapseAll() {
      this.expandedNodes.clear();
    },
  },
});
```

#### stores/selection.ts - 선택 상태 스토어
```typescript
import { defineStore } from 'pinia';
import type { WbsNode, TaskDetail } from '~/types';

export const useSelectionStore = defineStore('selection', {
  state: () => ({
    selectedNode: null as WbsNode | null,
    selectedTaskDetail: null as TaskDetail | null,
    loading: false,
  }),

  getters: {
    hasSelection: (state) => state.selectedNode !== null,
    isTask: (state) => state.selectedNode?.type === 'task',
  },

  actions: {
    async selectNode(node: WbsNode) {
      this.selectedNode = node;

      if (node.type === 'task') {
        await this.loadTaskDetail(node.id);
      } else {
        this.selectedTaskDetail = null;
      }
    },

    async loadTaskDetail(taskId: string) {
      // TODO: API 연동
    },

    clearSelection() {
      this.selectedNode = null;
      this.selectedTaskDetail = null;
    },
  },
});
```

#### stores/settings.ts - 설정 스토어
```typescript
import { defineStore } from 'pinia';

export interface Column {
  id: string;
  name: string;
  statuses: string[];
}

export interface Category {
  id: string;
  name: string;
  code: string;
}

export interface WorkflowRule {
  category: string;
  from: string;
  to: string;
  command: string;
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    columns: [] as Column[],
    categories: [] as Category[],
    workflows: [] as WorkflowRule[],
    loaded: false,
  }),

  actions: {
    async loadSettings() {
      // TODO: API 연동
    },

    getAvailableTransitions(category: string, currentStatus: string): WorkflowRule[] {
      return this.workflows.filter(
        w => w.category === category && w.from === currentStatus
      );
    },
  },
});
```

#### utils/format.ts - 포맷 유틸리티
```typescript
/**
 * 날짜 포맷팅
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * 상대 시간 표시
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

/**
 * Task ID 파싱
 */
export function parseTaskId(taskId: string): {
  wp: string;
  act?: string;
  task: string;
  level: 3 | 4;
} | null {
  const match4 = taskId.match(/^TSK-(\d{2})-(\d{2})-(\d{2})$/);
  if (match4) {
    return {
      wp: `WP-${match4[1]}`,
      act: `ACT-${match4[1]}-${match4[2]}`,
      task: taskId,
      level: 4,
    };
  }

  const match3 = taskId.match(/^TSK-(\d{2})-(\d{2})$/);
  if (match3) {
    return {
      wp: `WP-${match3[1]}`,
      task: taskId,
      level: 3,
    };
  }

  return null;
}

/**
 * 상태 코드에서 상태명 추출
 */
export function getStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    '[ ]': 'Todo',
    '[bd]': '기본설계',
    '[dd]': '상세설계',
    '[an]': '분석',
    '[ds]': '설계',
    '[im]': '구현',
    '[fx]': '수정',
    '[vf]': '검증',
    '[xx]': '완료',
  };
  return statusMap[status] ?? status;
}
```

#### server/utils/file.ts - 서버 파일 유틸리티
```typescript
import { promises as fs } from 'fs';
import { join } from 'path';

const JJIBAN_ROOT = '.jjiban';

/**
 * JSON 파일 읽기
 */
export async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Failed to read JSON file: ${path}`, error);
    return null;
  }
}

/**
 * JSON 파일 쓰기
 */
export async function writeJsonFile<T>(path: string, data: T): Promise<boolean> {
  try {
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to write JSON file: ${path}`, error);
    return false;
  }
}

/**
 * Markdown 파일 읽기
 */
export async function readMarkdownFile(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    console.error(`Failed to read Markdown file: ${path}`, error);
    return null;
  }
}

/**
 * Markdown 파일 쓰기
 */
export async function writeMarkdownFile(path: string, content: string): Promise<boolean> {
  try {
    await fs.writeFile(path, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to write Markdown file: ${path}`, error);
    return false;
  }
}

/**
 * 파일 존재 확인
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 디렉토리 생성 (재귀)
 */
export async function ensureDir(path: string): Promise<boolean> {
  try {
    await fs.mkdir(path, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Failed to create directory: ${path}`, error);
    return false;
  }
}

/**
 * jjiban 프로젝트 경로 생성
 */
export function getProjectPath(projectId: string): string {
  return join(JJIBAN_ROOT, 'projects', projectId);
}

/**
 * Task 문서 폴더 경로
 */
export function getTaskFolderPath(projectId: string, taskId: string): string {
  return join(getProjectPath(projectId), 'tasks', taskId);
}
```

---

## 5. 다음 단계

- `/wf:skip TSK-01-01-04`: 설계 생략하고 구현 단계로 이동 (디렉토리 생성은 단순 작업)
- `/wf:build TSK-01-01-04`: 구현 단계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 9)
- 선행 Task: TSK-01-01-01 (Nuxt 3 프로젝트 초기화)
- 후행 Task: TSK-02-01-01 (.jjiban 디렉토리 구조 생성)
