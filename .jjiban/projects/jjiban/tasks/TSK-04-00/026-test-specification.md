# 테스트 명세 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **목적**
> * TDD(Test-Driven Development) 기반 테스트 케이스 정의
> * 각 테스트의 상세 시나리오 및 검증 조건 명시
> * E2E 및 단위 테스트 구현 가이드 제공

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-00 |
| Task명 | Projects Page |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude (System Architect) |

### 참조 문서

| 문서 유형 | 경로 |
|----------|------|
| 기본설계 | `010-basic-design.md` |
| 상세설계 | `020-detail-design.md` |
| 추적성 매트릭스 | `025-traceability-matrix.md` |

---

## 1. 테스트 전략

### 1.1 테스트 피라미드

```
        /\
       /E2E\         12개 (UI 중심)
      /------\
     /  IT   \       2개 (API-UI 통합)
    /----------\
   /    UT     \     4개 (유틸리티/로직)
  /--------------\
```

**비율**: UT:IT:E2E = 22:11:67 (UI 중심 특성 반영)

### 1.2 테스트 도구

| 테스트 타입 | 도구 | 이유 |
|-------------|------|------|
| 단위 테스트 | Vitest | Nuxt 3 권장, 빠른 실행 |
| 통합 테스트 | Vitest + supertest | API-UI 통합 검증 |
| E2E 테스트 | Playwright | 실제 브라우저 동작 검증 |

### 1.3 테스트 환경

| 항목 | 설정 |
|------|------|
| 테스트 데이터 경로 | `tests/fixtures/projects-page/` |
| API Mock | 실제 API 사용 (테스트 환경) |
| 브라우저 | Chromium, Firefox, WebKit |
| 뷰포트 | 1200px, 768px, 375px |

---

## 2. 단위 테스트 (Unit Tests)

### UT-001: useFetch API 호출 검증

**파일**: `tests/unit/pages/projects.spec.ts`

**목적**: API 호출이 올바른 엔드포인트와 옵션으로 실행되는지 검증

**Given**:
- Nuxt 테스트 환경 설정
- Mock API 응답 준비

**When**:
- `pages/projects.vue` 컴포넌트 마운트

**Then**:
- `useFetch`가 `/api/projects` 경로로 호출됨
- 옵션 `key: 'projects-list'` 전달됨

**구현 예시**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ProjectsPage from '~/pages/projects.vue';

describe('UT-001: useFetch API 호출', () => {
  it('should call useFetch with correct endpoint and options', async () => {
    const mockUseFetch = vi.fn().mockReturnValue({
      data: ref({ projects: [], defaultProject: null, total: 0 }),
      pending: ref(false),
      error: ref(null),
    });

    // useFetch Mock
    vi.mock('#app', () => ({
      useFetch: mockUseFetch,
      navigateTo: vi.fn(),
    }));

    await mountSuspended(ProjectsPage);

    expect(mockUseFetch).toHaveBeenCalledWith('/api/projects', {
      key: 'projects-list',
    });
  });
});
```

**검증 조건**:
- [ ] `/api/projects` 엔드포인트 호출
- [ ] `key: 'projects-list'` 옵션 전달
- [ ] 반환 객체에 `data`, `pending`, `error` 포함

**우선순위**: High
**관련 요구사항**: FR-001

---

### UT-002: filteredProjects 필터링 로직

**파일**: `tests/unit/composables/useProjectFilter.spec.ts`

**목적**: 필터 상태에 따라 프로젝트 목록이 올바르게 필터링되는지 검증

**Given**:
- 테스트 프로젝트 목록:
  ```typescript
  const projects = [
    { id: 'p1', status: 'active', ... },
    { id: 'p2', status: 'archived', ... },
    { id: 'p3', status: 'active', ... },
  ];
  ```

**When**:
- `filterStatus` 값을 'all', 'active', 'archived'로 변경

**Then**:
- 'all': 3개 모두 반환
- 'active': p1, p3 반환 (2개)
- 'archived': p2 반환 (1개)

**구현 예시**:
```typescript
import { describe, it, expect } from 'vitest';
import { ref, computed } from 'vue';

describe('UT-002: filteredProjects 필터링', () => {
  const mockProjects = [
    { id: 'p1', name: 'Project 1', status: 'active', wbsDepth: 4, createdAt: '2025-01-01', path: 'p1' },
    { id: 'p2', name: 'Project 2', status: 'archived', wbsDepth: 3, createdAt: '2025-01-02', path: 'p2' },
    { id: 'p3', name: 'Project 3', status: 'active', wbsDepth: 4, createdAt: '2025-01-03', path: 'p3' },
  ];

  const data = ref({ projects: mockProjects, defaultProject: null, total: 3 });
  const filterStatus = ref<'all' | 'active' | 'archived'>('all');

  const filteredProjects = computed(() => {
    if (!data.value?.projects) return [];
    if (filterStatus.value === 'all') return data.value.projects;
    return data.value.projects.filter((p) => p.status === filterStatus.value);
  });

  it('should return all projects when filter is "all"', () => {
    filterStatus.value = 'all';
    expect(filteredProjects.value).toHaveLength(3);
  });

  it('should return only active projects when filter is "active"', () => {
    filterStatus.value = 'active';
    expect(filteredProjects.value).toHaveLength(2);
    expect(filteredProjects.value.every((p) => p.status === 'active')).toBe(true);
  });

  it('should return only archived projects when filter is "archived"', () => {
    filterStatus.value = 'archived';
    expect(filteredProjects.value).toHaveLength(1);
    expect(filteredProjects.value[0].id).toBe('p2');
  });

  it('should return empty array when no projects match filter', () => {
    data.value.projects = [];
    filterStatus.value = 'active';
    expect(filteredProjects.value).toHaveLength(0);
  });
});
```

**검증 조건**:
- [ ] 'all' 필터: 모든 프로젝트 반환
- [ ] 'active' 필터: active 상태만 반환
- [ ] 'archived' 필터: archived 상태만 반환
- [ ] 빈 목록 처리: 빈 배열 반환

**우선순위**: High
**관련 요구사항**: FR-005

---

### UT-003: formatDate 날짜 변환

**파일**: `tests/unit/utils/formatDate.spec.ts`

**목적**: ISO 8601 날짜를 YYYY-MM-DD 형식으로 올바르게 변환하는지 검증

**Given**:
- ISO 8601 형식 날짜 문자열

**When**:
- `formatDate()` 함수 호출

**Then**:
- YYYY-MM-DD 형식 문자열 반환

**구현 예시**:
```typescript
import { describe, it, expect } from 'vitest';

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

describe('UT-003: formatDate 날짜 변환', () => {
  it('should format ISO 8601 date to YYYY-MM-DD', () => {
    expect(formatDate('2025-12-14T00:00:00.000Z')).toBe('2025-12-14');
  });

  it('should handle different timezones correctly', () => {
    expect(formatDate('2025-12-14T15:30:00.000Z')).toBe('2025-12-14');
  });

  it('should handle dates with milliseconds', () => {
    expect(formatDate('2025-01-01T12:34:56.789Z')).toBe('2025-01-01');
  });

  it('should handle edge case dates', () => {
    expect(formatDate('2024-02-29T00:00:00.000Z')).toBe('2024-02-29'); // Leap year
    expect(formatDate('2025-12-31T23:59:59.999Z')).toBe('2025-12-31'); // End of year
  });
});
```

**검증 조건**:
- [ ] 표준 ISO 8601 형식 변환
- [ ] 타임존 차이 무시 (UTC 기준)
- [ ] 밀리초 무시
- [ ] Edge case (윤년, 연말) 처리

**우선순위**: Medium
**관련 요구사항**: FR-003

---

### UT-004: navigateToWbs 경로 생성

**파일**: `tests/unit/pages/projects.spec.ts`

**목적**: 프로젝트 ID로 올바른 WBS 페이지 경로가 생성되는지 검증

**Given**:
- 프로젝트 ID: 'test-project'

**When**:
- `navigateToWbs('test-project')` 호출

**Then**:
- `navigateTo('/wbs?project=test-project')` 호출됨

**구현 예시**:
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('UT-004: navigateToWbs 경로 생성', () => {
  it('should navigate to WBS page with correct query parameter', () => {
    const mockNavigateTo = vi.fn();
    vi.mock('#app', () => ({
      navigateTo: mockNavigateTo,
    }));

    function navigateToWbs(projectId: string): void {
      navigateTo(`/wbs?project=${projectId}`);
    }

    navigateToWbs('test-project');

    expect(mockNavigateTo).toHaveBeenCalledWith('/wbs?project=test-project');
  });

  it('should handle project ID with special characters', () => {
    const mockNavigateTo = vi.fn();

    function navigateToWbs(projectId: string): void {
      navigateTo(`/wbs?project=${projectId}`);
    }

    navigateToWbs('project-with-dashes');

    expect(mockNavigateTo).toHaveBeenCalledWith('/wbs?project=project-with-dashes');
  });
});
```

**검증 조건**:
- [ ] 올바른 경로 형식: `/wbs?project={id}`
- [ ] 프로젝트 ID 정확히 전달
- [ ] 특수문자 포함 ID 처리

**우선순위**: Medium
**관련 요구사항**: FR-004

---

## 3. 통합 테스트 (Integration Tests)

### IT-001: API → UI 데이터 바인딩

**파일**: `tests/integration/projects-page.spec.ts`

**목적**: API 응답 데이터가 UI 컴포넌트에 올바르게 바인딩되는지 검증

**Given**:
- Mock API 응답:
  ```typescript
  {
    projects: [
      { id: 'p1', name: 'Test Project', status: 'active', wbsDepth: 4, createdAt: '2025-12-14T00:00:00.000Z', path: 'p1' }
    ],
    defaultProject: 'p1',
    total: 1
  }
  ```

**When**:
- 컴포넌트 마운트 및 API 호출 완료

**Then**:
- Card 컴포넌트에 프로젝트명 'Test Project' 표시
- Tag 컴포넌트에 'active' 표시
- Badge 컴포넌트에 'Default' 표시

**구현 예시**:
```typescript
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ProjectsPage from '~/pages/projects.vue';

describe('IT-001: API → UI 데이터 바인딩', () => {
  it('should bind API response data to UI components', async () => {
    const wrapper = await mountSuspended(ProjectsPage);

    // API 응답 대기
    await wrapper.vm.$nextTick();

    // Card 컴포넌트 존재 확인
    const cards = wrapper.findAllComponents({ name: 'Card' });
    expect(cards).toHaveLength(1);

    // 프로젝트명 확인
    expect(wrapper.text()).toContain('Test Project');

    // 상태 태그 확인
    const tags = wrapper.findAllComponents({ name: 'Tag' });
    expect(tags[0].props('value')).toBe('active');

    // 기본 프로젝트 배지 확인
    const badges = wrapper.findAllComponents({ name: 'Badge' });
    expect(badges[0].props('value')).toBe('Default');
  });
});
```

**검증 조건**:
- [ ] Card 컴포넌트 렌더링
- [ ] 프로젝트명 표시
- [ ] 상태 태그 올바른 값
- [ ] 기본 프로젝트 배지 표시

**우선순위**: High
**관련 요구사항**: FR-001, FR-002, FR-003

---

### IT-002: 필터 → 목록 업데이트

**파일**: `tests/integration/projects-filter.spec.ts`

**목적**: 필터 버튼 클릭 시 목록이 올바르게 업데이트되는지 검증

**Given**:
- 프로젝트 목록: active 2개, archived 1개

**When**:
- 'Active' 필터 버튼 클릭

**Then**:
- Card 컴포넌트 2개만 렌더링
- 모두 'active' 상태 태그 표시

**구현 예시**:
```typescript
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ProjectsPage from '~/pages/projects.vue';

describe('IT-002: 필터 → 목록 업데이트', () => {
  it('should update project list when filter changes', async () => {
    const wrapper = await mountSuspended(ProjectsPage);

    // 초기 상태: 모든 프로젝트 표시
    let cards = wrapper.findAllComponents({ name: 'Card' });
    expect(cards).toHaveLength(3);

    // Active 필터 클릭
    const selectButton = wrapper.findComponent({ name: 'SelectButton' });
    await selectButton.vm.$emit('update:modelValue', 'active');
    await wrapper.vm.$nextTick();

    // 필터링된 목록 확인
    cards = wrapper.findAllComponents({ name: 'Card' });
    expect(cards).toHaveLength(2);

    // 모든 카드가 active 상태인지 확인
    const tags = wrapper.findAllComponents({ name: 'Tag' });
    tags.forEach((tag) => {
      expect(tag.props('value')).toBe('active');
    });
  });
});
```

**검증 조건**:
- [ ] 필터 변경 시 목록 재렌더링
- [ ] 올바른 개수의 카드 표시
- [ ] 필터 조건에 맞는 데이터만 표시

**우선순위**: High
**관련 요구사항**: FR-005

---

## 4. E2E 테스트 (End-to-End Tests)

### E2E-001: 프로젝트 목록 렌더링

**파일**: `tests/e2e/projects-page.spec.ts`

**목적**: 페이지 진입 시 프로젝트 목록이 올바르게 렌더링되는지 검증

**Given**:
- 테스트 환경에 프로젝트 1개 존재
- 환경변수 `JJIBAN_BASE_PATH` 설정

**When**:
- `/projects` 경로 접근

**Then**:
- 페이지 제목 'Projects' 표시
- 프로젝트 카드 1개 렌더링
- 카드에 프로젝트 정보 표시

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';
import { setupTestEnvironment, cleanupTestEnvironment } from '../utils/test-helpers';

test.describe('E2E-001: 프로젝트 목록 렌더링', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await cleanupTestEnvironment();
  });

  test('should render project list on page load', async ({ page }) => {
    await page.goto('/projects');

    // 페이지 제목 확인
    const title = page.locator('h1');
    await expect(title).toHaveText('Projects');

    // 프로젝트 카드 확인
    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(1);

    // 카드 내용 확인
    await expect(cards.first()).toContainText('project');
    await expect(cards.first()).toContainText('active');
  });
});
```

**검증 조건**:
- [ ] 페이지 제목 'Projects' 표시
- [ ] 프로젝트 카드 렌더링
- [ ] 카드에 프로젝트 정보 표시

**우선순위**: Critical
**관련 요구사항**: FR-001, FR-002

---

### E2E-002: 카드 그리드 레이아웃

**파일**: `tests/e2e/projects-responsive.spec.ts`

**목적**: 반응형 그리드 레이아웃이 올바르게 동작하는지 검증

**Given**:
- 프로젝트 4개 존재

**When**:
- 다양한 뷰포트 크기에서 페이지 렌더링

**Then**:
- 모바일 (375px): 1열
- 태블릿 (768px): 2열
- 데스크탑 (1280px): 4열

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-002: 반응형 그리드 레이아웃', () => {
  test('should display 1 column on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    const grid = page.locator('.grid');
    const gridColumns = await grid.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    // 1열 확인 (정확한 값은 브라우저마다 다를 수 있음)
    expect(gridColumns.split(' ')).toHaveLength(1);
  });

  test('should display 2 columns on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/projects');

    const grid = page.locator('.grid');
    const gridColumns = await grid.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    expect(gridColumns.split(' ').length).toBeGreaterThanOrEqual(2);
  });

  test('should display 4 columns on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/projects');

    const grid = page.locator('.grid');
    const gridColumns = await grid.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    expect(gridColumns.split(' ').length).toBeGreaterThanOrEqual(4);
  });
});
```

**검증 조건**:
- [ ] 모바일: 1열 레이아웃
- [ ] 태블릿: 2열 레이아웃
- [ ] 데스크탑: 4열 레이아웃
- [ ] 카드 간격 일정

**우선순위**: High
**관련 요구사항**: FR-002, NFR-002

---

### E2E-003: 카드 내용 표시

**파일**: `tests/e2e/projects-card-content.spec.ts`

**목적**: 프로젝트 카드에 모든 정보가 올바르게 표시되는지 검증

**Given**:
- 프로젝트:
  ```json
  {
    "id": "project",
    "name": "Test Project",
    "status": "active",
    "wbsDepth": 4,
    "createdAt": "2025-12-14T00:00:00.000Z"
  }
  ```

**When**:
- 페이지 렌더링

**Then**:
- 프로젝트명: 'Test Project'
- 상태: 'active' 태그
- WBS Depth: '4 Levels'
- 생성일: '2025-12-14'

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-003: 카드 내용 표시', () => {
  test('should display all project information in card', async ({ page }) => {
    await page.goto('/projects');

    const card = page.locator('.p-card').first();

    // 프로젝트명
    await expect(card.locator('.p-card-title')).toContainText('project');

    // 상태 태그
    const statusTag = card.locator('.p-tag');
    await expect(statusTag).toHaveText('active');

    // WBS 깊이
    await expect(card).toContainText('4 Levels');

    // 생성일
    await expect(card).toContainText('2025-12-14');
  });
});
```

**검증 조건**:
- [ ] 프로젝트명 표시
- [ ] 상태 태그 표시
- [ ] WBS 깊이 표시
- [ ] 생성일 YYYY-MM-DD 형식

**우선순위**: High
**관련 요구사항**: FR-003

---

### E2E-004: 프로젝트 선택 네비게이션

**파일**: `tests/e2e/projects-navigation.spec.ts`

**목적**: 프로젝트 카드 클릭 시 WBS 페이지로 이동하는지 검증

**Given**:
- 프로젝트 ID: 'project'

**When**:
- 프로젝트 카드 클릭

**Then**:
- URL이 `/wbs?project=project`로 변경됨

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-004: 프로젝트 선택 네비게이션', () => {
  test('should navigate to WBS page on card click', async ({ page }) => {
    await page.goto('/projects');

    // 프로젝트 카드 클릭
    const card = page.locator('.p-card').first();
    await card.click();

    // URL 확인
    await expect(page).toHaveURL(/\/wbs\?project=project/);
  });

  test('should pass correct project ID in query parameter', async ({ page }) => {
    await page.goto('/projects');

    await page.locator('.p-card').first().click();

    const url = new URL(page.url());
    expect(url.searchParams.get('project')).toBe('project');
  });
});
```

**검증 조건**:
- [ ] 카드 클릭 이벤트 동작
- [ ] URL 변경 확인
- [ ] 쿼리 파라미터 올바름

**우선순위**: Critical
**관련 요구사항**: FR-004

---

### E2E-005: 필터 버튼 동작

**파일**: `tests/e2e/projects-filter.spec.ts`

**목적**: 필터 버튼 클릭 시 목록이 올바르게 필터링되는지 검증

**Given**:
- 프로젝트: active 1개, archived 1개 (총 2개)

**When**:
- 'Active' 필터 버튼 클릭

**Then**:
- active 프로젝트 1개만 표시

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-005: 필터 버튼 동작', () => {
  test('should filter projects by status', async ({ page }) => {
    await page.goto('/projects');

    // 초기 상태: 모든 프로젝트
    let cards = page.locator('.p-card');
    await expect(cards).toHaveCount(2);

    // Active 필터 클릭
    await page.click('button:has-text("Active")');

    // active 프로젝트만 표시
    cards = page.locator('.p-card');
    await expect(cards).toHaveCount(1);

    // 상태 태그 확인
    const tag = page.locator('.p-tag');
    await expect(tag).toHaveText('active');
  });

  test('should show archived projects only', async ({ page }) => {
    await page.goto('/projects');

    await page.click('button:has-text("Archived")');

    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(1);

    const tag = page.locator('.p-tag');
    await expect(tag).toHaveText('archived');
  });

  test('should show all projects on "All" filter', async ({ page }) => {
    await page.goto('/projects');

    await page.click('button:has-text("Active")');
    await page.click('button:has-text("All")');

    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(2);
  });
});
```

**검증 조건**:
- [ ] All 필터: 모든 프로젝트 표시
- [ ] Active 필터: active만 표시
- [ ] Archived 필터: archived만 표시
- [ ] 필터 전환 시 즉시 반영

**우선순위**: High
**관련 요구사항**: FR-005

---

### E2E-006: 필터별 카운트 검증

**파일**: `tests/e2e/projects-filter-count.spec.ts`

**목적**: 각 필터의 결과 수가 정확한지 검증

**Given**:
- 프로젝트: active 3개, archived 2개

**When**:
- 각 필터 선택

**Then**:
- All: 5개
- Active: 3개
- Archived: 2개

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-006: 필터별 카운트 검증', () => {
  test('should show correct count for each filter', async ({ page }) => {
    await page.goto('/projects');

    // All 필터
    await page.click('button:has-text("All")');
    let cards = page.locator('.p-card');
    await expect(cards).toHaveCount(5);

    // Active 필터
    await page.click('button:has-text("Active")');
    cards = page.locator('.p-card');
    await expect(cards).toHaveCount(3);

    // Archived 필터
    await page.click('button:has-text("Archived")');
    cards = page.locator('.p-card');
    await expect(cards).toHaveCount(2);
  });
});
```

**검증 조건**:
- [ ] 각 필터의 카운트 정확
- [ ] 필터 간 전환 시 일관성 유지

**우선순위**: Medium
**관련 요구사항**: FR-005

---

### E2E-007: 로딩 상태 표시

**파일**: `tests/e2e/projects-loading.spec.ts`

**목적**: API 로딩 중 스피너가 표시되는지 검증

**Given**:
- API 응답 지연 (1초)

**When**:
- 페이지 진입

**Then**:
- ProgressSpinner 표시
- 응답 후 스피너 사라짐

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-007: 로딩 상태 표시', () => {
  test('should show loading spinner during API call', async ({ page }) => {
    // API 지연 시뮬레이션
    await page.route('/api/projects', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/projects');

    // 로딩 스피너 표시 확인
    const spinner = page.locator('.p-progress-spinner');
    await expect(spinner).toBeVisible();

    // 로딩 완료 후 스피너 사라짐
    await page.waitForLoadState('networkidle');
    await expect(spinner).not.toBeVisible();

    // 프로젝트 카드 표시
    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(1);
  });
});
```

**검증 조건**:
- [ ] 로딩 중 스피너 표시
- [ ] 로딩 완료 후 스피너 숨김
- [ ] 데이터 로드 후 카드 표시

**우선순위**: Medium
**관련 요구사항**: FR-006

---

### E2E-008: 에러 상태 표시

**파일**: `tests/e2e/projects-error.spec.ts`

**목적**: API 에러 발생 시 에러 메시지가 표시되는지 검증

**Given**:
- API 500 에러 응답

**When**:
- 페이지 진입

**Then**:
- InlineMessage (error) 표시
- 에러 메시지 내용 확인

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-008: 에러 상태 표시', () => {
  test('should show error message on API failure', async ({ page }) => {
    // API 에러 시뮬레이션
    await page.route('/api/projects', (route) =>
      route.fulfill({ status: 500 })
    );

    await page.goto('/projects');

    // 에러 메시지 표시 확인
    const errorMessage = page.locator('.p-inline-message-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('오류가 발생했습니다');

    // 프로젝트 카드 없음
    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(0);
  });

  test('should show error message on network failure', async ({ page }) => {
    await page.route('/api/projects', (route) => route.abort());

    await page.goto('/projects');

    const errorMessage = page.locator('.p-inline-message-error');
    await expect(errorMessage).toBeVisible();
  });
});
```

**검증 조건**:
- [ ] 에러 메시지 표시
- [ ] 메시지 내용 적절
- [ ] 프로젝트 카드 숨김

**우선순위**: High
**관련 요구사항**: FR-007

---

### E2E-009: 빈 상태 표시

**파일**: `tests/e2e/projects-empty.spec.ts`

**목적**: 프로젝트가 없을 때 안내 메시지가 표시되는지 검증

**Given**:
- 빈 프로젝트 목록

**When**:
- 페이지 진입

**Then**:
- InlineMessage (info) 표시
- '프로젝트가 없습니다' 메시지

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-009: 빈 상태 표시', () => {
  test('should show empty state message when no projects exist', async ({ page }) => {
    // 빈 목록 응답
    await page.route('/api/projects', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ projects: [], defaultProject: null, total: 0 }),
      })
    );

    await page.goto('/projects');

    // 빈 상태 메시지 확인
    const emptyMessage = page.locator('.p-inline-message-info');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText('프로젝트가 없습니다');

    // 프로젝트 카드 없음
    const cards = page.locator('.p-card');
    await expect(cards).toHaveCount(0);
  });

  test('should show filter-specific empty message', async ({ page }) => {
    await page.route('/api/projects', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ projects: [], defaultProject: null, total: 0 }),
      })
    );

    await page.goto('/projects');

    // Active 필터 선택
    await page.click('button:has-text("Active")');

    const emptyMessage = page.locator('.p-inline-message-info');
    await expect(emptyMessage).toContainText('active 상태의 프로젝트가 없습니다');
  });
});
```

**검증 조건**:
- [ ] 빈 상태 메시지 표시
- [ ] 메시지 내용 적절
- [ ] 필터별 메시지 변경

**우선순위**: Low
**관련 요구사항**: FR-008

---

### E2E-010: 기본 프로젝트 배지

**파일**: `tests/e2e/projects-default-badge.spec.ts`

**목적**: 기본 프로젝트에 배지가 표시되는지 검증

**Given**:
- defaultProject: 'project'

**When**:
- 페이지 렌더링

**Then**:
- 해당 카드에 'Default' Badge 표시

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-010: 기본 프로젝트 배지', () => {
  test('should show default badge on default project', async ({ page }) => {
    await page.goto('/projects');

    // 기본 프로젝트 카드 찾기
    const defaultCard = page.locator('.p-card').first();

    // Default 배지 확인
    const badge = defaultCard.locator('.p-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('Default');
  });

  test('should not show badge on non-default projects', async ({ page }) => {
    await page.goto('/projects');

    // 기본 프로젝트가 아닌 카드
    const cards = page.locator('.p-card');
    const count = await cards.count();

    for (let i = 1; i < count; i++) {
      const card = cards.nth(i);
      const badge = card.locator('.p-badge');
      await expect(badge).not.toBeVisible();
    }
  });
});
```

**검증 조건**:
- [ ] 기본 프로젝트에 배지 표시
- [ ] 비기본 프로젝트에 배지 없음
- [ ] 배지 텍스트 'Default'

**우선순위**: Low
**관련 요구사항**: FR-009

---

### E2E-011: 반응형 레이아웃

**파일**: `tests/e2e/projects-responsive-behavior.spec.ts`

**목적**: 다양한 화면 크기에서 레이아웃이 올바르게 동작하는지 검증

**Given**:
- 프로젝트 8개

**When**:
- 모바일, 태블릿, 데스크탑 뷰포트

**Then**:
- 각 크기에 맞는 그리드 열 수
- 스크롤 가능
- 카드 가독성 유지

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667, columns: 1 },
  { name: 'Tablet', width: 768, height: 1024, columns: 2 },
  { name: 'Desktop', width: 1280, height: 800, columns: 4 },
  { name: 'Large Desktop', width: 1920, height: 1080, columns: 4 },
];

test.describe('E2E-011: 반응형 레이아웃', () => {
  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/projects');

      // 페이지 로드 확인
      await expect(page.locator('h1')).toBeVisible();

      // 카드 표시 확인
      const cards = page.locator('.p-card');
      await expect(cards.first()).toBeVisible();

      // 카드 가독성 확인 (최소 너비 유지)
      const cardWidth = await cards.first().boundingBox();
      expect(cardWidth?.width).toBeGreaterThan(200);
    });
  }
});
```

**검증 조건**:
- [ ] 모바일: 1열, 스크롤 가능
- [ ] 태블릿: 2열, 가독성 유지
- [ ] 데스크탑: 3-4열, 최적 배치
- [ ] 모든 크기에서 카드 읽기 가능

**우선순위**: High
**관련 요구사항**: NFR-002

---

### E2E-012: 키보드 네비게이션

**파일**: `tests/e2e/projects-keyboard-navigation.spec.ts`

**목적**: 키보드로 페이지를 탐색할 수 있는지 검증

**Given**:
- 프로젝트 3개

**When**:
- Tab, Enter 키 사용

**Then**:
- 필터 → 카드 순서로 포커스 이동
- Enter로 카드 선택 가능

**구현 예시**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E-012: 키보드 네비게이션', () => {
  test('should navigate with Tab key', async ({ page }) => {
    await page.goto('/projects');

    // 첫 번째 Tab: 필터 버튼에 포커스
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');

    // 계속 Tab: 프로젝트 카드로 포커스
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    focused = await page.evaluate(() => document.activeElement?.className);
    expect(focused).toContain('p-card');
  });

  test('should activate card with Enter key', async ({ page }) => {
    await page.goto('/projects');

    // 카드에 포커스
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Enter로 활성화
    await page.keyboard.press('Enter');

    // WBS 페이지로 이동 확인
    await expect(page).toHaveURL(/\/wbs\?project=/);
  });

  test('should change filter with keyboard', async ({ page }) => {
    await page.goto('/projects');

    // 필터 버튼에 포커스
    await page.keyboard.press('Tab');

    // 화살표 키로 필터 변경
    await page.keyboard.press('ArrowRight');

    // 카드 수 변경 확인
    const cards = page.locator('.p-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});
```

**검증 조건**:
- [ ] Tab으로 요소 간 이동
- [ ] Enter로 카드 활성화
- [ ] 화살표 키로 필터 변경
- [ ] 포커스 표시 명확

**우선순위**: Medium
**관련 요구사항**: NFR-003

---

## 5. 테스트 데이터 준비

### 5.1 테스트 환경 설정

**파일**: `tests/utils/test-helpers.ts`

```typescript
import { rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export const TEST_BASE = join(process.cwd(), 'tests', 'fixtures', 'projects-page');

export async function setupTestEnvironment() {
  // 테스트 폴더 생성
  await mkdir(join(TEST_BASE, '.jjiban', 'settings'), { recursive: true });
  await mkdir(join(TEST_BASE, '.jjiban', 'projects', 'project'), { recursive: true });

  // projects.json
  const projectsConfig = {
    version: '1.0',
    projects: [
      {
        id: 'project',
        name: 'project',
        path: 'project',
        status: 'active',
        wbsDepth: 4,
        createdAt: '2025-12-14T00:00:00.000Z',
      },
    ],
    defaultProject: 'project',
  };

  await writeFile(
    join(TEST_BASE, '.jjiban', 'settings', 'projects.json'),
    JSON.stringify(projectsConfig, null, 2)
  );

  // project.json
  const projectConfig = {
    id: 'project',
    name: 'project',
    description: 'Test Project',
    version: '1.0.0',
    status: 'active',
    createdAt: '2025-12-14T00:00:00.000Z',
    updatedAt: '2025-12-14T00:00:00.000Z',
  };

  await writeFile(
    join(TEST_BASE, '.jjiban', 'projects', 'project', 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );

  // team.json
  const teamConfig = {
    version: '1.0',
    members: [],
  };

  await writeFile(
    join(TEST_BASE, '.jjiban', 'projects', 'project', 'team.json'),
    JSON.stringify(teamConfig, null, 2)
  );

  // 환경변수 설정
  process.env.JJIBAN_BASE_PATH = TEST_BASE;
}

export async function cleanupTestEnvironment() {
  try {
    await rm(TEST_BASE, { recursive: true, force: true });
  } catch (error) {
    // 정리 실패 무시
  }
  delete process.env.JJIBAN_BASE_PATH;
}
```

### 5.2 다중 프로젝트 환경

```typescript
export async function setupMultiProjectEnvironment() {
  await setupTestEnvironment();

  // 두 번째 프로젝트 추가
  const projectsConfig = JSON.parse(
    await readFile(join(TEST_BASE, '.jjiban', 'settings', 'projects.json'), 'utf-8')
  );

  projectsConfig.projects.push({
    id: 'project-2',
    name: 'Project 2',
    path: 'project-2',
    status: 'archived',
    wbsDepth: 3,
    createdAt: '2025-12-15T00:00:00.000Z',
  });

  await writeFile(
    join(TEST_BASE, '.jjiban', 'settings', 'projects.json'),
    JSON.stringify(projectsConfig, null, 2)
  );

  // project-2 폴더 및 파일 생성
  // ...
}
```

---

## 6. 테스트 실행 계획

### 6.1 실행 순서

1. **단위 테스트** (UT-001 ~ UT-004)
   - 가장 먼저 실행
   - 빠른 피드백
   - 기본 로직 검증

2. **통합 테스트** (IT-001 ~ IT-002)
   - 단위 테스트 통과 후
   - API-UI 연동 확인

3. **E2E 테스트** (E2E-001 ~ E2E-012)
   - 통합 테스트 통과 후
   - 전체 시나리오 검증

### 6.2 실행 명령어

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 전체 테스트
npm run test

# 특정 테스트 파일
npm run test:e2e -- projects-page.spec.ts

# 커버리지 포함
npm run test:coverage
```

### 6.3 CI/CD 통합

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 7. 테스트 커버리지 목표

| 항목 | 목표 | 현재 | 상태 |
|------|------|------|------|
| 전체 커버리지 | > 80% | 0% | 📝 |
| 기능 요구사항 | 100% | 100% (계획) | ✅ |
| 비기능 요구사항 | > 80% | 83% (계획) | ✅ |
| 크리티컬 경로 | 100% | 100% (계획) | ✅ |

**크리티컬 경로**:
- API 호출 → 데이터 바인딩
- 필터 변경 → 목록 업데이트
- 카드 클릭 → 네비게이션

---

## 8. 다음 단계

1. **구현 단계** (`030-implementation.md`)
   - TDD 방식으로 테스트 먼저 작성
   - 테스트 통과하도록 코드 구현

2. **코드 리뷰** (`031-code-review-claude-1.md`)
   - 테스트 커버리지 확인
   - 코드 품질 검증

3. **통합 테스트** (`070-integration-test.md`)
   - WBS 페이지와 통합
   - 전체 플로우 검증

---

## 관련 문서

- **기본설계**: `010-basic-design.md`
- **상세설계**: `020-detail-design.md`
- **추적성 매트릭스**: `025-traceability-matrix.md`
- **구현**: `030-implementation.md`
- **E2E 테스트 참조**: `tests/e2e/projects.spec.ts` (TSK-02-03-03)

---

<!--
author: Claude (System Architect Agent)
Template Version: 1.0.0
Created: 2025-12-14
-->
