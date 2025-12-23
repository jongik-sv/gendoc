# 구현 보고서: Pinia 상태 관리 설정

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-03 |
| Category | infrastructure |
| 상태 | [im] 구현 |
| 참조 설계서 | 010-tech-design.md |
| 구현 완료일 | 2025-12-13 |

---

## 1. 구현 개요

### 1.1 목적

Nuxt 3 프로젝트에 Pinia 상태 관리 라이브러리를 설치하고 설정하여, 애플리케이션 전역에서 일관된 상태 관리를 가능하게 합니다.

### 1.2 구현 범위

- `@pinia/nuxt` 패키지 설치
- Nuxt 설정에 Pinia 모듈 등록
- 스토어 관련 타입 정의
- 4개의 기본 스토어 구조 생성 (project, wbs, selection, settings)

### 1.3 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| @pinia/nuxt | ^0.7.x | Nuxt Pinia 통합 |
| pinia | ^2.x | 상태 관리 (자동 포함) |
| TypeScript | ^5.6 | 타입 안전성 |

---

## 2. 구현 결과

### 2.1 패키지 설치

```bash
npm install @pinia/nuxt
```

**설치 결과**: 7개 패키지 추가, 취약점 0개

### 2.2 Nuxt 설정 변경

**파일**: `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@pinia/nuxt'  // 추가됨
  ],

  // Pinia 설정
  pinia: {
    storesDirs: ['./stores/**']
  }
})
```

### 2.3 타입 정의

**파일**: `app/types/store.ts`

| 타입 | 설명 |
|------|------|
| `Project` | 프로젝트 전체 정보 |
| `ProjectSummary` | 프로젝트 목록 요약 |
| `WbsNode` | WBS 트리 노드 |
| `TaskDetail` | Task 상세 정보 |
| `ColumnDef` | 칸반 컬럼 정의 |
| `CategoryDef` | 카테고리 정의 |
| `WorkflowDef` | 워크플로우 규칙 |
| `ActionDef` | 상태 내 액션 |

### 2.4 스토어 구현

#### 2.4.1 project.ts - 프로젝트 스토어

**파일**: `app/stores/project.ts`

| 구분 | 항목 | 설명 |
|------|------|------|
| State | `currentProject` | 현재 프로젝트 정보 |
| State | `projects` | 프로젝트 목록 |
| State | `loading`, `error` | 로딩/에러 상태 |
| Getter | `projectId`, `projectName` | 프로젝트 ID/이름 |
| Action | `fetchProjects()` | 프로젝트 목록 조회 |
| Action | `loadProject(id)` | 특정 프로젝트 로드 |
| Action | `createProject(input)` | 프로젝트 생성 |

#### 2.4.2 wbs.ts - WBS 스토어

**파일**: `app/stores/wbs.ts`

| 구분 | 항목 | 설명 |
|------|------|------|
| State | `tree` | WBS 트리 구조 |
| State | `flatNodes` | ID → 노드 매핑 (Map) |
| State | `expandedNodes` | 확장된 노드 ID (Set) |
| Getter | `wpCount`, `actCount`, `tskCount` | 노드 타입별 개수 |
| Getter | `overallProgress` | 전체 진행률 |
| Action | `fetchWbs(projectId)` | WBS 데이터 조회 |
| Action | `saveWbs(projectId)` | WBS 데이터 저장 |
| Action | `toggleExpand(id)` | 노드 확장/축소 토글 |
| Action | `expandAll()`, `collapseAll()` | 전체 확장/축소 |

#### 2.4.3 selection.ts - 선택 스토어

**파일**: `app/stores/selection.ts`

| 구분 | 항목 | 설명 |
|------|------|------|
| State | `selectedNodeId` | 선택된 노드 ID |
| State | `selectedTask` | 선택된 Task 상세 정보 |
| State | `loadingTask` | Task 로딩 상태 |
| Getter | `hasSelection` | 선택 여부 |
| Getter | `selectedNodeType` | 선택된 노드 타입 |
| Getter | `isTaskSelected` | Task 선택 여부 |
| Action | `selectNode(nodeId)` | 노드 선택 |
| Action | `clearSelection()` | 선택 해제 |

#### 2.4.4 settings.ts - 설정 스토어

**파일**: `app/stores/settings.ts`

| 구분 | 항목 | 설명 |
|------|------|------|
| State | `columns` | 칸반 컬럼 정의 |
| State | `categories` | 카테고리 정의 |
| State | `workflows` | 워크플로우 규칙 |
| State | `actions` | 상태 내 액션 |
| Getter | `getColumnByStatus` | 상태별 컬럼 조회 |
| Getter | `getCategoryByCode` | 코드별 카테고리 조회 |
| Action | `loadSettings()` | 설정 로드 |
| Action | `getAvailableTransitions()` | 가능한 상태 전이 조회 |
| Action | `getAvailableActions()` | 가능한 액션 조회 |

---

## 3. 검증 결과

### 3.1 Nuxt Prepare

```bash
npx nuxt prepare
```

**결과**: ✅ Types generated in .nuxt

### 3.2 수용 기준 체크리스트

| # | 수용 기준 | 결과 |
|---|----------|------|
| 1 | `@pinia/nuxt` 패키지가 설치됨 | ✅ Pass |
| 2 | `nuxt.config.ts`에 Pinia 모듈이 등록됨 | ✅ Pass |
| 3 | 4개의 기본 스토어 파일이 생성됨 | ✅ Pass |
| 4 | 스토어 관련 타입이 정의됨 | ✅ Pass |
| 5 | TypeScript 컴파일 에러 없음 | ✅ Pass |
| 6 | Nuxt prepare 정상 완료 | ✅ Pass |

---

## 4. 생성된 파일

```
app/
├── types/
│   └── store.ts           # 스토어 관련 타입 정의
└── stores/
    ├── project.ts         # 프로젝트 스토어
    ├── wbs.ts             # WBS 스토어
    ├── selection.ts       # 선택 스토어
    └── settings.ts        # 설정 스토어

package.json               # @pinia/nuxt 의존성 추가
nuxt.config.ts             # Pinia 모듈 등록
```

---

## 5. 사용 예시

### 5.1 컴포넌트에서 스토어 사용

```vue
<script setup lang="ts">
// 프로젝트 스토어
const projectStore = useProjectStore()
const { currentProject, loading } = storeToRefs(projectStore)

// WBS 스토어
const wbsStore = useWbsStore()
const { tree, wpCount, tskCount } = storeToRefs(wbsStore)

// 선택 스토어
const selectionStore = useSelectionStore()
const { selectedTask, hasSelection } = storeToRefs(selectionStore)

// 설정 스토어
const settingsStore = useSettingsStore()
</script>
```

### 5.2 액션 호출

```typescript
// 프로젝트 로드
await projectStore.loadProject('jjiban')

// WBS 조회
await wbsStore.fetchWbs('jjiban')

// 노드 선택
await selectionStore.selectNode('TSK-01-01-01')

// 설정 로드
await settingsStore.loadSettings()
```

---

## 6. 향후 작업

| Task ID | 제목 | 관계 |
|---------|------|------|
| TSK-04-03-02 | 노드 선택 및 상세 패널 연동 | selection 스토어 사용 |
| TSK-08-01-02 | 상태 관리 통합 (Pinia) | 모든 스토어 통합 |

---

## 7. 참고 자료

- 설계서: `.jjiban/projects/jjiban/tasks/TSK-01-01-03/010-tech-design.md`
- Pinia 공식 문서: https://pinia.vuejs.org/
- @pinia/nuxt: https://pinia.vuejs.org/ssr/nuxt.html
