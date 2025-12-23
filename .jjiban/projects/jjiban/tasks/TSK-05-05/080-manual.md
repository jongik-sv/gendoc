# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**
> * WP/ACT Detail Panel 기능 사용 가이드
> * 사용자 관점에서 기능 설명
> * 컴포넌트 구조 및 확장 가이드
> * 트러블슈팅 및 FAQ

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [xx] 완료 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (Technical Writer) |

### 관련 문서

| 문서 유형 | 경로 | 비고 |
|----------|------|------|
| 기본설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md` | 기능 개요 |
| 화면설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md` | UI 상세 |
| 상세설계 | `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md` | 기술 명세 |
| 통합테스트 | `.jjiban/projects/jjiban/tasks/TSK-05-05/070-integration-test.md` | 테스트 결과 |

---

## 1. 기능 개요

### 1.1 WP/ACT Detail Panel이란?

WBS 트리에서 **Work Package (WP)** 또는 **Activity (ACT)** 노드를 선택하면 우측 상세 패널에 해당 노드의 정보를 표시하는 기능입니다.

**주요 특징**:
- WP/ACT 기본 정보 표시 (ID, 제목, 일정, 진행률)
- 하위 노드 진행 상황 시각화 (완료/진행/대기 비율)
- 하위 노드 목록 탐색 (ACT/Task 클릭하여 이동)
- Task 상세 패널과 자동 전환

### 1.2 기존 기능과의 차이점

| 기능 | Task Detail Panel | WP/ACT Detail Panel |
|------|------------------|-------------------|
| 대상 노드 | Task | Work Package, Activity |
| 주요 정보 | 상태, 카테고리, 담당자, 문서 | 진행률, 하위 노드 집계 |
| 편집 기능 | 인라인 편집 가능 | 읽기 전용 |
| 하위 노드 | 없음 | 하위 노드 목록 표시 |
| 상태 전이 | 워크플로우 버튼 제공 | 없음 (집계값만) |

---

## 2. 사용자 가이드

### 2.1 WP/ACT 노드 선택하기

#### Step 1: WBS 트리에서 WP 또는 ACT 노드 클릭

1. 좌측 **WBS Tree Panel**에서 원하는 WP 또는 ACT 노드를 찾습니다.
2. 노드를 클릭하면 우측 Detail Panel이 자동으로 업데이트됩니다.

**WP 노드 식별 방법**:
- 아이콘: 🔷 (파란색 다이아몬드)
- ID 패턴: `WP-01`, `WP-02` (2단계 번호)

**ACT 노드 식별 방법**:
- 아이콘: 🔶 (주황색 다이아몬드)
- ID 패턴: `ACT-01-01`, `ACT-02-02` (3단계 번호)

#### Step 2: WP/ACT Detail Panel 확인

우측 패널에 다음 3개 섹션이 표시됩니다:
1. **기본 정보** (WpActBasicInfo)
2. **진행 상황** (WpActProgress)
3. **하위 노드** (WpActChildren)

---

### 2.2 기본 정보 확인하기

**표시 항목**:
- **노드 ID**: Badge 형식으로 표시 (예: `WP-01`)
- **제목**: WP/ACT의 제목
- **일정**: 시작일 ~ 종료일
- **전체 진행률**: ProgressBar로 시각화 (0% ~ 100%)

**진행률 색상 의미**:
- 🟢 **초록색** (80% 이상): 순조롭게 진행 중
- 🟠 **주황색** (40% ~ 79%): 보통 진행 중
- 🔴 **빨간색** (40% 미만): 지연 위험

**예시**:
```
┌─────────────────────────────────────────┐
│ 기본 정보                                │
├─────────────────────────────────────────┤
│ 🔷 WP-01                                │
│ Platform Infrastructure                 │
│                                         │
│ 📅 일정                                 │
│    2025-12-13 ~ 2025-12-20             │
│                                         │
│ 📊 전체 진행률                          │
│    ████████████████████ 100%           │
└─────────────────────────────────────────┘
```

---

### 2.3 진행 상황 확인하기

**표시 항목**:
- **전체 Task 수**: 하위 Task 총 개수
- **완료/진행/대기 통계**: 각 상태별 Task 수와 비율
- **다단계 ProgressBar**: 완료/진행/대기 비율 시각화
- **상태별 분포**: 각 상태별 Task 카운트 Badge

**다단계 ProgressBar 의미**:
- 🟢 **초록색 영역**: 완료된 Task (status: `[xx]`)
- 🟠 **주황색 영역**: 진행 중인 Task (status: `[bd]`, `[dd]`, `[im]`, `[vf]`)
- ⚪ **회색 영역**: 대기 중인 Task (status: `[ ]`)

**상태별 Badge 색상**:
- `[ ]` Todo: 회색 (secondary)
- `[bd]` Basic Design: 파란색 (info)
- `[dd]` Detail Design: 파란색 (info)
- `[im]` Implement: 주황색 (warning)
- `[vf]` Verify: 초록색 (success)
- `[xx]` Done: 초록색 (success)

**예시**:
```
┌─────────────────────────────────────────┐
│ 진행 상황                                │
├─────────────────────────────────────────┤
│ 전체 Task: 10개                          │
│                                         │
│ 완료: 5개 (50%) | 진행: 3개 (30%) | 대기: 2개 (20%) │
│                                         │
│ ████████████░░░░░░░░                   │
│   완료 50%   진행 30%   대기 20%        │
│                                         │
│ ─── 상태별 분포 ───                     │
│ [ ] Todo: 2        [bd] Design: 1       │
│ [dd] Detail: 1     [im] Implement: 1    │
│ [vf] Verify: 0     [xx] Done: 5         │
└─────────────────────────────────────────┘
```

---

### 2.4 하위 노드 탐색하기

**표시 항목**:
- **하위 노드 목록**: WP의 ACT/Task, ACT의 Task
- **노드별 정보**: 아이콘, ID, 제목, 상태 (Task만)
- **진행률 정보**: WP/ACT의 경우 진행률 및 Task 수 표시

#### Step 1: 하위 노드 목록에서 원하는 노드 찾기

하위 노드 목록은 다음 정보를 표시합니다:
- **아이콘**: 노드 타입별 아이콘 (🔶 ACT, 🔸 Task)
- **ID와 제목**: `ACT-01-01: Project Setup`
- **상태 Badge**: Task의 경우 현재 상태 표시 (`[xx]`, `[vf]` 등)
- **진행률 정보**: ACT의 경우 진행률과 하위 Task 수 표시

#### Step 2: 노드 클릭하여 이동

하위 노드를 클릭하면:
- **ACT 클릭**: WP/ACT Detail Panel이 ACT 정보로 업데이트
- **Task 클릭**: Task Detail Panel로 자동 전환

**예시**:
```
┌─────────────────────────────────────────┐
│ 하위 노드 (10)                           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔶 ACT-01-01: Project Setup        │ │
│ │    진행률: 100% | Task: 5개         │ │
│ │    [xx] Done                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔸 TSK-01-03: Integration          │ │
│ │    [vf] Verify                      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 2.5 키보드 네비게이션 사용하기

하위 노드 목록은 키보드로도 탐색할 수 있습니다.

**지원 키**:
- `Tab`: 다음 하위 노드로 포커스 이동
- `Shift + Tab`: 이전 하위 노드로 포커스 이동
- `Enter`: 포커스된 노드 선택 (클릭과 동일)

**사용 예시**:
1. WP/ACT 선택 후 하위 노드 목록으로 `Tab` 키를 눌러 포커스 이동
2. 원하는 노드에 포커스가 오면 `Enter` 키로 선택
3. `Shift + Tab`으로 이전 노드로 되돌아갈 수 있음

---

### 2.6 빈 WP/ACT 처리

하위 노드가 없는 WP/ACT를 선택하면:
- "하위 노드가 없습니다" 메시지 표시
- wbs.md 파일에 하위 노드를 추가하라는 안내 표시

**빈 상태 화면**:
```
┌─────────────────────────────────────────┐
│ 하위 노드 (0)                            │
├─────────────────────────────────────────┤
│                                         │
│        📭                               │
│                                         │
│   하위 노드가 없습니다                   │
│   wbs.md 파일에 하위 노드를 추가해주세요 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. 컴포넌트 구조 설명

### 3.1 전체 아키텍처

```
wbs.vue (WBS 페이지)
└── NodeDetailPanel (분기 컨테이너)
    ├── TaskDetailPanel (Task 선택 시) ← 기존 유지
    └── WpActDetailPanel (WP/ACT 선택 시) ← 신규
        ├── WpActBasicInfo (기본 정보)
        ├── WpActProgress (진행률 시각화)
        └── WpActChildren (하위 노드 목록)
```

### 3.2 주요 컴포넌트 역할

#### NodeDetailPanel (분기 컨테이너)
- **위치**: `app/components/wbs/detail/NodeDetailPanel.vue`
- **역할**: 선택된 노드 타입에 따라 Task/WP/ACT 패널 분기
- **데이터 소스**: `selectionStore` (선택 상태 관리)

#### WpActDetailPanel (컨테이너)
- **위치**: `app/components/wbs/detail/WpActDetailPanel.vue`
- **역할**: WP/ACT 정보 표시 및 하위 컴포넌트 조정
- **데이터 소스**: `props.node` (WbsNode 객체)

#### WpActBasicInfo (기본 정보)
- **위치**: `app/components/wbs/detail/WpActBasicInfo.vue`
- **역할**: ID, 제목, 일정, 진행률 표시
- **특징**: 읽기 전용 (편집 없음)

#### WpActProgress (진행률 시각화)
- **위치**: `app/components/wbs/detail/WpActProgress.vue`
- **역할**: 하위 Task 통계 및 진행률 시각화
- **계산**: `calculateProgressStats()` 함수 사용

#### WpActChildren (하위 노드 목록)
- **위치**: `app/components/wbs/detail/WpActChildren.vue`
- **역할**: 하위 노드 목록 렌더링 및 선택 이벤트 처리
- **인터랙션**: 노드 클릭 시 `selectionStore` 업데이트

---

### 3.3 데이터 흐름

```
1. 사용자가 WP/ACT 노드 클릭
   └─> WbsTreeNode.handleSelectNode()

2. selectionStore.selectNode(nodeId) 호출
   ├─> selectedNodeId 업데이트
   ├─> selectedNodeType 계산 ('wp' 또는 'act')
   └─> selectedNode 계산 (wbsStore에서 노드 조회)

3. NodeDetailPanel 반응형 업데이트
   └─> isWpOrActSelected === true
       └─> WpActDetailPanel 렌더링

4. WpActDetailPanel이 하위 컴포넌트에 데이터 전달
   ├─> WpActBasicInfo: node 속성 (ID, 제목, 일정, 진행률)
   ├─> WpActProgress: progressStats (계산된 통계)
   └─> WpActChildren: node.children (하위 노드 배열)

5. 사용자가 하위 노드 클릭
   └─> WpActChildren.emit('select', childId)
       └─> WpActDetailPanel.handleNodeSelect(childId)
           └─> selectionStore.selectNode(childId)
               └─> 2번으로 돌아가서 반복
```

---

## 4. 확장/커스터마이징 가이드

### 4.1 진행률 계산 로직 수정

**파일**: `app/utils/wbsProgress.ts`

**함수**: `calculateProgressStats(node: WbsNode): ProgressStats`

**수정 예시**: 특정 상태를 '진행 중'이 아닌 '대기'로 분류하고 싶은 경우

```typescript
// 기존 로직
if (status === '[xx]') {
  completed++
} else if (status === '[ ]') {
  todo++
} else {
  inProgress++  // [bd], [dd], [im], [vf] 모두 진행 중
}

// 수정 예시: [bd]를 대기로 분류
if (status === '[xx]') {
  completed++
} else if (status === '[ ]' || status === '[bd]') {
  todo++  // [bd]도 대기로 분류
} else {
  inProgress++  // [dd], [im], [vf]만 진행 중
}
```

---

### 4.2 상태별 Badge 색상 변경

**파일**: `app/utils/wbsProgress.ts`

**함수**: `getStatusSeverity(status: string): string`

**수정 예시**: `[im]` 상태를 주황색이 아닌 파란색으로 표시

```typescript
// 기존 매핑
const severityMap: Record<string, string> = {
  '[ ]': 'secondary',
  '[bd]': 'info',
  '[dd]': 'info',
  '[im]': 'warning',  // 주황색
  '[vf]': 'success',
  '[xx]': 'success',
}

// 수정 예시
const severityMap: Record<string, string> = {
  '[ ]': 'secondary',
  '[bd]': 'info',
  '[dd]': 'info',
  '[im]': 'info',  // 파란색으로 변경
  '[vf]': 'success',
  '[xx]': 'success',
}
```

---

### 4.3 하위 노드 필터링/정렬 추가

**파일**: `app/components/wbs/detail/WpActChildren.vue`

**추가 기능**: 상태별 필터링, 우선순위별 정렬

**구현 예시**:

```vue
<script setup lang="ts">
// Props에 filter, sortBy 추가
interface Props {
  children: WbsNode[]
  filterStatus?: string    // 예: '[xx]'
  sortBy?: 'id' | 'title' | 'progress'
}

const props = defineProps<Props>()

// Computed로 필터링/정렬된 children 반환
const filteredChildren = computed(() => {
  let result = [...props.children]

  // 필터링
  if (props.filterStatus) {
    result = result.filter(child => child.status === props.filterStatus)
  }

  // 정렬
  if (props.sortBy === 'progress') {
    result.sort((a, b) => (b.progress || 0) - (a.progress || 0))
  }

  return result
})
</script>

<template>
  <!-- 필터/정렬 컨트롤 추가 -->
  <div class="filters mb-4 flex gap-2">
    <Dropdown
      v-model="filterStatus"
      :options="statusOptions"
      placeholder="상태 필터"
    />
    <Dropdown
      v-model="sortBy"
      :options="sortOptions"
      placeholder="정렬"
    />
  </div>

  <!-- filteredChildren 사용 -->
  <div v-for="child in filteredChildren" :key="child.id">
    ...
  </div>
</template>
```

---

### 4.4 CSS 스타일 커스터마이징

**파일**: `app/assets/css/main.css`

**커스터마이징 예시**: 하위 노드 아이템 호버 효과 변경

```css
/* 기존 스타일 */
.child-item:hover {
  @apply border-border-light bg-slate-700/50 shadow-md;
}

/* 커스터마이징: 더 강한 호버 효과 */
.child-item:hover {
  @apply border-primary bg-primary/10 shadow-lg scale-105;
  transition: all 0.2s ease;
}
```

**진행률 ProgressBar 색상 변경**:

```css
/* 기존 색상 */
.progress-bar-high {
  @apply bg-success;  /* 초록색 */
}

.progress-bar-medium {
  @apply bg-warning;  /* 주황색 */
}

.progress-bar-low {
  @apply bg-danger;   /* 빨간색 */
}

/* 커스터마이징: 파란색 계열로 변경 */
.progress-bar-high {
  @apply bg-blue-500;
}

.progress-bar-medium {
  @apply bg-blue-300;
}

.progress-bar-low {
  @apply bg-blue-200;
}
```

---

## 5. 트러블슈팅

### 5.1 WP/ACT 선택 시 빈 패널이 표시됨

**증상**: WP/ACT 노드를 클릭했지만 우측 패널에 "왼쪽에서 노드를 선택하세요" 메시지만 표시됨

**원인**:
1. `wbsStore.flatNodes`가 초기화되지 않음
2. 선택한 노드 ID가 `flatNodes`에 없음

**해결 방법**:
1. 브라우저 개발자 도구 콘솔에서 에러 메시지 확인
2. `[selectionStore] WBS data not loaded yet` 경고가 있으면 WBS 데이터 로딩 대기
3. `[selectionStore] Node not found: {nodeId}` 경고가 있으면 wbs.md 파일에서 해당 노드 ID 확인

---

### 5.2 진행률 통계가 0으로 표시됨

**증상**: 진행 상황 섹션에서 "전체 Task: 0개"로 표시됨

**원인**:
1. 선택한 WP/ACT에 하위 Task가 없음
2. 하위 노드가 모두 WP/ACT이고 Task가 없음

**해결 방법**:
1. wbs.md 파일에서 해당 WP/ACT 하위 구조 확인
2. Task 노드가 있는지 확인 (####로 시작하는 Task)
3. Task가 없으면 정상 동작 (빈 상태 메시지 표시)

---

### 5.3 하위 노드 클릭 시 패널이 업데이트되지 않음

**증상**: 하위 노드를 클릭해도 패널이 업데이트되지 않음

**원인**:
1. `WpActChildren` 컴포넌트의 `select` 이벤트가 emit되지 않음
2. `handleNodeSelect` 메서드가 호출되지 않음

**해결 방법**:
1. 브라우저 개발자 도구에서 Vue DevTools 확인
2. WpActChildren 컴포넌트의 이벤트 emit 확인
3. selectionStore의 `selectNode` 메서드 호출 여부 확인

---

### 5.4 키보드 네비게이션이 작동하지 않음

**증상**: `Tab` 키로 하위 노드 간 이동이 안 됨

**원인**:
1. `tabindex="0"`이 설정되지 않음
2. 포커스 스타일이 적용되지 않음

**해결 방법**:
1. WpActChildren 컴포넌트의 `.child-item` 요소에 `tabindex="0"` 확인
2. CSS에서 `.child-item:focus` 스타일 확인
3. 브라우저 개발자 도구에서 포커스된 요소 확인

---

### 5.5 ProgressBar 색상이 표시되지 않음

**증상**: 진행률 ProgressBar가 회색으로만 표시됨

**원인**:
1. `progressBarClass` computed가 올바른 클래스를 반환하지 않음
2. CSS 클래스가 정의되지 않음

**해결 방법**:
1. WpActBasicInfo 컴포넌트의 `progressBarClass` computed 로직 확인
2. `main.css`에서 `.progress-bar-high`, `.progress-bar-medium`, `.progress-bar-low` 클래스 정의 확인
3. 진행률 값 (0 ~ 100) 확인

---

## 6. FAQ

### Q1. WP/ACT를 편집할 수 있나요?

**A**: 현재 버전에서는 WP/ACT Detail Panel은 **읽기 전용**입니다. WP/ACT의 제목, 일정, 진행률은 wbs.md 파일을 직접 수정하거나, Task 완료 시 자동으로 계산됩니다.

향후 버전에서 인라인 편집 기능이 추가될 예정입니다.

---

### Q2. 진행률은 어떻게 계산되나요?

**A**: 진행률은 하위 Task의 상태를 기반으로 자동 계산됩니다.

**계산 공식**:
```
진행률 (%) = (완료된 Task 수 / 전체 Task 수) × 100
```

**완료 기준**: Task 상태가 `[xx]` (Done)인 경우만 완료로 인정

**예시**:
- 전체 Task: 10개
- 완료 Task: 7개 (`[xx]`)
- 진행률: 70%

---

### Q3. 하위 노드 목록의 순서를 변경할 수 있나요?

**A**: 하위 노드 목록은 wbs.md 파일의 순서대로 표시됩니다. 순서를 변경하려면:

1. wbs.md 파일을 에디터로 열기
2. 해당 WP/ACT 섹션에서 하위 노드 순서 변경
3. 파일 저장 후 WBS 패널 새로고침

향후 버전에서 드래그 앤 드롭 정렬 기능이 추가될 예정입니다.

---

### Q4. 특정 상태의 하위 노드만 보고 싶어요

**A**: 현재 버전에서는 필터링 기능이 없습니다. 모든 하위 노드가 표시됩니다.

필터링 기능을 추가하려면 섹션 4.3 (하위 노드 필터링/정렬 추가)을 참조하여 커스터마이징할 수 있습니다.

---

### Q5. 빈 WP/ACT를 삭제하고 싶어요

**A**: WP/ACT 노드를 삭제하려면:

1. wbs.md 파일을 에디터로 열기
2. 해당 WP/ACT 섹션 전체 삭제 (## 또는 ### 헤딩 포함)
3. 파일 저장 후 WBS 패널 새로고침

**주의**: 하위 노드가 있는 경우 모두 함께 삭제되므로 주의하세요.

---

### Q6. 상태별 Badge 색상의 의미는 무엇인가요?

**A**: 상태별 Badge 색상은 다음과 같습니다:

| 상태 | 색상 | 의미 |
|------|------|------|
| `[ ]` | 회색 (secondary) | 대기 중 (아직 시작하지 않음) |
| `[bd]` | 파란색 (info) | 설계 단계 (기본설계) |
| `[dd]` | 파란색 (info) | 설계 단계 (상세설계) |
| `[im]` | 주황색 (warning) | 구현 단계 (개발 중) |
| `[vf]` | 초록색 (success) | 검증 단계 (테스트 중) |
| `[xx]` | 초록색 (success) | 완료 (Done) |

색상 변경은 섹션 4.2 (상태별 Badge 색상 변경)을 참조하세요.

---

### Q7. 하위 노드가 100개 이상인데 성능이 느려요

**A**: 현재 버전에서는 모든 하위 노드를 한 번에 렌더링합니다. 성능 개선 방법:

1. **가상 스크롤링 적용** (향후 버전):
   - PrimeVue VirtualScroller 컴포넌트 사용
   - 화면에 보이는 노드만 렌더링하여 성능 향상

2. **페이지네이션 추가** (커스터마이징):
   - 하위 노드를 10개씩 페이지로 나누어 표시
   - PrimeVue Paginator 컴포넌트 활용

3. **필터링으로 노드 수 줄이기**:
   - 섹션 4.3 참조하여 상태별 필터링 추가

---

## 7. 관련 리소스

### 7.1 내부 문서

- **기본설계**: 기능 개요 및 아키텍처 설명
- **화면설계**: UI 상세 및 PrimeVue 컴포넌트 활용
- **상세설계**: TypeScript 타입 및 메서드 명세
- **테스트 명세**: 단위/E2E 테스트 시나리오
- **통합테스트**: 테스트 실행 결과 및 성능 검증

### 7.2 외부 리소스

- **PrimeVue 4.x Documentation**: https://primevue.org/
- **Vue 3 Composition API**: https://vuejs.org/guide/introduction.html
- **Tailwind CSS**: https://tailwindcss.com/docs

### 7.3 주요 파일 위치

**컴포넌트**:
- `app/components/wbs/detail/NodeDetailPanel.vue`
- `app/components/wbs/detail/WpActDetailPanel.vue`
- `app/components/wbs/detail/WpActBasicInfo.vue`
- `app/components/wbs/detail/WpActProgress.vue`
- `app/components/wbs/detail/WpActChildren.vue`

**유틸리티**:
- `app/utils/wbsProgress.ts` (진행률 계산 로직)

**스토어**:
- `app/stores/selection.ts` (노드 선택 상태 관리)
- `app/stores/wbs.ts` (WBS 데이터 관리)

**스타일**:
- `app/assets/css/main.css` (WP/ACT 패널 전용 스타일)

**테스트**:
- `tests/e2e/wp-act-detail.spec.ts` (E2E 테스트)
- `tests/unit/utils/wbsProgress.test.ts` (단위 테스트)

---

## 8. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-12-16 | 초기 작성 (TSK-05-05 완료) |

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**작성자**: Claude (Technical Writer)
**상태**: [xx] 완료
