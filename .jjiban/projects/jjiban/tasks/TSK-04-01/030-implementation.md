# 구현 문서 (030-implementation.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [im] 구현 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Frontend Architect) |

---

## 1. 구현 개요

TSK-04-01 Tree Panel의 4개 Vue 컴포넌트와 Pinia 스토어 확장을 완료했습니다.

### 1.1 구현된 컴포넌트

| 컴포넌트 | 파일 | 라인 수 | 설명 |
|---------|------|--------|------|
| WbsTreePanel | `app/components/wbs/WbsTreePanel.vue` | 120 | 컨테이너 - 데이터 로드 및 상태 관리 |
| WbsTreeHeader | `app/components/wbs/WbsTreeHeader.vue` | 80 | 헤더 - 타이틀, 버튼, 검색, 카드 통합 |
| WbsSummaryCards | `app/components/wbs/WbsSummaryCards.vue` | 91 | 통계 카드 - WP/ACT/TSK/Progress |
| WbsSearchBox | `app/components/wbs/WbsSearchBox.vue` | 106 | 검색 입력 - debounce, ESC 지원 |

### 1.2 Pinia 스토어 확장

**파일**: `app/stores/wbs.ts`

**추가된 State**:
- `searchQuery: ref<string>('')`

**추가된 Getters**:
- `filteredTree: computed<WbsNode[]>()` - 검색어 필터링된 트리

**추가된 Actions**:
- `setSearchQuery(query: string)` - 검색어 설정

**추가된 Helper Functions**:
- `filterTreeNodes(nodes: WbsNode[], query: string): WbsNode[]` - 재귀적 트리 필터링

---

## 2. 기술 구현 상세

### 2.1 WbsTreePanel.vue

**주요 기능**:
- Route에서 projectId 추출 (`route.query.projectId`)
- onMounted 시 `fetchWbs()` 호출
- onUnmounted 시 `clearWbs()` 호출
- 로딩/에러/정상 상태 조건부 렌더링

**핵심 코드**:
```typescript
const projectId = computed(() => route.query.projectId as string)
const { loading, error, tree } = storeToRefs(wbsStore)

onMounted(async () => {
  if (!projectId.value) {
    console.error('Project ID is required')
    return
  }
  try {
    await wbsStore.fetchWbs(projectId.value)
  } catch (e) {
    console.error('Failed to load WBS:', e)
  }
})
```

**PrimeVue 컴포넌트**:
- ProgressSpinner (로딩)
- Message (에러)

**접근성**:
- `role="region"`
- `aria-label="WBS Tree Panel"`
- `aria-busy` (로딩 상태)

---

### 2.2 WbsTreeHeader.vue

**주요 기능**:
- 타이틀 표시 (sitemap 아이콘 + "WBS 트리")
- 전체 펼치기/접기 버튼
- WbsSearchBox, WbsSummaryCards 통합

**핵심 코드**:
```typescript
const handleExpandAll = () => {
  wbsStore.expandAll()
}

const handleCollapseAll = () => {
  wbsStore.collapseAll()
}
```

**스타일링**:
- 배경: `bg-[#16213e]`
- 하단 보더: `border-b border-[#3d3d5c]`
- 타이틀 아이콘: `text-purple-500`

**레이아웃**:
- Flexbox 수평 정렬 (타이틀 + 버튼)
- 수직 스택 (타이틀 → 검색 → 카드)

---

### 2.3 WbsSummaryCards.vue

**주요 기능**:
- 4개 통계 카드 표시
- 스토어 데이터와 실시간 동기화

**카드 구성**:
| 카드 | 색상 | 데이터 소스 | ARIA 레이블 |
|------|------|-----------|------------|
| WP | blue-500 | wpCount | "Work Package count: N" |
| ACT | green-500 | actCount | "Activity count: N" |
| TSK | orange-500 | tskCount | "Task count: N" |
| Progress | purple-500 | overallProgress | "Overall progress: N%" |

**핵심 코드**:
```typescript
const { wpCount, actCount, tskCount, overallProgress } = storeToRefs(wbsStore)

const cards = computed<CardData[]>(() => [
  {
    label: 'WP',
    value: wpCount,
    colorClass: 'text-blue-500',
    ariaLabel: computed(() => `Work Package count: ${wpCount.value}`),
    testId: 'wp-card'
  },
  // ... 나머지 카드
])
```

**레이아웃**:
- Grid: `grid-cols-4 gap-3`
- 카드 배경: `bg-[#1e1e38]`
- 카드 테두리: `border-[#3d3d5c]`

---

### 2.4 WbsSearchBox.vue

**주요 기능**:
- 검색어 입력 (300ms debounce)
- X 버튼으로 초기화
- ESC 키로 초기화

**핵심 코드**:
```typescript
const searchQuery = ref('')

const debouncedSearch = useDebounceFn((query: string) => {
  wbsStore.setSearchQuery(query)
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

const clearSearch = () => {
  searchQuery.value = ''
  wbsStore.setSearchQuery('')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    clearSearch()
  }
}
```

**PrimeVue 컴포넌트**:
- IconField (좌측 아이콘 컨테이너)
- InputIcon (검색 아이콘)
- InputText (입력 필드)
- Button (X 버튼)

**스타일링**:
- 기본: `bg-[#1e1e38] border-[#3d3d5c]`
- 포커스: `border-blue-500 ring-1 ring-blue-500`
- 전환: `transition-colors duration-200`

**접근성**:
- `role="searchbox"`
- `aria-label="Search WBS tree by Task ID or title"`
- `aria-describedby="search-hint"`
- 스크린 리더 힌트: `.sr-only`

---

## 3. 의존성

### 3.1 새로 추가된 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @vueuse/core | ^11.x | useDebounceFn 유틸리티 |

**설치 명령**:
```bash
npm install @vueuse/core
```

### 3.2 사용된 PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Import 위치 |
|---------|------|-----------|
| ProgressSpinner | 로딩 상태 | WbsTreePanel |
| Message | 에러 메시지 | WbsTreePanel |
| Button | 액션 버튼 | WbsTreeHeader, WbsSearchBox |
| Card | 통계 카드 | WbsSummaryCards |
| InputText | 검색 입력 | WbsSearchBox |
| IconField | 아이콘 필드 | WbsSearchBox |
| InputIcon | 아이콘 컨테이너 | WbsSearchBox |

---

## 4. 페이지 통합

### 4.1 wbs.vue 페이지 수정

**파일**: `app/pages/wbs.vue`

**변경 사항**:
```vue
<!-- Before -->
<template #left>
  <div class="p-4">
    <div class="card">
      <h3>WBS Tree</h3>
      <p>(WP-04에서 구현 예정)</p>
    </div>
  </div>
</template>

<!-- After -->
<template #left>
  <WbsTreePanel />
</template>
```

**효과**:
- WBS 페이지 좌측 패널에 WbsTreePanel 컴포넌트 표시
- 자동 import (Nuxt auto-import)

---

## 5. 테스트 가능한 요소

### 5.1 data-testid 속성

| 컴포넌트 | data-testid | 설명 |
|---------|-------------|------|
| WbsTreePanel | wbs-tree-panel | 패널 컨테이너 |
| WbsTreePanel | loading-state | 로딩 상태 |
| WbsTreePanel | error-state | 에러 상태 |
| WbsTreePanel | content-state | 정상 상태 |
| WbsTreePanel | empty-state | 빈 상태 |
| WbsTreeHeader | wbs-tree-header | 헤더 컨테이너 |
| WbsTreeHeader | expand-all-button | 전체 펼치기 버튼 |
| WbsTreeHeader | collapse-all-button | 전체 접기 버튼 |
| WbsSummaryCards | wbs-summary-cards | 카드 그리드 |
| WbsSummaryCards | wp-card | WP 카드 |
| WbsSummaryCards | act-card | ACT 카드 |
| WbsSummaryCards | tsk-card | TSK 카드 |
| WbsSummaryCards | progress-card | Progress 카드 |
| WbsSearchBox | wbs-search-box | 검색 박스 컨테이너 |
| WbsSearchBox | search-input | 검색 입력 필드 |
| WbsSearchBox | clear-search-button | 초기화 버튼 |

### 5.2 단위 테스트 시나리오 (향후)

**WbsTreePanel**:
- [ ] projectId 없을 때 콘솔 에러
- [ ] 로딩 중 ProgressSpinner 표시
- [ ] 에러 발생 시 Message 표시
- [ ] 정상 로드 시 WbsTreeHeader 렌더링
- [ ] 빈 데이터 시 empty-state 표시
- [ ] 언마운트 시 clearWbs() 호출

**WbsTreeHeader**:
- [ ] 타이틀 및 아이콘 표시
- [ ] 전체 펼치기 버튼 클릭 시 expandAll() 호출
- [ ] 전체 접기 버튼 클릭 시 collapseAll() 호출
- [ ] WbsSearchBox, WbsSummaryCards 렌더링

**WbsSummaryCards**:
- [ ] 4개 카드 렌더링
- [ ] 각 카드 색상 검증
- [ ] wpCount, actCount, tskCount, overallProgress 값 반영
- [ ] ARIA 레이블 동적 업데이트

**WbsSearchBox**:
- [ ] 검색어 입력 시 300ms debounce
- [ ] X 버튼 클릭 시 검색어 초기화
- [ ] ESC 키 입력 시 검색어 초기화
- [ ] 검색어 없을 때 X 버튼 미표시
- [ ] 포커스 시 파란 테두리 표시

---

## 6. 알려진 제약사항

### 6.1 구현되지 않은 부분

1. **WbsTreeNode 컴포넌트**: TSK-04-02에서 구현 예정
   - 현재는 placeholder 메시지 표시
   - 트리 노드 렌더링 기능 미구현

2. **반응형 레이아웃**: 향후 구현
   - 현재: Desktop (1200px) 고정
   - 향후: Tablet, Mobile 대응

3. **테스트 코드**: 별도 작업 필요
   - 단위 테스트 (Vitest)
   - E2E 테스트 (Playwright)

### 6.2 기술적 제약

- **검색 필터링**: 클라이언트 사이드 (< 1000 노드 권장)
- **Debounce 시간**: 300ms 고정 (설정 불가)
- **검색어 길이**: < 100자 권장

---

## 7. 파일 목록

### 7.1 생성된 파일

```
app/components/wbs/
├── WbsTreePanel.vue        (120 lines)
├── WbsTreeHeader.vue       (80 lines)
├── WbsSummaryCards.vue     (91 lines)
└── WbsSearchBox.vue        (106 lines)
```

### 7.2 수정된 파일

```
app/stores/wbs.ts           (+60 lines)
app/pages/wbs.vue           (-10 +2 lines)
package.json                (+1 dependency)
```

---

## 8. 빌드 및 실행 방법

### 8.1 개발 서버 실행

```bash
cd C:\project\jjiban
npm install
npm run dev
```

### 8.2 접근 URL

```
http://localhost:3000/wbs?projectId=jjiban
```

**필수 Query Parameter**:
- `projectId`: 프로젝트 ID (예: "jjiban")

### 8.3 타입 체크

```bash
npm run typecheck
```

**참고**: 기존 타입 에러는 프로젝트 내 다른 파일의 문제로, 이번 구현과 무관

---

## 9. 다음 단계

### 9.1 TSK-04-02: WbsTreeNode 구현

**필수 기능**:
- 트리 노드 재귀 렌더링
- 확장/축소 인터랙션
- 노드 타입별 아이콘 및 색상
- 선택 상태 관리

**통합 포인트**:
```vue
<!-- WbsTreePanel.vue 내부 -->
<WbsTreeNode
  v-for="node in filteredTree"
  :key="node.id"
  :node="node"
/>
```

### 9.2 테스트 작성

**단위 테스트**:
- `tests/unit/components/wbs/WbsTreePanel.spec.ts`
- `tests/unit/components/wbs/WbsTreeHeader.spec.ts`
- `tests/unit/components/wbs/WbsSummaryCards.spec.ts`
- `tests/unit/components/wbs/WbsSearchBox.spec.ts`

**E2E 테스트**:
- `tests/e2e/wbs-tree-panel.spec.ts`

### 9.3 접근성 검증

- [ ] axe-core 자동 테스트
- [ ] 스크린 리더 수동 테스트
- [ ] 키보드 네비게이션 검증
- [ ] 색상 대비 재확인

---

## 10. 체크리스트

### 10.1 구현 완료 항목

- [x] WbsTreePanel.vue 컴포넌트 생성
- [x] WbsTreeHeader.vue 컴포넌트 생성
- [x] WbsSummaryCards.vue 컴포넌트 생성
- [x] WbsSearchBox.vue 컴포넌트 생성
- [x] Pinia 스토어 searchQuery state 추가
- [x] Pinia 스토어 filteredTree getter 추가
- [x] Pinia 스토어 setSearchQuery action 추가
- [x] filterTreeNodes 헬퍼 함수 구현
- [x] @vueuse/core 의존성 설치
- [x] wbs.vue 페이지 통합
- [x] data-testid 속성 추가
- [x] ARIA 속성 추가
- [x] PrimeVue 컴포넌트 사용
- [x] Dark Blue 테마 적용

### 10.2 미완료 항목 (향후)

- [ ] WbsTreeNode 컴포넌트 구현 (TSK-04-02)
- [ ] 단위 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 접근성 자동 테스트
- [ ] 반응형 레이아웃 구현
- [ ] 성능 최적화 (필요 시)

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- 상세설계: `020-detail-design.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-01)
- Pinia 스토어: `app/stores/wbs.ts`

---

<!--
author: Claude (Frontend Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
