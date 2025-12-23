# 테스트 명세서

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-03 |
| Task명 | 프로젝트 메타데이터 서비스 |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-14 |
| 작성자 | Claude |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | ProjectService, TeamService, ProjectsListService, Validators | 80% 이상 |
| E2E 테스트 | 프로젝트 CRUD, 팀원 관리 API 플로우 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | API 응답 검증, 에러 케이스 | 전체 API |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright / supertest |
| 테스트 데이터 폴더 | `.jjiban-test/` (테스트용 임시 폴더) |
| 베이스 URL | `http://localhost:3000` |
| 테스트 격리 | 각 테스트 전후 테스트 폴더 초기화 |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | ProjectsListService.getList | 프로젝트 목록 정상 조회 | 프로젝트 배열 반환 | FR-001 |
| UT-002 | ProjectService.getProject | 프로젝트 상세 정상 조회 | ProjectDetail 반환 | FR-002 |
| UT-003 | ProjectService.createProject | 정상 생성 (유효한 ID) | ProjectConfig 반환 | FR-003, BR-001 |
| UT-004 | ProjectService.createProject | 중복 ID 생성 시도 | DuplicateProjectIdError | FR-003 |
| UT-005 | ProjectService.updateProject | 정상 수정 | 수정된 ProjectConfig | FR-004, BR-002 |
| UT-006 | ProjectService.updateProject | ID 변경 시도 | IdImmutableError | BR-002 |
| UT-007 | TeamService.getTeam | 팀원 목록 정상 조회 | TeamMember[] 반환 | FR-005 |
| UT-008 | TeamService.updateTeam | 중복 팀원 ID | DuplicateMemberIdError | FR-005, BR-003 |
| UT-009 | ProjectsListService.setDefault | 유효하지 않은 defaultProject | InvalidProjectError | BR-005 |
| UT-010 | ProjectService.getProject | 존재하지 않는 프로젝트 | ProjectNotFoundError | FR-002 |

### 2.2 테스트 케이스 상세

#### UT-001: ProjectsListService.getList 정상 조회

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectsListService.spec.ts` |
| **테스트 블록** | `describe('ProjectsListService') → describe('getList') → it('should return project list')` |
| **Mock 의존성** | FileSystemService (projects.json 읽기) |
| **입력 데이터** | - |
| **검증 포인트** | projects 배열 반환, defaultProject 포함, total 카운트 정확 |
| **커버리지 대상** | `getList()` 메서드 |
| **관련 요구사항** | FR-001 |

#### UT-002: ProjectService.getProject 정상 조회

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('getProject') → it('should return project with team')` |
| **Mock 의존성** | FileSystemService (project.json, team.json 읽기) |
| **입력 데이터** | `projectId: 'test-project'` |
| **검증 포인트** | project 객체와 team 배열 모두 포함된 응답 |
| **커버리지 대상** | `getProject()` 메서드 |
| **관련 요구사항** | FR-002 |

#### UT-003: ProjectService.createProject 정상 생성

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('createProject') → it('should create project with valid ID')` |
| **Mock 의존성** | FileSystemService, ProjectsListService |
| **입력 데이터** | `{ id: 'new-project', name: '새 프로젝트' }` |
| **검증 포인트** | 폴더 생성 호출, project.json 작성, team.json 작성, 목록 업데이트 |
| **커버리지 대상** | `createProject()` 메서드 정상 분기 |
| **관련 요구사항** | FR-003, BR-001, BR-004 |

#### UT-004: ProjectService.createProject 중복 ID

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('createProject') → it('should throw on duplicate ID')` |
| **Mock 의존성** | ProjectsListService (기존 프로젝트 존재) |
| **입력 데이터** | `{ id: 'existing-project', name: '중복 프로젝트' }` |
| **검증 포인트** | `DuplicateProjectIdError` 발생, 에러 코드 `DUPLICATE_PROJECT_ID` |
| **커버리지 대상** | `createProject()` 중복 검증 분기 |
| **관련 요구사항** | FR-003 |

#### UT-005: ProjectService.updateProject 정상 수정

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('updateProject') → it('should update project fields')` |
| **Mock 의존성** | FileSystemService |
| **입력 데이터** | `projectId: 'test-project', data: { name: '수정된 이름' }` |
| **검증 포인트** | name 필드 변경, updatedAt 갱신, id 불변 |
| **커버리지 대상** | `updateProject()` 메서드 |
| **관련 요구사항** | FR-004 |

#### UT-006: ProjectService.updateProject ID 변경 시도

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('updateProject') → it('should throw on ID change attempt')` |
| **Mock 의존성** | - |
| **입력 데이터** | `projectId: 'test-project', data: { id: 'new-id' }` |
| **검증 포인트** | `IdImmutableError` 발생, 에러 코드 `ID_IMMUTABLE` |
| **커버리지 대상** | `updateProject()` ID 불변 검증 분기 |
| **관련 요구사항** | BR-002 |

#### UT-007: TeamService.getTeam 정상 조회

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/teamService.spec.ts` |
| **테스트 블록** | `describe('TeamService') → describe('getTeam') → it('should return team members')` |
| **Mock 의존성** | FileSystemService (team.json 읽기) |
| **입력 데이터** | `projectId: 'test-project'` |
| **검증 포인트** | members 배열 반환, total 카운트 정확 |
| **커버리지 대상** | `getTeam()` 메서드 |
| **관련 요구사항** | FR-005 |

#### UT-008: TeamService.updateTeam 중복 팀원 ID

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/teamService.spec.ts` |
| **테스트 블록** | `describe('TeamService') → describe('updateTeam') → it('should throw on duplicate member ID')` |
| **Mock 의존성** | - |
| **입력 데이터** | `members: [{ id: 'user1' }, { id: 'user1' }]` |
| **검증 포인트** | `DuplicateMemberIdError` 발생, 에러 코드 `DUPLICATE_MEMBER_ID` |
| **커버리지 대상** | `updateTeam()` 중복 검증 분기 |
| **관련 요구사항** | BR-003 |

#### UT-009: ProjectsListService.setDefault 유효하지 않은 ID

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectsListService.spec.ts` |
| **테스트 블록** | `describe('ProjectsListService') → describe('setDefault') → it('should throw on invalid project ID')` |
| **Mock 의존성** | FileSystemService |
| **입력 데이터** | `defaultProject: 'non-existent'` |
| **검증 포인트** | `InvalidProjectError` 발생 |
| **커버리지 대상** | `setDefault()` 유효성 검증 분기 |
| **관련 요구사항** | BR-005 |

#### UT-010: ProjectService.getProject 존재하지 않는 프로젝트

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/services/__tests__/projectService.spec.ts` |
| **테스트 블록** | `describe('ProjectService') → describe('getProject') → it('should throw on non-existent project')` |
| **Mock 의존성** | FileSystemService (파일 없음 시뮬레이션) |
| **입력 데이터** | `projectId: 'non-existent'` |
| **검증 포인트** | `ProjectNotFoundError` 발생, 에러 코드 `PROJECT_NOT_FOUND` |
| **커버리지 대상** | `getProject()` 에러 처리 분기 |
| **관련 요구사항** | FR-002 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 프로젝트 목록 조회 | 테스트 프로젝트 존재 | 1. GET /api/projects 호출 | 200 + 프로젝트 배열 | FR-001 |
| E2E-002 | 프로젝트 상세 조회 | 테스트 프로젝트 존재 | 1. GET /api/projects/:id 호출 | 200 + project + team | FR-002 |
| E2E-003 | 프로젝트 생성 플로우 | 테스트 환경 | 1. POST /api/projects 호출 | 201 + 폴더/파일 생성 | FR-003, BR-001, BR-004 |
| E2E-004 | 프로젝트 수정 플로우 | 테스트 프로젝트 존재 | 1. PUT /api/projects/:id 호출 | 200 + 수정된 데이터 | FR-004, BR-002 |
| E2E-005 | 팀원 관리 플로우 | 테스트 프로젝트 존재 | 1. GET team 2. PUT team | 200 + 팀원 목록 | FR-005, BR-003 |

### 3.2 테스트 케이스 상세

#### E2E-001: 프로젝트 목록 조회

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/projects.spec.ts` |
| **테스트명** | `test('GET /api/projects returns project list')` |
| **사전조건** | 테스트용 projects.json 시드 |
| **실행 단계** | |
| 1 | `GET /api/projects` 호출 |
| **API 확인** | 200 OK |
| **검증 포인트** | |
| - | `response.projects` 배열 존재 |
| - | `response.total` 숫자 타입 |
| - | 각 프로젝트에 id, name, status 필드 존재 |
| **관련 요구사항** | FR-001 |

#### E2E-002: 프로젝트 상세 조회

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/projects.spec.ts` |
| **테스트명** | `test('GET /api/projects/:id returns project detail with team')` |
| **사전조건** | 테스트 프로젝트 'test-project' 존재 |
| **실행 단계** | |
| 1 | `GET /api/projects/test-project` 호출 |
| **API 확인** | 200 OK |
| **검증 포인트** | |
| - | `response.project` 객체 존재 |
| - | `response.team` 배열 존재 |
| - | `response.project.id === 'test-project'` |
| **관련 요구사항** | FR-002 |

#### E2E-003: 프로젝트 생성 플로우

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/projects.spec.ts` |
| **테스트명** | `test('POST /api/projects creates new project with folder structure')` |
| **사전조건** | 깨끗한 테스트 환경 |
| **실행 단계** | |
| 1 | `POST /api/projects` with `{ id: 'e2e-project', name: 'E2E 테스트' }` |
| 2 | 파일 시스템 확인: `projects/e2e-project/` 폴더 존재 |
| 3 | 파일 시스템 확인: `project.json`, `team.json` 존재 |
| **API 확인** | 201 Created |
| **검증 포인트** | |
| - | `response.project.id === 'e2e-project'` |
| - | `response.team` 빈 배열 |
| - | 폴더 구조 자동 생성 확인 |
| **관련 요구사항** | FR-003, BR-001, BR-004 |

#### E2E-004: 프로젝트 수정 플로우

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/projects.spec.ts` |
| **테스트명** | `test('PUT /api/projects/:id updates project fields')` |
| **사전조건** | 테스트 프로젝트 'test-project' 존재 |
| **실행 단계** | |
| 1 | `PUT /api/projects/test-project` with `{ name: '수정된 이름' }` |
| 2 | `GET /api/projects/test-project` 로 확인 |
| **API 확인** | 200 OK |
| **검증 포인트** | |
| - | `response.project.name === '수정된 이름'` |
| - | `response.project.id === 'test-project'` (불변) |
| - | `updatedAt` 갱신됨 |
| **관련 요구사항** | FR-004, BR-002 |

#### E2E-005: 팀원 관리 플로우

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/projects.spec.ts` |
| **테스트명** | `test('team CRUD operations work correctly')` |
| **사전조건** | 테스트 프로젝트 존재 |
| **실행 단계** | |
| 1 | `GET /api/projects/test-project/team` |
| 2 | `PUT /api/projects/test-project/team` with 새 팀원 목록 |
| 3 | `GET /api/projects/test-project/team` 로 확인 |
| **API 확인** | 200 OK |
| **검증 포인트** | |
| - | 팀원 목록 조회 정상 |
| - | 팀원 수정 후 변경 반영 |
| - | 중복 ID 입력 시 400 에러 |
| **관련 요구사항** | FR-005, BR-003 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 프로젝트 목록 API 테스트 | 서버 실행 | 1. GET /api/projects 호출 | 프로젝트 배열 반환 | High | FR-001 |
| TC-002 | 프로젝트 상세 API 테스트 | 프로젝트 존재 | 1. GET /api/projects/:id 호출 | project + team 반환 | High | FR-002 |
| TC-003 | 프로젝트 생성 API 테스트 | 서버 실행 | 1. POST /api/projects | 201 + 폴더 생성 | High | FR-003 |
| TC-004 | 프로젝트 수정 API 테스트 | 프로젝트 존재 | 1. PUT /api/projects/:id | 200 + 수정 반영 | High | FR-004 |
| TC-005 | 팀원 관리 API 테스트 | 프로젝트 존재 | 1. GET/PUT team API | 팀원 CRUD 정상 | High | FR-005 |
| TC-006 | 존재하지 않는 프로젝트 조회 | 서버 실행 | 1. GET /api/projects/invalid | 404 에러 | Medium | FR-002 |
| TC-007 | 유효하지 않은 프로젝트 ID로 생성 | 서버 실행 | 1. POST with `id: 'Invalid ID!'` | 400 에러 | Medium | BR-001 |
| TC-008 | 중복 프로젝트 ID로 생성 | 기존 프로젝트 존재 | 1. POST with 동일 ID | 409 에러 | Medium | FR-003 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 프로젝트 목록 API 테스트

**테스트 목적**: 프로젝트 목록 조회 API가 정상 동작하는지 확인

**테스트 단계**:
1. 서버 실행 (`npm run dev`)
2. API 클라이언트로 `GET http://localhost:3000/api/projects` 호출
3. 응답 확인

**예상 결과**:
- HTTP 200 OK
- `projects` 배열 반환
- `defaultProject` 필드 존재
- `total` 숫자 필드 존재

**검증 기준**:
- [ ] 응답 코드 200
- [ ] projects 배열 형식 확인
- [ ] 각 프로젝트에 id, name, status 포함

#### TC-003: 프로젝트 생성 API 테스트

**테스트 목적**: 프로젝트 생성 시 폴더/파일이 자동 생성되는지 확인

**테스트 단계**:
1. 서버 실행
2. `POST /api/projects` 호출
   - Body: `{ "id": "tc-test", "name": "TC 테스트 프로젝트" }`
3. 응답 확인
4. 파일 시스템 확인

**예상 결과**:
- HTTP 201 Created
- `.jjiban/projects/tc-test/` 폴더 생성
- `project.json`, `team.json` 파일 생성
- `projects.json`에 새 항목 추가

**검증 기준**:
- [ ] 응답 코드 201
- [ ] project 객체에 id, name, createdAt 포함
- [ ] 폴더 구조 생성 확인
- [ ] 파일 내용 확인

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-PROJECTS-CONFIG | projects.json Mock | `{ version: "1.0", projects: [...], defaultProject: "jjiban" }` |
| MOCK-PROJECT-01 | 정상 프로젝트 | `{ id: "test-project", name: "테스트", status: "active" }` |
| MOCK-PROJECT-02 | 아카이브된 프로젝트 | `{ id: "archived-project", name: "아카이브", status: "archived" }` |
| MOCK-TEAM-01 | 팀원 목록 | `{ version: "1.0", members: [{ id: "user1", name: "홍길동" }] }` |
| MOCK-MEMBER-01 | 단일 팀원 | `{ id: "user1", name: "홍길동", email: "hong@test.com", active: true }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-E2E-BASE | 기본 E2E 환경 | beforeAll hook | 프로젝트 2개, 팀원 3명 |
| SEED-E2E-EMPTY | 빈 환경 (목록 없음) | beforeAll hook | projects.json만 (빈 배열) |
| SEED-E2E-DUPLICATE | 중복 테스트용 | beforeAll hook | 'existing-project' ID 존재 |

### 5.3 테스트 프로젝트 구조

```
.jjiban-test/                          # 테스트용 임시 폴더 (gitignore)
├── settings/
│   └── projects.json                  # 테스트 프로젝트 목록
└── projects/
    ├── test-project/                  # 기본 테스트 프로젝트
    │   ├── project.json
    │   └── team.json
    └── archived-project/              # 아카이브 테스트 프로젝트
        ├── project.json
        └── team.json
```

### 5.4 Mock 데이터 상세

#### MOCK-PROJECTS-CONFIG
```
ProjectsConfig:
├── version: "1.0"
├── projects:
│   ├── { id: "test-project", name: "테스트", path: "test-project", status: "active", wbsDepth: 4, createdAt: "2025-01-01" }
│   └── { id: "archived-project", name: "아카이브", path: "archived-project", status: "archived", wbsDepth: 3, createdAt: "2024-06-01" }
└── defaultProject: "test-project"
```

#### MOCK-PROJECT-01
```
ProjectConfig:
├── id: "test-project"
├── name: "테스트 프로젝트"
├── description: "E2E 테스트용 프로젝트"
├── version: "0.1.0"
├── status: "active"
├── createdAt: "2025-01-01T00:00:00Z"
├── updatedAt: "2025-01-01T00:00:00Z"
├── scheduledStart: "2025-01-01"
└── scheduledEnd: "2025-06-30"
```

#### MOCK-TEAM-01
```
TeamConfig:
├── version: "1.0"
└── members:
    ├── { id: "hong", name: "홍길동", email: "hong@test.com", role: "Developer", active: true }
    ├── { id: "kim", name: "김철수", email: "kim@test.com", role: "Designer", active: true }
    └── { id: "lee", name: "이영희", email: "lee@test.com", role: "PM", active: false }
```

---

## 6. data-testid 목록

> 이 Task는 백엔드 API이므로 data-testid는 프론트엔드 연동 시 참조용

### 6.1 프로젝트 선택기 (연동 예정)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `project-selector` | 프로젝트 선택 드롭다운 | 프로젝트 전환 |
| `project-item-{id}` | 프로젝트 목록 항목 | 특정 프로젝트 선택 |
| `create-project-btn` | 새 프로젝트 생성 버튼 | 생성 모달 열기 |

### 6.2 프로젝트 생성 모달 (연동 예정)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `project-create-modal` | 모달 컨테이너 | 모달 표시 확인 |
| `project-id-input` | 프로젝트 ID 입력 | ID 입력 |
| `project-name-input` | 프로젝트명 입력 | 이름 입력 |
| `project-desc-input` | 설명 입력 | 설명 입력 |
| `project-save-btn` | 저장 버튼 | 생성 액션 |
| `project-cancel-btn` | 취소 버튼 | 취소 액션 |
| `project-error-message` | 에러 메시지 | 에러 표시 |

### 6.3 팀원 관리 (연동 예정)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `team-member-list` | 팀원 목록 | 팀원 표시 |
| `team-member-{id}` | 팀원 항목 | 특정 팀원 |
| `add-member-btn` | 팀원 추가 버튼 | 추가 액션 |
| `member-id-input` | 팀원 ID 입력 | ID 입력 |
| `member-name-input` | 팀원 이름 입력 | 이름 입력 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 80% | 70% |
| Branches | 75% | 65% |
| Functions | 85% | 75% |
| Statements | 80% | 70% |

### 7.2 서비스별 커버리지 목표

| 서비스 | 목표 커버리지 | 주요 테스트 케이스 |
|--------|--------------|------------------|
| ProjectService | 85% | CRUD, 에러 케이스 |
| TeamService | 80% | 조회, 수정, 중복 검증 |
| ProjectsListService | 80% | 목록 조회, 기본 프로젝트 설정 |
| Validators | 90% | 모든 유효성 규칙 |

### 7.3 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 API 엔드포인트 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비즈니스 규칙 (BR) | 100% 커버 |
| 에러 케이스 | 80% 커버 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: Claude
Created: 2025-12-14
Task: TSK-02-03-03 프로젝트 메타데이터 서비스 테스트 명세
-->
