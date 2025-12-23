# 테스트 명세: Task Panel Enhancement - Stepper & Missing Info

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-07 |
| Category | development |
| 작성일 | 2025-12-16 |
| 관련 문서 | 020-detail-design.md, 025-traceability-matrix.md |

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 테스트 레벨 | 도구 | 범위 | 커버리지 목표 | 책임자 |
|-----------|------|------|-------------|-------|
| 단위 테스트 | Vitest | 컴포넌트, 함수 | 80% 이상 | 개발자 |
| 통합 테스트 | Vitest | API, 컴포넌트 간 연동 | 주요 시나리오 100% | 개발자 |
| E2E 테스트 | Playwright | 전체 사용자 흐름 | 주요 흐름 100% | QA |
| 접근성 테스트 | axe-core | WCAG 2.1 AA | 100% | QA |
| 성능 테스트 | Lighthouse | 렌더링, API 응답 | > 90점 | 개발자 |

### 1.2 테스트 환경

| 항목 | 사양 |
|------|------|
| Node.js | 20.x |
| 브라우저 | Chrome 120+, Firefox 120+, Safari 17+ |
| 해상도 | 1920x1080, 1366x768 |
| OS | Windows 11, macOS 14, Ubuntu 22.04 |

---

## 2. 단위 테스트 (Vitest)

### 2.1 TaskProgress.vue 단위 테스트

**파일**: `tests/unit/components/TaskProgress.spec.ts`

#### TC-UT-001: Stepper 노드 렌더링
```typescript
describe('TaskProgress.vue - Stepper Rendering', () => {
  it('should render 6 stepper nodes for development category', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          category: 'development',
          status: '[bd]'
        }
      }
    })

    const stepNodes = wrapper.findAll('.workflow-step-circle')
    expect(stepNodes).toHaveLength(6)
  })

  it('should render 5 stepper nodes for defect category', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          category: 'defect',
          status: '[an]'
        }
      }
    })

    const stepNodes = wrapper.findAll('.workflow-step-circle')
    expect(stepNodes).toHaveLength(5)
  })

  it('should render 4 stepper nodes for infrastructure category', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          category: 'infrastructure',
          status: '[ds]'
        }
      }
    })

    const stepNodes = wrapper.findAll('.workflow-step-circle')
    expect(stepNodes).toHaveLength(4)
  })
})
```

**기대 결과**:
- development: 6개 노드 ([ ], [bd], [dd], [im], [vf], [xx])
- defect: 5개 노드 ([ ], [an], [fx], [vf], [xx])
- infrastructure: 4개 노드 ([ ], [ds], [im], [xx])

**우선순위**: P0

---

#### TC-UT-002: Popover 토글
```typescript
describe('TaskProgress.vue - Popover Toggle', () => {
  it('should toggle popover on step click', async () => {
    const wrapper = mount(TaskProgress, {
      props: { task: mockTaskDetail }
    })

    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('click')

    const popover = wrapper.findComponent(Popover)
    expect(popover.props('visible')).toBe(true)
  })

  it('should toggle popover on Enter key', async () => {
    const wrapper = mount(TaskProgress, {
      props: { task: mockTaskDetail }
    })

    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('keydown.enter')

    const popover = wrapper.findComponent(Popover)
    expect(popover.props('visible')).toBe(true)
  })

  it('should toggle popover on Space key', async () => {
    const wrapper = mount(TaskProgress, {
      props: { task: mockTaskDetail }
    })

    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('keydown.space')

    const popover = wrapper.findComponent(Popover)
    expect(popover.props('visible')).toBe(true)
  })
})
```

**기대 결과**: 클릭, Enter, Space 키로 Popover 토글

**우선순위**: P0

---

#### TC-UT-003: 완료일 표시
```typescript
describe('TaskProgress.vue - Completed Date', () => {
  it('should display completed date for finished step', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          completed: {
            bd: '2025-12-16 14:30',
            dd: '2025-12-16 18:45'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('2025-12-16 14:30')
  })

  it('should display "미완료" for uncompleted step', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          completed: null
        }
      }
    })

    expect(wrapper.text()).toContain('미완료')
  })
})
```

**기대 결과**:
- completed 있음: 타임스탬프 표시
- completed 없음: "미완료" 표시

**우선순위**: P1

---

#### TC-UT-004: 미완료 표시 (Fallback)
```typescript
describe('TaskProgress.vue - Fallback Handling', () => {
  it('should handle missing completed field gracefully', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          completed: undefined
        }
      }
    })

    expect(wrapper.text()).toContain('미완료')
    expect(() => wrapper.vm).not.toThrow()
  })

  it('should handle empty completed object', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          completed: {}
        }
      }
    })

    expect(wrapper.text()).toContain('미완료')
  })
})
```

**기대 결과**: completed 필드 없어도 에러 없이 "미완료" 표시

**우선순위**: P1

---

### 2.2 TaskBasicInfo.vue 단위 테스트

**파일**: `tests/unit/components/TaskBasicInfo.spec.ts`

#### TC-UT-005: schedule 렌더링
```typescript
describe('TaskBasicInfo.vue - Schedule Field', () => {
  it('should render schedule when provided', () => {
    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          schedule: {
            start: '2025-12-16',
            end: '2025-12-20'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('2025-12-16 ~ 2025-12-20')
  })

  it('should not render schedule field when undefined', () => {
    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          schedule: undefined
        }
      }
    })

    expect(wrapper.text()).not.toContain('일정')
  })
})
```

**기대 결과**: schedule 있으면 포맷팅하여 표시, 없으면 필드 숨김

**우선순위**: P1

---

#### TC-UT-006: tags 렌더링
```typescript
describe('TaskBasicInfo.vue - Tags Field', () => {
  it('should render all tags as Tag components', () => {
    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          tags: ['stepper', 'popover', 'ui']
        }
      }
    })

    const tagComponents = wrapper.findAllComponents(Tag)
    expect(tagComponents).toHaveLength(3)
    expect(wrapper.text()).toContain('stepper')
    expect(wrapper.text()).toContain('popover')
    expect(wrapper.text()).toContain('ui')
  })

  it('should not render tags field when empty', () => {
    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          tags: []
        }
      }
    })

    expect(wrapper.text()).not.toContain('태그')
  })
})
```

**기대 결과**: tags 배열 길이만큼 Tag 컴포넌트 렌더링

**우선순위**: P1

---

#### TC-UT-007: depends 네비게이션
```typescript
describe('TaskBasicInfo.vue - Depends Navigation', () => {
  it('should call selectionStore.selectNode on depends button click', async () => {
    const mockSelectionStore = {
      selectNode: vi.fn()
    }

    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          depends: ['TSK-08-06']
        }
      },
      global: {
        mocks: {
          selectionStore: mockSelectionStore
        }
      }
    })

    const dependsButton = wrapper.find('[data-testid="depends-TSK-08-06-btn"]')
    await dependsButton.trigger('click')

    expect(mockSelectionStore.selectNode).toHaveBeenCalledWith('TSK-08-06')
  })

  it('should render multiple depends buttons', () => {
    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          depends: ['TSK-08-05', 'TSK-08-06']
        }
      }
    })

    const dependsButtons = wrapper.findAll('[data-testid^="depends-"]')
    expect(dependsButtons).toHaveLength(2)
  })
})
```

**기대 결과**: depends 클릭 시 selectionStore.selectNode() 호출

**우선순위**: P0

---

## 3. 통합 테스트 (Vitest)

### 3.1 TaskProgress 통합 테스트

**파일**: `tests/integration/TaskProgress.integration.spec.ts`

#### TC-IT-001: Auto 명령 실행
```typescript
describe('TaskProgress Integration - Auto Command', () => {
  it('should execute auto command and refresh task detail', async () => {
    const mockSelectionStore = {
      refreshTaskDetail: vi.fn()
    }

    const mockFetch = vi.fn().mockResolvedValue({
      success: true
    })

    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          status: '[bd]'
        }
      },
      global: {
        mocks: {
          $fetch: mockFetch,
          selectionStore: mockSelectionStore
        }
      }
    })

    // Open popover
    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('click')

    // Click Auto button
    const autoButton = wrapper.find('button:contains("Auto")')
    await autoButton.trigger('click')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/TSK-08-07/transition', {
      method: 'POST',
      body: { command: 'auto' }
    })
    expect(mockSelectionStore.refreshTaskDetail).toHaveBeenCalled()
  })
})
```

**기대 결과**: Auto 버튼 클릭 → API 호출 → Task 상세 갱신

**우선순위**: P0

---

#### TC-IT-002: 액션 버튼 실행
```typescript
describe('TaskProgress Integration - Action Button', () => {
  it('should execute draft command and transition to [dd] status', async () => {
    const mockSelectionStore = {
      refreshTaskDetail: vi.fn()
    }

    const mockFetch = vi.fn().mockResolvedValue({
      success: true,
      newStatus: '[dd]'
    })

    const wrapper = mount(TaskProgress, {
      props: {
        task: {
          ...mockTaskDetail,
          status: '[bd]',
          availableActions: ['draft']
        }
      },
      global: {
        mocks: {
          $fetch: mockFetch,
          selectionStore: mockSelectionStore
        }
      }
    })

    // Open popover
    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('click')

    // Click draft button
    const draftButton = wrapper.find('button:contains("초안")')
    await draftButton.trigger('click')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/TSK-08-07/transition', {
      method: 'POST',
      body: { command: 'draft' }
    })
    expect(mockSelectionStore.refreshTaskDetail).toHaveBeenCalled()
  })
})
```

**기대 결과**: draft 버튼 클릭 → API 호출 → 상태 전이

**우선순위**: P0

---

#### TC-IT-003: Popover 닫기 (Escape)
```typescript
describe('TaskProgress Integration - Popover Close', () => {
  it('should close popover on Escape key', async () => {
    const wrapper = mount(TaskProgress, {
      props: { task: mockTaskDetail }
    })

    // Open popover
    const currentStep = wrapper.find('[data-testid="workflow-step-current"]')
    await currentStep.trigger('click')

    let popover = wrapper.findComponent(Popover)
    expect(popover.props('visible')).toBe(true)

    // Press Escape
    await wrapper.trigger('keydown.escape')

    popover = wrapper.findComponent(Popover)
    expect(popover.props('visible')).toBe(false)
  })
})
```

**기대 결과**: Escape 키로 Popover 닫기

**우선순위**: P1

---

### 3.2 TaskBasicInfo 통합 테스트

**파일**: `tests/integration/TaskBasicInfo.integration.spec.ts`

#### TC-IT-004: depends Task 이동
```typescript
describe('TaskBasicInfo Integration - Depends Navigation', () => {
  it('should navigate to depends task and load its detail', async () => {
    const mockSelectionStore = {
      selectNode: vi.fn(),
      selectedTask: ref(null)
    }

    const mockFetch = vi.fn().mockResolvedValue({
      id: 'TSK-08-06',
      title: 'PrimeVue Theme Migration'
    })

    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          depends: ['TSK-08-06']
        }
      },
      global: {
        mocks: {
          $fetch: mockFetch,
          selectionStore: mockSelectionStore
        }
      }
    })

    const dependsButton = wrapper.find('[data-testid="depends-TSK-08-06-btn"]')
    await dependsButton.trigger('click')

    expect(mockSelectionStore.selectNode).toHaveBeenCalledWith('TSK-08-06')
  })

  it('should show notification on successful navigation', async () => {
    const mockNotification = {
      info: vi.fn()
    }

    const wrapper = mount(TaskBasicInfo, {
      props: {
        task: {
          ...mockTaskDetail,
          depends: ['TSK-08-06']
        }
      },
      global: {
        mocks: {
          notification: mockNotification
        }
      }
    })

    const dependsButton = wrapper.find('[data-testid="depends-TSK-08-06-btn"]')
    await dependsButton.trigger('click')

    expect(mockNotification.info).toHaveBeenCalledWith('TSK-08-06 Task로 이동합니다.')
  })
})
```

**기대 결과**: depends 클릭 → Task 전환 → 토스트 표시

**우선순위**: P0

---

## 4. E2E 테스트 (Playwright)

### 4.1 워크플로우 진행 테스트

**파일**: `tests/e2e/task-progress-stepper.spec.ts`

#### TC-E2E-001: 워크플로우 진행
```typescript
import { test, expect } from '@playwright/test'

test.describe('TaskProgress Stepper E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Wait for WBS tree to load
    await page.waitForSelector('.wbs-tree')

    // Select TSK-08-07
    await page.click('text=TSK-08-07')

    // Wait for task detail panel to load
    await page.waitForSelector('[data-testid="task-progress-panel"]')
  })

  test('should display stepper with current status highlighted', async ({ page }) => {
    const currentStep = page.locator('[data-testid="workflow-step-current"]')
    await expect(currentStep).toBeVisible()

    // Verify current status badge
    const statusBadge = page.locator('[data-testid="task-status-badge"]')
    await expect(statusBadge).toContainText('기본설계')
  })

  test('should toggle popover on step click', async ({ page }) => {
    const currentStep = page.locator('[data-testid="workflow-step-current"]')
    await currentStep.click()

    // Verify popover is visible
    const popover = page.locator('.step-popover-content')
    await expect(popover).toBeVisible()

    // Verify completed date is displayed
    await expect(popover).toContainText(/\d{4}-\d{2}-\d{2}|미완료/)

    // Close popover with Escape
    await page.keyboard.press('Escape')
    await expect(popover).not.toBeVisible()
  })

  test('should execute auto command and show success toast', async ({ page }) => {
    // Open popover
    const currentStep = page.locator('[data-testid="workflow-step-current"]')
    await currentStep.click()

    // Click Auto button
    const autoButton = page.locator('button:has-text("Auto")')
    await autoButton.click()

    // Verify loading state
    await expect(autoButton).toHaveAttribute('aria-busy', 'true')

    // Verify success toast
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Auto 명령이 실행되었습니다')
  })

  test('should execute action button and transition state', async ({ page }) => {
    // Open popover
    const currentStep = page.locator('[data-testid="workflow-step-current"]')
    await currentStep.click()

    // Click draft button
    const draftButton = page.locator('button:has-text("초안")')
    await draftButton.click()

    // Wait for state transition
    await page.waitForTimeout(500)

    // Verify status changed to [dd]
    const statusBadge = page.locator('[data-testid="task-status-badge"]')
    await expect(statusBadge).toContainText('상세설계')
  })
})
```

**기대 결과**: Stepper 표시 → Popover 토글 → Auto/액션 실행 → 상태 전이

**우선순위**: P0

---

### 4.2 의존성 네비게이션 테스트

**파일**: `tests/e2e/task-depends-navigation.spec.ts`

#### TC-E2E-002: depends Task 이동
```typescript
import { test, expect } from '@playwright/test'

test.describe('TaskBasicInfo Depends Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('.wbs-tree')
    await page.click('text=TSK-08-07')
    await page.waitForSelector('[data-testid="task-basic-info-panel"]')
  })

  test('should navigate to depends task on click', async ({ page }) => {
    // Click depends button
    const dependsButton = page.locator('[data-testid="depends-TSK-08-06-btn"]')
    await dependsButton.click()

    // Verify task detail panel shows TSK-08-06
    const taskIdBadge = page.locator('[data-testid="task-id-badge"]')
    await expect(taskIdBadge).toContainText('TSK-08-06')

    // Verify notification toast
    const toast = page.locator('.p-toast-message-info')
    await expect(toast).toContainText('TSK-08-06 Task로 이동합니다')
  })

  test('should display all depends as clickable buttons', async ({ page }) => {
    const dependsButtons = page.locator('[data-testid^="depends-"]')
    const count = await dependsButtons.count()
    expect(count).toBeGreaterThan(0)

    // Verify all buttons are clickable
    for (let i = 0; i < count; i++) {
      await expect(dependsButtons.nth(i)).toBeEnabled()
    }
  })
})
```

**기대 결과**: depends 클릭 → Task 전환 → 토스트 표시

**우선순위**: P0

---

### 4.3 접근성 테스트

**파일**: `tests/e2e/accessibility.spec.ts`

#### TC-E2E-003: 키보드 접근성
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('.wbs-tree')
    await page.click('text=TSK-08-07')
    await page.waitForSelector('[data-testid="task-progress-panel"]')

    // Tab to first step
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verify focus on workflow step
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toHaveClass(/workflow-step-circle/)

    // Open popover with Enter
    await page.keyboard.press('Enter')

    // Verify popover is visible
    const popover = page.locator('.step-popover-content')
    await expect(popover).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(popover).not.toBeVisible()

    // Navigate with Tab and Space
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(popover).toBeVisible()
  })

  test('should pass WCAG 2.1 AA accessibility audit', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('.wbs-tree')
    await page.click('text=TSK-08-07')
    await page.waitForSelector('[data-testid="task-progress-panel"]')

    // Run axe accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('.wbs-tree')
    await page.click('text=TSK-08-07')
    await page.waitForSelector('[data-testid="task-progress-panel"]')

    // Verify ARIA labels
    const currentStep = page.locator('[data-testid="workflow-step-current"]')
    await expect(currentStep).toHaveAttribute('aria-label', /단계/)
    await expect(currentStep).toHaveAttribute('aria-current', 'step')
    await expect(currentStep).toHaveAttribute('role', 'button')
  })
})
```

**기대 결과**: 키보드 네비게이션 가능, WCAG AA 준수, ARIA 속성 적용

**우선순위**: P0

---

## 5. 성능 테스트

### 5.1 Lighthouse 테스트

**파일**: `tests/performance/lighthouse.spec.ts`

#### TC-PERF-001: Lighthouse 점수
```typescript
import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

test('should achieve Lighthouse score > 90', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.waitForSelector('.wbs-tree')
  await page.click('text=TSK-08-07')
  await page.waitForSelector('[data-testid="task-progress-panel"]')

  // Run Lighthouse audit
  const lighthouseResults = await playAudit({
    page,
    port: 9222,
    thresholds: {
      performance: 90,
      accessibility: 90,
      'best-practices': 90,
      seo: 90
    }
  })

  expect(lighthouseResults.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9)
  expect(lighthouseResults.lhr.categories.accessibility.score).toBeGreaterThanOrEqual(0.9)
})
```

**기대 결과**: Performance, Accessibility > 90점

**우선순위**: P1

---

### 5.2 렌더링 성능 테스트

**파일**: `tests/performance/rendering.spec.ts`

#### TC-PERF-002: Popover 토글 성능
```typescript
import { test, expect } from '@playwright/test'

test('should toggle popover in less than 100ms', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.waitForSelector('.wbs-tree')
  await page.click('text=TSK-08-07')
  await page.waitForSelector('[data-testid="task-progress-panel"]')

  const currentStep = page.locator('[data-testid="workflow-step-current"]')

  // Measure toggle time
  const startTime = Date.now()
  await currentStep.click()
  await page.locator('.step-popover-content').waitFor({ state: 'visible' })
  const endTime = Date.now()

  const toggleTime = endTime - startTime
  expect(toggleTime).toBeLessThan(100)
})
```

**기대 결과**: Popover 토글 < 100ms

**우선순위**: P1

---

## 6. 테스트 데이터

### 6.1 Mock Data

**파일**: `tests/fixtures/mockTaskDetail.ts`

```typescript
export const mockTaskDetail: TaskDetail = {
  id: 'TSK-08-07',
  title: 'Task Panel Enhancement - Stepper & Missing Info',
  category: 'development',
  status: '[bd]',
  priority: 'high',
  assignee: {
    id: 'hong',
    name: 'Hong',
    avatar: null,
    role: 'Developer'
  },
  parentWp: 'WP-08',
  parentAct: 'ACT-08-03',
  schedule: {
    start: '2025-12-16',
    end: '2025-12-20'
  },
  requirements: [
    'TaskDetail 타입에 completed 필드 추가',
    'getTaskDetail() API에서 completed 반환',
    'TaskProgress를 Stepper로 변환'
  ],
  tags: ['stepper', 'popover', 'taskpanel', 'ui', 'ux'],
  depends: ['TSK-08-06'],
  ref: 'PRD 8.3.1, 8.3.2, 8.3.3',
  documents: [
    {
      name: '010-basic-design.md',
      path: 'tasks/TSK-08-07/010-basic-design.md',
      exists: true,
      type: 'design',
      stage: 'current',
      size: 12345,
      createdAt: '2025-12-16T10:00:00Z',
      updatedAt: '2025-12-16T14:30:00Z'
    }
  ],
  history: [],
  availableActions: ['draft'],
  completed: {
    bd: '2025-12-16 14:30'
  }
}
```

---

## 7. 테스트 실행 계획

### 7.1 실행 순서

1. **단위 테스트** (개발 중 지속적 실행)
2. **통합 테스트** (PR 전 실행)
3. **E2E 테스트** (PR 승인 전 실행)
4. **접근성 테스트** (배포 전 실행)
5. **성능 테스트** (배포 전 실행)

### 7.2 실행 명령어

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 접근성 테스트
npm run test:a11y

# 성능 테스트
npm run test:perf

# 전체 테스트
npm run test
```

---

## 8. 커버리지 보고서

### 8.1 커버리지 목표

| 항목 | 목표 커버리지 |
|-----|-------------|
| 라인 커버리지 | 80% 이상 |
| 브랜치 커버리지 | 75% 이상 |
| 함수 커버리지 | 85% 이상 |
| 문장 커버리지 | 80% 이상 |

### 8.2 커버리지 측정

```bash
# 커버리지 리포트 생성
npm run test:coverage

# HTML 리포트 열기
open coverage/index.html
```

---

## 9. 버그 리포트 템플릿

```markdown
## 버그 정보
- 테스트 ID: TC-XX-XXX
- 우선순위: P0/P1/P2
- 발견일: YYYY-MM-DD

## 재현 단계
1. ...
2. ...

## 기대 결과
...

## 실제 결과
...

## 환경
- OS: ...
- 브라우저: ...
- 해상도: ...

## 스크린샷/로그
...
```

---

## 10. 승인 및 검토

| 역할 | 이름 | 일자 | 서명 |
|-----|------|------|------|
| 작성자 | Hong | 2025-12-16 | |
| 검토자 | | | |
| 승인자 | | | |

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-16
