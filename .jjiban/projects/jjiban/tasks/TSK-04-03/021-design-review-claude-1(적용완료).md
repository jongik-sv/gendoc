# 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

---

## 0. 리뷰 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| 리뷰 대상 | 020-detail-design.md |
| 리뷰어 | Claude (Refactoring Expert) |
| 리뷰일 | 2025-12-15 |
| 리뷰 버전 | 1 |

---

## 1. 종합 평가

### 1.1 총점

```
┌─────────────────────────────────────┐
│         총점: 82/100                │
│                                     │
│  등급: B+ (Good with improvements)  │
└─────────────────────────────────────┘
```

### 1.2 항목별 점수

| 평가 항목 | 점수 | 가중치 | 가중 점수 |
|---------|------|--------|----------|
| 코드 구조 및 아키텍처 | 21/25 | 25% | 21 |
| 성능 및 효율성 | 19/25 | 25% | 19 |
| 유지보수성 및 확장성 | 22/25 | 25% | 22 |
| 에러 처리 및 안정성 | 20/25 | 25% | 20 |
| **합계** | **82/100** | **100%** | **82** |

---

## 2. 상세 평가

### 2.1 코드 구조 및 아키텍처 (21/25)

#### 2.1.1 강점 ✅

**단일 책임 원칙 준수 (SOLID-S)**
- 3개 Composable이 명확히 분리됨: Interaction, Persistence, KeyboardNav
- 각 Composable이 하나의 관심사만 처리
- 인터페이스 정의가 명확하고 일관성 있음

**의존성 계층 구조 적절**
```
useTreeInteraction (P1 - 독립)
    ↓
useTreePersistence (P2 - useTreeInteraction 의존)
    ↓
useKeyboardNav (P3 - useTreeInteraction 의존)
```

**TypeScript 타입 안전성**
- 모든 함수에 명시적 타입 정의
- 인터페이스 기반 설계로 계약 명확화
- 반환 타입 명시 (void, Promise<void>, boolean 등)

#### 2.1.2 개선 필요 사항 ⚠️

**ISS-DR-001: Composable 반환 객체 일관성 부족**
- **심각도**: Medium
- **위치**: 섹션 2.1.2, 2.2.2, 2.3.2
- **문제**: useTreeInteraction은 함수만 반환, useTreePersistence는 함수 + autoSave ref 반환
- **영향**: API 일관성 저하, 사용자 혼란 가능
- **권장사항**:
  ```typescript
  // 모든 Composable에 일관된 패턴 적용
  export interface UseTreeInteractionReturn {
    // 상태 (선택 사항)
    state?: Ref<SomeState>

    // 액션 (필수)
    toggleNode: (nodeId: string) => void
    selectNode: (nodeId: string) => Promise<void>

    // 계산 속성 (선택 사항)
    isExpanded: (nodeId: string) => boolean
    isSelected: (nodeId: string) => boolean
  }
  ```

**ISS-DR-002: 스토어 직접 접근 패턴**
- **심각도**: Low
- **위치**: 섹션 2.1.3
- **문제**: Composable 내부에서 `useWbsStore()`, `useSelectionStore()` 직접 호출
- **영향**: 테스트 어려움, 의존성 주입 불가
- **권장사항**:
  ```typescript
  // 의존성 주입 패턴 고려
  export interface UseTreeInteractionOptions {
    wbsStore?: ReturnType<typeof useWbsStore>
    selectionStore?: ReturnType<typeof useSelectionStore>
  }

  export function useTreeInteraction(
    options?: UseTreeInteractionOptions
  ): UseTreeInteractionReturn {
    const wbsStore = options?.wbsStore ?? useWbsStore()
    const selectionStore = options?.selectionStore ?? useSelectionStore()
    // ...
  }
  ```

**점수 산출**:
- 기본 점수: 25점
- ISS-DR-001 (일관성 부족): -2점
- ISS-DR-002 (직접 접근): -2점
- **최종**: 21/25

---

### 2.2 성능 및 효율성 (19/25)

#### 2.2.1 강점 ✅

**Computed 메모이제이션 활용**
- flattenedNodes를 computed로 구현하여 자동 캐싱
- 불필요한 재계산 방지

**조건부 렌더링 최적화**
- `v-if="expanded && hasChildren"` 패턴으로 불필요한 DOM 생성 방지
- 평면화 알고리즘이 펼쳐진 노드만 포함

**이벤트 최적화**
- `@click.stop`로 이벤트 버블링 제어
- `event.preventDefault()`, `event.stopPropagation()` 적절히 사용

#### 2.2.2 개선 필요 사항 ⚠️

**ISS-DR-003: Debounce 구현 누락**
- **심각도**: High
- **위치**: 섹션 2.2.4, 라인 422-432
- **문제**: watch에서 debounce 언급했으나 실제 구현 코드 없음
- **영향**: 빈번한 상태 변경 시 로컬 스토리지에 과도한 쓰기 발생
- **권장사항**:
  ```typescript
  import { useDebounceFn } from '@vueuse/core'

  const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
    saveExpandedState(expandedNodes)
  }, 300)

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

**ISS-DR-004: 평면화 알고리즘 복잡도 최적화 필요**
- **심각도**: Medium
- **위치**: 섹션 2.3.4, 라인 571-588
- **문제**: O(n) 복잡도는 맞지만, 매번 새 배열 생성
- **영향**: 대규모 트리(1000+ 노드)에서 성능 저하 가능
- **권장사항**:
  ```typescript
  // 변경 감지 최적화
  const flattenedNodes = computed<WbsNode[]>(() => {
    const result: WbsNode[] = []
    const { isExpanded } = useTreeInteraction()

    // 캐시 키 생성 (expandedNodes의 해시)
    const cacheKey = Array.from(wbsStore.expandedNodes).sort().join(',')

    function flatten(nodes: WbsNode[], depth: number = 0): void {
      // 깊이 제한으로 무한 루프 방지
      if (depth > 10) return

      for (const node of nodes) {
        result.push(node)

        if (isExpanded(node.id) && node.children?.length) {
          flatten(node.children, depth + 1)
        }
      }
    }

    flatten(options.treeRoot.value || [])
    return result
  })
  ```

**ISS-DR-005: 로컬 스토리지 크기 체크 비효율**
- **심각도**: Low
- **위치**: 섹션 2.2.4, 라인 380-384
- **문제**: JSON 직렬화 후 크기 체크 (이미 메모리 사용)
- **영향**: 크기 초과 시에도 메모리 낭비
- **권장사항**:
  ```typescript
  // 저장 전 예상 크기 체크
  const estimatedSize = data.expandedNodes.length * 20 // 노드 ID당 평균 20바이트
  if (estimatedSize > MAX_STORAGE_SIZE) {
    console.warn('[useTreePersistence] Estimated size exceeds limit')
    return
  }
  ```

**점수 산출**:
- 기본 점수: 25점
- ISS-DR-003 (debounce 누락): -3점
- ISS-DR-004 (평면화 최적화): -2점
- ISS-DR-005 (크기 체크): -1점
- **최종**: 19/25

---

### 2.3 유지보수성 및 확장성 (22/25)

#### 2.3.1 강점 ✅

**명확한 문서화**
- JSDoc 주석으로 모든 인터페이스 설명
- 매개변수, 반환값 명시
- 코드 예시와 통합 시나리오 제공

**확장 가능한 키보드 매핑**
```typescript
const keyHandlers: Record<string, () => void> = {
  'ArrowDown': handleArrowDown,
  'ArrowUp': handleArrowUp,
  // 새 키 추가 용이
}
```

**버전 관리 전략**
```typescript
const STORAGE_VERSION = '1.0'
// 향후 스키마 변경 시 마이그레이션 가능
```

**테스트 전략 제시**
- 단위 테스트 예시 제공 (Vitest)
- E2E 테스트 시나리오 명시 (Playwright)
- 커버리지 목표 설정 (≥80%)

#### 2.3.2 개선 필요 사항 ⚠️

**ISS-DR-006: 에러 로깅 전략 불명확**
- **심각도**: Medium
- **위치**: 섹션 5.1
- **문제**: console.error, console.warn, console.info 혼재
- **영향**: Production 환경에서 불필요한 로그, 성능 영향
- **권장사항**:
  ```typescript
  // 중앙화된 로거 사용
  import { useLogger } from '~/composables/useLogger'

  const logger = useLogger('useTreeInteraction')

  function toggleNode(nodeId: string): void {
    if (!nodeId) {
      logger.warn('Invalid nodeId:', nodeId)
      return
    }
    // ...
  }

  // useLogger.ts
  export function useLogger(context: string) {
    const isDev = import.meta.env.DEV

    return {
      debug: (...args: any[]) => isDev && console.debug(`[${context}]`, ...args),
      info: (...args: any[]) => console.info(`[${context}]`, ...args),
      warn: (...args: any[]) => console.warn(`[${context}]`, ...args),
      error: (...args: any[]) => console.error(`[${context}]`, ...args)
    }
  }
  ```

**ISS-DR-007: 매직 넘버 하드코딩**
- **심각도**: Low
- **위치**: 섹션 2.2.4, 2.3.4
- **문제**: `300ms`, `1024 * 1024`, `30일` 등 매직 넘버 산재
- **영향**: 설정 변경 어려움
- **권장사항**:
  ```typescript
  // constants.ts로 분리
  export const TREE_PERSISTENCE_CONFIG = {
    DEBOUNCE_MS: 300,
    MAX_STORAGE_SIZE: 1024 * 1024,
    CLEANUP_DAYS: 30,
    MAX_TREE_DEPTH: 10
  } as const
  ```

**점수 산출**:
- 기본 점수: 25점
- ISS-DR-006 (로깅 전략): -2점
- ISS-DR-007 (매직 넘버): -1점
- **최종**: 22/25

---

### 2.4 에러 처리 및 안정성 (20/25)

#### 2.4.1 강점 ✅

**방어적 프로그래밍**
```typescript
if (!nodeId || typeof nodeId !== 'string') {
  console.warn('[useTreeInteraction] Invalid nodeId:', nodeId)
  return
}
```

**복구 전략 명확**
- Task 로드 실패 시 선택 해제
- Quota 초과 시 자동 정리 후 재시도
- 유효하지 않은 노드 필터링

**에러 분류 체계**
- Critical, Warning, Info, Debug 레벨 구분
- 각 레벨별 처리 방법 명시

#### 2.4.2 개선 필요 사항 ⚠️

**ISS-DR-008: 중복 선택 방지 로직의 Race Condition**
- **심각도**: High
- **위치**: 섹션 2.1.3, 라인 162-165
- **문제**: 비동기 함수에서 중복 체크가 await 전에 발생
- **영향**: 빠른 클릭 시 동시 요청 발생 가능
- **권장사항**:
  ```typescript
  // 요청 중 플래그 추가
  const isSelecting = ref(false)

  async function selectNode(nodeId: string): Promise<void> {
    const selectionStore = useSelectionStore()

    if (!nodeId || typeof nodeId !== 'string') {
      logger.warn('Invalid nodeId:', nodeId)
      return
    }

    // 중복 선택 및 진행 중 요청 방지
    if (selectionStore.selectedNodeId === nodeId || isSelecting.value) {
      return
    }

    isSelecting.value = true
    try {
      await selectionStore.selectNode(nodeId)
    } catch (error) {
      logger.error('Failed to select node:', error)
      selectionStore.clearSelection()
      throw error
    } finally {
      isSelecting.value = false
    }
  }
  ```

**ISS-DR-009: 로컬 스토리지 에러 처리 불완전**
- **심각도**: Medium
- **위치**: 섹션 2.2.4, 라인 389-398
- **문제**: QuotaExceededError만 처리, SecurityError 등 미처리
- **영향**: Private 모드에서 앱 중단 가능
- **권장사항**:
  ```typescript
  function saveExpandedState(expandedNodes: Set<string>): void {
    const storageKey = getStorageKey(options.projectId)

    try {
      const data: ExpandedStateStorage = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        expandedNodes: Array.from(expandedNodes)
      }

      const json = JSON.stringify(data)
      localStorage.setItem(storageKey, json)
      logger.debug('Saved state:', expandedNodes.size, 'nodes')
    } catch (error) {
      // 다양한 스토리지 에러 처리
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'QuotaExceededError':
            logger.error('Storage quota exceeded')
            cleanupOldStorage()
            break
          case 'SecurityError':
            logger.warn('Storage access denied (private mode?)')
            // 메모리 폴백 전략
            break
          default:
            logger.error('Storage error:', error.name, error.message)
        }
      } else {
        logger.error('Failed to save state:', error)
      }
    }
  }
  ```

**ISS-DR-010: findParentNode 무한 루프 위험**
- **심각도**: Medium
- **위치**: 섹션 2.3.6, 라인 787-808
- **문제**: 순환 참조 시 무한 재귀 가능
- **영향**: 스택 오버플로우, 브라우저 크래시
- **권장사항**:
  ```typescript
  function findParentNode(nodeId: string, maxDepth: number = 10): WbsNode | null {
    const wbsStore = useWbsStore()

    function search(
      nodes: WbsNode[],
      target: string,
      depth: number = 0
    ): WbsNode | null {
      // 깊이 제한으로 무한 재귀 방지
      if (depth > maxDepth) {
        logger.warn('Max depth exceeded in findParentNode')
        return null
      }

      for (const node of nodes) {
        if (node.children?.length) {
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

**ISS-DR-011: Toast 메시지 주석 처리**
- **심각도**: Low
- **위치**: 섹션 5.2, 라인 1084
- **문제**: 사용자 알림 로직이 주석 처리됨
- **영향**: Task 로드 실패 시 사용자에게 피드백 없음
- **권장사항**:
  ```typescript
  // Toast 메시지 활성화
  async function selectNode(nodeId: string): Promise<void> {
    const toast = useToast()

    try {
      await selectionStore.selectNode(nodeId)
    } catch (error) {
      selectionStore.clearSelection()
      logger.error('Failed to load task:', error)

      // 사용자 알림 (주석 해제 필요)
      toast.add({
        severity: 'error',
        summary: 'Task 로드 실패',
        detail: 'Task 정보를 불러오는데 실패했습니다.',
        life: 3000
      })

      throw error
    }
  }
  ```

**점수 산출**:
- 기본 점수: 25점
- ISS-DR-008 (Race Condition): -2점
- ISS-DR-009 (스토리지 에러): -2점
- ISS-DR-010 (무한 루프): -1점
- **최종**: 20/25

---

## 3. 발견된 이슈 목록

### 3.1 High 심각도 (3개)

| 이슈 ID | 제목 | 위치 | 영향 |
|---------|------|------|------|
| ISS-DR-003 | Debounce 구현 누락 | 섹션 2.2.4 | 로컬 스토리지 과도한 쓰기 |
| ISS-DR-008 | Race Condition (중복 선택) | 섹션 2.1.3 | 동시 요청 발생 가능 |

### 3.2 Medium 심각도 (5개)

| 이슈 ID | 제목 | 위치 | 영향 |
|---------|------|------|------|
| ISS-DR-001 | Composable API 일관성 부족 | 섹션 2.1.2, 2.2.2 | 사용자 혼란 |
| ISS-DR-004 | 평면화 알고리즘 최적화 | 섹션 2.3.4 | 대규모 트리 성능 |
| ISS-DR-006 | 에러 로깅 전략 불명확 | 섹션 5.1 | Production 로그 노이즈 |
| ISS-DR-009 | 스토리지 에러 처리 불완전 | 섹션 2.2.4 | Private 모드 크래시 |
| ISS-DR-010 | findParentNode 무한 루프 | 섹션 2.3.6 | 스택 오버플로우 |

### 3.3 Low 심각도 (3개)

| 이슈 ID | 제목 | 위치 | 영향 |
|---------|------|------|------|
| ISS-DR-002 | 스토어 직접 접근 | 섹션 2.1.3 | 테스트 어려움 |
| ISS-DR-005 | 로컬 스토리지 크기 체크 | 섹션 2.2.4 | 미미한 메모리 낭비 |
| ISS-DR-007 | 매직 넘버 하드코딩 | 전역 | 설정 변경 어려움 |
| ISS-DR-011 | Toast 메시지 미구현 | 섹션 5.2 | 사용자 피드백 부족 |

---

## 4. 권장 개선사항

### 4.1 즉시 적용 (구현 단계 전)

**1. Debounce 구현 추가 (ISS-DR-003)**
```typescript
import { useDebounceFn } from '@vueuse/core'

export function useTreePersistence(options: UseTreePersistenceOptions) {
  const wbsStore = useWbsStore()
  const autoSave = ref(true)

  const debouncedSave = useDebounceFn((expandedNodes: Set<string>) => {
    saveExpandedState(expandedNodes)
  }, 300)

  watch(
    () => wbsStore.expandedNodes,
    (expandedNodes) => {
      if (autoSave.value) {
        debouncedSave(expandedNodes)
      }
    },
    { deep: true }
  )

  return { restoreExpandedState, saveExpandedState, clearExpandedState, autoSave }
}
```

**2. Race Condition 방지 (ISS-DR-008)**
```typescript
const isSelecting = ref(false)

async function selectNode(nodeId: string): Promise<void> {
  // 중복 선택 및 진행 중 요청 방지
  if (selectionStore.selectedNodeId === nodeId || isSelecting.value) {
    return
  }

  isSelecting.value = true
  try {
    await selectionStore.selectNode(nodeId)
  } finally {
    isSelecting.value = false
  }
}
```

**3. 로거 중앙화 (ISS-DR-006)**
```typescript
// app/composables/useLogger.ts
export function useLogger(context: string) {
  const isDev = import.meta.env.DEV

  return {
    debug: (...args: any[]) => isDev && console.debug(`[${context}]`, ...args),
    info: (...args: any[]) => console.info(`[${context}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${context}]`, ...args),
    error: (...args: any[]) => console.error(`[${context}]`, ...args)
  }
}
```

### 4.2 중기 개선 (구현 단계 중)

**1. 상수 파일 분리 (ISS-DR-007)**
```typescript
// app/constants/tree.ts
export const TREE_CONFIG = {
  PERSISTENCE: {
    DEBOUNCE_MS: 300,
    MAX_STORAGE_SIZE: 1024 * 1024,
    CLEANUP_DAYS: 30,
    STORAGE_VERSION: '1.0',
    STORAGE_PREFIX: 'jjiban:tree'
  },
  NAVIGATION: {
    MAX_TREE_DEPTH: 10,
    SCROLL_BEHAVIOR: 'smooth' as ScrollBehavior,
    SCROLL_BLOCK: 'nearest' as ScrollLogicalPosition
  }
} as const
```

**2. 스토리지 에러 처리 개선 (ISS-DR-009)**
```typescript
function saveExpandedState(expandedNodes: Set<string>): void {
  try {
    // ... 저장 로직
  } catch (error) {
    if (error instanceof DOMException) {
      handleStorageError(error)
    } else {
      logger.error('Failed to save state:', error)
    }
  }
}

function handleStorageError(error: DOMException): void {
  const errorHandlers: Record<string, () => void> = {
    'QuotaExceededError': () => {
      logger.error('Storage quota exceeded')
      cleanupOldStorage()
    },
    'SecurityError': () => {
      logger.warn('Storage access denied (private mode?)')
      // 메모리 폴백 전략
    }
  }

  const handler = errorHandlers[error.name]
  if (handler) {
    handler()
  } else {
    logger.error('Storage error:', error.name, error.message)
  }
}
```

**3. 무한 재귀 방지 (ISS-DR-010)**
```typescript
function findParentNode(nodeId: string, maxDepth: number = 10): WbsNode | null {
  function search(nodes: WbsNode[], target: string, depth: number = 0): WbsNode | null {
    if (depth > maxDepth) {
      logger.warn('Max depth exceeded in findParentNode')
      return null
    }

    for (const node of nodes) {
      if (node.children?.length) {
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

### 4.3 장기 개선 (검증 단계 후)

**1. 의존성 주입 패턴 (ISS-DR-002)**
```typescript
export interface UseTreeInteractionOptions {
  wbsStore?: ReturnType<typeof useWbsStore>
  selectionStore?: ReturnType<typeof useSelectionStore>
}

export function useTreeInteraction(
  options?: UseTreeInteractionOptions
): UseTreeInteractionReturn {
  const wbsStore = options?.wbsStore ?? useWbsStore()
  const selectionStore = options?.selectionStore ?? useSelectionStore()
  // ...
}

// 테스트에서 모킹 용이
const mockWbsStore = { /* ... */ }
const { toggleNode } = useTreeInteraction({ wbsStore: mockWbsStore })
```

**2. Composable API 일관성 (ISS-DR-001)**
```typescript
// 모든 Composable에 일관된 구조 적용
export interface UseComposableReturn<TState = void, TActions = object> {
  // 상태 (선택 사항)
  state?: TState extends void ? never : Ref<TState>

  // 액션 (필수)
  actions: TActions

  // 계산 속성 (선택 사항)
  computed?: Record<string, ComputedRef<any>>
}

// 예시
export interface UseTreeInteractionReturn {
  actions: {
    toggleNode: (nodeId: string) => void
    selectNode: (nodeId: string) => Promise<void>
    expandAll: () => void
    collapseAll: () => void
  }
  computed: {
    isExpanded: (nodeId: string) => boolean
    isSelected: (nodeId: string) => boolean
  }
}
```

---

## 5. 긍정적 평가 사항

### 5.1 설계 품질

**명확한 계층 구조**
- Composable 간 의존성이 명확하고 순환 의존 없음
- 우선순위 기반 구현 계획 (P1 → P2 → P3)

**포괄적인 문서화**
- 모든 함수에 JSDoc 주석
- 코드 예시와 통합 시나리오 제공
- 데이터 흐름 다이어그램 명시

**테스트 전략 수립**
- 단위 테스트 (Vitest) 예시 제공
- E2E 테스트 (Playwright) 시나리오 명시
- 커버리지 목표 설정 (≥80%)

### 5.2 기술 선택

**적절한 패턴 사용**
- Composition API 활용
- Pinia 스토어 통합
- LocalStorage API 활용

**접근성 고려**
- 키보드 네비게이션 전체 지원
- ARIA 속성 고려 (data-node-id, tabindex)
- 포커스 관리 및 스크롤 조정

### 5.3 확장성

**플러그인 방식 설계**
- 각 Composable이 독립적으로 사용 가능
- 선택적 콜백 (onNodeSelect, onFocusChange)

**버전 관리**
- 로컬 스토리지 스키마 버전 관리
- 마이그레이션 전략 고려

---

## 6. 다음 단계 권장사항

### 6.1 설계 수정 (우선순위 순)

| 순위 | 이슈 ID | 작업 내용 | 예상 시간 |
|------|---------|----------|----------|
| 1 | ISS-DR-003 | Debounce 구현 추가 | 30분 |
| 2 | ISS-DR-008 | Race Condition 방지 | 1시간 |
| 3 | ISS-DR-006 | 로거 중앙화 | 1시간 |
| 4 | ISS-DR-009 | 스토리지 에러 처리 개선 | 1시간 |
| 5 | ISS-DR-010 | 무한 재귀 방지 | 30분 |

**총 예상 시간**: 4시간

### 6.2 구현 전 체크리스트

- [ ] ISS-DR-003: useDebounceFn 임포트 및 적용
- [ ] ISS-DR-008: isSelecting ref 추가 및 동기화 로직
- [ ] ISS-DR-006: useLogger Composable 생성
- [ ] ISS-DR-007: constants/tree.ts 파일 생성
- [ ] ISS-DR-009: handleStorageError 함수 구현
- [ ] ISS-DR-010: findParentNode에 maxDepth 파라미터 추가
- [ ] ISS-DR-011: Toast 메시지 활성화

### 6.3 구현 단계 가이드

**Phase 1: 코어 기능 (P1)**
1. useTreeInteraction.ts 작성
2. 로거 통합
3. Race Condition 방지 로직 추가
4. 단위 테스트 작성

**Phase 2: 영속성 (P2)**
1. useTreePersistence.ts 작성
2. Debounce 적용
3. 스토리지 에러 처리 개선
4. 단위 테스트 작성

**Phase 3: 키보드 네비게이션 (P3)**
1. useKeyboardNav.ts 작성
2. 무한 재귀 방지 로직 추가
3. E2E 테스트 작성

---

## 7. 결론

### 7.1 총평

TSK-04-03 (Tree Interaction) 상세설계는 **전체적으로 우수한 품질**을 보여줍니다.

**주요 강점**:
- 명확한 Composable 분리 및 계층 구조
- 포괄적인 문서화 및 코드 예시
- 접근성 고려 (키보드 네비게이션)
- 테스트 전략 수립

**주요 약점**:
- 성능 최적화 일부 누락 (Debounce)
- 에러 처리 불완전 (Race Condition, Storage Errors)
- 일부 로직의 안정성 이슈 (무한 재귀 가능성)

### 7.2 승인 권고

**승인 조건부 (Conditional Approval)**

다음 **High 심각도 이슈 2개**를 수정한 후 구현 진행을 권장합니다:
1. ISS-DR-003: Debounce 구현 추가
2. ISS-DR-008: Race Condition 방지

Medium 심각도 이슈는 구현 단계에서 점진적으로 개선 가능합니다.

### 7.3 최종 점수 해석

```
82/100 (B+)
┌──────────────────────────────────────┐
│ 아키텍처:     21/25 (84%) - Good     │
│ 성능:         19/25 (76%) - Needs    │
│ 유지보수성:   22/25 (88%) - Great    │
│ 안정성:       20/25 (80%) - Good     │
└──────────────────────────────────────┘

평가: 양호한 설계이나 성능 및 안정성 개선 필요
```

---

## 8. 참조 문서

- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-03)

---

<!--
Reviewer: Claude (Refactoring Expert)
Review Version: 1
Review Date: 2025-12-15
Review Focus: Code structure, Performance, Maintainability, Error handling
Total Issues Found: 11 (2 High, 5 Medium, 4 Low)
Overall Score: 82/100 (B+)
Approval Status: Conditional (Fix ISS-DR-003, ISS-DR-008)
-->
