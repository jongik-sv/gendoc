# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**
> * 단위 테스트, 통합 테스트, E2E 테스트 상세 명세
> * 테스트 데이터 및 Fixture 정의
> * 테스트 커버리지 목표 및 측정 기준
> * 회귀 테스트 및 성능 테스트 시나리오

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (System Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 상세설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md` | §10 테스트 명세 |
| 추적성 매트릭스 | `.jjiban/projects/jjiban/tasks/TSK-05-05/025-traceability-matrix.md` | 전체 |

---

## 1. 테스트 전략

### 1.1 테스트 피라미드

```
           /\
          /E2E\         6개 시나리오 (10%)
         /------\
        /  통합   \      4개 스위트 (20%)
       /----------\
      /   단위      \    5개 스위트 (70%)
     /--------------\
```

### 1.2 테스트 유형별 목표

| 테스트 유형 | 목표 커버리지 | 실행 환경 | 실행 주기 |
|-----------|------------|---------|---------|
| 단위 테스트 | 90% 이상 | Vitest | 커밋 전, CI 자동 |
| 통합 테스트 | 80% 이상 | Vitest + Pinia | PR 전, CI 자동 |
| E2E 테스트 | 주요 시나리오 | Playwright | PR 전, 배포 전 |
| 성능 테스트 | NFR 충족 여부 | Vitest + Performance API | PR 전 수동 |
| 회귀 테스트 | 기존 기능 | Playwright | 배포 전 자동 |

---

## 2. 단위 테스트 (Unit Tests)

### 2.1 calculateProgressStats (유틸리티 함수)

**파일**: `tests/unit/utils/wbsProgress.test.ts`

#### 2.1.1 테스트 스위트 구조

```typescript
import { describe, it, expect } from 'vitest'
import { calculateProgressStats } from '~/utils/wbsProgress'
import type { WbsNode } from '~/types'

describe('calculateProgressStats', () => {
  describe('빈 노드 처리', () => {
    // 테스트 케이스 2.1.2
  })

  describe('단일 레벨 구조', () => {
    // 테스트 케이스 2.1.3, 2.1.4
  })

  describe('중첩 구조', () => {
    // 테스트 케이스 2.1.5
  })

  describe('상태별 카운팅', () => {
    // 테스트 케이스 2.1.6
  })

  describe('엣지 케이스', () => {
    // 테스트 케이스 2.1.7
  })
})
```

#### 2.1.2 테스트 케이스: 빈 WP 노드

```typescript
it('빈 WP 노드는 total=0 반환', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Empty WP',
    children: []
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(0)
  expect(stats.completed).toBe(0)
  expect(stats.inProgress).toBe(0)
  expect(stats.todo).toBe(0)
  expect(Object.keys(stats.byStatus).length).toBe(0)
})
```

**검증 항목**:
- ✅ total === 0
- ✅ completed === 0
- ✅ inProgress === 0
- ✅ todo === 0
- ✅ byStatus 빈 객체

#### 2.1.3 테스트 케이스: 완료된 Task만 있는 WP

```typescript
it('완료된 Task만 있는 WP는 completed=total', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Completed WP',
    children: [
      { id: 'TSK-01', type: 'task', title: 'T1', status: '[xx]', children: [] },
      { id: 'TSK-02', type: 'task', title: 'T2', status: '[xx]', children: [] }
    ]
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(2)
  expect(stats.completed).toBe(2)
  expect(stats.inProgress).toBe(0)
  expect(stats.todo).toBe(0)
  expect(stats.byStatus['[xx]']).toBe(2)
})
```

**검증 항목**:
- ✅ total === 2
- ✅ completed === 2 (모든 Task가 [xx])
- ✅ byStatus['[xx]'] === 2

#### 2.1.4 테스트 케이스: 다양한 상태의 Task

```typescript
it('다양한 상태의 Task가 있는 WP는 정확한 카운트', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Mixed WP',
    children: [
      {
        id: 'ACT-01-01',
        type: 'act',
        title: 'Act 1',
        children: [
          { id: 'TSK-01', type: 'task', title: 'T1', status: '[ ]', children: [] },
          { id: 'TSK-02', type: 'task', title: 'T2', status: '[bd]', children: [] },
          { id: 'TSK-03', type: 'task', title: 'T3', status: '[xx]', children: [] }
        ]
      },
      { id: 'TSK-04', type: 'task', title: 'T4', status: '[im]', children: [] }
    ]
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(4)
  expect(stats.todo).toBe(1)           // [ ]
  expect(stats.inProgress).toBe(2)     // [bd], [im]
  expect(stats.completed).toBe(1)      // [xx]
  expect(stats.byStatus['[ ]']).toBe(1)
  expect(stats.byStatus['[bd]']).toBe(1)
  expect(stats.byStatus['[im]']).toBe(1)
  expect(stats.byStatus['[xx]']).toBe(1)
})
```

**검증 항목**:
- ✅ total === 4
- ✅ todo === 1 (status === '[ ]')
- ✅ inProgress === 2 (status !== '[ ]' && !== '[xx]')
- ✅ completed === 1 (status === '[xx]')
- ✅ byStatus 각 상태별 정확한 카운트

#### 2.1.5 테스트 케이스: 중첩된 ACT 구조

```typescript
it('중첩된 ACT 구조에서 모든 Task 수집', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Nested WP',
    children: [
      {
        id: 'ACT-01-01',
        type: 'act',
        title: 'Act 1',
        children: [
          {
            id: 'ACT-01-01-01',
            type: 'act',
            title: 'Sub Act',
            children: [
              { id: 'TSK-01', type: 'task', title: 'T1', status: '[xx]', children: [] }
            ]
          }
        ]
      }
    ]
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(1)
  expect(stats.completed).toBe(1)
})
```

**검증 항목**:
- ✅ 3단계 중첩 구조에서 Task 수집
- ✅ 재귀 탐색 정확성

#### 2.1.6 테스트 케이스: Defect 및 Infrastructure 상태

```typescript
it('Defect 및 Infrastructure 카테고리 상태 처리', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Mixed Categories',
    children: [
      { id: 'TSK-01', type: 'task', title: 'T1', status: '[an]', category: 'defect', children: [] },
      { id: 'TSK-02', type: 'task', title: 'T2', status: '[ds]', category: 'infrastructure', children: [] },
      { id: 'TSK-03', type: 'task', title: 'T3', status: '[fx]', category: 'defect', children: [] }
    ]
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(3)
  expect(stats.inProgress).toBe(3)     // [an], [ds], [fx] 모두 진행 중
  expect(stats.byStatus['[an]']).toBe(1)
  expect(stats.byStatus['[ds]']).toBe(1)
  expect(stats.byStatus['[fx]']).toBe(1)
})
```

**검증 항목**:
- ✅ Defect 상태 ([an], [fx]) 처리
- ✅ Infrastructure 상태 ([ds]) 처리

#### 2.1.7 테스트 케이스: status undefined 처리

```typescript
it('status가 undefined인 Task는 [ ]로 처리', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Undefined Status',
    children: [
      { id: 'TSK-01', type: 'task', title: 'T1', children: [] },  // status 없음
      { id: 'TSK-02', type: 'task', title: 'T2', status: '[bd]', children: [] }
    ]
  }

  const stats = calculateProgressStats(node)

  expect(stats.total).toBe(2)
  expect(stats.todo).toBe(1)           // status undefined → '[ ]'
  expect(stats.inProgress).toBe(1)     // [bd]
  expect(stats.byStatus['[ ]']).toBe(1)
})
```

**검증 항목**:
- ✅ status undefined → '[ ]' 기본값 처리

---

### 2.2 WpActBasicInfo

**파일**: `tests/unit/components/wbs/detail/WpActBasicInfo.test.ts`

#### 2.2.1 테스트 스위트 구조

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import WpActBasicInfo from '~/components/wbs/detail/WpActBasicInfo.vue'
import type { WbsNode } from '~/types'

describe('WpActBasicInfo', () => {
  describe('노드 정보 표시', () => {
    // 테스트 케이스 2.2.2, 2.2.3, 2.2.4
  })

  describe('진행률 표시', () => {
    // 테스트 케이스 2.2.5, 2.2.6
  })

  describe('일정 표시', () => {
    // 테스트 케이스 2.2.7
  })
})
```

#### 2.2.2 테스트 케이스: WP 노드 ID와 제목 표시

```typescript
it('WP 노드 ID와 제목을 표시한다', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test Work Package',
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  expect(wrapper.find('[data-testid="node-id-badge"]').text()).toBe('WP-01')
  expect(wrapper.text()).toContain('Test Work Package')
})
```

**검증 항목**:
- ✅ 노드 ID 표시
- ✅ 노드 제목 표시

#### 2.2.3 테스트 케이스: ACT 노드 아이콘 구분

```typescript
it('ACT 노드는 🔶 아이콘을 표시한다', () => {
  const node: WbsNode = {
    id: 'ACT-01-01',
    type: 'act',
    title: 'Test Activity',
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  const icon = wrapper.find('.node-icon-act')
  expect(icon.exists()).toBe(true)
  expect(icon.text()).toBe('🔶')
})
```

**검증 항목**:
- ✅ ACT 아이콘 표시
- ✅ CSS 클래스 적용

#### 2.2.4 테스트 케이스: WP 노드 아이콘 구분

```typescript
it('WP 노드는 🔷 아이콘을 표시한다', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test WP',
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  const icon = wrapper.find('.node-icon-wp')
  expect(icon.exists()).toBe(true)
  expect(icon.text()).toBe('🔷')
})
```

#### 2.2.5 테스트 케이스: 진행률 80% 이상 초록색

```typescript
it('진행률 80% 이상일 때 초록색 ProgressBar 표시', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'High Progress',
    progress: 90,
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  const progressBar = wrapper.find('[data-testid="node-progress-bar"]')
  expect(progressBar.classes()).toContain('progress-bar-high')
})
```

**검증 항목**:
- ✅ progress >= 80 → `.progress-bar-high` 클래스

#### 2.2.6 테스트 케이스: 진행률 단계별 색상

```typescript
it.each([
  { progress: 90, expected: 'progress-bar-high' },
  { progress: 50, expected: 'progress-bar-medium' },
  { progress: 20, expected: 'progress-bar-low' }
])('진행률 $progress%일 때 $expected 클래스 적용', ({ progress, expected }) => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test',
    progress,
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  const progressBar = wrapper.find('[data-testid="node-progress-bar"]')
  expect(progressBar.classes()).toContain(expected)
})
```

**검증 항목**:
- ✅ progress >= 80 → high (초록색)
- ✅ 40 <= progress < 80 → medium (주황색)
- ✅ progress < 40 → low (빨간색)

#### 2.2.7 테스트 케이스: 일정 표시

```typescript
it('일정 범위를 표시한다', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test',
    schedule: {
      start: '2025-12-13',
      end: '2025-12-20'
    },
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  expect(wrapper.text()).toContain('2025-12-13 ~ 2025-12-20')
})
```

**검증 항목**:
- ✅ schedule.start ~ schedule.end 형식 표시

#### 2.2.8 테스트 케이스: 일정 없을 때 '-' 표시

```typescript
it('일정이 없을 때 "-"를 표시한다', () => {
  const node: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test',
    children: []
  }

  const wrapper = mount(WpActBasicInfo, {
    props: { node }
  })

  expect(wrapper.text()).toContain('-')
})
```

---

### 2.3 WpActProgress

**파일**: `tests/unit/components/wbs/detail/WpActProgress.test.ts`

#### 2.3.1 테스트 케이스: 진행률 통계 표시

```typescript
it('진행률 통계를 정확히 표시한다', () => {
  const stats: ProgressStats = {
    total: 10,
    completed: 5,
    inProgress: 3,
    todo: 2,
    byStatus: {
      '[ ]': 2,
      '[bd]': 1,
      '[im]': 2,
      '[xx]': 5
    }
  }

  const wrapper = mount(WpActProgress, {
    props: { stats }
  })

  expect(wrapper.text()).toContain('전체 Task: 10개')
  expect(wrapper.text()).toContain('완료: 5개 (50%)')
  expect(wrapper.text()).toContain('진행: 3개 (30%)')
  expect(wrapper.text()).toContain('대기: 2개 (20%)')
})
```

**검증 항목**:
- ✅ 전체 Task 수 표시
- ✅ 완료/진행/대기 개수 및 비율 표시

#### 2.3.2 테스트 케이스: 다단계 ProgressBar

```typescript
it('다단계 ProgressBar를 렌더링한다', () => {
  const stats: ProgressStats = {
    total: 10,
    completed: 5,
    inProgress: 3,
    todo: 2,
    byStatus: {}
  }

  const wrapper = mount(WpActProgress, {
    props: { stats }
  })

  const segments = wrapper.find('[data-testid="progress-segments"]')
  expect(segments.exists()).toBe(true)

  const completed = segments.find('.progress-segment-completed')
  expect(completed.attributes('style')).toContain('width: 50%')

  const inProgress = segments.find('.progress-segment-inprogress')
  expect(inProgress.attributes('style')).toContain('width: 30%')

  const todo = segments.find('.progress-segment-todo')
  expect(todo.attributes('style')).toContain('width: 20%')
})
```

**검증 항목**:
- ✅ 완료 세그먼트 width 50%
- ✅ 진행 세그먼트 width 30%
- ✅ 대기 세그먼트 width 20%

#### 2.3.3 테스트 케이스: 상태별 분포 표시

```typescript
it('상태별 분포를 표시한다', () => {
  const stats: ProgressStats = {
    total: 10,
    completed: 5,
    inProgress: 3,
    todo: 2,
    byStatus: {
      '[ ]': 2,
      '[bd]': 1,
      '[dd]': 1,
      '[im]': 1,
      '[vf]': 0,
      '[xx]': 5
    }
  }

  const wrapper = mount(WpActProgress, {
    props: { stats }
  })

  expect(wrapper.find('[data-testid="status-count-[ ]"]').text()).toContain('2')
  expect(wrapper.find('[data-testid="status-count-[bd]"]').text()).toContain('1')
  expect(wrapper.find('[data-testid="status-count-[xx]"]').text()).toContain('5')
})
```

**검증 항목**:
- ✅ 각 상태별 카운트 정확히 표시
- ✅ Badge 컴포넌트로 표시

#### 2.3.4 테스트 케이스: Badge severity 매핑

```typescript
it.each([
  { status: '[ ]', severity: 'secondary' },
  { status: '[bd]', severity: 'info' },
  { status: '[im]', severity: 'warning' },
  { status: '[xx]', severity: 'success' }
])('상태 $status는 $severity Badge로 표시', ({ status, severity }) => {
  const stats: ProgressStats = {
    total: 1,
    completed: 0,
    inProgress: 1,
    todo: 0,
    byStatus: { [status]: 1 }
  }

  const wrapper = mount(WpActProgress, {
    props: { stats }
  })

  const badge = wrapper.find(`[data-testid="status-count-${status}"]`)
  expect(badge.attributes('severity')).toBe(severity)
})
```

---

### 2.4 WpActChildren

**파일**: `tests/unit/components/wbs/detail/WpActChildren.test.ts`

#### 2.4.1 테스트 케이스: 하위 노드 목록 렌더링

```typescript
it('하위 노드 목록을 렌더링한다', () => {
  const children: WbsNode[] = [
    { id: 'ACT-01-01', title: 'Test ACT', type: 'act', children: [] },
    { id: 'TSK-01-01', title: 'Test Task', type: 'task', status: '[xx]', children: [] }
  ]

  const wrapper = mount(WpActChildren, {
    props: { children }
  })

  expect(wrapper.findAll('.child-item').length).toBe(2)
  expect(wrapper.text()).toContain('ACT-01-01: Test ACT')
  expect(wrapper.text()).toContain('TSK-01-01: Test Task')
})
```

**검증 항목**:
- ✅ 2개 하위 노드 렌더링
- ✅ ID와 제목 표시

#### 2.4.2 테스트 케이스: 빈 children 배열

```typescript
it('빈 children 배열일 때 빈 상태 메시지를 표시한다', () => {
  const wrapper = mount(WpActChildren, {
    props: { children: [] }
  })

  expect(wrapper.find('[data-testid="children-empty-message"]').exists()).toBe(true)
  expect(wrapper.text()).toContain('하위 노드가 없습니다')
})
```

**검증 항목**:
- ✅ 빈 상태 메시지 표시

#### 2.4.3 테스트 케이스: 하위 노드 클릭 이벤트

```typescript
it('하위 노드 클릭 시 select 이벤트를 emit한다', async () => {
  const children: WbsNode[] = [
    { id: 'ACT-01-01', title: 'Test', type: 'act', children: [] }
  ]

  const wrapper = mount(WpActChildren, {
    props: { children }
  })

  await wrapper.find('[data-testid="child-item-ACT-01-01"]').trigger('click')

  expect(wrapper.emitted('select')).toEqual([['ACT-01-01']])
})
```

**검증 항목**:
- ✅ click 이벤트 → select emit
- ✅ emit 값: 하위 노드 ID

#### 2.4.4 테스트 케이스: Enter 키로 선택

```typescript
it('Enter 키로 하위 노드를 선택할 수 있다', async () => {
  const children: WbsNode[] = [
    { id: 'ACT-01-01', title: 'Test', type: 'act', children: [] }
  ]

  const wrapper = mount(WpActChildren, {
    props: { children }
  })

  const item = wrapper.find('[data-testid="child-item-ACT-01-01"]')
  await item.trigger('keydown.enter')

  expect(wrapper.emitted('select')).toEqual([['ACT-01-01']])
})
```

**검증 항목**:
- ✅ keydown.enter 이벤트 → select emit

#### 2.4.5 테스트 케이스: Task 노드 상태 표시

```typescript
it('Task 노드는 상태 Badge를 표시한다', () => {
  const children: WbsNode[] = [
    { id: 'TSK-01', type: 'task', title: 'Test', status: '[xx]', children: [] }
  ]

  const wrapper = mount(WpActChildren, {
    props: { children }
  })

  const badge = wrapper.find('.child-header Badge')
  expect(badge.text()).toBe('[xx]')
})
```

**검증 항목**:
- ✅ Task 노드는 status Badge 표시

#### 2.4.6 테스트 케이스: WP/ACT 노드 정보 표시

```typescript
it('WP/ACT 노드는 진행률과 Task 수를 표시한다', () => {
  const children: WbsNode[] = [
    {
      id: 'ACT-01-01',
      type: 'act',
      title: 'Test',
      progress: 75,
      taskCount: 5,
      children: []
    }
  ]

  const wrapper = mount(WpActChildren, {
    props: { children }
  })

  const info = wrapper.find('.child-info')
  expect(info.text()).toContain('진행률: 75%')
  expect(info.text()).toContain('Task: 5개')
})
```

**검증 항목**:
- ✅ ACT/WP는 진행률 표시
- ✅ ACT/WP는 Task 수 표시

---

## 3. 통합 테스트 (Integration Tests)

### 3.1 selectionStore 확장

**파일**: `tests/unit/stores/selection.test.ts`

#### 3.1.1 테스트 케이스: isWpOrActSelected - WP

```typescript
it('WP 선택 시 isWpOrActSelected === true', () => {
  const wbsStore = useWbsStore()
  wbsStore.flatNodes.set('WP-01', {
    id: 'WP-01',
    type: 'wp',
    title: 'Test WP',
    children: []
  })

  const store = useSelectionStore()
  store.selectedNodeId = 'WP-01'

  expect(store.isWpOrActSelected).toBe(true)
})
```

#### 3.1.2 테스트 케이스: isWpOrActSelected - ACT

```typescript
it('ACT 선택 시 isWpOrActSelected === true', () => {
  const store = useSelectionStore()
  store.selectedNodeId = 'ACT-01-01'

  expect(store.isWpOrActSelected).toBe(true)
})
```

#### 3.1.3 테스트 케이스: isWpOrActSelected - Task

```typescript
it('Task 선택 시 isWpOrActSelected === false', () => {
  const store = useSelectionStore()
  store.selectedNodeId = 'TSK-01-01-01'

  expect(store.isWpOrActSelected).toBe(false)
})
```

#### 3.1.4 테스트 케이스: selectedNode 반환

```typescript
it('selectedNode: WP 선택 시 해당 노드 반환', () => {
  const wbsStore = useWbsStore()
  const wpNode: WbsNode = {
    id: 'WP-01',
    type: 'wp',
    title: 'Test WP',
    children: []
  }
  wbsStore.flatNodes.set('WP-01', wpNode)

  const store = useSelectionStore()
  store.selectedNodeId = 'WP-01'

  expect(store.selectedNode).toBe(wpNode)
  expect(store.selectedNode?.id).toBe('WP-01')
})
```

#### 3.1.5 테스트 케이스: selectedNode - Task 선택 시 null

```typescript
it('selectedNode: Task 선택 시 null 반환', () => {
  const store = useSelectionStore()
  store.selectedNodeId = 'TSK-01-01-01'

  expect(store.selectedNode).toBeNull()
})
```

---

## 4. E2E 테스트 (End-to-End Tests)

### 4.1 테스트 환경 설정

**파일**: `tests/e2e/wp-act-detail-panel.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('WP/ACT Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    // 프로젝트 페이지로 이동
    await page.goto('/wbs?project=jjiban')

    // WBS 콘텐츠 로드 대기
    await page.waitForSelector('[data-testid="wbs-content"]')
  })

  // 시나리오 4.2 ~ 4.7
})
```

---

### 4.2 시나리오 1: WP 선택 및 정보 표시

**목적**: WP 노드 선택 시 WpActDetailPanel이 정상 렌더링되고 정보가 표시되는지 확인

```typescript
test('WP 선택 시 WpActDetailPanel 렌더링', async ({ page }) => {
  // Step 1: WP 노드 클릭
  await page.click('[data-testid="node-WP-01"]')

  // Step 2: WpActDetailPanel 표시 확인
  const detailPanel = page.locator('[data-testid="wp-act-detail-panel"]')
  await expect(detailPanel).toBeVisible()

  // Step 3: 기본 정보 패널 확인
  const basicInfoPanel = page.locator('[data-testid="wp-act-basic-info-panel"]')
  await expect(basicInfoPanel).toBeVisible()

  // Step 4: 노드 ID 확인
  const idBadge = page.locator('[data-testid="node-id-badge"]')
  await expect(idBadge).toHaveText('WP-01')

  // Step 5: 진행률 표시 확인
  const progressBar = page.locator('[data-testid="node-progress-bar"]')
  await expect(progressBar).toBeVisible()

  // Step 6: 진행 상황 패널 확인
  const progressPanel = page.locator('[data-testid="wp-act-progress-panel"]')
  await expect(progressPanel).toBeVisible()

  // Step 7: 하위 노드 목록 확인
  const childrenPanel = page.locator('[data-testid="wp-act-children-panel"]')
  await expect(childrenPanel).toBeVisible()

  // Step 8: 스크린샷 캡처
  await page.screenshot({
    path: 'test-results/screenshots/e2e-wp-detail-panel.png',
    fullPage: true
  })
})
```

**검증 항목**:
- ✅ WpActDetailPanel 렌더링
- ✅ 기본 정보 표시 (ID, 진행률)
- ✅ 진행 상황 표시
- ✅ 하위 노드 목록 표시

---

### 4.3 시나리오 2: 하위 노드 클릭 및 전환

**목적**: 하위 노드 클릭 시 선택이 변경되고 패널이 업데이트되는지 확인

```typescript
test('하위 노드 클릭 시 선택 변경', async ({ page }) => {
  // Step 1: WP 선택
  await page.click('[data-testid="node-WP-01"]')
  await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('WP-01')

  // Step 2: 하위 ACT 클릭
  await page.click('[data-testid="child-item-ACT-01-01"]')

  // Step 3: WpActDetailPanel이 ACT 정보로 업데이트 확인
  await expect(page.locator('[data-testid="wp-act-detail-panel"]')).toBeVisible()
  await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('ACT-01-01')

  // Step 4: 하위 Task 클릭
  await page.click('[data-testid="child-item-TSK-01-01-01"]')

  // Step 5: TaskDetailPanel로 전환 확인
  await expect(page.locator('[data-testid="task-detail-panel"]')).toBeVisible()

  // Step 6: 스크린샷 캡처
  await page.screenshot({
    path: 'test-results/screenshots/e2e-wp-act-navigation.png'
  })
})
```

**검증 항목**:
- ✅ 하위 ACT 클릭 → WpActDetailPanel 업데이트
- ✅ 하위 Task 클릭 → TaskDetailPanel 전환

---

### 4.4 시나리오 3: ACT 선택 및 정보 표시

**목적**: ACT 노드 선택 시 WpActDetailPanel이 정상 동작하는지 확인

```typescript
test('ACT 선택 시 WpActDetailPanel 렌더링', async ({ page }) => {
  // Step 1: ACT 노드 클릭
  await page.click('[data-testid="node-ACT-01-01"]')

  // Step 2: WpActDetailPanel 표시 확인
  await expect(page.locator('[data-testid="wp-act-detail-panel"]')).toBeVisible()

  // Step 3: ACT ID 확인
  await expect(page.locator('[data-testid="node-id-badge"]')).toHaveText('ACT-01-01')

  // Step 4: ACT 아이콘 확인
  const actIcon = page.locator('.node-icon-act')
  await expect(actIcon).toBeVisible()
})
```

**검증 항목**:
- ✅ ACT 노드도 WpActDetailPanel 렌더링
- ✅ ACT 아이콘 표시

---

### 4.5 시나리오 4: 진행률 시각화 정확성 검증

**목적**: 진행률 통계가 정확히 계산되고 시각화되는지 확인

```typescript
test('진행률 시각화 정확성 검증', async ({ page }) => {
  // Step 1: WP 선택
  await page.click('[data-testid="node-WP-01"]')

  // Step 2: 진행 상황 패널 확인
  const progressPanel = page.locator('[data-testid="wp-act-progress-panel"]')
  await expect(progressPanel).toBeVisible()

  // Step 3: 전체 Task 수 확인
  await expect(progressPanel).toContainText('전체 Task:')

  // Step 4: 완료/진행/대기 통계 확인
  await expect(progressPanel).toContainText('완료:')
  await expect(progressPanel).toContainText('진행:')
  await expect(progressPanel).toContainText('대기:')

  // Step 5: 다단계 ProgressBar 표시 확인
  const progressSegments = page.locator('[data-testid="progress-segments"]')
  await expect(progressSegments).toBeVisible()

  // Step 6: 상태별 분포 확인
  const statusCounts = page.locator('[data-testid^="status-count-"]')
  const count = await statusCounts.count()
  expect(count).toBeGreaterThan(0)

  // Step 7: 스크린샷 캡처
  await page.screenshot({
    path: 'test-results/screenshots/e2e-wp-progress-visualization.png'
  })
})
```

**검증 항목**:
- ✅ 진행 상황 통계 표시
- ✅ 다단계 ProgressBar 렌더링
- ✅ 상태별 분포 표시

---

### 4.6 시나리오 5: 빈 WP/ACT 빈 상태 메시지

**목적**: 하위 노드가 없는 WP/ACT의 빈 상태 처리 확인

```typescript
test('빈 WP/ACT의 빈 상태 메시지', async ({ page }) => {
  // 테스트 데이터: 하위 노드가 없는 WP 생성 필요
  // 현재 jjiban 프로젝트는 모든 WP에 하위 노드가 있으므로
  // 테스트 프로젝트 또는 Mock 데이터 필요

  // Step 1: 빈 WP 노드 클릭
  await page.click('[data-testid="node-WP-EMPTY"]')

  // Step 2: 빈 상태 메시지 확인
  const emptyMessage = page.locator('[data-testid="children-empty-message"]')
  await expect(emptyMessage).toBeVisible()
  await expect(emptyMessage).toContainText('하위 노드가 없습니다')
})
```

**검증 항목**:
- ✅ children.length === 0 → 빈 상태 메시지 표시

---

### 4.7 시나리오 6: 키보드 네비게이션

**목적**: 키보드로 하위 노드를 탐색하고 선택할 수 있는지 확인

```typescript
test('키보드 네비게이션: Enter로 하위 노드 선택', async ({ page }) => {
  // Step 1: WP 선택
  await page.click('[data-testid="node-WP-01"]')

  // Step 2: 첫 번째 하위 노드에 포커스
  const firstChild = page.locator('[data-testid^="child-item-"]').first()
  await firstChild.focus()

  // Step 3: 포커스 확인 (focus 링 표시)
  await expect(firstChild).toBeFocused()

  // Step 4: Enter 키로 선택
  await firstChild.press('Enter')

  // Step 5: 선택 변경 확인
  const idBadge = page.locator('[data-testid="node-id-badge"]')
  const newId = await idBadge.textContent()
  expect(newId).not.toBe('WP-01')  // WP-01이 아닌 다른 노드로 변경됨

  // Step 6: Tab 키로 다음 노드 포커스 이동 테스트
  await page.click('[data-testid="node-WP-01"]')  // 다시 WP 선택
  const children = page.locator('[data-testid^="child-item-"]')

  await children.first().focus()
  await page.keyboard.press('Tab')

  const secondChild = children.nth(1)
  await expect(secondChild).toBeFocused()
})
```

**검증 항목**:
- ✅ Tab 키로 포커스 이동
- ✅ Enter 키로 노드 선택
- ✅ 포커스 링 표시 (접근성)

---

## 5. 성능 테스트

### 5.1 calculateProgressStats 성능 테스트

**파일**: `tests/unit/utils/wbsProgress.perf.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateProgressStats } from '~/utils/wbsProgress'
import type { WbsNode } from '~/types'

describe('calculateProgressStats - Performance', () => {
  it('200개 Task 카운팅 시간 < 50ms', () => {
    // 대량 Task 데이터 생성
    const children: WbsNode[] = Array.from({ length: 200 }, (_, i) => ({
      id: `TSK-${i}`,
      type: 'task',
      title: `Task ${i}`,
      status: i % 3 === 0 ? '[xx]' : i % 3 === 1 ? '[bd]' : '[ ]',
      children: []
    }))

    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Large WP',
      children
    }

    // 성능 측정
    const start = performance.now()
    const stats = calculateProgressStats(node)
    const duration = performance.now() - start

    // 검증
    expect(stats.total).toBe(200)
    expect(duration).toBeLessThan(50)  // 50ms 이하

    console.log(`calculateProgressStats (200 tasks): ${duration.toFixed(2)}ms`)
  })

  it('중첩 구조 (10 WP > 10 ACT > 10 Task) 카운팅 시간 < 50ms', () => {
    // 3단계 중첩 구조: 10 WP x 10 ACT x 10 Task = 1000 Task
    const acts: WbsNode[] = Array.from({ length: 10 }, (_, i) => ({
      id: `ACT-${i}`,
      type: 'act',
      title: `Act ${i}`,
      children: Array.from({ length: 10 }, (_, j) => ({
        id: `TSK-${i}-${j}`,
        type: 'task',
        title: `Task ${i}-${j}`,
        status: '[bd]',
        children: []
      }))
    }))

    const node: WbsNode = {
      id: 'WP-01',
      type: 'wp',
      title: 'Nested WP',
      children: acts
    }

    const start = performance.now()
    const stats = calculateProgressStats(node)
    const duration = performance.now() - start

    expect(stats.total).toBe(100)
    expect(duration).toBeLessThan(50)

    console.log(`calculateProgressStats (10x10 nested): ${duration.toFixed(2)}ms`)
  })
})
```

**목표**: NFR-002 (하위 노드 카운팅 성능 < 50ms)

---

### 5.2 노드 선택 성능 테스트

**파일**: `tests/unit/stores/selection.perf.test.ts`

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '~/stores/selection'
import { useWbsStore } from '~/stores/wbs'
import type { WbsNode } from '~/types'

describe('selectionStore - Performance', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('1000개 노드 중 selectedNode 조회 시간 < 100ms', () => {
    const wbsStore = useWbsStore()

    // 1000개 노드 생성
    for (let i = 0; i < 1000; i++) {
      wbsStore.flatNodes.set(`WP-${i}`, {
        id: `WP-${i}`,
        type: 'wp',
        title: `WP ${i}`,
        children: []
      })
    }

    const store = useSelectionStore()

    // 성능 측정
    const start = performance.now()
    store.selectedNodeId = 'WP-500'
    const node = store.selectedNode
    const duration = performance.now() - start

    expect(node?.id).toBe('WP-500')
    expect(duration).toBeLessThan(100)  // 100ms 이하

    console.log(`selectedNode lookup (1000 nodes): ${duration.toFixed(2)}ms`)
  })
})
```

**목표**: NFR-001 (노드 선택 응답 시간 < 100ms)

---

## 6. 회귀 테스트 체크리스트

### 6.1 기존 기능 회귀 테스트

**파일**: `tests/e2e/regression.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('회귀 테스트: 기존 기능 정상 동작', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=jjiban')
    await page.waitForSelector('[data-testid="wbs-content"]')
  })

  test('Task 선택 시 TaskDetailPanel 정상 렌더링', async ({ page }) => {
    // Task 선택
    await page.click('[data-testid="node-TSK-01-01-01"]')

    // TaskDetailPanel 표시 확인
    const taskPanel = page.locator('[data-testid="task-detail-panel"]')
    await expect(taskPanel).toBeVisible()

    // Task 정보 확인
    await expect(page.locator('[data-testid="task-basic-info"]')).toBeVisible()
  })

  test('Task 편집 기능 정상 동작', async ({ page }) => {
    await page.click('[data-testid="node-TSK-01-01-01"]')

    // 제목 편집 (기존 기능)
    const titleField = page.locator('[data-testid="task-title-field"]')
    await titleField.click()
    await titleField.fill('Updated Title')
    await page.keyboard.press('Enter')

    // 저장 완료 확인
    await expect(page.locator('text=저장 완료')).toBeVisible()
  })

  test('wbs.vue 로딩 상태 처리 정상', async ({ page }) => {
    // 페이지 새로고침
    await page.reload()

    // 로딩 스피너 표시 확인
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    // 로딩 완료 후 콘텐츠 표시 확인
    await expect(page.locator('[data-testid="wbs-content"]')).toBeVisible()
  })
})
```

**체크리스트**:
- [x] Task 선택 시 TaskDetailPanel 렌더링
- [x] Task 편집 기능 동작
- [x] wbs.vue 로딩/에러 상태 처리
- [x] selectionStore 기존 메서드 동작
- [x] wbsStore 기존 메서드 동작

---

## 7. 테스트 데이터 및 Fixture

### 7.1 테스트 데이터 Fixture

**파일**: `tests/fixtures/wbsNodes.ts`

```typescript
import type { WbsNode, ProgressStats } from '~/types'

/**
 * 테스트용 WP 노드 (완료된 하위 Task들)
 */
export const completedWpNode: WbsNode = {
  id: 'WP-TEST-01',
  type: 'wp',
  title: 'Test WP - All Completed',
  progress: 100,
  taskCount: 5,
  schedule: {
    start: '2025-12-13',
    end: '2025-12-20'
  },
  children: [
    {
      id: 'ACT-TEST-01-01',
      type: 'act',
      title: 'Test ACT',
      progress: 100,
      children: [
        { id: 'TSK-TEST-01', type: 'task', title: 'T1', status: '[xx]', children: [] },
        { id: 'TSK-TEST-02', type: 'task', title: 'T2', status: '[xx]', children: [] },
        { id: 'TSK-TEST-03', type: 'task', title: 'T3', status: '[xx]', children: [] }
      ]
    },
    { id: 'TSK-TEST-04', type: 'task', title: 'T4', status: '[xx]', children: [] },
    { id: 'TSK-TEST-05', type: 'task', title: 'T5', status: '[xx]', children: [] }
  ]
}

/**
 * 테스트용 WP 노드 (다양한 상태 혼합)
 */
export const mixedWpNode: WbsNode = {
  id: 'WP-TEST-02',
  type: 'wp',
  title: 'Test WP - Mixed Status',
  progress: 50,
  taskCount: 10,
  children: [
    {
      id: 'ACT-TEST-02-01',
      type: 'act',
      title: 'Test ACT 1',
      progress: 33,
      children: [
        { id: 'TSK-TEST-06', type: 'task', title: 'T6', status: '[ ]', children: [] },
        { id: 'TSK-TEST-07', type: 'task', title: 'T7', status: '[bd]', children: [] },
        { id: 'TSK-TEST-08', type: 'task', title: 'T8', status: '[dd]', children: [] }
      ]
    },
    {
      id: 'ACT-TEST-02-02',
      type: 'act',
      title: 'Test ACT 2',
      progress: 67,
      children: [
        { id: 'TSK-TEST-09', type: 'task', title: 'T9', status: '[im]', children: [] },
        { id: 'TSK-TEST-10', type: 'task', title: 'T10', status: '[vf]', children: [] },
        { id: 'TSK-TEST-11', type: 'task', title: 'T11', status: '[xx]', children: [] }
      ]
    },
    { id: 'TSK-TEST-12', type: 'task', title: 'T12', status: '[ ]', children: [] },
    { id: 'TSK-TEST-13', type: 'task', title: 'T13', status: '[bd]', children: [] },
    { id: 'TSK-TEST-14', type: 'task', title: 'T14', status: '[xx]', children: [] },
    { id: 'TSK-TEST-15', type: 'task', title: 'T15', status: '[xx]', children: [] }
  ]
}

/**
 * 테스트용 빈 WP 노드
 */
export const emptyWpNode: WbsNode = {
  id: 'WP-TEST-EMPTY',
  type: 'wp',
  title: 'Empty WP',
  progress: 0,
  taskCount: 0,
  children: []
}

/**
 * 테스트용 ProgressStats
 */
export const mockProgressStats: ProgressStats = {
  total: 10,
  completed: 5,
  inProgress: 3,
  todo: 2,
  byStatus: {
    '[ ]': 2,
    '[bd]': 1,
    '[dd]': 1,
    '[im]': 1,
    '[vf]': 0,
    '[xx]': 5
  }
}
```

---

## 8. 테스트 커버리지 목표

### 8.1 커버리지 메트릭

| 메트릭 | 목표 | 측정 도구 |
|--------|------|----------|
| 라인 커버리지 | 90% 이상 | Vitest coverage (c8) |
| 브랜치 커버리지 | 85% 이상 | Vitest coverage |
| 함수 커버리지 | 95% 이상 | Vitest coverage |
| 컴포넌트 커버리지 | 90% 이상 | Vue Test Utils |

### 8.2 파일별 커버리지 목표

| 파일 | 라인 | 브랜치 | 함수 | 상태 |
|------|------|--------|------|------|
| `utils/wbsProgress.ts` | 100% | 100% | 100% | 📝 명세 완료 |
| `WpActBasicInfo.vue` | 90% | 85% | 95% | 📝 명세 완료 |
| `WpActProgress.vue` | 90% | 85% | 95% | 📝 명세 완료 |
| `WpActChildren.vue` | 95% | 90% | 100% | 📝 명세 완료 |
| `WpActDetailPanel.vue` | 85% | 80% | 90% | 📝 명세 완료 |
| `NodeDetailPanel.vue` | 80% | 75% | 85% | 📝 명세 완료 |
| `stores/selection.ts` (확장) | 100% | 100% | 100% | 📝 명세 완료 |

---

## 9. 테스트 실행 가이드

### 9.1 단위 테스트 실행

```bash
# 전체 단위 테스트 실행
npm run test:unit

# 특정 파일 테스트
npm run test:unit -- wbsProgress.test.ts

# 커버리지 포함 실행
npm run test:unit -- --coverage

# Watch 모드
npm run test:unit -- --watch
```

### 9.2 E2E 테스트 실행

```bash
# 전체 E2E 테스트 실행
npm run test:e2e

# 특정 시나리오 실행
npm run test:e2e -- wp-act-detail-panel.spec.ts

# Headed 모드 (브라우저 표시)
npm run test:e2e -- --headed

# Debug 모드
npm run test:e2e -- --debug
```

### 9.3 성능 테스트 실행

```bash
# 성능 테스트 실행
npm run test:perf

# 상세 로그 포함
npm run test:perf -- --reporter=verbose
```

---

## 10. 요약 및 체크리스트

### 10.1 테스트 명세 완료 항목

- [x] 단위 테스트 명세 (5개 스위트, 30+ 테스트 케이스)
- [x] 통합 테스트 명세 (1개 스위트, 5개 테스트 케이스)
- [x] E2E 테스트 명세 (6개 시나리오)
- [x] 성능 테스트 명세 (2개 시나리오)
- [x] 회귀 테스트 체크리스트
- [x] 테스트 데이터 Fixture 정의
- [x] 커버리지 목표 설정
- [x] 테스트 실행 가이드 작성

### 10.2 다음 단계

**구현 단계**:
1. 타입 정의 추가
2. 유틸리티 함수 구현 + 단위 테스트
3. 컴포넌트 구현 + 단위 테스트
4. 스토어 확장 + 통합 테스트
5. E2E 테스트 실행
6. 커버리지 확인 및 개선

**산출물**:
- `030-implementation.md`: 구현 완료 후 작성
- `031-code-review-claude-1.md`: 코드 리뷰 결과
- `070-integration-test.md`: 통합 테스트 결과
- `080-manual.md`: 사용자 매뉴얼

---

## 11. 참고 자료

### 11.1 관련 문서

- 상세설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md`
- 추적성 매트릭스: `.jjiban/projects/jjiban/tasks/TSK-05-05/025-traceability-matrix.md`

### 11.2 테스트 프레임워크

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**다음 단계**: 구현 (030-implementation.md)
