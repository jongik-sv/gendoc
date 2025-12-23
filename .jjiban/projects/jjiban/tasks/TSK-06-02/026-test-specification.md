# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **문서 목적**
> * 모든 테스트 케이스의 상세 명세
> * Given-When-Then 형식으로 테스트 시나리오 기술
> * 예상 결과 및 검증 기준 명시

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Testing |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 섹션 5 (테스트 범위 상세) |
| 상세설계 | `020-detail-design.md` | 섹션 4-6 (테스트 설계) |
| 추적성 매트릭스 | `025-traceability-matrix.md` | 섹션 2-4 (요구사항 매핑) |

---

## 1. 테스트 명세 개요

### 1.1 테스트 케이스 구조

모든 테스트 케이스는 **Given-When-Then** 패턴을 따릅니다:

- **Given (준비)**: 초기 상태 및 전제 조건
- **When (실행)**: 테스트 대상 동작
- **Then (검증)**: 예상 결과 및 검증 기준

### 1.2 테스트 데이터

- **Fixtures**: `tests/fixtures/` 디렉토리의 정적 파일
- **Mock Data**: `tests/fixtures/mock-data/` 디렉토리의 TypeScript 객체
- **Dynamic Data**: 테스트 내에서 생성되는 임시 데이터

### 1.3 테스트 ID 체계

| 접두사 | 테스트 유형 | 예시 |
|-------|-----------|------|
| **TC-XXX** | 단위 테스트 | TC-001-001 |
| **UT-XXX** | 컴포넌트/스토어 테스트 | UT-006 |
| **E2E-XXX** | E2E 테스트 | E2E-001 |

---

## 2. 컴포넌트 테스트 명세

### 2.1 WbsTreePanel 컴포넌트

#### TC-200: 초기 마운트 시 fetchWbs 호출

**요구사항**: FR-005
**우선순위**: Critical
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- Mock Pinia 스토어가 초기화됨
- WbsTreePanel 컴포넌트에 `projectId="test-project"` props 전달

**When**:
- 컴포넌트가 마운트됨
- onMounted 훅 실행

**Then**:
- `useWbsStore().fetchWbs('test-project')`가 1회 호출됨
- 호출 인자가 정확히 'test-project'임

**검증 코드**:
```typescript
const store = useWbsStore();
const fetchSpy = vi.spyOn(store, 'fetchWbs');
await flushPromises();
expect(fetchSpy).toHaveBeenCalledWith('test-project');
expect(fetchSpy).toHaveBeenCalledTimes(1);
```

---

#### TC-201: 로딩 상태 표시

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트
- `store.loading = true` 설정

**When**:
- 컴포넌트 렌더링

**Then**:
- `[data-testid="wbs-loading"]` 요소가 표시됨
- 스피너 아이콘 또는 로딩 텍스트 포함

**검증 코드**:
```typescript
const loadingEl = findByTestId(wrapper, 'wbs-loading');
expect(loadingEl.exists()).toBe(true);
expect(loadingEl.isVisible()).toBe(true);
```

---

#### TC-202: 에러 상태 표시

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트
- `store.error = 'Failed to load WBS'` 설정

**When**:
- 컴포넌트 렌더링

**Then**:
- `[data-testid="wbs-error"]` 요소가 표시됨
- 에러 메시지 'Failed to load WBS' 포함

**검증 코드**:
```typescript
const errorEl = findByTestId(wrapper, 'wbs-error');
expect(errorEl.exists()).toBe(true);
expect(errorEl.text()).toContain('Failed to load WBS');
```

---

#### TC-203: 빈 데이터 상태 표시

**요구사항**: FR-005
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트
- `store.tree = []` (빈 배열)
- `store.loading = false`

**When**:
- 컴포넌트 렌더링

**Then**:
- `[data-testid="wbs-empty"]` 요소가 표시됨
- "No WBS data" 또는 유사한 메시지 포함

**검증 코드**:
```typescript
const emptyEl = findByTestId(wrapper, 'wbs-empty');
expect(emptyEl.exists()).toBe(true);
expect(emptyEl.text()).toMatch(/No.*data|Empty/i);
```

---

#### TC-204: 정상 데이터 렌더링

**요구사항**: FR-005
**우선순위**: Critical
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트
- `store.tree = [complexWbsTree]` (Mock 데이터)
- `store.loading = false`

**When**:
- 컴포넌트 렌더링

**Then**:
- `[data-testid="wbs-tree-header"]` 표시됨
- `[data-testid="wbs-tree-content"]` 표시됨
- 로딩/에러/빈 상태 요소는 숨김

**검증 코드**:
```typescript
expect(findByTestId(wrapper, 'wbs-tree-header').exists()).toBe(true);
expect(findByTestId(wrapper, 'wbs-tree-content').exists()).toBe(true);
expect(wrapper.find('[data-testid="wbs-loading"]').exists()).toBe(false);
```

---

#### TC-205: WbsTreeHeader 포함

**요구사항**: FR-005
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트

**When**:
- 컴포넌트 구조 검사

**Then**:
- WbsTreeHeader 자식 컴포넌트가 존재함

**검증 코드**:
```typescript
const header = wrapper.findComponent({ name: 'WbsTreeHeader' });
expect(header.exists()).toBe(true);
```

---

#### TC-206: WbsSummaryCards 포함

**요구사항**: FR-005
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

**Given**:
- WbsTreePanel 컴포넌트 마운트

**When**:
- 컴포넌트 구조 검사

**Then**:
- WbsSummaryCards 자식 컴포넌트가 존재함

**검증 코드**:
```typescript
const cards = wrapper.findComponent({ name: 'WbsSummaryCards' });
expect(cards.exists()).toBe(true);
```

---

### 2.2 WbsSearchBox 컴포넌트

#### TC-210: 검색어 입력 시 debounce 적용

**요구사항**: FR-006
**우선순위**: Critical
**테스트 파일**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

**Given**:
- WbsSearchBox 컴포넌트 마운트
- `store.setSearchQuery` spy 설정

**When**:
- 사용자가 빠르게 'T', 'TS', 'TSK' 순서로 입력
- 각 입력 간격 < 100ms

**Then**:
- 입력 중에는 `setSearchQuery` 호출되지 않음
- 300ms 대기 후 마지막 값 'TSK'로 1회만 호출됨

**검증 코드**:
```typescript
const setSearchSpy = vi.spyOn(store, 'setSearchQuery');
await input.setValue('T');
await input.setValue('TS');
await input.setValue('TSK');
expect(setSearchSpy).not.toHaveBeenCalled();

await waitFor(350); // debounce 시간
expect(setSearchSpy).toHaveBeenCalledTimes(1);
expect(setSearchSpy).toHaveBeenCalledWith('TSK');
```

---

#### TC-211: X 버튼 클릭 시 검색어 초기화

**요구사항**: FR-006
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

**Given**:
- WbsSearchBox 컴포넌트 마운트
- 검색어 'test query' 입력됨
- debounce 완료

**When**:
- X 버튼(`[data-testid="search-clear"]`) 클릭

**Then**:
- `store.searchQuery`가 빈 문자열로 초기화됨
- input value가 '' (빈 값)

**검증 코드**:
```typescript
await input.setValue('test query');
await waitFor(350);

const clearBtn = findByTestId(wrapper, 'search-clear');
await clearBtn.trigger('click');

expect(store.searchQuery).toBe('');
expect((input.element as HTMLInputElement).value).toBe('');
```

---

#### TC-212: X 버튼은 검색어 있을 때만 표시

**요구사항**: FR-006
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

**Given**:
- WbsSearchBox 컴포넌트 마운트
- 초기 검색어 없음

**When**:
- 초기 렌더링 확인

**Then**:
- X 버튼이 숨김 또는 존재하지 않음

**When**:
- 검색어 'test' 입력

**Then**:
- X 버튼이 표시됨

**검증 코드**:
```typescript
// 초기 상태
let clearBtn = wrapper.find('[data-testid="search-clear"]');
expect(clearBtn.exists()).toBe(false);

// 검색어 입력 후
await input.setValue('test');
await wrapper.vm.$nextTick();
clearBtn = findByTestId(wrapper, 'search-clear');
expect(clearBtn.exists()).toBe(true);
```

---

#### TC-213: 마운트 시 자동 포커스 (선택적)

**요구사항**: FR-006
**우선순위**: Low
**테스트 파일**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

**Given**:
- WbsSearchBox 컴포넌트에 `autofocus: true` prop 전달

**When**:
- 컴포넌트 마운트 및 nextTick

**Then**:
- input 요소가 `document.activeElement`임

**검증 코드**:
```typescript
const wrapper = mountWithPinia(WbsSearchBox, {
  props: { autofocus: true }
});
await wrapper.vm.$nextTick();

const input = findByTestId(wrapper, 'search-input');
expect(document.activeElement).toBe(input.element);
```

---

### 2.3 WbsSummaryCards 컴포넌트

#### TC-220: 4개 카드 렌더링

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- WbsSummaryCards 컴포넌트 마운트

**When**:
- 컴포넌트 렌더링

**Then**:
- `[data-testid^="summary-card-"]` 선택자로 4개 요소 발견
  - summary-card-wp
  - summary-card-act
  - summary-card-tsk
  - summary-card-progress

**검증 코드**:
```typescript
const cards = wrapper.findAll('[data-testid^="summary-card-"]');
expect(cards.length).toBe(4);
```

---

#### TC-221: WP 개수 정확히 표시

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- `store.tree = [complexWbsTree]` (2개 WP 포함)

**When**:
- 컴포넌트 렌더링 및 nextTick

**Then**:
- `[data-testid="summary-card-wp"]` 요소의 텍스트에 '2' 포함

**검증 코드**:
```typescript
store.tree = [complexWbsTree];
await wrapper.vm.$nextTick();

const wpCard = findByTestId(wrapper, 'summary-card-wp');
expect(wpCard.text()).toContain('2');
```

---

#### TC-222: ACT 개수 정확히 표시

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- `store.tree = [complexWbsTree]` (1개 ACT 포함)

**When**:
- 컴포넌트 렌더링 및 nextTick

**Then**:
- `[data-testid="summary-card-act"]` 요소의 텍스트에 '1' 포함

**검증 코드**:
```typescript
store.tree = [complexWbsTree];
await wrapper.vm.$nextTick();

const actCard = findByTestId(wrapper, 'summary-card-act');
expect(actCard.text()).toContain('1');
```

---

#### TC-223: TSK 개수 정확히 표시

**요구사항**: FR-005
**우선순위**: High
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- `store.tree = [complexWbsTree]` (4개 TSK 포함)

**When**:
- 컴포넌트 렌더링 및 nextTick

**Then**:
- `[data-testid="summary-card-tsk"]` 요소의 텍스트에 '4' 포함

**검증 코드**:
```typescript
store.tree = [complexWbsTree];
await wrapper.vm.$nextTick();

const tskCard = findByTestId(wrapper, 'summary-card-tsk');
expect(tskCard.text()).toContain('4');
```

---

#### TC-224: overallProgress 표시

**요구사항**: FR-005
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- `store.tree = [complexWbsTree]`

**When**:
- 컴포넌트 렌더링 및 nextTick

**Then**:
- `[data-testid="summary-card-progress"]` 요소의 텍스트에 `\d+%` 패턴 매칭
- 숫자는 0~100 범위

**검증 코드**:
```typescript
store.tree = [complexWbsTree];
await wrapper.vm.$nextTick();

const progressCard = findByTestId(wrapper, 'summary-card-progress');
expect(progressCard.text()).toMatch(/\d+%/);
```

---

#### TC-225: 빈 트리 시 모든 값 0

**요구사항**: FR-005
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

**Given**:
- `store.tree = []` (빈 배열)

**When**:
- 컴포넌트 렌더링 및 nextTick

**Then**:
- 모든 카드가 '0' 또는 '0%' 표시

**검증 코드**:
```typescript
store.tree = [];
await wrapper.vm.$nextTick();

expect(findByTestId(wrapper, 'summary-card-wp').text()).toContain('0');
expect(findByTestId(wrapper, 'summary-card-act').text()).toContain('0');
expect(findByTestId(wrapper, 'summary-card-tsk').text()).toContain('0');
expect(findByTestId(wrapper, 'summary-card-progress').text()).toContain('0%');
```

---

### 2.4 WbsTreeHeader 컴포넌트

#### TC-230: 타이틀 표시

**요구사항**: FR-007
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

**Given**:
- WbsTreeHeader 컴포넌트에 `title="Test WBS"` prop 전달

**When**:
- 컴포넌트 렌더링

**Then**:
- 컴포넌트 텍스트에 'Test WBS' 포함

**검증 코드**:
```typescript
const wrapper = mountWithPinia(WbsTreeHeader, {
  props: { title: 'Test WBS' }
});
expect(wrapper.text()).toContain('Test WBS');
```

---

#### TC-231: 아이콘 표시

**요구사항**: FR-007
**우선순위**: Low
**테스트 파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

**Given**:
- WbsTreeHeader 컴포넌트 마운트

**When**:
- 컴포넌트 렌더링

**Then**:
- PrimeIcons 'pi-sitemap' 클래스 요소 존재

**검증 코드**:
```typescript
const icon = wrapper.find('.pi-sitemap');
expect(icon.exists()).toBe(true);
```

---

#### TC-232: 전체 펼치기 버튼 클릭

**요구사항**: FR-007
**우선순위**: Critical
**테스트 파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

**Given**:
- WbsTreeHeader 컴포넌트 마운트
- `store.expandAll` spy 설정

**When**:
- `[data-testid="expand-all-btn"]` 클릭

**Then**:
- `store.expandAll()`이 1회 호출됨

**검증 코드**:
```typescript
const expandSpy = vi.spyOn(store, 'expandAll');
const expandBtn = findByTestId(wrapper, 'expand-all-btn');
await expandBtn.trigger('click');
expect(expandSpy).toHaveBeenCalledTimes(1);
```

---

#### TC-233: 전체 접기 버튼 클릭

**요구사항**: FR-007
**우선순위**: Critical
**테스트 파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

**Given**:
- WbsTreeHeader 컴포넌트 마운트
- `store.collapseAll` spy 설정

**When**:
- `[data-testid="collapse-all-btn"]` 클릭

**Then**:
- `store.collapseAll()`이 1회 호출됨

**검증 코드**:
```typescript
const collapseSpy = vi.spyOn(store, 'collapseAll');
const collapseBtn = findByTestId(wrapper, 'collapse-all-btn');
await collapseBtn.trigger('click');
expect(collapseSpy).toHaveBeenCalledTimes(1);
```

---

#### TC-234: WbsSearchBox 포함

**요구사항**: FR-007
**우선순위**: Medium
**테스트 파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

**Given**:
- WbsTreeHeader 컴포넌트 마운트

**When**:
- 컴포넌트 구조 검사

**Then**:
- WbsSearchBox 자식 컴포넌트 존재

**검증 코드**:
```typescript
const searchBox = wrapper.findComponent({ name: 'WbsSearchBox' });
expect(searchBox.exists()).toBe(true);
```

---

## 3. E2E 테스트 명세

### 3.1 WBS 트리 패널 기본 플로우

#### E2E-001: 페이지 로드 → WBS 데이터 표시

**요구사항**: FR-008
**우선순위**: Critical
**테스트 파일**: `tests/e2e/wbs-tree-panel.spec.ts`

**Given**:
- 브라우저가 실행됨
- `.jjiban/projects/test-project/wbs.md` 파일 존재

**When**:
- `/wbs?project=test-project` URL로 이동
- 페이지 로드 완료 대기 (`waitForPageReady`)
- WBS 로딩 완료 대기 (`waitForWbsLoaded`)

**Then**:
- `[data-testid="wbs-tree-content"]` 요소 표시됨
- 'WP-01: Test Work Package' 텍스트 표시됨

**검증 코드**:
```typescript
await page.goto('/wbs?project=test-project');
await waitForPageReady(page);
await waitForWbsLoaded(page);

const treeContent = page.locator('[data-testid="wbs-tree-content"]');
await expect(treeContent).toBeVisible();

const wpNode = page.locator('text=WP-01: Test Work Package');
await expect(wpNode).toBeVisible();
```

---

#### E2E-002: 헤더 요소 전체 확인

**요구사항**: FR-008
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-tree-panel.spec.ts`

**Given**:
- WBS 페이지 로드 완료

**When**:
- 헤더 영역 검사

**Then**:
- `[data-testid="wbs-tree-header"]` 표시
- `[data-testid="expand-all-btn"]` 표시
- `[data-testid="collapse-all-btn"]` 표시
- `[data-testid="search-input"]` 표시

**검증 코드**:
```typescript
await expect(page.locator('[data-testid="wbs-tree-header"]')).toBeVisible();
await expect(page.locator('[data-testid="expand-all-btn"]')).toBeVisible();
await expect(page.locator('[data-testid="collapse-all-btn"]')).toBeVisible();
await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
```

---

#### E2E-003: 통계 카드 값 정확성

**요구사항**: FR-008
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-tree-panel.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- test-project WBS에 2 WP, 1 ACT, 3 TSK 포함

**When**:
- 통계 카드 확인

**Then**:
- WP 카드: '2'
- ACT 카드: '1'
- TSK 카드: '3'
- Progress 카드: '%' 포함

**검증 코드**:
```typescript
const wpCard = page.locator('[data-testid="summary-card-wp"]');
await expect(wpCard).toContainText('2');

const actCard = page.locator('[data-testid="summary-card-act"]');
await expect(actCard).toContainText('1');

const tskCard = page.locator('[data-testid="summary-card-tsk"]');
await expect(tskCard).toContainText('3');

const progressCard = page.locator('[data-testid="summary-card-progress"]');
await expect(progressCard).toContainText(/%/);
```

---

#### E2E-004: 로딩 스피너 → 콘텐츠 전환

**요구사항**: FR-008
**우선순위**: Medium
**테스트 파일**: `tests/e2e/wbs-tree-panel.spec.ts`

**Given**:
- 브라우저 실행

**When**:
- 페이지 이동 시작

**Then**:
- 초기: `[data-testid="wbs-loading"]` 표시

**When**:
- WBS 로딩 완료

**Then**:
- `[data-testid="wbs-loading"]` 숨김
- `[data-testid="wbs-tree-content"]` 표시

**검증 코드**:
```typescript
await page.goto('/wbs?project=test-project');

const loading = page.locator('[data-testid="wbs-loading"]');
await expect(loading).toBeVisible();

await waitForWbsLoaded(page);

await expect(loading).toBeHidden();
const content = page.locator('[data-testid="wbs-tree-content"]');
await expect(content).toBeVisible();
```

---

### 3.2 검색 기능 E2E

#### E2E-010: 검색어 입력 → 필터링 결과

**요구사항**: FR-006, FR-008
**우선순위**: Critical
**테스트 파일**: `tests/e2e/wbs-search.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 전체 트리 표시됨

**When**:
- 검색 입력란에 'TSK-01' 입력
- 400ms 대기 (debounce)

**Then**:
- 'TSK-01-01-01' 노드 표시됨
- 'WP-02' 노드 숨김 (필터링됨)

**검증 코드**:
```typescript
const searchInput = page.locator('[data-testid="search-input"]');
await searchInput.fill('TSK-01');
await page.waitForTimeout(400);

const taskNode = page.locator('text=TSK-01-01-01');
await expect(taskNode).toBeVisible();

const wp02 = page.locator('text=WP-02');
await expect(wp02).toBeHidden();
```

---

#### E2E-011: X 버튼 → 초기화

**요구사항**: FR-006, FR-008
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-search.spec.ts`

**Given**:
- 검색어 'Search' 입력됨
- 필터링 적용됨

**When**:
- X 버튼 클릭

**Then**:
- 검색어 빈 값
- 전체 트리 표시 (WP-01, WP-02 모두)

**검증 코드**:
```typescript
const searchInput = page.locator('[data-testid="search-input"]');
await searchInput.fill('Search');
await page.waitForTimeout(400);

const clearBtn = page.locator('[data-testid="search-clear"]');
await clearBtn.click();

await expect(searchInput).toHaveValue('');
await expect(page.locator('text=WP-01')).toBeVisible();
await expect(page.locator('text=WP-02')).toBeVisible();
```

---

#### E2E-012: 대소문자 무시 검색

**요구사항**: FR-006, FR-008
**우선순위**: Medium
**테스트 파일**: `tests/e2e/wbs-search.spec.ts`

**Given**:
- WBS 페이지 로드 완료

**When**:
- 소문자 'test task' 입력
- 400ms 대기

**Then**:
- 'Test Task 1' 노드 표시 (대문자 매칭)

**검증 코드**:
```typescript
const searchInput = page.locator('[data-testid="search-input"]');
await searchInput.fill('test task');
await page.waitForTimeout(400);

const taskNode = page.locator('text=Test Task 1');
await expect(taskNode).toBeVisible();
```

---

### 3.3 트리 액션 E2E

#### E2E-020: 전체 펼치기

**요구사항**: FR-007, FR-008
**우선순위**: Critical
**테스트 파일**: `tests/e2e/wbs-actions.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 일부 노드 접힌 상태 (전체 접기 실행)

**When**:
- `[data-testid="expand-all-btn"]` 클릭
- 200ms 대기 (애니메이션)

**Then**:
- 'ACT-01-01' 표시
- 'TSK-01-01-01' 표시
- 'TSK-01-01-02' 표시

**검증 코드**:
```typescript
await page.locator('[data-testid="collapse-all-btn"]').click();
await page.waitForTimeout(200);

await page.locator('[data-testid="expand-all-btn"]').click();
await page.waitForTimeout(200);

await expect(page.locator('text=ACT-01-01')).toBeVisible();
await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
await expect(page.locator('text=TSK-01-01-02')).toBeVisible();
```

---

#### E2E-021: 전체 접기

**요구사항**: FR-007, FR-008
**우선순위**: Critical
**테스트 파일**: `tests/e2e/wbs-actions.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 전체 펼쳐진 상태

**When**:
- `[data-testid="collapse-all-btn"]` 클릭
- 200ms 대기

**Then**:
- 'WP-01' 표시 (최상위)
- 'ACT-01-01' 숨김 (하위 노드)

**검증 코드**:
```typescript
await page.locator('[data-testid="expand-all-btn"]').click();
await page.waitForTimeout(200);

await page.locator('[data-testid="collapse-all-btn"]').click();
await page.waitForTimeout(200);

await expect(page.locator('text=WP-01')).toBeVisible();
await expect(page.locator('text=ACT-01-01')).toBeHidden();
```

---

#### E2E-022: 개별 노드 펼치기/접기

**요구사항**: FR-007, FR-008
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-actions.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 전체 접힌 상태

**When**:
- WP-01 토글 버튼 클릭

**Then**:
- 'ACT-01-01' 표시

**When**:
- ACT-01-01 토글 버튼 클릭

**Then**:
- 'TSK-01-01-01' 표시

**검증 코드**:
```typescript
await page.locator('[data-testid="collapse-all-btn"]').click();
await page.waitForTimeout(200);

const wp01Toggle = page.locator('[data-node-id="WP-01"] [data-testid="toggle-btn"]');
await wp01Toggle.click();
await page.waitForTimeout(200);
await expect(page.locator('text=ACT-01-01')).toBeVisible();
await expect(page.locator('text=TSK-01-01-01')).toBeHidden();

const actToggle = page.locator('[data-node-id="ACT-01-01"] [data-testid="toggle-btn"]');
await actToggle.click();
await page.waitForTimeout(200);
await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
```

---

### 3.4 에러 핸들링 E2E

#### E2E-030: API 오류 → 에러 메시지 표시

**요구사항**: FR-008
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-error-handling.spec.ts`

**Given**:
- API 500 에러 모킹 (`mockWbsApiError(page, 500, 'Internal Server Error')`)

**When**:
- 페이지 로드

**Then**:
- `[data-testid="wbs-error"]` 표시
- 'Internal Server Error' 텍스트 포함

**검증 코드**:
```typescript
await mockWbsApiError(page, 500, 'Internal Server Error');
await page.goto('/wbs?project=test-project');

const errorEl = page.locator('[data-testid="wbs-error"]');
await expect(errorEl).toBeVisible();
await expect(errorEl).toContainText('Internal Server Error');
```

---

#### E2E-031: 404 오류 → 프로젝트 없음 메시지

**요구사항**: FR-008
**우선순위**: Medium
**테스트 파일**: `tests/e2e/wbs-error-handling.spec.ts`

**Given**:
- API 404 에러 모킹

**When**:
- `/wbs?project=non-existent` 이동

**Then**:
- 'Project not found' 메시지 표시

**검증 코드**:
```typescript
await mockWbsApiError(page, 404, 'Project not found');
await page.goto('/wbs?project=non-existent');

const errorEl = page.locator('[data-testid="wbs-error"]');
await expect(errorEl).toBeVisible();
await expect(errorEl).toContainText('Project not found');
```

---

#### E2E-032: 네트워크 오류 재시도

**요구사항**: FR-008
**우선순위**: Medium
**테스트 파일**: `tests/e2e/wbs-error-handling.spec.ts`

**Given**:
- 첫 API 호출 실패, 두 번째 성공 (route 모킹)

**When**:
- 페이지 로드 (첫 호출 실패)
- Retry 버튼 클릭

**Then**:
- 콘텐츠 정상 표시

**검증 코드**:
```typescript
let callCount = 0;
await page.route('**/api/projects/*/wbs', async (route) => {
  callCount++;
  if (callCount === 1) {
    await route.abort('failed');
  } else {
    await route.continue();
  }
});

await page.goto('/wbs?project=test-project');

const retryBtn = page.locator('[data-testid="retry-btn"]');
await retryBtn.click();

const content = page.locator('[data-testid="wbs-tree-content"]');
await expect(content).toBeVisible({ timeout: 10000 });
```

---

### 3.5 접근성 E2E

#### E2E-040: ARIA 속성 검증

**요구사항**: NFR-005
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-accessibility.spec.ts`

**Given**:
- WBS 페이지 로드 완료

**When**:
- 접근성 검증 실행

**Then**:
- 주요 랜드마크 존재 (`[role]` 요소 > 0)
- 검색 입력란 `aria-label` 존재
- 버튼들 `aria-label` 존재

**검증 코드**:
```typescript
await checkAccessibility(page);

const searchInput = page.locator('[data-testid="search-input"]');
await expect(searchInput).toHaveAttribute('aria-label');

const expandBtn = page.locator('[data-testid="expand-all-btn"]');
await expect(expandBtn).toHaveAttribute('aria-label');
```

---

#### E2E-041: 키보드 네비게이션

**요구사항**: NFR-005
**우선순위**: High
**테스트 파일**: `tests/e2e/wbs-accessibility.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 검색 입력란에 포커스

**When**:
- Tab 키 입력

**Then**:
- 펼치기 버튼으로 포커스 이동

**검증 코드**:
```typescript
await page.locator('[data-testid="search-input"]').focus();
await testKeyboardNavigation(
  page,
  '[data-testid="search-input"]',
  '[data-testid="expand-all-btn"]'
);

const expandBtn = page.locator('[data-testid="expand-all-btn"]');
await expect(expandBtn).toBeFocused();
```

---

#### E2E-042: Enter 키로 버튼 활성화

**요구사항**: NFR-005
**우선순위**: Medium
**테스트 파일**: `tests/e2e/wbs-accessibility.spec.ts`

**Given**:
- WBS 페이지 로드 완료
- 펼치기 버튼에 포커스

**When**:
- Enter 키 입력

**Then**:
- expandAll 실행 (모든 노드 표시)

**검증 코드**:
```typescript
await page.locator('[data-testid="expand-all-btn"]').focus();
await page.keyboard.press('Enter');

await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
```

---

#### E2E-043: 스크린 리더 텍스트

**요구사항**: NFR-005
**우선순위**: Low
**테스트 파일**: `tests/e2e/wbs-accessibility.spec.ts`

**Given**:
- WBS 페이지 로드 완료

**When**:
- 스크린 리더용 텍스트 검사

**Then**:
- `.sr-only` 또는 `[aria-label]` 요소 존재 (개수 > 0)

**검증 코드**:
```typescript
const srText = page.locator('.sr-only, [aria-label]');
const count = await srText.count();
expect(count).toBeGreaterThan(0);
```

---

## 4. 단위 테스트 명세 (추가 케이스)

### 4.1 워크플로우 엔진 카테고리별 플로우

#### TC-100: development 카테고리 전체 플로우

**요구사항**: FR-003, BR-006
**우선순위**: Critical
**테스트 파일**: `tests/utils/workflow/workflowEngine.test.ts`

**Given**:
```typescript
const task = {
  id: 'TSK-01',
  status: '[ ]',
  category: 'development'
};
```

**When/Then** (순차 실행):
1. `executeCommand(task, 'start')` → `status: '[bd]'`
2. `executeCommand(result, 'draft')` → `status: '[dd]'`
3. `executeCommand(result, 'build')` → `status: '[im]'`
4. `executeCommand(result, 'verify')` → `status: '[vf]'`
5. `executeCommand(result, 'done')` → `status: '[xx]'`

**검증 코드**:
```typescript
let result = await executeCommand(task, 'start');
expect(result.status).toBe('[bd]');

result = await executeCommand(result, 'draft');
expect(result.status).toBe('[dd]');

result = await executeCommand(result, 'build');
expect(result.status).toBe('[im]');

result = await executeCommand(result, 'verify');
expect(result.status).toBe('[vf]');

result = await executeCommand(result, 'done');
expect(result.status).toBe('[xx]');
```

---

#### TC-101: defect 카테고리 단축 플로우

**요구사항**: FR-003, BR-007
**우선순위**: Critical
**테스트 파일**: `tests/utils/workflow/workflowEngine.test.ts`

**Given**:
```typescript
const task = {
  id: 'TSK-02',
  status: '[ ]',
  category: 'defect'
};
```

**When/Then**:
1. `executeCommand(task, 'start')` → `status: '[an]'`
2. `executeCommand(result, 'build')` → `status: '[fx]'`
3. `executeCommand(result, 'verify')` → `status: '[vf]'`
4. `executeCommand(result, 'done')` → `status: '[xx]'`

**검증 코드**:
```typescript
let result = await executeCommand(task, 'start');
expect(result.status).toBe('[an]');

result = await executeCommand(result, 'build');
expect(result.status).toBe('[fx]');

result = await executeCommand(result, 'verify');
expect(result.status).toBe('[vf]');

result = await executeCommand(result, 'done');
expect(result.status).toBe('[xx]');
```

---

#### TC-102: infrastructure 카테고리 디자인 스킵

**요구사항**: FR-003, BR-008
**우선순위**: High
**테스트 파일**: `tests/utils/workflow/workflowEngine.test.ts`

**Given**:
```typescript
const task = {
  id: 'TSK-03',
  status: '[ ]',
  category: 'infrastructure'
};
```

**When/Then**:
1. `executeCommand(task, 'skip')` → `status: '[im]'`
2. `executeCommand(result, 'done')` → `status: '[xx]'`

**검증 코드**:
```typescript
let result = await executeCommand(task, 'skip');
expect(result.status).toBe('[im]');

result = await executeCommand(result, 'done');
expect(result.status).toBe('[xx]');
```

---

#### TC-103: 잘못된 전이 시도 시 에러

**요구사항**: FR-003, BR-009
**우선순위**: High
**테스트 파일**: `tests/utils/workflow/workflowEngine.test.ts`

**Given**:
```typescript
const task = {
  id: 'TSK-04',
  status: '[dd]',
  category: 'development'
};
```

**When**:
- `executeCommand(task, 'verify')` 실행 (Detail → Verify는 불가능)

**Then**:
- Promise reject with 'Invalid transition' 에러

**검증 코드**:
```typescript
await expect(
  executeCommand(task, 'verify')
).rejects.toThrow('Invalid transition');
```

---

### 4.2 WBS 파서 엣지 케이스

#### TC-050: 빈 Markdown 입력 시 빈 트리 반환

**요구사항**: FR-001
**우선순위**: Medium
**테스트 파일**: `tests/utils/wbs/parser.test.ts`

**Given**:
```typescript
const input = '';
```

**When**:
```typescript
const result = parseWbsMarkdown(input, 'test-project');
```

**Then**:
- `result.children`가 빈 배열 `[]`

**검증 코드**:
```typescript
expect(result.children).toEqual([]);
expect(result.id).toBe('test-project');
```

---

#### TC-051: 메타데이터만 있는 Markdown

**요구사항**: FR-001
**우선순위**: Low
**테스트 파일**: `tests/utils/wbs/parser.test.ts`

**Given**:
```typescript
const input = `# WBS
> version: 1.0
> depth: 4
---`;
```

**When**:
```typescript
const result = parseWbsMarkdown(input, 'test-project');
```

**Then**:
- 메타데이터 파싱됨
- `children` 빈 배열

**검증 코드**:
```typescript
expect(result.children).toEqual([]);
// 메타데이터는 별도로 파싱됨 (구현 방식에 따라)
```

---

#### TC-052: 1000+ 노드 성능 테스트

**요구사항**: NFR-002
**우선순위**: Low
**테스트 파일**: `tests/utils/wbs/parser.test.ts`

**Given**:
```typescript
const largeMarkdown = generateLargeWbs(1000); // 헬퍼 함수
```

**When**:
```typescript
const start = Date.now();
const result = parseWbsMarkdown(largeMarkdown, 'large-project');
const duration = Date.now() - start;
```

**Then**:
- `duration < 2000` (2초 이내)
- `result.children.length > 0`

**검증 코드**:
```typescript
expect(duration).toBeLessThan(2000);
expect(result.children.length).toBeGreaterThan(0);
```

---

## 5. 테스트 데이터 명세

### 5.1 Mock WBS 트리

**파일**: `tests/fixtures/mock-data/wbs-nodes.ts`

**minimalWbsTree**:
- Project: 'test-project'
  - WP-01: 'Work Package 1'
    - TSK-01-01: 'Task 1' (status: [bd], category: development)

**complexWbsTree**:
- Project: 'complex-project'
  - WP-01: 'Infrastructure'
    - ACT-01-01: 'Environment Setup'
      - TSK-01-01-01: 'Node.js Setup' (status: [xx], 100%)
      - TSK-01-01-02: 'Database Setup' (status: [im], 50%)
  - WP-02: 'Features'
    - TSK-02-01: 'Auth System' (status: [bd], 25%)
    - TSK-02-02: 'Fix Login Bug' (status: [an], category: defect)

**searchTestTree**:
- Project: 'search-test'
  - WP-01: 'Backend Development'
    - TSK-01-01: 'API Design' (status: [bd])
    - TSK-01-02: 'Database Schema' (status: [dd])
  - WP-02: 'Frontend Development'
    - TSK-02-01: 'UI Components' (status: [ ])

### 5.2 API 응답 Mock

**파일**: `tests/fixtures/mock-data/api-responses.ts`

**wbsApiSuccessResponse**:
```json
{
  "metadata": {
    "version": "1.0",
    "depth": 4,
    "updated": "2025-12-15",
    "start": "2025-12-01"
  },
  "tree": [/* complexWbsTree */]
}
```

**wbsNotFoundResponse**:
```json
{
  "error": "Project not found",
  "statusCode": 404
}
```

**wbsServerErrorResponse**:
```json
{
  "error": "Internal server error",
  "statusCode": 500
}
```

---

## 6. 실행 및 검증

### 6.1 테스트 실행 명령어

```bash
# 전체 단위 테스트
npm run test

# 커버리지 포함
npm run test:coverage

# E2E 테스트
npm run test:e2e

# 특정 파일만
npm run test -- parser.test.ts
npm run test:e2e -- wbs-search.spec.ts
```

### 6.2 성공 기준

- **모든 테스트 통과**: 136+ 테스트 케이스 100% 통과
- **코드 커버리지**: >= 80% (statements, branches)
- **실행 시간**: 단위 < 10초, E2E < 2분
- **Flaky 테스트**: 0개 (10회 연속 실행 시)

---

## 관련 문서

- **기본설계**: `010-basic-design.md`
- **상세설계**: `020-detail-design.md`
- **추적성 매트릭스**: `025-traceability-matrix.md`
- **PRD**: `.jjiban/projects/jjiban/prd.md`

---

<!--
author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
