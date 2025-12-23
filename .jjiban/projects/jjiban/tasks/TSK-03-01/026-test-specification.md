# 테스트 명세: Project API

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **목적**: 단위 테스트, E2E 테스트 시나리오 및 테스트 데이터 정의
> **관련 문서**: `020-detail-design.md`, `025-traceability-matrix.md`

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-01 |
| Task명 | Project API |
| 상위 문서 | 020-detail-design.md |
| 추적성 매트릭스 | 025-traceability-matrix.md |
| 작성일 | 2025-12-14 |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 도구 |
|------------|------|------|
| 단위 테스트 | ProjectService 메서드 | Vitest |
| E2E 테스트 | API 엔드포인트 | Playwright |

### 1.2 테스트 환경

| 환경 | 설명 |
|------|------|
| 테스트 데이터 경로 | `.jjiban-test/` (실제 데이터와 분리) |
| 테스트 프로젝트명 | `project` (CLAUDE.md 규정) |
| 정리 전략 | 각 테스트 전후 테스트 폴더 초기화 |

### 1.3 목표 커버리지

| 항목 | 목표 |
|------|------|
| 단위 테스트 커버리지 | 80% 이상 |
| E2E 테스트 시나리오 커버리지 | 100% |
| 비즈니스 규칙 커버리지 | 100% |

---

## 2. 단위 테스트 시나리오

### 2.1 ProjectService.getProjects()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-001-01 | 프로젝트 목록 조회 (정상) | projects.json 존재 | 프로젝트 배열 반환 | FR-001 |
| UT-001-02 | 프로젝트 목록 조회 (파일 없음) | projects.json 없음 | 빈 배열 반환 | FR-001 |
| UT-001-03 | 프로젝트 목록 조회 (빈 목록) | projects: [] | 빈 배열 반환 | FR-001 |

### 2.2 ProjectService.getProjectById()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-002-01 | 프로젝트 상세 조회 (정상) | 존재하는 ID | project + team 병합 객체 | FR-002 |
| UT-002-02 | 프로젝트 상세 조회 (폴더 없음) | 존재하지 않는 ID | ProjectNotFoundError 발생 | FR-002 |
| UT-002-03 | 프로젝트 상세 조회 (team.json 없음) | team.json 없는 프로젝트 | 빈 팀 정보로 반환 | FR-002 |

### 2.3 ProjectService.createProject()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-003-01 | 프로젝트 생성 (정상) | 유효한 데이터 | 프로젝트 생성, 파일 생성 확인 | FR-003 |
| UT-003-02 | 프로젝트 생성 (기본 wbsDepth) | wbsDepth 미지정 | wbsDepth=4로 생성 | FR-003 |
| UT-003-03 | 프로젝트 생성 (3단계 구조) | wbsDepth=3 | wbsDepth=3으로 생성 | FR-003 |

### 2.4 ProjectService.validateProjectId()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-004-01 | ID 검증 (정상 - 소문자) | "my-project" | true | BR-001 |
| UT-004-02 | ID 검증 (정상 - 숫자 포함) | "project-123" | true | BR-001 |
| UT-004-03 | ID 검증 (실패 - 대문자) | "MyProject" | InvalidProjectIdError | BR-001 |
| UT-004-04 | ID 검증 (실패 - 공백) | "my project" | InvalidProjectIdError | BR-001 |
| UT-004-05 | ID 검증 (실패 - 특수문자) | "my_project" | InvalidProjectIdError | BR-001 |
| UT-004-06 | ID 검증 (실패 - 빈 문자열) | "" | InvalidProjectIdError | BR-001 |

### 2.5 ProjectService.checkDuplicateId()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-005-01 | 중복 확인 (고유 ID) | 존재하지 않는 ID | false (중복 없음) | BR-002 |
| UT-005-02 | 중복 확인 (중복 ID) | 이미 존재하는 ID | DuplicateProjectIdError | BR-002 |

### 2.6 ProjectService.validateWbsDepth()

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-006-01 | WBS 깊이 검증 (3) | 3 | true | BR-003 |
| UT-006-02 | WBS 깊이 검증 (4) | 4 | true | BR-003 |
| UT-006-03 | WBS 깊이 검증 (2) | 2 | InvalidWbsDepthError | BR-003 |
| UT-006-04 | WBS 깊이 검증 (5) | 5 | InvalidWbsDepthError | BR-003 |
| UT-006-05 | WBS 깊이 검증 (문자열) | "4" | InvalidWbsDepthError | BR-003 |

### 2.7 초기 상태 값 검증

| 테스트 ID | 시나리오 | 입력 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| UT-007-01 | 생성 시 기본 상태 | 프로젝트 생성 | status = "active" | BR-004 |
| UT-007-02 | 생성 시 기본 버전 | 프로젝트 생성 | version = "0.1.0" | - |

---

## 3. E2E 테스트 시나리오

### 3.1 GET /api/projects

| 테스트 ID | 시나리오 | 사전 조건 | 액션 | 예상 결과 | 요구사항 |
|----------|---------|----------|------|----------|----------|
| E2E-001-01 | 프로젝트 목록 조회 (정상) | 프로젝트 2개 존재 | GET /api/projects | 200, 프로젝트 2개 반환 | FR-001 |
| E2E-001-02 | 프로젝트 목록 조회 (빈 목록) | 프로젝트 없음 | GET /api/projects | 200, 빈 배열 반환 | FR-001 |

### 3.2 GET /api/projects/:id

| 테스트 ID | 시나리오 | 사전 조건 | 액션 | 예상 결과 | 요구사항 |
|----------|---------|----------|------|----------|----------|
| E2E-002-01 | 프로젝트 상세 조회 (정상) | project 존재 | GET /api/projects/project | 200, 프로젝트 상세 + 팀 | FR-002 |
| E2E-002-02 | 프로젝트 상세 조회 (404) | 프로젝트 없음 | GET /api/projects/unknown | 404, PROJECT_NOT_FOUND | FR-002 |

### 3.3 POST /api/projects

| 테스트 ID | 시나리오 | 사전 조건 | 요청 Body | 예상 결과 | 요구사항 |
|----------|---------|----------|----------|----------|----------|
| E2E-003-01 | 프로젝트 생성 (정상) | - | {id:"new-project", name:"New"} | 201, 프로젝트 생성됨 | FR-003 |
| E2E-003-02 | 프로젝트 생성 (전체 필드) | - | {id, name, description, wbsDepth} | 201, 모든 필드 반영 | FR-003 |
| E2E-003-03 | 파일 생성 확인 | E2E-003-01 후 | 파일 시스템 확인 | project.json, team.json, wbs.md 존재 | FR-003 |

### 3.4 에러 케이스

| 테스트 ID | 시나리오 | 요청 | 예상 결과 | 요구사항 |
|----------|---------|------|----------|----------|
| E2E-004-01 | 잘못된 ID 형식 (대문자) | {id:"MyProject"} | 400, INVALID_PROJECT_ID | BR-001 |
| E2E-004-02 | 잘못된 ID 형식 (특수문자) | {id:"my_project"} | 400, INVALID_PROJECT_ID | BR-001 |
| E2E-005-01 | 중복 ID | 기존 프로젝트와 동일 ID | 409, DUPLICATE_PROJECT_ID | BR-002 |
| E2E-006-01 | 잘못된 wbsDepth | {wbsDepth: 5} | 400, INVALID_WBS_DEPTH | BR-003 |
| E2E-007-01 | 필수 필드 누락 (id) | {name:"Test"} | 400, VALIDATION_ERROR | - |
| E2E-007-02 | 필수 필드 누락 (name) | {id:"test"} | 400, VALIDATION_ERROR | - |

---

## 4. 테스트 데이터 (Fixture)

### 4.1 Mock 프로젝트 목록 (projects.json)

```
파일: .jjiban-test/settings/projects.json

내용 (개념):
{
  version: "1.0",
  projects: [
    { id: "project", name: "Test Project", status: "active", wbsDepth: 4 },
    { id: "project-2", name: "Another Project", status: "archived", wbsDepth: 3 }
  ],
  defaultProject: "project"
}
```

### 4.2 Mock 프로젝트 메타데이터 (project.json)

```
파일: .jjiban-test/projects/project/project.json

내용 (개념):
{
  id: "project",
  name: "Test Project",
  description: "테스트용 프로젝트",
  version: "0.1.0",
  status: "active",
  createdAt: "2025-12-14T00:00:00Z",
  updatedAt: "2025-12-14T00:00:00Z"
}
```

### 4.3 Mock 팀 데이터 (team.json)

```
파일: .jjiban-test/projects/project/team.json

내용 (개념):
{
  version: "1.0",
  members: [
    { id: "developer-1", name: "홍길동", role: "Developer" },
    { id: "pm-1", name: "김철수", role: "PM" }
  ]
}
```

### 4.4 프로젝트 생성 요청 데이터

| 데이터 ID | 용도 | 필드값 |
|----------|------|--------|
| CREATE-VALID-01 | 정상 생성 (최소) | id: "new-project", name: "New Project" |
| CREATE-VALID-02 | 정상 생성 (전체) | id: "full-project", name: "Full", description: "설명", wbsDepth: 3 |
| CREATE-INVALID-01 | 잘못된 ID | id: "Invalid_ID", name: "Test" |
| CREATE-INVALID-02 | 중복 ID | id: "project", name: "Duplicate" |
| CREATE-INVALID-03 | 잘못된 wbsDepth | id: "test", name: "Test", wbsDepth: 5 |

---

## 5. data-testid 목록

> 본 Task는 백엔드 API이므로 data-testid 적용 대상 없음

| 요소 | data-testid | 용도 |
|------|-------------|------|
| - | - | 해당 없음 (API 테스트) |

---

## 6. 테스트 실행 명령어

### 6.1 단위 테스트

```
# 전체 단위 테스트 실행
npm run test -- --filter="projectService"

# 특정 테스트 파일 실행
npm run test -- server/utils/projectService.test.ts

# 커버리지 포함 실행
npm run test:coverage -- --filter="projectService"
```

### 6.2 E2E 테스트

```
# 전체 E2E 테스트 실행
npm run test:e2e -- --grep="Project API"

# 특정 시나리오 실행
npm run test:e2e -- tests/api/projects.spec.ts
```

---

## 7. 테스트 체크리스트

### 단위 테스트
- [ ] UT-001: getProjects() 테스트 (3개 시나리오)
- [ ] UT-002: getProjectById() 테스트 (3개 시나리오)
- [ ] UT-003: createProject() 테스트 (3개 시나리오)
- [ ] UT-004: validateProjectId() 테스트 (6개 시나리오)
- [ ] UT-005: checkDuplicateId() 테스트 (2개 시나리오)
- [ ] UT-006: validateWbsDepth() 테스트 (5개 시나리오)
- [ ] UT-007: 초기 상태 값 테스트 (2개 시나리오)

### E2E 테스트
- [ ] E2E-001: GET /api/projects 테스트 (2개 시나리오)
- [ ] E2E-002: GET /api/projects/:id 테스트 (2개 시나리오)
- [ ] E2E-003: POST /api/projects 테스트 (3개 시나리오)
- [ ] E2E-004~007: 에러 케이스 테스트 (6개 시나리오)

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
