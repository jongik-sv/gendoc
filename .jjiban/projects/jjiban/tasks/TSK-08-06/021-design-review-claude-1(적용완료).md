# 설계 리뷰 보고서

## 리뷰 정보
- **리뷰어**: Claude Sonnet 4.5
- **리뷰 일시**: 2025-12-16
- **리뷰 대상**: TSK-08-06 Theme Integration & E2E Testing 설계 문서

## 리뷰 결과 요약
- **총 지적 사항**: 8건
- **Critical**: 2건
- **Major**: 3건
- **Minor**: 3건

---

## 상세 지적 사항

### [Critical-01]: HEX 하드코딩 제거 범위 누락

- **위치**: `020-detail-design.md` 섹션 3 (HEX 하드코딩 제거 계획)
- **현재 상태**:
  - 설계 문서에서 `TaskDocuments.vue` 1건만 언급
  - 실제 코드베이스 검색 결과 다수의 HEX 하드코딩 발견:
    - `TaskProgress.vue`: 6건 (워크플로우 노드 배경색)
    - `WbsSearchBox.vue`: 2건 (검색 아이콘, 입력 필드 스타일)
    - `WbsSummaryCards.vue`: 2건 (카드 배경, 텍스트 색상)
    - `WbsTreeHeader.vue`: 2건 (헤더 배경, 텍스트 색상)
    - `WbsTreeNode.vue`: 3건 (보더, outline, 텍스트 색상)
- **영향 범위**: FR-006 (HEX 하드코딩 제거 검증) 인수 기준 미달
- **개선 제안**:
  ```markdown
  ## 3.2 수정 대상 상세 확장

  #### 3.2.1 TaskDocuments.vue
  현재 설계대로 수정

  #### 3.2.2 TaskProgress.vue (NEW)
  **현재 코드** (Line 35-50):
  ```css
  .workflow-node-completed {
    background-color: #22c55e; /* green-500 */
  }
  .workflow-node-current {
    background-color: #3b82f6; /* blue-500 */
  }
  .workflow-node-pending {
    background-color: #e5e7eb; /* gray-200 */
    border: 2px solid #d1d5db; /* gray-300 */
  }
  ```

  **수정 방안**: main.css에 이미 정의된 클래스 사용
  ```css
  .workflow-node-completed {
    @apply workflow-step-completed;
  }
  .workflow-node-current {
    @apply workflow-step-current;
  }
  .workflow-node-pending {
    @apply workflow-step-pending;
  }
  ```

  #### 3.2.3 WbsSearchBox.vue, WbsSummaryCards.vue, WbsTreeHeader.vue (NEW)
  - 모든 HEX 값을 Tailwind 클래스 또는 CSS 변수로 변경
  - 예: `text-[#888888]` → `text-text-secondary`
  - 예: `bg-[#1e1e38]` → `bg-bg-card`
  ```

### [Critical-02]: PrimeVue 디자인 토큰 누락

- **위치**: `020-detail-design.md` 섹션 1.1 (PrimeVue 디자인 토큰)
- **현재 상태**:
  - `--p-progressbar-value-background` 토큰이 정의되지 않음
  - 주석으로 "동적 클래스로 관리" 언급만 있음
- **문제점**:
  - PrimeVue ProgressBar 컴포넌트는 `--p-progressbar-value-background` 토큰 사용
  - 동적 클래스(.progress-bar-low/medium/high)는 커스텀 구현에만 적용됨
  - PrimeVue 기본 ProgressBar를 사용할 경우 토큰이 필요함
- **영향 범위**: FR-005 (PrimeVue ProgressBar 토큰 매핑) 불완전
- **개선 제안**:
  ```css
  /* PrimeVue ProgressBar 컴포넌트 */
  :root {
    --p-progressbar-background: var(--color-border);
    --p-progressbar-height: 0.5rem;
    --p-progressbar-border-radius: 0.25rem;

    /* 기본 값 배경색 정의 (중간값) */
    --p-progressbar-value-background: var(--color-warning); /* #f59e0b */

    /* 동적 클래스로 오버라이드 가능:
     * .progress-bar-low, .progress-bar-medium, .progress-bar-high
     * 이 클래스들이 적용되면 background-color가 재정의됨 */

    --p-progressbar-label-color: var(--color-text);
    --p-progressbar-label-font-size: 0.75rem;
  }
  ```

### [Major-01]: E2E 테스트 케이스 불완전성

- **위치**: `020-detail-design.md` 섹션 2.1 (E2E 테스트 케이스)
- **현재 상태**:
  - TC-01 ~ TC-08만 작성됨
  - 기존 E2E 테스트 파일 수정 사항이 3개 파일만 언급됨
- **문제점**:
  - 실제 E2E 테스트 파일이 18개 이상 존재 (e2e 폴더)
  - 주요 파일 누락:
    - `detail-panel.spec.ts`: TaskDetailPanel Dialog 검증 필요
    - `detail-sections.spec.ts`: TaskWorkflow, TaskHistory, TaskDocuments 검증 필요
    - `header.spec.ts`: Menubar 스타일 검증 추가 필요 (일부만 언급됨)
- **영향 범위**: FR-007 (기존 E2E 테스트 회귀 검증) 범위 부족
- **개선 제안**:
  ```markdown
  ### 2.3 기존 테스트 파일 수정 확장

  **파일**: `tests/e2e/detail-panel.spec.ts`

  ```typescript
  // Dialog 스타일 검증 추가
  test('Dialog가 올바른 다크 테마 스타일을 가진다', async ({ page }) => {
    await page.goto(`/wbs?project=${TEST_PROJECT_ID}`)

    // 첫 번째 Task 클릭하여 Dialog 열기
    const firstTask = page.locator('[data-testid^="wbs-tree-node-TSK-"]').first()
    await firstTask.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Dialog 배경색 검증 (NEW - TSK-08-06)
    await expect(dialog).toHaveCSS('background-color', 'rgb(30, 30, 56)')

    // Dialog 헤더 배경색 검증
    const dialogHeader = page.locator('.p-dialog-header')
    await expect(dialogHeader).toHaveCSS('background-color', 'rgb(22, 33, 62)')
  })
  ```

  **파일**: `tests/e2e/detail-sections.spec.ts`

  ```typescript
  // TaskWorkflow, TaskHistory, TaskDocuments 스타일 검증 추가
  test('TaskWorkflow 현재 단계가 강조 표시된다', async ({ page }) => {
    // Dialog 열기 후 Workflow 탭 확인
    const currentStep = page.locator('.workflow-step-current')

    // 배경색 검증 (NEW - TSK-08-06)
    await expect(currentStep).toHaveCSS('background-color', 'rgb(59, 130, 246)')

    // scale 효과 검증
    const transform = await currentStep.evaluate(el =>
      window.getComputedStyle(el).transform
    )
    expect(transform).toContain('matrix(1.1') // scale(1.1)
  })
  ```

### [Major-02]: 접근성 검증 방법 불명확

- **위치**: `020-detail-design.md` 섹션 2.1, TC-06 (색상 대비 검증)
- **현재 상태**:
  - `calculateContrast` 함수 inline 정의
  - axe-core 언급 있으나 구체적 통합 방법 없음
- **문제점**:
  - Playwright accessibility API는 제한적 (스냅샷만 제공)
  - axe-core 통합이 더 신뢰성 있으나 설치/설정 누락
  - 색상 대비 계산 함수의 정확성 검증 없음
- **영향 범위**: NFR-001 (접근성 WCAG 2.1 AA 기준) 검증 신뢰성
- **개선 제안**:
  ```markdown
  ## 6.1 접근성 테스트 헬퍼 추가

  **파일**: `tests/helpers/accessibility-helpers.ts` (신규)

  ```typescript
  /**
   * WCAG 2.1 색상 대비 계산 (검증된 알고리즘)
   * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
   */
  export function calculateContrast(rgb1: string, rgb2: string): number {
    // ... (현재 설계의 함수 그대로)
  }

  /**
   * 색상 대비 검증 (AA 기준 4.5:1, AAA 기준 7:1)
   */
  export async function verifyColorContrast(
    page: Page,
    element: Locator,
    background: Locator,
    level: 'AA' | 'AAA' = 'AA'
  ): Promise<void> {
    const textColor = await element.evaluate(el =>
      window.getComputedStyle(el).color
    )
    const bgColor = await background.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )

    const contrast = calculateContrast(textColor, bgColor)
    const threshold = level === 'AAA' ? 7.0 : 4.5

    expect(contrast).toBeGreaterThanOrEqual(threshold)
  }
  ```

  **TC-06 수정**:
  ```typescript
  import { verifyColorContrast } from '../helpers/accessibility-helpers'

  test('TC-06: 주요 텍스트 색상이 WCAG 2.1 AA 기준(4.5:1)을 만족한다', async ({ page }) => {
    await page.goto('/wbs')

    // WBS Tree 노드 텍스트 대비 검증
    const treeNode = page.locator('.wbs-tree-node-title').first()
    const treeBackground = page.locator('.wbs-tree')

    await verifyColorContrast(page, treeNode, treeBackground, 'AA')

    // Menubar 텍스트 대비 검증
    const menuItem = page.locator('.menubar-item').first()
    const menuBackground = page.locator('.app-menubar')

    await verifyColorContrast(page, menuItem, menuBackground, 'AA')
  })
  ```

### [Major-03]: 테스트 명세 불일치

- **위치**: `026-test-specification.md` vs `020-detail-design.md`
- **현재 상태**:
  - `026-test-specification.md`의 테스트 케이스 ID가 간소화됨
  - TC-TREE-01~05, TC-SPLITTER-01~03 등으로 정의
  - `020-detail-design.md`의 theme-integration.spec.ts는 TC-01~08 사용
- **문제점**:
  - 테스트 ID 불일치로 추적성 매트릭스와 연결 어려움
  - 테스트 명세가 구현 코드보다 간소화되어 있음
- **영향 범위**: 025-traceability-matrix.md 추적성 저하
- **개선 제안**:
  - **Option 1**: 상세설계의 TC-01~08을 그대로 사용하고, 테스트 명세 업데이트
  - **Option 2**: 테스트 명세의 세분화된 ID를 사용하고, 상세설계 코드 업데이트
  - **추천**: Option 1 (구현 코드 수정 최소화)

  ```markdown
  ## 026-test-specification.md 수정

  | TC ID | 테스트 항목 | 기대 결과 | 우선순위 |
  |-------|-----------|----------|---------|
  | TC-01 | WbsTreePanel Tree 컴포넌트 스타일 검증 | jjiban 다크 테마 사용 | High |
  | TC-02 | AppLayout Splitter Gutter 스타일 검증 | jjiban 다크 테마 사용 | High |
  | TC-03 | AppHeader Menubar 스타일 검증 | jjiban 다크 테마 사용 | High |
  | TC-04 | TaskDetailPanel Dialog 스타일 검증 | jjiban 다크 테마 사용 | Medium |
  | TC-05 | 기존 컴포넌트 회귀 검증 | 정상 표시 | High |
  | TC-06 | 색상 대비 검증 (WCAG 2.1 AA) | 4.5:1 이상 | High |
  | TC-07 | 키보드 탐색 검증 | 전체 UI 접근 가능 | Medium |
  | TC-08 | ARIA 속성 검증 | 적절한 값 설정 | Medium |
  ```

### [Minor-01]: 성능 검증 기준 모호

- **위치**: `011-ui-design.md` 섹션 9 (성능 검증), `020-detail-design.md` 섹션 6.5
- **현재 상태**:
  - "PrimeVue 마이그레이션 후 렌더링 성능 저하 < 5%" 기준 제시
  - 기준값(baseline) 측정 방법 없음
- **문제점**:
  - 마이그레이션 전 기준값이 없으면 5% 저하 판단 불가
  - 성능 측정 도구 및 지표가 구체적이지 않음
- **영향 범위**: NFR-002 (성능 저하 < 5%) 검증 불가능
- **개선 제안**:
  ```markdown
  ## 6.5 Phase 5: 성능 측정 (수정)

  **전제 조건**: 마이그레이션 전 기준값 측정 또는 합리적 추정

  ### 성능 측정 방법

  1. **기준값 설정**:
     - Option A: TSK-08-05 완료 시점 성능 측정 (이미 지나감)
     - Option B: 현재 성능을 기준값으로 설정 (마이그레이션 이미 완료)
     - **권장**: Option B - 현재 성능이 수용 가능한 수준인지 절대값 기준 확인

  2. **절대 기준**:
     - FCP (First Contentful Paint): < 1.5초
     - LCP (Largest Contentful Paint): < 2.5초
     - TTI (Time to Interactive): < 3.0초

  3. **측정 도구**:
     - Playwright performance API
     - Chrome DevTools Performance 탭

  4. **측정 방법**:
     ```typescript
     test('성능: FCP/LCP/TTI가 기준 이내이다', async ({ page }) => {
       const metrics = await page.evaluate(() => {
         const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
         return {
           fcp: perfData.responseEnd - perfData.requestStart,
           domContentLoaded: perfData.domContentLoadedEventEnd - perfData.requestStart,
           loadComplete: perfData.loadEventEnd - perfData.requestStart
         }
       })

       expect(metrics.fcp).toBeLessThan(1500) // 1.5초
       expect(metrics.domContentLoaded).toBeLessThan(2500) // 2.5초
       expect(metrics.loadComplete).toBeLessThan(3000) // 3.0초
     })
     ```
  ```

### [Minor-02]: main.css 파일 크기 및 가독성

- **위치**: `020-detail-design.md` 섹션 1.1 (PrimeVue 디자인 토큰)
- **현재 상태**:
  - main.css에 이미 520줄의 코드 존재
  - 추가로 166줄의 PrimeVue 토큰 정의 계획
  - 총 686줄 예상
- **문제점**:
  - 단일 파일이 너무 커져 유지보수성 저하
  - PrimeVue 토큰 / jjiban 테마 / 커스텀 클래스가 혼재
- **영향 범위**: 유지보수성 (NFR-004)
- **개선 제안** (선택적):
  ```markdown
  ### CSS 파일 분리 (장기 개선사항)

  현재는 main.css에 통합 관리하되, 향후 다음과 같이 분리 고려:

  ```
  app/assets/css/
  ├── main.css              (진입점, imports만)
  ├── theme/
  │   ├── variables.css     (jjiban 테마 CSS 변수)
  │   ├── primevue.css      (PrimeVue 디자인 토큰 오버라이드)
  │   └── utilities.css     (커스텀 유틸리티 클래스)
  └── components/
      ├── wbs-tree.css      (WbsTreePanel 관련)
      ├── menubar.css       (AppHeader 관련)
      └── ...
  ```

  **TSK-08-06에서는 현재 설계대로 main.css에 통합하고,
  향후 리팩토링 Task로 분리 검토 권장**

### [Minor-03]: E2E 테스트 실행 시간

- **위치**: `020-detail-design.md` 섹션 5.2 (테스트 케이스 요약)
- **현재 상태**:
  - 총 예상 소요 시간: 약 5분 (신규 테스트만)
  - 기존 E2E 테스트 실행 시간 미고려
- **문제점**:
  - 기존 18개 테스트 파일 실행 시간 추가 필요
  - CI/CD 파이프라인에서 전체 테스트 소요 시간 중요
- **영향 범위**: 개발 워크플로우 효율성
- **개선 제안**:
  ```markdown
  ## 5.2 테스트 케이스 요약 (수정)

  ### 신규 테스트 (theme-integration.spec.ts)
  | TC ID | 테스트명 | 예상 소요 시간 |
  |-------|---------|-------------|
  | TC-01 ~ TC-08 | (현재 설계 그대로) | 약 5분 |

  ### 기존 테스트 수정 (예상 +10초씩 증가)
  - layout.spec.ts: +10초 (Splitter 스타일 검증 추가)
  - wbs-tree-panel.spec.ts: +10초 (Tree 스타일 검증 추가)
  - header.spec.ts: +10초 (Menubar 스타일 검증 추가)
  - detail-panel.spec.ts: +10초 (Dialog 스타일 검증 추가)
  - detail-sections.spec.ts: +10초 (섹션 스타일 검증 추가)

  **전체 E2E 테스트 예상 시간**:
  - 기존 테스트: 약 8분 (가정)
  - 신규 + 수정: 약 6분
  - **총 예상 시간**: 약 14분

  **최적화 방안**:
  - 병렬 실행 (`--workers=4`): 약 4~5분으로 단축 가능
  - 스크린샷 최소화: 필수 케이스만 캡처
  ```

---

## 긍정적 평가

### 1. 체계적인 설계 구조
- 기본설계(010) → 화면설계(011) → 상세설계(020) → 추적성 매트릭스(025) → 테스트 명세(026)의 완전한 문서 계층 구조
- 각 문서 간 참조가 명확하고 일관성 있음

### 2. CSS 클래스 중앙화 원칙 준수
- PrimeVue 디자인 토큰 오버라이드 방식이 jjiban 아키텍처와 일치
- 모든 토큰이 기존 CSS 변수(--color-*)를 재사용하여 일관성 확보
- Tailwind CSS와 PrimeVue 통합 방식이 명확함

### 3. 접근성 고려
- WCAG 2.1 AA 기준 명시적 적용
- 색상 대비, 키보드 탐색, ARIA 속성 검증 포함
- 실제 검증 가능한 테스트 케이스 작성

### 4. E2E 테스트 커버리지
- 기존 테스트 회귀 방지 + 신규 컴포넌트 검증 병행
- 시각적 검증(CSS 계산값) + 기능 검증(상호작용) 모두 포함
- 스크린샷 캡처로 시각적 기록 보존

### 5. 실용적인 구현 순서
- Phase 1~5로 명확한 단계 구분
- 예상 구현 시간 2.5시간으로 합리적
- 각 Phase별 산출물 및 검증 방법 명시

### 6. 위험 관리
- 기술적 리스크 및 일정 리스크 식별
- 각 리스크별 완화 방안 제시
- 의존성 및 영향도 분석 포함

---

## 결론

### 리뷰 통과 여부
**조건부 통과** (Conditional Pass)

### 필수 수정 사항 (Critical 항목)
1. **[Critical-01]**: HEX 하드코딩 제거 범위를 전체 컴포넌트로 확대
   - TaskProgress.vue, WbsSearchBox.vue, WbsSummaryCards.vue, WbsTreeHeader.vue, WbsTreeNode.vue 추가
   - 총 16건의 HEX 하드코딩 제거 필요

2. **[Critical-02]**: PrimeVue ProgressBar 토큰 완성
   - `--p-progressbar-value-background` 토큰 정의 추가
   - 기본값 설정 및 동적 클래스 오버라이드 방식 문서화

### 권장 수정 사항 (Major 항목)
3. **[Major-01]**: E2E 테스트 파일 수정 범위 확대
   - detail-panel.spec.ts, detail-sections.spec.ts에 스타일 검증 추가
   - 기존 18개 테스트 파일 중 영향받는 모든 파일 식별

4. **[Major-02]**: 접근성 검증 헬퍼 함수 분리
   - `tests/helpers/accessibility-helpers.ts` 신규 생성
   - `verifyColorContrast` 함수로 재사용성 확보

5. **[Major-03]**: 테스트 명세와 상세설계 ID 통일
   - TC-01~08로 일관성 유지
   - 025-traceability-matrix.md 업데이트

### 선택적 개선 사항 (Minor 항목)
6. 성능 검증 기준을 절대값 기준으로 변경 (상대 비교 → 절대 임계값)
7. main.css 파일 크기 모니터링 (향후 분리 고려)
8. 전체 E2E 테스트 실행 시간 산정 및 최적화 방안 추가

### 구현 진행 조건
- **Critical 항목 2건 모두 설계 문서에 반영 후 `/wf:build` 진행 권장**
- Major 항목은 구현 중 단계적으로 반영 가능
- Minor 항목은 선택적으로 반영

### 최종 평가
설계의 전반적인 방향성과 품질은 우수하나, HEX 하드코딩 제거 범위가 실제 코드베이스와 불일치합니다.
Critical 항목 수정 후 구현을 진행하면 TSK-08-06의 목표(테마 통합 및 E2E 검증)를 성공적으로 달성할 수 있을 것으로 판단됩니다.

---

## 다음 단계

1. **설계 문서 업데이트**:
   - `020-detail-design.md` 섹션 3.2 확장 (HEX 하드코딩 제거 범위)
   - `020-detail-design.md` 섹션 1.1 수정 (ProgressBar 토큰 추가)

2. **테스트 헬퍼 작성**:
   - `tests/helpers/accessibility-helpers.ts` 신규 생성

3. **테스트 명세 동기화**:
   - `026-test-specification.md` TC ID 통일

4. **구현 진행**:
   - Critical 항목 수정 완료 후 `/wf:build` 명령어 실행

---

<!--
리뷰어: Claude Sonnet 4.5
리뷰 방법론:
- 설계 문서 vs 실제 코드베이스 cross-check
- 요구사항 추적성 검증 (REQ → 설계 → 테스트)
- 기존 E2E 테스트 구조 분석
- CSS 변수 및 클래스 일관성 검증
- WCAG 2.1 기준 적용 타당성 검토

Created: 2025-12-16
-->
