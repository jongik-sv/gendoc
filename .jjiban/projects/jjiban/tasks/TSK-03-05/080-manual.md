# 사용자 매뉴얼 (080-manual.md)

**Task ID:** TSK-03-05
**Task명:** WBS 테스트 결과 업데이트 API
**Category:** development
**상태:** [xx] 완료
**작성일:** 2025-12-15

---

## 1. 개요

TSK-03-05는 WBS Task의 테스트 결과(test-result)를 업데이트하는 API를 구현합니다.
- `/wf:test`, `/wf:verify` 완료 시 자동 호출
- wbs.md 파일의 test-result 필드 자동 업데이트

---

## 2. API 명세

### 2.1 엔드포인트

```
PUT /api/projects/:id/wbs/tasks/:taskId/test-result
```

### 2.2 요청

**Path Parameters:**
| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| id | string | 프로젝트 ID | `jjiban` |
| taskId | string | Task ID | `TSK-03-05` |

**Request Body:**
```json
{
  "testResult": "none" | "pass" | "fail"
}
```

| 값 | 설명 |
|----|------|
| `none` | 테스트 결과 없음 (초기값) |
| `pass` | 테스트 통과 |
| `fail` | 테스트 실패 |

### 2.3 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "testResult": "pass",
  "updated": "2025-12-15"
}
```

**에러 응답:**
| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | INVALID_PROJECT_ID | 프로젝트 ID 형식 오류 |
| 400 | INVALID_TASK_ID | Task ID 형식 오류 |
| 400 | INVALID_REQUEST_BODY | 요청 본문 없음 |
| 400 | INVALID_TEST_RESULT | test-result 값 오류 |
| 404 | PROJECT_NOT_FOUND | 프로젝트 없음 |
| 404 | TASK_NOT_FOUND | Task 없음 |
| 500 | FILE_WRITE_ERROR | 파일 저장 실패 |

---

## 3. 사용 예시

### 3.1 cURL

```bash
# 테스트 통과로 업데이트
curl -X PUT \
  http://localhost:3000/api/projects/jjiban/wbs/tasks/TSK-03-05/test-result \
  -H "Content-Type: application/json" \
  -d '{"testResult": "pass"}'

# 테스트 실패로 업데이트
curl -X PUT \
  http://localhost:3000/api/projects/jjiban/wbs/tasks/TSK-01-01-01/test-result \
  -H "Content-Type: application/json" \
  -d '{"testResult": "fail"}'
```

### 3.2 JavaScript (fetch)

```javascript
const response = await fetch(
  '/api/projects/jjiban/wbs/tasks/TSK-03-05/test-result',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testResult: 'pass' })
  }
);

const data = await response.json();
console.log(data); // { success: true, testResult: 'pass', updated: '2025-12-15' }
```

---

## 4. 워크플로우 통합

### 4.1 자동 호출 시점

| 워크플로우 명령어 | 호출 시점 | test-result 값 |
|------------------|----------|----------------|
| `/wf:test` | TDD 테스트 완료 후 | `pass` 또는 `fail` |
| `/wf:verify` | 통합테스트 완료 후 | `pass` 또는 `fail` |

### 4.2 wbs.md 자동 업데이트

API 호출 시 wbs.md 파일이 자동으로 업데이트됩니다:

```markdown
### TSK-03-05: WBS 테스트 결과 업데이트 API
- category: development
- status: [xx]
- test-result: pass  ← 자동 업데이트
```

---

## 5. 보안 고려사항

1. **경로 순회 공격 방지**: 프로젝트 ID 검증
2. **입력 검증**: test-result 값 화이트리스트 방식
3. **백업 메커니즘**: 업데이트 전 자동 백업 (.bak)

---

## 6. 성능

| 항목 | 값 |
|------|-----|
| 평균 응답 시간 | 83ms |
| 최대 응답 시간 | 200ms (100노드 WBS) |
| 요구사항 | < 500ms |

---

## 7. 테스트 결과

| 항목 | 결과 |
|------|------|
| 단위 테스트 | 22/22 통과 (100%) |
| 통합 테스트 | 통과 |
| 성능 테스트 | 통과 |

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 설계리뷰: `021-design-review-claude-1(적용완료).md`
- 구현: `030-implementation.md`
- 코드리뷰: `031-code-review-claude-1(적용완료).md`
- 통합테스트: `070-integration-test.md`

---

<!--
author: System Architect
Template Version: 1.0.0
-->
