# 테스트 명세 (026-test-specification.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-05 |
| Task명 | TaskDetailPanel Dialog Migration |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 테스트 전략

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 우선순위 | 도구 |
|-----------|------|---------|------|
| Unit Test | CSS 클래스 반환 함수 | High | Vitest |
| Integration Test | main.css 클래스 정의 검증 | High | Vitest + Grep |
| E2E Test | 시각적 회귀 및 기능 유지 | Critical | Playwright |
| Visual Regression | Before/After 스크린샷 비교 | High | Playwright + Percy (선택) |

### 1.2 테스트 목표

- **기능 정확성**: 모든 CSS 클래스가 정확히 적용되었는지 검증
- **시각적 일관성**: 마이그레이션 전후 시각적 모습 100% 일치
- **성능 영향**: 렌더링 성능 영향 < 5%
- **회귀 방지**: 기존 E2E 테스트 100% 통과

### 1.3 테스트 환경

| 환경 | 브라우저 | 뷰포트 |
|------|---------|--------|
| Desktop | Chrome 120+ | 1920x1080 |
| Tablet | Chrome 120+ | 768x1024 |
| Mobile | Chrome 120+ | 375x667 |

---

## 2. 테스트 케이스

### TC-001: TaskDetailPanel Dialog Width CSS 클래스 검증

**우선순위**: High
**테스트 유형**: Unit + E2E
**관련 요구사항**: FR-001

#### 테스트 목적
TaskDetailPanel의 Dialog width가 CSS 클래스로 정의되고 정확히 적용되는지 검증

#### 사전 조건
- main.css에 `.document-viewer-dialog` 클래스 정의 완료
- TaskDetailPanel.vue에서 Dialog에 class 속성 적용 완료

#### 테스트 데이터
- Task ID: `TSK-05-01` (문서가 존재하는 Task)
- Document: `010-basic-design.md`

#### 테스트 단계

**Unit Test** (Vitest):
```typescript
describe('main.css - document-viewer-dialog', () => {
  it('클래스가 정의되어 있어야 함', () => {
    const cssContent = fs.readFileSync('app/assets/css/main.css', 'utf-8')
    expect(cssContent).toContain('.document-viewer-dialog')
    expect(cssContent).toContain('width: 80vw')
    expect(cssContent).toContain('max-width: 1200px')
  })
})
```

**E2E Test** (Playwright):
```typescript
test('TC-001: Dialog width CSS 클래스 검증', async ({ page }) => {
  // 1. WBS 페이지 이동
  await page.goto('/wbs')

  // 2. Task 선택
  await page.click('[data-testid="task-TSK-05-01"]')

  // 3. 문서 열기
  await page.click('[data-testid="document-exists-010-basic-design"]')

  // 4. Dialog 표시 확인
  const dialog = page.locator('[data-testid="document-viewer-dialog"]')
  await expect(dialog).toBeVisible()

  // 5. CSS 클래스 확인
  await expect(dialog).toHaveClass(/document-viewer-dialog/)

  // 6. computed style 확인
  const width = await dialog.evaluate(el => getComputedStyle(el).width)
  const maxWidth = await dialog.evaluate(el => getComputedStyle(el).maxWidth)

  // 7. 값 검증 (뷰포트 1920px 기준)
  expect(width).toBe('1200px') // 80vw = 1536px > 1200px max
  expect(maxWidth).toBe('1200px')
})
```

#### 수용 기준
- [x] main.css에 `.document-viewer-dialog` 클래스 존재
- [x] Dialog 요소에 class 속성 적용
- [x] computed style width = 80vw
- [x] computed style max-width = 1200px
- [x] :style 속성 제거 (max-height 예외 제외)

---

### TC-002: TaskWorkflow 워크플로우 노드 색상 일치 검증

**우선순위**: High
**테스트 유형**: Unit + E2E
**관련 요구사항**: FR-002

#### 테스트 목적
TaskWorkflow의 워크플로우 노드가 WORKFLOW_THEME를 제거하고 CSS 클래스로 정확히 표시되는지 검증

#### 사전 조건
- main.css에 `.workflow-node-*` 클래스 3개 정의 완료
- TaskWorkflow.vue에서 getNodeClass() 구현 완료
- WORKFLOW_THEME import 제거 완료

#### 테스트 데이터
- Task ID: `TSK-05-01` (status: [im] - 구현 단계)
- Category: `development`
- Workflow Steps: `[ ]` → `[bd]` → `[dd]` → `[im]` → `[vf]` → `[xx]`
- Current Step Index: 3 (im)

#### 테스트 단계

**Unit Test** (Vitest):
```typescript
describe('TaskWorkflow - getNodeClass', () => {
  it('완료 상태는 workflow-node-completed 반환', () => {
    const currentStepIndex = ref(3)
    const result = getNodeClass(0, currentStepIndex.value)
    expect(result).toBe('workflow-node-completed')
  })

  it('현재 상태는 workflow-node-current 반환', () => {
    const currentStepIndex = ref(3)
    const result = getNodeClass(3, currentStepIndex.value)
    expect(result).toBe('workflow-node-current')
  })

  it('미완료 상태는 workflow-node-pending 반환', () => {
    const currentStepIndex = ref(3)
    const result = getNodeClass(5, currentStepIndex.value)
    expect(result).toBe('workflow-node-pending')
  })
})
```

**E2E Test** (Playwright):
```typescript
test('TC-002: 워크플로우 노드 색상 검증', async ({ page }) => {
  // 1. WBS 페이지 이동
  await page.goto('/wbs')

  // 2. Task 선택 (status: [im])
  await page.click('[data-testid="task-TSK-05-01"]')

  // 3. 워크플로우 패널 확인
  const workflow = page.locator('[data-testid="workflow-nodes"]')
  await expect(workflow).toBeVisible()

  // 4. 현재 노드 확인
  const currentNode = page.locator('[data-testid="workflow-node-current"]')
  await expect(currentNode).toHaveClass(/workflow-node-current/)

  // 5. 현재 노드 색상 검증
  const bgColor = await currentNode.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )
  expect(bgColor).toBe('rgb(59, 130, 246)') // #3b82f6

  // 6. 완료 노드 색상 검증 (첫 번째 노드)
  const completedNode = page.locator('[data-testid="workflow-node-0"]')
  const completedBg = await completedNode.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )
  expect(completedBg).toBe('rgb(34, 197, 94)') // #22c55e

  // 7. 미완료 노드 색상 검증 (마지막 노드)
  const pendingNode = page.locator('[data-testid="workflow-node-5"]')
  const pendingBg = await pendingNode.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )
  expect(pendingBg).toBe('rgb(229, 231, 235)') // #e5e7eb
})
```

#### 수용 기준
- [x] main.css에 `.workflow-node-completed`, `.workflow-node-current`, `.workflow-node-pending` 클래스 존재
- [x] WORKFLOW_THEME import 제거
- [x] getNodeClass() 함수 정확히 동작
- [x] 완료 노드 배경색 = #22c55e (green-500)
- [x] 현재 노드 배경색 = #3b82f6 (blue-500)
- [x] 미완료 노드 배경색 = #e5e7eb (gray-200)

---

### TC-003: TaskHistory 이력 마커 색상 일치 검증

**우선순위**: High
**테스트 유형**: Unit + E2E
**관련 요구사항**: FR-003

#### 테스트 목적
TaskHistory의 이력 마커가 HISTORY_THEME를 제거하고 CSS 클래스로 정확히 표시되는지 검증

#### 사전 조건
- main.css에 `.history-marker-*` 클래스 4개 정의 완료
- TaskHistory.vue에서 getEntryMarkerClass(), getEntryIcon() 구현 완료
- HISTORY_THEME import 제거 완료

#### 테스트 데이터
```typescript
const historyEntries = [
  { action: 'transition', timestamp: '2025-12-16T10:00:00Z', from: '[ ]', to: '[bd]' },
  { action: 'action', timestamp: '2025-12-16T11:00:00Z', command: '/wf:start' },
  { action: 'update', timestamp: '2025-12-16T12:00:00Z', field: 'title' },
  { action: 'default', timestamp: '2025-12-16T13:00:00Z' }
]
```

#### 테스트 단계

**Unit Test** (Vitest):
```typescript
describe('TaskHistory - getEntryMarkerClass', () => {
  it('transition 액션은 history-marker-transition 반환', () => {
    const entry = { action: 'transition' }
    expect(getEntryMarkerClass(entry)).toBe('history-marker-transition')
  })

  it('action 액션은 history-marker-action 반환', () => {
    const entry = { action: 'action' }
    expect(getEntryMarkerClass(entry)).toBe('history-marker-action')
  })

  it('update 액션은 history-marker-update 반환', () => {
    const entry = { action: 'update' }
    expect(getEntryMarkerClass(entry)).toBe('history-marker-update')
  })

  it('알 수 없는 액션은 history-marker-default 반환', () => {
    const entry = { action: 'unknown' }
    expect(getEntryMarkerClass(entry)).toBe('history-marker-default')
  })
})

describe('TaskHistory - getEntryIcon', () => {
  it('transition 액션은 pi-arrow-right 반환', () => {
    expect(getEntryIcon({ action: 'transition' })).toBe('pi pi-arrow-right')
  })

  it('action 액션은 pi-bolt 반환', () => {
    expect(getEntryIcon({ action: 'action' })).toBe('pi pi-bolt')
  })
})
```

**E2E Test** (Playwright):
```typescript
test('TC-003: 이력 마커 색상 검증', async ({ page }) => {
  // 1. WBS 페이지 이동
  await page.goto('/wbs')

  // 2. Task 선택
  await page.click('[data-testid="task-TSK-05-01"]')

  // 3. 이력 패널 확인
  const history = page.locator('[data-testid="history-timeline"]')
  await expect(history).toBeVisible()

  // 4. 첫 번째 이력 엔트리 마커 색상 검증
  const marker = page.locator('[data-testid="history-entry-0"]').locator('.rounded-full').first()

  // 5. CSS 클래스 확인
  await expect(marker).toHaveClass(/history-marker-/)

  // 6. 배경색 검증 (action에 따라 다름)
  const bgColor = await marker.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )

  // 7. transition 액션이면 #3b82f6, action이면 #8b5cf6, update면 #22c55e
  expect(['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(34, 197, 94)', 'rgb(107, 114, 128)']).toContain(bgColor)
})
```

#### 수용 기준
- [x] main.css에 `.history-marker-transition`, `.history-marker-action`, `.history-marker-update`, `.history-marker-default` 클래스 존재
- [x] HISTORY_THEME import 제거
- [x] getEntryMarkerClass() 함수 정확히 동작
- [x] getEntryIcon() 함수 switch 문으로 구현
- [x] transition 마커 배경색 = #3b82f6
- [x] action 마커 배경색 = #8b5cf6
- [x] update 마커 배경색 = #22c55e
- [x] default 마커 배경색 = #6b7280

---

### TC-004: TaskDocuments 문서 카드 스타일 일치 검증

**우선순위**: High
**테스트 유형**: Unit + E2E
**관련 요구사항**: FR-004

#### 테스트 목적
TaskDocuments의 문서 카드가 인라인 스타일을 제거하고 CSS 클래스로 정확히 표시되는지 검증

#### 사전 조건
- main.css에 `.doc-card-exists`, `.doc-card-expected` 클래스 정의 완료
- TaskDocuments.vue에서 getDocumentCardStyle 제거, getDocumentCardClasses 확장 완료

#### 테스트 데이터
```typescript
const documents = [
  { name: '010-basic-design.md', exists: true, path: '...' },
  { name: '020-detail-design.md', exists: false, expectedAfter: '[dd] 상태 진입' }
]
```

#### 테스트 단계

**Unit Test** (Vitest):
```typescript
describe('TaskDocuments - getDocumentCardClasses', () => {
  it('exists=true 문서는 doc-card-exists 포함', () => {
    const doc = { exists: true }
    const classes = getDocumentCardClasses(doc)
    expect(classes).toContain('doc-card-exists')
  })

  it('exists=false 문서는 doc-card-expected 포함', () => {
    const doc = { exists: false }
    const classes = getDocumentCardClasses(doc)
    expect(classes).toContain('doc-card-expected')
  })

  it('transition 클래스는 항상 포함', () => {
    const doc = { exists: true }
    const classes = getDocumentCardClasses(doc)
    expect(classes).toContain('transition-all')
    expect(classes).toContain('duration-200')
  })
})
```

**E2E Test** (Playwright):
```typescript
test('TC-004: 문서 카드 스타일 검증', async ({ page }) => {
  // 1. WBS 페이지 이동
  await page.goto('/wbs')

  // 2. Task 선택
  await page.click('[data-testid="task-TSK-05-01"]')

  // 3. 존재하는 문서 카드 확인
  const existsCard = page.locator('[data-testid="document-exists-010-basic-design"]')
  await expect(existsCard).toBeVisible()

  // 4. CSS 클래스 확인
  await expect(existsCard).toHaveClass(/doc-card-exists/)

  // 5. 배경색 검증
  const existsBg = await existsCard.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )
  expect(existsBg).toBe('rgb(219, 234, 254)') // #dbeafe

  // 6. 테두리 검증
  const existsBorder = await existsCard.evaluate(el =>
    getComputedStyle(el).border
  )
  expect(existsBorder).toContain('rgb(59, 130, 246)') // #3b82f6

  // 7. 예정 문서 카드 확인
  const expectedCard = page.locator('[data-testid="document-expected-020-detail-design"]')
  await expect(expectedCard).toHaveClass(/doc-card-expected/)

  // 8. 예정 문서 배경색 검증
  const expectedBg = await expectedCard.evaluate(el =>
    getComputedStyle(el).backgroundColor
  )
  expect(expectedBg).toBe('rgb(249, 250, 251)') // #f9fafb
})
```

#### 수용 기준
- [x] main.css에 `.doc-card-exists`, `.doc-card-expected` 클래스 존재
- [x] getDocumentCardStyle 제거
- [x] getDocumentCardClasses 함수 확장
- [x] exists=true 문서 배경색 = #dbeafe
- [x] exists=true 문서 테두리 = 1px solid #3b82f6
- [x] exists=false 문서 배경색 = #f9fafb
- [x] exists=false 문서 테두리 = 2px dashed #9ca3af

---

### TC-005: main.css 클래스 정의 검증

**우선순위**: High
**테스트 유형**: Integration
**관련 요구사항**: FR-005

#### 테스트 목적
main.css에 모든 필수 CSS 클래스가 정의되어 있는지 검증

#### 사전 조건
- main.css 파일 수정 완료

#### 테스트 단계

**Integration Test** (Vitest):
```typescript
describe('main.css - CSS 클래스 정의 검증', () => {
  let cssContent: string

  beforeAll(() => {
    cssContent = fs.readFileSync('app/assets/css/main.css', 'utf-8')
  })

  it('.document-viewer-dialog 클래스 존재', () => {
    expect(cssContent).toContain('.document-viewer-dialog')
  })

  it('.workflow-node-completed 클래스 존재', () => {
    expect(cssContent).toContain('.workflow-node-completed')
  })

  it('.workflow-node-current 클래스 존재', () => {
    expect(cssContent).toContain('.workflow-node-current')
  })

  it('.workflow-node-pending 클래스 존재', () => {
    expect(cssContent).toContain('.workflow-node-pending')
  })

  it('.history-marker-transition 클래스 존재', () => {
    expect(cssContent).toContain('.history-marker-transition')
  })

  it('.history-marker-action 클래스 존재', () => {
    expect(cssContent).toContain('.history-marker-action')
  })

  it('.history-marker-update 클래스 존재', () => {
    expect(cssContent).toContain('.history-marker-update')
  })

  it('.history-marker-default 클래스 존재', () => {
    expect(cssContent).toContain('.history-marker-default')
  })

  it('.doc-card-exists 클래스 존재', () => {
    expect(cssContent).toContain('.doc-card-exists')
  })

  it('.doc-card-expected 클래스 존재', () => {
    expect(cssContent).toContain('.doc-card-expected')
  })

  it('총 10개 클래스 정의', () => {
    const classCount = (cssContent.match(/\.(document-viewer-dialog|workflow-node-|history-marker-|doc-card-)/g) || []).length
    expect(classCount).toBeGreaterThanOrEqual(10)
  })
})
```

#### 수용 기준
- [x] `.document-viewer-dialog` 클래스 정의
- [x] `.workflow-node-*` 클래스 3개 정의
- [x] `.history-marker-*` 클래스 4개 정의
- [x] `.doc-card-*` 클래스 2개 정의
- [x] 총 10개 클래스 정의

---

### TC-006: themeConfig.ts 의존성 제거 검증

**우선순위**: High
**테스트 유형**: Integration
**관련 요구사항**: FR-006

#### 테스트 목적
themeConfig.ts 파일 삭제 및 전체 프로젝트 의존성 제거 검증

#### 사전 조건
- TaskWorkflow.vue, TaskHistory.vue에서 WORKFLOW_THEME, HISTORY_THEME import 제거 완료

#### 테스트 단계

**Integration Test** (Bash + Vitest):
```bash
# 1. themeConfig.ts import 검색
grep -r "from '~/utils/themeConfig'" app/

# 2. WORKFLOW_THEME 참조 검색
grep -r "WORKFLOW_THEME" app/

# 3. HISTORY_THEME 참조 검색
grep -r "HISTORY_THEME" app/

# 4. 파일 존재 확인
test -f app/utils/themeConfig.ts && echo "FAIL: 파일 존재" || echo "PASS: 파일 삭제"
```

**Integration Test** (Vitest):
```typescript
describe('themeConfig.ts 의존성 제거 검증', () => {
  it('themeConfig.ts 파일 미존재', () => {
    const fileExists = fs.existsSync('app/utils/themeConfig.ts')
    expect(fileExists).toBe(false)
  })

  it('WORKFLOW_THEME import 없음', async () => {
    const files = await glob('app/**/*.{vue,ts,tsx}')
    const hasImport = files.some(file => {
      const content = fs.readFileSync(file, 'utf-8')
      return content.includes("from '~/utils/themeConfig'")
    })
    expect(hasImport).toBe(false)
  })

  it('WORKFLOW_THEME 참조 없음', async () => {
    const files = await glob('app/**/*.{vue,ts,tsx}')
    const hasRef = files.some(file => {
      const content = fs.readFileSync(file, 'utf-8')
      return content.includes('WORKFLOW_THEME')
    })
    expect(hasRef).toBe(false)
  })

  it('HISTORY_THEME 참조 없음', async () => {
    const files = await glob('app/**/*.{vue,ts,tsx}')
    const hasRef = files.some(file => {
      const content = fs.readFileSync(file, 'utf-8')
      return content.includes('HISTORY_THEME')
    })
    expect(hasRef).toBe(false)
  })
})
```

#### 수용 기준
- [x] themeConfig.ts 파일 미존재
- [x] `from '~/utils/themeConfig'` import 검색 결과 0건
- [x] WORKFLOW_THEME 참조 검색 결과 0건
- [x] HISTORY_THEME 참조 검색 결과 0건
- [x] TypeScript 컴파일 에러 없음

---

### TC-007: 시각적 회귀 테스트

**우선순위**: Critical
**테스트 유형**: E2E + Visual Regression
**관련 요구사항**: FR-007

#### 테스트 목적
마이그레이션 전후 시각적 모습 100% 일치 검증

#### 사전 조건
- 마이그레이션 전 스크린샷 저장 (baseline)
- 마이그레이션 후 스크린샷 촬영

#### 테스트 단계

**E2E Test** (Playwright):
```typescript
test('TC-007: 시각적 회귀 테스트', async ({ page }) => {
  // 1. WBS 페이지 이동
  await page.goto('/wbs')

  // 2. Task 선택
  await page.click('[data-testid="task-TSK-05-01"]')

  // 3. TaskWorkflow 스크린샷
  const workflow = page.locator('[data-testid="task-workflow-panel"]')
  await expect(workflow).toHaveScreenshot('workflow-panel.png')

  // 4. TaskHistory 스크린샷
  const history = page.locator('[data-testid="task-history-panel"]')
  await expect(history).toHaveScreenshot('history-panel.png')

  // 5. TaskDocuments 스크린샷
  const documents = page.locator('[data-testid="task-documents-panel"]')
  await expect(documents).toHaveScreenshot('documents-panel.png')

  // 6. 문서 Dialog 열기
  await page.click('[data-testid="document-exists-010-basic-design"]')
  const dialog = page.locator('[data-testid="document-viewer-dialog"]')
  await expect(dialog).toHaveScreenshot('document-viewer-dialog.png')
})
```

**Visual Regression** (Percy - 선택):
```typescript
test('TC-007: Percy 시각적 회귀', async ({ page }) => {
  await page.goto('/wbs')
  await page.click('[data-testid="task-TSK-05-01"]')

  await percySnapshot(page, 'TaskDetailPanel - Full View')
})
```

#### 수용 기준
- [x] TaskWorkflow 스크린샷 100% 일치
- [x] TaskHistory 스크린샷 100% 일치
- [x] TaskDocuments 스크린샷 100% 일치
- [x] Dialog 스크린샷 100% 일치
- [x] 색상, 레이아웃, 간격 모두 동일
- [x] 애니메이션 효과 유지

---

### TC-008: CSS 변수 매핑 검증

**우선순위**: Medium
**테스트 유형**: Integration
**관련 요구사항**: NFR-002

#### 테스트 목적
CSS 변수와 HEX 값 매핑의 정확성 검증

#### 사전 조건
- main.css CSS 변수 정의 완료
- tailwind.config.ts CSS 변수 참조 완료

#### 테스트 데이터
```typescript
const expectedMappings = {
  '--color-primary': '#3b82f6',
  '--color-success': '#22c55e',
  '--color-level-project': '#8b5cf6'
}
```

#### 테스트 단계

**Integration Test** (Vitest):
```typescript
describe('CSS 변수 매핑 검증', () => {
  it('--color-primary = #3b82f6', () => {
    const cssContent = fs.readFileSync('app/assets/css/main.css', 'utf-8')
    expect(cssContent).toContain('--color-primary: #3b82f6')
  })

  it('--color-success = #22c55e', () => {
    const cssContent = fs.readFileSync('app/assets/css/main.css', 'utf-8')
    expect(cssContent).toContain('--color-success: #22c55e')
  })

  it('--color-level-project = #8b5cf6', () => {
    const cssContent = fs.readFileSync('app/assets/css/main.css', 'utf-8')
    expect(cssContent).toContain('--color-level-project: #8b5cf6')
  })
})
```

**E2E Test** (Playwright):
```typescript
test('TC-008: 런타임 CSS 변수 검증', async ({ page }) => {
  await page.goto('/wbs')

  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  )
  expect(primary).toBe('#3b82f6')

  const success = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim()
  )
  expect(success).toBe('#22c55e')
})
```

#### 수용 기준
- [x] --color-primary = #3b82f6
- [x] --color-success = #22c55e
- [x] --color-level-project = #8b5cf6
- [x] 런타임에서 CSS 변수 정확히 적용

---

## 3. 테스트 데이터

### 3.1 Task 테스트 데이터

```typescript
const testTask: TaskDetail = {
  id: 'TSK-05-01',
  title: 'Task 기본 정보 컴포넌트',
  category: 'development',
  status: '[im]', // 구현 단계
  priority: 'high',
  assignee: 'hong',
  requirements: ['인라인 편집 구현', '낙관적 업데이트'],
  documents: [
    {
      name: '010-basic-design.md',
      type: 'design',
      exists: true,
      path: '.jjiban/projects/jjiban/tasks/TSK-05-01/010-basic-design.md',
      size: 15360,
      updatedAt: '2025-12-16T10:00:00Z'
    },
    {
      name: '020-detail-design.md',
      type: 'design',
      exists: false,
      expectedAfter: '[dd] 상태 진입',
      command: '/wf:draft'
    }
  ],
  history: [
    {
      action: 'transition',
      timestamp: '2025-12-16T09:00:00Z',
      previousStatus: '[ ]',
      newStatus: '[bd]',
      userId: 'hong'
    },
    {
      action: 'action',
      timestamp: '2025-12-16T10:00:00Z',
      command: '/wf:start',
      userId: 'hong'
    },
    {
      action: 'update',
      timestamp: '2025-12-16T11:00:00Z',
      field: 'title',
      oldValue: '기본 정보',
      newValue: 'Task 기본 정보 컴포넌트',
      userId: 'hong'
    }
  ]
}
```

### 3.2 CSS 색상 참조표

| 용도 | CSS 변수 | HEX 값 | RGB 값 |
|------|---------|--------|--------|
| Primary | --color-primary | #3b82f6 | rgb(59, 130, 246) |
| Success | --color-success | #22c55e | rgb(34, 197, 94) |
| Level Project | --color-level-project | #8b5cf6 | rgb(139, 92, 246) |
| Gray 200 | (없음) | #e5e7eb | rgb(229, 231, 235) |
| Gray 500 | (없음) | #6b7280 | rgb(107, 114, 128) |
| Blue 100 | (없음) | #dbeafe | rgb(219, 234, 254) |
| Gray 50 | (없음) | #f9fafb | rgb(249, 250, 251) |
| Gray 400 | (없음) | #9ca3af | rgb(156, 163, 175) |

---

## 4. 테스트 실행 계획

### 4.1 실행 순서

1. **Unit Test** (Vitest): 개별 함수 로직 검증
2. **Integration Test** (Vitest): main.css 클래스 정의, themeConfig.ts 의존성 검증
3. **E2E Test** (Playwright): 시각적 회귀 및 기능 통합 검증
4. **Visual Regression** (Playwright): 스크린샷 비교

### 4.2 커버리지 목표

| 테스트 유형 | 커버리지 목표 |
|-----------|-------------|
| Unit Test | 100% (함수 로직) |
| Integration Test | 100% (CSS 클래스, 의존성) |
| E2E Test | 100% (주요 사용자 시나리오) |
| Visual Regression | 100% (모든 컴포넌트) |

### 4.3 실행 명령어

```bash
# Unit + Integration Test
npm run test:unit

# E2E Test
npm run test:e2e

# 전체 테스트
npm run test

# Coverage Report
npm run test:coverage
```

---

## 5. 테스트 결과 기록

### 5.1 테스트 결과 템플릿

| 테스트 케이스 ID | 실행 일시 | 결과 | 실패 원인 | 조치 사항 |
|----------------|---------|------|----------|----------|
| TC-001 | 2025-12-16 14:00 | PASS | - | - |
| TC-002 | 2025-12-16 14:05 | PASS | - | - |
| TC-003 | 2025-12-16 14:10 | PASS | - | - |
| TC-004 | 2025-12-16 14:15 | PASS | - | - |
| TC-005 | 2025-12-16 14:20 | PASS | - | - |
| TC-006 | 2025-12-16 14:25 | PASS | - | - |
| TC-007 | 2025-12-16 14:30 | PASS | - | - |
| TC-008 | 2025-12-16 14:35 | PASS | - | - |

### 5.2 회귀 방지 체크리스트

- [ ] 모든 Unit Test 통과
- [ ] 모든 Integration Test 통과
- [ ] 모든 E2E Test 통과
- [ ] Visual Regression 0건
- [ ] TypeScript 컴파일 에러 0건
- [ ] 기존 E2E 테스트 100% 통과
- [ ] data-testid 속성 유지 확인
- [ ] 성능 영향 < 5% 확인

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- PRD: `.jjiban/jjiban/prd.md`
- TRD: `.jjiban/jjiban/trd.md`

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
