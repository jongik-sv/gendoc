# 기술 설계: Pinia 상태 관리 설정

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-03 |
| Category | infrastructure |
| 상태 | [ds] 설계 |
| 상위 Activity | ACT-01-01: Project Setup |
| 상위 Work Package | WP-01: Platform Infrastructure |
| PRD 참조 | PRD 9.3 |
| 작성일 | 2025-12-13 |

---

## 1. 목적

Nuxt 3 프로젝트에 Pinia 상태 관리 라이브러리를 설치하고 설정하여, 애플리케이션 전역에서 일관된 상태 관리를 가능하게 합니다.

### 1.1 비즈니스 목적

- WBS 트리 데이터의 중앙 집중식 관리
- 컴포넌트 간 선택 상태 공유
- 프로젝트 정보의 전역 접근성 확보
- 설정 데이터의 캐싱 및 관리

### 1.2 구현 범위

> WBS Task 설명에서 추출

- Pinia 설치 및 설정
- 기본 스토어 구조 생성 (project, wbs, selection, settings)

---

## 2. 현재 상태

### 2.1 현재 구조

Nuxt 3 프로젝트가 초기화된 상태이며, 상태 관리 라이브러리가 설치되지 않은 상태입니다.

```
app/
├── app.vue              # 기본 App 컴포넌트
├── nuxt.config.ts       # Nuxt 설정
└── (stores 미존재)
```

### 2.2 문제점

- 컴포넌트 간 상태 공유 불가
- 전역 데이터 접근 방법 없음
- API 응답 데이터 캐싱 불가

---

## 3. 목표 상태

### 3.1 목표 구조

```
app/
├── stores/
│   ├── project.ts       # 현재 프로젝트 정보
│   ├── wbs.ts           # WBS 트리 데이터
│   ├── selection.ts     # 선택된 노드
│   └── settings.ts      # 전역 설정
├── nuxt.config.ts       # Pinia 모듈 등록
└── ...
```

### 3.2 개선 효과

- 중앙 집중식 상태 관리로 데이터 일관성 보장
- 컴포넌트 간 느슨한 결합 (loosely coupled)
- DevTools를 통한 상태 디버깅 용이
- SSR 호환 (Nuxt 3 통합)

---

## 4. 기술 설계

### 4.1 패키지 설치

```bash
npm install @pinia/nuxt
```

> Nuxt 3에서는 `@pinia/nuxt` 모듈을 사용하면 `pinia`가 자동으로 포함됩니다.

### 4.2 Nuxt 설정

**nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],
  pinia: {
    autoImports: [
      'defineStore',
      'acceptHMRUpdate',
      'storeToRefs'
    ]
  }
})
```

### 4.3 스토어 구조

#### 4.3.1 project.ts - 프로젝트 스토어

```typescript
// stores/project.ts
export const useProjectStore = defineStore('project', () => {
  // State
  const currentProject = ref<Project | null>(null)
  const projects = ref<ProjectSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const projectId = computed(() => currentProject.value?.id)
  const projectName = computed(() => currentProject.value?.name)

  // Actions
  async function fetchProjects() { ... }
  async function loadProject(id: string) { ... }
  async function createProject(data: CreateProjectInput) { ... }

  return {
    currentProject,
    projects,
    loading,
    error,
    projectId,
    projectName,
    fetchProjects,
    loadProject,
    createProject
  }
})
```

#### 4.3.2 wbs.ts - WBS 스토어

```typescript
// stores/wbs.ts
export const useWbsStore = defineStore('wbs', () => {
  // State
  const tree = ref<WbsNode[]>([])
  const flatNodes = ref<Map<string, WbsNode>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const expandedNodes = ref<Set<string>>(new Set())

  // Getters
  const wpCount = computed(() => /* WP 노드 개수 */)
  const actCount = computed(() => /* ACT 노드 개수 */)
  const tskCount = computed(() => /* TSK 노드 개수 */)
  const overallProgress = computed(() => /* 전체 진행률 */)

  // Actions
  async function fetchWbs(projectId: string) { ... }
  async function saveWbs(projectId: string) { ... }
  function getNode(id: string): WbsNode | undefined { ... }
  function toggleExpand(id: string) { ... }
  function expandAll() { ... }
  function collapseAll() { ... }

  return {
    tree,
    flatNodes,
    loading,
    error,
    expandedNodes,
    wpCount,
    actCount,
    tskCount,
    overallProgress,
    fetchWbs,
    saveWbs,
    getNode,
    toggleExpand,
    expandAll,
    collapseAll
  }
})
```

#### 4.3.3 selection.ts - 선택 스토어

```typescript
// stores/selection.ts
export const useSelectionStore = defineStore('selection', () => {
  // State
  const selectedNodeId = ref<string | null>(null)
  const selectedTask = ref<TaskDetail | null>(null)
  const loadingTask = ref(false)

  // Getters
  const hasSelection = computed(() => selectedNodeId.value !== null)
  const selectedNodeType = computed(() => /* 노드 타입 추출 */)

  // Actions
  async function selectNode(nodeId: string) { ... }
  function clearSelection() { ... }

  return {
    selectedNodeId,
    selectedTask,
    loadingTask,
    hasSelection,
    selectedNodeType,
    selectNode,
    clearSelection
  }
})
```

#### 4.3.4 settings.ts - 설정 스토어

```typescript
// stores/settings.ts
export const useSettingsStore = defineStore('settings', () => {
  // State
  const columns = ref<ColumnDef[]>([])
  const categories = ref<CategoryDef[]>([])
  const workflows = ref<WorkflowDef[]>([])
  const actions = ref<ActionDef[]>([])
  const loaded = ref(false)

  // Getters
  const getColumnByStatus = computed(() => /* 상태별 컬럼 매핑 */)
  const getCategoryByCode = computed(() => /* 코드별 카테고리 */)

  // Actions
  async function loadSettings() { ... }
  function getAvailableTransitions(category: string, status: string) { ... }

  return {
    columns,
    categories,
    workflows,
    actions,
    loaded,
    getColumnByStatus,
    getCategoryByCode,
    loadSettings,
    getAvailableTransitions
  }
})
```

### 4.4 타입 정의

**types/store.ts**

```typescript
// 프로젝트 관련 타입
export interface Project {
  id: string
  name: string
  description?: string
  version: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
  scheduledStart?: string
  scheduledEnd?: string
}

export interface ProjectSummary {
  id: string
  name: string
  status: string
}

// WBS 관련 타입
export interface WbsNode {
  id: string
  type: 'project' | 'wp' | 'act' | 'task'
  title: string
  status?: string
  category?: string
  progress: number
  taskCount: number
  children: WbsNode[]
  expanded?: boolean
}

// Task 상세 타입
export interface TaskDetail {
  id: string
  title: string
  category: string
  status: string
  priority: string
  assignee?: TeamMember
  parentWp: string
  requirements: string[]
  ref?: string
  documents: DocumentInfo[]
  history: HistoryEntry[]
  availableActions: string[]
}

// 설정 관련 타입
export interface ColumnDef {
  id: string
  name: string
  statuses: string[]
  color: string
}

export interface CategoryDef {
  id: string
  name: string
  code: string
  workflow: string
}

export interface WorkflowDef {
  id: string
  category: string
  transitions: TransitionDef[]
}

export interface ActionDef {
  command: string
  status: string[]
  description: string
  output?: string
}
```

---

## 5. 구현 계획

### 5.1 변경 사항

| 파일/모듈 | 변경 내용 |
|----------|----------|
| `package.json` | `@pinia/nuxt` 의존성 추가 |
| `nuxt.config.ts` | Pinia 모듈 등록 및 autoImports 설정 |
| `app/stores/project.ts` | 프로젝트 스토어 생성 |
| `app/stores/wbs.ts` | WBS 스토어 생성 |
| `app/stores/selection.ts` | 선택 스토어 생성 |
| `app/stores/settings.ts` | 설정 스토어 생성 |
| `app/types/store.ts` | 스토어 관련 타입 정의 |

### 5.2 구현 순서

1. `@pinia/nuxt` 패키지 설치
2. `nuxt.config.ts`에 모듈 등록
3. `types/store.ts` 타입 정의 파일 생성
4. 기본 스토어 파일 생성 (빈 구조)
   - `stores/project.ts`
   - `stores/wbs.ts`
   - `stores/selection.ts`
   - `stores/settings.ts`
5. 동작 확인 (DevTools)

---

## 6. 테스트 계획

### 6.1 단위 테스트

| 테스트 항목 | 검증 내용 |
|------------|----------|
| Pinia 설치 확인 | `@pinia/nuxt` 모듈 로드 |
| 스토어 생성 | 각 스토어가 정상 생성되는지 확인 |
| 타입 정합성 | TypeScript 타입 에러 없음 |

### 6.2 통합 테스트

| 테스트 항목 | 검증 내용 |
|------------|----------|
| SSR 호환성 | 서버/클라이언트 하이드레이션 정상 |
| DevTools | Vue DevTools에서 스토어 확인 가능 |

---

## 7. 의존성

### 7.1 선행 Task

| Task ID | 제목 | 필요 이유 |
|---------|------|----------|
| TSK-01-01-01 | Nuxt 3 프로젝트 초기화 | Nuxt 프로젝트 필요 |

### 7.2 후속 Task

| Task ID | 제목 | 영향 |
|---------|------|------|
| TSK-04-03-02 | 노드 선택 및 상세 패널 연동 | selection 스토어 사용 |
| TSK-08-01-02 | 상태 관리 통합 (Pinia) | 모든 스토어 통합 |

---

## 8. 수용 기준

- [ ] `@pinia/nuxt` 패키지가 설치됨
- [ ] `nuxt.config.ts`에 Pinia 모듈이 등록됨
- [ ] 4개의 기본 스토어 파일이 생성됨 (project, wbs, selection, settings)
- [ ] 스토어 관련 타입이 정의됨
- [ ] TypeScript 컴파일 에러 없음
- [ ] 개발 서버 실행 시 에러 없음

---

## 9. 다음 단계

- `/wf:skip` 명령어로 구현 단계 진행 (설계 단계 생략 가능)
- 또는 `/wf:build` 명령어로 구현 시작

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 9.3)
- 선행 Task: TSK-01-01-01 (Nuxt 3 프로젝트 초기화)
