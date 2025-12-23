# 구현 보고서: 프로젝트 디렉토리 구조 설정

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-04 |
| Category | infrastructure |
| 참조 설계서 | 010-tech-design.md |
| 구현 기간 | 2025-12-13 |
| 상태 | [im] 구현 |

---

## 1. 구현 개요

### 1.1 목적

Nuxt 3 프로젝트의 표준 디렉토리 구조를 설정하여 일관된 코드 구성 및 유지보수성을 확보합니다.

### 1.2 구현 범위

- [x] `app/components/` 하위 디렉토리 구조 생성
- [x] `app/composables/`, `app/pages/`, `app/layouts/`, `app/assets/` 디렉토리 생성
- [x] `server/api/` 하위 디렉토리 구조 생성
- [x] `server/utils/` 디렉토리 및 파일 I/O 유틸리티 생성
- [x] `stores/` Pinia 스토어 디렉토리 및 기본 스토어 파일 생성
- [x] `types/` TypeScript 타입 정의 디렉토리 및 기본 타입 파일 생성
- [x] `utils/` 클라이언트 유틸리티 디렉토리 및 기본 유틸리티 파일 생성

### 1.3 기술 스택

- Nuxt 3
- TypeScript
- Pinia (상태 관리)

---

## 2. 구현 결과

### 2.1 디렉토리 구조

```
jjiban/
├── app/
│   ├── components/
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   ├── wbs/              # WBS 관련 컴포넌트
│   │   ├── detail/           # 상세 패널 컴포넌트
│   │   └── common/           # 공통 컴포넌트
│   ├── composables/          # Vue Composables
│   ├── pages/                # 페이지 컴포넌트
│   ├── layouts/              # 레이아웃 템플릿
│   └── assets/               # 정적 에셋
├── server/
│   ├── api/
│   │   ├── projects/         # 프로젝트 API
│   │   ├── tasks/            # Task API
│   │   └── settings/         # 설정 API
│   └── utils/                # 서버 유틸리티
├── stores/                   # Pinia 스토어
├── types/                    # TypeScript 타입 정의
├── utils/                    # 클라이언트 유틸리티
└── ...
```

### 2.2 생성된 파일 목록

#### types/index.ts
- `WbsNodeType`, `TaskCategory`, `TaskStatus`, `Priority` 타입 정의
- `WbsNode`, `TaskDetail`, `TeamMember`, `DocumentInfo` 등 인터페이스 정의
- `Project`, `Column`, `CategoryConfig`, `WorkflowRule` 인터페이스 정의
- `ApiResponse`, `PaginationInfo`, `PaginatedResponse` API 응답 타입

#### stores/
| 파일 | 설명 |
|------|------|
| `project.ts` | 프로젝트 상태 관리 (current, projects, loading, error) |
| `wbs.ts` | WBS 트리 상태 관리 (root, expandedNodes, searchQuery) |
| `selection.ts` | 선택 상태 관리 (selectedNode, selectedTaskDetail) |
| `settings.ts` | 설정 상태 관리 (columns, categories, workflows) |
| `index.ts` | 스토어 통합 export |

#### utils/format.ts
- `formatDate()`: 날짜 포맷팅 (YYYY-MM-DD)
- `formatDateTime()`: 날짜/시간 포맷팅
- `formatRelativeTime()`: 상대 시간 표시
- `parseTaskId()`: Task ID 파싱 (3단계/4단계 구조)
- `getStatusName()`: 상태 코드 → 상태명 변환
- `getKanbanColumn()`: 상태 코드 → 칸반 컬럼 변환
- `getPriorityLabel()`, `getCategoryLabel()`: 레이블 변환

#### server/utils/file.ts
- `readJsonFile()`, `writeJsonFile()`: JSON 파일 I/O
- `readMarkdownFile()`, `writeMarkdownFile()`: Markdown 파일 I/O
- `fileExists()`, `dirExists()`: 존재 확인
- `ensureDir()`: 디렉토리 생성 (재귀)
- `listFiles()`, `listDirs()`: 디렉토리 내용 조회
- `getProjectPath()`, `getWbsPath()`, `getTaskFolderPath()` 등 경로 헬퍼

---

## 3. 기술적 결정사항

### 3.1 디렉토리 구조 결정

| 결정 | 이유 |
|------|------|
| `app/` 하위에 컴포넌트 배치 | Nuxt 3 app 디렉토리 구조 준수 |
| 컴포넌트 도메인별 분리 | PRD 9.2 컴포넌트 구조에 따른 구성 |
| `stores/` 루트에 배치 | Pinia의 권장 구조, 전역 접근 용이 |
| `types/` 루트에 배치 | 서버/클라이언트 공통 타입 공유 |
| `server/utils/` 분리 | 서버 전용 유틸리티 격리, Node.js API 사용 |

### 3.2 Pinia 스토어 설계

- **project**: 현재 프로젝트 및 프로젝트 목록 관리
- **wbs**: WBS 트리 데이터 및 확장/축소 상태 관리
- **selection**: 선택된 노드 및 Task 상세 정보 관리
- **settings**: 전역 설정 (칼럼, 카테고리, 워크플로우) 관리

---

## 4. 구현 완료 체크리스트

### 4.1 디렉토리 구조
- [x] `app/components/layout/`
- [x] `app/components/wbs/`
- [x] `app/components/detail/`
- [x] `app/components/common/`
- [x] `app/composables/`
- [x] `app/pages/`
- [x] `app/layouts/`
- [x] `app/assets/`
- [x] `server/api/projects/`
- [x] `server/api/tasks/`
- [x] `server/api/settings/`
- [x] `server/utils/`
- [x] `stores/`
- [x] `types/`
- [x] `utils/`

### 4.2 타입 정의
- [x] WBS 관련 타입 (WbsNode, WbsNodeType)
- [x] Task 관련 타입 (TaskDetail, TaskCategory, TaskStatus)
- [x] 프로젝트 관련 타입 (Project, TeamMember)
- [x] 설정 관련 타입 (Column, CategoryConfig, WorkflowRule)
- [x] API 응답 타입 (ApiResponse, PaginatedResponse)

### 4.3 Pinia 스토어
- [x] project 스토어 (loadProjects, selectProject)
- [x] wbs 스토어 (loadWbs, toggleExpand, expandAll/collapseAll)
- [x] selection 스토어 (selectNode, loadTaskDetail)
- [x] settings 스토어 (loadSettings, getAvailableTransitions)

### 4.4 유틸리티
- [x] format.ts (날짜, 상태, 레이블 포맷팅)
- [x] server/utils/file.ts (파일 I/O, 경로 헬퍼)

---

## 5. 알려진 이슈

없음

---

## 6. 다음 단계

- `/wf:done TSK-01-01-04`: 작업 완료 처리
- 또는 `/wf:audit TSK-01-01-04`: 코드 리뷰 실행 (선택)

---

## 7. 참고 자료

### 7.1 관련 문서
- 기술 설계: `010-tech-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 9)

### 7.2 생성된 파일 위치
| 분류 | 경로 |
|------|------|
| 타입 정의 | `types/index.ts` |
| Pinia 스토어 | `stores/project.ts`, `stores/wbs.ts`, `stores/selection.ts`, `stores/settings.ts` |
| 클라이언트 유틸 | `utils/format.ts` |
| 서버 유틸 | `server/utils/file.ts` |
