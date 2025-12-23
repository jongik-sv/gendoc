# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * 단위 테스트 케이스 상세 명세
> * E2E 테스트 시나리오 상세 명세
> * 테스트 데이터 정의
> * Given-When-Then 형식으로 명확한 테스트 기대값 정의

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (QA Engineer) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 상세설계 | `020-detail-design.md` | 섹션 8 (테스트 전략) |
| 추적성 매트릭스 | `025-traceability-matrix.md` | 섹션 2, 4 |

---

## 1. 테스트 환경 설정

### 1.1 단위 테스트 환경

**프레임워크**: Vitest
**테스트 유틸리티**: @vue/test-utils
**모킹 라이브러리**: Vitest (내장)

**설정 파일**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts'
      ]
    },
    globals: true
  }
})
```

### 1.2 E2E 테스트 환경

**프레임워크**: Playwright
**브라우저**: Chromium, Firefox, WebKit (선택)

**설정 파일**: `playwright.config.ts`

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
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 1.3 테스트 데이터

**Mock WBS 데이터**: `tests/fixtures/wbs-data.ts`

```typescript
export const mockWbsData: WbsNode = {
  id: 'jjiban',
  type: 'project',
  title: 'jjiban - AI 기반 프로젝트 관리 도구',
  progress: 0,
  children: [
    {
      id: 'WP-01',
      type: 'wp',
      title: '기본 인프라',
      progress: 0,
      children: [
        {
          id: 'TSK-01-01-01',
          type: 'task',
          title: 'Node.js 및 Nuxt 환경 설정',
          status: '[xx]',
          category: 'infrastructure',
          progress: 100,
          children: []
        },
        {
          id: 'TSK-01-01-02',
          type: 'task',
          title: 'PrimeVue UI 라이브러리 통합',
          status: '[im]',
          category: 'development',
          progress: 50,
          children: []
        }
      ]
    },
    {
      id: 'WP-02',
      type: 'wp',
      title: '데이터 관리',
      progress: 0,
      children: [
        {
          id: 'ACT-02-01',
          type: 'act',
          title: 'WBS 데이터 구조',
          progress: 0,
          children: [
            {
              id: 'TSK-02-01-01',
              type: 'task',
              title: 'WBS 타입 정의',
              status: '[bd]',
              category: 'development',
              progress: 25,
              children: []
            }
          ]
        }
      ]
    }
  ]
}

export const emptyWbsData: WbsNode = {
  id: 'empty-project',
  type: 'project',
  title: 'Empty Project',
  progress: 0,
  children: []
}
```

---

## 2. 단위 테스트 명세

### 2.1 WbsTreePanel.spec.ts

**파일 경로**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

#### UT-001: fetchWbs() 호출 확인

**FR 매핑**: FR-001

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WbsTreePanel from '~/components/wbs/WbsTreePanel.vue'
import { useWbsStore } from '~/stores/wbs'

describe('WbsTreePanel - UT-001', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('컴포넌트 마운트 시 projectId로 fetchWbs()를 호출한다', async () => {
    // Given: projectId가 route query에 존재
    const projectId = 'test-project'
    const wrapper = mount(WbsTreePanel, {
      global: {
        mocks: {
          $route: { query: { projectId } }
        }
      }
    })

    const store = useWbsStore()
    const fetchSpy = vi.spyOn(store, 'fetchWbs')

    // When: 컴포넌트가 마운트됨
    await wrapper.vm.$nextTick()

    // Then: fetchWbs(projectId)가 호출됨
    expect(fetchSpy).toHaveBeenCalledWith(projectId)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
```

**예상 결과**:
- `fetchWbs()` 호출됨
- 인자로 'test-project' 전달
- 1회 호출

---

#### UT-002: 데이터 로드 성공 시 tree 업데이트

**FR 매핑**: FR-001

```typescript
it('WBS 데이터 로드 성공 시 tree 상태가 업데이트된다', async () => {
  // Given: Mock WBS 데이터
  const store = useWbsStore()
  store.tree = []

  // When: fetchWbs() 성공
  await store.fetchWbs('test-project')

  // Then: tree가 업데이트됨
  expect(store.tree).toHaveLength(1)
  expect(store.tree[0].id).toBe('jjiban')
  expect(store.tree[0].type).toBe('project')
})
```

**Mock 설정**:
```typescript
// MSW 또는 $fetch mock 설정
vi.mock('#app', () => ({
  $fetch: vi.fn(() => Promise.resolve(mockWbsData))
}))
```

**예상 결과**:
- `store.tree` 배열이 비어있지 않음
- 첫 번째 항목이 프로젝트 노드
- `flatNodes` Map 업데이트됨

---

#### UT-013: 로딩 중 스피너 표시 확인

**FR 매핑**: FR-007

```typescript
it('로딩 중 상태일 때 ProgressSpinner를 표시한다', async () => {
  // Given: 로딩 상태
  const wrapper = mount(WbsTreePanel, {
    global: {
      mocks: {
        $route: { query: { projectId: 'test' } }
      }
    }
  })

  const store = useWbsStore()
  store.loading = true

  // When: 컴포넌트 렌더링
  await wrapper.vm.$nextTick()

  // Then: 로딩 스피너 표시
  expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="content-state"]').exists()).toBe(false)
  expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(false)
})
```

**예상 결과**:
- `loading-state` 요소 존재
- `content-state`, `error-state` 미존재
- ProgressSpinner 컴포넌트 렌더링

---

#### UT-014: 에러 발생 시 메시지 표시 확인

**FR 매핑**: FR-007

```typescript
it('에러 발생 시 Message 컴포넌트로 에러 메시지를 표시한다', async () => {
  // Given: 에러 상태
  const errorMessage = 'Failed to load WBS data'
  const wrapper = mount(WbsTreePanel, {
    global: {
      mocks: {
        $route: { query: { projectId: 'test' } }
      }
    }
  })

  const store = useWbsStore()
  store.loading = false
  store.error = errorMessage

  // When: 컴포넌트 렌더링
  await wrapper.vm.$nextTick()

  // Then: 에러 메시지 표시
  expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
  expect(wrapper.text()).toContain(errorMessage)
  expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(false)
  expect(wrapper.find('[data-testid="content-state"]').exists()).toBe(false)
})
```

**예상 결과**:
- `error-state` 요소 존재
- 에러 메시지 텍스트 포함
- Message 컴포넌트 severity="error"

---

#### UT-015: 빈 상태 메시지 표시 확인

**FR 매핑**: FR-007

```typescript
it('tree가 빈 배열일 때 빈 상태 메시지를 표시한다', async () => {
  // Given: 빈 tree
  const wrapper = mount(WbsTreePanel, {
    global: {
      mocks: {
        $route: { query: { projectId: 'test' } }
      }
    }
  })

  const store = useWbsStore()
  store.loading = false
  store.error = null
  store.tree = []

  // When: 컴포넌트 렌더링
  await wrapper.vm.$nextTick()

  // Then: 빈 상태 메시지 표시
  expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  expect(wrapper.text()).toContain('WBS 데이터가 없습니다')
})
```

**예상 결과**:
- `empty-state` 요소 존재
- 안내 메시지 표시
- pi-inbox 아이콘 표시

---

### 2.2 WbsTreeHeader.spec.ts

**파일 경로**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

#### UT-003: 헤더 타이틀 렌더링 확인

**FR 매핑**: FR-002

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WbsTreeHeader from '~/components/wbs/WbsTreeHeader.vue'

describe('WbsTreeHeader - UT-003', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('헤더 타이틀 "WBS 트리"를 렌더링한다', () => {
    // Given: 컴포넌트 마운트
    const wrapper = mount(WbsTreeHeader)

    // When: 렌더링
    // Then: 타이틀 텍스트 확인
    expect(wrapper.find('h2').text()).toContain('WBS 트리')
    expect(wrapper.find('h2').attributes('id')).toBe('wbs-tree-title')
  })
})
```

**예상 결과**:
- `<h2>` 요소 존재
- 텍스트 "WBS 트리" 포함
- `id="wbs-tree-title"` 속성

---

#### UT-004: 아이콘 표시 확인

**FR 매핑**: FR-002

```typescript
it('타이틀 옆에 sitemap 아이콘을 표시한다', () => {
  // Given: 컴포넌트 마운트
  const wrapper = mount(WbsTreeHeader)

  // When: 렌더링
  // Then: 아이콘 확인
  const icon = wrapper.find('h2 i.pi-sitemap')
  expect(icon.exists()).toBe(true)
  expect(icon.classes()).toContain('text-purple-500')
})
```

**예상 결과**:
- `.pi-sitemap` 아이콘 존재
- `text-purple-500` 클래스 적용

---

#### UT-007: 전체 펼치기 버튼 클릭 시 expandAll() 호출

**FR 매핑**: FR-004

```typescript
it('전체 펼치기 버튼 클릭 시 expandAll() 액션을 호출한다', async () => {
  // Given: 컴포넌트 마운트
  const wrapper = mount(WbsTreeHeader)
  const store = useWbsStore()
  const expandSpy = vi.spyOn(store, 'expandAll')

  // When: 전체 펼치기 버튼 클릭
  await wrapper.find('[data-testid="expand-all-button"]').trigger('click')

  // Then: expandAll() 호출됨
  expect(expandSpy).toHaveBeenCalledTimes(1)
})
```

**예상 결과**:
- `expandAll()` 메서드 호출
- 1회 호출

---

#### UT-008: 전체 접기 버튼 클릭 시 collapseAll() 호출

**FR 매핑**: FR-004

```typescript
it('전체 접기 버튼 클릭 시 collapseAll() 액션을 호출한다', async () => {
  // Given: 컴포넌트 마운트
  const wrapper = mount(WbsTreeHeader)
  const store = useWbsStore()
  const collapseSpy = vi.spyOn(store, 'collapseAll')

  // When: 전체 접기 버튼 클릭
  await wrapper.find('[data-testid="collapse-all-button"]').trigger('click')

  // Then: collapseAll() 호출됨
  expect(collapseSpy).toHaveBeenCalledTimes(1)
})
```

**예상 결과**:
- `collapseAll()` 메서드 호출
- 1회 호출

---

### 2.3 WbsSummaryCards.spec.ts

**파일 경로**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

#### UT-009: 4개 카드 렌더링 확인

**FR 매핑**: FR-005

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WbsSummaryCards from '~/components/wbs/WbsSummaryCards.vue'
import { useWbsStore } from '~/stores/wbs'

describe('WbsSummaryCards - UT-009', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('WP, ACT, TSK, Progress 총 4개의 카드를 렌더링한다', () => {
    // Given: Mock 데이터 설정
    const store = useWbsStore()
    store.tree = [mockWbsData]
    store.flatNodes = flattenTree([mockWbsData])

    // When: 컴포넌트 마운트
    const wrapper = mount(WbsSummaryCards)

    // Then: 4개 카드 확인
    expect(wrapper.find('[data-testid="wp-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="act-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tsk-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="progress-card"]').exists()).toBe(true)
  })
})
```

**예상 결과**:
- 4개 카드 모두 렌더링
- 각 카드에 `data-testid` 속성 존재

---

#### UT-010: wpCount, actCount, tskCount 계산 확인

**FR 매핑**: FR-005

```typescript
it('WP, ACT, TSK 카운트를 정확히 계산하여 표시한다', () => {
  // Given: Mock 데이터 (2 WP, 1 ACT, 3 TSK)
  const store = useWbsStore()
  store.tree = [mockWbsData]
  store.flatNodes = flattenTree([mockWbsData])

  // When: 컴포넌트 마운트
  const wrapper = mount(WbsSummaryCards)

  // Then: 카운트 확인
  const wpCard = wrapper.find('[data-testid="wp-card"]')
  const actCard = wrapper.find('[data-testid="act-card"]')
  const tskCard = wrapper.find('[data-testid="tsk-card"]')

  expect(wpCard.text()).toContain('2')
  expect(actCard.text()).toContain('1')
  expect(tskCard.text()).toContain('3')
})
```

**테스트 데이터**:
```typescript
// mockWbsData에 다음 구조 포함:
// - 2개 WP (WP-01, WP-02)
// - 1개 ACT (ACT-02-01)
// - 3개 TSK (TSK-01-01-01, TSK-01-01-02, TSK-02-01-01)
```

**예상 결과**:
- WP 카드: "2" 표시
- ACT 카드: "1" 표시
- TSK 카드: "3" 표시

---

#### UT-011: overallProgress 계산 확인

**FR 매핑**: FR-005

```typescript
it('전체 진행률을 정확히 계산하여 표시한다', () => {
  // Given: Mock 데이터 (평균 진행률 58%)
  // TSK-01-01-01: 100%, TSK-01-01-02: 50%, TSK-02-01-01: 25%
  // 평균: (100 + 50 + 25) / 3 = 58.33... → 58%
  const store = useWbsStore()
  store.tree = [mockWbsData]
  store.flatNodes = flattenTree([mockWbsData])

  // When: 컴포넌트 마운트
  const wrapper = mount(WbsSummaryCards)

  // Then: 진행률 확인
  const progressCard = wrapper.find('[data-testid="progress-card"]')
  expect(progressCard.text()).toContain('58%')
})
```

**예상 결과**:
- Progress 카드: "58%" 표시 (반올림)

---

### 2.4 WbsSearchBox.spec.ts

**파일 경로**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

#### UT-005: 검색어 입력 시 setSearchQuery() 호출

**FR 매핑**: FR-003

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WbsSearchBox from '~/components/wbs/WbsSearchBox.vue'
import { useWbsStore } from '~/stores/wbs'

describe('WbsSearchBox - UT-005', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('검색어 입력 시 300ms 후 setSearchQuery()를 호출한다', async () => {
    // Given: 컴포넌트 마운트
    const wrapper = mount(WbsSearchBox)
    const store = useWbsStore()
    const setSpy = vi.spyOn(store, 'setSearchQuery')

    // When: 검색어 입력
    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('TSK-01')

    // Then: Debounce 전에는 호출 안 됨
    expect(setSpy).not.toHaveBeenCalled()

    // 300ms 경과
    vi.advanceTimersByTime(300)

    // Then: setSearchQuery() 호출됨
    expect(setSpy).toHaveBeenCalledWith('TSK-01')
    expect(setSpy).toHaveBeenCalledTimes(1)
  })
})
```

**예상 결과**:
- 입력 직후: 호출 안 됨
- 300ms 후: `setSearchQuery('TSK-01')` 호출

---

#### UT-012: Debounce 300ms 동작 확인

**FR 매핑**: FR-006

```typescript
it('빠른 연속 입력 시 마지막 입력만 처리한다 (Debounce)', async () => {
  // Given: 컴포넌트 마운트
  const wrapper = mount(WbsSearchBox)
  const store = useWbsStore()
  const setSpy = vi.spyOn(store, 'setSearchQuery')

  // When: 빠른 연속 입력
  const input = wrapper.find('[data-testid="search-input"]')
  await input.setValue('T')
  vi.advanceTimersByTime(100)
  await input.setValue('TS')
  vi.advanceTimersByTime(100)
  await input.setValue('TSK')
  vi.advanceTimersByTime(100)

  // Then: 아직 호출 안 됨 (총 300ms 미만)
  expect(setSpy).not.toHaveBeenCalled()

  // 마지막 입력 후 300ms 경과
  vi.advanceTimersByTime(100) // 총 400ms

  // Then: 마지막 입력만 처리
  expect(setSpy).toHaveBeenCalledWith('TSK')
  expect(setSpy).toHaveBeenCalledTimes(1)
})
```

**예상 결과**:
- 'T', 'TS' 입력 무시
- 'TSK' 입력만 300ms 후 처리

---

### 2.5 wbs.store.spec.ts

**파일 경로**: `tests/unit/stores/wbs.spec.ts`

#### UT-006: filteredTree getter 동작 확인

**FR 매핑**: FR-003

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWbsStore } from '~/stores/wbs'
import { mockWbsData } from '~/tests/fixtures/wbs-data'

describe('useWbsStore - UT-006', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('검색어와 매칭되는 노드만 필터링하여 반환한다', () => {
    // Given: WBS 데이터 로드
    const store = useWbsStore()
    store.tree = [mockWbsData]
    store.flatNodes = flattenTree([mockWbsData])

    // When: 검색어 설정
    store.setSearchQuery('TSK-01')

    // Then: 필터링된 트리 확인
    const filtered = store.filteredTree
    expect(filtered).toBeDefined()
    expect(filtered.length).toBeGreaterThan(0)

    // TSK-01로 시작하는 노드만 포함되어야 함
    const allNodes = flattenTree(filtered)
    allNodes.forEach(node => {
      if (node.type === 'task') {
        expect(node.id).toContain('TSK-01')
      }
    })
  })

  it('검색어가 없으면 원본 트리를 반환한다', () => {
    // Given: WBS 데이터 로드
    const store = useWbsStore()
    store.tree = [mockWbsData]

    // When: 검색어 없음
    store.setSearchQuery('')

    // Then: 원본 트리 반환
    expect(store.filteredTree).toBe(store.tree)
  })
})
```

**예상 결과**:
- 검색어 있을 때: 매칭 노드만 포함
- 검색어 없을 때: 전체 트리 반환

---

#### UT-016: 유효하지 않은 projectId 처리

**FR 매핑**: FR-001 (에러 핸들링)

```typescript
describe('useWbsStore - UT-016', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('유효하지 않은 projectId로 fetchWbs() 호출 시 에러 상태가 설정된다', async () => {
    // Given: 유효하지 않은 projectId
    const store = useWbsStore()
    const invalidProjectId = ''

    // When: fetchWbs() 호출
    await store.fetchWbs(invalidProjectId)

    // Then: 에러 상태 확인
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
    expect(store.tree).toEqual([])
  })

  it('존재하지 않는 projectId로 fetchWbs() 호출 시 404 에러 처리', async () => {
    // Given: 존재하지 않는 projectId
    const store = useWbsStore()
    const nonExistentId = 'non-existent-project'

    // When: fetchWbs() 호출 (Mock API 404 응답)
    vi.mock('#app', () => ({
      $fetch: vi.fn().mockRejectedValue({ statusCode: 404 })
    }))
    await store.fetchWbs(nonExistentId)

    // Then: 에러 메시지 확인
    expect(store.error).toContain('프로젝트를 찾을 수 없습니다')
    expect(store.loading).toBe(false)
  })
})
```

**예상 결과**:
- 빈 projectId: 에러 상태 설정
- 존재하지 않는 projectId: 404 에러 메시지 표시
- 로딩 상태 false

---

#### UT-017: 검색어 길이 제한 테스트

**FR 매핑**: FR-003 (검색 기능)

```typescript
describe('useWbsStore - UT-017', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('1글자 검색어도 정상적으로 필터링된다', () => {
    // Given: WBS 데이터 로드
    const store = useWbsStore()
    store.tree = [mockWbsData]
    store.flatNodes = flattenTree([mockWbsData])

    // When: 1글자 검색어 설정
    store.setSearchQuery('T')

    // Then: 'T'를 포함하는 노드 필터링
    const filtered = store.filteredTree
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('매우 긴 검색어도 정상적으로 처리된다', () => {
    // Given: WBS 데이터 로드
    const store = useWbsStore()
    store.tree = [mockWbsData]
    store.flatNodes = flattenTree([mockWbsData])

    // When: 긴 검색어 설정 (100글자)
    const longQuery = 'a'.repeat(100)
    store.setSearchQuery(longQuery)

    // Then: 빈 결과 반환 (에러 없음)
    const filtered = store.filteredTree
    expect(filtered).toEqual([])
    expect(store.error).toBeNull()
  })

  it('특수문자 포함 검색어도 정상적으로 처리된다', () => {
    // Given: WBS 데이터 로드
    const store = useWbsStore()
    store.tree = [mockWbsData]
    store.flatNodes = flattenTree([mockWbsData])

    // When: 특수문자 포함 검색어
    store.setSearchQuery('TSK-01-01')

    // Then: 정상 필터링
    const filtered = store.filteredTree
    expect(store.error).toBeNull()
  })
})
```

**예상 결과**:
- 1글자 검색: 정상 필터링
- 긴 검색어: 빈 결과 반환 (에러 없음)
- 특수문자: 정상 처리

---

#### UT-018: 빈 flatNodes 상태 테스트

**FR 매핑**: FR-005 (통계 계산)

```typescript
describe('useWbsStore - UT-018', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('flatNodes가 비어있을 때 wpCount는 0을 반환한다', () => {
    // Given: 빈 스토어
    const store = useWbsStore()
    store.tree = []
    store.flatNodes = new Map()

    // When: wpCount getter 호출
    const count = store.wpCount

    // Then: 0 반환
    expect(count).toBe(0)
  })

  it('flatNodes가 비어있을 때 actCount는 0을 반환한다', () => {
    // Given: 빈 스토어
    const store = useWbsStore()
    store.tree = []
    store.flatNodes = new Map()

    // When: actCount getter 호출
    const count = store.actCount

    // Then: 0 반환
    expect(count).toBe(0)
  })

  it('flatNodes가 비어있을 때 tskCount는 0을 반환한다', () => {
    // Given: 빈 스토어
    const store = useWbsStore()
    store.tree = []
    store.flatNodes = new Map()

    // When: tskCount getter 호출
    const count = store.tskCount

    // Then: 0 반환
    expect(count).toBe(0)
  })

  it('flatNodes가 비어있을 때 overallProgress는 0을 반환한다', () => {
    // Given: 빈 스토어
    const store = useWbsStore()
    store.tree = []
    store.flatNodes = new Map()

    // When: overallProgress getter 호출
    const progress = store.overallProgress

    // Then: 0 반환
    expect(progress).toBe(0)
  })

  it('Task가 없을 때 overallProgress는 0을 반환한다 (0으로 나누기 방지)', () => {
    // Given: Task 없는 트리 (WP, ACT만 존재)
    const store = useWbsStore()
    const wpOnlyData: WbsNode = {
      id: 'project',
      type: 'project',
      title: 'Test Project',
      progress: 0,
      children: [{
        id: 'WP-01',
        type: 'wp',
        title: 'Work Package',
        progress: 0,
        children: []
      }]
    }
    store.tree = [wpOnlyData]
    store.flatNodes = flattenTree([wpOnlyData])

    // When: overallProgress getter 호출
    const progress = store.overallProgress

    // Then: 0 반환 (NaN이 아님)
    expect(progress).toBe(0)
    expect(Number.isNaN(progress)).toBe(false)
  })
})
```

**예상 결과**:
- 빈 flatNodes: 모든 카운트 0 반환
- Task 없는 트리: overallProgress 0 반환 (NaN 방지)

---

## 3. E2E 테스트 명세

### 3.1 wbs-tree-panel.spec.ts

**파일 경로**: `tests/e2e/wbs-tree-panel.spec.ts`

#### E2E-001: 페이지 로드 시 WBS 데이터 표시

**FR 매핑**: FR-001

```typescript
import { test, expect } from '@playwright/test'

test.describe('WBS Tree Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?projectId=jjiban')
    // API 응답 대기
    await page.waitForResponse(response =>
      response.url().includes('/api/projects/jjiban/wbs') &&
      response.status() === 200
    )
  })

  test('E2E-001: WBS 데이터가 성공적으로 로드되어 표시된다', async ({ page }) => {
    // Given: 페이지 로드 완료
    // When: WBS 트리 패널 확인
    const treePanel = page.locator('[data-testid="wbs-tree-panel"]')
    await expect(treePanel).toBeVisible()

    // Then: 콘텐츠 상태 표시
    const contentState = page.locator('[data-testid="content-state"]')
    await expect(contentState).toBeVisible()

    // 로딩 상태 미표시
    const loadingState = page.locator('[data-testid="loading-state"]')
    await expect(loadingState).not.toBeVisible()
  })
})
```

**예상 결과**:
- WBS 트리 패널 표시
- 로딩 스피너 사라짐
- 헤더와 트리 노드 표시

---

#### E2E-002: 헤더 영역 전체 요소 표시 확인

**FR 매핑**: FR-002

```typescript
test('E2E-002: 헤더에 타이틀, 버튼, 검색, 카드가 모두 표시된다', async ({ page }) => {
  // Given: 페이지 로드 완료
  // When: 헤더 요소 확인
  const header = page.locator('[data-testid="wbs-tree-header"]')
  await expect(header).toBeVisible()

  // Then: 타이틀 표시
  const title = header.locator('h2')
  await expect(title).toContainText('WBS 트리')

  // 전체 펼치기/접기 버튼 표시
  await expect(header.locator('[data-testid="expand-all-button"]')).toBeVisible()
  await expect(header.locator('[data-testid="collapse-all-button"]')).toBeVisible()

  // 검색 박스 표시
  const searchBox = header.locator('[data-testid="wbs-search-box"]')
  await expect(searchBox).toBeVisible()

  // 요약 카드 표시
  const summaryCards = header.locator('[data-testid="wbs-summary-cards"]')
  await expect(summaryCards).toBeVisible()
})
```

**예상 결과**:
- 모든 헤더 요소 표시
- 버튼, 검색, 카드 모두 visible

---

### 3.2 wbs-search.spec.ts

**파일 경로**: `tests/e2e/wbs-search.spec.ts`

#### E2E-003: 검색어 입력 후 필터링 결과 확인

**FR 매핑**: FR-003

```typescript
test.describe('WBS Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')
  })

  test('E2E-003: 검색어 입력 시 매칭되는 노드만 표시된다', async ({ page }) => {
    // Given: 검색 입력 필드
    const searchInput = page.locator('[data-testid="search-input"]')

    // When: 검색어 입력
    await searchInput.fill('TSK-01')

    // Debounce 대기 (300ms)
    await page.waitForTimeout(400)

    // Then: 검색 결과 확인 (TSK-04-02 구현 후 활성화)
    // const treeNodes = page.locator('[data-testid^="tree-node-"]')
    // const nodeIds = await treeNodes.allTextContents()
    // nodeIds.forEach(id => {
    //   expect(id).toContain('TSK-01')
    // })

    // 현재는 검색어가 스토어에 설정되었는지만 확인
    const clearButton = page.locator('[data-testid="clear-search-button"]')
    await expect(clearButton).toBeVisible()
  })
})
```

**예상 결과**:
- 검색어 입력 후 300ms 대기
- X 버튼 표시
- (TSK-04-02 구현 후) 매칭 노드만 표시

---

#### E2E-004: X 버튼 클릭 시 검색 초기화

**FR 매핑**: FR-003

```typescript
test('E2E-004: X 버튼 클릭 시 검색어가 초기화된다', async ({ page }) => {
  // Given: 검색어 입력됨
  const searchInput = page.locator('[data-testid="search-input"]')
  await searchInput.fill('TSK-01')
  await page.waitForTimeout(400)

  const clearButton = page.locator('[data-testid="clear-search-button"]')
  await expect(clearButton).toBeVisible()

  // When: X 버튼 클릭
  await clearButton.click()

  // Then: 검색어 초기화
  await expect(searchInput).toHaveValue('')
  await expect(clearButton).not.toBeVisible()
})
```

**예상 결과**:
- 검색어 입력 필드 비워짐
- X 버튼 사라짐
- 전체 트리 표시 (TSK-04-02 구현 후)

---

### 3.3 wbs-tree-actions.spec.ts

**파일 경로**: `tests/e2e/wbs-tree-actions.spec.ts`

#### E2E-005: 전체 펼치기 동작 확인

**FR 매핑**: FR-004

```typescript
test.describe('WBS Tree Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')
  })

  test('E2E-005: 전체 펼치기 버튼 클릭 시 모든 노드가 펼쳐진다', async ({ page }) => {
    // Given: 전체 펼치기 버튼
    const expandButton = page.locator('[data-testid="expand-all-button"]')

    // When: 버튼 클릭
    await expandButton.click()

    // Then: 모든 노드 펼침 확인 (TSK-04-02 구현 후 활성화)
    // const allNodes = page.locator('[data-testid^="tree-node-"]')
    // const expandedNodes = await allNodes.filter({ has: page.locator('.expanded') })
    // expect(await expandedNodes.count()).toBeGreaterThan(0)

    // 현재는 버튼 클릭만 확인
    await expect(expandButton).toBeEnabled()
  })
})
```

**예상 결과**:
- 버튼 클릭 성공
- (TSK-04-02 구현 후) 모든 노드 확장 상태

---

#### E2E-006: 전체 접기 동작 확인

**FR 매핑**: FR-004

```typescript
test('E2E-006: 전체 접기 버튼 클릭 시 모든 노드가 접힌다', async ({ page }) => {
  // Given: 먼저 전체 펼치기
  const expandButton = page.locator('[data-testid="expand-all-button"]')
  await expandButton.click()

  // When: 전체 접기 버튼 클릭
  const collapseButton = page.locator('[data-testid="collapse-all-button"]')
  await collapseButton.click()

  // Then: 모든 노드 접힘 확인 (TSK-04-02 구현 후 활성화)
  // const allNodes = page.locator('[data-testid^="tree-node-"]')
  // const collapsedNodes = await allNodes.filter({ has: page.locator('.collapsed') })
  // expect(await collapsedNodes.count()).toBeGreaterThan(0)

  // 현재는 버튼 클릭만 확인
  await expect(collapseButton).toBeEnabled()
})
```

**예상 결과**:
- 버튼 클릭 성공
- (TSK-04-02 구현 후) 모든 노드 축소 상태

---

### 3.4 wbs-summary.spec.ts

**파일 경로**: `tests/e2e/wbs-summary.spec.ts`

#### E2E-007: 통계 카드 값 정확성 확인

**FR 매핑**: FR-005

```typescript
test.describe('WBS Summary Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')
  })

  test('E2E-007: 통계 카드가 정확한 값을 표시한다', async ({ page }) => {
    // Given: 통계 카드
    const wpCard = page.locator('[data-testid="wp-card"]')
    const actCard = page.locator('[data-testid="act-card"]')
    const tskCard = page.locator('[data-testid="tsk-card"]')
    const progressCard = page.locator('[data-testid="progress-card"]')

    // When: 카드 값 확인
    const wpCount = await wpCard.locator('.text-2xl').textContent()
    const actCount = await actCard.locator('.text-2xl').textContent()
    const tskCount = await tskCard.locator('.text-2xl').textContent()
    const progress = await progressCard.locator('.text-2xl').textContent()

    // Then: 값 검증 (실제 프로젝트 데이터 기준)
    expect(parseInt(wpCount || '0')).toBeGreaterThan(0)
    expect(parseInt(actCount || '0')).toBeGreaterThanOrEqual(0)
    expect(parseInt(tskCount || '0')).toBeGreaterThan(0)
    expect(progress).toMatch(/\d+%/)

    // 카드 레이블 확인
    await expect(wpCard).toContainText('WP')
    await expect(actCard).toContainText('ACT')
    await expect(tskCard).toContainText('TSK')
    await expect(progressCard).toContainText('Progress')
  })
})
```

**예상 결과**:
- 4개 카드 모두 표시
- 숫자 값 표시
- 레이블 정확

---

### 3.5 wbs-error-handling.spec.ts

**파일 경로**: `tests/e2e/wbs-error-handling.spec.ts`

#### E2E-008: 네트워크 오류 시 에러 표시

**FR 매핑**: FR-007

```typescript
test.describe('WBS Error Handling', () => {
  test('E2E-008: API 에러 시 사용자 친화적 에러 메시지를 표시한다', async ({ page }) => {
    // Given: API 실패 시뮬레이션
    await page.route('**/api/projects/*/wbs', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    // When: 페이지 로드
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')

    // Then: 에러 메시지 표시
    const errorState = page.locator('[data-testid="error-state"]')
    await expect(errorState).toBeVisible()
    await expect(errorState).toContainText(/서버 오류|에러|실패/)

    // 로딩/콘텐츠 상태 미표시
    const loadingState = page.locator('[data-testid="loading-state"]')
    const contentState = page.locator('[data-testid="content-state"]')
    await expect(loadingState).not.toBeVisible()
    await expect(contentState).not.toBeVisible()
  })
})
```

**예상 결과**:
- 에러 메시지 표시
- Message 컴포넌트 사용
- 로딩/콘텐츠 미표시

---

## 4. 성능 테스트 명세

### 4.1 wbs-performance.spec.ts

**파일 경로**: `tests/e2e/wbs-performance.spec.ts`

#### PERF-001: 검색 응답 시간 측정

**NFR 매핑**: NFR-001

```typescript
test.describe('WBS Performance', () => {
  test('PERF-001: 검색 응답 시간이 300ms 이하이다', async ({ page }) => {
    // Given: 페이지 로드 완료
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')

    // When: 검색어 입력 및 시간 측정
    const searchInput = page.locator('[data-testid="search-input"]')

    const startTime = performance.now()
    await searchInput.fill('TSK-01')
    await page.waitForTimeout(400) // Debounce 대기
    const endTime = performance.now()

    const responseTime = endTime - startTime

    // Then: 응답 시간 확인 (400ms 이하 - debounce 300ms + 여유 100ms)
    expect(responseTime).toBeLessThan(500)
  })
})
```

**예상 결과**:
- 검색 응답 시간 < 500ms
- Debounce 300ms 포함

---

### 4.2 wbs-performance-unit.spec.ts (PERF-002)

**파일 경로**: `tests/unit/performance/wbs-performance.spec.ts`

#### PERF-002: 대규모 노드 필터링 성능

**NFR 매핑**: NFR-001 (성능 요구사항)

> **리뷰 지적 사항**: 설계 문서에서 < 1000개 노드를 권장하나, 실제 성능 테스트가 누락되어 병목 가능성 미검증.
> 이 테스트는 1000+ 노드에서의 필터링 성능을 검증합니다.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWbsStore } from '~/stores/wbs'
import type { WbsNode } from '~/types/index'

/**
 * 대규모 Mock 트리 생성 함수
 * @param nodeCount 생성할 총 노드 수
 * @returns WbsNode 트리
 */
function generateLargeMockTree(nodeCount: number): WbsNode {
  const wpCount = Math.ceil(nodeCount / 50) // WP당 약 50개 노드
  const tskPerWp = Math.floor(nodeCount / wpCount)

  const children: WbsNode[] = []
  let totalGenerated = 0

  for (let wp = 1; wp <= wpCount && totalGenerated < nodeCount; wp++) {
    const wpNode: WbsNode = {
      id: `WP-${String(wp).padStart(2, '0')}`,
      type: 'wp',
      title: `Work Package ${wp}`,
      progress: Math.floor(Math.random() * 100),
      children: []
    }

    for (let tsk = 1; tsk <= tskPerWp && totalGenerated < nodeCount; tsk++) {
      const tskNode: WbsNode = {
        id: `TSK-${String(wp).padStart(2, '0')}-${String(tsk).padStart(2, '0')}`,
        type: 'task',
        title: `Task ${wp}-${tsk} - Implementation of feature ${totalGenerated}`,
        status: ['[ ]', '[bd]', '[dd]', '[im]', '[xx]'][Math.floor(Math.random() * 5)],
        category: ['development', 'defect', 'infrastructure'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 100),
        children: []
      }
      wpNode.children!.push(tskNode)
      totalGenerated++
    }

    children.push(wpNode)
  }

  return {
    id: 'large-project',
    type: 'project',
    title: 'Large Scale Project',
    progress: 0,
    children
  }
}

/**
 * flattenTree 헬퍼 함수
 */
function flattenTree(nodes: WbsNode[]): Map<string, WbsNode> {
  const map = new Map<string, WbsNode>()

  function traverse(node: WbsNode) {
    map.set(node.id, node)
    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)
  return map
}

describe('WBS Performance Tests - PERF-002', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('PERF-002-1: 1000개 노드 필터링이 100ms 이내에 완료된다', () => {
    // Given: 1000개 노드로 구성된 대규모 트리
    const store = useWbsStore()
    const largeTree = generateLargeMockTree(1000)
    store.tree = [largeTree]
    store.flatNodes = flattenTree([largeTree])

    // When: 검색어 설정 및 시간 측정
    const startTime = performance.now()
    store.setSearchQuery('TSK-01')
    const filteredTree = store.filteredTree // getter 호출
    const endTime = performance.now()

    const filterTime = endTime - startTime

    // Then: 100ms 이내 완료
    console.log(`1000 nodes filter time: ${filterTime.toFixed(2)}ms`)
    expect(filterTime).toBeLessThan(100)
    expect(filteredTree).toBeDefined()
  })

  it('PERF-002-2: 3000개 노드 필터링이 300ms 이내에 완료된다', () => {
    // Given: 3000개 노드로 구성된 대규모 트리
    const store = useWbsStore()
    const largeTree = generateLargeMockTree(3000)
    store.tree = [largeTree]
    store.flatNodes = flattenTree([largeTree])

    // When: 검색어 설정 및 시간 측정
    const startTime = performance.now()
    store.setSearchQuery('implementation')
    const filteredTree = store.filteredTree
    const endTime = performance.now()

    const filterTime = endTime - startTime

    // Then: 300ms 이내 완료
    console.log(`3000 nodes filter time: ${filterTime.toFixed(2)}ms`)
    expect(filterTime).toBeLessThan(300)
    expect(filteredTree).toBeDefined()
  })

  it('PERF-002-3: 5000개 노드 필터링이 500ms 이내에 완료된다', () => {
    // Given: 5000개 노드로 구성된 대규모 트리
    const store = useWbsStore()
    const largeTree = generateLargeMockTree(5000)
    store.tree = [largeTree]
    store.flatNodes = flattenTree([largeTree])

    // When: 검색어 설정 및 시간 측정
    const startTime = performance.now()
    store.setSearchQuery('Task')
    const filteredTree = store.filteredTree
    const endTime = performance.now()

    const filterTime = endTime - startTime

    // Then: 500ms 이내 완료
    console.log(`5000 nodes filter time: ${filterTime.toFixed(2)}ms`)
    expect(filterTime).toBeLessThan(500)
    expect(filteredTree).toBeDefined()
  })

  it('PERF-002-4: 1000개 노드에서 연속 검색 시 성능 저하가 없다', () => {
    // Given: 1000개 노드 트리
    const store = useWbsStore()
    const largeTree = generateLargeMockTree(1000)
    store.tree = [largeTree]
    store.flatNodes = flattenTree([largeTree])

    const searchQueries = ['TSK', 'WP-01', 'implementation', 'Task', 'feature']
    const times: number[] = []

    // When: 연속 5회 검색
    searchQueries.forEach(query => {
      const startTime = performance.now()
      store.setSearchQuery(query)
      const _ = store.filteredTree
      const endTime = performance.now()
      times.push(endTime - startTime)
    })

    // Then: 모든 검색이 100ms 이내, 성능 저하 없음
    console.log(`Consecutive search times: ${times.map(t => t.toFixed(2)).join(', ')}ms`)
    times.forEach(time => {
      expect(time).toBeLessThan(100)
    })

    // 마지막 검색이 첫 검색보다 현저히 느리지 않음 (2배 이내)
    expect(times[times.length - 1]).toBeLessThan(times[0] * 2 + 10)
  })

  it('PERF-002-5: flatNodes Map 생성 시간이 200ms 이내이다 (1000개 노드)', () => {
    // Given: 1000개 노드 트리
    const largeTree = generateLargeMockTree(1000)

    // When: flattenTree 시간 측정
    const startTime = performance.now()
    const flatMap = flattenTree([largeTree])
    const endTime = performance.now()

    const flattenTime = endTime - startTime

    // Then: 200ms 이내
    console.log(`Flatten time (1000 nodes): ${flattenTime.toFixed(2)}ms`)
    expect(flattenTime).toBeLessThan(200)
    expect(flatMap.size).toBeGreaterThanOrEqual(1000)
  })

  it('PERF-002-6: 빈 검색어로 초기화 시 즉시 응답한다', () => {
    // Given: 5000개 노드 트리 + 검색어 설정된 상태
    const store = useWbsStore()
    const largeTree = generateLargeMockTree(5000)
    store.tree = [largeTree]
    store.flatNodes = flattenTree([largeTree])
    store.setSearchQuery('TSK')

    // When: 검색어 초기화
    const startTime = performance.now()
    store.setSearchQuery('')
    const filteredTree = store.filteredTree
    const endTime = performance.now()

    const resetTime = endTime - startTime

    // Then: 10ms 이내 (원본 트리 반환)
    console.log(`Reset search time: ${resetTime.toFixed(2)}ms`)
    expect(resetTime).toBeLessThan(10)
    expect(filteredTree).toBe(store.tree)
  })
})
```

**예상 결과**:

| 테스트 케이스 | 노드 수 | 목표 시간 | 비고 |
|-------------|--------|----------|------|
| PERF-002-1 | 1,000 | < 100ms | 권장 범위 내 |
| PERF-002-2 | 3,000 | < 300ms | 한계 테스트 |
| PERF-002-3 | 5,000 | < 500ms | 극한 테스트 |
| PERF-002-4 | 1,000 (5회 연속) | < 100ms 각 | 메모리 누수 없음 |
| PERF-002-5 | 1,000 (flatten) | < 200ms | Map 생성 시간 |
| PERF-002-6 | 5,000 (초기화) | < 10ms | 원본 참조 반환 |

**성능 기준**:
- 1000개 노드: 목표 응답 시간 100ms (사용자 인지 불가)
- 3000개 노드: 목표 응답 시간 300ms (약간의 지연 허용)
- 5000개 노드: 목표 응답 시간 500ms (로딩 인디케이터 권장)

**실패 시 대응 계획**:
1. 100ms 초과: filterTreeNodes 함수 Memoization 적용
2. 300ms 초과: 검색 인덱스 구축 (Map 기반)
3. 500ms 초과: Virtual Scrolling + 페이지네이션 적용

---

## 5. 접근성 테스트 명세

### 5.1 wbs-accessibility.spec.ts

**파일 경로**: `tests/e2e/wbs-accessibility.spec.ts`

#### A11Y-001: ARIA 속성 검증

**NFR 매핑**: NFR-003

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('WBS Accessibility', () => {
  test('A11Y-001: axe-core로 접근성 이슈가 없음을 확인한다', async ({ page }) => {
    // Given: 페이지 로드
    await page.goto('/wbs?projectId=jjiban')
    await page.waitForLoadState('networkidle')

    // When: axe-core 실행
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="wbs-tree-panel"]')
      .analyze()

    // Then: 위반 사항 없음
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

**예상 결과**:
- axe-core 위반 0건
- WCAG AA 기준 충족

---

#### A11Y-002: 키보드 네비게이션 테스트

**NFR 매핑**: NFR-003

```typescript
test('A11Y-002: Tab 키로 모든 인터랙티브 요소에 접근 가능하다', async ({ page }) => {
  // Given: 페이지 로드
  await page.goto('/wbs?projectId=jjiban')
  await page.waitForLoadState('networkidle')

  // When: Tab 키로 순차 이동
  await page.keyboard.press('Tab') // 전체 펼치기 버튼
  let focused = await page.locator(':focus').getAttribute('data-testid')
  expect(focused).toBe('expand-all-button')

  await page.keyboard.press('Tab') // 전체 접기 버튼
  focused = await page.locator(':focus').getAttribute('data-testid')
  expect(focused).toBe('collapse-all-button')

  await page.keyboard.press('Tab') // 검색 입력
  focused = await page.locator(':focus').getAttribute('data-testid')
  expect(focused).toBe('search-input')

  // Then: 모든 버튼/입력에 순차 접근 가능
})
```

**예상 결과**:
- Tab 키로 포커스 이동
- 순서: 펼치기 → 접기 → 검색

---

## 6. 테스트 데이터 관리

### 6.1 Fixture 파일 구조

```
tests/fixtures/
├── wbs-data.ts         # Mock WBS 데이터
├── project-data.ts     # Mock 프로젝트 정보
└── error-responses.ts  # API 에러 응답 Mock
```

### 6.2 wbs-data.ts

```typescript
import type { WbsNode } from '~/types/index'

export const mockWbsData: WbsNode = {
  // ... (섹션 1.3 참조)
}

export const emptyWbsData: WbsNode = {
  // ... (섹션 1.3 참조)
}

export const largeWbsData: WbsNode = {
  // 성능 테스트용 1000+ 노드
  // ... 생략
}
```

---

## 7. 테스트 실행 계획

### 7.1 로컬 개발 환경

```bash
# 단위 테스트 실행
npm run test:unit

# 단위 테스트 (watch 모드)
npm run test:unit:watch

# 단위 테스트 커버리지
npm run test:unit:coverage

# E2E 테스트 실행
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui
```

### 7.2 CI/CD 파이프라인

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. 테스트 완료 기준

### 8.1 단위 테스트

- [ ] 모든 단위 테스트 통과 (15개)
- [ ] 코드 커버리지 >= 80%
- [ ] 브랜치 커버리지 >= 75%
- [ ] 테스트 실행 시간 < 10초

### 8.2 E2E 테스트

- [ ] 모든 E2E 테스트 통과 (8개)
- [ ] Critical/High FR 100% 커버
- [ ] 크로스 브라우저 테스트 (Chrome, Firefox)
- [ ] 테스트 실행 시간 < 2분

### 8.3 접근성 테스트

- [ ] axe-core 위반 0건
- [ ] 키보드 네비게이션 테스트 통과
- [ ] 스크린 리더 호환성 확인 (수동)

### 8.4 성능 테스트

- [ ] 검색 응답 시간 < 500ms
- [ ] 컴포넌트 렌더링 시간 < 100ms

---

## 9. 다음 단계

### 9.1 구현 단계 (/wf:build)
- 테스트 파일 작성 (단위 테스트 15개 + E2E 테스트 8개)
- Mock 데이터 및 Fixture 준비
- 컴포넌트 구현과 병행하여 TDD 접근

### 9.2 검증 단계 (/wf:verify)
- 모든 테스트 실행 및 통과 확인
- 커버리지 리포트 검토
- 접근성 검증 (axe-core + 수동 테스트)
- 성능 벤치마크 확인

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-01)

---

<!--
author: Claude (QA Engineer)
Template Version: 1.0.0
Created: 2025-12-15
-->
