# 사용자 매뉴얼: WBS API

**Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 1. 개요

WBS API는 jjiban 시스템에서 WBS(Work Breakdown Structure) 트리와 Task를 관리하기 위한 REST API입니다.

### 1.1 기능 요약

| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| WBS 트리 조회 | `GET /api/projects/:id/wbs` | 프로젝트의 WBS 트리 반환 |
| WBS 트리 저장 | `PUT /api/projects/:id/wbs` | WBS 트리 저장 (백업/롤백 지원) |
| Task 상세 조회 | `GET /api/tasks/:id` | Task 상세 정보 + 문서 목록 |
| Task 수정 | `PUT /api/tasks/:id` | Task 정보 수정 (이력 자동 기록) |

---

## 2. API 사용법

### 2.1 WBS 트리 조회

**요청:**
```http
GET /api/projects/:id/wbs
```

**응답 (200):**
```json
{
  "metadata": {
    "version": "1.0",
    "depth": 4,
    "updated": "2025-12-14"
  },
  "tree": [
    {
      "id": "WP-01",
      "type": "wp",
      "title": "Platform Infrastructure",
      "status": "in_progress",
      "progress": 75,
      "children": [...]
    }
  ],
  "progress": 45
}
```

---

### 2.2 WBS 트리 저장

**요청:**
```http
PUT /api/projects/:id/wbs
Content-Type: application/json

{
  "metadata": { "version": "1.0", "depth": 4 },
  "tree": [...]
}
```

**응답 (200):**
```json
{
  "success": true,
  "updated": "2025-12-14T10:00:00.000Z"
}
```

**에러 응답:**
| 코드 | 에러 | 설명 |
|------|------|------|
| 400 | INVALID_METADATA | metadata 누락/형식 오류 |
| 400 | INVALID_TREE | tree가 배열이 아님 |
| 400 | VALIDATION_ERROR | WBS 유효성 검증 실패 |
| 404 | PROJECT_NOT_FOUND | 프로젝트 없음 |
| 409 | CONFLICT | 동시 수정 충돌 |

---

### 2.3 Task 상세 조회

**요청:**
```http
GET /api/tasks/:id
```

**응답 (200):**
```json
{
  "task": {
    "id": "TSK-01-01-01",
    "type": "tsk",
    "title": "프로젝트 초기화",
    "category": "development",
    "status": "implement",
    "statusCode": "[im]",
    "priority": "high",
    "assignee": "hong",
    "schedule": { "start": "2025-12-13", "end": "2025-12-15" },
    "depends": ["TSK-01-01-02"],
    "tags": ["setup", "init"]
  },
  "projectId": "jjiban",
  "parentWp": { "id": "WP-01", "title": "Platform" },
  "parentAct": { "id": "ACT-01-01", "title": "Setup" },
  "documents": [
    { "name": "010-basic-design.md", "exists": true },
    { "name": "020-detail-design.md", "exists": false }
  ],
  "history": [
    { "field": "status", "from": "[bd]", "to": "[dd]", "at": "2025-12-14T10:00:00Z" }
  ]
}
```

---

### 2.4 Task 수정

**요청:**
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "implement",
  "statusCode": "[im]",
  "assignee": "kim",
  "priority": "critical"
}
```

**수정 가능 필드:**
- `title`, `category`, `status`, `statusCode`
- `priority`, `assignee`, `schedule`
- `depends`, `tags`, `requirements`

**응답 (200):**
```json
{
  "success": true,
  "task": { ... },
  "history": { "field": "status", "from": "[dd]", "to": "[im]", "at": "..." }
}
```

---

## 3. 비즈니스 규칙

| 규칙 | 설명 |
|------|------|
| BR-001 | Task에는 category, status, priority 필수 |
| BR-002 | Task ID는 WBS 내에서 고유 |
| BR-003 | 진행률은 하위 Task 기반 자동 계산 |
| BR-004 | 저장 실패 시 백업(.bak)에서 자동 복구 |
| BR-005 | Task 수정 시 history.json에 이력 기록 |
| BR-006 | 저장 시 updated 필드 자동 갱신 |

---

## 4. 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_PROJECT_ID | 400 | 프로젝트 ID 오류 |
| INVALID_METADATA | 400 | metadata 형식 오류 |
| INVALID_TREE | 400 | tree 형식 오류 |
| VALIDATION_ERROR | 400 | WBS 유효성 오류 |
| PROJECT_NOT_FOUND | 404 | 프로젝트 없음 |
| TASK_NOT_FOUND | 404 | Task 없음 |
| WBS_NOT_FOUND | 404 | wbs.md 없음 |
| CONFLICT | 409 | 동시 수정 충돌 |

---

## 5. 사용 예시

### cURL

```bash
# WBS 조회
curl http://localhost:3000/api/projects/jjiban/wbs

# Task 조회
curl http://localhost:3000/api/tasks/TSK-01-01-01

# Task 수정
curl -X PUT http://localhost:3000/api/tasks/TSK-01-01-01 \
  -H "Content-Type: application/json" \
  -d '{"status": "implement", "statusCode": "[im]"}'
```

### JavaScript

```typescript
// WBS 트리 조회
const wbs = await $fetch(`/api/projects/${projectId}/wbs`);
console.log(wbs.tree);

// Task 수정
const result = await $fetch(`/api/tasks/${taskId}`, {
  method: 'PUT',
  body: { status: 'implement', statusCode: '[im]' }
});
```

---

## 6. 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 구현 문서: `030-implementation.md`
- 통합 테스트: `070-integration-test.md`

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0.0 | 2025-12-14 | 최초 작성 |
