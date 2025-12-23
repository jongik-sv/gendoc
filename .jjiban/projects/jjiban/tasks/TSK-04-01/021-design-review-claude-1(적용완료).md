# 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **리뷰 관점**
> * SOLID 원칙 준수 여부
> * 컴포넌트 설계 품질
> * 유지보수성 평가
> * 확장성 검토
> * 테스트 가능성 평가
> * 기술 부채 식별

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Refactoring Expert) |
| 리뷰 대상 | 020-detail-design.md, 025-traceability-matrix.md, 026-test-specification.md |

### 리뷰 스코어 요약

| 항목 | 점수 | 등급 | 비고 |
|------|------|------|------|
| SOLID 원칙 준수 | 85/100 | A | 일부 개선 필요 |
| 컴포넌트 응집도 | 90/100 | A | 우수 |
| 결합도 관리 | 80/100 | B+ | Pinia 직접 의존 개선 필요 |
| 테스트 가능성 | 88/100 | A | 좋은 테스트 커버리지 |
| 유지보수성 | 82/100 | B+ | 일부 복잡도 개선 필요 |
| 확장성 | 87/100 | A | 좋은 확장 구조 |
| **전체 평균** | **85.3/100** | **A-** | 우수한 설계, 일부 개선 권장 |

---

## 1. SOLID 원칙 분석

### 1.1 Single Responsibility Principle (SRP)

#### ✅ 준수 항목

**WbsTreePanel**: 컨테이너 역할에 집중
- 데이터 로드 조정
- 로딩/에러 상태 관리
- 자식 컴포넌트 통합

```typescript
// 단일 책임: 데이터 로드 조정
onMounted(async () => {
  if (!projectId.value) return
  await wbsStore.fetchWbs(projectId.value)
})
```

**WbsSearchBox**: 검색 입력 처리에만 집중
- 검색어 입력
- Debounce 처리
- 검색어 초기화

**WbsSummaryCards**: 통계 카드 표시에만 집중
- 통계 데이터 구독
- 카드 레이아웃 렌더링

#### ⚠️ 개선 필요 항목

**WbsTreeHeader**: 다중 책임 패턴
```typescript
// 현재: 3가지 책임을 가짐
// 1. 타이틀 표시
// 2. 액션 버튼 (펼치기/접기)
// 3. 자식 컴포넌트 통합 (검색, 요약)
```

**개선 제안**:
```typescript
// 분리 제안
WbsTreeHeader → WbsTreeHeaderLayout (레이아웃만)
  ├─ WbsTreeTitle (타이틀 + 아이콘)
  ├─ WbsTreeActions (펼치기/접기 버튼)
  ├─ WbsSearchBox
  └─ WbsSummaryCards
```

**영향도**: 중간 (리팩토링 필요 시점: Phase 2)
**우선순위**: Medium
**기술 부채**: 현재는 관리 가능, 향후 기능 추가 시 복잡도 증가 가능

---

### 1.2 Open/Closed Principle (OCP)

#### ✅ 준수 항목

**WbsSummaryCards**: 확장에 열려있는 구조
```typescript
// 카드 추가 시 cards 배열만 수정
const cards = computed<CardData[]>(() => [
  { label: 'WP', value: wpCount, ... },
  { label: 'ACT', value: actCount, ... },
  { label: 'TSK', value: tskCount, ... },
  { label: 'Progress', value: overallProgress, ... }
  // 새 카드 추가 용이
])
```

**필터링 로직**: 확장 가능한 구조
```typescript
// filterTreeNodes 함수는 확장 가능
// 현재: ID/title 검색
// 확장: status, category 등 추가 가능
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  // 검색 기준 확장 가능
}
```

#### ⚠️ 개선 필요 항목

**에러 핸들링**: 하드코딩된 에러 메시지
```typescript
// 현재: 하드코딩
if (e.statusCode === 404) {
  error.value = '프로젝트를 찾을 수 없습니다.'
} else if (e.statusCode === 500) {
  error.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
```

**개선 제안**:
```typescript
// 에러 메시지 맵핑 객체로 확장
const ERROR_MESSAGES: Record<number, string> = {
  404: '프로젝트를 찾을 수 없습니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  408: '요청 시간이 초과되었습니다.',
  // 추가 에러 코드 처리 용이
}

function getErrorMessage(statusCode: number): string {
  return ERROR_MESSAGES[statusCode] || '알 수 없는 오류가 발생했습니다.'
}
```

**영향도**: 낮음
**우선순위**: Low
**기술 부채**: 현재 구현으로도 충분, 에러 타입 증가 시 리팩토링 권장

---

### 1.3 Liskov Substitution Principle (LSP)

#### ✅ 준수 항목

**WbsNode 타입**: 일관된 인터페이스
```typescript
// 모든 노드가 동일한 기본 구조 보유
interface WbsNode {
  id: string
  type: 'project' | 'wp' | 'act' | 'task'
  title: string
  progress: number
  children?: WbsNode[]
}
```

**재귀적 필터링**: 노드 타입 무관 동작
```typescript
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  // 모든 WbsNode 타입에 대해 동일하게 동작
  for (const node of nodes) {
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []
  }
}
```

#### 📝 해당 없음

현재 설계에서 상속 관계 미사용 (Composition 패턴 사용)

**평가**: LSP 위반 가능성 없음 (상속 대신 컴포지션 사용)

---

### 1.4 Interface Segregation Principle (ISP)

#### ✅ 준수 항목

**Props 인터페이스**: 최소한의 속성
```typescript
// WbsTreePanel: Props 없음 (route에서 직접 추출)
interface WbsTreePanelProps {}

// WbsTreeHeader, WbsSummaryCards, WbsSearchBox: Props 없음
// 스토어에서 직접 조회 → 의존성 최소화
```

#### ⚠️ 개선 필요 항목

**Pinia Store 직접 의존**: 인터페이스 분리 부족
```typescript
// 현재: 모든 컴포넌트가 useWbsStore() 직접 호출
const wbsStore = useWbsStore()
const { loading, error, tree } = storeToRefs(wbsStore)
```

**문제점**:
- 컴포넌트가 전체 스토어 인터페이스에 노출
- 필요한 데이터만 Props로 받는 것이 더 테스트 용이
- 스토어 구조 변경 시 모든 컴포넌트 영향 받음

**개선 제안**:
```typescript
// Option 1: Props 기반 접근 (더 나은 ISP 준수)
interface WbsSummaryCardsProps {
  wpCount: number
  actCount: number
  tskCount: number
  overallProgress: number
}

// 컨테이너에서 데이터 주입
<WbsSummaryCards
  :wpCount="wbsStore.wpCount"
  :actCount="wbsStore.actCount"
  :tskCount="wbsStore.tskCount"
  :overallProgress="wbsStore.overallProgress"
/>
```

```typescript
// Option 2: Composable 추출 (타협안)
function useWbsSummaryData() {
  const store = useWbsStore()
  return {
    wpCount: computed(() => store.wpCount),
    actCount: computed(() => store.actCount),
    tskCount: computed(() => store.tskCount),
    overallProgress: computed(() => store.overallProgress)
  }
}
```

**영향도**: 중간
**우선순위**: Medium
**기술 부채**: Nuxt/Vue 패턴에서는 일반적이나, 테스트 복잡도 증가 및 결합도 높음

---

### 1.5 Dependency Inversion Principle (DIP)

#### ⚠️ 개선 필요 항목

**구체적 구현에 의존**: Pinia Store 직접 의존
```typescript
// 현재: 구체적 구현(Pinia)에 직접 의존
import { useWbsStore } from '~/stores/wbs'
const wbsStore = useWbsStore()
```

**개선 제안**:
```typescript
// 추상화된 인터페이스 정의
interface IWbsDataProvider {
  readonly tree: WbsNode[]
  readonly loading: boolean
  readonly error: string | null
  fetchWbs(projectId: string): Promise<void>
  setSearchQuery(query: string): void
  expandAll(): void
  collapseAll(): void
}

// 의존성 주입 패턴
function provideWbsStore() {
  const store = useWbsStore()
  return {
    tree: computed(() => store.tree),
    loading: computed(() => store.loading),
    // ... 추상화된 인터페이스 제공
  } as IWbsDataProvider
}

// 컴포넌트에서 사용
const wbsProvider = inject<IWbsDataProvider>('wbsDataProvider')
```

**트레이드오프 분석**:

| 항목 | 현재 방식 (Pinia 직접 사용) | 추상화 방식 (DIP 준수) |
|------|------------------------|---------------------|
| 코드 복잡도 | ⬇️ 낮음 | ⬆️ 높음 |
| 테스트 용이성 | ⬇️ Mock 필요 | ⬆️ 쉬운 Mock |
| 유지보수성 | ⬇️ 스토어 변경 시 영향 | ⬆️ 인터페이스 안정적 |
| 학습 곡선 | ⬆️ Vue/Pinia 표준 | ⬇️ 추가 개념 필요 |
| 적용 우선순위 | - | 🟡 Medium (현재는 불필요) |

**권장 사항**:
- **현재 구현 유지**: Nuxt/Vue 생태계에서는 Pinia 직접 사용이 표준 패턴
- **향후 리팩토링 조건**: 스토어 교체 필요성 발생 시 또는 테스트 복잡도가 과도하게 증가할 때

---

## 2. 컴포넌트 설계 품질 분석

### 2.1 응집도 (Cohesion) 분석

#### 높은 응집도 (Excellent)

**WbsSearchBox**: 검색 관련 로직 집중
```typescript
// 모든 요소가 검색 기능에 기여
- searchQuery (상태)
- debouncedSearch (로직)
- clearSearch (액션)
- handleKeydown (이벤트)
```

**응집도 점수**: 95/100

**WbsSummaryCards**: 통계 표시 관련 로직 집중
```typescript
// 모든 요소가 통계 카드 표시에 기여
- cards (데이터 구조)
- 스토어 구독 (wpCount, actCount 등)
- 카드 렌더링 템플릿
```

**응집도 점수**: 93/100

#### 중간 응집도 (Good)

**WbsTreePanel**: 컨테이너 책임 집중
```typescript
// 데이터 로드와 상태 관리에 집중
// 다만 라우터, 스토어, 템플릿 렌더링 등 다양한 관심사 포함
- projectId 추출 (Route)
- fetchWbs 호출 (Store)
- 로딩/에러 상태 처리 (UI)
- 자식 컴포넌트 통합 (Composition)
```

**응집도 점수**: 82/100

**개선 제안**:
```typescript
// projectId 추출 로직 분리
function useProjectId() {
  const route = useRoute()
  return computed(() => route.query.projectId as string)
}

// WbsTreePanel에서 사용
const projectId = useProjectId()
```

---

### 2.2 결합도 (Coupling) 분석

#### 낮은 결합도 (Good)

**Props 기반 통신 부재**: 모든 컴포넌트가 스토어 직접 사용
```typescript
// 장점: Props 드릴링 없음
// 단점: 스토어에 강하게 결합됨
```

**결합도 유형**:
- **Data Coupling**: Props 전달 없음 → ✅ 좋음
- **Stamp Coupling**: 전체 객체 전달 없음 → ✅ 좋음
- **Control Coupling**: 제어 플래그 전달 없음 → ✅ 좋음
- **External Coupling**: Pinia Store에 강하게 결합 → ⚠️ 중간
- **Common Coupling**: 전역 상태 공유 (Pinia) → ⚠️ 중간
- **Content Coupling**: 없음 → ✅ 좋음

**결합도 점수**: 75/100

#### 개선 가능 항목

**스토어 결합 완화**:
```typescript
// 현재: 모든 컴포넌트가 useWbsStore() 직접 호출
const wbsStore = useWbsStore()

// 개선안: Composable로 추상화
// app/composables/useWbsData.ts
export function useWbsData() {
  const store = useWbsStore()
  return {
    tree: computed(() => store.tree),
    loading: computed(() => store.loading),
    error: computed(() => store.error)
  }
}

export function useWbsActions() {
  const store = useWbsStore()
  return {
    expandAll: () => store.expandAll(),
    collapseAll: () => store.collapseAll(),
    setSearchQuery: (query: string) => store.setSearchQuery(query)
  }
}
```

**효과**:
- 스토어 구조 변경 시 Composable만 수정
- 컴포넌트는 필요한 데이터/액션만 임포트
- 테스트 시 Composable Mock으로 간단히 대체

---

### 2.3 순환 복잡도 (Cyclomatic Complexity)

#### 복잡도 측정

**WbsTreePanel 템플릿**:
```vue
<template>
  <!-- v-if, v-else-if, v-else: 3개 분기 -->
  <div v-if="loading">...</div>
  <div v-else-if="error">...</div>
  <div v-else>
    <!-- 내부 v-if: 1개 분기 -->
    <div v-if="tree && tree.length > 0">...</div>
    <div v-else>...</div>
  </div>
</template>
```

**순환 복잡도**: 5 (낮음 - 우수)
**권장 기준**: < 10 (초과 시 리팩토링 필요)

**filterTreeNodes 함수**:
```typescript
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []

  for (const node of nodes) { // +1
    const nodeMatches = // 조건 평가
      node.id.toLowerCase().includes(query) || // +1
      node.title.toLowerCase().includes(query)

    const filteredChildren = node.children // +1 (조건)
      ? filterTreeNodes(node.children, query)
      : []

    if (nodeMatches || filteredChildren.length > 0) { // +1
      result.push({...})
    }
  }

  return result
}
```

**순환 복잡도**: 4 (낮음 - 우수)

#### 복잡도 평가

| 컴포넌트/함수 | 순환 복잡도 | 평가 | 조치 |
|-------------|-----------|------|------|
| WbsTreePanel (script) | 3 | ✅ 우수 | 유지 |
| WbsTreePanel (template) | 5 | ✅ 우수 | 유지 |
| WbsTreeHeader | 2 | ✅ 우수 | 유지 |
| WbsSummaryCards | 2 | ✅ 우수 | 유지 |
| WbsSearchBox | 3 | ✅ 우수 | 유지 |
| filterTreeNodes | 4 | ✅ 우수 | 유지 |

**전체 평균 복잡도**: 3.17 (매우 낮음)
**평가**: 모든 컴포넌트가 권장 기준(< 10) 내에 있음

---

## 3. 테스트 가능성 평가

### 3.1 단위 테스트 용이성

#### ✅ 테스트 용이 항목

**명확한 입출력**:
```typescript
// filterTreeNodes: 순수 함수
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  // 입력: nodes, query
  // 출력: filtered nodes
  // 부수효과 없음 → 테스트 매우 용이
}
```

**data-testid 속성**: 모든 주요 요소에 추가
```vue
<div data-testid="wbs-tree-panel">
  <div data-testid="loading-state">...</div>
  <div data-testid="error-state">...</div>
  <div data-testid="content-state">...</div>
</div>
```

**평가**: 테스트 셀렉터 안정성 우수

#### ⚠️ 테스트 복잡도 증가 요인

**Pinia Store 의존성**:
```typescript
// 테스트 시 Pinia 설정 필수
beforeEach(() => {
  setActivePinia(createPinia())
})

const wrapper = mount(WbsTreePanel, {
  global: {
    mocks: { $route: { query: { projectId: 'test' } } }
  }
})
```

**복잡도 점수**: 7/10 (중간)

**개선 제안**:
```typescript
// Props 기반으로 변경 시 테스트 간소화
const wrapper = mount(WbsSummaryCards, {
  props: {
    wpCount: 2,
    actCount: 1,
    tskCount: 3,
    overallProgress: 58
  }
})
// Pinia 설정 불필요
```

---

### 3.2 테스트 커버리지 분석

#### 커버리지 목표 vs 실제

| 컴포넌트 | 목표 커버리지 | 예상 커버리지 | 차이 | 평가 |
|---------|------------|------------|------|------|
| WbsTreePanel | >= 80% | ~85% | +5% | ✅ 우수 |
| WbsTreeHeader | >= 80% | ~90% | +10% | ✅ 우수 |
| WbsSummaryCards | >= 80% | ~85% | +5% | ✅ 우수 |
| WbsSearchBox | >= 80% | ~80% | 0% | ✅ 충족 |
| useWbsStore | >= 80% | ~75% | -5% | ⚠️ 부족 |

**전체 예상 커버리지**: 82% (목표 80% 달성)

#### 미흡 항목

**useWbsStore 커버리지 부족**:
```typescript
// 테스트 누락 항목 (추적성 매트릭스 섹션 9.1 참조)
- UT-016: 유효하지 않은 projectId 테스트
- UT-017: 검색어 길이 제한 테스트
- UT-018: 빈 flatNodes 테스트
- PERF-002: 대규모 노드 성능 테스트
```

**권장 조치**: 단기 개선 항목에 포함 (우선순위 High)

---

### 3.3 테스트 전략 평가

#### 테스트 피라미드 분석

```
        E2E (8개)          ← 21%
       /        \
      /          \
     /   Integration  \     ← 0% (없음)
    /      (0개)       \
   /____________________\
      Unit Tests (15개)  ← 79%
```

**평가**:
- **단위 테스트 비중**: 79% → ✅ 우수 (70-80% 권장)
- **통합 테스트**: 0% → ⚠️ 누락 (컴포넌트 간 상호작용 테스트 부족)
- **E2E 테스트**: 21% → ✅ 적절 (20-30% 권장)

**개선 제안**:
```typescript
// 통합 테스트 추가 예시
describe('WbsTreePanel Integration', () => {
  it('검색 시 요약 카드 값이 업데이트된다', async () => {
    // Given: WbsTreePanel + WbsSummaryCards + WbsSearchBox 통합
    const wrapper = mount(WbsTreePanel)

    // When: 검색어 입력
    await wrapper.find('[data-testid="search-input"]').setValue('TSK-01')
    await vi.advanceTimersByTime(300)

    // Then: 요약 카드 값 변경 확인
    const tskCard = wrapper.find('[data-testid="tsk-card"]')
    expect(tskCard.text()).toContain('2') // 필터링된 Task 수
  })
})
```

---

## 4. 유지보수성 평가

### 4.1 코드 가독성

#### ✅ 우수 항목

**명확한 컴포넌트 역할**:
```typescript
/**
 * WbsTreePanel 컴포넌트
 * WBS 트리 패널의 컨테이너 역할
 * - 데이터 로드 조정
 * - 로딩/에러 상태 관리
 * - 자식 컴포넌트 통합
 */
```

**일관된 명명 규칙**:
- 컴포넌트: PascalCase (`WbsTreePanel`)
- 함수: camelCase (`fetchWbs`, `expandAll`)
- 상수: UPPER_SNAKE_CASE (에러 메시지 개선안에서 사용)
- 변수: camelCase (`projectId`, `searchQuery`)

**TypeScript 타입 정의**:
```typescript
// 명확한 인터페이스
interface CardData {
  label: string
  value: ComputedRef<number>
  colorClass: string
  ariaLabel: ComputedRef<string>
  testId: string
}
```

**가독성 점수**: 88/100

#### ⚠️ 개선 필요 항목

**매직 넘버 하드코딩**:
```typescript
// Debounce 시간 하드코딩
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300) // Magic number
```

**개선 제안**:
```typescript
// 상수로 추출
const SEARCH_DEBOUNCE_MS = 300
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, SEARCH_DEBOUNCE_MS)
```

**긴 함수 체이닝**:
```typescript
// filterTreeNodes 내부
const nodeMatches =
  node.id.toLowerCase().includes(query) ||
  node.title.toLowerCase().includes(query)
```

**개선 제안**:
```typescript
function matchesSearchQuery(node: WbsNode, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return (
    node.id.toLowerCase().includes(lowerQuery) ||
    node.title.toLowerCase().includes(lowerQuery)
  )
}

// 사용
const nodeMatches = matchesSearchQuery(node, query)
```

---

### 4.2 문서화 품질

#### ✅ 우수 항목

**상세한 설계 문서**:
- 020-detail-design.md: 1111줄, 매우 상세
- 025-traceability-matrix.md: 437줄, 요구사항-테스트 매핑 완벽
- 026-test-specification.md: 1329줄, Given-When-Then 형식

**JSDoc 주석**:
```typescript
/**
 * WbsSearchBox 컴포넌트
 * WBS 트리 검색 입력 UI
 * - 검색어 입력 처리
 * - Debounce 적용 (300ms)
 * - 검색어 초기화
 *
 * @see TSK-04-01
 * @see 020-detail-design.md
 */
```

**문서화 점수**: 95/100 (매우 우수)

#### 개선 제안

**인라인 주석 추가**:
```typescript
// 현재: 복잡한 로직에 주석 부족
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []
  for (const node of nodes) {
    // ...
  }
  return result
}

// 개선: 알고리즘 설명 추가
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []

  // 각 노드를 순회하며 검색어 매칭 확인
  for (const node of nodes) {
    // 현재 노드의 ID 또는 title이 검색어를 포함하는지 확인
    const nodeMatches = matchesSearchQuery(node, query)

    // 자식 노드 재귀적으로 필터링
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []

    // 현재 노드가 매칭되거나 자식 중 매칭되는 노드가 있으면 결과에 포함
    // (상위 경로 보존을 위해)
    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }
  }

  return result
}
```

---

### 4.3 변경 용이성

#### 변경 시나리오 분석

**시나리오 1**: Debounce 시간 변경 (300ms → 500ms)

| 영향 범위 | 파일 수 | 복잡도 | 시간 |
|---------|--------|--------|------|
| WbsSearchBox.vue | 1 | ⬇️ 낮음 | 2분 |
| UT-012 | 1 | ⬇️ 낮음 | 5분 |
| 020-detail-design.md | 1 | ⬇️ 낮음 | 3분 |
| **총계** | **3** | **⬇️ 낮음** | **10분** |

**평가**: 변경 용이 (상수 추출 시 더 용이)

**시나리오 2**: 새로운 카드 추가 (완료율 카드)

| 영향 범위 | 파일 수 | 복잡도 | 시간 |
|---------|--------|--------|------|
| useWbsStore (getter 추가) | 1 | ⬇️ 낮음 | 10분 |
| WbsSummaryCards.vue | 1 | ⬇️ 낮음 | 5분 |
| UT-009, UT-010 | 1 | ⬇️ 낮음 | 15분 |
| E2E-007 | 1 | ⬇️ 낮음 | 10분 |
| 011-ui-design.md | 1 | ⬇️ 낮음 | 5분 |
| **총계** | **5** | **⬇️ 낮음** | **45분** |

**평가**: 변경 용이 (OCP 잘 준수)

**시나리오 3**: 검색 필터 확장 (status, category 추가)

| 영향 범위 | 파일 수 | 복잡도 | 시간 |
|---------|--------|--------|------|
| WbsSearchBox (UI 추가) | 1 | ⬆️ 중간 | 30분 |
| filterTreeNodes (로직 확장) | 1 | ⬆️ 중간 | 20분 |
| UT-006 (테스트 확장) | 1 | ⬆️ 중간 | 25분 |
| E2E-003 (시나리오 추가) | 1 | ⬆️ 중간 | 20분 |
| **총계** | **4** | **⬆️ 중간** | **95분** |

**평가**: 중간 복잡도 (필터 로직 추상화 시 더 용이)

#### 변경 용이성 점수

| 시나리오 유형 | 점수 | 평가 |
|------------|------|------|
| 설정 값 변경 | 90/100 | ✅ 우수 |
| 기능 추가 (카드) | 88/100 | ✅ 우수 |
| 기능 확장 (필터) | 75/100 | 🟡 중간 |
| **전체 평균** | **84/100** | **✅ 우수** |

---

## 5. 확장성 검토

### 5.1 수평 확장성 (Feature Addition)

#### ✅ 확장 용이 항목

**카드 시스템**:
```typescript
// 새 카드 추가: cards 배열에 항목만 추가
const cards = computed<CardData[]>(() => [
  { label: 'WP', ... },
  { label: 'ACT', ... },
  { label: 'TSK', ... },
  { label: 'Progress', ... },
  { label: 'Blocked', value: blockedCount, ... } // ← 추가 용이
])
```

**검색 필터링**:
```typescript
// 현재: ID/title 검색
// 확장: matchesSearchQuery 함수 수정으로 추가 조건 지원
function matchesSearchQuery(node: WbsNode, query: string, filters?: SearchFilters): boolean {
  // filters 객체로 다양한 조건 처리
}
```

#### ⚠️ 확장 시 주의 항목

**필터링 성능**:
```typescript
// 현재: O(n) 재귀 순회
// 문제: 노드 수 증가 시 성능 저하 (1000+ 노드)
// 제약사항: < 1000개 노드 권장 (설계 문서 섹션 9.3)
```

**개선 제안**:
```typescript
// 1. 인덱싱 추가
const nodeIndex = new Map<string, WbsNode>() // O(1) 조회

// 2. Memoization
const filteredTreeCache = new Map<string, WbsNode[]>()

const filteredTree = computed(() => {
  const cacheKey = searchQuery.value
  if (filteredTreeCache.has(cacheKey)) {
    return filteredTreeCache.get(cacheKey)
  }

  const result = filterTreeNodes(tree.value, searchQuery.value)
  filteredTreeCache.set(cacheKey, result)
  return result
})

// 3. Virtual Scrolling (대규모 트리 시)
// TSK-04-02 (WbsTreeNode)에서 고려
```

---

### 5.2 수직 확장성 (Performance Scaling)

#### 성능 제약 분석

| 리소스 | 현재 제약 | 확장 한계 | 개선 방안 |
|--------|---------|---------|---------|
| 노드 수 | < 1000개 권장 | ~5000개 | 인덱싱, Virtual Scroll |
| 검색 응답 | 300ms debounce | 검색 지연 증가 | Memoization, Web Worker |
| 메모리 | flatNodes Map | 대규모 트리 시 증가 | Lazy Loading |
| 렌더링 | 전체 트리 렌더링 | 1000+ 노드 시 느림 | Virtual Scrolling |

#### 성능 최적화 전략

**단기 (Phase 1)**:
- ✅ Debounce 적용 (완료)
- ✅ Computed 캐싱 (완료)
- ✅ storeToRefs 사용 (완료)

**중기 (Phase 2)**:
- 🔄 Memoization 추가
- 🔄 검색 인덱스 구축
- 🔄 대규모 데이터 성능 테스트 (PERF-002)

**장기 (Phase 3)**:
- 📅 Virtual Scrolling (TSK-04-02)
- 📅 Web Worker 기반 검색
- 📅 Incremental Loading

---

### 5.3 플러그인 확장성

#### 현재 설계의 확장 포인트

**1. 검색 필터 플러그인**:
```typescript
// 플러그인 인터페이스
interface SearchFilter {
  name: string
  matcher: (node: WbsNode, query: string) => boolean
}

// 플러그인 등록
const searchFilters: SearchFilter[] = [
  { name: 'id', matcher: (node, q) => node.id.includes(q) },
  { name: 'title', matcher: (node, q) => node.title.includes(q) },
  { name: 'status', matcher: (node, q) => node.status?.includes(q) }
]

// 플러그인 적용
function filterWithPlugins(node: WbsNode, query: string): boolean {
  return searchFilters.some(filter => filter.matcher(node, query))
}
```

**2. 카드 플러그인**:
```typescript
// 카드 정의 플러그인
interface CardPlugin {
  id: string
  label: string
  getValue: (store: ReturnType<typeof useWbsStore>) => number
  colorClass: string
}

// 플러그인 등록
const cardPlugins: CardPlugin[] = [
  { id: 'wp', label: 'WP', getValue: s => s.wpCount, colorClass: 'text-blue-500' },
  // 외부에서 등록 가능
]
```

**확장성 점수**: 72/100 (현재는 하드코딩, 플러그인 구조 도입 시 90+)

---

## 6. 기술 부채 식별

### 6.1 기술 부채 인벤토리

| ID | 부채 항목 | 심각도 | 영향도 | 우선순위 | 예상 해결 시간 |
|----|---------|--------|--------|---------|-------------|
| TD-01 | Pinia Store 직접 의존 | 🟡 중간 | 중간 | Medium | 8h |
| TD-02 | 에러 메시지 하드코딩 | 🟢 낮음 | 낮음 | Low | 1h |
| TD-03 | 매직 넘버 (300ms) | 🟢 낮음 | 낮음 | Low | 0.5h |
| TD-04 | filterTreeNodes 복잡도 | 🟢 낮음 | 중간 | Medium | 2h |
| TD-05 | WbsTreeHeader 다중 책임 | 🟡 중간 | 낮음 | Low | 4h |
| TD-06 | 통합 테스트 부재 | 🟡 중간 | 중간 | Medium | 6h |
| TD-07 | 대규모 노드 성능 미검증 | 🟡 중간 | 높음 | High | 3h |
| TD-08 | useWbsStore 커버리지 부족 | 🟡 중간 | 중간 | Medium | 2h |

**총 예상 해결 시간**: 26.5시간

---

### 6.2 기술 부채 상세 분석

#### TD-01: Pinia Store 직접 의존

**문제점**:
```typescript
// 모든 컴포넌트가 useWbsStore() 직접 호출
const wbsStore = useWbsStore()
```

**영향**:
- 스토어 구조 변경 시 모든 컴포넌트 수정 필요
- 테스트 시 Pinia 설정 복잡도 증가
- 결합도 높음 (Common Coupling)

**해결 방안**:
```typescript
// Option 1: Composable 추출
export function useWbsTreeData() {
  const store = useWbsStore()
  return { tree, loading, error }
}

// Option 2: Props 기반
// WbsSummaryCards에 wpCount, actCount 등 Props 전달
```

**우선순위**: Medium (현재는 관리 가능, Phase 2에서 리팩토링 권장)

---

#### TD-04: filterTreeNodes 복잡도

**문제점**:
```typescript
// 재귀 함수 + 조건 분기 + 배열 조작
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []
  for (const node of nodes) {
    const nodeMatches =
      node.id.toLowerCase().includes(query) ||
      node.title.toLowerCase().includes(query)
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []
    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }
  }
  return result
}
```

**개선 방안**:
```typescript
// 1. 매칭 로직 분리
function matchesQuery(node: WbsNode, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return (
    node.id.toLowerCase().includes(lowerQuery) ||
    node.title.toLowerCase().includes(lowerQuery)
  )
}

// 2. 필터링 로직 단순화
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  return nodes.reduce<WbsNode[]>((result, node) => {
    const nodeMatches = matchesQuery(node, query)
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []

    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }

    return result
  }, [])
}

// 3. 타입 안전성 강화
interface FilterOptions {
  query: string
  caseSensitive?: boolean
  fields?: Array<keyof WbsNode>
}

function filterTreeNodesAdvanced(
  nodes: WbsNode[],
  options: FilterOptions
): WbsNode[] {
  // 확장 가능한 구조
}
```

**예상 효과**:
- 가독성 향상
- 테스트 용이성 증가
- 확장성 향상 (status, category 필터 추가 용이)

---

#### TD-07: 대규모 노드 성능 미검증

**문제점**:
- 설계 문서에서 < 1000개 노드 권장
- PERF-002 테스트 누락 (1000+ 노드 성능 테스트)
- 실제 프로덕션 환경에서 노드 수 예측 불가

**위험도**: 높음 (성능 병목 가능성)

**해결 방안**:
```typescript
// 성능 테스트 구현
describe('Performance Tests', () => {
  it('PERF-002: 1000개 노드 필터링 < 100ms', () => {
    const largeTree = generateMockTree(1000)
    const store = useWbsStore()
    store.tree = [largeTree]

    const startTime = performance.now()
    store.setSearchQuery('TSK')
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(100)
  })

  it('5000개 노드 필터링 < 500ms', () => {
    // Virtual Scrolling 적용 후 테스트
  })
})
```

**우선순위**: High (단기 개선 항목)

---

### 6.3 기술 부채 해결 로드맵

#### Phase 1: 즉시 조치 (현재 스프린트)

| ID | 항목 | 시간 | 담당 |
|----|------|------|------|
| TD-08 | useWbsStore 커버리지 향상 (UT-016, 017, 018) | 2h | QA |
| TD-07 | PERF-002 성능 테스트 구현 | 3h | QA/Dev |
| TD-03 | 매직 넘버 상수화 | 0.5h | Dev |

**총 시간**: 5.5시간

#### Phase 2: 단기 개선 (다음 스프린트)

| ID | 항목 | 시간 | 담당 |
|----|------|------|------|
| TD-04 | filterTreeNodes 리팩토링 | 2h | Dev |
| TD-02 | 에러 메시지 맵핑 객체화 | 1h | Dev |
| TD-06 | 통합 테스트 추가 (3개) | 6h | QA |

**총 시간**: 9시간

#### Phase 3: 중기 개선 (향후 고려)

| ID | 항목 | 시간 | 담당 |
|----|------|------|------|
| TD-01 | Composable 추출 리팩토링 | 8h | Architect/Dev |
| TD-05 | WbsTreeHeader 컴포넌트 분리 | 4h | Dev |

**총 시간**: 12시간

---

## 7. 리팩토링 권장사항

### 7.1 즉시 적용 가능 (Quick Wins)

#### 1. 매직 넘버 상수화

**Before**:
```typescript
const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300)
```

**After**:
```typescript
const SEARCH_DEBOUNCE_MS = 300

const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, SEARCH_DEBOUNCE_MS)
```

**효과**:
- 가독성 향상
- 변경 용이성 증가
- 문서화 개선 (상수명이 의도 설명)

**공수**: 0.5시간

---

#### 2. 에러 메시지 중앙 관리

**Before**:
```typescript
if (e.statusCode === 404) {
  error.value = '프로젝트를 찾을 수 없습니다.'
} else if (e.statusCode === 500) {
  error.value = '서버 오류가 발생했습니다.'
}
```

**After**:
```typescript
// app/utils/errorMessages.ts
export const API_ERROR_MESSAGES: Record<number, string> = {
  404: '프로젝트를 찾을 수 없습니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  408: '요청 시간이 초과되었습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.'
}

export function getApiErrorMessage(statusCode: number): string {
  return API_ERROR_MESSAGES[statusCode] || '알 수 없는 오류가 발생했습니다.'
}

// WbsTreePanel.vue
error.value = getApiErrorMessage(e.statusCode)
```

**효과**:
- OCP 준수 (새 에러 코드 추가 시 객체만 수정)
- 일관된 에러 메시지 관리
- i18n 적용 용이 (향후)

**공수**: 1시간

---

### 7.2 단기 리팩토링 (Phase 2)

#### 1. filterTreeNodes 함수 개선

**Before**:
```typescript
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  const result: WbsNode[] = []
  for (const node of nodes) {
    const nodeMatches =
      node.id.toLowerCase().includes(query) ||
      node.title.toLowerCase().includes(query)
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []
    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }
  }
  return result
}
```

**After**:
```typescript
// 1. 매칭 로직 분리
function nodeMatchesQuery(node: WbsNode, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return (
    node.id.toLowerCase().includes(lowerQuery) ||
    node.title.toLowerCase().includes(lowerQuery)
  )
}

// 2. 필터링 로직 함수형 스타일
function filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[] {
  return nodes.reduce<WbsNode[]>((result, node) => {
    const nodeMatches = nodeMatchesQuery(node, query)
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []

    // 현재 노드 또는 자식이 매칭되면 포함 (상위 경로 보존)
    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }

    return result
  }, [])
}

// 3. 확장 가능한 버전 (향후)
interface FilterCriteria {
  query: string
  fields?: Array<keyof WbsNode>
  caseSensitive?: boolean
}

function filterTreeNodesAdvanced(
  nodes: WbsNode[],
  criteria: FilterCriteria
): WbsNode[] {
  const { query, fields = ['id', 'title'], caseSensitive = false } = criteria
  const searchQuery = caseSensitive ? query : query.toLowerCase()

  return nodes.reduce<WbsNode[]>((result, node) => {
    const nodeMatches = fields.some(field => {
      const value = node[field]?.toString() || ''
      const compareValue = caseSensitive ? value : value.toLowerCase()
      return compareValue.includes(searchQuery)
    })

    const filteredChildren = node.children
      ? filterTreeNodesAdvanced(node.children, criteria)
      : []

    if (nodeMatches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }

    return result
  }, [])
}
```

**효과**:
- 순환 복잡도 감소 (4 → 2)
- 테스트 용이성 증가 (nodeMatchesQuery 단독 테스트 가능)
- 확장성 향상 (status, category 필터 추가 용이)

**공수**: 2시간

---

#### 2. 통합 테스트 추가

**목적**: 컴포넌트 간 상호작용 검증

```typescript
// tests/integration/wbs-tree-integration.spec.ts
describe('WBS Tree Integration Tests', () => {
  it('검색 시 요약 카드 값이 업데이트된다', async () => {
    // Given: 전체 WBS 트리 로드
    const wrapper = mount(WbsTreePanel, {
      global: {
        mocks: { $route: { query: { projectId: 'test' } } }
      }
    })

    const store = useWbsStore()
    store.tree = [mockWbsData]
    await wrapper.vm.$nextTick()

    // When: 검색어 입력
    const searchInput = wrapper.find('[data-testid="search-input"]')
    await searchInput.setValue('TSK-01')
    await vi.advanceTimersByTime(300)

    // Then: TSK 카드 값이 필터링된 수로 업데이트
    const tskCard = wrapper.find('[data-testid="tsk-card"]')
    expect(tskCard.text()).toContain('2') // TSK-01-01-01, TSK-01-01-02
  })

  it('전체 펼치기 후 검색 시 펼쳐진 상태 유지', async () => {
    // Given: 전체 펼치기
    const wrapper = mount(WbsTreePanel)
    await wrapper.find('[data-testid="expand-all-button"]').trigger('click')

    const store = useWbsStore()
    const initialExpandedCount = store.expandedNodes.size

    // When: 검색어 입력
    await wrapper.find('[data-testid="search-input"]').setValue('TSK')
    await vi.advanceTimersByTime(300)

    // Then: 펼쳐진 상태 유지
    expect(store.expandedNodes.size).toBeGreaterThan(0)
  })

  it('에러 발생 시 모든 하위 컴포넌트가 숨겨진다', async () => {
    // Given: API 에러 상태
    const wrapper = mount(WbsTreePanel)
    const store = useWbsStore()
    store.error = 'Test error'
    await wrapper.vm.$nextTick()

    // Then: 헤더, 검색, 카드 모두 미표시
    expect(wrapper.find('[data-testid="wbs-tree-header"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="wbs-search-box"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="wbs-summary-cards"]').exists()).toBe(false)
  })
})
```

**효과**:
- 컴포넌트 간 상호작용 검증
- 통합 버그 조기 발견
- 리팩토링 안전성 증가

**공수**: 6시간

---

### 7.3 중기 리팩토링 (Phase 3)

#### 1. Composable 추출 (결합도 완화)

**목적**: Pinia Store 직접 의존성 감소

```typescript
// app/composables/useWbsData.ts
export function useWbsData() {
  const store = useWbsStore()

  return {
    tree: computed(() => store.tree),
    filteredTree: computed(() => store.filteredTree),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    wpCount: computed(() => store.wpCount),
    actCount: computed(() => store.actCount),
    tskCount: computed(() => store.tskCount),
    overallProgress: computed(() => store.overallProgress)
  }
}

// app/composables/useWbsActions.ts
export function useWbsActions() {
  const store = useWbsStore()

  return {
    fetchWbs: (projectId: string) => store.fetchWbs(projectId),
    setSearchQuery: (query: string) => store.setSearchQuery(query),
    expandAll: () => store.expandAll(),
    collapseAll: () => store.collapseAll(),
    clearWbs: () => store.clearWbs()
  }
}

// WbsSummaryCards.vue (After)
<script setup lang="ts">
import { useWbsData } from '~/composables/useWbsData'

const { wpCount, actCount, tskCount, overallProgress } = useWbsData()

const cards = computed(() => [
  { label: 'WP', value: wpCount, ... },
  // ...
])
</script>
```

**효과**:
- 스토어 구조 변경 시 Composable만 수정
- 테스트 시 Composable Mock으로 간단히 대체
- 결합도 감소 (External Coupling → Data Coupling)

**공수**: 8시간

---

#### 2. WbsTreeHeader 컴포넌트 분리

**목적**: SRP 준수 강화

```typescript
// WbsTreeTitle.vue (새로 생성)
<template>
  <h2 id="wbs-tree-title" class="text-lg font-semibold text-[#e8e8e8]">
    <i class="pi pi-sitemap text-purple-500"></i>
    WBS 트리
  </h2>
</template>

// WbsTreeActions.vue (새로 생성)
<template>
  <div class="flex gap-2">
    <Button
      data-testid="expand-all-button"
      label="전체 펼치기"
      icon="pi pi-angle-double-down"
      @click="handleExpandAll"
    />
    <Button
      data-testid="collapse-all-button"
      label="전체 접기"
      icon="pi pi-angle-double-up"
      @click="handleCollapseAll"
    />
  </div>
</template>

<script setup lang="ts">
import { useWbsActions } from '~/composables/useWbsActions'

const { expandAll, collapseAll } = useWbsActions()

const handleExpandAll = () => expandAll()
const handleCollapseAll = () => collapseAll()
</script>

// WbsTreeHeader.vue (After)
<template>
  <div class="wbs-tree-header">
    <div class="flex items-center justify-between mb-4">
      <WbsTreeTitle />
      <WbsTreeActions />
    </div>
    <WbsSearchBox class="mb-4" />
    <WbsSummaryCards />
  </div>
</template>
```

**효과**:
- SRP 준수 (각 컴포넌트가 단일 책임)
- 재사용성 증가 (WbsTreeActions 다른 곳에서도 사용 가능)
- 테스트 용이성 증가 (작은 단위로 테스트)

**공수**: 4시간

---

## 8. 종합 평가 및 권장사항

### 8.1 강점 (Strengths)

1. **우수한 컴포넌트 분리**: 명확한 역할 구분 (Container/Presentation)
2. **높은 테스트 커버리지**: 82% 예상 (목표 80% 초과)
3. **낮은 순환 복잡도**: 평균 3.17 (권장 < 10)
4. **상세한 문서화**: 설계, 추적성, 테스트 명세 완비
5. **접근성 고려**: ARIA 속성, 키보드 네비게이션, 스크린 리더 지원
6. **확장 가능한 구조**: 카드 추가, 필터 확장 용이

### 8.2 약점 (Weaknesses)

1. **Pinia Store 직접 의존**: 결합도 높음, 테스트 복잡도 증가
2. **통합 테스트 부재**: 컴포넌트 간 상호작용 검증 부족
3. **대규모 데이터 미검증**: 1000+ 노드 성능 테스트 누락
4. **일부 하드코딩**: 매직 넘버, 에러 메시지
5. **useWbsStore 커버리지 부족**: 75% (목표 80% 미달)

### 8.3 최종 권장사항

#### 즉시 조치 (현재 스프린트)

| 우선순위 | 항목 | 공수 | 효과 |
|---------|------|------|------|
| 🔴 High | PERF-002 성능 테스트 추가 | 3h | 병목 조기 발견 |
| 🔴 High | useWbsStore 커버리지 향상 (UT-016~018) | 2h | 목표 달성 |
| 🟡 Medium | 매직 넘버 상수화 | 0.5h | 가독성 향상 |

**총 공수**: 5.5시간

#### 단기 개선 (다음 스프린트)

| 우선순위 | 항목 | 공수 | 효과 |
|---------|------|------|------|
| 🟡 Medium | filterTreeNodes 리팩토링 | 2h | 확장성 향상 |
| 🟡 Medium | 통합 테스트 추가 (3개) | 6h | 안정성 증가 |
| 🟢 Low | 에러 메시지 중앙 관리 | 1h | 유지보수성 향상 |

**총 공수**: 9시간

#### 중기 개선 (향후 고려)

| 우선순위 | 항목 | 공수 | 효과 |
|---------|------|------|------|
| 🟡 Medium | Composable 추출 리팩토링 | 8h | 결합도 감소 |
| 🟢 Low | WbsTreeHeader 컴포넌트 분리 | 4h | SRP 준수 |

**총 공수**: 12시간

---

### 8.4 구현 진행 시 주의사항

1. **테스트 우선 작성**: TDD 접근으로 리팩토링 안전성 확보
2. **점진적 리팩토링**: 한 번에 모든 항목 개선 지양, 우선순위 기반 진행
3. **성능 모니터링**: PERF-002 결과에 따라 Virtual Scrolling 적용 여부 결정
4. **문서 동기화**: 리팩토링 시 설계 문서 즉시 업데이트
5. **Breaking Change 회피**: 기존 API 유지하며 내부 구현만 개선

---

### 8.5 승인 체크리스트

#### 설계 승인 기준

- [x] SOLID 원칙 전체 평가 점수 >= 80점 (현재: 85점)
- [x] 테스트 커버리지 >= 80% (예상: 82%)
- [x] 순환 복잡도 < 10 (평균: 3.17)
- [x] 문서화 품질 >= 90점 (현재: 95점)
- [x] 접근성 검증 계획 수립 (axe-core, 키보드 네비게이션)
- [ ] 성능 테스트 완료 (PERF-002 누락 - 즉시 조치 필요)
- [x] 기술 부채 식별 및 해결 계획 수립

#### 구현 진행 조건

- [x] 상세설계 리뷰 완료
- [x] 추적성 매트릭스 검증 완료
- [x] 테스트 명세 승인
- [ ] 성능 테스트 케이스 추가 (PERF-002)
- [ ] useWbsStore 테스트 커버리지 80% 달성 (UT-016~018 추가)

**현재 상태**: 조건부 승인 (PERF-002, UT-016~018 완료 후 구현 진행 가능)

---

## 9. 결론

### 9.1 전체 평가

TSK-04-01 (Tree Panel) 설계는 **전반적으로 우수한 품질**을 보이며, SOLID 원칙 준수, 낮은 복잡도, 높은 테스트 가능성을 갖추고 있습니다.

**종합 점수**: **85.3/100 (A-)**

### 9.2 핵심 강점

1. 명확한 컴포넌트 역할 분리 (Container/Presentation)
2. 우수한 테스트 전략 (단위 + E2E + 접근성 + 성능)
3. 상세하고 체계적인 문서화
4. 확장 가능한 아키텍처 (카드, 필터 확장 용이)
5. 낮은 순환 복잡도 (평균 3.17)

### 9.3 주요 개선 영역

1. **즉시**: 성능 테스트 추가, 테스트 커버리지 보완
2. **단기**: 통합 테스트 추가, 코드 리팩토링 (filterTreeNodes, 상수화)
3. **중기**: 결합도 완화 (Composable 추출), SRP 강화 (컴포넌트 분리)

### 9.4 최종 권고

**구현 진행 승인**: 조건부 ✅

**조건**:
1. PERF-002 성능 테스트 케이스 추가 (3시간)
2. UT-016, 017, 018 테스트 케이스 추가 (2시간)

**총 선행 작업**: 5시간

선행 작업 완료 후 **구현 단계 (/wf:build)** 진행 권장.

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-01)

---

<!--
author: Claude (Refactoring Expert)
review_type: Design Review
focus: SOLID, Code Quality, Technical Debt
Template Version: 1.0.0
Created: 2025-12-15
-->
