# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **설계 규칙**
> * 구현 가능한 수준의 상세 설계
> * 컴포넌트 구조, API 연동, 이벤트 처리 상세 명세
> * 기본설계와의 일관성 유지

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

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.1, 8.1, 10.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-00 |
| API 구현 | `server/api/projects/index.get.ts` | - |
| 타입 정의 | `server/utils/projects/types.ts` | - |

---

## 1. 컴포넌트 구조

### 1.1 파일 구조

```
pages/
  └── projects.vue              # 메인 페이지 컴포넌트

types/
  └── projects.ts              # 프론트엔드 타입 정의 (필요시)
```

### 1.2 컴포넌트 계층

```
ProjectsPage (pages/projects.vue)
  ├── Header Section
  │   ├── Title (h1)
  │   └── FilterButtons (PrimeVue SelectButton)
  │
  ├── Loading State (PrimeVue ProgressSpinner)
  │
  ├── Error State (PrimeVue InlineMessage)
  │
  ├── Empty State (PrimeVue InlineMessage)
  │
  └── Cards Grid
      └── ProjectCard (PrimeVue Card) × N
          ├── Card Title (프로젝트명)
          ├── Status Badge (PrimeVue Tag)
          ├── Default Badge (PrimeVue Badge - 조건부)
          ├── WBS Depth Info
          └── Created Date
```

---

## 2. 템플릿 구조 상세

### 2.1 전체 템플릿 스켈레톤

```vue
<template>
  <div class="projects-page min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
    <!-- 헤더 섹션 -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-6 text-surface-900 dark:text-surface-50">
        Projects
      </h1>

      <!-- 필터 버튼 -->
      <SelectButton
        v-model="filterStatus"
        :options="filterOptions"
        option-label="label"
        option-value="value"
        class="mb-4"
      />
    </div>

    <!-- 로딩 상태 -->
    <div v-if="pending" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <!-- 에러 상태 -->
    <InlineMessage
      v-else-if="error"
      severity="error"
      class="mb-4"
    >
      프로젝트 목록을 불러오는 중 오류가 발생했습니다: {{ error.message }}
    </InlineMessage>

    <!-- 빈 상태 -->
    <InlineMessage
      v-else-if="filteredProjects.length === 0"
      severity="info"
      class="mb-4"
    >
      {{ filterStatus === 'all' ? '프로젝트가 없습니다.' : `${filterStatus} 상태의 프로젝트가 없습니다.` }}
    </InlineMessage>

    <!-- 프로젝트 카드 그리드 -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <Card
        v-for="project in filteredProjects"
        :key="project.id"
        class="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="navigateToWbs(project.id)"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-xl font-semibold">{{ project.name }}</span>
            <Badge
              v-if="project.id === defaultProject"
              value="Default"
              severity="success"
            />
          </div>
        </template>

        <template #content>
          <div class="space-y-3">
            <!-- 상태 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-surface-600 dark:text-surface-400">Status:</span>
              <Tag
                :value="project.status"
                :severity="project.status === 'active' ? 'success' : 'secondary'"
              />
            </div>

            <!-- WBS 깊이 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-surface-600 dark:text-surface-400">WBS Depth:</span>
              <span class="text-sm font-medium">{{ project.wbsDepth }} Levels</span>
            </div>

            <!-- 생성일 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-surface-600 dark:text-surface-400">Created:</span>
              <span class="text-sm">{{ formatDate(project.createdAt) }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
```

### 2.2 PrimeVue 컴포넌트 Props 명세

#### SelectButton (필터)
```typescript
{
  modelValue: 'all' | 'active' | 'archived',
  options: [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' }
  ],
  optionLabel: 'label',
  optionValue: 'value'
}
```

#### Card (프로젝트 카드)
```typescript
{
  // 슬롯 사용: #title, #content
  // 이벤트: @click
  class: 'cursor-pointer hover:shadow-lg transition-shadow duration-200'
}
```

#### Tag (상태 배지)
```typescript
{
  value: 'active' | 'archived',
  severity: 'success' | 'secondary'  // active: success, archived: secondary
}
```

#### Badge (기본 프로젝트 표시)
```typescript
{
  value: 'Default',
  severity: 'success'
}
```

#### ProgressSpinner (로딩)
```typescript
{
  // 기본 props 사용
}
```

#### InlineMessage (에러/빈 상태)
```typescript
{
  severity: 'error' | 'info',
  // 슬롯으로 메시지 내용 전달
}
```

---

## 3. 스크립트 구조 상세

### 3.1 전체 스크립트 코드

```typescript
<script setup lang="ts">
import type { ProjectListResponse, ProjectListItem } from '~/server/utils/projects/types';

/**
 * Projects Page
 *
 * @see TSK-04-00
 * @see 010-basic-design.md
 */

// ============================================================
// API 호출
// ============================================================

const {
  data,
  pending,
  error,
  refresh,
} = await useFetch<ProjectListResponse>('/api/projects', {
  key: 'projects-list',
  timeout: 5000, // 5초 타임아웃 (C-002)
  retry: 2, // 2회 재시도 (C-002)
  retryDelay: 1000, // 1초 간격 (C-002)
});

// ============================================================
// 상태 관리
// ============================================================

// 필터 상태
const filterStatus = ref<'all' | 'active' | 'archived'>('all');

// 필터 옵션
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
] as const;

// ============================================================
// Computed Properties
// ============================================================

// 기본 프로젝트 ID
const defaultProject = computed(() => data.value?.defaultProject ?? null);

// 필터링된 프로젝트 목록
const filteredProjects = computed<ProjectListItem[]>(() => {
  if (!data.value?.projects) return [];

  if (filterStatus.value === 'all') {
    return data.value.projects;
  }

  return data.value.projects.filter(
    (project) => project.status === filterStatus.value
  );
});

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * ISO 8601 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

// ============================================================
// 이벤트 핸들러
// ============================================================

/**
 * WBS 페이지로 이동
 */
function navigateToWbs(projectId: string): void {
  navigateTo(`/wbs?project=${projectId}`);
}
</script>
```

### 3.2 타입 정의

기존 `server/utils/projects/types.ts`를 재사용:

```typescript
// 이미 정의된 타입 import
import type { ProjectListResponse, ProjectListItem } from '~/server/utils/projects/types';

// 추가 프론트엔드 타입 (필요시)
type FilterStatus = 'all' | 'active' | 'archived';

interface FilterOption {
  label: string;
  value: FilterStatus;
}
```

---

## 4. API 연동 상세

### 4.1 useFetch 설정

```typescript
const {
  data,       // Ref<ProjectListResponse | null>
  pending,    // Ref<boolean>
  error,      // Ref<Error | null>
  refresh,    // () => Promise<void> - 재시도용 (C-002)
} = await useFetch<ProjectListResponse>('/api/projects', {
  key: 'projects-list',  // 캐시 키
  timeout: 5000,         // 5초 타임아웃 (C-002)
  retry: 2,              // 2회 재시도 (C-002)
  retryDelay: 1000,      // 1초 간격 (C-002)
});
```

**설정 근거**:
- `key`: 동일 데이터 재사용 및 캐싱 활성화
- `await`: SSR 시 서버에서 데이터 미리 로드
- 타입 파라미터: API 응답 타입 명시로 타입 안전성 확보

### 4.2 API 응답 구조

**Endpoint**: `GET /api/projects`

**Response**:
```typescript
{
  projects: [
    {
      id: "jjiban",
      name: "jjiban",
      path: "jjiban",
      status: "active",
      wbsDepth: 4,
      createdAt: "2025-12-13T00:00:00.000Z"
    },
    // ...
  ],
  defaultProject: "jjiban",
  total: 1
}
```

### 4.3 에러 처리

```typescript
// 1. 템플릿에서 error 상태 표시
<InlineMessage v-if="error" severity="error">
  프로젝트 목록을 불러오는 중 오류가 발생했습니다: {{ error.message }}
</InlineMessage>

// 2. 에러 발생 시나리오:
// - 네트워크 오류
// - 파일 시스템 읽기 실패
// - JSON 파싱 오류
// - 서버 오류 (500)
```

### 4.4 로딩 상태

```typescript
// pending: true → 로딩 중
<div v-if="pending">
  <ProgressSpinner />
</div>

// pending: false → 로딩 완료
// data 또는 error 상태로 분기
```

---

## 5. 상태 관리 상세

### 5.1 로컬 상태 (Ref)

```typescript
// filterStatus: 현재 선택된 필터
const filterStatus = ref<'all' | 'active' | 'archived'>('all');
```

**Pinia 사용하지 않는 이유**:
- 단순 페이지 레벨 상태
- 다른 컴포넌트와 공유 불필요
- 페이지 이동 시 상태 초기화 허용

### 5.2 Computed Properties

#### filteredProjects

```typescript
const filteredProjects = computed<ProjectListItem[]>(() => {
  if (!data.value?.projects) return [];

  if (filterStatus.value === 'all') {
    return data.value.projects;
  }

  return data.value.projects.filter(
    (project) => project.status === filterStatus.value
  );
});
```

**로직**:
1. 데이터 없으면 빈 배열 반환
2. `all` 필터 → 전체 프로젝트
3. `active` / `archived` → 해당 상태만 필터링

**성능 고려**:
- `computed`로 캐싱 → 필터 변경 시에만 재계산
- 프로젝트 수가 적으므로 클라이언트 필터링 적합

#### defaultProject

```typescript
const defaultProject = computed(() => data.value?.defaultProject ?? null);
```

**용도**: 기본 프로젝트 배지 표시 여부 판단

---

## 6. UI 인터랙션 상세

### 6.1 필터 버튼 클릭

**동작**:
```
[User]
  → SelectButton 클릭
  → v-model (filterStatus) 값 변경
  → filteredProjects computed 재계산
  → 카드 그리드 자동 업데이트
```

**상태 변화**:
- `filterStatus`: 'all' → 'active' (예시)
- `filteredProjects`: 전체 목록 → active 프로젝트만

### 6.2 프로젝트 카드 클릭

**동작**:
```
[User]
  → Card 클릭
  → @click="navigateToWbs(project.id)" 실행
  → navigateTo('/wbs?project={id}') 호출
  → WBS 페이지로 라우팅
```

**함수 구현**:
```typescript
function navigateToWbs(projectId: string): void {
  navigateTo(`/wbs?project=${projectId}`);
}
```

**타입 안전성**:
- `projectId`: `string` 타입 보장 (TypeScript)
- 잘못된 ID로 인한 런타임 에러 방지 (WBS 페이지에서 검증)

### 6.3 키보드 네비게이션

**지원 계획** (초기 버전에서는 미구현, 향후 추가):
- Tab: 카드 간 포커스 이동
- Enter/Space: 포커스된 카드 선택
- 화살표 키: 그리드 네비게이션

**현재 구현**:
- Card에 `cursor-pointer` 클래스로 클릭 가능 표시
- 키보드 네비게이션은 브라우저 기본 동작 활용

---

## 7. 스타일링 상세

### 7.1 레이아웃

#### 컨테이너
```css
.projects-page {
  min-height: 100vh;              /* 전체 화면 높이 */
  background: theme('colors.surface.50');  /* 라이트 모드 */
  background (dark): theme('colors.surface.900'); /* 다크 모드 */
  padding: 1.5rem;                 /* 전체 패딩 */
}
```

#### 그리드
```css
grid-cols-1              /* 모바일: 1열 */
md:grid-cols-2           /* 태블릿: 2열 (768px~) */
lg:grid-cols-3           /* 데스크탑: 3열 (1024px~) */
xl:grid-cols-4           /* 대형: 4열 (1280px~) */
gap-6                    /* 카드 간격: 1.5rem */
```

### 7.2 카드 스타일

```css
/* Card 컴포넌트 */
.p-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
}

.p-card:hover {
  box-shadow: theme('boxShadow.lg');
}

/* 카드 내부 간격 */
.space-y-3 > * + * {
  margin-top: 0.75rem;
}
```

### 7.3 텍스트 스타일

```css
/* 제목 */
h1 {
  font-size: 2.25rem;      /* text-4xl */
  font-weight: 700;         /* font-bold */
  margin-bottom: 1.5rem;    /* mb-6 */
  color: theme('colors.surface.900');  /* dark:text-surface-50 */
}

/* 카드 제목 */
.p-card-title span {
  font-size: 1.25rem;       /* text-xl */
  font-weight: 600;          /* font-semibold */
}

/* 라벨 */
.text-sm.text-surface-600 {
  font-size: 0.875rem;
  color: theme('colors.surface.600');
}
```

### 7.4 다크 모드 대응

**TailwindCSS `dark:` 클래스 사용**:
```vue
<div class="bg-surface-50 dark:bg-surface-900">
  <h1 class="text-surface-900 dark:text-surface-50">Projects</h1>
  <span class="text-surface-600 dark:text-surface-400">Status:</span>
</div>
```

**PrimeVue 자동 다크 모드**:
- PrimeVue 컴포넌트는 테마 설정에 따라 자동 변경
- `nuxt.config.ts`에서 Dark Blue 테마 적용됨

---

## 8. 테스트 시나리오

### 8.1 단위 테스트 (Vitest)

테스트 대상: `formatDate` 유틸리티 함수

```typescript
describe('formatDate', () => {
  it('should format ISO 8601 date to YYYY-MM-DD', () => {
    expect(formatDate('2025-12-14T00:00:00.000Z')).toBe('2025-12-14');
  });

  it('should handle different timezones', () => {
    expect(formatDate('2025-12-14T15:30:00.000Z')).toBe('2025-12-14');
  });
});
```

### 8.2 E2E 테스트 (Playwright)

**시나리오 1: 프로젝트 목록 렌더링**
```typescript
test('E2E-001: 프로젝트 목록 페이지 렌더링', async ({ page }) => {
  await page.goto('/projects');

  // 제목 확인
  await expect(page.locator('h1')).toHaveText('Projects');

  // 프로젝트 카드 존재 확인
  const cards = page.locator('.p-card');
  await expect(cards).toHaveCount(1); // 테스트 데이터 1개 가정
});
```

**시나리오 2: 필터 동작**
```typescript
test('E2E-002: 상태 필터 동작', async ({ page }) => {
  await page.goto('/projects');

  // Active 필터 클릭
  await page.click('button:has-text("Active")');

  // active 상태 프로젝트만 표시
  const tags = page.locator('.p-tag');
  await expect(tags).toHaveText('active');
});
```

**시나리오 3: 프로젝트 선택 및 네비게이션**
```typescript
test('E2E-003: 프로젝트 카드 클릭 시 WBS 페이지 이동', async ({ page }) => {
  await page.goto('/projects');

  // 프로젝트 카드 클릭
  await page.click('.p-card');

  // URL 확인
  await expect(page).toHaveURL(/\/wbs\?project=.+/);
});
```

**시나리오 4: 로딩 상태**
```typescript
test('E2E-004: 로딩 상태 표시', async ({ page }) => {
  // 네트워크 지연 시뮬레이션
  await page.route('/api/projects', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });

  await page.goto('/projects');

  // 로딩 스피너 표시 확인
  await expect(page.locator('.p-progress-spinner')).toBeVisible();
});
```

**시나리오 5: 에러 상태**
```typescript
test('E2E-005: API 에러 시 에러 메시지 표시', async ({ page }) => {
  // API 에러 시뮬레이션
  await page.route('/api/projects', (route) =>
    route.fulfill({ status: 500 })
  );

  await page.goto('/projects');

  // 에러 메시지 표시 확인
  await expect(page.locator('.p-inline-message')).toContainText('오류가 발생했습니다');
});
```

**시나리오 6: 빈 상태**
```typescript
test('E2E-006: 프로젝트 없을 때 빈 상태 메시지', async ({ page }) => {
  // 빈 목록 응답
  await page.route('/api/projects', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ projects: [], defaultProject: null, total: 0 }),
    })
  );

  await page.goto('/projects');

  // 빈 상태 메시지 확인
  await expect(page.locator('.p-inline-message')).toContainText('프로젝트가 없습니다');
});
```

---

## 9. 성능 최적화

### 9.1 useFetch 최적화

```typescript
useFetch('/api/projects', {
  key: 'projects-list',  // 캐싱 활성화
});
```

**효과**:
- 같은 키로 재요청 시 캐시 사용
- 페이지 재방문 시 즉시 표시 (stale-while-revalidate)

### 9.2 Computed 캐싱

```typescript
const filteredProjects = computed(() => {
  // 필터 변경 시에만 재계산
});
```

**효과**:
- 의존성(`filterStatus`, `data`) 변경 시에만 실행
- 불필요한 렌더링 방지

### 9.3 CSS Grid 반응형

```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

**효과**:
- 화면 크기에 따라 최적 열 수 자동 조정
- JavaScript 없이 순수 CSS로 반응형 구현

### 9.4 v-for 최적화

```vue
<Card
  v-for="project in filteredProjects"
  :key="project.id"
>
```

**효과**:
- `key`로 Vue의 Virtual DOM diff 최적화
- 프로젝트 추가/삭제 시 효율적 렌더링

---

## 10. 접근성 (Accessibility)

### 10.1 시맨틱 HTML

```html
<h1>Projects</h1>              <!-- 페이지 제목 -->
<div role="region">            <!-- 필터 영역 (PrimeVue 자동) -->
<div role="list">              <!-- 프로젝트 목록 (암시적) -->
```

### 10.2 키보드 접근성

- **Tab**: 필터 버튼 → 프로젝트 카드 순차 이동
- **Enter/Space**: 선택된 요소 활성화
- **Escape**: 포커스 해제 (브라우저 기본)

**PrimeVue 자동 지원**:
- SelectButton, Card 등 자동 키보드 네비게이션
- ARIA 속성 자동 추가

### 10.3 스크린 리더

```html
<!-- 자동 생성 ARIA 속성 -->
<button role="button" aria-pressed="true">All</button>
<div role="status" aria-live="polite">로딩 중...</div>
<div role="alert">오류 발생</div>
```

### 10.4 포커스 표시

```css
/* PrimeVue 기본 포커스 스타일 */
.p-card:focus {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}
```

---

## 11. 에러 처리 시나리오

### 11.1 네트워크 오류

**발생 상황**: API 호출 실패 (네트워크 단절, 서버 다운)

**처리**:
```vue
<InlineMessage v-if="error" severity="error">
  프로젝트 목록을 불러오는 중 오류가 발생했습니다: {{ error.message }}
</InlineMessage>
```

**개선 방향** (2차):
- 재시도 버튼 추가
- 오프라인 모드 안내

### 11.2 빈 데이터

**발생 상황**: `projects: []`

**처리**:
```vue
<InlineMessage v-if="filteredProjects.length === 0" severity="info">
  프로젝트가 없습니다.
</InlineMessage>
```

**개선 방향** (2차):
- 프로젝트 생성 버튼 추가
- 안내 메시지에 다음 단계 제시

### 11.3 잘못된 데이터 형식

**발생 상황**: API 응답이 `ProjectListResponse` 타입과 불일치

**처리**:
- TypeScript 타입 체크로 컴파일 시점 방지
- 런타임 에러는 `error` 상태로 처리

**개선 방향** (2차):
- Zod 등 런타임 스키마 검증 도입

### 11.4 부분 실패

**발생 상황**: 일부 프로젝트 정보 누락

**처리**:
- 현재: 누락 시 전체 요청 실패
- 개선: 유효한 프로젝트만 표시, 경고 메시지

---

## 12. 개선 방향 (2차 개발)

### 12.1 추가 기능

- [ ] **검색 기능**: 프로젝트명 필터링
- [ ] **정렬 기능**: 이름, 생성일, 상태별 정렬
- [ ] **페이지네이션**: 프로젝트 수 많을 때 대응
- [ ] **프로젝트 생성**: 목록 페이지에서 직접 생성
- [ ] **프로젝트 관리**: 수정/삭제 버튼

### 12.2 UX 개선

- [ ] **카드 애니메이션**: 진입 시 fade-in 효과
- [ ] **상태 전환 애니메이션**: 필터 변경 시 부드러운 전환
- [ ] **로딩 스켈레톤**: 스피너 대신 카드 형태 스켈레톤
- [ ] **툴팁**: 프로젝트 정보 상세 미리보기

### 12.3 성능 개선

- [ ] **가상 스크롤**: 프로젝트 수 많을 때 (100개 이상)
- [ ] **이미지 레이지 로딩**: 프로젝트 썸네일 추가 시
- [ ] **무한 스크롤**: 페이지네이션 대안

---

## 13. 검증 체크리스트

### 13.1 기능 검증

- [ ] GET /api/projects API 정상 호출
- [ ] 프로젝트 목록 카드 형태로 표시
- [ ] 필터 버튼 동작 (All/Active/Archived)
- [ ] 프로젝트 카드 클릭 시 WBS 페이지 이동
- [ ] 기본 프로젝트 배지 표시
- [ ] 로딩 상태 스피너 표시
- [ ] 에러 메시지 표시
- [ ] 빈 상태 메시지 표시

### 13.2 코드 품질

- [ ] TypeScript 타입 모두 명시
- [ ] PrimeVue 컴포넌트만 사용 (일반 HTML 금지)
- [ ] Composition API (`<script setup>`) 사용
- [ ] ESLint/Prettier 규칙 통과
- [ ] 주석 및 문서화 적절

### 13.3 테스트

- [ ] 단위 테스트 작성 (formatDate)
- [ ] E2E 테스트 작성 (6개 시나리오)
- [ ] 테스트 커버리지 > 80%

### 13.4 UI/UX

- [ ] 반응형 레이아웃 동작 (모바일~대형 화면)
- [ ] 다크 모드 정상 동작
- [ ] 키보드 네비게이션 가능
- [ ] 포커스 표시 명확
- [ ] 호버 효과 부드러움

---

## 14. 관련 문서

- **기본설계**: `010-basic-design.md`
- **추적성 매트릭스**: `025-traceability-matrix.md`
- **테스트 명세**: `026-test-specification.md`
- **구현**: `030-implementation.md` (다음 단계)
- **API 소스**: `server/api/projects/index.get.ts`
- **타입 정의**: `server/utils/projects/types.ts`

---

## 부록

### A. TailwindCSS 클래스 참조

| 클래스 | 용도 | 값 |
|--------|------|-----|
| `min-h-screen` | 최소 높이 | 100vh |
| `bg-surface-50` | 배경색 (라이트) | theme('colors.surface.50') |
| `dark:bg-surface-900` | 배경색 (다크) | theme('colors.surface.900') |
| `p-6` | 패딩 | 1.5rem |
| `grid` | 그리드 레이아웃 | display: grid |
| `gap-6` | 그리드 간격 | 1.5rem |
| `cursor-pointer` | 커서 모양 | pointer |
| `hover:shadow-lg` | 호버 그림자 | 큰 그림자 |
| `transition-shadow` | 전환 효과 | box-shadow 전환 |

### B. PrimeVue 컴포넌트 임포트

```typescript
// 자동 임포트 (Nuxt PrimeVue 모듈)
// 필요 시 명시적 임포트:
import SelectButton from 'primevue/selectbutton';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import InlineMessage from 'primevue/inlinemessage';
```

### C. API 타입 전체 정의

```typescript
// server/utils/projects/types.ts 참조
export interface ProjectListResponse {
  projects: ProjectListItem[];
  defaultProject: string | null;
  total: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'archived';
  wbsDepth: 3 | 4;
  createdAt: string; // ISO 8601
}
```

---

<!--
author: Claude (System Architect Agent)
Template Version: 1.0.0
Created: 2025-12-14
-->
