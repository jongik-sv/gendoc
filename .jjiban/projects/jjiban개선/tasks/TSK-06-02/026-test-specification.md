# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Gantt 차트 의존성 화살표 |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-17 |
| 작성자 | Claude Code |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | useGanttDependencies composable | 80% 이상 (라인 커버리지) |
| E2E 테스트 | 화살표 렌더링, 인터랙션, 성능 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | 시각적 검증, 접근성, 브라우저 호환성 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright |
| 테스트 데이터 | .jjiban/jjiban개선 프로젝트 (실제 WBS 데이터 활용) |
| 브라우저 | Chromium (기본), Firefox (호환성 테스트), Webkit (Safari) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | buildGanttArrows | 정상 의존관계 변환 | GanttArrow[] 반환 | FR-001 |
| UT-002 | buildGanttArrows | Task 바 DOM 미발견 | 빈 배열 반환, 콘솔 경고 | FR-001 |
| UT-003 | calculateArrowPath | 수평 정렬 Task | 올바른 SVG path 반환 | FR-002 |
| UT-004 | calculateArrowPath | 수직 간격 큰 Task | 계단식 경로 생성 | FR-002, FR-005 |
| UT-005 | getArrowStatus | Task 상태별 ArrowStatus | completed/active/pending 반환 | FR-003 |
| UT-006 | GanttDependencyOverlay | 화살표 호버 이벤트 | arrowHover emit 발생 | FR-004 |
| UT-007 | buildGanttArrows | 100개 Task 성능 | 실행 시간 < 100ms | NFR-001 |

### 2.2 테스트 케이스 상세

#### UT-001: buildGanttArrows 정상 의존관계 변환

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('buildGanttArrows') → it('should convert edges to gantt arrows')` |
| **Mock 의존성** | JSDOM 환경, Task 바 DOM 요소 Mock |
| **입력 데이터** | `edges: [{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }]` |
| **Mock DOM** | `<div data-id="TSK-A" style="left:0; top:0; width:100px; height:40px;"></div>` |
| **검증 포인트** | 반환 배열 길이 1, arrow.id === 'A-B', arrow.path 존재 |
| **커버리지 대상** | `buildGanttArrows()` 메서드 정상 분기 |
| **관련 요구사항** | FR-001 |

**테스트 코드 구조 (개념)**:
```typescript
it('should convert edges to gantt arrows', () => {
  // Arrange: Mock DOM 설정
  const containerEl = createMockContainer([
    { taskId: 'TSK-A', left: 0, top: 0, width: 100, height: 40 },
    { taskId: 'TSK-B', left: 200, top: 50, width: 100, height: 40 }
  ])
  const edges: TaskEdge[] = [{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }]

  // Act
  const { buildGanttArrows } = useGanttDependencies()
  const arrows = buildGanttArrows(edges, containerEl)

  // Assert
  expect(arrows).toHaveLength(1)
  expect(arrows[0].id).toBe('A-B')
  expect(arrows[0].sourceId).toBe('TSK-A')
  expect(arrows[0].targetId).toBe('TSK-B')
  expect(arrows[0].path).toContain('M')  // SVG path 시작 명령어
})
```

#### UT-002: buildGanttArrows Task 바 DOM 미발견

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('buildGanttArrows') → it('should handle missing task bars gracefully')` |
| **Mock 의존성** | 빈 컨테이너 (Task 바 없음) |
| **입력 데이터** | `edges: [{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }]` |
| **검증 포인트** | 빈 배열 반환, console.warn 호출 확인 |
| **커버리지 대상** | `buildGanttArrows()` 에러 처리 분기 |
| **관련 요구사항** | FR-001 |

**테스트 코드 구조 (개념)**:
```typescript
it('should handle missing task bars gracefully', () => {
  // Arrange
  const containerEl = createMockContainer([])  // 빈 컨테이너
  const edges: TaskEdge[] = [{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }]
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

  // Act
  const { buildGanttArrows } = useGanttDependencies()
  const arrows = buildGanttArrows(edges, containerEl)

  // Assert
  expect(arrows).toHaveLength(0)
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Task 바 미발견'))
})
```

#### UT-003: calculateArrowPath 수평 정렬 Task

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('calculateArrowPath') → it('should generate step path for horizontally aligned tasks')` |
| **입력 데이터** | `source: { right: 100, centerY: 20 }`, `target: { left: 200, centerY: 20 }` |
| **검증 포인트** | path === `M 100,20 H 150 V 20 H 200` |
| **커버리지 대상** | `calculateArrowPath()` 메서드 |
| **관련 요구사항** | FR-002 |

**테스트 코드 구조 (개념)**:
```typescript
it('should generate step path for horizontally aligned tasks', () => {
  // Arrange
  const source: GanttTaskBounds = { taskId: 'A', left: 0, right: 100, top: 0, bottom: 40, centerY: 20 }
  const target: GanttTaskBounds = { taskId: 'B', left: 200, right: 300, top: 0, bottom: 40, centerY: 20 }

  // Act
  const { calculateArrowPath } = useGanttDependencies()
  const path = calculateArrowPath(source, target)

  // Assert
  expect(path).toBe('M 100,20 H 150 V 20 H 200')
})
```

#### UT-004: calculateArrowPath 수직 간격 큰 Task

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('calculateArrowPath') → it('should generate step path for vertically separated tasks')` |
| **입력 데이터** | `source: { right: 100, centerY: 20 }`, `target: { left: 200, centerY: 120 }` |
| **검증 포인트** | path === `M 100,20 H 150 V 120 H 200` |
| **커버리지 대상** | `calculateArrowPath()` 메서드 (수직 분기) |
| **관련 요구사항** | FR-002, FR-005 |

#### UT-005: getArrowStatus Task 상태별 ArrowStatus

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('getArrowStatus') → it.each() parameterized test` |
| **입력 데이터** | `[['[xx]', '[xx]', 'completed'], ['[im]', '[bd]', 'active'], ['[bd]', '[dd]', 'pending']]` |
| **검증 포인트** | 각 조합에 대해 올바른 ArrowStatus 반환 |
| **커버리지 대상** | `getArrowStatus()` 메서드 모든 분기 |
| **관련 요구사항** | FR-003 |

**테스트 코드 구조 (개념)**:
```typescript
it.each([
  ['[xx]', '[xx]', 'completed'],
  ['[im]', '[bd]', 'active'],
  ['[vf]', '[dd]', 'active'],
  ['[bd]', '[dd]', 'pending'],
  ['[ ]', '[bd]', 'pending']
])('should return %s for source=%s, target=%s', (sourceStatus, targetStatus, expected) => {
  const { getArrowStatus } = useGanttDependencies()
  const status = getArrowStatus(sourceStatus, targetStatus)
  expect(status).toBe(expected)
})
```

#### UT-006: GanttDependencyOverlay 화살표 호버 이벤트

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/components/GanttDependencyOverlay.test.ts` |
| **테스트 블록** | `describe('GanttDependencyOverlay') → it('should emit arrowHover event on mouseenter')` |
| **Mock 의존성** | @vue/test-utils mount |
| **입력 데이터** | `arrows: [{ id: 'A-B', sourceId: 'TSK-A', targetId: 'TSK-B', ... }]` |
| **검증 포인트** | mouseenter 이벤트 시 arrowHover emit 발생, payload 확인 |
| **커버리지 대상** | GanttDependencyOverlay.vue 이벤트 핸들러 |
| **관련 요구사항** | FR-004 |

**테스트 코드 구조 (개념)**:
```typescript
it('should emit arrowHover event on mouseenter', async () => {
  // Arrange
  const arrows: GanttArrow[] = [{ id: 'A-B', sourceId: 'TSK-A', targetId: 'TSK-B', path: 'M 0,0 H 100', status: 'active', markerEnd: 'url(#arrowhead-active)' }]
  const wrapper = mount(GanttDependencyOverlay, { props: { arrows, containerWidth: 500, containerHeight: 300 } })

  // Act
  const pathEl = wrapper.find('[data-testid="gantt-arrow-A-B"]')
  await pathEl.trigger('mouseenter')

  // Assert
  expect(wrapper.emitted('arrowHover')).toBeTruthy()
  expect(wrapper.emitted('arrowHover')?.[0]).toEqual([{ sourceId: 'TSK-A', targetId: 'TSK-B', isHover: true }])
})
```

#### UT-007: buildGanttArrows 100개 Task 성능

| 항목 | 내용 |
|------|------|
| **파일** | `tests/unit/composables/useGanttDependencies.test.ts` |
| **테스트 블록** | `describe('useGanttDependencies') → describe('performance') → it('should build 100 arrows in less than 100ms')` |
| **Mock 의존성** | 100개 Task 바 DOM Mock |
| **입력 데이터** | `edges: 100개 의존관계 배열` |
| **검증 포인트** | performance.now() 측정, 실행 시간 < 100ms |
| **커버리지 대상** | `buildGanttArrows()` 성능 |
| **관련 요구사항** | NFR-001 |

**테스트 코드 구조 (개념)**:
```typescript
it('should build 100 arrows in less than 100ms', () => {
  // Arrange
  const containerEl = createMockContainer(Array.from({ length: 100 }, (_, i) => ({
    taskId: `TSK-${i}`,
    left: i * 150,
    top: i * 50,
    width: 100,
    height: 40
  })))
  const edges: TaskEdge[] = Array.from({ length: 100 }, (_, i) => ({
    id: `${i}-${i+1}`,
    source: `TSK-${i}`,
    target: `TSK-${i+1}`
  }))

  // Act
  const { buildGanttArrows } = useGanttDependencies()
  const start = performance.now()
  const arrows = buildGanttArrows(edges, containerEl)
  const end = performance.now()
  const duration = end - start

  // Assert
  expect(arrows).toHaveLength(100)
  expect(duration).toBeLessThan(100)
})
```

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | Gantt 차트에서 화살표 표시 | Gantt 페이지 접속 | 페이지 로드 | 의존관계 화살표 표시됨 | FR-001, FR-002, FR-005 |
| E2E-002 | Task 상태 변경 시 화살표 색상 업데이트 | Task 상태 변경 | 상태 업데이트 | 화살표 색상 자동 변경 | FR-003 |
| E2E-003 | 화살표 호버 시 Tooltip 표시 | Gantt 페이지 접속 | 화살표 호버 | Tooltip 표시, Task 정보 확인 | FR-004 |
| E2E-004 | 100개 Task 렌더링 성능 | 대규모 프로젝트 | 페이지 로드 | Lighthouse 성능 점수 > 80 | NFR-001 |
| E2E-005 | Gantt 줌/팬 시 화살표 동기화 | Gantt 페이지 접속 | 줌 인/아웃 | 화살표 위치 정확히 동기화 | NFR-002 |
| E2E-006 | 크로스 브라우저 호환성 | Chromium/Firefox/Webkit | 페이지 로드 | 모든 브라우저에서 정상 표시 | NFR-003 |
| E2E-007 | 접근성 검증 | Gantt 페이지 접속 | axe-core 실행 | WCAG AA 위반 없음 | NFR-004 |

### 3.2 테스트 케이스 상세

#### E2E-001: Gantt 차트에서 화살표 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('Gantt 차트에 의존관계 화살표가 표시된다')` |
| **사전조건** | jjiban개선 프로젝트 선택, Gantt 페이지 접속 |
| **data-testid 셀렉터** | |
| - Gantt 컨테이너 | `[data-testid="gantt-chart-container"]` |
| - 화살표 오버레이 | `[data-testid="gantt-arrows-overlay"]` |
| - 개별 화살표 | `[data-testid^="gantt-arrow-"]` |
| **API 확인** | N/A (클라이언트 렌더링) |
| **검증 포인트** | `expect(page.locator('[data-testid="gantt-arrows-overlay"]')).toBeVisible()`, 화살표 개수 > 0 |
| **스크린샷** | `e2e-001-gantt-arrows.png` |
| **관련 요구사항** | FR-001, FR-002, FR-005 |

**테스트 코드 구조 (개념)**:
```typescript
test('Gantt 차트에 의존관계 화살표가 표시된다', async ({ page }) => {
  // Arrange & Act
  await page.goto('/gantt?project=jjiban개선')
  await page.waitForSelector('[data-testid="gantt-chart-container"]')

  // Assert
  const overlay = page.locator('[data-testid="gantt-arrows-overlay"]')
  await expect(overlay).toBeVisible()

  const arrows = page.locator('[data-testid^="gantt-arrow-"]')
  const count = await arrows.count()
  expect(count).toBeGreaterThan(0)

  // Screenshot
  await page.screenshot({ path: 'e2e-001-gantt-arrows.png' })
})
```

#### E2E-002: Task 상태 변경 시 화살표 색상 업데이트

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('Task 상태 변경 시 화살표 색상이 자동으로 업데이트된다')` |
| **사전조건** | Gantt 페이지 접속, TSK-01-01 → TSK-01-02 의존관계 존재 |
| **실행 단계** | |
| 1 | TSK-01-01 클릭 → 상세 패널 열기 |
| 2 | 상태 변경 (진행중 → 완료) |
| 3 | Gantt 차트로 돌아가기 |
| **검증 포인트** | 화살표 CSS 클래스 변경 (.gantt-arrow-active → .gantt-arrow-completed) |
| **스크린샷** | `e2e-002-before.png`, `e2e-002-after.png` |
| **관련 요구사항** | FR-003 |

**테스트 코드 구조 (개념)**:
```typescript
test('Task 상태 변경 시 화살표 색상이 자동으로 업데이트된다', async ({ page }) => {
  // Arrange
  await page.goto('/gantt?project=jjiban개선')
  const arrow = page.locator('[data-testid="gantt-arrow-TSK-01-01-TSK-01-02"]')

  // Before: active 상태
  await expect(arrow).toHaveClass(/gantt-arrow-active/)
  await page.screenshot({ path: 'e2e-002-before.png' })

  // Act: Task 상태 변경
  await page.click('[data-testid="task-bar-TSK-01-01"]')
  await page.click('[data-testid="status-select"]')
  await page.click('[data-testid="status-option-xx"]')
  await page.click('[data-testid="save-task"]')

  // Assert: completed 상태로 변경
  await expect(arrow).toHaveClass(/gantt-arrow-completed/)
  await page.screenshot({ path: 'e2e-002-after.png' })
})
```

#### E2E-003: 화살표 호버 시 Tooltip 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('화살표 호버 시 Tooltip이 표시된다')` |
| **사전조건** | Gantt 페이지 접속 |
| **data-testid 셀렉터** | |
| - 화살표 | `[data-testid="gantt-arrow-TSK-01-01-TSK-01-02"]` |
| - Tooltip | `[data-testid="arrow-tooltip"]` |
| **검증 포인트** | Tooltip 표시, 내용에 "TSK-01-01 → TSK-01-02" 포함 |
| **스크린샷** | `e2e-003-tooltip.png` |
| **관련 요구사항** | FR-004 |

#### E2E-004: 100개 Task 렌더링 성능

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('100개 Task 프로젝트에서 성능이 양호하다')` |
| **사전조건** | 100개 Task 테스트 프로젝트 준비 |
| **실행 단계** | Lighthouse 성능 측정 API 활용 |
| **검증 포인트** | Performance 점수 > 80, FCP < 2s |
| **관련 요구사항** | NFR-001 |

**테스트 코드 구조 (개념)**:
```typescript
test('100개 Task 프로젝트에서 성능이 양호하다', async ({ page }) => {
  // Act
  await page.goto('/gantt?project=large-test-project')

  // Lighthouse 성능 측정
  const metrics = await page.evaluate(() => performance.getEntriesByType('navigation')[0])
  const fcp = metrics.domContentLoadedEventEnd - metrics.fetchStart

  // Assert
  expect(fcp).toBeLessThan(2000)  // First Contentful Paint < 2s
})
```

#### E2E-005: Gantt 줌/팬 시 화살표 동기화

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('Gantt 줌 인/아웃 시 화살표 위치가 정확히 동기화된다')` |
| **사전조건** | Gantt 페이지 접속 |
| **실행 단계** | 줌 인 버튼 클릭, 화살표 위치 확인 |
| **검증 포인트** | 화살표 시작/끝점이 Task 바와 정확히 연결됨 |
| **관련 요구사항** | NFR-002 |

#### E2E-006: 크로스 브라우저 호환성

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test.describe.parallel('cross-browser compatibility', ...)` |
| **사전조건** | Playwright 설정에서 Chromium, Firefox, Webkit 활성화 |
| **실행 단계** | 각 브라우저에서 페이지 로드 |
| **검증 포인트** | 화살표 표시, 색상, 호버 이벤트 모두 정상 동작 |
| **관련 요구사항** | NFR-003 |

**테스트 코드 구조 (개념)**:
```typescript
test.describe.parallel('cross-browser compatibility', () => {
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    test(`화살표가 ${browserType}에서 정상 표시된다`, async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto('/gantt?project=jjiban개선')

      const overlay = page.locator('[data-testid="gantt-arrows-overlay"]')
      await expect(overlay).toBeVisible()

      await context.close()
    })
  }
})
```

#### E2E-007: 접근성 검증

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/gantt-dependency.spec.ts` |
| **테스트명** | `test('Gantt 화살표가 WCAG AA 접근성 기준을 충족한다')` |
| **사전조건** | @axe-core/playwright 설치 |
| **실행 단계** | axe 접근성 검사 실행 |
| **검증 포인트** | 위반 사항 0건 |
| **관련 요구사항** | NFR-004 |

**테스트 코드 구조 (개념)**:
```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('Gantt 화살표가 WCAG AA 접근성 기준을 충족한다', async ({ page }) => {
  await page.goto('/gantt?project=jjiban개선')
  await injectAxe(page)

  await checkA11y(page, '[data-testid="gantt-arrows-overlay"]', {
    detailedReport: true,
    detailedReportOptions: { html: true }
  })
})
```

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 화살표 렌더링 | Gantt 페이지 접속 | 페이지 로드 | 화살표 표시, 색상 정확 | High | FR-001, FR-002, FR-005 |
| TC-002 | 화살표 색상 구분 | Gantt 페이지 접속 | 시각적 확인 | 완료(녹색), 진행중(파랑), 대기(회색) | High | FR-003 |
| TC-003 | 화살표 호버 인터랙션 | Gantt 페이지 접속 | 화살표 호버 | 두께 증가, Tooltip 표시 | Medium | FR-004 |
| TC-004 | 반응형 확인 | Gantt 페이지 접속 | 브라우저 크기 조절 | 화살표 위치 자동 조정 | Medium | NFR-002 |
| TC-005 | 키보드 네비게이션 | Gantt 페이지 접속 | Tab 키로 화살표 포커스 | 포커스 인디케이터 표시 | Medium | NFR-004 |
| TC-006 | 색맹 모드 확인 | Gantt 페이지 접속 | 색맹 시뮬레이터 적용 | 색상 외 구분 가능 (Tooltip) | Low | NFR-004 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 화살표 렌더링

**테스트 목적**: Gantt 차트에서 의존관계 화살표가 정확하게 렌더링되는지 확인

**테스트 단계**:
1. jjiban 프로젝트 실행 (`npm run dev`)
2. 브라우저에서 `/gantt?project=jjiban개선` 접속
3. Gantt 차트 로드 대기
4. 화살표 표시 여부 확인

**예상 결과**:
- Task 바 위에 SVG 화살표가 오버레이됨
- 화살표가 출발 Task 오른쪽 끝에서 시작
- 화살표가 도착 Task 왼쪽 끝에서 종료
- 화살촉이 도착 지점에 표시됨

**검증 기준**:
- [ ] 모든 의존관계에 화살표 표시
- [ ] 화살표가 Task 바와 정확히 연결
- [ ] 계단식 경로 (수평-수직-수평) 확인
- [ ] 화살촉 방향 정확

#### TC-002: 화살표 색상 구분

**테스트 목적**: Task 상태에 따라 화살표 색상이 올바르게 구분되는지 확인

**테스트 단계**:
1. Gantt 차트 접속
2. 완료 상태 Task 간 화살표 확인 (TSK-01-01 → TSK-01-02, 둘 다 완료 상태)
3. 진행중 상태 Task 화살표 확인 (TSK-06-01 → TSK-06-02, 진행중)
4. 대기 상태 Task 화살표 확인 (TSK-08-01 → TSK-08-02, 대기)

**예상 결과**:
- 완료 화살표: 녹색 (#22c55e)
- 진행중 화살표: 파랑 (#3b82f6)
- 대기 화살표: 회색 (#6b7280), 투명도 낮음

**검증 기준**:
- [ ] 완료 화살표가 녹색으로 표시됨
- [ ] 진행중 화살표가 파랑으로 표시됨
- [ ] 대기 화살표가 회색으로 표시됨
- [ ] 색상이 즉시 업데이트됨 (Task 상태 변경 시)

#### TC-003: 화살표 호버 인터랙션

**테스트 목적**: 화살표 호버 시 시각적 피드백과 Tooltip이 표시되는지 확인

**테스트 단계**:
1. Gantt 차트 접속
2. 화살표에 마우스 오버
3. 화살표 두께 변화 확인
4. Tooltip 내용 확인
5. 마우스 이동 (호버 해제) → 원래 상태 복원 확인

**예상 결과**:
- 호버 시 화살표 두께 2px → 3px
- Tooltip 표시: "TSK-A → TSK-B, 상태: 진행중"
- 호버 해제 시 원래 상태로 복원

**검증 기준**:
- [ ] 화살표 호버 시 두께 증가
- [ ] Tooltip 0.3초 후 표시
- [ ] Tooltip에 Task 정보 포함
- [ ] 호버 해제 시 복원

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-EDGE-01 | 정상 의존관계 | `{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }` |
| MOCK-EDGE-02 | 순환 의존성 | `{ id: 'A-B', source: 'TSK-A', target: 'TSK-B' }`, `{ id: 'B-A', source: 'TSK-B', target: 'TSK-A' }` |
| MOCK-TASK-BAR-01 | Task 바 DOM | `<div data-id="TSK-A" style="left:0; top:0; width:100px; height:40px;"></div>` |
| MOCK-TASK-BAR-02 | Task 바 DOM | `<div data-id="TSK-B" style="left:200; top:50; width:100px; height:40px;"></div>` |

### 5.2 E2E 테스트용 시드 데이터

**실제 프로젝트 활용**: `.jjiban/projects/jjiban개선` 프로젝트의 실제 WBS 데이터 사용

| 시드 ID | 용도 | 데이터 소스 |
|---------|------|------------|
| SEED-REAL-PROJECT | 실제 의존관계 테스트 | .jjiban/projects/jjiban개선/wbs.md |
| SEED-LARGE-PROJECT | 성능 테스트 (100개 Task) | 자동 생성 (테스트 스크립트) |

### 5.3 Mock 함수

**createMockContainer**: Task 바 DOM 요소를 포함한 가짜 컨테이너 생성

```typescript
// 개념적 Mock 함수
function createMockContainer(tasks: Array<{ taskId: string; left: number; top: number; width: number; height: number }>) {
  const container = document.createElement('div')
  container.className = 'gantt-chart-container'

  tasks.forEach(task => {
    const taskBar = document.createElement('div')
    taskBar.setAttribute('data-id', task.taskId)
    taskBar.style.position = 'absolute'
    taskBar.style.left = `${task.left}px`
    taskBar.style.top = `${task.top}px`
    taskBar.style.width = `${task.width}px`
    taskBar.style.height = `${task.height}px`
    container.appendChild(taskBar)
  })

  return container
}
```

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 페이지별 셀렉터

#### Gantt 차트 페이지

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `gantt-chart-container` | Gantt 차트 컨테이너 | 페이지 로드 확인 |
| `gantt-arrows-overlay` | SVG 오버레이 컨테이너 | 화살표 오버레이 존재 확인 |
| `gantt-arrow-{sourceId}-{targetId}` | 개별 화살표 path | 특정 화살표 선택 (예: `gantt-arrow-TSK-01-01-TSK-01-02`) |
| `arrow-tooltip` | Tooltip 컨테이너 | Tooltip 표시 확인 |
| `task-bar-{taskId}` | Task 바 | Task 선택 (예: `task-bar-TSK-01-01`) |

### 6.2 컴포넌트별 셀렉터

#### GanttDependencyOverlay.vue

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `gantt-arrows-overlay` | SVG 루트 | 오버레이 컨테이너 |
| `gantt-arrow-{sourceId}-{targetId}` | path 요소 | 개별 화살표 |
| `arrow-defs` | defs 섹션 | 화살촉 마커 정의 확인 |

**템플릿 적용 예시 (개념)**:
```vue
<svg data-testid="gantt-arrows-overlay" class="gantt-arrows-overlay">
  <defs data-testid="arrow-defs">
    <!-- 마커 정의 -->
  </defs>
  <path
    v-for="arrow in arrows"
    :key="arrow.id"
    :data-testid="`gantt-arrow-${arrow.sourceId}-${arrow.targetId}`"
    :d="arrow.path"
    :class="[
      'gantt-arrow',
      `gantt-arrow-${arrow.status}`
    ]"
    @mouseenter="handleArrowHover(arrow, true)"
    @mouseleave="handleArrowHover(arrow, false)"
  />
</svg>
```

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 85% | 80% |
| Branches | 80% | 75% |
| Functions | 90% | 85% |
| Statements | 85% | 80% |

**주요 커버리지 대상**:
- `useGanttDependencies.ts`: buildGanttArrows, calculateArrowPath, getArrowStatus
- `GanttDependencyOverlay.vue`: 이벤트 핸들러, Props 처리

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비기능 요구사항 (NFR) | 100% 커버 |
| 에러 케이스 | 80% 커버 |

**커버리지 매트릭스**:
- FR-001: E2E-001 ✅
- FR-002: E2E-001 ✅
- FR-003: E2E-002 ✅
- FR-004: E2E-003 ✅
- FR-005: E2E-001 ✅
- NFR-001: E2E-004 ✅
- NFR-002: E2E-005 ✅
- NFR-003: E2E-006 ✅
- NFR-004: E2E-007 ✅

---

## 8. 테스트 실행 계획

### 8.1 실행 순서

1. **단위 테스트** (개발 단계)
   - `npm run test:unit -- useGanttDependencies`
   - 커버리지 목표 충족 확인

2. **E2E 테스트** (통합 단계)
   - `npm run test:e2e -- gantt-dependency.spec.ts`
   - 시각적 회귀 테스트 (스크린샷 비교)

3. **매뉴얼 테스트** (검증 단계)
   - TC-001 ~ TC-006 순차 실행
   - 체크리스트 기반 검증

### 8.2 CI/CD 통합

**GitHub Actions 워크플로우 (개념)**:
- Pull Request 생성 시 자동 실행
- 단위 테스트 필수 통과 (커버리지 80% 이상)
- E2E 테스트 Chromium 환경에서 실행
- 접근성 테스트 (axe-core) 자동 검증

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
- UI 설계: `011-ui-design.md`

---

<!--
author: Claude Code
Template Version: 1.0.0
Last Updated: 2025-12-17
-->
