# 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **리뷰 목적**
> * 기본설계, 화면설계, 상세설계의 완전성 및 일관성 검증
> * 기존 구현 패턴과의 일치 여부 확인
> * 타입 안전성, 접근성, 성능 요구사항 검증
> * 설계 품질 문제 지적 및 개선 제안

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 리뷰 일자 | 2025-12-16 |
| 리뷰어 | Claude (Design Reviewer) |

### 리뷰 대상 문서

| 문서 유형 | 경로 | 버전 |
|----------|------|------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md` | 1.0 |
| 화면설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md` | 1.0 |
| 상세설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md` | 1.0 |
| 추적성 매트릭스 | `.jjiban/projects/jjiban/tasks/TSK-05-05/025-traceability-matrix.md` | 1.0 |
| 테스트 명세 | `.jjiban/projects/jjiban/tasks/TSK-05-05/026-test-specification.md` | 1.0 |

### 비교 대상 기존 구현

| 컴포넌트/스토어 | 경로 | 용도 |
|---------------|------|------|
| TaskDetailPanel | `app/components/wbs/detail/TaskDetailPanel.vue` | 패턴 참조 |
| selectionStore | `app/stores/selection.ts` | 확장 기반 |
| wbsStore | `app/stores/wbs.ts` | 메서드 활용 |
| types/index.ts | `app/types/index.ts` | 타입 정의 기반 |
| main.css | `app/assets/css/main.css` | CSS 패턴 준수 |

---

## 1. 리뷰 요약 (Executive Summary)

### 1.1 전반적 평가

| 평가 항목 | 점수 | 평가 |
|---------|------|------|
| 요구사항 완전성 | ⭐⭐⭐⭐⭐ | 모든 FR/NFR이 설계에 반영됨 |
| 기존 패턴 일관성 | ⭐⭐⭐⭐☆ | 대부분 일치하나 일부 개선 필요 |
| 타입 안전성 | ⭐⭐⭐⭐⭐ | TypeScript 타입 정의 완벽 |
| 접근성 (ARIA) | ⭐⭐⭐⭐⭐ | WCAG 2.1 AA 수준 준수 |
| 성능 고려사항 | ⭐⭐⭐⭐☆ | 최적화 전략 명확하나 검증 필요 |
| 테스트 커버리지 | ⭐⭐⭐⭐⭐ | 단위/통합/E2E 테스트 충분 |
| 문서 품질 | ⭐⭐⭐⭐⭐ | 상세하고 명확한 문서화 |

**종합 평가**: ⭐⭐⭐⭐☆ (4.7/5.0)

### 1.2 주요 강점

✅ **완벽한 요구사항 추적성**: FR-001 ~ FR-006, NFR-001 ~ NFR-004 모두 설계에 반영
✅ **체계적인 컴포넌트 구조**: 단일 책임 원칙 준수, 명확한 계층 구조
✅ **타입 안전성**: ProgressStats 타입 정의 및 타입 가드 완벽
✅ **접근성 준수**: ARIA 속성, 키보드 네비게이션 완벽 설계
✅ **테스트 명세 충실**: 30+ 테스트 케이스, E2E 6개 시나리오
✅ **CSS 중앙화 원칙**: main.css 클래스 중앙 관리 (HEX 하드코딩 없음)

### 1.3 개선 필요 영역

⚠️ **Critical**: 없음
⚠️ **High**: 1개 - selectionStore 확장 시 기존 코드와의 충돌 가능성
⚠️ **Medium**: 3개 - 성능 측정 방법, 에러 메시지 다국어화, 빈 상태 UX
⚠️ **Low**: 2개 - 코드 주석 부족, 문서 버전 관리

---

## 2. 중요도별 지적 사항

### 2.1 Critical (치명적 - 즉시 수정 필요)

**없음** - 치명적 수준의 설계 결함 없음

---

### 2.2 High (높음 - 구현 전 반드시 검토)

#### H-01: selectionStore 확장 시 기존 로직과의 충돌 위험

**카테고리**: 아키텍처, 호환성
**위치**: 상세설계 §3.1, selectionStore

**문제점**:
```typescript
// 상세설계 §3.1.1 - 추가 예정
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value || isTaskSelected.value) return null
  const wbsStore = useWbsStore()
  return wbsStore.getNode(selectedNodeId.value) || null
})
```

**위험 요소**:
1. `selectedNode` computed가 `wbsStore`를 직접 참조하면 순환 의존성 위험
2. `wbsStore.getNode()`은 `flatNodes.get(id)`를 사용하는데, `flatNodes`는 `fetchWbs()` 호출 시 업데이트됨
3. WBS 데이터 로드 전 `selectedNode` 접근 시 undefined 반환 가능
4. 기존 `selectNode()` 메서드는 Task만 처리하는데, WP/ACT 선택 시 추가 로직 없음

**개선 제안**:
```typescript
// selectionStore에 추가
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value) return null
  if (isTaskSelected.value) return null

  const wbsStore = useWbsStore()
  // wbsStore.flatNodes가 초기화되었는지 확인
  if (!wbsStore.flatNodes || wbsStore.flatNodes.size === 0) {
    console.warn('WBS data not loaded yet')
    return null
  }

  const node = wbsStore.getNode(selectedNodeId.value)
  if (!node) {
    console.warn(`Node not found: ${selectedNodeId.value}`)
  }
  return node || null
})
```

**추가 검증 사항**:
- WBS 데이터 로드 순서 확인 (wbs.vue 마운트 → fetchWbs → selectionStore 사용)
- `selectedNode`가 null일 때 NodeDetailPanel의 빈 상태 처리 확인
- HMR (Hot Module Replacement) 시 스토어 상태 유지 확인

**우선순위**: High
**영향 범위**: selectionStore, NodeDetailPanel
**예상 작업**: 2시간

---

### 2.3 Medium (중간 - 구현 중 고려)

#### M-01: 성능 요구사항 측정 방법 명확화 필요

**카테고리**: 성능, 테스트
**위치**: 기본설계 §2.2 NFR-001, NFR-002

**문제점**:
- NFR-001 (노드 선택 < 100ms): "이미 로드된 데이터 사용" → 측정 시작/종료 시점 불명확
- NFR-002 (카운팅 < 50ms): "재귀 탐색 최적화" → 200개 Task 시나리오인지 불명확
- 성능 테스트 명세 (026-test-specification.md §5)는 있으나, 실제 측정 코드 예시 없음

**개선 제안**:
```typescript
// 성능 측정 헬퍼 함수 (utils/performance.ts)
export function measurePerformance<T>(
  label: string,
  fn: () => T,
  threshold?: number
): { result: T; duration: number; passed: boolean } {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  const passed = threshold ? duration < threshold : true

  if (!passed) {
    console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
  }

  return { result, duration, passed }
}

// 사용 예시 (selectionStore.ts)
const { result: node, duration, passed } = measurePerformance(
  'selectNode',
  () => wbsStore.getNode(selectedNodeId.value),
  100 // NFR-001: < 100ms
)
```

**테스트 코드 예시**:
```typescript
// tests/unit/stores/selection.perf.test.ts
it('NFR-001: 1000개 노드 중 selectedNode 조회 < 100ms', () => {
  const wbsStore = useWbsStore()
  // 1000개 노드 생성
  for (let i = 0; i < 1000; i++) {
    wbsStore.flatNodes.set(`WP-${i}`, { id: `WP-${i}`, ... })
  }

  const store = useSelectionStore()
  const { duration, passed } = measurePerformance(
    'selectedNode lookup',
    () => {
      store.selectedNodeId = 'WP-500'
      return store.selectedNode
    },
    100
  )

  expect(passed).toBe(true)
  expect(duration).toBeLessThan(100)
})
```

**우선순위**: Medium
**영향 범위**: 성능 테스트, utils
**예상 작업**: 1시간

---

#### M-02: 빈 상태 (Empty State) UX 개선 여지

**카테고리**: UX, 화면설계
**위치**: 화면설계 §2.5 (WpActChildren 빈 상태)

**문제점**:
현재 설계:
```vue
<div v-if="children.length === 0" class="empty-state">
  <Message severity="info">
    하위 노드가 없습니다
  </Message>
</div>
```

**개선 여지**:
1. 사용자가 다음 액션을 취할 수 있는 안내 부족
2. WP/ACT가 왜 비어있는지 (의도적인지, 에러인지) 구분 없음
3. TaskDetailPanel의 빈 상태와 일관성 확인 필요

**개선 제안**:
```vue
<div v-if="children.length === 0" class="empty-state p-6 text-center">
  <i class="pi pi-inbox text-4xl text-text-muted mb-3"></i>
  <Message severity="info" :closable="false">
    <p class="mb-2">하위 노드가 없습니다</p>
    <p class="text-xs text-text-secondary">
      {{ node.type === 'wp' ? 'Activity 또는 Task' : 'Task' }}를
      wbs.md 파일에 추가해주세요
    </p>
  </Message>
</div>
```

**참고 - TaskDetailPanel 빈 상태**:
```vue
<Message severity="info" data-testid="empty-state-message">
  왼쪽에서 Task를 선택하세요
</Message>
```

**일관성 검토**:
- TaskDetailPanel: "왼쪽에서 Task를 선택하세요" (액션 안내 명확)
- WpActChildren: "하위 노드가 없습니다" (액션 안내 부족)

**우선순위**: Medium
**영향 범위**: WpActChildren.vue
**예상 작업**: 30분

---

#### M-03: 에러 메시지 다국어화 고려 부족

**카테고리**: i18n, 유지보수성
**위치**: 상세설계 전반

**문제점**:
현재 설계는 모든 메시지가 한글 하드코딩:
```typescript
const ERROR_MESSAGES = {
  TITLE_LENGTH: 'Task 제목은 1자 이상 200자 이하여야 합니다.',
  // ...
} as const
```

WpActChildren, WpActProgress 등도 마찬가지:
```vue
<Message severity="info">
  하위 노드가 없습니다
</Message>
```

**영향**:
- 향후 다국어 지원 시 모든 컴포넌트 수정 필요
- 메시지 키 관리 불일치 (일부는 상수, 일부는 템플릿)

**개선 제안** (향후 확장 고려):
```typescript
// 현재는 한글만 지원하지만, 구조는 i18n 준비
const MESSAGES = {
  EMPTY_CHILDREN: '하위 노드가 없습니다',
  EMPTY_CHILDREN_HINT_WP: 'Activity 또는 Task를 wbs.md 파일에 추가해주세요',
  EMPTY_CHILDREN_HINT_ACT: 'Task를 wbs.md 파일에 추가해주세요',
} as const

// 사용
<Message severity="info">
  {{ MESSAGES.EMPTY_CHILDREN }}
</Message>
```

**참고 - 기존 TaskDetailPanel**:
```typescript
const ERROR_MESSAGES = {
  TITLE_LENGTH: 'Task 제목은 1자 이상 200자 이하여야 합니다.',
  // ...
} as const
```
→ 이미 상수로 관리하고 있으므로 일관성 유지

**우선순위**: Medium
**영향 범위**: 전체 컴포넌트 (신규 5개)
**예상 작업**: 1시간
**비고**: 현재 단계에서는 한글만 지원하므로 Low 우선순위로 변경 가능

---

### 2.4 Low (낮음 - 선택적 개선)

#### L-01: 컴포넌트 코드 주석 부족

**카테고리**: 문서화, 유지보수성
**위치**: 상세설계 §2 (컴포넌트별 상세 설계)

**문제점**:
- 상세설계 문서는 충분하나, 실제 구현 시 코드 주석 가이드 부족
- 기존 TaskDetailPanel.vue는 JSDoc 주석이 충실함:
```typescript
/**
 * TaskDetailPanel - Task 상세 정보 컨테이너 컴포넌트
 * Task: TSK-05-01, TSK-05-02
 * 상세설계: 020-detail-design.md 섹션 9.3
 *
 * 책임:
 * - Pinia useSelectionStore 구독
 * - 로딩/에러/빈 상태 분기 처리
 * ...
 */
```

**개선 제안**:
각 신규 컴포넌트 상단에 JSDoc 추가:

```typescript
/**
 * WpActDetailPanel - WP/ACT 노드 상세 정보 컨테이너
 * Task: TSK-05-05
 * 상세설계: 020-detail-design.md 섹션 2.2
 *
 * 책임:
 * - WP/ACT 노드 데이터 받기
 * - 하위 노드 집계 (상태별 카운트, 진행률 계산)
 * - 3개 하위 컴포넌트 조정
 *
 * Props:
 * - node: WbsNode (선택된 WP 또는 ACT 노드)
 *
 * Emits:
 * - 없음 (하위 컴포넌트에서 직접 스토어 호출)
 */
```

**우선순위**: Low
**영향 범위**: 신규 5개 컴포넌트
**예상 작업**: 30분

---

#### L-02: 문서 버전 관리 및 변경 이력 추적 미흡

**카테고리**: 문서화, 프로세스
**위치**: 전체 설계 문서

**문제점**:
- 추적성 매트릭스 (025-traceability-matrix.md)에는 변경 이력 섹션 있으나 "변경 없음"
- 향후 설계 변경 시 이력 관리 방법 불명확
- Git 커밋 메시지만으로는 설계 의도 파악 어려움

**개선 제안**:
각 설계 문서에 변경 이력 섹션 추가:

```markdown
## 변경 이력

| 버전 | 날짜 | 변경 내용 | 변경 사유 | 영향 범위 |
|------|------|----------|----------|----------|
| 1.1 | 2025-12-17 | WpActProgress UI 개선 | 리뷰 피드백 반영 | §2.4 |
| 1.0 | 2025-12-16 | 초기 작성 | - | 전체 |
```

**우선순위**: Low
**영향 범위**: 문서 관리 프로세스
**예상 작업**: 15분

---

## 3. 설계별 상세 리뷰

### 3.1 기본설계 (010-basic-design.md)

#### 3.1.1 강점

✅ **명확한 목적 및 범위**: "Task와 WP/ACT는 데이터 소스, UI, 인터랙션이 완전히 다름" → 별도 컴포넌트 정당화 명확
✅ **WP/ACT vs Task 차이점 분석**: §4에서 데이터 구조, 표시 콘텐츠, 인터랙션 차이 상세 비교
✅ **아키텍처 개요 명확**: §5.1 분기 전략 및 대안 검토 (3가지 방안 비교)
✅ **진행률 계산 로직 상세**: §8에서 `calculateProgressStats` 알고리즘 구체적 명세

#### 3.1.2 개선 권장 사항

**R-01: selectionStore 확장 시 데이터 로드 타이밍 검증 필요**
```typescript
// 기본설계 §6.1 - 추가 필요
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value || isTaskSelected.value) return null
  return wbsStore.findNodeById(selectedNodeId.value)  // ← findNodeById는 없음, getNode 사용해야 함
})
```
**문제**: `wbsStore.findNodeById()` 메서드는 기본설계에서 정의했으나, 실제 wbsStore에는 `getNode()` 메서드가 있음
**해결**: `getNode()`를 사용하도록 수정 (상세설계 §3.2에서 이미 수정됨)

**R-02: 기본설계 §8.1 재귀 탐색 시간복잡도 검증**
```typescript
// O(N) 시간복잡도라고 명시했으나 실제 검증 필요
function collectTasks(n: WbsNode) {
  if (n.type === 'task') {
    allTasks.push(n)
  } else if (n.children.length > 0) {
    n.children.forEach(collectTasks)  // ← forEach + 재귀 = O(N)
  }
}
```
**검증**: 맞음, 각 노드를 1회만 방문하므로 O(N)
**추가 권장**: 성능 테스트에서 1000+ 노드 시나리오 추가

---

### 3.2 화면설계 (011-ui-design.md)

#### 3.2.1 강점

✅ **PrimeVue 컴포넌트 매핑 명확**: §3.1 테이블에서 화면 요소 → PrimeVue 컴포넌트 매핑
✅ **CSS 클래스 중앙화 준수**: §4에서 main.css 클래스 정의, HEX 하드코딩 없음
✅ **접근성 고려사항 충실**: §6에서 ARIA 속성, 키보드 네비게이션 상세 명세
✅ **애니메이션 및 전환 효과**: §8에서 fade 애니메이션, 호버 효과 정의

#### 3.2.2 개선 권장 사항

**R-03: WpActProgress 다단계 ProgressBar CSS 변수 활용 검토**

현재 설계 (화면설계 §2.4):
```vue
<div
  class="progress-segment progress-segment-completed"
  :style="{ width: `${completedPercentage}%` }"
></div>
```

**문제**: `:style` 사용 (CSS 클래스 중앙화 원칙 예외 사항)
**정당화**: width는 동적 계산 필수 → 예외 허용 ✅
**권장**: 주석 추가하여 예외 이유 명시

```vue
<!-- 예외: width는 동적 계산 필수 (CSS 클래스 중앙화 원칙 예외) -->
<div
  class="progress-segment progress-segment-completed"
  :style="{ width: `${completedPercentage}%` }"
></div>
```

**R-04: main.css 신규 클래스 네이밍 일관성 확인**

기존 main.css 패턴:
```css
/* 노드 아이콘 */
.node-icon-wp { @apply bg-level-wp; }
.node-icon-act { @apply bg-level-act; }

/* 카테고리 태그 */
.category-tag-development { ... }
.category-tag-defect { ... }
```

신규 클래스 (화면설계 §4.2):
```css
.wp-act-detail-panel { ... }
.progress-segment-completed { ... }
.child-item { ... }
```

**검토 결과**: 네이밍 일관성 양호 ✅
- `wp-act-*`: WP/ACT 관련 (BEM 스타일 유사)
- `progress-segment-*`: 진행률 세그먼트
- `child-item`: 하위 노드 아이템

**권장**: 네이밍 컨벤션 문서화 (향후 확장 시 참고)

---

### 3.3 상세설계 (020-detail-design.md)

#### 3.3.1 강점

✅ **타입 정의 완벽**: §1에서 ProgressStats 타입 명확히 정의
✅ **컴포넌트별 인터페이스 상세**: §2에서 Props/Emits/Computed/Methods 모두 정의
✅ **유틸리티 함수 알고리즘**: §4.1에서 `calculateProgressStats` 구현 로직 상세
✅ **에러 처리 및 검증**: §7에서 에러 케이스 및 타입 가드 완벽
✅ **테스트 명세 충실**: §10에서 단위/통합/E2E 테스트 케이스 상세

#### 3.3.2 개선 권장 사항

**R-05: calculateProgressStats 타입 안전성 추가 검증**

현재 설계 (상세설계 §4.1.2):
```typescript
function collectTasks(n: WbsNode): void {
  if (n.type === 'task') {
    allTasks.push(n)
  } else if (n.children && n.children.length > 0) {
    n.children.forEach(collectTasks)
  }
}
```

**개선 제안**:
```typescript
function collectTasks(n: WbsNode): void {
  if (!n) return  // null/undefined 방어

  if (n.type === 'task') {
    allTasks.push(n)
    return  // Early return (자식 탐색 불필요)
  }

  if (n.children && Array.isArray(n.children) && n.children.length > 0) {
    n.children.forEach(collectTasks)
  }
}
```

**이유**:
1. null/undefined 방어 추가
2. Task 타입일 때 Early return (children 탐색 불필요)
3. `Array.isArray()` 검증 추가 (타입 안전성)

**R-06: WpActProgress getStatusSeverity 함수 중복 제거**

문제:
- `WpActProgress.vue` (상세설계 §2.4.4)
- `WpActChildren.vue` (상세설계 §2.5.4)

두 컴포넌트에서 동일한 `getStatusSeverity` 함수 중복 정의

**개선 제안**:
```typescript
// utils/wbsStatus.ts (신규 생성)
export function getStatusSeverity(status: string): string {
  const severityMap: Record<string, string> = {
    '[ ]': 'secondary',
    '[bd]': 'info',
    '[dd]': 'info',
    '[an]': 'warning',
    '[ds]': 'info',
    '[im]': 'warning',
    '[fx]': 'warning',
    '[vf]': 'success',
    '[xx]': 'success',
  }
  return severityMap[status] || 'secondary'
}

// WpActProgress.vue, WpActChildren.vue
import { getStatusSeverity } from '~/utils/wbsStatus'
```

**이점**:
- DRY 원칙 준수
- 상태 매핑 로직 중앙 관리
- 향후 상태 추가 시 1곳만 수정

---

### 3.4 추적성 매트릭스 (025-traceability-matrix.md)

#### 3.4.1 강점

✅ **완벽한 요구사항 추적**: §1.1에서 FR/NFR → 설계 → 구현 → 테스트 매핑
✅ **컴포넌트별 추적성**: §2에서 5개 컴포넌트 각각 추적
✅ **회귀 테스트 매트릭스**: §9에서 기존 기능 영향 분석

#### 3.4.2 개선 권장 사항

**R-07: 테스트 커버리지 목표 달성 검증 방법 추가**

현재 (추적성 매트릭스 §10.1):
```
calculateProgressStats: 100% 목표
WpActBasicInfo: 90% 목표
...
```

**개선 제안**:
```markdown
### 10.3 커버리지 측정 방법

**Vitest 커버리지 설정** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['app/components/wbs/detail/WpAct*.vue', 'app/utils/wbsProgress.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      }
    }
  }
})
```

**실행**:
```bash
npm run test:unit -- --coverage
```
```

---

### 3.5 테스트 명세 (026-test-specification.md)

#### 3.5.1 강점

✅ **테스트 피라미드 명확**: §1.1에서 단위 70%, 통합 20%, E2E 10%
✅ **테스트 케이스 충실**: 30+ 단위 테스트, 6개 E2E 시나리오
✅ **성능 테스트 포함**: §5에서 NFR-001, NFR-002 검증
✅ **테스트 데이터 Fixture**: §7에서 재사용 가능한 Fixture 정의

#### 3.5.2 개선 권장 사항

**R-08: E2E 테스트 시나리오 5 (빈 WP/ACT) 테스트 데이터 준비**

현재 (테스트 명세 §4.6):
```typescript
test('빈 WP/ACT의 빈 상태 메시지', async ({ page }) => {
  // 테스트 데이터: 하위 노드가 없는 WP 생성 필요
  // 현재 jjiban 프로젝트는 모든 WP에 하위 노드가 있으므로
  // 테스트 프로젝트 또는 Mock 데이터 필요

  await page.click('[data-testid="node-WP-EMPTY"]')
  // ...
})
```

**문제**: 테스트 데이터 준비 방법 불명확

**개선 제안**:
1. **방안 A**: 테스트 전용 프로젝트 생성
   - `.jjiban/projects/test-empty/wbs.md`에 빈 WP 정의
   - E2E 테스트 시 `?project=test-empty` 사용

2. **방안 B**: API Mock 사용
   ```typescript
   await page.route('/api/projects/jjiban/wbs', async route => {
     await route.fulfill({
       status: 200,
       body: JSON.stringify({
         metadata: { ... },
         tree: [
           { id: 'WP-EMPTY', type: 'wp', title: 'Empty WP', children: [] }
         ]
       })
     })
   })
   ```

**권장**: 방안 A (실제 데이터 구조 검증 가능)

---

## 4. 기존 코드 패턴 일관성 검토

### 4.1 TaskDetailPanel vs WpActDetailPanel 비교

| 패턴 | TaskDetailPanel | WpActDetailPanel (설계) | 일관성 |
|------|----------------|------------------------|-------|
| Props | 없음 (스토어 직접 참조) | `node: WbsNode` | ⚠️ 불일치 |
| 로딩 상태 | `loadingTask` ref | 없음 (이미 로드됨) | ✅ 정당화됨 |
| 에러 처리 | `error` ref + Message | 없음 (wbsStore 에러 사용) | ✅ 정당화됨 |
| 빈 상태 | `!selectedTask` → Message | `!selectedNode` → Message | ✅ 일치 |
| 컨테이너 | Card | Card | ✅ 일치 |
| JSDoc 주석 | 충실함 | 설계 문서에 없음 | ⚠️ 추가 권장 |

**일관성 검토 결과**:
- Props 방식 차이는 정당화됨 (Task는 API 호출, WP/ACT는 이미 로드됨)
- 에러 처리 차이는 정당화됨 (wbsStore 에러로 충분)
- JSDoc 주석은 추가 권장 (L-01 지적)

---

### 4.2 selectionStore 확장 패턴 검토

#### 4.2.1 기존 코드 분석

**현재 selectionStore.ts**:
```typescript
// State
const selectedNodeId = ref<string | null>(null)
const selectedTask = ref<TaskDetail | null>(null)
const loadingTask = ref(false)
const error = ref<string | null>(null)

// Getters
const selectedNodeType = computed((): WbsNodeType | null => {
  if (!selectedNodeId.value) return null
  const id = selectedNodeId.value.toUpperCase()
  if (id.startsWith('WP-')) return 'wp'
  if (id.startsWith('ACT-')) return 'act'
  if (id.startsWith('TSK-')) return 'task'
  return 'project'
})

const isTaskSelected = computed(() => selectedNodeType.value === 'task')
```

**설계된 추가 항목**:
```typescript
// 추가 Getters (상세설계 §3.1.1)
const isWpOrActSelected = computed(() => {
  const type = selectedNodeType.value
  return type === 'wp' || type === 'act'
})

const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value || isTaskSelected.value) return null
  const wbsStore = useWbsStore()
  return wbsStore.getNode(selectedNodeId.value) || null
})
```

#### 4.2.2 일관성 검토

✅ **네이밍 일관성**: `isTaskSelected` → `isWpOrActSelected` (일관됨)
✅ **타입 안전성**: `WbsNode | null` 반환 타입 명확
⚠️ **순환 의존성 위험**: `useWbsStore()` 호출 → computed 내부에서 다른 스토어 참조 (H-01 지적)

---

### 4.3 CSS 클래스 네이밍 패턴 검토

#### 4.3.1 기존 main.css 패턴

```css
/* 노드 아이콘 - BEM 스타일 유사 */
.node-icon { ... }
.node-icon-project { ... }
.node-icon-wp { ... }

/* 카테고리 태그 - BEM 스타일 유사 */
.category-tag { ... }
.category-tag-development { ... }

/* 상태 배지 - BEM 스타일 유사 */
.status-badge { ... }
.status-todo { ... }
.status-done { ... }
```

#### 4.3.2 신규 클래스 패턴 (화면설계 §4.2)

```css
/* WP/ACT Detail Panel - 컴포넌트명 */
.wp-act-detail-panel { ... }
.wp-act-detail-content { ... }
.wp-act-basic-info .field { ... }

/* Progress Segments - 기능명 */
.progress-segments { ... }
.progress-segment-track { ... }
.progress-segment-completed { ... }

/* Children List - 기능명 */
.children-list { ... }
.child-item { ... }
.child-header { ... }
```

#### 4.3.3 일관성 검토

✅ **일관성 양호**: 모두 케밥-케이스 (kebab-case)
✅ **계층 구조 명확**: `.wp-act-detail-panel` > `.wp-act-detail-content`
✅ **BEM 스타일 유사**: Block-Element 패턴 (Modifier는 상태 클래스로 분리)

**권장**: 현재 패턴 유지 ✅

---

## 5. 타입 안전성 검토

### 5.1 ProgressStats 타입 정의

**설계** (상세설계 §1.1):
```typescript
export interface ProgressStats {
  total: number
  completed: number
  inProgress: number
  todo: number
  byStatus: Record<string, number>
}
```

**검토 결과**: ✅ 완벽
- 모든 필드 명확히 정의
- `byStatus`는 동적 상태 코드 지원 (확장성 좋음)

**개선 제안** (선택적):
```typescript
export interface ProgressStats {
  total: number
  completed: number
  inProgress: number
  todo: number
  byStatus: Record<TaskStatus | string, number>  // TaskStatus 우선, 기타 허용
}
```

---

### 5.2 Props/Emits 타입 정의

#### WpActDetailPanel
```typescript
interface Props {
  node: WbsNode  // ✅ 명확
}
// Emits: 없음 ✅
```

#### WpActChildren
```typescript
interface Props {
  children: WbsNode[]  // ✅ 명확
}

const emit = defineEmits<{
  select: [nodeId: string]  // ✅ Tuple 타입 명확
}>()
```

**검토 결과**: ✅ 모든 Props/Emits 타입 안전성 완벽

---

### 5.3 타입 가드 검증

**설계** (상세설계 §7.2):
```typescript
const selectedNode = computed((): WbsNode | null => {
  if (!selectedNodeId.value) return null
  if (isTaskSelected.value) return null

  const wbsStore = useWbsStore()
  const node = wbsStore.getNode(selectedNodeId.value)
  return node || null  // undefined → null 변환
})
```

**검토 결과**: ✅ 타입 가드 완벽
- `null` 체크 명확
- `undefined` → `null` 변환 (일관성)

---

## 6. 접근성 (ARIA) 검토

### 6.1 ARIA 속성 완전성

| 컴포넌트 | ARIA 속성 | 검증 |
|---------|----------|------|
| NodeDetailPanel | `role="region"`, `aria-label="노드 상세 정보"` | ✅ |
| WpActDetailPanel | `role="region"`, `:aria-label="..."` | ✅ |
| WpActChildren | `role="list"`, `aria-label="하위 노드 목록"` | ✅ |
| child-item | `role="listitem"`, `tabindex="0"`, `:aria-label="..."` | ✅ |
| WpActProgress | `role="progressbar"`, `:aria-valuenow="..."` | ✅ |

**검토 결과**: ✅ WCAG 2.1 AA 수준 준수

---

### 6.2 키보드 네비게이션 검증

**설계** (화면설계 §6.2):
- `Tab`: 다음 노드로 포커스 이동
- `Shift+Tab`: 이전 노드로 포커스 이동
- `Enter`: 선택된 노드 활성화

**구현** (상세설계 §2.5.4):
```vue
<div
  role="listitem"
  tabindex="0"
  @click="handleChildClick(child.id)"
  @keydown.enter="handleChildClick(child.id)"
>
```

**검토 결과**: ✅ 키보드 네비게이션 완벽
- `tabindex="0"`: 자연스러운 탭 순서
- `@keydown.enter`: Enter 키 지원

**권장 추가** (선택적):
```vue
@keydown.space="handleChildClick(child.id)"  // Space 키 지원 (WCAG 권장)
```

---

## 7. 성능 고려사항 검토

### 7.1 NFR 검증 방법

| NFR | 목표 | 설계된 검증 방법 | 충분성 |
|-----|------|---------------|-------|
| NFR-001 | 노드 선택 < 100ms | `flatNodes.get(id)` O(1) | ✅ 충분 |
| NFR-002 | 카운팅 < 50ms | 재귀 탐색 O(N), Early Return | ✅ 충분 |

**검토 결과**: ✅ 성능 최적화 전략 명확

**추가 검증 권장** (M-01 지적):
- 실제 성능 테스트 코드 예시 추가
- Performance API 활용 가이드 추가

---

### 7.2 Computed 캐싱 전략

**설계** (상세설계 §9.1):
```typescript
const progressStats = computed((): ProgressStats => {
  return calculateProgressStats(props.node)
})
// props.node 변경 시에만 재계산
```

**검토 결과**: ✅ Vue Reactivity 활용 완벽
- Computed는 자동 캐싱
- 의존성 (`props.node`) 변경 시에만 재계산

---

## 8. 테스트 커버리지 검토

### 8.1 단위 테스트 충분성

| 대상 | 테스트 케이스 수 | 커버리지 목표 | 평가 |
|------|----------------|-------------|------|
| calculateProgressStats | 7개 | 100% | ✅ 충분 |
| WpActBasicInfo | 8개 | 90% | ✅ 충분 |
| WpActProgress | 4개 | 90% | ✅ 충분 |
| WpActChildren | 6개 | 95% | ✅ 충분 |
| selectionStore 확장 | 5개 | 100% | ✅ 충분 |

**총 30+ 단위 테스트** → ✅ 충분

---

### 8.2 E2E 테스트 시나리오

| 시나리오 | 커버하는 요구사항 | 평가 |
|---------|---------------|------|
| 1. WP 선택 및 정보 표시 | FR-001, FR-006 | ✅ |
| 2. 하위 노드 클릭 및 전환 | FR-002, FR-005, FR-006 | ✅ |
| 3. ACT 선택 및 정보 표시 | FR-001, FR-006 | ✅ |
| 4. 진행률 시각화 검증 | FR-003, FR-004 | ✅ |
| 5. 빈 WP/ACT 빈 상태 메시지 | FR-002 | ⚠️ 테스트 데이터 준비 필요 (R-08) |
| 6. 키보드 네비게이션 | FR-005 | ✅ |

**검토 결과**: ✅ 주요 시나리오 모두 커버 (시나리오 5 데이터 준비 필요)

---

## 9. 개선 우선순위 권장

### 9.1 구현 전 필수 조치 (Priority: High)

1. **H-01**: selectionStore 확장 시 wbsStore 데이터 로드 검증 로직 추가
   - **작업**: 2시간
   - **담당**: selectionStore 구현자
   - **검증**: 단위 테스트 + 통합 테스트

---

### 9.2 구현 중 고려 (Priority: Medium)

2. **M-01**: 성능 측정 헬퍼 함수 및 테스트 코드 추가
   - **작업**: 1시간
   - **담당**: 성능 테스트 담당자

3. **M-02**: 빈 상태 UX 개선 (사용자 안내 추가)
   - **작업**: 30분
   - **담당**: WpActChildren 구현자

4. **M-03**: 에러 메시지 상수화 (향후 i18n 준비)
   - **작업**: 1시간
   - **담당**: 전체 컴포넌트 구현자

---

### 9.3 선택적 개선 (Priority: Low)

5. **L-01**: JSDoc 주석 추가
   - **작업**: 30분
   - **담당**: 각 컴포넌트 구현자

6. **L-02**: 문서 변경 이력 섹션 추가
   - **작업**: 15분
   - **담당**: 문서 관리자

7. **R-06**: getStatusSeverity 함수 중복 제거 (utils/wbsStatus.ts 생성)
   - **작업**: 30분
   - **담당**: 유틸리티 함수 구현자

8. **R-08**: E2E 테스트 시나리오 5 데이터 준비
   - **작업**: 1시간
   - **담당**: E2E 테스트 담당자

---

## 10. 종합 의견 및 승인 권고

### 10.1 설계 품질 총평

본 설계는 다음과 같은 이유로 **구현 진행 가능** 수준으로 평가됨:

1. **요구사항 완전성** (⭐⭐⭐⭐⭐):
   - 모든 FR/NFR이 설계에 명확히 반영됨
   - 추적성 매트릭스로 요구사항 → 설계 → 구현 → 테스트 추적 완벽

2. **아키텍처 일관성** (⭐⭐⭐⭐☆):
   - TaskDetailPanel 패턴 준수
   - 단일 책임 원칙 (SRP) 준수
   - 관심사 분리 명확 (Task vs WP/ACT)

3. **타입 안전성** (⭐⭐⭐⭐⭐):
   - ProgressStats 타입 정의 완벽
   - Props/Emits 인터페이스 명확
   - 타입 가드 완벽

4. **테스트 완전성** (⭐⭐⭐⭐⭐):
   - 단위 테스트 30+ 케이스
   - E2E 테스트 6개 시나리오
   - 커버리지 목표 명확 (90%+)

5. **문서 품질** (⭐⭐⭐⭐⭐):
   - 기본설계, 화면설계, 상세설계 모두 충실
   - 추적성 매트릭스, 테스트 명세 완벽

---

### 10.2 승인 권고 (조건부)

**승인 조건**:
✅ **H-01** 지적 사항 (selectionStore 데이터 로드 검증) 해결 후 구현 시작

**선택 사항** (구현 중 고려):
- M-01 ~ M-03 (Medium 우선순위)
- L-01 ~ L-02 (Low 우선순위)
- R-06, R-08 (개선 권장 사항)

---

### 10.3 리뷰어 의견

**강점**:
- 기존 TaskDetailPanel 패턴을 잘 이해하고 일관성 있게 설계함
- TypeScript 타입 안전성, ARIA 접근성 모두 완벽
- 테스트 명세가 매우 충실하여 TDD 가능

**개선 제안**:
- selectionStore 확장 시 wbsStore와의 상호작용 검증 강화
- 성능 측정 방법 구체화
- 코드 주석 (JSDoc) 추가하여 유지보수성 향상

**종합 평가**: ⭐⭐⭐⭐☆ (4.7/5.0)
**구현 권고**: ✅ 승인 (H-01 해결 조건)

---

## 11. 리뷰 체크리스트

### 11.1 설계 검증 항목

- [x] 요구사항 완전성 검증 (FR-001 ~ FR-006, NFR-001 ~ NFR-004)
- [x] 기존 코드 패턴 일관성 검토 (TaskDetailPanel, selectionStore, wbsStore)
- [x] 타입 안전성 검증 (ProgressStats, Props/Emits, 타입 가드)
- [x] 접근성 요구사항 검토 (ARIA 속성, 키보드 네비게이션)
- [x] 성능 고려사항 검토 (NFR-001, NFR-002 검증 방법)
- [x] 테스트 커버리지 검토 (단위/통합/E2E 테스트 충분성)
- [x] CSS 클래스 중앙화 원칙 준수 확인
- [x] 에러 처리 및 엣지 케이스 검토

### 11.2 문서 품질 항목

- [x] 기본설계 문서 완전성
- [x] 화면설계 문서 완전성
- [x] 상세설계 문서 완전성
- [x] 추적성 매트릭스 완전성
- [x] 테스트 명세 완전성
- [x] 문서 간 일관성 검증

---

## 12. 다음 단계 액션 아이템

### 12.1 구현 전 조치

| 액션 아이템 | 담당 | 우선순위 | 예상 작업 | 기한 |
|-----------|------|---------|---------|------|
| H-01: selectionStore 데이터 로드 검증 로직 추가 | Backend | High | 2시간 | 구현 전 |

### 12.2 구현 중 조치

| 액션 아이템 | 담당 | 우선순위 | 예상 작업 |
|-----------|------|---------|---------|
| M-01: 성능 측정 헬퍼 함수 추가 | Frontend | Medium | 1시간 |
| M-02: 빈 상태 UX 개선 | Frontend | Medium | 30분 |
| M-03: 에러 메시지 상수화 | Frontend | Medium | 1시간 |
| R-06: getStatusSeverity 중복 제거 | Frontend | Low | 30분 |

### 12.3 구현 후 조치

| 액션 아이템 | 담당 | 우선순위 | 예상 작업 |
|-----------|------|---------|---------|
| L-01: JSDoc 주석 추가 | Frontend | Low | 30분 |
| R-08: E2E 테스트 데이터 준비 | QA | Low | 1시간 |

---

## 13. 참고 자료

### 13.1 관련 문서

- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md`
- 화면설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md`
- 상세설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md`
- 추적성 매트릭스: `.jjiban/projects/jjiban/tasks/TSK-05-05/025-traceability-matrix.md`
- 테스트 명세: `.jjiban/projects/jjiban/tasks/TSK-05-05/026-test-specification.md`

### 13.2 기존 구현 참조

- `app/components/wbs/detail/TaskDetailPanel.vue`
- `app/stores/selection.ts`
- `app/stores/wbs.ts`
- `app/types/index.ts`
- `app/assets/css/main.css`

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**다음 단계**: H-01 지적 사항 해결 후 구현 (030-implementation.md)
