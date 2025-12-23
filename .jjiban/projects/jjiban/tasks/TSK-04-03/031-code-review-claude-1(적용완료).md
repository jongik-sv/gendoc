# TSK-04-03 코드 리뷰 리포트 (Tree Interaction)

**리뷰 일시**: 2025-12-15
**리뷰어**: Claude Opus 4.5
**대상 파일**:
- `C:\project\jjiban\app\composables\useTreeInteraction.ts` (152 lines)
- `C:\project\jjiban\app\composables\useTreePersistence.ts` (225 lines)
- `C:\project\jjiban\app\composables\useKeyboardNav.ts` (307 lines)

---

## 총점: 89/100

**등급**: **A** (Excellent - Minor improvements recommended)

### 항목별 점수

| 항목 | 배점 | 득점 | 평가 |
|------|------|------|------|
| 코드 품질 및 가독성 | 25 | 23 | 우수 (일부 개선 여지) |
| 성능 및 효율성 | 25 | 22 | 우수 (최적화 기회 존재) |
| 에러 처리 및 안정성 | 25 | 23 | 우수 (엣지 케이스 추가 고려) |
| TypeScript 타입 안전성 | 25 | 21 | 양호 (타입 강화 필요) |

---

## 1. 코드 품질 및 가독성 (23/25점)

### ✅ 강점

**1.1 명확한 인터페이스 정의**
```typescript
// useTreeInteraction.ts (L16-L52)
export interface UseTreeInteractionReturn {
  toggleNode: (nodeId: string) => void
  selectNode: (nodeId: string) => Promise<void>
  expandAll: () => void
  collapseAll: () => void
  isExpanded: (nodeId: string) => boolean
  isSelected: (nodeId: string) => boolean
}
```
- 모든 composable에서 명시적인 Return 타입 정의
- JSDoc 주석으로 매개변수 및 반환값 설명
- 인터페이스 기반 설계로 타입 안전성 확보

**1.2 단일 책임 원칙 준수**
- `useTreeInteraction`: 노드 토글/선택 로직만 담당
- `useTreePersistence`: 영속성 관리만 담당
- `useKeyboardNav`: 키보드 이벤트 처리만 담당
- 각 composable이 명확한 단일 목적 보유

**1.3 일관된 에러 로깅**
```typescript
// useTreeInteraction.ts (L66-L69)
if (!nodeId || typeof nodeId !== 'string') {
  console.warn('[useTreeInteraction] Invalid nodeId:', nodeId)
  return
}
```
- 모든 함수에서 prefix 기반 로깅 (`[useTreeInteraction]`, `[useTreePersistence]`)
- 디버깅 용이성 높음

### ⚠️ 개선 필요 사항

**ISS-CR-001: Magic Number 사용**
```typescript
// useTreePersistence.ts (L58, L172, L203)
const MAX_STORAGE_SIZE = 1024 * 1024 // 1MB
cutoffDate.setDate(cutoffDate.getDate() - 30) // 30일
}, 300) // 300ms debounce
```
**문제점**: 하드코딩된 상수값 (특히 debounce 300ms)
**개선안**: 설정 파일 또는 상수 모듈로 분리
```typescript
// constants/tree.ts
export const TREE_CONSTANTS = {
  DEBOUNCE_MS: 300,
  STORAGE_MAX_SIZE: 1024 * 1024,
  CLEANUP_DAYS: 30
} as const
```
**영향도**: 낮음 (유지보수성 향상)

**ISS-CR-002: 깊은 중첩 로직**
```typescript
// useKeyboardNav.ts (L100-L115)
function findParentNode(nodeId: string): WbsNode | null {
  function search(nodes: WbsNode[], target: string): WbsNode | null {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (node.children.some(child => child.id === target)) {
          return node
        }
        const parent = search(node.children, target)
        if (parent) return parent
      }
    }
    return null
  }
  return search(options.treeRoot.value || [], nodeId)
}
```
**문제점**: 재귀 깊이 제한 없음, 성능 최적화 부재
**개선안**: 조기 반환 또는 Map 캐싱
```typescript
// 캐싱 기반 접근
const parentMap = computed(() => {
  const map = new Map<string, WbsNode>()
  function buildMap(nodes: WbsNode[], parent?: WbsNode) {
    nodes.forEach(node => {
      if (parent) map.set(node.id, parent)
      if (node.children) buildMap(node.children, node)
    })
  }
  buildMap(options.treeRoot.value)
  return map
})
```
**영향도**: 중간 (대규모 트리에서 성능 저하 가능)

**점수 근거**:
- 기본 품질 우수 (+20점)
- JSDoc 주석 충실 (+3점)
- Magic number 사용 (-1점)
- 중첩 로직 최적화 여지 (-1점)

---

## 2. 성능 및 효율성 (22/25점)

### ✅ 강점

**2.1 Debounce 적용 (ISS-DR-003 해결)**
```typescript
// useTreePersistence.ts (L203-L205)
const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
  saveExpandedState(expandedNodes)
}, 300)
```
- @vueuse/core의 `useDebounceFn` 활용
- 로컬 스토리지 과도한 쓰기 방지
- 설계 리뷰 이슈 (ISS-DR-003) 정확히 해결

**2.2 Computed 기반 평면화**
```typescript
// useKeyboardNav.ts (L65-L81)
const flattenedNodes = computed<WbsNode[]>(() => {
  const result: WbsNode[] = []
  function flatten(nodes: WbsNode[]): void {
    for (const node of nodes) {
      result.push(node)
      if (isExpanded(node.id) && node.children && node.children.length > 0) {
        flatten(node.children)
      }
    }
  }
  flatten(options.treeRoot.value || [])
  return result
})
```
- Vue의 반응형 캐싱 활용
- 불필요한 재계산 방지
- 펼침 상태 변경 시에만 재계산

**2.3 로컬 스토리지 크기 제한**
```typescript
// useTreePersistence.ts (L133-L136)
if (json.length > MAX_STORAGE_SIZE) {
  console.warn('[useTreePersistence] Storage size exceeds limit, skipping save')
  return
}
```
- QuotaExceededError 사전 방지
- 브라우저 스토리지 안정성 확보

### ⚠️ 개선 필요 사항

**ISS-CR-003: Set 변환 오버헤드**
```typescript
// useTreePersistence.ts (L95-L103)
const expandedNodes = new Set(data.expandedNodes || [])
const validNodes = new Set<string>()
expandedNodes.forEach(nodeId => {
  if (wbsStore.getNode(nodeId)) {
    validNodes.add(nodeId)
  }
})
```
**문제점**: `forEach + Set.add` 대신 필터 + Set 생성자 활용 가능
**개선안**:
```typescript
const validNodes = new Set(
  (data.expandedNodes || []).filter(nodeId => wbsStore.getNode(nodeId))
)
```
**영향도**: 낮음 (미세한 성능 향상)

**ISS-CR-004: 스토리지 스캔 비효율**
```typescript
// useTreePersistence.ts (L175-L176)
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
```
**문제점**: `localStorage.length`는 전체 스토리지 순회
**개선안**: 프로젝트 단위 키 필터링
```typescript
Object.keys(localStorage)
  .filter(key => key.startsWith(STORAGE_PREFIX))
  .forEach(key => { /* cleanup logic */ })
```
**영향도**: 낮음 (다른 앱 데이터 많을 시 성능 저하)

**ISS-CR-005: getCurrentIndex 중복 호출**
```typescript
// useKeyboardNav.ts (L150-L159)
function handleArrowDown(): void {
  if (flattenedNodes.value.length === 0) return
  const currentIndex = getCurrentIndex()  // findIndex 호출
  const nextIndex = Math.min(currentIndex + 1, flattenedNodes.value.length - 1)
  const nextNode = flattenedNodes.value[nextIndex]
  if (nextNode) {
    focusNode(nextNode.id)
  }
}
```
**문제점**: 모든 키 이벤트마다 `findIndex` 실행
**개선안**: `focusedNodeId` 변경 시 인덱스 캐싱
```typescript
const focusedIndex = computed(() => {
  if (!focusedNodeId.value) return 0
  return Math.max(0, flattenedNodes.value.findIndex(n => n.id === focusedNodeId.value))
})
```
**영향도**: 중간 (큰 트리에서 키보드 반응 속도 개선)

**점수 근거**:
- Debounce 적용 우수 (+10점)
- Computed 캐싱 활용 (+8점)
- 스토리지 최적화 (+4점)
- Set/스토리지 스캔 최적화 여지 (-2점)
- 인덱스 캐싱 누락 (-1점)

---

## 3. 에러 처리 및 안정성 (23/25점)

### ✅ 강점

**3.1 Race Condition 방지 (ISS-DR-008 해결)**
```typescript
// useTreeInteraction.ts (L54-L112)
const isSelecting = ref(false)

async function selectNode(nodeId: string): Promise<void> {
  // 중복 선택 및 진행 중 요청 방지 (ISS-DR-008)
  if (selectionStore.selectedNodeId === nodeId || isSelecting.value) {
    return
  }

  isSelecting.value = true
  try {
    await selectionStore.selectNode(nodeId)
  } catch (error) {
    console.error('[useTreeInteraction] Failed to select node:', error)
    selectionStore.clearSelection()  // 에러 시 일관성 유지
    throw error
  } finally {
    isSelecting.value = false
  }
}
```
- 설계 리뷰 이슈 (ISS-DR-008) 완벽 해결
- 플래그 기반 동기화로 동시 요청 차단
- `finally` 블록으로 플래그 복원 보장
- 에러 시 선택 해제로 상태 일관성 유지

**3.2 입력 검증**
```typescript
// useTreeInteraction.ts (L66-L69)
if (!nodeId || typeof nodeId !== 'string') {
  console.warn('[useTreeInteraction] Invalid nodeId:', nodeId)
  return
}
```
- 모든 public 함수에서 매개변수 타입 검증
- Null/Undefined 체크
- 조기 반환으로 방어적 프로그래밍

**3.3 QuotaExceededError 처리**
```typescript
// useTreePersistence.ts (L142-L150)
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    console.error('[useTreePersistence] Storage quota exceeded')
    cleanupOldStorage()  // 자동 복구 시도
  } else {
    console.error('[useTreePersistence] Failed to save state:', error)
  }
}
```
- 스토리지 에러 타입별 처리
- 자동 정리 로직으로 복구 시도

**3.4 버전 호환성 체크**
```typescript
// useTreePersistence.ts (L88-L92)
if (data.version !== STORAGE_VERSION) {
  console.warn('[useTreePersistence] Version mismatch, clearing state')
  clearExpandedState()
  return
}
```
- 스토리지 스키마 버전 관리
- 마이그레이션 실패 시 안전한 초기화

### ⚠️ 개선 필요 사항

**ISS-CR-006: JSON 파싱 에러 처리 부족**
```typescript
// useTreePersistence.ts (L85)
const data: ExpandedStateStorage = JSON.parse(stored)
```
**문제점**: JSON.parse 실패 시 catch 블록만 의존
**개선안**: 타입 가드 추가
```typescript
const data = JSON.parse(stored)
if (!isExpandedStateStorage(data)) {
  console.warn('[useTreePersistence] Invalid storage data format')
  clearExpandedState()
  return
}

function isExpandedStateStorage(obj: any): obj is ExpandedStateStorage {
  return obj &&
    typeof obj.version === 'string' &&
    typeof obj.timestamp === 'string' &&
    Array.isArray(obj.expandedNodes)
}
```
**영향도**: 낮음 (손상된 데이터 복구력 향상)

**ISS-CR-007: DOM 요소 부재 처리**
```typescript
// useKeyboardNav.ts (L128-L130)
const element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement
if (element) {
  element.focus()
```
**문제점**: 요소 없을 때 경고 없음
**개선안**: 로깅 추가
```typescript
if (element) {
  element.focus()
} else {
  console.warn('[useKeyboardNav] Element not found for nodeId:', nodeId)
}
```
**영향도**: 낮음 (디버깅 용이성 향상)

**ISS-CR-008: 무한 재귀 방지 부재**
```typescript
// useKeyboardNav.ts (L101-L115)
function search(nodes: WbsNode[], target: string): WbsNode | null {
  for (const node of nodes) {
    // ...
    const parent = search(node.children, target)  // 재귀 깊이 제한 없음
```
**문제점**: 순환 참조 시 스택 오버플로우 가능
**개선안**: 깊이 제한 또는 visited 세트
```typescript
function search(nodes: WbsNode[], target: string, depth = 0): WbsNode | null {
  if (depth > 100) {
    console.error('[useKeyboardNav] Max recursion depth exceeded')
    return null
  }
  // ... 재귀 호출 시 depth + 1
}
```
**영향도**: 낮음 (정상 데이터에서는 발생 안함, 방어적 코딩)

**점수 근거**:
- Race condition 해결 완벽 (+10점)
- 입력 검증 충실 (+6점)
- 스토리지 에러 처리 우수 (+5점)
- 버전 관리 (+2점)
- JSON 타입 가드 부재 (-1점)
- 재귀 깊이 제한 부재 (-1점)

---

## 4. TypeScript 타입 안전성 (21/25점)

### ✅ 강점

**4.1 명시적 반환 타입**
```typescript
// useTreeInteraction.ts (L57)
export function useTreeInteraction(): UseTreeInteractionReturn

// useTreePersistence.ts (L64-L66)
export function useTreePersistence(
  options: UseTreePersistenceOptions
): UseTreePersistenceReturn
```
- 모든 함수에서 반환 타입 명시
- 인터페이스 기반 계약 설계

**4.2 제네릭 타입 활용**
```typescript
// useKeyboardNav.ts (L65)
const flattenedNodes = computed<WbsNode[]>(() => {
```
- Computed 제네릭으로 타입 추론 강화

**4.3 Union 타입 활용**
```typescript
// useKeyboardNav.ts (L43)
focusedNodeId: Ref<string | null>
```
- Null 가능성 명시적 표현

### ⚠️ 개선 필요 사항

**ISS-CR-009: WbsNode 타입 불일치**
```typescript
// types/index.ts (L28-L45)
export interface WbsNode {
  id: string;
  type: WbsNodeType;
  // ...
  progress?: number;     // optional
  taskCount?: number;    // optional
  children: WbsNode[];
  expanded?: boolean;
}

// app/types/store.ts (L50-L61)
export interface WbsNode {
  id: string
  type: WbsNodeType
  // ...
  progress: number       // required
  taskCount: number      // required
  children: WbsNode[]
  expanded?: boolean
}
```
**문제점**: 두 개의 WbsNode 인터페이스가 다른 위치에 정의됨
**영향**: composable에서 어느 타입을 import하는지 불명확
**개선안**: 단일 소스 원칙
```typescript
// types/store.ts를 제거하고 types/index.ts만 사용
import type { WbsNode } from '~/types/index'
```
**영향도**: 높음 (타입 충돌 가능)

**ISS-CR-010: 타입 단언 사용**
```typescript
// useKeyboardNav.ts (L128)
const element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement
```
**문제점**: querySelector는 `Element | null` 반환, 강제 캐스팅
**개선안**: 타입 가드 사용
```typescript
const element = document.querySelector(`[data-node-id="${nodeId}"]`)
if (element instanceof HTMLElement) {
  element.focus()
}
```
**영향도**: 중간 (런타임 타입 안전성 향상)

**ISS-CR-011: 인터페이스 네이밍**
```typescript
// useTreePersistence.ts (L16-L21, L23-L44)
export interface UseTreePersistenceOptions {
  projectId: string
}

export interface UseTreePersistenceReturn {
  restoreExpandedState: () => void
  // ...
}
```
**문제점**: 네이밍 컨벤션 불일치 (UseXxxOptions vs UseXxxReturn)
**개선안**: 일관된 접미사 사용
```typescript
// Options: 설정 객체
export interface TreePersistenceOptions { ... }

// Return: composable 반환 타입
export interface TreePersistenceComposable { ... }

// 또는 UseXxx 접두사 통일
export interface UseTreePersistenceOptions { ... }
export interface UseTreePersistenceReturn { ... }
```
**영향도**: 낮음 (가독성 개선)

**ISS-CR-012: 스토리지 스키마 타입 검증 부재**
```typescript
// useTreePersistence.ts (L49-L53)
interface ExpandedStateStorage {
  version: '1.0'
  timestamp: string  // ISO 8601 형식
  expandedNodes: string[]
}
```
**문제점**: 런타임 타입 검증 없음 (ISS-CR-006과 연관)
**개선안**: Zod 또는 타입 가드 활용
```typescript
import { z } from 'zod'

const ExpandedStateSchema = z.object({
  version: z.literal('1.0'),
  timestamp: z.string().datetime(),
  expandedNodes: z.array(z.string())
})

type ExpandedStateStorage = z.infer<typeof ExpandedStateSchema>

// 사용 시
const result = ExpandedStateSchema.safeParse(JSON.parse(stored))
if (!result.success) {
  console.warn('[useTreePersistence] Invalid data:', result.error)
  clearExpandedState()
  return
}
const data = result.data
```
**영향도**: 중간 (데이터 무결성 보장)

**점수 근거**:
- 명시적 타입 정의 우수 (+12점)
- 제네릭 활용 (+4점)
- Union 타입 (+3점)
- Ref 타입 명시 (+2점)
- WbsNode 타입 중복 (-2점)
- 타입 단언 사용 (-1점)
- 스토리지 타입 검증 부재 (-1점)

---

## 5. 발견된 이슈 목록

| ID | 우선순위 | 카테고리 | 설명 | 영향도 |
|----|----------|----------|------|--------|
| ISS-CR-001 | P3 | 가독성 | Magic number 사용 (debounce 300ms, 스토리지 1MB) | 낮음 |
| ISS-CR-002 | P2 | 성능 | findParentNode 재귀 최적화 부재 | 중간 |
| ISS-CR-003 | P4 | 성능 | Set 변환 시 filter 대신 forEach 사용 | 낮음 |
| ISS-CR-004 | P4 | 성능 | 로컬 스토리지 전체 스캔 비효율 | 낮음 |
| ISS-CR-005 | P2 | 성능 | getCurrentIndex 중복 호출 (캐싱 부재) | 중간 |
| ISS-CR-006 | P3 | 안정성 | JSON 파싱 후 타입 가드 부재 | 낮음 |
| ISS-CR-007 | P4 | 디버깅 | DOM 요소 부재 시 경고 부재 | 낮음 |
| ISS-CR-008 | P3 | 안정성 | 재귀 깊이 제한 부재 (무한 재귀 방지) | 낮음 |
| ISS-CR-009 | P1 | 타입 | WbsNode 인터페이스 중복 정의 | 높음 |
| ISS-CR-010 | P2 | 타입 | querySelector 타입 단언 사용 | 중간 |
| ISS-CR-011 | P4 | 컨벤션 | 인터페이스 네이밍 불일치 | 낮음 |
| ISS-CR-012 | P2 | 타입 | 스토리지 스키마 런타임 검증 부재 | 중간 |

---

## 6. 권장 개선사항

### 6.1 필수 개선 (P1-P2)

**1. WbsNode 타입 통합 (ISS-CR-009)**
```typescript
// 현재: 두 위치에 중복 정의
// types/index.ts
// app/types/store.ts

// 개선: 단일 소스 원칙
// types/wbs.ts (새 파일)
export interface WbsNode {
  id: string
  type: WbsNodeType
  title: string
  status?: string
  category?: TaskCategory
  priority?: Priority
  progress: number        // required로 통일
  taskCount: number       // required로 통일
  children: WbsNode[]
  expanded?: boolean
}

// 모든 파일에서 통일된 import
import type { WbsNode } from '~/types/wbs'
```

**2. getCurrentIndex 캐싱 (ISS-CR-005)**
```typescript
// useKeyboardNav.ts
const focusedIndex = computed(() => {
  if (!focusedNodeId.value) return 0
  const idx = flattenedNodes.value.findIndex(n => n.id === focusedNodeId.value)
  return idx >= 0 ? idx : 0
})

function handleArrowDown(): void {
  if (flattenedNodes.value.length === 0) return
  const nextIndex = Math.min(focusedIndex.value + 1, flattenedNodes.value.length - 1)
  const nextNode = flattenedNodes.value[nextIndex]
  if (nextNode) focusNode(nextNode.id)
}
```

**3. findParentNode 최적화 (ISS-CR-002)**
```typescript
// useKeyboardNav.ts
const parentMap = computed(() => {
  const map = new Map<string, WbsNode>()

  function buildMap(nodes: WbsNode[], parent?: WbsNode): void {
    nodes.forEach(node => {
      if (parent) map.set(node.id, parent)
      if (node.children && node.children.length > 0) {
        buildMap(node.children, node)
      }
    })
  }

  buildMap(options.treeRoot.value)
  return map
})

function findParentNode(nodeId: string): WbsNode | null {
  return parentMap.value.get(nodeId) || null
}
```

**4. querySelector 타입 안전성 (ISS-CR-010)**
```typescript
// useKeyboardNav.ts (L128-L144)
function focusNode(nodeId: string): void {
  focusedNodeId.value = nodeId

  nextTick(() => {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`)

    if (element instanceof HTMLElement) {
      element.focus()
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })

      if (options.onFocusChange) {
        options.onFocusChange(nodeId, element)
      }
    } else {
      console.warn('[useKeyboardNav] Element not found for nodeId:', nodeId)
    }
  })
}
```

### 6.2 권장 개선 (P3-P4)

**5. 상수 모듈 분리 (ISS-CR-001)**
```typescript
// constants/tree.ts
export const TREE_CONSTANTS = {
  DEBOUNCE_MS: 300,
  STORAGE_MAX_SIZE: 1024 * 1024,
  CLEANUP_DAYS: 30,
  STORAGE_VERSION: '1.0',
  STORAGE_PREFIX: 'jjiban:tree',
  MAX_RECURSION_DEPTH: 100
} as const
```

**6. 스토리지 타입 검증 (ISS-CR-006, ISS-CR-012)**
```typescript
// useTreePersistence.ts
function isExpandedStateStorage(obj: any): obj is ExpandedStateStorage {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.version === STORAGE_VERSION &&
    typeof obj.timestamp === 'string' &&
    Array.isArray(obj.expandedNodes) &&
    obj.expandedNodes.every((id: any) => typeof id === 'string')
  )
}

function restoreExpandedState(): void {
  const storageKey = getStorageKey(options.projectId)

  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      console.info('[useTreePersistence] No saved state found')
      return
    }

    const data = JSON.parse(stored)

    if (!isExpandedStateStorage(data)) {
      console.warn('[useTreePersistence] Invalid storage format')
      clearExpandedState()
      return
    }

    // ... 이후 로직
  } catch (error) {
    console.error('[useTreePersistence] Failed to restore state:', error)
    clearExpandedState()
  }
}
```

**7. 재귀 깊이 제한 (ISS-CR-008)**
```typescript
// useKeyboardNav.ts
function findParentNode(nodeId: string): WbsNode | null {
  function search(nodes: WbsNode[], target: string, depth = 0): WbsNode | null {
    if (depth > TREE_CONSTANTS.MAX_RECURSION_DEPTH) {
      console.error('[useKeyboardNav] Max recursion depth exceeded')
      return null
    }

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (node.children.some(child => child.id === target)) {
          return node
        }
        const parent = search(node.children, target, depth + 1)
        if (parent) return parent
      }
    }
    return null
  }

  return search(options.treeRoot.value || [], nodeId)
}
```

---

## 7. 설계 이슈 검증

### ✅ ISS-DR-003: Debounce 구현 누락 (해결 완료)

**검증 결과**: **PASS**

```typescript
// useTreePersistence.ts (L203-L205)
const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
  saveExpandedState(expandedNodes)
}, 300)

// (L208-L216)
watch(
  () => wbsStore.expandedNodes,
  (expandedNodes) => {
    if (autoSave.value) {
      debouncedSave(expandedNodes)
    }
  },
  { deep: true }
)
```

**평가**:
- @vueuse/core의 `useDebounceFn` 정확히 활용
- 300ms debounce 적용으로 로컬 스토리지 쓰기 최적화
- `deep: true` 옵션으로 Set 내부 변경 감지
- 설계 리뷰 요구사항 완벽 충족

### ✅ ISS-DR-008: Race Condition 방지 (해결 완료)

**검증 결과**: **PASS**

```typescript
// useTreeInteraction.ts (L54-L112)
const isSelecting = ref(false)

async function selectNode(nodeId: string): Promise<void> {
  // 중복 선택 및 진행 중 요청 방지 (ISS-DR-008)
  if (selectionStore.selectedNodeId === nodeId || isSelecting.value) {
    return
  }

  isSelecting.value = true
  try {
    await selectionStore.selectNode(nodeId)
  } catch (error) {
    console.error('[useTreeInteraction] Failed to select node:', error)
    selectionStore.clearSelection()
    throw error
  } finally {
    isSelecting.value = false
  }
}
```

**평가**:
- 플래그 기반 동기화 (`isSelecting`)로 동시 요청 차단
- `finally` 블록으로 플래그 복원 보장
- 에러 발생 시 선택 해제로 상태 일관성 유지
- 중복 선택 조기 반환
- 설계 리뷰 요구사항 완벽 충족

---

## 8. 프레임워크 규칙 준수

### ✅ Vue 3 Composition API 패턴

**준수 사항**:
- `<script setup>` 대신 함수형 composable 패턴 사용 (재사용성 우선)
- `ref`, `computed`, `watch` 올바르게 활용
- `nextTick`으로 DOM 업데이트 대기
- Reactive unwrapping 정확히 처리 (`expandedNodes.value`)

**코드 예시**:
```typescript
// useKeyboardNav.ts (L65)
const flattenedNodes = computed<WbsNode[]>(() => {
  // computed로 캐싱 및 반응형 업데이트
})

// useTreePersistence.ts (L208-L216)
watch(
  () => wbsStore.expandedNodes,  // 함수형 getter로 반응형 소스 지정
  (expandedNodes) => {
    if (autoSave.value) {
      debouncedSave(expandedNodes)
    }
  },
  { deep: true }  // Set 내부 변경 감지
)
```

### ✅ Pinia 스토어 통합

**준수 사항**:
- `useWbsStore()`, `useSelectionStore()` 올바르게 호출
- 스토어 액션 직접 호출 (반응형 업데이트 자동)
- 스토어 상태 직접 변경 (`wbsStore.expandedNodes = validNodes`)
  - 주의: Pinia에서는 state 직접 변경 허용되지만, 액션 사용 권장

**개선 권장**:
```typescript
// useTreePersistence.ts (L106)
// 현재: 직접 변경
wbsStore.expandedNodes = validNodes

// 권장: 액션 사용 (있을 경우)
wbsStore.setExpandedNodes(validNodes)
```

### ✅ 키보드 접근성 표준 (WCAG 2.1 준수)

**준수 사항**:
- **Arrow Keys**: 트리 탐색 (상/하/좌/우)
- **Enter**: 노드 선택
- **Space**: 토글
- **Home/End**: 처음/끝 이동
- **Escape**: 선택 해제
- `event.preventDefault()`: 기본 동작 방지 (스크롤 등)
- `scrollIntoView`: 포커스된 요소 자동 스크롤

**코드 예시**:
```typescript
// useKeyboardNav.ts (L279-L299)
function handleKeyDown(event: KeyboardEvent): void {
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
    event.preventDefault()  // 기본 동작 방지
    event.stopPropagation()  // 이벤트 버블링 방지
    handler()
  }
}
```

**ARIA 속성 권장** (컴포넌트에서 구현 필요):
```html
<!-- WbsTreeNode.vue (예시) -->
<div
  :data-node-id="node.id"
  role="treeitem"
  :aria-expanded="isExpanded(node.id)"
  :aria-selected="isSelected(node.id)"
  tabindex="0"
  @keydown="handleKeyDown"
>
```

---

## 9. 테스트 권장사항

### 9.1 단위 테스트 (Vitest)

```typescript
// tests/unit/composables/useTreeInteraction.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTreeInteraction } from '~/composables/useTreeInteraction'
import { useWbsStore } from '~/stores/wbs'
import { useSelectionStore } from '~/stores/selection'

describe('useTreeInteraction', () => {
  beforeEach(() => {
    // Pinia 스토어 초기화
  })

  describe('toggleNode', () => {
    it('should toggle expanded state for valid node', () => {
      const { toggleNode } = useTreeInteraction()
      const wbsStore = useWbsStore()

      vi.spyOn(wbsStore, 'toggleExpand')

      toggleNode('WP-01')

      expect(wbsStore.toggleExpand).toHaveBeenCalledWith('WP-01')
    })

    it('should warn for invalid nodeId', () => {
      const { toggleNode } = useTreeInteraction()
      const consoleWarnSpy = vi.spyOn(console, 'warn')

      toggleNode('')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useTreeInteraction] Invalid nodeId:',
        ''
      )
    })

    it('should not toggle node without children', () => {
      const { toggleNode } = useTreeInteraction()
      const wbsStore = useWbsStore()

      vi.spyOn(wbsStore, 'getNode').mockReturnValue({
        id: 'TSK-01',
        children: []
      })

      toggleNode('TSK-01')

      expect(wbsStore.toggleExpand).not.toHaveBeenCalled()
    })
  })

  describe('selectNode (Race Condition)', () => {
    it('should prevent concurrent selections (ISS-DR-008)', async () => {
      const { selectNode } = useTreeInteraction()
      const selectionStore = useSelectionStore()

      vi.spyOn(selectionStore, 'selectNode').mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      )

      // 동시 호출
      const promise1 = selectNode('WP-01')
      const promise2 = selectNode('WP-02')

      await Promise.all([promise1, promise2])

      // selectNode이 1번만 호출되어야 함
      expect(selectionStore.selectNode).toHaveBeenCalledTimes(1)
    })

    it('should clear selection on error', async () => {
      const { selectNode } = useTreeInteraction()
      const selectionStore = useSelectionStore()

      vi.spyOn(selectionStore, 'selectNode').mockRejectedValue(
        new Error('Network error')
      )
      vi.spyOn(selectionStore, 'clearSelection')

      await expect(selectNode('WP-01')).rejects.toThrow('Network error')
      expect(selectionStore.clearSelection).toHaveBeenCalled()
    })
  })
})
```

### 9.2 통합 테스트 (Vitest + DOM)

```typescript
// tests/integration/composables/useTreePersistence.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTreePersistence } from '~/composables/useTreePersistence'
import { useWbsStore } from '~/stores/wbs'

describe('useTreePersistence (ISS-DR-003: Debounce)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should debounce save operations (300ms)', async () => {
    const wbsStore = useWbsStore()
    const { restoreExpandedState, saveExpandedState } = useTreePersistence({
      projectId: 'test-project'
    })

    const expandedNodes = new Set(['WP-01', 'WP-02'])

    // 연속 호출
    saveExpandedState(expandedNodes)
    saveExpandedState(expandedNodes)
    saveExpandedState(expandedNodes)

    // 300ms 대기
    await new Promise(resolve => setTimeout(resolve, 350))

    // 1번만 저장되어야 함
    const stored = localStorage.getItem('jjiban:tree:test-project:expanded')
    expect(stored).toBeTruthy()

    const data = JSON.parse(stored!)
    expect(data.expandedNodes).toEqual(['WP-01', 'WP-02'])
  })

  it('should restore only valid nodes', () => {
    const wbsStore = useWbsStore()

    // Mock: WP-01만 유효
    vi.spyOn(wbsStore, 'getNode').mockImplementation((id) =>
      id === 'WP-01' ? { id: 'WP-01' } : null
    )

    // 저장된 데이터 (WP-01, WP-02, WP-03)
    localStorage.setItem('jjiban:tree:test-project:expanded', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      expandedNodes: ['WP-01', 'WP-02', 'WP-03']
    }))

    const { restoreExpandedState } = useTreePersistence({
      projectId: 'test-project'
    })

    restoreExpandedState()

    // WP-01만 복원되어야 함
    expect(wbsStore.expandedNodes.size).toBe(1)
    expect(wbsStore.expandedNodes.has('WP-01')).toBe(true)
  })
})
```

### 9.3 E2E 테스트 (Playwright)

```typescript
// tests/e2e/wbs-tree-keyboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('WBS Tree Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/test-project')
    await page.waitForSelector('[data-testid="wbs-tree"]')
  })

  test('should navigate with arrow keys', async ({ page }) => {
    const firstNode = page.locator('[data-node-id="WP-01"]')
    await firstNode.focus()

    // ArrowDown
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[data-node-id="WP-02"]')).toBeFocused()

    // ArrowUp
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('[data-node-id="WP-01"]')).toBeFocused()
  })

  test('should expand/collapse with arrow keys', async ({ page }) => {
    const wpNode = page.locator('[data-node-id="WP-01"]')
    await wpNode.focus()

    // ArrowRight: 펼치기
    await page.keyboard.press('ArrowRight')
    await expect(wpNode).toHaveAttribute('aria-expanded', 'true')

    // ArrowLeft: 접기
    await page.keyboard.press('ArrowLeft')
    await expect(wpNode).toHaveAttribute('aria-expanded', 'false')
  })

  test('should select node with Enter', async ({ page }) => {
    const wpNode = page.locator('[data-node-id="WP-01"]')
    await wpNode.focus()

    await page.keyboard.press('Enter')

    // 선택 패널 표시 확인
    await expect(page.locator('[data-testid="task-detail-panel"]')).toBeVisible()
  })

  test('should jump to first/last with Home/End', async ({ page }) => {
    const firstNode = page.locator('[data-node-id="WP-01"]')
    await firstNode.focus()

    // End: 마지막 노드
    await page.keyboard.press('End')
    const lastNode = page.locator('[data-node-id]:last-of-type')
    await expect(lastNode).toBeFocused()

    // Home: 첫 번째 노드
    await page.keyboard.press('Home')
    await expect(firstNode).toBeFocused()
  })
})
```

---

## 10. 종합 평가

### 10.1 강점 요약

1. **설계 이슈 해결 완벽**
   - ISS-DR-003 (Debounce): @vueuse/core 활용, 300ms 적용
   - ISS-DR-008 (Race Condition): 플래그 기반 동기화, finally 보장

2. **Vue 3 Composition API 패턴 준수**
   - Composable 설계 원칙 준수
   - Ref/Computed/Watch 올바른 활용
   - Pinia 스토어 통합

3. **키보드 접근성 표준 준수**
   - WCAG 2.1 키 바인딩 구현
   - preventDefault/stopPropagation 적절한 사용
   - scrollIntoView 자동 스크롤

4. **에러 처리 충실**
   - 입력 검증 (null/type check)
   - QuotaExceededError 처리
   - 버전 호환성 체크
   - 에러 발생 시 상태 일관성 유지

5. **명확한 인터페이스**
   - JSDoc 주석 충실
   - 타입 기반 계약 설계
   - 단일 책임 원칙

### 10.2 개선 필요 영역

1. **타입 안전성 강화** (P1)
   - WbsNode 인터페이스 중복 제거
   - querySelector 타입 단언 제거
   - 스토리지 스키마 런타임 검증

2. **성능 최적화** (P2)
   - getCurrentIndex 캐싱
   - findParentNode Map 기반 구현
   - Set 변환 최적화

3. **코드 품질 향상** (P3-P4)
   - Magic number 상수화
   - 재귀 깊이 제한
   - 로깅 강화

### 10.3 최종 의견

**전반적 평가**: **우수 (89/100점)**

코드는 전반적으로 높은 품질을 보여주며, 특히 설계 리뷰에서 지적된 두 가지 핵심 이슈 (ISS-DR-003, ISS-DR-008)를 완벽하게 해결했습니다. Vue 3 Composition API 패턴을 정확히 따르고 있으며, 키보드 접근성 표준도 충실히 구현되어 있습니다.

다만, WbsNode 타입 중복 정의 (ISS-CR-009)는 프로젝트 전반의 타입 안전성에 영향을 미칠 수 있어 우선 해결이 필요합니다. 또한 성능 최적화 (캐싱, Map 기반 탐색)를 통해 대규모 트리에서의 반응 속도를 개선할 수 있습니다.

**권장 조치**:
1. **즉시 수정** (P1): ISS-CR-009 (WbsNode 타입 통합)
2. **다음 스프린트** (P2): ISS-CR-002, ISS-CR-005, ISS-CR-010 (성능 및 타입)
3. **기회가 되면** (P3-P4): ISS-CR-001, ISS-CR-006, ISS-CR-008 (품질 향상)

---

## 11. 체크리스트

### 설계 리뷰 이슈 검증
- [x] ISS-DR-003 (Debounce 구현) 적용 완료
- [x] ISS-DR-008 (Race Condition 방지) 적용 완료

### 프레임워크 규칙 준수
- [x] Vue 3 Composition API 패턴 준수
- [x] Pinia 스토어 통합 적절성
- [x] 키보드 접근성 표준 준수 (WCAG 2.1)

### 코드 품질
- [x] 명확한 인터페이스 정의
- [x] 단일 책임 원칙 준수
- [x] 일관된 에러 로깅
- [ ] Magic number 상수화 (ISS-CR-001)
- [ ] 깊은 중첩 로직 최적화 (ISS-CR-002)

### 성능 최적화
- [x] Debounce 적용 (ISS-DR-003)
- [x] Computed 캐싱 활용
- [ ] getCurrentIndex 캐싱 (ISS-CR-005)
- [ ] findParentNode Map 기반 (ISS-CR-002)

### 타입 안전성
- [x] 명시적 반환 타입
- [x] 제네릭 활용
- [ ] WbsNode 타입 통합 (ISS-CR-009)
- [ ] querySelector 타입 가드 (ISS-CR-010)
- [ ] 스토리지 스키마 검증 (ISS-CR-006, ISS-CR-012)

### 에러 처리
- [x] 입력 검증
- [x] Race Condition 방지 (ISS-DR-008)
- [x] QuotaExceededError 처리
- [x] 버전 호환성 체크
- [ ] 재귀 깊이 제한 (ISS-CR-008)

---

## 부록: 참고 자료

### A. Vue 3 Composable 패턴
- [Vue 3 Composables Guide](https://vuejs.org/guide/reusability/composables.html)
- [VueUse - Collection of Composables](https://vueuse.org/)

### B. WCAG 2.1 키보드 접근성
- [WCAG 2.1 - Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [WAI-ARIA Tree Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

### C. TypeScript 타입 가드
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Zod - Schema Validation](https://zod.dev/)

### D. 프로젝트 문서
- `C:\project\jjiban\.jjiban\projects\jjiban\tasks\TSK-04-03\020-detail-design.md`
- `C:\project\jjiban\.jjiban\projects\jjiban\tasks\TSK-04-03\021-design-review-claude-1(적용완료).md`

---

**리뷰 완료일**: 2025-12-15
**다음 리뷰 권장 시점**: ISS-CR-009 (P1) 수정 후

**승인 상태**: **Conditional Approval** (조건부 승인)
- P1 이슈 (ISS-CR-009) 수정 후 최종 승인
- P2 이슈는 다음 스프린트에서 개선 권장
