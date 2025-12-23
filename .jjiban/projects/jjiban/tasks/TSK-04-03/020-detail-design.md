# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 구현 가능한 수준의 상세 명세
> * 인터페이스, 알고리즘, 데이터 구조 정의
> * 기본설계와의 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| Category | development |
| Domain | frontend |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 (아키텍처, 인터페이스) |
| UI설계 | `011-ui-design.md` | 전체 (시각적 명세) |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2.3, 11.2 |

---

## 1. 상세설계 목적

### 1.1 설계 목표

기본설계에서 정의한 3개 Composable의 구현 가능한 상세 명세를 제공합니다.

**상세화 범위**:
- **데이터 구조**: 내부 상태, 매개변수, 반환 타입
- **알고리즘**: 키보드 탐색, 평면화, 영속성 로직
- **에러 처리**: 예외 상황, 경계 조건, 복구 전략
- **성능 최적화**: 메모이제이션, 반응성 최적화, 지연 처리

### 1.2 구현 우선순위

| 우선순위 | Composable | 의존성 | 복잡도 |
|---------|-----------|--------|--------|
| **P1** | useTreeInteraction | Pinia stores (기존) | Low |
| **P2** | useTreePersistence | useTreeInteraction | Low |
| **P3** | useKeyboardNav | useTreeInteraction | Medium |

---

## 2. Composable 상세 명세

### 2.1 useTreeInteraction (노드 인터랙션)

#### 2.1.1 파일 정보

**파일 경로**: `app/composables/useTreeInteraction.ts`

**의존성**:
```typescript
import { useWbsStore } from '~/app/stores/wbs'
import { useSelectionStore } from '~/app/stores/selection'
import type { WbsNode } from '~/types/index'
```

#### 2.1.2 인터페이스 정의

```typescript
/**
 * 트리 인터랙션 Composable
 * 노드 토글, 선택, 전체 펼치기/접기 기능 제공
 */
export interface UseTreeInteractionReturn {
  /**
   * 노드 펼침/접기 토글
   * @param nodeId - 노드 ID (WP-01, ACT-01-01, TSK-01-01-01 등)
   */
  toggleNode: (nodeId: string) => void

  /**
   * 노드 선택 (상세 패널 표시)
   * @param nodeId - 선택할 노드 ID
   */
  selectNode: (nodeId: string) => Promise<void>

  /**
   * 전체 노드 펼치기
   */
  expandAll: () => void

  /**
   * 전체 노드 접기
   */
  collapseAll: () => void

  /**
   * 노드가 펼쳐져 있는지 확인
   * @param nodeId - 노드 ID
   * @returns 펼쳐져 있으면 true
   */
  isExpanded: (nodeId: string) => boolean

  /**
   * 노드가 선택되어 있는지 확인
   * @param nodeId - 노드 ID
   * @returns 선택되어 있으면 true
   */
  isSelected: (nodeId: string) => boolean
}

export function useTreeInteraction(): UseTreeInteractionReturn
```

#### 2.1.3 구현 명세

**1) toggleNode 구현**

```typescript
function toggleNode(nodeId: string): void {
  const wbsStore = useWbsStore()

  // 입력 검증
  if (!nodeId || typeof nodeId !== 'string') {
    console.warn('[useTreeInteraction] Invalid nodeId:', nodeId)
    return
  }

  // 노드 존재 확인
  const node = wbsStore.getNode(nodeId)
  if (!node) {
    console.warn('[useTreeInteraction] Node not found:', nodeId)
    return
  }

  // 자식이 없는 노드는 토글 불가
  if (!node.children || node.children.length === 0) {
    return
  }

  // 스토어 액션 호출 (반응형 업데이트 자동)
  wbsStore.toggleExpand(nodeId)
}
```

**2) selectNode 구현 (ISS-DR-008 적용: Race Condition 방지)**

```typescript
// 요청 중 플래그 (Race Condition 방지)
const isSelecting = ref(false)

async function selectNode(nodeId: string): Promise<void> {
  const selectionStore = useSelectionStore()

  // 입력 검증
  if (!nodeId || typeof nodeId !== 'string') {
    console.warn('[useTreeInteraction] Invalid nodeId:', nodeId)
    return
  }

  // 중복 선택 및 진행 중 요청 방지 (ISS-DR-008)
  if (selectionStore.selectedNodeId === nodeId || isSelecting.value) {
    return
  }

  isSelecting.value = true
  try {
    await selectionStore.selectNode(nodeId)
  } catch (error) {
    console.error('[useTreeInteraction] Failed to select node:', error)
    // 에러 발생 시 선택 해제 (일관성 유지)
    selectionStore.clearSelection()
    throw error
  } finally {
    isSelecting.value = false
  }
}
```

**3) expandAll / collapseAll 구현**

```typescript
function expandAll(): void {
  const wbsStore = useWbsStore()
  wbsStore.expandAll()
}

function collapseAll(): void {
  const wbsStore = useWbsStore()
  wbsStore.collapseAll()
}
```

**4) isExpanded / isSelected 구현**

```typescript
function isExpanded(nodeId: string): boolean {
  const wbsStore = useWbsStore()
  return wbsStore.isExpanded(nodeId)
}

function isSelected(nodeId: string): boolean {
  const selectionStore = useSelectionStore()
  return selectionStore.selectedNodeId === nodeId
}
```

#### 2.1.4 에러 처리

| 상황 | 처리 방법 | 복구 전략 |
|------|----------|----------|
| 노드 ID 없음 | console.warn + early return | 무시 (안전) |
| 노드 찾을 수 없음 | console.warn + early return | 무시 (안전) |
| Task 로드 실패 | console.error + throw | 선택 해제 후 에러 전파 |
| 중복 선택 | early return | 무시 (최적화) |

#### 2.1.5 성능 고려사항

- **반응성 최적화**: computed 대신 함수 방식 (필요 시 호출)
- **메모이제이션 불필요**: 스토어의 computed 값 활용
- **비동기 처리**: selectNode만 Promise 반환 (Task 로드)

---

### 2.2 useTreePersistence (상태 영속성)

#### 2.2.1 파일 정보

**파일 경로**: `app/composables/useTreePersistence.ts`

**의존성**:
```typescript
import { useWbsStore } from '~/app/stores/wbs'
```

#### 2.2.2 인터페이스 정의

```typescript
/**
 * 트리 영속성 Composable
 * 로컬 스토리지에 펼침/접기 상태 저장 및 복원
 */
export interface UseTreePersistenceOptions {
  /**
   * 프로젝트 ID (로컬 스토리지 키 생성용)
   */
  projectId: string
}

export interface UseTreePersistenceReturn {
  /**
   * 저장된 상태 복원 (페이지 로드 시 호출)
   */
  restoreExpandedState: () => void

  /**
   * 현재 상태 저장 (자동 watch 또는 수동 호출)
   * @param expandedNodes - 펼쳐진 노드 ID Set
   */
  saveExpandedState: (expandedNodes: Set<string>) => void

  /**
   * 저장된 상태 초기화 (프로젝트 삭제 시 호출)
   */
  clearExpandedState: () => void

  /**
   * 자동 저장 활성화 여부
   */
  autoSave: Ref<boolean>
}

export function useTreePersistence(
  options: UseTreePersistenceOptions
): UseTreePersistenceReturn
```

#### 2.2.3 로컬 스토리지 스키마

**키 형식**:
```typescript
const STORAGE_KEY = `jjiban:tree:${projectId}:expanded`
```

**값 형식** (JSON):
```typescript
interface ExpandedStateStorage {
  version: '1.0'
  timestamp: string  // ISO 8601 형식
  expandedNodes: string[]  // 노드 ID 배열
}
```

**예시**:
```json
{
  "version": "1.0",
  "timestamp": "2025-12-15T10:30:00Z",
  "expandedNodes": ["WP-01", "WP-02", "ACT-01-01", "TSK-01-01-01"]
}
```

#### 2.2.4 구현 명세

**1) 상수 정의**

```typescript
const STORAGE_VERSION = '1.0'
const STORAGE_PREFIX = 'jjiban:tree'
const MAX_STORAGE_SIZE = 1024 * 1024 // 1MB

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}:${projectId}:expanded`
}
```

**2) restoreExpandedState 구현**

```typescript
function restoreExpandedState(): void {
  const wbsStore = useWbsStore()
  const storageKey = getStorageKey(options.projectId)

  try {
    // 로컬 스토리지에서 읽기
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      console.info('[useTreePersistence] No saved state found')
      return
    }

    // JSON 파싱
    const data: ExpandedStateStorage = JSON.parse(stored)

    // 버전 체크
    if (data.version !== STORAGE_VERSION) {
      console.warn('[useTreePersistence] Version mismatch, clearing state')
      clearExpandedState()
      return
    }

    // Set으로 복원
    const expandedNodes = new Set(data.expandedNodes || [])

    // 유효한 노드만 필터링 (존재하지 않는 노드 제거)
    const validNodes = new Set<string>()
    expandedNodes.forEach(nodeId => {
      if (wbsStore.getNode(nodeId)) {
        validNodes.add(nodeId)
      }
    })

    // 스토어 상태 업데이트
    wbsStore.expandedNodes = validNodes

    console.info('[useTreePersistence] Restored state:', validNodes.size, 'nodes')
  } catch (error) {
    console.error('[useTreePersistence] Failed to restore state:', error)
    clearExpandedState()
  }
}
```

**3) saveExpandedState 구현**

```typescript
function saveExpandedState(expandedNodes: Set<string>): void {
  const storageKey = getStorageKey(options.projectId)

  try {
    // 데이터 준비
    const data: ExpandedStateStorage = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      expandedNodes: Array.from(expandedNodes)
    }

    // JSON 직렬화
    const json = JSON.stringify(data)

    // 크기 체크
    if (json.length > MAX_STORAGE_SIZE) {
      console.warn('[useTreePersistence] Storage size exceeds limit, skipping save')
      return
    }

    // 로컬 스토리지에 저장
    localStorage.setItem(storageKey, json)
    console.debug('[useTreePersistence] Saved state:', expandedNodes.size, 'nodes')
  } catch (error) {
    // Quota 초과 등의 에러 처리
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[useTreePersistence] Storage quota exceeded')
      // 오래된 데이터 정리 시도
      cleanupOldStorage()
    } else {
      console.error('[useTreePersistence] Failed to save state:', error)
    }
  }
}
```

**4) clearExpandedState 구현**

```typescript
function clearExpandedState(): void {
  const storageKey = getStorageKey(options.projectId)
  try {
    localStorage.removeItem(storageKey)
    console.info('[useTreePersistence] Cleared state')
  } catch (error) {
    console.error('[useTreePersistence] Failed to clear state:', error)
  }
}
```

**5) 자동 저장 (Watch) (ISS-DR-003 적용: Debounce 추가)**

```typescript
import { useDebounceFn } from '@vueuse/core'

const autoSave = ref(true)

// Debounce 적용 (300ms) - ISS-DR-003
const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
  saveExpandedState(expandedNodes)
}, 300)

// WbsStore의 expandedNodes 변경 감지
const wbsStore = useWbsStore()
watch(
  () => wbsStore.expandedNodes,
  (expandedNodes) => {
    if (autoSave.value) {
      debouncedSave(expandedNodes)  // debounce 적용
    }
  },
  { deep: true }
)
```

**6) 오래된 데이터 정리**

```typescript
function cleanupOldStorage(): void {
  const keysToRemove: string[] = []
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30) // 30일 이전 데이터 삭제

  // 로컬 스토리지 전체 스캔
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const data = JSON.parse(stored)
          const timestamp = new Date(data.timestamp)
          if (timestamp < cutoffDate) {
            keysToRemove.push(key)
          }
        }
      } catch {
        // 파싱 실패한 데이터도 삭제 대상
        keysToRemove.push(key)
      }
    }
  }

  // 오래된 키 삭제
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })

  console.info('[useTreePersistence] Cleaned up', keysToRemove.length, 'old entries')
}
```

#### 2.2.5 에러 처리

| 상황 | 처리 방법 | 복구 전략 |
|------|----------|----------|
| 저장된 데이터 없음 | early return | 기본 상태 유지 |
| JSON 파싱 실패 | console.error + clear | 저장 데이터 초기화 |
| 버전 불일치 | console.warn + clear | 저장 데이터 초기화 |
| Quota 초과 | cleanupOldStorage() | 오래된 데이터 정리 후 재시도 |
| 유효하지 않은 노드 | 필터링 후 저장 | 존재하는 노드만 유지 |

#### 2.2.6 성능 고려사항

- **Debounce**: watch에 300ms debounce 적용 (빈번한 저장 방지)
- **Deep Watch**: expandedNodes는 Set이므로 deep: true 필요
- **크기 제한**: 1MB 초과 시 저장 생략
- **유효성 검증**: 복원 시 존재하지 않는 노드 필터링

---

### 2.3 useKeyboardNav (키보드 네비게이션)

#### 2.3.1 파일 정보

**파일 경로**: `app/composables/useKeyboardNav.ts`

**의존성**:
```typescript
import { useTreeInteraction } from './useTreeInteraction'
import type { WbsNode } from '~/types/index'
```

#### 2.3.2 인터페이스 정의

```typescript
/**
 * 키보드 네비게이션 Composable
 * 트리 탐색, 포커스 관리, 키보드 이벤트 핸들링
 */
export interface UseKeyboardNavOptions {
  /**
   * 트리 루트 노드 (평면화 기준)
   */
  treeRoot: Ref<WbsNode[]>

  /**
   * 노드 선택 시 호출되는 콜백
   */
  onNodeSelect?: (nodeId: string) => void

  /**
   * 포커스 이동 시 호출되는 콜백 (스크롤 조정용)
   */
  onFocusChange?: (nodeId: string, element: HTMLElement) => void
}

export interface UseKeyboardNavReturn {
  /**
   * 키보드 이벤트 핸들러 (컴포넌트에 @keydown 바인딩)
   */
  handleKeyDown: (event: KeyboardEvent) => void

  /**
   * 현재 포커스된 노드 ID
   */
  focusedNodeId: Ref<string | null>

  /**
   * 특정 노드로 포커스 이동 (프로그램 방식)
   */
  focusNode: (nodeId: string) => void
}

export function useKeyboardNav(
  options: UseKeyboardNavOptions
): UseKeyboardNavReturn
```

#### 2.3.3 키 매핑 테이블

| 키 | 동작 | 메서드 |
|----|------|--------|
| ArrowDown | 다음 노드로 이동 | `handleArrowDown()` |
| ArrowUp | 이전 노드로 이동 | `handleArrowUp()` |
| ArrowRight | 노드 펼치기 또는 자식으로 이동 | `handleArrowRight()` |
| ArrowLeft | 노드 접기 또는 부모로 이동 | `handleArrowLeft()` |
| Enter | 노드 선택 | `handleEnter()` |
| Space | 펼침/접기 토글 | `handleSpace()` |
| Home | 첫 번째 노드로 이동 | `handleHome()` |
| End | 마지막 노드로 이동 | `handleEnd()` |
| Escape | 선택 해제 | `handleEscape()` |

#### 2.3.4 평면화 알고리즘

**목적**: 펼쳐진 노드만 포함한 1차원 배열 생성 (탐색 가능 노드)

```typescript
/**
 * 트리를 평면화하여 탐색 가능한 노드 배열 생성
 * 펼쳐진 노드의 자식만 포함
 */
const flattenedNodes = computed<WbsNode[]>(() => {
  const result: WbsNode[] = []
  const { isExpanded } = useTreeInteraction()

  function flatten(nodes: WbsNode[]): void {
    for (const node of nodes) {
      result.push(node)

      // 펼쳐진 노드의 자식만 재귀 탐색
      if (isExpanded(node.id) && node.children && node.children.length > 0) {
        flatten(node.children)
      }
    }
  }

  flatten(options.treeRoot.value || [])
  return result
})
```

**복잡도**:
- 시간 복잡도: O(n), n = 펼쳐진 노드 수
- 공간 복잡도: O(n)
- 반응성: computed로 자동 갱신

#### 2.3.5 핵심 메서드 구현

**1) handleKeyDown (메인 핸들러)**

```typescript
function handleKeyDown(event: KeyboardEvent): void {
  // 키 매핑
  const keyHandlers: Record<string, () => void> = {
    'ArrowDown': handleArrowDown,
    'ArrowUp': handleArrowUp,
    'ArrowRight': handleArrowRight,
    'ArrowLeft': handleArrowLeft,
    'Enter': handleEnter,
    ' ': handleSpace,  // Space 키
    'Home': handleHome,
    'End': handleEnd,
    'Escape': handleEscape
  }

  const handler = keyHandlers[event.key]
  if (handler) {
    event.preventDefault()  // 기본 동작 방지 (스크롤 등)
    event.stopPropagation()  // 이벤트 버블링 방지
    handler()
  }
}
```

**2) handleArrowDown (다음 노드 이동)**

```typescript
function handleArrowDown(): void {
  if (flattenedNodes.value.length === 0) return

  // 현재 포커스된 노드 찾기
  const currentIndex = getCurrentIndex()

  // 다음 노드로 이동
  const nextIndex = Math.min(currentIndex + 1, flattenedNodes.value.length - 1)
  const nextNode = flattenedNodes.value[nextIndex]

  if (nextNode) {
    focusNode(nextNode.id)
  }
}
```

**3) handleArrowUp (이전 노드 이동)**

```typescript
function handleArrowUp(): void {
  if (flattenedNodes.value.length === 0) return

  const currentIndex = getCurrentIndex()
  const prevIndex = Math.max(currentIndex - 1, 0)
  const prevNode = flattenedNodes.value[prevIndex]

  if (prevNode) {
    focusNode(prevNode.id)
  }
}
```

**4) handleArrowRight (펼치기 또는 자식 이동)**

```typescript
function handleArrowRight(): void {
  if (!focusedNodeId.value) return

  const { isExpanded, toggleNode } = useTreeInteraction()
  const wbsStore = useWbsStore()
  const node = wbsStore.getNode(focusedNodeId.value)

  if (!node || !node.children || node.children.length === 0) {
    return  // 자식이 없으면 무시
  }

  if (!isExpanded(node.id)) {
    // 접혀있으면 펼치기
    toggleNode(node.id)
  } else {
    // 이미 펼쳐져 있으면 첫 번째 자식으로 이동
    const firstChild = node.children[0]
    if (firstChild) {
      focusNode(firstChild.id)
    }
  }
}
```

**5) handleArrowLeft (접기 또는 부모 이동)**

```typescript
function handleArrowLeft(): void {
  if (!focusedNodeId.value) return

  const { isExpanded, toggleNode } = useTreeInteraction()
  const wbsStore = useWbsStore()
  const node = wbsStore.getNode(focusedNodeId.value)

  if (!node) return

  if (isExpanded(node.id) && node.children && node.children.length > 0) {
    // 펼쳐져 있으면 접기
    toggleNode(node.id)
  } else {
    // 이미 접혀있으면 부모로 이동
    const parent = findParentNode(node.id)
    if (parent) {
      focusNode(parent.id)
    }
  }
}
```

**6) handleEnter (노드 선택)**

```typescript
function handleEnter(): void {
  if (!focusedNodeId.value) return

  if (options.onNodeSelect) {
    options.onNodeSelect(focusedNodeId.value)
  }
}
```

**7) handleSpace (토글)**

```typescript
function handleSpace(): void {
  if (!focusedNodeId.value) return

  const { toggleNode } = useTreeInteraction()
  const wbsStore = useWbsStore()
  const node = wbsStore.getNode(focusedNodeId.value)

  if (node && node.children && node.children.length > 0) {
    toggleNode(node.id)
  }
}
```

**8) handleHome / handleEnd (첫/마지막 노드)**

```typescript
function handleHome(): void {
  if (flattenedNodes.value.length === 0) return
  const firstNode = flattenedNodes.value[0]
  if (firstNode) {
    focusNode(firstNode.id)
  }
}

function handleEnd(): void {
  if (flattenedNodes.value.length === 0) return
  const lastNode = flattenedNodes.value[flattenedNodes.value.length - 1]
  if (lastNode) {
    focusNode(lastNode.id)
  }
}
```

**9) handleEscape (선택 해제)**

```typescript
function handleEscape(): void {
  const selectionStore = useSelectionStore()
  selectionStore.clearSelection()
}
```

#### 2.3.6 헬퍼 함수

**1) getCurrentIndex (현재 인덱스 찾기)**

```typescript
function getCurrentIndex(): number {
  if (!focusedNodeId.value) return 0

  const index = flattenedNodes.value.findIndex(
    node => node.id === focusedNodeId.value
  )

  return index >= 0 ? index : 0
}
```

**2) findParentNode (부모 노드 찾기)**

```typescript
function findParentNode(nodeId: string): WbsNode | null {
  const wbsStore = useWbsStore()

  // 재귀 탐색
  function search(nodes: WbsNode[], target: string): WbsNode | null {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        // 직접 자식인지 확인
        if (node.children.some(child => child.id === target)) {
          return node
        }

        // 재귀 탐색
        const parent = search(node.children, target)
        if (parent) return parent
      }
    }
    return null
  }

  return search(options.treeRoot.value || [], nodeId)
}
```

**3) focusNode (포커스 이동)**

```typescript
function focusNode(nodeId: string): void {
  focusedNodeId.value = nodeId

  // DOM 포커스 및 스크롤 조정
  nextTick(() => {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement
    if (element) {
      element.focus()

      // 스크롤 조정 (부드럽게)
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })

      // 콜백 호출
      if (options.onFocusChange) {
        options.onFocusChange(nodeId, element)
      }
    }
  })
}
```

#### 2.3.7 에러 처리

| 상황 | 처리 방법 | 복구 전략 |
|------|----------|----------|
| 평면화 배열 비어있음 | early return | 무시 (안전) |
| 노드 찾을 수 없음 | early return | 무시 (안전) |
| DOM 요소 찾을 수 없음 | console.warn | 무시 (다음 렌더링 대기) |
| 부모 노드 없음 (루트) | early return | 무시 (루트는 부모 없음) |

#### 2.3.8 성능 고려사항

- **평면화 캐싱**: computed로 자동 메모이제이션
- **이벤트 버블링**: stopPropagation으로 중복 처리 방지
- **스크롤 최적화**: smooth behavior + block: 'nearest'
- **nextTick 사용**: DOM 업데이트 후 포커스 이동

---

## 3. 통합 시나리오

### 3.1 컴포넌트 통합 예시

**WbsTreeNode.vue**:

```vue
<script setup lang="ts">
import { useTreeInteraction } from '~/composables/useTreeInteraction'
import type { WbsNode } from '~/types/index'

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
const handleSelect = async () => {
  await selectNode(props.node.id)
}

// 더블클릭 시 토글
const handleDoubleClick = () => {
  if (props.node.children && props.node.children.length > 0) {
    toggleNode(props.node.id)
  }
}

// 상태 계산
const expanded = computed(() => isExpanded(props.node.id))
const selected = computed(() => isSelected(props.node.id))
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
</script>

<template>
  <div
    class="wbs-tree-node"
    :class="{ selected }"
    :data-node-id="node.id"
    :data-depth="depth"
    tabindex="-1"
    @click="handleSelect"
    @dblclick="handleDoubleClick"
  >
    <!-- 토글 버튼 -->
    <Button
      v-if="hasChildren"
      :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
      text
      rounded
      size="small"
      @click.stop="handleToggle"
    />

    <!-- 노드 콘텐츠 -->
    <span>{{ node.title }}</span>
  </div>

  <!-- 자식 노드 (조건부 렌더링) -->
  <div v-if="expanded && hasChildren" class="tree-children">
    <WbsTreeNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :depth="(depth || 0) + 1"
    />
  </div>
</template>
```

**WbsTreePanel.vue**:

```vue
<script setup lang="ts">
import { useWbsStore } from '~/stores/wbs'
import { useKeyboardNav } from '~/composables/useKeyboardNav'
import { useTreePersistence } from '~/composables/useTreePersistence'
import { useTreeInteraction } from '~/composables/useTreeInteraction'

const route = useRoute()
const wbsStore = useWbsStore()
const projectId = computed(() => route.query.projectId as string)

// 키보드 네비게이션
const { handleKeyDown } = useKeyboardNav({
  treeRoot: computed(() => wbsStore.tree),
  onNodeSelect: async (nodeId) => {
    const { selectNode } = useTreeInteraction()
    await selectNode(nodeId)
  }
})

// 상태 영속성
const { restoreExpandedState, saveExpandedState } = useTreePersistence({
  projectId: projectId.value
})

onMounted(async () => {
  await wbsStore.fetchWbs(projectId.value)
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
    <WbsTreeNode
      v-for="node in wbsStore.tree"
      :key="node.id"
      :node="node"
      :depth="0"
    />
  </div>
</template>
```

### 3.2 라이프사이클 흐름

```
1. WbsTreePanel 마운트
   ↓
2. fetchWbs(projectId) → 트리 데이터 로드
   ↓
3. restoreExpandedState() → 로컬 스토리지에서 상태 복원
   ↓
4. WbsTreeNode 렌더링 (복원된 상태 반영)
   ↓
5. 사용자 인터랙션:
   - 클릭 → selectNode()
   - 더블클릭 → toggleNode()
   - 키보드 → handleKeyDown()
   ↓
6. 상태 변경 → watch 트리거 → saveExpandedState()
   ↓
7. 컴포넌트 언마운트 → 자동 저장 (watch cleanup)
```

---

## 4. 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────┬──────────────┬──────────────┬────────────────┐
│ Click        │ DoubleClick  │ Keyboard     │ Header Button  │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Composables Layer                         │
│  ┌────────────────┬────────────────┬──────────────────┐     │
│  │ useTree        │ useKeyboard    │ useTree          │     │
│  │ Interaction    │ Nav            │ Persistence      │     │
│  └────────────────┴────────────────┴──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Pinia Stores                             │
│  ┌──────────────────────┬──────────────────────┐            │
│  │ useWbsStore          │ useSelectionStore    │            │
│  │ - expandedNodes      │ - selectedNodeId     │            │
│  │ - toggleExpand()     │ - selectNode()       │            │
│  └──────────────────────┴──────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────┬──────────────────────────────────┐
│ Vue Reactivity           │ LocalStorage                     │
│ (Computed, Watch)        │ (Persistence)                    │
└──────────────────────────┴──────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    UI Update                                │
│  - Node expand/collapse animation                          │
│  - Selection highlight                                      │
│  - Focus indicator                                          │
│  - Scroll adjustment                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 에러 처리 전략

### 5.1 에러 분류

| 에러 레벨 | 처리 방법 | 예시 |
|---------|----------|------|
| **Critical** | throw + 복구 | Task 로드 실패 (API 에러) |
| **Warning** | console.warn + continue | 노드 찾을 수 없음 |
| **Info** | console.info + silent | 저장된 상태 없음 |
| **Debug** | console.debug (production 제외) | 상태 저장 성공 |

### 5.2 복구 전략

**1) Task 로드 실패**

```typescript
async function selectNode(nodeId: string): Promise<void> {
  try {
    await selectionStore.selectNode(nodeId)
  } catch (error) {
    // 선택 해제 (일관성 유지)
    selectionStore.clearSelection()

    // 사용자에게 알림
    console.error('Failed to load task:', error)

    // Toast 메시지 표시 (선택 사항)
    // useToast().add({ severity: 'error', summary: 'Failed to load task' })

    throw error  // 에러 전파 (호출자가 처리)
  }
}
```

**2) 로컬 스토리지 Quota 초과**

```typescript
function saveExpandedState(expandedNodes: Set<string>): void {
  try {
    localStorage.setItem(storageKey, json)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // 오래된 데이터 정리
      cleanupOldStorage()

      // 재시도 (1회만)
      try {
        localStorage.setItem(storageKey, json)
      } catch (retryError) {
        console.error('Failed to save state after cleanup:', retryError)
      }
    }
  }
}
```

**3) 유효하지 않은 노드**

```typescript
function restoreExpandedState(): void {
  const expandedNodes = new Set(data.expandedNodes || [])

  // 유효한 노드만 필터링
  const validNodes = new Set<string>()
  expandedNodes.forEach(nodeId => {
    if (wbsStore.getNode(nodeId)) {
      validNodes.add(nodeId)
    } else {
      console.debug('Skipping invalid node:', nodeId)
    }
  })

  wbsStore.expandedNodes = validNodes
}
```

---

## 6. 성능 최적화

### 6.1 반응성 최적화

**1) Computed vs 함수**

```typescript
// ❌ 비효율적 (매번 computed 생성)
const expanded = computed(() => isExpanded(nodeId))

// ✅ 효율적 (필요 시 호출)
const expanded = isExpanded(nodeId)
```

**2) Deep Watch 최적화**

```typescript
// ❌ 비효율적 (모든 속성 변경 감지)
watch(wbsStore, (newValue) => { ... }, { deep: true })

// ✅ 효율적 (특정 속성만 감지)
watch(() => wbsStore.expandedNodes, (expandedNodes) => { ... }, { deep: true })
```

**3) Debounce 적용**

```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
  saveExpandedState(expandedNodes)
}, 300)

watch(
  () => wbsStore.expandedNodes,
  (expandedNodes) => debouncedSave(expandedNodes),
  { deep: true }
)
```

### 6.2 평면화 최적화

**1) 메모이제이션 (Computed)**

```typescript
// ✅ 자동 캐싱 (expandedNodes 변경 시에만 재계산)
const flattenedNodes = computed<WbsNode[]>(() => {
  // 평면화 로직
})
```

**2) Early Return (조건부 렌더링)**

```vue
<!-- ✅ 펼쳐진 경우에만 자식 렌더링 -->
<div v-if="expanded && hasChildren" class="tree-children">
  <WbsTreeNode v-for="child in node.children" ... />
</div>
```

### 6.3 이벤트 최적화

**1) 이벤트 버블링 제어**

```typescript
// ✅ 토글 버튼 클릭 시 선택 이벤트 방지
<Button @click.stop="handleToggle" />
```

**2) Passive Event Listener (향후 고려)**

```typescript
// 스크롤 성능 향상 (터치 디바이스)
window.addEventListener('touchmove', handler, { passive: true })
```

---

## 7. 테스트 전략

### 7.1 단위 테스트 (Vitest)

**useTreeInteraction 테스트**:
```typescript
describe('useTreeInteraction', () => {
  it('should toggle node expansion', () => {
    const { toggleNode, isExpanded } = useTreeInteraction()
    const nodeId = 'WP-01'

    expect(isExpanded(nodeId)).toBe(false)
    toggleNode(nodeId)
    expect(isExpanded(nodeId)).toBe(true)
  })

  it('should select node and load task detail', async () => {
    const { selectNode, isSelected } = useTreeInteraction()
    const taskId = 'TSK-01-01-01'

    await selectNode(taskId)
    expect(isSelected(taskId)).toBe(true)
  })
})
```

**useTreePersistence 테스트**:
```typescript
describe('useTreePersistence', () => {
  it('should save and restore expanded state', () => {
    const { saveExpandedState, restoreExpandedState } = useTreePersistence({
      projectId: 'test-project'
    })

    const expandedNodes = new Set(['WP-01', 'ACT-01-01'])
    saveExpandedState(expandedNodes)

    // 로컬 스토리지 확인
    const stored = localStorage.getItem('jjiban:tree:test-project:expanded')
    expect(stored).toBeTruthy()

    // 복원 테스트
    restoreExpandedState()
    // 스토어 상태 확인
  })
})
```

**useKeyboardNav 테스트**:
```typescript
describe('useKeyboardNav', () => {
  it('should navigate to next node on ArrowDown', () => {
    const { handleKeyDown, focusedNodeId } = useKeyboardNav({
      treeRoot: ref(mockTreeData)
    })

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event)

    expect(focusedNodeId.value).not.toBeNull()
  })
})
```

### 7.2 통합 테스트 (Playwright)

**키보드 네비게이션 E2E**:
```typescript
test('should navigate tree with keyboard', async ({ page }) => {
  await page.goto('/wbs?projectId=test')

  // 트리에 포커스
  await page.locator('.wbs-tree-panel').focus()

  // ArrowDown으로 다음 노드 이동
  await page.keyboard.press('ArrowDown')

  // 포커스 확인
  const focused = await page.locator('[data-node-id]:focus')
  expect(await focused.count()).toBe(1)

  // Enter로 선택
  await page.keyboard.press('Enter')

  // 상세 패널 표시 확인
  const detailPanel = page.locator('.task-detail-panel')
  await expect(detailPanel).toBeVisible()
})
```

---

## 8. 인수 기준

- [ ] AC-01: useTreeInteraction 함수들이 정상 동작함
- [ ] AC-02: useTreePersistence가 로컬 스토리지에 상태 저장/복원함
- [ ] AC-03: useKeyboardNav가 모든 키 입력을 정확히 처리함
- [ ] AC-04: 평면화 알고리즘이 펼쳐진 노드만 포함함
- [ ] AC-05: 에러 발생 시 복구 전략이 작동함
- [ ] AC-06: 성능 최적화가 적용되어 60fps 유지됨
- [ ] AC-07: 단위 테스트 커버리지 ≥80%
- [ ] AC-08: E2E 테스트 통과 (키보드 네비게이션, 영속성)

---

## 9. 다음 단계

### 9.1 구현 단계 (/wf:build)

1. **useTreeInteraction.ts 작성** (우선순위 1)
   - toggleNode, selectNode, expandAll, collapseAll 구현
   - 스토어 연동 및 에러 처리

2. **useTreePersistence.ts 작성** (우선순위 2)
   - 로컬 스토리지 읽기/쓰기
   - 자동 저장 watch 설정
   - 오래된 데이터 정리 로직

3. **useKeyboardNav.ts 작성** (우선순위 3)
   - 평면화 알고리즘
   - 키보드 이벤트 핸들러
   - 포커스 관리 및 스크롤 조정

4. **컴포넌트 통합**
   - WbsTreeNode에 useTreeInteraction 적용
   - WbsTreePanel에 useKeyboardNav, useTreePersistence 적용

### 9.2 검증 단계 (/wf:verify)

1. **단위 테스트 작성 및 실행**
   - Vitest로 각 Composable 테스트
   - 커버리지 ≥80% 목표

2. **E2E 테스트 작성 및 실행**
   - Playwright로 키보드 네비게이션 시나리오 테스트
   - 영속성 테스트 (새로고침 시 상태 복원)

3. **성능 테스트**
   - 1000개 노드 환경에서 프레임율 측정
   - 로컬 스토리지 크기 확인

---

## 10. 관련 문서

- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md` (다음 문서)
- 테스트 명세: `026-test-specification.md` (다음 문서)
- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-03)

---

<!--
Author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
Focus: Detailed implementation specifications for composables
Standards: TypeScript, Vue 3 Composition API, Pinia, LocalStorage API
Testing: Vitest (unit), Playwright (E2E)
-->
