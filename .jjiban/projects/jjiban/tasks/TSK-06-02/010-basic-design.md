# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Testing |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 11 (Testing Strategy) |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-06-02 |
| 선행 Task | TSK-06-01 (Integration) | 전체 구현 대상 |

---

## 1. 목적 및 범위

### 1.1 목적

**핵심 목적**: jjiban 프로젝트의 품질 보증을 위한 포괄적 테스트 시스템 구축

**해결하는 문제**:
- WBS 파서, 워크플로우 엔진 등 핵심 유틸리티의 정확성 검증 필요
- 프론트엔드 컴포넌트의 UI/UX 동작 검증 필요
- 통합 페이지의 엔드투엔드 사용자 시나리오 검증 필요
- 회귀 버그 방지 및 코드 품질 유지 체계 확립

**제공하는 가치**:
- 코드 변경 시 자동화된 품질 검증
- 리팩토링 및 신규 기능 추가 시 안전성 보장
- 버그 조기 발견 및 수정 비용 절감
- CI/CD 파이프라인 통합으로 지속적 품질 관리

### 1.2 범위

**포함 범위**:

**단위 테스트 (Vitest)**:
- WBS 파서 (server/utils/wbs-parser.ts)
  - parseWbsMarkdown, parseNodeHeader, parseNodeAttributes
  - buildTree, calculateProgress, determineParentId
- WBS 시리얼라이저 (server/utils/wbs-serializer.ts)
  - serializeWbsTree, formatNode, formatAttributes
- 워크플로우 엔진 (server/utils/workflow-engine.ts)
  - getAvailableCommands, executeCommand, validateTransition
- Pinia 스토어 (app/stores/wbs.ts)
  - fetchWbs, saveWbs, filteredTree, expandAll/collapseAll
- 유틸리티 함수 (server/utils/*.ts)
  - 파일 읽기/쓰기, 설정 서비스, 프로젝트 서비스

**컴포넌트 테스트 (Vue Test Utils + Vitest)**:
- WbsTreePanel, WbsTreeHeader, WbsSummaryCards, WbsSearchBox
- 컴포넌트 렌더링, props 전달, 이벤트 emit
- Pinia 스토어 연동 검증

**E2E 테스트 (Playwright)**:
- WBS 페이지 전체 플로우
  - 트리 렌더링, 노드 선택, 펼치기/접기
  - 검색 기능, 필터링 결과
  - 상태 전이 (향후 WP-05 완료 후)
- API 통합 검증
  - GET /api/projects/:id/wbs
  - PUT /api/projects/:id/wbs
- 에러 핸들링 시나리오
- 접근성 (ARIA, 키보드 네비게이션)

**제외 범위**:
- Task Detail 패널 테스트 → TSK-05-04 (별도 Task)
- 워크플로우 상태 전이 E2E → TSK-05-03 완료 후 추가
- 성능 벤치마크 (부하 테스트) → 향후 최적화 Task
- 보안 테스트 (펜 테스트) → 별도 보안 Task

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WBS 파서가 Markdown을 올바른 트리 구조로 변환해야 함 | Critical | PRD 7.2 |
| FR-002 | WBS 시리얼라이저가 트리를 Markdown으로 정확히 직렬화해야 함 | Critical | PRD 7.2 |
| FR-003 | 워크플로우 엔진이 카테고리별 상태 전이 규칙을 준수해야 함 | Critical | PRD 5.2 |
| FR-004 | WBS 스토어가 데이터 조회/저장/필터링을 올바르게 처리해야 함 | High | PRD 9.3 |
| FR-005 | WbsTreePanel이 로딩/에러/빈 상태를 올바르게 렌더링해야 함 | High | PRD 6.2 |
| FR-006 | 검색 기능이 debounce와 함께 필터링을 수행해야 함 | Medium | PRD 6.2.1 |
| FR-007 | 펼치기/접기 버튼이 모든 노드 상태를 제어해야 함 | Medium | PRD 6.2.3 |
| FR-008 | E2E 테스트가 실제 사용자 시나리오를 커버해야 함 | High | PRD 11 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 | 측정 방법 |
|----|----------|------|-----------|
| NFR-001 | 테스트 커버리지 | >= 80% | Vitest coverage report |
| NFR-002 | 단위 테스트 실행 시간 | < 10초 | CI 측정 |
| NFR-003 | E2E 테스트 실행 시간 | < 2분 | Playwright report |
| NFR-004 | 테스트 안정성 (Flakiness) | 재시도 없이 100% 통과 | 10회 연속 실행 |
| NFR-005 | 접근성 검증 | axe-core 위반 0건 | Playwright axe 플러그인 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**테스트 계층 구조** (테스트 피라미드):

```
         /\
        /  \  E2E (8개) - 사용자 시나리오, 통합 검증
       /    \
      /------\  컴포넌트 (15개) - UI 동작, 이벤트 처리
     /--------\
    /----------\  단위 (40개) - 함수 로직, 데이터 변환
   /------------\
```

**테스트 도구 스택**:
- **단위 테스트**: Vitest (빠른 실행, HMR 지원)
- **컴포넌트 테스트**: @vue/test-utils + Vitest (Vue 3 최적화)
- **E2E 테스트**: Playwright (크로스 브라우저, 안정성)
- **커버리지**: @vitest/coverage-v8 (빠른 수집)
- **접근성**: @axe-core/playwright (WCAG 검증)

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| **단위 테스트 스위트** | 함수/서비스 검증 | 순수 함수 로직 정확성, 엣지 케이스 처리 |
| **컴포넌트 테스트 스위트** | Vue 컴포넌트 검증 | 렌더링, props, 이벤트, 조건부 표시 |
| **E2E 테스트 스위트** | 전체 플로우 검증 | 사용자 시나리오, API 통합, 에러 핸들링 |
| **테스트 픽스처** | Mock 데이터 관리 | 일관된 테스트 데이터 제공 |
| **테스트 헬퍼** | 공통 유틸 | 반복 로직 추상화, 가독성 향상 |

### 3.3 데이터 흐름

**단위 테스트 흐름**:
```
테스트 케이스 → 함수 호출 (Mock 입력) → 결과 검증 (Assertion) → 통과/실패
```

**컴포넌트 테스트 흐름**:
```
컴포넌트 마운트 (Mock Pinia) → 사용자 인터랙션 시뮬레이션 → DOM 상태 검증 → Spy 호출 확인
```

**E2E 테스트 흐름**:
```
브라우저 실행 → 페이지 로드 → API Mock/실제 호출 → 사용자 액션 재현 → UI 변화 검증
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| **단위 테스트 프레임워크** | Vitest, Jest | **Vitest** | Vite 네이티브 통합, ESM 지원, 빠른 HMR |
| **E2E 프레임워크** | Cypress, Playwright | **Playwright** | 크로스 브라우저, API 인터셉트, 안정성 높음 |
| **컴포넌트 테스트 전략** | Testing Library, Vue Test Utils | **Vue Test Utils** | Vue 공식, Composition API 지원 우수 |
| **Mock 전략** | MSW, Vitest Mock | **Vitest Mock** | 단위 테스트에 충분, 설정 간단 |
| **테스트 데이터 관리** | Inline, Fixtures | **Fixtures** | 재사용성, 가독성, 유지보수성 |
| **CI/CD 통합** | GitHub Actions, GitLab CI | **GitHub Actions** | 무료, 생태계 풍부, 병렬 실행 |

---

## 5. 테스트 범위 상세

### 5.1 단위 테스트 대상

**파서 모듈 (server/utils/wbs/parser.ts)** - 20개 테스트:
- parseNodeHeader: 정상/비정상 헤더, ID 형식, 특수문자
- parseNodeAttributes: 9가지 속성 파싱, 유효성 검증
- buildTree: 3단계/4단계 구조, 고아 노드 처리
- calculateProgress: 진행률 계산, 중첩 구조
- parseWbsMarkdown: 통합 테스트, 에러 핸들링

**시리얼라이저 모듈** - 10개 테스트:
- serializeWbsTree: 트리 → Markdown 변환
- formatNode: 레벨별 헤딩, 속성 포맷팅
- 왕복 변환 (parse → serialize → parse) 무결성

**워크플로우 엔진** - 15개 테스트:
- getAvailableCommands: 카테고리별 명령 반환
- executeCommand: 상태 전이 실행, 검증
- 워크플로우 규칙 준수 (development, defect, infrastructure)

**Pinia 스토어** - 10개 테스트:
- fetchWbs, saveWbs: API 호출, 에러 처리
- filteredTree: 검색 필터링, 빈 검색어
- expandAll, collapseAll: 상태 관리

### 5.2 컴포넌트 테스트 대상

**WbsTreePanel** - 5개 테스트:
- 마운트 시 fetchWbs 호출
- 로딩/에러/빈 상태 렌더링
- 헤더와 트리 컴포넌트 포함 확인

**WbsTreeHeader** - 4개 테스트:
- 타이틀, 아이콘 렌더링
- 펼치기/접기 버튼 클릭 이벤트

**WbsSummaryCards** - 3개 테스트:
- 4개 카드 렌더링
- wpCount, actCount, tskCount 계산
- overallProgress 계산

**WbsSearchBox** - 3개 테스트:
- 검색어 입력 시 debounce
- X 버튼 클릭 시 초기화
- 포커스 관리

### 5.3 E2E 테스트 시나리오

**기본 플로우** (4개):
1. 페이지 로드 → WBS 데이터 표시
2. 헤더 요소 전체 확인
3. 통계 카드 값 정확성
4. 로딩 스피너 → 콘텐츠 전환

**검색 기능** (2개):
1. 검색어 입력 → 필터링 결과
2. X 버튼 → 초기화

**트리 액션** (2개):
1. 전체 펼치기
2. 전체 접기

**에러 핸들링** (1개):
1. API 오류 → 에러 메시지 표시

**접근성** (2개):
1. axe-core 검증
2. 키보드 네비게이션

---

## 6. 테스트 데이터 전략

### 6.1 Fixture 구조

**위치**: `tests/fixtures/`

**파일**:
- `wbs/complex.md`: 4단계 구조 + 3단계 혼합
- `wbs/3level.md`: 3단계 구조만
- `wbs/4level.md`: 4단계 구조만
- `wbs/error.md`: 오류 포함 (검증용)
- `wbs/minimal.md`: 최소 속성
- `wbs-data.ts`: TypeScript Mock 데이터

### 6.2 Mock 전략

**API Mock (E2E)**:
- Playwright route interception 사용
- 성공/실패 시나리오 별도 설정
- 동시성 충돌 시뮬레이션

**Pinia Mock (컴포넌트)**:
- createPinia() 테스트별 격리
- 스토어 상태 직접 조작
- Spy로 액션 호출 확인

**파일 시스템 Mock (단위)**:
- Vitest vi.mock() 사용
- readFileSync, writeFileSync 모킹
- 에러 시나리오 주입

---

## 7. 인수 기준

- [ ] **AC-01**: 모든 단위 테스트 통과 (40개 이상)
- [ ] **AC-02**: 모든 컴포넌트 테스트 통과 (15개 이상)
- [ ] **AC-03**: 모든 E2E 테스트 통과 (8개 이상)
- [ ] **AC-04**: 코드 커버리지 >= 80% (statements)
- [ ] **AC-05**: 브랜치 커버리지 >= 75%
- [ ] **AC-06**: 단위 테스트 실행 시간 < 10초
- [ ] **AC-07**: E2E 테스트 실행 시간 < 2분
- [ ] **AC-08**: axe-core 접근성 위반 0건
- [ ] **AC-09**: Flaky 테스트 0개 (10회 연속 실행 시)
- [ ] **AC-10**: CI/CD 파이프라인 통합 완료

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| **테스트 실행 시간 증가** | Medium | 병렬 실행, 선택적 테스트 (unit/e2e 분리) |
| **Flaky E2E 테스트** | High | waitForLoadState, 명시적 대기, 재시도 전략 |
| **Mock 데이터 불일치** | Medium | Fixtures 중앙 관리, 스키마 검증 |
| **CI 환경 차이** | Low | Docker 컨테이너, 환경 변수 통일 |
| **브라우저 호환성 이슈** | Low | Chromium만 우선, Firefox/WebKit 선택적 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| **TSK-06-01** | 선행 (Hard) | Integration 구현 완료 필요 |
| **TSK-02-02-01** | 선행 (Hard) | WBS 파서 구현 필요 |
| **TSK-03-04** | 선행 (Hard) | 워크플로우 엔진 구현 필요 |
| **TSK-04-01** | 선행 (Hard) | WBS Tree 컴포넌트 구현 필요 |
| **TSK-05-03** | 후행 (Soft) | Task Detail 테스트는 별도 추가 |

---

## 9. 구현 가이드라인

### 9.1 테스트 파일 네이밍

**단위 테스트**:
```
tests/utils/{domain}/{filename}.test.ts
예: tests/utils/wbs/parser.test.ts
```

**컴포넌트 테스트**:
```
tests/unit/components/{domain}/{ComponentName}.spec.ts
예: tests/unit/components/wbs/WbsTreePanel.spec.ts
```

**E2E 테스트**:
```
tests/e2e/{feature}.spec.ts
예: tests/e2e/wbs-tree-panel.spec.ts
```

### 9.2 테스트 구조 패턴

**단위 테스트**:
```typescript
describe('functionName', () => {
  it('should handle normal case', () => {
    // Given: 입력 준비
    // When: 함수 실행
    // Then: 결과 검증
  })
})
```

**컴포넌트 테스트**:
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render correctly', () => {
    const wrapper = mount(Component)
    expect(wrapper.find('[data-testid="element"]').exists()).toBe(true)
  })
})
```

**E2E 테스트**:
```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path')
    await page.waitForLoadState('networkidle')
  })

  test('should complete user scenario', async ({ page }) => {
    // Arrange: 초기 상태
    // Act: 사용자 액션
    // Assert: 최종 상태 검증
  })
})
```

### 9.3 커버리지 목표

**필수 커버**:
- 모든 public 함수 (파서, 시리얼라이저, 엔진)
- 모든 Pinia 액션 및 getter
- 모든 컴포넌트 렌더링 경로
- 모든 에러 핸들링 브랜치

**제외 가능**:
- 타입 정의 파일 (.d.ts)
- 설정 파일 (nuxt.config.ts)
- 테스트 픽스처 자체

---

## 10. 다음 단계

### 10.1 상세설계 (/wf:draft)
- 각 테스트 케이스별 상세 명세 작성
- Given-When-Then 시나리오 구체화
- Mock 데이터 스펙 정의
- 예상 결과 상세 기술

### 10.2 구현 (/wf:build)
- 테스트 픽스처 생성
- 단위 테스트 작성 (40개)
- 컴포넌트 테스트 작성 (15개)
- E2E 테스트 작성 (8개)
- CI/CD 파이프라인 설정

### 10.3 검증 (/wf:verify)
- 전체 테스트 실행 및 통과 확인
- 커버리지 리포트 검토
- Flaky 테스트 제거
- 성능 벤치마크 확인
- 접근성 검증

---

## 관련 문서

- **PRD**: `.jjiban/projects/jjiban/prd.md` (섹션 11)
- **WBS**: `.jjiban/projects/jjiban/wbs.md` (TSK-06-02)
- **참조 테스트**: `tests/utils/wbs/parser.test.ts` (기존 패턴)
- **참조 테스트**: `tests/e2e/wbs.spec.ts` (기존 E2E)
- **Template**: `.jjiban/templates/010-basic-design.md`

---

<!--
author: Claude (Requirements Analyst)
Template Version: 1.0.0
Created: 2025-12-15
-->
