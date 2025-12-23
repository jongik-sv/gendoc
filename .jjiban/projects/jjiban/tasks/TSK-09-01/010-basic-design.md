# TSK-09-01: 다중 프로젝트 WBS 통합 뷰

## 1. 개요

### 1.1 목적
- `/wbs` URL로 접속 시 모든 프로젝트를 한 트리에서 표시
- 프로젝트 노드 클릭 시 프로젝트 정보 및 파일 목록 표시
- 기존 `?project=xxx` 파라미터 동작 유지 (호환성)

### 1.2 범위
- 백엔드: 신규 API 2개 (`/api/wbs/all`, `/api/projects/:id/files`)
- 프론트엔드: WBS 스토어, 컴포넌트, 페이지 로직 확장
- UI: 프로젝트 노드 타입, 상세 패널, 파일 뷰어

### 1.3 PRD 참조
- PRD 섹션 6.5 다중 프로젝트 통합 뷰

---

## 2. 시스템 아키텍처

### 2.1 데이터 흐름

```
http://localhost:3000/wbs (파라미터 없음)
    ↓
wbs.vue: onMounted
    ↓
if (!projectId) wbsStore.fetchAllWbs()
    ↓
GET /api/wbs/all
    ↓
getAllProjectsWbs()
    ├─ scanProjects() → [jjiban, jjiban개선, ...]
    └─ Promise.all(projects.map(p => getWbsTree(p.id)))
    ↓
프로젝트별 WbsNode 생성 (type: 'project')
    ↓
{ projects: [{ id:'jjiban', type:'project', children:[WP...] }, ...] }
    ↓
wbsStore.tree = response.projects
    ↓
WbsTreePanel 렌더링 (프로젝트 → WP → ACT → TSK)
```

### 2.2 트리 구조

```
📁 jjiban (Project)
  └─ 📦 WP-01: Platform Infrastructure
       └─ 📋 ACT-01-01: Project Setup
            └─ ✅ TSK-01-01-01: ...
📁 jjiban개선 (Project)
  └─ 📦 WP-01: Platform Infrastructure
       └─ 📋 ACT-01-01: Project Setup
            └─ ⏳ TSK-01-01-01: ...
```

---

## 3. API 설계

### 3.1 GET /api/wbs/all

**목적**: 모든 프로젝트 WBS를 통합 조회

**응답 형식**:
```typescript
interface AllWbsResponse {
  projects: ProjectWbsNode[]
}

interface ProjectWbsNode extends WbsNode {
  type: 'project'
  projectMeta: {
    name: string
    status: string
    wbsDepth: number
    scheduledStart?: string
    scheduledEnd?: string
  }
  children: WbsNode[]  // WP 배열
}
```

**처리 로직**:
1. `scanProjects()` → 프로젝트 목록 조회
2. `Promise.all()` → 각 프로젝트 WBS 병렬 로드
3. 프로젝트 노드로 래핑하여 반환

### 3.2 GET /api/projects/:id/files

**목적**: 프로젝트 폴더 내 파일 목록 조회

**응답 형식**:
```typescript
interface ProjectFilesResponse {
  files: ProjectFile[]
}

interface ProjectFile {
  name: string
  path: string
  type: 'markdown' | 'image' | 'json' | 'other'
  size: number
  updatedAt: string
}
```

**파일 타입 분류**:
- markdown: `.md`
- image: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- json: `.json`
- other: 나머지

---

## 4. 컴포넌트 설계

### 4.1 NodeIcon.vue 확장

**추가 사항**:
- `type: 'project'` 아이콘 (`pi-folder`)
- CSS 클래스: `.node-icon-project`

### 4.2 ProjectDetailPanel.vue (신규)

**표시 정보**:
- 프로젝트 이름, 설명
- 예정 일정 (scheduledStart ~ scheduledEnd)
- WBS 깊이 (3단계/4단계)
- 전체 진행률
- 파일 목록 (클릭 시 뷰어)

### 4.3 FileViewer.vue (신규)

**파일 타입별 렌더링**:
| 타입 | 렌더링 방식 |
|------|------------|
| `.md` | 마크다운 렌더링 (기존 방식) |
| 이미지 | `<img>` 태그로 표시 |
| 기타 | Monaco Editor (읽기 전용) |

---

## 5. 스토어 확장

### 5.1 wbs.ts

**추가 메서드**:
```typescript
async function fetchAllWbs(): Promise<void> {
  loading.value = true
  try {
    const response = await $fetch<AllWbsResponse>('/api/wbs/all')
    tree.value = response.projects
    buildFlatNodes(response.projects)
  } finally {
    loading.value = false
  }
}
```

### 5.2 selection.ts

**확장 사항**:
- `selectedNodeType === 'project'` 처리
- 프로젝트 선택 시 파일 목록 로드

---

## 6. 페이지 로직

### 6.1 wbs.vue

**조건부 로딩**:
```typescript
onMounted(async () => {
  const projectId = route.query.project as string | undefined

  if (projectId) {
    // 기존: 단일 프로젝트 로드
    await loadProjectAndWbs(projectId)
  } else {
    // 신규: 모든 프로젝트 로드
    await wbsStore.fetchAllWbs()
  }
})
```

### 6.2 TaskDetailPanel 분기

```vue
<template>
  <ProjectDetailPanel v-if="selectedNodeType === 'project'" />
  <WpActPanel v-else-if="isWpOrActSelected" />
  <TaskDetailPanel v-else-if="isTaskSelected" />
</template>
```

---

## 7. 수정 파일 목록

| 파일 | 변경 내용 | 우선순위 |
|------|----------|---------|
| `server/api/wbs/all.get.ts` | 신규 - 모든 프로젝트 WBS 조회 | 1 |
| `server/utils/wbs/wbsService.ts` | `getAllProjectsWbs()` 추가 | 1 |
| `server/api/projects/[id]/files.get.ts` | 신규 - 프로젝트 파일 목록 | 1 |
| `types/index.ts` | `ProjectWbsNode`, `ProjectFile` 타입 | 1 |
| `app/stores/wbs.ts` | `fetchAllWbs()` 추가 | 2 |
| `app/components/wbs/NodeIcon.vue` | project 아이콘 추가 | 2 |
| `app/assets/css/main.css` | project 스타일 추가 | 2 |
| `app/pages/wbs.vue` | 조건부 로딩 로직 | 3 |
| `app/composables/useWbsPage.ts` | `loadAllProjects()` 추가 | 3 |
| `app/stores/selection.ts` | 프로젝트 노드 선택 처리 | 3 |
| `app/components/wbs/detail/ProjectDetailPanel.vue` | 신규 | 4 |
| `app/components/wbs/detail/FileViewer.vue` | 신규 | 4 |

---

## 8. 의존성

- TSK-04-01: WBS 서비스 및 파서
- TSK-03-02: 프로젝트 관리 API

---

## 9. 테스트 계획

### 9.1 API 테스트
- `GET /api/wbs/all` 응답 형식 검증
- `GET /api/projects/:id/files` 파일 목록 검증
- 한글 프로젝트 ID 인코딩 처리

### 9.2 UI 테스트
- 프로젝트 노드 아이콘/스타일 표시
- 프로젝트 클릭 시 상세 패널 표시
- 파일 클릭 시 타입별 뷰어 동작

### 9.3 호환성 테스트
- `?project=xxx` 파라미터 시 기존 동작 유지
- Task API project 쿼리 파라미터 연동
