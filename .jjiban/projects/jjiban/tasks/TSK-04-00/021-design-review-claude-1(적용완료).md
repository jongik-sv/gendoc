# 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **리뷰 목적**
> * 설계 품질 및 SOLID 원칙 준수 검증
> * 기술 부채 및 개선 기회 식별
> * jjiban 프로젝트 규칙 준수 확인
> * 테스트 명세 완전성 검증

---

## 0. 리뷰 요약

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-00 |
| Task명 | Projects Page |
| 리뷰 일시 | 2025-12-14 |
| 리뷰어 | Claude (Refactoring Expert Agent) |
| 전체 평가 등급 | **A-** (Excellent with Minor Improvements) |

### 종합 평가

**강점**:
- 명확한 단일 책임 원칙(SRP) 준수
- 완전한 타입 안전성 (TypeScript)
- PrimeVue 컴포넌트 일관적 사용
- 포괄적인 테스트 커버리지 (100% 요구사항)
- 잘 구조화된 문서화

**개선 영역**:
- 유틸리티 함수 재사용성 부족
- 성능 측정 도구 미정의
- 접근성 검증 자동화 필요
- 에러 처리 세분화 필요

**권고사항**: 3개 필수, 5개 권장, 4개 선택 개선사항 식별

---

## 1. 설계 품질 분석

### 1.1 SOLID 원칙 준수

#### 1.1.1 단일 책임 원칙 (Single Responsibility Principle)

**등급**: A

**분석**:
```
ProjectsPage 컴포넌트 책임:
1. API 호출 및 데이터 페칭 (useFetch)
2. 필터 상태 관리 (filterStatus)
3. UI 렌더링 (템플릿)
4. 네비게이션 처리 (navigateToWbs)
```

**준수 사항**:
- 페이지 컴포넌트로서 적절한 책임 범위
- 인라인 서브컴포넌트 (FilterButtons, ProjectCard) 재사용성 낮음을 인정
- 비즈니스 로직과 UI 로직 적절히 분리

**개선 기회**:
```typescript
// 현재: 모든 로직이 pages/projects.vue에 집중
// 권장: 유틸리티 함수 분리

// utils/date.ts
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

// composables/useProjectFilter.ts
export function useProjectFilter(projects: Ref<ProjectListItem[]>) {
  const filterStatus = ref<'all' | 'active' | 'archived'>('all');

  const filteredProjects = computed(() => {
    if (!projects.value) return [];
    if (filterStatus.value === 'all') return projects.value;
    return projects.value.filter(p => p.status === filterStatus.value);
  });

  return { filterStatus, filteredProjects };
}
```

**결론**: SRP 준수. 단, 유틸리티 함수 재사용성 향상 권장.

---

#### 1.1.2 개방-폐쇄 원칙 (Open-Closed Principle)

**등급**: B+

**분석**:

**현재 설계의 확장성**:
```typescript
// 필터 옵션 - 하드코딩되어 있지만 확장 가능
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
] as const;
```

**개선 권장**:
```typescript
// 확장 가능한 필터 시스템
interface FilterOption<T extends string = string> {
  label: string;
  value: T;
  predicate: (project: ProjectListItem) => boolean;
}

const filterOptions: FilterOption[] = [
  {
    label: 'All',
    value: 'all',
    predicate: () => true
  },
  {
    label: 'Active',
    value: 'active',
    predicate: (p) => p.status === 'active'
  },
  {
    label: 'Archived',
    value: 'archived',
    predicate: (p) => p.status === 'archived'
  },
];

// 향후 쉽게 추가 가능
// { label: 'WBS 4단계', value: 'wbs4', predicate: (p) => p.wbsDepth === 4 }
```

**카드 렌더링 확장성**:
- 현재: 고정된 카드 레이아웃
- 향후 추가 가능: 카드 타입 (compact, detailed, grid)
- 권장: 카드 렌더링을 별도 컴포넌트로 분리 (2차 개발 시)

**결론**: 기본 확장성 확보. 필터 시스템 개선 권장.

---

#### 1.1.3 리스코프 치환 원칙 (Liskov Substitution Principle)

**등급**: N/A (상속 미사용)

**분석**:
- Vue 3 Composition API 사용으로 상속보다 조합(Composition) 선호
- 클래스 계층 구조 없음
- LSP 위반 가능성 없음

**결론**: 해당 없음. 조합 기반 설계로 LSP 문제 회피.

---

#### 1.1.4 인터페이스 분리 원칙 (Interface Segregation Principle)

**등급**: A

**분석**:

**타입 정의 적절성**:
```typescript
// 명확하게 분리된 타입
interface ProjectListResponse {
  projects: ProjectListItem[];
  defaultProject: string | null;
  total: number;
}

interface ProjectListItem {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'archived';
  wbsDepth: 3 | 4;
  createdAt: string;
}
```

**강점**:
- API 응답과 개별 프로젝트 아이템 타입 분리
- 필요한 필드만 포함 (과도한 인터페이스 없음)
- Union 타입으로 명확한 제약 (`status`, `wbsDepth`)

**결론**: ISP 완전 준수. 타입 정의 우수.

---

#### 1.1.5 의존성 역전 원칙 (Dependency Inversion Principle)

**등급**: B

**분석**:

**현재 의존성**:
```
ProjectsPage
  ↓ (직접 의존)
useFetch('/api/projects')
  ↓
server/api/projects/index.get.ts
```

**개선 권장**:
```typescript
// 현재: API 엔드포인트 하드코딩
useFetch('/api/projects', { key: 'projects-list' });

// 권장: API 추상화 레이어
// composables/useProjectsApi.ts
export function useProjectsApi() {
  const config = useRuntimeConfig();

  return {
    async fetchProjects() {
      return useFetch<ProjectListResponse>(`${config.public.apiBase}/projects`, {
        key: 'projects-list',
      });
    },
  };
}

// pages/projects.vue
const { fetchProjects } = useProjectsApi();
const { data, pending, error } = await fetchProjects();
```

**장점**:
- API 엔드포인트 변경 시 한 곳만 수정
- 테스트 시 API Mock 용이
- 환경별 API Base URL 관리 가능

**현재 설계의 정당성**:
- 단일 API 호출만 존재
- 복잡도가 낮아 직접 의존 허용 가능
- Nuxt `useFetch`가 이미 추상화 제공

**결론**: DIP 부분 준수. API 계층 추상화는 선택적 개선.

---

### 1.2 컴포넌트 구조

#### 1.2.1 계층 구조 명확성

**등급**: A

**분석**:
```
ProjectsPage (pages/projects.vue)
  ├── Header Section
  │   ├── Title (h1) ✓
  │   └── FilterButtons (SelectButton) ✓
  │
  ├── Loading State (ProgressSpinner) ✓
  ├── Error State (InlineMessage) ✓
  ├── Empty State (InlineMessage) ✓
  │
  └── Cards Grid
      └── ProjectCard (Card × N) ✓
          ├── Title + Badge ✓
          ├── Status Tag ✓
          ├── WBS Depth ✓
          └── Created Date ✓
```

**강점**:
- 명확한 조건부 렌더링 (`v-if` 체인)
- 상태별 UI 분기 (loading → error → empty → content)
- 플랫한 구조로 복잡도 낮음

**개선 제안**:
```vue
<!-- 현재: 조건부 렌더링 체인 -->
<div v-if="pending">...</div>
<div v-else-if="error">...</div>
<div v-else-if="filteredProjects.length === 0">...</div>
<div v-else>...</div>

<!-- 권장: 상태 기반 컴포넌트 (2차 개발 시) -->
<component :is="currentStateComponent" />

<script>
const currentStateComponent = computed(() => {
  if (pending.value) return 'LoadingState';
  if (error.value) return 'ErrorState';
  if (filteredProjects.value.length === 0) return 'EmptyState';
  return 'ProjectsGrid';
});
</script>
```

**결론**: 구조 명확. 현재 복잡도에서는 최적.

---

#### 1.2.2 인라인 vs 분리 컴포넌트

**등급**: A

**분석**:

**인라인 결정의 적절성**:
```typescript
// 기본설계 섹션 3.2
"재사용성이 낮으므로 초기에는 인라인으로 구현.
 이후 재사용 필요 시 별도 컴포넌트로 분리."
```

**YAGNI 원칙 준수** (You Aren't Gonna Need It):
- ProjectCard: 프로젝트 페이지에서만 사용
- FilterButtons: 현재 단일 페이지 전용
- EmptyState: 간단한 메시지 표시

**분리 시점 기준 (향후)**:
- 3회 이상 재사용 발생 시
- 50줄 이상 코드 복잡도
- 독립적인 상태 관리 필요 시

**결론**: 인라인 결정 적절. 과도한 추상화 회피.

---

#### 1.2.3 Props vs Slots

**등급**: A

**분석**:

**PrimeVue Card 슬롯 활용**:
```vue
<Card>
  <template #title>
    <div class="flex items-center justify-between">
      <span>{{ project.name }}</span>
      <Badge v-if="project.id === defaultProject" />
    </div>
  </template>

  <template #content>
    <!-- 프로젝트 정보 -->
  </template>
</Card>
```

**강점**:
- 슬롯으로 유연한 레이아웃
- PrimeVue 패턴 준수
- 확장 가능한 구조

**결론**: 슬롯 활용 적절.

---

### 1.3 데이터 흐름

#### 1.3.1 단방향 데이터 흐름

**등급**: A

**분석**:
```
[API Response]
      ↓
  data.value (Ref)
      ↓
filteredProjects (Computed)
      ↓
  [Template Rendering]
      ↓
[User Interaction] → filterStatus.value 변경
      ↓
filteredProjects 재계산
      ↓
  [Re-render]
```

**강점**:
- 명확한 단방향 흐름
- Computed로 자동 반응성
- 상태 변화 예측 가능

**결론**: Vue 3 반응성 시스템 올바르게 활용.

---

#### 1.3.2 상태 관리

**등급**: A

**분석**:

**Pinia 미사용 정당성**:
```typescript
// 020-detail-design.md 섹션 5.1
"Pinia 사용하지 않는 이유:
- 단순 페이지 레벨 상태
- 다른 컴포넌트와 공유 불필요
- 페이지 이동 시 상태 초기화 허용"
```

**로컬 상태 관리**:
- `filterStatus`: ref (사용자 입력)
- `data`: useFetch 반환 (API 상태)
- `filteredProjects`: computed (파생 상태)

**복잡도 평가**:
- McCabe Cyclomatic Complexity: ~5 (단순)
- 상태 변수: 2개 (filterStatus, data)
- 상태 전환: 선형 (복잡한 FSM 없음)

**결론**: 상태 관리 적절. Pinia 불필요.

---

#### 1.3.3 사이드 이펙트 관리

**등급**: B+

**분석**:

**현재 사이드 이펙트**:
```typescript
// 1. API 호출
await useFetch('/api/projects');

// 2. 네비게이션
function navigateToWbs(projectId: string) {
  navigateTo(`/wbs?project=${projectId}`);
}
```

**개선 권장** (에러 처리):
```typescript
// 현재: 에러 발생 시 메시지만 표시
<InlineMessage v-if="error">
  {{ error.message }}
</InlineMessage>

// 권장: 구조화된 에러 처리
interface ErrorState {
  type: 'network' | 'server' | 'unknown';
  message: string;
  canRetry: boolean;
}

const errorState = computed<ErrorState | null>(() => {
  if (!error.value) return null;

  if (error.value.statusCode === 500) {
    return {
      type: 'server',
      message: '서버 오류가 발생했습니다.',
      canRetry: true,
    };
  }

  return {
    type: 'unknown',
    message: error.value.message,
    canRetry: false,
  };
});
```

**결론**: 사이드 이펙트 명확. 에러 처리 세분화 권장.

---

### 1.4 에러 처리

#### 1.4.1 에러 처리 전략

**등급**: B

**분석**:

**현재 커버리지**:
```typescript
// 020-detail-design.md 섹션 11
✓ 네트워크 오류 (11.1)
✓ 빈 데이터 (11.2)
△ 잘못된 데이터 형식 (11.3) - 런타임 검증 부재
△ 부분 실패 (11.4) - 전체 실패로 처리
```

**누락 시나리오**:
1. **타임아웃**: API 응답 지연 시 처리 미정의
2. **부분 응답**: 일부 프로젝트 메타데이터 누락 시 처리
3. **재시도 로직**: 일시적 네트워크 오류 복구

**권장 개선**:
```typescript
// useFetch 타임아웃 설정
const { data, pending, error } = await useFetch('/api/projects', {
  key: 'projects-list',
  timeout: 5000, // 5초 타임아웃
  retry: 2, // 2회 재시도
  retryDelay: 1000, // 1초 간격
});

// 런타임 스키마 검증 (Zod)
import { z } from 'zod';

const ProjectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  status: z.enum(['active', 'archived']),
  wbsDepth: z.union([z.literal(3), z.literal(4)]),
  createdAt: z.string().datetime(),
});

const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectListItemSchema),
  defaultProject: z.string().nullable(),
  total: z.number(),
});

// 응답 검증
try {
  const validated = ProjectListResponseSchema.parse(data.value);
} catch (error) {
  // 검증 실패 처리
}
```

**결론**: 기본 에러 처리 완료. 타임아웃 및 스키마 검증 권장.

---

#### 1.4.2 에러 메시지 품질

**등급**: B+

**분석**:

**현재 메시지**:
```vue
<InlineMessage v-if="error" severity="error">
  프로젝트 목록을 불러오는 중 오류가 발생했습니다: {{ error.message }}
</InlineMessage>
```

**개선 권장** (사용자 친화적 메시지):
```typescript
const errorMessages = {
  network: {
    title: '네트워크 연결 오류',
    message: '인터넷 연결을 확인해주세요.',
    action: '다시 시도',
  },
  server: {
    title: '서버 오류',
    message: '잠시 후 다시 시도해주세요.',
    action: '새로고침',
  },
  timeout: {
    title: '요청 시간 초과',
    message: '서버 응답이 지연되고 있습니다.',
    action: '재시도',
  },
};

const currentError = computed(() => {
  if (!error.value) return null;
  const errorType = getErrorType(error.value);
  return errorMessages[errorType];
});
```

**결론**: 기본 메시지 제공. 사용자 친화성 향상 권장.

---

### 1.5 타입 안전성

#### 1.5.1 TypeScript 활용도

**등급**: A

**분석**:

**완전한 타입 명시**:
```typescript
// 상세설계 섹션 3.1
✓ API 응답 타입: ProjectListResponse
✓ 필터 상태: 'all' | 'active' | 'archived'
✓ 함수 반환 타입: string, void
✓ Computed 타입: ProjectListItem[]
```

**타입 안전성 검증**:
```typescript
// Const assertion 사용
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
] as const;
// Type: readonly [{ label: "All", value: "all" }, ...]

// Union 타입으로 제약
type FilterStatus = 'all' | 'active' | 'archived';
type ProjectStatus = 'active' | 'archived';
type WbsDepth = 3 | 4;
```

**결론**: TypeScript 활용 우수. 타입 안전성 100%.

---

#### 1.5.2 타입 추론 vs 명시

**등급**: A

**분석**:

**적절한 균형**:
```typescript
// 명시적 타입 (복잡한 구조)
const { data, pending, error } = await useFetch<ProjectListResponse>('/api/projects');

// 타입 추론 (단순한 경우)
const filterStatus = ref<'all' | 'active' | 'archived'>('all'); // 명시
const formatDate = (isoDate: string): string => { ... }; // 명시

// Computed는 추론 가능하지만 명시 권장
const filteredProjects = computed<ProjectListItem[]>(() => { ... });
```

**결론**: 명시와 추론 적절히 조합.

---

## 2. 기술 부채 식별

### 2.1 현재 기술 부채

#### 2.1.1 코드 중복

**등급**: B

**식별된 중복**:

1. **날짜 포맷팅 함수**
```typescript
// pages/projects.vue
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

// 문제: 다른 페이지에서도 동일 로직 필요 시 중복 발생
// 해결: utils/date.ts로 이동
```

2. **에러 메시지 패턴**
```vue
<!-- 여러 페이지에서 반복 가능 -->
<InlineMessage v-if="error" severity="error">
  프로젝트 목록을 불러오는 중 오류가 발생했습니다: {{ error.message }}
</InlineMessage>

<!-- 해결: 공통 ErrorMessage 컴포넌트 -->
<ErrorMessage :error="error" context="프로젝트 목록" />
```

**부채 크기**: 낮음 (현재 단일 페이지)
**해결 시점**: 2차 개발 시 (재사용 발생 시)

---

#### 2.1.2 매직 넘버/문자열

**등급**: A-

**식별된 매직 값**:

```typescript
// 020-detail-design.md
✓ 필터 옵션: const로 정의됨
✓ API 엔드포인트: '/api/projects' (변경 가능성 낮음)
△ 그리드 열 수: 1, 2, 3, 4 (TailwindCSS 클래스에 하드코딩)

// 개선 권장
const GRID_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  large: 4,
} as const;

// TailwindCSS 대응 (theme.config.js)
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        'projects-mobile': 'repeat(1, minmax(0, 1fr))',
        'projects-tablet': 'repeat(2, minmax(0, 1fr))',
        'projects-desktop': 'repeat(3, minmax(0, 1fr))',
        'projects-large': 'repeat(4, minmax(0, 1fr))',
      },
    },
  },
};
```

**결론**: 매직 값 최소화. 그리드 설정 개선 권장.

---

#### 2.1.3 복잡도 지표

**등급**: A

**McCabe Cyclomatic Complexity 분석**:

```typescript
// filteredProjects computed
const filteredProjects = computed<ProjectListItem[]>(() => {
  if (!data.value?.projects) return [];  // +1

  if (filterStatus.value === 'all') {    // +1
    return data.value.projects;
  }

  return data.value.projects.filter(     // +1
    (project) => project.status === filterStatus.value
  );
});
// Complexity: 3 (낮음, 목표 < 10)
```

**Cognitive Complexity**: 매우 낮음
- 중첩 깊이: 최대 2단계
- 분기문: if-else 체인
- 루프: filter만 사용

**함수 길이**:
- `formatDate`: 3줄
- `navigateToWbs`: 1줄
- 컴포넌트 전체: ~100줄 (적정)

**결론**: 복잡도 매우 낮음. 기술 부채 없음.

---

### 2.2 잠재적 기술 부채

#### 2.2.1 확장성 제약

**등급**: B+

**식별된 제약**:

1. **필터 확장**
```typescript
// 현재: 하드코딩된 필터 옵션
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
];

// 향후 필요: 'WBS Depth', '최근 생성', '팀원 수' 등
// 해결: 플러그인 패턴 또는 설정 기반 필터
```

2. **페이지네이션 부재**
```typescript
// 현재: 모든 프로젝트 한 번에 로드
// 문제: 프로젝트 100개 이상 시 성능 저하
// 해결: 무한 스크롤 또는 페이지네이션 (2차)
```

3. **검색 기능 미지원**
```typescript
// 현재: 상태 필터만 지원
// 향후: 프로젝트명 검색, 날짜 범위 필터
```

**결론**: 초기 요구사항 충족. 확장 계획 명확.

---

#### 2.2.2 성능 최적화 기회

**등급**: B+

**식별된 기회**:

1. **Virtual Scrolling**
```typescript
// 현재: 모든 카드 렌더링
// 문제: 프로젝트 50개 이상 시 초기 렌더링 지연
// 해결: PrimeVue VirtualScroller (2차)

<VirtualScroller :items="filteredProjects" :itemSize="200">
  <template #item="{ item }">
    <Card>{{ item.name }}</Card>
  </template>
</VirtualScroller>
```

2. **이미지 최적화** (향후)
```typescript
// 현재: 이미지 없음
// 향후: 프로젝트 썸네일 추가 시 레이지 로딩 필요

<NuxtImg
  :src="project.thumbnail"
  loading="lazy"
  sizes="sm:100vw md:50vw lg:33vw"
/>
```

3. **useFetch 캐싱**
```typescript
// 현재: key 설정으로 캐싱 활성화됨
useFetch('/api/projects', { key: 'projects-list' });

// 추가 최적화: stale-while-revalidate
useFetch('/api/projects', {
  key: 'projects-list',
  getCachedData: (key) => useNuxtData(key).data,
});
```

**결론**: 현재 규모에서는 최적. 확장 시 최적화 필요.

---

#### 2.2.3 유지보수성 리스크

**등급**: A-

**식별된 리스크**:

1. **API 응답 구조 변경**
```typescript
// 현재: 타입으로 제약
interface ProjectListResponse { ... }

// 리스크: API 스펙 변경 시 타입 불일치
// 완화: 런타임 스키마 검증 (Zod) 권장
```

2. **PrimeVue 버전 업그레이드**
```typescript
// 현재: PrimeVue 4.x 컴포넌트 직접 사용
// 리스크: 5.x 마이그레이션 시 Props 변경
// 완화: 래퍼 컴포넌트 고려 (재사용 증가 시)
```

3. **필터 로직 분산**
```typescript
// 현재: filteredProjects computed에 집중
// 리스크: 복잡한 필터 추가 시 computed 비대화
// 완화: useProjectFilter composable 분리 (향후)
```

**결론**: 유지보수성 양호. 예방적 리팩토링 계획 명확.

---

## 3. jjiban 프로젝트 규칙 준수

### 3.1 필수 규칙 검증

#### 3.1.1 PrimeVue 컴포넌트 사용

**등급**: A

**검증 결과**:
```vue
✓ SelectButton (필터)
✓ Card (프로젝트 카드)
✓ Tag (상태 배지)
✓ Badge (기본 프로젝트)
✓ ProgressSpinner (로딩)
✓ InlineMessage (에러/빈 상태)
✗ 일반 HTML: h1, div (레이아웃 구조)
```

**준수 사항**:
- 모든 UI 컴포넌트는 PrimeVue 사용
- 일반 HTML은 구조적 요소만 허용 (h1, div, span)
- `<button>`, `<form>` 등 인터랙티브 요소는 PrimeVue 사용

**결론**: 규칙 100% 준수.

---

#### 3.1.2 TypeScript 타입 명시

**등급**: A

**검증 결과**:
```typescript
✓ API 응답: ProjectListResponse
✓ 필터 상태: 'all' | 'active' | 'archived'
✓ Computed: ProjectListItem[]
✓ 함수 파라미터: string
✓ 함수 반환: string, void
✗ 암시적 any: 0건
```

**결론**: 타입 명시 100%.

---

#### 3.1.3 Composition API 사용

**등급**: A

**검증 결과**:
```vue
✓ <script setup lang="ts">
✓ ref, computed, useFetch 사용
✓ Options API 미사용
✓ this 키워드 미사용
```

**결론**: Composition API 완전 준수.

---

#### 3.1.4 Server Routes 파일 접근

**등급**: A

**검증 결과**:
```typescript
✓ API 호출: useFetch('/api/projects')
✓ 직접 파일 접근: 없음
✓ fs 모듈 사용: 없음 (프론트엔드)
```

**결론**: Server Routes 패턴 준수.

---

### 3.2 권장 규칙 검증

#### 3.2.1 Vue 3 패턴

**등급**: A

**검증 결과**:
- Reactivity Transform 미사용 (안정성)
- `<script setup>` 활용
- defineProps, defineEmits 미사용 (페이지 컴포넌트)

**결론**: Vue 3 베스트 프랙티스 준수.

---

#### 3.2.2 코딩 스타일

**등급**: A-

**검증 결과**:

**네이밍 규칙**:
```typescript
✓ 컴포넌트: PascalCase (Card, SelectButton)
✓ 변수: camelCase (filterStatus, filteredProjects)
✓ 상수: UPPER_CASE 미사용 (as const 선호)
✓ 함수: camelCase (formatDate, navigateToWbs)
```

**주석 품질**:
```typescript
✓ JSDoc 주석: formatDate, navigateToWbs
✓ 섹션 구분 주석: // ========== API 호출 ==========
△ 복잡한 로직 설명 주석: 부족 (단순해서 불필요)
```

**결론**: 코딩 스타일 일관성 우수.

---

## 4. 테스트 명세 리뷰

### 4.1 커버리지 분석

#### 4.1.1 기능 요구사항 커버리지

**등급**: A

**분석**:
```
총 9개 기능 요구사항 (FR-001 ~ FR-009)
├── High 우선순위: 4개 → 테스트 4개 (100%)
├── Medium 우선순위: 3개 → 테스트 3개 (100%)
└── Low 우선순위: 2개 → 테스트 2개 (100%)

전체 커버리지: 9/9 (100%)
```

**테스트 매핑**:
| 요구사항 | 단위 테스트 | 통합 테스트 | E2E 테스트 | 커버리지 |
|---------|------------|------------|-----------|---------|
| FR-001 | UT-001 | IT-001 | E2E-001 | 3x |
| FR-002 | - | IT-001 | E2E-001, E2E-002 | 3x |
| FR-003 | UT-003 | - | E2E-003 | 2x |
| FR-004 | UT-004 | - | E2E-004 | 2x |
| FR-005 | UT-002 | IT-002 | E2E-005, E2E-006 | 4x |
| FR-006 | - | - | E2E-007 | 1x |
| FR-007 | - | - | E2E-008 | 1x |
| FR-008 | - | - | E2E-009 | 1x |
| FR-009 | - | - | E2E-010 | 1x |

**결론**: 요구사항 커버리지 100%. 핵심 기능 다중 검증.

---

#### 4.1.2 비기능 요구사항 커버리지

**등급**: B+

**분석**:
```
총 6개 비기능 요구사항 (NFR-001 ~ NFR-006)
├── NFR-001 (성능): 측정 도구 미정의 ⚠️
├── NFR-002 (반응형): E2E-002, E2E-011 ✓
├── NFR-003 (접근성): E2E-012 ✓
├── NFR-004 (PrimeVue): 코드 리뷰 ✓
├── NFR-005 (TypeScript): 타입 체크 ✓
└── NFR-006 (Composition API): 코드 리뷰 ✓

커버리지: 5/6 (83%)
```

**누락 검증**:
```typescript
// NFR-001: 페이지 로드 시간 < 500ms
// 권장 추가 테스트:

test('E2E-013: 성능 측정', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/projects');
  await page.waitForSelector('.p-card');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(500);
});

// Lighthouse CI 통합
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 500 }],
        "interactive": ["error", { "maxNumericValue": 500 }]
      }
    }
  }
}
```

**결론**: 비기능 요구사항 대부분 커버. 성능 측정 도구 추가 필요.

---

#### 4.1.3 테스트 피라미드 균형

**등급**: B+

**분석**:
```
      /\
     /E2E\       12개 (67%)
    /------\
   /  IT   \     2개 (11%)
  /----------\
 /    UT     \   4개 (22%)
/--------------\
```

**평가**:
- **비율**: UT:IT:E2E = 22:11:67
- **UI 중심 특성**: E2E 비중 높음 (정당)
- **비교**: 일반적 권장 (70:20:10) 대비 E2E 낮음

**개선 권장**:
```typescript
// 단위 테스트 추가 후보
UT-005: defaultProject computed 로직
UT-006: 에러 메시지 생성 로직
UT-007: 필터 옵션 매핑

// 통합 테스트 추가 후보
IT-003: 네비게이션 → WBS 페이지 로드
IT-004: API 재호출 시 캐시 동작
```

**결론**: 피라미드 구조 양호. 단위 테스트 약간 추가 권장.

---

### 4.2 누락된 테스트 케이스

#### 4.2.1 Edge Cases

**등급**: B

**식별된 누락**:

1. **날짜 처리 Edge Cases**
```typescript
// UT-003 확장 필요
test('should handle invalid date strings', () => {
  expect(() => formatDate('invalid-date')).toThrow();
  // 또는 fallback 동작 정의
});

test('should handle very old dates', () => {
  expect(formatDate('1900-01-01T00:00:00.000Z')).toBe('1900-01-01');
});

test('should handle future dates', () => {
  expect(formatDate('2099-12-31T23:59:59.999Z')).toBe('2099-12-31');
});
```

2. **필터 Edge Cases**
```typescript
// UT-002 확장 필요
test('should handle null data gracefully', () => {
  data.value = null;
  expect(filteredProjects.value).toEqual([]);
});

test('should handle malformed project objects', () => {
  data.value.projects = [{ id: 'p1' }]; // 필드 누락
  // 동작 정의 필요
});
```

3. **네비게이션 Edge Cases**
```typescript
// E2E-004 확장 필요
test('should handle special characters in project ID', async ({ page }) => {
  // projectId: 'project-with-특수문자'
  await page.click('.p-card');
  expect(page.url()).toContain(encodeURIComponent('project-with-특수문자'));
});
```

**결론**: Edge Case 커버리지 보완 필요.

---

#### 4.2.2 에러 시나리오

**등급**: B+

**식별된 누락**:

1. **API 타임아웃**
```typescript
test('E2E-014: API 타임아웃 처리', async ({ page }) => {
  await page.route('/api/projects', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초 지연
  });

  await page.goto('/projects');

  // 타임아웃 에러 메시지 확인
  await expect(page.locator('.p-inline-message-error'))
    .toContainText('요청 시간 초과');
});
```

2. **부분 응답**
```typescript
test('E2E-015: 부분 프로젝트 데이터 처리', async ({ page }) => {
  await page.route('/api/projects', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        projects: [
          { id: 'p1', name: 'Project 1', status: 'active', wbsDepth: 4, createdAt: '2025-12-14' },
          { id: 'p2', name: null, status: 'active' }, // 필드 누락
        ],
        defaultProject: 'p1',
        total: 2,
      }),
    })
  );

  await page.goto('/projects');

  // 유효한 프로젝트만 표시 또는 전체 실패
  // 동작 정의 필요
});
```

3. **동시 필터 변경**
```typescript
test('IT-003: 빠른 필터 전환 시 경쟁 조건', async () => {
  const wrapper = await mountSuspended(ProjectsPage);

  // 빠르게 필터 전환
  await wrapper.find('button:has-text("Active")').trigger('click');
  await wrapper.find('button:has-text("Archived")').trigger('click');
  await wrapper.find('button:has-text("All")').trigger('click');

  await wrapper.vm.$nextTick();

  // 최종 상태가 'All'인지 확인
  expect(wrapper.vm.filterStatus).toBe('all');
});
```

**결론**: 에러 시나리오 추가 필요.

---

#### 4.2.3 접근성 테스트

**등급**: B

**식별된 누락**:

1. **자동화된 접근성 검증**
```typescript
// axe-core 통합
import { injectAxe, checkA11y } from 'axe-playwright';

test('E2E-016: 자동 접근성 검사', async ({ page }) => {
  await page.goto('/projects');
  await injectAxe(page);

  const violations = await checkA11y(page);
  expect(violations).toHaveLength(0);
});
```

2. **스크린 리더 테스트**
```typescript
test('E2E-017: ARIA 속성 검증', async ({ page }) => {
  await page.goto('/projects');

  // 필터 버튼 ARIA
  const filterButton = page.locator('button:has-text("Active")');
  await expect(filterButton).toHaveAttribute('role', 'button');
  await expect(filterButton).toHaveAttribute('aria-pressed');

  // 카드 ARIA
  const card = page.locator('.p-card').first();
  await expect(card).toHaveAttribute('role', 'article');
  await expect(card).toHaveAttribute('aria-label');
});
```

3. **포커스 관리**
```typescript
test('E2E-018: 포커스 트래핑 검증', async ({ page }) => {
  await page.goto('/projects');

  // Tab 순환
  const focusableElements = await page.locator('button, a, [tabindex="0"]').all();

  for (let i = 0; i < focusableElements.length; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'DIV']).toContain(focused);
  }
});
```

**결론**: 접근성 자동화 테스트 추가 권장.

---

### 4.3 테스트 구현 품질

#### 4.3.1 테스트 데이터 관리

**등급**: A

**분석**:

**테스트 환경 격리**:
```typescript
// tests/utils/test-helpers.ts
✓ 독립적인 테스트 폴더 생성
✓ 환경변수 설정 (JJIBAN_BASE_PATH)
✓ cleanup 함수로 정리
✓ beforeAll/afterAll 훅 사용
```

**픽스처 관리**:
```typescript
✓ tests/fixtures/projects-page/
✓ 재사용 가능한 setupTestEnvironment
✓ 다중 프로젝트 시나리오 지원
```

**결론**: 테스트 데이터 관리 우수.

---

#### 4.3.2 테스트 가독성

**등급**: A

**분석**:

**Given-When-Then 패턴**:
```typescript
// 모든 테스트 케이스에 명시
✓ Given: 테스트 전제 조건
✓ When: 실행 동작
✓ Then: 예상 결과
```

**테스트명 명확성**:
```typescript
✓ 'should display all project information in card'
✓ 'should navigate to WBS page on card click'
✓ 'should filter projects by status'
```

**결론**: 테스트 가독성 매우 우수.

---

#### 4.3.3 테스트 유지보수성

**등급**: A-

**분석**:

**Page Object 패턴 미사용**:
```typescript
// 현재: 직접 셀렉터 사용
await page.click('.p-card');

// 권장: Page Object 패턴 (테스트 증가 시)
class ProjectsPage {
  constructor(private page: Page) {}

  async clickProjectCard(index: number) {
    await this.page.locator('.p-card').nth(index).click();
  }

  async selectFilter(filter: 'All' | 'Active' | 'Archived') {
    await this.page.click(`button:has-text("${filter}")`);
  }
}
```

**셀렉터 관리**:
```typescript
// 현재: 하드코딩된 셀렉터
// 권장: 상수화 (2차 개발 시)
const SELECTORS = {
  projectCard: '.p-card',
  filterButton: 'button:has-text',
  statusTag: '.p-tag',
  errorMessage: '.p-inline-message-error',
};
```

**결론**: 유지보수성 양호. 테스트 증가 시 Page Object 도입 권장.

---

## 5. 개선 권고사항

### 5.1 필수 개선 (Critical)

#### C-001: 성능 측정 도구 추가

**우선순위**: High
**난이도**: Medium
**예상 공수**: 4시간

**문제**:
- NFR-001 (페이지 로드 < 500ms) 검증 방법 미정의
- 성능 저하 조기 발견 불가

**해결 방안**:
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['./custom-performance-reporter.ts'], // 성능 리포터
  ],
});

// tests/e2e/performance.spec.ts
test('성능: 페이지 로드 시간', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
    };
  });

  expect(metrics.domContentLoaded).toBeLessThan(500);
});

// Lighthouse CI 통합
// package.json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

**검증 기준**:
- [ ] Playwright 성능 테스트 추가
- [ ] Lighthouse CI 통합
- [ ] CI/CD 파이프라인에 성능 게이트 추가

**영향 범위**: 테스트 인프라

---

#### C-002: API 타임아웃 설정

**우선순위**: High
**난이도**: Low
**예상 공수**: 1시간

**문제**:
- 무한 대기 가능성 (네트워크 지연 시)
- 사용자 경험 저하

**해결 방안**:
```typescript
// pages/projects.vue
const { data, pending, error } = await useFetch<ProjectListResponse>(
  '/api/projects',
  {
    key: 'projects-list',
    timeout: 5000, // 5초 타임아웃
    retry: 2, // 2회 재시도
    retryDelay: 1000, // 1초 간격
    onRequestError({ error }) {
      console.error('API 요청 실패:', error);
    },
  }
);
```

**검증 기준**:
- [ ] useFetch에 timeout 옵션 추가
- [ ] E2E 테스트로 타임아웃 동작 검증
- [ ] 에러 메시지 적절성 확인

**영향 범위**: pages/projects.vue

---

#### C-003: 런타임 스키마 검증 (Zod)

**우선순위**: Medium
**난이도**: Medium
**예상 공수**: 3시간

**문제**:
- API 응답 구조 변경 시 런타임 에러
- 타입 불일치 조기 발견 불가

**해결 방안**:
```typescript
// utils/schemas/projects.ts
import { z } from 'zod';

export const ProjectListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  status: z.enum(['active', 'archived']),
  wbsDepth: z.union([z.literal(3), z.literal(4)]),
  createdAt: z.string().datetime(),
});

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectListItemSchema),
  defaultProject: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

// pages/projects.vue
import { ProjectListResponseSchema } from '~/utils/schemas/projects';

const { data, pending, error } = await useFetch('/api/projects', {
  key: 'projects-list',
  transform: (response) => {
    try {
      return ProjectListResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API 응답 검증 실패:', validationError);
      throw new Error('유효하지 않은 API 응답');
    }
  },
});
```

**검증 기준**:
- [ ] Zod 스키마 정의
- [ ] useFetch transform 적용
- [ ] 유효하지 않은 응답 테스트 추가

**영향 범위**: utils/schemas/, pages/projects.vue

---

### 5.2 권장 개선 (Recommended)

#### R-001: 유틸리티 함수 분리

**우선순위**: Medium
**난이도**: Low
**예상 공수**: 1시간

**문제**:
- formatDate 함수 재사용 불가
- 다른 페이지에서 중복 구현 가능성

**해결 방안**:
```typescript
// utils/date.ts
/**
 * ISO 8601 날짜를 YYYY-MM-DD 형식으로 변환
 * @param isoDate ISO 8601 형식 날짜 문자열
 * @returns YYYY-MM-DD 형식 문자열
 * @throws Error 유효하지 않은 날짜
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
    throw new Error(`유효하지 않은 날짜: ${isoDate}`);
  }

  return date.toISOString().split('T')[0];
}

/**
 * 상대적 시간 표시 (e.g., "3일 전")
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return formatDate(isoDate);
}

// pages/projects.vue
import { formatDate } from '~/utils/date';
```

**검증 기준**:
- [ ] utils/date.ts 생성
- [ ] 단위 테스트 작성 (UT-003 이동)
- [ ] pages/projects.vue에서 import

**영향 범위**: utils/date.ts, pages/projects.vue, tests/

---

#### R-002: 필터 Composable 분리

**우선순위**: Medium
**난이도**: Medium
**예상 공수**: 2시간

**문제**:
- 필터 로직이 pages/projects.vue에 집중
- 다른 페이지에서 유사 필터 필요 시 중복

**해결 방안**:
```typescript
// composables/useProjectFilter.ts
export function useProjectFilter(projects: Ref<ProjectListItem[] | undefined>) {
  const filterStatus = ref<'all' | 'active' | 'archived'>('all');

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ] as const;

  const filteredProjects = computed<ProjectListItem[]>(() => {
    if (!projects.value) return [];

    if (filterStatus.value === 'all') {
      return projects.value;
    }

    return projects.value.filter(
      (project) => project.status === filterStatus.value
    );
  });

  const filterCounts = computed(() => ({
    all: projects.value?.length ?? 0,
    active: projects.value?.filter(p => p.status === 'active').length ?? 0,
    archived: projects.value?.filter(p => p.status === 'archived').length ?? 0,
  }));

  return {
    filterStatus,
    filterOptions,
    filteredProjects,
    filterCounts,
  };
}

// pages/projects.vue
import { useProjectFilter } from '~/composables/useProjectFilter';

const { data, pending, error } = await useFetch<ProjectListResponse>('/api/projects');
const projects = computed(() => data.value?.projects);

const { filterStatus, filterOptions, filteredProjects, filterCounts } = useProjectFilter(projects);
```

**검증 기준**:
- [ ] composables/useProjectFilter.ts 생성
- [ ] 단위 테스트 작성 (UT-002 이동)
- [ ] pages/projects.vue에서 사용

**영향 범위**: composables/, pages/projects.vue, tests/

---

#### R-003: 에러 처리 개선

**우선순위**: Medium
**난이도**: Medium
**예상 공수**: 2시간

**문제**:
- 단순 에러 메시지만 표시
- 재시도 기능 없음
- 사용자 친화적 안내 부족

**해결 방안**:
```typescript
// composables/useErrorHandler.ts
interface ErrorState {
  type: 'network' | 'server' | 'timeout' | 'unknown';
  title: string;
  message: string;
  canRetry: boolean;
  retryAction?: () => void;
}

export function useErrorHandler() {
  function parseError(error: any, retryFn?: () => void): ErrorState {
    if (!error) return null;

    // 네트워크 오류
    if (error.name === 'FetchError' && !error.statusCode) {
      return {
        type: 'network',
        title: '네트워크 연결 오류',
        message: '인터넷 연결을 확인해주세요.',
        canRetry: true,
        retryAction: retryFn,
      };
    }

    // 서버 오류
    if (error.statusCode >= 500) {
      return {
        type: 'server',
        title: '서버 오류',
        message: '잠시 후 다시 시도해주세요.',
        canRetry: true,
        retryAction: retryFn,
      };
    }

    // 타임아웃
    if (error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        title: '요청 시간 초과',
        message: '서버 응답이 지연되고 있습니다.',
        canRetry: true,
        retryAction: retryFn,
      };
    }

    // 기타 오류
    return {
      type: 'unknown',
      title: '오류 발생',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      canRetry: false,
    };
  }

  return { parseError };
}

// pages/projects.vue
import { useErrorHandler } from '~/composables/useErrorHandler';

const { parseError } = useErrorHandler();
const { data, pending, error, refresh } = await useFetch(...);

const errorState = computed(() => parseError(error.value, refresh));
```

```vue
<!-- 템플릿 개선 -->
<InlineMessage v-if="errorState" :severity="'error'" class="mb-4">
  <div class="flex flex-col gap-2">
    <strong>{{ errorState.title }}</strong>
    <span>{{ errorState.message }}</span>
    <Button
      v-if="errorState.canRetry"
      label="다시 시도"
      severity="secondary"
      size="small"
      @click="errorState.retryAction"
    />
  </div>
</InlineMessage>
```

**검증 기준**:
- [ ] composables/useErrorHandler.ts 생성
- [ ] 에러 타입별 메시지 정의
- [ ] 재시도 버튼 추가
- [ ] E2E 테스트 업데이트

**영향 범위**: composables/, pages/projects.vue, tests/

---

#### R-004: 접근성 자동화 테스트

**우선순위**: Medium
**난이도**: Low
**예상 공수**: 2시간

**문제**:
- 접근성 수동 검증만 존재
- WCAG 규정 준수 자동 확인 불가

**해결 방안**:
```bash
# 패키지 설치
npm install -D @axe-core/playwright
```

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('접근성 검증', () => {
  test('WCAG 2.1 AA 준수', async ({ page }) => {
    await page.goto('/projects');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/projects');

    // Tab 순서 검증
    await page.keyboard.press('Tab');
    let focused = await page.locator(':focus');
    await expect(focused).toHaveAttribute('role', 'button');

    // Skip to content 링크 존재
    await expect(page.locator('a[href="#main-content"]')).toBeVisible();
  });

  test('ARIA 속성 검증', async ({ page }) => {
    await page.goto('/projects');

    // 필터 버튼
    const filterButton = page.locator('button:has-text("Active")');
    await expect(filterButton).toHaveAttribute('aria-label');

    // 카드
    const card = page.locator('.p-card').first();
    await expect(card).toHaveAttribute('role', 'article');
  });
});
```

**검증 기준**:
- [ ] @axe-core/playwright 설치
- [ ] 자동 접근성 테스트 추가
- [ ] CI/CD에 통합

**영향 범위**: tests/e2e/, package.json

---

#### R-005: Edge Case 테스트 추가

**우선순위**: Low
**난이도**: Low
**예상 공수**: 2시간

**문제**:
- Edge Case 커버리지 부족
- 예외 상황 처리 미검증

**해결 방안**:
```typescript
// tests/unit/utils/formatDate.spec.ts
describe('formatDate Edge Cases', () => {
  it('should throw on invalid date', () => {
    expect(() => formatDate('invalid')).toThrow('유효하지 않은 날짜');
  });

  it('should handle leap year', () => {
    expect(formatDate('2024-02-29T00:00:00.000Z')).toBe('2024-02-29');
  });

  it('should handle year 2000 problem dates', () => {
    expect(formatDate('2000-01-01T00:00:00.000Z')).toBe('2000-01-01');
  });

  it('should handle far future dates', () => {
    expect(formatDate('2099-12-31T23:59:59.999Z')).toBe('2099-12-31');
  });
});

// tests/e2e/projects-edge-cases.spec.ts
test('프로젝트 ID에 특수문자 포함', async ({ page }) => {
  // 한글, 공백, 특수문자 테스트
  const specialProjectId = 'project-한글-123!@#';
  // ...
});

test('매우 긴 프로젝트명 처리', async ({ page }) => {
  // 텍스트 오버플로우 테스트
  const longName = 'A'.repeat(200);
  // ...
});
```

**검증 기준**:
- [ ] 날짜 Edge Case 테스트 추가
- [ ] 특수문자 처리 테스트 추가
- [ ] UI 오버플로우 테스트 추가

**영향 범위**: tests/unit/, tests/e2e/

---

### 5.3 선택 개선 (Optional)

#### O-001: Page Object 패턴 도입

**우선순위**: Low
**난이도**: Low
**예상 공수**: 2시간

**장점**:
- E2E 테스트 유지보수성 향상
- 셀렉터 중앙 관리

**해결 방안**:
```typescript
// tests/page-objects/ProjectsPage.ts
export class ProjectsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/projects');
  }

  async getProjectCards() {
    return this.page.locator('.p-card').all();
  }

  async clickProjectCard(index: number = 0) {
    await this.page.locator('.p-card').nth(index).click();
  }

  async selectFilter(filter: 'All' | 'Active' | 'Archived') {
    await this.page.click(`button:has-text("${filter}")`);
  }

  async getErrorMessage() {
    return this.page.locator('.p-inline-message-error').textContent();
  }

  async waitForLoading() {
    await this.page.waitForSelector('.p-progress-spinner', { state: 'hidden' });
  }
}

// tests/e2e/projects-page.spec.ts
import { ProjectsPage } from '../page-objects/ProjectsPage';

test('프로젝트 목록 렌더링', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);

  await projectsPage.goto();
  await projectsPage.waitForLoading();

  const cards = await projectsPage.getProjectCards();
  expect(cards).toHaveLength(1);
});
```

**시점**: E2E 테스트 20개 이상 시 도입

---

#### O-002: API Mock Server 구축

**우선순위**: Low
**난이도**: Medium
**예상 공수**: 4시간

**장점**:
- 일관된 테스트 데이터
- API 없이 프론트엔드 개발 가능

**해결 방안**:
```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json({
      projects: [
        {
          id: 'mock-project',
          name: 'Mock Project',
          path: 'mock-project',
          status: 'active',
          wbsDepth: 4,
          createdAt: '2025-12-14T00:00:00.000Z',
        },
      ],
      defaultProject: 'mock-project',
      total: 1,
    });
  }),
];

export const server = setupServer(...handlers);

// vitest.setup.ts
import { server } from './tests/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**시점**: API 의존성이 테스트 병목이 될 때

---

#### O-003: 로딩 스켈레톤 UI

**우선순위**: Low
**난이도**: Low
**예상 공수**: 2시간

**장점**:
- 로딩 UX 개선
- Perceived Performance 향상

**해결 방안**:
```vue
<!-- components/ProjectCardSkeleton.vue -->
<template>
  <Card>
    <template #title>
      <Skeleton width="60%" height="1.5rem" />
    </template>
    <template #content>
      <div class="space-y-3">
        <Skeleton width="40%" height="1rem" />
        <Skeleton width="50%" height="1rem" />
        <Skeleton width="45%" height="1rem" />
      </div>
    </template>
  </Card>
</template>

<!-- pages/projects.vue -->
<div v-if="pending" class="grid ...">
  <ProjectCardSkeleton v-for="i in 4" :key="i" />
</div>
```

**시점**: 로딩 시간이 500ms 이상일 때

---

#### O-004: 프로젝트 카드 애니메이션

**우선순위**: Low
**난이도**: Low
**예상 공수**: 1시간

**장점**:
- 부드러운 진입 효과
- 시각적 피드백 향상

**해결 방안**:
```vue
<!-- pages/projects.vue -->
<TransitionGroup
  name="card"
  tag="div"
  class="grid ..."
>
  <Card
    v-for="project in filteredProjects"
    :key="project.id"
    ...
  />
</TransitionGroup>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
```

**시점**: 기본 기능 완성 후 UX 개선 단계

---

## 6. 품질 지표 요약

### 6.1 설계 품질 점수

| 항목 | 점수 | 가중치 | 가중 점수 |
|------|------|--------|----------|
| SOLID 원칙 준수 | 90% | 25% | 22.5% |
| 컴포넌트 구조 | 95% | 20% | 19.0% |
| 데이터 흐름 | 95% | 15% | 14.25% |
| 에러 처리 | 75% | 15% | 11.25% |
| 타입 안전성 | 100% | 15% | 15.0% |
| 규칙 준수 | 100% | 10% | 10.0% |
| **총점** | **92%** | **100%** | **92.0%** |

**등급**: A- (Excellent)

---

### 6.2 기술 부채 점수

| 항목 | 부채 수준 | 해결 우선순위 |
|------|----------|--------------|
| 코드 중복 | 낮음 | 2차 개발 시 |
| 매직 값 | 낮음 | 선택적 |
| 복잡도 | 매우 낮음 | 해당 없음 |
| 확장성 제약 | 중간 | 계획됨 (2차) |
| 성능 최적화 | 낮음 | 필요 시 |
| 유지보수성 | 낮음 | 예방적 리팩토링 |

**총 부채 수준**: 낮음 (Low)
**긴급 해결 필요**: 없음

---

### 6.3 테스트 품질 점수

| 항목 | 점수 | 비고 |
|------|------|------|
| 요구사항 커버리지 | 100% | 9/9 완료 |
| 코드 커버리지 (예상) | 85% | 목표 > 80% |
| Edge Case 커버리지 | 70% | 개선 필요 |
| 접근성 검증 | 60% | 자동화 필요 |
| 테스트 가독성 | 95% | 우수 |
| 테스트 유지보수성 | 85% | 양호 |
| **총점** | **82.5%** | **Good** |

**등급**: B+ (Good with Improvements)

---

## 7. 결론

### 7.1 전체 평가

**프로젝트 성숙도**: High

TSK-04-00 (Projects Page)는 **높은 품질의 설계**를 갖추고 있습니다:

**핵심 강점**:
1. SOLID 원칙 준수 및 명확한 단일 책임
2. 완전한 타입 안전성 (TypeScript 100%)
3. PrimeVue 컴포넌트 일관적 사용
4. 포괄적인 테스트 커버리지 (요구사항 100%)
5. 우수한 문서화 (기본설계, 상세설계, 추적성 매트릭스, 테스트 명세)

**주요 개선 영역**:
1. 성능 측정 도구 추가 (NFR-001 검증)
2. API 타임아웃 및 재시도 로직
3. 런타임 스키마 검증 (Zod)
4. 접근성 자동화 테스트
5. Edge Case 커버리지 향상

**기술 부채**: 매우 낮음 (2차 개발 계획 명확)

---

### 7.2 구현 진행 권고

**즉시 구현 가능**: Yes

현재 설계는 **즉시 구현을 진행해도 무방한 수준**입니다.

**구현 순서 제안**:
1. **1단계**: 현재 설계대로 구현 (030-implementation.md)
2. **2단계**: 필수 개선사항 적용 (C-001, C-002, C-003)
3. **3단계**: 테스트 실행 및 검증
4. **4단계**: 권장 개선사항 선택 적용 (R-001 ~ R-005)

**위험 요소**: 없음
**블로킹 이슈**: 없음

---

### 7.3 추가 검토 사항

#### 7.3.1 2차 개발 시 고려사항

```markdown
TSK-04-06 (검색 및 필터링) 구현 시:
- useProjectFilter composable 확장
- 검색 디바운싱 추가
- URL 쿼리 파라미터 동기화

TSK-04-05 (프로젝트 관리) 구현 시:
- 프로젝트 생성/수정/삭제 API 연동
- Form 검증 (Vuelidate 또는 VeeValidate)
- Optimistic UI 업데이트
```

#### 7.3.2 성능 모니터링

```typescript
// 향후 추가 권장
// composables/usePerformanceMonitor.ts
export function usePerformanceMonitor(pageName: string) {
  onMounted(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 성능 데이터 수집
        console.log(`${pageName}: ${entry.name} - ${entry.duration}ms`);
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
  });
}
```

#### 7.3.3 국제화 (i18n) 준비

```typescript
// 향후 다국어 지원 시
// locales/ko-KR.json
{
  "projects": {
    "title": "프로젝트",
    "filter": {
      "all": "전체",
      "active": "활성",
      "archived": "보관"
    },
    "empty": "프로젝트가 없습니다",
    "error": "프로젝트 목록을 불러오는 중 오류가 발생했습니다"
  }
}
```

---

## 8. 최종 체크리스트

### 8.1 설계 승인 체크리스트

- [x] SOLID 원칙 준수 (A 등급)
- [x] 타입 안전성 100%
- [x] jjiban 프로젝트 규칙 준수
- [x] 요구사항 커버리지 100%
- [ ] 성능 측정 도구 정의 (C-001)
- [x] 에러 처리 전략 정의
- [x] 테스트 명세 완성도
- [x] 문서화 완전성

**승인 상태**: 조건부 승인 (C-001 해결 후 완전 승인)

---

### 8.2 구현 준비 체크리스트

- [x] 상세설계 완료
- [x] 추적성 매트릭스 완료
- [x] 테스트 명세 완료
- [x] 타입 정의 완료 (server/utils/projects/types.ts)
- [x] API 구현 완료 (TSK-03-01)
- [x] PrimeVue 설정 완료 (TSK-01-01-02)
- [ ] 성능 테스트 환경 준비 (C-001)
- [x] 테스트 데이터 준비 방법 정의

**구현 준비도**: 95%

---

### 8.3 품질 게이트

**통과 기준**:
- [x] 설계 품질 점수 > 80% (92% 달성)
- [x] 기술 부채 수준 < Medium (Low 달성)
- [ ] 테스트 품질 점수 > 80% (82.5% 달성, 단 일부 개선 필요)
- [x] 규칙 준수 100%

**최종 상태**: **PASS** (3/4 완전 통과, 1/4 조건부 통과)

---

## 관련 문서

- **기본설계**: `010-basic-design.md`
- **상세설계**: `020-detail-design.md`
- **추적성 매트릭스**: `025-traceability-matrix.md`
- **테스트 명세**: `026-test-specification.md`
- **구현**: `030-implementation.md` (다음 단계)

---

<!--
author: Claude (Refactoring Expert Agent)
Template Version: 1.0.0
Created: 2025-12-14
Review Status: Approved with Conditions (C-001)
-->
