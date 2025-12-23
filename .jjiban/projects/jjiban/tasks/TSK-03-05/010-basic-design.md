# TSK-03-05: WBS 테스트 결과 업데이트 API - 기본설계

## 1. 개요

### 1.1 목적
- WBS Task의 test-result 속성을 업데이트하는 REST API 제공
- `/wf:test`, `/wf:verify` 워크플로우 명령 완료 시 자동으로 test-result를 업데이트하여 테스트 결과를 추적

### 1.2 범위
- **포함**:
  - PUT /api/projects/:id/wbs/tasks/:taskId/test-result 엔드포인트 구현
  - wbs.md 파일의 test-result 속성 업데이트
  - 입력 검증 (프로젝트 ID, Task ID, test-result 값)
  - 백업 및 롤백 메커니즘
  - 표준 에러 처리

- **제외**:
  - 워크플로우 명령과의 연동 (TSK-03-04에서 처리)
  - 테스트 결과 이력 조회 API
  - 테스트 자동 실행 기능

### 1.3 관련 Task
- **선행 Task**:
  - TSK-03-02: WBS Tree API (GET/PUT) - WBS 파일 읽기/쓰기 기반
  - TSK-02-02-01: WBS Parser - wbs.md 파싱 기능 활용
  - TSK-02-02-02: WBS Serializer - WBS 트리를 wbs.md로 저장

- **후속 Task**:
  - TSK-03-04: 워크플로우 엔진 - `/wf:test`, `/wf:verify` 명령에서 본 API 호출

---

## 2. 요구사항 분석

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 |
|---|---|---|
| FR-001 | PUT /api/projects/:id/wbs/tasks/:taskId/test-result 엔드포인트 제공 | Critical |
| FR-002 | wbs.md 파일에서 특정 Task 노드 탐색 | Critical |
| FR-003 | Task 노드의 test-result 속성 업데이트 | Critical |
| FR-004 | 업데이트된 WBS 트리를 wbs.md 파일에 저장 | Critical |
| FR-005 | 파일 업데이트 시 백업 생성 및 실패 시 롤백 | High |

### 2.2 비기능 요구사항 (NFR)

| ID | 요구사항 | 기준 |
|---|---|---|
| NFR-001 | API 응답 시간 | < 500ms (일반적인 WBS 파일 크기) |
| NFR-002 | 파일 안정성 | 백업 생성 후 업데이트, 실패 시 롤백 |
| NFR-003 | 동시성 | 단일 프로젝트 내 순차 처리 (파일 기반 특성) |
| NFR-004 | 보안 | 경로 순회 공격 방지 (projectId 검증) |

### 2.3 제약사항

- **파일 기반**: wbs.md 파일 직접 수정 (데이터베이스 미사용)
- **단일 소스**: wbs.md가 유일한 소스, 캐시나 별도 인덱스 없음
- **순차 처리**: 동일 프로젝트에 대한 동시 쓰기 시 파일 경쟁 가능
- **파일 크기**: 대규모 프로젝트의 경우 wbs.md 파싱/직렬화 시간 증가

---

## 3. API 명세

### 3.1 엔드포인트

```
PUT /api/projects/:id/wbs/tasks/:taskId/test-result
```

### 3.2 요청 (Request)

#### URL Parameters
- `id` (string, required): 프로젝트 ID
  - 형식: 소문자 알파벳으로 시작, 소문자 알파벳/숫자/하이픈만 허용 (최대 50자)
  - 예: `jjiban`, `my-project-1`

- `taskId` (string, required): Task ID
  - 형식: `TSK-XX-XX` 또는 `TSK-XX-XX-XX` (XX는 최소 2자리 숫자)
  - 예: `TSK-03-05`, `TSK-02-01-03`

#### Request Body (JSON)
```json
{
  "testResult": "pass"
}
```

| 필드 | 타입 | 필수 | 설명 | 유효값 |
|-----|------|------|------|--------|
| testResult | string | O | 테스트 결과 | `none`, `pass`, `fail` |

#### 테스트 결과 값 설명
- `none`: 테스트 결과 없음 (기본값)
- `pass`: 테스트 통과
- `fail`: 테스트 실패

### 3.3 응답 (Response)

#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "testResult": "pass",
  "updated": "2026-01-13"
}
```

| 필드 | 타입 | 설명 |
|-----|------|------|
| success | boolean | 업데이트 성공 여부 (항상 true) |
| testResult | string | 업데이트된 테스트 결과 값 |
| updated | string | WBS 메타데이터의 updated 날짜 (YYYY-MM-DD) |

#### 에러 응답

**400 Bad Request** - 입력 값 오류
```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_TEST_RESULT",
  "message": "test-result 값은 none, pass, fail 중 하나여야 합니다",
  "data": {
    "timestamp": "2026-01-13T10:30:00.000Z"
  }
}
```

**404 Not Found** - 프로젝트 또는 Task 미존재
```json
{
  "statusCode": 404,
  "statusMessage": "TASK_NOT_FOUND",
  "message": "Task를 찾을 수 없습니다: TSK-03-05",
  "data": {
    "timestamp": "2026-01-13T10:30:00.000Z"
  }
}
```

**500 Internal Server Error** - 서버 오류
```json
{
  "statusCode": 500,
  "statusMessage": "BACKUP_FAILED",
  "message": "백업 생성에 실패했습니다: ...",
  "data": {
    "timestamp": "2026-01-13T10:30:00.000Z"
  }
}
```

### 3.4 에러 코드 정의

| HTTP 상태 | 에러 코드 | 설명 | 복구 가능 |
|-----------|----------|------|----------|
| 400 | INVALID_REQUEST | 프로젝트 ID 또는 Task ID 누락 | X |
| 400 | INVALID_PROJECT_ID | 프로젝트 ID 형식 오류 | X |
| 400 | INVALID_TASK_ID | Task ID 형식 오류 | X |
| 400 | INVALID_REQUEST_BODY | 요청 본문 누락 또는 형식 오류 | X |
| 400 | INVALID_TEST_RESULT | test-result 값이 유효하지 않음 | X |
| 404 | PROJECT_NOT_FOUND | 프로젝트 미존재 | X |
| 404 | TASK_NOT_FOUND | Task 미존재 | X |
| 500 | FILE_ACCESS_ERROR | WBS 파일 읽기 오류 | O |
| 500 | PARSE_ERROR | WBS 파일 파싱 오류 | X |
| 500 | BACKUP_FAILED | 백업 생성 실패 | O |
| 500 | SERIALIZATION_ERROR | WBS 트리 직렬화 오류 | X |
| 500 | FILE_WRITE_ERROR | WBS 파일 쓰기 오류 | O |
| 500 | ROLLBACK_FAILED | 롤백 실패 (치명적) | X |

---

## 4. 비즈니스 규칙 (BR)

### BR-001: Task ID 형식
- Task ID는 `TSK-XX-XX` (3단계) 또는 `TSK-XX-XX-XX` (4단계) 형식
- 각 세그먼트는 최소 2자리 숫자
- 예: `TSK-03-05`, `TSK-02-01-03`

### BR-002: test-result 값
- 유효한 값: `none`, `pass`, `fail`
- 대소문자 구분 (소문자만 허용)
- 기본값: `none` (test-result 속성이 없는 경우)

### BR-003: Task 존재 여부
- WBS 트리에서 Task ID와 type='task'가 모두 일치해야 함
- WP, ACT 노드는 test-result 업데이트 불가

### BR-004: 백업 및 롤백
- 파일 업데이트 전 반드시 백업 생성 (wbs.md.bak)
- 백업 생성 실패 시 업데이트 중단
- 파일 쓰기 실패 시 백업에서 복원
- 롤백 실패 시 치명적 에러 (ROLLBACK_FAILED)

### BR-005: 메타데이터 업데이트
- WBS 파일 저장 시 `updated` 필드를 현재 날짜로 자동 갱신
- serializeWbs 함수에 `{ updateDate: true }` 옵션 전달

---

## 5. 처리 흐름

### 5.1 전체 흐름도

```
[Client]
   |
   | PUT /api/projects/:id/wbs/tasks/:taskId/test-result
   | Body: { testResult: "pass" }
   v
[API Handler]
   |
   |--> 1. 파라미터 추출 (projectId, taskId)
   |--> 2. 입력 검증
   |      - validateProjectId(projectId)
   |      - validateTaskId(taskId)
   |      - validateTestResult(testResult)
   |
   |--> 3. 프로젝트 존재 확인
   |      - getProjectPath(projectId)
   |      - fileExists(projectPath)
   |
   |--> 4. WBS 파일 읽기
   |      - getWbsPath(projectId)
   |      - readMarkdownFile(wbsPath)
   |
   |--> 5. WBS 파싱
   |      - parseMetadata(markdown) --> WbsMetadata
   |      - parseWbsMarkdown(markdown) --> WbsNode[]
   |
   |--> 6. Task 노드 탐색
   |      - findTaskInTree(tree, taskId) --> WbsNode | null
   |      - Task 미존재 시 404 TASK_NOT_FOUND
   |
   |--> 7. test-result 업데이트
   |      - taskNode.attributes['test-result'] = testResult
   |
   |--> 8. 백업 생성
   |      - fs.copyFile(wbsPath, wbsPath + '.bak')
   |      - 실패 시 500 BACKUP_FAILED
   |
   |--> 9. WBS 직렬화
   |      - serializeWbs(tree, metadata, { updateDate: true }) --> string
   |
   |--> 10. 파일 쓰기
   |      - writeMarkdownFile(wbsPath, updatedMarkdown)
   |      - 실패 시 백업에서 롤백
   |
   |--> 11. 백업 파일 삭제
   |      - fs.unlink(backupPath) (실패 무시)
   |
   |--> 12. 성공 응답
   |      { success: true, testResult: "pass", updated: "2026-01-13" }
   v
[Client]
```

### 5.2 에러 처리 흐름

```
[입력 검증 단계]
   |
   |--> projectId/taskId 누락? --> 400 INVALID_REQUEST
   |--> projectId 형식 오류? --> 400 INVALID_PROJECT_ID
   |--> taskId 형식 오류? --> 400 INVALID_TASK_ID
   |--> body 누락/형식 오류? --> 400 INVALID_REQUEST_BODY
   |--> testResult 값 오류? --> 400 INVALID_TEST_RESULT
   |
[파일 접근 단계]
   |
   |--> 프로젝트 미존재? --> 404 PROJECT_NOT_FOUND
   |--> WBS 파일 미존재? --> 404 PROJECT_NOT_FOUND
   |--> WBS 파일 읽기 실패? --> 500 FILE_ACCESS_ERROR
   |
[파싱 단계]
   |
   |--> WBS 파싱 실패? --> 500 PARSE_ERROR
   |--> Task 미존재? --> 404 TASK_NOT_FOUND
   |
[백업 단계]
   |
   |--> 백업 생성 실패? --> 500 BACKUP_FAILED (업데이트 중단)
   |
[저장 단계]
   |
   |--> 직렬화 실패? --> 500 SERIALIZATION_ERROR
   |--> 파일 쓰기 실패? --> 롤백 시도
   |      |
   |      |--> 롤백 성공? --> 500 FILE_WRITE_ERROR
   |      |--> 롤백 실패? --> 500 ROLLBACK_FAILED (치명적)
```

---

## 6. 데이터 모델

### 6.1 WbsNode 확장

```typescript
export interface WbsNode {
  id: string;
  type: WbsNodeType;
  title: string;
  status?: string;
  category?: TaskCategory;
  priority?: Priority;
  assignee?: string;
  schedule?: ScheduleRange;
  tags?: string[];
  depends?: string;
  requirements?: string[];
  ref?: string;
  progress?: number;
  taskCount?: number;
  children: WbsNode[];
  expanded?: boolean;
  attributes?: Record<string, string>;  // test-result는 여기에 저장
}
```

### 6.2 test-result 속성

- **저장 위치**: `WbsNode.attributes['test-result']`
- **타입**: `string | undefined`
- **유효값**: `'none'`, `'pass'`, `'fail'`, `undefined`

### 6.3 wbs.md 표현 예시

```markdown
### TSK-03-05: WBS 테스트 결과 업데이트 API
- category: development
- domain: backend
- status: [im]
- priority: medium
- assignee: -
- schedule: 2026-01-10 ~ 2026-01-13
- tags: api, wbs, test-result
- depends: TSK-03-02, TSK-02-02-01, TSK-02-02-02
- test-result: pass
- requirements:
  - PUT /api/projects/:id/wbs/tasks/:taskId/test-result - 테스트 결과 업데이트 API
  - wbs.md 파일의 test-result 필드 자동 업데이트
  - 테스트 결과 값: none (결과없음), pass (정상), fail (오류)
- ref: WBS test-result 속성
```

---

## 7. 보안 고려사항

### 7.1 경로 순회 공격 방지

- **위협**: 악의적인 projectId로 시스템 파일 접근 시도
  - 예: `../../etc/passwd`, `..\windows\system32`

- **대책**:
  - projectId에 `..`, `/`, `\` 포함 여부 검사
  - 정규식 검증: `^[a-z][a-z0-9-]{0,49}$`
  - `getProjectPath()`, `getWbsPath()` 함수에서 경로 정규화

### 7.2 파일 쓰기 권한

- **위협**: 프로세스가 wbs.md 파일에 쓰기 권한이 없는 경우

- **대책**:
  - 파일 쓰기 실패 시 500 FILE_WRITE_ERROR 응답
  - 백업에서 롤백 시도
  - 배포 시 jjiban 프로세스의 파일 권한 확인

### 7.3 입력 검증

- **위협**: 악의적인 testResult 값으로 wbs.md 파일 손상

- **대책**:
  - testResult 값을 화이트리스트 검증 (`none`, `pass`, `fail`)
  - Task ID 형식 엄격 검증 (정규식)
  - 요청 본문 타입 검증

### 7.4 백업 및 롤백

- **위협**: 파일 업데이트 중 오류 발생 시 데이터 손실

- **대책**:
  - 업데이트 전 반드시 백업 생성 (wbs.md.bak)
  - 백업 생성 실패 시 업데이트 중단
  - 파일 쓰기 실패 시 백업에서 자동 복원
  - 롤백 실패 시 ROLLBACK_FAILED 에러 로깅

---

## 8. 에러 처리 전략

### 8.1 입력 검증 에러 (4xx)

- **원칙**: 클라이언트 오류로 간주, 재시도 불필요
- **처리**:
  - 명확한 에러 메시지 제공
  - 에러 코드로 원인 특정 가능
  - HTTP 상태 코드: 400 (Bad Request), 404 (Not Found)

### 8.2 서버 에러 (5xx)

- **원칙**: 시스템 오류로 간주, 재시도 가능한 경우와 불가능한 경우 구분
- **처리**:
  - 복구 가능 에러 (FILE_ACCESS_ERROR, FILE_WRITE_ERROR): 재시도 유도
  - 치명적 에러 (ROLLBACK_FAILED, PARSE_ERROR): 시스템 관리자 개입 필요
  - 에러 로깅 (파일 경로, 에러 메시지, 스택 트레이스)

### 8.3 백업 실패

- **시나리오**: 디스크 용량 부족, 권한 문제
- **처리**:
  - 즉시 업데이트 중단 (BACKUP_FAILED)
  - 원본 파일 보호 우선
  - 에러 메시지에 원인 포함

### 8.4 롤백 실패

- **시나리오**: 백업 파일 손상, 파일 시스템 오류
- **처리**:
  - ROLLBACK_FAILED 치명적 에러 발생
  - 시스템 관리자에게 알림 (향후 모니터링 연동)
  - 수동 복구 필요 (백업 파일에서 수동 복원)

---

## 9. 성능 고려사항

### 9.1 병목 지점

| 단계 | 예상 시간 | 비고 |
|-----|----------|------|
| 파일 읽기 | 10-50ms | 파일 크기에 비례 |
| WBS 파싱 | 50-200ms | 노드 수에 비례 |
| 트리 탐색 | 10-50ms | 트리 깊이와 노드 수에 비례 |
| 직렬화 | 50-200ms | 노드 수에 비례 |
| 백업 생성 | 10-50ms | 파일 크기에 비례 |
| 파일 쓰기 | 10-50ms | 파일 크기에 비례 |
| **합계** | **140-600ms** | 일반적인 프로젝트 기준 |

### 9.2 최적화 전략

- **현재 구현**:
  - 전체 WBS 트리를 파싱하여 메모리에 로드
  - 특정 Task 노드만 업데이트 후 전체 트리 재직렬화
  - 파일 전체를 다시 쓰기

- **향후 개선 (필요 시)**:
  - 부분 업데이트: 특정 Task 라인만 찾아서 수정 (복잡도 증가)
  - 캐싱: WBS 트리를 메모리에 캐싱 (동시성 문제 발생 가능)
  - 인덱싱: Task ID → 파일 라인 매핑 테이블 (별도 유지보수 필요)

- **결론**: 현재는 단순성과 안정성을 우선, 성능 이슈 발생 시 최적화 검토

### 9.3 대규모 프로젝트 대응

- **상황**: 수백 개의 Task를 포함한 대규모 프로젝트
- **예상 영향**:
  - 파싱 시간 증가 (O(n) 복잡도)
  - 트리 탐색 시간 증가 (최악의 경우 O(n))
  - 직렬화 시간 증가 (O(n) 복잡도)

- **임계점**: 1000개 이상의 노드에서 응답 시간 1초 초과 예상
- **대책**:
  - 초기에는 단순 구현 유지
  - 성능 이슈 발생 시 프로파일링 후 최적화
  - 최악의 경우 wbs.md 파일 분리 (WP 단위)

---

## 10. 기존 코드 활용

### 10.1 재사용 가능한 유틸리티

| 모듈 | 경로 | 사용 목적 |
|------|------|----------|
| parseWbsMarkdown | server/utils/wbs/parser/index.ts | wbs.md 파싱 |
| serializeWbs | server/utils/wbs/serializer.ts | WBS 트리 직렬화 |
| readMarkdownFile | server/utils/file.ts | wbs.md 읽기 |
| writeMarkdownFile | server/utils/file.ts | wbs.md 쓰기 |
| fileExists | server/utils/file.ts | 파일 존재 확인 |
| getWbsPath | server/utils/file.ts | wbs.md 경로 생성 |
| getProjectPath | server/utils/file.ts | 프로젝트 경로 생성 |
| createBadRequestError | server/utils/errors/standardError.ts | 400 에러 생성 |
| createNotFoundError | server/utils/errors/standardError.ts | 404 에러 생성 |
| createInternalError | server/utils/errors/standardError.ts | 500 에러 생성 |

### 10.2 참고 구현

- **TSK-03-02** (`server/api/projects/[id]/wbs.get.ts`, `wbs.put.ts`):
  - WBS 파일 읽기/쓰기 패턴
  - 메타데이터 파싱
  - 입력 검증

- **TSK-02-02-01** (`server/utils/wbs/parser/index.ts`):
  - parseWbsMarkdown 함수 사용법
  - FlatNode → WbsNode 트리 변환

- **TSK-02-02-02** (`server/utils/wbs/serializer.ts`):
  - serializeWbs 함수 사용법
  - 메타데이터 업데이트 옵션

---

## 11. 테스트 전략

### 11.1 단위 테스트

- **validateProjectId()**:
  - 유효한 프로젝트 ID: `jjiban`, `my-project-1`
  - 무효한 프로젝트 ID: `../etc`, `Project1` (대문자), `a` (1자)

- **validateTaskId()**:
  - 유효한 Task ID: `TSK-03-05`, `TSK-02-01-03`
  - 무효한 Task ID: `TSK-3-5` (1자리 숫자), `TASK-03-05`

- **validateTestResult()**:
  - 유효한 값: `none`, `pass`, `fail`
  - 무효한 값: `None`, `PASS`, `passed`, `error`

- **findTaskInTree()**:
  - Task가 트리 최상위에 있는 경우
  - Task가 깊은 계층에 있는 경우
  - Task ID는 일치하지만 type이 'wp'인 경우 (미일치)
  - Task가 존재하지 않는 경우

### 11.2 통합 테스트

- **정상 시나리오**:
  - 유효한 요청으로 test-result 업데이트 성공
  - 응답에 updated 날짜가 현재 날짜로 갱신되었는지 확인
  - wbs.md 파일에 test-result 값이 반영되었는지 확인

- **에러 시나리오**:
  - 프로젝트가 존재하지 않는 경우 (404 PROJECT_NOT_FOUND)
  - Task가 존재하지 않는 경우 (404 TASK_NOT_FOUND)
  - test-result 값이 유효하지 않은 경우 (400 INVALID_TEST_RESULT)
  - 백업 생성 실패 시 업데이트가 중단되는지 확인
  - 파일 쓰기 실패 시 롤백이 수행되는지 확인

### 11.3 E2E 테스트

- **시나리오 1**: 워크플로우 명령과 통합
  - `/wf:test` 명령 실행 → test-result가 `pass` 또는 `fail`로 업데이트
  - `/wf:verify` 명령 실행 → 상태 전이와 함께 test-result 업데이트 확인

- **시나리오 2**: 테스트 결과 표시
  - WBS Tree View에서 Task 노드에 test-result 아이콘 표시
  - Kanban Board에서 test-result 필터링

---

## 12. 배포 고려사항

### 12.1 환경 변수

- 별도 환경 변수 불필요 (파일 경로는 유틸리티 함수에서 처리)

### 12.2 파일 권한

- jjiban 프로세스가 `.jjiban/projects/{projectId}/wbs.md` 파일에 대한 읽기/쓰기 권한 필요
- 백업 파일 (`wbs.md.bak`) 생성 권한 필요

### 12.3 디스크 용량

- 백업 파일로 인해 wbs.md 파일 크기의 2배 용량 필요
- 백업 파일은 업데이트 성공 후 자동 삭제

### 12.4 로깅

- 치명적 에러 (ROLLBACK_FAILED) 발생 시 로그 기록
- 백업 실패 (BACKUP_FAILED) 발생 시 로그 기록
- 향후 모니터링 시스템 연동 고려

---

## 13. 향후 개선 사항

### 13.1 테스트 결과 이력 조회

- **요구사항**: test-result 변경 이력을 조회하는 API
- **API**: `GET /api/projects/:id/wbs/tasks/:taskId/test-result/history`
- **저장 위치**: `.jjiban/projects/{projectId}/tasks/{taskId}/test-result-history.json`

### 13.2 자동 테스트 실행

- **요구사항**: `/wf:test` 명령 시 자동으로 테스트 스크립트 실행
- **연동**: package.json의 test 스크립트 또는 Task별 테스트 명령
- **결과 반영**: 테스트 성공/실패 여부를 자동으로 test-result에 업데이트

### 13.3 통합 테스트 결과 집계

- **요구사항**: WP 또는 ACT 레벨에서 하위 Task들의 test-result 집계
- **표시**: `pass: 5, fail: 2, none: 3` 형태로 표시
- **필터링**: Kanban Board에서 test-result로 Task 필터링

### 13.4 알림 기능

- **요구사항**: test-result가 `fail`로 변경되면 담당자에게 알림
- **연동**: 이메일, Slack, 또는 jjiban 내부 알림 시스템

---

## 14. 의사결정 기록

### 14.1 test-result 저장 위치

- **선택**: `WbsNode.attributes['test-result']`
- **대안**: WbsNode에 `testResult` 필드 직접 추가
- **이유**:
  - WbsNode 인터페이스를 최소한으로 확장
  - 향후 커스텀 속성 추가 시 유연성 확보
  - wbs.md 파일에서 일반 속성과 동일한 형태로 표현 가능

### 14.2 백업 전략

- **선택**: 업데이트 전 매번 백업 생성 (wbs.md.bak)
- **대안**: 백업 없이 직접 업데이트 / Git 기반 백업
- **이유**:
  - 파일 손상 시 즉시 복구 가능
  - 사용자가 Git을 사용하지 않을 수 있음
  - 백업 파일 생성 비용이 낮음 (50ms 이내)

### 14.3 롤백 실패 처리

- **선택**: ROLLBACK_FAILED 치명적 에러 발생, 수동 복구 필요
- **대안**: 무시하고 성공 응답 / 에러 로깅만 수행
- **이유**:
  - 데이터 무결성 최우선
  - 롤백 실패는 시스템 오류로 간주
  - 클라이언트에게 명확한 실패 시그널 전달

### 14.4 test-result 값

- **선택**: `none`, `pass`, `fail`
- **대안**: `pending`, `success`, `failure` / `0`, `1`, `-1`
- **이유**:
  - 단순하고 직관적
  - wbs.md 파일에서 가독성 확보
  - 향후 확장 가능 (`skip`, `partial` 등)

---

## 15. 참고 자료

- **PRD**: `.jjiban/docs/PRD.md` - WBS 속성 정의
- **TSK-03-02**: WBS Tree API - 기본 파일 읽기/쓰기 패턴
- **TSK-02-02-01**: WBS Parser - parseWbsMarkdown 함수
- **TSK-02-02-02**: WBS Serializer - serializeWbs 함수
- **TSK-03-04**: 워크플로우 엔진 - 본 API와의 연동 방식

---

## 16. 작성 정보

- **작성자**: Claude (Opus 4.5)
- **작성일**: 2026-01-13
- **Task ID**: TSK-03-05
- **문서 버전**: 1.0
- **다음 단계**: 상세설계 문서 작성 (`020-detail-design.md`)
