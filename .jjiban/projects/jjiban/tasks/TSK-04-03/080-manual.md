# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * Tree Interaction Composable 사용 가이드
> * 개발자를 위한 참조 문서

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| 작성일 | 2025-12-15 |
| 버전 | 1.0.0 |

---

## 1. 개요

Tree Interaction은 WBS 트리의 상호작용을 관리하는 3개의 Vue 3 Composable로 구성됩니다.

### 1.1 Composable 목록

| Composable | 역할 | 파일 경로 |
|------------|------|----------|
| useTreeInteraction | 노드 토글/선택 | `app/composables/useTreeInteraction.ts` |
| useTreePersistence | 상태 영속성 | `app/composables/useTreePersistence.ts` |
| useKeyboardNav | 키보드 네비게이션 | `app/composables/useKeyboardNav.ts` |

---

## 2. useTreeInteraction

### 2.1 목적

노드 펼침/접기, 선택, 전체 펼치기/접기 기능 제공

### 2.2 인터페이스

```typescript
interface UseTreeInteractionReturn {
  toggleNode: (nodeId: string) => void
  selectNode: (nodeId: string) => Promise<void>
  expandAll: () => void
  collapseAll: () => void
  isExpanded: (nodeId: string) => boolean
  isSelected: (nodeId: string) => boolean
}
```

### 2.3 사용 예시

```vue
<script setup lang="ts">
import { useTreeInteraction } from '~/composables/useTreeInteraction'

const { toggleNode, selectNode, isExpanded, isSelected } = useTreeInteraction()

// 노드 토글
const handleToggle = (nodeId: string) => {
  toggleNode(nodeId)
}

// 노드 선택 (비동기)
const handleSelect = async (nodeId: string) => {
  await selectNode(nodeId)
}

// 상태 확인
const expanded = isExpanded('WP-01')
const selected = isSelected('TSK-01-01')
</script>
```

### 2.4 특징

- **Race Condition 방지**: 동시 선택 요청 방지 (ISS-DR-008)
- **입력 검증**: 유효하지 않은 nodeId 자동 무시
- **에러 복구**: 선택 실패 시 자동 선택 해제

---

## 3. useTreePersistence

### 3.1 목적

로컬 스토리지에 트리 펼침/접기 상태 저장 및 복원

### 3.2 인터페이스

```typescript
interface UseTreePersistenceOptions {
  projectId: string
}

interface UseTreePersistenceReturn {
  restoreExpandedState: () => void
  saveExpandedState: (expandedNodes: Set<string>) => void
  clearExpandedState: () => void
  autoSave: Ref<boolean>
}
```

### 3.3 사용 예시

```vue
<script setup lang="ts">
import { useTreePersistence } from '~/composables/useTreePersistence'

const projectId = 'my-project'
const { restoreExpandedState, autoSave } = useTreePersistence({ projectId })

// 페이지 로드 시 상태 복원
onMounted(() => {
  restoreExpandedState()
})

// 자동 저장 비활성화
autoSave.value = false
</script>
```

### 3.4 로컬 스토리지 스키마

**키 형식**: `jjiban:tree:{projectId}:expanded`

**값 형식**:
```json
{
  "version": "1.0",
  "timestamp": "2025-12-15T10:30:00Z",
  "expandedNodes": ["WP-01", "ACT-01-01"]
}
```

### 3.5 특징

- **Debounce 적용**: 300ms 지연으로 과도한 저장 방지 (ISS-DR-003)
- **버전 관리**: 스키마 버전 불일치 시 자동 초기화
- **자동 정리**: 30일 이상 된 데이터 자동 삭제
- **크기 제한**: 1MB 초과 시 저장 생략

---

## 4. useKeyboardNav

### 4.1 목적

키보드로 트리 탐색, 포커스 관리

### 4.2 인터페이스

```typescript
interface UseKeyboardNavOptions {
  treeRoot: Ref<WbsNode[]>
  onNodeSelect?: (nodeId: string) => void
  onFocusChange?: (nodeId: string, element: HTMLElement) => void
}

interface UseKeyboardNavReturn {
  handleKeyDown: (event: KeyboardEvent) => void
  focusedNodeId: Ref<string | null>
  focusNode: (nodeId: string) => void
}
```

### 4.3 사용 예시

```vue
<script setup lang="ts">
import { useKeyboardNav } from '~/composables/useKeyboardNav'
import { useWbsStore } from '~/stores/wbs'

const wbsStore = useWbsStore()

const { handleKeyDown, focusedNodeId } = useKeyboardNav({
  treeRoot: computed(() => wbsStore.tree),
  onNodeSelect: (nodeId) => {
    console.log('Selected:', nodeId)
  }
})
</script>

<template>
  <div @keydown="handleKeyDown" tabindex="0">
    <!-- 트리 노드들 -->
  </div>
</template>
```

### 4.4 키 매핑

| 키 | 동작 |
|----|------|
| ArrowDown | 다음 노드로 이동 |
| ArrowUp | 이전 노드로 이동 |
| ArrowRight | 펼치기 또는 첫 번째 자식으로 |
| ArrowLeft | 접기 또는 부모로 |
| Enter | 노드 선택 |
| Space | 펼침/접기 토글 |
| Home | 첫 번째 노드로 |
| End | 마지막 노드로 |
| Escape | 선택 해제 |

### 4.5 특징

- **평면화 알고리즘**: 펼쳐진 노드만 포함한 1차원 배열 생성
- **computed 캐싱**: 자동 메모이제이션으로 성능 최적화
- **스크롤 조정**: 포커스 이동 시 smooth 스크롤

---

## 5. 통합 사용 예시

### 5.1 WbsTreePanel 통합

```vue
<script setup lang="ts">
import { useWbsStore } from '~/stores/wbs'
import { useTreeInteraction } from '~/composables/useTreeInteraction'
import { useTreePersistence } from '~/composables/useTreePersistence'
import { useKeyboardNav } from '~/composables/useKeyboardNav'

const route = useRoute()
const wbsStore = useWbsStore()
const projectId = computed(() => route.query.projectId as string)

// Composables 초기화
const { selectNode, toggleNode, expandAll, collapseAll } = useTreeInteraction()
const { restoreExpandedState } = useTreePersistence({ projectId: projectId.value })
const { handleKeyDown } = useKeyboardNav({
  treeRoot: computed(() => wbsStore.tree),
  onNodeSelect: async (nodeId) => {
    await selectNode(nodeId)
  }
})

// 초기화
onMounted(async () => {
  await wbsStore.fetchWbs(projectId.value)
  restoreExpandedState()
})
</script>

<template>
  <div
    class="wbs-tree-panel"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <div class="toolbar">
      <Button @click="expandAll">전체 펼치기</Button>
      <Button @click="collapseAll">전체 접기</Button>
    </div>

    <WbsTreeNode
      v-for="node in wbsStore.tree"
      :key="node.id"
      :node="node"
      :depth="0"
    />
  </div>
</template>
```

---

## 6. 테스트

### 6.1 단위 테스트 실행

```bash
npm test -- tests/unit/composables/
```

### 6.2 테스트 결과

- 총 50개 테스트, 100% 통과
- useTreeInteraction: 16개 테스트
- useTreePersistence: 14개 테스트
- useKeyboardNav: 20개 테스트

---

## 7. 의존성

### 7.1 필수 패키지

- @vueuse/core (useDebounceFn)
- Pinia (wbs, selection 스토어)
- Vue 3 (ref, computed, watch)

### 7.2 관련 Task

- TSK-04-01: WbsTreePanel (컨테이너)
- TSK-04-02: Tree Node (노드 컴포넌트)
- TSK-01-01-03: Pinia 설정 (스토어)

---

## 8. 접근성

### 8.1 ARIA 속성

- `tabindex="0"`: 키보드 포커스 가능
- `data-node-id`: 노드 식별자
- `aria-expanded`: 펼침 상태
- `aria-selected`: 선택 상태

### 8.2 키보드 지원

WCAG 2.1 Tree View 패턴 준수:
- 모든 키보드 네비게이션 지원
- 포커스 표시자 제공
- 스크린 리더 호환

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-12-15 | 초기 릴리스 |

---

<!--
author: Claude
Template Version: 1.0.0
Created: 2025-12-15
-->
