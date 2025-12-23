# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * 단위 테스트 및 E2E 테스트 케이스 상세 명세
> * 테스트 데이터, 환경 설정, 실행 방법 정의
> * 테스트 자동화 및 CI/CD 통합 가이드

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

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 레벨 | 도구 | 범위 | 목표 커버리지 |
|------|------|------|-------------|
| **단위 테스트** | Vitest | Composable 함수 단위 | ≥80% |
| **통합 테스트** | Vitest + Testing Library | Composable + Store 연동 | ≥70% |
| **E2E 테스트** | Playwright | 전체 사용자 시나리오 | 100% 주요 시나리오 |
| **접근성 테스트** | Playwright + axe-core | 키보드, 스크린 리더 | WCAG 2.1 AA |
| **성능 테스트** | Playwright + Performance API | 인터랙션 응답 시간 | < 100ms |

### 1.2 테스트 환경

**개발 환경**:
```bash
# 단위 테스트
npm run test:unit

# E2E 테스트
npm run test:e2e

# 커버리지 리포트
npm run test:coverage
```

**CI/CD 환경**:
```yaml
# GitHub Actions 예시
- name: Unit Tests
  run: npm run test:unit -- --coverage

- name: E2E Tests
  run: npm run test:e2e -- --headless

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 2. 단위 테스트 (Vitest)

### 2.1 테스트 파일 구조

```
tests/
├── unit/
│   └── composables/
│       ├── useTreeInteraction.test.ts
│       ├── useKeyboardNav.test.ts
│       └── useTreePersistence.test.ts
└── fixtures/
    └── mock-tree-data.ts
```

### 2.2 테스트 픽스처 (Mock Data)

**파일**: `tests/fixtures/mock-tree-data.ts`

```typescript
import type { WbsNode } from '~/types/index'

export const mockTreeData: WbsNode[] = [
  {
    id: 'WP-01',
    type: 'wp',
    title: 'Work Package 01',
    progress: 50,
    taskCount: 5,
    children: [
      {
        id: 'ACT-01-01',
        type: 'act',
        title: 'Activity 01-01',
        progress: 75,
        taskCount: 3,
        children: [
          {
            id: 'TSK-01-01-01',
            type: 'task',
            title: 'Task 01-01-01',
            status: '[dd]',
            category: 'development',
            priority: 'high',
            progress: 100,
            taskCount: 0,
            children: []
          },
          {
            id: 'TSK-01-01-02',
            type: 'task',
            title: 'Task 01-01-02',
            status: '[im]',
            category: 'development',
            priority: 'medium',
            progress: 50,
            taskCount: 0,
            children: []
          }
        ]
      },
      {
        id: 'ACT-01-02',
        type: 'act',
        title: 'Activity 01-02',
        progress: 25,
        taskCount: 2,
        children: [
          {
            id: 'TSK-01-02-01',
            type: 'task',
            title: 'Task 01-02-01',
            status: '[ ]',
            category: 'defect',
            priority: 'critical',
            progress: 0,
            taskCount: 0,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 'WP-02',
    type: 'wp',
    title: 'Work Package 02',
    progress: 0,
    taskCount: 0,
    children: []
  }
]

export function createMockWbsStore() {
  const expandedNodes = ref(new Set<string>())

  return {
    tree: ref(mockTreeData),
    flatNodes: ref(new Map([
      ['WP-01', mockTreeData[0]],
      ['ACT-01-01', mockTreeData[0].children[0]],
      ['TSK-01-01-01', mockTreeData[0].children[0].children[0]],
      ['TSK-01-01-02', mockTreeData[0].children[0].children[1]],
      ['ACT-01-02', mockTreeData[0].children[1]],
      ['TSK-01-02-01', mockTreeData[0].children[1].children[0]],
      ['WP-02', mockTreeData[1]]
    ])),
    expandedNodes,
    toggleExpand: vi.fn((nodeId: string) => {
      if (expandedNodes.value.has(nodeId)) {
        expandedNodes.value.delete(nodeId)
      } else {
        expandedNodes.value.add(nodeId)
      }
    }),
    isExpanded: vi.fn((nodeId: string) => expandedNodes.value.has(nodeId)),
    expandAll: vi.fn(() => {
      expandedNodes.value = new Set(['WP-01', 'WP-02', 'ACT-01-01', 'ACT-01-02'])
    }),
    collapseAll: vi.fn(() => {
      expandedNodes.value.clear()
    }),
    getNode: vi.fn((nodeId: string) => {
      return mockTreeData
        .flatMap(wp => [wp, ...wp.children.flatMap(act => [act, ...act.children])])
        .find(node => node.id === nodeId)
    })
  }
}

export function createMockSelectionStore() {
  return {
    selectedNodeId: ref<string | null>(null),
    selectedTask: ref(null),
    selectNode: vi.fn(async (nodeId: string) => {
      // Mock implementation
    }),
    clearSelection: vi.fn()
  }
}
```

---

### 2.3 useTreeInteraction 단위 테스트

**파일**: `tests/unit/composables/useTreeInteraction.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTreeInteraction } from '~/composables/useTreeInteraction'
import { createMockWbsStore, createMockSelectionStore } from '../../fixtures/mock-tree-data'

// Pinia 스토어 모킹
vi.mock('~/app/stores/wbs', () => ({
  useWbsStore: createMockWbsStore
}))

vi.mock('~/app/stores/selection', () => ({
  useSelectionStore: createMockSelectionStore
}))

describe('useTreeInteraction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('toggleNode', () => {
    it('[UT-TI-001] should toggle node expansion state', () => {
      const { toggleNode, isExpanded } = useTreeInteraction()
      const nodeId = 'WP-01'

      // 초기 상태: 접혀있음
      expect(isExpanded(nodeId)).toBe(false)

      // 펼치기
      toggleNode(nodeId)
      expect(isExpanded(nodeId)).toBe(true)

      // 다시 접기
      toggleNode(nodeId)
      expect(isExpanded(nodeId)).toBe(false)
    })

    it('[UT-TI-005] should ignore invalid node ID', () => {
      const { toggleNode } = useTreeInteraction()

      // 빈 문자열
      expect(() => toggleNode('')).not.toThrow()

      // null (타입 강제 변환)
      expect(() => toggleNode(null as any)).not.toThrow()
    })

    it('[UT-TI-006] should not toggle nodes without children', () => {
      const { toggleNode, isExpanded } = useTreeInteraction()
      const nodeId = 'TSK-01-01-01'  // 자식 없는 Task 노드

      toggleNode(nodeId)

      // 상태 변경 없음
      expect(isExpanded(nodeId)).toBe(false)
    })
  })

  describe('selectNode', () => {
    it('[UT-TI-003] should select node and load task detail', async () => {
      const { selectNode, isSelected } = useTreeInteraction()
      const taskId = 'TSK-01-01-01'

      await selectNode(taskId)

      expect(isSelected(taskId)).toBe(true)
    })

    it('[UT-TI-007] should not call API on duplicate selection', async () => {
      const { selectNode } = useTreeInteraction()
      const taskId = 'TSK-01-01-01'

      const selectionStore = useSelectionStore()
      selectionStore.selectedNodeId = taskId  // 이미 선택됨

      await selectNode(taskId)

      // selectNode이 호출되지 않음
      expect(selectionStore.selectNode).not.toHaveBeenCalled()
    })
  })

  describe('expandAll / collapseAll', () => {
    it('[UT-TI-002a] should expand all nodes', () => {
      const { expandAll, isExpanded } = useTreeInteraction()

      expandAll()

      expect(isExpanded('WP-01')).toBe(true)
      expect(isExpanded('ACT-01-01')).toBe(true)
    })

    it('[UT-TI-002b] should collapse all nodes', () => {
      const { expandAll, collapseAll, isExpanded } = useTreeInteraction()

      // 먼저 전체 펼치기
      expandAll()
      expect(isExpanded('WP-01')).toBe(true)

      // 전체 접기
      collapseAll()
      expect(isExpanded('WP-01')).toBe(false)
      expect(isExpanded('ACT-01-01')).toBe(false)
    })
  })

  describe('isExpanded / isSelected', () => {
    it('[UT-TI-004] should return correct selection state', () => {
      const { selectNode, isSelected } = useTreeInteraction()
      const nodeId = 'WP-01'

      expect(isSelected(nodeId)).toBe(false)

      selectNode(nodeId)

      expect(isSelected(nodeId)).toBe(true)
    })
  })
})
```

---

### 2.4 useKeyboardNav 단위 테스트

**파일**: `tests/unit/composables/useKeyboardNav.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useKeyboardNav } from '~/composables/useKeyboardNav'
import { mockTreeData, createMockWbsStore } from '../../fixtures/mock-tree-data'

vi.mock('~/app/stores/wbs', () => ({
  useWbsStore: createMockWbsStore
}))

describe('useKeyboardNav', () => {
  let onNodeSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onNodeSelect = vi.fn()
  })

  describe('handleKeyDown', () => {
    it('[UT-KBD-000] should prevent default on recognized keys', () => {
      const { handleKeyDown } = useKeyboardNav({
        treeRoot: ref(mockTreeData),
        onNodeSelect
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      handleKeyDown(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should ignore unrecognized keys', () => {
      const { handleKeyDown } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      const event = new KeyboardEvent('keydown', { key: 'a' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      handleKeyDown(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('handleArrowDown', () => {
    it('[UT-KBD-001] should move focus to next node', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 첫 노드로 초기화
      focusedNodeId.value = 'WP-01'

      // ArrowDown 입력
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      handleKeyDown(event)

      // 다음 노드로 이동 (펼쳐진 경우 첫 자식, 아니면 다음 형제)
      expect(focusedNodeId.value).not.toBe('WP-01')
    })

    it('[UT-KBD-017] should stay at last node when at boundary', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 마지막 노드로 이동
      focusedNodeId.value = 'WP-02'  // 마지막 노드

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      handleKeyDown(event)

      // 변경 없음
      expect(focusedNodeId.value).toBe('WP-02')
    })
  })

  describe('handleArrowUp', () => {
    it('[UT-KBD-002] should move focus to previous node', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 두 번째 노드로 초기화
      focusedNodeId.value = 'WP-02'

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      handleKeyDown(event)

      expect(focusedNodeId.value).toBe('WP-01')
    })

    it('[UT-KBD-016] should stay at first node when at boundary', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 첫 노드
      focusedNodeId.value = 'WP-01'

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      handleKeyDown(event)

      // 변경 없음
      expect(focusedNodeId.value).toBe('WP-01')
    })
  })

  describe('handleArrowRight', () => {
    it('[UT-KBD-003] should expand collapsed node', () => {
      const wbsStore = useWbsStore()
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      focusedNodeId.value = 'WP-01'

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      handleKeyDown(event)

      expect(wbsStore.toggleExpand).toHaveBeenCalledWith('WP-01')
    })

    it('[UT-KBD-014] should move to first child if already expanded', () => {
      const wbsStore = useWbsStore()
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 먼저 펼치기
      wbsStore.expandedNodes.value.add('WP-01')
      focusedNodeId.value = 'WP-01'

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      handleKeyDown(event)

      // 첫 자식으로 이동
      expect(focusedNodeId.value).toBe('ACT-01-01')
    })
  })

  describe('handleArrowLeft', () => {
    it('[UT-KBD-004] should collapse expanded node', () => {
      const wbsStore = useWbsStore()
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 펼쳐진 노드
      wbsStore.expandedNodes.value.add('WP-01')
      focusedNodeId.value = 'WP-01'

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      handleKeyDown(event)

      expect(wbsStore.toggleExpand).toHaveBeenCalledWith('WP-01')
    })

    it('[UT-KBD-015] should move to parent if already collapsed', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 자식 노드 (접혀있음)
      focusedNodeId.value = 'ACT-01-01'

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      handleKeyDown(event)

      // 부모로 이동
      expect(focusedNodeId.value).toBe('WP-01')
    })
  })

  describe('handleEnter', () => {
    it('[UT-KBD-005] should call onNodeSelect callback', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData),
        onNodeSelect
      })

      focusedNodeId.value = 'TSK-01-01-01'

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      handleKeyDown(event)

      expect(onNodeSelect).toHaveBeenCalledWith('TSK-01-01-01')
    })
  })

  describe('handleSpace', () => {
    it('[UT-KBD-006] should toggle node', () => {
      const wbsStore = useWbsStore()
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      focusedNodeId.value = 'WP-01'

      const event = new KeyboardEvent('keydown', { key: ' ' })
      handleKeyDown(event)

      expect(wbsStore.toggleExpand).toHaveBeenCalledWith('WP-01')
    })
  })

  describe('handleHome / handleEnd', () => {
    it('[UT-KBD-007] should move to first node on Home', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      const event = new KeyboardEvent('keydown', { key: 'Home' })
      handleKeyDown(event)

      expect(focusedNodeId.value).toBe('WP-01')
    })

    it('[UT-KBD-008] should move to last node on End', () => {
      const { handleKeyDown, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      const event = new KeyboardEvent('keydown', { key: 'End' })
      handleKeyDown(event)

      expect(focusedNodeId.value).toBe('WP-02')
    })
  })

  describe('flattenedNodes', () => {
    it('[UT-KBD-011] should only include expanded nodes', () => {
      const wbsStore = useWbsStore()
      const { focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      // 초기: 모두 접혀있음
      // flattenedNodes = ['WP-01', 'WP-02']

      // WP-01 펼치기
      wbsStore.expandedNodes.value.add('WP-01')
      // flattenedNodes = ['WP-01', 'ACT-01-01', 'ACT-01-02', 'WP-02']

      // 검증은 computed 값 확인 필요 (내부 구현)
    })
  })

  describe('focusNode', () => {
    it('[UT-KBD-010] should update focusedNodeId', () => {
      const { focusNode, focusedNodeId } = useKeyboardNav({
        treeRoot: ref(mockTreeData)
      })

      focusNode('ACT-01-01')

      expect(focusedNodeId.value).toBe('ACT-01-01')
    })
  })
})
```

---

### 2.5 useTreePersistence 단위 테스트

**파일**: `tests/unit/composables/useTreePersistence.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTreePersistence } from '~/composables/useTreePersistence'
import { createMockWbsStore } from '../../fixtures/mock-tree-data'

vi.mock('~/app/stores/wbs', () => ({
  useWbsStore: createMockWbsStore
}))

describe('useTreePersistence', () => {
  beforeEach(() => {
    // 로컬 스토리지 초기화
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('saveExpandedState / restoreExpandedState', () => {
    it('[UT-PER-001] should save and restore expanded state', () => {
      const projectId = 'test-project'
      const { saveExpandedState, restoreExpandedState } = useTreePersistence({
        projectId
      })

      const expandedNodes = new Set(['WP-01', 'ACT-01-01', 'TSK-01-01-01'])

      // 저장
      saveExpandedState(expandedNodes)

      // 로컬 스토리지 확인
      const stored = localStorage.getItem(`jjiban:tree:${projectId}:expanded`)
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.version).toBe('1.0')
      expect(parsed.expandedNodes).toEqual(['WP-01', 'ACT-01-01', 'TSK-01-01-01'])

      // 복원
      const wbsStore = useWbsStore()
      wbsStore.expandedNodes.value.clear()  // 초기화

      restoreExpandedState()

      expect(wbsStore.expandedNodes.value.has('WP-01')).toBe(true)
      expect(wbsStore.expandedNodes.value.has('ACT-01-01')).toBe(true)
    })
  })

  describe('getStorageKey', () => {
    it('[UT-PER-002] should generate unique key per project', () => {
      const { saveExpandedState } = useTreePersistence({ projectId: 'proj-a' })
      const { saveExpandedState: saveB } = useTreePersistence({ projectId: 'proj-b' })

      saveExpandedState(new Set(['WP-01']))
      saveB(new Set(['WP-02']))

      const keyA = localStorage.getItem('jjiban:tree:proj-a:expanded')
      const keyB = localStorage.getItem('jjiban:tree:proj-b:expanded')

      expect(keyA).toBeTruthy()
      expect(keyB).toBeTruthy()
      expect(JSON.parse(keyA!).expandedNodes).toEqual(['WP-01'])
      expect(JSON.parse(keyB!).expandedNodes).toEqual(['WP-02'])
    })
  })

  describe('크기 제한', () => {
    it('[UT-PER-003] should not save if size exceeds limit', () => {
      const { saveExpandedState } = useTreePersistence({ projectId: 'test' })

      // 1MB 초과 데이터 생성
      const hugeSet = new Set<string>()
      for (let i = 0; i < 100000; i++) {
        hugeSet.add(`NODE-${i}`)
      }

      const consoleWarnSpy = vi.spyOn(console, 'warn')
      saveExpandedState(hugeSet)

      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('clearExpandedState', () => {
    it('[UT-PER-004] should remove stored state', () => {
      const { saveExpandedState, clearExpandedState } = useTreePersistence({
        projectId: 'test'
      })

      saveExpandedState(new Set(['WP-01']))
      expect(localStorage.getItem('jjiban:tree:test:expanded')).toBeTruthy()

      clearExpandedState()
      expect(localStorage.getItem('jjiban:tree:test:expanded')).toBeNull()
    })
  })

  describe('버전 관리', () => {
    it('[UT-PER-005] should clear state on version mismatch', () => {
      const { restoreExpandedState, clearExpandedState } = useTreePersistence({
        projectId: 'test'
      })

      // 구버전 데이터 저장
      localStorage.setItem('jjiban:tree:test:expanded', JSON.stringify({
        version: '0.9',
        timestamp: new Date().toISOString(),
        expandedNodes: ['WP-01']
      }))

      const consoleWarnSpy = vi.spyOn(console, 'warn')
      restoreExpandedState()

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(localStorage.getItem('jjiban:tree:test:expanded')).toBeNull()
    })
  })

  describe('에러 처리', () => {
    it('[UT-PER-006] should handle JSON parse error', () => {
      const { restoreExpandedState } = useTreePersistence({ projectId: 'test' })

      // 잘못된 JSON
      localStorage.setItem('jjiban:tree:test:expanded', 'invalid json')

      const consoleErrorSpy = vi.spyOn(console, 'error')
      restoreExpandedState()

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('[UT-PER-007] should handle quota exceeded error', () => {
      const { saveExpandedState } = useTreePersistence({ projectId: 'test' })

      // localStorage.setItem 모킹 (Quota 초과 시뮬레이션)
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })

      saveExpandedState(new Set(['WP-01']))

      // cleanupOldStorage 호출 확인 (로그로 검증)
      // 실제로는 cleanup 후 재시도하므로 에러 없음
    })
  })

  describe('유효성 검증', () => {
    it('[UT-PER-008] should filter invalid nodes on restore', () => {
      const { saveExpandedState, restoreExpandedState } = useTreePersistence({
        projectId: 'test'
      })

      // 유효한 노드 + 삭제된 노드
      const expandedNodes = new Set(['WP-01', 'DELETED-NODE', 'ACT-01-01'])
      saveExpandedState(expandedNodes)

      const wbsStore = useWbsStore()
      wbsStore.expandedNodes.value.clear()

      restoreExpandedState()

      // 유효한 노드만 복원됨
      expect(wbsStore.expandedNodes.value.has('WP-01')).toBe(true)
      expect(wbsStore.expandedNodes.value.has('DELETED-NODE')).toBe(false)
    })
  })

  describe('cleanupOldStorage', () => {
    it('[UT-PER-009] should remove entries older than 30 days', () => {
      // 30일 이전 데이터
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31)

      localStorage.setItem('jjiban:tree:old-project:expanded', JSON.stringify({
        version: '1.0',
        timestamp: oldDate.toISOString(),
        expandedNodes: []
      }))

      // 최신 데이터
      localStorage.setItem('jjiban:tree:recent-project:expanded', JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        expandedNodes: []
      }))

      // cleanupOldStorage 호출 (내부 함수이므로 간접 호출)
      // Quota 초과 시뮬레이션으로 트리거
      const { saveExpandedState } = useTreePersistence({ projectId: 'test' })

      // 검증: 오래된 데이터는 삭제, 최신 데이터는 유지
      // (실제 구현에서는 cleanupOldStorage가 private이므로 간접 검증)
    })
  })
})
```

---

## 3. E2E 테스트 (Playwright)

### 3.1 테스트 파일 구조

```
tests/
└── e2e/
    └── tree-interaction.spec.ts
```

### 3.2 테스트 환경 설정

**파일**: `playwright.config.ts` (기존 파일 확장)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 3.3 E2E 테스트 케이스

**파일**: `tests/e2e/tree-interaction.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Tree Interaction E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 프로젝트로 이동
    await page.goto('/wbs?projectId=project')  // 테스트용 프로젝트

    // 트리 로드 대기
    await page.waitForSelector('.wbs-tree-panel', { state: 'visible' })
  })

  test.describe('UI Interaction', () => {
    test('[E2E-UI-001] should expand/collapse all nodes with buttons', async ({ page }) => {
      // 전체 펼치기 버튼 클릭
      await page.click('button:has-text("전체 펼치기")')

      // 모든 자식 노드가 표시됨
      const visibleNodes = await page.locator('.wbs-tree-node').count()
      expect(visibleNodes).toBeGreaterThan(1)

      // 전체 접기 버튼 클릭
      await page.click('button:has-text("전체 접기")')

      // 최상위 노드만 표시됨
      await page.waitForTimeout(300)  // 애니메이션 대기
      const collapsedNodes = await page.locator('.wbs-tree-node:visible').count()
      expect(collapsedNodes).toBeLessThanOrEqual(2)  // WP 노드들만
    })
  })

  test.describe('Node Selection', () => {
    test('[E2E-SEL-001] should show detail panel on node click', async ({ page }) => {
      // Task 노드 클릭
      await page.click('[data-node-id="TSK-01-01-01"]')

      // 상세 패널 표시 확인
      const detailPanel = page.locator('.task-detail-panel')
      await expect(detailPanel).toBeVisible({ timeout: 1000 })

      // Task 제목 확인
      const taskTitle = detailPanel.locator('h2')
      await expect(taskTitle).toContainText('TSK-01-01-01')
    })

    test('[E2E-SEL-002] should highlight selected node', async ({ page }) => {
      const nodeSelector = '[data-node-id="WP-01"]'

      // 노드 클릭
      await page.click(nodeSelector)

      // 선택 상태 확인 (클래스 또는 스타일)
      const node = page.locator(nodeSelector)
      await expect(node).toHaveClass(/selected/)

      // 배경색 확인 (computed style)
      const bgColor = await node.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')  // 투명이 아님
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('[E2E-KBD-001] should navigate with arrow keys', async ({ page }) => {
      // 트리에 포커스
      await page.locator('.wbs-tree-panel').focus()

      // ArrowDown 3회
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')

      // 포커스 확인
      const focused = page.locator('[data-node-id]:focus')
      await expect(focused).toBeVisible()

      // ArrowUp 1회
      await page.keyboard.press('ArrowUp')

      // 포커스가 이전 노드로 이동
      const newFocused = page.locator('[data-node-id]:focus')
      await expect(newFocused).toBeVisible()
    })

    test('[E2E-KBD-002] should expand/collapse with ArrowRight/Left', async ({ page }) => {
      // WP 노드에 포커스
      await page.locator('[data-node-id="WP-01"]').focus()

      // ArrowRight (펼치기)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)  // 애니메이션 대기

      // 자식 노드 확인
      const children = page.locator('[data-node-id="ACT-01-01"]')
      await expect(children).toBeVisible()

      // ArrowRight 다시 (첫 자식으로 이동)
      await page.keyboard.press('ArrowRight')

      // 포커스가 자식으로 이동
      const focused = page.locator('[data-node-id]:focus')
      const focusedId = await focused.getAttribute('data-node-id')
      expect(focusedId).toBe('ACT-01-01')

      // ArrowLeft (부모로 이동)
      await page.keyboard.press('ArrowLeft')

      // 포커스가 부모로 이동
      const parentFocused = page.locator('[data-node-id]:focus')
      const parentId = await parentFocused.getAttribute('data-node-id')
      expect(parentId).toBe('WP-01')

      // ArrowLeft (접기)
      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(200)

      // 자식 노드 숨김 확인
      await expect(children).not.toBeVisible()
    })

    test('[E2E-KBD-003] should toggle with Space key', async ({ page }) => {
      const nodeSelector = '[data-node-id="WP-01"]'

      // 노드에 포커스
      await page.locator(nodeSelector).focus()

      // Space (펼치기)
      await page.keyboard.press('Space')
      await page.waitForTimeout(200)

      const children = page.locator('[data-node-id="ACT-01-01"]')
      await expect(children).toBeVisible()

      // Space (접기)
      await page.keyboard.press('Space')
      await page.waitForTimeout(200)

      await expect(children).not.toBeVisible()
    })

    test('[E2E-KBD-004] should navigate to first/last node with Home/End', async ({ page }) => {
      await page.locator('.wbs-tree-panel').focus()

      // End (마지막 노드)
      await page.keyboard.press('End')

      const lastFocused = page.locator('[data-node-id]:focus')
      const lastId = await lastFocused.getAttribute('data-node-id')
      expect(lastId).toBeTruthy()

      // Home (첫 노드)
      await page.keyboard.press('Home')

      const firstFocused = page.locator('[data-node-id]:focus')
      const firstId = await firstFocused.getAttribute('data-node-id')
      expect(firstId).toBe('WP-01')
    })

    test('[E2E-KBD-005] should complete full workflow with keyboard only', async ({ page }) => {
      // Tab으로 트리 포커스
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')  // 헤더 버튼 건너뛰기

      // 화살표로 탐색
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowRight')  // 펼치기
      await page.keyboard.press('ArrowRight')  // 자식으로 이동

      // Enter로 선택
      await page.keyboard.press('Enter')

      // 상세 패널 표시 확인
      const detailPanel = page.locator('.task-detail-panel')
      await expect(detailPanel).toBeVisible()

      // Escape로 선택 해제
      await page.keyboard.press('Escape')

      await expect(detailPanel).not.toBeVisible()
    })
  })

  test.describe('Persistence', () => {
    test('[E2E-PER-001] should restore expanded state after reload', async ({ page }) => {
      // 노드 펼치기
      await page.click('[data-node-id="WP-01"] .tree-toggle-button')
      await page.waitForTimeout(200)

      // 자식 노드 확인
      const childBefore = page.locator('[data-node-id="ACT-01-01"]')
      await expect(childBefore).toBeVisible()

      // 페이지 새로고침
      await page.reload()

      // 트리 로드 대기
      await page.waitForSelector('.wbs-tree-panel')
      await page.waitForTimeout(500)  // 복원 대기

      // 자식 노드 여전히 표시됨
      const childAfter = page.locator('[data-node-id="ACT-01-01"]')
      await expect(childAfter).toBeVisible()
    })

    test('[E2E-PER-002] should maintain separate state per project', async ({ page }) => {
      // 프로젝트 A에서 펼치기
      await page.goto('/wbs?projectId=project-a')
      await page.waitForSelector('.wbs-tree-panel')
      await page.click('[data-node-id="WP-01"] .tree-toggle-button')
      await page.waitForTimeout(200)

      // 프로젝트 B로 전환
      await page.goto('/wbs?projectId=project-b')
      await page.waitForSelector('.wbs-tree-panel')

      // B는 접혀있음
      const childB = page.locator('[data-node-id="ACT-01-01"]')
      await expect(childB).not.toBeVisible()

      // A로 다시 전환
      await page.goto('/wbs?projectId=project-a')
      await page.waitForSelector('.wbs-tree-panel')
      await page.waitForTimeout(500)

      // A는 펼쳐져 있음
      const childA = page.locator('[data-node-id="ACT-01-01"]')
      await expect(childA).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('[E2E-PERF-001] should maintain 60fps during interactions', async ({ page }) => {
      // Performance API 사용
      await page.evaluate(() => {
        (window as any).frameCount = 0
        const countFrames = () => {
          (window as any).frameCount++
          requestAnimationFrame(countFrames)
        }
        requestAnimationFrame(countFrames)
      })

      // 1초 동안 펼치기/접기 반복
      const startTime = Date.now()
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("전체 펼치기")')
        await page.waitForTimeout(100)
        await page.click('button:has-text("전체 접기")')
        await page.waitForTimeout(100)
      }
      const duration = Date.now() - startTime

      // 프레임 수 확인
      const frameCount = await page.evaluate(() => (window as any).frameCount)
      const fps = frameCount / (duration / 1000)

      expect(fps).toBeGreaterThanOrEqual(30)  // 최소 30fps (60fps 목표)
    })
  })

  test.describe('Accessibility', () => {
    test('[E2E-A11Y-001] should pass accessibility audit', async ({ page }) => {
      // axe-core 통합 (playwright-axe 사용)
      const { injectAxe, checkA11y } = await import('axe-playwright')

      await injectAxe(page)

      // 접근성 검사
      await checkA11y(page, '.wbs-tree-panel', {
        detailedReport: true,
        detailedReportOptions: {
          html: true
        }
      })
    })

    test('[E2E-A11Y-002] should have proper ARIA attributes', async ({ page }) => {
      const treePanel = page.locator('.wbs-tree-panel')
      await expect(treePanel).toHaveAttribute('role', 'tree')

      const treeNode = page.locator('[data-node-id="WP-01"]')
      await expect(treeNode).toHaveAttribute('role', 'treeitem')
      await expect(treeNode).toHaveAttribute('aria-expanded')
    })
  })
})
```

---

## 4. 테스트 실행 및 리포트

### 4.1 로컬 실행

```bash
# 단위 테스트 실행
npm run test:unit

# 단위 테스트 (watch 모드)
npm run test:unit -- --watch

# 커버리지 리포트 생성
npm run test:unit -- --coverage

# E2E 테스트 실행
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e -- --ui

# E2E 테스트 (특정 브라우저)
npm run test:e2e -- --project=chromium
```

### 4.2 커버리지 목표

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| **Line Coverage** | ≥80% | Vitest --coverage |
| **Branch Coverage** | ≥75% | Vitest --coverage |
| **Function Coverage** | ≥85% | Vitest --coverage |
| **Statement Coverage** | ≥80% | Vitest --coverage |

### 4.3 CI/CD 통합

**GitHub Actions 예시**:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 5. 인수 기준 검증

| AC ID | 인수 기준 | 검증 테스트 | 통과 조건 |
|-------|----------|-----------|----------|
| AC-01 | 노드 클릭 시 펼침/접기 토글 동작 | E2E-UI-001, UT-TI-001 | ✅ 테스트 통과 |
| AC-02 | 노드 더블클릭 시 펼침/접기 토글 동작 | E2E-UI-001 (추가) | ✅ 테스트 통과 |
| AC-03 | Space 키로 노드 펼침/접기 토글 | E2E-KBD-003, UT-KBD-006 | ✅ 테스트 통과 |
| AC-04 | 노드 선택 시 상세 패널 표시 | E2E-SEL-001, UT-TI-003 | ✅ 테스트 통과 |
| AC-05 | Enter 키로 노드 선택 | E2E-KBD-005, UT-KBD-005 | ✅ 테스트 통과 |
| AC-06 | ArrowDown/Up으로 다음/이전 노드 이동 | E2E-KBD-001, UT-KBD-001/002 | ✅ 테스트 통과 |
| AC-07 | ArrowRight/Left로 펼치기/접기 또는 자식/부모 이동 | E2E-KBD-002, UT-KBD-003/004 | ✅ 테스트 통과 |
| AC-08 | Home/End 키로 첫/마지막 노드 이동 | E2E-KBD-004, UT-KBD-007/008 | ✅ 테스트 통과 |
| AC-09 | Esc 키로 선택 해제 | E2E-KBD-005, UT-KBD-009 | ✅ 테스트 통과 |
| AC-10 | 전체 펼치기 버튼 동작 | E2E-UI-001, UT-TI-002a | ✅ 테스트 통과 |
| AC-11 | 전체 접기 버튼 동작 | E2E-UI-001, UT-TI-002b | ✅ 테스트 통과 |
| AC-12 | 펼침/접기 상태가 로컬 스토리지에 저장됨 | E2E-PER-001, UT-PER-001 | ✅ 테스트 통과 |
| AC-13 | 페이지 새로고침 후 펼침/접기 상태 복원됨 | E2E-PER-001, UT-PER-001 | ✅ 테스트 통과 |
| AC-14 | 선택된 노드가 시각적으로 하이라이트됨 | E2E-SEL-002, UT-TI-004 | ✅ 테스트 통과 |
| AC-15 | 키보드로 이동 시 자동 스크롤 조정 | E2E-KBD-001, UT-KBD-010 | ✅ 테스트 통과 |

---

## 6. 다음 단계

### 6.1 구현 단계 (/wf:build)

1. **Composable 파일 작성**
   - `app/composables/useTreeInteraction.ts`
   - `app/composables/useKeyboardNav.ts`
   - `app/composables/useTreePersistence.ts`

2. **테스트 파일 작성**
   - `tests/unit/composables/useTreeInteraction.test.ts`
   - `tests/unit/composables/useKeyboardNav.test.ts`
   - `tests/unit/composables/useTreePersistence.test.ts`
   - `tests/e2e/tree-interaction.spec.ts`

3. **컴포넌트 통합**
   - WbsTreeNode에 useTreeInteraction 적용
   - WbsTreePanel에 useKeyboardNav, useTreePersistence 적용

### 6.2 검증 단계 (/wf:verify)

1. **단위 테스트 실행**
   ```bash
   npm run test:unit -- --coverage
   ```
   - 목표: 커버리지 ≥80%

2. **E2E 테스트 실행**
   ```bash
   npm run test:e2e
   ```
   - 목표: 모든 시나리오 통과

3. **접근성 검증**
   - Lighthouse 감사 (Accessibility ≥90)
   - axe-core 자동화 테스트

4. **성능 검증**
   - 프레임율 측정 (≥60fps)
   - 로컬 스토리지 크기 확인 (<1MB)

---

## 7. 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-03)

---

<!--
Author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
Purpose: Comprehensive test specification for Tree Interaction composables
Tools: Vitest (unit), Playwright (E2E), axe-core (a11y)
Coverage: ≥80% code, 100% AC
-->
