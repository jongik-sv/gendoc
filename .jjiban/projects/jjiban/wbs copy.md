# WBS - jjiban (1차: WBS 트리 뷰)

> version: 1.0
> depth: 4
> updated: 2025-12-13
> start: 2025-12-13

---

## WP-01: Platform Infrastructure
- status: planned
- priority: critical
- schedule: 2025-12-13 ~ 2025-12-20
- progress: 0%

### ACT-01-01: Project Setup
- status: todo
- schedule: 2025-12-13 ~ 2025-12-16

#### TSK-01-01-01: Nuxt 3 프로젝트 초기화
- category: infrastructure
- status: done [xx]
- priority: critical
- assignee: -
- schedule: 2025-12-13 ~ 2025-12-13
- tags: nuxt, setup
- depends: -
- requirements:
  - Nuxt 3 프로젝트 생성 (npx nuxi init)
  - TypeScript 설정
  - Standalone 모드 설정 (nitro preset)
- ref: PRD 3

#### TSK-01-01-02: PrimeVue 4.x + TailwindCSS 설정
- category: infrastructure
- status: done [xx]
- priority: critical
- assignee: -
- schedule: 2025-12-13 ~ 2025-12-14
- tags: primevue, tailwind, ui
- depends: TSK-01-01-01
- requirements:
  - PrimeVue 4.x 설치 및 Nuxt 플러그인 설정
  - TailwindCSS 설치 및 nuxt.config 설정
  - Dark Blue 테마 색상 팔레트 적용
- ref: PRD 10.1

#### TSK-01-01-03: Pinia 상태 관리 설정
- category: infrastructure
- status: done [xx]
- priority: high
- assignee: -
- schedule: 2025-12-14 ~ 2025-12-14
- tags: pinia, state
- depends: TSK-01-01-01
- requirements:
  - Pinia 설치 및 설정
  - 기본 스토어 구조 생성 (project, wbs, selection, settings)
- ref: PRD 9.3

#### TSK-01-01-04: 프로젝트 디렉토리 구조 설정
- category: infrastructure
- status: done [xx]
- priority: high
- assignee: -
- schedule: 2025-12-14 ~ 2025-12-15
- tags: structure, setup
- depends: TSK-01-01-01
- requirements:
  - components/, composables/, stores/, server/api/ 디렉토리 구조
  - 공통 타입 정의 (types/)
  - 유틸리티 함수 디렉토리 (utils/)
- ref: PRD 9

### ACT-01-02: App Layout
- status: todo
- schedule: 2025-12-16 ~ 2025-12-18

#### TSK-01-02-01: AppLayout 컴포넌트 구현
- category: development
- status: done [xx]
- priority: high
- assignee: -
- schedule: 2025-12-16 ~ 2025-12-17
- tags: layout, component
- depends: TSK-01-01-02
- requirements:
  - 전체 레이아웃 구조 (Header + Content)
  - 좌우 분할 패널 (WBS Tree 60% + Detail 40%)
  - 반응형 레이아웃 (최소 1200px)
- ref: PRD 6.1

#### TSK-01-02-02: AppHeader 컴포넌트 구현
- category: development
- status: done [xx]
- priority: high
- assignee: -
- schedule: 2025-12-17 ~ 2025-12-18
- tags: header, navigation
- depends: TSK-01-02-01
- requirements:
  - jjiban 로고
  - 네비게이션 메뉴 (대시보드, 칸반, WBS, Gantt) - WBS만 활성
  - 현재 프로젝트명 표시
- ref: PRD 6.1

---

## WP-02: Data Storage Layer
- status: planned
- priority: critical
- schedule: 2025-12-16 ~ 2025-12-27
- progress: 0%

### ACT-02-01: File System Service
- status: todo
- schedule: 2025-12-16 ~ 2025-12-20

#### TSK-02-01-01: .jjiban 디렉토리 구조 생성
- category: infrastructure
- status: done [xx]
- priority: critical
- assignee: -
- schedule: 2025-12-16 ~ 2025-12-17
- tags: init, filesystem
- depends: TSK-01-01-04
- requirements:
  - .jjiban/ 폴더 존재 확인 및 생성
  - settings/, templates/, projects/ 하위 폴더 생성
  - 최소 초기화 (폴더 구조만, 설정은 기본값 사용)
- ref: PRD 7.1

#### TSK-02-01-02: 파일 읽기/쓰기 유틸리티
- category: infrastructure
- status: done [xx]
- priority: critical
- assignee: -
- schedule: 2025-12-17 ~ 2025-12-18
- tags: filesystem, utils
- depends: TSK-02-01-01
- requirements:
  - JSON 파일 읽기/쓰기 함수
  - Markdown 파일 읽기/쓰기 함수
  - 파일 존재 확인 함수
  - 에러 핸들링
- ref: PRD 7

### ACT-02-02: WBS Parser
- status: todo
- schedule: 2025-12-18 ~ 2025-12-23

#### TSK-02-02-01: wbs.md 파서 구현
- category: development
- status: detail-design [dd]
- priority: critical
- assignee: -
- schedule: 2025-12-18 ~ 2025-12-20
- tags: parser, markdown, wbs
- depends: TSK-02-01-02
- requirements:
  - Markdown → WbsNode[] 트리 변환
  - WP/ACT/TSK 계층 파싱 (## / ### / ####)
  - 속성 파싱 (category, status, priority, assignee 등)
  - 4단계/3단계 구조 모두 지원
- ref: PRD 7.2, 7.3

#### TSK-02-02-02: wbs.md 시리얼라이저 구현
- category: development
- status: detail-design [dd]
- priority: critical
- assignee: -
- schedule: 2025-12-20 ~ 2025-12-22
- tags: serializer, markdown, wbs
- depends: TSK-02-02-01
- requirements:
  - WbsNode[] → Markdown 문자열 변환
  - 속성 포맷팅 (- key: value)
  - 계층별 올바른 마크다운 헤딩 생성
- ref: PRD 7.2, 7.3

#### TSK-02-02-03: WBS 데이터 유효성 검증
- category: development
- status: detail-design [dd]
- priority: high
- assignee: -
- schedule: 2025-12-22 ~ 2025-12-23
- tags: validation, wbs
- depends: TSK-02-02-01
- requirements:
  - ID 형식 검증 (WP-XX, ACT-XX-XX, TSK-XX-XX-XX)
  - 필수 속성 검증 (category, status, priority)
  - 상태 기호 유효성 검증
  - 중복 ID 검사
- ref: PRD 7.3, 7.4

### ACT-02-03: Settings Service
- status: todo
- schedule: 2025-12-23 ~ 2025-12-27

#### TSK-02-03-01: 기본 설정 JSON 스키마 정의
- category: infrastructure
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-23 ~ 2025-12-24
- tags: schema, settings
- depends: TSK-02-01-02
- requirements:
  - columns.json 스키마 (칸반 컬럼)
  - categories.json 스키마 (카테고리)
  - workflows.json 스키마 (워크플로우 규칙)
  - actions.json 스키마 (상태 내 액션)
- ref: PRD 7.1

#### TSK-02-03-02: 설정 서비스 구현
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-24 ~ 2025-12-26
- tags: service, settings
- depends: TSK-02-03-01
- requirements:
  - 설정 파일 로드 (없으면 기본값 사용)
  - 설정 캐싱
  - 설정 조회 API
- ref: PRD 8.1

#### TSK-02-03-03: 프로젝트 메타데이터 서비스
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2025-12-26 ~ 2025-12-27
- tags: service, project
- depends: TSK-02-03-02
- requirements:
  - project.json 읽기/쓰기
  - team.json 읽기/쓰기
  - 프로젝트 목록 조회
- ref: PRD 7.1

---

## WP-03: Backend API
- status: planned
- priority: high
- schedule: 2025-12-23 ~ 2026-01-03
- progress: 0%

### ACT-03-01: Project API
- status: todo
- schedule: 2025-12-23 ~ 2025-12-27

#### TSK-03-01-01: GET /api/projects - 프로젝트 목록
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-23 ~ 2025-12-24
- tags: api, project
- depends: TSK-02-03-03
- requirements:
  - .jjiban/projects/ 하위 프로젝트 목록 조회
  - 프로젝트별 기본 정보 반환 (id, name, status)
- ref: PRD 8.1

#### TSK-03-01-02: GET /api/projects/:id - 프로젝트 상세
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-24 ~ 2025-12-25
- tags: api, project
- depends: TSK-03-01-01
- requirements:
  - project.json 기반 상세 정보 반환
  - team.json 포함
- ref: PRD 8.1

#### TSK-03-01-03: POST /api/projects - 프로젝트 생성
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2025-12-25 ~ 2025-12-27
- tags: api, project
- depends: TSK-03-01-02
- requirements:
  - 프로젝트 폴더 생성
  - project.json, team.json 초기화
  - 빈 wbs.md 생성
- ref: PRD 8.1

### ACT-03-02: WBS API
- status: todo
- schedule: 2025-12-27 ~ 2025-12-31

#### TSK-03-02-01: GET /api/projects/:id/wbs - WBS 트리 조회
- category: development
- status: [ ]
- priority: critical
- assignee: -
- schedule: 2025-12-27 ~ 2025-12-28
- tags: api, wbs
- depends: TSK-02-02-01, TSK-03-01-02
- requirements:
  - wbs.md 파싱 후 WbsNode[] 반환
  - 계층 구조 유지
  - 진행률 계산 포함
- ref: PRD 8.1, 8.2

#### TSK-03-02-02: PUT /api/projects/:id/wbs - WBS 저장
- category: development
- status: [ ]
- priority: critical
- assignee: -
- schedule: 2025-12-28 ~ 2025-12-30
- tags: api, wbs
- depends: TSK-02-02-02, TSK-03-02-01
- requirements:
  - WbsNode[] → wbs.md 저장
  - 유효성 검증 후 저장
  - 저장 실패 시 롤백
- ref: PRD 8.1

#### TSK-03-02-03: GET/PUT /api/tasks/:id - Task 조회/수정
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-30 ~ 2025-12-31
- tags: api, task
- depends: TSK-03-02-02
- requirements:
  - 개별 Task 조회 (TaskDetail 반환)
  - Task 속성 수정 (wbs.md 업데이트)
  - 이력 기록 추가
- ref: PRD 8.1, 8.2

### ACT-03-03: Workflow API
- status: todo
- schedule: 2025-12-31 ~ 2026-01-03

#### TSK-03-03-01: POST /api/tasks/:id/transition - 상태 전이
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-31 ~ 2026-01-02
- tags: api, workflow
- depends: TSK-03-02-03, TSK-02-03-02
- requirements:
  - 워크플로우 규칙 기반 상태 전이
  - 현재 상태에서 가능한 전이만 허용
  - 상태 변경 후 wbs.md 저장
  - 이력 기록
- ref: PRD 5.3, 8.1

#### TSK-03-03-02: GET /api/tasks/:id/documents - 문서 목록
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-02 ~ 2026-01-03
- tags: api, document
- depends: TSK-03-02-03
- requirements:
  - Task 문서 폴더 내 파일 목록
  - 파일 존재 여부 표시
  - 예상 문서 목록 (워크플로우 기반)
- ref: PRD 8.1

#### TSK-03-03-03: GET /api/settings/:type - 설정 조회
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-02 ~ 2026-01-03
- tags: api, settings
- depends: TSK-02-03-02
- requirements:
  - columns, categories, workflows, actions 설정 조회
  - 기본값 반환 (파일 없는 경우)
- ref: PRD 8.1

---

## WP-04: WBS Tree View (Frontend)
- status: planned
- priority: high
- schedule: 2025-12-30 ~ 2026-01-10
- progress: 0%

### ACT-04-01: Tree Panel
- status: todo
- schedule: 2025-12-30 ~ 2026-01-03

#### TSK-04-01-01: WbsTreePanel 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-30 ~ 2025-12-31
- tags: component, tree
- depends: TSK-01-02-01, TSK-03-02-01
- requirements:
  - 트리 패널 컨테이너
  - WBS 데이터 로드 (useFetch)
  - 트리 상태 관리 (펼침/접힘)
- ref: PRD 6.2

#### TSK-04-01-02: WbsTreeHeader 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2025-12-31 ~ 2026-01-01
- tags: component, header
- depends: TSK-04-01-01
- requirements:
  - 검색 박스
  - 모두 펼치기/접기 버튼
  - 요약 카드 (WP/ACT/TSK 수, 진행률)
- ref: PRD 6.2.1

#### TSK-04-01-03: WbsSummaryCards 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-01 ~ 2026-01-02
- tags: component, summary
- depends: TSK-04-01-01
- requirements:
  - WP/ACT/TSK 카운트 카드
  - 전체 진행률 카드
  - PrimeVue Card 사용
- ref: PRD 6.2.1

#### TSK-04-01-04: WbsSearchBox 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-02 ~ 2026-01-03
- tags: component, search
- depends: TSK-04-01-01
- requirements:
  - Task ID 또는 제목으로 필터링
  - 실시간 검색 (debounce)
  - 검색 결과 하이라이트
- ref: PRD 6.2.1

### ACT-04-02: Tree Node
- status: todo
- schedule: 2026-01-03 ~ 2026-01-07

#### TSK-04-02-01: WbsTreeNode 컴포넌트 (재귀)
- category: development
- status: [ ]
- priority: critical
- assignee: -
- schedule: 2026-01-03 ~ 2026-01-05
- tags: component, tree, recursive
- depends: TSK-04-01-01
- requirements:
  - 재귀적 트리 노드 렌더링
  - 펼침/접힘 토글
  - 노드 선택 시 상세 패널 연동
  - 들여쓰기 및 연결선
- ref: PRD 6.2.2

#### TSK-04-02-02: NodeIcon 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-05 ~ 2026-01-06
- tags: component, icon
- depends: TSK-04-02-01
- requirements:
  - 계층별 아이콘 (P/WP/A/T)
  - 계층별 색상 (보라/파랑/초록/주황)
  - 라운드 사각형 배지
- ref: PRD 6.2.2, 10.1

#### TSK-04-02-03: StatusBadge + CategoryTag 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-06 ~ 2026-01-07
- tags: component, badge, tag
- depends: TSK-04-02-01
- requirements:
  - 상태 배지 ([bd], [dd], [im] 등)
  - 카테고리 태그 (dev, infra, defect)
  - 색상 코드 적용
- ref: PRD 6.2.2

#### TSK-04-02-04: ProgressBar 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-06 ~ 2026-01-07
- tags: component, progress
- depends: TSK-04-02-01
- requirements:
  - 퍼센트 진행률 바
  - 배경색 + 채우기 색상
  - 텍스트 표시 (%)
- ref: PRD 6.2.2

### ACT-04-03: Tree Interaction
- status: todo
- schedule: 2026-01-07 ~ 2026-01-10

#### TSK-04-03-01: 트리 펼침/접힘 상태 관리
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-07 ~ 2026-01-08
- tags: state, tree
- depends: TSK-04-02-01
- requirements:
  - 개별 노드 펼침/접힘 토글
  - 전체 펼치기/접기
  - 상태 로컬 스토리지 저장
- ref: PRD 6.2.3

#### TSK-04-03-02: 노드 선택 및 상세 패널 연동
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-08 ~ 2026-01-09
- tags: selection, interaction
- depends: TSK-04-02-01, TSK-01-01-03
- requirements:
  - 클릭으로 노드 선택
  - 선택 상태 시각적 표시
  - Pinia selection 스토어 연동
- ref: PRD 6.2.3

#### TSK-04-03-03: 키보드 네비게이션
- category: development
- status: [ ]
- priority: low
- assignee: -
- schedule: 2026-01-09 ~ 2026-01-10
- tags: accessibility, keyboard
- depends: TSK-04-03-02
- requirements:
  - 화살표 키 탐색 (상/하/좌/우)
  - Enter 키 선택
  - Space 키 펼침/접힘
- ref: PRD 11.2

---

## WP-05: Task Detail Panel (Frontend)
- status: planned
- priority: high
- schedule: 2026-01-06 ~ 2026-01-15
- progress: 0%

### ACT-05-01: Detail Panel Structure
- status: todo
- schedule: 2026-01-06 ~ 2026-01-09

#### TSK-05-01-01: TaskDetailPanel 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-06 ~ 2026-01-07
- tags: component, detail
- depends: TSK-04-03-02
- requirements:
  - 상세 패널 컨테이너
  - 선택된 노드 정보 표시
  - 스크롤 가능한 콘텐츠 영역
- ref: PRD 6.3

#### TSK-05-01-02: TaskBasicInfo 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-07 ~ 2026-01-08
- tags: component, info
- depends: TSK-05-01-01
- requirements:
  - Task ID, 제목 표시
  - 카테고리, 우선순위 표시
  - 담당자 아바타 + 이름
  - 상위 WP 표시
  - 인라인 편집 지원
- ref: PRD 6.3.1

#### TSK-05-01-03: TaskProgress 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-08 ~ 2026-01-09
- tags: component, progress
- depends: TSK-05-01-01
- requirements:
  - 현재 상태 표시 (상태명 + 설명)
  - 워크플로우 시각화 다이어그램
  - 현재 위치 하이라이트
- ref: PRD 6.3.2

### ACT-05-02: Detail Sections
- status: todo
- schedule: 2026-01-09 ~ 2026-01-13

#### TSK-05-02-01: TaskWorkflow 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-09 ~ 2026-01-10
- tags: component, workflow
- depends: TSK-05-01-03
- requirements:
  - 카테고리별 워크플로우 흐름 표시
  - 상태 노드 + 화살표
  - 현재 상태 강조
  - 완료된 상태 체크 표시
- ref: PRD 6.3.2

#### TSK-05-02-02: TaskRequirements 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-10 ~ 2026-01-11
- tags: component, requirements
- depends: TSK-05-01-01
- requirements:
  - 요구사항 목록 표시 (마크다운)
  - PRD 참조 링크
  - 인라인 편집 지원
- ref: PRD 6.3.3

#### TSK-05-02-03: TaskDocuments 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-11 ~ 2026-01-12
- tags: component, document
- depends: TSK-03-03-02
- requirements:
  - 관련 문서 목록 표시
  - 존재하는 문서 vs 예정 문서 구분
  - 문서 클릭 시 뷰어 연동
- ref: PRD 6.3.4

#### TSK-05-02-04: TaskHistory 컴포넌트
- category: development
- status: [ ]
- priority: low
- assignee: -
- schedule: 2026-01-12 ~ 2026-01-13
- tags: component, history
- depends: TSK-05-01-01
- requirements:
  - 상태 변경 이력 표시
  - 타임라인 형식
  - 날짜/시간 + 변경 내용
- ref: PRD 6.3.6

### ACT-05-03: Detail Actions
- status: todo
- schedule: 2026-01-13 ~ 2026-01-15

#### TSK-05-03-01: TaskActions 컴포넌트
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-13 ~ 2026-01-14
- tags: component, action
- depends: TSK-05-01-01, TSK-03-03-01
- requirements:
  - 편집 버튼 (인라인 편집 모드 토글)
  - 문서 열기 버튼
  - 상태 전이 버튼 (현재 상태에서 가능한 다음 상태)
- ref: PRD 6.3.5

#### TSK-05-03-02: 인라인 편집 기능 구현
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-14 ~ 2026-01-15
- tags: edit, inline
- depends: TSK-05-03-01, TSK-03-02-03
- requirements:
  - 필드별 인라인 편집
  - 저장/취소 버튼
  - API 연동 (PUT /api/tasks/:id)
  - 낙관적 업데이트
- ref: PRD 6.3.5

---

## WP-06: Document Viewer
- status: planned
- priority: medium
- schedule: 2026-01-13 ~ 2026-01-17
- progress: 0%

### ACT-06-01: Markdown Viewer
- status: todo
- schedule: 2026-01-13 ~ 2026-01-17

#### TSK-06-01-01: Markdown 렌더러 설정
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-13 ~ 2026-01-14
- tags: markdown, viewer
- depends: TSK-01-01-02
- requirements:
  - marked 또는 markdown-it 라이브러리 설치
  - GitHub Flavored Markdown 지원
  - 코드 하이라이팅 (highlight.js)
- ref: PRD (문서 뷰어)

#### TSK-06-01-02: DocumentViewer 컴포넌트
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-14 ~ 2026-01-16
- tags: component, viewer
- depends: TSK-06-01-01
- requirements:
  - Markdown 파일 로드 및 렌더링
  - 스크롤 가능한 뷰어
  - 파일 경로 props
- ref: PRD (문서 뷰어)

#### TSK-06-01-03: 문서 API 연동
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-16 ~ 2026-01-17
- tags: api, document
- depends: TSK-06-01-02, TSK-03-03-02
- requirements:
  - GET /api/tasks/:id/documents/:filename
  - 문서 내용 조회 API
  - 에러 핸들링 (파일 없음)
- ref: PRD 8.1

---

## WP-07: Workflow Engine
- status: planned
- priority: high
- schedule: 2026-01-15 ~ 2026-01-20
- progress: 0%

### ACT-07-01: Workflow Rules Engine
- status: todo
- schedule: 2026-01-15 ~ 2026-01-20

#### TSK-07-01-01: 워크플로우 규칙 정의
- category: infrastructure
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-15 ~ 2026-01-16
- tags: workflow, rules
- depends: TSK-02-03-01
- requirements:
  - development 워크플로우 규칙 정의
  - defect 워크플로우 규칙 정의
  - infrastructure 워크플로우 규칙 정의
  - workflows.json 기본값 작성
- ref: PRD 5.2, 5.3

#### TSK-07-01-02: WorkflowEngine 서비스 구현
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-16 ~ 2026-01-18
- tags: service, workflow
- depends: TSK-07-01-01
- requirements:
  - getAvailableCommands(category, status) 구현
  - executeCommand(taskId, command) 구현
  - 규칙 기반 상태 전이 검증
- ref: PRD 5.3

#### TSK-07-01-03: 상태 전이 이력 관리
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-18 ~ 2026-01-19
- tags: history, workflow
- depends: TSK-07-01-02
- requirements:
  - 상태 변경 시 이력 기록
  - 이력 저장 구조 (wbs.md 또는 별도 파일)
  - 이력 조회 기능
- ref: PRD 6.3.6

#### TSK-07-01-04: 상태 액션 (반복 가능) 구현
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-19 ~ 2026-01-20
- tags: action, workflow
- depends: TSK-07-01-02
- requirements:
  - ui, review, apply, test, audit, patch 액션
  - 상태 변경 없이 실행
  - actions.json 기반 규칙
- ref: PRD 5.3

---

## WP-08: Integration & Testing
- status: planned
- priority: medium
- schedule: 2026-01-17 ~ 2026-01-22
- progress: 0%

### ACT-08-01: Integration
- status: todo
- schedule: 2026-01-17 ~ 2026-01-20

#### TSK-08-01-01: WBS 페이지 통합
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-17 ~ 2026-01-18
- tags: page, integration
- depends: TSK-04-03-02, TSK-05-03-02
- requirements:
  - pages/wbs.vue 구현
  - WbsTreePanel + TaskDetailPanel 통합
  - 데이터 로드 및 에러 핸들링
- ref: PRD 9.1

#### TSK-08-01-02: 상태 관리 통합 (Pinia)
- category: development
- status: [ ]
- priority: high
- assignee: -
- schedule: 2026-01-18 ~ 2026-01-19
- tags: pinia, state
- depends: TSK-08-01-01
- requirements:
  - project 스토어 연동
  - wbs 스토어 연동
  - selection 스토어 연동
  - 스토어 간 동기화
- ref: PRD 9.3

#### TSK-08-01-03: 에러 핸들링 및 로딩 상태
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-19 ~ 2026-01-20
- tags: error, loading
- depends: TSK-08-01-02
- requirements:
  - API 에러 처리
  - 로딩 스피너
  - 빈 상태 표시
  - 토스트 알림
- ref: PRD 11

### ACT-08-02: Testing
- status: todo
- schedule: 2026-01-20 ~ 2026-01-22

#### TSK-08-02-01: 단위 테스트 작성
- category: development
- status: [ ]
- priority: medium
- assignee: -
- schedule: 2026-01-20 ~ 2026-01-21
- tags: test, unit
- depends: TSK-08-01-02
- requirements:
  - WBS 파서 테스트
  - 워크플로우 엔진 테스트
  - 유틸리티 함수 테스트
- ref: PRD 11

#### TSK-08-02-02: E2E 테스트 작성
- category: development
- status: [ ]
- priority: low
- assignee: -
- schedule: 2026-01-21 ~ 2026-01-22
- tags: test, e2e
- depends: TSK-08-02-01
- requirements:
  - WBS 트리 렌더링 테스트
  - 노드 선택 및 상세 표시 테스트
  - 상태 전이 테스트
- ref: PRD 11

---

## Summary

| WP | 명칭 | Task 수 | 예상 기간 |
|----|------|---------|----------|
| WP-01 | Platform Infrastructure | 6 | 12/13 ~ 12/20 |
| WP-02 | Data Storage Layer | 9 | 12/16 ~ 12/27 |
| WP-03 | Backend API | 9 | 12/23 ~ 01/03 |
| WP-04 | WBS Tree View | 11 | 12/30 ~ 01/10 |
| WP-05 | Task Detail Panel | 9 | 01/06 ~ 01/15 |
| WP-06 | Document Viewer | 3 | 01/13 ~ 01/17 |
| WP-07 | Workflow Engine | 4 | 01/15 ~ 01/20 |
| WP-08 | Integration & Testing | 5 | 01/17 ~ 01/22 |
| **Total** | | **56** | **~6주** |
