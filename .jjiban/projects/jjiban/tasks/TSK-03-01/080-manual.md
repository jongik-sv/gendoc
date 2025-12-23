# 사용자 매뉴얼: Project API

**Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 1. 개요

Project API는 jjiban 시스템에서 프로젝트를 관리하기 위한 REST API입니다. 프로젝트 목록 조회, 상세 조회, 생성 기능을 제공합니다.

### 1.1 기능 요약

| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| 프로젝트 목록 조회 | `GET /api/projects` | 모든 프로젝트 목록 반환 |
| 프로젝트 상세 조회 | `GET /api/projects/:id` | 특정 프로젝트 상세 정보 반환 |
| 프로젝트 생성 | `POST /api/projects` | 새 프로젝트 생성 |

---

## 2. API 사용법

### 2.1 프로젝트 목록 조회

**요청:**
```http
GET /api/projects
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | string | N | 필터링할 상태 (active/archived) |

**응답 예시:**
```json
{
  "version": "1.0",
  "projects": [
    {
      "id": "my-project",
      "name": "My Project",
      "path": "my-project",
      "status": "active",
      "wbsDepth": 4,
      "createdAt": "2025-12-14"
    }
  ],
  "defaultProject": "my-project"
}
```

---

### 2.2 프로젝트 상세 조회

**요청:**
```http
GET /api/projects/:id
```

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 프로젝트 ID |

**응답 예시:**
```json
{
  "project": {
    "id": "my-project",
    "name": "My Project",
    "description": "프로젝트 설명",
    "version": "0.1.0",
    "status": "active",
    "createdAt": "2025-12-14T00:00:00Z",
    "updatedAt": "2025-12-14T00:00:00Z"
  },
  "team": {
    "version": "1.0",
    "members": []
  }
}
```

**에러 응답:**
| 상태 코드 | 에러 코드 | 설명 |
|----------|----------|------|
| 404 | PROJECT_NOT_FOUND | 프로젝트를 찾을 수 없음 |

---

### 2.3 프로젝트 생성

**요청:**
```http
POST /api/projects
Content-Type: application/json
```

**요청 본문:**
```json
{
  "id": "new-project",
  "name": "New Project",
  "description": "프로젝트 설명 (선택)",
  "wbsDepth": 4
}
```

**필드 설명:**
| 필드 | 타입 | 필수 | 설명 | 기본값 |
|------|------|------|------|--------|
| id | string | Y | 프로젝트 ID (영소문자, 숫자, 하이픈만) | - |
| name | string | Y | 프로젝트 이름 | - |
| description | string | N | 프로젝트 설명 | "" |
| wbsDepth | number | N | WBS 계층 깊이 (3 또는 4) | 4 |

**응답 예시 (201 Created):**
```json
{
  "project": {
    "id": "new-project",
    "name": "New Project",
    "description": "프로젝트 설명",
    "version": "0.1.0",
    "status": "active",
    "createdAt": "2025-12-14T10:00:00Z",
    "updatedAt": "2025-12-14T10:00:00Z"
  },
  "team": {
    "version": "1.0",
    "members": []
  }
}
```

**에러 응답:**
| 상태 코드 | 에러 코드 | 설명 |
|----------|----------|------|
| 400 | INVALID_PROJECT_ID | 프로젝트 ID 형식 오류 |
| 400 | INVALID_WBS_DEPTH | wbsDepth가 3 또는 4가 아님 |
| 400 | VALIDATION_ERROR | 필수 필드 누락 |
| 409 | DUPLICATE_PROJECT_ID | 이미 존재하는 프로젝트 ID |

---

## 3. 비즈니스 규칙

### 3.1 프로젝트 ID 규칙 (BR-001)

프로젝트 ID는 다음 규칙을 따라야 합니다:
- **영소문자** (a-z)
- **숫자** (0-9)
- **하이픈** (-)

**유효한 예시:**
- `my-project`
- `project-123`
- `jjiban`

**무효한 예시:**
- `MyProject` (대문자 포함)
- `my_project` (언더스코어 포함)
- `my project` (공백 포함)

### 3.2 프로젝트 ID 고유성 (BR-002)

프로젝트 ID는 시스템 내에서 **고유**해야 합니다. 이미 존재하는 ID로 프로젝트를 생성하려고 하면 `409 Conflict` 에러가 발생합니다.

### 3.3 WBS 깊이 (BR-003)

wbsDepth는 **3** 또는 **4**만 허용됩니다:
- **3단계**: Project → WP → TSK (소규모 프로젝트)
- **4단계**: Project → WP → ACT → TSK (대규모 프로젝트)

### 3.4 초기 상태 (BR-004)

새로 생성된 프로젝트의 status는 항상 **"active"**로 설정됩니다.

---

## 4. 생성되는 파일 구조

프로젝트 생성 시 다음 파일/폴더가 자동으로 생성됩니다:

```
.jjiban/
├── settings/
│   └── projects.json     # 프로젝트 목록에 추가
└── projects/
    └── {project-id}/
        ├── project.json  # 프로젝트 메타데이터
        └── team.json     # 팀원 목록 (빈 배열)
```

---

## 5. 에러 처리

### 5.1 표준 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_PROJECT_ID",
  "message": "프로젝트 ID는 영소문자, 숫자, 하이픈만 사용할 수 있습니다",
  "timestamp": "2025-12-14T10:00:00.000Z"
}
```

### 5.2 에러 코드 목록

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| INVALID_PROJECT_ID | 400 | 프로젝트 ID 형식 오류 |
| INVALID_WBS_DEPTH | 400 | wbsDepth 값 오류 |
| VALIDATION_ERROR | 400 | 입력 검증 실패 |
| PROJECT_NOT_FOUND | 404 | 프로젝트 없음 |
| DUPLICATE_PROJECT_ID | 409 | 프로젝트 ID 중복 |
| FILE_READ_ERROR | 500 | 파일 읽기 실패 |
| FILE_WRITE_ERROR | 500 | 파일 쓰기 실패 |

---

## 6. 사용 예시

### 6.1 cURL 예시

**프로젝트 목록 조회:**
```bash
curl http://localhost:3000/api/projects
```

**특정 프로젝트 조회:**
```bash
curl http://localhost:3000/api/projects/my-project
```

**프로젝트 생성:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"id": "new-project", "name": "New Project", "wbsDepth": 4}'
```

### 6.2 JavaScript/TypeScript 예시

```typescript
// 프로젝트 목록 조회
const response = await fetch('/api/projects');
const data = await response.json();
console.log(data.projects);

// 프로젝트 생성
const createResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'new-project',
    name: 'New Project',
    description: '프로젝트 설명',
    wbsDepth: 4
  })
});

if (createResponse.ok) {
  const created = await createResponse.json();
  console.log('Created:', created.project.id);
} else {
  const error = await createResponse.json();
  console.error('Error:', error.message);
}
```

---

## 7. 트러블슈팅

### 7.1 자주 발생하는 문제

**Q: 프로젝트 생성 시 409 에러가 발생합니다.**
- A: 이미 동일한 ID의 프로젝트가 존재합니다. 다른 ID를 사용하거나 기존 프로젝트를 삭제하세요.

**Q: 프로젝트 ID 형식 오류가 발생합니다.**
- A: ID는 영소문자, 숫자, 하이픈만 사용할 수 있습니다. 대문자, 공백, 특수문자는 허용되지 않습니다.

**Q: 프로젝트 목록이 비어있습니다.**
- A: `.jjiban/settings/projects.json` 파일이 존재하는지 확인하세요. 파일이 없으면 빈 목록이 반환됩니다.

---

## 8. 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 구현 문서: `030-implementation.md`
- 통합 테스트: `070-integration-test.md`

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-12-14 | 최초 작성 |
