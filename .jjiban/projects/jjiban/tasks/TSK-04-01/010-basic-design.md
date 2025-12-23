# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2, 6.2.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-01 |
| 의존 Task | TSK-01-02-01 (AppLayout) | 레이아웃 구조 |
| 의존 Task | TSK-03-02 (WBS API) | 데이터 API |

---

## 1. 목적 및 범위

### 1.1 목적

WBS 트리 뷰의 좌측 패널을 구성하는 컴포넌트 시스템을 설계합니다. 사용자가 프로젝트의 WBS 계층 구조를 시각적으로 탐색하고, 검색 및 필터링을 통해 원하는 Task를 빠르게 찾을 수 있는 인터페이스를 제공합니다.

**해결하는 문제**:
- WBS 데이터를 계층적으로 시각화하여 프로젝트 구조를 직관적으로 파악
- 많은 Task 중에서 특정 Task를 빠르게 검색/필터링
- 프로젝트 전체 현황(WP/ACT/TSK 수, 진행률)을 요약 표시
- 트리 전체 펼침/접기를 통한 뷰 컨트롤

**제공하는 가치**:
- 효율적인 프로젝트 네비게이션
- 프로젝트 현황 한눈에 파악
- 사용자 친화적인 검색 및 필터링
- 일관된 UI/UX (PrimeVue 기반)

### 1.2 범위

**포함 범위**:
- WbsTreePanel: 컨테이너 컴포넌트 (데이터 로드, 상태 관리 조정)
- WbsTreeHeader: 헤더 컴포넌트 (타이틀, 검색, 펼침/접기, 요약)
- WbsSummaryCards: 통계 카드 컴포넌트 (WP/ACT/TSK 카운트, 진행률)
- WbsSearchBox: 검색 박스 컴포넌트 (실시간 검색, debounce, 하이라이트)
- Pinia 스토어 연동 (wbs.ts)
- WBS API 통합 (GET /api/projects/:id/wbs)

**제외 범위**:
- WbsTreeNode 컴포넌트 → TSK-04-02
- 트리 노드 인터랙션 (선택, 펼침/접기) → TSK-04-03
- Task 상세 패널 → WP-05
- 실제 검색 필터링 로직 (TODO로 표시됨) → 상세설계에서 구현

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WBS 데이터를 API에서 로드하여 표시 | Critical | 섹션 6.2 |
| FR-002 | WBS 트리 헤더 표시 (아이콘 + 제목) | High | 섹션 6.2.1 |
| FR-003 | 검색 박스를 통한 Task ID/제목 필터링 | High | 섹션 6.2.1 |
| FR-004 | 전체 트리 펼치기/접기 버튼 제공 | Medium | 섹션 6.2.1 |
| FR-005 | WP/ACT/TSK 카운트 및 진행률 요약 카드 표시 | High | 섹션 6.2.1 |
| FR-006 | 검색어 입력 시 debounce 처리 (300ms) | Medium | 성능 최적화 |
| FR-007 | 로딩 상태 및 에러 핸들링 표시 | High | 사용자 경험 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 검색 응답 시간 | < 300ms (debounce) |
| NFR-002 | 컴포넌트 재사용성 | 독립적 컴포넌트 구조 |
| NFR-003 | 접근성 | ARIA 속성 적용, 키보드 네비게이션 |
| NFR-004 | 반응형 디자인 | 좌측 패널 너비 적응 |
| NFR-005 | 테스트 커버리지 | >= 80% (단위 테스트) |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌────────────────────────────────────────┐
│         WbsTreePanel (Container)       │
│  ┌──────────────────────────────────┐  │
│  │      WbsTreeHeader               │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │   WbsSearchBox             │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │   WbsSummaryCards          │  │  │
│  │  │   (WP | ACT | TSK | %)     │  │  │
│  │  └────────────────────────────┘  │  │
│  │  [Expand All] [Collapse All]    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │   WbsTreeNode (재귀 렌더링)      │  │ ← TSK-04-02
│  │   WbsTreeNode                    │  │
│  │     WbsTreeNode                  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
         ↕ (Pinia Store)
   ┌───────────────────────┐
   │   useWbsStore()       │
   │   - root              │
   │   - expandedNodes     │
   │   - searchQuery       │
   │   - loading/error     │
   └───────────────────────┘
```

**컨테이너-프레젠테이션 패턴**:
- **WbsTreePanel**: 컨테이너 (데이터 로드, 상태 관리)
- **WbsTreeHeader, WbsSummaryCards, WbsSearchBox**: 프레젠테이션 (UI 렌더링)

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| WbsTreePanel | 컨테이너 | - WBS 데이터 로드 조정<br>- 자식 컴포넌트 통합<br>- 에러 바운더리 |
| WbsTreeHeader | 헤더 UI | - 타이틀 표시<br>- 검색 박스 포함<br>- 요약 카드 포함<br>- 펼침/접기 버튼 |
| WbsSummaryCards | 통계 표시 | - WP/ACT/TSK 카운트 계산<br>- 전체 진행률 표시<br>- 카드 UI 렌더링 |
| WbsSearchBox | 검색 입력 | - 검색어 입력 처리<br>- Debounce 적용<br>- 스토어 업데이트 |

### 3.3 데이터 흐름

```
┌─────────────────┐
│  WbsTreePanel   │
│  (onMounted)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  useWbsStore()          │
│  .loadWbs(projectId)    │
└────────┬────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  /api/projects/:id/wbs        │
│  (GET Request)                │
└────────┬──────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  WbsNode 트리 데이터           │
│  { id, type, title, ...}       │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Pinia Store State              │
│  - root: WbsNode                │
│  - expandedNodes: Set<string>   │
│  - searchQuery: string          │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Reactive Components             │
│  - WbsTreeHeader                 │
│  - WbsSummaryCards (computed)    │
│  - WbsSearchBox                  │
│  - WbsTreeNode (TSK-04-02)       │
└──────────────────────────────────┘
```

**검색 흐름**:
```
User Input → WbsSearchBox (debounce 300ms) → useWbsStore().setSearchQuery()
          → filteredNodes getter → WbsTreeNode 필터링 (TSK-04-02)
```

---

## 4. 컴포넌트 상세 설계

### 4.1 WbsTreePanel (컨테이너)

**파일 경로**: `app/components/wbs/WbsTreePanel.vue`

**책임**:
- WBS 데이터 로드 조정
- 자식 컴포넌트 통합
- 로딩/에러 상태 관리
- 프로젝트 ID 전달

**Props**: 없음 (route query에서 projectId 추출)

**Emits**: 없음

**주요 로직**:
- `onMounted`: 프로젝트 ID를 route에서 가져와 `loadWbs()` 호출
- 로딩 상태: 스피너 표시
- 에러 상태: 에러 메시지 표시
- 성공 상태: WbsTreeHeader + WbsTreeNode 렌더링

**상태 관리**:
- `useWbsStore()` 사용
- `loading`, `error`, `root` 상태 구독

**템플릿 구조**:
```
<div class="wbs-tree-panel">
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <WbsTreeHeader />
    <WbsTreeNode v-if="root" :node="root" /> <!-- TSK-04-02 -->
  </div>
</div>
```

---

### 4.2 WbsTreeHeader (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsTreeHeader.vue`

**책임**:
- 트리 패널 헤더 UI 렌더링
- 검색 박스 통합
- 요약 카드 통합
- 펼침/접기 버튼 제공

**Props**: 없음 (스토어에서 직접 조회)

**Emits**: 없음 (스토어 액션 직접 호출)

**주요 요소**:
1. **타이틀 영역**: 📁 아이콘 + "WBS 트리" 텍스트
2. **검색 박스**: `<WbsSearchBox />` 컴포넌트 삽입
3. **요약 카드**: `<WbsSummaryCards />` 컴포넌트 삽입
4. **액션 버튼**:
   - "전체 펼치기" 버튼 → `wbsStore.expandAll()`
   - "전체 접기" 버튼 → `wbsStore.collapseAll()`

**템플릿 구조**:
```
<div class="wbs-tree-header p-4 border-b">
  <div class="flex items-center justify-between mb-4">
    <h2>📁 WBS 트리</h2>
    <div class="flex gap-2">
      <Button @click="expandAll">전체 펼치기</Button>
      <Button @click="collapseAll">전체 접기</Button>
    </div>
  </div>

  <WbsSearchBox class="mb-4" />
  <WbsSummaryCards />
</div>
```

**스타일링**:
- PrimeVue Button 컴포넌트 사용
- TailwindCSS 유틸리티 클래스
- Dark Blue 테마 적용

---

### 4.3 WbsSummaryCards (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSummaryCards.vue`

**책임**:
- WBS 통계 계산 및 표시
- 4개 카드 렌더링 (WP, ACT, TSK, Progress)
- 반응형 그리드 레이아웃

**Props**: 없음 (스토어에서 직접 조회)

**Emits**: 없음

**Computed 속성**:
```typescript
const wbsStore = useWbsStore()

const wpCount = computed(() => wbsStore.wpCount)
const actCount = computed(() => wbsStore.actCount)
const taskCount = computed(() => wbsStore.taskCount)
const totalProgress = computed(() => wbsStore.totalProgress)
```

**카드 데이터**:
| 카드 | 레이블 | 값 | 아이콘/색상 |
|------|--------|-----|------------|
| WP | Work Package | `wpCount` | 파란색 |
| ACT | Activity | `actCount` | 초록색 |
| TSK | Task | `taskCount` | 주황색 |
| 진행률 | Progress | `totalProgress%` | 보라색 |

**템플릿 구조**:
```
<div class="grid grid-cols-4 gap-3">
  <Card v-for="card in cards" :key="card.label">
    <div class="text-center">
      <div :class="card.colorClass" class="text-2xl font-bold">
        {{ card.value }}
      </div>
      <div class="text-sm text-text-secondary mt-1">
        {{ card.label }}
      </div>
    </div>
  </Card>
</div>
```

**스타일링**:
- PrimeVue Card 컴포넌트
- Grid 레이아웃 (4 컬럼)
- 색상 테마:
  - WP: `text-blue-500`
  - ACT: `text-green-500`
  - TSK: `text-orange-500`
  - Progress: `text-purple-500`

---

### 4.4 WbsSearchBox (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSearchBox.vue`

**책임**:
- 검색어 입력 UI 제공
- Debounce 처리 (300ms)
- 검색어를 Pinia 스토어에 전달
- 입력 초기화 기능

**Props**: 없음

**Emits**: 없음 (스토어 직접 업데이트)

**주요 로직**:
```typescript
const wbsStore = useWbsStore()
const searchQuery = ref('')

// Debounced 검색어 업데이트
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

// 검색어 초기화
const clearSearch = () => {
  searchQuery.value = ''
  wbsStore.setSearchQuery('')
}
```

**템플릿 구조**:
```
<div class="wbs-search-box relative">
  <IconField iconPosition="left">
    <InputIcon>
      <i class="pi pi-search" />
    </InputIcon>
    <InputText
      v-model="searchQuery"
      placeholder="Task ID 또는 제목으로 검색..."
      class="w-full"
    />
  </IconField>

  <Button
    v-if="searchQuery"
    icon="pi pi-times"
    text
    rounded
    @click="clearSearch"
    class="absolute right-2 top-1/2 -translate-y-1/2"
  />
</div>
```

**사용 라이브러리**:
- `@vueuse/core` → `useDebounceFn`
- PrimeVue InputText, IconField, InputIcon

**접근성**:
- `aria-label="Search WBS tree"`
- `role="searchbox"`
- 키보드 ESC로 검색어 초기화

---

## 5. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 상태 관리 | 1) Local State<br>2) Pinia Store | Pinia Store | - TSK-04-03에서 노드 인터랙션 시 필요<br>- 여러 컴포넌트 간 상태 공유<br>- 이미 구현된 `useWbsStore` 활용 |
| Debounce 구현 | 1) Custom 함수<br>2) VueUse | VueUse | - 검증된 라이브러리<br>- 유지보수 용이<br>- TypeScript 지원 |
| 검색 필터링 | 1) 클라이언트 사이드<br>2) 서버 사이드 | 클라이언트 | - WBS 데이터 크기가 작음 (< 1000 노드)<br>- 실시간 응답성<br>- 서버 부하 감소 |
| 컴포넌트 구조 | 1) 단일 컴포넌트<br>2) 컴포지션 | 컴포지션 | - 재사용성<br>- 테스트 용이성<br>- 유지보수성 |
| UI 라이브러리 | 1) 커스텀<br>2) PrimeVue | PrimeVue | - 프로젝트 표준<br>- 접근성 내장<br>- 일관된 디자인 |

---

## 6. 인터페이스 설계

### 6.1 Props/Emits 인터페이스

#### WbsTreePanel
```typescript
// Props: 없음 (route에서 projectId 추출)
// Emits: 없음
```

#### WbsTreeHeader
```typescript
// Props: 없음 (스토어 직접 접근)
// Emits: 없음 (스토어 액션 직접 호출)
```

#### WbsSummaryCards
```typescript
// Props: 없음 (스토어 직접 접근)
// Emits: 없음
```

#### WbsSearchBox
```typescript
// Props: 없음
// Emits: 없음 (스토어 직접 업데이트)
```

### 6.2 Pinia Store 인터페이스

```typescript
// stores/wbs.ts (기존 구현 활용)

interface WbsStore {
  // State
  root: WbsNode | null
  expandedNodes: Set<string>
  loading: boolean
  error: string | null
  searchQuery: string

  // Getters
  wpCount: number
  actCount: number
  taskCount: number
  totalProgress: number
  isExpanded: (nodeId: string) => boolean
  filteredNodes: WbsNode | null  // TODO: 구현 필요

  // Actions
  loadWbs: (projectId: string) => Promise<void>
  toggleExpand: (nodeId: string) => void
  expandAll: () => void
  collapseAll: () => void
  setSearchQuery: (query: string) => void
  clearWbs: () => void
}
```

### 6.3 API 인터페이스

```typescript
// GET /api/projects/:id/wbs
type WbsApiResponse = {
  success: boolean
  data: WbsNode
}

interface WbsNode {
  id: string
  type: 'project' | 'wp' | 'act' | 'task'
  title: string
  status?: string
  category?: TaskCategory
  priority?: Priority
  progress?: number
  taskCount?: number
  children: WbsNode[]
}
```

---

## 7. 인수 기준

- [ ] AC-01: WbsTreePanel이 프로젝트 ID로 WBS 데이터를 성공적으로 로드
- [ ] AC-02: WbsTreeHeader가 타이틀, 검색, 요약, 버튼을 모두 표시
- [ ] AC-03: WbsSummaryCards가 WP/ACT/TSK 카운트를 정확히 계산하여 표시
- [ ] AC-04: WbsSearchBox 입력 시 300ms debounce 적용
- [ ] AC-05: 전체 펼치기 버튼 클릭 시 모든 노드 펼쳐짐
- [ ] AC-06: 전체 접기 버튼 클릭 시 모든 노드 접힘
- [ ] AC-07: 검색어 입력 시 스토어의 searchQuery 업데이트
- [ ] AC-08: 로딩 중 스피너 표시
- [ ] AC-09: API 에러 시 사용자 친화적 에러 메시지 표시
- [ ] AC-10: 모든 컴포넌트가 PrimeVue 테마 일관성 유지

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| WBS API 응답 지연 | Medium | - 로딩 상태 명확히 표시<br>- 타임아웃 설정<br>- 에러 핸들링 강화 |
| 대규모 WBS 데이터 성능 | Low | - 가상 스크롤 (향후 고려)<br>- 현재는 < 1000 노드로 제한 |
| 검색 필터링 미구현 | High | - 스토어에 TODO 표시<br>- 상세설계 단계에서 구현 |
| Debounce 타이밍 이슈 | Low | - VueUse 검증된 라이브러리 사용<br>- 300ms 기본값 유지 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-01-02-01 | 선행 | AppLayout 좌측 패널 슬롯 필요 |
| TSK-03-02 | 선행 | WBS API 엔드포인트 구현 필요 |
| TSK-04-02 | 후행 | WbsTreeNode 컴포넌트 렌더링 필요 |
| TSK-04-03 | 후행 | 트리 인터랙션 (선택, 펼침/접기) |
| stores/wbs.ts | 기존 구현 | 이미 구현된 Pinia 스토어 활용 |

---

## 9. 다음 단계

### 9.1 상세설계 단계 (/wf:draft)
- 검색 필터링 로직 상세 구현 방안
- 컴포넌트별 스타일 가이드
- 접근성 속성 세부 정의
- 단위 테스트 시나리오 작성

### 9.2 구현 단계 (/wf:build)
- 4개 컴포넌트 Vue 파일 작성
- Pinia 스토어 `filteredNodes` getter 구현
- PrimeVue 컴포넌트 통합
- TailwindCSS 스타일링

### 9.3 검증 단계 (/wf:verify)
- 단위 테스트 작성 및 실행
- E2E 테스트 (검색, 펼침/접기)
- 접근성 검증 (ARIA, 키보드)
- 성능 테스트 (검색 응답 시간)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2, 6.2.1)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-01)
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-01-02-01: `.jjiban/projects/jjiban/tasks/TSK-01-02-01/010-basic-design.md`
  - TSK-03-02: `.jjiban/projects/jjiban/tasks/TSK-03-02/010-basic-design.md`
- Pinia 스토어: `stores/wbs.ts`
- 타입 정의: `types/index.ts`

---

<!--
author: Claude (Requirements Analyst)
Template Version: 1.0.0
Created: 2025-12-15
-->
