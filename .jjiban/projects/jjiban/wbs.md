> version: 1.0
> depth: 4
> updated: 2025-12-18
> start: 2025-12-16

---

## WP-01: Platform Infrastructure
- priority: critical
- schedule: 2025-12-13 ~ 2025-12-20
- progress: 100%

### ACT-01-01: Project Setup
- schedule: 2025-12-13 ~ 2025-12-16
- progress: 100%

#### TSK-01-01-01: Nuxt 3 프로젝트 초기화
- category: infrastructure
- status: [xx]
- priority: critical
- assignee: hong
- schedule: 2025-12-13 ~ 2025-12-13
- tags: nuxt, setup
- requirements:
  - Nuxt 3 프로젝트 생성 (npx nuxi init)
  - TypeScript 설정
  - Standalone 모드 설정 (nitro preset)
- ref: PRD 3
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-01-01-02: PrimeVue 4.x + TailwindCSS 설정
- category: infrastructure
- status: [xx]
- priority: critical
- schedule: 2025-12-13 ~ 2025-12-14
- tags: primevue, tailwind, ui
- depends: TSK-01-01-01
- requirements:
  - PrimeVue 4.x 설치 및 Nuxt 플러그인 설정
  - TailwindCSS 설치 및 nuxt.config 설정
  - Dark Blue 테마 색상 팔레트 적용
- ref: PRD 10.1
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-01-01-03: Pinia 상태 관리 설정
- category: infrastructure
- status: [xx]
- priority: high
- schedule: 2025-12-14 ~ 2025-12-14
- tags: pinia, state
- depends: TSK-01-01-01
- requirements:
  - Pinia 설치 및 설정
  - 기본 스토어 구조 생성 (project, wbs, selection, settings)
- ref: PRD 9.3
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-01-01-04: 프로젝트 디렉토리 구조 설정
- category: infrastructure
- status: [xx]
- priority: high
- assignee: hong
- schedule: 2025-12-14 ~ 2025-12-15
- tags: structure, setup
- depends: TSK-01-01-01
- requirements:
  - components/, composables/, stores/, server/api/ 디렉토리 구조
  - 공통 타입 정의 (types/)
  - 유틸리티 함수 디렉토리 (utils/)
- ref: PRD 9
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-01-01-05: WBS Store API 응답 처리 버그 수정
- category: defect
- status: [xx]
- priority: critical
- schedule: 2025-12-15 ~ 2025-12-15
- tags: bug, store, api
- depends: TSK-01-01-03
- requirements:
  - fetchWbs 함수의 API 응답 형식 수정
  - API 응답 `{metadata, tree}` 객체에서 tree 배열 추출
  - "nodes is not iterable" 에러 해결
- ref: TSK-04-03 E2E 테스트 결과
- completed:
  - an: 2025-12-15 22:13
  - fx: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

### ACT-01-02: App Layout
- schedule: 2025-12-16 ~ 2025-12-18
- progress: 100%

#### TSK-01-02-01: AppLayout 컴포넌트 구현
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-16 ~ 2025-12-17
- tags: layout, component
- depends: TSK-01-01-02
- requirements:
  - 전체 레이아웃 구조 (Header + Content)
  - 좌우 분할 패널 (WBS Tree 60% + Detail 40%)
  - 반응형 레이아웃 (최소 1200px)
- ref: PRD 6.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-01-02-02: AppHeader 컴포넌트 구현
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-18
- tags: header, navigation
- depends: TSK-01-02-01
- requirements:
  - jjiban 로고
  - 네비게이션 메뉴 (대시보드, 칸반, WBS, Gantt) - WBS만 활성
  - 현재 프로젝트명 표시
- ref: PRD 6.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

---

## WP-02: Data Storage Layer
- priority: critical
- schedule: 2025-12-16 ~ 2025-12-27
- progress: 100%

### ACT-02-01: File System Service
- schedule: 2025-12-16 ~ 2025-12-20
- progress: 100%

#### TSK-02-01-01: .jjiban 디렉토리 구조 생성
- category: infrastructure
- status: [xx]
- priority: critical
- schedule: 2025-12-16 ~ 2025-12-17
- tags: init, filesystem
- depends: TSK-01-01-04
- requirements:
  - .jjiban/ 폴더 존재 확인 및 생성
  - settings/, templates/, projects/ 하위 폴더 생성
  - 최소 초기화 (폴더 구조만, 설정은 기본값 사용)
- ref: PRD 7.1
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-02-01-02: 파일 읽기/쓰기 유틸리티
- category: infrastructure
- status: [xx]
- priority: critical
- schedule: 2025-12-17 ~ 2025-12-18
- tags: filesystem, utils
- depends: TSK-02-01-01
- requirements:
  - JSON 파일 읽기/쓰기 함수
  - Markdown 파일 읽기/쓰기 함수
  - 파일 존재 확인 함수
  - 에러 핸들링
- ref: PRD 7
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

### ACT-02-02: WBS Parser
- schedule: 2025-12-18 ~ 2025-12-23
- progress: 100%

#### TSK-02-02-01: wbs.md 파서 구현
- category: development
- status: [xx]
- priority: critical
- schedule: 2025-12-18 ~ 2025-12-20
- tags: parser, markdown, wbs
- depends: TSK-02-01-02
- requirements:
  - Markdown → WbsNode[] 트리 변환
  - WP/ACT/TSK 계층 파싱 (## / ### / ####)
  - 속성 파싱 (category, status, priority, assignee 등)
  - 4단계/3단계 구조 모두 지원
- ref: PRD 7.2, 7.3
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-02-02-02: wbs.md 시리얼라이저 구현
- category: development
- status: [xx]
- priority: critical
- schedule: 2025-12-20 ~ 2025-12-22
- tags: serializer, markdown, wbs
- depends: TSK-02-02-01
- requirements:
  - WbsNode[] → Markdown 문자열 변환
  - 속성 포맷팅 (- key: value)
  - 계층별 올바른 마크다운 헤딩 생성
- ref: PRD 7.2, 7.3
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-02-02-03: WBS 데이터 유효성 검증
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-22 ~ 2025-12-23
- tags: validation, wbs
- depends: TSK-02-02-01
- requirements:
  - ID 형식 검증 (WP-XX, ACT-XX-XX, TSK-XX-XX-XX)
  - 필수 속성 검증 (category, status, priority)
  - 상태 기호 유효성 검증
  - 중복 ID 검사
- ref: PRD 7.3, 7.4
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

### ACT-02-03: Settings Service
- schedule: 2025-12-23 ~ 2025-12-27
- progress: 100%

#### TSK-02-03-01: 기본 설정 JSON 스키마 정의
- category: infrastructure
- status: [xx]
- priority: high
- schedule: 2025-12-23 ~ 2025-12-24
- tags: schema, settings
- depends: TSK-02-01-02
- requirements:
  - columns.json 스키마 (칸반 컬럼)
  - categories.json 스키마 (카테고리)
  - workflows.json 스키마 (워크플로우 규칙)
  - actions.json 스키마 (상태 내 액션)
- ref: PRD 7.1
- completed:
  - ds: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-02-03-02: 설정 서비스 구현
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-24 ~ 2025-12-26
- tags: service, settings
- depends: TSK-02-03-01
- requirements:
  - 설정 파일 로드 (없으면 기본값 사용)
  - 설정 캐싱
  - 설정 조회 API
- ref: PRD 8.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-02-03-03: 프로젝트 메타데이터 서비스
- category: development
- status: [xx]
- priority: medium
- schedule: 2025-12-26 ~ 2025-12-27
- tags: service, project
- depends: TSK-02-03-02
- requirements:
  - project.json 읽기/쓰기
  - team.json 읽기/쓰기
  - 프로젝트 목록 조회
- ref: PRD 7.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

---

## WP-03: Backend API & Workflow
- priority: high
- schedule: 2025-12-23 ~ 2026-01-10
- progress: 100%

#### TSK-03-01: Project API
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-23 ~ 2025-12-30
- tags: api, project
- depends: TSK-02-03-03
- requirements:
  - GET /api/projects - 프로젝트 목록 조회
  - GET /api/projects/:id - 프로젝트 상세 (project.json, team.json 포함)
  - POST /api/projects - 프로젝트 생성 (폴더, 초기 파일 생성)
- ref: PRD 8.1

#### TSK-03-02: WBS API
- category: development
- status: [xx]
- priority: critical
- schedule: 2025-12-27 ~ 2025-12-31
- tags: api, wbs
- depends: TSK-02-02-01,TSK-02-02-02,TSK-03-01
- requirements:
  - GET /api/projects/:id/wbs - WBS 트리 조회 (파싱, 계층 구조, 진행률)
  - PUT /api/projects/:id/wbs - WBS 저장 (유효성 검증, 롤백)
  - GET/PUT /api/tasks/:id - Task 조회/수정 (이력 기록)
- ref: PRD 8.1, 8.2
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-03-03: Workflow API & Settings
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-31 ~ 2026-01-03
- tags: api, workflow, settings
- depends: TSK-03-02,TSK-02-03-02
- requirements:
  - POST /api/tasks/:id/transition - 상태 전이 API
  - GET /api/tasks/:id/documents - 문서 목록 (존재/예정 구분)
  - GET /api/settings/:type - 설정 조회 (columns, categories, workflows, actions)
- ref: PRD 5.3, 8.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-03-04: Workflow Engine
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-03 ~ 2026-01-10
- tags: service, workflow, rules
- depends: TSK-02-03-01,TSK-03-03
- requirements:
  - 워크플로우 규칙 정의 (development, defect, infrastructure)
  - WorkflowEngine 서비스 (getAvailableCommands, executeCommand, 검증)
  - 상태 전이 이력 관리 (기록, 저장, 조회)
  - 상태 액션 구현 (ui, review, apply, test, audit, patch)
- ref: PRD 5.2, 5.3, 6.3.6
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-03-05: WBS 테스트 결과 업데이트 API
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-01-10 ~ 2026-01-13
- tags: api, wbs, test-result
- depends: TSK-03-02,TSK-02-02-01,TSK-02-02-02
- requirements:
  - PUT /api/projects/:id/wbs/tasks/:taskId/test-result - 테스트 결과 업데이트 API
  - wbs.md 파일의 test-result 필드 자동 업데이트
  - 테스트 결과 값: none (결과없음), pass (정상), fail (오류)
  - /wf:test, /wf:verify 완료 시 자동 호출
- ref: WBS test-result 속성
- completed:
  - bd: 2025-12-15 22:31
  - dd: 2025-12-15 22:48
  - im: 2025-12-15 22:54
  - vf: 2025-12-15 23:04
  - xx: 2025-12-15 23:08

#### TSK-03-06: completed 필드 지원 (Parser/Serializer/API)
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-13 ~ 2026-01-16
- tags: api, wbs, completed, parser, serializer
- depends: TSK-02-02-01,TSK-02-02-02,TSK-03-03
- requirements:
  - WBS Parser: completed 필드 파싱 (중첩 리스트 형식)
  - WBS Serializer: completed 필드 직렬화
  - Transition API: 상태 전이 시 자동 타임스탬프 기록
  - 롤백 시 이후 단계 completed 삭제
- ref: PRD 7.4, 7.5
- completed:
  - bd: 2025-12-15 23:15
  - dd: 2025-12-15 23:55
  - im: 2025-12-16 00:13
  - vf: 2025-12-16 00:43
  - xx: 2025-12-16 00:50

---

## WP-04: WBS Tree View (Frontend)
- priority: high
- schedule: 2026-01-06 ~ 2026-01-15
- progress: 100%

#### TSK-04-00: Projects Page
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-06 ~ 2026-01-07
- tags: page, project, list
- depends: TSK-03-01,TSK-01-02-01
- requirements:
  - ProjectsPage 컴포넌트 (pages/projects.vue)
  - GET /api/projects 연동하여 프로젝트 목록 표시
  - 프로젝트 카드/리스트 UI (PrimeVue Card 활용)
  - 프로젝트 선택 시 /wbs?project={id} 이동
- ref: PRD 6.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-04-01: Tree Panel
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-06 ~ 2026-01-09
- tags: component, tree
- depends: TSK-01-02-01,TSK-03-02
- requirements:
  - WbsTreePanel 컴포넌트 (컨테이너, 데이터 로드, 상태 관리)
  - WbsTreeHeader 컴포넌트 (검색 박스, 펼치기/접기, 요약 카드)
  - WbsSummaryCards 컴포넌트 (WP/ACT/TSK 카운트, 진행률)
  - WbsSearchBox 컴포넌트 (필터링, debounce, 하이라이트)
- ref: PRD 6.2, 6.2.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-04-02: Tree Node
- category: development
- status: [xx]
- priority: critical
- schedule: 2026-01-09 ~ 2026-01-12
- tags: component, tree, recursive
- depends: TSK-04-01
- requirements:
  - WbsTreeNode 컴포넌트 (재귀 렌더링, 펼침/접힘, 선택, 들여쓰기)
  - NodeIcon 컴포넌트 (계층별 아이콘/색상, 라운드 사각형 배지)
  - StatusBadge + CategoryTag 컴포넌트 (상태/카테고리 표시)
  - ProgressBar 컴포넌트 (퍼센트 진행률 바)
- ref: PRD 6.2.2, 10.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

#### TSK-04-03: Tree Interaction
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-12 ~ 2026-01-15
- tags: state, interaction
- depends: TSK-04-02,TSK-01-01-03
- requirements:
  - 트리 펼침/접힘 상태 관리 (토글, 전체 펼치기/접기, 로컬 스토리지)
  - 노드 선택 및 상세 패널 연동 (Pinia selection 스토어)
  - 키보드 네비게이션 (화살표 키, Enter, Space)
- ref: PRD 6.2.3, 11.2
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:13

---

## WP-05: Task Detail & Document (Frontend)
- priority: high
- schedule: 2026-01-13 ~ 2026-01-22
- progress: 100%

#### TSK-05-01: Detail Panel Structure
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-13 ~ 2026-01-15
- tags: component, detail
- depends: TSK-04-03
- requirements:
  - TaskDetailPanel 컴포넌트 (컨테이너, 스크롤 콘텐츠)
  - TaskBasicInfo 컴포넌트 (ID, 제목, 카테고리, 우선순위, 담당자, 인라인 편집)
  - TaskProgress 컴포넌트 (현재 상태, 워크플로우 시각화)
- ref: PRD 6.3, 6.3.1, 6.3.2
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:25
  - im: 2025-12-15 23:30
  - xx: 2025-12-15 23:45

#### TSK-05-02: Detail Sections
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-01-15 ~ 2026-01-18
- tags: component, workflow
- depends: TSK-05-01,TSK-03-03
- requirements:
  - TaskWorkflow 컴포넌트 (워크플로우 흐름, 상태 노드, 현재 상태 강조)
  - TaskRequirements 컴포넌트 (요구사항 목록, PRD 참조, 인라인 편집)
  - TaskDocuments 컴포넌트 (문서 목록, 존재/예정 구분, 뷰어 연동)
- ref: PRD 6.3.2, 6.3.3, 6.3.4
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 23:50
  - xx: 2025-12-15 23:55

#### TSK-05-03: Detail Actions
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-18 ~ 2026-01-20
- tags: component, action, edit
- depends: TSK-05-02,TSK-03-02
- requirements:
  - TaskActions 컴포넌트 (편집, 문서 열기, 상태 전이 버튼)
  - 인라인 편집 기능 (필드별 편집, API 연동, 낙관적 업데이트)
- ref: PRD 6.3.5
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 23:50
  - xx: 2025-12-15 23:55

#### TSK-05-04: Document Viewer
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-01-20 ~ 2026-01-22
- tags: markdown, viewer, component
- depends: TSK-01-01-02,TSK-03-03,TSK-05-02
- requirements:
  - Markdown 렌더러 설정 (marked/markdown-it, GFM, highlight.js)
  - DocumentViewer 컴포넌트 (로드, 렌더링, 스크롤)
  - 문서 API 연동 (GET /api/tasks/:id/documents/:filename)
- ref: PRD 8.1
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 23:50
  - xx: 2025-12-15 23:55

#### TSK-05-05: WP/ACT Detail Panel
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-02-20 ~ 2026-02-22
- tags: component, detail, wp, act
- depends: TSK-05-01
- requirements:
  - NodeDetailPanel 컴포넌트 (WP/ACT/Task 분기 처리)
  - WpActBasicInfo 컴포넌트 (ID, 제목, 일정, 진행률)
  - WpActChildren 컴포넌트 (하위 노드 목록, 상태별 카운트)
  - WpActProgress 컴포넌트 (진행률 시각화, 완료/진행/대기 비율)
  - selectionStore 연동 (WP/ACT 선택 시 상세 표시)
  - wbs.vue 우측 패널 분기 로직 수정
- ref: PRD 6.3
- completed:
  - bd: 2025-12-16 17:00
  - dd: 2025-12-16 18:30
  - im: 2025-12-16 17:17
  - ts: 2025-12-16 17:31
  - xx: 2025-12-16 18:45

---

## WP-06: Integration & Testing
- priority: medium
- schedule: 2026-01-20 ~ 2026-01-25
- progress: 100%

#### TSK-06-01: Integration
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-20 ~ 2026-01-23
- tags: page, integration, pinia
- depends: TSK-04-03,TSK-05-03
- requirements:
  - WBS 페이지 통합 (pages/wbs.vue, 패널 통합, 에러 핸들링)
  - 상태 관리 통합 (project, wbs, selection 스토어 연동)
  - 에러 핸들링 및 로딩 상태 (스피너, 빈 상태, 토스트)
- ref: PRD 9.1, 9.3, 11
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:13
  - im: 2025-12-15 22:13
  - vf: 2025-12-15 22:13
  - xx: 2025-12-15 22:20

#### TSK-06-02: Testing
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-01-23 ~ 2026-01-25
- tags: test, unit, e2e
- depends: TSK-06-01
- requirements:
  - 단위 테스트 (WBS 파서, 워크플로우 엔진, 유틸리티)
  - E2E 테스트 (트리 렌더링, 노드 선택, 상태 전이)
- ref: PRD 11
- completed:
  - bd: 2025-12-15 22:13
  - dd: 2025-12-15 22:26
  - im: 2025-12-16 08:30
  - vf: 2025-12-16 08:35
  - xx: 2025-12-16 08:40

---

## WP-07: CLI Tools
- priority: high
- schedule: 2026-01-25 ~ 2026-02-05
- progress: 100%

#### TSK-07-01: Workflow Orchestrator CLI 구현
- category: development
- status: [xx]
- priority: high
- schedule: 2026-01-25 ~ 2026-02-05
- tags: cli, workflow, orchestrator
- depends: TSK-03-04
- requirements:
  - Node.js 기반 CLI 진입점 (bin/jjiban.js)
  - workflow 명령어 구현 (jjiban workflow TSK-XX)
  - 워크플로우 러너 (각 단계마다 새 Claude 세션 호출)
  - 상태 관리자 (workflow-state.json 저장/로드)
  - wbs.md 파서 연동 (기존 server/utils/wbs/parser 재사용)
  - Claude CLI 실행기 (spawn으로 claude -p 호출)
  - --until, --dry-run, --resume, --verbose 옵션 지원
  - package.json bin 설정 및 commander 의존성 추가
- ref: PRD 13
- completed:
  - bd: 2025-12-15 22:34
  - dd: 2025-12-15 22:43
  - im: 2025-12-15 22:53
  - vf: 2025-12-15 23:02
  - xx: 2025-12-15 23:03

---

## WP-08: PrimeVue Component Migration
- priority: medium
- schedule: 2026-02-06 ~ 2026-02-20
- progress: 100%

#### TSK-08-01: WbsTreePanel + NodeIcon Migration
- category: development
- status: [xx]
- priority: high
- schedule: 2026-02-06 ~ 2026-02-09
- tags: primevue, tree, component, migration
- depends: TSK-06-02
- requirements:
  - 커스텀 트리 렌더링 → PrimeVue Tree 컴포넌트로 교체
  - WbsNode[] → PrimeVue TreeNode[] 변환 함수 구현
  - v-model:expandedKeys로 펼침 상태 관리
  - 커스텀 노드 템플릿 (NodeIcon + StatusBadge)
  - NodeIcon: HEX 하드코딩 제거 → CSS 클래스 (.node-icon-*) 적용
  - wbsStore와 상태 동기화 (expand/collapse 메서드)
  - 접근성 유지 (ARIA 속성)
- ref: PRD 6.2, TRD 2.3.6
- completed:
  - bd: 2025-12-16 09:00
  - dd: 2025-12-16 09:30
  - im: 2025-12-16 10:00
  - vf: 2025-12-16 10:30
  - xx: 2025-12-16 11:00

#### TSK-08-02: WBS UI Components Migration
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-02-09 ~ 2026-02-11
- tags: primevue, badge, tag, progress, migration
- depends: TSK-08-01
- requirements:
  - StatusBadge: HEX 하드코딩 제거 → CSS 클래스 (.status-*) 적용
  - CategoryTag: HEX 하드코딩 제거 → CSS 클래스 (.category-*) 적용
  - ProgressBar: PrimeVue ProgressBar 컴포넌트로 교체
  - main.css에 통합 스타일 클래스 정의
  - CSS 클래스 중앙화 원칙 준수 (TRD 2.3.6)
- ref: PRD 10.1, TRD 2.3.6
- completed:
  - bd: 2025-12-16 10:25
  - dd: 2025-12-16 10:35
  - im: 2025-12-16 10:51
  - vf: 2025-12-16 11:07
  - xx: 2025-12-16 11:15

#### TSK-08-03: AppLayout PrimeVue Splitter Migration
- category: development
- status: [xx]
- priority: high
- schedule: 2026-02-11 ~ 2026-02-13
- tags: primevue, splitter, layout, migration
- depends: TSK-08-01
- requirements:
  - 커스텀 CSS Grid → PrimeVue Splitter + SplitterPanel 교체
  - 60:40 기본 비율, minSize 제약 유지
  - 슬롯 기반 콘텐츠 주입 유지 (header, left, right)
  - 다크 테마 CSS 변수 통합
  - 반응형 동작 유지 (min-width: 1200px)
- ref: PRD 6.1
- completed:
  - bd: 2025-12-16
  - dd: 2025-12-16
  - im: 2025-12-16
  - vf: 2025-12-16
  - xx: 2025-12-16

#### TSK-08-04: AppHeader PrimeVue Menubar Migration
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-02-13 ~ 2026-02-15
- tags: primevue, menubar, navigation, migration
- depends: TSK-08-03
- requirements:
  - 커스텀 네비게이션 → PrimeVue Menubar 교체
  - MenuItem 모델로 메뉴 구성 (enabled/disabled 상태)
  - start/end 슬롯으로 로고 및 프로젝트명 배치
  - 활성 라우트 하이라이팅 (item 템플릿 사용)
  - disabled 메뉴 클릭 시 "준비 중" 토스트 유지
  - 접근성 유지 (aria-current, aria-disabled)
- ref: PRD 6.1
- completed:
  - bd: 2025-12-16
  - dd: 2025-12-16
  - im: 2025-12-16
  - vf: 2025-12-16
  - xx: 2025-12-16

#### TSK-08-05: TaskDetailPanel Dialog Migration
- category: development
- status: [xx]
- priority: medium
- schedule: 2026-02-15 ~ 2026-02-17
- tags: primevue, dialog, detail, migration
- depends: TSK-08-02
- requirements:
  - TaskDetailPanel: 인라인 스타일 제거 → PrimeVue Dialog 활용
  - TaskWorkflow: WORKFLOW_THEME 제거 → CSS 클래스 (.workflow-*) 적용
  - TaskHistory: HISTORY_THEME 제거 → CSS 클래스 (.history-marker-*) 적용
  - TaskDocuments: 인라인 스타일 제거 → CSS 클래스 (.doc-card-*) 적용
  - themeConfig.ts 의존성 완전 제거
- ref: PRD 6.3, TRD 2.3.6
- completed:
  - bd: 2025-12-16
  - dd: 2025-12-16
  - im: 2025-12-16
  - vf: 2025-12-16
  - xx: 2025-12-16

#### TSK-08-06: Theme Integration & E2E Testing
- category: development
- status: [xx]
- priority: high
- assignee: hong
- schedule: 2026-02-17 ~ 2026-02-20
- tags: theme, testing, e2e, migration
- depends: TSK-08-01,TSK-08-02,TSK-08-03,TSK-08-04,TSK-08-05
- requirements:
  - PrimeVue 디자인 토큰 오버라이드 (main.css)
  - --p-tree-*, --p-splitter-*, --p-menubar-* 변수 매핑
  - themeConfig.ts 삭제 및 의존성 정리
  - 다크 테마 일관성 검증
  - 기존 E2E 테스트 실행 및 회귀 수정
  - PrimeVue 컴포넌트 상호작용 테스트 추가
  - 접근성 검증 (WCAG 2.1)
- ref: PRD 10.1, PRD 11, TRD 2.3.6
- completed:
  - bd: 2025-12-16
  - dd: 2025-12-16
  - im: 2025-12-16
  - vf: 2025-12-16
  - xx: 2025-12-16

#### TSK-08-07: Task Panel Enhancement - Stepper & Missing Info
- category: development
- status: [xx]
- priority: high
- assignee: hong
- schedule: 2025-12-16 ~ 2025-12-20
- tags: stepper, popover, taskpanel, ui, ux
- depends: TSK-08-06
- requirements:
  - TaskDetail 타입에 completed 필드 추가
  - getTaskDetail() API에서 completed 반환
  - TaskProgress를 클릭 가능한 Stepper로 변경
  - Stepper 단계 클릭 시 Popover 표시 (완료일 + 액션 버튼)
  - Auto 버튼 추가 (wf:auto 명령어 연결, 현재→완료 자동 실행)
  - 상태 전이 액션 (start, draft, build, verify, done, fix, skip)
  - 상태 내 액션 (ui, review, apply, test, audit, patch)
  - TaskBasicInfo에 누락 정보 추가 (schedule, tags, depends, ref)
  - depends 클릭 시 해당 Task로 이동
  - 접근성 준수 (WCAG 2.1)
- ref: PRD 6.3, TRD 2.3.6
- completed:
  - bd: 2025-12-16 18:45
  - dd: 2025-12-16 22:15
  - im: 2025-12-16 22:15
  - vf: 2025-12-16 22:15
  - xx: 2025-12-16 22:16

---

## WP-09: Multi-Project Support
- priority: high
- schedule: 2025-12-17 ~ 2025-12-20
- progress: 90%

#### TSK-09-01: 다중 프로젝트 WBS 통합 뷰
- category: development
- status: [xx]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-20
- tags: multi-project, wbs, tree, api
- depends: TSK-04-01,TSK-03-02
- requirements:
  - GET /api/wbs/all 엔드포인트 추가 (모든 프로젝트 WBS 조회)
  - 모든 프로젝트 WBS를 한 트리에 표시 (프로젝트 → WP → ACT → TSK)
  - 프로젝트 노드 타입 UI (아이콘, 스타일)
  - 프로젝트 상세 패널 컴포넌트 (정보 + 파일 목록)
  - GET /api/projects/:id/files 엔드포인트 (프로젝트 파일 목록)
  - 파일 뷰어 (.md: 마크다운, 이미지: 이미지 표시, 기타: Monaco Editor)
  - URL 파라미터 없이 /wbs 접속 시 전체 프로젝트 뷰
  - ?project=xxx 파라미터 시 기존 단일 프로젝트 뷰 유지
- ref: PRD 6.5
- completed:
  - bd: 2025-12-17 10:00
  - dd: 2025-12-17 11:30
  - im: 2025-12-17 15:30
  - vf: 2025-12-17 16:00
  - xx: 2025-12-17 16:10
