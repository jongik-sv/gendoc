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
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2.3, 11.2 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-03 |
| 의존 Task | TSK-04-02 (Tree Node) | 노드 컴포넌트 및 UI 구조 |
| 의존 Task | TSK-01-01-03 (Pinia 설정) | 상태 관리 스토어 |
| Pinia 스토어 | `stores/wbs.ts` | 펼침/접기 상태 관리 |
| Pinia 스토어 | `stores/selection.ts` | 노드 선택 상태 관리 |

---

## 1. 목적 및 범위

### 1.1 목적

WBS 트리 뷰의 사용자 인터랙션 시스템을 설계합니다. 사용자가 트리 노드를 탐색하고, 펼치거나 접고, 선택하여 상세 정보를 확인할 수 있는 직관적이고 접근 가능한 인터페이스를 제공합니다.

**해결하는 문제**:
- 대규모 WBS 트리에서 효율적인 탐색 및 뷰 관리
- 노드 선택을 통한 상세 패널 연동 및 컨텍스트 유지
- 키보드만으로도 완전한 트리 탐색 가능 (접근성)
- 세션 간 트리 상태 유지 (사용자 경험)

**제공하는 가치**:
- 효율적인 대규모 프로젝트 탐색 (펼침/접기 제어)
- 일관된 사용자 경험 (상태 영속성)
- 접근성 향상 (키보드 네비게이션)
- 반응형 인터페이스 (실시간 상태 업데이트)

### 1.2 범위

**포함 범위**:
- 트리 펼침/접기 상태 관리 (개별 토글, 전체 펼치기/접기)
- 로컬 스토리지 기반 상태 영속성 (프로젝트별 독립 저장)
- 노드 선택 및 상세 패널 연동 (Pinia selection 스토어)
- 키보드 네비게이션 시스템 (화살표 키, Enter, Space, Home, End)
- Composable 기반 인터랙션 로직 분리 (`useTreeInteraction`, `useKeyboardNav`, `useTreePersistence`)

**제외 범위**:
- WBS 데이터 로드 및 표시 → TSK-04-01, TSK-04-02
- 노드 편집 기능 → WP-05
- 검색 필터링 로직 → TSK-04-01 (향후 구현)
- 드래그 앤 드롭 → 향후 고려 사항

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | 개별 노드 펼침/접기 토글 (클릭, 더블클릭, Space) | Critical | 섹션 6.2.3 |
| FR-002 | 전체 트리 펼치기/접기 버튼 (헤더 액션) | High | 섹션 6.2.1 |
| FR-003 | 노드 선택 시 상세 패널 표시 (클릭, Enter) | Critical | 섹션 6.2.3 |
| FR-004 | 화살표 키로 트리 탐색 (Up/Down/Left/Right) | High | 섹션 11.2 |
| FR-005 | 키보드 단축키 지원 (Home, End, Esc) | Medium | 섹션 11.2 |
| FR-006 | 로컬 스토리지에 펼침/접기 상태 저장 | Medium | 사용자 경험 |
| FR-007 | 프로젝트별 독립적인 상태 관리 | High | 다중 프로젝트 지원 |
| FR-008 | 선택된 노드 시각적 피드백 (하이라이트, 스크롤) | High | 섹션 6.2.3 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 인터랙션 응답 시간 | < 100ms (즉시 피드백) |
| NFR-002 | 로컬 스토리지 크기 | < 1MB per 프로젝트 |
| NFR-003 | 접근성 표준 | WCAG 2.1 AA 레벨 |
| NFR-004 | 키보드 네비게이션 커버리지 | 100% (모든 기능 접근 가능) |
| NFR-005 | 상태 동기화 지연 | < 50ms (Pinia reactive) |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌────────────────────────────────────────────────────┐
│              Tree Interaction Layer                │
│  ┌──────────────────────────────────────────────┐  │
│  │   WbsTreeNode (TSK-04-02)                    │  │
│  │   + useTreeInteraction()                     │  │
│  │   + useKeyboardNav()                         │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                     │
│               ▼                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │   Composables                                │  │
│  │   - useTreeInteraction (토글, 선택)          │  │
│  │   - useKeyboardNav (키보드 핸들링)           │  │
│  │   - useTreePersistence (로컬 스토리지)       │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                     │
│               ▼                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │   Pinia Stores                               │  │
│  │   - useWbsStore (expandedNodes)              │  │
│  │   - useSelectionStore (selectedNode)         │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                     │
│               ▼                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │   Persistence Layer                          │  │
│  │   - localStorage (expanded state)            │  │
│  │   - sessionStorage (selection state)         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**관심사 분리 (Separation of Concerns)**:
- **Composables**: 재사용 가능한 인터랙션 로직
- **Pinia Stores**: 전역 상태 관리 (반응성)
- **Persistence**: 브라우저 스토리지 연동

### 3.2 핵심 Composables

| Composable | 역할 | 책임 |
|----------|------|------|
| useTreeInteraction | 노드 인터랙션 | - 노드 토글 (펼침/접기)<br>- 노드 선택<br>- 전체 펼치기/접기<br>- 스토어 업데이트 |
| useKeyboardNav | 키보드 네비게이션 | - 키보드 이벤트 핸들링<br>- 포커스 관리<br>- 탐색 로직 (Up/Down/Left/Right) |
| useTreePersistence | 상태 영속성 | - 로컬 스토리지 읽기/쓰기<br>- 프로젝트별 키 관리<br>- 상태 복원 |

### 3.3 데이터 흐름

#### 펼침/접기 흐름
```
User Action (Click/Space/Arrow)
         ↓
useTreeInteraction.toggleNode(nodeId)
         ↓
useWbsStore().toggleExpand(nodeId)
         ↓
expandedNodes (Set<string>) 업데이트
         ↓
┌───────────────────────┬───────────────────────┐
↓                       ↓                       ↓
WbsTreeNode             useTreePersistence      다른 컴포넌트
재렌더링                 localStorage 저장       반응형 업데이트
```

#### 노드 선택 흐름
```
User Action (Click/Enter)
         ↓
useTreeInteraction.selectNode(node)
         ↓
useSelectionStore().selectNode(node)
         ↓
selectedNode 업데이트
         ↓
┌───────────────────────┬───────────────────────┐
↓                       ↓                       ↓
WbsTreeNode             TaskDetailPanel         다른 컴포넌트
하이라이트               상세 정보 로드           반응형 업데이트
```

#### 키보드 네비게이션 흐름
```
User Keypress (Arrow/Enter/Space)
         ↓
useKeyboardNav.handleKeyDown(event)
         ↓
┌───────┬───────┬───────┬───────┐
↓       ↓       ↓       ↓       ↓
Up      Down    Left    Right   Enter/Space
↓       ↓       ↓       ↓       ↓
이전     다음     접기     펼치기   선택/토글
노드     노드     노드     노드
         ↓
포커스 이동 + 상태 업데이트
```

---

## 4. Composable 상세 설계

### 4.1 useTreeInteraction (노드 인터랙션)

**파일 경로**: `app/composables/useTreeInteraction.ts`

**책임**:
- 노드 토글 (개별 펼침/접기)
- 노드 선택 (상세 패널 연동)
- 전체 펼치기/접기
- 스토어 액션 호출

**인터페이스**:
```typescript
interface UseTreeInteractionReturn {
  // 노드 토글 (펼침/접기)
  toggleNode: (nodeId: string) => void;

  // 노드 선택
  selectNode: (node: WbsNode) => void;

  // 전체 펼치기
  expandAll: () => void;

  // 전체 접기
  collapseAll: () => void;

  // 노드가 펼쳐져 있는지 확인
  isExpanded: (nodeId: string) => boolean;

  // 노드가 선택되어 있는지 확인
  isSelected: (nodeId: string) => boolean;
}

export function useTreeInteraction(): UseTreeInteractionReturn
```

**주요 로직**:
1. **toggleNode**:
   - `useWbsStore().toggleExpand(nodeId)` 호출
   - 펼침/접기 상태 토글
   - 자동으로 로컬 스토리지 저장 (useTreePersistence watch)

2. **selectNode**:
   - `useSelectionStore().selectNode(node)` 호출
   - 선택된 노드 정보 업데이트
   - Task 타입인 경우 상세 정보 자동 로드

3. **expandAll/collapseAll**:
   - `useWbsStore().expandAll()/collapseAll()` 호출
   - 트리 전체 펼침/접기
   - 로컬 스토리지 전체 갱신

4. **isExpanded/isSelected**:
   - Computed 속성으로 반응형 상태 체크
   - 컴포넌트에서 v-if 조건에 사용

**사용 예시**:
```typescript
// WbsTreeNode.vue
const { toggleNode, selectNode, isExpanded, isSelected } = useTreeInteraction()

// 펼침/접기 토글
const handleToggle = () => {
  toggleNode(props.node.id)
}

// 노드 선택
const handleSelect = () => {
  selectNode(props.node)
}
```

---

### 4.2 useKeyboardNav (키보드 네비게이션)

**파일 경로**: `app/composables/useKeyboardNav.ts`

**책임**:
- 키보드 이벤트 핸들링
- 트리 탐색 로직 (Up/Down/Left/Right)
- 포커스 관리
- 단축키 지원 (Home/End/Esc)

**인터페이스**:
```typescript
interface UseKeyboardNavOptions {
  treeRoot: Ref<WbsNode | null>;
  onNodeSelect?: (node: WbsNode) => void;
}

interface UseKeyboardNavReturn {
  // 키보드 이벤트 핸들러 (컴포넌트에 @keydown 바인딩)
  handleKeyDown: (event: KeyboardEvent) => void;

  // 현재 포커스된 노드
  focusedNode: Ref<WbsNode | null>;

  // 포커스 이동
  focusNode: (node: WbsNode) => void;
}

export function useKeyboardNav(options: UseKeyboardNavOptions): UseKeyboardNavReturn
```

**지원하는 키**:

| 키 | 동작 | 설명 |
|----|------|------|
| ArrowDown | 다음 노드로 이동 | 시각적 순서대로 다음 노드 (펼쳐진 자식 우선) |
| ArrowUp | 이전 노드로 이동 | 시각적 순서대로 이전 노드 |
| ArrowRight | 노드 펼치기 | 접혀있으면 펼치고, 이미 펼쳐져 있으면 첫 자식으로 이동 |
| ArrowLeft | 노드 접기 | 펼쳐져 있으면 접고, 이미 접혀있으면 부모로 이동 |
| Enter | 노드 선택 | 상세 패널 표시 |
| Space | 토글 | 펼침/접기 토글 |
| Home | 첫 노드로 이동 | 트리 최상단 노드 |
| End | 마지막 노드로 이동 | 마지막 보이는 노드 |
| Esc | 선택 해제 | 상세 패널 닫기 |

**탐색 로직**:
1. **평면화 (Flatten)**:
   - 펼쳐진 노드만 포함한 1차원 배열 생성
   - 탐색 가능한 노드 목록 유지
   ```typescript
   const flattenedNodes = computed(() => {
     const result: WbsNode[] = []
     const flatten = (node: WbsNode) => {
       result.push(node)
       if (isExpanded(node.id)) {
         node.children.forEach(flatten)
       }
     }
     if (treeRoot.value) {
       flatten(treeRoot.value)
     }
     return result
   })
   ```

2. **현재 인덱스 찾기**:
   ```typescript
   const currentIndex = computed(() => {
     if (!focusedNode.value) return -1
     return flattenedNodes.value.findIndex(n => n.id === focusedNode.value!.id)
   })
   ```

3. **방향 이동**:
   ```typescript
   // ArrowDown: 다음 노드
   const nextIndex = Math.min(currentIndex.value + 1, flattenedNodes.value.length - 1)

   // ArrowUp: 이전 노드
   const prevIndex = Math.max(currentIndex.value - 1, 0)
   ```

4. **포커스 이동**:
   - DOM 포커스 업데이트 (`element.focus()`)
   - 스크롤 자동 조정 (`scrollIntoView({ block: 'nearest' })`)

**사용 예시**:
```typescript
// WbsTreePanel.vue
const { handleKeyDown, focusedNode } = useKeyboardNav({
  treeRoot: computed(() => wbsStore.root),
  onNodeSelect: (node) => {
    selectionStore.selectNode(node)
  }
})

// 템플릿에서
<div @keydown="handleKeyDown" tabindex="0">
  <WbsTreeNode ... />
</div>
```

---

### 4.3 useTreePersistence (상태 영속성)

**파일 경로**: `app/composables/useTreePersistence.ts`

**책임**:
- 로컬 스토리지 읽기/쓰기
- 프로젝트별 키 관리
- 상태 복원 (페이지 로드 시)
- 상태 저장 (변경 시 자동)

**인터페이스**:
```typescript
interface UseTreePersistenceOptions {
  projectId: string;
}

interface UseTreePersistenceReturn {
  // 상태 복원 (로드 시 호출)
  restoreExpandedState: () => void;

  // 상태 저장 (자동 watch)
  saveExpandedState: (expandedNodes: Set<string>) => void;

  // 상태 초기화
  clearExpandedState: () => void;
}

export function useTreePersistence(options: UseTreePersistenceOptions): UseTreePersistenceReturn
```

**로컬 스토리지 키 구조**:
```typescript
// 키 형식: `jjiban:tree:${projectId}:expanded`
const STORAGE_KEY = `jjiban:tree:${projectId}:expanded`

// 저장 형식 (JSON)
{
  "version": "1.0",
  "timestamp": "2025-12-15T10:30:00Z",
  "expandedNodes": ["WP-01", "ACT-01-01", "TSK-01-01-01"]
}
```

**주요 로직**:

1. **상태 복원 (restoreExpandedState)**:
   ```typescript
   function restoreExpandedState() {
     const stored = localStorage.getItem(STORAGE_KEY)
     if (!stored) return

     try {
       const data = JSON.parse(stored)
       const wbsStore = useWbsStore()

       // Set으로 복원
       wbsStore.expandedNodes = new Set(data.expandedNodes)
     } catch (error) {
       console.error('Failed to restore tree state:', error)
       clearExpandedState()
     }
   }
   ```

2. **상태 저장 (saveExpandedState)**:
   ```typescript
   function saveExpandedState(expandedNodes: Set<string>) {
     const data = {
       version: '1.0',
       timestamp: new Date().toISOString(),
       expandedNodes: Array.from(expandedNodes)
     }

     localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
   }
   ```

3. **자동 저장 (Watch)**:
   ```typescript
   // WbsTreePanel.vue에서 사용
   const wbsStore = useWbsStore()
   const { saveExpandedState } = useTreePersistence({ projectId })

   watch(
     () => wbsStore.expandedNodes,
     (expandedNodes) => {
       saveExpandedState(expandedNodes)
     },
     { deep: true }
   )
   ```

4. **프로젝트 전환 처리**:
   - 프로젝트 ID 변경 시 자동으로 다른 키 사용
   - 각 프로젝트의 독립적인 상태 유지

**사용 예시**:
```typescript
// WbsTreePanel.vue (onMounted)
const route = useRoute()
const projectId = computed(() => route.query.projectId as string)
const { restoreExpandedState, saveExpandedState } = useTreePersistence({
  projectId: projectId.value
})

onMounted(async () => {
  await wbsStore.loadWbs(projectId.value)
  restoreExpandedState()  // 저장된 상태 복원
})

// 자동 저장
watch(
  () => wbsStore.expandedNodes,
  (expandedNodes) => saveExpandedState(expandedNodes),
  { deep: true }
)
```

---

## 5. Pinia Store 확장

### 5.1 useWbsStore 확장 (stores/wbs.ts)

**기존 구현 활용** (TSK-04-01에서 이미 구현됨):
```typescript
// 이미 구현된 액션
- toggleExpand(nodeId: string)
- expandAll()
- collapseAll()
- isExpanded(nodeId: string)
```

**추가 필요 사항**: 없음 (기존 구현으로 충분)

### 5.2 useSelectionStore 활용 (stores/selection.ts)

**기존 구현 활용** (TSK-04-01에서 이미 구현됨):
```typescript
// 이미 구현된 상태
- selectedNode: WbsNode | null
- selectedTaskDetail: TaskDetail | null

// 이미 구현된 액션
- selectNode(node: WbsNode)
- clearSelection()
```

**추가 필요 사항**: 없음 (기존 구현으로 충분)

---

## 6. 컴포넌트 통합

### 6.1 WbsTreeNode 컴포넌트 업데이트

**파일 경로**: `app/components/wbs/WbsTreeNode.vue` (TSK-04-02에서 생성)

**통합 포인트**:
```typescript
<script setup lang="ts">
import { useTreeInteraction } from '~/composables/useTreeInteraction'

const props = defineProps<{
  node: WbsNode
  depth?: number
}>()

const { toggleNode, selectNode, isExpanded, isSelected } = useTreeInteraction()

// 펼침/접기 토글
const handleToggle = () => {
  toggleNode(props.node.id)
}

// 노드 선택
const handleSelect = () => {
  selectNode(props.node)
}

// 더블클릭 시 토글 (PRD 6.2.3)
const handleDoubleClick = () => {
  if (props.node.children.length > 0) {
    toggleNode(props.node.id)
  }
}
</script>

<template>
  <div
    class="wbs-tree-node"
    :class="{ 'selected': isSelected(node.id) }"
    @click="handleSelect"
    @dblclick="handleDoubleClick"
    tabindex="0"
  >
    <!-- 펼침/접기 아이콘 -->
    <Button
      v-if="node.children.length > 0"
      :icon="isExpanded(node.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
      @click.stop="handleToggle"
    />

    <!-- 노드 콘텐츠 (TSK-04-02에서 구현) -->
    <!-- ... -->
  </div>
</template>
```

### 6.2 WbsTreePanel 컴포넌트 업데이트

**파일 경로**: `app/components/wbs/WbsTreePanel.vue` (TSK-04-01에서 생성)

**통합 포인트**:
```typescript
<script setup lang="ts">
import { useWbsStore } from '~/stores/wbs'
import { useKeyboardNav } from '~/composables/useKeyboardNav'
import { useTreePersistence } from '~/composables/useTreePersistence'

const route = useRoute()
const wbsStore = useWbsStore()
const projectId = computed(() => route.query.projectId as string)

// 키보드 네비게이션
const { handleKeyDown } = useKeyboardNav({
  treeRoot: computed(() => wbsStore.root),
  onNodeSelect: (node) => {
    const { selectNode } = useTreeInteraction()
    selectNode(node)
  }
})

// 상태 영속성
const { restoreExpandedState, saveExpandedState } = useTreePersistence({
  projectId: projectId.value
})

onMounted(async () => {
  await wbsStore.loadWbs(projectId.value)
  restoreExpandedState()
})

// 자동 저장
watch(
  () => wbsStore.expandedNodes,
  (expandedNodes) => saveExpandedState(expandedNodes),
  { deep: true }
)
</script>

<template>
  <div
    class="wbs-tree-panel"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <WbsTreeHeader />
    <WbsTreeNode v-if="wbsStore.root" :node="wbsStore.root" />
  </div>
</template>
```

---

## 7. 인터페이스 설계

### 7.1 Composable 인터페이스

#### useTreeInteraction
```typescript
export function useTreeInteraction(): {
  toggleNode: (nodeId: string) => void
  selectNode: (node: WbsNode) => void
  expandAll: () => void
  collapseAll: () => void
  isExpanded: (nodeId: string) => boolean
  isSelected: (nodeId: string) => boolean
}
```

#### useKeyboardNav
```typescript
export function useKeyboardNav(options: {
  treeRoot: Ref<WbsNode | null>
  onNodeSelect?: (node: WbsNode) => void
}): {
  handleKeyDown: (event: KeyboardEvent) => void
  focusedNode: Ref<WbsNode | null>
  focusNode: (node: WbsNode) => void
}
```

#### useTreePersistence
```typescript
export function useTreePersistence(options: {
  projectId: string
}): {
  restoreExpandedState: () => void
  saveExpandedState: (expandedNodes: Set<string>) => void
  clearExpandedState: () => void
}
```

### 7.2 로컬 스토리지 스키마

```typescript
// 키: `jjiban:tree:${projectId}:expanded`
interface ExpandedStateStorage {
  version: '1.0'
  timestamp: string  // ISO 8601 형식
  expandedNodes: string[]  // 노드 ID 배열
}
```

---

## 8. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 상태 관리 | 1) Local State<br>2) Pinia Store | Pinia Store | - 전역 상태 필요<br>- 여러 컴포넌트 간 공유<br>- TSK-04-01/02에서 이미 구현 |
| 로직 분리 | 1) 컴포넌트 내부<br>2) Composables | Composables | - 재사용성<br>- 테스트 용이성<br>- 관심사 분리 |
| 상태 영속성 | 1) sessionStorage<br>2) localStorage | localStorage | - 탭 간 공유<br>- 브라우저 재시작 후 유지<br>- 사용자 경험 향상 |
| 키보드 탐색 | 1) DOM 포커스<br>2) 가상 포커스 | DOM 포커스 | - 접근성 표준 준수<br>- 스크린 리더 지원<br>- 브라우저 기본 동작 활용 |
| 평면화 전략 | 1) 실시간 계산<br>2) 캐싱 | 실시간 계산 (Computed) | - Vue 반응성 활용<br>- 자동 업데이트<br>- < 1000 노드로 성능 충분 |
| 이벤트 버블링 | 1) 버블링 허용<br>2) stopPropagation | stopPropagation (토글 시) | - 토글과 선택 분리<br>- 의도치 않은 선택 방지 |

---

## 9. 인수 기준

- [ ] AC-01: 노드 클릭 시 펼침/접기 토글 동작
- [ ] AC-02: 노드 더블클릭 시 펼침/접기 토글 동작
- [ ] AC-03: Space 키로 노드 펼침/접기 토글
- [ ] AC-04: 노드 선택 시 상세 패널 표시
- [ ] AC-05: Enter 키로 노드 선택
- [ ] AC-06: ArrowDown/Up으로 다음/이전 노드 이동
- [ ] AC-07: ArrowRight/Left로 펼치기/접기 또는 자식/부모 이동
- [ ] AC-08: Home/End 키로 첫/마지막 노드 이동
- [ ] AC-09: Esc 키로 선택 해제
- [ ] AC-10: 전체 펼치기 버튼 동작
- [ ] AC-11: 전체 접기 버튼 동작
- [ ] AC-12: 펼침/접기 상태가 로컬 스토리지에 저장됨
- [ ] AC-13: 페이지 새로고침 후 펼침/접기 상태 복원됨
- [ ] AC-14: 선택된 노드가 시각적으로 하이라이트됨
- [ ] AC-15: 키보드로 이동 시 자동 스크롤 조정

---

## 10. 리스크 및 의존성

### 10.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 키보드 이벤트 충돌 | Medium | - 이벤트 버블링 제어<br>- preventDefault 사용<br>- 명확한 키 바인딩 |
| 로컬 스토리지 용량 초과 | Low | - 프로젝트당 < 1MB 제한<br>- 주기적 정리 (오래된 데이터)<br>- 에러 핸들링 (quota 초과 시) |
| 포커스 관리 복잡도 | Medium | - DOM 포커스 우선<br>- scrollIntoView 활용<br>- 단순한 탐색 로직 |
| 평면화 성능 | Low | - < 1000 노드로 충분<br>- Computed 캐싱 활용<br>- 향후 가상 스크롤 고려 |

### 10.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-04-01 | 선행 | WbsTreePanel, Pinia 스토어 필요 |
| TSK-04-02 | 선행 | WbsTreeNode 컴포넌트 필요 |
| TSK-01-01-03 | 선행 | Pinia 설정 완료 필요 |
| stores/wbs.ts | 기존 구현 | expandedNodes, toggleExpand 등 |
| stores/selection.ts | 기존 구현 | selectedNode, selectNode 등 |
| WP-05 | 후행 | Task 상세 패널 (선택 연동) |

---

## 11. 다음 단계

### 11.1 상세설계 단계 (/wf:draft)
- Composable별 상세 구현 사양
- 키보드 네비게이션 에지 케이스 처리
- 로컬 스토리지 마이그레이션 전략 (버전 관리)
- 접근성 속성 세부 정의 (ARIA labels, roles)
- 단위 테스트 시나리오 작성

### 11.2 구현 단계 (/wf:build)
- 3개 Composable 파일 작성
- WbsTreeNode/WbsTreePanel 통합
- 로컬 스토리지 읽기/쓰기 구현
- 키보드 이벤트 핸들러 구현
- 포커스 관리 및 스크롤 조정

### 11.3 검증 단계 (/wf:verify)
- 단위 테스트 (Composable별)
- E2E 테스트 (키보드 네비게이션, 펼침/접기, 선택)
- 접근성 검증 (키보드만으로 전체 기능 사용)
- 성능 테스트 (1000 노드 환경)
- 로컬 스토리지 영속성 테스트 (새로고침, 탭 전환)

---

## 12. 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2.3, 11.2)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-03)
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-04-01: `.jjiban/projects/jjiban/tasks/TSK-04-01/010-basic-design.md`
  - TSK-04-02: `.jjiban/projects/jjiban/tasks/TSK-04-02/010-basic-design.md`
- Pinia 스토어: `stores/wbs.ts`, `stores/selection.ts`
- 타입 정의: `types/index.ts`

---

<!--
author: Claude (Requirements Analyst)
Template Version: 1.0.0
Created: 2025-12-15
-->
