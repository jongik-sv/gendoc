# 사용자 매뉴얼: Workflow API & Settings

**Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 1. 개요

Workflow API는 Task 상태 전이와 문서 관리를 위한 REST API입니다.

### 1.1 기능 요약

| 기능 | 엔드포인트 |
|------|-----------|
| 상태 전이 | `POST /api/tasks/:id/transition` |
| 문서 목록 | `GET /api/tasks/:id/documents` |
| 설정 조회 | `GET /api/settings/:type` |

---

## 2. API 사용법

### 2.1 상태 전이

**요청:**
```http
POST /api/tasks/:id/transition
Content-Type: application/json

{
  "command": "build",
  "comment": "구현 시작"
}
```

**워크플로우 명령어:**
| 카테고리 | 명령어 |
|---------|--------|
| development | start, draft, build, verify, done |
| defect | start, fix, verify, done |
| infrastructure | start, skip, build, done |

**응답 (200):**
```json
{
  "success": true,
  "taskId": "TSK-01-01-01",
  "previousStatus": "[dd]",
  "newStatus": "[im]"
}
```

---

### 2.2 문서 목록 조회

**요청:**
```http
GET /api/tasks/:id/documents
```

**응답:**
```json
{
  "documents": [
    { "name": "010-basic-design.md", "exists": true, "type": "design" },
    { "name": "020-detail-design.md", "exists": false, "type": "design", "stage": "expected" }
  ]
}
```

---

### 2.3 설정 조회

**요청:**
```http
GET /api/settings/:type
```

**지원 타입:**
- `columns`: 칸반 컬럼
- `categories`: 카테고리
- `workflows`: 워크플로우 규칙
- `actions`: 상태 내 액션

---

## 3. 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_TASK_ID | 400 | Task ID 형식 오류 |
| MISSING_COMMAND | 400 | 명령어 누락 |
| TASK_NOT_FOUND | 404 | Task 없음 |
| INVALID_TRANSITION | 409 | 불가능한 전이 |

---

## 4. 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 통합 테스트: `070-integration-test.md`
