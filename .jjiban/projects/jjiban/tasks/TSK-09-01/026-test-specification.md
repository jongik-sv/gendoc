# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 테스트 명세

## 문서 정보
- Task ID: TSK-09-01
- 작성일: 2025-12-17
- 상태: [dd] Detail Design

---

## 1. 테스트 환경

### 1.1 테스트 환경 설정
```bash
# 테스트 프로젝트 생성
- 프로젝트 1: test-project-1 (4단계, active, 10개 Task)
- 프로젝트 2: test-project-2 (3단계, active, 5개 Task)
- 프로젝트 3: jjiban개선 (4단계, archived, 3개 Task)
```

### 1.2 테스트 데이터
```typescript
// 프로젝트 1 구조
test-project-1/
├── project.json (status: active, wbsDepth: 4)
├── wbs.md (2 WP, 3 ACT, 10 TSK)
├── team.json
├── prd.md (200KB)
├── diagram.png (500KB)
└── tasks/...

// 프로젝트 2 구조
test-project-2/
├── project.json (status: active, wbsDepth: 3)
├── wbs.md (2 WP, 5 TSK)
└── team.json
```

---

## 2. API 테스트

### 2.1 GET /api/wbs/all

#### TC-API-01: 정상 응답 검증
**목적**: 모든 프로젝트 WBS 조회 성공

**전제조건**:
- 3개의 테스트 프로젝트 존재 (test-project-1, test-project-2, jjiban개선)
- 각 프로젝트 wbs.md 파일 존재

**테스트 단계**:
```typescript
// vitest 테스트 코드
describe('GET /api/wbs/all', () => {
  it('should return all projects WBS', async () => {
    // Given: 테스트 프로젝트 생성됨

    // When: API 호출
    const response = await $fetch<AllWbsResponse>('/api/wbs/all')

    // Then: 응답 검증
    expect(response.projects).toHaveLength(3)

    // 프로젝트 1 검증
    const project1 = response.projects.find(p => p.id === 'test-project-1')
    expect(project1).toBeDefined()
    expect(project1?.type).toBe('project')
    expect(project1?.projectMeta.status).toBe('active')
    expect(project1?.projectMeta.wbsDepth).toBe(4)
    expect(project1?.taskCount).toBe(10)
    expect(project1?.children).toHaveLength(2) // 2 WP
    expect(project1?.progress).toBeGreaterThanOrEqual(0)
    expect(project1?.progress).toBeLessThanOrEqual(100)
  })
})
```

**예상 결과**:
- 상태 코드: 200
- 응답 형식: `{ projects: ProjectWbsNode[] }`
- 각 프로젝트 노드는 type: 'project'
- children 배열에 WP 노드 포함

**우선순위**: High

---

#### TC-API-01-1: 빈 프로젝트 목록
**목적**: 프로젝트가 없을 때 빈 배열 반환

**전제조건**:
- .jjiban/projects/ 폴더 비어있음

**테스트 단계**:
```typescript
it('should return empty array when no projects exist', async () => {
  // Given: 모든 프로젝트 삭제

  // When
  const response = await $fetch<AllWbsResponse>('/api/wbs/all')

  // Then
  expect(response.projects).toEqual([])
})
```

**예상 결과**:
- 상태 코드: 200
- `{ projects: [] }`

**우선순위**: Medium

---

#### TC-API-01-2: 개별 프로젝트 로드 실패 처리
**목적**: 일부 프로젝트 로드 실패 시 나머지 표시

**전제조건**:
- test-project-1: 정상 wbs.md
- test-project-2: wbs.md 파일 없음 (의도적 삭제)
- test-project-3: 정상 wbs.md

**테스트 단계**:
```typescript
it('should exclude failed projects and return valid ones', async () => {
  // Given: project-2의 wbs.md 삭제

  // When
  const response = await $fetch<AllWbsResponse>('/api/wbs/all')

  // Then: project-1, project-3만 반환
  expect(response.projects).toHaveLength(2)
  expect(response.projects.find(p => p.id === 'test-project-2')).toBeUndefined()
})
```

**예상 결과**:
- 상태 코드: 200
- 실패한 프로젝트 제외된 목록 반환
- 서버 로그에 경고 메시지

**우선순위**: High

---

#### TC-API-01-3: 프로젝트 진행률 계산 정확성
**목적**: 진행률 계산 로직 검증

**전제조건**:
- test-project-1: 10개 Task (완료 6개, 미완료 4개)
  - TSK-01: progress: 100
  - TSK-02: progress: 100
  - ...
  - TSK-09: progress: 0
  - TSK-10: progress: 0

**테스트 단계**:
```typescript
it('should calculate project progress correctly', async () => {
  // Given: 60% 진행률 프로젝트

  // When
  const response = await $fetch<AllWbsResponse>('/api/wbs/all')
  const project = response.projects.find(p => p.id === 'test-project-1')

  // Then
  expect(project?.progress).toBe(60) // 6/10 * 100 = 60%
})
```

**예상 결과**:
- 진행률: 60%
- 소수점 반올림 적용

**우선순위**: High

---

#### TC-API-01-4: Task 개수 계산
**목적**: 재귀적으로 모든 Task 개수 정확히 계산

**전제조건**:
- test-project-1: WP-01 (5 Task), WP-02 (ACT-01: 3 Task, ACT-02: 2 Task)

**테스트 단계**:
```typescript
it('should count all tasks recursively', async () => {
  // Given: 계층 구조 프로젝트

  // When
  const response = await $fetch<AllWbsResponse>('/api/wbs/all')
  const project = response.projects.find(p => p.id === 'test-project-1')

  // Then
  expect(project?.taskCount).toBe(10) // 5 + 3 + 2
})
```

**예상 결과**:
- taskCount: 10

**우선순위**: High

---

### 2.2 GET /api/projects/:id/files

#### TC-API-02: 정상 파일 목록 조회
**목적**: 프로젝트 파일 목록 조회 성공

**전제조건**:
- test-project-1 폴더 구조:
  - project.json (500 bytes)
  - wbs.md (25KB)
  - team.json (300 bytes)
  - prd.md (200KB)
  - diagram.png (500KB)
  - tasks/ (폴더 - 제외됨)

**테스트 단계**:
```typescript
describe('GET /api/projects/:id/files', () => {
  it('should return project files excluding tasks folder', async () => {
    // When
    const response = await $fetch<ProjectFilesResponse>(
      '/api/projects/test-project-1/files'
    )

    // Then
    expect(response.files).toHaveLength(5) // tasks 폴더 제외
    expect(response.files.find(f => f.name === 'tasks')).toBeUndefined()

    // 파일 타입 검증
    const wbsMd = response.files.find(f => f.name === 'wbs.md')
    expect(wbsMd?.type).toBe('markdown')
    expect(wbsMd?.size).toBe(25600)

    const diagram = response.files.find(f => f.name === 'diagram.png')
    expect(diagram?.type).toBe('image')

    const projectJson = response.files.find(f => f.name === 'project.json')
    expect(projectJson?.type).toBe('json')
  })
})
```

**예상 결과**:
- 상태 코드: 200
- 5개 파일 반환 (tasks 폴더 제외)
- 각 파일 타입 정확히 분류

**우선순위**: High

---

#### TC-API-02-1: 존재하지 않는 프로젝트 404
**목적**: 유효하지 않은 프로젝트 ID 처리

**테스트 단계**:
```typescript
it('should return 404 for non-existent project', async () => {
  // When/Then
  await expect(
    $fetch('/api/projects/non-existent-project/files')
  ).rejects.toMatchObject({
    statusCode: 404,
    message: expect.stringContaining('프로젝트를 찾을 수 없습니다')
  })
})
```

**예상 결과**:
- 상태 코드: 404
- 에러 메시지: "프로젝트를 찾을 수 없습니다: non-existent-project"

**우선순위**: High

---

#### TC-API-02-2: 파일 타입 분류 정확성
**목적**: 모든 파일 타입 정확히 분류

**테스트 단계**:
```typescript
it('should classify file types correctly', async () => {
  // Given: 다양한 파일 타입
  // - test.md → markdown
  // - test.json → json
  // - test.png, test.jpg → image
  // - test.txt, test.pdf → other

  // When
  const response = await $fetch<ProjectFilesResponse>(
    '/api/projects/test-project-files/files'
  )

  // Then
  const typeMap = response.files.reduce((acc, file) => {
    acc[file.name] = file.type
    return acc
  }, {} as Record<string, string>)

  expect(typeMap['test.md']).toBe('markdown')
  expect(typeMap['test.json']).toBe('json')
  expect(typeMap['test.png']).toBe('image')
  expect(typeMap['test.jpg']).toBe('image')
  expect(typeMap['test.svg']).toBe('image')
  expect(typeMap['test.txt']).toBe('other')
  expect(typeMap['test.pdf']).toBe('other')
})
```

**예상 결과**:
- 모든 파일 타입 정확히 분류
- 대소문자 구분 없음 (Test.MD → markdown)

**우선순위**: Medium

---

#### TC-API-02-3: tasks 폴더 제외 검증
**목적**: tasks 폴더는 파일 목록에서 제외

**테스트 단계**:
```typescript
it('should exclude tasks folder from file list', async () => {
  // When
  const response = await $fetch<ProjectFilesResponse>(
    '/api/projects/test-project-1/files'
  )

  // Then
  const hasTasks = response.files.some(f => f.name === 'tasks')
  expect(hasTasks).toBe(false)
})
```

**예상 결과**:
- tasks 폴더 포함되지 않음

**우선순위**: Medium

---

#### TC-API-02-4: 한글 프로젝트 ID 처리
**목적**: 한글 프로젝트 ID URL 인코딩 처리

**전제조건**:
- 프로젝트 ID: "jjiban개선"

**테스트 단계**:
```typescript
it('should handle Korean project ID correctly', async () => {
  // When
  const encodedId = encodeURIComponent('jjiban개선')
  const response = await $fetch<ProjectFilesResponse>(
    `/api/projects/${encodedId}/files`
  )

  // Then
  expect(response.files).toBeDefined()
  expect(Array.isArray(response.files)).toBe(true)
})
```

**예상 결과**:
- 상태 코드: 200
- 정상 파일 목록 반환

**우선순위**: High

---

## 3. UI 컴포넌트 테스트

### 3.1 다중 프로젝트 트리

#### TC-UI-01: 다중 프로젝트 트리 표시
**목적**: /wbs 접속 시 모든 프로젝트 표시

**테스트 단계**:
```typescript
describe('Multi-project WBS tree', () => {
  it('should display all projects in tree', async () => {
    // Given: 3개 프로젝트 존재
    await page.goto('http://localhost:3000/wbs')
    await page.waitForSelector('.wbs-tree-panel')

    // Then: 3개 프로젝트 노드 표시
    const projectNodes = await page.$$('.wbs-tree-node-title-project')
    expect(projectNodes).toHaveLength(3)

    // 프로젝트 노드 펼쳐져 있음
    const expandedProjects = await page.$$('.wbs-tree-node.expanded')
    expect(expandedProjects.length).toBeGreaterThan(0)
  })
})
```

**예상 결과**:
- 3개 프로젝트 노드 표시
- 프로젝트 노드 기본 펼침 상태

**우선순위**: High

---

#### TC-UI-02: 프로젝트 노드 아이콘 및 색상
**목적**: 프로젝트 아이콘 및 스타일 표시

**테스트 단계**:
```typescript
it('should display project icon and color', async () => {
  await page.goto('http://localhost:3000/wbs')

  // 프로젝트 아이콘 검증
  const projectIcon = await page.$('.node-icon-project')
  expect(projectIcon).toBeTruthy()

  // 색상 검증 (Violet)
  const iconColor = await projectIcon?.evaluate(el =>
    window.getComputedStyle(el).color
  )
  expect(iconColor).toContain('139, 92, 246') // rgb(139, 92, 246) = violet-500
})
```

**예상 결과**:
- 아이콘: pi-folder
- 색상: violet-500

**우선순위**: Medium

---

### 3.2 프로젝트 상세 패널

#### TC-UI-03: 프로젝트 선택 시 상세 패널 표시
**목적**: 프로젝트 클릭 시 ProjectDetailPanel 표시

**테스트 단계**:
```typescript
it('should show project detail panel on click', async () => {
  await page.goto('http://localhost:3000/wbs')

  // 프로젝트 노드 클릭
  await page.click('[data-node-id="test-project-1"]')
  await page.waitForSelector('.project-detail-panel')

  // 패널 내용 검증
  const panelTitle = await page.textContent('.project-header h3')
  expect(panelTitle).toBe('test-project-1')

  // 진행률 표시
  const progressBar = await page.$('.project-progress .p-progressbar')
  expect(progressBar).toBeTruthy()
})
```

**예상 결과**:
- ProjectDetailPanel 표시
- 프로젝트 이름, 진행률, WBS 깊이 표시

**우선순위**: High

---

#### TC-UI-04: 파일 목록 표시
**목적**: 프로젝트 상세 패널에 파일 목록 표시

**테스트 단계**:
```typescript
it('should display file list in project detail panel', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')
  await page.waitForSelector('.project-file-list')

  // 파일 목록 검증
  const fileItems = await page.$$('.project-file-item')
  expect(fileItems.length).toBeGreaterThan(0)

  // 파일 아이콘 검증
  const mdIcon = await page.$('.file-icon-md')
  expect(mdIcon).toBeTruthy()
})
```

**예상 결과**:
- 파일 목록 Listbox 표시
- 파일 타입별 아이콘 표시

**우선순위**: High

---

### 3.3 파일 뷰어

#### TC-UI-05: 마크다운 파일 뷰어
**목적**: 마크다운 파일 클릭 시 렌더링된 뷰어 표시

**테스트 단계**:
```typescript
it('should render markdown file in viewer', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')

  // wbs.md 파일 클릭
  await page.click('.project-file-item:has-text("wbs.md")')
  await page.waitForSelector('.file-viewer-content .markdown-content')

  // 마크다운 렌더링 검증
  const markdownHTML = await page.innerHTML('.markdown-content')
  expect(markdownHTML).toContain('<h2>') // ## 헤더 렌더링됨
})
```

**예상 결과**:
- Dialog 열림
- 마크다운 HTML 렌더링
- 헤더, 리스트, 코드 블록 표시

**우선순위**: High

---

#### TC-UI-06: 이미지 파일 뷰어
**목적**: 이미지 파일 클릭 시 이미지 표시

**테스트 단계**:
```typescript
it('should display image in viewer', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')

  // diagram.png 클릭
  await page.click('.project-file-item:has-text("diagram.png")')
  await page.waitForSelector('.image-viewer img')

  // 이미지 표시 검증
  const imgSrc = await page.getAttribute('.image-viewer img', 'src')
  expect(imgSrc).toContain('diagram.png')
})
```

**예상 결과**:
- Dialog 열림
- 이미지 표시
- 파일 크기 정보 표시

**우선순위**: High

---

#### TC-UI-07: JSON 파일 코드 뷰어
**목적**: JSON 파일 클릭 시 Monaco Editor 표시

**테스트 단계**:
```typescript
it('should display JSON in Monaco Editor', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')

  // project.json 클릭
  await page.click('.project-file-item:has-text("project.json")')
  await page.waitForSelector('.monaco-editor')

  // Monaco Editor 검증
  const editorExists = await page.$('.monaco-editor')
  expect(editorExists).toBeTruthy()
})
```

**예상 결과**:
- Dialog 열림
- Monaco Editor 표시
- 읽기 전용 모드

**우선순위**: Medium

---

#### TC-UI-08: 프로젝트 기본 펼침 상태
**목적**: 프로젝트 노드는 기본적으로 펼쳐져 있음

**테스트 단계**:
```typescript
it('should expand project nodes by default', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.waitForSelector('.wbs-tree-panel')

  // 프로젝트 노드 펼침 상태 확인
  const expandedProjects = await page.$$('[data-node-type="project"].expanded')
  expect(expandedProjects.length).toBeGreaterThan(0)

  // WP 노드는 접혀 있음
  const collapsedWp = await page.$$('[data-node-type="wp"]:not(.expanded)')
  expect(collapsedWp.length).toBeGreaterThan(0)
})
```

**예상 결과**:
- 프로젝트 노드: 펼침
- WP 노드: 접힘

**우선순위**: Medium

---

#### TC-UI-09: 파일 목록 빈 상태
**목적**: 파일이 없을 때 안내 메시지 표시

**테스트 단계**:
```typescript
it('should display empty message when no files', async () => {
  // Given: 파일 없는 프로젝트
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="empty-project"]')

  // Then
  const emptyMessage = await page.textContent('.project-files p')
  expect(emptyMessage).toContain('파일이 없습니다')
})
```

**예상 결과**:
- "파일이 없습니다" 메시지 표시

**우선순위**: Low

---

#### TC-UI-10: FileViewer Esc 키 닫기
**목적**: Esc 키로 다이얼로그 닫기

**테스트 단계**:
```typescript
it('should close dialog on Esc key', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')
  await page.click('.project-file-item:has-text("wbs.md")')
  await page.waitForSelector('.p-dialog')

  // Esc 키 입력
  await page.keyboard.press('Escape')
  await page.waitForSelector('.p-dialog', { state: 'hidden' })

  // Dialog 닫힘 확인
  const dialogVisible = await page.isVisible('.p-dialog')
  expect(dialogVisible).toBe(false)
})
```

**예상 결과**:
- Esc 키로 다이얼로그 닫힘

**우선순위**: Medium

---

## 4. 통합 테스트

### 4.1 엔드-투-엔드 플로우

#### TC-INT-01: 다중 프로젝트 로드 플로우
**목적**: /wbs → API 호출 → 트리 렌더링 전체 플로우

**테스트 단계**:
```typescript
it('should load all projects and render tree (E2E)', async () => {
  // Step 1: 페이지 접속
  await page.goto('http://localhost:3000/wbs')

  // Step 2: API 호출 대기
  const apiResponse = await page.waitForResponse(
    response => response.url().includes('/api/wbs/all')
  )
  expect(apiResponse.status()).toBe(200)

  // Step 3: 트리 렌더링 확인
  await page.waitForSelector('.wbs-tree-panel')
  const projectNodes = await page.$$('[data-node-type="project"]')
  expect(projectNodes.length).toBeGreaterThan(0)

  // Step 4: 로딩 상태 해제 확인
  const loadingSpinner = await page.$('.p-progressspinner')
  expect(loadingSpinner).toBeNull()
})
```

**예상 결과**:
- API 호출 성공
- 트리 렌더링 완료
- 로딩 스피너 사라짐

**우선순위**: High

---

#### TC-INT-02: 프로젝트 선택 → 파일 로드 플로우
**목적**: 프로젝트 클릭 → 파일 API → 패널 표시

**테스트 단계**:
```typescript
it('should load files when project is selected (E2E)', async () => {
  await page.goto('http://localhost:3000/wbs')

  // Step 1: 프로젝트 클릭
  await page.click('[data-node-id="test-project-1"]')

  // Step 2: 파일 목록 API 호출 대기
  const apiResponse = await page.waitForResponse(
    response => response.url().includes('/api/projects/test-project-1/files')
  )
  expect(apiResponse.status()).toBe(200)

  // Step 3: 파일 목록 표시 확인
  await page.waitForSelector('.project-file-list')
  const fileItems = await page.$$('.project-file-item')
  expect(fileItems.length).toBeGreaterThan(0)
})
```

**예상 결과**:
- 파일 목록 API 호출
- 파일 목록 표시

**우선순위**: High

---

#### TC-INT-03: URL 파라미터 호환성
**목적**: ?project=xxx 파라미터 시 단일 모드 동작

**테스트 단계**:
```typescript
it('should use single project mode with ?project parameter', async () => {
  // Step 1: ?project=jjiban 접속
  await page.goto('http://localhost:3000/wbs?project=jjiban')

  // Step 2: 단일 프로젝트 API 호출 확인
  const apiResponse = await page.waitForResponse(
    response => response.url().includes('/api/projects/jjiban/wbs')
  )
  expect(apiResponse.status()).toBe(200)

  // Step 3: 프로젝트 노드 없음 (WP 노드부터 시작)
  const projectNodes = await page.$$('[data-node-type="project"]')
  expect(projectNodes).toHaveLength(0)

  const wpNodes = await page.$$('[data-node-type="wp"]')
  expect(wpNodes.length).toBeGreaterThan(0)
})
```

**예상 결과**:
- 기존 단일 프로젝트 API 호출
- 프로젝트 노드 없음 (WP부터 표시)

**우선순위**: High

---

#### TC-INT-04: 파일 열기 → 내용 로드 → 뷰어 표시
**목적**: 파일 클릭 → 내용 API → 뷰어 렌더링

**테스트 단계**:
```typescript
it('should load file content and display in viewer (E2E)', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')

  // Step 1: 파일 클릭
  await page.click('.project-file-item:has-text("wbs.md")')

  // Step 2: 파일 내용 API 호출 대기 (TODO: API 추가 필요)
  // const apiResponse = await page.waitForResponse(
  //   response => response.url().includes('/api/files/content')
  // )
  // expect(apiResponse.status()).toBe(200)

  // Step 3: 뷰어 표시 확인
  await page.waitForSelector('.file-viewer-content')
  const viewerContent = await page.textContent('.file-viewer-content')
  expect(viewerContent).toBeTruthy()
})
```

**예상 결과**:
- 파일 내용 로드
- 타입별 뷰어 표시

**우선순위**: High

---

#### TC-INT-05: 프로젝트 전환 시 파일 목록 갱신
**목적**: 다른 프로젝트 선택 시 파일 목록 변경

**테스트 단계**:
```typescript
it('should update file list when switching projects', async () => {
  await page.goto('http://localhost:3000/wbs')

  // Step 1: 프로젝트 1 선택
  await page.click('[data-node-id="test-project-1"]')
  await page.waitForSelector('.project-file-list')
  const files1 = await page.$$eval('.project-file-item', items =>
    items.map(el => el.textContent)
  )

  // Step 2: 프로젝트 2 선택
  await page.click('[data-node-id="test-project-2"]')
  await page.waitForTimeout(500) // API 호출 대기
  const files2 = await page.$$eval('.project-file-item', items =>
    items.map(el => el.textContent)
  )

  // Then: 파일 목록 다름
  expect(files1).not.toEqual(files2)
})
```

**예상 결과**:
- 프로젝트별 파일 목록 표시

**우선순위**: Medium

---

#### TC-INT-06: URL 변경 시 모드 전환
**목적**: URL 파라미터 변경 시 모드 전환

**테스트 단계**:
```typescript
it('should switch between multi and single project mode', async () => {
  // Step 1: 다중 프로젝트 모드
  await page.goto('http://localhost:3000/wbs')
  const multiModeProjects = await page.$$('[data-node-type="project"]')
  expect(multiModeProjects.length).toBeGreaterThan(0)

  // Step 2: 단일 프로젝트 모드로 전환
  await page.goto('http://localhost:3000/wbs?project=jjiban')
  await page.waitForSelector('.wbs-tree-panel')
  const singleModeProjects = await page.$$('[data-node-type="project"]')
  expect(singleModeProjects).toHaveLength(0)

  // Step 3: 다시 다중 프로젝트 모드
  await page.goto('http://localhost:3000/wbs')
  await page.waitForSelector('.wbs-tree-panel')
  const backToMultiMode = await page.$$('[data-node-type="project"]')
  expect(backToMultiMode.length).toBeGreaterThan(0)
})
```

**예상 결과**:
- URL 변경 시 모드 전환
- 트리 구조 변경

**우선순위**: Medium

---

## 5. 성능 테스트

### 5.1 TC-PERF-01: 다중 프로젝트 병렬 로드 성능
**목적**: 5개 프로젝트 로드 시간 < 2초

**테스트 단계**:
```typescript
it('should load 5 projects in less than 2 seconds', async () => {
  // Given: 5개 프로젝트 준비

  // When
  const startTime = performance.now()
  const response = await $fetch<AllWbsResponse>('/api/wbs/all')
  const endTime = performance.now()

  // Then
  const loadTime = endTime - startTime
  expect(loadTime).toBeLessThan(2000) // 2초
  expect(response.projects).toHaveLength(5)
})
```

**예상 결과**:
- 로드 시간 < 2초

**우선순위**: High

---

### 5.2 TC-PERF-02: 파일 목록 로드 성능
**목적**: 100개 파일 로드 < 500ms

**테스트 단계**:
```typescript
it('should load 100 files in less than 500ms', async () => {
  // Given: 100개 파일이 있는 프로젝트

  // When
  const startTime = performance.now()
  const response = await $fetch<ProjectFilesResponse>(
    '/api/projects/large-project/files'
  )
  const endTime = performance.now()

  // Then
  const loadTime = endTime - startTime
  expect(loadTime).toBeLessThan(500) // 500ms
  expect(response.files).toHaveLength(100)
})
```

**예상 결과**:
- 로드 시간 < 500ms

**우선순위**: Medium

---

## 6. 에러 처리 테스트

### 6.1 TC-ERR-01: 개별 프로젝트 로드 실패
**목적**: 일부 프로젝트 실패 시 나머지 표시

**테스트 단계**:
```typescript
it('should display other projects when one fails', async () => {
  // Given: project-2의 wbs.md 삭제

  // When
  await page.goto('http://localhost:3000/wbs')
  await page.waitForSelector('.wbs-tree-panel')

  // Then: 나머지 프로젝트 표시
  const projectNodes = await page.$$('[data-node-type="project"]')
  expect(projectNodes.length).toBeGreaterThan(0)
  expect(projectNodes.length).toBeLessThan(3) // 1개 실패
})
```

**예상 결과**:
- 나머지 프로젝트 표시
- 에러 없음

**우선순위**: High

---

### 6.2 TC-ERR-02: 전체 프로젝트 목록 실패
**목적**: API 실패 시 에러 메시지 + 재시도

**테스트 단계**:
```typescript
it('should show error message and retry button on failure', async () => {
  // Given: API 실패 시뮬레이션 (서버 중지)

  // When
  await page.goto('http://localhost:3000/wbs')

  // Then: 에러 메시지 표시
  await page.waitForSelector('.error-message')
  const errorText = await page.textContent('.error-message')
  expect(errorText).toContain('Failed to fetch')

  // 재시도 버튼 존재
  const retryButton = await page.$('button:has-text("재시도")')
  expect(retryButton).toBeTruthy()
})
```

**예상 결과**:
- 에러 메시지 표시
- 재시도 버튼 표시

**우선순위**: High

---

## 7. 접근성 테스트

### 7.1 TC-A11Y-01: 키보드 네비게이션
**목적**: 키보드로 트리 노드 이동 및 선택

**테스트 단계**:
```typescript
it('should navigate tree with keyboard', async () => {
  await page.goto('http://localhost:3000/wbs')
  await page.waitForSelector('.wbs-tree-panel')

  // 첫 번째 노드에 포커스
  await page.focus('[data-node-type="project"]:first-child')

  // ↓ 키로 다음 노드 이동
  await page.keyboard.press('ArrowDown')

  // Enter 키로 선택
  await page.keyboard.press('Enter')
  await page.waitForSelector('.project-detail-panel')

  // 패널 표시 확인
  const panelVisible = await page.isVisible('.project-detail-panel')
  expect(panelVisible).toBe(true)
})
```

**예상 결과**:
- 키보드로 노드 이동 및 선택 가능

**우선순위**: High

---

### 7.2 TC-A11Y-02: ARIA 레이블
**목적**: 스크린 리더용 ARIA 레이블 검증

**테스트 단계**:
```typescript
it('should have proper ARIA labels', async () => {
  await page.goto('http://localhost:3000/wbs')

  // 프로젝트 노드 ARIA 레이블
  const projectLabel = await page.getAttribute(
    '[data-node-type="project"]:first-child',
    'aria-label'
  )
  expect(projectLabel).toContain('프로젝트')

  // 파일 버튼 ARIA 레이블
  await page.click('[data-node-id="test-project-1"]')
  const fileButton = await page.getAttribute(
    '.project-file-item:first-child',
    'aria-label'
  )
  expect(fileButton).toContain('파일 열기')
})
```

**예상 결과**:
- 모든 인터랙티브 요소에 ARIA 레이블

**우선순위**: High

---

## 8. 보안 테스트

### 8.1 TC-SEC-01: 파일 경로 검증
**목적**: 프로젝트 폴더 외부 접근 방지

**테스트 단계**:
```typescript
it('should prevent directory traversal attacks', async () => {
  // When: ../ 경로 시도
  await expect(
    $fetch('/api/projects/../../../etc/passwd/files')
  ).rejects.toMatchObject({
    statusCode: 403 // 또는 400
  })
})
```

**예상 결과**:
- 403 Forbidden 또는 400 Bad Request

**우선순위**: High

---

### 8.2 TC-SEC-02: 마크다운 XSS 방지
**목적**: 악의적인 스크립트 삽입 방지

**테스트 단계**:
```typescript
it('should sanitize markdown content', async () => {
  // Given: <script> 태그가 포함된 마크다운
  const maliciousMd = `
# Test
<script>alert('XSS')</script>
`

  // When: 렌더링
  await page.goto('http://localhost:3000/wbs')
  await page.click('[data-node-id="test-project-1"]')
  await page.click('.project-file-item:has-text("malicious.md")')

  // Then: <script> 태그 제거됨
  const html = await page.innerHTML('.markdown-content')
  expect(html).not.toContain('<script>')
})
```

**예상 결과**:
- `<script>` 태그 제거
- XSS 공격 방지

**우선순위**: High

---

## 9. 테스트 실행 가이드

### 9.1 단위 테스트 실행
```bash
# API 테스트
npm run test:unit -- server/api/wbs/all.test.ts
npm run test:unit -- server/api/projects/[id]/files.test.ts

# 서비스 테스트
npm run test:unit -- server/utils/wbs/wbsService.test.ts
npm run test:unit -- server/utils/projects/projectFilesService.test.ts
```

### 9.2 E2E 테스트 실행
```bash
# Playwright E2E 테스트
npm run test:e2e -- tests/wbs-multi-project.spec.ts

# 특정 테스트만 실행
npm run test:e2e -- tests/wbs-multi-project.spec.ts -g "TC-INT-01"
```

### 9.3 성능 테스트 실행
```bash
# 성능 벤치마크
npm run test:perf -- tests/performance/wbs-load.perf.ts
```

---

## 10. 테스트 커버리지 목표

| 항목 | 목표 | 현재 |
|------|------|------|
| API 라인 커버리지 | 90% | - |
| 서비스 함수 커버리지 | 95% | - |
| UI 컴포넌트 커버리지 | 80% | - |
| E2E 시나리오 커버리지 | 100% | - |

---

## 부록

### A. 테스트 데이터 생성 스크립트
```typescript
// scripts/create-test-projects.ts
async function createTestProjects() {
  // test-project-1 생성
  await createProject({
    id: 'test-project-1',
    name: 'Test Project 1',
    wbsDepth: 4,
    status: 'active'
  })

  // WBS 생성 (2 WP, 3 ACT, 10 TSK)
  await createWbs('test-project-1', {
    wps: 2,
    acts: 3,
    tasks: 10,
    completedTasks: 6
  })

  // 파일 생성
  await createFiles('test-project-1', [
    { name: 'prd.md', size: 204800, type: 'markdown' },
    { name: 'diagram.png', size: 512000, type: 'image' }
  ])
}
```

### B. 변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-17 | 1.0 | 초안 작성 | System Architect |
