# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-00 |
| Task명 | Projects Page |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.1, 8.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-00 |

---

## 1. 목적 및 범위

### 1.1 목적

jjiban 애플리케이션의 진입점(Entry Point) 역할을 하는 프로젝트 목록 페이지를 제공합니다. 사용자는 이 페이지에서 사용 가능한 모든 프로젝트를 시각적으로 확인하고, 원하는 프로젝트를 선택하여 WBS 트리 뷰로 진입할 수 있습니다.

**해결하는 문제**:
- 사용자가 여러 프로젝트를 관리할 때 현재 작업할 프로젝트를 선택할 수 있는 UI 필요
- 프로젝트 목록을 한눈에 파악하고 상태(active/archived)를 구분할 수 있는 인터페이스 필요
- WBS 트리 뷰로의 자연스러운 네비게이션 흐름 제공

**제공하는 가치**:
- 직관적인 프로젝트 선택 경험
- 프로젝트별 메타데이터(상태, 생성일, WBS 깊이) 시각화
- 깔끔하고 일관된 UI/UX (PrimeVue Card 기반)

### 1.2 범위

**포함 범위**:
- ProjectsPage 컴포넌트 (`pages/projects.vue`) 생성
- GET /api/projects API 연동
- 프로젝트 목록 표시 (카드 형태 UI)
- 프로젝트 선택 시 `/wbs?project={id}` 네비게이션
- 상태 필터링 (active/archived/all)
- 로딩 상태 및 에러 핸들링
- 빈 상태(Empty State) 처리

**제외 범위**:
- 프로젝트 생성/수정/삭제 기능 → TSK-04-05 (프로젝트 관리 기능)
- 프로젝트 검색 기능 → TSK-04-06 (검색 및 필터링)
- 프로젝트 정렬 기능 → TSK-04-06
- 프로젝트 상세 정보 모달 → TSK-05-01 (Detail Panel 구조)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | GET /api/projects API를 호출하여 프로젝트 목록을 가져온다 | High | 8.1 |
| FR-002 | 프로젝트 목록을 PrimeVue Card를 활용한 그리드 레이아웃으로 표시한다 | High | 6.1, 10.1 |
| FR-003 | 각 프로젝트 카드에는 프로젝트명, 상태, 생성일, WBS 깊이가 표시된다 | High | - |
| FR-004 | 프로젝트 카드 클릭 시 `/wbs?project={id}` 경로로 이동한다 | High | 6.1 |
| FR-005 | 상태 필터 버튼(All/Active/Archived)을 제공한다 | Medium | - |
| FR-006 | 로딩 중일 때 스피너를 표시한다 | Medium | 11 |
| FR-007 | API 에러 발생 시 에러 메시지를 표시한다 | Medium | 11 |
| FR-008 | 프로젝트가 없을 때 안내 메시지를 표시한다 | Low | 11 |
| FR-009 | 기본 프로젝트(defaultProject)를 시각적으로 강조한다 | Low | - |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 페이지 로드 시간 | < 500ms (API 응답 포함) |
| NFR-002 | 반응형 레이아웃 | 최소 1200px 너비 지원 |
| NFR-003 | 접근성 | 키보드 네비게이션 지원 (Tab, Enter) |
| NFR-004 | 일관성 | PrimeVue 4.x 컴포넌트 사용, 일반 HTML 금지 |
| NFR-005 | TypeScript | 모든 타입 명시 필수 |
| NFR-006 | 코드 구조 | Composition API (`<script setup>`) 사용 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**계층 구조**:
```
pages/projects.vue (Page Component)
    └── API 호출 (composable 또는 직접)
    └── 상태 관리 (ref, computed)
    └── UI 렌더링 (PrimeVue Card Grid)
```

**데이터 흐름**:
1. 컴포넌트 마운트 시 GET /api/projects 호출
2. 응답 데이터를 로컬 상태로 저장
3. 필터 상태에 따라 표시할 프로젝트 목록 계산
4. 카드 그리드로 렌더링
5. 카드 클릭 시 라우터 네비게이션

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| ProjectsPage | 페이지 컨테이너 | API 호출, 상태 관리, 레이아웃 구성 |
| ProjectCard (인라인) | 프로젝트 카드 | 프로젝트 정보 표시, 클릭 이벤트 처리 |
| FilterButtons (인라인) | 필터 버튼 그룹 | 상태 필터 UI 제공 |
| EmptyState (인라인) | 빈 상태 표시 | 프로젝트 없을 때 안내 메시지 |

**참고**: 재사용성이 낮으므로 초기에는 인라인으로 구현. 이후 재사용 필요 시 별도 컴포넌트로 분리.

### 3.3 데이터 흐름

```
[User]
  → [projects.vue 마운트]
  → [GET /api/projects 호출]
  → [로딩 상태 표시]
  → [API 응답 수신]
  → [프로젝트 목록 저장]
  → [필터 적용]
  → [카드 그리드 렌더링]
  → [사용자 카드 클릭]
  → [navigateTo('/wbs?project={id}')]
  → [WBS 페이지로 이동]
```

**에러 처리 흐름**:
```
[API 호출 실패]
  → [에러 상태 저장]
  → [Toast 또는 에러 메시지 표시]
  → [재시도 버튼 제공 (선택)]
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| API 호출 방식 | useFetch, useAsyncData, $fetch | `useFetch` | Nuxt 권장 방식, 자동 SSR 지원, 로딩/에러 상태 내장 |
| 카드 레이아웃 | CSS Grid, Flexbox, PrimeVue DataView | CSS Grid + PrimeVue Card | 반응형 그리드 레이아웃 구현 용이, PrimeVue 스타일 일관성 |
| 상태 관리 | Pinia, Local Ref | Local Ref | 단순 페이지 레벨 상태이므로 Pinia 불필요 |
| 필터 UI | Dropdown, ButtonGroup, Tabs | PrimeVue SelectButton | 시각적으로 명확, 단일 선택 UI 적합 |
| 에러 표시 | Toast, InlineMessage, Dialog | PrimeVue InlineMessage | 비침습적, 페이지 내 통합 표시 |
| 라우팅 방식 | `<NuxtLink>`, `navigateTo` | `navigateTo` | 프로그래밍 방식 네비게이션 필요 (카드 클릭 이벤트) |

---

## 5. 인수 기준

- [ ] AC-01: `/projects` 경로로 접근 시 프로젝트 목록이 카드 형태로 표시된다
- [ ] AC-02: GET /api/projects API가 정상적으로 호출되고 응답 데이터가 화면에 표시된다
- [ ] AC-03: 프로젝트 카드에 프로젝트명, 상태, 생성일, WBS 깊이가 표시된다
- [ ] AC-04: 프로젝트 카드 클릭 시 `/wbs?project={projectId}` 경로로 이동한다
- [ ] AC-05: 상태 필터(All/Active/Archived) 버튼이 동작하고 목록이 필터링된다
- [ ] AC-06: 로딩 중에는 PrimeVue Skeleton 또는 ProgressSpinner가 표시된다
- [ ] AC-07: API 에러 발생 시 InlineMessage로 에러 메시지가 표시된다
- [ ] AC-08: 프로젝트가 없을 때 "프로젝트가 없습니다" 안내 메시지가 표시된다
- [ ] AC-09: 기본 프로젝트(defaultProject)는 카드에 배지 또는 아이콘으로 표시된다
- [ ] AC-10: PrimeVue Card 컴포넌트를 사용하며 일반 HTML 태그를 사용하지 않는다
- [ ] AC-11: TypeScript 타입이 모든 변수, 함수, API 응답에 명시되어 있다
- [ ] AC-12: Composition API (`<script setup>`) 형태로 작성되어 있다

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| API 응답 지연 | Medium | useFetch의 pending 상태로 로딩 UI 표시, timeout 설정 |
| 프로젝트가 없는 경우 | Low | Empty State UI 제공, 프로젝트 생성 안내 (2차 기능) |
| 필터 상태 유지 안 됨 | Low | 초기에는 세션 내에서만 유지, 이후 필요 시 localStorage 추가 |
| 반응형 레이아웃 깨짐 | Medium | TailwindCSS 반응형 클래스 사용, 최소 너비 1200px 명시 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-03-01 | 선행 (완료) | GET /api/projects API 구현 필요 |
| TSK-01-02-01 | 선행 (완료) | AppLayout 컴포넌트 사용 (Header 포함) |
| TSK-01-01-02 | 선행 (완료) | PrimeVue 설정 완료 필요 |
| TSK-04-01 | 후행 | WBS 페이지 구현 (네비게이션 대상) |

---

## 7. 상세 설계 가이드

### 7.1 API 연동

**Endpoint**: `GET /api/projects`

**Response Type**:
```typescript
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
  createdAt: string; // ISO 8601
}
```

**호출 방식**:
- `useFetch` 사용
- 에러 처리 필수
- 로딩 상태 활용

### 7.2 UI 구조

**레이아웃**:
```
┌─────────────────────────────────────────────┐
│ Header (AppHeader 컴포넌트)                  │
├─────────────────────────────────────────────┤
│ 제목: Projects                              │
│ 필터: [All] [Active] [Archived]             │
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │ Card │ │ Card │ │ Card │ ...             │
│ └──────┘ └──────┘ └──────┘                 │
│ ┌──────┐ ┌──────┐                          │
│ │ Card │ │ Card │                          │
│ └──────┘ └──────┘                          │
└─────────────────────────────────────────────┘
```

**Card 내용**:
- 프로젝트명 (제목)
- 상태 배지 (Active/Archived)
- 생성일 (포맷: YYYY-MM-DD)
- WBS 깊이 (3단계/4단계)
- 기본 프로젝트 표시 (선택)

### 7.3 필터 동작

**상태**:
- `filterStatus`: 'all' | 'active' | 'archived'

**필터링 로직**:
- `all`: 모든 프로젝트 표시
- `active`: status === 'active' 프로젝트만
- `archived`: status === 'archived' 프로젝트만

**Computed Property 사용**:
```typescript
const filteredProjects = computed(() => {
  if (filterStatus.value === 'all') return projects.value;
  return projects.value.filter(p => p.status === filterStatus.value);
});
```

### 7.4 네비게이션

**카드 클릭 시**:
```typescript
const navigateToWbs = (projectId: string) => {
  navigateTo(`/wbs?project=${projectId}`);
};
```

---

## 8. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
- 상세설계 단계에서 다음 항목 정의:
  - 정확한 컴포넌트 구조 (템플릿 스켈레톤)
  - API 호출 및 에러 처리 상세 로직
  - PrimeVue 컴포넌트 props 및 스타일 명세
  - 테스트 시나리오

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-00)
- API 스펙: `server/api/projects/index.get.ts`
- 타입 정의: `server/utils/projects/types.ts`
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude (Requirements Analyst Agent)
Template Version: 1.0.0
Created: 2025-12-14
-->
